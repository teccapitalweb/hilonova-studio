import { describe, expect, it } from "vitest";
import { gradeDoc, type PatternDoc } from "@hilonova/geometry";
import { BLOCK_CATALOG, defaultMeasurementsFor, draftBlock, type BlockKind } from "@hilonova/blocks";
import { nestBySize, nestItems, nestPieces, type NestingResult } from "../apps/web/app/studio/nesting";
import { distToPoly, pointInPoly, polyArea } from "./helpers";

const docOf = (k: BlockKind): PatternDoc => draftBlock(k, defaultMeasurementsFor(k));

/** Empalme entre dos contornos colocados: un vértice de uno metido a fondo en el otro. */
function overlapDepth(a: ReadonlyArray<{ x: number; y: number }>, b: ReadonlyArray<{ x: number; y: number }>): number {
  let worst = 0;
  for (const p of a) {
    if (pointInPoly(p, b)) worst = Math.max(worst, distToPoly(p, b));
  }
  return worst;
}

function expectNoOverlap(r: NestingResult) {
  for (let i = 0; i < r.placed.length; i++) {
    for (let j = i + 1; j < r.placed.length; j++) {
      const a = r.placed[i]!, b = r.placed[j]!;
      // cajas separadas: no hace falta mirar más
      if (a.offset.x + a.width < b.offset.x || b.offset.x + b.width < a.offset.x) continue;
      if (a.offset.y + a.height < b.offset.y || b.offset.y + b.height < a.offset.y) continue;
      const depth = Math.max(overlapDepth(a.pts, b.pts), overlapDepth(b.pts, a.pts));
      expect(depth, `${a.piece.name} #${a.copy + 1} se encima con ${b.piece.name} #${b.copy + 1}`).toBeLessThan(0.75);
    }
  }
}

describe("trazo (nesting)", () => {
  const kinds: BlockKind[] = ["blusa-clasica", "pantalon-denim", "short", "chamarra-mezclilla", "polo", "vestido-basico"];

  it.each(kinds)("%s: coloca todas las copias, dentro de la tela y sin empalmes", (kind) => {
    const doc = docOf(kind);
    const width = 150;
    const r = nestPieces(doc.pieces, width);
    const expected = doc.pieces.filter((p) => p.closed).reduce((s, p) => s + p.quantity, 0);
    expect(r.placed).toHaveLength(expected);
    expect(r.oversize).toEqual([]);
    for (const pp of r.placed) {
      for (const p of pp.pts) {
        expect(p.x).toBeGreaterThanOrEqual(-1e-6);
        expect(p.x).toBeLessThanOrEqual(width + 1e-6);
        expect(p.y).toBeGreaterThanOrEqual(-1e-6);
      }
    }
    expectNoOverlap(r);
  });

  it("las métricas son coherentes", () => {
    const r = nestPieces(docOf("blusa-clasica").pieces, 150);
    expect(r.utilization).toBeGreaterThan(0.3);
    expect(r.utilization).toBeLessThanOrEqual(1);
    expect(r.rollArea).toBeCloseTo(150 * r.markerLength, 5);
    expect(r.piecesArea).toBeLessThan(r.rollArea);
    const maxY = Math.max(...r.placed.flatMap((pp) => pp.pts.map((p) => p.y)));
    expect(r.markerLength).toBeGreaterThanOrEqual(maxY - 1e-6);
  });

  it("el área que usa es la de las piezas con margen de costura", () => {
    const doc = docOf("blusa-clasica");
    const r = nestPieces(doc.pieces, 150);
    const sum = r.placed.reduce((s, pp) => s + polyArea(pp.pts), 0);
    expect(r.piecesArea).toBeCloseTo(sum, 0);
  });

  it("una tela más ancha no necesita más largo", () => {
    const doc = docOf("blusa-clasica");
    const narrow = nestPieces(doc.pieces, 110);
    const wide = nestPieces(doc.pieces, 180);
    expect(wide.markerLength).toBeLessThanOrEqual(narrow.markerLength * 1.05);
  });

  it("avisa de las piezas que no caben a lo ancho", () => {
    const r = nestPieces(docOf("blusa-clasica").pieces, 40);
    expect(r.oversize.length).toBeGreaterThan(0);
  });

  it("las líneas internas (abiertas) no se cortan ni se acomodan", () => {
    const doc = docOf("polo");
    expect(doc.pieces.some((p) => !p.closed)).toBe(true);
    const r = nestPieces(doc.pieces, 150);
    expect(r.placed.every((pp) => pp.piece.closed)).toBe(true);
  });

  it("las copias impares de un par salen espejadas", () => {
    const r = nestPieces(docOf("blusa-clasica").pieces, 150);
    const front = r.placed.filter((pp) => pp.piece.name === "Delantero");
    expect(front).toHaveLength(2);
    expect(front.map((f) => f.mirrored).sort()).toEqual([false, true]);
    const back = r.placed.filter((pp) => pp.piece.name === "Espalda");
    expect(back.every((b) => !b.mirrored)).toBe(true);
  });

  it("la mezcla de tallas en un trazo combinado coloca todo y rinde más que una sola talla", () => {
    const doc = docOf("blusa-clasica");
    const { perSize, combined } = nestBySize(doc, 150);
    expect(perSize.map((p) => p.size)).toEqual(doc.sizes);
    expect(combined.placed).toHaveLength(perSize.reduce((s, p) => s + p.result.placed.length, 0));
    expect(combined.utilization).toBeGreaterThan(perSize[0]!.result.utilization);
    expectNoOverlap(combined);
  });

  it("las tallas más grandes gastan más tela", () => {
    const { perSize } = nestBySize(docOf("camisa-hombre"), 150);
    const lens = perSize.map((p) => p.result.markerLength);
    expect(lens[lens.length - 1]!).toBeGreaterThan(lens[0]!);
  });

  it("sin piezas devuelve un trazo vacío sin fallar", () => {
    const r = nestItems([], 150);
    expect(r.placed).toEqual([]);
    expect(r.markerLength).toBe(0);
    expect(r.utilization).toBe(0);
  });

  it("todas las prendas caben en una tela de 150 cm, salvo las que lo avisan", () => {
    for (const b of BLOCK_CATALOG) {
      const doc = gradeDoc(docOf(b.kind), docOf(b.kind).baseSize);
      const r = nestPieces(doc.pieces, 150);
      expect(r.markerLength, b.kind).toBeGreaterThan(0);
      expect(r.oversize, `${b.kind}: piezas que no caben`).toEqual([]);
    }
  });
});
