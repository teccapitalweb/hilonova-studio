// Nav persistente del shell SaaS. Muestra avatar cuando hay sesión
// y un menú dropdown con cuenta + salir.

"use client";

import Link from "next/link";
import { useState } from "react";
import { signOut, useSession } from "../lib/auth";

const initials = (name: string): string =>
  name
    .split(" ")
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function SaasNav({ active }: { active?: "app" | "account" }) {
  const session = useSession();
  const [open, setOpen] = useState(false);
  return (
    <header className="saas-nav">
      <div className="saas-nav-in">
        <Link href="/app" className="saas-brand">
          <span className="mk" aria-hidden="true" />
          hilonova
        </Link>
        <nav className="saas-nav-links">
          <Link href="/app" className={active === "app" ? "active" : ""}>Patrones</Link>
          <Link href="/account" className={active === "account" ? "active" : ""}>Cuenta</Link>
        </nav>
        <div className="saas-nav-spacer" />
        {session ? (
          <div style={{ position: "relative" }}>
            <button
              className="saas-avatar"
              onClick={() => setOpen((o) => !o)}
              aria-label="Menú de cuenta"
            >
              {initials(session.user.name)}
            </button>
            {open && (
              <>
                <div
                  style={{ position: "fixed", inset: 0, zIndex: 55 }}
                  onClick={() => setOpen(false)}
                />
                <div className="saas-menu" role="menu">
                  <div className="mi-head">
                    <b>{session.user.name}</b>
                    <span>{session.user.email}</span>
                  </div>
                  <Link href="/account" onClick={() => setOpen(false)}>Cuenta</Link>
                  <div className="mi-sep" />
                  <button
                    onClick={async () => {
                      await signOut();
                      setOpen(false);
                      // volver al landing
                      window.location.href = "/";
                    }}
                  >
                    Cerrar sesión
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            <Link href="/auth/signin" className="saas-nav-links" style={{ padding: "7px 14px" }}>
              Iniciar sesión
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
