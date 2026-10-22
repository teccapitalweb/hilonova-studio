// Siluetas vectoriales de las prendas para el panel de medidas.
// Cada medida va en un <g data-field="..."> para resaltarse cuando el campo
// correspondiente recibe focus o hover en el panel.
//
// Las siluetas son estilizadas (línea técnica), no realistas: lo importante
// es que el patronista reconozca dónde se toma cada medida.

"use client";

import type { BlockKind, BodyMeasurements } from "@hilonova/blocks";

interface Props {
  kind: BlockKind;
  activeField: keyof BodyMeasurements | null;
}

export function MeasurementSilhouette({ kind, activeField }: Props) {
  const body = { stroke: "var(--t-mut)", strokeWidth: 1.6, fill: "none", strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

  switch (kind) {
    case "pantalon-denim":
    case "pantalon-vestir":
    case "short":
    case "bermuda":
    case "pants-jogger":
      return <SilPantalon active={activeField} slim={kind === "pantalon-denim" || kind === "pants-jogger"} body={body} />;
    case "playera-basica":
    case "blusa-clasica":
    case "chamarra-mezclilla":
    case "sudadera-capucha":
    case "vestido-basico":
      return <SilPlayera active={activeField} body={body} />;
    case "falda-recta":
    case "falda-a":
      return <SilFalda active={activeField} body={body} />;
  }
}

type BodyStyle = React.SVGAttributes<SVGPathElement>;

function Meas({
  field, active, children,
}: {
  field: keyof BodyMeasurements;
  active: keyof BodyMeasurements | null;
  children: React.ReactNode;
}) {
  const is = active === field;
  return (
    <g className={`meas${is ? " is-active" : ""}`} data-field={field}>
      {children}
    </g>
  );
}

// ─── Pantalón ────────────────────────────────────────────────────────────────

function SilPantalon({ active, slim, body }: { active: keyof BodyMeasurements | null; slim: boolean; body: BodyStyle }) {
  // viewBox 200x260
  // silueta de pantalón vista frente, 2 piernas, cintura arriba
  const bajoX1 = slim ? 42 : 36;
  const bajoX2 = slim ? 84 : 78;
  const bajoX3 = slim ? 116 : 122;
  const bajoX4 = slim ? 158 : 164;
  return (
    <svg viewBox="0 0 200 260" className="silhouette">
      {/* cuerpo del pantalón */}
      <path
        {...body}
        d={`M 30 20 L 170 20 L 165 60 L 165 110 L ${bajoX4} 240 L ${bajoX3} 240 L 110 130 L 100 110 L 90 130 L ${bajoX2} 240 L ${bajoX1} 240 L 35 110 L 35 60 Z`}
      />
      {/* línea de cadera (interna) */}
      <path {...body} opacity={0.35} d="M 35 70 Q 100 85 165 70" />

      {/* ── medidas ── */}
      <Meas field="cintura" active={active}>
        <path d="M 30 12 L 170 12" />
        <path d="M 30 8 L 30 16 M 170 8 L 170 16" />
        <text x="100" y="7" textAnchor="middle">cintura</text>
      </Meas>
      <Meas field="cadera" active={active}>
        <path d="M 20 70 L 180 70" strokeDasharray="3 3" />
        <text x="180" y="66" textAnchor="end">cadera</text>
      </Meas>
      <Meas field="tiro" active={active}>
        <path d="M 182 20 L 182 125" />
        <path d="M 178 20 L 186 20 M 178 125 L 186 125" />
        <text x="192" y="75" textAnchor="start" transform="rotate(90 192 75)">tiro</text>
      </Meas>
      <Meas field="largo" active={active}>
        <path d="M 10 20 L 10 240" />
        <path d="M 6 20 L 14 20 M 6 240 L 14 240" />
        <text x="4" y="130" textAnchor="middle" transform="rotate(-90 4 130)">largo</text>
      </Meas>
      <Meas field="muslo" active={active}>
        <path d="M 35 110 L 90 130" opacity={0.6} />
        <path d="M 110 130 L 165 110" opacity={0.6} />
        <text x="60" y="128" textAnchor="middle">muslo</text>
      </Meas>
      <Meas field="bajo" active={active}>
        <path d={`M ${bajoX1} 248 L ${bajoX2} 248`} />
        <path d={`M ${bajoX1} 244 L ${bajoX1} 252 M ${bajoX2} 244 L ${bajoX2} 252`} />
        <text x={(bajoX1 + bajoX2) / 2} y="258" textAnchor="middle">bajo</text>
      </Meas>
    </svg>
  );
}

// ─── Playera básica ──────────────────────────────────────────────────────────

function SilPlayera({ active, body }: { active: keyof BodyMeasurements | null; body: BodyStyle }) {
  return (
    <svg viewBox="0 0 220 260" className="silhouette">
      {/* cuerpo de playera: hombros + mangas + torso + bajo */}
      <path
        {...body}
        d="M 60 30 L 30 50 L 20 90 L 40 95 L 50 65 L 50 230 L 170 230 L 170 65 L 180 95 L 200 90 L 190 50 L 160 30 L 140 42 Q 110 48 80 42 Z"
      />
      {/* escote cuello (frente, redondo) */}
      <path {...body} d="M 85 32 Q 110 55 135 32" />

      <Meas field="hombro" active={active}>
        <path d="M 60 22 L 160 22" />
        <path d="M 60 18 L 60 26 M 160 18 L 160 26" />
        <text x="110" y="17" textAnchor="middle">hombro</text>
      </Meas>
      <Meas field="cuello" active={active}>
        <path d="M 85 40 Q 110 60 135 40" opacity={0.6} />
        <text x="110" y="70" textAnchor="middle">cuello</text>
      </Meas>
      <Meas field="sisa" active={active}>
        <path d="M 50 65 L 50 110" />
        <path d="M 46 65 L 54 65 M 46 110 L 54 110" />
        <text x="40" y="90" textAnchor="middle" transform="rotate(-90 40 90)">sisa</text>
      </Meas>
      <Meas field="busto" active={active}>
        <path d="M 50 95 L 170 95" strokeDasharray="3 3" />
        <text x="170" y="92" textAnchor="end">busto</text>
      </Meas>
      <Meas field="cintura" active={active}>
        <path d="M 50 145 L 170 145" strokeDasharray="3 3" />
        <text x="170" y="142" textAnchor="end">cintura</text>
      </Meas>
      <Meas field="largoTorso" active={active}>
        <path d="M 210 30 L 210 145" />
        <path d="M 206 30 L 214 30 M 206 145 L 214 145" />
        <text x="217" y="90" textAnchor="middle" transform="rotate(90 217 90)">torso</text>
      </Meas>
      <Meas field="largoManga" active={active}>
        <path d="M 15 50 L 25 95" />
        <path d="M 11 50 L 19 50 M 21 95 L 29 95" />
        <text x="8" y="72" textAnchor="middle" transform="rotate(-78 8 72)">manga</text>
      </Meas>
    </svg>
  );
}

// ─── Falda recta ─────────────────────────────────────────────────────────────

function SilFalda({ active, body }: { active: keyof BodyMeasurements | null; body: BodyStyle }) {
  return (
    <svg viewBox="0 0 200 260" className="silhouette">
      {/* cuerpo de falda: cintura más estrecha, cadera, bajo recto */}
      <path
        {...body}
        d="M 60 20 L 140 20 L 150 70 L 160 230 L 40 230 L 50 70 Z"
      />
      {/* línea de cadera */}
      <path {...body} opacity={0.4} d="M 50 70 L 150 70" />

      <Meas field="cintura" active={active}>
        <path d="M 60 12 L 140 12" />
        <path d="M 60 8 L 60 16 M 140 8 L 140 16" />
        <text x="100" y="7" textAnchor="middle">cintura</text>
      </Meas>
      <Meas field="cadera" active={active}>
        <path d="M 40 78 L 160 78" strokeDasharray="3 3" />
        <text x="160" y="75" textAnchor="end">cadera</text>
      </Meas>
      <Meas field="largoFalda" active={active}>
        <path d="M 180 20 L 180 230" />
        <path d="M 176 20 L 184 20 M 176 230 L 184 230" />
        <text x="190" y="125" textAnchor="middle" transform="rotate(90 190 125)">largo</text>
      </Meas>
    </svg>
  );
}
