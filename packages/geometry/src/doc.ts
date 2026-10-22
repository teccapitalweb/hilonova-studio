// Modelo del documento de patronaje. Todo serializable, todo inmutable:
// las ediciones producen un documento nuevo. Esto hace el undo/redo trivial.

import type { Vec2 } from "./vec";

export type Unit = "cm" | "mm" | "in";

/** Nodo de un camino (poligonal o Bézier). Posiciones en unidades del doc. */
export interface Node {
  id: string;
  at: Vec2;
  /** control bézier entrante (relativo a `at`) */
  handleIn?: Vec2;
  /** control bézier saliente (relativo a `at`) */
  handleOut?: Vec2;
  /** piquete en este nodo (marca de alineación entre piezas) */
  notch?: boolean;
  /** regla de graduación: delta por talla respecto a la base */
  grade?: { dx: number; dy: number };
}

/** Texto pegado a una pieza (nota, medida, instrucción). La posición es relativa
 *  al primer nodo de la pieza, así que el texto acompaña a la pieza al moverla. */
export interface PieceLabel {
  id: string;
  dx: number;
  dy: number;
  text: string;
  /** alto del texto, cm */
  size: number;
}

/** Una pieza del patrón (delantero, espalda, pretina, ...). */
export interface Piece {
  id: string;
  name: string;
  quantity: number;
  fabric?: string;
  /** margen de costura en unidades del doc */
  seamAllowance: number;
  /** sentido del hilo de tela en grados (0 = vertical) */
  grainAngle: number;
  /** path cerrado (silueta de pieza) o abierto (línea interna) */
  closed: boolean;
  nodes: Node[];
  /** textos pegados a la pieza */
  labels?: PieceLabel[];
}

/** Metadata editable del Tech Pack — ficha técnica para la maquila.
 *  Se persiste con el documento para que sobreviva al guardado y a los
 *  exports (DXF/PDF/techpack) que la usan como fuente de verdad. */
export interface TechPackMeta {
  ref?: string;           // SKU/código (ej. "HLN-DN-012")
  client?: string;        // nombre del cliente final
  season?: string;        // temporada (ej. "SS26", "FW25")
  revision?: string;      // número de revisión (ej. "02")
  designer?: string;      // nombre del patronista
  description?: string;   // descripción del artículo
  bom?: Array<{ name: string; detail: string }>;
  specs?: Array<{ label: string; value: string }>;
  notes?: string;         // notas libres
}

/** Estado de un patrón que cambia entre variantes de modelo. */
export interface VariantSnapshot {
  pieces: Piece[];
  sizes: string[];
  baseSize: string;
  gradeSteps?: Record<string, number>;
  measurements?: Record<string, number>;
  blockKind?: string;
}

/** Variante de modelo: otra versión del mismo diseño (manga 3/4, cuello mao…). */
export interface ModelVariant {
  id: string;
  name: string;
  /** color de referencia para distinguirla */
  color: string;
  note?: string;
  snapshot: VariantSnapshot;
}

/** Documento completo. `schema` controla migraciones futuras. */
export interface PatternDoc {
  schema: 1;
  id: string;
  name: string;
  unit: Unit;
  /** talla base para la que fueron creadas las coordenadas */
  baseSize: string;
  /** gama de tallas disponibles (incluye la base) */
  sizes: string[];
  pieces: Piece[];
  /** Opcional: tipo de bloque origen (para que el editor sepa qué draft
   *  usar al cambiar medidas). Si falta, se asume el default del motor. */
  blockKind?: string;
  /** Opcional: metadata del Tech Pack. */
  techPack?: TechPackMeta;
  /** Opcional: reglas de tallaje editadas por el usuario (cm por talla por medida);
   *  pisan las reglas por defecto del bloque. */
  gradeSteps?: Record<string, number>;
  /** Medidas de la talla base con las que se dibujó el patrón (cm). */
  measurements?: Record<string, number>;
  /** Variantes de modelo guardadas y cuál está activa. */
  variants?: ModelVariant[];
  activeVariant?: string;
}

// ─── id generator ────────────────────────────────────────────────────────────

let _counter = 0;
/** Id corto estable; suficiente para la vida de un documento en memoria. */
export const makeId = (prefix: string): string =>
  `${prefix}_${(++_counter).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// ─── constructores ───────────────────────────────────────────────────────────

export function emptyDoc(name = "Patrón sin título"): PatternDoc {
  return {
    schema: 1,
    id: makeId("doc"),
    name,
    unit: "cm",
    baseSize: "32",
    sizes: ["28", "30", "32", "34", "36"],
    pieces: [],
  };
}

export function emptyPiece(name: string, quantity = 1): Piece {
  return {
    id: makeId("pz"),
    name,
    quantity,
    seamAllowance: 1,
    grainAngle: 0,
    closed: true,
    nodes: [],
  };
}

export function node(at: Vec2, extra?: Partial<Omit<Node, "id" | "at">>): Node {
  return { id: makeId("n"), at, ...extra };
}

// ─── lookups ─────────────────────────────────────────────────────────────────

export const findPiece = (doc: PatternDoc, id: string): Piece | undefined =>
  doc.pieces.find((p) => p.id === id);

export const findNode = (
  piece: Piece,
  id: string,
): Node | undefined => piece.nodes.find((n) => n.id === id);

// ─── mutaciones inmutables (devuelven doc nuevo) ─────────────────────────────

export function replacePiece(doc: PatternDoc, piece: Piece): PatternDoc {
  return { ...doc, pieces: doc.pieces.map((p) => (p.id === piece.id ? piece : p)) };
}

export function updateNode(
  piece: Piece,
  nodeId: string,
  patch: Partial<Node>,
): Piece {
  return {
    ...piece,
    nodes: piece.nodes.map((n) => (n.id === nodeId ? { ...n, ...patch } : n)),
  };
}

/** Mueve un nodo a una posición absoluta (en unidades del doc). */
export function moveNode(
  doc: PatternDoc,
  pieceId: string,
  nodeId: string,
  to: Vec2,
): PatternDoc {
  const piece = findPiece(doc, pieceId);
  if (!piece) return doc;
  return replacePiece(doc, updateNode(piece, nodeId, { at: to }));
}

// ─── serialización ───────────────────────────────────────────────────────────

export const serialize = (doc: PatternDoc): string => JSON.stringify(doc);

export function deserialize(raw: string): PatternDoc {
  const d = JSON.parse(raw) as PatternDoc;
  if (d.schema !== 1) throw new Error(`doc: esquema no soportado (${d.schema})`);
  return d;
}
