"use client";

// Puerta del programa: con el cobro encendido, solo entra quien tiene acceso (el negocio se lo da al recibir el pago,
// o a mano a alumnos y cortesías). Con el cobro apagado (BILLING.enabled = false) deja pasar a todos, como hasta ahora.
// OJO: el programa corre en el navegador, así que esta puerta frena al usuario común, no a un programador que
// modifique el código; lo que sí queda protegido en servidor es el cobro mismo y los datos de cada cuenta.

import { useEffect, useState, type ReactNode } from "react";
import SaasNav from "../(saas)/SaasNav";
import { findPlan, signOut, useSession } from "../lib/auth";
import { goToPayment, accessWhatsappUrl, usePlanStatus } from "../lib/billing";
import { BILLING } from "../lib/billing-config";
import "../(saas)/saas.css";

export default function PlanGate({ children }: { children: ReactNode }) {
  const state = usePlanStatus();
  if (state === "disabled" || state === "active") return <>{children}</>;
  return (
    <div className="app-wrap">
      <SaasNav />
      <main className="gate">
        {state === "loading" ? <p className="loading">Comprobando tu plan…</p> : <Activate unknown={state === "unknown"} />}
      </main>
    </div>
  );
}

function Activate({ unknown }: { unknown: boolean }) {
  const plan = findPlan("completo");
  const session = useSession();
  const [paid, setPaid] = useState(false);

  // al volver del enlace de pago, Stripe manda de regreso con ?pago=ok
  useEffect(() => {
    setPaid(new URLSearchParams(window.location.search).get("pago") === "ok");
  }, []);

  const email = session?.user.email ?? "";
  const uid = session?.user.id ?? "";

  if (unknown) {
    return (
      <div className="gate-card">
        <h1>No pudimos comprobar tu plan</h1>
        <p>Revisa tu conexión a internet e inténtalo de nuevo.</p>
        <button className="gate-btn" onClick={() => window.location.reload()}>Reintentar</button>
      </div>
    );
  }

  if (paid) {
    return (
      <div className="gate-card">
        <h1>¡Gracias por tu pago!</h1>
        <p>Estamos activando tu cuenta. Esta pantalla se actualiza sola cuando esté lista.</p>
        <p className="gate-small">
          ¿Tarda mucho? <a className="gate-link" href={accessWhatsappUrl(email)} target="_blank" rel="noopener">Avísanos por WhatsApp</a>.
        </p>
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
      {BILLING.paymentLink ? (
        <button className="gate-btn" onClick={() => goToPayment(uid, email)}>Pagar con tarjeta</button>
      ) : (
        <a className="gate-btn gate-btn-link" href={accessWhatsappUrl(email)} target="_blank" rel="noopener">Pedir mi acceso por WhatsApp</a>
      )}
      <p className="gate-small">El pago lo procesa Stripe y tu acceso se activa al confirmarlo.</p>
      <p className="gate-small">
        ¿Ya pagaste o ya te dieron un acceso? <a className="gate-link" href={accessWhatsappUrl(email)} target="_blank" rel="noopener">Avísanos por WhatsApp</a>.
      </p>
      <p className="gate-small">
        <button className="gate-link" onClick={async () => { await signOut(); window.location.href = "/"; }}>Cerrar sesión</button>
      </p>
    </div>
  );
}
