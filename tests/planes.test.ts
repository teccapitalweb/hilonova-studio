// Plan único: un solo precio, y solo promete lo que el software hace hoy (ver docs/PROPUESTA-PLANES.md).

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PLANS, findPlan, getSession, normalizePlan } from "../apps/web/app/lib/auth";

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => (data.has(k) ? data.get(k)! : null),
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

describe("plan único", () => {
  it("hay un solo plan, «Completo», a $490 al mes, para 1 usuario", () => {
    expect(PLANS).toHaveLength(1);
    const p = findPlan("completo");
    expect(p.name).toBe("Completo");
    expect(p.priceMxn).toBe(490);
    expect(p.seats).toBe(1);
  });

  it("no ofrece cuentas de equipo ni varios usuarios hasta que existan", () => {
    expect(JSON.stringify(PLANS).toLowerCase()).not.toMatch(/2 usuarios|hasta 2|usuarios/);
  });

  it("está organizado por los cuatro módulos que se pidieron", () => {
    expect(findPlan("completo").modules.map((m) => m.title)).toEqual(["Patronaje 2D", "Graduación", "Trazo", "Producción"]);
  });

  it("no hay precios por partes: ni de lanzamiento, ni de aprendiz, ni meses gratis incluidos", () => {
    const text = JSON.stringify(PLANS).toLowerCase();
    for (const banned of ["aprendiz", "equipo", "industrial", "maquila", "lanzamiento", "incluido", "3 meses", "gratis"]) {
      expect(text, banned).not.toContain(banned);
    }
    // el descuento de los alumnos es un código, no un precio distinto
    expect(Object.keys(PLANS[0]!)).not.toContain("regularPriceMxn");
  });

  it("no promete lo que el programa no tiene", () => {
    const text = JSON.stringify(PLANS);
    for (const banned of ["28–44", "28-44", "SSO", "API", "WhatsApp", "nativo", "roles"]) {
      expect(text, banned).not.toContain(banned);
    }
  });

  it("el DXF se ofrece como «en validación» hasta que se pruebe en Gerber", () => {
    const produccion = findPlan("completo").modules.find((m) => m.title === "Producción")!.items;
    expect(produccion).toContain("DXF");
    expect(produccion).toContain("en validación");
  });

  it("las tallas que dice la oferta son las que existen (28 a 36)", () => {
    expect(findPlan("completo").modules.find((m) => m.title === "Graduación")!.items).toContain("28–36");
  });
});

describe("sesiones guardadas con planes anteriores", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { localStorage: fakeStorage(), dispatchEvent: () => true, addEventListener: () => {} });
  });
  afterEach(() => vi.unstubAllGlobals());

  const session = (plan: string) =>
    JSON.stringify({
      user: { id: "u1", name: "Ana", email: "ana@x.mx" },
      org: { id: "o1", name: "Taller Ana", plan, seats: 20 },
      since: "2026-10-01T00:00:00.000Z",
    });

  it.each(["maquila", "industrial", "taller", "aprendiz", "equipo", "estudio", "algo-raro"])("el plan guardado «%s» pasa al plan único con 1 usuario", (old) => {
    (window.localStorage as unknown as { setItem(k: string, v: string): void }).setItem("hilonova.session.v1", session(old));
    const s = getSession()!;
    expect(s.org.plan).toBe("completo");
    expect(s.org.seats).toBe(1);
    expect(normalizePlan(old)).toBe("completo");
  });
});
