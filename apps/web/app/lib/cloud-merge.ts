// Mezcla de la biblioteca de este navegador con la que está en la nube. Es una función pura: no toca nada,
// solo dice qué hay que bajar, qué hay que subir y qué hay que borrar en la nube.

import type { LibraryItem } from "./library-raw";

export interface MergePlan {
  /** patrones que hay que guardar (o reemplazar) en este navegador */
  toLocal: LibraryItem[];
  /** patrones que hay que subir (o reemplazar) en la nube */
  toRemote: LibraryItem[];
  /** patrones que se borraron aquí y hay que borrar también en la nube */
  deleteRemote: string[];
}

const time = (iso: string): number => {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 0 : t;
};

/**
 * Reglas:
 *  - solo está en la nube → se baja (salvo que se haya borrado aquí mientras no había conexión);
 *  - solo está aquí → se sube;
 *  - está en los dos → gana el que se editó más recientemente; si empatan no se hace nada.
 */
export function planMerge(local: readonly LibraryItem[], remote: readonly LibraryItem[], pendingDeletes: ReadonlySet<string>): MergePlan {
  const plan: MergePlan = { toLocal: [], toRemote: [], deleteRemote: [] };
  const localById = new Map(local.map((it) => [it.id, it]));
  const remoteIds = new Set(remote.map((it) => it.id));

  for (const r of remote) {
    if (pendingDeletes.has(r.id)) {
      plan.deleteRemote.push(r.id);
      continue;
    }
    const l = localById.get(r.id);
    if (!l) plan.toLocal.push(r);
    else if (time(r.updatedAt) > time(l.updatedAt)) plan.toLocal.push(r);
    else if (time(l.updatedAt) > time(r.updatedAt)) plan.toRemote.push(l);
  }
  for (const l of local) {
    if (!remoteIds.has(l.id) && !pendingDeletes.has(l.id)) plan.toRemote.push(l);
  }
  return plan;
}
