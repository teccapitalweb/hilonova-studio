// Vista "Reportes": resumen del proyecto con consumo y costo de tela por talla,
// y el listado de piezas. Se descarga como CSV o se imprime.

"use client";

import { useMemo } from "react";
import { area, samplePath } from "@hilonova/geometry";
import { useEditor } from "./store";
import { nestBySize } from "./nesting";

const m2 = (cm2: number) => cm2 / 10000;

function perimeter(pts: ReadonlyArray<{ x: number; y: number }>): number {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % pts.length]!;
    s += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return s;
}

const csvCell = (v: string | number): string => {
  const s = String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export default function Reportes() {
  const doc = useEditor((s) => s.history.present);
  const fabricWidth = useEditor((s) => s.fabricWidth);
  const fabricPrice = useEditor((s) => s.fabricPrice);
  const { perSize, combined } = useMemo(() => nestBySize(doc, fabricWidth), [doc, fabricWidth]);
  const tp = doc.techPack ?? {};

  const pieces = doc.pieces
    .filter((p) => p.closed)
    .map((p) => {
      const line = samplePath(p, 24);
      return {
        name: p.name,
        qty: p.quantity,
        fabric: p.fabric ?? "",
        areaCm2: area(p),
        perimeter: perimeter(line),
        seam: p.seamAllowance,
      };
    });
  const lines = doc.pieces.filter((p) => !p.closed).length;
  const perGarmentCombined = combined.markerLength / Math.max(1, doc.sizes.length) / 100;

  function downloadCsv() {
    const rows: Array<Array<string | number>> = [
      ["Proyecto", doc.name],
      ["Referencia", tp.ref ?? ""],
      ["Cliente", tp.client ?? ""],
      ["Ancho de tela (cm)", fabricWidth],
      ["Precio por metro (MXN)", fabricPrice],
      [],
      ["Talla", "Largo del trazo (m)", "Aprovechamiento (%)", "Consumo por prenda (m)", "Costo de tela por prenda (MXN)"],
      ...perSize.map(({ size, result: r }) => [
        size,
        (r.markerLength / 100).toFixed(2),
        (r.utilization * 100).toFixed(1),
        (r.markerLength / 100).toFixed(2),
        fabricPrice > 0 ? ((r.markerLength / 100) * fabricPrice).toFixed(2) : "",
      ]),
      [
        "Combinado",
        (combined.markerLength / 100).toFixed(2),
        (combined.utilization * 100).toFixed(1),
        perGarmentCombined.toFixed(2),
        fabricPrice > 0 ? (perGarmentCombined * fabricPrice).toFixed(2) : "",
      ],
      [],
      ["Pieza", "Cantidad", "Tela", "Área con costura (cm²)", "Perímetro (cm)", "Margen de costura (cm)"],
      ...pieces.map((p) => [p.name, p.qty, p.fabric, p.areaCm2.toFixed(1), p.perimeter.toFixed(1), p.seam]),
    ];
    const csv = "﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.name.toLowerCase().replace(/[^\w-]+/g, "-") || "reporte"}-reporte.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 100);
  }

  return (
    <div className="st-page st-report">
      <header className="st-page-h">
        <div>
          <h1>Reportes</h1>
          <p>{doc.name} · {tp.ref ? `ref. ${tp.ref} · ` : ""}tela de {fabricWidth} cm{fabricPrice > 0 ? ` a $${fabricPrice}/m` : ""}</p>
        </div>
        <div className="st-page-actions st-noprint">
          <button className="st-act" onClick={() => window.print()}>Imprimir</button>
          <button className="st-btn-primary" onClick={downloadCsv}>Descargar CSV</button>
        </div>
      </header>

      <section className="st-table-card">
        <h2>Consumo y costo de tela por talla</h2>
        <table className="st-data-table">
          <thead>
            <tr>
              <th>Talla</th><th>Largo del trazo</th><th>Aprovechamiento</th>
              <th>Merma</th><th>Consumo / prenda</th><th>Costo de tela / prenda</th>
            </tr>
          </thead>
          <tbody>
            {perSize.map(({ size, result: r }) => (
              <tr key={size}>
                <td><b>{size}{size === doc.baseSize ? " · base" : ""}</b></td>
                <td className="mono">{(r.markerLength / 100).toFixed(2)} m</td>
                <td className="mono">{(r.utilization * 100).toFixed(0)} %</td>
                <td className="mono">{m2(r.rollArea - r.piecesArea).toFixed(2)} m²</td>
                <td className="mono">{(r.markerLength / 100).toFixed(2)} m</td>
                <td className="mono">{fabricPrice > 0 ? `$${((r.markerLength / 100) * fabricPrice).toFixed(2)}` : "—"}</td>
              </tr>
            ))}
            <tr className="st-total">
              <td><b>Combinado ({doc.sizes.length} prendas)</b></td>
              <td className="mono">{(combined.markerLength / 100).toFixed(2)} m</td>
              <td className="mono">{(combined.utilization * 100).toFixed(0)} %</td>
              <td className="mono">{m2(combined.rollArea - combined.piecesArea).toFixed(2)} m²</td>
              <td className="mono">{perGarmentCombined.toFixed(2)} m</td>
              <td className="mono">{fabricPrice > 0 ? `$${(perGarmentCombined * fabricPrice).toFixed(2)}` : "—"}</td>
            </tr>
          </tbody>
        </table>
        {fabricPrice <= 0 && (
          <p className="st-hint">Fija el precio de la tela en Materiales o en el Trazo para ver el costo.</p>
        )}
      </section>

      <section className="st-table-card">
        <h2>Piezas</h2>
        <table className="st-data-table">
          <thead>
            <tr><th>Pieza</th><th>Cant.</th><th>Tela</th><th>Área con costura</th><th>Perímetro</th><th>Costura</th></tr>
          </thead>
          <tbody>
            {pieces.map((p, i) => (
              <tr key={i}>
                <td>{p.name}</td>
                <td className="mono">×{p.qty}</td>
                <td>{p.fabric || "—"}</td>
                <td className="mono">{p.areaCm2.toFixed(0)} cm²</td>
                <td className="mono">{p.perimeter.toFixed(0)} cm</td>
                <td className="mono">{p.seam} cm</td>
              </tr>
            ))}
            {pieces.length === 0 && <tr><td colSpan={6} className="st-empty-cell">Sin piezas cerradas.</td></tr>}
          </tbody>
        </table>
        {lines > 0 && <p className="st-hint">{lines} línea(s) interna(s) no se cortan y no entran al consumo.</p>}
      </section>
    </div>
  );
}
