// Vista "Proyectos": todos los patrones guardados del taller. Abrir, duplicar,
// eliminar y crear nuevos (desde una prenda base o en blanco).

"use client";

import { useRouter } from "next/navigation";
import { deserialize, emptyDoc, type PatternDoc } from "@hilonova/geometry";
import { findBlock, type BlockKind } from "@hilonova/blocks";
import { useEffect, useState } from "react";
import { useLibrary, saveItem, deleteItem, loadDoc as libLoad, daysSinceBackup } from "../lib/library";
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
    try {
      saveItem(doc, `${doc.name} copia`);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "No se pudo duplicar.");
    }
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
    try {
      const id = saveItem(doc, doc.name);
      open(id);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "No se pudo crear el proyecto.");
    }
  }

  // recordatorio: materiales y «Mis piezas» viven solo en este navegador, así que se pide un respaldo cada semana
  const [backupDays, setBackupDays] = useState<number | null | undefined>(undefined);
  useEffect(() => setBackupDays(daysSinceBackup()), [items.length]);
  const needsBackup = items.length > 0 && backupDays !== undefined && (backupDays === null || backupDays >= 7);

  return (
    <div className="st-page">
      <header className="st-page-h">
        <div>
          <h1>Proyectos</h1>
          <p>Tus patrones se guardan en este navegador y en tu cuenta. Descarga un respaldo desde Configuración como copia extra.</p>
        </div>
        <div className="st-page-actions">
          <button className="st-act" onClick={blank} title="Un lienzo vacío para dibujar tus propias piezas (la guía te explica cómo empezar)">+ En blanco</button>
          <button className="st-btn-primary" onClick={() => router.push("/app/new")}>+ Desde una prenda base</button>
        </div>
      </header>

      {needsBackup && (
        <div className="st-empty-big" style={{ margin: "0 0 16px", padding: "12px 16px", alignItems: "flex-start", textAlign: "left" }}>
          <strong>Descarga un respaldo de tus proyectos.</strong>
          <span>
            {backupDays === null
              ? "Todavía no has descargado ninguno."
              : `Tu último respaldo fue hace ${backupDays} días.`}{" "}
            Tus patrones también están en tu cuenta, pero los materiales y «Mis piezas» viven solo en este navegador.{" "}
            <button className="st-act" onClick={() => setView("config")}>Ir a Configuración</button>
          </span>
        </div>
      )}

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
