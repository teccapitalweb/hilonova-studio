// @hilonova/geometry — el corazón del sistema de patronaje.
// Motor de geometría puro: TypeScript sin React, sin DOM, serializable.
// Lo consume el editor web, y en el futuro el shell de escritorio (Tauri).

export * from "./vec";
export * from "./bezier";
export * from "./doc";
export * from "./piece";
export * from "./offset";
export * from "./history";
export * from "./edit";
export * from "./sizes";
export * from "./grade";

// --- utilidades de unidades (compat con v0) ---
export const cmToMm = (v: number): number => v * 10;
export const mmToCm = (v: number): number => v / 10;
export const inToCm = (v: number): number => v * 2.54;
export const cmToIn = (v: number): number => v / 2.54;

export const VERSION = "0.1.0";
