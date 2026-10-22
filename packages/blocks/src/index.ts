// @hilonova/blocks — bloques paramétricos por medidas. Stub de Fase 0.
// Aquí vive el conocimiento de patronaje: reglas que convierten medidas en
// un bloque base. Empezamos por mezclilla (pantalón → jacket). Fase 2.

import type { PatternDoc } from "@hilonova/geometry";

export type BlockKind = "pantalon-denim" | "jacket-denim" | "camisa";

/** Medidas de cuerpo (cm) que alimentan el bloque. */
export interface BodyMeasurements {
  cintura: number;
  cadera: number;
  tiro: number;
  largo: number;
  muslo: number;
  bajo?: number;
}

// Placeholder: se implementa en Fase 2.
export function draftBlock(_kind: BlockKind, _m: BodyMeasurements): PatternDoc {
  throw new Error("blocks: pendiente de implementar (Fase 2)");
}

export const VERSION = "0.0.0";
