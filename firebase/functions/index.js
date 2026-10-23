// Funciones en la nube del cobro con Stripe (Firebase Cloud Functions, segunda generación).
//   crearPago      → crea la pantalla de pago de Stripe (suscripción de $490 al mes)
//   portalDePago   → abre el portal de Stripe (tarjeta, recibos, cancelar)
//   webhookStripe  → recibe los avisos de Stripe y deja el estado de la suscripción en Firestore
//
// Las llaves de Stripe NUNCA van en el código: se guardan como secretos de Firebase (ver docs/COBRO-PASOS.md).

import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import { defineSecret, defineString } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import Stripe from "stripe";
import { BillingError, makeBilling } from "./billing-core.js";

setGlobalOptions({ region: "us-central1", maxInstances: 5 });
initializeApp();

const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = defineSecret("STRIPE_WEBHOOK_SECRET");
const STRIPE_PRICE_ID = defineString("STRIPE_PRICE_ID");
const STRIPE_TAX_RATE_ID = defineString("STRIPE_TAX_RATE_ID", { default: "" });
const ALLOWED_ORIGINS = defineString("ALLOWED_ORIGINS", { default: "http://localhost:4321" });

const firestoreDb = () => {
  const db = getFirestore();
  return {
    async get(path) {
      const snap = await db.doc(path).get();
      return snap.exists ? snap.data() : null;
    },
    async set(path, data) {
      await db.doc(path).set(data);
    },
    async findCustomerUid(stripeId) {
      const q = await db.collection("customers").where("stripeId", "==", stripeId).limit(1).get();
      return q.empty ? null : q.docs[0].id;
    },
  };
};

const billing = () =>
  makeBilling({
    stripe: new Stripe(STRIPE_SECRET_KEY.value()),
    db: firestoreDb(),
    config: {
      priceId: STRIPE_PRICE_ID.value(),
      taxRateId: STRIPE_TAX_RATE_ID.value(),
      allowedOrigins: ALLOWED_ORIGINS.value().split(",").map((s) => s.trim()).filter(Boolean),
      webhookSecret: STRIPE_WEBHOOK_SECRET.value(),
    },
  });

const toHttpsError = (err) => {
  if (err instanceof BillingError) return new HttpsError(err.code, err.message);
  console.error("Error del cobro:", err);
  return new HttpsError("internal", "No se pudo completar la operación. Inténtalo de nuevo.");
};

export const crearPago = onCall({ secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET] }, async (request) => {
  try {
    return await billing().createCheckout({
      uid: request.auth?.uid,
      email: request.auth?.token?.email,
      baseUrl: request.data?.baseUrl,
    });
  } catch (err) {
    throw toHttpsError(err);
  }
});

export const portalDePago = onCall({ secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET] }, async (request) => {
  try {
    return await billing().createPortal({ uid: request.auth?.uid, baseUrl: request.data?.baseUrl });
  } catch (err) {
    throw toHttpsError(err);
  }
});

export const webhookStripe = onRequest({ secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET] }, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Solo POST");
    return;
  }
  try {
    const result = await billing().handleWebhook({ rawBody: req.rawBody, signature: req.headers["stripe-signature"] });
    res.status(200).json({ received: true, ...result });
  } catch (err) {
    if (err instanceof BillingError && err.code === "bad-signature") {
      res.status(400).send(err.message);
      return;
    }
    console.error("Error en el webhook de Stripe:", err);
    // 500 para que Stripe reintente el aviso
    res.status(500).send("Error interno");
  }
});
