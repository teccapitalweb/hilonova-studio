// Curvas Bézier cúbicas — primer ciudadano del motor.
// Un segmento entre dos nodos a/b con handles opcionales se trata como
// cúbica canónica: p0 = a, p1 = a+handleOut, p2 = b+handleIn, p3 = b.
// Cuando los handles están ausentes, degenera en línea recta.

import type { Vec2 } from "./vec";
import { add, lerp } from "./vec";

export interface CubicBezier {
  p0: Vec2; p1: Vec2; p2: Vec2; p3: Vec2;
}

/** Construye el bezier canónico de un segmento entre dos nodos. */
export function segmentBezier(
  a: Vec2, b: Vec2,
  aOut?: Vec2, bIn?: Vec2,
): CubicBezier {
  return {
    p0: a,
    p1: aOut ? add(a, aOut) : a,
    p2: bIn ? add(b, bIn) : b,
    p3: b,
  };
}

/** Evalúa B(t) por de Casteljau (robusto y simple). t∈[0,1]. */
export function evalBezier(c: CubicBezier, t: number): Vec2 {
  const q0 = lerp(c.p0, c.p1, t);
  const q1 = lerp(c.p1, c.p2, t);
  const q2 = lerp(c.p2, c.p3, t);
  const r0 = lerp(q0, q1, t);
  const r1 = lerp(q1, q2, t);
  return lerp(r0, r1, t);
}

/** Discretiza una Bézier en N muestras uniformes en t (N+1 puntos). */
export function flatten(c: CubicBezier, samples = 24): Vec2[] {
  const out: Vec2[] = new Array(samples + 1);
  for (let i = 0; i <= samples; i++) out[i] = evalBezier(c, i / samples);
  return out;
}

/** Bounding box aproximado por discretización. Suficiente para hit-test grueso. */
export function approxBounds(c: CubicBezier, samples = 20) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0; i <= samples; i++) {
    const p = evalBezier(c, i / samples);
    if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
}

/** ¿La curva (aproximada) es prácticamente recta? Útil para optimizar render. */
export function isNearlyStraight(c: CubicBezier): boolean {
  return (
    c.p0.x === c.p1.x && c.p0.y === c.p1.y &&
    c.p3.x === c.p2.x && c.p3.y === c.p2.y
  );
}
