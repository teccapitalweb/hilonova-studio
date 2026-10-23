// Tech Pack — ficha técnica en PDF para el taller.
// Lo que la maquila necesita para producir: portada con los datos del formulario, medidas por talla,
// vistas planas de todas las piezas (4 por hoja), insumos (BOM), especificaciones y notas.
// Lo que se imprime es lo mismo que muestra la vista previa del programa.

import type { PatternDoc, Piece } from "@hilonova/geometry";
import { samplePath } from "@hilonova/geometry";
import type { JsPdfLike } from "./pdf";

export interface TechPackMeasurements {
  size: string;
  values: Array<{ label: string; value: number; unit: string }>;
}

export interface TechPackOptions {
  /** referencia de producto (ej. HLN-DN-001); si falta se imprime «—» */
  ref?: string;
  /** fecha de revisión */
  date?: string;
  /** revisión actual */
  revision?: string;
  client?: string;
  season?: string;
  designer?: string;
  description?: string;
  notes?: string;
  /** medidas por talla a imprimir en la tabla */
  measurements?: TechPackMeasurements[];
  /** insumos (BOM); si no se manda se usan los de ejemplo, una lista vacía se imprime vacía */
  bom?: Array<{ name: string; detail: string }>;
  /** especificaciones de costura; igual que el BOM */
  specs?: Array<{ label: string; value: string }>;
}

/** Piezas por hoja de vistas planas. */
export const FLATS_PER_PAGE = 4;

export const DEFAULT_BOM: Array<{ name: string; detail: string }> = [
  { name: "Tela principal", detail: "ver tabla de consumo por talla" },
  { name: "Hilo de costura", detail: "poliéster 40/2 · tono según tela" },
  { name: "Etiqueta tejida", detail: "Hilonova · costura trasera" },
];

export function defaultSpecs(doc: PatternDoc): Array<{ label: string; value: string }> {
  return [
    { label: "Margen de costura", value: `${doc.pieces[0]?.seamAllowance ?? 1} cm` },
    { label: "Puntadas por cm", value: "4–5 pps" },
    { label: "Hilo de tela", value: "respetar sentido indicado por grainline" },
  ];
}

/** Piezas repartidas en hojas de vistas planas (siempre al menos una hoja). */
export function flatPages(doc: PatternDoc): Piece[][] {
  const pages: Piece[][] = [];
  for (let i = 0; i < doc.pieces.length; i += FLATS_PER_PAGE) pages.push(doc.pieces.slice(i, i + FLATS_PER_PAGE));
  return pages.length ? pages : [[]];
}

/** Total de hojas de la ficha: portada + medidas + vistas planas + insumos. */
export function techPackPageCount(doc: PatternDoc): number {
  return 3 + flatPages(doc).length;
}

export function renderTechPack(pdf: JsPdfLike, doc: PatternDoc, opts: TechPackOptions = {}): JsPdfLike {
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  const marg = 18;
  const total = techPackPageCount(doc);
  let page = 1;
  const foot = () => pageFoot(pdf, page, total, ph, marg);

  renderCover(pdf, doc, opts, pw, ph, marg);
  foot();

  pdf.addPage();
  page++;
  renderMeasurements(pdf, doc, opts, pw, marg);
  foot();

  const flats = flatPages(doc);
  flats.forEach((pieces, i) => {
    pdf.addPage();
    page++;
    renderFlats(pdf, doc, pieces, flats.length > 1 ? ` (${i + 1}/${flats.length})` : "", pw, ph, marg);
    foot();
  });

  pdf.addPage();
  page++;
  renderBom(pdf, doc, opts, pw, marg);
  foot();
  return pdf;
}

function pageFoot(pdf: JsPdfLike, page: number, total: number, ph: number, marg: number) {
  pdf.setFontSize(9);
  pdf.setDrawColor(85, 94, 118);
  pdf.text(`${page} / ${total} · Generado con Hilonova Studio`, marg, ph - marg);
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
  pdf.text(doc.name, marg, ph / 2 - 40);
  pdf.setFontSize(14);
  pdf.text("Ficha técnica para producción", marg, ph / 2 - 30);
  let y0 = ph / 2 - 16;
  if (opts.description) {
    pdf.setFontSize(11);
    for (const l of pdf.splitTextToSize(opts.description, pw - marg * 2).slice(0, 4)) {
      pdf.text(l, marg, y0);
      y0 += 5.5;
    }
  }

  // metadata (los mismos campos que la vista previa)
  y0 += 8;
  const rows = [
    ["Referencia", opts.ref || "—"],
    ["Cliente", opts.client || "—"],
    ["Temporada", opts.season || "—"],
    ["Revisión", opts.revision || "01"],
    ["Patronista", opts.designer || "—"],
    ["Talla base", doc.baseSize],
    ["Tallas", doc.sizes.join(" · ")],
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
}

function renderMeasurements(pdf: JsPdfLike, doc: PatternDoc, opts: TechPackOptions, pw: number, marg: number) {
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

function renderFlats(pdf: JsPdfLike, doc: PatternDoc, pieces: Piece[], suffix: string, pw: number, ph: number, marg: number) {
  pageHeader(pdf, "Vistas planas" + suffix, doc.name, pw, marg);
  if (pieces.length === 0) {
    pdf.setFontSize(11);
    pdf.text("Sin piezas.", marg, 60);
    return;
  }
  // cuadrícula 2×2 (o 1 columna si hay una sola pieza), con espacio abajo para el pie de página
  const cols = pieces.length > 1 ? 2 : 1;
  const rows = Math.ceil(pieces.length / cols);
  const availW = pw - marg * 2;
  const availH = ph - 50 - marg - 8;
  const cellW = availW / cols;
  const cellH = availH / rows;

  pieces.forEach((piece, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    drawPieceFlat(pdf, piece, marg + col * cellW + 6, 50 + row * cellH, cellW - 12, cellH - 6);
  });
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
  const drawH = h - 10; // deja una línea para el nombre
  const s = Math.min(w / bw, drawH / bh) * 0.9;
  const ox = x + (w - bw * s) / 2 - minX * s;
  const oy = y + (drawH - bh * s) / 2 - minY * s;
  pdf.setDrawColor(20, 25, 42);
  pdf.setLineWidth(0.5);
  for (let i = 1; i < pts.length; i++) {
    pdf.line(pts[i - 1]!.x * s + ox, pts[i - 1]!.y * s + oy, pts[i]!.x * s + ox, pts[i]!.y * s + oy);
  }
  if (piece.closed) {
    pdf.line(pts.at(-1)!.x * s + ox, pts.at(-1)!.y * s + oy, pts[0]!.x * s + ox, pts[0]!.y * s + oy);
  }
  pdf.setFontSize(10);
  pdf.text(`${piece.name}  ·  ×${piece.quantity}  ·  ${bw.toFixed(0)}×${bh.toFixed(0)} cm`, x, y + h - 2);
}

function renderBom(pdf: JsPdfLike, doc: PatternDoc, opts: TechPackOptions, pw: number, marg: number) {
  pageHeader(pdf, "Insumos y especificaciones", doc.name, pw, marg);

  const bom = opts.bom ?? DEFAULT_BOM;
  let y = section(pdf, "Materiales (BOM)", 50, pw, marg);
  if (bom.length === 0) {
    pdf.setFontSize(10);
    pdf.text("Sin materiales.", marg, y);
    y += 9;
  }
  pdf.setFontSize(10);
  bom.forEach((item) => {
    pdf.setDrawColor(230, 230, 230);
    pdf.setLineWidth(0.2);
    pdf.line(marg, y + 2, pw - marg, y + 2);
    pdf.text(item.name || "—", marg, y);
    pdf.text(item.detail || "", marg + 70, y);
    y += 9;
  });

  const specs = opts.specs ?? defaultSpecs(doc);
  y = section(pdf, "Costura", y + 8, pw, marg);
  pdf.setFontSize(10);
  specs.forEach((s) => {
    pdf.setDrawColor(230, 230, 230);
    pdf.setLineWidth(0.2);
    pdf.line(marg, y + 2, pw - marg, y + 2);
    pdf.text(s.label || "—", marg, y);
    pdf.text(s.value || "", marg + 70, y);
    y += 9;
  });

  if (opts.notes) {
    y = section(pdf, "Notas", y + 8, pw, marg);
    pdf.setFontSize(10);
    for (const l of pdf.splitTextToSize(opts.notes, pw - marg * 2)) {
      pdf.text(l, marg, y);
      y += 5.5;
    }
  }
}

/** Título de sección con raya; devuelve la «y» de la primera fila. */
function section(pdf: JsPdfLike, title: string, y: number, pw: number, marg: number): number {
  pdf.setFontSize(12);
  pdf.text(title, marg, y);
  pdf.setLineWidth(0.4);
  pdf.setDrawColor(85, 94, 118);
  pdf.line(marg, y + 3, pw - marg, y + 3);
  return y + 12;
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
