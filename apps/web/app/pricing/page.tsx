"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import SaasNav from "../(saas)/SaasNav";
import { PLANS, useSession, updatePlan, type PlanId } from "../lib/auth";
import "../(saas)/saas.css";

type Cycle = "monthly" | "yearly";

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
  const [cycle, setCycle] = useState<Cycle>("monthly");

  function choose(id: PlanId) {
    if (session) {
      if (confirm(`¿Cambiar a plan "${id}"?`)) {
        updatePlan(id);
        router.push("/account");
      }
    } else {
      router.push(`/auth/signup?plan=${id}`);
    }
  }

  function displayPrice(mxn: number | null): { amt: string; per: string } {
    if (mxn === null) return { amt: "A medida", per: "" };
    if (cycle === "yearly") {
      // 2 meses gratis = 10 meses al año; cobro anual
      const yearly = mxn * 10;
      const monthlyEq = Math.round(yearly / 12);
      return { amt: `$${monthlyEq.toLocaleString("es-MX")}`, per: "/ mes · facturado anual" };
    }
    return { amt: `$${mxn.toLocaleString("es-MX")}`, per: "/ mes" };
  }

  return (
    <div className="app-wrap">
      <SaasNav active="pricing" />
      <div className="price-wrap">
        <div className="price-head">
          <span className="price-eyebrow">
            <span className="dot" />
            Precios en MXN · facturación transparente
          </span>
          <h1>Un plan por cada tamaño de taller.</h1>
          <p>Empieza en minutos, crece cuando lo necesites. Sin instalación, sin contratos atados.</p>
          <div className="cycle-toggle" role="tablist" aria-label="Ciclo de facturación">
            <button
              role="tab"
              aria-selected={cycle === "monthly"}
              className={cycle === "monthly" ? "on" : ""}
              onClick={() => setCycle("monthly")}
            >
              Mensual
            </button>
            <button
              role="tab"
              aria-selected={cycle === "yearly"}
              className={cycle === "yearly" ? "on" : ""}
              onClick={() => setCycle("yearly")}
            >
              Anual <span className="save-chip">−2 meses</span>
            </button>
          </div>
        </div>

        <div className="price-grid">
          {PLANS.map((plan) => {
            const isCurrent = session?.org.plan === plan.id;
            const p = displayPrice(plan.priceMxn);
            return (
              <article key={plan.id} className={`price-card${plan.popular ? " pop" : ""}`}>
                {plan.popular && <span className="pbadge">El más usado</span>}
                <div className="pn">{plan.name}</div>
                <p className="pd">{plan.blurb}</p>
                <div className="ppri">
                  <span className={`amt mono ${plan.priceMxn === null ? "sm" : ""}`}>{p.amt}</span>
                  <span className="per">{p.per}</span>
                </div>
                <div className="pnote">
                  {plan.priceMxn !== null
                    ? (cycle === "yearly" ? "Equivale a 2 meses gratis" : "MXN · mensual")
                    : "Hablemos de tu operación"}
                </div>
                <ul className="pfeats">
                  {plan.features.map((f) => (
                    <li key={f}><Check /> {f}</li>
                  ))}
                </ul>
                {isCurrent ? (
                  <span className="pcta current">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    Plan actual
                  </span>
                ) : (
                  <button className="pcta" onClick={() => choose(plan.id)}>
                    {session ? `Cambiar a ${plan.name}` : `Elegir ${plan.name}`}
                  </button>
                )}
              </article>
            );
          })}
        </div>

        {/* tabla comparativa */}
        <section className="price-compare">
          <h2>Comparación detallada</h2>
          <div className="compare-wrap">
            <table className="compare-table">
              <thead>
                <tr>
                  <th>Función</th>
                  <th>Taller</th>
                  <th className="hl">Maquila</th>
                  <th>Industrial</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td>{renderCell(row.taller)}</td>
                    <td className="hl">{renderCell(row.maquila)}</td>
                    <td>{renderCell(row.industrial)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ corto */}
        <section className="price-faq">
          <h2>Dudas rápidas</h2>
          <div className="faq-grid">
            <div><h4>¿Puedo cambiar de plan después?</h4><p>Sí, en cualquier momento desde Cuenta → Cambiar plan.</p></div>
            <div><h4>¿Hay prueba gratis?</h4><p>Puedes crear tu cuenta y hacer un patrón de principio a fin sin pagar nada.</p></div>
            <div><h4>¿Factura con IVA?</h4><p>Sí, para planes anuales emitimos CFDI con IVA desglosado.</p></div>
            <div><h4>¿Soporte en español?</h4><p>Siempre. Por WhatsApp en Maquila e Industrial.</p></div>
          </div>
        </section>

        <p className="price-foot">
          ¿Preguntas? <Link href="/account">Hablemos</Link>.
        </p>
      </div>
    </div>
  );
}

function renderCell(v: boolean | string): React.ReactNode {
  if (v === true)
    return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  if (v === false) return <span className="cmp-dash">—</span>;
  return <span className="mono">{v}</span>;
}

const COMPARE: Array<{ label: string; taller: boolean | string; maquila: boolean | string; industrial: boolean | string }> = [
  { label: "Usuarios", taller: "2", maquila: "8", industrial: "ilimitados" },
  { label: "Patrones", taller: "50", maquila: "200", industrial: "ilimitados" },
  { label: "Bloques paramétricos", taller: true, maquila: true, industrial: true },
  { label: "Nido de tallas", taller: true, maquila: true, industrial: true },
  { label: "Export PDF mosaico", taller: true, maquila: true, industrial: true },
  { label: "Export DXF-AAMA", taller: false, maquila: true, industrial: true },
  { label: "Tech Pack PDF", taller: false, maquila: true, industrial: true },
  { label: "Trazo y consumo", taller: false, maquila: true, industrial: true },
  { label: "SSO corporativo", taller: false, maquila: false, industrial: true },
  { label: "API", taller: false, maquila: false, industrial: true },
  { label: "Soporte", taller: "comunidad", maquila: "WhatsApp", industrial: "prioritario" },
];
