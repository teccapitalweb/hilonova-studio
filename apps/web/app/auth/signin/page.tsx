"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { sendPasswordReset, signInAccount } from "../../lib/auth";
import { authErrorMessage } from "../../lib/auth-errors";
import { firebaseConfigured } from "../../lib/firebase";
import AuthAside from "../AuthAside";
import SsoButtons from "../SsoButtons";
import "../../(saas)/saas.css";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Si ya hay sesión, saltar directo al dashboard — no reautenticar.
  useEffect(() => {
    const t = setTimeout(() => {
      if (localStorage.getItem("hilonova.session.v1")) router.replace("/app");
    }, 50);
    return () => clearTimeout(t);
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Necesitamos un correo válido para entrar.");
      return;
    }
    if (firebaseConfigured() && !password) {
      setError("Escribe tu contraseña.");
      return;
    }
    setBusy(true);
    try {
      await signInAccount(trimmed, password);
      router.push("/app");
    } catch (err) {
      setBusy(false);
      setError(authErrorMessage(err) || "No pudimos iniciar sesión. Inténtalo de nuevo.");
      console.warn("signIn failed:", err);
    }
  }

  async function onForgot() {
    setError(null);
    setInfo(null);
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Escribe tu correo arriba y vuelve a pulsar «Olvidé mi contraseña».");
      return;
    }
    try {
      await sendPasswordReset(trimmed);
    } catch (err) {
      // Por privacidad no se dice si el correo existe; solo se avisa de fallas de conexión u otras.
      const code = (err as { code?: string }).code;
      if (code !== "auth/user-not-found") {
        setError(authErrorMessage(err) || "No pudimos enviar el correo. Inténtalo de nuevo.");
        return;
      }
    }
    setInfo("Si ese correo tiene una cuenta, te enviamos un enlace para elegir una contraseña nueva. Revisa también la carpeta de spam.");
  }

  return (
    <div className="auth-wrap">
      <AuthAside
        eyebrow="Patronaje industrial · hecho para maquila"
        title="Bienvenido de vuelta."
        subtitle="Tus patrones, tu equipo y tu flujo de producción — justo donde los dejaste."
        photoPath="/img/contexto.jpg"
      />
      <main className="auth-form">
        <div className="auth-form-inner">
          <h1>Hola de nuevo.</h1>
          <p className="subtitle">Entra con tu cuenta para seguir con tus patrones.</p>

          <SsoButtons onError={setError} />

          {error && (
            <div className="auth-error" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                <path d="M12 7v6M12 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {info && <div className="auth-info" role="status">{info}</div>}

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
            {firebaseConfigured() && (
              <div className="field">
                <label htmlFor="password">Contraseña</label>
                <div className="input-wrap">
                  <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M6 11V8a6 6 0 1 1 12 0v3M5 11h14v9H5v-9Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                  <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" placeholder="Tu contraseña" />
                </div>
                <button type="button" className="forgot" onClick={onForgot}>Olvidé mi contraseña</button>
              </div>
            )}
            <button className="cta" type="submit" disabled={busy}>
              {busy ? "Entrando…" : "Iniciar sesión"}
              {!busy && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <p className="alt">
              ¿Primera vez aquí? <Link href="/auth/signup">Crea tu cuenta</Link>
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
