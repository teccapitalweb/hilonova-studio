// Exportador del trazo (marker): las piezas ya acomodadas sobre la tela, listas
// para llevar a un plotter, a un taller de corte o a Gerber/Lectra.
//
// Unidades: cm sobre el rollo (x = ancho de tela, y = largo del trazo). El DXF
// usa las mismas capas AAMA que el patrón, más una capa 20_Fabric con el borde
// de la tela. El SVG y el PDF van a escala 1:1.

import type { Vec2 } from "@hilonova/geometry";
import { ascii, header, line, pair, polyline, tables, text } from "./dxf";
import type { JsPdfLike } from "./pdf";

export interface MarkerPiece {
  name: string;
  /** talla de origen (trazo combinado) */
  size?: string;
  /** contorno de corte (con margen de costura) */
  pts: Vec2[];
  /** línea de la pieza (sin margen) */
  inner: Vec2[];
  notches: Vec2[];
  mirrored?: boolean;
  rotated?: boolean;
}

export interface MarkerLayout {
  title: string;
  /** ancho de la tela, cm */
  fabricWidth: number;
  /** largo del trazo, cm */
  length: number;
  pieces: MarkerPiece[];
}

const bbox = (pts: readonly Vec2[]) => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
};

const label = (p: MarkerPiece): string =>
  p.size ? `${p.name} - talla ${p.size}` : p.name;

/** Línea de hilo vertical (paralela al largo de la tela) centrada en la pieza. */
function grain(p: MarkerPiece): [Vec2, Vec2] {
  const b = bbox(p.inner);
  const cx = (b.minX + b.maxX) / 2;
  const h = b.maxY - b.minY;
  return [{ x: cx, y: b.minY + h * 0.12 }, { x: cx, y: b.maxY - h * 0.12 }];
}

// ─── DXF ─────────────────────────────────────────────────────────────────────

/** DXF R12 del trazo: contorno de corte, línea de la pieza, hilo, piquetes y rótulos. */
export function exportMarkerDxf(m: MarkerLayout): string {
  let ent = pair(0, "SECTION") + pair(2, "ENTITIES");

  // borde de la tela
  ent += polyline(
    [{ x: 0, y: 0 }, { x: m.fabricWidth, y: 0 }, { x: m.fabricWidth, y: m.length }, { x: 0, y: m.length }],
    "20_Fabric",
    true,
  );

  for (const p of m.pieces) {
    ent += polyline(p.inner, "1_Boundary", true);        // línea de la pieza
    ent += polyline(p.pts, "15_SeamAllowance", true);    // línea de corte (con margen)
    const [a, b] = grain(p);
    ent += line(a, b, "5_Grainline");
    for (const n of p.notches) ent += line(n, { x: n.x, y: n.y - 0.9 }, "4_Notch");
    const bb = bbox(p.inner);
    ent += text(
      { x: (bb.minX + bb.maxX) / 2 - 3, y: (bb.minY + bb.maxY) / 2 },
      ascii(label(p).toUpperCase()),
      1.2,
      "8_Text",
    );
  }
  ent += text({ x: 0, y: -2.5 }, ascii(m.title), 1.4, "8_Text");
  ent += pair(0, "ENDSEC");

  return header("cm") + tables([[20, "Fabric", 8]]) + ent + pair(0, "EOF");
}

// ─── SVG ─────────────────────────────────────────────────────────────────────

const esc = (s: string): string => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const d = (pts: readonly Vec2[]): string =>
  pts.map((p, i) => `${i ? "L" : "M"} ${p.x.toFixed(3)} ${p.y.toFixed(3)}`).join(" ") + " Z";

/** SVG a escala 1:1 (width/height en mm; viewBox en cm). */
export function exportMarkerSvg(m: MarkerLayout): string {
  const W = m.fabricWidth;
  const L = m.length;
  let out =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -4 ${W} ${L + 4}" ` +
    `width="${(W * 10).toFixed(1)}mm" height="${((L + 4) * 10).toFixed(1)}mm">`;
  out += `<title>${esc(m.title)}</title>`;
  out += `<rect x="0" y="0" width="${W}" height="${L}" fill="none" stroke="#888" stroke-width="0.2"/>`;
  out += `<text x="0" y="-1.5" font-family="sans-serif" font-size="1.4" fill="#222">${esc(m.title)}</text>`;
  for (const p of m.pieces) {
    out += `<g class="piece" data-name="${esc(p.name)}"${p.size ? ` data-size="${esc(p.size)}"` : ""}>`;
    out += `<path class="cut" d="${d(p.pts)}" fill="none" stroke="#14192A" stroke-width="0.25" stroke-linejoin="round"/>`;
    out += `<path class="piece-line" d="${d(p.inner)}" fill="none" stroke="#36B7AD" stroke-width="0.15" stroke-dasharray="0.6,0.4"/>`;
    const [a, b] = grain(p);
    out += `<line class="grain" x1="${a.x.toFixed(3)}" y1="${a.y.toFixed(3)}" x2="${b.x.toFixed(3)}" y2="${b.y.toFixed(3)}" stroke="#F0662C" stroke-width="0.2"/>`;
    for (const n of p.notches) {
      out += `<line class="notch" x1="${n.x.toFixed(3)}" y1="${n.y.toFixed(3)}" x2="${n.x.toFixed(3)}" y2="${(n.y - 0.9).toFixed(3)}" stroke="#F0662C" stroke-width="0.2"/>`;
    }
    const bb = bbox(p.inner);
    out += `<text x="${((bb.minX + bb.maxX) / 2).toFixed(2)}" y="${((bb.minY + bb.maxY) / 2).toFixed(2)}" font-family="sans-serif" font-size="1.2" text-anchor="middle" fill="#14192A">${esc(label(p))}</text>`;
    out += `</g>`;
  }
  out += `</svg>`;
  return out;
}

// ─── PDF (plotter, escala 1:1) ───────────────────────────────────────────────

export interface MarkerPdfOptions {
  /** margen alrededor del trazo, mm */
  margin?: number;
  /** alto máximo de una página, mm (los trazos más largos se parten en páginas) */
  maxPageHeight?: number;
}

/** Tamaño de página (mm) y número de páginas que necesita un trazo a escala 1:1. */
export function markerPdfPlan(m: MarkerLayout, opts: MarkerPdfOptions = {}) {
  const margin = opts.margin ?? 12;
  const top = 10; // franja del título
  const pageW = m.fabricWidth * 10 + margin * 2;
  const fullH = m.length * 10 + margin * 2 + top;
  const maxH = opts.maxPageHeight ?? 5000;
  const pages = Math.max(1, Math.ceil(fullH / maxH));
  const pageH = pages === 1 ? fullH : maxH;
  return { margin, top, pageW, pageH, pages, fullH };
}

/**
 * Dibuja el trazo en `pdf` a escala 1:1. El PDF debe crearse con el tamaño de
 * `markerPdfPlan(m)`. Si el trazo es más largo que una página, se reparte en varias
 * páginas continuas (cada una muestra su tramo).
 */
export function renderMarkerPdf(pdf: JsPdfLike, m: MarkerLayout, opts: MarkerPdfOptions = {}): JsPdfLike {
  const plan = markerPdfPlan(m, opts);
  const ox = plan.margin;
  const oy = plan.margin + plan.top;

  const poly = (pts: readonly Vec2[], yShift: number) => {
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i]!;
      const b = pts[(i + 1) % pts.length]!;
      pdf.line(ox + a.x * 10, oy + a.y * 10 - yShift, ox + b.x * 10, oy + b.y * 10 - yShift);
    }
  };

  for (let page = 0; page < plan.pages; page++) {
    if (page > 0) pdf.addPage();
    const yShift = page * plan.pageH;

    pdf.setDrawColor(130, 130, 130);
    pdf.setLineWidth(0.3);
    pdf.rect(ox, oy - yShift, m.fabricWidth * 10, m.length * 10);
    pdf.setFontSize(9);
    pdf.text(ascii(`${m.title} - escala 1:1 - pagina ${page + 1}/${plan.pages}`), ox, plan.margin + 2);
    // regla de control: debe medir exactamente 10 cm al imprimir
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.4);
    const ry = plan.margin + 7;
    pdf.line(ox, ry, ox + 100, ry);
    pdf.line(ox, ry - 1.5, ox, ry + 1.5);
    pdf.line(ox + 100, ry - 1.5, ox + 100, ry + 1.5);
    pdf.setFontSize(7);
    pdf.text("control de escala: esta linea mide 10 cm", ox + 104, ry + 1);

    for (const p of m.pieces) {
      pdf.setLineDashPattern([], 0);
      pdf.setDrawColor(20, 25, 42);
      pdf.setLineWidth(0.5);
      poly(p.pts, yShift);

      pdf.setDrawColor(54, 183, 173);
      pdf.setLineWidth(0.25);
      pdf.setLineDashPattern([2, 1.5], 0);
      poly(p.inner, yShift);
      pdf.setLineDashPattern([], 0);

      pdf.setDrawColor(240, 102, 44);
      pdf.setLineWidth(0.35);
      const [a, b] = grain(p);
      pdf.line(ox + a.x * 10, oy + a.y * 10 - yShift, ox + b.x * 10, oy + b.y * 10 - yShift);
      for (const n of p.notches) {
        pdf.line(ox + n.x * 10, oy + n.y * 10 - yShift, ox + n.x * 10, oy + (n.y - 0.9) * 10 - yShift);
      }

      const bb = bbox(p.inner);
      pdf.setFontSize(7);
      pdf.text(ascii(label(p)), ox + ((bb.minX + bb.maxX) / 2) * 10 - 10, oy + ((bb.minY + bb.maxY) / 2) * 10 - yShift);
    }

  }
  return pdf;
}
