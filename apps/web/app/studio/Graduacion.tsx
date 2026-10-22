// Vista "Graduación": gama de tallas, tabla de tallaje editable y graduación
// manual por nodo. El lienzo (con el nido de tallas encendido) vive en Shell;
// aquí está el panel derecho.

"use client";

import { useEffect } from "react";
import { ALPHA_SIZES, SIZE_PRESETS, compareSizes, sizeSteps } from "@hilonova/geometry";
import {
  findBlock,
  gradeRulesFor,
  measurementsForBlockSize,
  type BodyMeasurements,
} from "@hilonova/blocks";
import { useEditor, SIZE_COLORS } from "./store";
import { NumInput } from "./fields";

const LABEL: Record<keyof BodyMeasurements, string> = {
  busto: "Busto",
  cintura: "Cintura",
  cadera: "Cadera",
  hombro: "Hombro a hombro",
  cuello: "Cuello",
  sisa: "Prof. de sisa",
  largoTorso: "Largo torso",
  largoManga: "Largo manga",
  tiro: "Tiro",
  largo: "Largo total",
  muslo: "Muslo",
  bajo: "Abertura bajo",
  largoFalda: "Largo falda",
};

const isAlpha = (sizes: readonly string[]) => sizes.every((s) => ALPHA_SIZES.includes(s.toUpperCase()));

export default function GradePanel() {
  // el nido de tallas es el corazón de esta vista: siempre encendido aquí
  useEffect(() => {
    useEditor.setState({ showNest: true, tool: "select" });
  }, []);

  return (
    <aside className="st-grad-side">
      <SizesCard />
      <RulesCard />
      <NodeRuleCard />
    </aside>
  );
}

function SizesCard() {
  const doc = useEditor((s) => s.history.present);
  const activeSizes = useEditor((s) => s.activeSizes);
  const toggleSize = useEditor((s) => s.toggleSize);
  const setSizeRange = useEditor((s) => s.setSizeRange);
  const alpha = isAlpha(doc.sizes);

  function toggleMember(size: string) {
    if (size === doc.baseSize) return;
    const has = doc.sizes.includes(size);
    const next = has ? doc.sizes.filter((x) => x !== size) : [...doc.sizes, size];
    if (next.length < 2) return;
    setSizeRange([...next].sort(compareSizes), doc.baseSize);
  }

  return (
    <section className="st-group" style={{ borderTop: 0 }}>
      <div className="st-label">Gama de tallas</div>
      <div className="st-presets">
        {SIZE_PRESETS.map((p) => {
          const on = p.sizes.join() === doc.sizes.join() && p.base === doc.baseSize;
          return (
            <button key={p.id} className={`st-mini${on ? " on" : ""}`} onClick={() => setSizeRange(p.sizes, p.base)}>
              {p.label}
            </button>
          );
        })}
      </div>
      {alpha && (
        <>
          <div className="st-sub">Tallas incluidas</div>
          <div className="st-sizes">
            {ALPHA_SIZES.filter((s) => s !== "XXS" && s !== "3XL").map((size) => {
              const inSet = doc.sizes.includes(size);
              const isBase = size === doc.baseSize;
              return (
                <button
                  key={size}
                  className={`st-size${inSet ? " on" : ""}${isBase ? " base" : ""}`}
                  style={{ ["--size-color" as string]: SIZE_COLORS[size] ?? "#8A91FF" }}
                  onClick={() => toggleMember(size)}
                  title={isBase ? "Talla base" : inSet ? "Quitar talla" : "Agregar talla"}
                >
                  {size}
                  {isBase && <span className="st-size-base">base</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
      <div className="st-field" style={{ marginTop: 10 }}>
        <span>Talla base</span>
        <select
          className="st-input"
          value={doc.baseSize}
          onChange={(e) => setSizeRange(doc.sizes, e.target.value)}
          style={{ width: 90, textAlign: "left" }}
        >
          {doc.sizes.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="st-sub">Ver en el lienzo</div>
      <div className="st-sizes">
        {doc.sizes.map((size) => {
          const isBase = size === doc.baseSize;
          const on = activeSizes.includes(size);
          return (
            <button
              key={size}
              className={`st-size${on ? " on" : ""}${isBase ? " base" : ""}`}
              style={{ ["--size-color" as string]: SIZE_COLORS[size] ?? "#8A91FF" }}
              disabled={isBase}
              onClick={() => toggleSize(size)}
              title={isBase ? "La base siempre se ve" : `Mostrar talla ${size}`}
            >
              {size}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function RulesCard() {
  const doc = useEditor((s) => s.history.present);
  const measurements = useEditor((s) => s.measurements);
  const setGradeStep = useEditor((s) => s.setGradeStep);
  const resetGradeSteps = useEditor((s) => s.resetGradeSteps);
  const kind = doc.blockKind as Parameters<typeof findBlock>[0] | undefined;

  if (!kind) {
    return (
      <section className="st-group">
        <div className="st-label">Tabla de tallaje</div>
        <div className="st-empty">
          Este patrón no viene de una prenda base, así que no tiene tabla de tallaje.
          Usa la graduación manual por nodo.
        </div>
      </section>
    );
  }

  const meta = findBlock(kind);
  const rules = gradeRulesFor(kind, doc.gradeSteps);
  const edited = !!doc.gradeSteps && Object.keys(doc.gradeSteps).length > 0;
  const bySize = doc.sizes.map((size) => ({
    size,
    m: measurementsForBlockSize(kind, size, measurements, doc.baseSize, doc.gradeSteps),
  }));

  return (
    <section className="st-group">
      <div className="st-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>Tabla de tallaje · {meta.name}</span>
        {edited && (
          <button className="st-mini" onClick={resetGradeSteps} title="Volver a las reglas de fábrica">
            Restablecer
          </button>
        )}
      </div>
      <div className="st-table-wrap">
        <table className="st-grade-table">
          <thead>
            <tr>
              <th>Medida (cm)</th>
              <th title="Cuántos cm crece la medida por cada talla">+/talla</th>
              {doc.sizes.map((s) => (
                <th key={s} className={s === doc.baseSize ? "base" : ""}>{s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {meta.fields.map((f) => (
              <tr key={f}>
                <td>{LABEL[f]}</td>
                <td>
                  <NumInput
                    value={rules[f] ?? 0}
                    step={0.1}
                    width={52}
                    onCommit={(v) => setGradeStep(f, v)}
                  />
                </td>
                {bySize.map(({ size, m }) => (
                  <td key={size} className={`mono${size === doc.baseSize ? " base" : ""}`}>
                    {typeof m[f] === "number" ? (m[f] as number).toFixed(1) : "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="st-hint">
        Cambia "+/talla" y todas las piezas se re-gradúan. La talla base ({doc.baseSize}) sale de tus medidas.
      </p>
    </section>
  );
}

function NodeRuleCard() {
  const doc = useEditor((s) => s.history.present);
  const pieceId = useEditor((s) => s.selectedPieceId);
  const nodeId = useEditor((s) => s.selectedNodeId);
  const setNodeGradeOf = useEditor((s) => s.setNodeGradeOf);
  const piece = pieceId ? doc.pieces.find((p) => p.id === pieceId) : null;
  const node = piece && nodeId ? piece.nodes.find((n) => n.id === nodeId) : null;

  return (
    <section className="st-group">
      <div className="st-label">Graduación manual</div>
      {!piece || !node ? (
        <div className="st-empty">
          Selecciona un nodo en el lienzo para ver y editar cuánto se mueve en cada talla.
        </div>
      ) : (
        <>
          <div className="st-sub">{piece.name} · nodo</div>
          <div className="st-field">
            <span>Δx por talla</span>
            <NumInput
              value={node.grade?.dx ?? 0}
              step={0.1}
              unit="cm"
              onCommit={(v) => setNodeGradeOf(piece.id, node.id, { dx: v, dy: node.grade?.dy ?? 0 })}
            />
          </div>
          <div className="st-field">
            <span>Δy por talla</span>
            <NumInput
              value={node.grade?.dy ?? 0}
              step={0.1}
              unit="cm"
              onCommit={(v) => setNodeGradeOf(piece.id, node.id, { dx: node.grade?.dx ?? 0, dy: v })}
            />
          </div>
          <table className="st-grade-table">
            <thead>
              <tr>
                <th>Talla</th>
                {doc.sizes.map((s) => <th key={s} className={s === doc.baseSize ? "base" : ""}>{s}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Δx</td>
                {doc.sizes.map((s) => (
                  <td key={s} className="mono">{((node.grade?.dx ?? 0) * sizeSteps(s, doc.baseSize)).toFixed(1)}</td>
                ))}
              </tr>
              <tr>
                <td>Δy</td>
                {doc.sizes.map((s) => (
                  <td key={s} className="mono">{((node.grade?.dy ?? 0) * sizeSteps(s, doc.baseSize)).toFixed(1)}</td>
                ))}
              </tr>
            </tbody>
          </table>
          {node.grade && (
            <button className="st-act" style={{ marginTop: 8 }} onClick={() => setNodeGradeOf(piece.id, node.id, null)}>
              Quitar regla (este nodo no crece)
            </button>
          )}
        </>
      )}
    </section>
  );
}
