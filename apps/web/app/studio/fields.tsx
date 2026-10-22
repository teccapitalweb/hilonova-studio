// Campos de entrada compartidos por los paneles del studio. Confirman al salir
// del campo o con Enter, para no llenar el historial con una entrada por tecla.

"use client";

import { useEffect, useState } from "react";

export function NumInput({
  value, onCommit, step = 0.1, min, max, unit, width,
}: {
  value: number;
  onCommit: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
  width?: number;
}) {
  const shown = Number.isFinite(value) ? String(Math.round(value * 100) / 100) : "";
  const [text, setText] = useState(shown);
  useEffect(() => setText(shown), [shown]);
  function commit() {
    let v = parseFloat(text.replace(",", "."));
    if (!Number.isFinite(v)) { setText(shown); return; }
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    if (v !== value) onCommit(v);
    else setText(shown);
  }
  return (
    <span className="st-input-wrap">
      <input
        className="st-input mono"
        type="number"
        step={step}
        value={text}
        style={width ? { width } : undefined}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      />
      {unit && <em>{unit}</em>}
    </span>
  );
}

export function TextInput({ value, onCommit }: { value: string; onCommit: (v: string) => void }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return (
    <input
      className="st-input st-input-text"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => { if (text !== value) onCommit(text); }}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
    />
  );
}
