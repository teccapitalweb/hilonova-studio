// Vista "Configuración": preferencias del editor y datos (respaldo y restauración).
// Los patrones también se guardan en la nube con la cuenta; materiales, «Mis piezas» y preferencias viven solo
// en este navegador: el respaldo en archivo es la forma de no perderlos ni de llevarlos a otro equipo.

"use client";

import { useRef, useState } from "react";
import { serialize, type PatternDoc } from "@hilonova/geometry";
import { VERSION as BLOCKS_VERSION } from "@hilonova/blocks";
import { useEditor } from "./store";
import { NumInput } from "./fields";
import { DEFAULT_PREFS, loadPrefs, savePrefs, type Prefs } from "../lib/prefs";
import { exportAllItems, importItems, markBackup, saveItem, type LibraryItem } from "../lib/library";
import { materials, type Material } from "../lib/materials";
import { userPieces, type UserPiece } from "../lib/pieces";

interface Backup {
  app: "hilonova-studio";
  version: 1;
  exportedAt: string;
  library: LibraryItem[];
  materials: Material[];
  pieces: UserPiece[];
}

function downloadText(text: string, filename: string, mime = "application/json") {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 100);
}

const safe = (s: string) => s.toLowerCase().replace(/[^\w-]+/g, "-").replace(/^-|-$/g, "") || "proyecto";

export default function Config() {
  const doc = useEditor((s) => s.history.present);
  const gridStep = useEditor((s) => s.gridStep);
  const snap = useEditor((s) => s.snapGrid);
  const showSeam = useEditor((s) => s.showSeam);
  const fabricWidth = useEditor((s) => s.fabricWidth);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const backupRef = useRef<HTMLInputElement>(null);

  function setPref(p: Partial<Prefs>) {
    const next: Prefs = { ...loadPrefs(), ...p };
    savePrefs(next);
    useEditor.setState({
      gridStep: next.gridStep,
      snapGrid: next.snapGrid,
      showSeam: next.showSeam,
      fabricWidth: next.fabricWidth,
    });
  }

  function exportProject() {
    downloadText(serialize(doc), `${safe(doc.name)}.hilonova.json`);
    setMsg(`Proyecto exportado: ${safe(doc.name)}.hilonova.json`);
  }

  async function importProject(file: File) {
    try {
      const raw = JSON.parse(await file.text()) as PatternDoc;
      if (raw.schema !== 1 || !Array.isArray(raw.pieces)) throw new Error("no es un proyecto de Hilonova");
      const id = saveItem(raw, raw.name);
      setMsg(`Proyecto importado: ${raw.name} (${raw.pieces.length} piezas). Búscalo en Proyectos.`);
      void id;
    } catch (e) {
      setMsg(`No se pudo importar: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  function exportBackup() {
    const backup: Backup = {
      app: "hilonova-studio",
      version: 1,
      exportedAt: new Date().toISOString(),
      library: exportAllItems(),
      materials: materials.list(),
      pieces: userPieces.list(),
    };
    downloadText(JSON.stringify(backup), `hilonova-respaldo-${new Date().toISOString().slice(0, 10)}.json`);
    markBackup();
    setMsg(`Respaldo descargado: ${backup.library.length} proyectos, ${backup.materials.length} materiales, ${backup.pieces.length} piezas.`);
  }

  async function importBackup(file: File) {
    try {
      const b = JSON.parse(await file.text()) as Partial<Backup>;
      if (b.app !== "hilonova-studio" || b.version !== 1) throw new Error("no es un respaldo de Hilonova");
      const n = importItems(b.library ?? []);
      const mats = b.materials ?? [];
      for (const m of mats) materials.upsert(m);
      const ps = b.pieces ?? [];
      for (const p of ps) userPieces.upsert(p);
      setMsg(`Respaldo restaurado: ${n} proyectos, ${mats.length} materiales, ${ps.length} piezas (se agregó o actualizó; no se borró nada).`);
    } catch (e) {
      setMsg(`No se pudo restaurar: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return (
    <div className="st-page">
      <header className="st-page-h">
        <div>
          <h1>Configuración</h1>
          <p>Preferencias del editor y respaldo de tus datos.</p>
        </div>
      </header>

      <section className="st-table-card st-form">
        <h2>Editor</h2>
        <div className="st-field">
          <span>Paso de la rejilla</span>
          <select className="st-input" value={gridStep} onChange={(e) => setPref({ gridStep: Number(e.target.value) })}>
            {[0.5, 1, 2, 5].map((v) => <option key={v} value={v}>{v} cm</option>)}
          </select>
        </div>
        <div className="st-field">
          <span>Imán a la rejilla (snap)</span>
          <input type="checkbox" checked={snap} onChange={(e) => setPref({ snapGrid: e.target.checked })} />
        </div>
        <div className="st-field">
          <span>Mostrar margen de costura</span>
          <input type="checkbox" checked={showSeam} onChange={(e) => setPref({ showSeam: e.target.checked })} />
        </div>
        <div className="st-field">
          <span>Ancho de tela por defecto</span>
          <NumInput value={fabricWidth} step={5} min={80} max={220} unit="cm" onCommit={(v) => setPref({ fabricWidth: v })} />
        </div>
        <button className="st-act" onClick={() => setPref(DEFAULT_PREFS)}>Restablecer preferencias</button>
      </section>

      <section className="st-table-card st-form">
        <h2>Datos y respaldo</h2>
        <p className="st-hint">
          Tus patrones se guardan en este navegador y en tu cuenta. Los materiales, «Mis piezas» y las preferencias
          viven solo en este navegador: descarga un respaldo con frecuencia y úsalo para llevarlos a otro equipo.
        </p>
        <div className="st-page-actions" style={{ justifyContent: "flex-start", flexWrap: "wrap" }}>
          <button className="st-btn-primary" onClick={exportBackup}>Descargar respaldo completo</button>
          <button className="st-act" onClick={() => backupRef.current?.click()}>Restaurar respaldo…</button>
          <button className="st-act" onClick={exportProject}>Exportar proyecto actual (.json)</button>
          <button className="st-act" onClick={() => fileRef.current?.click()}>Importar proyecto…</button>
        </div>
        <input
          ref={backupRef} type="file" accept="application/json,.json" hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void importBackup(f); e.target.value = ""; }}
        />
        <input
          ref={fileRef} type="file" accept="application/json,.json" hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void importProject(f); e.target.value = ""; }}
        />
        {msg && <p className="st-msg" role="status">{msg}</p>}
      </section>

      <section className="st-table-card st-form">
        <h2>Acerca de</h2>
        <div className="st-field"><span>Motor de patronaje</span><span className="v mono">v{BLOCKS_VERSION}</span></div>
        <div className="st-field"><span>Formato de archivo</span><span className="v mono">.hilonova.json (esquema 1)</span></div>
      </section>
    </div>
  );
}
