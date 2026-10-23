// Cobro: estado del plan de la cuenta y acciones (pagar, administrar la suscripción).
// Con BILLING.enabled en false todo queda abierto y nada de esto se consulta.

"use client";

import { useEffect, useState } from "react";
import { BILLING } from "./billing-config";
import { entitlementOf, withinGrace, type AccessDoc, type Entitlement, type SubscriptionDoc } from "./billing-core";
import { firebaseConfigured, getDb, getFirebase } from "./firebase";
import { useSession } from "./auth";

export type PlanState = "disabled" | "loading" | "active" | "inactive" | "unknown";

export interface PlanStatus {
  state: PlanState;
  via: Entitlement["via"];
  subscription: SubscriptionDoc | null;
}

const CACHE_KEY = "hilonova.entitlement.v1";
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";
const WAIT_MS = 8000;

function readCache(uid: string): number | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    const c = raw ? (JSON.parse(raw) as { uid?: string; at?: number }) : null;
    return c && c.uid === uid && typeof c.at === "number" ? c.at : null;
  } catch {
    return null;
  }
}

function writeCache(uid: string | null) {
  try {
    if (uid) window.localStorage.setItem(CACHE_KEY, JSON.stringify({ uid, at: Date.now() }));
    else window.localStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
}

/** Estado del plan de la cuenta en tiempo real. «disabled» = cobro apagado: acceso total. */
export function usePlanStatus(): PlanStatus {
  const session = useSession();
  const uid = session?.user.id ?? null;
  const off = !BILLING.enabled || !firebaseConfigured();
  const [status, setStatus] = useState<PlanStatus>({ state: off ? "disabled" : "loading", via: null, subscription: null });

  useEffect(() => {
    if (off) {
      setStatus({ state: "disabled", via: null, subscription: null });
      return;
    }
    if (!uid) {
      setStatus({ state: "loading", via: null, subscription: null });
      return;
    }
    let cancelled = false;
    const unsubs: Array<() => void> = [];
    let sub: SubscriptionDoc | null = null;
    let access: AccessDoc | null = null;
    let got = { sub: false, access: false };

    const recompute = () => {
      if (cancelled || !got.sub || !got.access) return;
      const e = entitlementOf(sub, access);
      if (e.entitled) writeCache(uid);
      else writeCache(null);
      setStatus({ state: e.entitled ? "active" : "inactive", via: e.via, subscription: sub });
    };

    // si no se logra comprobar (sin conexión), se confía en la última comprobación por unos días
    const timer = setTimeout(() => {
      if (cancelled || (got.sub && got.access)) return;
      setStatus({ state: withinGrace(readCache(uid)) ? "active" : "unknown", via: null, subscription: null });
    }, WAIT_MS);

    (async () => {
      try {
        const db = await getDb();
        const { doc, onSnapshot } = await import("firebase/firestore");
        const fail = (err: unknown) => console.warn("No se pudo comprobar el plan:", err);
        unsubs.push(
          onSnapshot(
            doc(db, "customers", uid, "subscription", "current"),
            (snap) => {
              sub = snap.exists() ? (snap.data() as SubscriptionDoc) : null;
              got = { ...got, sub: true };
              recompute();
            },
            fail,
          ),
          onSnapshot(
            doc(db, "access", uid),
            (snap) => {
              access = snap.exists() ? (snap.data() as AccessDoc) : null;
              got = { ...got, access: true };
              recompute();
            },
            fail,
          ),
        );
      } catch (err) {
        console.warn("No se pudo comprobar el plan:", err);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      unsubs.forEach((u) => u());
    };
  }, [off, uid]);

  return status;
}

async function callFunction<T>(name: string): Promise<T> {
  const { app } = await getFirebase();
  const { getFunctions, httpsCallable } = await import("firebase/functions");
  const fn = httpsCallable<{ baseUrl: string }, T>(getFunctions(app, BILLING.region), name);
  const res = await fn({ baseUrl: window.location.origin + BASE });
  return res.data;
}

/** Lleva a la pantalla de pago de Stripe. */
export async function startCheckout(): Promise<void> {
  const r = await callFunction<{ url?: string; alreadyActive?: boolean }>("crearPago");
  if (r.url) window.location.assign(r.url);
  else if (r.alreadyActive) window.location.reload();
}

/** Lleva al portal de Stripe: cambiar tarjeta, ver recibos y cancelar. */
export async function openBillingPortal(): Promise<void> {
  const r = await callFunction<{ url: string }>("portalDePago");
  window.location.assign(r.url);
}

/** Mensaje en español para un error de las funciones de cobro. */
export function billingErrorMessage(err: unknown): string {
  const code = typeof err === "object" && err !== null && "code" in err ? String((err as { code: unknown }).code) : "";
  if (code.endsWith("unauthenticated")) return "Tu sesión expiró. Inicia sesión de nuevo.";
  if (code.endsWith("failed-precondition")) return "Todavía no tienes una suscripción que administrar.";
  if (code.endsWith("unavailable") || code.endsWith("deadline-exceeded")) return "No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.";
  if (code.endsWith("not-found")) return "El servicio de pagos todavía no está disponible.";
  return "No pudimos abrir el pago. Inténtalo de nuevo en un momento.";
}
