// Ayuda dentro de la app y el patrón en blanco.

import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { emptyDoc, rectPiece } from "@hilonova/geometry";
import { defaultMeasurementsFor, draftBlock } from "@hilonova/blocks";
import { HELP_BLANK, HELP_BY_VIEW, HELP_FLOW, HELP_TOOLS, type HelpSection } from "../apps/web/app/studio/ayuda-contenido";
import { TOOL_KEYS } from "../apps/web/app/studio/Canvas";
import { useEditor } from "../apps/web/app/studio/store";

const VIEWS = ["proyectos", "editor", "graduacion", "trazo", "produccion", "materiales", "libreria", "reportes", "config"] as const;
const sections: HelpSection[] = [...Object.values(HELP_BY_VIEW), HELP_FLOW, HELP_BLANK];

describe("contenido de la ayuda", () => {
  it("hay ayuda para cada pantalla del programa", () => {
    expect(Object.keys(HELP_BY_VIEW).sort()).toEqual([...VIEWS].sort());
  });

  it("cada sección tiene título y pasos, sin textos vacíos", () => {
    for (const s of sections) {
      expect(s.title.trim().length, s.title).toBeGreaterThan(5);
      expect(s.steps.length, s.title).toBeGreaterThan(0);
      for (const t of [...s.steps, ...(s.tips ?? [])]) expect(t.trim().length, `${s.title}: texto vacío`).toBeGreaterThan(10);
    }
  });

  it("los atajos de herramienta de la ayuda son exactamente los del editor", () => {
    const documented = HELP_TOOLS.map((k) => k.keys).filter((k) => /^[A-Z]$/.test(k)).sort();
    const real = Object.keys(TOOL_KEYS).map((k) => k.toUpperCase()).sort();
    expect(documented).toEqual(real);
  });

  it("no promete cosas que el programa no tiene (vista 3D)", () => {
    const all = JSON.stringify([sections, HELP_TOOLS]).toLowerCase();
    expect(all).not.toContain("3d");
  });

  it("la guía del patrón en blanco explica lo esencial", () => {
    const text = HELP_BLANK.steps.join(" ").toLowerCase();
    for (const word of ["polilínea", "propiedades", "piquete", "biblioteca", "graduación"]) expect(text, word).toContain(word);
  });
});

describe("patrón en blanco en el editor", () => {
  const get = () => useEditor.getState();
  const m = defaultMeasurementsFor("falda-recta");

  beforeEach(() => {
    get().loadDoc(emptyDoc("Patrón sin título"));
  });

  it("un patrón en blanco no trae tipo de prenda", () => {
    expect(get().history.present.blockKind).toBeUndefined();
  });

  it("cambiar medidas en un patrón en blanco no borra lo dibujado", () => {
    const doc = { ...get().history.present, pieces: [rectPiece("Mi pieza", { x: 0, y: 0 }, { x: 20, y: 30 })] };
    get().loadDoc(doc);
    const before = get().history.present;
    get().applyMeasurements({ ...m, cintura: 99 });
    expect(get().history.present).toBe(before); // el mismo documento: no pasó nada
    expect(get().history.present.pieces.map((p) => p.name)).toEqual(["Mi pieza"]);
  });

  it("en un patrón que viene de una prenda base, cambiar medidas sí redibuja", () => {
    get().loadDoc(draftBlock("falda-recta", m));
    const w = (x: number) => get().history.present.pieces.find((p) => p.name === "Pretina")!.nodes.map((n) => n.at.x).reduce((a, b) => Math.max(a, b), -Infinity) - x;
    const before = w(0);
    get().applyMeasurements({ ...m, cintura: m.cintura + 10 });
    expect(w(0)).toBeGreaterThan(before + 9);
  });

  it("el documento de demostración también trae su tipo de prenda (si no, se tomaría por uno en blanco)", () => {
    get().resetDoc();
    expect(get().history.present.blockKind).toBe("pantalon-denim");
  });

  it("la biblioteca de piezas se abre y se cierra desde el almacén (la guía del lienzo vacío la abre)", () => {
    expect(get().libOpen).toBe(false);
    get().setLibOpen(true);
    expect(get().libOpen).toBe(true);
    get().setLibOpen(false);
    expect(get().libOpen).toBe(false);
  });
});

describe("guía del lienzo vacío", () => {
  const src = readFileSync(new URL("../apps/web/app/studio/Ayuda.tsx", import.meta.url), "utf8");

  it("se puede cerrar y se acuerda de que se cerró", () => {
    expect(src).toContain('aria-label="Cerrar la guía"');
    expect(src).toContain("Entendido, cerrar");
    expect(src).toContain("hilonova.emptyguide.hidden.v1");
    expect(src).toMatch(/if \(hidden\) return null/);
  });
});
