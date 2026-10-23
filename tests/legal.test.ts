// Páginas legales: completas, sin campos pendientes y sin datos de la empresa inventados.

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(new URL(`../apps/web/app/${p}`, import.meta.url), "utf8");
const privacidad = read("legal/PrivacidadContent.tsx");
const terminos = read("legal/TerminosContent.tsx");
const marco = read("legal/LegalPage.tsx");
const signup = read("auth/signup/page.tsx");

describe("páginas legales", () => {
  it("no tienen campos pendientes ni letrero de borrador", () => {
    for (const src of [privacidad, terminos, marco]) {
      expect(src).not.toMatch(/POR COMPLETAR|Borrador|Todo>/);
    }
  });

  it("no traen datos de la empresa inventados (razón social, domicilio, correo, teléfono, RFC)", () => {
    for (const src of [privacidad, terminos]) {
      expect(src).not.toMatch(/S\.A\.|S\. de R\.L\.|RFC\s*[:=]?\s*[A-Z]{3,4}\d{6}/);
      expect(src).not.toMatch(/[\w.]+@[\w.]+\.\w{2,}/);
      expect(src).not.toMatch(/\b\d{3}[\s-]?\d{3}[\s-]?\d{4}\b/);
      expect(src).not.toMatch(/Calle|Av\.|C\.P\./);
    }
  });

  it("el aviso de privacidad nombra los datos, las finalidades y los derechos", () => {
    for (const s of ["nombre, correo electrónico", "Firebase", "No vendemos tus datos", "acceso, rectificación, cancelación y oposición", "No usamos tus datos para enviarte publicidad"]) {
      expect(privacidad, s).toContain(s);
    }
  });

  it("no promete lo que el programa no hace", () => {
    expect(privacidad).toContain("hoy se guardan en tu propio navegador");
    expect(privacidad).toContain("hoy no los pedimos");
    expect(terminos).toMatch(/DXF[^.]*en validación/);
    expect(terminos).toContain("El cobro todavía no está activo");
  });

  it("llevan la fecha en que se escribieron", () => {
    expect(privacidad).toContain("23 de octubre de 2026");
    expect(terminos).toContain("23 de octubre de 2026");
  });

  it("el precio y el cupón salen de las constantes del programa, no de números escritos a mano", () => {
    expect(terminos).toContain("findPlan");
    expect(terminos).toContain("STUDENT_OFFER");
    expect(terminos).not.toMatch(/\$\s*490/);
  });

  it("el registro enlaza a las páginas reales, no a «#»", () => {
    expect(signup).toContain('href="/terminos"');
    expect(signup).toContain('href="/privacidad"');
    expect(signup).not.toMatch(/<a href="#">/);
  });
});
