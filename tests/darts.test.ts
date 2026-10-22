import { beforeEach, describe, expect, it } from "vitest";
import {
  addDart,
  area,
  ellipsePiece,
  gradeDoc,
  insertNodeOnSegment,
  offsetPolyline,
  rectPiece,
  samplePath,
  setNodeGrade,
  type PatternDoc,
} from "@hilonova/geometry";
import { defaultMeasurementsFor, draftBlock } from "@hilonova/blocks";
import { exportDxfGraded } from "@hilonova/export";
import { useEditor } from "../apps/web/app/studio/store";
import { parseDxf, polyArea } from "./helpers";

const get = () => useEditor.getState();

describe("pinza: motor", () => {
  const rect = () => rectPiece("Caja", { x: 0, y: 0 }, { x: 20, y: 10 }); // 200 cm²
  // el borde inferior es el segmento 2 (de (20,10) a (0,10))

  it("abre una V en el contorno: +3 nodos y el área baja lo que mide el triángulo", () => {
    const d = addDart(rect(), 2, 0.5, 2, { x: 10, y: 3 })!;
    expect(d).not.toBeNull();
    expect(d.nodes).toHaveLength(7);
    // triángulo de boca 2 cm y alto 7 cm = 7 cm²
    expect(area(d)).toBeCloseTo(200 - 7, 3);
  });

  it("la boca mide exactamente el ancho pedido y la punta queda donde se indicó", () => {
    const d = addDart(rect(), 2, 0.5, 3, { x: 10, y: 2 })!;
    const [A, tip, B] = [d.nodes[3]!, d.nodes[4]!, d.nodes[5]!];
    expect(Math.hypot(A.at.x - B.at.x, A.at.y - B.at.y)).toBeCloseTo(3, 3);
    expect(tip.at).toEqual({ x: 10, y: 2 });
    expect(A.at.y).toBeCloseTo(10, 5);
    expect(B.at.y).toBeCloseTo(10, 5);
  });

  it("la pinza queda centrada en el punto pedido", () => {
    const d = addDart(rect(), 2, 0.25, 2, { x: 15, y: 4 })!; // t=0.25 desde (20,10) → x=15
    const mid = (d.nodes[3]!.at.x + d.nodes[5]!.at.x) / 2;
    expect(mid).toBeCloseTo(15, 3);
  });

  it("no se puede si la boca no cabe en el tramo", () => {
    expect(addDart(rect(), 2, 0.5, 25, { x: 10, y: 3 })).toBeNull();
    expect(addDart(rect(), 2, 0.03, 2, { x: 10, y: 3 })).toBeNull(); // pegada a la esquina
    expect(addDart(rect(), 2, 0.5, 0, { x: 10, y: 3 })).toBeNull();
  });

  it("funciona sobre una curva y quita material", () => {
    const e = ellipsePiece("E", { x: 0, y: 0 }, 12, 8);
    const d = addDart(e, 1, 0.5, 2, { x: 4, y: 0 });
    expect(d).not.toBeNull();
    expect(area(d!)).toBeLessThan(area(e));
  });

  it("el margen de costura de una pieza con pinza sigue saliendo hacia afuera", () => {
    const d = addDart(rect(), 2, 0.5, 2, { x: 10, y: 3 })!;
    const line = samplePath(d, 12);
    const seam = offsetPolyline(line, 1, true);
    expect(polyArea(seam)).toBeGreaterThan(polyArea(line));
  });

  it("los nodos nuevos heredan una regla de graduación interpolada", () => {
    let doc = { pieces: [rect()] } as unknown as PatternDoc;
    const p = doc.pieces[0]!;
    // nodos del borde inferior: el 2 (20,10) y el 3 (0,10)
    doc = setNodeGrade(doc, p.id, p.nodes[2]!.id, { dx: 2, dy: 0 });
    doc = setNodeGrade(doc, p.id, p.nodes[3]!.id, { dx: 0, dy: 0 });
    const withGrades = doc.pieces[0]!;
    const d = addDart(withGrades, 2, 0.5, 2, { x: 10, y: 3 })!;
    const gA = d.nodes[3]!.grade!, gB = d.nodes[5]!.grade!, gTip = d.nodes[4]!.grade!;
    expect(gA.dx).toBeGreaterThan(gB.dx); // A está más cerca del nodo con regla 2
    expect(gA.dx).toBeLessThan(2);
    expect(gTip.dx).toBeCloseTo((gA.dx + gB.dx) / 2, 6);
  });

  it("insertar un nodo normal también hereda la regla de graduación", () => {
    let doc = { pieces: [rect()] } as unknown as PatternDoc;
    const p = doc.pieces[0]!;
    doc = setNodeGrade(doc, p.id, p.nodes[0]!.id, { dx: 0, dy: 0 });
    doc = setNodeGrade(doc, p.id, p.nodes[1]!.id, { dx: 4, dy: 2 });
    const { piece, nodeId } = insertNodeOnSegment(doc.pieces[0]!, 0, 0.5);
    expect(piece.nodes.find((n) => n.id === nodeId)!.grade).toEqual({ dx: 2, dy: 1 });
  });
});

describe("pinza: editor", () => {
  beforeEach(() => {
    get().loadDoc(draftBlock("blusa-clasica", defaultMeasurementsFor("blusa-clasica")), "t1");
    get().setDartWidth(2.5);
  });
  const front = () => get().history.present.pieces.find((p) => p.name === "Delantero")!;

  it("abre la pinza, la deshace y limita el ancho", () => {
    const f = front();
    const n = f.nodes.length;
    // borde inferior del delantero: el último segmento (cierre en el CF) es largo; se usa el del bajo
    const last = f.nodes.length - 2;
    const ok = get().addDartAt(f.id, last, 0.5, { x: f.nodes[last]!.at.x - 8, y: f.nodes[last]!.at.y - 10 });
    expect(ok).toBe(true);
    expect(front().nodes).toHaveLength(n + 3);
    get().undo();
    expect(front().nodes).toHaveLength(n);
    get().setDartWidth(99);
    expect(get().dartWidth).toBe(12);
    get().setDartWidth(0);
    expect(get().dartWidth).toBe(0.5);
  });

  it("devuelve false si la pinza es demasiado ancha para el tramo", () => {
    const f = front();
    get().setDartWidth(12);
    const shortSeg = f.nodes.findIndex((_, i) => {
      const a = f.nodes[i]!.at, b = f.nodes[(i + 1) % f.nodes.length]!.at;
      return Math.hypot(a.x - b.x, a.y - b.y) < 5;
    });
    if (shortSeg >= 0) expect(get().addDartAt(f.id, shortSeg, 0.5, f.nodes[0]!.at)).toBe(false);
  });

  it("cambiar de herramienta cancela la pinza en curso y limpia el aviso", () => {
    get().setNotice("algo");
    get().setDraft({ kind: "dart", pieceId: "x", segIndex: 0, t: 0.5, base: { x: 0, y: 0 }, dir: { x: 1, y: 0 } });
    get().setTool("select");
    expect(get().draft).toBeNull();
    expect(get().notice).toBeNull();
  });
});

describe("pinza: graduación y exportación", () => {
  function docWithDart(): PatternDoc {
    const doc = draftBlock("blusa-clasica", defaultMeasurementsFor("blusa-clasica"));
    const f = doc.pieces.find((p) => p.name === "Delantero")!;
    const seg = f.nodes.length - 2; // bajo
    const a = f.nodes[seg]!.at;
    const d = addDart(f, seg, 0.5, 2.5, { x: a.x - 6, y: a.y - 12 })!;
    doc.pieces = doc.pieces.map((p) => (p.id === f.id ? d : p));
    return doc;
  }

  it("la pieza con pinza sigue creciendo de talla en talla", () => {
    const doc = docWithDart();
    const areas = ["S", "M", "L", "XL"].map((s) => area(gradeDoc(doc, s).pieces.find((p) => p.name === "Delantero")!));
    for (let i = 1; i < areas.length; i++) expect(areas[i]!).toBeGreaterThan(areas[i - 1]!);
  });

  it("el DXF graduado con pinza es válido y mantiene el margen por fuera", () => {
    const d = parseDxf(exportDxfGraded(docWithDart()));
    expect(d.endsWithEof).toBe(true);
    const boundaries = d.polys.filter((p) => p.layer === "1_Boundary");
    const seams = d.polys.filter((p) => p.layer === "15_SeamAllowance");
    expect(seams).toHaveLength(boundaries.length);
    boundaries.forEach((b, i) => expect(polyArea(seams[i]!.pts)).toBeGreaterThan(polyArea(b.pts)));
  });
});
