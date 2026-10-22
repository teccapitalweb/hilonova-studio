// Vista "Proyectos": todos los patrones guardados del taller. Abrir, duplicar,
// eliminar y crear nuevos (desde una prenda base o en blanco).

"use client";

import { useRouter } from "next/navigation";
import { deserialize, emptyDoc, type PatternDoc } from "@hilonova/geometry";
import { findBlock, type BlockKind } from "@hilonova/blocks";
import { useLibrary, saveItem, deleteItem, loadDoc as libLoad } from "../lib/library";
import { useEditor } from "./store";
import { PiecesThumb } from "./thumbs";

const fmtDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso.slice(0, 10);
  }
};

export default function Proyectos() {
  const router = useRouter();
  const items = useLibrary();
  const loadDoc = useEditor((s) => s.loadDoc);
  const setView = useEditor((s) => s.setView);
  const currentId = useEditor((s) => s.saved.id);

  function open(id: string) {
    const doc = libLoad(id);
    if (!doc) return;
    loadDoc(doc, id);
    try { router.replace(`/studio?id=${id}`); } catch { /* ignore */ }
    setView("editor");
  }

  function duplicate(id: string) {
    const doc = libLoad(id);
    if (!doc) return;
    saveItem(doc, `${doc.name} copia`);
  }

  function remove(id: string, name: string) {
    if (!window.confirm(`¿Eliminar el proyecto "${name}"? No se puede deshacer.`)) return;
    deleteItem(id);
    if (currentId === id) useEditor.getState().resetDoc();
  }

  function blank() {
    const doc = emptyDoc("Patrón sin título");
    doc.sizes = ["S", "M", "L", "XL"];
    doc.baseSize = "M";
    const id = saveItem(doc, doc.name);
    open(id);
  }

  return (
    <div className="st-page">
      <header className="st-page-h">
        <div>
          <h1>Proyectos</h1>
          <p>Tus patrones guardados en este navegador. Descarga un respaldo desde Configuración.</p>
        </div>
        <div className="st-page-actions">
          <button className="st-act" onClick={blank}>+ En blanco</button>
          <button className="st-btn-primary" onClick={() => router.push("/app/new")}>+ Desde una prenda base</button>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="st-empty-big">
          <strong>Aún no tienes proyectos guardados.</strong>
          <span>Crea uno desde una prenda base (blusa, pantalón, playera, falda) o empieza en blanco y dibuja tus piezas.</span>
        </div>
      ) : (
        <div className="st-cards">
          {items.map((it) => {
            let doc: PatternDoc | null = null;
            try { doc = deserialize(it.doc); } catch { doc = null; }
            const kind = doc?.blockKind ? findBlock(doc.blockKind as BlockKind).name : "En blanco";
            return (
              <article key={it.id} className={`st-card${currentId === it.id ? " cur" : ""}`}>
                <button className="st-card-thumb" onClick={() => open(it.id)} aria-label={`Abrir ${it.name}`}>
                  <PiecesThumb pieces={doc?.pieces ?? []} />
                </button>
                <div className="st-card-body">
                  <div className="st-card-title">{it.name}</div>
                  <div className="st-card-meta">
                    {kind} · {doc?.pieces.length ?? 0} piezas · {doc?.sizes.join("/") ?? "—"}
                  </div>
                  <div className="st-card-meta">Editado {fmtDate(it.updatedAt)}</div>
                </div>
                <div className="st-card-actions">
                  <button className="st-act" onClick={() => open(it.id)}>Abrir</button>
                  <button className="st-act" onClick={() => duplicate(it.id)}>Duplicar</button>
                  <button className="st-act danger" onClick={() => remove(it.id, it.name)}>Eliminar</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
