// @hilonova/export — exportadores de patrones de la Fase 4.
// Formatos: DXF-AAMA (industrial, para Gerber/Lectra), SVG (vectorial),
// y PDF A4 mosaico (vía jsPDF, inyectado desde el consumidor para no cargar
// la dep si no se usa).

export * from "./dxf";
export * from "./svg";
export * from "./pdf";
export * from "./techpack";

export type ExportFormat = "dxf-aama" | "svg" | "pdf-tiled" | "pdf-plot";

export const SUPPORTED_FORMATS: readonly ExportFormat[] = [
  "dxf-aama",
  "svg",
  "pdf-tiled",
  "pdf-plot",
] as const;

export const VERSION = "0.4.0";
