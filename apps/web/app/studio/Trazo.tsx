// Vista "Trazo" — acomodo en tela + consumo por talla.
// La tela se dibuja horizontal; las piezas (incluidas las copias) se acomodan
// siguiendo su contorno real. Se puede ver el trazo de cada talla o un trazo
// combinado con una prenda de cada talla.

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useEditor, SIZE_COLORS } from "./store";
import { nestBySize, placedPath, type NestingResult, type PlacedPiece } from "./nesting";
import { NumInput } from "./fields";
import { materials } from "../lib/materials";

const ALL = "all";
const PIECE_COLORS = ["#7FB3FF", "#8FD99B", "#C79BFF", "#F2C879", "#FF9B8A", "#6FD3D0", "#E58BC4", "#B7C4DD"];

export default function Trazo() {
  const doc = useEditor((s) => s.history.present);
  const fabricWidth = useEditor((s) => s.fabricWidth);
  const setFabricWidth = useEditor((s) => s.setFabricWidth);
  const fabricPrice = useEditor((s) => s.fabricPrice);
  const setFabricPrice = useEditor((s) => s.setFabricPrice);
  const [sel, setSel] = useState<string>(doc.baseSize);
  const fabrics = materials.useAll().filter((m) => m.kind !== "avio");
  const activeFabric = fabrics.find((m) => m.widthCm === fabricWidth && m.price === fabricPrice);

  const sizes = doc.sizes;
  const current = sel === ALL || sizes.includes(sel) ? sel : doc.baseSize;

  // un trazo por talla + uno combinado (una prenda de cada talla)
  const { perSize, combined } = useMemo(() => nestBySize(doc, fabricWidth), [doc, fabricWidth]);

  const result: NestingResult =
    current === ALL ? combined : perSize.find((r) => r.size === current)?.result ?? combined;
  const garments = current === ALL ? Math.max(1, sizes.length) : 1;
  const perGarmentM = result.markerLength / garments / 100;
  const maxLen = Math.max(1, ...perSize.map((r) => r.result.markerLength));

  return (
    <div className="st-trazo">
      <div className="st-trazo-stage">
        <div className="st-trazo-tabs" role="tablist" aria-label="Talla del trazo">
          {sizes.map((s) => (
            <button
              key={s}
              role="tab"
              aria-selected={current === s}
              className={current === s ? "on" : ""}
              style={{ ["--size-color" as string]: SIZE_COLORS[s] ?? "#8A91FF" }}
              onClick={() => setSel(s)}
            >
              {s}
            </button>
          ))}
          <button
            role="tab"
            aria-selected={current === ALL}
            className={current === ALL ? "on" : ""}
            onClick={() => setSel(ALL)}
            title="Una prenda de cada talla en el mismo trazo"
          >
            Combinado
          </button>
        </div>
        <TrazoCanvas result={result} fabricWidth={fabricWidth} bySize={current === ALL} />
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
          <div className="st-field" style={{ marginTop: 10 }}>
            <span>Material</span>
            <select
              className="st-input"
              style={{ width: 150, textAlign: "left" }}
              value={activeFabric?.id ?? ""}
              onChange={(e) => {
                const m = fabrics.find((x) => x.id === e.target.value);
                if (m) { setFabricWidth(m.widthCm); setFabricPrice(m.price); }
              }}
            >
              <option value="">Personalizado</option>
              {fabrics.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="st-field" style={{ marginTop: 10 }}>
            <span>Precio por metro</span>
            <NumInput value={fabricPrice} step={1} min={0} unit="MXN" onCommit={setFabricPrice} width={64} />
          </div>
        </div>

        <div className="st-group">
          <div className="st-label">
            Aprovechamiento · {current === ALL ? "todas las tallas" : `talla ${current}`}
          </div>
          <Donut percent={result.utilization * 100} />
          <ul className="st-metric">
            <li><span>Piezas (con costura)</span><b>{fmtArea(result.piecesArea)}</b></li>
            <li><span>Rollo usado</span><b>{fmtArea(result.rollArea)}</b></li>
            <li><span>Merma</span><b>{fmtArea(result.rollArea - result.piecesArea)}</b></li>
          </ul>
          {result.oversize.length > 0 && (
            <p className="st-warn">
              No caben a lo ancho de la tela: {result.oversize.join(", ")}. Aumenta el ancho del rollo.
            </p>
          )}
        </div>

        <div className="st-group">
          <div className="st-label">Consumo por talla</div>
          <div className="st-bars">
            {perSize.map(({ size, result: r }) => (
              <button
                key={size}
                className={`st-bar-row${current === size ? " on" : ""}`}
                onClick={() => setSel(size)}
              >
                <span className="st-bar-size">{size}</span>
                <span className="st-bar-track">
                  <i
                    style={{
                      width: `${(r.markerLength / maxLen) * 100}%`,
                      background: SIZE_COLORS[size] ?? "#8A91FF",
                    }}
                  />
                </span>
                <span className="st-bar-val mono">{(r.markerLength / 100).toFixed(2)} m</span>
                <span className="st-bar-pct mono">{(r.utilization * 100).toFixed(0)}%</span>
              </button>
            ))}
          </div>
        </div>

        <div className="st-group">
          <div className="st-label">Consumo</div>
          <ul className="st-metric">
            <li><span>Largo del trazo</span><b>{(result.markerLength / 100).toFixed(2)} m</b></li>
            <li><span>Ancho útil</span><b>{(fabricWidth / 100).toFixed(2)} m</b></li>
            <li><span>Piezas colocadas</span><b>{result.placed.length}</b></li>
            <li><span>Consumo / prenda</span><b>{perGarmentM.toFixed(2)} m</b></li>
            <li>
              <span>Costo de tela / prenda</span>
              <b className="mono">{fabricPrice > 0 ? `$${(perGarmentM * fabricPrice).toFixed(2)}` : "—"}</b>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

// ─── canvas del rollo con las piezas acomodadas ──────────────────────────────

function TrazoCanvas({
  result, fabricWidth, bySize,
}: { result: NestingResult; fabricWidth: number; bySize: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const W = rect.width, H = rect.height;

      ctx.fillStyle = "#0a1324";
      ctx.fillRect(0, 0, W, H);

      // zoom para que el rollo quepa cómodo
      const padX = 36, padTop = 56, padBottom = 28;
      const rollW = fabricWidth;
      const rollH = Math.max(result.markerLength, fabricWidth * 0.3);
      const zoom = Math.min((W - padX * 2) / rollW, (H - padTop - padBottom) / rollH);
      const offX = (W - rollW * zoom) / 2;
      const offY = padTop + (H - padTop - padBottom - rollH * zoom) / 2;
      const toPx = (x: number, y: number) => ({ x: offX + x * zoom, y: offY + y * zoom });

      const r0 = toPx(0, 0);
      const r1 = toPx(rollW, rollH);
      ctx.fillStyle = "#13263A";
      ctx.fillRect(r0.x, r0.y, r1.x - r0.x, r1.y - r0.y);
      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < W; x += 10) { ctx.moveTo(r0.x + x, r0.y); ctx.lineTo(r0.x + x, r1.y); }
      ctx.stroke();

      // orillos
      const sel = 8;
      ctx.fillStyle = "rgba(10,20,34,.9)";
      ctx.fillRect(r0.x, r0.y - sel, r1.x - r0.x, sel);
      ctx.fillRect(r0.x, r1.y, r1.x - r0.x, sel);

      // largo usado
      const used = toPx(0, result.markerLength);
      ctx.strokeStyle = "rgba(240,102,44,.7)";
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(r0.x, used.y); ctx.lineTo(r1.x, used.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // piezas
      const nameIndex = new Map<string, number>();
      const colorOf = (pp: PlacedPiece): string => {
        if (bySize && pp.size) return SIZE_COLORS[pp.size] ?? "#8A91FF";
        if (!nameIndex.has(pp.piece.name)) nameIndex.set(pp.piece.name, nameIndex.size);
        return PIECE_COLORS[nameIndex.get(pp.piece.name)! % PIECE_COLORS.length]!;
      };
      for (const pp of result.placed) {
        const color = colorOf(pp);
        const path = (pts: ReadonlyArray<{ x: number; y: number }>) => {
          ctx.beginPath();
          pts.forEach((p, i) => {
            const q = toPx(p.x, p.y);
            if (i === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
          });
          ctx.closePath();
        };
        path(placedPath(pp));
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = color;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.4;
        ctx.lineJoin = "round";
        ctx.stroke();
        // línea de la pieza (sin margen de costura)
        path(pp.inner);
        ctx.strokeStyle = "rgba(234,242,255,.55)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        // etiqueta
        if (pp.width * zoom > 46 && pp.height * zoom > 26) {
          const label = `${pp.piece.name}${bySize && pp.size ? ` ${pp.size}` : ""}`;
          const c = toPx(pp.offset.x + pp.width / 2, pp.offset.y + pp.height / 2);
          ctx.fillStyle = "rgba(10,20,34,0.72)";
          const tw = Math.min(pp.width * zoom - 6, label.length * 5.6 + 8);
          ctx.fillRect(c.x - tw / 2, c.y - 8, tw, 15);
          ctx.fillStyle = "#EAF2FF";
          ctx.font = "10px 'IBM Plex Mono', monospace";
          ctx.textAlign = "center";
          ctx.fillText(label.slice(0, Math.floor(tw / 5.6)), c.x, c.y + 3);
          ctx.textAlign = "left";
        }
      }

      // reglas
      ctx.fillStyle = "#7F8CA8";
      ctx.font = "10px 'IBM Plex Mono', monospace";
      ctx.fillText(`${fabricWidth} cm`, r0.x, r0.y - sel - 6);
      ctx.save();
      ctx.translate(r1.x + 14, (r0.y + r1.y) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.fillText(`${(result.markerLength / 100).toFixed(2)} m`, 0, 0);
      ctx.restore();
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [result, fabricWidth, bySize]);

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
