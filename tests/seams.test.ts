import { describe, expect, it } from "vitest";
import {
  SEAM_TOLERANCE,
  contourRun,
  gradeDoc,
  rectPiece,
  seamResult,
  sideLength,
  type PatternDoc,
  type Piece,
  type SeamCheck,
} from "@hilonova/geometry";
import { BLOCK_CATALOG, defaultMeasurementsFor, draftBlock, type BlockKind } from "@hilonova/blocks";

const docOf = (k: BlockKind) => draftBlock(k, defaultMeasurementsFor(k));
const run = (p: Piece, i: number, j: number) => contourRun(p, p.nodes[i]!.id, p.nodes[j]!.id)!;

describe("tramos de contorno", () => {
  const box = () => rectPiece("Caja", { x: 0, y: 0 }, { x: 20, y: 10 });

  it("mide un lado y la pieza completa", () => {
    const p = box();
    expect(run(p, 0, 1).length).toBeCloseTo(20, 3);
    expect(run(p, 1, 2).length).toBeCloseTo(10, 3);
    expect(run(p, 0, 2).length).toBeCloseTo(30, 3); // dos lados por el camino más corto
  });

  it("toma el camino más corto en una pieza cerrada, en cualquier sentido", () => {
    const p = box();
    expect(run(p, 0, 3).length).toBeCloseTo(10, 3); // el lado que cierra
    expect(run(p, 3, 0).length).toBeCloseTo(10, 3);
    expect(run(p, 1, 0).length).toBeCloseTo(20, 3);
  });

  it("devuelve los segmentos y los puntos del tramo", () => {
    const r = run(box(), 0, 2);
    expect(r.segments).toEqual([0, 1]);
    expect(r.points.length).toBeGreaterThan(2);
    expect(r.points[0]).toEqual({ x: 0, y: 0 });
  });

  it("nodos iguales o inexistentes no dan tramo", () => {
    const p = box();
    expect(contourRun(p, p.nodes[0]!.id, p.nodes[0]!.id)).toBeNull();
    expect(contourRun(p, p.nodes[0]!.id, "no-existe")).toBeNull();
  });

  it("en una pieza abierta solo cuenta el camino directo", () => {
    const p = { ...box(), closed: false };
    expect(run(p, 0, 3).length).toBeCloseTo(20 + 10 + 20, 3);
  });
});

describe("comprobación de costuras", () => {
  function twoBoxes(): { doc: PatternDoc; a: Piece; b: Piece } {
    const a = rectPiece("A", { x: 0, y: 0 }, { x: 20, y: 10 });
    const b = rectPiece("B", { x: 30, y: 0 }, { x: 52, y: 10 });
    return { doc: { pieces: [a, b] } as unknown as PatternDoc, a, b };
  }
  const check = (a: Piece, b: Piece, ease = 0): SeamCheck => ({
    id: "c1", name: "lado", ease,
    a: [{ pieceId: a.id, n1: a.nodes[0]!.id, n2: a.nodes[1]!.id }],  // 20 cm
    b: [{ pieceId: b.id, n1: b.nodes[0]!.id, n2: b.nodes[1]!.id }],  // 22 cm
  });

  it("compara dos lados y calcula la diferencia", () => {
    const { doc, a, b } = twoBoxes();
    const r = seamResult(doc, check(a, b))!;
    expect(r.a).toBeCloseTo(20);
    expect(r.b).toBeCloseTo(22);
    expect(r.diff).toBeCloseTo(2);
    expect(r.ok).toBe(false); // se esperaba que midieran lo mismo
  });

  it("una holgura prevista hace correcta la diferencia", () => {
    const { doc, a, b } = twoBoxes();
    expect(seamResult(doc, check(a, b, 2))!.ok).toBe(true);
    expect(seamResult(doc, check(a, b, 2 + SEAM_TOLERANCE - 0.01))!.ok).toBe(true);
    expect(seamResult(doc, check(a, b, 2 + SEAM_TOLERANCE + 0.1))!.ok).toBe(false);
  });

  it("un lado puede sumar varios tramos (sisa delantera + trasera)", () => {
    const { doc, a, b } = twoBoxes();
    const c: SeamCheck = {
      ...check(a, b),
      a: [
        { pieceId: a.id, n1: a.nodes[0]!.id, n2: a.nodes[1]!.id },
        { pieceId: a.id, n1: a.nodes[1]!.id, n2: a.nodes[2]!.id },
      ],
    };
    expect(sideLength(doc, c.a)).toBeCloseTo(30);
    expect(seamResult(doc, c)!.diff).toBeCloseTo(22 - 30);
  });

  it("si la pieza o el nodo ya no existen, no hay resultado", () => {
    const { doc, a, b } = twoBoxes();
    const c = check(a, b);
    expect(seamResult({ pieces: [b] } as unknown as PatternDoc, c)).toBeNull();
    expect(seamResult(doc, { ...c, a: [{ pieceId: a.id, n1: "x", n2: "y" }] })).toBeNull();
  });
});

// ─── coherencia de las prendas base ──────────────────────────────────────────

/** Puntos de referencia de la mitad derecha de una pieza de tronco: hombro-cuello, punta, fondo de sisa. */
function anchors(p: Piece) {
  const n = p.nodes;
  const minY = Math.min(...n.map((q) => q.at.y));
  const snp = n.findIndex((q) => q.notch && Math.abs(q.at.y - minY) < 0.01 && q.at.x > 0.5);
  let under = -1;
  for (let k = snp + 2; k < n.length; k++) if (n[k]!.notch) { under = k; break; }
  return { snp, tip: snp + 1, under };
}

/** Cabeza de manga por arriba (sisa izquierda → cumbre → sisa derecha). */
function capLength(sleeve: Piece): number {
  const tmp = { ...sleeve, closed: false, nodes: [sleeve.nodes[4]!, sleeve.nodes[0]!, sleeve.nodes[1]!] };
  return contourRun(tmp, sleeve.nodes[4]!.id, sleeve.nodes[1]!.id)!.length;
}

describe("las mangas encajan en la sisa (cabeza = sisa + holgura)", () => {
  // [prenda, holgura prevista]
  const cases: Array<[BlockKind, number]> = [
    ["blusa-clasica", 2.5],
    ["sudadera-capucha", 0],
    ["polo", 0.5],
  ];

  it.each(cases)("%s: en todas las tallas la manga cierra con la sisa", (kind, ease) => {
    const base = docOf(kind);
    for (const size of base.sizes) {
      const doc = gradeDoc(base, size);
      const f = doc.pieces.find((p) => p.name === "Delantero")!;
      const b = doc.pieces.find((p) => p.name === "Espalda")!;
      const s = doc.pieces.find((p) => p.name === "Manga")!;
      const af = anchors(f), ab = anchors(b);
      const armhole = run(f, af.tip, af.under).length + run(b, ab.tip, ab.under).length;
      const diff = capLength(s) - armhole;
      expect(Math.abs(diff - ease), `${kind} talla ${size}: cabeza − sisa = ${diff.toFixed(2)} cm`).toBeLessThanOrEqual(0.9);
    }
  });

  it.each(["camisa-hombre", "camisa-manga-corta"] as const)("%s: la manga cierra con la sisa (canesú + espalda)", (kind) => {
    const base = docOf(kind);
    for (const size of base.sizes) {
      const doc = gradeDoc(base, size);
      const f = doc.pieces.find((p) => p.name === "Delantero")!;
      const yoke = doc.pieces.find((p) => p.name === "Canesú")!;
      const back = doc.pieces.find((p) => p.name === "Espalda")!;
      const s = doc.pieces.find((p) => p.name === "Manga")!;
      const af = anchors(f);
      // canesú: punta → borde inferior; espalda: borde del canesú → fondo de sisa
      const armhole = run(f, af.tip, af.under).length + run(yoke, 2, 3).length + run(back, 1, 3).length;
      const diff = capLength(s) - armhole;
      expect(Math.abs(diff - 2.5), `${kind} talla ${size}: cabeza − sisa = ${diff.toFixed(2)} cm`).toBeLessThanOrEqual(0.9);
    }
  });
});

/** Índice del nodo de mayor x que cumple `pred`. */
function maxXIndex(p: Piece, pred: (n: Piece["nodes"][number]) => boolean): number {
  let k = -1;
  p.nodes.forEach((n, i) => { if (pred(n) && (k < 0 || n.at.x > p.nodes[k]!.at.x)) k = i; });
  return k;
}

describe("chamarra: canesú y paneles (la sisa y el hombro quedan repartidos entre piezas)", () => {
  const parts = (kind: BlockKind, size: string) => {
    const doc = gradeDoc(docOf(kind), size);
    const by = (re: RegExp) => doc.pieces.find((p) => re.test(p.name))!;
    return { yokeF: by(/^Canesú delantero/), sideF: by(/^Delantero costado/), yokeB: by(/^Canesú espalda/), lowB: by(/^Espalda$/), sleeve: by(/^Manga$/) };
  };
  const maxY = (p: Piece) => Math.max(...p.nodes.map((n) => n.at.y));
  const minY = (p: Piece) => Math.min(...p.nodes.map((n) => n.at.y));

  it("la manga cierra con la sisa (canesú + panel del costado + canesú y espalda de atrás)", () => {
    for (const size of docOf("chamarra-mezclilla").sizes) {
      const { yokeF, sideF, yokeB, lowB, sleeve } = parts("chamarra-mezclilla", size);
      const tipF = maxXIndex(yokeF, () => true);
      const cutF = maxXIndex(yokeF, (n) => n.notch && Math.abs(n.at.y - maxY(yokeF)) < 1e-6);
      const topS = maxXIndex(sideF, (n) => n.notch && Math.abs(n.at.y - minY(sideF)) < 1e-6);
      const underF = maxXIndex(sideF, (n) => n.notch);
      const tipB = maxXIndex(yokeB, () => true);
      const cutB = maxXIndex(yokeB, (n) => n.notch && Math.abs(n.at.y - maxY(yokeB)) < 1e-6);
      const topB = maxXIndex(lowB, (n) => n.notch && Math.abs(n.at.y - minY(lowB)) < 1e-6);
      const underB = maxXIndex(lowB, (n) => n.notch);
      const armhole = run(yokeF, tipF, cutF).length + run(sideF, topS, underF).length + run(yokeB, tipB, cutB).length + run(lowB, topB, underB).length;
      const diff = capLength(sleeve) - armhole;
      expect(Math.abs(diff - 3), `talla ${size}: cabeza − sisa = ${diff.toFixed(2)} cm`).toBeLessThanOrEqual(0.9);
    }
  });

  it("el hombro del delantero mide lo mismo que el de la espalda", () => {
    for (const size of docOf("chamarra-mezclilla").sizes) {
      const { yokeF, yokeB } = parts("chamarra-mezclilla", size);
      const snpF = maxXIndex(yokeF, (n) => n.notch && Math.abs(n.at.y - minY(yokeF)) < 0.01);
      const tipF = maxXIndex(yokeF, () => true);
      const snpB = maxXIndex(yokeB, (n) => n.notch && Math.abs(n.at.y - minY(yokeB)) < 0.01);
      const tipB = maxXIndex(yokeB, () => true);
      const diff = run(yokeB, snpB, tipB).length - run(yokeF, snpF, tipF).length;
      expect(Math.abs(diff), `talla ${size}: hombro espalda − delantero`).toBeLessThanOrEqual(0.6);
    }
  });
});

describe("el hombro del delantero mide lo mismo que el de la espalda", () => {
  it.each(["blusa-clasica", "sudadera-capucha", "polo"] as const)("%s", (kind) => {
    const base = docOf(kind);
    for (const size of base.sizes) {
      const doc = gradeDoc(base, size);
      const f = doc.pieces.find((p) => p.name === "Delantero")!;
      const b = doc.pieces.find((p) => p.name === "Espalda")!;
      const af = anchors(f), ab = anchors(b);
      const diff = run(b, ab.snp, ab.tip).length - run(f, af.snp, af.tip).length;
      expect(Math.abs(diff), `${kind} talla ${size}: hombro espalda − delantero`).toBeLessThanOrEqual(0.6);
    }
  });
});

describe("todas las prendas con manga conservan una forma razonable", () => {
  it.each(BLOCK_CATALOG.filter((b) => ["blusa-clasica", "chamarra-mezclilla", "sudadera-capucha", "polo", "camisa-hombre", "camisa-manga-corta"].includes(b.kind)).map((b) => [b.kind] as const))(
    "%s: la cabeza de manga nunca es más alta que la propia manga",
    (kind) => {
      const base = docOf(kind);
      for (const size of base.sizes) {
        const s = gradeDoc(base, size).pieces.find((p) => p.name === "Manga")!;
        const top = s.nodes[0]!.at.y;
        const capH = s.nodes[1]!.at.y - top;
        const len = s.nodes[2]!.at.y - top;
        expect(capH, `${kind} ${size}`).toBeGreaterThan(0);
        expect(capH, `${kind} ${size}: cabeza ${capH.toFixed(1)} vs manga ${len.toFixed(1)}`).toBeLessThan(len);
      }
    },
  );
});

// ─── flujo del editor ────────────────────────────────────────────────────────

import { beforeEach } from "vitest";
import { useEditor } from "../apps/web/app/studio/store";

describe("verificar costuras en el editor", () => {
  const get = () => useEditor.getState();
  const pcs = () => get().history.present.pieces;
  const piece = (n: string) => pcs().find((p) => p.name === n)!;

  beforeEach(() => {
    get().loadDoc(draftBlock("blusa-clasica", defaultMeasurementsFor("blusa-clasica")), "t1");
    get().setDraft(null);
    get().setNotice(null);
    useEditor.setState({ activeSeam: null });
  });

  /** hombro del delantero (lado A) contra hombro de la espalda (lado B) */
  function pickShoulders() {
    const f = piece("Delantero"), b = piece("Espalda");
    const af = anchors(f), ab = anchors(b);
    get().seamPick(f.id, f.nodes[af.snp]!.id);
    get().seamPick(f.id, f.nodes[af.tip]!.id);
    get().seamSide("b");
    get().seamPick(b.id, b.nodes[ab.snp]!.id);
    get().seamPick(b.id, b.nodes[ab.tip]!.id);
  }

  it("elige tramos con dos clics y crea la comparación", () => {
    pickShoulders();
    expect(get().draft).toMatchObject({ kind: "seam" });
    expect(get().draft!.kind === "seam" && get().draft!.a).toHaveLength(1);
    expect(get().seamCreate()).toBe(true);
    const checks = get().history.present.seamChecks!;
    expect(checks).toHaveLength(1);
    expect(get().activeSeam).toBe(checks[0]!.id);
    expect(get().draft).toBeNull();
    const r = seamResult(get().history.present, checks[0]!)!;
    expect(r.ok).toBe(true); // los hombros coinciden dentro de la tolerancia
  });

  it("los dos puntos de un tramo deben estar en la misma pieza y ser distintos", () => {
    const f = piece("Delantero"), b = piece("Espalda");
    get().seamPick(f.id, f.nodes[1]!.id);
    get().seamPick(b.id, b.nodes[1]!.id);
    expect(get().notice).toMatch(/misma pieza/);
    get().seamPick(f.id, f.nodes[1]!.id);
    expect(get().notice).toMatch(/distinto/);
  });

  it("no se crea sin tramos en los dos lados", () => {
    const f = piece("Delantero");
    get().seamPick(f.id, f.nodes[1]!.id);
    get().seamPick(f.id, f.nodes[2]!.id);
    expect(get().seamCreate()).toBe(false);
    expect(get().notice).toMatch(/lado A y uno en el lado B/);
    expect(get().history.present.seamChecks).toBeUndefined();
  });

  it("la comprobación sobrevive a cambiar las medidas (se ubica por nombre de pieza)", () => {
    pickShoulders();
    get().seamCreate();
    const before = get().history.present.seamChecks![0]!;
    get().applyMeasurements({ ...get().measurements, busto: 104 });
    const doc = get().history.present;
    expect(doc.seamChecks).toHaveLength(1);
    expect(doc.pieces.find((p) => p.id === before.a[0]!.pieceId)).toBeUndefined(); // los ids cambiaron
    expect(seamResult(doc, doc.seamChecks![0]!)).not.toBeNull();
  });

  it("muestra el resultado de cada talla y los hombros coinciden en todas", () => {
    pickShoulders();
    get().seamCreate();
    const doc = get().history.present;
    for (const size of doc.sizes) {
      const r = seamResult(gradeDoc(doc, size), doc.seamChecks![0]!)!;
      expect(r.ok, `talla ${size}: B − A = ${r.diff.toFixed(2)}`).toBe(true);
    }
  });

  it("editar la holgura, renombrar, borrar y deshacer", () => {
    pickShoulders();
    get().seamCreate();
    const id = get().history.present.seamChecks![0]!.id;
    get().patchSeamCheck(id, { ease: 2, name: "Hombro" });
    expect(get().history.present.seamChecks![0]).toMatchObject({ ease: 2, name: "Hombro" });
    expect(seamResult(get().history.present, get().history.present.seamChecks![0]!)!.ok).toBe(false);
    get().deleteSeamCheck(id);
    expect(get().history.present.seamChecks).toEqual([]);
    expect(get().activeSeam).toBeNull();
    get().undo();
    expect(get().history.present.seamChecks).toHaveLength(1);
  });

  it("una sisa (delantero + espalda) contra la cabeza de manga da la holgura prevista", () => {
    const f = piece("Delantero"), b = piece("Espalda"), s = piece("Manga");
    const af = anchors(f), ab = anchors(b);
    get().seamPick(f.id, f.nodes[af.tip]!.id);
    get().seamPick(f.id, f.nodes[af.under]!.id);
    get().seamPick(b.id, b.nodes[ab.tip]!.id);
    get().seamPick(b.id, b.nodes[ab.under]!.id);
    get().seamSide("b");
    // la cabeza va por arriba: de la sisa izquierda a la derecha de la manga
    get().seamPick(s.id, s.nodes[4]!.id);
    get().seamPick(s.id, s.nodes[1]!.id);
    get().seamCreate();
    const doc = get().history.present;
    const check = doc.seamChecks![0]!;
    const r = seamResult(doc, check)!;
    // se midió el camino más corto de la manga; para la cabeza basta con que sea la holgura prevista ± 0.9
    expect(r.a).toBeGreaterThan(30);
    expect(Math.abs(r.diff - 2.5)).toBeLessThanOrEqual(0.9);
  });
});
