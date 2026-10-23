// Biblioteca de patrones del usuario, persistida en localStorage.
// Un "item" guarda el PatternDoc + metadata (nombre, timestamps, thumbnail).
// En producción real esto será una tabla en Supabase; la API es la misma.

"use client";

import { useEffect, useState } from "react";
import { serialize, deserialize, type PatternDoc } from "@hilonova/geometry";

export interface LibraryItem {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  /** JSON del documento (serializado) */
  doc: string;
}

const KEY = "hilonova.library.v1";

function readAll(): LibraryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LibraryItem[];
  } catch {
    return [];
  }
}

/** Mensaje cuando el navegador no deja guardar (sin espacio, modo privado o almacenamiento bloqueado). */
export const SAVE_ERROR =
  "No se pudo guardar en este navegador (sin espacio, modo privado o almacenamiento bloqueado).";

let persistAsked = false;

/** Pide al navegador que no borre los datos del sitio cuando le falte espacio. Solo se pide una vez. */
function askPersistentStorage() {
  if (persistAsked || typeof navigator === "undefined") return;
  persistAsked = true;
  try {
    void navigator.storage?.persist?.();
  } catch {
    /* ignore */
  }
}

function writeAll(items: LibraryItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // antes se ignoraba: el patrón parecía guardado y no lo estaba
    throw new Error(SAVE_ERROR);
  }
  askPersistentStorage();
  window.dispatchEvent(new Event("hilonova:library"));
}

// ─── recordatorio de respaldo ───────────────────────────────────────────────

const BACKUP_KEY = "hilonova.lastBackup.v1";

/** Marca que se descargó un respaldo ahora. */
export function markBackup(): void {
  try {
    window.localStorage.setItem(BACKUP_KEY, new Date().toISOString());
  } catch {
    /* ignore */
  }
}

/** Días desde el último respaldo descargado; null si nunca se ha descargado uno. */
export function daysSinceBackup(now: Date = new Date()): number | null {
  try {
    const raw = typeof window === "undefined" ? null : window.localStorage.getItem(BACKUP_KEY);
    if (!raw) return null;
    const t = Date.parse(raw);
    return Number.isNaN(t) ? null : Math.floor((now.getTime() - t) / 86_400_000);
  } catch {
    return null;
  }
}

const uid = (): string =>
  "pt_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

/** Lista los patrones del usuario, más recientes primero. */
export function listItems(): LibraryItem[] {
  return [...readAll()].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function getItem(id: string): LibraryItem | null {
  return readAll().find((it) => it.id === id) ?? null;
}

/** Guarda (upsert) un patrón. Devuelve el id. Lanza un Error con `SAVE_ERROR` si el navegador no deja guardar. */
export function saveItem(doc: PatternDoc, nameOverride?: string, id?: string): string {
  const all = readAll();
  const now = new Date().toISOString();
  const name = nameOverride ?? doc.name;
  const serialized = serialize({ ...doc, name });
  if (id) {
    const idx = all.findIndex((it) => it.id === id);
    if (idx >= 0) {
      all[idx] = { ...all[idx]!, name, doc: serialized, updatedAt: now };
      writeAll(all);
      return id;
    }
  }
  const newId = uid();
  all.push({ id: newId, name, doc: serialized, createdAt: now, updatedAt: now });
  writeAll(all);
  return newId;
}

export function deleteItem(id: string): void {
  writeAll(readAll().filter((it) => it.id !== id));
}

export function renameItem(id: string, name: string): void {
  const all = readAll();
  const idx = all.findIndex((it) => it.id === id);
  if (idx < 0) return;
  const item = all[idx]!;
  const doc = deserialize(item.doc);
  all[idx] = {
    ...item,
    name,
    doc: serialize({ ...doc, name }),
    updatedAt: new Date().toISOString(),
  };
  writeAll(all);
}

/** Carga el doc parseado de un item. */
export function loadDoc(id: string): PatternDoc | null {
  const item = getItem(id);
  if (!item) return null;
  try {
    return deserialize(item.doc);
  } catch {
    return null;
  }
}

// ─── Hook de React ──────────────────────────────────────────────────────────

export function useLibrary(): LibraryItem[] {
  const [items, setItems] = useState<LibraryItem[]>([]);
  useEffect(() => {
    setItems(listItems());
    const onChange = () => setItems(listItems());
    window.addEventListener("hilonova:library", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("hilonova:library", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return items;
}

// ─── respaldo ───────────────────────────────────────────────────────────────

/** Todos los patrones guardados (para respaldo). */
export function exportAllItems(): LibraryItem[] {
  return readAll();
}

/** Importa patrones de un respaldo: agrega o actualiza por id; nunca borra. */
export function importItems(items: LibraryItem[]): number {
  const all = readAll();
  let n = 0;
  for (const it of items) {
    if (!it || typeof it.id !== "string" || typeof it.doc !== "string") continue;
    try { deserialize(it.doc); } catch { continue; } // se ignora lo que no sea un documento válido
    const i = all.findIndex((x) => x.id === it.id);
    if (i >= 0) all[i] = it; else all.push(it);
    n++;
  }
  writeAll(all);
  return n;
}
