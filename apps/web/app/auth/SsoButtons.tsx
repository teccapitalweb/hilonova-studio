"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signInWithProvider } from "../lib/auth";

export default function SsoButtons() {
  const router = useRouter();
  const [busy, setBusy] = useState<"google" | "apple" | null>(null);

  function go(provider: "google" | "apple") {
    setBusy(provider);
    // simulamos la ida y vuelta de OAuth con un pequeño delay
    setTimeout(() => {
      signInWithProvider(provider);
      router.push("/app");
    }, 400);
  }

  return (
    <div className="sso-row">
      <button className="sso-btn google" onClick={() => go("google")} disabled={busy !== null}>
        <GoogleLogo />
        <span>{busy === "google" ? "Conectando…" : "Continuar con Google"}</span>
      </button>
      <button className="sso-btn apple" onClick={() => go("apple")} disabled={busy !== null}>
        <AppleLogo />
        <span>{busy === "apple" ? "Conectando…" : "Continuar con Apple"}</span>
      </button>
      <div className="sso-div">
        <span>o con correo electrónico</span>
      </div>
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    </svg>
  );
}

function AppleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 384 512" fill="currentColor" aria-hidden="true">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zM256 84.1C285.3 49.4 282.6 17.8 281.7 6c-26.3 1.5-56.7 17.9-74 38-19.1 21.6-30.3 48.3-27.9 79 28.4 2.2 54.3-12.5 76.2-38.9z" />
    </svg>
  );
}
