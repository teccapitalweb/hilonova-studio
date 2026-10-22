// Cálculo del nido de tallas para pintarlo en el canvas.
// Se usa el bloque paramétrico (`graduatePantalon`) para generar un documento
// por talla, y luego cada pieza equivalente se alinea por su primer nodo contra
// la pieza base — así todas se ven "anidadas" alrededor del mismo origen.

import { samplePath, type PatternDoc, type Vec2 } from "@hilonova/geometry";
import { graduateBlock, type BlockKind, type BodyMeasurements } from "@hilonova/blocks";

export interface NestLayer {
  size: string;
  /** una polilínea por pieza (en el mismo orden que doc.pieces) */
  piecesPts: Vec2[][];
}

/**
 * Genera las polilíneas de cada talla, alineadas por el primer nodo de cada
 * pieza con la pieza base — así se superponen limpiamente en el canvas.
 */
export function buildNest(
  base: PatternDoc,
  measurements: BodyMeasurements,
  baseSize: string,
  activeSizes: readonly string[],
  blockKind: BlockKind = "pantalon-denim",
): NestLayer[] {
  const grads = graduateBlock(blockKind, measurements, baseSize, activeSizes);
  // si el patrón ya no coincide con el bloque paramétrico (piezas agregadas o
  // quitadas), no se puede graduar por índice: sin nido hasta la graduación por reglas
  if (grads.some((g) => g.doc.pieces.length !== base.pieces.length)) return [];
  // referencia: posiciones del primer nodo de cada pieza en el doc base
  const anchors = base.pieces.map((p) => p.nodes[0]?.at ?? { x: 0, y: 0 });
  return grads.map(({ size, doc }) => {
    const piecesPts: Vec2[][] = doc.pieces.map((p, i) => {
      const pts = samplePath(p, 20);
      const anchor = anchors[i] ?? { x: 0, y: 0 };
      const origin = p.nodes[0]?.at ?? { x: 0, y: 0 };
      const dx = anchor.x - origin.x;
      const dy = anchor.y - origin.y;
      return pts.map((pt) => ({ x: pt.x + dx, y: pt.y + dy }));
    });
    return { size, piecesPts };
  });
}
