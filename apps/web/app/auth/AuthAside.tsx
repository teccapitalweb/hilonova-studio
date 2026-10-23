// Aside premium para las páginas de auth. Combina:
//  · Spotlight follow-cursor (estilo Linear/Vercel): un gradient radial sigue
//    al cursor y realza la foto cuando el usuario entra con el mouse.
//  · Ken Burns muy sutil (zoom lento constante) en la imagen de fondo.
//  · Chips decorativos flotantes (línea de corte, hilo de tela, aprovechado)
//    que respiran suave y se amplifican al hover del aside.
//  · Testimonio con hover-lift.
//
// Se mantiene completamente accesible: respeta prefers-reduced-motion.

"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { withBase } from "../lib/paths";

export interface AsideQuote {
  text: string;
  name: string;
  role: string;
  avatar?: string;
}

export interface AuthAsideProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  /** Opcional: ya no se usa como fondo (el aside va con gradiente limpio),
   *  pero mantenemos la prop por compatibilidad con las páginas de auth. */
  photoPath?: string;
  features?: string[];      // puntos con check
  /** Opcional: solo con testimonios reales y autorizados (hoy no hay ninguno). */
  quote?: AsideQuote;
}

export default function AuthAside({
  eyebrow, title, subtitle, features, quote,
}: AuthAsideProps) {
  const ref = useRef<HTMLElement>(null);

  // Parallax muy sutil al cursor: la foto y los chips se desplazan un pelín
  // en dirección OPUESTA al mouse (efecto profundidad). Más elegante que un
  // spotlight y súper cute.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        // -1..1 relativo al centro
        const dx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        const dy = ((e.clientY - r.top) / r.height - 0.5) * 2;
        el.style.setProperty("--px", `${(-dx * 10).toFixed(2)}px`);
        el.style.setProperty("--py", `${(-dy * 10).toFixed(2)}px`);
      });
    };
    const onLeave = () => {
      el.style.setProperty("--px", `0px`);
      el.style.setProperty("--py", `0px`);
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
    };
  }, []);

  const initials = (quote?.name ?? "")
    .split(" ").map((p) => p[0] ?? "").join("").slice(0, 2).toUpperCase();

  return (
    <aside ref={ref} className="auth-aside aside-fx">
      {/* capas de la escena (sin foto — solo gradiente + decoración vectorial) */}
      <div className="aside-overlay" aria-hidden="true" />
      <div className="aside-grid" aria-hidden="true" />
      <div className="aside-grain" aria-hidden="true" />

      {/* pespunte animado — una aguja cose el borde interno con hilo naranja */}
      <svg className="aside-stitch" aria-hidden="true" preserveAspectRatio="none" viewBox="0 0 100 100">
        <rect
          x="1.4" y="1.4" width="97.2" height="97.2" rx="2.2"
          fill="none"
          stroke="url(#stitchGrad)"
          strokeWidth="0.5"
          strokeDasharray="2.4 1.4"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <defs>
          <linearGradient id="stitchGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FF7E45" stopOpacity="0.9" />
            <stop offset="1" stopColor="#F0662C" stopOpacity="0.55" />
          </linearGradient>
        </defs>
      </svg>

      {/* hilos ondulantes — más protagónicos ahora que no hay foto */}
      <svg className="aside-threads" aria-hidden="true" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice">
        <g fill="none" strokeLinecap="round">
          <path d="M -20 120 C 80 100 180 160 320 140 S 440 180 480 160" className="thread t1" stroke="rgba(240,102,44,.15)" strokeWidth="1.2" />
          <path d="M -20 300 C 120 280 240 340 360 320 S 440 360 500 340" className="thread t2" stroke="rgba(255,255,255,.08)" strokeWidth="1" />
          <path d="M -20 480 C 100 460 220 520 340 500 S 460 540 520 520" className="thread t3" stroke="rgba(63,208,201,.12)" strokeWidth="1.2" />
        </g>
      </svg>

      {/* contenido */}
      <Link href="/" className="auth-brand">
        <span className="mk" aria-hidden="true" />
        <span>HILONOVA</span>
      </Link>

      <div className="auth-aside-mid">
        <span className="auth-eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        <p>{subtitle}</p>
        {features && features.length > 0 && (
          <ul className="auth-features">
            {features.map((f) => (
              <li key={f}><CheckSvg /> {f}</li>
            ))}
          </ul>
        )}
      </div>

      {quote && (
        <blockquote className="auth-quote">
          <p>"{quote.text}"</p>
          <div className="who">
            <span className="who-av">{initials}</span>
            <div>
              <b>{quote.name}</b>
              <small>{quote.role}</small>
            </div>
          </div>
        </blockquote>
      )}
    </aside>
  );
}

// ─── pequeños componentes ────────────────────────────────────────────────────

function CheckSvg() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
