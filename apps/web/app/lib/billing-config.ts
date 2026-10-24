// Cobro con un enlace de pago de Stripe y acceso dado a mano (sin servidor propio).
//
// Cómo funciona: la persona se registra, ve «Activa tu plan» y paga en el enlace de Stripe. Quien administra el negocio
// ve el pago en Stripe (que trae el identificador de la cuenta) y le da acceso con un documento access/{uid} en
// Firestore. Pasos en docs/COBRO-PASOS.md.
//
// Mientras `enabled` sea false, TODAS las cuentas entran al programa sin pagar (como hoy). Se pone en true solo cuando
// el enlace de pago ya está creado: si se enciende antes, nadie podría entrar, ni los dueños.

export const BILLING = {
  enabled: false,
  /** Enlace de pago de Stripe de $490 MXN al mes (https://buy.stripe.com/…). Se crea en el panel de Stripe. */
  paymentLink: "",
  /** Enlace del portal de clientes de Stripe (https://billing.stripe.com/p/login/…): tarjeta, recibos y cancelar. Opcional. */
  portalLink: "",
  /** WhatsApp del negocio, para avisar de un pago o pedir ayuda (número del folleto del curso). */
  whatsapp: "522361207101",
} as const;
