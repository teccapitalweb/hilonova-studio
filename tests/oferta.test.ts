// El plan es uno solo y el acceso de alumnos no se anuncia con cifras en las páginas públicas.
// (El cupón será un código de promoción de Stripe; no hay límite de exportaciones.)

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PLANS } from "../apps/web/app/lib/auth";

describe("plan único", () => {
  it("el plan sigue siendo uno solo, a $490, sin límite de exportaciones", () => {
    expect(PLANS).toHaveLength(1);
    expect(PLANS[0]!.priceMxn).toBe(490);
    expect(JSON.stringify(PLANS).toLowerCase()).not.toMatch(/exportaciones? (máximas?|limitadas?)|límite de exportaciones|3 exportaciones/);
  });
});

describe("el acceso de alumnos no se anuncia en las páginas públicas", () => {
  const read = (p: string) => readFileSync(new URL(`../apps/web/app/${p}`, import.meta.url), "utf8");
  it.each(["page.tsx", "pricing/page.tsx", "legal/TerminosContent.tsx"])("%s no muestra cifras ni descuento", (file) => {
    const src = read(file);
    expect(src).not.toContain("STUDENT_OFFER");
    expect(src).not.toMatch(/cup[oó]n|mes gratis|descuento|3 exportaciones|24 horas/i);
  });

  it("el soporte que se ofrece es el que existe (WhatsApp), no un correo", () => {
    expect(JSON.stringify(PLANS)).toContain("soporte por WhatsApp");
    expect(JSON.stringify(PLANS)).not.toContain("soporte por correo");
  });
});
