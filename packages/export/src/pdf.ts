// Exportador PDF — mosaico A4 para imprimir en casa y pegar las hojas.
// Usa jsPDF por su API conocida; se instala en apps/web para no cargar la
// dependencia aquí si el consumidor no la necesita.

import type { PatternDoc, Piece, Vec2 } from "@hilonova/geometry";
import { samplePath, offsetPolyline } from "@hilonova/geometry";

/** Interfaz mínima de jsPDF que usamos — permite tipar sin arrastrar @types. */
export interface JsPdfLike {
  internal: { pageSize: { getWidth(): number; getHeight(): number } };
  setLineWidth(w: number): void;
  setDrawColor(r: number, g: number, b: number): void;
  setFontSize(s: number): void;
  setLineDashPattern(dashArray: number[], dashPhase: number): void;
  line(x1: number, y1: number, x2: number, y2: number): void;
  text(text: string, x: number, y: number, options?: unknown): void;
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

/**
 * Dibuja el patrón en el PDF, página por página, en mosaico A4. Devuelve el
 * mismo PDF para encadenar `pdf.output('blob')` fuera.
 */
export function renderPdfTiled(
  pdf: JsPdfLike,
  doc: PatternDoc,
  opts: PdfOptions = {},
): JsPdfLike {
  const margin = opts.margin ?? 10;
  const overlap = opts.overlap ?? 5;
  const title = opts.title ?? doc.name;

  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  const sheetW = pw - margin * 2;
  const sheetH = ph - margin * 2;

  // bounding box total del patrón (todas las piezas lado a lado, 5 cm de gap)
  const gap = 5;
  let cursorX = 0;
  const parts: Array<{ piece: Piece; offsetX: number }> = [];
  for (const piece of doc.pieces) {
    parts.push({ piece, offsetX: cursorX });
    const pts = samplePath(piece, 12);
    const w = Math.max(...pts.map((p) => p.x)) - Math.min(...pts.map((p) => p.x));
    cursorX += w + gap;
  }
  const allPts: Vec2[] = parts.flatMap(({ piece, offsetX }) =>
    samplePath(piece, 24).map((p) => ({ x: p.x + offsetX, y: p.y })),
  );
  const minX = Math.min(...allPts.map((p) => p.x));
  const maxX = Math.max(...allPts.map((p) => p.x));
  const minY = Math.min(...allPts.map((p) => p.y));
  const maxY = Math.max(...allPts.map((p) => p.y));

  const totalWmm = toMm(maxX - minX);
  const totalHmm = toMm(maxY - minY);

  // cuántas hojas horizontales y verticales
  const effW = sheetW - overlap;
  const effH = sheetH - overlap;
  const cols = Math.max(1, Math.ceil(totalWmm / effW));
  const rows = Math.max(1, Math.ceil(totalHmm / effH));

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (!(row === 0 && col === 0)) pdf.addPage();

      // marco de corte
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.2);
      pdf.rect(margin, margin, sheetW, sheetH, "S");

      // pie de página con la coordenada de hoja (ayuda a pegar)
      pdf.setFontSize(9);
      pdf.text(`${title} — hoja ${col + 1},${row + 1} / ${cols},${rows}`, margin, ph - 4);

      // offset en mm para dibujar en esta hoja
      const dxMm = -col * effW + margin - toMm(minX);
      const dyMm = -row * effH + margin - toMm(minY);
      const px = (xCm: number) => toMm(xCm) + dxMm;
      const py = (yCm: number) => toMm(yCm) + dyMm;

      // piezas
      for (const { piece, offsetX } of parts) {
        const pts = samplePath(piece, 32).map((p) => ({ x: p.x + offsetX, y: p.y }));

        // margen de costura
        if (piece.closed && piece.seamAllowance > 0) {
          const seam = offsetPolyline(pts, piece.seamAllowance, true);
          pdf.setDrawColor(60, 170, 160);
          pdf.setLineWidth(0.2);
          pdf.setLineDashPattern([1.6, 1.2], 0);
          drawPolyline(pdf, seam, piece.closed, px, py);
          pdf.setLineDashPattern([], 0);
        }

        // corte
        pdf.setDrawColor(20, 25, 42);
        pdf.setLineWidth(0.4);
        drawPolyline(pdf, pts, piece.closed, px, py);

        // hilo de tela
        const minPx = Math.min(...pts.map((p) => p.x));
        const maxPx = Math.max(...pts.map((p) => p.x));
        const minPy = Math.min(...pts.map((p) => p.y));
        const maxPy = Math.max(...pts.map((p) => p.y));
        const cxCm = (minPx + maxPx) / 2;
        const h = maxPy - minPy;
        pdf.setDrawColor(240, 102, 44);
        pdf.setLineWidth(0.3);
        pdf.line(
          px(cxCm), py(minPy + h * 0.12),
          px(cxCm), py(maxPy - h * 0.12),
        );

        // piquetes
        for (const n of piece.nodes) {
          if (!n.notch) continue;
          const x = n.at.x + offsetX;
          const y = n.at.y;
          pdf.setDrawColor(240, 102, 44);
          pdf.setLineWidth(0.4);
          pdf.line(px(x), py(y), px(x), py(y - piece.seamAllowance * 0.9));
        }

        // etiqueta
        pdf.setFontSize(10);
        pdf.setDrawColor(20, 25, 42);
        pdf.text(`${piece.name} ×${piece.quantity}`, px(cxCm) - 10, py(minPy) - 2);
      }
    }
  }

  return pdf;
}

function drawPolyline(
  pdf: JsPdfLike, pts: readonly Vec2[], closed: boolean,
  px: (x: number) => number, py: (y: number) => number,
) {
  for (let i = 1; i < pts.length; i++) {
    pdf.line(px(pts[i - 1]!.x), py(pts[i - 1]!.y), px(pts[i]!.x), py(pts[i]!.y));
  }
  if (closed && pts.length > 1) {
    pdf.line(px(pts.at(-1)!.x), py(pts.at(-1)!.y), px(pts[0]!.x), py(pts[0]!.y));
  }
}
