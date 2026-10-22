// Vec2 — vector 2D inmutable. Toda la geometría del motor usa este tipo.
// Mantener puro (sin clases, sin mutación) hace el undo/redo trivial.

export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export const vec = (x: number, y: number): Vec2 => ({ x, y });
export const ZERO: Vec2 = { x: 0, y: 0 };

export const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
export const mul = (a: Vec2, s: number): Vec2 => ({ x: a.x * s, y: a.y * s });
export const neg = (a: Vec2): Vec2 => ({ x: -a.x, y: -a.y });

export const dot = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y;
export const cross = (a: Vec2, b: Vec2): number => a.x * b.y - a.y * b.x;

export const len2 = (a: Vec2): number => a.x * a.x + a.y * a.y;
export const len = (a: Vec2): number => Math.hypot(a.x, a.y);
export const dist = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y);

export const normalize = (a: Vec2): Vec2 => {
  const l = len(a);
  return l === 0 ? ZERO : { x: a.x / l, y: a.y / l };
};

/** Interpolación lineal entre a y b, t∈[0,1]. */
export const lerp = (a: Vec2, b: Vec2, t: number): Vec2 => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

/** Redondea cada componente a `step` (en las unidades del documento). */
export const snapTo = (a: Vec2, step: number): Vec2 =>
  step <= 0 ? a : { x: Math.round(a.x / step) * step, y: Math.round(a.y / step) * step };
