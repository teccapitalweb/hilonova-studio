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
  checkpoint as hCheckpoint,
  replacePresent as hReplace,
  moveNode as docMoveNode,
  addPiece,
  removePiece,
  patchPiece,
  setPieceNodes,
  clonePiece,
  translatePiece,
  mirrorPiece,
  rotatePiece,
  rotatePieceAbout,
  piecesCenter,
  addDart,
  contourRun,
  makeSeamRun,
  type SeamCheck,
  type SeamRun,
  addLabelToPiece,
  updateLabel,
  moveLabel,
  removeLabel,
  type PieceLabel,
  insertNodeOnSegment,
  removeNode,
  setNodeSmooth,
  moveHandle,
  pieceFromPoints,
  rectPiece,
  ellipsePiece,
  bounds,
  setNodeGrade,
  makeId,
  type ModelVariant,
  type Piece,
  type PiecePatch,
} from "@hilonova/geometry";
import {
  demoJeanDoc,
  draftBlock,
  compareSizes,
  rederiveGrades,
  graduatePantalon,
  DEFAULT_MEASUREMENTS,
  type LibraryEntry,
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

export type Tool =
  | "select" | "pan" | "notch"
  | "line" | "curve" | "rect" | "circle" | "addnode" | "measure" | "text" | "dart" | "seam";

/** Trazo en construcción (todavía no es parte del documento). */
export type Draft =
  | { kind: "path"; smooth: boolean; points: Vec2[] }
  | { kind: "rect"; a: Vec2; b: Vec2 }
  | { kind: "circle"; c: Vec2; r: number }
  | { kind: "measure"; a: Vec2; b: Vec2 }
  | { kind: "marquee"; a: Vec2; b: Vec2 }
  | { kind: "dart"; pieceId: string; segIndex: number; t: number; base: Vec2; dir: Vec2 }
  | {
      kind: "seam";
      /** lado al que se agregan los tramos que se elijan */
      side: "a" | "b";
      a: SeamRun[];
      b: SeamRun[];
      /** primer punto elegido de un tramo, a la espera del segundo */
      pending: { pieceId: string; nodeId: string } | null;
    };
export type View =
  | "proyectos" | "editor" | "graduacion" | "trazo" | "produccion"
  | "materiales" | "libreria" | "reportes" | "config";

/** Id del patrón vigente en la biblioteca (si fue abierto o guardado). */
export interface SavedRef {
  id: string | null;
  dirty: boolean;        // hay cambios sin guardar
  lastSaved: string | null;
}

interface EditorState {
  history: History;
  selectedPieceId: string | null;
  /** piezas seleccionadas además de la principal (selección múltiple) */
  multi: string[];
  /** comprobación de costura resaltada en el lienzo */
  activeSeam: string | null;
  setActiveSeam(id: string | null): void;
  seamPick(pieceId: string, nodeId: string): void;
  seamSide(side: "a" | "b"): void;
  seamCreate(): boolean;
  patchSeamCheck(id: string, patch: Partial<Pick<SeamCheck, "name" | "ease">>): void;
  deleteSeamCheck(id: string): void;
  /** ancho de la boca de la pinza, cm */
  dartWidth: number;
  setDartWidth(w: number): void;
  /** aviso breve para la barra de estado (p. ej. por qué no se pudo hacer algo) */
  notice: string | null;
  setNotice(msg: string | null): void;
  /** abre una pinza en el contorno; devuelve false si no cabe */
  addDartAt(pieceId: string, segIndex: number, t: number, apex: Vec2): boolean;
  /** texto seleccionado (pertenece a una pieza) */
  selectedLabel: { pieceId: string; labelId: string } | null;
  /** portapapeles de piezas (copiar y pegar) */
  clipboard: Piece[];
  pasteCount: number;
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
  /** precio de la tela por metro (MXN), para el costo de tela por prenda */
  fabricPrice: number;
  setFabricPrice(v: number): void;
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
  /** trazo en construcción con las herramientas de dibujo */
  draft: Draft | null;
  /** tamaño del lienzo en px (lo informa el Canvas) para centrar piezas nuevas */
  viewSize: { w: number; h: number };
  setViewSize(w: number, h: number): void;

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
  /** Ctrl+clic: agrega o quita una pieza de la selección */
  toggleSelectPiece(id: string): void;
  /** agrega un texto a la pieza en la posición dada (cm del documento) */
  addLabelAt(pieceId: string, at: Vec2): void;
  selectLabel(pieceId: string, labelId: string): void;
  patchSelectedLabel(patch: Partial<Pick<PieceLabel, "text" | "size">>): void;
  /** arrastre en vivo del texto seleccionado (requiere beginDrag antes) */
  moveSelectedLabelTo(at: Vec2): void;
  deleteSelectedLabel(): void;
  selectPieces(ids: string[]): void;
  selectAllPieces(): void;
  copySelected(): void;
  pasteClipboard(): void;
  selectNode(pieceId: string, nodeId: string): void;
  clearSelection(): void;
  /** punto de retorno para deshacer antes de un arrastre (una sola entrada) */
  beginDrag(): void;
  /** arrastre en vivo del nodo seleccionado (requiere beginDrag antes) */
  moveSelectedNode(to: Vec2): void;
  /** arrastre en vivo de la pieza seleccionada, en cm */
  moveSelectedPieceBy(dx: number, dy: number): void;
  /** arrastre en vivo de un handle Bézier del nodo seleccionado */
  moveSelectedHandle(which: "in" | "out", to: Vec2): void;
  setDraft(d: Draft | null): void;
  addDraftPoint(p: Vec2): void;
  /** convierte el trazo en curso en pieza (cerrada) o línea interna (abierta) */
  finishPath(close: boolean): void;
  commitRect(a: Vec2, b: Vec2): void;
  commitCircle(c: Vec2, r: number): void;
  deleteSelection(): void;
  duplicateSelected(): void;
  mirrorSelected(): void;
  rotateSelected(deg: number): void;
  addNodeAt(pieceId: string, segIndex: number, t: number): void;
  setSelectedNodeSmooth(smooth: boolean): void;
  setSelectedNodePos(x: number, y: number): void;
  patchSelectedPiece(patch: PiecePatch): void;
  /** inserta una pieza de la biblioteca a la derecha del patrón actual */
  insertLibraryPiece(entry: LibraryEntry): void;
  /** inserta una pieza cualquiera (p. ej. de "mis piezas"), centrada en la vista */
  insertPiece(piece: Piece): void;
  /** variantes de modelo */
  addVariant(name: string, color: string): void;
  switchVariant(id: string): void;
  patchVariant(id: string, patch: Partial<Pick<ModelVariant, "name" | "color" | "note">>): void;
  deleteVariant(id: string): void;
  duplicateVariant(id: string): void;
  /** guarda lo que hay en el editor dentro de la variante activa */
  saveActiveVariant(): void;
  /** define la gama de tallas y cuál es la base (activa todas en el nido) */
  setSizeRange(sizes: string[], base: string): void;
  /** edita una regla de tallaje (cm por talla de una medida) y re-gradúa las piezas */
  setGradeStep(field: keyof BodyMeasurements, cmPerSize: number): void;
  /** restablece las reglas de tallaje a las de fábrica del bloque */
  resetGradeSteps(): void;
  /** graduación manual: cuánto se mueve un nodo por talla (null = sin regla) */
  setNodeGradeOf(pieceId: string, nodeId: string, grade: { dx: number; dy: number } | null): void;
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

/** Reemplaza los textos de una pieza dentro del documento. */
function patchPieceLabels(doc: PatternDoc, pieceId: string, piece: Piece): PatternDoc {
  return {
    ...doc,
    pieces: doc.pieces.map((p) => {
      if (p.id !== pieceId) return p;
      const { labels: _old, ...rest } = p;
      return piece.labels?.length ? { ...rest, labels: piece.labels } : rest;
    }),
  };
}

/** Ids de las piezas seleccionadas (la principal primero, sin repetidos). */
export function selectionOf(s: { selectedPieceId: string | null; multi: string[] }): string[] {
  return [...new Set([...(s.selectedPieceId ? [s.selectedPieceId] : []), ...s.multi])];
}

/** Estado del documento que cambia entre variantes. */
export function snapshotOf(doc: PatternDoc) {
  return {
    pieces: doc.pieces,
    sizes: doc.sizes,
    baseSize: doc.baseSize,
    ...(doc.gradeSteps ? { gradeSteps: doc.gradeSteps } : {}),
    ...(doc.measurements ? { measurements: doc.measurements } : {}),
    ...(doc.blockKind ? { blockKind: doc.blockKind } : {}),
  };
}

export const useEditor = create<EditorState>((set, get) => ({
  history: initHistory(demoJeanDoc()),
  selectedPieceId: null,
  multi: [],
  selectedLabel: null,
  activeSeam: null,
  setActiveSeam: (id) => set({ activeSeam: id }),
  seamPick: (pieceId, nodeId) => {
    const st = get();
    const cur = st.draft?.kind === "seam" ? st.draft : null;
    const d = cur ?? { kind: "seam" as const, side: "a" as const, a: [], b: [], pending: null };
    if (!d.pending) {
      set({ draft: { ...d, pending: { pieceId, nodeId } }, notice: null });
      return;
    }
    if (d.pending.pieceId !== pieceId) {
      set({ notice: "Los dos puntos de un tramo deben estar en la misma pieza." });
      return;
    }
    if (d.pending.nodeId === nodeId) {
      set({ notice: "Elige un segundo punto distinto del primero." });
      return;
    }
    const piece = st.history.present.pieces.find((p) => p.id === pieceId);
    if (!piece || !contourRun(piece, d.pending.nodeId, nodeId)) {
      set({ notice: "No se pudo medir ese tramo." });
      return;
    }
    const run = makeSeamRun(piece, d.pending.nodeId, nodeId);
    set({
      draft: d.side === "a" ? { ...d, a: [...d.a, run], pending: null } : { ...d, b: [...d.b, run], pending: null },
      notice: null,
    });
  },
  seamSide: (side) =>
    set((s) => (s.draft?.kind === "seam" ? { draft: { ...s.draft, side, pending: null } } : s)),
  seamCreate: () => {
    const { draft, history, saved } = get();
    if (draft?.kind !== "seam") return false;
    if (!draft.a.length || !draft.b.length) {
      set({ notice: "Hace falta al menos un tramo en el lado A y uno en el lado B." });
      return false;
    }
    const doc = history.present;
    const check: SeamCheck = {
      id: makeId("sc"),
      name: `Costura ${(doc.seamChecks?.length ?? 0) + 1}`,
      a: draft.a,
      b: draft.b,
      ease: 0,
    };
    set({
      history: hCommit(history, { ...doc, seamChecks: [...(doc.seamChecks ?? []), check] }),
      draft: null,
      activeSeam: check.id,
      tool: "select",
      notice: null,
      saved: { ...saved, dirty: true },
    });
    return true;
  },
  patchSeamCheck: (id, patch) => {
    const { history, saved } = get();
    const doc = history.present;
    set({
      history: hCommit(history, {
        ...doc,
        seamChecks: (doc.seamChecks ?? []).map((c) => (c.id === id ? { ...c, ...patch } : c)),
      }),
      saved: { ...saved, dirty: true },
    });
  },
  deleteSeamCheck: (id) => {
    const { history, saved, activeSeam } = get();
    const doc = history.present;
    set({
      history: hCommit(history, { ...doc, seamChecks: (doc.seamChecks ?? []).filter((c) => c.id !== id) }),
      activeSeam: activeSeam === id ? null : activeSeam,
      saved: { ...saved, dirty: true },
    });
  },
  dartWidth: 2.5,
  setDartWidth: (w) => set({ dartWidth: Math.max(0.5, Math.min(12, w)) }),
  notice: null,
  setNotice: (msg) => set({ notice: msg }),
  addDartAt: (pieceId, segIndex, t, apex) => {
    const { history, saved, dartWidth } = get();
    const piece = history.present.pieces.find((p) => p.id === pieceId);
    if (!piece) return false;
    const next = addDart(piece, segIndex, t, dartWidth, apex);
    if (!next) return false;
    set({
      history: hCommit(history, setPieceNodes(history.present, pieceId, next.nodes)),
      selectedPieceId: pieceId,
      multi: [],
      selectedNodeId: null,
      selectedLabel: null,
      draft: null,
      notice: null,
      saved: { ...saved, dirty: true },
    });
    return true;
  },
  clipboard: [],
  pasteCount: 0,
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
  fabricPrice: 0,
  setFabricPrice: (fabricPrice) => set({ fabricPrice: Math.max(0, fabricPrice) }),
  showNest: false,
  activeSizes: ["28", "30", "32", "34", "36"],
  measurements: { ...DEFAULT_MEASUREMENTS },
  blockKind: "pantalon-denim",
  saved: { id: null, dirty: false, lastSaved: null },
  draft: null,
  viewSize: { w: 800, h: 500 },
  setViewSize: (w, h) => set({ viewSize: { w, h } }),

  doc: () => get().history.present,
  canUndo: () => hCanUndo(get().history),
  canRedo: () => hCanRedo(get().history),

  setTool: (tool) => set({ tool, draft: null, notice: null }),
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
    set({ selectedPieceId: id, multi: [], selectedNodeId: null, selectedLabel: null }),

  selectNode: (pieceId, nodeId) =>
    set({ selectedPieceId: pieceId, multi: [], selectedNodeId: nodeId, selectedLabel: null }),

  clearSelection: () => set({ selectedPieceId: null, multi: [], selectedNodeId: null, selectedLabel: null }),

  addLabelAt: (pieceId, at) => {
    const { history, saved } = get();
    const piece = history.present.pieces.find((p) => p.id === pieceId);
    if (!piece) return;
    const res = addLabelToPiece(piece, at);
    set({
      history: hCommit(history, patchPieceLabels(history.present, pieceId, res.piece)),
      selectedPieceId: null,
      multi: [],
      selectedNodeId: null,
      selectedLabel: { pieceId, labelId: res.labelId },
      tool: "select",
      saved: { ...saved, dirty: true },
    });
  },

  selectLabel: (pieceId, labelId) =>
    set({ selectedPieceId: null, multi: [], selectedNodeId: null, selectedLabel: { pieceId, labelId } }),

  patchSelectedLabel: (patch) => {
    const { selectedLabel, history, saved } = get();
    if (!selectedLabel) return;
    const piece = history.present.pieces.find((p) => p.id === selectedLabel.pieceId);
    if (!piece) return;
    set({
      history: hCommit(history, patchPieceLabels(history.present, piece.id, updateLabel(piece, selectedLabel.labelId, patch))),
      saved: { ...saved, dirty: true },
    });
  },

  moveSelectedLabelTo: (at) => {
    const { selectedLabel, history } = get();
    if (!selectedLabel) return;
    const piece = history.present.pieces.find((p) => p.id === selectedLabel.pieceId);
    if (!piece) return;
    set({ history: hReplace(history, patchPieceLabels(history.present, piece.id, moveLabel(piece, selectedLabel.labelId, at))) });
  },

  deleteSelectedLabel: () => {
    const { selectedLabel, history, saved } = get();
    if (!selectedLabel) return;
    const piece = history.present.pieces.find((p) => p.id === selectedLabel.pieceId);
    if (!piece) return;
    set({
      history: hCommit(history, patchPieceLabels(history.present, piece.id, removeLabel(piece, selectedLabel.labelId))),
      selectedLabel: null,
      saved: { ...saved, dirty: true },
    });
  },

  toggleSelectPiece: (id) => {
    const cur = selectionOf(get());
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    set({ selectedPieceId: next[0] ?? null, multi: next.slice(1), selectedNodeId: null, selectedLabel: null });
  },

  selectPieces: (ids) =>
    set({ selectedPieceId: ids[0] ?? null, multi: ids.slice(1), selectedNodeId: null, selectedLabel: null }),

  selectAllPieces: () => {
    const ids = get().history.present.pieces.map((p) => p.id);
    set({ selectedPieceId: ids[0] ?? null, multi: ids.slice(1), selectedNodeId: null, selectedLabel: null });
  },

  copySelected: () => {
    const ids = selectionOf(get());
    const pieces = get().history.present.pieces.filter((p) => ids.includes(p.id));
    if (pieces.length) set({ clipboard: pieces, pasteCount: 0 });
  },

  pasteClipboard: () => {
    const { clipboard, history, saved, pasteCount } = get();
    if (!clipboard.length) return;
    const step = 6 * (pasteCount + 1);
    const copies = clipboard.map((p) => translatePiece(clonePiece(p), step, step));
    let doc = history.present;
    for (const c of copies) doc = addPiece(doc, c);
    set({
      history: hCommit(history, doc),
      selectedPieceId: copies[0]!.id,
      multi: copies.slice(1).map((c) => c.id),
      selectedNodeId: null,
      pasteCount: pasteCount + 1,
      saved: { ...saved, dirty: true },
    });
  },

  beginDrag: () => {
    const { history, saved } = get();
    set({ history: hCheckpoint(history), saved: { ...saved, dirty: true } });
  },

  moveSelectedNode: (to) => {
    const { selectedPieceId, selectedNodeId, history } = get();
    if (!selectedPieceId || !selectedNodeId) return;
    const next = docMoveNode(history.present, selectedPieceId, selectedNodeId, to);
    set({ history: hReplace(history, next) });
  },

  moveSelectedPieceBy: (dx, dy) => {
    const ids = selectionOf(get());
    const { history } = get();
    if (!ids.length) return;
    let doc = history.present;
    for (const id of ids) {
      const piece = doc.pieces.find((p) => p.id === id);
      if (!piece) continue;
      doc = setPieceNodes(doc, id, translatePiece(piece, dx, dy).nodes);
    }
    set({ history: hReplace(history, doc) });
  },

  moveSelectedHandle: (which, to) => {
    const { selectedPieceId, selectedNodeId, history } = get();
    const piece = history.present.pieces.find((p) => p.id === selectedPieceId);
    if (!piece || !selectedNodeId) return;
    const next = moveHandle(piece, selectedNodeId, which, to);
    set({ history: hReplace(history, setPieceNodes(history.present, piece.id, next.nodes)) });
  },

  setDraft: (draft) => set({ draft }),

  addDraftPoint: (p) =>
    set((s) =>
      s.draft?.kind === "path" ? { draft: { ...s.draft, points: [...s.draft.points, p] } } : s,
    ),

  finishPath: (close) => {
    const { draft, history, saved } = get();
    if (draft?.kind !== "path") return;
    const minPts = close ? 3 : 2;
    if (draft.points.length < minPts) { set({ draft: null }); return; }
    const n = history.present.pieces.length + 1;
    const piece = pieceFromPoints(
      close ? `Pieza ${n}` : `Línea interna ${n}`,
      draft.points,
      { closed: close, smooth: draft.smooth },
    );
    set({
      history: hCommit(history, addPiece(history.present, piece)),
      selectedPieceId: piece.id,
      multi: [],
      selectedNodeId: null,
      draft: null,
      saved: { ...saved, dirty: true },
    });
  },

  commitRect: (a, b) => {
    const { history, saved } = get();
    if (Math.abs(a.x - b.x) < 0.3 || Math.abs(a.y - b.y) < 0.3) { set({ draft: null }); return; }
    const piece = rectPiece(`Pieza ${history.present.pieces.length + 1}`, a, b);
    set({
      history: hCommit(history, addPiece(history.present, piece)),
      selectedPieceId: piece.id,
      multi: [],
      selectedNodeId: null,
      draft: null,
      saved: { ...saved, dirty: true },
    });
  },

  commitCircle: (c, r) => {
    const { history, saved } = get();
    if (r < 0.3) { set({ draft: null }); return; }
    const piece = ellipsePiece(`Pieza ${history.present.pieces.length + 1}`, c, r, r);
    set({
      history: hCommit(history, addPiece(history.present, piece)),
      selectedPieceId: piece.id,
      multi: [],
      selectedNodeId: null,
      draft: null,
      saved: { ...saved, dirty: true },
    });
  },

  deleteSelection: () => {
    const { selectedPieceId, selectedNodeId, history, saved } = get();
    const piece = history.present.pieces.find((p) => p.id === selectedPieceId);
    if (!piece) return;
    if (selectedNodeId) {
      const next = removeNode(piece, selectedNodeId);
      if (next === piece) return; // ya está en el mínimo de nodos
      set({
        history: hCommit(history, setPieceNodes(history.present, piece.id, next.nodes)),
        selectedNodeId: null,
        saved: { ...saved, dirty: true },
      });
      return;
    }
    let doc = history.present;
    for (const id of selectionOf(get())) doc = removePiece(doc, id);
    set({
      history: hCommit(history, doc),
      selectedPieceId: null,
      multi: [],
      saved: { ...saved, dirty: true },
    });
  },

  duplicateSelected: () => {
    const { history, saved } = get();
    const ids = selectionOf(get());
    const pieces = history.present.pieces.filter((p) => ids.includes(p.id));
    if (!pieces.length) return;
    const c = piecesCenter(pieces);
    let maxX = -Infinity, minX = Infinity;
    for (const p of pieces) {
      const b = bounds(p);
      maxX = Math.max(maxX, b.maxX); minX = Math.min(minX, b.minX);
    }
    const dx = maxX - minX + 6;
    void c;
    const copies = pieces.map((p) => translatePiece(clonePiece(p, `${p.name} copia`), dx, 0));
    let doc = history.present;
    for (const cp of copies) doc = addPiece(doc, cp);
    set({
      history: hCommit(history, doc),
      selectedPieceId: copies[0]!.id,
      multi: copies.slice(1).map((x) => x.id),
      selectedNodeId: null,
      saved: { ...saved, dirty: true },
    });
  },

  mirrorSelected: () => {
    const { history, saved } = get();
    let doc = history.present;
    for (const id of selectionOf(get())) {
      const piece = doc.pieces.find((p) => p.id === id);
      if (!piece) continue;
      const m = mirrorPiece(piece);
      doc = patchPiece(setPieceNodes(doc, id, m.nodes), id, { grainAngle: m.grainAngle });
    }
    set({ history: hCommit(history, doc), selectedNodeId: null, saved: { ...saved, dirty: true } });
  },

  rotateSelected: (deg) => {
    const { history, saved } = get();
    const ids = selectionOf(get());
    const pieces = history.present.pieces.filter((p) => ids.includes(p.id));
    if (!pieces.length) return;
    // varias piezas giran juntas alrededor del centro del grupo; una sola, alrededor de su centro
    const center = piecesCenter(pieces);
    let doc = history.present;
    for (const p of pieces) {
      const r = rotatePieceAbout(p, center, deg);
      doc = patchPiece(setPieceNodes(doc, p.id, r.nodes), p.id, { grainAngle: r.grainAngle });
    }
    set({ history: hCommit(history, doc), saved: { ...saved, dirty: true } });
  },

  addNodeAt: (pieceId, segIndex, t) => {
    const { history, saved } = get();
    const piece = history.present.pieces.find((p) => p.id === pieceId);
    if (!piece) return;
    const res = insertNodeOnSegment(piece, segIndex, t);
    set({
      history: hCommit(history, setPieceNodes(history.present, piece.id, res.piece.nodes)),
      selectedPieceId: piece.id,
      multi: [],
      selectedNodeId: res.nodeId,
      saved: { ...saved, dirty: true },
    });
  },

  setSelectedNodeSmooth: (smooth) => {
    const { selectedPieceId, selectedNodeId, history, saved } = get();
    const piece = history.present.pieces.find((p) => p.id === selectedPieceId);
    if (!piece || !selectedNodeId) return;
    const next = setNodeSmooth(piece, selectedNodeId, smooth);
    set({
      history: hCommit(history, setPieceNodes(history.present, piece.id, next.nodes)),
      saved: { ...saved, dirty: true },
    });
  },

  setSelectedNodePos: (x, y) => {
    const { selectedPieceId, selectedNodeId, history, saved } = get();
    if (!selectedPieceId || !selectedNodeId) return;
    set({
      history: hCommit(history, docMoveNode(history.present, selectedPieceId, selectedNodeId, { x, y })),
      saved: { ...saved, dirty: true },
    });
  },

  patchSelectedPiece: (patch) => {
    const { selectedPieceId, history, saved } = get();
    if (!selectedPieceId) return;
    set({
      history: hCommit(history, patchPiece(history.present, selectedPieceId, patch)),
      saved: { ...saved, dirty: true },
    });
  },

  insertLibraryPiece: (entry) => {
    get().insertPiece(entry.make(get().measurements));
  },

  insertPiece: (piece) => {
    const { history, saved, pan, zoom, viewSize } = get();
    const pb = bounds(piece);
    // centrada en lo que se ve del lienzo, para que aparezca a la vista
    const cx = (viewSize.w / 2 - pan.x) / zoom;
    const cy = (viewSize.h / 2 - pan.y) / zoom;
    const placed = translatePiece(
      clonePiece(piece),
      cx - (pb.minX + pb.maxX) / 2,
      cy - (pb.minY + pb.maxY) / 2,
    );
    set({
      history: hCommit(history, addPiece(history.present, placed)),
      selectedPieceId: placed.id,
      multi: [],
      selectedNodeId: null,
      saved: { ...saved, dirty: true },
    });
  },

  addVariant: (name, color) => {
    const { history, saved } = get();
    const cur = history.present;
    const variant: ModelVariant = {
      id: makeId("var"),
      name: name.trim() || `Variante ${(cur.variants?.length ?? 0) + 1}`,
      color,
      snapshot: snapshotOf(cur),
    };
    const variants = [...(cur.variants ?? []), variant];
    set({
      history: hCommit(history, { ...cur, variants, activeVariant: variant.id }),
      saved: { ...saved, dirty: true },
    });
  },

  switchVariant: (id) => {
    const { history, saved } = get();
    const cur = history.present;
    const variants = cur.variants ?? [];
    const target = variants.find((v) => v.id === id);
    if (!target) return;
    const next: PatternDoc = {
      ...cur,
      ...target.snapshot,
      variants,
      activeVariant: id,
    };
    set({
      history: hCommit(history, next),
      measurements: { ...DEFAULT_MEASUREMENTS, ...(target.snapshot.measurements ?? {}) } as BodyMeasurements,
      blockKind: (target.snapshot.blockKind as BlockKind | undefined) ?? get().blockKind,
      activeSizes: [...target.snapshot.sizes],
      selectedPieceId: null,
      multi: [],
      selectedNodeId: null,
      saved: { ...saved, dirty: true },
    });
  },

  patchVariant: (id, patch) => {
    const { history, saved } = get();
    const cur = history.present;
    set({
      history: hCommit(history, {
        ...cur,
        variants: (cur.variants ?? []).map((v) => (v.id === id ? { ...v, ...patch } : v)),
      }),
      saved: { ...saved, dirty: true },
    });
  },

  deleteVariant: (id) => {
    const { history, saved } = get();
    const cur = history.present;
    set({
      history: hCommit(history, {
        ...cur,
        variants: (cur.variants ?? []).filter((v) => v.id !== id),
        ...(cur.activeVariant === id ? { activeVariant: undefined } : {}),
      }),
      saved: { ...saved, dirty: true },
    });
  },

  saveActiveVariant: () => {
    const { history, saved } = get();
    const cur = history.present;
    if (!cur.activeVariant) return;
    set({
      history: hCommit(history, {
        ...cur,
        variants: (cur.variants ?? []).map((v) =>
          v.id === cur.activeVariant ? { ...v, snapshot: snapshotOf(cur) } : v,
        ),
      }),
      saved: { ...saved, dirty: true },
    });
  },

  duplicateVariant: (id) => {
    const { history, saved } = get();
    const cur = history.present;
    const variants = cur.variants ?? [];
    const src = variants.find((v) => v.id === id);
    if (!src) return;
    const copy: ModelVariant = { ...src, id: makeId("var"), name: `${src.name} copia` };
    set({
      history: hCommit(history, { ...cur, variants: [...variants, copy] }),
      saved: { ...saved, dirty: true },
    });
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
    const cur = history.present;
    const next = draftBlock(blockKind, m, cur.gradeSteps);
    // conservar nombre, ficha técnica, gama de tallas y variantes del documento vigente
    const named: PatternDoc = {
      ...next,
      name: cur.name,
      sizes: cur.sizes,
      baseSize: cur.baseSize,
      ...(cur.techPack ? { techPack: cur.techPack } : {}),
      ...(cur.variants ? { variants: cur.variants } : {}),
      ...(cur.activeVariant ? { activeVariant: cur.activeVariant } : {}),
      ...(cur.seamChecks ? { seamChecks: cur.seamChecks } : {}),
    };
    set({
      measurements: { ...m },
      history: hCommit(history, named),
      selectedPieceId: null,
      multi: [],
      selectedNodeId: null,
      saved: { ...saved, dirty: true },
    });
  },

  setSizeRange: (sizes, base) => {
    const { history, saved } = get();
    const next: PatternDoc = { ...history.present, sizes, baseSize: base };
    set({
      history: hCommit(history, next),
      activeSizes: [...sizes],
      saved: { ...saved, dirty: true },
    });
  },

  setGradeStep: (field, cmPerSize) => {
    const { history, saved, blockKind, measurements } = get();
    const cur = history.present;
    const rules = { ...(cur.gradeSteps ?? {}), [field]: cmPerSize };
    const next = rederiveGrades(cur, blockKind, measurements, rules);
    set({ history: hCommit(history, next), saved: { ...saved, dirty: true } });
  },

  resetGradeSteps: () => {
    const { history, saved, blockKind, measurements } = get();
    const next = rederiveGrades(history.present, blockKind, measurements, undefined);
    set({ history: hCommit(history, next), saved: { ...saved, dirty: true } });
  },

  setNodeGradeOf: (pieceId, nodeId, grade) => {
    const { history, saved } = get();
    set({
      history: hCommit(history, setNodeGrade(history.present, pieceId, nodeId, grade)),
      saved: { ...saved, dirty: true },
    });
  },

  undo: () => set((s) => ({ history: hUndo(s.history), saved: { ...s.saved, dirty: true } })),
  redo: () => set((s) => ({ history: hRedo(s.history), saved: { ...s.saved, dirty: true } })),

  resetDoc: () =>
    set({
      history: initHistory(demoJeanDoc()),
      selectedPieceId: null,
      multi: [],
      selectedNodeId: null,
      saved: { id: null, dirty: false, lastSaved: null },
    }),

  loadDoc: (doc, savedId) =>
    set({
      history: initHistory(doc),
      selectedPieceId: null,
      multi: [],
      selectedNodeId: null,
      blockKind: (doc.blockKind as BlockKind | undefined) ?? "pantalon-denim",
      activeSizes: [...doc.sizes],
      measurements: { ...DEFAULT_MEASUREMENTS, ...(doc.measurements ?? {}) } as BodyMeasurements,
      draft: null,
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
