// Cobro: ¿esta cuenta tiene acceso? y adónde mandar a pagar. Sin servidor propio: el pago se hace en un enlace de
// Stripe y el acceso lo da quien administra el negocio (documento access/{uid} en Firestore).
// Con BILLING.enabled en false todo queda abierto y nada de esto se consulta.

"use client";

import { useEffect, useState } from "react";
import { BILLING } from "./billing-config";
import { hasAccess, paymentUrl, whatsappUrl, withinGrace, type AccessDoc } from "./billing-core";
import { firebaseConfigured, getDb } from "./firebase";
import { useSession } from "./auth";

export type PlanState = "disabled" | "loading" | "active" | "inactive" | "unknown";

const CACHE_KEY = "hilonova.entitlement.v1";
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
export function usePlanStatus(): PlanState {
  const session = useSession();
  const uid = session?.user.id ?? null;
  const off = !BILLING.enabled || !firebaseConfigured();
  const [state, setState] = useState<PlanState>(off ? "disabled" : "loading");

  useEffect(() => {
    if (off) {
      setState("disabled");
      return;
    }
    if (!uid) {
      setState("loading");
      return;
    }
    let cancelled = false;
    let answered = false;
    let unsub: (() => void) | null = null;

    // si no se logra comprobar (sin conexión), se confía en la última comprobación por unos días
    const timer = setTimeout(() => {
      if (cancelled || answered) return;
      setState(withinGrace(readCache(uid)) ? "active" : "unknown");
    }, WAIT_MS);

    (async () => {
      try {
        const db = await getDb();
        const { doc, onSnapshot } = await import("firebase/firestore");
        unsub = onSnapshot(
          doc(db, "access", uid),
          (snap) => {
            if (cancelled) return;
            answered = true;
            const ok = hasAccess(snap.exists() ? (snap.data() as AccessDoc) : null);
            writeCache(ok ? uid : null);
            setState(ok ? "active" : "inactive");
          },
          (err) => console.warn("No se pudo comprobar el plan:", err),
        );
      } catch (err) {
        console.warn("No se pudo comprobar el plan:", err);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      unsub?.();
    };
  }, [off, uid]);

  return state;
}

/** Lleva al enlace de pago de Stripe con el correo y la cuenta ya puestos. Devuelve false si falta el enlace. */
export function goToPayment(uid: string, email: string): boolean {
  if (!BILLING.paymentLink) return false;
  window.location.assign(paymentUrl(BILLING.paymentLink, uid, email));
  return true;
}

/** WhatsApp para avisar de un pago o pedir que activen un acceso. */
export function accessWhatsappUrl(email: string): string {
  return whatsappUrl(BILLING.whatsapp, `Hola, quiero activar mi acceso a HiloNova Studio. Mi correo es ${email}.`);
}

export function portalUrl(): string {
  return BILLING.portalLink;
}
