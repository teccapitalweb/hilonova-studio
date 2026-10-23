// Biblioteca de patrones del usuario. La copia de trabajo vive en localStorage (library-raw.ts); con una cuenta de
// Firebase cada cambio se anota para subirlo a la nube (cloud.ts). La API pública es la de siempre.
// Un "item" guarda el PatternDoc + metadata (nombre, timestamps, thumbnail).

"use client";

import { useEffect, useState } from "react";
import { serialize, deserialize, type PatternDoc } from "@hilonova/geometry";
import { cloudNotify } from "./cloud";
import { SAVE_ERROR, readAll, writeAll, type LibraryItem } from "./library-raw";

export { SAVE_ERROR };
export type { LibraryItem };

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
      cloudNotify(id, "put");
      return id;
    }
  }
  const newId = uid();
  all.push({ id: newId, name, doc: serialized, createdAt: now, updatedAt: now });
  writeAll(all);
  cloudNotify(newId, "put");
  return newId;
}

export function deleteItem(id: string): void {
  writeAll(readAll().filter((it) => it.id !== id));
  cloudNotify(id, "del");
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
  cloudNotify(id, "put");
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
  for (const it of items) if (it && typeof it.id === "string") cloudNotify(it.id, "put");
  return n;
}
