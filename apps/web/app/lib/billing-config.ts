// Interruptor del cobro. Mientras `enabled` sea false, TODAS las cuentas entran al programa sin pagar (como hoy).
// Se pone en true solo cuando las funciones de cobro ya están publicadas y probadas (docs/COBRO-PASOS.md):
// si se enciende antes, nadie podría entrar, ni los dueños.

export const BILLING = {
  enabled: false,
  /** región de las funciones de Firebase (la misma de firebase/functions/index.js) */
  region: "us-central1",
} as const;
