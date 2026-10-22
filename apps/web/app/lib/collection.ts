// Colecciones pequeñas persistidas en localStorage (materiales, piezas propias).
// Misma idea que la biblioteca de patrones: la API se mantiene cuando haya
// backend real y solo cambia esta implementación.

"use client";

import { useEffect, useState } from "react";

export interface Collection<T extends { id: string }> {
  list(): T[];
  upsert(item: T): void;
  remove(id: string): void;
  replaceAll(items: T[]): void;
  useAll(): T[];
}

const newId = (prefix: string): string =>
  prefix + "_" + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

export { newId };

export function createCollection<T extends { id: string }>(
  key: string,
  seed: () => T[] = () => [],
): Collection<T> {
  const event = `hilonova:${key}`;

  function read(): T[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) {
        const initial = seed();
        window.localStorage.setItem(key, JSON.stringify(initial));
        return initial;
      }
      return JSON.parse(raw) as T[];
    } catch {
      return [];
    }
  }

  function write(items: T[]): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(items));
      window.dispatchEvent(new Event(event));
    } catch {
      /* ignore quota / disabled storage */
    }
  }

  return {
    list: read,
    upsert(item) {
      const all = read();
      const i = all.findIndex((x) => x.id === item.id);
      if (i >= 0) all[i] = item; else all.push(item);
      write(all);
    },
    remove(id) {
      write(read().filter((x) => x.id !== id));
    },
    replaceAll: write,
    useAll() {
      // el hook vive dentro del objeto pero respeta las reglas de hooks: se llama como función de componente
      const [items, setItems] = useState<T[]>([]);
      useEffect(() => {
        setItems(read());
        const onChange = () => setItems(read());
        window.addEventListener(event, onChange);
        window.addEventListener("storage", onChange);
        return () => {
          window.removeEventListener(event, onChange);
          window.removeEventListener("storage", onChange);
        };
      }, []);
      return items;
    },
  };
}
