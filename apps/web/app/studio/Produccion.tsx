// Vista "Producción": ficha técnica y variantes de modelo.
// Las variantes guardan versiones del mismo diseño (manga 3/4, cuello mao,
// otro largo…) con sus piezas, tallas y reglas; se cambia entre ellas y se
// compara el consumo de tela.

"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useEditor, snapshotOf } from "./store";
import TechPack from "./TechPack";
import { PiecesThumb } from "./thumbs";
import { nestPieces } from "./nesting";

// three.js solo se descarga al abrir esta pestaña
const Vista3D = dynamic(() => import("./Vista3D"), {
  ssr: false,
  loading: () => <div className="st-empty-big" style={{ margin: 24 }}>Cargando vista 3D…</div>,
});

type Tab = "ficha" | "variantes" | "vista3d";

const COLORS = ["#7FB3FF", "#8FD99B", "#C79BFF", "#F2C879", "#FF9B8A", "#6FD3D0"];

export default function Produccion() {
  const [tab, setTab] = useState<Tab>("ficha");
  const doc = useEditor((s) => s.history.present);
  const count = doc.variants?.length ?? 0;

  return (
    <div className="st-prod">
      <div className="st-prod-tabs" role="tablist" aria-label="Producción">
        <button role="tab" aria-selected={tab === "ficha"} className={tab === "ficha" ? "on" : ""} onClick={() => setTab("ficha")}>
          Ficha técnica
        </button>
        <button role="tab" aria-selected={tab === "variantes"} className={tab === "variantes" ? "on" : ""} onClick={() => setTab("variantes")}>
          Variantes de modelo{count > 0 ? ` · ${count}` : ""}
        </button>
        <button role="tab" aria-selected={tab === "vista3d"} className={tab === "vista3d" ? "on" : ""} onClick={() => setTab("vista3d")}>
          Vista 3D
        </button>
      </div>
      <div className="st-prod-body">
        {tab === "ficha" ? <TechPack /> : tab === "variantes" ? <Variantes /> : <Vista3D />}
      </div>
    </div>
  );
}

function Variantes() {
  const doc = useEditor((s) => s.history.present);
  const fabricWidth = useEditor((s) => s.fabricWidth);
  const fabricPrice = useEditor((s) => s.fabricPrice);
  const addVariant = useEditor((s) => s.addVariant);
  const switchVariant = useEditor((s) => s.switchVariant);
  const patchVariant = useEditor((s) => s.patchVariant);
  const deleteVariant = useEditor((s) => s.deleteVariant);
  const duplicateVariant = useEditor((s) => s.duplicateVariant);
  const saveActiveVariant = useEditor((s) => s.saveActiveVariant);
  const setView = useEditor((s) => s.setView);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]!);

  const variants = doc.variants ?? [];

  // consumo de la talla base de cada variante (la activa usa lo que hay en el editor)
  const stats = useMemo(
    () =>
      variants.map((v) => {
        const pieces = v.id === doc.activeVariant ? doc.pieces : v.snapshot.pieces;
        const r = nestPieces(pieces, fabricWidth);
        return { id: v.id, pieces: pieces.length, length: r.markerLength / 100, util: r.utilization };
      }),
    [variants, doc.pieces, doc.activeVariant, fabricWidth],
  );
  const statOf = (id: string) => stats.find((s) => s.id === id);

  function create() {
    addVariant(name, color);
    setName("");
    setColor(COLORS[(variants.length + 1) % COLORS.length]!);
  }

  return (
    <div className="st-page">
      <header className="st-page-h">
        <div>
          <h1>Variantes de modelo</h1>
          <p>
            Guarda versiones del mismo diseño (manga 3/4, otro cuello, otro largo…). Cada variante es
            una foto del patrón: edita en el editor y usa "Guardar como variante nueva" o, si ya hay una
            activa, "Guardar cambios" para actualizarla.
          </p>
        </div>
      </header>

      <section className="st-table-card st-form">
        <h2>Guardar el patrón actual como variante nueva</h2>
        <div className="st-variant-new">
          <input
            className="st-input st-input-text"
            style={{ width: 260 }}
            placeholder="Nombre (p. ej. Manga 3/4)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") create(); }}
          />
          <span className="st-swatches">
            {COLORS.map((c) => (
              <button
                key={c}
                className={`st-swatch${color === c ? " on" : ""}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
                aria-label={`Color ${c}`}
              />
            ))}
          </span>
          <button className="st-btn-primary" onClick={create}>Guardar como variante nueva</button>
        </div>
      </section>

      {variants.length === 0 ? (
        <div className="st-empty-big">
          <strong>Aún no hay variantes.</strong>
          <span>Guarda la primera con el botón de arriba; después cambia el patrón y guarda otra.</span>
        </div>
      ) : (
        <div className="st-cards">
          {variants.map((v) => {
            const active = v.id === doc.activeVariant;
            const st = statOf(v.id);
            const pieces = active ? doc.pieces : v.snapshot.pieces;
            const dirty = active && JSON.stringify(snapshotOf(doc)) !== JSON.stringify(v.snapshot);
            return (
              <article key={v.id} className={`st-card${active ? " cur" : ""}`}>
                <div className="st-card-bar" style={{ background: v.color }} />
                <div className="st-card-thumb static">
                  <PiecesThumb pieces={pieces} />
                </div>
                <div className="st-card-body">
                  <input
                    className="st-variant-name"
                    value={v.name}
                    onChange={(e) => patchVariant(v.id, { name: e.target.value })}
                    aria-label="Nombre de la variante"
                  />
                  <textarea
                    className="st-variant-note"
                    placeholder="Notas (cambios respecto al modelo base)"
                    value={v.note ?? ""}
                    onChange={(e) => patchVariant(v.id, { note: e.target.value })}
                    rows={2}
                  />
                  <div className="st-card-meta">
                    {st?.pieces ?? 0} piezas · {v.snapshot.sizes.join("/")} · talla base {v.snapshot.baseSize}
                  </div>
                  <div className="st-card-meta mono">
                    {st ? `${st.length.toFixed(2)} m · ${(st.util * 100).toFixed(0)} %` : "—"}
                    {st && fabricPrice > 0 ? ` · $${(st.length * fabricPrice).toFixed(2)}` : ""}
                  </div>
                </div>
                <div className="st-card-actions">
                  {active ? (
                    <>
                      <span className="st-badge">Activa</span>
                      {dirty && (
                        <button className="st-act on" onClick={saveActiveVariant} title="Guardar lo que hay en el editor en esta variante">
                          Guardar cambios
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      className="st-act"
                      onClick={() => {
                        const act = variants.find((x) => x.id === doc.activeVariant);
                        const unsaved = act && JSON.stringify(snapshotOf(doc)) !== JSON.stringify(act.snapshot);
                        if (unsaved && !window.confirm(`Hay cambios sin guardar en "${act.name}". ¿Descartarlos y cambiar de variante?`)) return;
                        switchVariant(v.id);
                        setView("editor");
                      }}
                    >
                      Usar esta
                    </button>
                  )}
                  <button className="st-act" onClick={() => duplicateVariant(v.id)}>Duplicar</button>
                  <button
                    className="st-act danger"
                    onClick={() => { if (window.confirm(`¿Eliminar la variante "${v.name}"?`)) deleteVariant(v.id); }}
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <p className="st-hint">Consumo calculado en la talla base con tela de {fabricWidth} cm.</p>
    </div>
  );
}
