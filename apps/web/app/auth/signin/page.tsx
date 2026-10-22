"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "../../lib/auth";
import AuthAside from "../AuthAside";
import SsoButtons from "../SsoButtons";
import "../../(saas)/saas.css";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Necesitamos un correo válido para entrar.");
      return;
    }
    setBusy(true);
    try {
      signIn(trimmed);
      router.push("/app");
    } catch (err) {
      setBusy(false);
      setError("No pudimos iniciar sesión. Recarga la página e intenta de nuevo.");
      console.error("signIn failed:", err);
    }
  }

  return (
    <div className="auth-wrap">
      <AuthAside
        eyebrow="Patronaje industrial · hecho para maquila"
        title="Bienvenido de vuelta."
        subtitle="Tus patrones, tu equipo y tu flujo de producción — justo donde los dejaste."
        photoPath="/img/contexto.jpg"
        quote={{
          text: "Dejamos de re-digitalizar patrones. Lo que diseñamos es lo que cortan.",
          name: "Lucía Mendoza",
          role: "Patronista · Confecciones Puebla",
        }}
      />
      <main className="auth-form">
        <div className="auth-form-inner">
          <h1>Hola de nuevo.</h1>
          <p className="subtitle">Entra con tu cuenta para seguir con tus patrones.</p>

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
              <label htmlFor="email">Correo electrónico</label>
              <div className="input-wrap">
                <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M3 7l9 6 9-6M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@taller.mx"
                  required
                  autoFocus
                />
              </div>
            </div>
            <button className="cta" type="submit" disabled={busy}>
              {busy ? "Entrando…" : "Iniciar sesión"}
              {!busy && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <p className="alt">
              ¿Primera vez aquí? <Link href="/auth/signup">Crea tu cuenta gratis</Link>
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
