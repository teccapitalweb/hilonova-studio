// CTA del nav de la landing que se adapta al estado de sesión.
// Si no hay sesión: "Iniciar sesión" + "Crear cuenta"
// Si hay sesión: "Entrar al estudio" (va directo al dashboard)

"use client";

import Link from "next/link";
import { useSession } from "./lib/auth";

export function NavCta() {
  const session = useSession();
  if (session) {
    return (
      <div className="nav-cta">
        <Link className="nav-login" href="/account">
          {session.user.name.split(" ")[0] ?? "Mi cuenta"}
        </Link>
        <Link className="btn btn-dark" href="/app">
          Entrar al estudio
        </Link>
      </div>
    );
  }
  return (
    <div className="nav-cta">
      <Link className="nav-login" href="/auth/signin">Iniciar sesión</Link>
      <Link className="btn btn-dark" href="/auth/signup">Crear cuenta</Link>
    </div>
  );
}

/** Botón grande del hero / CTA final. Cambia label si ya hay sesión. */
export function HeroCta({ className }: { className?: string }) {
  const session = useSession();
  const href = session ? "/app" : "/auth/signup";
  const label = session ? "Entrar al estudio" : "Crear cuenta";
  return (
    <Link className={className ?? "btn btn-accent"} href={href}>
      {label}
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}
