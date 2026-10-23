import { describe, expect, it } from "vitest";
import { exportDxfAama, exportDxfGraded } from "@hilonova/export";
import { BLOCK_CATALOG, defaultMeasurementsFor, draftBlock, type BlockKind } from "@hilonova/blocks";
import { distToPoly, parseDxf, polyArea, type DxfPoly } from "./helpers";

const docOf = (k: BlockKind) => draftBlock(k, defaultMeasurementsFor(k));
const LAYERS = ["1_Boundary", "4_Notch", "5_Grainline", "6_InternalLine", "8_Text", "15_SeamAllowance"];

/** Pares (contorno, margen) de las piezas cerradas, en el orden en que se escribieron. */
function pairs(polys: DxfPoly[]): Array<{ boundary: DxfPoly; seam: DxfPoly }> {
  const out: Array<{ boundary: DxfPoly; seam: DxfPoly }> = [];
  for (let i = 0; i < polys.length; i++) {
    const b = polys[i]!;
    const s = polys[i + 1];
    if (b.layer === "1_Boundary" && s?.layer === "15_SeamAllowance") out.push({ boundary: b, seam: s });
  }
  return out;
}

describe.each([
  ["blusa-clasica", "falda-a"],
  ["short", "chamarra-mezclilla"],
  ["polo", "pantalon-cargo"],
] as const)("DXF de %s y %s", (...kinds) => {
  const exported = kinds.flatMap((k) => {
    const doc = docOf(k);
    return [
      { name: `${k} · talla base`, doc, dxf: exportDxfAama(doc), graded: false },
      { name: `${k} · graduado`, doc, dxf: exportDxfGraded(doc), graded: true },
    ];
  });

  it.each(exported.map((e) => [e.name, e] as const))("%s: estructura válida", (_n, e) => {
    const d = parseDxf(e.dxf);
    expect(d.oddLines).toBe(false);
    expect(d.sections).toEqual(["HEADER", "TABLES", "ENTITIES"]);
    expect(d.endsec).toBe(3);
    expect(d.endsWithEof).toBe(true);
    expect(d.header["$ACADVER"]).toBe("AC1009");
    expect(d.declaredLayers).toEqual(LAYERS);
  });

  it.each(exported.map((e) => [e.name, e] as const))("%s: usa solo entidades R12 y texto ASCII", (_n, e) => {
    const d = parseDxf(e.dxf);
    const types = new Set(d.entities.map((x) => x.type));
    expect(types.has("LWPOLYLINE")).toBe(false);
    for (const t of types) expect(["POLYLINE", "VERTEX", "SEQEND", "LINE", "TEXT"]).toContain(t);
    // R12 es ASCII: ni acentos ni símbolos
    expect(/[^\x00-\x7F]/.test(e.dxf)).toBe(false);
  });

  it.each(exported.map((e) => [e.name, e] as const))("%s: todo va en capas declaradas y los vértices son finitos", (_n, e) => {
    const d = parseDxf(e.dxf);
    for (const ent of d.entities) {
      if (ent.type === "VERTEX" || ent.type === "SEQEND") continue;
      expect(LAYERS).toContain(ent.layer);
    }
    for (const poly of d.polys) {
      expect(poly.pts.length).toBeGreaterThanOrEqual(3);
      for (const p of poly.pts) expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
    }
    // cada POLYLINE se cierra con su SEQEND
    expect(d.entities.filter((x) => x.type === "POLYLINE")).toHaveLength(d.entities.filter((x) => x.type === "SEQEND").length);
  });

  it.each(exported.map((e) => [e.name, e] as const))("%s: el margen de costura queda por fuera, sin picos", (_n, e) => {
    const d = parseDxf(e.dxf);
    const ps = pairs(d.polys);
    expect(ps.length).toBeGreaterThan(0);
    for (const { boundary, seam } of ps) {
      expect(boundary.closed && seam.closed).toBe(true);
      expect(polyArea(seam.pts)).toBeGreaterThan(polyArea(boundary.pts));
      // 1 cm de margen: en las esquinas agudas puede alejarse hasta ~1.6 cm, nunca a 5
      const worst = Math.max(...seam.pts.map((p) => distToPoly(p, boundary.pts)));
      expect(worst).toBeLessThan(2.5);
    }
  });

  it.each(exported.map((e) => [e.name, e] as const))("%s: cada pieza trae hilo y rótulo", (_n, e) => {
    const d = parseDxf(e.dxf);
    const closed = e.doc.pieces.filter((p) => p.closed).length;
    const sizes = e.graded ? e.doc.sizes.length : 1;
    expect(d.lines.filter((l) => l.layer === "5_Grainline")).toHaveLength(closed * sizes);
    // las líneas internas (pinzas de talle, abertura) no llevan rótulo: van en la capa 6, junto a su pieza
    expect(d.texts).toHaveLength(closed * sizes);
    const internal = e.doc.pieces.filter((p) => !p.closed).length;
    expect(d.polys.filter((p) => p.layer === "6_InternalLine")).toHaveLength(internal * sizes);
    expect(pairs(d.polys)).toHaveLength(closed * sizes);
  });

  it("el DXF graduado trae todas las tallas, y la base no las trae todas", () => {
    for (const k of kinds) {
      const doc = docOf(k);
      const graded = parseDxf(exportDxfGraded(doc));
      for (const s of doc.sizes) {
        expect(graded.texts.some((t) => t.endsWith(`talla ${s}`)), `${k}: falta la talla ${s}`).toBe(true);
      }
      const base = parseDxf(exportDxfAama(doc));
      expect(base.texts.every((t) => !t.includes("talla"))).toBe(true);
    }
  });
});

describe("DXF graduado: las tallas crecen", () => {
  it("el contorno de cada pieza es mayor en XL que en S", () => {
    const doc = docOf("blusa-clasica");
    const d = parseDxf(exportDxfGraded(doc));
    const bySize = new Map<string, number>();
    const boundaries = d.polys.filter((p) => p.layer === "1_Boundary");
    d.texts.forEach((t, i) => {
      if (!t.startsWith("DELANTERO")) return;
      bySize.set(t.split("talla ")[1]!, polyArea(boundaries[i]!.pts));
    });
    expect(bySize.size).toBe(doc.sizes.length);
    expect(bySize.get("XL")!).toBeGreaterThan(bySize.get("S")!);
  });
});

describe("todas las prendas se exportan", () => {
  it.each(BLOCK_CATALOG.map((b) => [b.kind] as const))("%s", (kind) => {
    const dxf = exportDxfGraded(docOf(kind));
    const d = parseDxf(dxf);
    expect(d.endsWithEof).toBe(true);
    expect(/[^\x00-\x7F]/.test(dxf)).toBe(false);
    for (const { boundary, seam } of pairs(d.polys)) {
      expect(polyArea(seam.pts)).toBeGreaterThan(polyArea(boundary.pts));
    }
  });
});

describe("líneas internas (pinzas de talle, abertura del polo) en el DXF", () => {
  it.each(["blusa-clasica", "vestido-basico", "polo"] as BlockKind[])("%s: van en la capa 6, dentro de su pieza, en talla base y graduado", (kind) => {
    const doc = docOf(kind);
    const sizes = doc.sizes.length;
    const internal = doc.pieces.filter((p) => !p.closed).length;
    expect(internal).toBeGreaterThan(0);
    for (const [dxf, expected] of [[exportDxfAama(doc), internal], [exportDxfGraded(doc), internal * sizes]] as const) {
      const d = parseDxf(dxf);
      const lines = d.polys.filter((p) => p.layer === "6_InternalLine");
      expect(lines).toHaveLength(expected);
      const boundaries = d.polys.filter((p) => p.layer === "1_Boundary");
      for (const l of lines) {
        // el punto de en medio de la línea cae dentro (o sobre el borde) de alguna pieza
        const mid = l.pts[Math.floor(l.pts.length / 2)]!;
        const ok = boundaries.some((b) => distToPoly(mid, b.pts) < 0.5 || pointInPolyLocal(mid, b.pts));
        expect(ok, `${kind}: línea interna fuera de toda pieza`).toBe(true);
      }
    }
  });
});

function pointInPolyLocal(p: { x: number; y: number }, poly: ReadonlyArray<{ x: number; y: number }>): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]!, b = poly[j]!;
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}
