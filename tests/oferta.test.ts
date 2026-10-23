// Oferta para alumnos del curso: un mes con el programa completo y 3 exportaciones (cupón de un solo uso, 24 horas).

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { EXPORT_KINDS, STUDENT_OFFER } from "../apps/web/app/lib/oferta";
import { PLANS } from "../apps/web/app/lib/auth";

describe("oferta para alumnos", () => {
  it("es un mes, con 3 exportaciones, un cupón de un solo uso que se canjea en 24 horas", () => {
    expect(STUDENT_OFFER).toEqual({ freeMonths: 1, exports: 3, redeemHours: 24, singleUse: true });
  });

  it("el cupón no cambia el precio: el plan sigue siendo uno solo, a $490", () => {
    expect(PLANS).toHaveLength(1);
    expect(PLANS[0]!.priceMxn).toBe(490);
  });

  it("cuenta como exportación lo que sale del programa; el respaldo no se menciona como exportación", () => {
    expect(EXPORT_KINDS).toEqual(["DXF", "PDF", "SVG", "ficha técnica", "trazo"]);
    expect(EXPORT_KINDS.join(" ").toLowerCase()).not.toContain("respaldo");
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
