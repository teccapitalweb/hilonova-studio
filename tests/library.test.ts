// Biblioteca de proyectos (localStorage): guardar, abrir, respaldo, y que un fallo al guardar se note.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emptyDoc, serialize } from "@hilonova/geometry";
import {
  SAVE_ERROR,
  daysSinceBackup,
  deleteItem,
  exportAllItems,
  getItem,
  importItems,
  listItems,
  loadDoc,
  markBackup,
  renameItem,
  saveItem,
} from "../apps/web/app/lib/library";

/** localStorage de mentira, con la opción de simular que está lleno. */
function fakeStorage() {
  const data = new Map<string, string>();
  const s = {
    full: false,
    getItem: (k: string) => (data.has(k) ? data.get(k)! : null),
    setItem: (k: string, v: string) => {
      if (s.full) throw new Error("QuotaExceededError");
      data.set(k, v);
    },
    removeItem: (k: string) => void data.delete(k),
  };
  return s;
}

let storage: ReturnType<typeof fakeStorage>;
let persist: ReturnType<typeof vi.fn>;

beforeEach(() => {
  storage = fakeStorage();
  persist = vi.fn(async () => true);
  vi.stubGlobal("window", { localStorage: storage, dispatchEvent: () => true });
  vi.stubGlobal("navigator", { storage: { persist } });
});
afterEach(() => vi.unstubAllGlobals());

const docNamed = (name: string) => emptyDoc(name);

describe("guardar y abrir", () => {
  it("guarda un proyecto y se vuelve a abrir igual", () => {
    const id = saveItem(docNamed("Falda"), "Falda");
    expect(listItems()).toHaveLength(1);
    expect(loadDoc(id)?.name).toBe("Falda");
  });

  it("guardar con el mismo id actualiza y no duplica", () => {
    const id = saveItem(docNamed("A"), "A");
    saveItem(docNamed("A"), "A v2", id);
    expect(listItems()).toHaveLength(1);
    expect(getItem(id)?.name).toBe("A v2");
  });

  it("borrar y renombrar", () => {
    const id = saveItem(docNamed("A"), "A");
    renameItem(id, "Nuevo nombre");
    expect(loadDoc(id)?.name).toBe("Nuevo nombre");
    deleteItem(id);
    expect(listItems()).toHaveLength(0);
  });
});

describe("cuando el navegador no deja guardar", () => {
  it("avisa con un error en vez de fingir que guardó", () => {
    storage.full = true;
    expect(() => saveItem(docNamed("A"), "A")).toThrow(SAVE_ERROR);
  });

  it("lo que ya estaba guardado queda intacto", () => {
    const id = saveItem(docNamed("A"), "A");
    storage.full = true;
    expect(() => saveItem(docNamed("A"), "A cambiado", id)).toThrow(SAVE_ERROR);
    storage.full = false;
    expect(getItem(id)?.name).toBe("A");
  });

  it("renombrar y borrar también avisan si no se puede escribir", () => {
    const id = saveItem(docNamed("A"), "A");
    storage.full = true;
    expect(() => renameItem(id, "B")).toThrow(SAVE_ERROR);
    expect(() => deleteItem(id)).toThrow(SAVE_ERROR);
  });
});

describe("almacenamiento persistente", () => {
  it("se pide una sola vez, al guardar por primera vez", async () => {
    vi.resetModules(); // el aviso de "ya se pidió" vive en el módulo: se parte de cero
    const lib = await import("../apps/web/app/lib/library");
    lib.saveItem(docNamed("A"), "A");
    lib.saveItem(docNamed("B"), "B");
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it("si el navegador no lo soporta, guardar sigue funcionando", async () => {
    vi.resetModules();
    vi.stubGlobal("navigator", {});
    const lib = await import("../apps/web/app/lib/library");
    expect(() => lib.saveItem(docNamed("A"), "A")).not.toThrow();
  });
});

describe("respaldo", () => {
  it("exporta todos los proyectos y se restauran en otro navegador sin borrar nada", () => {
    const a = saveItem(docNamed("A"), "A");
    saveItem(docNamed("B"), "B");
    const backup = exportAllItems();
    expect(backup).toHaveLength(2);

    // otro navegador: biblioteca vacía con un proyecto propio
    storage = fakeStorage();
    vi.stubGlobal("window", { localStorage: storage, dispatchEvent: () => true });
    const own = saveItem(docNamed("Propio"), "Propio");
    expect(importItems(backup)).toBe(2);
    expect(listItems()).toHaveLength(3);
    expect(getItem(own)?.name).toBe("Propio");
    expect(getItem(a)?.name).toBe("A");
  });

  it("restaurar dos veces el mismo respaldo no duplica proyectos", () => {
    saveItem(docNamed("A"), "A");
    const backup = exportAllItems();
    importItems(backup);
    importItems(backup);
    expect(listItems()).toHaveLength(1);
  });

  it("ignora lo que no es un proyecto válido", () => {
    const good = exportAllItems();
    const n = importItems([
      { id: "x1", name: "roto", createdAt: "", updatedAt: "", doc: "{no es json" },
      { id: 5 as unknown as string, name: "sin id", createdAt: "", updatedAt: "", doc: serialize(docNamed("Z")) },
      null as never,
      ...good,
    ]);
    expect(n).toBe(0);
    expect(listItems()).toHaveLength(0);
  });
});

describe("recordatorio de respaldo", () => {
  it("sin respaldo nunca descargado devuelve null", () => {
    expect(daysSinceBackup()).toBeNull();
  });

  it("cuenta los días desde el último respaldo", () => {
    markBackup();
    expect(daysSinceBackup()).toBe(0);
    expect(daysSinceBackup(new Date(Date.now() + 8 * 86_400_000))).toBe(8);
  });

  it("una fecha dañada se trata como que no hay respaldo", () => {
    storage.setItem("hilonova.lastBackup.v1", "no-es-fecha");
    expect(daysSinceBackup()).toBeNull();
  });
});
