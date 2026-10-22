// Autenticación + sesión mock, persistida en localStorage.
// Esta capa es intencionalmente la mínima: permite flujos reales de UI
// (signin, signup, logout) sin backend. Cuando migremos a Supabase/Auth real,
// cambiamos solo esta implementación — la API pública queda igual.

"use client";

import { useEffect, useState } from "react";

export type PlanId = "taller" | "maquila" | "industrial";

export interface Session {
  user: { id: string; name: string; email: string };
  org: { id: string; name: string; plan: PlanId; seats: number };
  since: string; // ISO date
}

const KEY = "hilonova.session.v1";

function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function writeSession(s: Session | null) {
  if (typeof window === "undefined") return;
  try {
    if (s) window.localStorage.setItem(KEY, JSON.stringify(s));
    else window.localStorage.removeItem(KEY);
    // notificar a otras pestañas y a los hooks de la misma
    window.dispatchEvent(new Event("hilonova:session"));
  } catch {
    /* ignore quota / disabled storage */
  }
}

const uid = (): string =>
  "u_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

/** Crea una sesión mock a partir del nombre+email. Simula el "crear cuenta". */
export function signUp(name: string, email: string, orgName?: string, plan: PlanId = "taller"): Session {
  const session: Session = {
    user: { id: uid(), name, email },
    org: {
      id: "org_" + Math.random().toString(36).slice(2, 10),
      name: orgName ?? (`${name.split(" ")[0] ?? "Taller"} de ${name.split(" ").slice(-1)[0] ?? ""}`.trim() || "Mi taller"),
      plan,
      seats: plan === "taller" ? 2 : plan === "maquila" ? 8 : 20,
    },
    since: new Date().toISOString(),
  };
  writeSession(session);
  return session;
}

/** Inicia sesión mock. Si el email no corresponde a una sesión previa, crea una nueva con el email dado. */
export function signIn(email: string): Session {
  const current = readSession();
  if (current && current.user.email === email) return current;
  // "crear" cuenta ligera al vuelo
  const name = email.split("@")[0] ?? "Usuario";
  return signUp(name.replace(/[._-]/g, " "), email);
}

export function signOut(): void {
  writeSession(null);
}

/** Inicio de sesión con proveedor (Google/Apple). Mock: deriva email del nombre
 *  del proveedor y simula el flujo sin OAuth real. */
export function signInWithProvider(provider: "google" | "apple"): Session {
  const name = provider === "google" ? "Miguel Galicia" : "Usuario Apple";
  const email = provider === "google" ? "miguel.g@gmail.com" : "miguel.g@icloud.com";
  const existing = readSession();
  if (existing && existing.user.email === email) return existing;
  return signUp(name, email, undefined, "taller");
}

export function getSession(): Session | null {
  return readSession();
}

export function updatePlan(plan: PlanId): Session | null {
  const s = readSession();
  if (!s) return null;
  const seats = plan === "taller" ? 2 : plan === "maquila" ? 8 : 20;
  const next: Session = { ...s, org: { ...s.org, plan, seats } };
  writeSession(next);
  return next;
}

// ─── Hook de React ──────────────────────────────────────────────────────────

/** Devuelve la sesión actual y la mantiene sincronizada entre pestañas. */
export function useSession(): Session | null {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    setSession(readSession());
    const onChange = () => setSession(readSession());
    window.addEventListener("hilonova:session", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("hilonova:session", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return session;
}

// ─── Catálogo de planes (fuente de verdad para pricing/account) ─────────────

export interface PlanMeta {
  id: PlanId;
  name: string;
  priceMxn: number | null;
  pricePer: string;
  seats: number;
  blurb: string;
  features: string[];
  popular?: boolean;
}

export const PLANS: readonly PlanMeta[] = [
  {
    id: "taller",
    name: "Taller",
    priceMxn: 490,
    pricePer: "/ mes",
    seats: 2,
    blurb: "Para el patronista independiente y talleres chicos.",
    features: [
      "2 usuarios",
      "Patrones ilimitados",
      "Bloques de mezclilla",
      "Export PDF mosaico y plotter",
    ],
  },
  {
    id: "maquila",
    name: "Maquila",
    priceMxn: 1290,
    pricePer: "/ mes",
    seats: 8,
    blurb: "Para talleres de confección en producción constante.",
    popular: true,
    features: [
      "8 usuarios con roles",
      "Export DXF-AAMA nativo",
      "Graduación completa 28–44",
      "Trazo, consumo y Tech Pack",
      "Soporte por WhatsApp",
    ],
  },
  {
    id: "industrial",
    name: "Industrial",
    priceMxn: null,
    pricePer: "A medida",
    seats: 20,
    blurb: "Para maquilas grandes y marcas con varias líneas.",
    features: [
      "Usuarios ilimitados",
      "Todo lo de Maquila",
      "Inicio de sesión corporativo (SSO)",
      "Soporte prioritario y onboarding",
      "Acceso a la API",
    ],
  },
] as const;

export const findPlan = (id: PlanId): PlanMeta =>
  PLANS.find((p) => p.id === id) ?? PLANS[0]!;
