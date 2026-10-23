// Autenticación y sesión.
// Con un proyecto de Firebase configurado (lib/firebase-config.ts) las cuentas son reales: correo y contraseña
// o Google. Sin configuración funciona en «modo de prueba»: la cuenta vive solo en este navegador (localStorage).
// En ambos modos la sesión se guarda también en localStorage, así que el resto del programa la lee igual.
// OJO: esa copia local es solo para pintar la pantalla; lo que protege los datos son las reglas de Firebase.

"use client";

import { useEffect, useState } from "react";
import { firebaseConfigured, getDb, getFirebase, withTimeout } from "./firebase";

export type PlanId = "completo";

/** Usuarios que incluye el plan: uno, hasta que existan las cuentas de equipo. */
const SEATS: Record<PlanId, number> = { completo: 1 };

/** Las sesiones guardadas con planes anteriores (taller, maquila, industrial, aprendiz, equipo, estudio) pasan al plan único. */
export function normalizePlan(_plan?: string): PlanId {
  return "completo";
}

export interface Session {
  user: { id: string; name: string; email: string; emailVerified?: boolean };
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

/** Nombre de taller por omisión cuando la persona no escribió uno. */
export function defaultOrgName(name: string): string {
  return `${name.split(" ")[0] ?? "Taller"} de ${name.split(" ").slice(-1)[0] ?? ""}`.trim() || "Mi taller";
}

/** Crea una sesión mock a partir del nombre+email. Simula el "crear cuenta". */
export function signUp(name: string, email: string, orgName?: string, plan: PlanId = "completo"): Session {
  const session: Session = {
    user: { id: uid(), name, email },
    org: {
      id: "org_" + Math.random().toString(36).slice(2, 10),
      name: orgName ?? defaultOrgName(name),
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

/** Cierra la sesión. Hay que esperarla antes de cambiar de página, o la cuenta de Firebase sigue abierta. */
export async function signOut(): Promise<void> {
  writeSession(null);
  if (!firebaseConfigured()) return;
  try {
    const { auth } = await getFirebase();
    await (await import("firebase/auth")).signOut(auth);
  } catch (err) {
    console.error("signOut falló:", err);
  }
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

// ─── Cuentas reales (Firebase) ──────────────────────────────────────────────

/** Datos mínimos de la cuenta de Firebase que usamos (sirve también para probar sin Firebase). */
export interface AccountUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  createdAt: string | null;
}

export interface Profile {
  name?: string;
  orgName?: string;
  createdAt?: string;
}

/** Arma la sesión que usa el programa a partir de la cuenta y su perfil. */
export function sessionFromAccount(u: AccountUser, profile: Profile = {}): Session {
  const email = u.email ?? "";
  const name = profile.name?.trim() || u.displayName?.trim() || (email.split("@")[0] ?? "Usuario").replace(/[._-]/g, " ");
  // Todas las cuentas reciben hoy el plan único: el control de quién pagó llega con el cobro (servidor).
  const plan: PlanId = "completo";
  return {
    user: { id: u.uid, name, email, emailVerified: u.emailVerified },
    org: { id: "org_" + u.uid, name: profile.orgName?.trim() || defaultOrgName(name), plan, seats: SEATS[plan] },
    since: profile.createdAt ?? u.createdAt ?? new Date().toISOString(),
  };
}

type FbUser = import("firebase/auth").User;

const toAccount = (u: FbUser): AccountUser => ({
  uid: u.uid,
  email: u.email,
  displayName: u.displayName,
  emailVerified: u.emailVerified,
  createdAt: u.metadata.creationTime ? new Date(u.metadata.creationTime).toISOString() : null,
});

async function readProfile(uid: string): Promise<Profile> {
  try {
    const db = await getDb();
    const { doc, getDoc } = await import("firebase/firestore");
    const snap = await withTimeout(getDoc(doc(db, "users", uid)), 6000, "leer perfil");
    const data = snap.exists() ? (snap.data() as { name?: string; orgName?: string; createdAt?: { toDate?: () => Date } }) : {};
    return { name: data.name, orgName: data.orgName, createdAt: data.createdAt?.toDate?.().toISOString() };
  } catch (err) {
    console.warn("No se pudo leer el perfil (se usan los datos de la cuenta):", err);
    return {};
  }
}

async function writeProfile(uid: string, profile: { name: string; orgName: string }): Promise<void> {
  try {
    const db = await getDb();
    const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
    await withTimeout(setDoc(doc(db, "users", uid), { ...profile, createdAt: serverTimestamp() }), 6000, "guardar perfil");
  } catch (err) {
    console.warn("No se pudo guardar el perfil:", err);
  }
}

/** Cada vez que la cuenta cambia solo vale el resultado de la última lectura. */
let applyToken = 0;

async function applyUser(u: FbUser | null, profile?: Profile): Promise<Session | null> {
  const token = ++applyToken;
  if (!u) {
    writeSession(null);
    return null;
  }
  let prof = profile ?? (await readProfile(u.uid));
  if (token !== applyToken) return readSession();
  if (!prof.name && !prof.orgName) {
    // Perfil no disponible (sin conexión o aún sin guardar): se conservan los datos que ya había en este navegador.
    const cached = readSession();
    if (cached && cached.user.id === u.uid) prof = { name: cached.user.name, orgName: cached.org.name, createdAt: cached.since };
  }
  const session = sessionFromAccount(toAccount(u), prof);
  writeSession(session);
  return session;
}

let syncStarted = false;

/** Mantiene la sesión local al día con la cuenta de Firebase (entrar, salir, otra pestaña). Idempotente. */
export function startAuthSync(): void {
  if (syncStarted || !firebaseConfigured() || typeof window === "undefined") return;
  syncStarted = true;
  getFirebase()
    .then(async ({ auth }) => {
      const { onAuthStateChanged } = await import("firebase/auth");
      onAuthStateChanged(auth, (u) => void applyUser(u));
    })
    .catch((err) => {
      syncStarted = false;
      console.error("No se pudo iniciar la sesión con Firebase:", err);
    });
}

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
  orgName?: string;
}

/** Crea la cuenta. Con Firebase: cuenta real + correo de verificación. Sin Firebase: cuenta de prueba local. */
export async function signUpAccount(input: SignUpInput): Promise<Session> {
  const name = input.name.trim();
  const orgName = input.orgName?.trim() || defaultOrgName(name);
  if (!firebaseConfigured()) return signUp(name, input.email.trim(), input.orgName?.trim() || undefined);
  const { auth } = await getFirebase();
  const { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } = await import("firebase/auth");
  const cred = await createUserWithEmailAndPassword(auth, input.email.trim(), input.password);
  await updateProfile(cred.user, { displayName: name }).catch(() => {});
  await writeProfile(cred.user.uid, { name, orgName });
  sendEmailVerification(cred.user).catch((err) => console.warn("No se pudo enviar el correo de verificación:", err));
  return (await applyUser(cred.user, { name, orgName }))!;
}

/** Entra con correo y contraseña. Sin Firebase: entra a la cuenta de prueba local. */
export async function signInAccount(email: string, password: string): Promise<Session> {
  if (!firebaseConfigured()) return signIn(email.trim());
  const { auth } = await getFirebase();
  const { signInWithEmailAndPassword } = await import("firebase/auth");
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return (await applyUser(cred.user))!;
}

/** Entra con Google (ventana emergente). Solo con Firebase. */
export async function signInWithGoogle(): Promise<Session> {
  const { auth } = await getFirebase();
  const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
  const cred = await signInWithPopup(auth, new GoogleAuthProvider());
  let profile = await readProfile(cred.user.uid);
  if (!profile.name) {
    const name = cred.user.displayName?.trim() || (cred.user.email?.split("@")[0] ?? "Usuario");
    profile = { name, orgName: defaultOrgName(name) };
    await writeProfile(cred.user.uid, { name, orgName: profile.orgName! });
  }
  return (await applyUser(cred.user, profile))!;
}

/** Manda el correo para elegir una contraseña nueva. Solo con Firebase. */
export async function sendPasswordReset(email: string): Promise<void> {
  const { auth } = await getFirebase();
  const { sendPasswordResetEmail } = await import("firebase/auth");
  await sendPasswordResetEmail(auth, email.trim());
}

// ─── Hook de React ──────────────────────────────────────────────────────────

/** Devuelve la sesión actual y la mantiene sincronizada entre pestañas. */
export function useSession(): Session | null {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    startAuthSync();
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
  /** precio mensual en MXN, más IVA: el mismo para todos */
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
    blurb: "Todo el programa, para el patronista y el taller chico.",
    popular: true,
    modules: [
      { title: "Patronaje 2D", items: "12 herramientas, biblioteca de piezas y 17 prendas base" },
      { title: "Graduación", items: "Automática y manual. S–XL, XS–XXL y 28–36" },
      { title: "Trazo", items: "Consumo de tela por talla y porcentaje de aprovechamiento" },
      { title: "Producción", items: "Ficha técnica, variantes de modelo y exportar PDF, SVG y DXF estilo AAMA (en validación)" },
    ],
    extras: "Proyectos ilimitados · ayuda dentro de la app · soporte por WhatsApp",
  },
] as const;

export const findPlan = (id: PlanId): PlanMeta =>
  PLANS.find((p) => p.id === id) ?? PLANS[0]!;
