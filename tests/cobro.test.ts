// Cobro con Stripe: la lógica de las funciones en la nube, con Stripe y Firestore de mentira.
// La firma de los avisos (webhook) se prueba con la librería real de Stripe, sin internet.

import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
// @ts-expect-error módulo JavaScript de las funciones (sin tipos)
import { ACTIVE_STATUSES, BillingError, allowedBaseUrl, makeBilling, periodEndOf, subscriptionDoc } from "../firebase/functions/billing-core.js";

const config = {
  priceId: "price_490",
  taxRateId: "",
  allowedOrigins: ["http://localhost:4321", "https://software.hilonovamx.com"],
  webhookSecret: "whsec_prueba",
};

function fakeDb(initial: Record<string, Record<string, unknown>> = {}) {
  const docs = new Map(Object.entries(initial));
  return {
    docs,
    async get(path: string) {
      return docs.get(path) ?? null;
    },
    async set(path: string, data: Record<string, unknown>) {
      docs.set(path, data);
    },
    async findCustomerUid(stripeId: string) {
      for (const [path, d] of docs) if (/^customers\/[^/]+$/.test(path) && d.stripeId === stripeId) return path.split("/")[1]!;
      return null;
    },
  };
}

function fakeStripe() {
  const calls: { fn: string; args: unknown }[] = [];
  return {
    calls,
    customers: { create: async (a: unknown) => (calls.push({ fn: "customers.create", args: a }), { id: "cus_1" }) },
    checkout: { sessions: { create: async (a: unknown) => (calls.push({ fn: "checkout", args: a }), { url: "https://checkout.stripe.test/sesion" }) } },
    billingPortal: { sessions: { create: async (a: unknown) => (calls.push({ fn: "portal", args: a }), { url: "https://billing.stripe.test/portal" }) } },
    webhooks: {
      constructEvent: (raw: string) => JSON.parse(raw),
    },
  };
}

const sub = (over: Record<string, unknown> = {}) => ({
  id: "sub_1",
  customer: "cus_1",
  status: "active",
  cancel_at_period_end: false,
  metadata: { uid: "ana" },
  items: { data: [{ price: { id: "price_490" }, current_period_end: 1_800_000_000 }] },
  ...over,
});
const event = (type: string, object: unknown, created = 1000) => JSON.stringify({ id: "evt", type, created, data: { object } });

describe("subscriptionDoc", () => {
  it("toma el estado, el precio y el fin del periodo (también de los renglones, como en la API nueva de Stripe)", () => {
    const d = subscriptionDoc(sub(), 5);
    expect(d.status).toBe("active");
    expect(d.priceId).toBe("price_490");
    expect(d.currentPeriodEnd).toBe(new Date(1_800_000_000 * 1000).toISOString());
    expect(d.cancelAtPeriodEnd).toBe(false);
    expect(d.eventCreated).toBe(5);
  });

  it("también entiende el fin del periodo en la suscripción (API anterior)", () => {
    expect(periodEndOf({ current_period_end: 1_700_000_000, items: { data: [] } })).toBe(new Date(1_700_000_000 * 1000).toISOString());
  });

  it("sin fecha de fin deja null, no rompe", () => {
    expect(periodEndOf({})).toBeNull();
  });

  it("«active», «trialing» y «past_due» cuentan como suscripción existente (no se crea otro cobro)", () => {
    expect([...ACTIVE_STATUSES].sort()).toEqual(["active", "past_due", "trialing"]);
  });
});

describe("allowedBaseUrl", () => {
  it("acepta los orígenes permitidos y quita la diagonal final", () => {
    expect(allowedBaseUrl("http://localhost:4321/", config.allowedOrigins)).toBe("http://localhost:4321");
    expect(allowedBaseUrl("https://software.hilonovamx.com/programa/", config.allowedOrigins)).toBe("https://software.hilonovamx.com/programa");
  });

  it("rechaza otros sitios (para que nadie use el pago para mandar a un tercero)", () => {
    expect(allowedBaseUrl("https://malo.example.com", config.allowedOrigins)).toBeNull();
    expect(allowedBaseUrl("https://software.hilonovamx.com.malo.com", config.allowedOrigins)).toBeNull();
    expect(allowedBaseUrl("no es una dirección", config.allowedOrigins)).toBeNull();
    expect(allowedBaseUrl(undefined, config.allowedOrigins)).toBeNull();
  });
});

describe("crearPago", () => {
  it("crea el cliente en Stripe una sola vez y la pantalla de pago de $490 con campo para código", async () => {
    const db = fakeDb();
    const stripe = fakeStripe();
    const b = makeBilling({ stripe, db, config });
    const r = await b.createCheckout({ uid: "ana", email: "ana@x.mx", baseUrl: "http://localhost:4321" });
    expect(r).toEqual({ url: "https://checkout.stripe.test/sesion" });
    expect(db.docs.get("customers/ana")).toEqual({ stripeId: "cus_1", email: "ana@x.mx" });
    const c = stripe.calls.find((x) => x.fn === "checkout")!.args as Record<string, unknown>;
    expect(c).toMatchObject({
      mode: "subscription",
      customer: "cus_1",
      client_reference_id: "ana",
      allow_promotion_codes: true,
      locale: "es",
      success_url: "http://localhost:4321/app/?pago=ok",
      cancel_url: "http://localhost:4321/app/?pago=cancelado",
      subscription_data: { metadata: { uid: "ana" } },
    });
    expect(c.line_items).toEqual([{ price: "price_490", quantity: 1 }]);

    await b.createCheckout({ uid: "ana", email: "ana@x.mx", baseUrl: "http://localhost:4321" });
    expect(stripe.calls.filter((x) => x.fn === "customers.create")).toHaveLength(1);
  });

  it("agrega el IVA cuando hay una tasa configurada", async () => {
    const stripe = fakeStripe();
    const b = makeBilling({ stripe, db: fakeDb(), config: { ...config, taxRateId: "txr_iva16" } });
    await b.createCheckout({ uid: "ana", email: "a@x.mx", baseUrl: "http://localhost:4321" });
    const c = stripe.calls.find((x) => x.fn === "checkout")!.args as { line_items: unknown };
    expect(c.line_items).toEqual([{ price: "price_490", quantity: 1, tax_rates: ["txr_iva16"] }]);
  });

  it("si ya tiene suscripción activa no crea otro cobro", async () => {
    const stripe = fakeStripe();
    const db = fakeDb({ "customers/ana": { stripeId: "cus_1" }, "customers/ana/subscription/current": { status: "active" } });
    const r = await makeBilling({ stripe, db, config }).createCheckout({ uid: "ana", email: "a@x.mx", baseUrl: "http://localhost:4321" });
    expect(r).toEqual({ alreadyActive: true });
    expect(stripe.calls).toEqual([]);
  });

  it("con un pago pendiente tampoco crea otra suscripción: hay que arreglar la tarjeta en el portal", async () => {
    const stripe = fakeStripe();
    const db = fakeDb({ "customers/ana": { stripeId: "cus_1" }, "customers/ana/subscription/current": { status: "past_due" } });
    expect(await makeBilling({ stripe, db, config }).createCheckout({ uid: "ana", email: "a@x.mx", baseUrl: "http://localhost:4321" })).toEqual({ alreadyActive: true });
  });

  it("sin sesión iniciada o con una dirección no permitida, falla sin llamar a Stripe", async () => {
    const stripe = fakeStripe();
    const b = makeBilling({ stripe, db: fakeDb(), config });
    await expect(b.createCheckout({ uid: undefined, email: "a@x.mx", baseUrl: "http://localhost:4321" })).rejects.toMatchObject({ code: "unauthenticated" });
    await expect(b.createCheckout({ uid: "ana", email: "a@x.mx", baseUrl: "https://malo.example.com" })).rejects.toBeInstanceOf(BillingError);
    expect(stripe.calls).toEqual([]);
  });
});

describe("portalDePago", () => {
  it("abre el portal del cliente y regresa a la cuenta", async () => {
    const stripe = fakeStripe();
    const db = fakeDb({ "customers/ana": { stripeId: "cus_1" } });
    const r = await makeBilling({ stripe, db, config }).createPortal({ uid: "ana", baseUrl: "http://localhost:4321" });
    expect(r).toEqual({ url: "https://billing.stripe.test/portal" });
    expect(stripe.calls[0]!.args).toEqual({ customer: "cus_1", return_url: "http://localhost:4321/account/" });
  });

  it("sin suscripción previa avisa en vez de fallar raro", async () => {
    await expect(makeBilling({ stripe: fakeStripe(), db: fakeDb(), config }).createPortal({ uid: "ana", baseUrl: "http://localhost:4321" })).rejects.toMatchObject({ code: "failed-precondition" });
  });
});

describe("avisos de Stripe (webhook)", () => {
  const run = (db: ReturnType<typeof fakeDb>, raw: string) => makeBilling({ stripe: fakeStripe(), db, config }).handleWebhook({ rawBody: raw, signature: "x" });

  it("una suscripción nueva activa la cuenta", async () => {
    const db = fakeDb();
    const r = await run(db, event("customer.subscription.created", sub()));
    expect(r).toMatchObject({ handled: "customer.subscription.created", uid: "ana", status: "active" });
    expect(db.docs.get("customers/ana/subscription/current")).toMatchObject({ status: "active", priceId: "price_490", eventCreated: 1000 });
  });

  it("si el aviso no trae la cuenta, la busca por el cliente de Stripe", async () => {
    const db = fakeDb({ "customers/ana": { stripeId: "cus_1" } });
    await run(db, event("customer.subscription.updated", sub({ metadata: {} })));
    expect(db.docs.get("customers/ana/subscription/current")).toMatchObject({ status: "active" });
  });

  it("un pago fallido (past_due) y una cancelación cambian el estado", async () => {
    const db = fakeDb();
    await run(db, event("customer.subscription.updated", sub({ status: "past_due" }), 2000));
    expect(db.docs.get("customers/ana/subscription/current")).toMatchObject({ status: "past_due" });
    await run(db, event("customer.subscription.deleted", sub({ status: "active" }), 3000));
    expect(db.docs.get("customers/ana/subscription/current")).toMatchObject({ status: "canceled" });
  });

  it("un aviso viejo que llega tarde no pisa a uno más nuevo", async () => {
    const db = fakeDb();
    await run(db, event("customer.subscription.updated", sub({ status: "canceled" }), 5000));
    const r = await run(db, event("customer.subscription.updated", sub({ status: "active" }), 4000));
    expect(r).toMatchObject({ ignored: "aviso antiguo" });
    expect(db.docs.get("customers/ana/subscription/current")).toMatchObject({ status: "canceled" });
  });

  it("al completar el pago liga el cliente de Stripe con la cuenta", async () => {
    const db = fakeDb({ "customers/ana": { stripeId: null, email: "a@x.mx" } });
    await run(db, event("checkout.session.completed", { client_reference_id: "ana", customer: "cus_9" }));
    expect(db.docs.get("customers/ana")).toEqual({ stripeId: "cus_9", email: "a@x.mx" });
  });

  it("ignora avisos de otras cosas y suscripciones sin cuenta", async () => {
    const db = fakeDb();
    expect(await run(db, event("invoice.paid", {}))).toEqual({ ignored: "invoice.paid" });
    expect(await run(db, event("customer.subscription.created", sub({ metadata: {}, customer: "cus_desconocido" })))).toEqual({ ignored: "sin cuenta asociada" });
    expect(db.docs.size).toBe(0);
  });

  it("una firma inválida se rechaza y no escribe nada", async () => {
    const db = fakeDb();
    const stripe = fakeStripe();
    stripe.webhooks.constructEvent = () => {
      throw new Error("No signatures found");
    };
    await expect(makeBilling({ stripe, db, config }).handleWebhook({ rawBody: "{}", signature: "mala" })).rejects.toMatchObject({ code: "bad-signature" });
    expect(db.docs.size).toBe(0);
  });
});

// ─── firma real de Stripe (librería oficial, sin internet) ──────────────────

const stripeDir = new URL("../firebase/functions/", import.meta.url);
const hasStripe = existsSync(new URL("node_modules/stripe", stripeDir));

describe.skipIf(!hasStripe)("firma real de Stripe", () => {
  const Stripe = hasStripe ? createRequire(new URL("package.json", stripeDir))("stripe") : null;

  it("acepta un aviso bien firmado y rechaza uno alterado o con otro secreto", async () => {
    const stripe = new Stripe("sk_test_prueba");
    const payload = event("customer.subscription.created", sub());
    const header = stripe.webhooks.generateTestHeaderString({ payload, secret: config.webhookSecret });
    const db = fakeDb();
    const b = makeBilling({ stripe, db, config });

    await b.handleWebhook({ rawBody: payload, signature: header });
    expect(db.docs.get("customers/ana/subscription/current")).toMatchObject({ status: "active" });

    await expect(b.handleWebhook({ rawBody: payload.replace("active", "canceled"), signature: header })).rejects.toMatchObject({ code: "bad-signature" });
    const otro = stripe.webhooks.generateTestHeaderString({ payload, secret: "whsec_otro" });
    await expect(b.handleWebhook({ rawBody: payload, signature: otro })).rejects.toMatchObject({ code: "bad-signature" });
  });
});
