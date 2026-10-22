// Exportador SVG — formato vectorial para abrir en Illustrator/Inkscape y
// servir como vista previa del documento. Mantiene las unidades del doc.

import type { PatternDoc, Piece, Vec2 } from "@hilonova/geometry";
import { samplePath, offsetPolyline, labelPosition } from "@hilonova/geometry";

const pathD = (pts: readonly Vec2[], closed: boolean): string => {
  if (pts.length === 0) return "";
  let d = `M ${pts[0]!.x.toFixed(3)} ${pts[0]!.y.toFixed(3)}`;
  for (let i = 1; i < pts.length; i++) d += ` L ${pts[i]!.x.toFixed(3)} ${pts[i]!.y.toFixed(3)}`;
  if (closed) d += " Z";
  return d;
};

function pieceSvg(piece: Piece, offset: Vec2): string {
  const pts = samplePath(piece, 24).map((p) => ({ x: p.x + offset.x, y: p.y + offset.y }));
  if (pts.length < 2) return "";

  const minX = Math.min(...pts.map((p) => p.x));
  const maxX = Math.max(...pts.map((p) => p.x));
  const minY = Math.min(...pts.map((p) => p.y));
  const maxY = Math.max(...pts.map((p) => p.y));
  const cx = (minX + maxX) / 2;
  const h = maxY - minY;

  let out = `<g class="piece" data-name="${escapeAttr(piece.name)}">`;

  // margen de costura
  if (piece.closed && piece.seamAllowance > 0) {
    const seam = offsetPolyline(pts, piece.seamAllowance, true);
    out += `<path class="seam" d="${pathD(seam, true)}" fill="none" stroke="#36B7AD" stroke-width="0.15" stroke-dasharray="0.6,0.4"/>`;
  }

  // corte
  out += `<path class="cut" d="${pathD(pts, piece.closed)}" fill="none" stroke="#14192A" stroke-width="0.25" stroke-linejoin="round"/>`;

  // hilo de tela
  out += `<line class="grain" x1="${cx.toFixed(3)}" y1="${(minY + h * 0.1).toFixed(3)}" x2="${cx.toFixed(3)}" y2="${(maxY - h * 0.1).toFixed(3)}" stroke="#F0662C" stroke-width="0.2"/>`;

  // piquetes
  for (const n of piece.nodes) {
    if (!n.notch) continue;
    const x = n.at.x + offset.x;
    const y = n.at.y + offset.y;
    out += `<line class="notch" x1="${x.toFixed(3)}" y1="${y.toFixed(3)}" x2="${x.toFixed(3)}" y2="${(y - piece.seamAllowance * 0.9).toFixed(3)}" stroke="#F0662C" stroke-width="0.15"/>`;
  }

  // textos pegados a la pieza
  for (const l of piece.labels ?? []) {
    const pos = labelPosition(piece, l);
    out += `<text class="label" x="${(pos.x + offset.x).toFixed(3)}" y="${(pos.y + offset.y).toFixed(3)}" font-family="Inter, sans-serif" font-size="${l.size.toFixed(2)}" fill="#14192A">${escapeText(l.text)}</text>`;
  }

  // etiqueta
  const fs = Math.max(1.2, h * 0.03);
  out += `<text x="${cx.toFixed(3)}" y="${(minY - 1).toFixed(3)}" font-family="Inter, sans-serif" font-size="${fs.toFixed(2)}" text-anchor="middle" fill="#14192A">${escapeText(piece.name)} ×${piece.quantity}</text>`;

  out += `</g>`;
  return out;
}

const escapeAttr = (s: string): string =>
  s.replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c] ?? c));
const escapeText = (s: string): string =>
  s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] ?? c));

export function exportSvg(doc: PatternDoc, gap = 5): string {
  // armar un viewBox que abarque todas las piezas con un pequeño margen
  let cursorX = 0;
  const parts: Array<{ svg: string; width: number; minY: number; maxY: number }> = [];
  for (const piece of doc.pieces) {
    const pts = samplePath(piece, 12);
    const minY = Math.min(...pts.map((p) => p.y));
    const maxY = Math.max(...pts.map((p) => p.y));
    const w = Math.max(...pts.map((p) => p.x)) - Math.min(...pts.map((p) => p.x));
    parts.push({
      svg: pieceSvg(piece, { x: cursorX, y: 0 }),
      width: w,
      minY,
      maxY,
    });
    cursorX += w + gap;
  }

  const minY = Math.min(...parts.map((p) => p.minY));
  const maxY = Math.max(...parts.map((p) => p.maxY));
  const totalW = cursorX - gap;
  const totalH = maxY - minY;
  const pad = 3;

  const vb = `${(-pad).toFixed(2)} ${(minY - pad).toFixed(2)} ${(totalW + pad * 2).toFixed(2)} ${(totalH + pad * 2).toFixed(2)}`;
  const body = parts.map((p) => p.svg).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${(totalW + pad * 2).toFixed(2)}cm" height="${(totalH + pad * 2).toFixed(2)}cm">
<title>${escapeText(doc.name)}</title>
<desc>Patrón ${escapeText(doc.name)} — exportado desde Hilonova Studio.</desc>
${body}
</svg>`;
}
