// Carga de Firebase bajo demanda: el SDK solo se descarga cuando hay un proyecto configurado y se usa.

import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import { FIREBASE_CONFIG } from "./firebase-config";

/** Solo para pruebas locales: dirección del emulador de Authentication (p. ej. http://127.0.0.1:9099). */
const AUTH_EMULATOR = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR || "";

export function firebaseConfigured(): boolean {
  if (AUTH_EMULATOR) return true;
  return Boolean(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId && FIREBASE_CONFIG.appId);
}

interface Handles {
  app: FirebaseApp;
  auth: Auth;
}

let handles: Promise<Handles> | null = null;

export function getFirebase(): Promise<Handles> {
  if (!firebaseConfigured()) return Promise.reject(new Error("Firebase no está configurado"));
  handles ??= (async () => {
    const [{ initializeApp, getApps }, { getAuth, connectAuthEmulator }] = await Promise.all([
      import("firebase/app"),
      import("firebase/auth"),
    ]);
    const options = AUTH_EMULATOR
      ? { apiKey: "demo-key", projectId: "demo-hilonova", appId: "demo-app", authDomain: "localhost" }
      : FIREBASE_CONFIG;
    const app = getApps()[0] ?? initializeApp(options);
    const auth = getAuth(app);
    if (AUTH_EMULATOR) connectAuthEmulator(auth, AUTH_EMULATOR, { disableWarnings: true });
    return { app, auth };
  })();
  return handles;
}

export async function getDb(): Promise<Firestore> {
  const { app } = await getFirebase();
  const { getFirestore } = await import("firebase/firestore");
  return getFirestore(app);
}

/** Espera a lo más `ms`; si se pasa, rechaza (la base de datos sin conexión no debe dejar la pantalla colgada). */
export function withTimeout<T>(p: Promise<T>, ms: number, what: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${what}: tiempo agotado`)), ms);
    p.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); },
    );
  });
}
