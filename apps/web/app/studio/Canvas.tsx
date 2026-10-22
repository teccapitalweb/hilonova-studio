// Lienzo real del editor. Dibuja el documento sobre <canvas> 2D y maneja
// las interacciones del usuario (pan, zoom, select, drag de nodos).
// Mantener este archivo "a la mano" y sin dependencias de UI pesadas.

"use client";

import { useEffect, useRef } from "react";
import {
  type Vec2,
  samplePath,
  snapTo,
  offsetPolyline,
  sub,
  normalize,
  mul,
  add,
} from "@hilonova/geometry";
import { useEditor, SIZE_COLORS } from "./store";
import { buildNest } from "./nest";

/** Umbral de pixeles para considerar que el click cayó sobre un nodo. */
const HIT_PX = 8;

export default function Canvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const dragState = useRef<null | {
    kind: "node" | "pan";
    startPx: Vec2;
    startDoc?: Vec2;
    pieceId?: string;
    nodeId?: string;
    panStart?: Vec2;
  }>(null);

  const draw = useEditor((s) => s);
  const {
    zoom, pan, gridStep, snapGrid, showSeam, showNest, activeSizes, measurements, tool,
    selectedPieceId, selectedNodeId, blockKind,
    setCursor, setPan, setZoom, selectNode, clearSelection, moveSelectedNode, toggleNotch,
  } = draw;
  const doc = useEditor((s) => s.history.present);

  // ─── render loop (dibuja en cada cambio relevante) ────────────────────────
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

    // fondo
    ctx.fillStyle = "#0a1324";
    ctx.fillRect(0, 0, W, H);

    // rejilla
    const step = gridStep * zoom;
    if (step >= 6) {
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      const ox = pan.x % step, oy = pan.y % step;
      for (let x = ox; x < W; x += step) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); }
      for (let y = oy; y < H; y += step) { ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); }
      ctx.stroke();
      // rejilla mayor cada 5 cm
      ctx.strokeStyle = "rgba(255,255,255,0.09)";
      ctx.beginPath();
      const big = step * 5;
      const bx = pan.x % big, by = pan.y % big;
      for (let x = bx; x < W; x += big) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); }
      for (let y = by; y < H; y += big) { ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); }
      ctx.stroke();
    }

    // ejes
    ctx.strokeStyle = "rgba(240,102,44,0.35)";
    ctx.beginPath();
    ctx.moveTo(pan.x + 0.5, 0); ctx.lineTo(pan.x + 0.5, H);
    ctx.moveTo(0, pan.y + 0.5); ctx.lineTo(W, pan.y + 0.5);
    ctx.stroke();

    // helpers mundo → pantalla
    const toPx = (p: Vec2) => ({ x: pan.x + p.x * zoom, y: pan.y + p.y * zoom });

    // nido de tallas (debajo del trazo principal)
    if (showNest) {
      const layers = buildNest(doc, measurements, doc.baseSize, activeSizes, blockKind);
      for (const layer of layers) {
        if (layer.size === doc.baseSize) continue; // la base la pintamos abajo con el trazo principal
        const color = SIZE_COLORS[layer.size] ?? "#8A91FF";
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.3;
        ctx.lineJoin = "round";
        for (const pts of layer.piecesPts) {
          if (pts.length < 2) continue;
          ctx.beginPath();
          pts.forEach((p, i) => {
            const q = toPx(p);
            if (i === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
          });
          ctx.closePath();
          ctx.stroke();
        }
      }
    }

    // piezas
    for (const piece of doc.pieces) {
      const pts = samplePath(piece, 20);
      if (pts.length < 2) continue;

      // margen de costura (línea punteada por fuera del contorno)
      if (showSeam && piece.closed && piece.seamAllowance > 0) {
        const seamPts = offsetPolyline(pts, piece.seamAllowance, true);
        ctx.beginPath();
        seamPts.forEach((p, i) => {
          const q = toPx(p);
          if (i === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
        });
        ctx.closePath();
        ctx.strokeStyle = "rgba(63,208,201,0.65)";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([5, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // relleno sutil
      ctx.beginPath();
      pts.forEach((p, i) => {
        const q = toPx(p);
        if (i === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
      });
      if (piece.closed) ctx.closePath();
      ctx.fillStyle = "rgba(31,191,183,0.05)";
      if (piece.closed) ctx.fill();
      // trazo
      ctx.strokeStyle = "#EAF2FF";
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.stroke();

      // hilo de tela
      const bb = pts.reduce(
        (b, p) => ({
          minX: Math.min(b.minX, p.x), minY: Math.min(b.minY, p.y),
          maxX: Math.max(b.maxX, p.x), maxY: Math.max(b.maxY, p.y),
        }),
        { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
      );
      const cx = (bb.minX + bb.maxX) / 2;
      const topY = bb.minY + (bb.maxY - bb.minY) * 0.1;
      const botY = bb.minY + (bb.maxY - bb.minY) * 0.9;
      const a = toPx({ x: cx, y: topY }), b = toPx({ x: cx, y: botY });
      ctx.strokeStyle = "#F0662C";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
      // flechas
      ctx.moveTo(a.x - 5, a.y + 9); ctx.lineTo(a.x, a.y); ctx.lineTo(a.x + 5, a.y + 9);
      ctx.moveTo(b.x - 5, b.y - 9); ctx.lineTo(b.x, b.y); ctx.lineTo(b.x + 5, b.y - 9);
      ctx.stroke();

      // nodos
      for (let i = 0; i < piece.nodes.length; i++) {
        const n = piece.nodes[i]!;
        const q = toPx(n.at);
        const isSelected = selectedPieceId === piece.id && selectedNodeId === n.id;

        // piquete: dibuja una línea perpendicular al contorno saliente
        if (n.notch) {
          const prev = piece.nodes[(i - 1 + piece.nodes.length) % piece.nodes.length]!;
          const next = piece.nodes[(i + 1) % piece.nodes.length]!;
          const tang = normalize(sub(next.at, prev.at));
          const norm = { x: -tang.y, y: tang.x };          // normal 2D a la izquierda
          const outDoc = add(n.at, mul(norm, piece.seamAllowance * 0.9));
          const outPx = toPx(outDoc);
          ctx.strokeStyle = "#F0662C";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(q.x, q.y); ctx.lineTo(outPx.x, outPx.y);
          ctx.stroke();
        }
        ctx.fillStyle = "#0a1324";
        ctx.strokeStyle = isSelected ? "#F0662C" : "#3FD0C9";
        ctx.lineWidth = isSelected ? 2.4 : 2;
        if (isSelected) {
          ctx.fillStyle = "#F0662C";
          ctx.fillRect(q.x - 5, q.y - 5, 10, 10);
          ctx.strokeStyle = "#0a1324";
          ctx.strokeRect(q.x - 5, q.y - 5, 10, 10);
          // manejadores bézier
          if (n.handleIn) {
            const h = toPx({ x: n.at.x + n.handleIn.x, y: n.at.y + n.handleIn.y });
            ctx.strokeStyle = "rgba(63,208,201,.7)";
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(h.x, h.y); ctx.stroke();
            ctx.fillStyle = "#3FD0C9"; ctx.beginPath();
            ctx.arc(h.x, h.y, 3, 0, Math.PI * 2); ctx.fill();
          }
          if (n.handleOut) {
            const h = toPx({ x: n.at.x + n.handleOut.x, y: n.at.y + n.handleOut.y });
            ctx.strokeStyle = "rgba(63,208,201,.7)";
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(h.x, h.y); ctx.stroke();
            ctx.fillStyle = "#3FD0C9"; ctx.beginPath();
            ctx.arc(h.x, h.y, 3, 0, Math.PI * 2); ctx.fill();
          }
        } else {
          ctx.beginPath();
          ctx.arc(q.x, q.y, 4, 0, Math.PI * 2);
          ctx.fill(); ctx.stroke();
        }
      }
    }
  }, [doc, zoom, pan, gridStep, selectedPieceId, selectedNodeId, showSeam, showNest, activeSizes, measurements, blockKind]);

  // ─── resize observer (redraw al cambiar tamaño) ──────────────────────────
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      // forzar re-render disparando una mínima actualización del store
      useEditor.setState((s) => ({ pan: { ...s.pan } }));
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // ─── interacciones ────────────────────────────────────────────────────────
  const screenToDoc = (clientX: number, clientY: number): Vec2 => {
    const r = ref.current!.getBoundingClientRect();
    const px = clientX - r.left - pan.x;
    const py = clientY - r.top - pan.y;
    return { x: px / zoom, y: py / zoom };
  };

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = ref.current!;
    canvas.setPointerCapture(e.pointerId);
    const pxStart = { x: e.clientX, y: e.clientY };

    // middle-click o alt → pan
    if (e.button === 1 || e.altKey || e.shiftKey) {
      dragState.current = { kind: "pan", startPx: pxStart, panStart: { ...pan } };
      return;
    }

    // hit test: nodo más cercano
    const r = canvas.getBoundingClientRect();
    const cx = e.clientX - r.left;
    const cy = e.clientY - r.top;
    let hitPiece: string | null = null;
    let hitNode: string | null = null;
    let bestD = HIT_PX;
    for (const p of doc.pieces) {
      for (const n of p.nodes) {
        const q = { x: pan.x + n.at.x * zoom, y: pan.y + n.at.y * zoom };
        const d = Math.hypot(q.x - cx, q.y - cy);
        if (d < bestD) { bestD = d; hitPiece = p.id; hitNode = n.id; }
      }
    }

    if (hitPiece && hitNode) {
      // herramienta "piquete": click sobre nodo lo toggleea
      if (tool === "notch") {
        toggleNotch(hitPiece, hitNode);
        return;
      }
      selectNode(hitPiece, hitNode);
      dragState.current = {
        kind: "node",
        startPx: pxStart,
        pieceId: hitPiece,
        nodeId: hitNode,
        startDoc: screenToDoc(e.clientX, e.clientY),
      };
    } else {
      clearSelection();
      dragState.current = { kind: "pan", startPx: pxStart, panStart: { ...pan } };
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    setCursor(screenToDoc(e.clientX, e.clientY));
    const d = dragState.current;
    if (!d) return;
    if (d.kind === "pan" && d.panStart) {
      setPan({
        x: d.panStart.x + (e.clientX - d.startPx.x),
        y: d.panStart.y + (e.clientY - d.startPx.y),
      });
    } else if (d.kind === "node" && d.pieceId && d.nodeId) {
      const to = screenToDoc(e.clientX, e.clientY);
      moveSelectedNode(snapGrid ? snapTo(to, gridStep * 0.5) : to);
    }
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    ref.current?.releasePointerCapture(e.pointerId);
    dragState.current = null;
  }

  function onWheel(e: React.WheelEvent<HTMLCanvasElement>) {
    // zoom hacia el cursor
    const r = ref.current!.getBoundingClientRect();
    const cx = e.clientX - r.left;
    const cy = e.clientY - r.top;
    const docX = (cx - pan.x) / zoom;
    const docY = (cy - pan.y) / zoom;
    const factor = Math.exp(-e.deltaY * 0.0012);
    const newZoom = Math.max(0.5, Math.min(60, zoom * factor));
    setZoom(newZoom);
    setPan({ x: cx - docX * newZoom, y: cy - docY * newZoom });
  }

  // atajos de teclado
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const z = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z";
      if (z && !e.shiftKey) { e.preventDefault(); useEditor.getState().undo(); }
      if (z && e.shiftKey)  { e.preventDefault(); useEditor.getState().redo(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault(); useEditor.getState().redo();
      }
      if (e.key === "Escape") useEditor.getState().clearSelection();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <canvas
      ref={ref}
      className="st-canvas"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={() => setCursor(null)}
      onWheel={onWheel}
      style={{ touchAction: "none" }}
    />
  );
}
