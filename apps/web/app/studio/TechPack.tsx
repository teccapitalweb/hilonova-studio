// Vista "Ficha" — editor de Tech Pack con preview en vivo.
// Izquierda: formulario con metadata, BOM y especificaciones.
// Derecha: preview que simula las páginas del PDF que se exportará.

"use client";

import { useEditor } from "./store";
import type { TechPackMeta } from "@hilonova/geometry";
import { measurementsForBlockSize, findBlock } from "@hilonova/blocks";
import { samplePath } from "@hilonova/geometry";
import { DEFAULT_BOM, defaultSpecs, flatPages, techPackPageCount } from "@hilonova/export";

export default function TechPack() {
  const doc = useEditor((s) => s.history.present);
  const blockKind = useEditor((s) => s.blockKind);
  const measurements = useEditor((s) => s.measurements);
  const update = useEditor((s) => s.updateTechPack);

  const tp: TechPackMeta = doc.techPack ?? {};
  const bom = tp.bom ?? DEFAULT_BOM;
  const specs = tp.specs ?? defaultSpecs(doc);
  const flats = flatPages(doc);
  const total = techPackPageCount(doc);
  const meta = findBlock(blockKind);

  // tabla de medidas por talla (para el preview)
  const measRows = doc.sizes.map((size) => {
    const m = measurementsForBlockSize(blockKind, size, measurements, doc.baseSize, doc.gradeSteps);
    return { size, values: meta.fields.map((f) => ({ field: f, value: m[f] ?? 0 })) };
  });

  function setField<K extends keyof TechPackMeta>(key: K, value: TechPackMeta[K]) {
    update({ [key]: value } as Partial<TechPackMeta>);
  }

  function updateBomRow(i: number, patch: Partial<{ name: string; detail: string }>) {
    const next = bom.map((row, idx) => idx === i ? { ...row, ...patch } : row);
    update({ bom: next });
  }
  function addBomRow() {
    update({ bom: [...bom, { name: "", detail: "" }] });
  }
  function removeBomRow(i: number) {
    update({ bom: bom.filter((_, idx) => idx !== i) });
  }

  function updateSpecRow(i: number, patch: Partial<{ label: string; value: string }>) {
    const next = specs.map((row, idx) => idx === i ? { ...row, ...patch } : row);
    update({ specs: next });
  }
  function addSpecRow() {
    update({ specs: [...specs, { label: "", value: "" }] });
  }
  function removeSpecRow(i: number) {
    update({ specs: specs.filter((_, idx) => idx !== i) });
  }

  return (
    <div className="tp-wrap">
      {/* ── forma: campos editables ──────────────────────────────── */}
      <aside className="tp-form">
        <section className="tp-section">
          <h3 className="tp-section-title">Encabezado</h3>
          <div className="tp-grid-2">
            <TextField label="Referencia / SKU" placeholder="HLN-DN-012"
              value={tp.ref ?? ""} onChange={(v) => setField("ref", v)} />
            <TextField label="Revisión" placeholder="01"
              value={tp.revision ?? ""} onChange={(v) => setField("revision", v)} />
            <TextField label="Cliente" placeholder="Taller / marca"
              value={tp.client ?? ""} onChange={(v) => setField("client", v)} />
            <TextField label="Temporada" placeholder="SS26"
              value={tp.season ?? ""} onChange={(v) => setField("season", v)} />
            <TextField label="Patronista" placeholder="Nombre completo"
              value={tp.designer ?? ""} onChange={(v) => setField("designer", v)} />
          </div>
          <TextArea label="Descripción" placeholder="Jean slim de 5 bolsas, mezclilla 12 oz."
            value={tp.description ?? ""} onChange={(v) => setField("description", v)} />
        </section>

        <section className="tp-section">
          <div className="tp-section-head">
            <h3 className="tp-section-title">Materiales (BOM)</h3>
            <button className="tp-add" onClick={addBomRow}>+ Agregar</button>
          </div>
          {bom.length === 0 && <p className="tp-empty">Sin materiales.</p>}
          <div className="tp-rows">
            {bom.map((row, i) => (
              <div className="tp-row" key={i}>
                <input className="tp-input" placeholder="Material"
                  value={row.name} onChange={(e) => updateBomRow(i, { name: e.target.value })} />
                <input className="tp-input" placeholder="Detalle / especificación"
                  value={row.detail} onChange={(e) => updateBomRow(i, { detail: e.target.value })} />
                <button className="tp-del" onClick={() => removeBomRow(i)} aria-label="Quitar">×</button>
              </div>
            ))}
          </div>
        </section>

        <section className="tp-section">
          <div className="tp-section-head">
            <h3 className="tp-section-title">Especificaciones de costura</h3>
            <button className="tp-add" onClick={addSpecRow}>+ Agregar</button>
          </div>
          <div className="tp-rows">
            {specs.map((row, i) => (
              <div className="tp-row" key={i}>
                <input className="tp-input" placeholder="Especificación"
                  value={row.label} onChange={(e) => updateSpecRow(i, { label: e.target.value })} />
                <input className="tp-input" placeholder="Valor"
                  value={row.value} onChange={(e) => updateSpecRow(i, { value: e.target.value })} />
                <button className="tp-del" onClick={() => removeSpecRow(i)} aria-label="Quitar">×</button>
              </div>
            ))}
          </div>
        </section>

        <section className="tp-section">
          <h3 className="tp-section-title">Notas</h3>
          <TextArea label="" placeholder="Comentarios para la maquila (opcional)…"
            value={tp.notes ?? ""} onChange={(v) => setField("notes", v)} />
        </section>
      </aside>

      {/* ── preview: simula el PDF que se exportará ──────────────── */}
      <main className="tp-preview">
        {/* página 1: portada */}
        <article className="tp-page">
          <div className="tp-page-brand">
            <span className="tp-brand-strip" />
            <span className="tp-brand-mark">HILONOVA · TECH PACK</span>
            <span className="tp-brand-date">{new Date().toISOString().slice(0, 10)}</span>
          </div>
          <div className="tp-cover">
            <h1 className="tp-cover-title">{doc.name}</h1>
            <p className="tp-cover-sub">Ficha técnica para producción</p>
            {tp.description && <p className="tp-cover-desc">{tp.description}</p>}
            <dl className="tp-cover-meta">
              <MetaRow label="Referencia" value={tp.ref || "—"} />
              <MetaRow label="Cliente" value={tp.client || "—"} />
              <MetaRow label="Temporada" value={tp.season || "—"} />
              <MetaRow label="Revisión" value={tp.revision || "01"} />
              <MetaRow label="Patronista" value={tp.designer || "—"} />
              <MetaRow label="Talla base" value={doc.baseSize} />
              <MetaRow label="Tallas" value={doc.sizes.join(" · ")} />
              <MetaRow label="Piezas" value={String(doc.pieces.length)} />
            </dl>
          </div>
          <div className="tp-page-foot">1 / {total} · Generado con Hilonova Studio</div>
        </article>

        {/* página 2: tabla de medidas */}
        <article className="tp-page">
          <PageHeader section="Tabla de medidas" docName={doc.name} />
          <table className="tp-meas-table">
            <thead>
              <tr>
                <th>Medida (cm)</th>
                {doc.sizes.map((s) => (
                  <th key={s} className={s === doc.baseSize ? "base" : ""}>{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {meta.fields.map((f, i) => (
                <tr key={f}>
                  <td>{labelFor(f)}</td>
                  {measRows.map((row) => {
                    const v = row.values[i]?.value ?? 0;
                    return <td key={row.size} className="mono">{v.toFixed(1)}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="tp-page-foot">2 / {total} · Generado con Hilonova Studio</div>
        </article>

        {/* vistas planas: 4 piezas por hoja, todas las piezas */}
        {flats.map((pieces, pi) => (
          <article className="tp-page" key={pi}>
            <PageHeader section={"Vistas planas" + (flats.length > 1 ? ` (${pi + 1}/${flats.length})` : "")} docName={doc.name} />
            <div className="tp-flats">
              {pieces.length === 0 && <p className="tp-empty">Sin piezas.</p>}
              {pieces.map((p) => (
                <div className="tp-flat" key={p.id}>
                  <PieceSvg piece={p} />
                  <div className="tp-flat-label">
                    <b>{p.name}</b> · ×{p.quantity}
                  </div>
                </div>
              ))}
            </div>
            <div className="tp-page-foot">{3 + pi} / {total} · Generado con Hilonova Studio</div>
          </article>
        ))}

        {/* página 4: BOM + specs */}
        <article className="tp-page">
          <PageHeader section="Insumos y especificaciones" docName={doc.name} />
          <h4 className="tp-list-head">Materiales (BOM)</h4>
          <ul className="tp-list">
            {bom.map((it, i) => (
              <li key={i}><b>{it.name || "—"}</b><span>{it.detail || ""}</span></li>
            ))}
          </ul>
          <h4 className="tp-list-head">Costura</h4>
          <ul className="tp-list">
            {specs.map((it, i) => (
              <li key={i}><b>{it.label || "—"}</b><span>{it.value || ""}</span></li>
            ))}
          </ul>
          {tp.notes && (
            <>
              <h4 className="tp-list-head">Notas</h4>
              <p className="tp-notes">{tp.notes}</p>
            </>
          )}
          <div className="tp-page-foot">{total} / {total} · Generado con Hilonova Studio</div>
        </article>
      </main>
    </div>
  );
}

// ─── sub-componentes ────────────────────────────────────────────────────────

function TextField({ label, value, onChange, placeholder }:
  { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="tp-field">
      <span>{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  );
}

function TextArea({ label, value, onChange, placeholder }:
  { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="tp-field">
      {label && <span>{label}</span>}
      <textarea rows={2} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="tp-meta-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function PageHeader({ section, docName }: { section: string; docName: string }) {
  return (
    <>
      <div className="tp-page-brand">
        <span className="tp-brand-strip" />
        <span className="tp-brand-mark">HILONOVA · TECH PACK</span>
        <span className="tp-brand-date">{docName}</span>
      </div>
      <h2 className="tp-page-title">{section}</h2>
    </>
  );
}

function PieceSvg({ piece }: { piece: { name: string; nodes: unknown[]; closed: boolean } }) {
  const pts = samplePath(piece as never, 24);
  if (pts.length < 2) return null;
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const pad = 4;
  const vb = `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ")
    + (piece.closed ? " Z" : "");
  return (
    <svg viewBox={vb} className="tp-flat-svg" preserveAspectRatio="xMidYMid meet">
      <path d={d} fill="#f4f1ea" stroke="#14192A" strokeWidth="0.6" strokeLinejoin="round" />
    </svg>
  );
}

function labelFor(key: string): string {
  const dict: Record<string, string> = {
    busto: "Busto",
    cintura: "Cintura",
    cadera: "Cadera",
    hombro: "Hombro",
    cuello: "Cuello",
    sisa: "Prof. sisa",
    largoTorso: "Largo torso",
    largoManga: "Largo manga",
    tiro: "Tiro",
    largo: "Largo total",
    muslo: "Muslo",
    bajo: "Abertura bajo",
    largoFalda: "Largo falda",
  };
  return dict[key] ?? key;
}
