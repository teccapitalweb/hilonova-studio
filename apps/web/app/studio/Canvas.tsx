// Lienzo real del editor. Dibuja el documento sobre <canvas> 2D y maneja
// las interacciones del usuario: pan, zoom, selección, arrastre de nodos,
// handles y piezas, y las herramientas de dibujo (línea, curva, rectángulo,
// círculo, agregar nodo, medir). Mantener este archivo "a la mano" y sin
// dependencias de UI pesadas.

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
  dist,
  nearestSegment,
  pointInPiece,
  smoothNodesFromPoints,
  emptyPiece,
} from "@hilonova/geometry";
import { useEditor, SIZE_COLORS, type Tool } from "./store";
import { buildNest } from "./nest";

/** Umbral de pixeles para considerar que el click cayó sobre un nodo. */
const HIT_PX = 8;
/** Distancia (px) a un contorno para insertar un nodo con la herramienta "agregar nodo". */
const EDGE_PX = 10;

const TOOL_KEYS: Record<string, Tool> = {
  v: "select", h: "pan", n: "notch", l: "line", c: "curve",
  r: "rect", o: "circle", a: "addnode", m: "measure",
};

type Drag =
  | { kind: "pan"; startPx: Vec2; panStart: Vec2 }
  | { kind: "node"; startPx: Vec2; moved: boolean }
  | { kind: "handle"; which: "in" | "out"; startPx: Vec2; moved: boolean }
  | { kind: "piece"; startPx: Vec2; last: Vec2; moved: boolean }
  | { kind: "rect" | "circle" | "measure"; startPx: Vec2; origin: Vec2 };

export default function Canvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const dragState = useRef<Drag | null>(null);

  const draw = useEditor((s) => s);
  const {
    zoom, pan, gridStep, snapGrid, showSeam, showNest, activeSizes, measurements, tool,
    selectedPieceId, selectedNodeId, blockKind, draft, cursor,
    setCursor, setPan, setZoom, selectNode, selectPiece, clearSelection, toggleNotch,
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
      const isSelPiece = selectedPieceId === piece.id;

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
      ctx.fillStyle = isSelPiece ? "rgba(240,102,44,0.10)" : "rgba(31,191,183,0.05)";
      if (piece.closed) ctx.fill();
      // trazo (las líneas internas, abiertas, van punteadas)
      ctx.strokeStyle = piece.closed ? (isSelPiece ? "#FFD9C7" : "#EAF2FF") : "#E0A33C";
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      if (!piece.closed) ctx.setLineDash([8, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      // hilo de tela (solo piezas cerradas)
      if (piece.closed) {
        const bb = pts.reduce(
          (b, p) => ({
            minX: Math.min(b.minX, p.x), minY: Math.min(b.minY, p.y),
            maxX: Math.max(b.maxX, p.x), maxY: Math.max(b.maxY, p.y),
          }),
          { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
        );
        const cx = (bb.minX + bb.maxX) / 2;
        const cy = (bb.minY + bb.maxY) / 2;
        const half = (bb.maxY - bb.minY) * 0.4;
        const ang = (piece.grainAngle * Math.PI) / 180;
        const ux = Math.sin(ang), uy = -Math.cos(ang); // 0° = vertical
        const a = toPx({ x: cx + ux * half, y: cy + uy * half });
        const b = toPx({ x: cx - ux * half, y: cy - uy * half });
        const ax = Math.atan2(a.y - b.y, a.x - b.x);
        const head = (p: { x: number; y: number }, dir: number) => {
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 9 * Math.cos(dir - 0.5), p.y - 9 * Math.sin(dir - 0.5));
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 9 * Math.cos(dir + 0.5), p.y - 9 * Math.sin(dir + 0.5));
        };
        ctx.strokeStyle = "#F0662C";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        head(a, ax); head(b, ax + Math.PI);
        ctx.stroke();
      }

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
          const outDoc = add(n.at, mul(norm, Math.max(piece.seamAllowance, 0.8) * 0.9));
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
          for (const hnd of [n.handleIn, n.handleOut]) {
            if (!hnd) continue;
            const h = toPx({ x: n.at.x + hnd.x, y: n.at.y + hnd.y });
            ctx.strokeStyle = "rgba(63,208,201,.7)";
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(h.x, h.y); ctx.stroke();
            ctx.fillStyle = "#3FD0C9"; ctx.beginPath();
            ctx.arc(h.x, h.y, 4, 0, Math.PI * 2); ctx.fill();
          }
        } else {
          ctx.beginPath();
          ctx.arc(q.x, q.y, 4, 0, Math.PI * 2);
          ctx.fill(); ctx.stroke();
        }
      }
    }

    // ─── trazo en construcción ────────────────────────────────────────────────
    if (draft) {
      ctx.save();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = "#FFB48A";
      ctx.fillStyle = "#FFB48A";
      if (draft.kind === "path") {
        const live = cursor ? [...draft.points, cursor] : [...draft.points];
        let line: Vec2[] = live;
        if (draft.smooth && live.length >= 3) {
          const tmp = emptyPiece("tmp");
          tmp.closed = false;
          tmp.nodes = smoothNodesFromPoints(live, false);
          line = samplePath(tmp, 18);
        }
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        line.forEach((p, i) => {
          const q = toPx(p);
          if (i === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
        });
        ctx.stroke();
        ctx.setLineDash([]);
        draft.points.forEach((p, i) => {
          const q = toPx(p);
          ctx.beginPath();
          ctx.arc(q.x, q.y, i === 0 ? 5 : 3.5, 0, Math.PI * 2);
          ctx.fill();
          if (i === 0 && draft.points.length >= 3) {
            ctx.beginPath(); ctx.arc(q.x, q.y, 10, 0, Math.PI * 2); ctx.stroke(); // cerrar aquí
          }
        });
      } else if (draft.kind === "rect") {
        const a = toPx(draft.a), b = toPx(draft.b);
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(a.x - b.x), Math.abs(a.y - b.y));
        ctx.setLineDash([]);
        ctx.font = "11px ui-monospace, monospace";
        ctx.fillText(
          `${Math.abs(draft.a.x - draft.b.x).toFixed(1)} × ${Math.abs(draft.a.y - draft.b.y).toFixed(1)} cm`,
          Math.max(a.x, b.x) + 8, Math.max(a.y, b.y) + 14,
        );
      } else if (draft.kind === "circle") {
        const c = toPx(draft.c);
        ctx.setLineDash([6, 4]);
        ctx.beginPath(); ctx.arc(c.x, c.y, draft.r * zoom, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = "11px ui-monospace, monospace";
        ctx.fillText(`radio ${draft.r.toFixed(1)} cm`, c.x + draft.r * zoom + 8, c.y);
      } else {
        const a = toPx(draft.a), b = toPx(draft.b);
        ctx.strokeStyle = "#7DE3FF"; ctx.fillStyle = "#7DE3FF";
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        for (const p of [a, b]) { ctx.beginPath(); ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2); ctx.fill(); }
        ctx.font = "12px ui-monospace, monospace";
        const d = dist(draft.a, draft.b);
        ctx.fillText(
          `${d.toFixed(2)} cm  (Δx ${Math.abs(draft.b.x - draft.a.x).toFixed(1)} · Δy ${Math.abs(draft.b.y - draft.a.y).toFixed(1)})`,
          (a.x + b.x) / 2 + 8, (a.y + b.y) / 2 - 8,
        );
      }
      ctx.restore();
    }
  }, [doc, zoom, pan, gridStep, selectedPieceId, selectedNodeId, showSeam, showNest, activeSizes, measurements, blockKind, draft, cursor]);

  // ─── resize observer (redraw al cambiar tamaño) ──────────────────────────
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      const r = canvas.getBoundingClientRect();
      useEditor.getState().setViewSize(r.width, r.height);
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

  /** Punto de dibujo: imanta a un nodo existente cercano o, si no, a la rejilla. */
  const snapPoint = (p: Vec2): Vec2 => {
    let best: Vec2 | null = null;
    let bestD = HIT_PX / zoom;
    for (const piece of doc.pieces) {
      for (const n of piece.nodes) {
        const d = dist(n.at, p);
        if (d < bestD) { bestD = d; best = n.at; }
      }
    }
    if (best) return best;
    return snapGrid ? snapTo(p, gridStep * 0.5) : p;
  };

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = ref.current!;
    canvas.setPointerCapture(e.pointerId);
    const pxStart = { x: e.clientX, y: e.clientY };
    const st = useEditor.getState();

    // middle-click, alt, shift o herramienta mano → pan
    if (e.button === 1 || e.altKey || e.shiftKey || tool === "pan") {
      dragState.current = { kind: "pan", startPx: pxStart, panStart: { ...pan } };
      return;
    }

    const r = canvas.getBoundingClientRect();
    const cx = e.clientX - r.left;
    const cy = e.clientY - r.top;
    const world = screenToDoc(e.clientX, e.clientY);
    const toScreen = (p: Vec2) => ({ x: pan.x + p.x * zoom, y: pan.y + p.y * zoom });

    // ── herramientas de dibujo ──
    if (tool === "line" || tool === "curve") {
      const p = snapPoint(world);
      const d = st.draft;
      if (d?.kind !== "path") {
        st.setDraft({ kind: "path", smooth: tool === "curve", points: [p] });
        return;
      }
      if (e.detail >= 2) { st.finishPath(false); return; } // doble clic: línea abierta
      const first = toScreen(d.points[0]!);
      if (d.points.length >= 3 && Math.hypot(first.x - cx, first.y - cy) < HIT_PX + 4) {
        st.finishPath(true);
        return;
      }
      st.addDraftPoint(p);
      return;
    }
    if (tool === "rect") {
      const p = snapPoint(world);
      st.setDraft({ kind: "rect", a: p, b: p });
      dragState.current = { kind: "rect", startPx: pxStart, origin: p };
      return;
    }
    if (tool === "circle") {
      const p = snapPoint(world);
      st.setDraft({ kind: "circle", c: p, r: 0 });
      dragState.current = { kind: "circle", startPx: pxStart, origin: p };
      return;
    }
    if (tool === "measure") {
      const p = snapPoint(world);
      st.setDraft({ kind: "measure", a: p, b: p });
      dragState.current = { kind: "measure", startPx: pxStart, origin: p };
      return;
    }
    if (tool === "addnode") {
      let best: { pieceId: string; seg: number; t: number; d: number } | null = null;
      for (const piece of doc.pieces) {
        const hit = nearestSegment(piece, world);
        if (hit && (!best || hit.distance < best.d)) {
          best = { pieceId: piece.id, seg: hit.segIndex, t: hit.t, d: hit.distance };
        }
      }
      // t exactamente 0 o 1 coincide con un nodo existente: no insertar
      if (best && best.d * zoom < EDGE_PX && best.t > 0.02 && best.t < 0.98) {
        st.addNodeAt(best.pieceId, best.seg, best.t);
      }
      return;
    }

    // ── selección / edición ──
    // 1) handles Bézier del nodo seleccionado
    if (selectedPieceId && selectedNodeId) {
      const piece = doc.pieces.find((p) => p.id === selectedPieceId);
      const node = piece?.nodes.find((n) => n.id === selectedNodeId);
      if (node) {
        for (const which of ["in", "out"] as const) {
          const hnd = which === "in" ? node.handleIn : node.handleOut;
          if (!hnd) continue;
          const q = toScreen({ x: node.at.x + hnd.x, y: node.at.y + hnd.y });
          if (Math.hypot(q.x - cx, q.y - cy) < HIT_PX) {
            dragState.current = { kind: "handle", which, startPx: pxStart, moved: false };
            return;
          }
        }
      }
    }

    // 2) nodo más cercano
    let hitPiece: string | null = null;
    let hitNode: string | null = null;
    let bestD = HIT_PX;
    for (const p of doc.pieces) {
      for (const n of p.nodes) {
        const q = toScreen(n.at);
        const d = Math.hypot(q.x - cx, q.y - cy);
        if (d < bestD) { bestD = d; hitPiece = p.id; hitNode = n.id; }
      }
    }
    if (hitPiece && hitNode) {
      if (tool === "notch") { toggleNotch(hitPiece, hitNode); return; }
      selectNode(hitPiece, hitNode);
      dragState.current = { kind: "node", startPx: pxStart, moved: false };
      return;
    }
    if (tool === "notch") return;

    // 3) interior de una pieza (la de arriba primero) o línea abierta cercana
    for (let i = doc.pieces.length - 1; i >= 0; i--) {
      const piece = doc.pieces[i]!;
      const inside = piece.closed
        ? pointInPiece(piece, world)
        : (nearestSegment(piece, world)?.distance ?? Infinity) * zoom < EDGE_PX;
      if (inside) {
        selectPiece(piece.id);
        dragState.current = { kind: "piece", startPx: pxStart, last: world, moved: false };
        return;
      }
    }

    clearSelection();
    dragState.current = { kind: "pan", startPx: pxStart, panStart: { ...pan } };
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const world = screenToDoc(e.clientX, e.clientY);
    setCursor(tool === "line" || tool === "curve" ? snapPoint(world) : world);
    const d = dragState.current;
    if (!d) return;
    const st = useEditor.getState();
    const moved = Math.hypot(e.clientX - d.startPx.x, e.clientY - d.startPx.y) > 2;

    if (d.kind === "pan") {
      setPan({
        x: d.panStart.x + (e.clientX - d.startPx.x),
        y: d.panStart.y + (e.clientY - d.startPx.y),
      });
    } else if (d.kind === "node") {
      if (!moved && !d.moved) return;
      if (!d.moved) { st.beginDrag(); d.moved = true; }
      st.moveSelectedNode(snapGrid ? snapTo(world, gridStep * 0.5) : world);
    } else if (d.kind === "handle") {
      if (!moved && !d.moved) return;
      if (!d.moved) { st.beginDrag(); d.moved = true; }
      st.moveSelectedHandle(d.which, world);
    } else if (d.kind === "piece") {
      if (!moved && !d.moved) return;
      if (!d.moved) { st.beginDrag(); d.moved = true; }
      st.moveSelectedPieceBy(world.x - d.last.x, world.y - d.last.y);
      d.last = world;
    } else if (d.kind === "rect") {
      st.setDraft({ kind: "rect", a: d.origin, b: snapPoint(world) });
    } else if (d.kind === "circle") {
      st.setDraft({ kind: "circle", c: d.origin, r: dist(d.origin, snapPoint(world)) });
    } else if (d.kind === "measure") {
      st.setDraft({ kind: "measure", a: d.origin, b: snapPoint(world) });
    }
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    ref.current?.releasePointerCapture(e.pointerId);
    const d = dragState.current;
    dragState.current = null;
    if (!d) return;
    const st = useEditor.getState();
    if (d.kind === "rect" && st.draft?.kind === "rect") st.commitRect(st.draft.a, st.draft.b);
    if (d.kind === "circle" && st.draft?.kind === "circle") st.commitCircle(st.draft.c, st.draft.r);
    // "measure" deja la medición visible hasta el siguiente clic o cambio de herramienta
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
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) return;
      const st = useEditor.getState();
      const mod = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();

      if (mod && k === "z") { e.preventDefault(); if (e.shiftKey) st.redo(); else st.undo(); return; }
      if (mod && k === "y") { e.preventDefault(); st.redo(); return; }
      if (mod && k === "d") { e.preventDefault(); st.duplicateSelected(); return; }
      if (mod) return;

      if (e.key === "Escape") {
        if (st.draft) st.setDraft(null); else st.clearSelection();
        return;
      }
      if (e.key === "Enter" && st.draft?.kind === "path") { st.finishPath(true); return; }
      if (e.key === "Backspace" && st.draft?.kind === "path") {
        e.preventDefault();
        const pts = st.draft.points.slice(0, -1);
        st.setDraft(pts.length ? { ...st.draft, points: pts } : null);
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") { st.deleteSelection(); return; }
      const next = TOOL_KEYS[k];
      if (next) st.setTool(next);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const cursorStyle =
    tool === "select" ? "default" : tool === "pan" ? "grab" : "crosshair";

  return (
    <canvas
      ref={ref}
      className="st-canvas"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={() => setCursor(null)}
      onWheel={onWheel}
      style={{ touchAction: "none", cursor: cursorStyle }}
    />
  );
}
