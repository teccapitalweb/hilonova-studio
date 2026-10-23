// Modal de exportación — Fase 4.
// Formatos: DXF-AAMA (industrial), SVG (vectorial), PDF A4 mosaico (casero).
// La descarga se hace del lado del cliente creando un Blob y disparando un <a>.

"use client";

import { useState } from "react";
import { exportDxfAama, exportDxfGraded, exportSvg, renderPdfTiled, renderTechPack } from "@hilonova/export";
import type { PatternDoc } from "@hilonova/geometry";
import { measurementsForBlockSize, findBlock, type BlockKind, type BodyMeasurements } from "@hilonova/blocks";
import { useEditor } from "./store";

type Format = "dxf" | "svg" | "pdf" | "techpack";

interface FormatMeta {
  id: Format;
  label: string;
  ext: string;
  mime: string;
  blurb: string;
}

const FORMATS: FormatMeta[] = [
  {
    id: "dxf",
    label: "DXF-AAMA",
    ext: "dxf",
    mime: "application/dxf",
    blurb: "El estándar de intercambio. Lo abre Gerber, Lectra y cualquier CAD industrial, con capas limpias.",
  },
  {
    id: "pdf",
    label: "PDF mosaico A4",
    ext: "pdf",
    mime: "application/pdf",
    blurb: "Imprime en casa y pega las hojas. Trae una hoja de instrucciones con un cuadro de 10 cm para comprobar la escala, y solo las hojas que llevan dibujo.",
  },
  {
    id: "techpack",
    label: "Tech Pack PDF",
    ext: "pdf",
    mime: "application/pdf",
    blurb: "Ficha técnica para producción: portada con tus datos, tabla de medidas por talla, vistas planas de todas las piezas, insumos y notas.",
  },
  {
    id: "svg",
    label: "SVG",
    ext: "svg",
    mime: "image/svg+xml",
    blurb: "Vectorial. Para abrir en Illustrator, Inkscape o compartir como vista previa.",
  },
];

export default function ExportModal({ onClose }: { onClose: () => void }) {
  const doc = useEditor((s) => s.history.present);
  const measurements = useEditor((s) => s.measurements);
  const blockKind = useEditor((s) => s.blockKind);
  const [format, setFormat] = useState<Format>("dxf");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [graded, setGraded] = useState(doc.sizes.length > 1);

  async function handleExport() {
    setBusy(true);
    setDone(null);
    try {
      const meta = FORMATS.find((f) => f.id === format)!;
      const blob = await buildBlob(format, doc, meta.mime, measurements, blockKind, graded);
      const fname =
        sanitize(doc.name) +
        (format === "techpack" ? "-techpack" : "") +
        (format === "dxf" && graded && doc.sizes.length > 1 ? "-graduado" : "") +
        "." + meta.ext;
      download(blob, fname);
      setDone(fname);
    } catch (err) {
      alert("No pude exportar: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="st-m-backdrop" onClick={onClose} />
      <div className="st-m-pop st-export" role="dialog" aria-label="Exportar patrón">
        <div className="st-m-h">
          <div>
            <div className="st-label" style={{ marginBottom: 2 }}>Exportar</div>
            <strong style={{ color: "var(--t-hi)" }}>{doc.name}</strong>
          </div>
          <button className="st-ic" onClick={onClose} title="Cerrar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className="st-exp-list">
          {FORMATS.map((f) => (
            <label key={f.id} className={`st-exp-opt${format === f.id ? " on" : ""}`}>
              <input
                type="radio"
                name="exp-fmt"
                value={f.id}
                checked={format === f.id}
                onChange={() => setFormat(f.id)}
              />
              <div className="st-exp-info">
                <div className="st-exp-label">
                  <span>{f.label}</span>
                  <span className="st-exp-ext mono">.{f.ext}</span>
                </div>
                <div className="st-exp-blurb">{f.blurb}</div>
              </div>
            </label>
          ))}
        </div>
        {format === "dxf" && doc.sizes.length > 1 && (
          <label className="st-exp-opt on" style={{ margin: "0 16px 12px", cursor: "pointer" }}>
            <input type="checkbox" checked={graded} onChange={(e) => setGraded(e.target.checked)} />
            <div className="st-exp-info">
              <div className="st-exp-label"><span>Todas las tallas (graduado)</span></div>
              <div className="st-exp-blurb">
                {graded
                  ? `Incluye ${doc.sizes.join(" · ")} en una franja por talla, con las reglas de graduación.`
                  : `Solo la talla base (${doc.baseSize}).`}
              </div>
            </div>
          </label>
        )}
        <div className="st-m-foot">
          {done && (
            <span className="st-exp-ok mono">
              ✓ {done}
            </span>
          )}
          <button className="st-btn-ghost" onClick={onClose}>Cerrar</button>
          <button className="st-btn-primary" onClick={handleExport} disabled={busy}>
            {busy ? "Generando…" : "Descargar"}
          </button>
        </div>
      </div>
    </>
  );
}

const FIELD_LABELS: Record<string, string> = {
  busto: "Busto", cintura: "Cintura", cadera: "Cadera",
  hombro: "Hombro", cuello: "Cuello", sisa: "Prof. sisa",
  largoTorso: "Largo torso", largoManga: "Largo manga",
  tiro: "Tiro", largo: "Largo total", muslo: "Muslo",
  bajo: "Abertura bajo", largoFalda: "Largo falda",
};

async function buildBlob(fmt: Format, doc: PatternDoc, mime: string, measurements: BodyMeasurements, blockKind: BlockKind, graded: boolean): Promise<Blob> {
  if (fmt === "dxf") {
    const dxf = graded && doc.sizes.length > 1 ? exportDxfGraded(doc) : exportDxfAama(doc);
    return new Blob([dxf], { type: mime });
  }
  if (fmt === "svg") return new Blob([exportSvg(doc)], { type: mime });
  if (fmt === "pdf" || fmt === "techpack") {
    // import dinámico para no cargar jsPDF hasta que se use
    const { default: JsPDF } = await import("jspdf");
    const pdf = new JsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pdfLike = pdf as unknown as Parameters<typeof renderPdfTiled>[0];
    if (fmt === "pdf") {
      renderPdfTiled(pdfLike, doc, { title: doc.name });
    } else {
      // Tech pack: medidas por talla usando las reglas del bloque vigente
      const blockMeta = findBlock(blockKind);
      const measurementRows = doc.sizes.map((size) => {
        const m = measurementsForBlockSize(blockKind, size, measurements, doc.baseSize, doc.gradeSteps);
        return {
          size,
          values: blockMeta.fields.map((f) => ({
            label: FIELD_LABELS[f] ?? f,
            value: m[f] ?? 0,
            unit: "cm",
          })),
        };
      });
      const tp = doc.techPack ?? {};
      renderTechPack(pdfLike, doc, {
        ref: tp.ref,
        revision: tp.revision || "01",
        client: tp.client,
        season: tp.season,
        designer: tp.designer,
        description: tp.description,
        notes: tp.notes,
        date: new Date().toISOString().slice(0, 10),
        measurements: measurementRows,
        bom: tp.bom,
        specs: tp.specs,
      });
    }
    return pdf.output("blob");
  }
  throw new Error("Formato no soportado: " + fmt);
}

function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 100);
}

const sanitize = (s: string): string =>
  s.toLowerCase().replace(/[^\w-]+/g, "-").replace(/^-|-$/g, "") || "patron";
