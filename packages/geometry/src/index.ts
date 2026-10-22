// @hilonova/geometry — el corazón del sistema.
// Motor de geometría de patronaje, independiente del renderer y serializable.
// La implementación real (curvas, offset de costura, graduación, undo/redo)
// llega en la Fase 1. Aquí quedan fijados los tipos base del documento.

export type Unit = "cm" | "mm" | "in";

export interface Point {
  x: number;
  y: number;
}

/** Punto nombrado del patrón, direccionable por id (para reglas y cotas). */
export interface NamedPoint extends Point {
  id: string;
  label?: string;
}

/** Nodo de una curva/segmento de una pieza. */
export interface PathNode {
  point: Point;
  /** manejadores bézier relativos al punto; ausentes = vértice recto */
  handleIn?: Point;
  handleOut?: Point;
  /** piquete en este nodo */
  notch?: boolean;
  /** regla de graduación: desplazamiento por talla respecto a la base */
  grade?: { dx: number; dy: number };
}

/** Una pieza del patrón (delantero, espalda, pretina, ...). */
export interface Piece {
  id: string;
  name: string;
  quantity: number;
  fabric?: string;
  seamAllowance: number; // en la unidad del documento
  grainAngle: number; // grados
  nodes: PathNode[];
}

/** El documento completo que se guarda y versiona. */
export interface PatternDoc {
  schema: 1;
  id: string;
  name: string;
  unit: Unit;
  baseSize: string;
  sizes: string[];
  pieces: Piece[];
}

// --- utilidades de unidades ---
export const cmToMm = (v: number): number => v * 10;
export const mmToCm = (v: number): number => v / 10;
export const inToCm = (v: number): number => v * 2.54;
export const cmToIn = (v: number): number => v / 2.54;

export const VERSION = "0.0.0";
