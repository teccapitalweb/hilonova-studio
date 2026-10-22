// @hilonova/ui — design system de Hilonova (fuente de verdad de la marca).
// Los tokens visuales viven en ./tokens.css (variables CSS). Aquí se exponen
// los mismos valores en TypeScript para lógica que necesite el color/escala
// (ej. dibujar sobre canvas en el editor, generar PDFs, charts del trazo).

export const color = {
  // superficies oscuras (taller / editor)
  void: "#09131F",
  panel: "#0E1B2A",
  panel2: "#13263A",
  // acentos de marca
  teal: "#149C97",
  tealBright: "#1FBFB7",
  navy: "#1E3A5F",
  sage: "#8CA98C",
  bronze: "#C08A3E",
  bronzeSoft: "#E0B36A",
  // estudio claro (producto)
  paper: "#E8E4D8",
  paper2: "#F1EEE4",
  ink: "#0C1A2A",
  inkSoft: "#3C4C5C",
  // líneas de patrón (editor)
  cut: "#EAF4F8",
  seam: "#36B7AD",
  grain: "#D9A441",
  aux: "#6E8CA8",
} as const;

/** Colores del nido de graduación, por talla. */
export const sizeColor: Record<string, string> = {
  "28": "#149C97",
  "30": "#48C7E0",
  "32": "#9BD17E",
  "34": "#E0A33C",
  "36": "#E07CC0",
};

export const font = {
  display: "var(--font-display)",
  sans: "var(--font-sans)",
  mono: "var(--font-mono)",
} as const;

export const VERSION = "0.0.0";
