// Exportador DXF-AAMA — el gancho B2B.
// Formato: DXF R12 ASCII con la convención de capas AAMA/ASTM D6673:
//   1  Boundary       línea de corte
//   4  Notch          piquetes
//   5  Grainline      hilo de tela
//   6  InternalLine   líneas internas (pinzas de talle, abertura): piezas abiertas dentro de otra
//   8  Text           anotaciones (nombre, cantidad)
//  15  Seam allowance línea de margen de costura
// Las unidades del DXF son las del documento (cm). Cualquier Gerber/Lectra
// moderno respeta el header "$INSUNITS" para interpretar correctamente.

import type { PatternDoc, Piece, Vec2 } from "@hilonova/geometry";
import { samplePath, offsetPolyline, gradeDoc, compareSizes, labelPosition, pointInPiece } from "@hilonova/geometry";

const UNIT_CODE: Record<string, number> = { cm: 5, mm: 4, in: 1 };

/** DXF R12 es ASCII: se quitan acentos y símbolos ("Puño" → "Puno", "×" → "x"). */
export const ascii = (t: string): string =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/×/g, "x").replace(/[^ -~]/g, "-");

/** Línea DXF: pair de código+valor en dos líneas de texto. */
export const pair = (code: number, value: string | number): string =>
  `${code}\n${value}\n`;

export function header(unit: string): string {
  return (
    pair(0, "SECTION") +
    pair(2, "HEADER") +
    pair(9, "$ACADVER") + pair(1, "AC1009") +
    pair(9, "$INSUNITS") + pair(70, UNIT_CODE[unit] ?? 5) +
    pair(0, "ENDSEC")
  );
}

/** Tabla de capas AAMA/ASTM con sus códigos de color estándar de AutoCAD. */
export function tables(extra: Array<[number, string, number]> = []): string {
  const layers: Array<[number, string, number]> = [
    [1, "Boundary", 7],
    [4, "Notch", 1],
    [5, "Grainline", 3],
    [6, "InternalLine", 2],
    [8, "Text", 7],
    [15, "SeamAllowance", 4],
    ...extra,
  ];
  let out =
    pair(0, "SECTION") +
    pair(2, "TABLES") +
    pair(0, "TABLE") +
    pair(2, "LAYER") +
    pair(70, layers.length);
  for (const [code, name, color] of layers) {
    out +=
      pair(0, "LAYER") +
      pair(2, `${code}_${name}`) +
      pair(70, 0) +
      pair(62, color) +
      pair(6, "CONTINUOUS");
  }
  out += pair(0, "ENDTAB") + pair(0, "ENDSEC");
  return out;
}

/** Polilínea en formato R12 (POLYLINE + VERTEX + SEQEND), el que leen todos los CAD. */
export function polyline(points: readonly Vec2[], layer: string, closed: boolean): string {
  let out =
    pair(0, "POLYLINE") +
    pair(8, layer) +
    pair(66, 1) +
    pair(70, closed ? 1 : 0);
  for (const p of points) {
    out += pair(0, "VERTEX") + pair(8, layer) + pair(10, fmt(p.x)) + pair(20, fmt(-p.y));
  }
  out += pair(0, "SEQEND") + pair(8, layer);
  return out;
}
// invertimos Y para que el DXF salga en el espacio de dibujo tradicional (+Y arriba)
const fmt = (n: number): string => n.toFixed(4);

export function line(a: Vec2, b: Vec2, layer: string): string {
  return (
    pair(0, "LINE") +
    pair(8, layer) +
    pair(10, fmt(a.x)) + pair(20, fmt(-a.y)) +
    pair(11, fmt(b.x)) + pair(21, fmt(-b.y))
  );
}

export function text(at: Vec2, value: string, height: number, layer: string): string {
  return (
    pair(0, "TEXT") +
    pair(8, layer) +
    pair(10, fmt(at.x)) + pair(20, fmt(-at.y)) +
    pair(40, fmt(height)) +
    pair(1, value)
  );
}

/** Línea interna (pieza abierta): va en la capa 6 con el mismo desplazamiento que la pieza que la contiene. */
function internalEntities(piece: Piece, offset: Vec2): string {
  const pts = samplePath(piece, 24).map((p) => ({ x: p.x + offset.x, y: p.y + offset.y }));
  return pts.length < 2 ? "" : polyline(pts, "6_InternalLine", false);
}

/** La pieza cerrada que contiene una línea interna: la que tiene su punto medio dentro o, si cae en el borde, la más cercana. */
function hostOf(line: Piece, closed: readonly Piece[]): Piece | null {
  const pts = samplePath(line, 24);
  if (pts.length < 2) return null;
  const mid = pts[Math.floor(pts.length / 2)]!;
  const inside = closed.find((c) => pointInPiece(c, mid));
  if (inside) return inside;
  let best: Piece | null = null;
  let bd = 2; // cm: más lejos que esto no se considera dentro de la pieza
  for (const c of closed) {
    const cp = samplePath(c, 24);
    for (let i = 0; i < cp.length; i++) {
      const a = cp[i]!, b = cp[(i + 1) % cp.length]!;
      const dx = b.x - a.x, dy = b.y - a.y;
      const l2 = dx * dx + dy * dy;
      const u = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((mid.x - a.x) * dx + (mid.y - a.y) * dy) / l2));
      const d = Math.hypot(mid.x - (a.x + u * dx), mid.y - (a.y + u * dy));
      if (d < bd) { bd = d; best = c; }
    }
  }
  return best;
}

function pieceEntities(piece: Piece, offset: Vec2, label = ""): string {
  const pts = samplePath(piece, 24).map((p) => ({ x: p.x + offset.x, y: p.y + offset.y }));
  if (pts.length < 2) return "";
  let out = "";

  // 1 - Boundary
  out += polyline(pts, "1_Boundary", piece.closed);

  // 15 - Seam allowance
  if (piece.closed && piece.seamAllowance > 0) {
    const seam = offsetPolyline(pts, piece.seamAllowance, true);
    out += polyline(seam, "15_SeamAllowance", true);
  }

  // 5 - Grainline (centrada en el bounding box, con el ángulo de la pieza; 0° = vertical)
  const minX = Math.min(...pts.map((p) => p.x));
  const maxX = Math.max(...pts.map((p) => p.x));
  const minY = Math.min(...pts.map((p) => p.y));
  const maxY = Math.max(...pts.map((p) => p.y));
  const cx = (minX + maxX) / 2;
  const h = maxY - minY;
  if (piece.closed) {
    const cy = (minY + maxY) / 2;
    const a = (piece.grainAngle * Math.PI) / 180;
    const ux = Math.sin(a) * h * 0.4;
    const uy = -Math.cos(a) * h * 0.4;
    out += line({ x: cx - ux, y: cy - uy }, { x: cx + ux, y: cy + uy }, "5_Grainline");
  }

  // 4 - Notches (línea perpendicular corta hacia fuera, aproximada)
  for (const n of piece.nodes) {
    if (!n.notch) continue;
    const at = { x: n.at.x + offset.x, y: n.at.y + offset.y };
    const outTo = { x: at.x, y: at.y - piece.seamAllowance * 0.9 };
    out += line(at, outTo, "4_Notch");
  }

  // 8 - Text (nombre y cantidad arriba del centro)
  out += text(
    { x: cx - h * 0.08, y: minY - 1.5 },
    ascii(`${piece.name.toUpperCase()} x${piece.quantity}${label}`),
    Math.max(1.2, h * 0.025),
    "8_Text",
  );

  // textos pegados a la pieza (notas, medidas, instrucciones)
  for (const l of piece.labels ?? []) {
    const pos = labelPosition(piece, l);
    out += text({ x: pos.x + offset.x, y: pos.y + offset.y }, ascii(l.text), l.size, "8_Text");
  }

  return out;
}

export interface DxfOptions {
  /** separación horizontal entre piezas en el DXF (cm) */
  gap?: number;
}

/** Genera el contenido DXF completo del documento como string. */
export function exportDxfAama(doc: PatternDoc, opts: DxfOptions = {}): string {
  const gap = opts.gap ?? 5;
  let entities = pair(0, "SECTION") + pair(2, "ENTITIES");

  let cursorX = 0;
  const closed = doc.pieces.filter((p) => p.closed);
  const placed = new Map<string, Vec2>();
  for (const piece of closed) {
    const offset = { x: cursorX, y: 0 };
    placed.set(piece.id, offset);
    entities += pieceEntities(piece, offset);
    // avanzar el cursor horizontal según el ancho de la pieza
    const pts = samplePath(piece, 12);
    const w = Math.max(...pts.map((p) => p.x)) - Math.min(...pts.map((p) => p.x));
    cursorX += w + gap;
  }
  // las líneas internas van junto a su pieza
  for (const line of doc.pieces.filter((p) => !p.closed)) {
    const host = hostOf(line, closed);
    if (host) entities += internalEntities(line, placed.get(host.id)!);
  }
  entities += pair(0, "ENDSEC");

  return header(doc.unit) + tables() + entities + pair(0, "EOF");
}

/**
 * DXF con todas las tallas del documento (graduado): cada talla va en su propia
 * franja horizontal, de la menor a la mayor, con el nombre de la talla en el
 * rótulo de cada pieza. Usa las reglas de graduación de los nodos.
 */
export function exportDxfGraded(doc: PatternDoc, opts: DxfOptions = {}): string {
  const gap = opts.gap ?? 5;
  const sizes = [...doc.sizes].sort(compareSizes);
  let entities = pair(0, "SECTION") + pair(2, "ENTITIES");

  let cursorY = 0;
  for (const size of sizes) {
    const graded = gradeDoc(doc, size);
    let cursorX = 0;
    let maxH = 0;
    const closed = graded.pieces.filter((p) => p.closed);
    const placed = new Map<string, Vec2>();
    for (const piece of closed) {
      const pts = samplePath(piece, 12);
      if (pts.length < 2) continue;
      const minX = Math.min(...pts.map((p) => p.x));
      const minY = Math.min(...pts.map((p) => p.y));
      const w = Math.max(...pts.map((p) => p.x)) - minX;
      const h = Math.max(...pts.map((p) => p.y)) - minY;
      // cada pieza se normaliza a su esquina para que las tallas no se encimen
      const offset = { x: cursorX - minX, y: cursorY - minY };
      placed.set(piece.id, offset);
      entities += pieceEntities(piece, offset, ` - talla ${size}`);
      cursorX += w + gap;
      maxH = Math.max(maxH, h);
    }
    for (const line of graded.pieces.filter((p) => !p.closed)) {
      const host = hostOf(line, closed);
      const offset = host ? placed.get(host.id) : undefined;
      if (offset) entities += internalEntities(line, offset);
    }
    cursorY += maxH + gap * 3;
  }
  entities += pair(0, "ENDSEC");
  return header(doc.unit) + tables() + entities + pair(0, "EOF");
}
