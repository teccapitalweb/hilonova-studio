// Páginas legales: son borradores y no deben traer datos de la empresa inventados.

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(new URL(`../apps/web/app/${p}`, import.meta.url), "utf8");
const privacidad = read("legal/PrivacidadContent.tsx");
const terminos = read("legal/TerminosContent.tsx");
const marco = read("legal/LegalPage.tsx");
const signup = read("auth/signup/page.tsx");

describe("páginas legales (borrador)", () => {
  it("se anuncian como borrador pendiente de revisión legal", () => {
    expect(marco).toContain("Borrador pendiente de revisión legal");
  });

  it("los datos de la empresa quedan como «por completar», no inventados", () => {
    for (const src of [privacidad, terminos]) {
      expect(src).toMatch(/<Todo>razón social/);
      expect(src).not.toMatch(/S\.A\.|S\. de R\.L\.|RFC\s*[:=]?\s*[A-Z]{3,4}\d{6}/);
      expect(src).not.toMatch(/[\w.]+@[\w.]+\.\w{2,}/); // ningún correo escrito a mano
    }
    expect(privacidad).toMatch(/<Todo>domicilio completo/);
    expect(privacidad).toMatch(/<Todo>correo de contacto para datos personales/);
    expect(terminos).toMatch(/<Todo>cómo se cancela la suscripción/);
  });

  it("el aviso de privacidad nombra los datos, las finalidades y los derechos", () => {
    for (const s of ["nombre, correo electrónico", "Firebase", "No vendemos tus datos", "acceso, rectificación, cancelación y oposición"]) {
      expect(privacidad, s).toContain(s);
    }
  });

  it("no promete lo que el programa no hace", () => {
    expect(privacidad).toContain("hoy se guardan en tu propio navegador");
    expect(terminos).toMatch(/DXF[^.]*en validación/);
    expect(terminos).toContain("el cobro todavía no está activo");
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
