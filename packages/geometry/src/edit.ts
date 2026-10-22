// Operaciones de edición sobre piezas y documentos. Todo puro e inmutable:
// cada función devuelve una pieza/documento nuevo. Las usa el editor para las
// herramientas de dibujo (línea, curva, rectángulo, círculo), agregar/quitar
// nodos, espejar, rotar y duplicar.

import { makeId, node as makeNode, type Node, type PatternDoc, type Piece, type PieceLabel } from "./doc";
import { evalBezier, segmentBezier } from "./bezier";
import { bounds, samplePath } from "./piece";
import { dist, lerp, normalize, sub, type Vec2 } from "./vec";

const EPS = 1e-6;
const KAPPA = 0.5522847498; // control de Bézier para un cuarto de círculo

// ─── documento ───────────────────────────────────────────────────────────────

export const addPiece = (doc: PatternDoc, piece: Piece): PatternDoc => ({
  ...doc,
  pieces: [...doc.pieces, piece],
});

export const removePiece = (doc: PatternDoc, pieceId: string): PatternDoc => ({
  ...doc,
  pieces: doc.pieces.filter((p) => p.id !== pieceId),
});

export type PiecePatch = Partial<Omit<Piece, "id" | "nodes">>;

export const patchPiece = (doc: PatternDoc, pieceId: string, patch: PiecePatch): PatternDoc => ({
  ...doc,
  pieces: doc.pieces.map((p) => (p.id === pieceId ? { ...p, ...patch } : p)),
});

export const setPieceNodes = (doc: PatternDoc, pieceId: string, nodes: Node[]): PatternDoc => ({
  ...doc,
  pieces: doc.pieces.map((p) => (p.id === pieceId ? { ...p, nodes } : p)),
});

// ─── utilidades de nodos ─────────────────────────────────────────────────────

/** Copia los nodos con ids nuevos (para duplicar o insertar desde la biblioteca). */
export function cloneNodes(nodes: readonly Node[]): Node[] {
  return nodes.map((n) => ({ ...n, id: makeId("n") }));
}

/** Copia una pieza completa con ids nuevos. */
export function clonePiece(piece: Piece, name = piece.name): Piece {
  return {
    ...piece,
    id: makeId("pz"),
    name,
    nodes: cloneNodes(piece.nodes),
    ...(piece.labels ? { labels: piece.labels.map((l) => ({ ...l, id: makeId("lb") })) } : {}),
  };
}

const hasLen = (v: Vec2 | undefined): v is Vec2 => !!v && Math.hypot(v.x, v.y) > EPS;

// ─── transformaciones de pieza ───────────────────────────────────────────────

export function pieceCenter(piece: Piece): Vec2 {
  const b = bounds(piece);
  return { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 };
}

export function translatePiece(piece: Piece, dx: number, dy: number): Piece {
  return {
    ...piece,
    nodes: piece.nodes.map((n) => ({ ...n, at: { x: n.at.x + dx, y: n.at.y + dy } })),
  };
}

/** Espeja la pieza respecto al eje vertical que pasa por su centro. */
export function mirrorPiece(piece: Piece): Piece {
  const cx = pieceCenter(piece).x;
  const nodes = piece.nodes
    .map((n): Node => {
      const out: Node = { id: n.id, at: { x: 2 * cx - n.at.x, y: n.at.y } };
      if (n.notch) out.notch = true;
      if (n.grade) out.grade = { dx: -n.grade.dx, dy: n.grade.dy };
      // al invertir el sentido de recorrido, entrada y salida intercambian roles
      if (n.handleOut) out.handleIn = { x: -n.handleOut.x, y: n.handleOut.y };
      if (n.handleIn) out.handleOut = { x: -n.handleIn.x, y: n.handleIn.y };
      return out;
    })
    .reverse();
  const out: Piece = { ...piece, nodes, grainAngle: -piece.grainAngle };
  if (piece.labels?.length) {
    const origin = nodes[0]!.at;
    out.labels = piece.labels.map((l) => {
      const abs = labelPosition(piece, l);
      return { ...l, dx: 2 * cx - abs.x - origin.x, dy: abs.y - origin.y };
    });
  }
  return out;
}

/** Rota la pieza `deg` grados (sentido horario en pantalla) alrededor de su centro. */
export function rotatePiece(piece: Piece, deg: number): Piece {
  return rotatePieceAbout(piece, pieceCenter(piece), deg);
}

/** Rota la pieza `deg` grados alrededor de un punto cualquiera (para rotar varias piezas juntas). */
export function rotatePieceAbout(piece: Piece, c: Vec2, deg: number): Piece {
  const a = (deg * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const rv = (v: Vec2): Vec2 => ({ x: v.x * cos - v.y * sin, y: v.x * sin + v.y * cos });
  const nodes = piece.nodes.map((n): Node => {
    const d = rv({ x: n.at.x - c.x, y: n.at.y - c.y });
    const out: Node = { ...n, at: { x: c.x + d.x, y: c.y + d.y } };
    if (n.handleIn) out.handleIn = rv(n.handleIn);
    if (n.handleOut) out.handleOut = rv(n.handleOut);
    if (n.grade) {
      const g = rv({ x: n.grade.dx, y: n.grade.dy });
      out.grade = { dx: g.x, dy: g.y };
    }
    return out;
  });
  const out: Piece = { ...piece, nodes, grainAngle: (((piece.grainAngle + deg) % 360) + 360) % 360 };
  if (piece.labels?.length) {
    const origin = nodes[0]!.at;
    out.labels = piece.labels.map((l) => {
      const abs = labelPosition(piece, l);
      const d = rv({ x: abs.x - c.x, y: abs.y - c.y });
      return { ...l, dx: c.x + d.x - origin.x, dy: c.y + d.y - origin.y };
    });
  }
  return out;
}

/** Centro del rectángulo envolvente de varias piezas. */
export function piecesCenter(pieces: readonly Piece[]): Vec2 {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pieces) {
    const b = bounds(p);
    minX = Math.min(minX, b.minX); minY = Math.min(minY, b.minY);
    maxX = Math.max(maxX, b.maxX); maxY = Math.max(maxY, b.maxY);
  }
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
}

// ─── nodos: insertar, quitar, suavizar ───────────────────────────────────────

/**
 * Inserta un nodo en el segmento `segIndex` (entre nodes[i] y nodes[i+1]) en el
 * parámetro t∈(0,1). Divide la curva con de Casteljau, así la forma no cambia.
 * Devuelve la pieza nueva y el id del nodo insertado.
 */
export function insertNodeOnSegment(
  piece: Piece,
  segIndex: number,
  t: number,
): { piece: Piece; nodeId: string } {
  const n = piece.nodes.length;
  const a = piece.nodes[segIndex]!;
  const b = piece.nodes[(segIndex + 1) % n]!;
  // segmento recto: el nodo nuevo es un vértice simple, sin handles
  if (!hasLen(a.handleOut) && !hasLen(b.handleIn)) {
    const straight = makeNode(lerp(a.at, b.at, t));
    const nodes = [...piece.nodes];
    nodes.splice(segIndex + 1, 0, straight);
    return { piece: { ...piece, nodes }, nodeId: straight.id };
  }
  const c = segmentBezier(a.at, b.at, a.handleOut, b.handleIn);
  const q0 = lerp(c.p0, c.p1, t);
  const q1 = lerp(c.p1, c.p2, t);
  const q2 = lerp(c.p2, c.p3, t);
  const r0 = lerp(q0, q1, t);
  const r1 = lerp(q1, q2, t);
  const s = lerp(r0, r1, t);

  const extra: Partial<Omit<Node, "id" | "at">> = {};
  const inH = sub(r0, s);
  const outH = sub(r1, s);
  if (hasLen(inH)) extra.handleIn = inH;
  if (hasLen(outH)) extra.handleOut = outH;
  const created = makeNode(s, extra);

  const aOut = sub(q0, c.p0);
  const bIn = sub(q2, c.p3);
  const nodes = piece.nodes.map((nd): Node => {
    if (nd.id === a.id) {
      const { handleOut: _drop, ...rest } = nd;
      return hasLen(aOut) ? { ...rest, handleOut: aOut } : rest;
    }
    if (nd.id === b.id) {
      const { handleIn: _drop, ...rest } = nd;
      return hasLen(bIn) ? { ...rest, handleIn: bIn } : rest;
    }
    return nd;
  });
  nodes.splice(segIndex + 1, 0, created);
  return { piece: { ...piece, nodes }, nodeId: created.id };
}

/** Quita un nodo si la pieza conserva el mínimo (3 si es cerrada, 2 si es abierta). */
export function removeNode(piece: Piece, nodeId: string): Piece {
  const min = piece.closed ? 3 : 2;
  if (piece.nodes.length <= min) return piece;
  return { ...piece, nodes: piece.nodes.filter((n) => n.id !== nodeId) };
}

/** Handles suaves (tangente entre vecinos) para el nodo i, o vértice si `smooth` es false. */
export function setNodeSmooth(piece: Piece, nodeId: string, smooth: boolean): Piece {
  const n = piece.nodes.length;
  const i = piece.nodes.findIndex((nd) => nd.id === nodeId);
  if (i < 0) return piece;
  const cur = piece.nodes[i]!;
  const prev = piece.closed || i > 0 ? piece.nodes[(i - 1 + n) % n]! : undefined;
  const next = piece.closed || i < n - 1 ? piece.nodes[(i + 1) % n]! : undefined;

  const { handleIn: _hi, handleOut: _ho, ...rest } = cur;
  let updated: Node = rest;
  if (smooth && (prev || next)) {
    const tangent = normalize(sub((next ?? cur).at, (prev ?? cur).at));
    updated = { ...rest };
    if (prev) {
      const d = dist(cur.at, prev.at) / 3;
      updated.handleIn = { x: -tangent.x * d, y: -tangent.y * d };
    }
    if (next) {
      const d = dist(cur.at, next.at) / 3;
      updated.handleOut = { x: tangent.x * d, y: tangent.y * d };
    }
  }
  return { ...piece, nodes: piece.nodes.map((nd) => (nd.id === nodeId ? updated : nd)) };
}

/** Mueve un handle (entrada o salida) de un nodo a una posición absoluta. */
export function moveHandle(
  piece: Piece,
  nodeId: string,
  which: "in" | "out",
  to: Vec2,
): Piece {
  return {
    ...piece,
    nodes: piece.nodes.map((nd) => {
      if (nd.id !== nodeId) return nd;
      const rel = { x: to.x - nd.at.x, y: to.y - nd.at.y };
      return which === "in" ? { ...nd, handleIn: rel } : { ...nd, handleOut: rel };
    }),
  };
}

// ─── construcción de piezas nuevas ───────────────────────────────────────────

/** Nodos suaves que pasan por los puntos dados (tangentes tipo Catmull-Rom). */
export function smoothNodesFromPoints(points: readonly Vec2[], closed: boolean): Node[] {
  const raw = points.map((p) => makeNode(p));
  const piece = { closed, nodes: raw } as Piece;
  let out = piece;
  for (const nd of raw) out = setNodeSmooth(out, nd.id, true);
  return out.nodes;
}

/** Pieza a partir de puntos: con vértices rectos o con curvas suaves. */
export function pieceFromPoints(
  name: string,
  points: readonly Vec2[],
  opts: { closed: boolean; smooth: boolean; quantity?: number },
): Piece {
  const nodes = opts.smooth
    ? smoothNodesFromPoints(points, opts.closed)
    : points.map((p) => makeNode(p));
  return {
    id: makeId("pz"),
    name,
    quantity: opts.quantity ?? 1,
    seamAllowance: opts.closed ? 1 : 0,
    grainAngle: 0,
    closed: opts.closed,
    nodes,
  };
}

export function rectPiece(name: string, a: Vec2, b: Vec2): Piece {
  const x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x);
  const y0 = Math.min(a.y, b.y), y1 = Math.max(a.y, b.y);
  return pieceFromPoints(
    name,
    [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }],
    { closed: true, smooth: false },
  );
}

export function ellipsePiece(name: string, center: Vec2, rx: number, ry: number): Piece {
  const kx = KAPPA * rx;
  const ky = KAPPA * ry;
  const { x, y } = center;
  const nodes = [
    makeNode({ x, y: y - ry }, { handleIn: { x: -kx, y: 0 }, handleOut: { x: kx, y: 0 } }),
    makeNode({ x: x + rx, y }, { handleIn: { x: 0, y: -ky }, handleOut: { x: 0, y: ky } }),
    makeNode({ x, y: y + ry }, { handleIn: { x: kx, y: 0 }, handleOut: { x: -kx, y: 0 } }),
    makeNode({ x: x - rx, y }, { handleIn: { x: 0, y: ky }, handleOut: { x: 0, y: -ky } }),
  ];
  return {
    id: makeId("pz"),
    name,
    quantity: 1,
    seamAllowance: 1,
    grainAngle: 0,
    closed: true,
    nodes,
  };
}

// ─── consultas geométricas ───────────────────────────────────────────────────

export interface SegmentHit {
  segIndex: number;
  t: number;
  point: Vec2;
  distance: number;
}

/** Segmento de la pieza más cercano al punto `p` (muestreo de la curva). */
export function nearestSegment(piece: Piece, p: Vec2, samples = 32): SegmentHit | null {
  const n = piece.nodes.length;
  if (n < 2) return null;
  const limit = piece.closed ? n : n - 1;
  let best: SegmentHit | null = null;
  for (let i = 0; i < limit; i++) {
    const a = piece.nodes[i]!;
    const b = piece.nodes[(i + 1) % n]!;
    const c = segmentBezier(a.at, b.at, a.handleOut, b.handleIn);
    for (let s = 0; s <= samples; s++) {
      const t = s / samples;
      const q = evalBezier(c, t);
      const d = dist(q, p);
      if (!best || d < best.distance) best = { segIndex: i, t, point: q, distance: d };
    }
  }
  return best;
}

/** ¿El punto cae dentro del contorno cerrado de la pieza? (rayo par-impar) */
export function pointInPiece(piece: Piece, p: Vec2): boolean {
  if (!piece.closed) return false;
  const pts = samplePath(piece, 16);
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i]!;
    const b = pts[j]!;
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside;
    }
  }
  return inside;
}

// ─── textos pegados a la pieza ───────────────────────────────────────────────

/** Posición del texto en coordenadas del documento. */
export function labelPosition(piece: Piece, label: PieceLabel): Vec2 {
  const o = piece.nodes[0]?.at ?? { x: 0, y: 0 };
  return { x: o.x + label.dx, y: o.y + label.dy };
}

/** Agrega un texto a la pieza en la posición `at` (coordenadas del documento). */
export function addLabelToPiece(piece: Piece, at: Vec2, text = "Texto", size = 1.5): { piece: Piece; labelId: string } {
  const o = piece.nodes[0]?.at ?? { x: 0, y: 0 };
  const label: PieceLabel = { id: makeId("lb"), dx: at.x - o.x, dy: at.y - o.y, text, size };
  return { piece: { ...piece, labels: [...(piece.labels ?? []), label] }, labelId: label.id };
}

export function updateLabel(piece: Piece, labelId: string, patch: Partial<Pick<PieceLabel, "text" | "size">>): Piece {
  return { ...piece, labels: (piece.labels ?? []).map((l) => (l.id === labelId ? { ...l, ...patch } : l)) };
}

export function moveLabel(piece: Piece, labelId: string, to: Vec2): Piece {
  const o = piece.nodes[0]?.at ?? { x: 0, y: 0 };
  return {
    ...piece,
    labels: (piece.labels ?? []).map((l) => (l.id === labelId ? { ...l, dx: to.x - o.x, dy: to.y - o.y } : l)),
  };
}

export function removeLabel(piece: Piece, labelId: string): Piece {
  const labels = (piece.labels ?? []).filter((l) => l.id !== labelId);
  const { labels: _drop, ...rest } = piece;
  return labels.length ? { ...piece, labels } : rest;
}

/** Caja aproximada del texto (ancho ≈ 0.55 × alto × nº de letras) para hit-test y dibujo. */
export function labelBox(label: PieceLabel, at: Vec2) {
  const w = Math.max(label.size, label.text.length * label.size * 0.55);
  return { minX: at.x, maxX: at.x + w, minY: at.y - label.size, maxY: at.y + label.size * 0.25 };
}
