// Preferencias del editor, persistidas en localStorage.

"use client";

export interface Prefs {
  gridStep: number;
  snapGrid: boolean;
  showSeam: boolean;
  fabricWidth: number;
}

const KEY = "hilonova.prefs.v1";

export const DEFAULT_PREFS: Prefs = { gridStep: 1, snapGrid: true, showSeam: true, fabricWidth: 150 };

export function loadPrefs(): Prefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<Prefs>) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(p: Prefs): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* ignore */ }
}
