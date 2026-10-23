// Autenticación + sesión mock, persistida en localStorage.
// Esta capa es intencionalmente la mínima: permite flujos reales de UI
// (signin, signup, logout) sin backend. Cuando migremos a Supabase/Auth real,
// cambiamos solo esta implementación — la API pública queda igual.

"use client";

import { useEffect, useState } from "react";

export type PlanId = "completo";

/** Usuarios que incluye el plan: uno, hasta que existan las cuentas de equipo. */
const SEATS: Record<PlanId, number> = { completo: 1 };

/** Las sesiones guardadas con planes anteriores (taller, maquila, industrial, aprendiz, equipo, estudio) pasan al plan único. */
export function normalizePlan(_plan?: string): PlanId {
  return "completo";
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
export function signUp(name: string, email: string, orgName?: string, plan: PlanId = "completo"): Session {
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
  return signUp(name, email, undefined, "completo");
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

export interface PlanModule {
  /** módulo del programa (los cuatro que se pidieron) */
  title: string;
  /** lo que incluye, en una frase */
  items: string;
}

export interface PlanMeta {
  id: PlanId;
  name: string;
  /** precio mensual en MXN, más IVA: el mismo para todos (los alumnos del curso tienen un cupón de un mes) */
  priceMxn: number;
  pricePer: string;
  seats: number;
  blurb: string;
  /** qué incluye, por módulo del programa */
  modules: PlanModule[];
  /** condiciones del plan, en una línea */
  extras: string;
  popular?: boolean;
}

/**
 * Un solo plan con un solo precio. Solo promete lo que el software hace hoy (ver docs/PROPUESTA-PLANES.md) y
 * está organizado por los cuatro módulos que se pidieron. El cobro, las cuentas reales y el cupón de los
 * alumnos todavía no existen.
 */
export const PLANS: readonly PlanMeta[] = [
  {
    id: "completo",
    name: "Completo",
    priceMxn: 490,
    pricePer: "/ mes",
    seats: SEATS.completo,
    blurb: "Todo el programa, para el patronista, el taller chico y el alumno del curso.",
    popular: true,
    modules: [
      { title: "Patronaje 2D", items: "12 herramientas de dibujo, biblioteca de piezas y 17 prendas base" },
      { title: "Graduación", items: "Automática y manual. S–XL, XS–XXL y 28–36" },
      { title: "Trazo", items: "Consumo de tela por talla y porcentaje de aprovechamiento" },
      { title: "Producción", items: "Ficha técnica, variantes de modelo y exportar PDF, SVG y DXF estilo AAMA (en validación)" },
    ],
    extras: "Proyectos ilimitados · ayuda dentro de la app · soporte por correo",
  },
] as const;

export const findPlan = (id: PlanId): PlanMeta =>
  PLANS.find((p) => p.id === id) ?? PLANS[0]!;
