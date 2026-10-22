import { beforeEach, describe, expect, it } from "vitest";
import {
  addLabelToPiece,
  labelPosition,
  mirrorPiece,
  removeLabel,
  rotatePiece,
  translatePiece,
  updateLabel,
  clonePiece,
  rectPiece,
} from "@hilonova/geometry";
import { exportDxfAama, exportDxfGraded, exportSvg } from "@hilonova/export";
import { defaultMeasurementsFor, draftBlock } from "@hilonova/blocks";
import { useEditor } from "../apps/web/app/studio/store";
import { parseDxf } from "./helpers";

const get = () => useEditor.getState();
const near = (a: { x: number; y: number }, b: { x: number; y: number }, d = 1e-6) => {
  expect(a.x).toBeCloseTo(b.x, 4 - Math.log10(1 / d) + 4);
  expect(a.y).toBeCloseTo(b.y, 4);
};

describe("textos pegados a la pieza (motor)", () => {
  const base = () => rectPiece("Caja", { x: 0, y: 0 }, { x: 20, y: 10 });

  it("agregar un texto lo deja en la posición pedida", () => {
    const { piece, labelId } = addLabelToPiece(base(), { x: 5, y: 4 }, "Pinza aquí", 1.2);
    const l = piece.labels!.find((x) => x.id === labelId)!;
    expect(l.text).toBe("Pinza aquí");
    near(labelPosition(piece, l), { x: 5, y: 4 });
  });

  it("mover la pieza lleva el texto", () => {
    const { piece, labelId } = addLabelToPiece(base(), { x: 5, y: 4 });
    const moved = translatePiece(piece, 10, -3);
    const l = moved.labels!.find((x) => x.id === labelId)!;
    near(labelPosition(moved, l), { x: 15, y: 1 });
  });

  it("rotar la pieza 90° gira también la posición del texto (alrededor del centro)", () => {
    const { piece, labelId } = addLabelToPiece(base(), { x: 15, y: 5 }); // a la derecha del centro (10,5)
    const r = rotatePiece(piece, 90);
    const l = r.labels!.find((x) => x.id === labelId)!;
    near(labelPosition(r, l), { x: 10, y: 10 }); // 90° horario: de la derecha pasa a abajo
  });

  it("espejar la pieza espeja la posición del texto", () => {
    const { piece, labelId } = addLabelToPiece(base(), { x: 15, y: 5 });
    const m = mirrorPiece(piece);
    const l = m.labels!.find((x) => x.id === labelId)!;
    near(labelPosition(m, l), { x: 5, y: 5 });
  });

  it("espejar dos veces devuelve el texto a su sitio", () => {
    const { piece, labelId } = addLabelToPiece(base(), { x: 13, y: 3 });
    const twice = mirrorPiece(mirrorPiece(piece));
    near(labelPosition(twice, twice.labels!.find((x) => x.id === labelId)!), { x: 13, y: 3 });
  });

  it("editar y borrar textos", () => {
    const { piece, labelId } = addLabelToPiece(base(), { x: 1, y: 1 });
    const edited = updateLabel(piece, labelId, { text: "Nuevo", size: 2 });
    expect(edited.labels![0]!).toMatchObject({ text: "Nuevo", size: 2 });
    const gone = removeLabel(edited, labelId);
    expect(gone.labels).toBeUndefined();
  });

  it("clonar una pieza clona sus textos con ids nuevos", () => {
    const { piece } = addLabelToPiece(base(), { x: 1, y: 1 });
    const c = clonePiece(piece);
    expect(c.labels).toHaveLength(1);
    expect(c.labels![0]!.id).not.toBe(piece.labels![0]!.id);
    expect(c.labels![0]!.text).toBe(piece.labels![0]!.text);
  });
});

describe("textos en el editor", () => {
  beforeEach(() => {
    get().loadDoc(draftBlock("blusa-clasica", defaultMeasurementsFor("blusa-clasica")), "t1");
  });
  const pieces = () => get().history.present.pieces;

  it("agregar, editar, mover y borrar con deshacer", () => {
    const p = pieces()[0]!;
    get().addLabelAt(p.id, { x: p.nodes[0]!.at.x + 3, y: p.nodes[0]!.at.y + 8 });
    expect(pieces()[0]!.labels).toHaveLength(1);
    expect(get().selectedLabel).not.toBeNull();
    expect(get().tool).toBe("select");

    get().patchSelectedLabel({ text: "Doblez aquí", size: 2 });
    expect(pieces()[0]!.labels![0]!).toMatchObject({ text: "Doblez aquí", size: 2 });

    get().beginDrag();
    get().moveSelectedLabelTo({ x: 40, y: 22 });
    near(labelPosition(pieces()[0]!, pieces()[0]!.labels![0]!), { x: 40, y: 22 });

    get().deleteSelectedLabel();
    expect(pieces()[0]!.labels).toBeUndefined();
    get().undo();
    expect(pieces()[0]!.labels).toHaveLength(1);
  });

  it("seleccionar una pieza descarta el texto seleccionado", () => {
    const p = pieces()[0]!;
    get().addLabelAt(p.id, p.nodes[0]!.at);
    expect(get().selectedLabel).not.toBeNull();
    get().selectPiece(p.id);
    expect(get().selectedLabel).toBeNull();
  });

  it("el texto sobrevive a copiar y pegar la pieza", () => {
    const p = pieces()[1]!;
    get().addLabelAt(p.id, p.nodes[0]!.at);
    get().selectPiece(p.id);
    get().copySelected();
    get().pasteClipboard();
    const pasted = pieces().at(-1)!;
    expect(pasted.labels).toHaveLength(1);
    expect(pasted.labels![0]!.id).not.toBe(pieces()[1]!.labels![0]!.id);
  });
});

describe("textos en los archivos exportados", () => {
  function docWithLabel() {
    const doc = draftBlock("blusa-clasica", defaultMeasurementsFor("blusa-clasica"));
    const p = doc.pieces[0]!;
    const { piece } = addLabelToPiece(p, { x: p.nodes[0]!.at.x + 4, y: p.nodes[0]!.at.y + 10 }, "Doblez aquí", 1.4);
    doc.pieces = [piece, ...doc.pieces.slice(1)];
    return doc;
  }

  it("el DXF lleva el texto en ASCII y en la capa de texto", () => {
    const d = parseDxf(exportDxfAama(docWithLabel()));
    expect(d.texts).toContain("Doblez aqui");
    const ent = d.entities.find((e) => e.type === "TEXT" && e.data.some(([, v]) => v === "Doblez aqui"))!;
    expect(ent.layer).toBe("8_Text");
    expect(/[^\x00-\x7F]/.test(d.raw)).toBe(false);
  });

  it("el DXF graduado repite el texto en cada talla", () => {
    const doc = docWithLabel();
    const d = parseDxf(exportDxfGraded(doc));
    expect(d.texts.filter((t) => t === "Doblez aqui")).toHaveLength(doc.sizes.length);
  });

  it("el texto queda dentro de la franja de su pieza en el DXF", () => {
    const doc = docWithLabel();
    const d = parseDxf(exportDxfAama(doc));
    // el texto va en el contorno de la primera pieza (mismo desplazamiento)
    const poly = d.polys.find((p) => p.layer === "1_Boundary")!;
    const t = d.entities.find((e) => e.type === "TEXT" && e.data.some(([, v]) => v === "Doblez aqui"))!;
    const x = Number(t.data.find(([k]) => k === "10")![1]);
    const xs = poly.pts.map((q) => q.x);
    expect(x).toBeGreaterThan(Math.min(...xs));
    expect(x).toBeLessThan(Math.max(...xs));
  });

  it("el SVG lleva el texto con su tamaño", () => {
    const svg = exportSvg(docWithLabel());
    expect(svg).toContain('class="label"');
    expect(svg).toContain("Doblez aquí");
    expect(svg).toContain('font-size="1.40"');
  });
});
