// Quién puede usar el programa cuando el cobro está encendido (regla pura) y que viene apagado por seguridad.

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ENTITLED_STATUSES, OFFLINE_GRACE_DAYS, entitlementOf, withinGrace } from "../apps/web/app/lib/billing-core";
import { BILLING } from "../apps/web/app/lib/billing-config";

const NOW = new Date("2026-11-01T12:00:00.000Z");
const day = 86_400_000;

describe("entitlementOf", () => {
  it.each(["active", "trialing", "past_due"])("la suscripción «%s» da acceso", (status) => {
    expect(entitlementOf({ status }, null, NOW)).toEqual({ entitled: true, via: "suscripcion" });
  });

  it.each(["canceled", "unpaid", "incomplete", "incomplete_expired", "paused"])("la suscripción «%s» no da acceso", (status) => {
    expect(entitlementOf({ status }, null, NOW)).toEqual({ entitled: false, via: null });
  });

  it("sin suscripción ni acceso dado a mano no hay acceso", () => {
    expect(entitlementOf(null, null, NOW).entitled).toBe(false);
    expect(entitlementOf(undefined, undefined, NOW).entitled).toBe(false);
  });

  it("un acceso dado a mano sin fecha no vence", () => {
    expect(entitlementOf(null, { note: "venta por WhatsApp" }, NOW)).toEqual({ entitled: true, via: "cortesia" });
    expect(entitlementOf(null, { until: null }, NOW).entitled).toBe(true);
  });

  it("un acceso dado a mano con fecha vale hasta esa fecha", () => {
    expect(entitlementOf(null, { until: new Date(NOW.getTime() + day).toISOString() }, NOW).entitled).toBe(true);
    expect(entitlementOf(null, { until: new Date(NOW.getTime() - day).toISOString() }, NOW).entitled).toBe(false);
  });

  it("una fecha que no se entiende NO regala el acceso", () => {
    expect(entitlementOf(null, { until: "mañana" }, NOW).entitled).toBe(false);
  });

  it("una suscripción cancelada con un acceso a mano vigente sí entra (cortesía)", () => {
    expect(entitlementOf({ status: "canceled" }, { until: null }, NOW)).toEqual({ entitled: true, via: "cortesia" });
  });

  it("los estados con acceso son los mismos que las funciones consideran «suscripción existente»", () => {
    const core = readFileSync(new URL("../firebase/functions/billing-core.js", import.meta.url), "utf8");
    for (const s of ENTITLED_STATUSES) expect(core).toContain(`"${s}"`);
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

describe("interruptor del cobro", () => {
  it("viene apagado: hasta publicar y probar las funciones, todas las cuentas entran como hoy", () => {
    expect(BILLING.enabled).toBe(false);
  });
});
