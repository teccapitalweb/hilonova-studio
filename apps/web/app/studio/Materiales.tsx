// Vista "Materiales": telas, forros, entretelas y avíos del taller, con ancho
// y precio. "Usar en el trazo" fija ancho y precio de la tela en el trazo.

"use client";

import { useEditor } from "./store";
import { NumInput, TextInput } from "./fields";
import { KIND_LABEL, blankMaterial, materials, type Material, type MaterialKind } from "../lib/materials";

const KINDS: MaterialKind[] = ["tela", "forro", "entretela", "avio"];

export default function Materiales() {
  const list = materials.useAll();
  const setFabricWidth = useEditor((s) => s.setFabricWidth);
  const setFabricPrice = useEditor((s) => s.setFabricPrice);
  const setView = useEditor((s) => s.setView);
  const fabricWidth = useEditor((s) => s.fabricWidth);
  const fabricPrice = useEditor((s) => s.fabricPrice);

  const patch = (m: Material, p: Partial<Material>) => materials.upsert({ ...m, ...p });

  function useInMarker(m: Material) {
    setFabricWidth(m.widthCm);
    setFabricPrice(m.price);
    setView("trazo");
  }

  return (
    <div className="st-page">
      <header className="st-page-h">
        <div>
          <h1>Materiales</h1>
          <p>
            Define tus telas y avíos con ancho y precio. En el trazo usan estos datos para calcular
            el consumo y el costo por prenda.
          </p>
        </div>
        <div className="st-page-actions">
          <button className="st-btn-primary" onClick={() => materials.upsert(blankMaterial())}>+ Agregar material</button>
        </div>
      </header>

      <div className="st-table-card">
        <table className="st-data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Ancho (cm)</th>
              <th>Precio (MXN)</th>
              <th>Composición</th>
              <th>Notas</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.map((m) => {
              const inUse = m.kind !== "avio" && m.widthCm === fabricWidth && m.price === fabricPrice;
              return (
                <tr key={m.id}>
                  <td><TextInput value={m.name} onCommit={(v) => patch(m, { name: v })} /></td>
                  <td>
                    <select
                      className="st-input"
                      value={m.kind}
                      onChange={(e) => patch(m, { kind: e.target.value as MaterialKind })}
                    >
                      {KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
                    </select>
                  </td>
                  <td>
                    {m.kind === "avio" ? "—" : (
                      <NumInput value={m.widthCm} step={5} min={20} max={400} width={64} onCommit={(v) => patch(m, { widthCm: v })} />
                    )}
                  </td>
                  <td><NumInput value={m.price} step={1} min={0} width={72} onCommit={(v) => patch(m, { price: v })} /></td>
                  <td><TextInput value={m.composition} onCommit={(v) => patch(m, { composition: v })} /></td>
                  <td><TextInput value={m.note} onCommit={(v) => patch(m, { note: v })} /></td>
                  <td className="st-row-actions">
                    {m.kind !== "avio" && (
                      <button className={`st-act${inUse ? " on" : ""}`} onClick={() => useInMarker(m)}>
                        {inUse ? "En uso" : "Usar en el trazo"}
                      </button>
                    )}
                    <button
                      className="st-act danger"
                      onClick={() => { if (window.confirm(`¿Eliminar "${m.name}"?`)) materials.remove(m.id); }}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              );
            })}
            {list.length === 0 && (
              <tr><td colSpan={7} className="st-empty-cell">Sin materiales. Agrega el primero.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
