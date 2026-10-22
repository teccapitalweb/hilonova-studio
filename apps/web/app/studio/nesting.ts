// Trazo (nesting) — acomodo de las piezas en la tela respetando el contorno.
//
// Cada pieza (con su margen de costura) se rasteriza en una rejilla de 1 cm y
// se coloca en la primera posición libre de abajo-arriba / izquierda-derecha,
// probando giro de 180° (conserva el hilo de tela) y espejo en las copias
// pares (izquierda/derecha). Es un acomodo voraz de contornos reales: encaja
// piezas curvas entre sí, no solo cajas. No sustituye a un optimizador
// industrial, pero da consumos realistas y comparables entre tallas.

import {
  gradeDoc,
  offsetPolyline,
  samplePath,
  type PatternDoc,
  type Piece,
  type Vec2,
} from "@hilonova/geometry";

/** Pieza colocada en el marker. */
export interface PlacedPiece {
  piece: Piece;
  /** índice de la copia (0..quantity-1) */
  copy: number;
  /** talla de origen (trazo combinado) */
  size?: string;
  /** esquina superior-izquierda del rectángulo envolvente, en cm del rollo */
  offset: Vec2;
  width: number;   // bbox cm
  height: number;  // bbox cm
  /** contorno de corte (con margen de costura) en coordenadas del rollo */
  pts: Vec2[];
  /** línea de la pieza (sin margen) en coordenadas del rollo */
  inner: Vec2[];
  /** piquetes de la pieza en coordenadas del rollo */
  notches: Vec2[];
  rotated: boolean;
  mirrored: boolean;
}

export interface NestingResult {
  placed: PlacedPiece[];
  /** largo del trazo (cm) */
  markerLength: number;
  /** área de las piezas con margen de costura (cm²) */
  piecesArea: number;
  /** área del rollo usado (cm²) */
  rollArea: number;
  /** aprovechamiento 0..1 (piezas / rollo) */
  utilization: number;
  /** piezas más anchas que la tela (no caben) */
  oversize: string[];
}

export interface NestItem {
  piece: Piece;
  size?: string;
}

const CELL = 1;   // cm por celda de la rejilla
const GAP = 1;    // celdas de separación entre piezas (≈ margen de corte)

type Spans = Array<Array<[number, number]>>;

// ─── geometría auxiliar ──────────────────────────────────────────────────────

const polyArea = (pts: readonly Vec2[]): number => {
  let sum = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % pts.length]!;
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
};

const box = (pts: readonly Vec2[]) => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
};

/** Aplica espejo y/o rotación de 180° y lleva el contorno exterior al origen. */
function orient(
  outer: readonly Vec2[],
  inner: readonly Vec2[],
  rotated: boolean,
  mirrored: boolean,
): { outer: Vec2[]; inner: Vec2[]; w: number; h: number; map: (p: Vec2) => Vec2 } {
  const b = box(outer);
  const w = b.maxX - b.minX;
  const h = b.maxY - b.minY;
  const f = (p: Vec2): Vec2 => {
    let x = p.x - b.minX;
    let y = p.y - b.minY;
    if (mirrored) x = w - x;
    if (rotated) { x = w - x; y = h - y; }
    return { x, y };
  };
  return { outer: outer.map(f), inner: inner.map(f), w, h, map: f };
}

/** Tramos [a, b] de celdas ocupadas por fila (relleno par-impar al centro de cada celda). */
function rasterSpans(pts: readonly Vec2[], rows: number): Spans {
  const spans: Spans = [];
  for (let r = 0; r < rows; r++) {
    const yc = (r + 0.5) * CELL;
    const xs: number[] = [];
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const a = pts[i]!;
      const b = pts[j]!;
      if (a.y > yc !== b.y > yc) xs.push(a.x + ((yc - a.y) * (b.x - a.x)) / (b.y - a.y));
    }
    xs.sort((m, n) => m - n);
    const row: Array<[number, number]> = [];
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const c0 = Math.ceil(xs[k]! / CELL - 0.5);
      const c1 = Math.floor(xs[k + 1]! / CELL - 0.5);
      if (c1 >= c0) row.push([c0, c1]);
    }
    spans.push(row);
  }
  return spans;
}

// ─── rejilla de ocupación ────────────────────────────────────────────────────

class Occupancy {
  readonly width: number;
  private occ: Uint8Array[] = [];
  private pre: Int32Array[] = [];

  constructor(widthCells: number) {
    this.width = widthCells;
  }

  get rows(): number { return this.occ.length; }

  private ensure(rows: number): void {
    while (this.occ.length < rows) {
      this.occ.push(new Uint8Array(this.width));
      this.pre.push(new Int32Array(this.width + 1));
    }
  }

  private reprefix(row: number): void {
    const o = this.occ[row]!;
    const p = this.pre[row]!;
    for (let c = 0; c < this.width; c++) p[c + 1] = p[c]! + o[c]!;
  }

  fits(spans: Spans, x0: number, y0: number): boolean {
    for (let r = 0; r < spans.length; r++) {
      const row = y0 + r;
      if (row >= this.occ.length) return true; // más allá de lo usado: libre
      const p = this.pre[row]!;
      for (const [a, b] of spans[r]!) {
        if (p[x0 + b + 1]! - p[x0 + a]! > 0) return false;
      }
    }
    return true;
  }

  place(spans: Spans, x0: number, y0: number): void {
    this.ensure(y0 + spans.length + GAP);
    const touched = new Set<number>();
    for (let r = 0; r < spans.length; r++) {
      for (const [a, b] of spans[r]!) {
        const from = Math.max(0, x0 + a - GAP);
        const to = Math.min(this.width - 1, x0 + b + GAP);
        for (let dy = -GAP; dy <= GAP; dy++) {
          const row = y0 + r + dy;
          if (row < 0 || row >= this.occ.length) continue;
          this.occ[row]!.fill(1, from, to + 1);
          touched.add(row);
        }
      }
    }
    for (const row of touched) this.reprefix(row);
  }
}

// ─── nesting ─────────────────────────────────────────────────────────────────

interface Candidate {
  item: NestItem;
  copy: number;
  outer: Vec2[];
  inner: Vec2[];
  notches: Vec2[];
  mirrored: boolean;
  area: number;
  height: number;
}

interface Choice {
  x: number;
  y: number;
  rotated: boolean;
  spans: Spans;
  o: ReturnType<typeof orient>;
  bottom: number;
}

/**
 * Acomoda las piezas cerradas (×cantidad) de varios documentos/tallas en un
 * rollo de `fabricWidth` cm. Las líneas internas (abiertas) no se cortan.
 */
export function nestItems(items: readonly NestItem[], fabricWidth: number): NestingResult {
  const widthCells = Math.max(1, Math.floor(fabricWidth / CELL));
  const cands: Candidate[] = [];

  for (const item of items) {
    const p = item.piece;
    if (!p.closed) continue;
    const line = samplePath(p, 16);
    if (line.length < 3) continue;
    const outer = p.seamAllowance > 0 ? offsetPolyline(line, p.seamAllowance, true) : line;
    const bb = box(outer);
    for (let c = 0; c < p.quantity; c++) {
      cands.push({
        item,
        copy: c,
        outer,
        inner: line,
        notches: p.nodes.filter((n) => n.notch).map((n) => n.at),
        // las copias impares de un par son la pieza opuesta (izquierda/derecha)
        mirrored: p.quantity % 2 === 0 && c % 2 === 1,
        area: polyArea(outer),
        height: bb.maxY - bb.minY,
      });
    }
  }
  cands.sort((a, b) => b.area - a.area || b.height - a.height);

  const occ = new Occupancy(widthCells);
  const placed: PlacedPiece[] = [];
  const oversize: string[] = [];
  let markerLength = 0;
  let piecesArea = 0;

  for (const cand of cands) {
    let best: Choice | null = null;

    for (const rotated of [false, true]) {
      const o = orient(cand.outer, cand.inner, rotated, cand.mirrored);
      const rows = Math.max(1, Math.ceil(o.h / CELL));
      const spans = rasterSpans(o.outer, rows);
      let maxC = 0;
      for (const row of spans) for (const [, b] of row) if (b > maxC) maxC = b;
      // el ancho se toma de la extensión real del contorno (no del último centro de celda
      // incluido), para que ninguna pieza sobresalga del borde de la tela
      const wCells = Math.max(maxC + 1, Math.ceil(o.w / CELL - 1e-9));

      let found: { x: number; y: number } | null = null;
      if (wCells > widthCells) {
        found = { x: 0, y: occ.rows }; // no cabe a lo ancho: va debajo y se avisa
      } else {
        for (let y = 0; y <= occ.rows && !found; y++) {
          for (let x = 0; x + wCells <= widthCells; x++) {
            if (occ.fits(spans, x, y)) { found = { x, y }; break; }
          }
        }
      }
      if (!found) found = { x: 0, y: occ.rows };

      // criterio: la pieza que termine más arriba (menor borde inferior), luego más a la izquierda
      const bottom = found.y + rows;
      if (!best || bottom < best.bottom || (bottom === best.bottom && found.x < best.x)) {
        best = { x: found.x, y: found.y, rotated, spans, o, bottom };
      }
    }

    if (!best) continue;
    occ.place(best.spans, best.x, best.y);
    const ox = best.x * CELL;
    const oy = best.y * CELL;
    const shift = (p: Vec2): Vec2 => ({ x: p.x + ox, y: p.y + oy });
    if (best.o.w > fabricWidth + 1e-6) oversize.push(cand.item.piece.name);
    markerLength = Math.max(markerLength, oy + best.o.h);
    piecesArea += cand.area;
    placed.push({
      piece: cand.item.piece,
      copy: cand.copy,
      ...(cand.item.size ? { size: cand.item.size } : {}),
      offset: { x: ox, y: oy },
      width: best.o.w,
      height: best.o.h,
      pts: best.o.outer.map(shift),
      inner: best.o.inner.map(shift),
      notches: cand.notches.map((n) => shift(best!.o.map(n))),
      rotated: best.rotated,
      mirrored: cand.mirrored,
    });
  }

  const rollArea = fabricWidth * markerLength;
  return {
    placed,
    markerLength,
    piecesArea,
    rollArea,
    utilization: rollArea > 0 ? Math.min(1, piecesArea / rollArea) : 0,
    oversize: [...new Set(oversize)],
  };
}

/** Compatibilidad: una sola talla/documento. */
export function nestPieces(pieces: readonly Piece[], fabricWidth: number): NestingResult {
  return nestItems(pieces.map((piece) => ({ piece })), fabricWidth);
}

/** Contorno de corte de la pieza colocada, en coordenadas del rollo. */
export const placedPath = (p: PlacedPiece): Vec2[] => p.pts;

export interface MarkerSet {
  perSize: Array<{ size: string; result: NestingResult }>;
  /** una prenda de cada talla en el mismo trazo */
  combined: NestingResult;
}

/** Trazo de cada talla del documento y el combinado de todas. */
export function nestBySize(doc: PatternDoc, fabricWidth: number): MarkerSet {
  const graded = doc.sizes.map((size) => ({ size, doc: gradeDoc(doc, size) }));
  return {
    perSize: graded.map(({ size, doc: d }) => ({
      size,
      result: nestItems(d.pieces.map((piece) => ({ piece, size })), fabricWidth),
    })),
    combined: nestItems(
      graded.flatMap(({ size, doc: d }) => d.pieces.map((piece) => ({ piece, size }))),
      fabricWidth,
    ),
  };
}

/** El trazo en el formato que entienden los exportadores (DXF, SVG, PDF). */
export function markerLayoutOf(result: NestingResult, fabricWidth: number, title: string) {
  return {
    title,
    fabricWidth,
    length: result.markerLength,
    pieces: result.placed.map((pp) => ({
      name: pp.piece.name,
      ...(pp.size ? { size: pp.size } : {}),
      pts: pp.pts,
      inner: pp.inner,
      notches: pp.notches,
      mirrored: pp.mirrored,
      rotated: pp.rotated,
    })),
  };
}
