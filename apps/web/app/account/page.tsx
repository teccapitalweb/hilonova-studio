"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SaasNav from "../(saas)/SaasNav";
import { signOut, useSession, findPlan } from "../lib/auth";
import { STATUS_LABEL } from "../lib/billing-core";
import { billingErrorMessage, openBillingPortal, startCheckout, usePlanStatus } from "../lib/billing";
import { useLibrary } from "../lib/library";
import "../(saas)/saas.css";

const PATTERN_LIMIT: Record<string, number> = { completo: 9999 };

export default function AccountPage() {
  const session = useSession();
  const router = useRouter();
  const items = useLibrary();
  const planStatus = usePlanStatus();
  const [billingBusy, setBillingBusy] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);

  async function billingAction(fn: () => Promise<void>) {
    setBillingBusy(true);
    setBillingError(null);
    try {
      await fn();
    } catch (err) {
      setBillingBusy(false);
      setBillingError(billingErrorMessage(err));
      console.warn("cobro falló:", err);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      if (!localStorage.getItem("hilonova.session.v1")) router.replace("/auth/signin");
    }, 50);
    return () => clearTimeout(t);
  }, [router]);

  if (!session) {
    return (
      <div className="app-wrap">
        <SaasNav active="account" />
        <main className="app-main"><p className="loading">Cargando…</p></main>
      </div>
    );
  }

  const plan = findPlan(session.org.plan);
  const limit = PATTERN_LIMIT[plan.id] ?? 9999;
  const usagePct = Math.min(100, (items.length / limit) * 100);

  const initials = session.user.name
    .split(" ").map((p) => p[0] ?? "").join("").slice(0, 2).toUpperCase();

  return (
    <div className="app-wrap">
      <SaasNav active="account" />
      <main className="app-main">
        <section className="dash-hero">
          <div className="dash-hero-main">
            <span className="dash-hello-chip"><span className="dot" />Cuenta</span>
            <h1>Tu organización</h1>
            <p>Perfil, plan, equipo y facturación de {session.org.name}.</p>
          </div>
        </section>

        <div className="acc-grid-v2">
          {/* perfil */}
          <section className="acc-card acc-profile">
            <div className="acc-profile-head">
              <div className="acc-avatar-xl">{initials}</div>
              <div>
                <h2>{session.user.name}</h2>
                <p>{session.user.email}</p>
              </div>
            </div>
            <div className="acc-row"><span>Taller</span><span className="v">{session.org.name}</span></div>
            <div className="acc-row"><span>Miembro desde</span><span className="v">{new Date(session.since).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}</span></div>
            <div className="acc-row"><span>Rol</span><span className="v">Administrador</span></div>
          </section>

          {/* plan + uso */}
          <section className="acc-card acc-plan">
            <div className="acc-plan-head">
              <div>
                <span className="acc-plan-chip">{plan.name}</span>
                <h2 style={{ marginTop: 10 }}>
                  {`$${plan.priceMxn.toLocaleString("es-MX")} MXN`}
                  <small> {plan.pricePer}</small>
                </h2>
                <p>{plan.blurb}</p>
              </div>
              <Link href="/pricing" className="btn-primary-pill" style={{ padding: "9px 16px", fontSize: 13 }}>
                Cambiar plan
              </Link>
            </div>
            <div className="acc-usage">
              <div className="acc-usage-row">
                <span>Patrones</span>
                <span className="v">{items.length} / {limit === 9999 ? "∞" : limit}</span>
              </div>
              <div className="acc-bar"><i style={{ width: `${usagePct}%` }} /></div>
              <div className="acc-usage-row">
                <span>Asientos</span>
                <span className="v">1 de {session.org.seats} ocupado</span>
              </div>
              <div className="acc-bar"><i style={{ width: `${(1 / session.org.seats) * 100}%` }} /></div>
            </div>
          </section>

          {/* equipo */}
          <section className="acc-card">
            <h2>Equipo</h2>
            <p>Miembros con acceso a {session.org.name}.</p>
            <ul className="acc-team">
              <li>
                <div className="acc-avatar">{initials}</div>
                <div className="acc-member">
                  <b>{session.user.name}</b>
                  <small>{session.user.email} · Administrador</small>
                </div>
                <span className="acc-you-tag">tú</span>
              </li>
              {Array.from({ length: Math.max(0, session.org.seats - 1) }).slice(0, 2).map((_, i) => (
                <li key={i} className="dim">
                  <div className="acc-avatar empty">+</div>
                  <div className="acc-member">
                    <b>Asiento libre</b>
                    <small>Invita a un colaborador</small>
                  </div>
                  <button className="acc-invite">Invitar</button>
                </li>
              ))}
              {session.org.seats > 3 && (
                <li className="dim">
                  <small>+{session.org.seats - 3} asientos más disponibles</small>
                </li>
              )}
            </ul>
          </section>

          {/* facturación */}
          <section className="acc-card">
            <h2>Facturación</h2>
            {planStatus.state === "disabled" ? (
              <>
                <p>Método de pago y recibos.</p>
                <div className="acc-row"><span>Método</span><span className="v">—</span></div>
                <div className="acc-row"><span>Próximo cargo</span><span className="v">—</span></div>
                <p className="acc-foot-note">El cobro todavía no está activo.</p>
              </>
            ) : (
              <>
                <p>Tu suscripción y tus recibos.</p>
                <div className="acc-row">
                  <span>Estado</span>
                  <span className="v">
                    {planStatus.state === "loading" || planStatus.state === "unknown"
                      ? "Comprobando…"
                      : planStatus.via === "cortesia"
                        ? "Acceso activo"
                        : planStatus.subscription
                          ? (STATUS_LABEL[planStatus.subscription.status] ?? planStatus.subscription.status)
                          : "Sin plan"}
                  </span>
                </div>
                {planStatus.subscription?.currentPeriodEnd && planStatus.via === "suscripcion" && (
                  <div className="acc-row">
                    <span>{planStatus.subscription.cancelAtPeriodEnd ? "Termina el" : "Próximo cargo"}</span>
                    <span className="v">{new Date(planStatus.subscription.currentPeriodEnd).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}</span>
                  </div>
                )}
                {billingError && <div className="auth-error" role="alert"><span>{billingError}</span></div>}
                {planStatus.subscription ? (
                  <button className="btn-primary-pill" style={{ marginTop: 12 }} disabled={billingBusy} onClick={() => billingAction(openBillingPortal)}>
                    {billingBusy ? "Abriendo…" : "Administrar suscripción"}
                  </button>
                ) : planStatus.state === "inactive" ? (
                  <button className="btn-primary-pill" style={{ marginTop: 12 }} disabled={billingBusy} onClick={() => billingAction(startCheckout)}>
                    {billingBusy ? "Abriendo…" : "Activar plan"}
                  </button>
                ) : null}
                <p className="acc-foot-note">Desde «Administrar suscripción» puedes cambiar tu tarjeta, ver recibos y cancelar.</p>
              </>
            )}
          </section>

          {/* peligro */}
          <section className="acc-card acc-danger">
            <h2>Zona peligrosa</h2>
            <p>Acciones que no se deshacen.</p>
            <button
              className="btn-outline-danger"
              onClick={async () => {
                if (confirm("¿Cerrar sesión? Tus patrones quedan en tu cuenta y en este navegador.")) {
                  await signOut();
                  router.push("/");
                }
              }}
            >
              Cerrar sesión
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}
