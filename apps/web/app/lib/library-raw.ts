// Acceso de bajo nivel a la biblioteca guardada en el navegador (localStorage).
// Lo usan library.ts (la API de siempre) y cloud.ts (la copia en la nube), sin depender uno del otro.

export interface LibraryItem {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  /** JSON del documento (serializado) */
  doc: string;
}

export const LIBRARY_KEY = "hilonova.library.v1";

export function readAll(): LibraryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LIBRARY_KEY);
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

export function writeAll(items: LibraryItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LIBRARY_KEY, JSON.stringify(items));
  } catch {
    // antes se ignoraba: el patrón parecía guardado y no lo estaba
    throw new Error(SAVE_ERROR);
  }
  askPersistentStorage();
  window.dispatchEvent(new Event("hilonova:library"));
}
