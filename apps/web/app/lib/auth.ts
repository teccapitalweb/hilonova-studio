// Autenticación + sesión mock, persistida en localStorage.
// Esta capa es intencionalmente la mínima: permite flujos reales de UI
// (signin, signup, logout) sin backend. Cuando migremos a Supabase/Auth real,
// cambiamos solo esta implementación — la API pública queda igual.

"use client";

import { useEffect, useState } from "react";

export type PlanId = "aprendiz" | "taller" | "equipo";

/** Usuarios que incluye cada plan. */
const SEATS: Record<PlanId, number> = { aprendiz: 1, taller: 2, equipo: 8 };

/** Las sesiones guardadas con los planes anteriores (maquila, industrial) pasan al plan que los reemplaza. */
export function normalizePlan(plan: string | undefined): PlanId {
  if (plan === "aprendiz" || plan === "taller" || plan === "equipo") return plan;
  if (plan === "maquila" || plan === "industrial") return "equipo";
  return "taller";
}

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
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    const plan = normalizePlan(s.org?.plan);
    return { ...s, org: { ...s.org, plan, seats: SEATS[plan] } };
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
      seats: SEATS[plan],
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
  const seats = SEATS[plan];
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
  /** precio mensual vigente, en MXN, más IVA */
  priceMxn: number;
  /** precio normal al terminar el lanzamiento (si lo hay) */
  regularPriceMxn?: number;
  pricePer: string;
  /** aclaración corta bajo el precio */
  priceNote?: string;
  seats: number;
  blurb: string;
  features: string[];
  popular?: boolean;
}

/**
 * Los planes solo prometen lo que el software hace hoy (ver docs/PROPUESTA-PLANES.md). El cobro, las cuentas
 * reales y los límites por plan todavía no existen: esta lista es lo que se mostraría al activarlos.
 */
export const PLANS: readonly PlanMeta[] = [
  {
    id: "aprendiz",
    name: "Aprendiz",
    priceMxn: 149,
    pricePer: "/ mes",
    priceNote: "Los primeros 3 meses van incluidos con el curso",
    seats: SEATS.aprendiz,
    blurb: "Para los alumnos del curso: aprende y practica con todo el editor.",
    features: [
      "1 usuario",
      "Hasta 10 proyectos guardados",
      "17 prendas base con sus piezas",
      "Graduación y trazo con consumo por talla",
      "Ficha técnica en PDF",
      "Exportar PDF y SVG",
      "Ayuda dentro de la app",
    ],
  },
  {
    id: "taller",
    name: "Taller",
    priceMxn: 390,
    regularPriceMxn: 490,
    pricePer: "/ mes",
    seats: SEATS.taller,
    blurb: "Para el patronista independiente y talleres chicos.",
    popular: true,
    features: [
      "2 usuarios",
      "Proyectos ilimitados",
      "Todo lo de Aprendiz",
      "Exportar DXF estilo AAMA (en validación)",
      "PDF a escala 1:1 para plotter",
      "Soporte por correo",
    ],
  },
  {
    id: "equipo",
    name: "Equipo",
    priceMxn: 990,
    regularPriceMxn: 1290,
    pricePer: "/ mes",
    seats: SEATS.equipo,
    blurb: "Para talleres y maquilas con varias personas.",
    features: [
      "Hasta 8 usuarios (las cuentas de equipo con roles llegan después)",
      "Todo lo de Taller",
      "Soporte por correo con respuesta en 1 día hábil",
    ],
  },
] as const;

export const findPlan = (id: PlanId): PlanMeta =>
  PLANS.find((p) => p.id === id) ?? PLANS[0]!;
