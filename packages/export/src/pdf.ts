// Exportador PDF — mosaico A4 para imprimir en casa y pegar las hojas.
// Usa jsPDF por su API conocida; se instala en apps/web para no cargar la
// dependencia aquí si el consumidor no la necesita.
//
// La primera hoja explica cómo imprimir (a tamaño real), trae un cuadro de 10 cm para comprobar
// la escala y un mapa de las hojas. Después van solo las hojas donde hay algo dibujado, en el
// mismo acomodo que se ve en el editor.

import type { PatternDoc, Piece, Vec2 } from "@hilonova/geometry";
import { samplePath, offsetPolyline, labelPosition } from "@hilonova/geometry";

/** Interfaz mínima de jsPDF que usamos — permite tipar sin arrastrar @types. */
export interface JsPdfLike {
  internal: { pageSize: { getWidth(): number; getHeight(): number } };
  setLineWidth(w: number): void;
  setDrawColor(r: number, g: number, b: number): void;
  setFillColor(r: number, g: number, b: number): void;
  setFontSize(s: number): void;
  setLineDashPattern(dashArray: number[], dashPhase: number): void;
  line(x1: number, y1: number, x2: number, y2: number): void;
  text(text: string, x: number, y: number, options?: unknown): void;
  splitTextToSize(text: string, maxWidth: number): string[];
  rect(x: number, y: number, w: number, h: number, style?: string): void;
  addPage(): void;
  output(type: "blob"): Blob;
}

export interface PdfOptions {
  /** mm en el borde superior/inferior/costados para las marcas de corte */
  margin?: number;
  /** mm de superposición entre páginas (ayuda al pegado) */
  overlap?: number;
  /** título a imprimir en pie de cada página */
  title?: string;
}

/** Convierte una dimensión del documento (cm) a mm. */
const toMm = (cm: number): number => cm * 10;

/** Una línea del patrón ya en milímetros (contorno de corte o margen de costura). */
interface Stroke {
  pts: Vec2[];
  closed: boolean;
  kind: "cut" | "seam";
}

export interface SheetPlan {
  col: number;
  row: number;
  /** número de hoja (1, 2, 3…) solo entre las que llevan dibujo */
  n: number;
}

export interface TilePlan {
  cols: number;
  rows: number;
  sheets: SheetPlan[];
  /** esquina superior izquierda del área impresa de la hoja (0,0), en mm del documento */
  originX: number;
  originY: number;
  sheetW: number;
  sheetH: number;
  stepX: number;
  stepY: number;
}

function strokesOf(doc: PatternDoc): Stroke[] {
  const out: Stroke[] = [];
  for (const piece of doc.pieces) {
    const pts = samplePath(piece, 32).map((p) => ({ x: toMm(p.x), y: toMm(p.y) }));
    if (pts.length < 2) continue;
    if (piece.closed && piece.seamAllowance > 0) {
      out.push({ pts: offsetPolyline(pts, toMm(piece.seamAllowance), true), closed: true, kind: "seam" });
    }
    out.push({ pts, closed: piece.closed, kind: "cut" });
  }
  return out;
}

/** ¿El segmento a–b toca el rectángulo? (Liang–Barsky) */
function segmentTouches(a: Vec2, b: Vec2, x0: number, y0: number, x1: number, y1: number): boolean {
  let t0 = 0;
  let t1 = 1;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const clip = (p: number, q: number): boolean => {
    if (p === 0) return q >= 0;
    const r = q / p;
    if (p < 0) {
      if (r > t1) return false;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return false;
      if (r < t1) t1 = r;
    }
    return true;
  };
  return clip(-dx, a.x - x0) && clip(dx, x1 - a.x) && clip(-dy, a.y - y0) && clip(dy, y1 - a.y);
}

function segmentsOf(s: Stroke): Array<[Vec2, Vec2]> {
  const segs: Array<[Vec2, Vec2]> = [];
  for (let i = 1; i < s.pts.length; i++) segs.push([s.pts[i - 1]!, s.pts[i]!]);
  if (s.closed && s.pts.length > 1) segs.push([s.pts.at(-1)!, s.pts[0]!]);
  return segs;
}

/**
 * Reparte el patrón en hojas A4 y deja solo las que llevan dibujo. Las piezas van en el mismo
 * lugar que en el editor (no se vuelven a acomodar).
 */
export function planTiles(doc: PatternDoc, opts: PdfOptions = {}, pageW = 210, pageH = 297): TilePlan {
  const margin = opts.margin ?? 10;
  const overlap = opts.overlap ?? 5;
  const sheetW = pageW - margin * 2;
  const sheetH = pageH - margin * 2;
  const stepX = sheetW - overlap;
  const stepY = sheetH - overlap;

  const strokes = strokesOf(doc);
  const all = strokes.flatMap((s) => s.pts);
  if (all.length === 0) {
    return { cols: 1, rows: 1, sheets: [{ col: 0, row: 0, n: 1 }], originX: 0, originY: 0, sheetW, sheetH, stepX, stepY };
  }
  const originX = Math.min(...all.map((p) => p.x));
  const originY = Math.min(...all.map((p) => p.y));
  const totalW = Math.max(...all.map((p) => p.x)) - originX;
  const totalH = Math.max(...all.map((p) => p.y)) - originY;
  const cols = Math.max(1, Math.ceil((totalW - overlap) / stepX));
  const rows = Math.max(1, Math.ceil((totalH - overlap) / stepY));

  const segs = strokes.flatMap(segmentsOf);
  const sheets: SheetPlan[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x0 = originX + col * stepX;
      const y0 = originY + row * stepY;
      if (segs.some(([a, b]) => segmentTouches(a, b, x0, y0, x0 + sheetW, y0 + sheetH))) {
        sheets.push({ col, row, n: sheets.length + 1 });
      }
    }
  }
  if (sheets.length === 0) sheets.push({ col: 0, row: 0, n: 1 });
  return { cols, rows, sheets, originX, originY, sheetW, sheetH, stepX, stepY };
}

/**
 * Dibuja el patrón en el PDF: una hoja de instrucciones y luego, página por página, el mosaico A4
 * (solo las hojas con dibujo). Devuelve el mismo PDF para encadenar `pdf.output('blob')` fuera.
 */
export function renderPdfTiled(
  pdf: JsPdfLike,
  doc: PatternDoc,
  opts: PdfOptions = {},
): JsPdfLike {
  const margin = opts.margin ?? 10;
  const title = opts.title ?? doc.name;

  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  const plan = planTiles(doc, opts, pw, ph);

  renderInstructions(pdf, title, plan, pw, ph, margin);

  const strokes = strokesOf(doc);
  const N = plan.sheets.length;

  for (const sheet of plan.sheets) {
    pdf.addPage();

    // marco de corte
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.2);
    pdf.rect(margin, margin, plan.sheetW, plan.sheetH, "S");

    // pie de página con la posición de la hoja (ayuda a pegar)
    pdf.setFontSize(9);
    pdf.text(`${title} — hoja ${sheet.n} de ${N} · columna ${sheet.col + 1}, fila ${sheet.row + 1} (de ${plan.cols} × ${plan.rows})`, margin, ph - 4);

    // esquina de esta hoja en el documento (mm); la página se imprime con su margen alrededor
    const left = plan.originX + sheet.col * plan.stepX;
    const top = plan.originY + sheet.row * plan.stepY;
    const px = (xMm: number) => xMm - left + margin;
    const py = (yMm: number) => yMm - top + margin;
    const inPage = (x: number, y: number) => x >= left - margin && x <= left + plan.sheetW + margin && y >= top - margin && y <= top + plan.sheetH + margin;
    const touches = (a: Vec2, b: Vec2) => segmentTouches(a, b, left - margin, top - margin, left + plan.sheetW + margin, top + plan.sheetH + margin);

    // margen de costura y corte (solo los tramos que caen en esta hoja)
    for (const s of strokes) {
      if (s.kind === "seam") {
        pdf.setDrawColor(60, 170, 160);
        pdf.setLineWidth(0.2);
        pdf.setLineDashPattern([1.6, 1.2], 0);
      } else {
        pdf.setDrawColor(20, 25, 42);
        pdf.setLineWidth(0.4);
      }
      for (const [a, b] of segmentsOf(s)) {
        if (touches(a, b)) pdf.line(px(a.x), py(a.y), px(b.x), py(b.y));
      }
      if (s.kind === "seam") pdf.setLineDashPattern([], 0);
    }

    for (const piece of doc.pieces) {
      const pts = samplePath(piece, 32).map((p) => ({ x: toMm(p.x), y: toMm(p.y) }));
      if (pts.length < 2) continue;

      // hilo de tela
      const minPx = Math.min(...pts.map((p) => p.x));
      const maxPx = Math.max(...pts.map((p) => p.x));
      const minPy = Math.min(...pts.map((p) => p.y));
      const maxPy = Math.max(...pts.map((p) => p.y));
      const cx = (minPx + maxPx) / 2;
      const h = maxPy - minPy;
      const g0 = { x: cx, y: minPy + h * 0.12 };
      const g1 = { x: cx, y: maxPy - h * 0.12 };
      if (touches(g0, g1)) {
        pdf.setDrawColor(240, 102, 44);
        pdf.setLineWidth(0.3);
        pdf.line(px(g0.x), py(g0.y), px(g1.x), py(g1.y));
      }

      // piquetes
      for (const n of piece.nodes) {
        if (!n.notch) continue;
        const x = toMm(n.at.x);
        const y = toMm(n.at.y);
        if (!inPage(x, y)) continue;
        pdf.setDrawColor(240, 102, 44);
        pdf.setLineWidth(0.4);
        pdf.line(px(x), py(y), px(x), py(y - toMm(piece.seamAllowance) * 0.9));
      }

      // textos pegados a la pieza (el alto en cm pasa a puntos: 1 cm ≈ 28.35 pt)
      for (const l of piece.labels ?? []) {
        const pos = labelPosition(piece, l);
        const x = toMm(pos.x);
        const y = toMm(pos.y);
        if (!inPage(x, y)) continue;
        pdf.setFontSize(Math.max(5, l.size * 28.35));
        pdf.text(l.text, px(x), py(y));
      }

      // etiqueta
      if (inPage(cx - 10, minPy - 2)) {
        pdf.setFontSize(10);
        pdf.setDrawColor(20, 25, 42);
        pdf.text(`${piece.name} ×${piece.quantity}`, px(cx) - 10, py(minPy) - 2);
      }
    }
  }

  return pdf;
}

/** Hoja 1: cómo imprimir, cuadro de 10 cm para comprobar la escala y mapa de hojas. */
function renderInstructions(pdf: JsPdfLike, title: string, plan: TilePlan, pw: number, ph: number, margin: number) {
  const N = plan.sheets.length;
  pdf.setDrawColor(20, 25, 42);
  pdf.setFontSize(18);
  pdf.text(title, margin, margin + 8);
  pdf.setFontSize(11);
  pdf.text("Patrón a tamaño real para imprimir y pegar", margin, margin + 16);

  const lines = [
    "1. Imprime con la escala al 100 % (tamaño real). No uses «ajustar a la página».",
    "2. Mide el cuadro de abajo: debe medir 10 × 10 cm. Si mide menos, la impresora redujo el patrón.",
    `3. Son ${N} ${N === 1 ? "hoja" : "hojas"} con dibujo. Se omiten las hojas en blanco.`,
    "4. Pega las hojas siguiendo el mapa. Cada hoja trae un margen de 5 mm que se encima con la vecina.",
  ];
  pdf.setFontSize(10);
  let y = margin + 30;
  for (const l of lines) {
    const wrapped = pdf.splitTextToSize(l, pw - margin * 2);
    for (const w of wrapped) {
      pdf.text(w, margin, y);
      y += 5.5;
    }
  }

  // cuadro de calibración de 10 × 10 cm
  y += 4;
  pdf.setDrawColor(20, 25, 42);
  pdf.setLineWidth(0.4);
  pdf.rect(margin, y, 100, 100, "S");
  pdf.setFontSize(10);
  pdf.text("10 cm", margin + 42, y + 52);
  pdf.text("Cuadro de prueba: 10 × 10 cm", margin + 104, y + 52);
  y += 100 + 14;

  // mapa de hojas
  pdf.setFontSize(11);
  pdf.text(`Mapa de hojas (${plan.cols} columnas × ${plan.rows} filas)`, margin, y);
  y += 5;
  const cell = Math.max(2, Math.min(12, (pw - margin * 2) / plan.cols, (ph - margin - y) / plan.rows));
  const byPos = new Map(plan.sheets.map((s) => [`${s.col},${s.row}`, s.n]));
  pdf.setLineWidth(0.2);
  for (let r = 0; r < plan.rows; r++) {
    for (let c = 0; c < plan.cols; c++) {
      const n = byPos.get(`${c},${r}`);
      const x = margin + c * cell;
      const yy = y + r * cell;
      if (n === undefined) {
        pdf.setDrawColor(210, 210, 210);
        pdf.rect(x, yy, cell, cell, "S");
      } else {
        pdf.setDrawColor(20, 25, 42);
        pdf.setFillColor(244, 241, 234);
        pdf.rect(x, yy, cell, cell, "FD");
        pdf.setFontSize(Math.min(9, cell * 0.7));
        pdf.text(String(n), x + cell / 2 - String(n).length * 1.1, yy + cell / 2 + 1.5);
      }
    }
  }
}
