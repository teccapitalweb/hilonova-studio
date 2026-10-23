"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { signUp, type PlanId, findPlan } from "../../lib/auth";
import AuthAside from "../AuthAside";
import SsoButtons from "../SsoButtons";
import "../../(saas)/saas.css";

const PLAN_SET = new Set(["estudio"]);

// useSearchParams (?plan=...) requiere Suspense en export estático.
export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpForm />
    </Suspense>
  );
}

function SignUpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const planParam = params.get("plan");
  const plan: PlanId = PLAN_SET.has(planParam ?? "") ? (planParam as PlanId) : "estudio";
  const planMeta = findPlan(plan);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
  const [accept, setAccept] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Si ya hay sesión, saltar al dashboard — no reautenticar.
  useEffect(() => {
    const t = setTimeout(() => {
      if (localStorage.getItem("hilonova.session.v1")) router.replace("/app");
    }, 50);
    return () => clearTimeout(t);
  }, [router]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError("Escribe tu nombre para continuar."); return; }
    if (!email.trim() || !email.includes("@")) { setError("Necesitamos un correo válido."); return; }
    if (!accept) { setError("Debes aceptar los términos para crear la cuenta."); return; }
    setBusy(true);
    try {
      signUp(name.trim(), email.trim(), org.trim() || undefined, plan);
      router.push("/app");
    } catch (err) {
      setBusy(false);
      setError("No se pudo crear la cuenta. Intenta de nuevo o recarga la página.");
      console.error("signUp failed:", err);
    }
  }

  return (
    <div className="auth-wrap">
      <AuthAside
        eyebrow="Del patrón al corte, sin fricción"
        title="Lleva tu patronaje al estándar de la industria."
        subtitle="Diseña, gradúa y traza tus patrones. Todo desde el navegador."
        photoPath="/img/testimonio.jpg"
        features={[
          "Bloques paramétricos reales",
          "Nido de tallas automático",
          "Export PDF, SVG, DXF y ficha técnica",
        ]}
        quote={{
          text: "Lo que entra como medida sale como patrón listo para producir.",
          name: "Rodrigo Pérez",
          role: "Supervisor · Maquila León",
        }}
      />
      <main className="auth-form">
        <div className="auth-form-inner">
          <h1>Crea tu cuenta.</h1>
          <p className="subtitle">
            Plan <span className="plan-chip-inline">{planMeta.name}</span>
            {planMeta.priceMxn !== null ? ` · $${planMeta.priceMxn.toLocaleString("es-MX")} MXN/mes` : " · A medida"}.
            {" "}<Link href="/pricing" style={{ color: "var(--ink-2)" }}>Cambiar</Link>
          </p>

          <SsoButtons />

          {error && (
            <div className="auth-error" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                <path d="M12 7v6M12 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="name">Tu nombre</label>
              <div className="input-wrap">
                <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <input id="name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus placeholder="Miguel Galicia" />
              </div>
            </div>
            <div className="field">
              <label htmlFor="email">Correo electrónico</label>
              <div className="input-wrap">
                <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M3 7l9 6 9-6M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="tu@taller.mx" />
              </div>
            </div>
            <div className="field">
              <label htmlFor="org">Nombre de tu taller (opcional)</label>
              <div className="input-wrap">
                <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M3 21V8l9-5 9 5v13M9 12h6M9 16h6M9 20h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <input id="org" value={org} onChange={(e) => setOrg(e.target.value)} placeholder="Ej. Confecciones Luna" />
              </div>
            </div>
            <label className="check-row">
              <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} />
              <span>Acepto los <a href="#">términos</a> y la <a href="#">privacidad</a>.</span>
            </label>
            <button className="cta" type="submit" disabled={busy}>
              {busy ? "Creando tu cuenta…" : "Crear cuenta y entrar"}
              {!busy && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <p className="alt">
              ¿Ya tienes cuenta? <Link href="/auth/signin">Iniciar sesión</Link>
            </p>
          </form>
        </div>
        <footer className="auth-form-foot">
          © {new Date().getFullYear()} Hilonova · Hecho en México 🇲🇽
        </footer>
      </main>
    </div>
  );
}

