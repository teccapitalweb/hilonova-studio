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

function writeAll(items: LibraryItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("hilonova:library"));
  } catch {
    /* ignore */
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

/** Guarda (upsert) un patrón. Devuelve el id. */
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
