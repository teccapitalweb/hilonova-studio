// Miniaturas SVG de piezas y patrones completos (proyectos, librería, variantes).

import { bounds, samplePath, type Piece } from "@hilonova/geometry";

const pathOf = (piece: Piece, samples = 14): string => {
  const pts = samplePath(piece, samples);
  return pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ") + (piece.closed ? " Z" : "");
};

export function PiecesThumb({
  pieces, stroke = "#EAF2FF", className = "st-thumb", fill = "rgba(63,208,201,.10)",
}: {
  pieces: readonly Piece[];
  stroke?: string;
  className?: string;
  fill?: string;
}) {
  if (pieces.length === 0) {
    return <svg viewBox="0 0 100 60" className={className} aria-hidden="true" />;
  }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pieces) {
    const b = bounds(p);
    minX = Math.min(minX, b.minX); minY = Math.min(minY, b.minY);
    maxX = Math.max(maxX, b.maxX); maxY = Math.max(maxY, b.maxY);
  }
  const w = Math.max(1, maxX - minX);
  const h = Math.max(1, maxY - minY);
  const pad = Math.max(w, h) * 0.06;
  return (
    <svg
      viewBox={`${minX - pad} ${minY - pad} ${w + pad * 2} ${h + pad * 2}`}
      className={className}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      {pieces.map((p) => (
        <path
          key={p.id}
          d={pathOf(p)}
          fill={p.closed ? fill : "none"}
          stroke={stroke}
          strokeWidth={Math.max(w, h) * 0.008}
          strokeLinejoin="round"
          strokeDasharray={p.closed ? undefined : `${Math.max(w, h) * 0.02}`}
        />
      ))}
    </svg>
  );
}
