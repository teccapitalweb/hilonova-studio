// Offset de polilínea — base para calcular el margen de costura.
// Para cada vértice se promedia la normal del segmento previo y el siguiente,
// y se desplaza el punto por `distance` a lo largo de esa normal.
// El resultado es una polilínea paralela, válida para render; no es un offset
// matemáticamente exacto, pero da el margen que la industria entiende.

import type { Vec2 } from "./vec";
import { add, mul, normalize, sub } from "./vec";

/** Normal 2D a la izquierda del vector (rotar 90° CCW). */
const leftNormal = (v: Vec2): Vec2 => ({ x: -v.y, y: v.x });

/**
 * Devuelve una polilínea desplazada `distance` unidades. Positiva = hacia el
 * "exterior" según el sentido de recorrido (CCW → fuera, CW → dentro).
 * Para una pieza de patrón trazada CW, pasa `distance` positivo para obtener
 * el margen de costura por fuera del contorno.
 */
export function offsetPolyline(
  points: readonly Vec2[],
  distance: number,
  closed: boolean,
): Vec2[] {
  const n = points.length;
  if (n < 2 || distance === 0) return points.slice();

  const out: Vec2[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const p = points[i]!;
    const prev = closed ? points[(i - 1 + n) % n]! : points[Math.max(i - 1, 0)]!;
    const next = closed ? points[(i + 1) % n]! : points[Math.min(i + 1, n - 1)]!;

    const t1 = normalize(sub(p, prev));         // tangente entrante
    const t2 = normalize(sub(next, p));         // tangente saliente
    const n1 = leftNormal(t1);
    const n2 = leftNormal(t2);
    // normal del vértice = bisectriz (promedio normalizado)
    const bis = normalize(add(n1, n2));
    // escala por 1/cos(α/2) para que el punto quede sobre la línea paralela
    // (α es el ángulo entre tangentes). Usamos dot entre t2 y bis para
    // obtener sin(α/2); evitamos divisiones degeneradas con un piso.
    const cosHalf = Math.max(0.2, Math.abs(dot2(bis, n1)));
    const scale = distance / cosHalf;
    out[i] = add(p, mul(bis, scale));
  }
  return out;
}

const dot2 = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y;

/** Convierte una polilínea en el atributo `d` de un SVG (M…L…[Z]). */
export function polyToPath(points: readonly Vec2[], closed: boolean): string {
  if (points.length === 0) return "";
  let d = `M${points[0]!.x} ${points[0]!.y}`;
  for (let i = 1; i < points.length; i++) d += ` L${points[i]!.x} ${points[i]!.y}`;
  if (closed) d += " Z";
  return d;
}
