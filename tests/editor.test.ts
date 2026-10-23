import { beforeEach, describe, expect, it } from "vitest";
import { area, bounds, pieceCenter } from "@hilonova/geometry";
import { defaultMeasurementsFor, draftBlock } from "@hilonova/blocks";
import { selectionOf, useEditor } from "../apps/web/app/studio/store";

const get = () => useEditor.getState();

beforeEach(() => {
  get().loadDoc(draftBlock("blusa-clasica", defaultMeasurementsFor("blusa-clasica")), "t1");
  useEditor.setState({ clipboard: [], pasteCount: 0 });
});

const pieces = () => get().history.present.pieces;
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

describe("selección múltiple", () => {
  it("seleccionar todas, alternar con Ctrl y limpiar", () => {
    get().selectAllPieces();
    const total = pieces().length;
    expect(selectionOf(get())).toHaveLength(total);
    const first = pieces()[0]!.id;
    get().toggleSelectPiece(first);
    expect(selectionOf(get())).toHaveLength(total - 1);
    expect(selectionOf(get())).not.toContain(first);
    get().toggleSelectPiece(first);
    expect(selectionOf(get())).toContain(first);
    get().clearSelection();
    expect(selectionOf(get())).toEqual([]);
  });

  it("seleccionar una pieza suelta descarta la selección múltiple", () => {
    get().selectAllPieces();
    get().selectPiece(pieces()[2]!.id);
    expect(selectionOf(get())).toEqual([pieces()[2]!.id]);
  });

  it("arrastrar mueve todas las piezas seleccionadas y solo ellas", () => {
    const [a, b, c] = pieces();
    const before = pieces().map((p) => p.nodes[0]!.at);
    get().selectPieces([a!.id, b!.id]);
    get().beginDrag();
    get().moveSelectedPieceBy(5, -3);
    const after = pieces().map((p) => p.nodes[0]!.at);
    expect(after[0]!.x).toBeCloseTo(before[0]!.x + 5);
    expect(after[1]!.y).toBeCloseTo(before[1]!.y - 3);
    expect(after[2]).toEqual(before[2]); // la tercera no se movió
    void c;
    get().undo();
    expect(pieces()[0]!.nodes[0]!.at).toEqual(before[0]);
  });
});

describe("rotar", () => {
  it("una pieza rota a un ángulo libre conservando su área y sumando al hilo", () => {
    const p = pieces()[0]!;
    const a0 = area(p);
    get().selectPiece(p.id);
    get().rotateSelected(30);
    const r = pieces()[0]!;
    expect(area(r)).toBeCloseTo(a0, 1);
    expect(r.grainAngle).toBeCloseTo(30);
    get().rotateSelected(-30);
    expect(pieces()[0]!.grainAngle).toBeCloseTo(0);
  });

  it("un grupo gira como un cuerpo rígido: las distancias entre piezas no cambian", () => {
    const [a, b] = pieces();
    const d0 = dist(pieceCenter(a!), pieceCenter(b!));
    get().selectPieces([a!.id, b!.id]);
    get().rotateSelected(37);
    const [ra, rb] = pieces();
    expect(dist(pieceCenter(ra!), pieceCenter(rb!))).toBeCloseTo(d0, 0);
    expect(area(ra!)).toBeCloseTo(area(a!), 1);
    expect(area(rb!)).toBeCloseTo(area(b!), 1);
  });

  it("una vuelta completa en pasos deja la pieza donde estaba", () => {
    const p = pieces()[1]!;
    const b0 = bounds(p);
    get().selectPiece(p.id);
    for (let i = 0; i < 12; i++) get().rotateSelected(30);
    const b1 = bounds(pieces()[1]!);
    expect(b1.minX).toBeCloseTo(b0.minX, 0);
    expect(b1.maxY).toBeCloseTo(b0.maxY, 0);
  });
});

describe("copiar, pegar, duplicar y borrar", () => {
  it("copiar y pegar agrega copias con ids nuevos, desplazadas", () => {
    const n = pieces().length;
    const orig = pieces()[0]!;
    get().selectPieces([pieces()[0]!.id, pieces()[1]!.id]);
    get().copySelected();
    expect(get().clipboard).toHaveLength(2);
    get().pasteClipboard();
    expect(pieces()).toHaveLength(n + 2);
    const pasted = pieces().slice(-2);
    expect(pasted[0]!.id).not.toBe(orig.id);
    expect(pasted[0]!.nodes[0]!.id).not.toBe(orig.nodes[0]!.id);
    expect(pasted[0]!.nodes[0]!.at.x).toBeCloseTo(orig.nodes[0]!.at.x + 6);
    expect(selectionOf(get())).toEqual(pasted.map((p) => p.id));
    get().pasteClipboard(); // la segunda copia se desplaza más
    expect(pieces().slice(-2)[0]!.nodes[0]!.at.x).toBeCloseTo(orig.nodes[0]!.at.x + 12);
  });

  it("pegar con el portapapeles vacío no hace nada", () => {
    const n = pieces().length;
    get().pasteClipboard();
    expect(pieces()).toHaveLength(n);
  });

  it("el portapapeles sobrevive al abrir otro proyecto", () => {
    get().selectPiece(pieces()[0]!.id);
    get().copySelected();
    get().loadDoc(draftBlock("short", defaultMeasurementsFor("short")), "t2");
    const n = pieces().length;
    get().pasteClipboard();
    expect(pieces()).toHaveLength(n + 1);
  });

  it("duplicar un grupo coloca las copias al lado, sin empalmarse", () => {
    const n = pieces().length;
    get().selectPieces([pieces()[0]!.id, pieces()[1]!.id]);
    get().duplicateSelected();
    expect(pieces()).toHaveLength(n + 2);
    const copy = pieces()[n]!;
    expect(bounds(copy).minX).toBeGreaterThan(bounds(pieces()[1]!).maxX);
  });

  it("borrar elimina todas las seleccionadas y deshacer las devuelve", () => {
    const n = pieces().length;
    get().selectPieces([pieces()[0]!.id, pieces()[3]!.id, pieces()[4]!.id]);
    get().deleteSelection();
    expect(pieces()).toHaveLength(n - 3);
    expect(selectionOf(get())).toEqual([]);
    get().undo();
    expect(pieces()).toHaveLength(n);
  });

  it("espejar un grupo espeja cada pieza sin cambiar su área", () => {
    const ids = [pieces()[0]!.id, pieces()[2]!.id];
    const areas = [area(pieces()[0]!), area(pieces()[2]!)];
    get().selectPieces(ids);
    get().mirrorSelected();
    expect(area(pieces()[0]!)).toBeCloseTo(areas[0]!, 1);
    expect(area(pieces()[2]!)).toBeCloseTo(areas[1]!, 1);
  });
});
