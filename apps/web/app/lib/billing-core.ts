// Quién puede usar el programa cuando el cobro está encendido. Función pura (se prueba sin Firebase ni Stripe).

/** Lo que las funciones de cobro guardan en customers/{uid}/subscription/current. */
export interface SubscriptionDoc {
  status: string;
  priceId?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
}

/** Acceso dado a mano desde la consola de Firebase (access/{uid}): cortesías, ventas por WhatsApp, pruebas. */
export interface AccessDoc {
  /** fecha ISO hasta la que vale; sin fecha, no vence */
  until?: string | null;
  note?: string;
}

/**
 * Estados de Stripe con acceso. «past_due» (pago fallido) conserva el acceso mientras Stripe reintenta el cobro;
 * si no se logra cobrar, Stripe cancela y el acceso termina.
 */
export const ENTITLED_STATUSES: readonly string[] = ["active", "trialing", "past_due"];

export type EntitlementVia = "suscripcion" | "cortesia";

export interface Entitlement {
  entitled: boolean;
  via: EntitlementVia | null;
}

export function entitlementOf(sub: SubscriptionDoc | null | undefined, access: AccessDoc | null | undefined, now: Date = new Date()): Entitlement {
  if (sub && ENTITLED_STATUSES.includes(sub.status)) return { entitled: true, via: "suscripcion" };
  if (access) {
    const until = access.until ? Date.parse(access.until) : null;
    if (until === null || (!Number.isNaN(until) && until > now.getTime())) return { entitled: true, via: "cortesia" };
  }
  return { entitled: false, via: null };
}

export const STATUS_LABEL: Record<string, string> = {
  active: "Activa",
  trialing: "Activa (periodo de prueba)",
  past_due: "Pago pendiente",
  canceled: "Cancelada",
  unpaid: "Sin pago",
  incomplete: "Pago incompleto",
  incomplete_expired: "Pago vencido",
  paused: "En pausa",
};

/** Cuánto tiempo se confía en la última comprobación cuando no hay conexión para repetirla. */
export const OFFLINE_GRACE_DAYS = 7;

export function withinGrace(cachedAt: number | null | undefined, now: number = Date.now()): boolean {
  return typeof cachedAt === "number" && now - cachedAt < OFFLINE_GRACE_DAYS * 86_400_000;
}
