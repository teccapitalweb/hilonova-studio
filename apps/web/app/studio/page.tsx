import Link from "next/link";

export const metadata = {
  title: "Editor — Hilonova Studio",
};

export default function StudioPage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "var(--void)",
        color: "var(--t)",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: "34rem" }}>
        <div
          className="mono"
          style={{
            color: "var(--teal-br)",
            fontSize: 13,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          Fase 1 · en construcción
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--t-hi)",
            fontSize: "clamp(28px,5vw,44px)",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            margin: "14px 0 0",
          }}
        >
          El editor de patrones llega aquí.
        </h1>
        <p style={{ color: "var(--t-mut)", marginTop: 14, lineHeight: 1.6 }}>
          Los cimientos ya están puestos. El motor de geometría (
          <span className="mono">@hilonova/geometry</span>) y el lienzo del editor se construyen en la
          Fase 1. Por ahora, el concepto visual aprobado es la referencia.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-block",
            marginTop: 26,
            border: "1px solid var(--hair-strong)",
            color: "var(--t)",
            padding: "10px 18px",
            borderRadius: "var(--rad-sm)",
            fontWeight: 600,
          }}
        >
          ← Volver al inicio
        </Link>
      </div>
    </main>
  );
}
