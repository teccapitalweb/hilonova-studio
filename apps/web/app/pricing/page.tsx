"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import SaasNav from "../(saas)/SaasNav";
import { PLANS, useSession, updatePlan, type PlanId } from "../lib/auth";
import { EXPORT_KINDS, STUDENT_OFFER } from "../lib/oferta";
import "../(saas)/saas.css";

function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function PricingPage() {
  const session = useSession();
  const router = useRouter();

  function choose(id: PlanId) {
    if (session) {
      updatePlan(id);
      router.push("/account");
    } else {
      router.push(`/auth/signup?plan=${id}`);
    }
  }

  return (
    <div className="app-wrap">
      <SaasNav active="pricing" />
      <div className="price-wrap">
        <div className="price-head">
          <span className="price-eyebrow">
            <span className="dot" />
            Precio en MXN · un solo plan
          </span>
          <h1>Un plan, un precio.</h1>
          <p>Todo el programa incluido. Sin instalación, sin contratos atados.</p>
          <p className="price-notice">
            Propuesta en revisión: el cobro todavía no está activo. Elegir el plan solo marca tu cuenta de prueba.
            El precio es más IVA.
          </p>
        </div>

        <div className="price-grid" style={{ gridTemplateColumns: "minmax(0, 420px)", justifyContent: "center" }}>
          {PLANS.map((plan) => {
            const isCurrent = session?.org.plan === plan.id;
            return (
              <article key={plan.id} className="price-card pop">
                <div className="pn">{plan.name}</div>
                <p className="pd">{plan.blurb}</p>
                <div className="ppri">
                  <span className="amt mono">${plan.priceMxn.toLocaleString("es-MX")}</span>
                  <span className="per">{plan.pricePer}</span>
                </div>
                <div className="pnote">MXN · mensual · más IVA</div>
                <ul className="pmods">
                  {plan.modules.map((m) => (
                    <li key={m.title}>
                      <b>{m.title}</b>
                      <span>{m.items}</span>
                    </li>
                  ))}
                </ul>
                <div className="pextras"><Check /> {plan.extras}</div>
                <div className="pstudent">
                  Alumnos del curso: {STUDENT_OFFER.freeMonths} mes gratis con {STUDENT_OFFER.exports} exportaciones
                </div>
                {isCurrent ? (
                  <span className="pcta current">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    Plan actual
                  </span>
                ) : (
                  <button className="pcta" onClick={() => choose(plan.id)}>
                    {session ? `Elegir ${plan.name}` : `Crear cuenta con ${plan.name}`}
                  </button>
                )}
              </article>
            );
          })}
        </div>

        <section className="price-faq" style={{ marginTop: 28 }}>
          <h2>¿Tomaste el curso?</h2>
          <div className="faq-grid">
            <div>
              <h4>Un mes gratis</h4>
              <p>
                Al terminar el curso recibes un cupón. Con él tienes {STUDENT_OFFER.freeMonths} mes con el programa
                completo, sin pagar.
              </p>
            </div>
            <div>
              <h4>{STUDENT_OFFER.exports} exportaciones</h4>
              <p>
                Durante ese mes lo puedes usar todo, y puedes sacar {STUDENT_OFFER.exports} exportaciones en total
                ({EXPORT_KINDS.join(", ")}). Tu respaldo no cuenta. Para seguir usando el programa después del mes,
                se paga el plan.
              </p>
            </div>
            <div>
              <h4>Un solo uso, {STUDENT_OFFER.redeemHours} horas</h4>
              <p>
                El cupón se canjea una sola vez y hay que hacerlo dentro de las {STUDENT_OFFER.redeemHours} horas
                desde que lo recibes; si vence, se pide uno nuevo en el curso.
              </p>
            </div>
            <div>
              <h4>Para todos los demás</h4>
              <p>El plan cuesta ${PLANS[0]!.priceMxn.toLocaleString("es-MX")} al mes desde el primer día, sin mes gratis.</p>
            </div>
          </div>
        </section>

        <section className="price-faq">
          <h2>Dudas rápidas</h2>
          <div className="faq-grid">
            <div><h4>¿El precio lleva IVA?</h4><p>El precio es más IVA. La factura (CFDI) se define antes de activar el cobro.</p></div>
            <div><h4>¿Qué es el DXF estilo AAMA?</h4><p>Un formato pensado para abrirse en Gerber y Lectra. Todavía está en validación.</p></div>
            <div><h4>¿Soporte en español?</h4><p>Siempre: ayuda dentro de la app y soporte por correo.</p></div>
            <div><h4>¿Puedo trabajar en equipo?</h4><p>El plan es para una persona. Las cuentas de equipo con roles llegan después.</p></div>
          </div>
        </section>

        <p className="price-foot">
          ¿Preguntas? <Link href="/account">Hablemos</Link>.
        </p>
      </div>
    </div>
  );
}
