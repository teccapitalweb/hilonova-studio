// Copia en la nube: mezcla, subida de cambios, borrar, falta de internet y cambio de cuenta en el mismo navegador.
// Se usa una nube de mentira (RemoteStore) y un navegador de mentira; Firestore real se prueba a mano.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emptyDoc, serialize } from "@hilonova/geometry";
import { planMerge } from "../apps/web/app/lib/cloud-merge";
import {
  __resetCloudForTests,
  cloudBeforeSignOut,
  flushNow,
  getCloudStatus,
  pendingCount,
  syncLibrary,
  type RemoteStore,
} from "../apps/web/app/lib/cloud";
import { deleteItem, getItem, listItems, renameItem, saveItem } from "../apps/web/app/lib/library";
import { readAll, writeAll, type LibraryItem } from "../apps/web/app/lib/library-raw";

const item = (id: string, name: string, updatedAt: string): LibraryItem => ({
  id,
  name,
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt,
  doc: serialize(emptyDoc(name)),
});

const T1 = "2026-10-01T10:00:00.000Z";
const T2 = "2026-10-02T10:00:00.000Z";
const T3 = "2026-10-03T10:00:00.000Z";

describe("planMerge", () => {
  it("lo que solo está en la nube se baja y lo que solo está aquí se sube", () => {
    const p = planMerge([item("a", "A", T1)], [item("b", "B", T1)], new Set());
    expect(p.toLocal.map((i) => i.id)).toEqual(["b"]);
    expect(p.toRemote.map((i) => i.id)).toEqual(["a"]);
  });

  it("si está en los dos gana la edición más reciente", () => {
    const p = planMerge([item("a", "A local", T3), item("b", "B local", T1)], [item("a", "A nube", T2), item("b", "B nube", T2)], new Set());
    expect(p.toRemote.map((i) => i.name)).toEqual(["A local"]);
    expect(p.toLocal.map((i) => i.name)).toEqual(["B nube"]);
  });

  it("si empatan no se mueve nada", () => {
    const p = planMerge([item("a", "A", T2)], [item("a", "A", T2)], new Set());
    expect(p).toEqual({ toLocal: [], toRemote: [], deleteRemote: [] });
  });

  it("lo que se borró aquí sin conexión no vuelve a bajar: se borra en la nube", () => {
    const p = planMerge([], [item("a", "A", T1)], new Set(["a"]));
    expect(p.toLocal).toEqual([]);
    expect(p.deleteRemote).toEqual(["a"]);
  });

  it("lo borrado aquí que ya no está en la nube tampoco se sube", () => {
    const p = planMerge([item("a", "A", T1)], [], new Set(["a"]));
    expect(p.toRemote).toEqual([]);
  });
});

// ─── navegador y nube de mentira ────────────────────────────────────────────

function fakeStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => (data.has(k) ? data.get(k)! : null),
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

/** Nube de mentira: guarda por cuenta y anota las llamadas; `down` simula que no hay internet. */
function fakeRemote(initial: Record<string, LibraryItem[]> = {}) {
  const db = new Map<string, Map<string, LibraryItem>>();
  for (const [uid, items] of Object.entries(initial)) db.set(uid, new Map(items.map((i) => [i.id, i])));
  const calls: string[] = [];
  const state = { down: false };
  const guard = () => {
    if (state.down) throw new Error("sin internet");
  };
  const store: RemoteStore = {
    async list(uid) {
      calls.push(`list ${uid}`);
      guard();
      return [...(db.get(uid)?.values() ?? [])];
    },
    async put(uid, it) {
      calls.push(`put ${it.id}`);
      guard();
      if (!db.has(uid)) db.set(uid, new Map());
      db.get(uid)!.set(it.id, it);
    },
    async del(uid, id) {
      calls.push(`del ${id}`);
      guard();
      db.get(uid)?.delete(id);
    },
  };
  return { store, calls, state, ids: (uid: string) => [...(db.get(uid)?.keys() ?? [])].sort(), get: (uid: string, id: string) => db.get(uid)?.get(id) };
}

let local: ReturnType<typeof fakeStorage>;
let session: ReturnType<typeof fakeStorage>;

beforeEach(() => {
  local = fakeStorage();
  session = fakeStorage();
  vi.stubGlobal("window", {
    localStorage: local,
    sessionStorage: session,
    dispatchEvent: () => true,
    addEventListener: () => {},
  });
  vi.stubGlobal("navigator", { storage: { persist: async () => true } });
  vi.spyOn(console, "warn").mockImplementation(() => {});
  __resetCloudForTests();
});
afterEach(() => {
  __resetCloudForTests();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const docNamed = (name: string) => emptyDoc(name);

describe("entrar con la cuenta", () => {
  it("la primera vez sube lo que ya había guardado en este navegador (no se pierde nada)", async () => {
    writeAll([item("p1", "Falda", T1), item("p2", "Blusa", T2)]);
    const r = fakeRemote();
    await syncLibrary("ana", r.store);
    expect(r.ids("ana")).toEqual(["p1", "p2"]);
    expect(pendingCount()).toBe(0);
    expect(getCloudStatus()).toBe("ok");
  });

  it("en otra computadora baja los patrones de la nube", async () => {
    const r = fakeRemote({ ana: [item("p1", "Falda", T1), item("p2", "Blusa", T2)] });
    await syncLibrary("ana", r.store);
    expect(listItems().map((i) => i.name).sort()).toEqual(["Blusa", "Falda"]);
    expect(r.calls).not.toContain("put p1"); // no vuelve a subir lo que acaba de bajar
  });

  it("mezcla: sube lo nuevo de aquí, baja lo nuevo de la nube y deja ganar lo más reciente", async () => {
    writeAll([item("a", "A local", T3), item("solo-aqui", "Local", T1)]);
    const r = fakeRemote({ ana: [item("a", "A nube", T2), item("solo-nube", "Nube", T1)] });
    await syncLibrary("ana", r.store);
    expect(r.ids("ana")).toEqual(["a", "solo-aqui", "solo-nube"]);
    expect(r.get("ana", "a")!.name).toBe("A local");
    expect(listItems().map((i) => i.id).sort()).toEqual(["a", "solo-aqui", "solo-nube"]);
  });

  it("la mezcla completa se hace una vez por sesión del navegador", async () => {
    const r = fakeRemote();
    await syncLibrary("ana", r.store);
    await syncLibrary("ana", r.store);
    expect(r.calls.filter((c) => c.startsWith("list"))).toHaveLength(1);
  });

  it("sin internet al entrar no se pierde nada y se reintenta después", async () => {
    writeAll([item("p1", "Falda", T1)]);
    const r = fakeRemote();
    r.state.down = true;
    await syncLibrary("ana", r.store);
    expect(getCloudStatus()).toBe("error");
    expect(listItems()).toHaveLength(1);
    r.state.down = false;
    await syncLibrary("ana", r.store, true);
    expect(r.ids("ana")).toEqual(["p1"]);
    expect(getCloudStatus()).toBe("ok");
  });
});

describe("guardar, renombrar y borrar con la cuenta activa", () => {
  it("un patrón nuevo queda pendiente y se sube al hacer flush", async () => {
    const r = fakeRemote();
    await syncLibrary("ana", r.store);
    const id = saveItem(docNamed("Falda"), "Falda");
    expect(pendingCount()).toBe(1);
    expect(getCloudStatus()).toBe("pending");
    await flushNow(r.store);
    expect(r.ids("ana")).toEqual([id]);
    expect(pendingCount()).toBe(0);
  });

  it("varios cambios seguidos al mismo patrón se suben una sola vez", async () => {
    const r = fakeRemote();
    await syncLibrary("ana", r.store);
    const id = saveItem(docNamed("Falda"), "Falda");
    saveItem(docNamed("Falda"), "Falda v2", id);
    renameItem(id, "Falda v3");
    await flushNow(r.store);
    expect(r.calls.filter((c) => c === `put ${id}`)).toHaveLength(1);
    expect(r.get("ana", id)!.name).toBe("Falda v3");
  });

  it("borrar un patrón lo borra también en la nube", async () => {
    writeAll([item("p1", "Falda", T1)]);
    const r = fakeRemote();
    await syncLibrary("ana", r.store);
    deleteItem("p1");
    await flushNow(r.store);
    expect(r.ids("ana")).toEqual([]);
    expect(getItem("p1")).toBeNull();
  });

  it("si lo borras y se cae el internet, al volver no reaparece", async () => {
    writeAll([item("p1", "Falda", T1)]);
    const r = fakeRemote();
    await syncLibrary("ana", r.store);
    r.state.down = true;
    deleteItem("p1");
    await flushNow(r.store);
    expect(getCloudStatus()).toBe("error");
    expect(pendingCount()).toBe(1);
    r.state.down = false;
    await syncLibrary("ana", r.store, true);
    expect(r.ids("ana")).toEqual([]);
    expect(listItems()).toEqual([]);
  });

  it("sin internet los cambios se quedan en la cola y se suben cuando vuelve", async () => {
    const r = fakeRemote();
    await syncLibrary("ana", r.store);
    r.state.down = true;
    const id = saveItem(docNamed("Falda"), "Falda");
    await flushNow(r.store);
    expect(getCloudStatus()).toBe("error");
    expect(pendingCount()).toBe(1);
    expect(listItems()).toHaveLength(1); // en el navegador sigue guardado
    r.state.down = false;
    await flushNow(r.store);
    expect(r.ids("ana")).toEqual([id]);
    expect(pendingCount()).toBe(0);
  });

  it("si editas mientras se está subiendo, lo nuevo no se da por subido", async () => {
    const r = fakeRemote();
    await syncLibrary("ana", r.store);
    const id = saveItem(docNamed("Falda"), "Falda");
    const slowPut = r.store.put.bind(r.store);
    r.store.put = async (uid, it) => {
      saveItem(docNamed("Falda"), "Falda editada a media subida", id); // edición durante la subida
      await slowPut(uid, it);
    };
    await flushNow(r.store);
    expect(pendingCount()).toBe(1);
    r.store.put = slowPut;
    await flushNow(r.store);
    expect(r.get("ana", id)!.name).toBe("Falda editada a media subida");
    expect(pendingCount()).toBe(0);
  });

  it("cerrar sesión sube lo pendiente antes de salir", async () => {
    const r = fakeRemote();
    await syncLibrary("ana", r.store);
    const id = saveItem(docNamed("Falda"), "Falda");
    await cloudBeforeSignOut(r.store);
    expect(r.ids("ana")).toEqual([id]);
    expect(getCloudStatus()).toBe("off");
  });

  it("sin cuenta activa los cambios solo se anotan, no se suben", async () => {
    const r = fakeRemote();
    saveItem(docNamed("Falda"), "Falda");
    await flushNow(r.store);
    expect(r.calls).toEqual([]);
    expect(pendingCount()).toBe(1);
  });
});

describe("dos cuentas en el mismo navegador", () => {
  it("los patrones de una cuenta no se suben a la otra: se apartan en una copia", async () => {
    const r = fakeRemote({ beto: [item("b1", "Pantalón de Beto", T1)] });
    writeAll([item("a1", "Falda de Ana", T1)]);
    await syncLibrary("ana", r.store); // Ana reclama lo que hay y lo sube
    expect(r.ids("ana")).toEqual(["a1"]);

    await cloudBeforeSignOut(r.store);
    await syncLibrary("beto", r.store); // entra Beto en el mismo navegador

    expect(r.ids("beto")).toEqual(["b1"]); // a Beto no se le sube nada de Ana
    expect(listItems().map((i) => i.name)).toEqual(["Pantalón de Beto"]); // y no ve lo de Ana
    const orphan = JSON.parse(local.getItem("hilonova.library.orphan.v1")!);
    expect(orphan.owner).toBe("ana");
    expect(orphan.items.map((i: LibraryItem) => i.name)).toEqual(["Falda de Ana"]); // copia de seguridad
    expect(readAll()).toHaveLength(1);
  });

  it("cuando vuelve la misma cuenta, se mezcla normal con lo suyo", async () => {
    const r = fakeRemote();
    writeAll([item("a1", "Falda de Ana", T1)]);
    await syncLibrary("ana", r.store);
    await cloudBeforeSignOut(r.store);
    session.removeItem("hilonova.cloud.synced.ana");
    await syncLibrary("ana", r.store);
    expect(listItems().map((i) => i.id)).toEqual(["a1"]);
    expect(local.getItem("hilonova.library.orphan.v1")).toBeNull();
  });
});
