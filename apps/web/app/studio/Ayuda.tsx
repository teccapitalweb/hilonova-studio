// Ayuda dentro de la app: botón «Ayuda» (con ventana de guía por pantalla, primeros pasos,
// patrón en blanco y atajos) y la guía que aparece sobre un lienzo vacío. El contenido
// está en ayuda-contenido.ts.

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useEditor } from "./store";
import { HELP_BLANK, HELP_BY_VIEW, HELP_FLOW, HELP_TOOLS, type HelpSection } from "./ayuda-contenido";

const SEEN_KEY = "hilonova.helpSeen.v1";

type Tab = "pantalla" | "pasos" | "blanco" | "atajos";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "pantalla", label: "Esta pantalla" },
  { id: "pasos", label: "Primeros pasos" },
  { id: "blanco", label: "Patrón en blanco" },
  { id: "atajos", label: "Herramientas y atajos" },
];

function readSeen(): boolean {
  try {
    return window.localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return true; // si el navegador no deja guardar, no se muestra el punto de «nuevo»
  }
}

function Section({ s }: { s: HelpSection }) {
  return (
    <div className="st-help-sec">
      <h3>{s.title}</h3>
      <ul>
        {s.steps.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      {s.tips && s.tips.length > 0 && (
        <div className="st-help-tips">
          {s.tips.map((t) => (
            <p key={t}>
              <b>Consejo:</b> {t}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function HelpModal({ onClose, start }: { onClose: () => void; start: Tab }) {
  const view = useEditor((s) => s.view);
  const [tab, setTab] = useState<Tab>(start);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="st-help-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="st-help" role="dialog" aria-modal="true" aria-label="Ayuda">
        <header className="st-help-h">
          <strong>Ayuda</strong>
          <button className="st-ic" onClick={onClose} title="Cerrar (Esc)" aria-label="Cerrar la ayuda">
            ✕
          </button>
        </header>
        <nav className="st-help-tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? "on" : ""} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
        <div className="st-help-body">
          {tab === "pantalla" && <Section s={HELP_BY_VIEW[view]} />}
          {tab === "pasos" && <Section s={HELP_FLOW} />}
          {tab === "blanco" && <Section s={HELP_BLANK} />}
          {tab === "atajos" && (
            <div className="st-help-sec">
              <h3>Herramientas y atajos del teclado</h3>
              <table className="st-help-keys">
                <tbody>
                  {HELP_TOOLS.map((k) => (
                    <tr key={k.keys}>
                      <th scope="row">
                        <kbd>{k.keys}</kbd>
                      </th>
                      <td>{k.what}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Botón «Ayuda» de la barra de arriba; el punto naranja avisa hasta que se abre la primera vez. */
export function HelpButton() {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(true);
  useEffect(() => setSeen(readSeen()), []);

  function toggle() {
    setOpen((o) => !o);
    setSeen(true);
    try {
      window.localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <button className="st-help-btn" onClick={toggle} title="Ayuda: cómo usar esta pantalla" aria-haspopup="dialog">
        <span className="st-help-q" aria-hidden="true">?</span>
        Ayuda
        {!seen && <span className="st-help-dot" aria-label="nuevo" />}
      </button>
      {open && <HelpModal onClose={() => setOpen(false)} start="pantalla" />}
    </>
  );
}

/** Guía sobre un lienzo vacío (un patrón en blanco sin piezas todavía). */
export function EmptyGuide() {
  const router = useRouter();
  const setTool = useEditor((s) => s.setTool);
  const setLibOpen = useEditor((s) => s.setLibOpen);
  const [more, setMore] = useState(false);
  return (
    <div className="st-empty-guide">
      <div className="st-empty-card">
        <h3>Tu lienzo está vacío</h3>
        <p>Empieza tu patrón de una de estas tres formas:</p>
        <ol>
          <li>
            <b>Dibuja una pieza.</b> Haz clic en cada esquina; para cerrar, clic en el primer punto (o Enter).
            <span className="st-empty-btns">
              <button className="st-act" onClick={() => setTool("line")}>Dibujar con polilínea (L)</button>
              <button className="st-act" onClick={() => setTool("curve")}>Con curvas (C)</button>
              <button className="st-act" onClick={() => setTool("rect")}>Rectángulo (R)</button>
            </span>
          </li>
          <li>
            <b>Agrega una pieza ya hecha</b> (delantero, espalda, manga, cuello, bolsillo…).
            <span className="st-empty-btns">
              <button className="st-act" onClick={() => setLibOpen(true)}>Abrir biblioteca</button>
            </span>
          </li>
          <li>
            <b>Parte de una prenda base</b> con sus piezas ya dibujadas y tus medidas.
            <span className="st-empty-btns">
              <button className="st-act" onClick={() => router.push("/app/new")}>Elegir prenda base</button>
            </span>
          </li>
        </ol>
        <button className="st-empty-more" onClick={() => setMore(true)}>
          ¿Cómo se usa un patrón en blanco? Ver guía completa
        </button>
        {more && <HelpModal onClose={() => setMore(false)} start="blanco" />}
      </div>
    </div>
  );
}
