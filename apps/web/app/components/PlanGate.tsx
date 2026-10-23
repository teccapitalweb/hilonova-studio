"use client";

// Puerta del programa: con el cobro encendido, solo entra quien tiene el plan activo (suscripción pagada o acceso
// dado a mano). Con el cobro apagado (BILLING.enabled = false) deja pasar a todos, como hasta ahora.
// OJO: el programa corre en el navegador, así que esta puerta frena al usuario común, no a un programador que
// modifique el código; lo que sí queda protegido por servidor es el cobro mismo y los datos de cada cuenta.

import { useEffect, useState, type ReactNode } from "react";
import SaasNav from "../(saas)/SaasNav";
import { findPlan, signOut } from "../lib/auth";
import { billingErrorMessage, startCheckout, usePlanStatus } from "../lib/billing";
import "../(saas)/saas.css";

export default function PlanGate({ children }: { children: ReactNode }) {
  const plan = usePlanStatus();
  if (plan.state === "disabled" || plan.state === "active") return <>{children}</>;
  return (
    <div className="app-wrap">
      <SaasNav />
      <main className="gate">
        {plan.state === "loading" ? <p className="loading">Comprobando tu plan…</p> : <Activate unknown={plan.state === "unknown"} />}
      </main>
    </div>
  );
}

function Activate({ unknown }: { unknown: boolean }) {
  const plan = findPlan("completo");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  // al volver del pago, el aviso de Stripe tarda unos segundos en llegar
  useEffect(() => {
    setConfirming(new URLSearchParams(window.location.search).get("pago") === "ok");
  }, []);

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      await startCheckout();
    } catch (err) {
      setBusy(false);
      setError(billingErrorMessage(err));
      console.warn("startCheckout falló:", err);
    }
  }

  if (confirming) {
    return (
      <div className="gate-card">
        <h1>Confirmando tu pago…</h1>
        <p>Esto tarda unos segundos. Esta pantalla se actualiza sola cuando tu plan quede activo.</p>
        <p className="gate-small">
          Si pasa más de un minuto, <button className="gate-link" onClick={() => window.location.reload()}>recarga la página</button>.
        </p>
      </div>
    );
  }

  if (unknown) {
    return (
      <div className="gate-card">
        <h1>No pudimos comprobar tu plan</h1>
        <p>Revisa tu conexión a internet e inténtalo de nuevo.</p>
        <button className="gate-btn" onClick={() => window.location.reload()}>Reintentar</button>
      </div>
    );
  }

  return (
    <div className="gate-card">
      <span className="gate-chip">{plan.name}</span>
      <h1>Activa tu plan</h1>
      <p className="gate-price">
        ${plan.priceMxn.toLocaleString("es-MX")} <small>MXN al mes · más IVA</small>
      </p>
      <ul className="gate-list">
        {plan.modules.map((m) => (
          <li key={m.title}><b>{m.title}</b></li>
        ))}
      </ul>
      {error && <div className="auth-error" role="alert"><span>{error}</span></div>}
      <button className="gate-btn" onClick={pay} disabled={busy}>{busy ? "Abriendo el pago…" : "Pagar con tarjeta"}</button>
      <p className="gate-small">El pago lo procesa Stripe. ¿Tienes un código? Lo escribes en la pantalla de pago.</p>
      <p className="gate-small">
        <button className="gate-link" onClick={async () => { await signOut(); window.location.href = "/"; }}>Cerrar sesión</button>
      </p>
    </div>
  );
}
