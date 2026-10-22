// Trazo (nesting) — acomodo de las piezas en la tela.
// Algoritmo: shelf packing simple. Para cada pieza (repetida según su
// cantidad) la metemos en la fila actual si cabe en el ancho de la tela;
// si no, bajamos a una fila nueva. No rota piezas — producción real usa
// algoritmos más sofisticados; esta primera versión ya mide bien.

import { bounds, samplePath, type Piece, type Vec2 } from "@hilonova/geometry";

/** Pieza colocada en el marker: ocupa un rectángulo [x,y,w,h] en el rollo. */
export interface PlacedPiece {
  piece: Piece;
  /** índice de la copia (0..quantity-1) */
  copy: number;
  /** offset en cm desde la esquina superior-izquierda del rollo */
  offset: Vec2;
  width: number;   // bbox cm
  height: number;  // bbox cm
}

export interface NestingResult {
  placed: PlacedPiece[];
  /** largo del trazo (cm) */
  markerLength: number;
  /** área total ocupada por las piezas (cm²) */
  piecesArea: number;
  /** área del rollo usado (cm²) */
  rollArea: number;
  /** % de aprovechamiento (piezas / rollo) */
  utilization: number;
}

const GAP = 1; // separación entre piezas en cm (margen de corte)

/**
 * Acomoda las piezas (×quantity cada una) en una banda de tela de
 * `fabricWidth` cm. Devuelve posiciones + métricas de consumo.
 */
export function nestPieces(pieces: readonly Piece[], fabricWidth: number): NestingResult {
  const placed: PlacedPiece[] = [];
  // ordenar las copias por altura descendente ayuda a empacar mejor
  const items: Array<{ piece: Piece; copy: number; w: number; h: number }> = [];
  for (const p of pieces) {
    const b = bounds(p);
    const w = b.maxX - b.minX;
    const h = b.maxY - b.minY;
    for (let i = 0; i < p.quantity; i++) items.push({ piece: p, copy: i, w, h });
  }
  items.sort((a, b) => b.h - a.h);

  let x = 0, y = 0, shelfH = 0;
  for (const it of items) {
    if (x + it.w > fabricWidth && x > 0) {
      // nueva fila
      y += shelfH + GAP;
      x = 0;
      shelfH = 0;
    }
    placed.push({
      piece: it.piece,
      copy: it.copy,
      offset: { x, y },
      width: it.w,
      height: it.h,
    });
    x += it.w + GAP;
    if (it.h > shelfH) shelfH = it.h;
  }
  const markerLength = y + shelfH;
  const rollArea = fabricWidth * markerLength;
  const piecesArea = pieces.reduce((acc, p) => acc + areaOfPieceCount(p), 0);
  const utilization = rollArea > 0 ? piecesArea / rollArea : 0;
  return { placed, markerLength, piecesArea, rollArea, utilization };
}

function areaOfPieceCount(piece: Piece): number {
  // área real por polígono + cantidad
  const pts = samplePath(piece, 24);
  if (pts.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % pts.length]!;
    sum += a.x * b.y - b.x * a.y;
  }
  return (Math.abs(sum) / 2) * piece.quantity;
}

/** Devuelve la polilínea de la pieza en coordenadas del rollo. */
export function placedPath(p: PlacedPiece): Vec2[] {
  const b = bounds(p.piece);
  const pts = samplePath(p.piece, 24);
  // normalizar a origen (0,0) y aplicar offset
  return pts.map((pt) => ({
    x: pt.x - b.minX + p.offset.x,
    y: pt.y - b.minY + p.offset.y,
  }));
}
