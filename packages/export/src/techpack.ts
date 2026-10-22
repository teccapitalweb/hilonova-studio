// Tech Pack — ficha técnica profesional multi-página en PDF.
// Lo que la maquila necesita para producir: portada + medidas por talla
// + lista de insumos (BOM) + especificaciones + vistas planas.

import type { PatternDoc, Piece, Vec2 } from "@hilonova/geometry";
import { samplePath } from "@hilonova/geometry";
import type { JsPdfLike } from "./pdf";

export interface TechPackMeasurements {
  size: string;
  values: Array<{ label: string; value: number; unit: string }>;
}

export interface TechPackOptions {
  /** referencia de producto (ej. HLN-DN-001) */
  ref?: string;
  /** fecha de revisión */
  date?: string;
  /** revisión actual */
  revision?: string;
  /** medidas por talla a imprimir en la tabla */
  measurements?: TechPackMeasurements[];
  /** insumos (BOM) */
  bom?: Array<{ name: string; detail: string }>;
  /** especificaciones de costura */
  specs?: Array<{ label: string; value: string }>;
}

export function renderTechPack(pdf: JsPdfLike, doc: PatternDoc, opts: TechPackOptions = {}): JsPdfLike {
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  const marg = 18;

  renderCover(pdf, doc, opts, pw, ph, marg);
  pdf.addPage();
  renderMeasurements(pdf, doc, opts, pw, ph, marg);
  pdf.addPage();
  renderFlats(pdf, doc, pw, ph, marg);
  pdf.addPage();
  renderBom(pdf, doc, opts, pw, ph, marg);
  return pdf;
}

function renderCover(pdf: JsPdfLike, doc: PatternDoc, opts: TechPackOptions, pw: number, ph: number, marg: number) {
  // franja superior (brand)
  pdf.setDrawColor(240, 102, 44);
  pdf.setLineWidth(2);
  pdf.line(marg, marg + 10, pw - marg, marg + 10);

  pdf.setFontSize(10);
  pdf.setDrawColor(85, 94, 118);
  pdf.text("HILONOVA · TECH PACK", marg, marg + 6);
  pdf.text(opts.date ?? new Date().toISOString().slice(0, 10), pw - marg - 30, marg + 6);

  // título
  pdf.setFontSize(28);
  pdf.text(doc.name, marg, ph / 2 - 20);
  pdf.setFontSize(14);
  pdf.text("Ficha técnica para producción", marg, ph / 2 - 10);

  // metadata
  const y0 = ph / 2 + 8;
  const rows = [
    ["Referencia", opts.ref ?? "—"],
    ["Revisión", opts.revision ?? "01"],
    ["Talla base", doc.baseSize],
    ["Tallas", doc.sizes.join(" · ")],
    ["Unidad", doc.unit],
    ["Piezas", String(doc.pieces.length)],
  ];
  pdf.setFontSize(11);
  rows.forEach((r, i) => {
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.2);
    pdf.line(marg, y0 + i * 10 + 2, pw - marg, y0 + i * 10 + 2);
    pdf.text(r[0]!, marg, y0 + i * 10);
    pdf.text(r[1]!, marg + 60, y0 + i * 10);
  });

  // pie
  pdf.setFontSize(9);
  pdf.text("Generado con Hilonova Studio · hilonova.mx", marg, ph - marg);
}

function renderMeasurements(pdf: JsPdfLike, doc: PatternDoc, opts: TechPackOptions, pw: number, ph: number, marg: number) {
  pageHeader(pdf, "Tabla de medidas", doc.name, pw, marg);
  const measurements = opts.measurements ?? [];
  if (measurements.length === 0) {
    pdf.setFontSize(11);
    pdf.text("Sin medidas asignadas.", marg, 60);
    return;
  }
  // encabezado: filas = etiquetas, columnas = tallas
  const labels = measurements[0]!.values.map((v) => v.label);
  const sizes = measurements.map((m) => m.size);
  const colW = (pw - marg * 2 - 60) / sizes.length;
  const y0 = 50;

  pdf.setFontSize(10);
  pdf.setDrawColor(85, 94, 118);
  pdf.text("Medida (cm)", marg, y0 - 4);
  sizes.forEach((s, i) => pdf.text(s, marg + 60 + colW * (i + 0.5) - 3, y0 - 4));
  pdf.setLineWidth(0.4);
  pdf.line(marg, y0, pw - marg, y0);

  labels.forEach((label, li) => {
    const y = y0 + 8 + li * 8;
    pdf.setDrawColor(230, 230, 230);
    pdf.setLineWidth(0.2);
    pdf.line(marg, y + 2, pw - marg, y + 2);
    pdf.setFontSize(10);
    pdf.text(label, marg, y);
    measurements.forEach((m, i) => {
      const val = m.values[li]?.value ?? 0;
      pdf.text(val.toFixed(1), marg + 60 + colW * (i + 0.5) - 3, y);
    });
  });
}

function renderFlats(pdf: JsPdfLike, doc: PatternDoc, pw: number, ph: number, marg: number) {
  pageHeader(pdf, "Vistas planas", doc.name, pw, marg);
  // dibuja hasta 4 piezas simplificadas en una grilla 2x2
  const slots = Math.min(4, doc.pieces.length);
  const cols = slots > 1 ? 2 : 1;
  const rows = Math.ceil(slots / cols);
  const availW = pw - marg * 2;
  const availH = ph - 70;
  const cellW = availW / cols;
  const cellH = availH / rows;

  for (let i = 0; i < slots; i++) {
    const piece = doc.pieces[i]!;
    const col = i % cols;
    const row = Math.floor(i / cols);
    drawPieceFlat(pdf, piece, marg + col * cellW + 6, 50 + row * cellH, cellW - 12, cellH - 18);
  }
}

function drawPieceFlat(pdf: JsPdfLike, piece: Piece, x: number, y: number, w: number, h: number) {
  const pts = samplePath(piece, 28);
  if (pts.length < 2) return;
  const minX = Math.min(...pts.map((p) => p.x));
  const maxX = Math.max(...pts.map((p) => p.x));
  const minY = Math.min(...pts.map((p) => p.y));
  const maxY = Math.max(...pts.map((p) => p.y));
  const bw = maxX - minX;
  const bh = maxY - minY;
  const s = Math.min(w / bw, h / bh) * 0.85;
  const ox = x + (w - bw * s) / 2 - minX * s;
  const oy = y + (h - bh * s) / 2 - minY * s;
  pdf.setDrawColor(20, 25, 42);
  pdf.setLineWidth(0.5);
  for (let i = 1; i < pts.length; i++) {
    pdf.line(pts[i - 1]!.x * s + ox, pts[i - 1]!.y * s + oy, pts[i]!.x * s + ox, pts[i]!.y * s + oy);
  }
  if (piece.closed) {
    pdf.line(pts.at(-1)!.x * s + ox, pts.at(-1)!.y * s + oy, pts[0]!.x * s + ox, pts[0]!.y * s + oy);
  }
  pdf.setFontSize(10);
  pdf.text(`${piece.name}  ·  ×${piece.quantity}  ·  ${bw.toFixed(0)}×${bh.toFixed(0)} cm`, x, y + h - 4);
}

function renderBom(pdf: JsPdfLike, doc: PatternDoc, opts: TechPackOptions, pw: number, ph: number, marg: number) {
  pageHeader(pdf, "Insumos y especificaciones", doc.name, pw, marg);

  pdf.setFontSize(12);
  pdf.text("Bill of Materials (BOM)", marg, 50);
  pdf.setLineWidth(0.4);
  pdf.setDrawColor(85, 94, 118);
  pdf.line(marg, 53, pw - marg, 53);

  const bom = opts.bom ?? defaultBom(doc);
  pdf.setFontSize(10);
  bom.forEach((item, i) => {
    const y = 62 + i * 9;
    pdf.setDrawColor(230, 230, 230);
    pdf.setLineWidth(0.2);
    pdf.line(marg, y + 2, pw - marg, y + 2);
    pdf.text(item.name, marg, y);
    pdf.text(item.detail, marg + 70, y);
  });

  const y2 = 62 + bom.length * 9 + 14;
  pdf.setFontSize(12);
  pdf.text("Especificaciones de costura", marg, y2);
  pdf.setLineWidth(0.4);
  pdf.setDrawColor(85, 94, 118);
  pdf.line(marg, y2 + 3, pw - marg, y2 + 3);

  const specs = opts.specs ?? [
    { label: "Margen de costura", value: `${doc.pieces[0]?.seamAllowance ?? 1} cm` },
    { label: "Puntadas por cm", value: "4–5 pps" },
    { label: "Tipo de puntada", value: "pespunte doble en cinturón y bolsas" },
    { label: "Hilo de tela", value: "respetar sentido indicado por grainline" },
  ];
  pdf.setFontSize(10);
  specs.forEach((s, i) => {
    const y = y2 + 10 + i * 9;
    pdf.setDrawColor(230, 230, 230);
    pdf.setLineWidth(0.2);
    pdf.line(marg, y + 2, pw - marg, y + 2);
    pdf.text(s.label, marg, y);
    pdf.text(s.value, marg + 70, y);
  });
}

function defaultBom(doc: PatternDoc): Array<{ name: string; detail: string }> {
  const fabric = doc.pieces[0]?.fabric ?? "tela principal";
  return [
    { name: fabric, detail: "ver tabla de consumo por talla" },
    { name: "Hilo de costura", detail: "poliéster 40/2 · tono según tela" },
    { name: "Cierre metálico", detail: "YKK #4.5 · 15 cm" },
    { name: "Botón tachón", detail: "17 mm · acabado cobre" },
    { name: "Remaches", detail: "9 mm · cobre · 6 u. en bolsas" },
    { name: "Etiqueta tejida", detail: "Hilonova · costura trasera pretina" },
  ];
}

function pageHeader(pdf: JsPdfLike, section: string, docName: string, pw: number, marg: number) {
  pdf.setFontSize(9);
  pdf.setDrawColor(85, 94, 118);
  pdf.text("HILONOVA · TECH PACK", marg, marg);
  pdf.text(docName, pw - marg - 60, marg);
  pdf.setDrawColor(240, 102, 44);
  pdf.setLineWidth(1);
  pdf.line(marg, marg + 4, pw - marg, marg + 4);
  pdf.setFontSize(16);
  pdf.setDrawColor(20, 25, 42);
  pdf.text(section, marg, marg + 18);
}
