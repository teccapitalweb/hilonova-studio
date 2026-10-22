import { describe, expect, it } from "vitest";
import { area, bounds, compareSizes, gradeDoc, samplePath, type PatternDoc } from "@hilonova/geometry";
import {
  BLOCK_CATALOG,
  PIECE_LIBRARY,
  defaultMeasurementsFor,
  draftBlock,
  gradeRulesFor,
  measurementsForBlockSize,
  rederiveGrades,
  type BlockKind,
} from "@hilonova/blocks";

const KINDS = BLOCK_CATALOG.map((b) => b.kind);

function docOf(kind: BlockKind): PatternDoc {
  return draftBlock(kind, defaultMeasurementsFor(kind));
}

const totalArea = (d: PatternDoc) => d.pieces.filter((p) => p.closed).reduce((s, p) => s + area(p) * p.quantity, 0);

describe("catálogo de prendas", () => {
  it("hay 17 prendas", () => {
    expect(KINDS).toHaveLength(17);
    expect(new Set(KINDS).size).toBe(17);
  });

  it.each(KINDS)("%s: el número de piezas coincide con el catálogo", (kind) => {
    const meta = BLOCK_CATALOG.find((b) => b.kind === kind)!;
    expect(docOf(kind).pieces).toHaveLength(meta.pieces);
  });

  it.each(KINDS)("%s: arranca con todas las medidas que pide", (kind) => {
    const meta = BLOCK_CATALOG.find((b) => b.kind === kind)!;
    const m = defaultMeasurementsFor(kind);
    for (const f of meta.fields) expect(typeof m[f], `medida ${f}`).toBe("number");
  });
});

describe.each(KINDS)("prenda %s", (kind) => {
  const doc = docOf(kind);

  it("las piezas son válidas: coordenadas finitas, área positiva, nombres únicos", () => {
    const names = new Set<string>();
    for (const p of doc.pieces) {
      expect(names.has(p.name), `nombre repetido: ${p.name}`).toBe(false);
      names.add(p.name);
      expect(p.quantity).toBeGreaterThanOrEqual(1);
      expect(p.nodes.length).toBeGreaterThanOrEqual(2);
      for (const n of p.nodes) {
        expect(Number.isFinite(n.at.x) && Number.isFinite(n.at.y), `${p.name}: nodo no finito`).toBe(true);
      }
      for (const q of samplePath(p, 8)) expect(Number.isFinite(q.x) && Number.isFinite(q.y)).toBe(true);
      if (p.closed) {
        expect(p.nodes.length).toBeGreaterThanOrEqual(3);
        expect(area(p), `${p.name}: área`).toBeGreaterThan(1);
        expect(p.seamAllowance).toBeGreaterThan(0);
      } else {
        expect(p.seamAllowance).toBe(0);
      }
    }
  });

  it("los ids de nodos y de piezas no se repiten", () => {
    const ids = doc.pieces.flatMap((p) => [p.id, ...p.nodes.map((n) => n.id)]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("el documento recuerda su prenda, medidas y gama de tallas", () => {
    expect(doc.blockKind).toBe(kind);
    expect(doc.measurements).toBeDefined();
    expect(doc.sizes).toContain(doc.baseSize);
    expect(doc.sizes.length).toBeGreaterThanOrEqual(4);
  });

  it("las piezas cerradas no se empalman sobre la mesa en la talla base", () => {
    const closed = doc.pieces.filter((p) => p.closed).map((p) => ({ p, b: bounds(p) }));
    for (let i = 0; i < closed.length; i++) {
      for (let j = i + 1; j < closed.length; j++) {
        const a = closed[i]!, b = closed[j]!;
        const overlap = a.b.minX < b.b.maxX && b.b.minX < a.b.maxX && a.b.minY < b.b.maxY && b.b.minY < a.b.maxY;
        expect(overlap, `${a.p.name} se empalma con ${b.p.name}`).toBe(false);
      }
    }
  });

  it("la graduación crece de talla en talla y deja la base intacta", () => {
    expect(gradeDoc(doc, doc.baseSize)).toBe(doc);
    const sizes = [...doc.sizes].sort(compareSizes);
    const areas = sizes.map((s) => totalArea(gradeDoc(doc, s)));
    for (let i = 1; i < areas.length; i++) {
      expect(areas[i]!, `talla ${sizes[i]} debe ser mayor que ${sizes[i - 1]}`).toBeGreaterThan(areas[i - 1]!);
    }
    for (const s of sizes) {
      for (const p of gradeDoc(doc, s).pieces) {
        for (const n of p.nodes) expect(Number.isFinite(n.at.x) && Number.isFinite(n.at.y)).toBe(true);
      }
    }
  });

  it("el primer nodo de cada pieza queda fijo al graduar (ancla)", () => {
    const xl = gradeDoc(doc, [...doc.sizes].sort(compareSizes).at(-1)!);
    doc.pieces.forEach((p, i) => {
      expect(xl.pieces[i]!.nodes[0]!.at).toEqual(p.nodes[0]!.at);
    });
  });
});

describe("medidas y reglas de tallaje", () => {
  it("la blusa crece 4 cm de busto por talla", () => {
    const base = defaultMeasurementsFor("blusa-clasica");
    const m = (s: string) => measurementsForBlockSize("blusa-clasica", s, base, "M").busto;
    expect([m("S"), m("M"), m("L"), m("XL")]).toEqual([88, 92, 96, 100]);
  });

  it("las reglas editadas pisan las de fábrica", () => {
    const base = defaultMeasurementsFor("blusa-clasica");
    const rules = gradeRulesFor("blusa-clasica", { busto: 6 });
    expect(rules.busto).toBe(6);
    expect(rules.cintura).toBe(4);
    expect(measurementsForBlockSize("blusa-clasica", "L", base, "M", { busto: 6 }).busto).toBe(98);
  });

  it("cambiar una regla de tallaje cambia el tamaño de las piezas graduadas", () => {
    const base = docOf("blusa-clasica");
    const m = defaultMeasurementsFor("blusa-clasica");
    const bigger = rederiveGrades(base, "blusa-clasica", m, { busto: 8 });
    // la regla del busto mueve el fondo de la sisa (el punto con piquete a la altura de la sisa)
    const underarmX = (d: PatternDoc) => {
      const back = gradeDoc(d, "XL").pieces.find((p) => p.name === "Espalda")!;
      const sisa = m.sisa ?? 23;
      const xs = back.nodes.filter((n) => n.notch && Math.abs(n.at.y - back.nodes[0]!.at.y - (sisa - 2.5)) < 3).map((n) => n.at.x);
      return Math.max(...xs);
    };
    expect(underarmX(bigger)).toBeGreaterThan(underarmX(base));
    expect(bigger.gradeSteps).toEqual({ busto: 8 });
  });

  it("al cambiar las medidas el patrón se redibuja con ellas", () => {
    const narrow = draftBlock("blusa-clasica", { ...defaultMeasurementsFor("blusa-clasica"), busto: 80 });
    const wide = draftBlock("blusa-clasica", { ...defaultMeasurementsFor("blusa-clasica"), busto: 110 });
    const w = (d: PatternDoc) => {
      const b = bounds(d.pieces.find((p) => p.name === "Espalda")!);
      return b.maxX - b.minX;
    };
    expect(w(wide)).toBeGreaterThan(w(narrow));
  });
});

describe("biblioteca de piezas", () => {
  it.each(PIECE_LIBRARY.map((e) => [e.id, e] as const))("%s se genera bien", (_id, entry) => {
    const m = defaultMeasurementsFor("blusa-clasica");
    const a = entry.make(m);
    const b = entry.make(m);
    expect(a.closed).toBe(true);
    expect(area(a)).toBeGreaterThan(1);
    expect(a.id).not.toBe(b.id);
    expect(a.nodes[0]!.id).not.toBe(b.nodes[0]!.id);
  });
});
