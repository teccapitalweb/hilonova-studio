// Vista "Trazo" — acomodo en tela + consumo. Fase 5.
// La tela se dibuja horizontal; las piezas (incluidas las copias) se
// posicionan con el nesting simple y se muestran en el canvas con el panel
// de métricas al lado derecho.

"use client";

import { useEffect, useRef } from "react";
import { useEditor } from "./store";
import { nestPieces, placedPath } from "./nesting";

export default function Trazo() {
  const doc = useEditor((s) => s.history.present);
  const fabricWidth = useEditor((s) => s.fabricWidth);
  const setFabricWidth = useEditor((s) => s.setFabricWidth);

  const result = nestPieces(doc.pieces, fabricWidth);

  return (
    <div className="st-trazo">
      <div className="st-trazo-stage">
        <TrazoCanvas result={result} fabricWidth={fabricWidth} />
      </div>
      <aside className="st-trazo-side">
        <div className="st-group" style={{ borderTop: 0 }}>
          <div className="st-label">Rollo de tela</div>
          <div className="st-m-field">
            <span>Ancho</span>
            <div className="st-m-ctrl">
              <input
                type="range" min={80} max={220} step={5}
                value={fabricWidth}
                onChange={(e) => setFabricWidth(Number(e.target.value))}
              />
              <input
                type="number" step={5}
                value={fabricWidth}
                onChange={(e) => setFabricWidth(Number(e.target.value))}
                className="st-m-num mono"
              />
              <span className="st-m-unit">cm</span>
            </div>
          </div>
        </div>

        <div className="st-group">
          <div className="st-label">Aprovechamiento</div>
          <Donut percent={result.utilization * 100} />
          <ul className="st-metric">
            <li><span>Piezas</span><b>{fmtArea(result.piecesArea)}</b></li>
            <li><span>Rollo usado</span><b>{fmtArea(result.rollArea)}</b></li>
            <li><span>Merma</span><b>{fmtArea(result.rollArea - result.piecesArea)}</b></li>
          </ul>
        </div>

        <div className="st-group">
          <div className="st-label">Consumo</div>
          <ul className="st-metric">
            <li><span>Largo del trazo</span><b>{(result.markerLength / 100).toFixed(2)} m</b></li>
            <li><span>Ancho útil</span><b>{(fabricWidth / 100).toFixed(2)} m</b></li>
            <li><span>Piezas colocadas</span><b>{result.placed.length}</b></li>
          </ul>
        </div>

        <div className="st-group">
          <div className="st-label">Por prenda</div>
          <ul className="st-metric">
            {(() => {
              const totalCopies = doc.pieces.reduce((s, p) => s + p.quantity, 0);
              const prendas = totalCopies > 0 ? Math.ceil(totalCopies / doc.pieces.length) : 1;
              const perPrenda = result.markerLength / Math.max(1, prendas);
              return (
                <>
                  <li><span>Consumo / prenda</span><b>{(perPrenda / 100).toFixed(2)} m</b></li>
                  <li><span>Costo estim.</span><b className="mono">—</b></li>
                </>
              );
            })()}
          </ul>
        </div>
      </aside>
    </div>
  );
}

// ─── canvas del rollo con las piezas acomodadas ──────────────────────────────

function TrazoCanvas({ result, fabricWidth }: { result: ReturnType<typeof nestPieces>; fabricWidth: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const W = rect.width, H = rect.height;

    // fondo (ambiente del taller)
    ctx.fillStyle = "#0a1324";
    ctx.fillRect(0, 0, W, H);

    // zoom para que el rollo quepa cómodo
    const pad = 36;
    const rollW = fabricWidth;
    const rollH = Math.max(result.markerLength, fabricWidth * 0.3);
    const zoomX = (W - pad * 2) / rollW;
    const zoomY = (H - pad * 2) / rollH;
    const zoom = Math.min(zoomX, zoomY);
    const offX = (W - rollW * zoom) / 2;
    const offY = (H - rollH * zoom) / 2;
    const toPx = (x: number, y: number) => ({ x: offX + x * zoom, y: offY + y * zoom });

    // rollo de tela (denim)
    const r0 = toPx(0, 0);
    const r1 = toPx(rollW, rollH);
    ctx.fillStyle = "#13263A";
    ctx.fillRect(r0.x, r0.y, r1.x - r0.x, r1.y - r0.y);
    // textura rayada
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < W; x += 10) { ctx.moveTo(r0.x + x, r0.y); ctx.lineTo(r0.x + x, r1.y); }
    ctx.stroke();

    // selvedge superior e inferior
    const sel = 10;
    ctx.fillStyle = "rgba(10,20,34,.9)";
    ctx.fillRect(r0.x, r0.y - sel, r1.x - r0.x, sel);
    ctx.fillRect(r0.x, r1.y, r1.x - r0.x, sel);

    // piezas
    for (const pp of result.placed) {
      const pts = placedPath(pp);
      if (pts.length < 2) continue;
      ctx.beginPath();
      pts.forEach((p, i) => {
        const q = toPx(p.x, p.y);
        if (i === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
      });
      ctx.closePath();
      ctx.fillStyle = "rgba(240,102,44,0.09)";
      ctx.fill();
      ctx.strokeStyle = "#EAF2FF";
      ctx.lineWidth = 1.6;
      ctx.lineJoin = "round";
      ctx.stroke();
      // etiqueta chica
      const anchor = toPx(pp.offset.x + 1, pp.offset.y + 4);
      ctx.fillStyle = "rgba(10,20,34,0.7)";
      ctx.fillRect(anchor.x - 2, anchor.y - 10, Math.max(44, pp.piece.name.length * 5.5), 14);
      ctx.fillStyle = "#C4CEE2";
      ctx.font = "10px 'IBM Plex Mono', monospace";
      ctx.fillText(`${pp.piece.name} #${pp.copy + 1}`, anchor.x, anchor.y);
    }

    // reglas
    ctx.fillStyle = "#7F8CA8";
    ctx.font = "10px 'IBM Plex Mono', monospace";
    ctx.fillText(`${fabricWidth} cm`, r0.x, r0.y - sel - 6);
    ctx.save();
    ctx.translate(r1.x + 12, (r0.y + r1.y) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${(result.markerLength / 100).toFixed(2)} m`, 0, 0);
    ctx.restore();
  }, [result, fabricWidth]);

  return <canvas ref={ref} className="st-canvas" />;
}

// ─── donut de aprovechamiento ────────────────────────────────────────────────

function Donut({ percent }: { percent: number }) {
  const p = Math.max(0, Math.min(100, percent));
  const r = 32;
  const C = 2 * Math.PI * r;
  return (
    <div className="st-donut">
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="6" />
        <circle
          cx="44" cy="44" r={r}
          fill="none"
          stroke="url(#g1)"
          strokeWidth="6"
          strokeDasharray={`${(C * p) / 100} ${C}`}
          strokeDashoffset={C / 4}
          strokeLinecap="round"
          transform="rotate(-90 44 44)"
        />
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FF7E45" />
            <stop offset="1" stopColor="#F0662C" />
          </linearGradient>
        </defs>
      </svg>
      <div className="st-donut-txt">
        <strong>{p.toFixed(0)}<small>%</small></strong>
        <span>aprovechado</span>
      </div>
    </div>
  );
}

const fmtArea = (cm2: number): string => (cm2 / 10000).toFixed(2) + " m²";
