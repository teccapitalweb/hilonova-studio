"use client";

// Elige-tu-bloque: galería visual que arranca un patrón nuevo.
// Al hacer click en una tarjeta, se genera el bloque con las medidas base,
// se guarda en la biblioteca y se abre en /studio.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SaasNav from "../../(saas)/SaasNav";
import { useSession } from "../../lib/auth";
import { saveItem } from "../../lib/library";
import {
  BLOCK_CATALOG,
  defaultMeasurementsFor,
  draftBlock,
  type BlockKind,
} from "@hilonova/blocks";
import "../../(saas)/saas.css";
import "./new.css";

export default function NewPatternPage() {
  const router = useRouter();
  const session = useSession();
  const [busy, setBusy] = useState<BlockKind | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!localStorage.getItem("hilonova.session.v1")) router.replace("/auth/signin");
    }, 50);
    return () => clearTimeout(t);
  }, [router]);

  function pick(kind: BlockKind, name: string) {
    if (busy) return;
    setBusy(kind);
    // generamos con un pequeño delay para dejar que la UI muestre el loading
    setTimeout(() => {
      const doc = draftBlock(kind, defaultMeasurementsFor(kind));
      const id = saveItem(doc, name);
      router.push(`/studio?id=${id}`);
    }, 180);
  }

  if (!session) {
    return (
      <div className="app-wrap">
        <SaasNav active="app" />
        <main className="app-main"><p className="loading">Cargando…</p></main>
      </div>
    );
  }

  return (
    <div className="app-wrap">
      <SaasNav active="app" />
      <main className="app-main">
        <section className="new-hero">
          <Link href="/app" className="new-back">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Volver
          </Link>
          <h1>Elige un bloque para empezar.</h1>
          <p>
            Cada bloque parte de las medidas estándar de su talla base. Puedes editar
            cada medida después y el patrón se redibuja al instante.
          </p>
        </section>

        <section className="block-grid">
          {BLOCK_CATALOG.map((b) => (
            <button
              key={b.kind}
              className={`block-card${busy === b.kind ? " is-busy" : ""}`}
              onClick={() => pick(b.kind, b.name)}
              disabled={busy !== null}
              aria-label={`Crear patrón de ${b.name}`}
            >
              <div className="block-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d={b.iconPath} stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="block-body">
                <div className="block-tag">{b.tag}</div>
                <h3 className="block-name">{b.name}</h3>
                <p className="block-blurb">{b.blurb}</p>
                <div className="block-meta">
                  <span><b>{b.pieces}</b> piezas</span>
                  <span className="dot-sep">·</span>
                  <span>{b.fields.length} medidas</span>
                </div>
              </div>
              <span className="block-arrow" aria-hidden="true">
                {busy === b.kind ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="spin">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeDasharray="40 60" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
            </button>
          ))}
        </section>

        <aside className="new-foot">
          <p>
            ¿No ves lo que buscas? Más bloques (chamarra, vestido, pants)
            se añadirán en próximas versiones.
          </p>
        </aside>
      </main>
    </div>
  );
}
