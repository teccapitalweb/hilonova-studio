// Vista 3D: "viste" las piezas planas del patrón sobre un cuerpo.
//
// Cada pieza (delantero, espalda, manga, o delantero/espalda de pantalón) se
// envuelve alrededor de una sección elíptica cuyo contorno es la suma del ancho
// del delantero y de la espalda a cada altura: las costuras laterales caen donde
// el patrón las pone y el cuello, la sisa y el bajo conservan su forma real.
// No es una simulación de tela: es el patrón montado, útil para ver proporciones,
// tallas y cómo se ve la prenda armada.
//
// Todo es geometría pura (sin three.js): se puede probar sin pantalla.
// Unidades: cm. Eje Y hacia arriba (la prenda cuelga hacia -Y); el frente mira a +Z.

import { samplePath, type PatternDoc, type Piece, type Vec2 } from "@hilonova/geometry";

export type DrapeFamily = "top" | "skirt" | "pants";

const TOPS = new Set([
  "blusa-clasica", "camisa-hombre", "camisa-manga-corta", "chamarra-mezclilla",
  "sudadera-capucha", "polo", "chaleco", "vestido-basico", "playera-basica",
]);
const SKIRTS = new Set(["falda-recta", "falda-a"]);
const PANTS = new Set(["pantalon-denim", "pantalon-vestir", "short", "bermuda", "pants-jogger", "pantalon-cargo"]);

/** Familia de montaje de una prenda; null si todavía no se puede mostrar en 3D. */
export function drapeFamilyOf(kind: string | undefined): DrapeFamily | null {
  if (!kind) return null;
  if (TOPS.has(kind)) return "top";
  if (SKIRTS.has(kind)) return "skirt";
  if (PANTS.has(kind)) return "pants";
  return null;
}

export interface DrapeMesh {
  name: string;
  /** x,y,z por vértice */
  positions: Float32Array;
  indices: Uint32Array;
  /** contorno de corte como lazo de líneas (x,y,z por punto) */
  outline: Float32Array;
}

export interface Drape {
  meshes: DrapeMesh[];
  /** caja envolvente de todo (cm) */
  min: [number, number, number];
  max: [number, number, number];
}

// ─── geometría de una pieza plana ────────────────────────────────────────────

interface Info {
  piece: Piece;
  poly: Vec2[];
  minX: number; maxX: number; minY: number; maxY: number;
  /** pieza simétrica completa (centrada en x0) o mitad (x0 es el borde del centro) */
  full: boolean;
  x0: number;
  /** desplazamiento vertical respecto al borde superior de la prenda (cm) */
  yOff: number;
  /** semiancho de referencia por fila (desde x0) */
  half: number[];
  cell: number;
  height: number;
}

/** Extremos [izq, der] de la pieza en la altura y, o null si no la cruza. */
function extent(poly: readonly Vec2[], y: number): [number, number] | null {
  let lo = Infinity, hi = -Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]!, b = poly[j]!;
    if (a.y > y !== b.y > y) {
      const x = a.x + ((y - a.y) * (b.x - a.x)) / (b.y - a.y);
      if (x < lo) lo = x;
      if (x > hi) hi = x;
    }
  }
  return lo === Infinity ? null : [lo, hi];
}

/** Altura (desde el borde superior de la pieza) donde está el fondo de la sisa: el nodo con piquete más hacia afuera. */
function underarmY(piece: Piece, minY: number): number {
  let best: { x: number; y: number } | null = null;
  for (const n of piece.nodes) {
    if (!n.notch) continue;
    if (!best || n.at.x > best.x + 1e-6) best = { x: n.at.x, y: n.at.y };
  }
  return best ? best.y - minY : 0;
}

function makeInfo(piece: Piece, full: boolean, yOff: number, cell: number, holdAbove: boolean): Info {
  const poly = samplePath(piece, 16);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of poly) {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
  }
  const height = maxY - minY;
  const rows = Math.max(2, Math.ceil(height / cell) + 1);
  const x0 = full ? (minX + maxX) / 2 : minX;
  const raw: number[] = [];
  for (let r = 0; r < rows; r++) {
    const e = extent(poly, minY + Math.min(height, r * cell) + 1e-6);
    raw.push(e ? (full ? (e[1] - e[0]) / 2 : e[1] - x0) : NaN);
  }
  // huecos (puntas del contorno): se rellenan con el vecino válido
  for (let r = 0; r < rows; r++) if (Number.isNaN(raw[r]!)) raw[r] = raw[r - 1] ?? raw.find((v) => !Number.isNaN(v)) ?? 1;
  // sobre el fondo de la sisa el cuerpo no se estrecha: se mantiene el ancho del costado
  const yU = holdAbove ? underarmY(piece, minY) : 0;
  const rU = Math.max(0, Math.min(rows - 1, Math.round(yU / cell)));
  let half = raw.map((v, r) => (r < rU ? raw[rU]! : v));
  // se suaviza el perfil (sin tocar los extremos) para que la prenda no marque un pliegue donde cambia la pendiente
  for (let pass = 0; pass < 6; pass++) {
    half = half.map((v, r) => (r === 0 || r === rows - 1 ? v : (half[r - 1]! + 2 * v + half[r + 1]!) / 4));
  }
  return { piece, poly, minX, maxX, minY, maxY, full, x0, yOff, half, cell, height };
}

/** Semiancho de referencia de una pieza a la altura `yRel` (cm desde su borde superior). */
function halfAt(info: Info, yRel: number): number {
  const t = Math.max(0, Math.min(info.half.length - 1, yRel / info.cell));
  const i = Math.floor(t);
  const j = Math.min(info.half.length - 1, i + 1);
  return Math.max(0.5, info.half[i]! + (info.half[j]! - info.half[i]!) * (t - i));
}

/** Ancho total (cm) de un grupo de piezas (delantero o espalda) a la altura absoluta `y`. */
function widthAt(group: Info[], y: number): number {
  let pick = group[0]!;
  for (const g of group) if (y >= g.yOff - 1e-6) pick = g;
  return 2 * halfAt(pick, y - pick.yOff);
}

// ─── malla ───────────────────────────────────────────────────────────────────

type Mapper = (x: number, yRel: number) => [number, number, number];

/** Cruces (ordenados) del contorno con la línea horizontal y. */
function crossings(poly: readonly Vec2[], y: number): number[] {
  const xs: number[] = [];
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]!, b = poly[j]!;
    if (a.y > y !== b.y > y) xs.push(a.x + ((y - a.y) * (b.x - a.x)) / (b.y - a.y));
  }
  return xs.sort((p, q) => p - q);
}

/** ¿El punto x cae dentro, dados los cruces de su fila? (paridad) */
function insideAt(xs: readonly number[], x: number): boolean {
  let n = 0;
  for (const v of xs) { if (v < x) n++; else break; }
  return (n & 1) === 1;
}

function buildMesh(info: Info, name: string, map: Mapper): DrapeMesh {
  const c = info.cell;
  const nx = Math.max(1, Math.ceil((info.maxX - info.minX) / c));
  const ny = Math.max(1, Math.ceil((info.maxY - info.minY) / c));
  const id = new Int32Array((nx + 1) * (ny + 1)).fill(-1);
  const pos: number[] = [];
  const idx: number[] = [];
  const vertex = (i: number, j: number): number => {
    const k = j * (nx + 1) + i;
    if (id[k]! < 0) {
      const [X, Y, Z] = map(info.minX + i * c, j * c);
      id[k] = pos.length / 3;
      pos.push(X, Y, Z);
    }
    return id[k]!;
  };
  // cruces del contorno en las líneas de la rejilla (j) y en los centros de fila (j + ½): una sola vez por fila
  const lines: number[][] = [];
  for (let j = 0; j <= ny; j++) lines.push(crossings(info.poly, info.minY + j * c + 1e-6));
  for (let j = 0; j < ny; j++) {
    const mid = crossings(info.poly, info.minY + (j + 0.5) * c + 1e-6);
    for (let i = 0; i < nx; i++) {
      const x0 = info.minX + i * c;
      const x1 = x0 + c;
      const corners =
        (insideAt(lines[j]!, x0) ? 1 : 0) + (insideAt(lines[j]!, x1) ? 1 : 0) +
        (insideAt(lines[j + 1]!, x1) ? 1 : 0) + (insideAt(lines[j + 1]!, x0) ? 1 : 0);
      if (!insideAt(mid, x0 + c / 2) && corners < 3) continue;
      const a = vertex(i, j), b = vertex(i + 1, j), d = vertex(i + 1, j + 1), e = vertex(i, j + 1);
      idx.push(a, b, d, a, d, e);
    }
  }
  const outline: number[] = [];
  for (const p of info.poly) outline.push(...map(p.x, p.y - info.minY));
  return { name, positions: new Float32Array(pos), indices: new Uint32Array(idx), outline: new Float32Array(outline) };
}

function boundsOf(meshes: DrapeMesh[]): Pick<Drape, "min" | "max"> {
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (const m of meshes) {
    for (let i = 0; i < m.positions.length; i += 3) {
      for (let k = 0; k < 3; k++) {
        const v = m.positions[i + k]!;
        if (v < min[k]!) min[k] = v;
        if (v > max[k]!) max[k] = v;
      }
    }
  }
  return { min, max };
}

// ─── cuerpo: prendas de torso y faldas ───────────────────────────────────────

const K_TORSO = 0.72;                       // profundidad / ancho de la sección del tronco
const sElip = Math.sqrt((1 + K_TORSO * K_TORSO) / 2);

/**
 * Cierra las pinzas de una pieza: una pinza es una "V" abierta en el contorno (punta muy aguda con
 * patas largas); al coser se cierra, así que para armar la prenda se quita la punta y el contorno
 * vuelve a ser continuo.
 */
export function closeDarts(piece: Piece): Piece {
  if (!piece.closed) return piece;
  let nodes = piece.nodes;
  for (let guard = 0; guard < 12; guard++) {
    const n = nodes.length;
    let apex = -1;
    for (let i = 0; i < n; i++) {
      const a = nodes[(i - 1 + n) % n]!.at, b = nodes[i]!.at, c = nodes[(i + 1) % n]!.at;
      const v1 = { x: a.x - b.x, y: a.y - b.y }, v2 = { x: c.x - b.x, y: c.y - b.y };
      const l1 = Math.hypot(v1.x, v1.y), l2 = Math.hypot(v2.x, v2.y);
      if (l1 < 4 || l2 < 4) continue;
      const cos = (v1.x * v2.x + v1.y * v2.y) / (l1 * l2);
      const mouth = Math.hypot(a.x - c.x, a.y - c.y);
      if (Math.acos(Math.max(-1, Math.min(1, cos))) < (40 * Math.PI) / 180 && mouth < 8) { apex = i; break; }
    }
    if (apex < 0) break;
    nodes = nodes.filter((_, i) => i !== apex);
  }
  return nodes === piece.nodes ? piece : { ...piece, nodes };
}

function pick(doc: PatternDoc, re: RegExp): Piece[] {
  return doc.pieces.filter((p) => p.closed && re.test(p.name)).map(closeDarts);
}

function drapeBody(doc: PatternDoc, family: "top" | "skirt", cell: number): Drape {
  const hold = family === "top";
  const fronts = pick(doc, /^Delantero/);
  const yoke = pick(doc, /^Canesú/)[0];
  const backs = pick(doc, /^Espalda/);
  if (!fronts.length || (!backs.length && !yoke)) return { meshes: [], min: [0, 0, 0], max: [0, 0, 0] };

  const front = fronts[0]!;
  const frontInfo = makeInfo(front, front.quantity === 1, 0, cell, hold);
  // la espalda puede ir partida en canesú + espalda inferior (camisas)
  const backInfos: Info[] = [];
  let yokeH = 0;
  if (yoke) {
    const yi = makeInfo(yoke, true, 0, cell, false);
    backInfos.push(yi);
    yokeH = yi.height;
  }
  if (backs.length) {
    const b = backs[0]!;
    backInfos.push(makeInfo(b, b.quantity === 1, yoke ? yokeH : 0, cell, hold));
  }

  /** Datos de la sección a la altura y: semiejes del elipse y fracción angular que le toca al delantero. */
  const section = (y: number) => {
    const Wf = widthAt([frontInfo], y);
    const Wb = widthAt(backInfos, y);
    const C = Wf + Wb;
    const a = C / (2 * Math.PI * sElip);
    return { a, b: K_TORSO * a, af: (Math.PI * Wf) / C, ab: (Math.PI * Wb) / C };
  };

  const meshes: DrapeMesh[] = [];

  const mapFront = (info: Info, sign: 1 | -1): Mapper => (x, yRel) => {
    const y = yRel + info.yOff;
    const { a, b, af } = section(y);
    const f = Math.max(-1.05, Math.min(1.05, (x - info.x0) / halfAt(info, yRel)));
    const phi = sign * f * af;
    return [a * Math.sin(phi), -y, b * Math.cos(phi)];
  };
  const mapBack = (info: Info, sign: 1 | -1): Mapper => (x, yRel) => {
    const y = yRel + info.yOff;
    const { a, b, ab } = section(y);
    const f = Math.max(-1.05, Math.min(1.05, (x - info.x0) / halfAt(info, yRel)));
    const phi = Math.PI - sign * f * ab;
    return [a * Math.sin(phi), -y, b * Math.cos(phi)];
  };

  if (frontInfo.full) meshes.push(buildMesh(frontInfo, front.name, mapFront(frontInfo, 1)));
  else {
    meshes.push(buildMesh(frontInfo, `${front.name} (derecha)`, mapFront(frontInfo, 1)));
    meshes.push(buildMesh(frontInfo, `${front.name} (izquierda)`, mapFront(frontInfo, -1)));
  }
  for (const bi of backInfos) {
    if (bi.full) meshes.push(buildMesh(bi, bi.piece.name, mapBack(bi, 1)));
    else {
      meshes.push(buildMesh(bi, `${bi.piece.name} (derecha)`, mapBack(bi, 1)));
      meshes.push(buildMesh(bi, `${bi.piece.name} (izquierda)`, mapBack(bi, -1)));
    }
  }

  // mangas (solo prendas de torso)
  const sleeve = family === "top" ? pick(doc, /^Manga$/)[0] : undefined;
  if (sleeve) {
    const si = makeInfo(sleeve, true, 0, cell, false);
    const yAtt = 3;
    const sec = section(yAtt);
    const beta = (14 * Math.PI) / 180;
    // radio del brazo: sale del ancho de la manga a la altura de la sisa
    const rArm = (2 * halfAt(si, Math.min(si.height * 0.25, 14))) / (2 * Math.PI);
    for (const side of [1, -1] as const) {
      const S: [number, number, number] = [
        side * (sec.a * Math.sin(sec.af) + rArm * 0.55),
        -yAtt,
        0,
      ];
      const map: Mapper = (x, yRel) => {
        const hw = halfAt(si, yRel);
        const r = hw / Math.PI;
        const theta = Math.max(-1.05, Math.min(1.05, (x - si.x0) / hw)) * Math.PI;
        const dx = Math.sin(beta) * side;
        const dy = -Math.cos(beta);
        const ux = Math.cos(beta) * side;
        const uy = Math.sin(beta);
        return [
          S[0] + dx * yRel + r * Math.cos(theta) * ux,
          S[1] + dy * yRel + r * Math.cos(theta) * uy,
          S[2] + r * Math.sin(theta),
        ];
      };
      meshes.push(buildMesh(si, `Manga (${side > 0 ? "derecha" : "izquierda"})`, map));
    }
  }

  return { meshes, ...boundsOf(meshes) };
}

// ─── pantalones ──────────────────────────────────────────────────────────────

function drapePants(doc: PatternDoc, cell: number): Drape {
  const front = pick(doc, /^Delantero/)[0];
  const back = pick(doc, /^Espalda/)[0];
  if (!front || !back) return { meshes: [], min: [0, 0, 0], max: [0, 0, 0] };
  const fi = makeInfo(front, false, 0, cell, false);
  const bi = makeInfo(back, false, 0, cell, false);

  /** Ancho (cm) de la pieza entre su borde interno (entrepierna) y el costado, a la altura y. */
  const span = (info: Info, yRel: number): [number, number] => {
    const e = extent(info.poly, info.minY + Math.max(0, Math.min(info.height, yRel)) + 1e-6);
    return e ?? [info.minX, info.maxX];
  };
  const leg = (y: number) => {
    const [fl, fr] = span(fi, y);
    const [bl, br] = span(bi, y);
    const Wf = Math.max(1, fr - fl), Wb = Math.max(1, br - bl);
    const C = Wf + Wb;
    return { fl, fr, bl, br, Wf, Wb, C, r: C / (2 * Math.PI), af: (Math.PI * Wf) / C, ab: (Math.PI * Wb) / C };
  };

  const meshes: DrapeMesh[] = [];
  for (const side of [1, -1] as const) {
    const mapF: Mapper = (x, y) => {
      const L = leg(y);
      const g = Math.max(-0.05, Math.min(1.05, (x - L.fl) / (L.fr - L.fl)));
      const th = -L.af + 2 * L.af * g;
      return [side * (L.r + L.r * Math.sin(th)), -y, L.r * Math.cos(th)];
    };
    const mapB: Mapper = (x, y) => {
      const L = leg(y);
      const g = Math.max(-0.05, Math.min(1.05, (x - L.bl) / (L.br - L.bl)));
      const th = L.af + (1 - g) * 2 * L.ab;
      return [side * (L.r + L.r * Math.sin(th)), -y, L.r * Math.cos(th)];
    };
    const sd = side > 0 ? "derecha" : "izquierda";
    meshes.push(buildMesh(fi, `Delantero (pierna ${sd})`, mapF));
    meshes.push(buildMesh(bi, `Espalda (pierna ${sd})`, mapB));
  }
  return { meshes, ...boundsOf(meshes) };
}

/** Viste el patrón (ya graduado a la talla que se quiera ver) sobre un cuerpo. */
export function drapeDoc(doc: PatternDoc, family: DrapeFamily, opts: { cell?: number } = {}): Drape {
  const cell = opts.cell ?? 0.7;
  return family === "pants" ? drapePants(doc, cell) : drapeBody(doc, family, cell);
}
