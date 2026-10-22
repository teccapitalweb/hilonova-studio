import { describe, expect, it } from "vitest";
import {
  area,
  compareSizes,
  emptyDoc,
  emptyPiece,
  gradeDoc,
  insertNodeOnSegment,
  mirrorPiece,
  node,
  offsetPolyline,
  pieceFromPoints,
  rectPiece,
  rotatePiece,
  samplePath,
  setNodeGrade,
  sizeSteps,
  bounds,
} from "@hilonova/geometry";
import { bbox, distToPoly, polyArea } from "./helpers";

const square = [
  { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 },
];
const reversed = [...square].reverse();

describe("offsetPolyline (margen de costura)", () => {
  it("el margen positivo va siempre hacia afuera, sin importar el sentido de dibujo", () => {
    for (const pts of [square, reversed]) {
      const out = offsetPolyline(pts, 1, true);
      const b = bbox(out);
      expect(b.maxX - b.minX).toBeCloseTo(12, 5);
      expect(b.maxY - b.minY).toBeCloseTo(12, 5);
      expect(polyArea(out)).toBeGreaterThan(polyArea(pts));
    }
  });

  it("un contorno que repite el primer punto al cerrar no genera picos", () => {
    const closedTwice = [...square, square[0]!];
    const out = offsetPolyline(closedTwice, 1, true);
    for (const p of out) expect(distToPoly(p, square)).toBeLessThan(1.5);
    expect(bbox(out).maxY - bbox(out).minY).toBeCloseTo(12, 5);
  });

  it("puntos repetidos en medio del contorno tampoco descontrolan el margen", () => {
    const withDup = [square[0]!, square[1]!, square[1]!, square[2]!, square[3]!];
    const out = offsetPolyline(withDup, 1, true);
    for (const p of out) expect(distToPoly(p, square)).toBeLessThan(1.5);
  });

  it("distancia cero devuelve el mismo contorno", () => {
    expect(offsetPolyline(square, 0, true)).toEqual(square);
  });
});

describe("tallas", () => {
  it("cuenta los pasos de graduación en escalas de letras y de números", () => {
    expect(sizeSteps("M", "M")).toBe(0);
    expect(sizeSteps("L", "M")).toBe(1);
    expect(sizeSteps("XL", "M")).toBe(2);
    expect(sizeSteps("S", "M")).toBe(-1);
    expect(sizeSteps("34", "32")).toBe(1);
    expect(sizeSteps("28", "32")).toBe(-2);
  });

  it("ordena las tallas de menor a mayor", () => {
    expect(["XL", "S", "L", "M"].sort(compareSizes)).toEqual(["S", "M", "L", "XL"]);
    expect(["34", "28", "32", "30"].sort(compareSizes)).toEqual(["28", "30", "32", "34"]);
  });
});

describe("graduación por reglas de nodo", () => {
  function doc() {
    const d = emptyDoc("prueba");
    d.sizes = ["S", "M", "L", "XL"];
    d.baseSize = "M";
    const p = pieceFromPoints("Caja", square, { closed: true, smooth: false });
    d.pieces = [p];
    return d;
  }

  it("la talla base se devuelve tal cual", () => {
    const d = doc();
    expect(gradeDoc(d, "M")).toBe(d);
  });

  it("cada nodo se mueve pasos × regla", () => {
    let d = doc();
    const p = d.pieces[0]!;
    d = setNodeGrade(d, p.id, p.nodes[1]!.id, { dx: 2, dy: -1 });
    const base = d.pieces[0]!.nodes[1]!.at;
    const xl = gradeDoc(d, "XL").pieces[0]!.nodes[1]!.at;
    const s = gradeDoc(d, "S").pieces[0]!.nodes[1]!.at;
    expect(xl.x).toBeCloseTo(base.x + 4);
    expect(xl.y).toBeCloseTo(base.y - 2);
    expect(s.x).toBeCloseTo(base.x - 2);
    expect(s.y).toBeCloseTo(base.y + 1);
  });

  it("los nodos sin regla no se mueven", () => {
    let d = doc();
    const p = d.pieces[0]!;
    d = setNodeGrade(d, p.id, p.nodes[1]!.id, { dx: 2, dy: 0 });
    const graded = gradeDoc(d, "XL").pieces[0]!;
    expect(graded.nodes[0]!.at).toEqual(d.pieces[0]!.nodes[0]!.at);
  });

  it("una regla en cero se elimina", () => {
    let d = doc();
    const p = d.pieces[0]!;
    d = setNodeGrade(d, p.id, p.nodes[1]!.id, { dx: 2, dy: 0 });
    d = setNodeGrade(d, p.id, p.nodes[1]!.id, { dx: 0, dy: 0 });
    expect(d.pieces[0]!.nodes[1]!.grade).toBeUndefined();
  });
});

describe("edición de piezas", () => {
  it("espejar dos veces devuelve la pieza original", () => {
    const p = pieceFromPoints("P", [{ x: 0, y: 0 }, { x: 8, y: 1 }, { x: 5, y: 9 }], { closed: true, smooth: false });
    const twice = mirrorPiece(mirrorPiece(p));
    const a = bounds(p), b = bounds(twice);
    expect(b.minX).toBeCloseTo(a.minX);
    expect(b.maxX).toBeCloseTo(a.maxX);
    expect(area(twice)).toBeCloseTo(area(p));
  });

  it("espejar conserva el área", () => {
    const p = pieceFromPoints("P", [{ x: 0, y: 0 }, { x: 8, y: 1 }, { x: 5, y: 9 }], { closed: true, smooth: true });
    expect(area(mirrorPiece(p))).toBeCloseTo(area(p), 3);
  });

  it("rotar conserva el área y 360° vuelve a la forma original", () => {
    const p = rectPiece("R", { x: 0, y: 0 }, { x: 10, y: 4 });
    const r = rotatePiece(p, 90);
    expect(area(r)).toBeCloseTo(40, 3);
    const b = bounds(r);
    expect(b.maxX - b.minX).toBeCloseTo(4, 3);
    expect(b.maxY - b.minY).toBeCloseTo(10, 3);
    const full = rotatePiece(rotatePiece(rotatePiece(rotatePiece(p, 90), 90), 90), 90);
    expect(area(full)).toBeCloseTo(40, 3);
    expect(full.grainAngle).toBeCloseTo(0);
  });

  it("insertar un nodo en un segmento recto no cambia la forma", () => {
    const p = rectPiece("R", { x: 0, y: 0 }, { x: 10, y: 4 });
    const { piece, nodeId } = insertNodeOnSegment(p, 0, 0.5);
    expect(piece.nodes).toHaveLength(5);
    expect(piece.nodes.find((n) => n.id === nodeId)!.at).toEqual({ x: 5, y: 0 });
    expect(area(piece)).toBeCloseTo(40, 5);
  });

  it("insertar un nodo en una curva conserva la forma (división de Bézier)", () => {
    const p = emptyPiece("C");
    p.nodes = [
      node({ x: 0, y: 0 }, { handleOut: { x: 3, y: -4 } }),
      node({ x: 10, y: 0 }, { handleIn: { x: -3, y: -4 } }),
      node({ x: 5, y: 8 }),
    ];
    const before = samplePath(p, 60);
    const { piece } = insertNodeOnSegment(p, 0, 0.4);
    expect(piece.nodes).toHaveLength(4);
    expect(area(piece)).toBeCloseTo(area(p), 1);
    for (const q of samplePath(piece, 30)) expect(distToPoly(q, before)).toBeLessThan(0.2);
  });
});
