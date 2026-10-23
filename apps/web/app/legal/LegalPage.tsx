"use client";

// Marco común de las páginas legales (términos y privacidad).

import Link from "next/link";
import type { ReactNode } from "react";
import SaasNav from "../(saas)/SaasNav";
import "../(saas)/saas.css";

export default function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="app-wrap">
      <SaasNav />
      <main className="legal">
        <h1>{title}</h1>
        {children}
        <p className="legal-back">
          <Link href="/auth/signup">← Volver a crear cuenta</Link>
        </p>
      </main>
    </div>
  );
}
