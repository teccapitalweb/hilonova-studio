// Copia de la biblioteca en la nube (Firestore), ligada a la cuenta de cada persona.
//
// El navegador sigue siendo la copia de trabajo (rápida y sin internet); la nube es el respaldo y lo que permite
// abrir los mismos patrones en otra computadora:
//  - cada cambio (guardar, renombrar, borrar) se anota en una cola y se sube a los 20 segundos, al cerrar sesión
//    y al salir de la página (así no se gasta el límite diario de escrituras del plan gratis);
//  - al entrar con la cuenta se baja lo que hay en la nube y se mezcla con lo de este navegador (gana lo más
//    reciente; lo que solo existe aquí se sube);
//  - si en este navegador había patrones de OTRA cuenta, se apartan en una copia y no se suben a esta cuenta.

"use client";

import { useEffect, useState } from "react";
import { firebaseConfigured, getDb, withTimeout } from "./firebase";
import { readAll, writeAll, type LibraryItem } from "./library-raw";
import { planMerge } from "./cloud-merge";

export type CloudStatus = "off" | "ok" | "syncing" | "pending" | "error";

/** Lo que se necesita de la nube; Firestore es la implementación real y las pruebas usan una de mentira. */
export interface RemoteStore {
  list(uid: string): Promise<LibraryItem[]>;
  put(uid: string, item: LibraryItem): Promise<void>;
  del(uid: string, id: string): Promise<void>;
}

const OP_TIMEOUT_MS = 15_000;
const FLUSH_DELAY_MS = 20_000;
const RETRY_DELAY_MS = 60_000;

export const firestoreStore: RemoteStore = {
  async list(uid) {
    const db = await getDb();
    const { collection, getDocs } = await import("firebase/firestore");
    const snap = await withTimeout(getDocs(collection(db, "users", uid, "patterns")), OP_TIMEOUT_MS, "leer patrones");
    const out: LibraryItem[] = [];
    for (const d of snap.docs) {
      const x = d.data() as Partial<Record<keyof LibraryItem, unknown>>;
      if (typeof x.doc !== "string" || !x.doc) continue;
      out.push({ id: d.id, name: String(x.name ?? ""), doc: x.doc, createdAt: String(x.createdAt ?? ""), updatedAt: String(x.updatedAt ?? "") });
    }
    return out;
  },
  async put(uid, item) {
    const db = await getDb();
    const { doc, setDoc } = await import("firebase/firestore");
    await withTimeout(
      setDoc(doc(db, "users", uid, "patterns", item.id), { name: item.name, doc: item.doc, createdAt: item.createdAt, updatedAt: item.updatedAt }),
      OP_TIMEOUT_MS,
      "guardar patrón",
    );
  },
  async del(uid, id) {
    const db = await getDb();
    const { doc, deleteDoc } = await import("firebase/firestore");
    await withTimeout(deleteDoc(doc(db, "users", uid, "patterns", id)), OP_TIMEOUT_MS, "borrar patrón");
  },
};

// ─── cola de cambios pendientes ─────────────────────────────────────────────

const QUEUE_KEY = "hilonova.cloudq.v1";
const OWNER_KEY = "hilonova.library.owner.v1";
const ORPHAN_KEY = "hilonova.library.orphan.v1";
const SYNCED_KEY = "hilonova.cloud.synced.";

type Op = "put" | "del";
/** `at` distingue una anotación de otra del mismo patrón: si se edita mientras se sube, no se da por subido lo nuevo. */
type QueueEntry = { op: Op; at: string };
type Queue = Record<string, QueueEntry>;

let counter = 0;
const stamp = (): string => `${Date.now()}-${counter++}`;

function readQueue(): Queue {
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as Queue) : {};
  } catch {
    return {};
  }
}

function writeQueue(q: Queue) {
  try {
    if (Object.keys(q).length === 0) window.localStorage.removeItem(QUEUE_KEY);
    else window.localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  } catch {
    /* sin espacio: el patrón queda guardado en el navegador igualmente */
  }
}

export function pendingCount(): number {
  return typeof window === "undefined" ? 0 : Object.keys(readQueue()).length;
}

// ─── estado ─────────────────────────────────────────────────────────────────

let status: CloudStatus = "off";
let activeUid: string | null = null;

function setStatus(next: CloudStatus) {
  status = next;
  if (typeof window !== "undefined") window.dispatchEvent(new Event("hilonova:cloud"));
}

export function getCloudStatus(): CloudStatus {
  return status;
}

/** Estado de la copia en la nube para mostrarlo en pantalla. */
export function useCloudStatus(): { status: CloudStatus; pending: number } {
  const [state, setState] = useState<{ status: CloudStatus; pending: number }>({ status: "off", pending: 0 });
  useEffect(() => {
    const read = () => setState({ status: getCloudStatus(), pending: pendingCount() });
    read();
    window.addEventListener("hilonova:cloud", read);
    return () => window.removeEventListener("hilonova:cloud", read);
  }, []);
  return state;
}

// ─── subir cambios ──────────────────────────────────────────────────────────

let timer: ReturnType<typeof setTimeout> | null = null;
let flushing: Promise<void> | null = null;

function scheduleFlush(ms: number) {
  if (timer || typeof window === "undefined") return;
  timer = setTimeout(() => {
    timer = null;
    void flushNow();
  }, ms);
  (timer as unknown as { unref?: () => void }).unref?.();
}

/** Anota un cambio hecho en este navegador para subirlo a la nube. Lo llama library.ts. */
export function cloudNotify(id: string, op: Op): void {
  if (!firebaseConfigured() || typeof window === "undefined") return;
  const q = readQueue();
  q[id] = { op, at: stamp() };
  writeQueue(q);
  if (activeUid) {
    setStatus("pending");
    scheduleFlush(FLUSH_DELAY_MS);
  }
}

/** Sube ya los cambios pendientes. Si ya hay una subida en curso, espera a esa. */
export function flushNow(store: RemoteStore = firestoreStore): Promise<void> {
  const uid = activeUid;
  if (!uid) return Promise.resolve();
  flushing ??= (async () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    const batch = readQueue();
    const ids = Object.keys(batch);
    if (ids.length === 0) {
      setStatus("ok");
      return;
    }
    setStatus("syncing");
    let failed = false;
    for (const id of ids) {
      const entry = batch[id]!;
      try {
        if (entry.op === "put") {
          const item = readAll().find((it) => it.id === id);
          if (item) await store.put(uid, item);
        } else {
          await store.del(uid, id);
        }
        const now = readQueue();
        if (now[id]?.at === entry.at) {
          delete now[id];
          writeQueue(now);
        }
      } catch (err) {
        failed = true;
        console.warn("No se pudo subir a la nube:", id, err);
      }
    }
    if (failed) {
      setStatus("error");
      scheduleFlush(RETRY_DELAY_MS);
    } else {
      setStatus(pendingCount() > 0 ? "pending" : "ok");
      if (pendingCount() > 0) scheduleFlush(FLUSH_DELAY_MS);
    }
  })().finally(() => {
    flushing = null;
  });
  return flushing;
}

// ─── mezclar al entrar ──────────────────────────────────────────────────────

let syncing: Promise<void> | null = null;

const sessionFlag = (uid: string): string | null => {
  try {
    return window.sessionStorage.getItem(SYNCED_KEY + uid);
  } catch {
    return null;
  }
};

/**
 * Se llama al entrar con la cuenta. Baja lo de la nube y lo mezcla con este navegador. Para no gastar lecturas,
 * la mezcla completa se hace una vez por sesión del navegador; las siguientes veces solo se suben pendientes.
 */
export function syncLibrary(uid: string, store: RemoteStore = firestoreStore, force = false): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  activeUid = uid;
  if (syncing) return syncing;
  syncing = (async () => {
    const owner = window.localStorage.getItem(OWNER_KEY);
    if (owner && owner !== uid) {
      // lo que había en este navegador es de otra cuenta: se aparta y no se mezcla con esta
      try {
        window.localStorage.setItem(ORPHAN_KEY, JSON.stringify({ owner, at: new Date().toISOString(), items: readAll() }));
      } catch {
        /* sin espacio */
      }
      writeAll([]);
      writeQueue({});
      try {
        window.sessionStorage.removeItem(SYNCED_KEY + owner);
      } catch {
        /* ignore */
      }
    }
    window.localStorage.setItem(OWNER_KEY, uid);

    if (!force && sessionFlag(uid)) {
      await flushNow(store);
      return;
    }

    setStatus("syncing");
    let remote: LibraryItem[];
    try {
      remote = await store.list(uid);
    } catch (err) {
      console.warn("No se pudo leer la nube:", err);
      setStatus("error");
      scheduleFlush(RETRY_DELAY_MS);
      return;
    }

    const queue = readQueue();
    const pendingDeletes = new Set(Object.keys(queue).filter((id) => queue[id]!.op === "del"));
    const local = readAll();
    const plan = planMerge(local, remote, pendingDeletes);

    if (plan.toLocal.length > 0) {
      const byId = new Map(local.map((it) => [it.id, it]));
      for (const it of plan.toLocal) byId.set(it.id, it);
      writeAll([...byId.values()]);
    }

    // lo que quedó pendiente de subir: todo lo de la cola que no se resolvió bajando, más lo que solo estaba aquí
    const remaining: Queue = {};
    const downloaded = new Set(plan.toLocal.map((it) => it.id));
    for (const [id, e] of Object.entries(queue)) if (!downloaded.has(id)) remaining[id] = e;
    for (const it of plan.toRemote) remaining[it.id] ??= { op: "put", at: stamp() };
    for (const id of plan.deleteRemote) remaining[id] = { op: "del", at: remaining[id]?.at ?? stamp() };
    writeQueue(remaining);

    try {
      window.sessionStorage.setItem(SYNCED_KEY + uid, "1");
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event("hilonova:library"));
    await flushNow(store);
  })().finally(() => {
    syncing = null;
  });
  return syncing;
}

// ─── salir ──────────────────────────────────────────────────────────────────

/** Antes de cerrar sesión: sube lo pendiente (hasta 5 segundos) para no dejarlo solo en este navegador. */
export async function cloudBeforeSignOut(store: RemoteStore = firestoreStore): Promise<void> {
  try {
    await withTimeout(flushNow(store), 5000, "subir pendientes");
  } catch (err) {
    console.warn("Quedaron cambios sin subir a la nube:", err);
  }
  cloudSignedOut();
}

/** La cuenta ya no está activa (salió aquí o en otra pestaña). */
export function cloudSignedOut(): void {
  activeUid = null;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  setStatus("off");
}

// Al salir de la página se intenta subir lo pendiente (no hay garantía: el navegador puede cortar la subida).
if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
  window.addEventListener("pagehide", () => {
    if (activeUid && pendingCount() > 0) void flushNow();
  });
}

/** Solo para pruebas: deja el módulo como recién cargado. */
export function __resetCloudForTests(): void {
  activeUid = null;
  status = "off";
  flushing = null;
  syncing = null;
  counter = 0;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}
