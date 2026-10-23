// Planes: solo prometen lo que el software hace hoy (ver docs/PROPUESTA-PLANES.md).

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

describe("planes propuestos", () => {
  it("son Aprendiz, Taller y Equipo (sin plan Industrial)", () => {
    expect(PLANS.map((p) => p.id)).toEqual(["aprendiz", "taller", "equipo"]);
  });

  it("el precio de lanzamiento es menor que el precio normal", () => {
    for (const p of PLANS) if (p.regularPriceMxn) expect(p.priceMxn, p.name).toBeLessThan(p.regularPriceMxn);
    expect(findPlan("taller").priceMxn).toBe(390);
    expect(findPlan("equipo").priceMxn).toBe(990);
    expect(findPlan("aprendiz").priceMxn).toBe(149);
  });

  it("los usuarios de cada plan son 1, 2 y 8", () => {
    expect(PLANS.map((p) => p.seats)).toEqual([1, 2, 8]);
  });

  it("no prometen lo que el programa no tiene", () => {
    const text = JSON.stringify(PLANS);
    // graduación 28–44, DXF "nativo", SSO, API, WhatsApp y los planes anteriores
    for (const banned of ["28–44", "28-44", "SSO", "API", "WhatsApp", "nativo", "Industrial", "Maquila", "ilimitados"]) {
      // "Proyectos ilimitados" sí es cierto (no hay límite por ahora); lo demás no
      if (banned === "ilimitados") continue;
      expect(text, banned).not.toContain(banned);
    }
  });

  it("el DXF se ofrece como «en validación» hasta que se pruebe en Gerber", () => {
    const taller = findPlan("taller").features.join(" ");
    expect(taller).toContain("DXF");
    expect(taller).toContain("en validación");
  });

  it("las cuentas de equipo con roles se anuncian como futuras", () => {
    const equipo = findPlan("equipo").features.join(" ");
    expect(equipo).toContain("roles");
    expect(equipo).toContain("llegan después");
  });
});

describe("sesiones guardadas con los planes anteriores", () => {
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

  it.each([
    ["maquila", "equipo", 8],
    ["industrial", "equipo", 8],
    ["taller", "taller", 2],
    ["aprendiz", "aprendiz", 1],
    ["algo-raro", "taller", 2],
  ])("el plan guardado «%s» pasa a «%s» con %i usuarios", (old, expected, seats) => {
    (window.localStorage as unknown as { setItem(k: string, v: string): void }).setItem("hilonova.session.v1", session(old));
    const s = getSession()!;
    expect(s.org.plan).toBe(expected);
    expect(s.org.seats).toBe(seats);
    expect(normalizePlan(old)).toBe(expected);
  });
});
