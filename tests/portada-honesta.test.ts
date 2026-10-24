// La portada y las pantallas del programa no deben prometer lo que el programa no hace (ver docs/ANALISIS-CUMPLIMIENTO.md).

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(new URL(`../apps/web/app/${p}`, import.meta.url), "utf8");
const portada = read("page.tsx");

describe("portada del programa", () => {
  it("no trae cifras ni compatibilidades sin comprobar ni testimonios inventados", () => {
    for (const bad of ["−12%", "28–44", "83%", "Torreón", "HPGL", "Lectra", "DXF-AAMA", "Taller piloto", "nativo"]) {
      expect(portada, bad).not.toContain(bad);
    }
  });

  it("no tiene enlaces muertos", () => {
    expect(portada).not.toMatch(/href="#"/);
  });

  it("dice que el DXF está en validación", () => {
    expect(portada).toContain("DXF");
    expect(portada).toMatch(/en validación/);
  });

  it("el pie enlaza a términos, privacidad y WhatsApp", () => {
    expect(portada).toContain('href="/terminos"');
    expect(portada).toContain('href="/privacidad"');
    expect(portada).toContain("wa.me/522361207101");
  });
});

describe("pantallas del programa", () => {
  it("exportar no promete que el DXF abre en Gerber o Lectra", () => {
    const modal = read("studio/ExportModal.tsx");
    expect(modal).not.toMatch(/Lo abre Gerber|DXF-AAMA/);
    expect(modal).toMatch(/en validación/);
  });

  it("el panel no promete DXF-AAMA", () => {
    expect(read("app/page.tsx")).not.toContain("DXF-AAMA");
  });
});
