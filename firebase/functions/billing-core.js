// Lógica del cobro, sin depender de Firebase ni de Stripe directamente: recibe «stripe» y «db» ya armados.
// Así se puede probar con pruebas de mentira (tests/cobro.test.ts) y el archivo index.js solo los conecta.
//
// Qué guarda en Firestore (solo estas funciones escriben ahí; el programa solo lee lo suyo):
//   customers/{uid}                    { stripeId, email }
//   customers/{uid}/subscription/current { status, priceId, currentPeriodEnd, cancelAtPeriodEnd, eventCreated, updatedAt }

// «past_due» (pago fallido) cuenta: ya hay una suscripción y la tarjeta se arregla desde el portal, no con otro pago nuevo.
export const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

/** Fecha de fin del periodo: Stripe la movió a los renglones de la suscripción en las versiones nuevas de su API. */
export function periodEndOf(sub) {
  const secs = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end ?? null;
  return typeof secs === "number" ? new Date(secs * 1000).toISOString() : null;
}

/** Lo que se guarda de una suscripción de Stripe. */
export function subscriptionDoc(sub, eventCreated) {
  return {
    status: String(sub.status ?? "incomplete"),
    priceId: sub.items?.data?.[0]?.price?.id ?? null,
    currentPeriodEnd: periodEndOf(sub),
    cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
    eventCreated: Number(eventCreated ?? 0),
    updatedAt: new Date().toISOString(),
  };
}

/** Solo se acepta volver a páginas del propio programa (lista de orígenes permitidos). */
export function allowedBaseUrl(baseUrl, allowedOrigins) {
  let url;
  try {
    url = new URL(String(baseUrl));
  } catch {
    return null;
  }
  if (!allowedOrigins.includes(url.origin)) return null;
  return url.origin + url.pathname.replace(/\/+$/, "");
}

export class BillingError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

/**
 * @param {object} deps
 * @param {object} deps.stripe  cliente de Stripe (solo se usan customers, checkout, billingPortal y webhooks)
 * @param {object} deps.db      { get(path), set(path, data), findCustomerUid(stripeId) }
 * @param {object} deps.config  { priceId, taxRateId, allowedOrigins, webhookSecret }
 */
export function makeBilling({ stripe, db, config }) {
  async function customerFor(uid, email) {
    const existing = await db.get(`customers/${uid}`);
    if (existing?.stripeId) return existing.stripeId;
    const customer = await stripe.customers.create({ email: email || undefined, metadata: { uid } });
    await db.set(`customers/${uid}`, { stripeId: customer.id, email: email || null });
    return customer.id;
  }

  return {
    /** Crea la pantalla de pago de Stripe y devuelve su dirección. */
    async createCheckout({ uid, email, baseUrl }) {
      if (!uid) throw new BillingError("unauthenticated", "Necesitas iniciar sesión.");
      const base = allowedBaseUrl(baseUrl, config.allowedOrigins);
      if (!base) throw new BillingError("invalid-argument", "Dirección de retorno no permitida.");
      const current = await db.get(`customers/${uid}/subscription/current`);
      if (current && ACTIVE_STATUSES.has(current.status)) return { alreadyActive: true };
      const customer = await customerFor(uid, email);
      const line = { price: config.priceId, quantity: 1 };
      if (config.taxRateId) line.tax_rates = [config.taxRateId];
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer,
        client_reference_id: uid,
        line_items: [line],
        allow_promotion_codes: true,
        locale: "es",
        success_url: `${base}/app/?pago=ok`,
        cancel_url: `${base}/app/?pago=cancelado`,
        subscription_data: { metadata: { uid } },
      });
      return { url: session.url };
    },

    /** Abre el portal de Stripe: cambiar tarjeta, ver recibos y cancelar. */
    async createPortal({ uid, baseUrl }) {
      if (!uid) throw new BillingError("unauthenticated", "Necesitas iniciar sesión.");
      const base = allowedBaseUrl(baseUrl, config.allowedOrigins);
      if (!base) throw new BillingError("invalid-argument", "Dirección de retorno no permitida.");
      const customer = await db.get(`customers/${uid}`);
      if (!customer?.stripeId) throw new BillingError("failed-precondition", "Todavía no tienes una suscripción.");
      const session = await stripe.billingPortal.sessions.create({ customer: customer.stripeId, return_url: `${base}/account/` });
      return { url: session.url };
    },

    /** Recibe un aviso de Stripe (firmado) y deja el estado de la suscripción en Firestore. */
    async handleWebhook({ rawBody, signature }) {
      let event;
      try {
        event = stripe.webhooks.constructEvent(rawBody, signature, config.webhookSecret);
      } catch (err) {
        throw new BillingError("bad-signature", `Firma inválida: ${err instanceof Error ? err.message : err}`);
      }

      if (event.type === "checkout.session.completed") {
        const s = event.data.object;
        if (s.client_reference_id && s.customer) {
          const prev = (await db.get(`customers/${s.client_reference_id}`)) ?? {};
          await db.set(`customers/${s.client_reference_id}`, { ...prev, stripeId: String(s.customer) });
        }
        return { handled: event.type };
      }

      if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
        const sub = event.data.object;
        const uid = sub.metadata?.uid || (await db.findCustomerUid(String(sub.customer)));
        if (!uid) return { ignored: "sin cuenta asociada" };
        const path = `customers/${uid}/subscription/current`;
        const prev = await db.get(path);
        // un aviso viejo que llega tarde no pisa a uno más nuevo
        if (prev && Number(prev.eventCreated ?? 0) > event.created) return { ignored: "aviso antiguo" };
        const doc = subscriptionDoc(sub, event.created);
        if (event.type === "customer.subscription.deleted") doc.status = "canceled";
        await db.set(path, doc);
        return { handled: event.type, uid, status: doc.status };
      }

      return { ignored: event.type };
    },
  };
}
