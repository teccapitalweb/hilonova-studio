// Undo/Redo por snapshots. Como el PatternDoc es inmutable, basta guardar
// la referencia anterior; no copiamos profundo.

import type { PatternDoc } from "./doc";

export interface History {
  readonly past: readonly PatternDoc[];
  readonly present: PatternDoc;
  readonly future: readonly PatternDoc[];
}

const CAP = 100; // techo del historial para no crecer sin control

export const initHistory = (initial: PatternDoc): History => ({
  past: [],
  present: initial,
  future: [],
});

/** Aplica una edición al presente y empuja el anterior al past. */
export function commit(h: History, next: PatternDoc): History {
  if (next === h.present) return h;
  const past = [...h.past, h.present].slice(-CAP);
  return { past, present: next, future: [] };
}

export function undo(h: History): History {
  if (h.past.length === 0) return h;
  const prev = h.past[h.past.length - 1]!;
  return {
    past: h.past.slice(0, -1),
    present: prev,
    future: [h.present, ...h.future],
  };
}

export function redo(h: History): History {
  if (h.future.length === 0) return h;
  const next = h.future[0]!;
  return {
    past: [...h.past, h.present].slice(-CAP),
    present: next,
    future: h.future.slice(1),
  };
}

export const canUndo = (h: History): boolean => h.past.length > 0;
export const canRedo = (h: History): boolean => h.future.length > 0;
