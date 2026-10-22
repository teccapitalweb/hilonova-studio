import { describe, expect, it } from "vitest";
import { draftBlock, defaultMeasurementsFor, type BlockKind } from "@hilonova/blocks";
import { gradeDoc, samplePath } from "@hilonova/geometry";

const KINDS: BlockKind[] = ["pantalon-denim", "pantalon-vestir", "short", "bermuda", "pantalon-cargo", "pants-jogger"];

type P = { x: number; y: number };
function widthAt(poly: P[], y: number): number {
  const xs: number[] = [];
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]!, b = poly[j]!;
    if (a.y > y !== b.y > y) xs.push(a.x + ((y - a.y) * (b.x - a.x)) / (b.y - a.y));
  }
  return xs.length ? Math.max(...xs) - Math.min(...xs) : 0;
}

/** Contorno de una pierna (delantero + espalda) a la altura y, medida desde la cintura de cada pieza. */
function legAt(doc: ReturnType<typeof draftBlock>, y: number): number {
  const f = samplePath(doc.pieces.find((p) => p.name === "Delantero")!, 16);
  const b = samplePath(doc.pieces.find((p) => p.name === "Espalda")!, 16);
  const top = (poly: P[]) => Math.min(...poly.map((p) => p.y));
  return widthAt(f, top(f) + y) + widthAt(b, top(b) + y);
}

describe.each(KINDS)("pierna del pantalón %s", (kind) => {
  const m = defaultMeasurementsFor(kind);
  const base = draftBlock(kind, m);
  const tiro = m.tiro ?? 25;

  it("el contorno del muslo es parecido a la medida de muslo, no mucho menor ni mayor", () => {
    for (const size of base.sizes) {
      const doc = gradeDoc(base, size);
      const thigh = legAt(doc, tiro + 2);
      const target = (m.muslo ?? 56) + 3; // la medida de muslo más holgura
      expect(thigh, `${kind} ${size}`).toBeGreaterThan(target * 0.85);
      expect(thigh, `${kind} ${size}`).toBeLessThan(target * 1.25);
    }
  });

  it("la pierna no se estrecha en la entrepierna ni se abulta en la rodilla", () => {
    const crotch = legAt(base, tiro + 2);
    const hip = legAt(base, tiro * 0.5);
    expect(crotch).toBeGreaterThan(hip * 0.95); // del cadera al muslo no se angosta
    const largo = m.largo ?? 60;
    const knee = legAt(base, largo * 0.56);
    expect(knee).toBeLessThan(crotch * 1.05); // la rodilla nunca es más ancha que el muslo
  });
});
