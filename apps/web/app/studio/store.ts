// Store del editor. Zustand con un historial inmutable encima del documento.
// El patrón: todas las ediciones del doc pasan por `apply(next)` para que el
// undo/redo funcione siempre, sin olvidarse de empujar al historial.

"use client";

import { create } from "zustand";
import {
  type PatternDoc,
  type TechPackMeta,
  type Vec2,
  type History,
  initHistory,
  commit as hCommit,
  undo as hUndo,
  redo as hRedo,
  canUndo as hCanUndo,
  canRedo as hCanRedo,
  moveNode as docMoveNode,
} from "@hilonova/geometry";
import {
  demoJeanDoc,
  draftBlock,
  compareSizes,
  graduatePantalon,
  DEFAULT_MEASUREMENTS,
  type BlockKind,
  type BodyMeasurements,
} from "@hilonova/blocks";

/** Color por talla para dibujar el nido. La base se dibuja en blanco siempre. */
export const SIZE_COLORS: Record<string, string> = {
  "28": "#3FD0C9",
  "30": "#5BC8E8",
  "32": "#F0662C",
  "34": "#E0A33C",
  "36": "#E07CC0",
  "38": "#9BD17E",
  "40": "#48C7E0",
  "42": "#E07C7C",
  "44": "#8A91FF",
  // tallas alfabéticas (blusa y demás prendas S–XL)
  XS: "#C77DFF",
  S: "#E04FA8",
  M: "#F0662C",
  L: "#3FD0C9",
  XL: "#8A6BFF",
  XXL: "#9BD17E",
};

export type Tool = "select" | "pan" | "notch";
export type View = "editor" | "trazo" | "ficha";

/** Id del patrón vigente en la biblioteca (si fue abierto o guardado). */
export interface SavedRef {
  id: string | null;
  dirty: boolean;        // hay cambios sin guardar
  lastSaved: string | null;
}

interface EditorState {
  history: History;
  selectedPieceId: string | null;
  selectedNodeId: string | null;
  tool: Tool;
  /** zoom en pixeles por cm (1 = 1cm renderiza como 1px) */
  zoom: number;
  /** offset del lienzo en pixeles (world origin dentro del canvas) */
  pan: Vec2;
  snapGrid: boolean;
  /** paso de la rejilla en cm */
  gridStep: number;
  /** posición actual del cursor en coordenadas doc (para status bar) */
  cursor: Vec2 | null;
  /** mostrar línea de margen de costura */
  showSeam: boolean;
  /** vista activa: editor (lienzo) o trazo (acomodo en tela) */
  view: View;
  /** ancho de la tela en cm (para el trazo) */
  fabricWidth: number;
  /** mostrar nido de tallas superpuesto */
  showNest: boolean;
  /** qué tallas incluir en el nido (debe contener la base) */
  activeSizes: string[];
  /** medidas vigentes (para regenerar el bloque) */
  measurements: BodyMeasurements;
  /** tipo de bloque vigente (para saber qué draft usar al cambiar medidas) */
  blockKind: BlockKind;
  /** vinculación con la biblioteca del usuario */
  saved: SavedRef;

  // selectores derivados
  doc(): PatternDoc;
  canUndo(): boolean;
  canRedo(): boolean;

  // acciones
  setTool(t: Tool): void;
  setZoom(z: number): void;
  setPan(p: Vec2): void;
  setCursor(c: Vec2 | null): void;
  toggleSnap(): void;
  toggleSeam(): void;
  toggleNest(): void;
  toggleSize(size: string): void;
  setView(v: View): void;
  setFabricWidth(cm: number): void;
  selectPiece(id: string | null): void;
  selectNode(pieceId: string, nodeId: string): void;
  clearSelection(): void;
  moveSelectedNode(to: Vec2): void;
  /** marca o desmarca un piquete en el nodo dado */
  toggleNotch(pieceId: string, nodeId: string): void;
  /** regenera el documento desde unas medidas nuevas (empuja al historial) */
  applyMeasurements(m: BodyMeasurements): void;
  undo(): void;
  redo(): void;
  resetDoc(): void;
  /** reemplaza el documento vigente (al abrir un patrón de la biblioteca) */
  loadDoc(doc: PatternDoc, savedId?: string): void;
  /** actualiza el nombre del documento vigente */
  renameDoc(name: string): void;
  /** actualiza (merge) la metadata del Tech Pack del documento vigente */
  updateTechPack(patch: Partial<TechPackMeta>): void;
  /** marca que ya se guardó (resetea dirty) */
  markSaved(id: string): void;
}

export const useEditor = create<EditorState>((set, get) => ({
  history: initHistory(demoJeanDoc()),
  selectedPieceId: null,
  selectedNodeId: null,
  tool: "select",
  zoom: 4,                       // 1 cm = 4 px por default (editor "ampliado")
  pan: { x: 60, y: 60 },
  snapGrid: true,
  gridStep: 1,                   // 1 cm
  cursor: null,
  showSeam: true,
  view: "editor",
  fabricWidth: 150, // cm (ancho estándar denim)
  showNest: false,
  activeSizes: ["28", "30", "32", "34", "36"],
  measurements: { ...DEFAULT_MEASUREMENTS },
  blockKind: "pantalon-denim",
  saved: { id: null, dirty: false, lastSaved: null },

  doc: () => get().history.present,
  canUndo: () => hCanUndo(get().history),
  canRedo: () => hCanRedo(get().history),

  setTool: (tool) => set({ tool }),
  setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(60, zoom)) }),
  setPan: (pan) => set({ pan }),
  setCursor: (cursor) => set({ cursor }),
  toggleSnap: () => set((s) => ({ snapGrid: !s.snapGrid })),
  toggleSeam: () => set((s) => ({ showSeam: !s.showSeam })),
  toggleNest: () => set((s) => ({ showNest: !s.showNest })),
  setView: (view) => set({ view }),
  setFabricWidth: (fabricWidth) =>
    set({ fabricWidth: Math.max(80, Math.min(220, fabricWidth)) }),
  toggleSize: (size) => set((s) => ({
    activeSizes: s.activeSizes.includes(size)
      ? s.activeSizes.filter((x) => x !== size)
      : [...s.activeSizes, size].sort(compareSizes),
  })),

  selectPiece: (id) =>
    set({ selectedPieceId: id, selectedNodeId: null }),

  selectNode: (pieceId, nodeId) =>
    set({ selectedPieceId: pieceId, selectedNodeId: nodeId }),

  clearSelection: () => set({ selectedPieceId: null, selectedNodeId: null }),

  moveSelectedNode: (to) => {
    const { selectedPieceId, selectedNodeId, history, saved } = get();
    if (!selectedPieceId || !selectedNodeId) return;
    const next = docMoveNode(history.present, selectedPieceId, selectedNodeId, to);
    set({ history: hCommit(history, next), saved: { ...saved, dirty: true } });
  },

  toggleNotch: (pieceId, nodeId) => {
    const { history, saved } = get();
    const d = history.present;
    const piece = d.pieces.find((p) => p.id === pieceId);
    if (!piece) return;
    const nextPiece = {
      ...piece,
      nodes: piece.nodes.map((n) =>
        n.id === nodeId ? { ...n, notch: !n.notch } : n,
      ),
    };
    const nextDoc = {
      ...d,
      pieces: d.pieces.map((p) => (p.id === pieceId ? nextPiece : p)),
    };
    set({ history: hCommit(history, nextDoc), saved: { ...saved, dirty: true } });
  },

  applyMeasurements: (m) => {
    const { history, saved, blockKind } = get();
    const next = draftBlock(blockKind, m);
    // conservar el nombre del documento vigente
    const named = { ...next, name: history.present.name };
    set({
      measurements: { ...m },
      history: hCommit(history, named),
      selectedPieceId: null,
      selectedNodeId: null,
      saved: { ...saved, dirty: true },
    });
  },

  undo: () => set((s) => ({ history: hUndo(s.history), saved: { ...s.saved, dirty: true } })),
  redo: () => set((s) => ({ history: hRedo(s.history), saved: { ...s.saved, dirty: true } })),

  resetDoc: () =>
    set({
      history: initHistory(demoJeanDoc()),
      selectedPieceId: null,
      selectedNodeId: null,
      saved: { id: null, dirty: false, lastSaved: null },
    }),

  loadDoc: (doc, savedId) =>
    set({
      history: initHistory(doc),
      selectedPieceId: null,
      selectedNodeId: null,
      blockKind: (doc.blockKind as BlockKind | undefined) ?? "pantalon-denim",
      activeSizes: [...doc.sizes],
      saved: { id: savedId ?? null, dirty: false, lastSaved: new Date().toISOString() },
    }),

  renameDoc: (name) => {
    const { history, saved } = get();
    const next = { ...history.present, name };
    set({ history: hCommit(history, next), saved: { ...saved, dirty: true } });
  },

  updateTechPack: (patch) => {
    const { history, saved } = get();
    const current = history.present;
    const next: PatternDoc = {
      ...current,
      techPack: { ...(current.techPack ?? {}), ...patch },
    };
    set({ history: hCommit(history, next), saved: { ...saved, dirty: true } });
  },

  markSaved: (id) =>
    set((s) => ({ saved: { id, dirty: false, lastSaved: new Date().toISOString() } })),
}));
