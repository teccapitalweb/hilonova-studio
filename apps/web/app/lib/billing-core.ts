// Quién puede usar el programa cuando el cobro está encendido. Funciones puras (se prueban sin Firebase ni Stripe).

/** Acceso dado a mano desde la consola de Firebase (access/{uid}): pagos recibidos, alumnos, cortesías, pruebas. */
export interface AccessDoc {
  /** fecha ISO hasta la que vale; sin fecha, no vence */
  until?: string | null;
  note?: string;
}

export function hasAccess(access: AccessDoc | null | undefined, now: Date = new Date()): boolean {
  if (!access) return false;
  if (!access.until) return true;
  const until = Date.parse(access.until);
  // una fecha que no se entiende NO regala el acceso
  return !Number.isNaN(until) && until > now.getTime();
}

/** Cuánto tiempo se confía en la última comprobación cuando no hay conexión para repetirla. */
export const OFFLINE_GRACE_DAYS = 7;

export function withinGrace(cachedAt: number | null | undefined, now: number = Date.now()): boolean {
  return typeof cachedAt === "number" && now - cachedAt < OFFLINE_GRACE_DAYS * 86_400_000;
}

/** Dirección del enlace de pago con el correo y la cuenta ya puestos (así el pago dice de quién es). */
export function paymentUrl(link: string, uid: string, email: string): string {
  if (!link) return "";
  const url = new URL(link);
  if (email) url.searchParams.set("prefilled_email", email);
  // Stripe solo acepta letras, números, guion y guion bajo en este campo
  if (/^[A-Za-z0-9_-]{1,200}$/.test(uid)) url.searchParams.set("client_reference_id", uid);
  return url.toString();
}

/** Mensaje de WhatsApp para avisar de un pago. */
export function whatsappUrl(number: string, text: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
