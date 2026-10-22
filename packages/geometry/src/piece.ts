// Operaciones de alto nivel sobre una Piece: muestreo del contorno,
// bounding box y hit-testing. Todo en unidades del documento.

import type { Node, Piece } from "./doc";
import { segmentBezier, evalBezier } from "./bezier";
import type { Vec2 } from "./vec";
import { dist } from "./vec";

/** Discretiza el contorno de una pieza como polilínea de puntos. */
export function samplePath(piece: Piece, samplesPerSegment = 16): Vec2[] {
  const { nodes, closed } = piece;
  if (nodes.length < 2) return nodes.map((n) => n.at);
  const out: Vec2[] = [];
  const limit = closed ? nodes.length : nodes.length - 1;
  for (let i = 0; i < limit; i++) {
    const a = nodes[i]!;
    const b = nodes[(i + 1) % nodes.length]!;
    const c = segmentBezier(a.at, b.at, a.handleOut, b.handleIn);
    // incluimos el inicio solo en el primer segmento, para no duplicar
    const start = i === 0 ? 0 : 1;
    for (let s = start; s <= samplesPerSegment; s++) {
      out.push(evalBezier(c, s / samplesPerSegment));
    }
  }
  return out;
}

export interface Bounds {
  minX: number; minY: number; maxX: number; maxY: number;
}

/** Bounding box en unidades del doc (toma el contorno discretizado). */
export function bounds(piece: Piece): Bounds {
  const pts = samplePath(piece, 12);
  if (pts.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
}

/** Área del contorno cerrado por la fórmula del zapatero (shoelace). */
export function area(piece: Piece): number {
  if (!piece.closed) return 0;
  const pts = samplePath(piece, 24);
  if (pts.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % pts.length]!;
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

/** Nodo más cercano al punto `p`, con su distancia. */
export function nearestNode(
  piece: Piece,
  p: Vec2,
): { node: Node; distance: number } | null {
  let best: Node | null = null;
  let bestD = Infinity;
  for (const n of piece.nodes) {
    const d = dist(n.at, p);
    if (d < bestD) { bestD = d; best = n; }
  }
  return best ? { node: best, distance: bestD } : null;
}
