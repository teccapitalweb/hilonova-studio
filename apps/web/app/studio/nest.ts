// Nido de tallas: las polilíneas de cada talla, superpuestas sobre la base.
// Cada talla se obtiene aplicando las reglas de graduación de los nodos
// (`gradeDoc`), así funciona para cualquier patrón: prendas paramétricas,
// piezas de la biblioteca y piezas dibujadas con reglas propias.

import { gradeDoc, samplePath, type PatternDoc, type Vec2 } from "@hilonova/geometry";

export interface NestLayer {
  size: string;
  /** una polilínea por pieza cerrada (en el mismo orden que doc.pieces) */
  piecesPts: Vec2[][];
}

export function buildNest(doc: PatternDoc, activeSizes: readonly string[]): NestLayer[] {
  return activeSizes.map((size) => {
    const graded = gradeDoc(doc, size);
    return {
      size,
      piecesPts: graded.pieces.filter((p) => p.closed).map((p) => samplePath(p, 20)),
    };
  });
}
