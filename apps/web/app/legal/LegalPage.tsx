"use client";

// Marco común de las páginas legales (términos y privacidad) mientras son borradores.

import Link from "next/link";
import type { ReactNode } from "react";
import SaasNav from "../(saas)/SaasNav";
import "../(saas)/saas.css";

/** Dato que falta y que no se debe inventar: se ve resaltado para que nadie lo publique sin llenarlo. */
export function Todo({ children }: { children: ReactNode }) {
  return <mark className="legal-todo">[POR COMPLETAR: {children}]</mark>;
}

export default function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="app-wrap">
      <SaasNav />
      <main className="legal">
        <div className="legal-draft" role="note">
          <b>Borrador pendiente de revisión legal.</b> Este no es el texto final: los datos resaltados faltan y las
          decisiones marcadas deben confirmarse con la empresa y revisarse con un abogado antes de publicar.
        </div>
        <h1>{title}</h1>
        {children}
        <p className="legal-back">
          <Link href="/auth/signup">← Volver a crear cuenta</Link>
        </p>
      </main>
    </div>
  );
}
