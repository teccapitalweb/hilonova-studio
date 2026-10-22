import { describe, expect, it } from "vitest";
import { gradeDoc } from "@hilonova/geometry";
import { BLOCK_CATALOG, defaultMeasurementsFor, draftBlock, type BlockKind } from "@hilonova/blocks";
import { closeDarts, drapeDoc, drapeFamilyOf, type Drape, type DrapeMesh } from "../apps/web/app/studio/drape";

const docOf = (k: BlockKind) => draftBlock(k, defaultMeasurementsFor(k));
const supported = BLOCK_CATALOG.filter((b) => drapeFamilyOf(b.kind)).map((b) => b.kind);

const meanOf = (m: DrapeMesh, axis: 0 | 1 | 2) => {
  let s = 0, n = 0;
  for (let i = axis; i < m.positions.length; i += 3) { s += m.positions[i]!; n++; }
  return s / n;
};
const widthOf = (d: Drape) => d.max[0] - d.min[0];
const heightOf = (d: Drape) => d.max[1] - d.min[1];

describe("vista 3D: familias", () => {
  it("clasifica las prendas", () => {
    expect(drapeFamilyOf("blusa-clasica")).toBe("top");
    expect(drapeFamilyOf("vestido-basico")).toBe("top");
    expect(drapeFamilyOf("falda-a")).toBe("skirt");
    expect(drapeFamilyOf("short")).toBe("pants");
    expect(drapeFamilyOf(undefined)).toBeNull();
    expect(drapeFamilyOf("no-existe")).toBeNull();
  });

  it("todas las prendas del catálogo se pueden mostrar en 3D", () => {
    expect(supported).toHaveLength(BLOCK_CATALOG.length);
  });
});

describe.each(supported)("vista 3D de %s", (kind) => {
  const family = drapeFamilyOf(kind)!;
  const base = docOf(kind);

  it("genera mallas válidas en todas las tallas", () => {
    for (const size of base.sizes) {
      const d = drapeDoc(gradeDoc(base, size), family);
      expect(d.meshes.length, `${kind} ${size}`).toBeGreaterThanOrEqual(2);
      for (const m of d.meshes) {
        expect(m.positions.length, `${m.name}: vértices`).toBeGreaterThan(30);
        expect(m.indices.length % 3).toBe(0);
        expect(m.indices.every((i) => i < m.positions.length / 3), `${m.name}: índices`).toBe(true);
        expect(m.positions.every(Number.isFinite), `${kind} ${size} ${m.name}: vértices finitos`).toBe(true);
        expect(m.outline.every(Number.isFinite), `${m.name}: contorno finito`).toBe(true);
      }
    }
  });

  it("la prenda cuelga hacia abajo y mide aproximadamente lo que el patrón", () => {
    const d = drapeDoc(base, family);
    expect(d.max[1]).toBeLessThanOrEqual(1);   // el borde superior queda en y ≈ 0
    const tall = Math.max(...base.pieces.filter((p) => /^(Delantero|Espalda)/.test(p.name)).map((p) => {
      const ys = p.nodes.map((n) => n.at.y);
      return Math.max(...ys) - Math.min(...ys);
    }));
    expect(heightOf(d)).toBeGreaterThan(tall * 0.9);
  });

  it("las tallas grandes son más anchas que las chicas", () => {
    const sizes = [...base.sizes];
    const small = drapeDoc(gradeDoc(base, sizes[0]!), family);
    const large = drapeDoc(gradeDoc(base, sizes[sizes.length - 1]!), family);
    expect(widthOf(large)).toBeGreaterThan(widthOf(small));
  });
});

describe("vista 3D: forma", () => {
  it("el delantero queda al frente (+Z) y la espalda atrás (−Z); el cuerpo está centrado", () => {
    const d = drapeDoc(docOf("blusa-clasica"), "top");
    const front = d.meshes.filter((m) => m.name.startsWith("Delantero"));
    const back = d.meshes.filter((m) => m.name.startsWith("Espalda"));
    expect(front.length).toBe(2);   // el delantero va por mitades (derecha e izquierda)
    expect(back.length).toBe(1);
    for (const m of front) expect(meanOf(m, 2)).toBeGreaterThan(0);
    for (const m of back) expect(meanOf(m, 2)).toBeLessThan(0);
    const body = [...front, ...back];
    const x = body.flatMap((m) => [meanOf(m, 0)]);
    expect(Math.abs(x.reduce((a, b) => a + b, 0) / x.length)).toBeLessThan(2);
  });

  it("las mitades derecha e izquierda del delantero son simétricas", () => {
    const d = drapeDoc(docOf("blusa-clasica"), "top");
    const [r, l] = d.meshes.filter((m) => m.name.startsWith("Delantero"));
    expect(meanOf(r!, 0)).toBeCloseTo(-meanOf(l!, 0), 3);
    expect(r!.positions.length).toBe(l!.positions.length);
  });

  it("la blusa trae dos mangas, una a cada lado", () => {
    const d = drapeDoc(docOf("blusa-clasica"), "top");
    const sl = d.meshes.filter((m) => m.name.startsWith("Manga"));
    expect(sl).toHaveLength(2);
    expect(meanOf(sl[0]!, 0) * meanOf(sl[1]!, 0)).toBeLessThan(0);
  });

  it("la camisa une el canesú con la espalda", () => {
    const d = drapeDoc(docOf("camisa-hombre"), "top");
    expect(d.meshes.some((m) => m.name === "Canesú")).toBe(true);
    expect(d.meshes.some((m) => m.name === "Espalda")).toBe(true);
  });

  it("las faldas y el vestido no llevan mangas; el pantalón trae dos piernas (4 piezas)", () => {
    expect(drapeDoc(docOf("falda-a"), "skirt").meshes.some((m) => m.name.startsWith("Manga"))).toBe(false);
    expect(drapeDoc(docOf("vestido-basico"), "top").meshes.some((m) => m.name.startsWith("Manga"))).toBe(false);
    const p = drapeDoc(docOf("pantalon-cargo"), "pants");
    expect(p.meshes).toHaveLength(4);
    const xs = p.meshes.map((m) => meanOf(m, 0));
    expect(Math.min(...xs)).toBeLessThan(0);
    expect(Math.max(...xs)).toBeGreaterThan(0);
  });

  it("sin piezas de delantero y espalda devuelve vacío sin fallar", () => {
    const empty = { ...docOf("blusa-clasica"), pieces: [] };
    expect(drapeDoc(empty, "top").meshes).toEqual([]);
  });
});

describe("vista 3D: pinzas cerradas", () => {
  it("al armar la prenda se cierran las pinzas y el contorno vuelve a ser continuo", () => {
    const doc = docOf("blusa-clasica");
    const front = doc.pieces.find((p) => p.name === "Delantero")!;
    const closed = closeDarts(front);
    expect(closed.nodes.length).toBe(front.nodes.length - 1); // se quita solo la punta
    // una pieza sin pinzas queda igual (misma referencia)
    const tee = docOf("playera-basica").pieces[0]!;
    expect(closeDarts(tee)).toBe(tee);
  });

  it("el vestido (2 pinzas) y la falda en A (3 pinzas) pierden todas", () => {
    const dress = docOf("vestido-basico").pieces.find((p) => p.name === "Delantero")!;
    expect(closeDarts(dress).nodes.length).toBe(dress.nodes.length - 2);
    const skirt = docOf("falda-a").pieces.find((p) => p.name === "Delantero")!;
    expect(closeDarts(skirt).nodes.length).toBe(skirt.nodes.length - 2);
  });
});
