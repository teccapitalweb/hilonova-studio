"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import PlanGate from "../components/PlanGate";
import SaasNav from "../(saas)/SaasNav";
import { useSession } from "../lib/auth";
import { useLibrary, deleteItem, saveItem } from "../lib/library";
import { samplePath, deserialize, type Piece, type PatternDoc } from "@hilonova/geometry";
import "../(saas)/saas.css";

export default function AppDashboard() {
  return (
    <PlanGate>
      <Dashboard />
    </PlanGate>
  );
}

function Dashboard() {
  const session = useSession();
  const router = useRouter();
  const items = useLibrary();
  const [q, setQ] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      if (!localStorage.getItem("hilonova.session.v1")) router.replace("/auth/signin");
    }, 50);
    return () => clearTimeout(t);
  }, [router]);

  function createNew() {
    router.push("/app/new");
  }

  if (!session) {
    return (
      <div className="app-wrap">
        <SaasNav active="app" />
        <main className="app-main"><p className="loading">Cargando…</p></main>
      </div>
    );
  }

  const filtered = items.filter((it) => it.name.toLowerCase().includes(q.toLowerCase().trim()));

  return (
    <div className="app-wrap">
      <SaasNav active="app" />
      <main className="app-main">
        {/* ─── hero elegante ──────────────────────────── */}
        <section className="dash-hero">
          <div className="dash-hero-main">
            <span className="dash-hello-chip">
              <span className="dot" />
              {greeting()}, {session.user.name.split(" ")[0]}
            </span>
            <h1>Tus patrones</h1>
            <p>
              {items.length === 0
                ? "Tu biblioteca está vacía. Empieza tu primer patrón desde medidas."
                : `${items.length} ${items.length === 1 ? "patrón guardado" : "patrones guardados"} · ${session.org.name}`}
            </p>
          </div>
          <div className="dash-hero-side">
            <button className="btn-primary-pill" onClick={createNew}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
              Nuevo patrón
            </button>
          </div>
        </section>

        {/* ─── stat cards ─────────────────────────────── */}
        <section className="dash-stats">
          <StatCard label="Patrones guardados" value={String(items.length)} hint={items.length === 0 ? "crea tu primero" : "en tu biblioteca"} />
          <StatCard label="Última edición" value={items[0] ? relativeTime(items[0].updatedAt) : "—"} hint={items[0] ? items[0].name : "aún sin actividad"} />
        </section>

        {/* ─── biblioteca ─────────────────────────────── */}
        {items.length > 0 && (
          <div className="dash-toolbar">
            <div className="dash-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar un patrón…"
                aria-label="Buscar patrón"
              />
            </div>
            <span className="dash-count">
              {filtered.length} de {items.length}
            </span>
          </div>
        )}

        {items.length === 0 ? (
          <EmptyState onCreate={createNew} />
        ) : (
          <div className="dash-grid">
            {filtered.map((it) => {
              const doc = safeParse(it.doc);
              return (
                <article className="pat-card" key={it.id}>
                  <Link href={`/studio?id=${it.id}`} className="pat-thumb-link" aria-label={`Abrir ${it.name}`}>
                    <div className="pat-thumb">
                      {doc ? <Thumb doc={doc} /> : <span className="dim">—</span>}
                    </div>
                  </Link>
                  <div className="pat-body">
                    <Link href={`/studio?id=${it.id}`} className="pat-name">{it.name}</Link>
                    <div className="pat-meta">
                      <span className="mono">{doc?.pieces.length ?? 0} piezas</span>
                      <span className="dot-sep">·</span>
                      <span>{relativeTime(it.updatedAt)}</span>
                    </div>
                  </div>
                  <div className="pat-acts">
                    <Link href={`/studio?id=${it.id}`} className="pa-btn primary">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      Abrir
                    </Link>
                    <button
                      className="pa-btn"
                      title="Duplicar"
                      onClick={() => {
                        if (!doc) return;
                        try {
                          saveItem(doc, `${it.name} (copia)`);
                        } catch (e) {
                          window.alert(e instanceof Error ? e.message : "No se pudo duplicar.");
                        }
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
                        <path d="M4 16V6a2 2 0 0 1 2-2h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    </button>
                    <button
                      className="pa-btn danger"
                      title="Borrar"
                      onClick={() => { if (confirm(`Borrar "${it.name}"?`)) deleteItem(it.id); }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </article>
              );
            })}
            {filtered.length === 0 && q.trim() && (
              <div className="dash-no-match">
                No encontré patrones que coincidan con <b>"{q}"</b>.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ─── componentes del dashboard ─────────────────────────────────────────────

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-hint">{hint}</div>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="dash-empty">
      <svg className="dash-empty-art" viewBox="0 0 200 160" aria-hidden="true">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F0662C" />
            <stop offset="1" stopColor="#1F2A48" />
          </linearGradient>
        </defs>
        <rect x="10" y="10" width="180" height="140" rx="14" fill="rgba(240,102,44,0.06)" />
        <g transform="translate(60 20) scale(0.35)" fill="none" stroke="url(#g)" strokeWidth="4" strokeLinejoin="round">
          <path d="M60 20 L220 30 C270 110 270 240 230 320 L80 340 C70 220 50 150 20 100 Z" />
        </g>
        <circle cx="100" cy="120" r="5" fill="#F0662C" />
      </svg>
      <h3>Empieza tu primer patrón.</h3>
      <p>
        Un patrón arranca desde medidas: cintura, cadera, tiro, largo. El sistema dibuja el
        bloque, lo gradúa talla por talla y lo exporta en PDF, SVG o DXF.
      </p>
      <button className="btn-primary-pill" onClick={onCreate}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
        Crear mi primer patrón
      </button>
    </div>
  );
}

function Thumb({ doc }: { doc: PatternDoc }) {
  const d = useMemo(() => buildThumbD(doc.pieces), [doc.pieces]);
  if (!d) return <span className="dim">vacío</span>;
  return (
    <svg viewBox={d.vb} preserveAspectRatio="xMidYMid meet" className="pat-thumb-svg">
      <path d={d.path} fill="rgba(240,102,44,0.04)" stroke="var(--ink)" strokeWidth={d.sw} strokeLinejoin="round" />
    </svg>
  );
}

// ─── utilidades ────────────────────────────────────────────────────────────

function safeParse(json: string): PatternDoc | null {
  try { return deserialize(json); } catch { return null; }
}

function buildThumbD(pieces: Piece[]): { path: string; vb: string; sw: number } | null {
  if (pieces.length === 0) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let path = "";
  for (const p of pieces) {
    const pts = samplePath(p, 16);
    if (pts.length < 2) continue;
    path += pts.map((q, i) => `${i ? "L" : "M"}${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(" ") + (p.closed ? " Z " : " ");
    for (const q of pts) {
      if (q.x < minX) minX = q.x; if (q.y < minY) minY = q.y;
      if (q.x > maxX) maxX = q.x; if (q.y > maxY) maxY = q.y;
    }
  }
  if (!isFinite(minX)) return null;
  const w = maxX - minX, h = maxY - minY;
  const pad = Math.max(w, h) * 0.08;
  return {
    path,
    vb: `${minX - pad} ${minY - pad} ${w + pad * 2} ${h + pad * 2}`,
    sw: Math.max(w, h) * 0.015,
  };
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

function relativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = (now - then) / 1000;
  if (diff < 60) return "hace un momento";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  if (diff < 7 * 86400) return `hace ${Math.floor(diff / 86400)} días`;
  const d = new Date(iso);
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}
