// Quién puede usar el programa cuando el cobro está encendido (reglas puras), el enlace de pago y que viene apagado.

import { describe, expect, it } from "vitest";
import { OFFLINE_GRACE_DAYS, hasAccess, paymentUrl, whatsappUrl, withinGrace } from "../apps/web/app/lib/billing-core";
import { BILLING } from "../apps/web/app/lib/billing-config";

const NOW = new Date("2026-11-01T12:00:00.000Z");
const day = 86_400_000;

describe("hasAccess", () => {
  it("sin documento de acceso no hay acceso", () => {
    expect(hasAccess(null, NOW)).toBe(false);
    expect(hasAccess(undefined, NOW)).toBe(false);
  });

  it("un acceso sin fecha no vence (pago recibido, cortesía)", () => {
    expect(hasAccess({ note: "pago de enero" }, NOW)).toBe(true);
    expect(hasAccess({ until: null }, NOW)).toBe(true);
  });

  it("un acceso con fecha vale hasta esa fecha (alumnos: un mes)", () => {
    expect(hasAccess({ until: new Date(NOW.getTime() + day).toISOString() }, NOW)).toBe(true);
    expect(hasAccess({ until: new Date(NOW.getTime() - day).toISOString() }, NOW)).toBe(false);
  });

  it("una fecha que no se entiende NO regala el acceso", () => {
    expect(hasAccess({ until: "mañana" }, NOW)).toBe(false);
  });
});

describe("sin conexión", () => {
  it("se confía en la última comprobación por unos días y luego ya no", () => {
    const t = NOW.getTime();
    expect(withinGrace(t - 2 * day, t)).toBe(true);
    expect(withinGrace(t - (OFFLINE_GRACE_DAYS + 1) * day, t)).toBe(false);
    expect(withinGrace(null, t)).toBe(false);
    expect(withinGrace(undefined, t)).toBe(false);
  });
});

describe("enlace de pago", () => {
  const link = "https://buy.stripe.com/test_abc123";

  it("lleva el correo y la cuenta, para que el pago diga de quién es", () => {
    const u = new URL(paymentUrl(link, "KVkESNzPcMWKOmOsuCUJzFghKOY2", "ana@taller.mx"));
    expect(u.origin + u.pathname).toBe(link);
    expect(u.searchParams.get("prefilled_email")).toBe("ana@taller.mx");
    expect(u.searchParams.get("client_reference_id")).toBe("KVkESNzPcMWKOmOsuCUJzFghKOY2");
  });

  it("si la cuenta trae caracteres que Stripe no acepta, no la manda (el correo basta)", () => {
    const u = new URL(paymentUrl(link, "u:raro/1", "ana@taller.mx"));
    expect(u.searchParams.has("client_reference_id")).toBe(false);
    expect(u.searchParams.get("prefilled_email")).toBe("ana@taller.mx");
  });

  it("sin enlace configurado devuelve vacío", () => {
    expect(paymentUrl("", "uid", "a@x.mx")).toBe("");
  });

  it("el mensaje de WhatsApp va codificado", () => {
    const u = whatsappUrl("522361207101", "Hola, mi correo es a+b@x.mx");
    expect(u.startsWith("https://wa.me/522361207101?text=")).toBe(true);
    expect(decodeURIComponent(u.split("text=")[1]!)).toBe("Hola, mi correo es a+b@x.mx");
  });
});

describe("interruptor del cobro", () => {
  it("viene apagado: hasta crear el enlace de pago y probarlo, todas las cuentas entran como hoy", () => {
    expect(BILLING.enabled).toBe(false);
  });

  it("el WhatsApp es el del folleto del curso", () => {
    expect(BILLING.whatsapp).toBe("522361207101");
  });
});
