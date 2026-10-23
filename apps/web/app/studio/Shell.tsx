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
import { useEditor, SIZE_COLORS, selectionOf, type Tool, type View } from "./store";
import { bounds, samplePath, gradeDoc, seamResult, type Piece } from "@hilonova/geometry";
import {
  findBlock,
  PIECE_LIBRARY,
  LIBRARY_CATEGORIES,
  type BodyMeasurements,
  type BlockKind,
} from "@hilonova/blocks";
import { loadDoc as libLoad, saveItem, renameItem } from "../lib/library";
import { MeasurementSilhouette } from "./MeasurementSilhouette";
import GradePanel from "./Graduacion";
import Produccion from "./Produccion";
import Proyectos from "./Proyectos";
import Materiales from "./Materiales";
import Libreria from "./Libreria";
import Reportes from "./Reportes";
import Config from "./Config";
import { loadPrefs } from "../lib/prefs";
import { saveUserPiece } from "../lib/pieces";
import { NumInput, TextInput } from "./fields";

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

  // preferencias guardadas (rejilla, snap, margen de costura, ancho de tela)
  useEffect(() => {
    const p = loadPrefs();
    useEditor.setState({
      gridStep: p.gridStep,
      snapGrid: p.snapGrid,
      showSeam: p.showSeam,
      fabricWidth: p.fabricWidth,
    });
  }, []);

  return (
    <div className="studio">
      <TopBar />
      <div className="st-shell">
      <SideNav />
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
        {view === "graduacion" && (
          <div className="st-grad">
            <div className="st-stage">
              <Canvas />
              <NestLegend />
              <StatusBar />
            </div>
            <GradePanel />
          </div>
        )}
        {view === "trazo" && <Trazo />}
        {view === "produccion" && <Produccion />}
        {view === "proyectos" && <Proyectos />}
        {view === "materiales" && <Materiales />}
        {view === "libreria" && <Libreria />}
        {view === "reportes" && <Reportes />}
        {view === "config" && <Config />}
      </div>
      </div>
    </div>
  );
}

// ─── Menú lateral ────────────────────────────────────────────────────────────

const NAV: Array<{ view: View; label: string; icon: string; sepBefore?: boolean }> = [
  { view: "proyectos", label: "Proyectos", icon: "M3 7h6l2 2h10v10H3z" },
  { view: "editor", label: "Patronaje 2D", icon: "M5 4h14v16H5zM9 4v16M5 10h4" },
  { view: "graduacion", label: "Graduación", icon: "M4 20 20 4M8 20 20 8M12 20 20 12" },
  { view: "trazo", label: "Trazo", icon: "M3 5h18v14H3zM3 11h10M13 5v14" },
  { view: "produccion", label: "Producción", icon: "M4 20V9l5 3V9l5 3V6h6v14z" },
  { view: "materiales", label: "Materiales", icon: "M4 6c4-2 12-2 16 0v12c-4 2-12 2-16 0zM4 12c4 2 12 2 16 0", sepBefore: true },
  { view: "libreria", label: "Librería", icon: "M5 4h4v16H5zM11 4h4v16h-4zM17 6l3 1-3 13-3-1z" },
  { view: "reportes", label: "Reportes", icon: "M6 3h9l4 4v14H6zM9 12h7M9 16h7M9 8h3" },
  { view: "config", label: "Configuración", icon: "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM4 12h2m12 0h2M12 4v2m0 12v2M6.3 6.3l1.4 1.4m8.6 8.6 1.4 1.4m0-11.4-1.4 1.4M7.7 16.3l-1.4 1.4" },
];

function SideNav() {
  const view = useEditor((s) => s.view);
  const setView = useEditor((s) => s.setView);
  return (
    <nav className="st-nav" aria-label="Secciones">
      {NAV.map((n) => (
        <div key={n.view}>
          {n.sepBefore && <div className="st-nav-sep" />}
          <button
            className={`st-nav-item${view === n.view ? " on" : ""}`}
            onClick={() => setView(n.view)}
            title={n.label}
            aria-current={view === n.view ? "page" : undefined}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d={n.icon} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{n.label}</span>
          </button>
        </div>
      ))}
    </nav>
  );
}

function ViewSwitch() {
  const view = useEditor((s) => s.view);
  const setView = useEditor((s) => s.setView);
  const tabs: Array<{ view: View; label: string }> = [
    { view: "editor", label: "Diseño" },
    { view: "graduacion", label: "Graduación" },
    { view: "trazo", label: "Trazo" },
    { view: "produccion", label: "Producción" },
  ];
  return (
    <nav className="st-switch" role="tablist" aria-label="Vista del studio">
      {tabs.map((t) => (
        <button
          key={t.view}
          role="tab"
          aria-selected={view === t.view}
          className={view === t.view ? "on" : ""}
          onClick={() => setView(t.view)}
        >
          {t.label}
        </button>
      ))}
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
      <AutoSave />
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
        {!saved.dirty && saved.id && saved.lastSaved && (
          <span className="mut"> · guardado {new Date(saved.lastSaved).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</span>
        )}
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
    try {
      const id = saveItem(doc, doc.name, saved.id ?? undefined);
      if (saved.id !== id) {
        // nuevo guardado: reflejar id en la URL
        try { router.replace(`/studio?id=${id}`); } catch { /* ignore */ }
      }
      markSaved(id);
      useEditor.setState({ notice: null });
    } catch (e) {
      useEditor.setState({ notice: `${e instanceof Error ? e.message : "No se pudo guardar."} Descarga un respaldo desde Configuración.` });
    }
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

/**
 * Guarda solo los cambios del proyecto abierto (1.5 s después del último cambio) y avisa si el
 * navegador intenta cerrar la pestaña con cambios sin guardar. No crea proyectos nuevos: los que aún
 * no están en la biblioteca se guardan con el botón.
 */
function AutoSave() {
  const doc = useEditor((s) => s.history.present);
  const saved = useEditor((s) => s.saved);
  const markSaved = useEditor((s) => s.markSaved);

  useEffect(() => {
    if (!saved.dirty || !saved.id) return;
    const t = setTimeout(() => {
      try {
        const id = saveItem(doc, doc.name, saved.id ?? undefined);
        markSaved(id);
        if (useEditor.getState().notice?.startsWith("No se pudo guardar")) useEditor.setState({ notice: null });
      } catch (e) {
        useEditor.setState({
          notice: `${e instanceof Error ? e.message : "No se pudo guardar."} Descarga un respaldo desde Configuración.`,
        });
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [doc, saved.dirty, saved.id, markSaved]);

  useEffect(() => {
    if (!saved.dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [saved.dirty]);

  return null;
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
  const ic = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none" } as const;
  const st = { stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return (
    <aside className="st-rail">
      <RailBtn active={tool === "select"} onClick={() => setTool("select")} title="Seleccionar y mover (V)">
        <svg {...ic}><path d="M5 3l15 7-6 2-2 6-7-15Z" fill="currentColor" /></svg>
      </RailBtn>
      <RailBtn active={tool === "pan"} onClick={() => setTool("pan")} title="Mano / pan (H · Shift+arrastre)">
        <svg {...ic}><path d="M9 11V5a1.5 1.5 0 0 1 3 0v6M12 8a1.5 1.5 0 1 1 3 0v4M15 10a1.5 1.5 0 1 1 3 0v5a5 5 0 0 1-5 5h-2a4 4 0 0 1-3.3-1.8L5 14" {...st} /></svg>
      </RailBtn>
      <div className="st-rail-sep" />
      <RailBtn active={tool === "line"} onClick={() => setTool("line")} title="Polilínea: clic por punto, clic en el primero o Enter para cerrar, doble clic para dejar abierta (L)">
        <svg {...ic}>
          <path d="M5 19 12 6l7 13" {...st} />
          <circle cx="5" cy="19" r="1.8" fill="currentColor" />
          <circle cx="12" cy="6" r="1.8" fill="currentColor" />
          <circle cx="19" cy="19" r="1.8" fill="currentColor" />
        </svg>
      </RailBtn>
      <RailBtn active={tool === "curve"} onClick={() => setTool("curve")} title="Curva suave por puntos: igual que la polilínea, con curvas (C)">
        <svg {...ic}>
          <path d="M4 18C6 6 12 6 12 12s6 6 8-6" {...st} />
          <circle cx="4" cy="18" r="1.8" fill="currentColor" />
          <circle cx="20" cy="6" r="1.8" fill="currentColor" />
        </svg>
      </RailBtn>
      <RailBtn active={tool === "rect"} onClick={() => setTool("rect")} title="Rectángulo: arrastra (R)">
        <svg {...ic}><rect x="4" y="6" width="16" height="12" rx="1" {...st} /></svg>
      </RailBtn>
      <RailBtn active={tool === "circle"} onClick={() => setTool("circle")} title="Círculo: arrastra desde el centro (O)">
        <svg {...ic}><circle cx="12" cy="12" r="7.5" {...st} /></svg>
      </RailBtn>
      <RailBtn active={tool === "addnode"} onClick={() => setTool("addnode")} title="Agregar nodo en un contorno: clic sobre la línea (A)">
        <svg {...ic}>
          <path d="M4 17c4-9 12-9 16 0" {...st} />
          <path d="M12 3v6M9 6h6" {...st} />
        </svg>
      </RailBtn>
      <RailBtn active={tool === "seam"} onClick={() => setTool("seam")} title="Verificar costuras: elige tramos del contorno y compara cuánto miden (S)">
        <svg {...ic}><path d="M4 8h16M4 16h16M7 5v6M17 13v6" {...st} /></svg>
      </RailBtn>
      <RailBtn active={tool === "dart"} onClick={() => setTool("dart")} title="Pinza: clic en el contorno (boca) y luego dentro de la pieza (punta) (P)">
        <svg {...ic}><path d="M4 6h5l3 12 3-12h5" {...st} /></svg>
      </RailBtn>
      <RailBtn active={tool === "notch"} onClick={() => setTool("notch")} title="Piquete: clic en un nodo (N)">
        <svg {...ic}><path d="M12 4v16M9 8l3-4 3 4" {...st} /></svg>
      </RailBtn>
      <RailBtn active={tool === "text"} onClick={() => setTool("text")} title="Texto: clic sobre una pieza para escribir una nota (T)">
        <svg {...ic}><path d="M5 6V4h14v2M12 4v16M9 20h6" {...st} /></svg>
      </RailBtn>
      <RailBtn active={tool === "measure"} onClick={() => setTool("measure")} title="Medir distancia: arrastra (M)">
        <svg {...ic}>
          <path d="M3 15 15 3l6 6L9 21Z" {...st} />
          <path d="M7 11l2 2M10 8l2 2M13 5l2 2" {...st} />
        </svg>
      </RailBtn>
      <div className="st-rail-sep" />
      <RailBtn active={snap} onClick={toggleSnap} title="Snap a rejilla">
        <svg {...ic}>
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
  largo:       { label: "Largo total",  min: 30, max: 120, step: 0.5 },
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
  const baseSize = useEditor((s) => s.history.present.baseSize);
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
            <strong style={{ color: "var(--t-hi)" }}>{docName} · talla {baseSize}</strong>
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
  const primary = useEditor((s) => s.selectedPieceId);
  const multiSel = useEditor((s) => s.multi);
  const selectedIds = selectionOf({ selectedPieceId: primary, multi: multiSel });
  const selectPiece = useEditor((s) => s.selectPiece);
  const toggleSelectPiece = useEditor((s) => s.toggleSelectPiece);
  const insertLibraryPiece = useEditor((s) => s.insertLibraryPiece);
  const [libOpen, setLibOpen] = useState(false);
  return (
    <aside className="st-side">
      <div className="st-side-h">
        <span>Piezas</span>
        <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span className="st-chip">{doc.pieces.length}</span>
          <button
            className="st-mini"
            onClick={() => setLibOpen((o) => !o)}
            aria-pressed={libOpen}
            title="Biblioteca de piezas: insertar delantero, espalda, manga, cuello, puño, bolsillos…"
          >
            {libOpen ? "Cerrar" : "+ Biblioteca"}
          </button>
        </span>
      </div>
      {libOpen && (
        <div className="st-lib">
          {LIBRARY_CATEGORIES.map((cat) => (
            <div key={cat} className="st-lib-cat">
              <div className="st-lib-h">{cat}</div>
              {PIECE_LIBRARY.filter((e) => e.category === cat).map((e) => (
                <button
                  key={e.id}
                  className="st-lib-item"
                  onClick={() => insertLibraryPiece(e)}
                  title={`Insertar “${e.name}” (${e.source})`}
                >
                  <span>{e.name}</span>
                  <small>{e.source}</small>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
      {doc.pieces.map((p) => {
        const b = bounds(p);
        const w = b.maxX - b.minX;
        const h = b.maxY - b.minY;
        return (
          <button
            key={p.id}
            className={`st-piece${selectedIds.includes(p.id) ? " sel" : ""}`}
            onClick={(e) => (e.ctrlKey || e.metaKey ? toggleSelectPiece(p.id) : selectPiece(p.id))}
          >
            <PieceThumb piece={p} />
            <div className="st-piece-info">
              <div className="st-piece-name">{p.name}</div>
              <div className="st-piece-meta">
                {w.toFixed(0)} × {h.toFixed(0)} cm · ×{p.quantity}{p.closed ? "" : " · línea"}
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

/** Verificación de costuras: compara la medida de tramos de contorno. */
function SeamPanel() {
  const doc = useEditor((s) => s.history.present);
  const tool = useEditor((s) => s.tool);
  const setTool = useEditor((s) => s.setTool);
  const draft = useEditor((s) => s.draft);
  const active = useEditor((s) => s.activeSeam);
  const setActive = useEditor((s) => s.setActiveSeam);
  const side = useEditor((s) => s.seamSide);
  const create = useEditor((s) => s.seamCreate);
  const patch = useEditor((s) => s.patchSeamCheck);
  const del = useEditor((s) => s.deleteSeamCheck);
  const setDraft = useEditor((s) => s.setDraft);
  const checks = doc.seamChecks ?? [];
  if (tool !== "seam" && checks.length === 0) return null;
  const seam = draft?.kind === "seam" ? draft : null;
  const fmt = (v: number) => v.toFixed(1);

  return (
    <div className="st-group">
      <div className="st-label">Costuras</div>
      {tool === "seam" ? (
        <>
          <p className="st-hint" style={{ marginTop: 0 }}>
            Marca cada tramo con dos clics en nodos de una pieza. El lado A es la referencia; el lado B
            es lo que debe coserse contra A. Un lado puede sumar varios tramos (p. ej. la sisa del
            delantero y de la espalda contra la cabeza de la manga).
          </p>
          <div className="st-seg" style={{ marginBottom: 8 }}>
            <button className={(seam?.side ?? "a") === "a" ? "on" : ""} onClick={() => side("a")}>Lado A · {seam?.a.length ?? 0}</button>
            <button className={seam?.side === "b" ? "on" : ""} onClick={() => side("b")}>Lado B · {seam?.b.length ?? 0}</button>
          </div>
          {seam?.pending && <p className="st-hint">Elige el segundo punto del tramo.</p>}
          <div className="st-actions" style={{ marginTop: 0 }}>
            <button className="st-act on" onClick={() => create()}>Crear comparación</button>
            <button className="st-act" onClick={() => { setDraft(null); setTool("select"); }}>Cancelar</button>
          </div>
        </>
      ) : (
        <button className="st-act" style={{ marginTop: 0 }} onClick={() => setTool("seam")}>+ Nueva comprobación</button>
      )}
      {checks.map((c) => {
        const r = seamResult(doc, c);
        const isActive = active === c.id;
        return (
          <div key={c.id} className={`st-seam${isActive ? " on" : ""}`}>
            <div className="st-seam-h" onClick={() => setActive(isActive ? null : c.id)}>
              <TextInput value={c.name} onCommit={(v) => patch(c.id, { name: v || c.name })} />
              <button className="st-act danger" style={{ marginTop: 0 }} onClick={(e) => { e.stopPropagation(); del(c.id); }} title="Eliminar comprobación">✕</button>
            </div>
            {r ? (
              <div className="st-seam-body">
                <div className={r.ok ? "st-seam-ok" : "st-seam-bad"}>
                  {r.ok ? "✓ Coinciden" : "⚠ Revisar"} · A {fmt(r.a)} cm · B {fmt(r.b)} cm · B − A = {r.diff >= 0 ? "+" : ""}{fmt(r.diff)} cm
                </div>
                <EditField name="Holgura prevista">
                  <NumInput value={c.ease} step={0.5} min={-10} max={10} unit="cm" onCommit={(v) => patch(c.id, { ease: v })} />
                </EditField>
                {isActive && (
                  <table className="st-grade-table" style={{ marginTop: 6 }}>
                    <thead><tr><th>Talla</th><th>A</th><th>B</th><th>B − A</th><th /></tr></thead>
                    <tbody>
                      {doc.sizes.map((sz) => {
                        const rs = seamResult(gradeDoc(doc, sz), c);
                        return (
                          <tr key={sz}>
                            <td>{sz}</td>
                            <td className="mono">{rs ? fmt(rs.a) : "—"}</td>
                            <td className="mono">{rs ? fmt(rs.b) : "—"}</td>
                            <td className="mono">{rs ? `${rs.diff >= 0 ? "+" : ""}${fmt(rs.diff)}` : "—"}</td>
                            <td className={rs?.ok ? "st-seam-ok" : "st-seam-bad"}>{rs ? (rs.ok ? "✓" : "⚠") : ""}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            ) : (
              <div className="st-seam-bad" style={{ padding: "4px 10px 8px" }}>No se encontró alguno de los tramos (¿se borró una pieza?).</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Rotar a cualquier ángulo: se escribe el ángulo y se elige el sentido. */
function RotateRow({ rotate }: { rotate: (deg: number) => void }) {
  const [angle, setAngle] = useState(15);
  return (
    <div className="st-field" style={{ marginTop: 10 }}>
      <span>Rotar</span>
      <span className="st-input-wrap" style={{ gap: 6 }}>
        <button className="st-act" style={{ marginTop: 0 }} onClick={() => rotate(-angle)} title="Girar a la izquierda">⟲</button>
        <NumInput value={angle} step={5} min={0.1} max={360} unit="°" width={56} onCommit={setAngle} />
        <button className="st-act" style={{ marginTop: 0 }} onClick={() => rotate(angle)} title="Girar a la derecha">⟳</button>
      </span>
    </div>
  );
}

function SavePieceButton({ piece }: { piece: Piece }) {
  const [saved, setSaved] = useState(false);
  useEffect(() => setSaved(false), [piece.id]);
  return (
    <button
      className="st-act"
      onClick={() => { saveUserPiece(piece); setSaved(true); }}
      title="Guardar esta pieza en Librería → Mis piezas"
    >
      {saved ? "Guardada ✓" : "Guardar en librería"}
    </button>
  );
}

function EditField({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="st-field">
      <span>{name}</span>
      {children}
    </div>
  );
}

function PropsPanel() {
  const doc = useEditor((s) => s.history.present);
  const pieceId = useEditor((s) => s.selectedPieceId);
  const nodeId = useEditor((s) => s.selectedNodeId);
  const patch = useEditor((s) => s.patchSelectedPiece);
  const duplicate = useEditor((s) => s.duplicateSelected);
  const mirror = useEditor((s) => s.mirrorSelected);
  const rotate = useEditor((s) => s.rotateSelected);
  const del = useEditor((s) => s.deleteSelection);
  const setNodePos = useEditor((s) => s.setSelectedNodePos);
  const setSmooth = useEditor((s) => s.setSelectedNodeSmooth);
  const toggleNotch = useEditor((s) => s.toggleNotch);
  const multi = useEditor((s) => s.multi);
  const copy = useEditor((s) => s.copySelected);
  const paste = useEditor((s) => s.pasteClipboard);
  const clipCount = useEditor((s) => s.clipboard.length);
  const count = (pieceId ? 1 : 0) + multi.length;
  const tool = useEditor((s) => s.tool);
  const dartWidth = useEditor((s) => s.dartWidth);
  const setDartWidth = useEditor((s) => s.setDartWidth);
  const selLabel = useEditor((s) => s.selectedLabel);
  const patchLabel = useEditor((s) => s.patchSelectedLabel);
  const delLabel = useEditor((s) => s.deleteSelectedLabel);
  const label = selLabel
    ? doc.pieces.find((p) => p.id === selLabel.pieceId)?.labels?.find((l) => l.id === selLabel.labelId) ?? null
    : null;
  const piece = pieceId ? doc.pieces.find((p) => p.id === pieceId) : null;
  const node = piece && nodeId ? piece.nodes.find((n) => n.id === nodeId) : null;
  const isCurve = !!(node && (node.handleIn || node.handleOut));

  return (
    <aside className="st-props">
      <div className="st-side-h">
        <span>Propiedades</span>
      </div>
      <SeamPanel />
      {tool === "dart" && (
        <div className="st-group">
          <div className="st-label">Pinza</div>
          <EditField name="Ancho de la boca">
            <NumInput value={dartWidth} step={0.5} min={0.5} max={12} unit="cm" onCommit={setDartWidth} />
          </EditField>
          <p className="st-hint">
            1.º clic en el contorno donde va la boca; 2.º clic dentro de la pieza para la punta.
            Si la pieza queda con la pinza abierta, así sale en el DXF y en el PDF.
          </p>
        </div>
      )}
      {label && (
        <div className="st-group">
          <div className="st-label">Texto</div>
          <EditField name="Contenido">
            <TextInput value={label.text} onCommit={(v) => patchLabel({ text: v || label.text })} />
          </EditField>
          <EditField name="Alto del texto">
            <NumInput value={label.size} step={0.1} min={0.3} max={10} unit="cm" onCommit={(v) => patchLabel({ size: v })} />
          </EditField>
          <p className="st-hint">Arrástralo para moverlo. Se mueve y gira con su pieza y sale en DXF, SVG y PDF.</p>
          <div className="st-actions">
            <button className="st-act danger" onClick={delLabel} title="Eliminar texto (Supr)">Eliminar texto</button>
          </div>
        </div>
      )}
      {!piece && !label && (
        <div className="st-empty">
          Selecciona una pieza o un nodo en el lienzo para editarlo.
          <br />
          <span className="st-dim">
            Dibujar: L línea · C curva · R rectángulo · O círculo · A agregar nodo · M medir
            <br />
            Shift o Alt + arrastre → pan · Rueda → zoom · Supr → borrar
            <br />
            Ctrl+clic → varias piezas · Ctrl+arrastre → recuadro · Ctrl+A → todas
            <br />
            Ctrl+C / Ctrl+V → copiar y pegar · Ctrl+D → duplicar
          </span>
          {clipCount > 0 && (
            <div className="st-actions"><button className="st-act" onClick={paste}>Pegar ({clipCount})</button></div>
          )}
        </div>
      )}
      {piece && count > 1 && (
        <div className="st-group">
          <div className="st-label">{count} piezas seleccionadas</div>
          <p className="st-hint" style={{ marginTop: 0 }}>
            Arrastra una de ellas para mover todas. Rotar gira el grupo alrededor de su centro.
          </p>
          <RotateRow rotate={rotate} />
          <div className="st-actions">
            <button className="st-act" onClick={duplicate} title="Duplicar (Ctrl+D)">Duplicar</button>
            <button className="st-act" onClick={mirror} title="Espejar cada pieza">Espejar</button>
            <button className="st-act" onClick={copy} title="Copiar (Ctrl+C)">Copiar</button>
            {clipCount > 0 && <button className="st-act" onClick={paste} title="Pegar (Ctrl+V)">Pegar</button>}
            <button className="st-act danger" onClick={del} title="Eliminar (Supr)">Eliminar</button>
          </div>
        </div>
      )}
      {piece && count <= 1 && (
        <div className="st-group">
          <div className="st-label">Pieza</div>
          <EditField name="Nombre">
            <TextInput value={piece.name} onCommit={(v) => patch({ name: v || piece.name })} />
          </EditField>
          <EditField name="Cantidad">
            <NumInput value={piece.quantity} step={1} min={1} max={99} onCommit={(v) => patch({ quantity: Math.round(v) })} />
          </EditField>
          <EditField name="Tela">
            <TextInput value={piece.fabric ?? ""} onCommit={(v) => patch({ fabric: v })} />
          </EditField>
          {piece.closed && (
            <EditField name="Margen costura">
              <NumInput value={piece.seamAllowance} step={0.1} min={0} max={5} unit="cm" onCommit={(v) => patch({ seamAllowance: v })} />
            </EditField>
          )}
          {piece.closed && (
            <EditField name="Hilo de tela">
              <NumInput value={piece.grainAngle} step={5} min={0} max={359} unit="°" onCommit={(v) => patch({ grainAngle: v })} />
            </EditField>
          )}
          <div className="st-actions">
            <button className="st-act" onClick={duplicate} title="Duplicar (Ctrl+D)">Duplicar</button>
            <button className="st-act" onClick={mirror} title="Espejar horizontalmente">Espejar</button>
            <button className="st-act" onClick={() => rotate(-90)} title="Rotar 90° a la izquierda">⟲ 90°</button>
            <button className="st-act" onClick={() => rotate(90)} title="Rotar 90° a la derecha">⟳ 90°</button>
            <SavePieceButton piece={piece} />
            <button className="st-act" onClick={copy} title="Copiar (Ctrl+C)">Copiar</button>
            {clipCount > 0 && <button className="st-act" onClick={paste} title="Pegar (Ctrl+V)">Pegar</button>}
            <button className="st-act danger" onClick={() => { useEditor.getState().selectPiece(piece.id); del(); }} title="Eliminar pieza (Supr)">Eliminar</button>
          </div>
          <RotateRow rotate={rotate} />
        </div>
      )}
      {piece && node && (
        <div className="st-group">
          <div className="st-label">Nodo seleccionado</div>
          <EditField name="X">
            <NumInput value={node.at.x} step={0.1} unit="cm" onCommit={(v) => setNodePos(v, node.at.y)} />
          </EditField>
          <EditField name="Y">
            <NumInput value={node.at.y} step={0.1} unit="cm" onCommit={(v) => setNodePos(node.at.x, v)} />
          </EditField>
          <EditField name="Tipo">
            <span className="st-seg">
              <button className={!isCurve ? "on" : ""} onClick={() => setSmooth(false)}>Vértice</button>
              <button className={isCurve ? "on" : ""} onClick={() => setSmooth(true)}>Curva</button>
            </span>
          </EditField>
          <div className="st-actions">
            <button className="st-act" onClick={() => toggleNotch(piece.id, node.id)}>
              {node.notch ? "Quitar piquete" : "Poner piquete"}
            </button>
            <button className="st-act danger" onClick={del} title="Eliminar nodo (Supr)">Eliminar nodo</button>
          </div>
        </div>
      )}
      <SizesSection />
      <div className="st-group">
        <div className="st-label">Capas</div>
        <Legend color="#EAF2FF" label="Línea de corte" />
        <Legend color="#F0662C" label="Hilo de tela" />
        <Legend color="#3FD0C9" label="Nodos" />
        <Legend color="#E0A33C" label="Línea interna" />
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

const TOOL_HINT: Record<Tool, string> = {
  select: "Clic: seleccionar · Ctrl+clic: varias · Ctrl+arrastre: recuadro · arrastra: mover nodo, handle o pieza",
  pan: "Arrastra para mover la vista",
  notch: "Clic en un nodo para poner o quitar piquete",
  line: "Clic: agregar punto · clic en el primero o Enter: cerrar · doble clic: línea abierta · Esc: cancelar",
  curve: "Clic: agregar punto (curva suave) · clic en el primero o Enter: cerrar · doble clic: abierta",
  rect: "Arrastra para dibujar un rectángulo",
  circle: "Arrastra desde el centro para fijar el radio",
  addnode: "Clic sobre un contorno para agregar un nodo",
  measure: "Arrastra para medir una distancia",
  text: "Clic sobre una pieza para agregar un texto (nota, medida, instrucción)",
  seam: "Costura: clic en dos nodos de una pieza para marcar un tramo · repite para sumar tramos · luego cambia al lado B",
  dart: "Pinza: 1.º clic en el contorno (la boca) · 2.º clic dentro de la pieza (la punta) · el ancho se cambia a la derecha",
};

function StatusBar() {
  const tool = useEditor((s) => s.tool);
  const notice = useEditor((s) => s.notice);
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
      {notice ? <span style={{ color: "#ffb08a" }}>{notice}</span> : <span className="mut">{TOOL_HINT[tool]}</span>}
      <span className="st-sep" />
      <span className="ok">● motor v0.5 activo</span>
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
