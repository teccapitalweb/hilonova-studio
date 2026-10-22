// Vista "Librería": piezas de fábrica (delanteros, espaldas, mangas, cuellos,
// puños, bolsillos…) y "mis piezas" guardadas por el patronista. Insertar una
// pieza la agrega al proyecto abierto.

"use client";

import { useMemo } from "react";
import { DEFAULT_MEASUREMENTS, LIBRARY_CATEGORIES, PIECE_LIBRARY, type LibraryEntry } from "@hilonova/blocks";
import { useEditor } from "./store";
import { PiecesThumb } from "./thumbs";
import { userPieces } from "../lib/pieces";

export default function Libreria() {
  const insertLibraryPiece = useEditor((s) => s.insertLibraryPiece);
  const insertPiece = useEditor((s) => s.insertPiece);
  const setView = useEditor((s) => s.setView);
  const measurements = useEditor((s) => s.measurements);
  const mine = userPieces.useAll();

  // vista previa con las medidas del proyecto (o las de fábrica)
  const previews = useMemo(
    () =>
      new Map(
        PIECE_LIBRARY.map((e) => {
          try { return [e.id, e.make({ ...DEFAULT_MEASUREMENTS, ...measurements })] as const; }
          catch { return [e.id, null] as const; }
        }),
      ),
    [measurements],
  );

  function insertFactory(e: LibraryEntry) {
    insertLibraryPiece(e);
    setView("editor");
  }

  return (
    <div className="st-page">
      <header className="st-page-h">
        <div>
          <h1>Librería de piezas</h1>
          <p>
            Inserta piezas listas en tu proyecto. Se ajustan a las medidas del proyecto abierto y ya
            traen su regla de graduación. Guarda tus propias piezas desde el editor.
          </p>
        </div>
      </header>

      <section className="st-lib-section">
        <h2>Mis piezas <span className="st-chip">{mine.length}</span></h2>
        {mine.length === 0 ? (
          <p className="st-hint">
            Todavía no guardaste ninguna. En el editor, selecciona una pieza y usa "Guardar en librería".
          </p>
        ) : (
          <div className="st-lib-grid">
            {mine.map((u) => (
              <article key={u.id} className="st-lib-card">
                <PiecesThumb pieces={[u.piece]} />
                <div className="st-lib-name">{u.name}</div>
                <div className="st-lib-src">Mía · ×{u.piece.quantity}</div>
                <div className="st-card-actions">
                  <button className="st-act" onClick={() => { insertPiece(u.piece); setView("editor"); }}>Insertar</button>
                  <button className="st-act danger" onClick={() => userPieces.remove(u.id)}>Quitar</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {LIBRARY_CATEGORIES.map((cat) => {
        const entries = PIECE_LIBRARY.filter((e) => e.category === cat);
        if (!entries.length) return null;
        return (
          <section key={cat} className="st-lib-section">
            <h2>{cat}</h2>
            <div className="st-lib-grid">
              {entries.map((e) => {
                const piece = previews.get(e.id);
                return (
                  <article key={e.id} className="st-lib-card">
                    {piece ? <PiecesThumb pieces={[piece]} /> : <div className="st-thumb" />}
                    <div className="st-lib-name">{e.name}</div>
                    <div className="st-lib-src">{e.source}</div>
                    <div className="st-card-actions">
                      <button className="st-act" onClick={() => insertFactory(e)}>Insertar en el proyecto</button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
