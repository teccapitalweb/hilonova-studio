// Tallas: escalas alfabéticas (S, M, L, XL) y numéricas (28, 30, 32…).
// Un "paso" es el salto entre dos tallas consecutivas de la escala.

/** Escala alfabética de tallas (un paso de graduación por talla). */
export const ALPHA_SIZES: readonly string[] = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL"];

const alphaIndex = (size: string): number => ALPHA_SIZES.indexOf(size.toUpperCase());

/**
 * Pasos de graduación entre una talla y la base.
 * - Tallas alfabéticas (S, M, L, XL): 1 paso por talla.
 * - Tallas numéricas (28, 30, 32…): 1 paso cada 2 números.
 */
export function sizeSteps(size: string, baseSize: string): number {
  const a = alphaIndex(size);
  const b = alphaIndex(baseSize);
  if (a >= 0 && b >= 0) return a - b;
  return (parseInt(size, 10) - parseInt(baseSize, 10)) / 2;
}

/** Orden de tallas para listas y UI (S < M < L < XL; 28 < 30 < 32). */
export function compareSizes(a: string, b: string): number {
  const ia = alphaIndex(a);
  const ib = alphaIndex(b);
  if (ia >= 0 && ib >= 0) return ia - ib;
  const na = parseInt(a, 10);
  const nb = parseInt(b, 10);
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
  return a.localeCompare(b);
}

/** Escalas predefinidas que el patronista puede elegir. */
export const SIZE_PRESETS: ReadonlyArray<{ id: string; label: string; sizes: string[]; base: string }> = [
  { id: "sml-xl", label: "S · M · L · XL", sizes: ["S", "M", "L", "XL"], base: "M" },
  { id: "xs-xxl", label: "XS · S · M · L · XL · XXL", sizes: ["XS", "S", "M", "L", "XL", "XXL"], base: "M" },
  { id: "num", label: "28 · 30 · 32 · 34 · 36", sizes: ["28", "30", "32", "34", "36"], base: "32" },
];
