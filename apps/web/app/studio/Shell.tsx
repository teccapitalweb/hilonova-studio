// Shell del editor: topbar, rails de herramientas, paneles laterales y
// barra de estado. El Canvas vive en el centro. Todo client porque el
// store de Zustand y las interacciones son del navegador.

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Canvas from "./Canvas";
import Trazo from "./Trazo";
import ExportModal from "./ExportModal";
import { useEditor, SIZE_COLORS } from "./store";
import { bounds, samplePath, type Piece } from "@hilonova/geometry";
import { findBlock, type BodyMeasurements, type BlockKind } from "@hilonova/blocks";
import { loadDoc as libLoad, saveItem, renameItem } from "../lib/library";
import { MeasurementSilhouette } from "./MeasurementSilhouette";
import TechPack from "./TechPack";

export default function Shell() {
  const view = useEditor((s) => s.view);
  const params = useSearchParams();
  const loadDoc = useEditor((s) => s.loadDoc);
  const resetDoc = useEditor((s) => s.resetDoc);

  // Al montar: si viene ?id=xxx, cargar el patrón de la biblioteca.
  useEffect(() => {
    const id = params.get("id");
    if (!id) return;
    const doc = libLoad(id);
    if (doc) loadDoc(doc, id);
    else resetDoc();

  }, []);

  return (
    <div className="studio">
      <TopBar />
      <div className={`studio-body${view !== "editor" ? " studio-body--trazo" : ""}`}>
        {view === "editor" && (
          <>
            <ToolRail />
            <PiecesPanel />
            <div className="st-stage">
              <Canvas />
              <NestLegend />
              <StatusBar />
            </div>
            <PropsPanel />
          </>
        )}
        {view === "trazo" && <Trazo />}
        {view === "ficha" && <TechPack />}
      </div>
    </div>
  );
}

function ViewSwitch() {
  const view = useEditor((s) => s.view);
  const setView = useEditor((s) => s.setView);
  return (
    <nav className="st-switch" role="tablist" aria-label="Vista del studio">
      <button
        role="tab" aria-selected={view === "editor"}
        className={view === "editor" ? "on" : ""}
        onClick={() => setView("editor")}
      >
        Editor
      </button>
      <button
        role="tab" aria-selected={view === "trazo"}
        className={view === "trazo" ? "on" : ""}
        onClick={() => setView("trazo")}
      >
        Trazo
      </button>
      <button
        role="tab" aria-selected={view === "ficha"}
        className={view === "ficha" ? "on" : ""}
        onClick={() => setView("ficha")}
      >
        Ficha
      </button>
    </nav>
  );
}

// ─── TopBar ──────────────────────────────────────────────────────────────────

function TopBar() {
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);
  const canUndo = useEditor((s) => s.canUndo());
  const canRedo = useEditor((s) => s.canRedo());
  const doc = useEditor((s) => s.history.present);
  const reset = useEditor((s) => s.resetDoc);

  return (
    <header className="st-top">
      <Link href="/" className="st-brand">
        <span className="st-mk" aria-hidden="true" />
        <span>hilonova <b>studio</b></span>
      </Link>
      <DocName />
      <ViewSwitch />
      <SaveButton />
      <MeasurementsButton />
      <div className="st-top-actions">
        <button className="st-ic" disabled={!canUndo} onClick={undo} title="Deshacer (Ctrl+Z)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button className="st-ic" disabled={!canRedo} onClick={redo} title="Rehacer (Ctrl+Shift+Z)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 14l5-5-5-5M20 9H9a5 5 0 0 0 0 10h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="st-sep" />
        <button className="st-ic" onClick={reset} title="Restaurar demo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M3 12a9 9 0 0 1 15-6.7M21 4v5h-5M21 12a9 9 0 0 1-15 6.7M3 20v-5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <ExportButton />
      </div>
    </header>
  );
}

function DocName() {
  const doc = useEditor((s) => s.history.present);
  const saved = useEditor((s) => s.saved);
  const renameDoc = useEditor((s) => s.renameDoc);
  return (
    <div className="st-doc">
      <input
        className="st-doc-name st-doc-input"
        value={doc.name}
        onChange={(e) => renameDoc(e.target.value)}
        aria-label="Nombre del patrón"
      />
      <span className="st-doc-meta">
        {doc.unit} · talla {doc.baseSize}
        {saved.dirty && <span className="st-dirty"> · sin guardar</span>}
      </span>
    </div>
  );
}

function SaveButton() {
  const doc = useEditor((s) => s.history.present);
  const saved = useEditor((s) => s.saved);
  const markSaved = useEditor((s) => s.markSaved);
  const router = useRouter();
  function onSave() {
    const id = saveItem(doc, doc.name, saved.id ?? undefined);
    if (saved.id !== id) {
      // nuevo guardado: reflejar id en la URL
      try { router.replace(`/studio?id=${id}`); } catch { /* ignore */ }
    }
    markSaved(id);
  }
  return (
    <button
      className="st-ic"
      onClick={onSave}
      title={saved.dirty ? "Guardar cambios" : "Guardar en biblioteca"}
      aria-label="Guardar"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M5 3h11l5 5v13H5V3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M8 3v6h8V3M8 21v-8h8v8" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function ExportButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="st-btn-export" onClick={() => setOpen(true)} title="Exportar DXF-AAMA, PDF o SVG">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 19h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Exportar
      </button>
      {open && <ExportModal onClose={() => setOpen(false)} />}
    </>
  );
}

// ─── ToolRail ────────────────────────────────────────────────────────────────

function ToolRail() {
  const tool = useEditor((s) => s.tool);
  const setTool = useEditor((s) => s.setTool);
  const snap = useEditor((s) => s.snapGrid);
  const toggleSnap = useEditor((s) => s.toggleSnap);
  return (
    <aside className="st-rail">
      <RailBtn active={tool === "select"} onClick={() => setTool("select")} title="Seleccionar">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M5 3l15 7-6 2-2 6-7-15Z" fill="currentColor" />
        </svg>
      </RailBtn>
      <RailBtn active={tool === "pan"} onClick={() => setTool("pan")} title="Pan (shift+drag)">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M9 11V5a1.5 1.5 0 0 1 3 0v6M12 8a1.5 1.5 0 1 1 3 0v4M15 10a1.5 1.5 0 1 1 3 0v5a5 5 0 0 1-5 5h-2a4 4 0 0 1-3.3-1.8L5 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </RailBtn>
      <div className="st-rail-sep" />
      <RailBtn active={tool === "notch"} onClick={() => setTool("notch")} title="Piquete (click en nodo)">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 4v16M9 8l3-4 3 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </RailBtn>
      <RailBtn disabled title="Punto (Fase 2.5)">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="3.5" fill="currentColor" />
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </RailBtn>
      <RailBtn disabled title="Línea (Fase 2.5)">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M5 19 19 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="5" cy="19" r="2" fill="currentColor" />
          <circle cx="19" cy="5" r="2" fill="currentColor" />
        </svg>
      </RailBtn>
      <RailBtn disabled title="Curva Bézier (Fase 2.5)">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M4 19C4 10 20 14 20 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="4" cy="19" r="2" fill="currentColor" />
          <circle cx="20" cy="5" r="2" fill="currentColor" />
        </svg>
      </RailBtn>
      <div className="st-rail-sep" />
      <RailBtn active={snap} onClick={toggleSnap} title="Snap a rejilla">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="4" width="16" height="16" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <path d="M4 10h16M4 15h16M10 4v16M15 4v16" stroke="currentColor" strokeWidth="1" opacity=".6" />
        </svg>
      </RailBtn>
      <SeamToggle />
      <NestToggle />
    </aside>
  );
}

function NestToggle() {
  const showNest = useEditor((s) => s.showNest);
  const toggleNest = useEditor((s) => s.toggleNest);
  return (
    <RailBtn active={showNest} onClick={toggleNest} title="Nido de tallas">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M4 20 20 4M8 20 20 8M12 20 20 12" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
    </RailBtn>
  );
}

function SeamToggle() {
  const showSeam = useEditor((s) => s.showSeam);
  const toggleSeam = useEditor((s) => s.toggleSeam);
  return (
    <RailBtn active={showSeam} onClick={toggleSeam} title="Margen de costura">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="5" y="5" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <rect x="8.5" y="8.5" width="7" height="7" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2 2" />
      </svg>
    </RailBtn>
  );
}

// ─── Panel de medidas (botón del topbar + popover) ───────────────────────────

/** Metadata de cada medida: etiqueta visible + rango razonable para el slider. */
const FIELD_META: Record<keyof BodyMeasurements, { label: string; min: number; max: number; step: number }> = {
  busto:       { label: "Busto",        min: 70, max: 130, step: 0.5 },
  cintura:     { label: "Cintura",      min: 55, max: 125, step: 0.5 },
  cadera:      { label: "Cadera",       min: 70, max: 140, step: 0.5 },
  hombro:      { label: "Hombro a hombro", min: 32, max: 55, step: 0.5 },
  cuello:      { label: "Cuello",       min: 30, max: 50, step: 0.5 },
  sisa:        { label: "Profundidad sisa", min: 18, max: 32, step: 0.5 },
  largoTorso:  { label: "Largo torso",  min: 32, max: 58, step: 0.5 },
  largoManga:  { label: "Largo manga",  min: 20, max: 85, step: 0.5 },
  tiro:        { label: "Tiro",         min: 18, max: 35, step: 0.5 },
  largo:       { label: "Largo total",  min: 70, max: 120, step: 0.5 },
  muslo:       { label: "Muslo",        min: 42, max: 80, step: 0.5 },
  bajo:        { label: "Abertura bajo", min: 12, max: 32, step: 0.5 },
  largoFalda:  { label: "Largo falda",  min: 35, max: 110, step: 0.5 },
};

function MeasurementsButton() {
  const [open, setOpen] = useState(false);
  const measurements = useEditor((s) => s.measurements);
  const blockKind = useEditor((s) => s.blockKind);
  const meta = findBlock(blockKind);
  // Resumen corto: las primeras 2-3 medidas del bloque
  const summary = meta.fields.slice(0, 3)
    .map((f) => `${FIELD_META[f].label[0]} ${measurements[f] ?? "—"}`)
    .join(" · ");
  return (
    <>
      <button className="st-measure-btn" onClick={() => setOpen((o) => !o)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M3 8h18v8H3zM7 8v3M11 8v4M15 8v3M19 8v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        Medidas
        <span className="mono st-measure-sum">{summary}</span>
      </button>
      {open && <MeasurementsPanel onClose={() => setOpen(false)} />}
    </>
  );
}

function MeasurementsPanel({ onClose }: { onClose: () => void }) {
  const current = useEditor((s) => s.measurements);
  const apply = useEditor((s) => s.applyMeasurements);
  const blockKind = useEditor((s) => s.blockKind);
  const docName = useEditor((s) => s.history.present.name);
  const meta = findBlock(blockKind);
  const [m, setM] = useState<BodyMeasurements>({ ...current });
  const [activeField, setActiveField] = useState<keyof BodyMeasurements | null>(null);

  const dirty = meta.fields.some((f) => m[f] !== current[f]);

  const field = (key: keyof BodyMeasurements) => {
    const meta = FIELD_META[key];
    return (
      <label
        className={`st-m-field${activeField === key ? " is-active" : ""}`}
        key={key as string}
        data-field={key as string}
      >
        <span className="st-m-label">{meta.label}</span>
        <div className="st-m-ctrl">
          <input
            type="range" min={meta.min} max={meta.max} step={meta.step}
            value={m[key] ?? meta.min}
            onChange={(e) => setM({ ...m, [key]: Number(e.target.value) })}
          />
          <input
            type="number" step={meta.step} min={meta.min} max={meta.max}
            value={m[key] ?? meta.min}
            onChange={(e) => setM({ ...m, [key]: Number(e.target.value) })}
            className="st-m-num mono"
          />
          <span className="st-m-unit">cm</span>
        </div>
      </label>
    );
  };

  // Handler único en el contenedor: delega el hover a cualquier .st-m-field.
  // Más robusto que onMouseEnter por elemento porque evita glitches cuando
  // el cursor atraviesa inputs anidados dentro del label.
  function onFieldsPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const target = (e.target as HTMLElement).closest<HTMLElement>(".st-m-field");
    const next = (target?.dataset.field ?? null) as keyof BodyMeasurements | null;
    if (next !== activeField) setActiveField(next);
  }
  function onFieldsPointerLeave() {
    setActiveField(null);
  }

  return (
    <>
      <div className="st-m-backdrop" onClick={onClose} />
      <div className="st-m-pop st-m-pop--visual" role="dialog" aria-label="Medidas del patrón">
        <div className="st-m-h">
          <div>
            <div className="st-label" style={{ marginBottom: 2 }}>Bloque paramétrico</div>
            <strong style={{ color: "var(--t-hi)" }}>{docName} · talla 32</strong>
          </div>
          <button className="st-ic" onClick={onClose} title="Cerrar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className="st-m-split">
          <div className="st-m-sil">
            <MeasurementSilhouette kind={blockKind} activeField={activeField} />
            <div className="st-m-sil-hint">
              Pasa el cursor sobre una medida para verla en la silueta.
            </div>
          </div>
          <div
            className="st-m-fields"
            onPointerMove={onFieldsPointerMove}
            onPointerLeave={onFieldsPointerLeave}
          >
            {meta.fields.map(field)}
          </div>
        </div>
        <div className="st-m-foot">
          <button className="st-btn-ghost" onClick={() => setM({ ...current })} disabled={!dirty}>Restablecer</button>
          <button
            className="st-btn-primary"
            onClick={() => { apply(m); onClose(); }}
            disabled={!dirty}
          >
            Aplicar medidas
          </button>
        </div>
      </div>
    </>
  );
}

function RailBtn({
  children, active, disabled, onClick, title,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  title: string;
}) {
  return (
    <button
      className={`st-tool${active ? " on" : ""}${disabled ? " disabled" : ""}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
    >
      {children}
    </button>
  );
}

// ─── Panel de piezas ─────────────────────────────────────────────────────────

function PiecesPanel() {
  const doc = useEditor((s) => s.history.present);
  const selected = useEditor((s) => s.selectedPieceId);
  const selectPiece = useEditor((s) => s.selectPiece);
  return (
    <aside className="st-side">
      <div className="st-side-h">
        <span>Piezas</span>
        <span className="st-chip">{doc.pieces.length}</span>
      </div>
      {doc.pieces.map((p) => {
        const b = bounds(p);
        const w = b.maxX - b.minX;
        const h = b.maxY - b.minY;
        return (
          <button
            key={p.id}
            className={`st-piece${selected === p.id ? " sel" : ""}`}
            onClick={() => selectPiece(p.id)}
          >
            <PieceThumb piece={p} />
            <div className="st-piece-info">
              <div className="st-piece-name">{p.name}</div>
              <div className="st-piece-meta">
                {w.toFixed(0)} × {h.toFixed(0)} cm · ×{p.quantity}
              </div>
            </div>
          </button>
        );
      })}
    </aside>
  );
}

/** Thumb SVG de la pieza, ajustado al cuadro del panel. */
function PieceThumb({ piece }: { piece: Piece }) {
  const b = bounds(piece);
  const w = b.maxX - b.minX;
  const h = b.maxY - b.minY;
  const pad = Math.max(w, h) * 0.1;
  const vb = `${b.minX - pad} ${b.minY - pad} ${w + pad * 2} ${h + pad * 2}`;
  const pts = samplePath(piece, 18);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(" ") + (piece.closed ? " Z" : "");
  return (
    <svg viewBox={vb} className="st-piece-thumb" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
      <path d={d} fill="none" stroke="#EAF2FF" strokeWidth={Math.max(w, h) * 0.025} strokeLinejoin="round" />
    </svg>
  );
}

// ─── Panel de propiedades ────────────────────────────────────────────────────

function PropsPanel() {
  const doc = useEditor((s) => s.history.present);
  const pieceId = useEditor((s) => s.selectedPieceId);
  const nodeId = useEditor((s) => s.selectedNodeId);
  const piece = pieceId ? doc.pieces.find((p) => p.id === pieceId) : null;
  const node = piece && nodeId ? piece.nodes.find((n) => n.id === nodeId) : null;

  return (
    <aside className="st-props">
      <div className="st-side-h">
        <span>Propiedades</span>
      </div>
      {!piece && (
        <div className="st-empty">
          Haz click en un nodo del lienzo para editar.
          <br />
          <span className="st-dim">Shift o Alt + arrastre → pan · Rueda → zoom</span>
        </div>
      )}
      {piece && (
        <div className="st-group">
          <div className="st-label">Pieza</div>
          <Field name="Nombre" value={piece.name} />
          <Field name="Cantidad" value={`×${piece.quantity}`} />
          <Field name="Tela" value={piece.fabric ?? "—"} />
          <Field name="Margen costura" value={`${piece.seamAllowance} cm`} />
          <Field name="Hilo de tela" value={`${piece.grainAngle}°`} />
        </div>
      )}
      {node && (
        <div className="st-group">
          <div className="st-label">Nodo seleccionado</div>
          <Field name="X" value={`${node.at.x.toFixed(2)} cm`} />
          <Field name="Y" value={`${node.at.y.toFixed(2)} cm`} />
          <Field name="Tipo" value={node.handleIn || node.handleOut ? "curva" : "vértice"} />
          {node.notch && <Field name="Piquete" value="sí" />}
        </div>
      )}
      <SizesSection />
      <div className="st-group">
        <div className="st-label">Capas</div>
        <Legend color="#EAF2FF" label="Línea de corte" />
        <Legend color="#F0662C" label="Hilo de tela" />
        <Legend color="#3FD0C9" label="Nodos" />
      </div>
    </aside>
  );
}

function SizesSection() {
  const doc = useEditor((s) => s.history.present);
  const activeSizes = useEditor((s) => s.activeSizes);
  const toggleSize = useEditor((s) => s.toggleSize);
  const showNest = useEditor((s) => s.showNest);
  const toggleNest = useEditor((s) => s.toggleNest);
  return (
    <div className="st-group">
      <div className="st-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>Nido de tallas</span>
        <button
          className="st-pill"
          onClick={toggleNest}
          aria-pressed={showNest}
          data-on={showNest ? "true" : "false"}
        >
          {showNest ? "ON" : "OFF"}
        </button>
      </div>
      <div className="st-sizes">
        {doc.sizes.map((size) => {
          const isBase = size === doc.baseSize;
          const on = activeSizes.includes(size);
          return (
            <button
              key={size}
              className={`st-size${on ? " on" : ""}${isBase ? " base" : ""}`}
              onClick={() => !isBase && toggleSize(size)}
              disabled={isBase}
              title={isBase ? "Talla base (siempre visible)" : `Talla ${size}`}
              style={{ ["--size-color" as string]: SIZE_COLORS[size] ?? "#8A91FF" }}
            >
              {size}
              {isBase && <span className="st-size-base">base</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Field({ name, value }: { name: string; value: React.ReactNode }) {
  return (
    <div className="st-field">
      <span>{name}</span>
      <span className="v mono">{value}</span>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="st-lg">
      <i style={{ background: color }} />
      <span>{label}</span>
    </div>
  );
}

// ─── Status bar ──────────────────────────────────────────────────────────────

function StatusBar() {
  const cursor = useEditor((s) => s.cursor);
  const zoom = useEditor((s) => s.zoom);
  const snap = useEditor((s) => s.snapGrid);
  const gridStep = useEditor((s) => s.gridStep);
  return (
    <footer className="st-status">
      <span>
        x <b>{cursor ? cursor.x.toFixed(2) : "—"}</b>
        {"  "}· y <b>{cursor ? cursor.y.toFixed(2) : "—"}</b> cm
      </span>
      <span className="st-sep" />
      <span>zoom <b>{(zoom * 25).toFixed(0)}%</b></span>
      <span className="st-sep" />
      <span>rejilla <b>{gridStep} cm</b></span>
      <span className="st-sep" />
      <span className={snap ? "ok" : "mut"}>snap {snap ? "on" : "off"}</span>
      <span className="st-sep" />
      <span className="ok">● motor v0.1 activo</span>
    </footer>
  );
}

// ─── NestLegend: HUD flotante del nido de tallas ─────────────────────────────

function NestLegend() {
  const showNest = useEditor((s) => s.showNest);
  const toggleNest = useEditor((s) => s.toggleNest);
  const activeSizes = useEditor((s) => s.activeSizes);
  const toggleSize = useEditor((s) => s.toggleSize);
  const doc = useEditor((s) => s.history.present);
  const baseSize = doc.baseSize;

  // Siempre mostramos la pastilla "Ver nido" en el stage; cuando está ON,
  // se expande con las tallas y la leyenda de colores.
  return (
    <div className={`st-nest-hud${showNest ? " is-on" : ""}`} role="region" aria-label="Nido de tallas">
      <button
        className="st-nest-hud-toggle"
        onClick={toggleNest}
        aria-pressed={showNest}
        title="Mostrar / ocultar nido de tallas"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <span>Nido de tallas</span>
        <span className={`st-nest-dot${showNest ? " on" : ""}`} />
      </button>
      {showNest && (
        <>
          <div className="st-nest-hud-divider" />
          <div className="st-nest-hud-sizes">
            {doc.sizes.map((size) => {
              const isBase = size === baseSize;
              const on = activeSizes.includes(size);
              const color = SIZE_COLORS[size] ?? "#8A91FF";
              return (
                <button
                  key={size}
                  className={`st-nest-chip${on ? " on" : ""}${isBase ? " base" : ""}`}
                  onClick={() => !isBase && toggleSize(size)}
                  disabled={isBase}
                  style={{ ["--chip-color" as string]: color }}
                  title={isBase ? "Talla base (siempre visible)" : `Talla ${size}`}
                >
                  <span className="st-nest-chip-dot" />
                  <span className="st-nest-chip-size">{size}</span>
                  {isBase && <span className="st-nest-chip-base">base</span>}
                </button>
              );
            })}
          </div>
          <div className="st-nest-hud-meta">
            {activeSizes.length} tallas · base {baseSize}
          </div>
        </>
      )}
    </div>
  );
}
