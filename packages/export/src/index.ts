// @hilonova/export — exportadores de patrones. Stub de Fase 0.
// El gancho B2B es DXF-AAMA (intercambio con Gerber/Lectra). Implementación
// real en la Fase 4; aquí queda fijado el contrato.

import type { PatternDoc } from "@hilonova/geometry";

export type ExportFormat = "dxf-aama" | "svg" | "pdf-tiled" | "pdf-plot";

export const SUPPORTED_FORMATS: ExportFormat[] = [
  "dxf-aama",
  "svg",
  "pdf-tiled",
  "pdf-plot",
];

export interface ExportOptions {
  format: ExportFormat;
  sizes?: string[];
  /** ancho de página para PDF mosaico (cm) */
  pageWidth?: number;
}

export interface ExportResult {
  format: ExportFormat;
  filename: string;
  bytes: Uint8Array;
}

// Placeholder: se implementa en Fase 4.
export async function exportPattern(
  _doc: PatternDoc,
  _opts: ExportOptions,
): Promise<ExportResult> {
  throw new Error("export: pendiente de implementar (Fase 4)");
}

export const VERSION = "0.0.0";
