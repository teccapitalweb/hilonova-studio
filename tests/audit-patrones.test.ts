// Auditoría de los 17 patrones base: que cada prenda sea coherente con sus medidas y que
// las piezas que se cosen entre sí midan lo mismo. Si un patrón nuevo rompe una regla,
// estas pruebas lo avisan antes de que llegue a un alumno.

import { describe, expect, it } from "vitest";
import { BLOCK_CATALOG, defaultMeasurementsFor, draftBlock, type BlockKind } from "@hilonova/blocks";
import { gradeDoc, samplePath, type PatternDoc, type Piece } from "@hilonova/geometry";

type P = { x: number; y: number };

// ─── ayudantes ───────────────────────────────────────────────────────────────

const plen = (s: P[]): number => {
  let t = 0;
  for (let i = 1; i < s.length; i++) t += Math.hypot(s[i]!.x - s[i - 1]!.x, s[i]!.y - s[i - 1]!.y);
  return t;
};

const area = (s: P[]): number => {
  let a = 0;
  for (let i = 0; i < s.length; i++) {
    const p = s[i]!, q = s[(i + 1) % s.length]!;
    a += p.x * q.y - q.x * p.y;
  }
  return Math.abs(a) / 2;
};

function selfCrossings(poly: P[]): number {
  const m = poly.length;
  const ccw = (a: P, b: P, c: P) => (c.y - a.y) * (b.x - a.x) - (b.y - a.y) * (c.x - a.x);
  let n = 0;
  for (let i = 0; i < m; i++) {
    for (let j = i + 2; j < m; j++) {
      if (i === 0 && j === m - 1) continue;
      const a = poly[i]!, b = poly[(i + 1) % m]!, c = poly[j]!, d = poly[(j + 1) % m]!;
      if (ccw(a, c, d) * ccw(b, c, d) < 0 && ccw(a, b, c) * ccw(a, b, d) < 0) n++;
    }
  }
  return n;
}

function widthAt(s: P[], y: number): number {
  const xs: number[] = [];
  for (let i = 0, j = s.length - 1; i < s.length; j = i++) {
    const a = s[i]!, b = s[j]!;
    if (a.y > y !== b.y > y) xs.push(a.x + ((y - a.y) * (b.x - a.x)) / (b.y - a.y));
  }
  return xs.length ? Math.max(...xs) - Math.min(...xs) : NaN;
}

/** Las bocas de las pinzas de una pieza ya cosida: al coser, el borde entre los dos puntos de la boca desaparece. */
const mouthsOf = new WeakMap<Piece, Array<[Piece["nodes"][number], Piece["nodes"][number]]>>();

/** Una pinza es una "V" abierta en el contorno: al coser se cierra, así que se le quita la punta (y la boca no cuenta como borde). */
function closeDarts(piece: Piece): Piece {
  let nodes = piece.nodes;
  const mouths: Array<[Piece["nodes"][number], Piece["nodes"][number]]> = [];
  for (let guard = 0; guard < 12; guard++) {
    const n = nodes.length;
    let apex = -1;
    for (let i = 0; i < n; i++) {
      const a = nodes[(i - 1 + n) % n]!.at, b = nodes[i]!.at, c = nodes[(i + 1) % n]!.at;
      const v1 = { x: a.x - b.x, y: a.y - b.y }, v2 = { x: c.x - b.x, y: c.y - b.y };
      const l1 = Math.hypot(v1.x, v1.y), l2 = Math.hypot(v2.x, v2.y);
      if (l1 < 4 || l2 < 4) continue;
      const cos = (v1.x * v2.x + v1.y * v2.y) / (l1 * l2);
      if (Math.acos(Math.max(-1, Math.min(1, cos))) < (40 * Math.PI) / 180 && Math.hypot(a.x - c.x, a.y - c.y) < 8) {
        apex = i;
        break;
      }
    }
    if (apex < 0) break;
    mouths.push([nodes[(apex - 1 + nodes.length) % nodes.length]!, nodes[(apex + 1) % nodes.length]!]);
    nodes = nodes.filter((_, i) => i !== apex);
  }
  const out = { ...piece, nodes };
  mouthsOf.set(out, mouths);
  return out;
}

/** Largo del tramo más corto del contorno entre dos nodos; si pasa por la boca de una pinza ya cosida, esa boca no cuenta. */
function run(piece: Piece, i: number, j: number): number {
  const n = piece.nodes.length;
  const mouths = mouthsOf.get(piece) ?? [];
  const way = (step: 1 | -1) => {
    const idx: number[] = [];
    for (let k = i; ; k = (k + step + n) % n) { idx.push(k); if (k === j) break; }
    let len = plen(samplePath({ ...piece, closed: false, nodes: idx.map((k) => piece.nodes[k]!) }, 24));
    for (let q = 0; q + 1 < idx.length; q++) {
      const a = piece.nodes[idx[q]!]!, b = piece.nodes[idx[q + 1]!]!;
      if (mouths.some(([m1, m2]) => (m1.id === a.id && m2.id === b.id) || (m1.id === b.id && m2.id === a.id))) {
        len -= plen(samplePath({ ...piece, closed: false, nodes: [a, b] }, 24));
      }
    }
    return len;
  };
  return Math.min(way(1), way(-1));
}

/** Largo del tramo directo (en el orden de los nodos) entre dos nodos. */
const direct = (piece: Piece, i: number, j: number): number =>
  plen(samplePath({ ...piece, closed: false, nodes: piece.nodes.slice(i, j + 1) }, 24));

const named = (doc: PatternDoc, re: RegExp, not?: RegExp): Piece | undefined =>
  doc.pieces.find((p) => re.test(p.name) && !(not && not.test(p.name)));

/** Ancho que de verdad hay a la altura y: suma de los tramos dentro de la pieza (los huecos de las pinzas no cuentan). */
function netWidthAt(s: P[], y: number): number {
  const xs: number[] = [];
  for (let i = 0, j = s.length - 1; i < s.length; j = i++) {
    const a = s[i]!, b = s[j]!;
    if (a.y > y !== b.y > y) xs.push(a.x + ((y - a.y) * (b.x - a.x)) / (b.y - a.y));
  }
  xs.sort((p, q) => p - q);
  let t = 0;
  for (let k = 0; k + 1 < xs.length; k += 2) t += xs[k + 1]! - xs[k]!;
  return t;
}

/** Cintura ya cosida de una falda: suma de las piezas con las pinzas cerradas. */
function netWaist(d: PatternDoc): number {
  let w = 0;
  for (const p of d.pieces.filter((q) => /^(Delantero|Espalda)/.test(q.name))) {
    const s = samplePath(p, 24);
    w += p.quantity * netWidthAt(s, Math.min(...s.map((q) => q.y)) + 0.05);
  }
  return w;
}

const front = (d: PatternDoc) => named(d, /^Delantero/, /Forro|Vista/)!;
const back = (d: PatternDoc) => named(d, /^Espalda/, /Forro|Vista/)!;

const KINDS = BLOCK_CATALOG.map((b) => b.kind as BlockKind);
const draft = (k: BlockKind) => draftBlock(k, defaultMeasurementsFor(k));

/** Ancho de la espalda a la altura y; si hay canesú, de arriba hacia abajo va primero el canesú y luego la espalda. */
function backWidth(d: PatternDoc, y: number): number {
  const b = samplePath(back(d), 24);
  const by = Math.min(...b.map((p) => p.y));
  const yoke = named(d, /^Canes/);
  if (!yoke) return widthAt(b, by + y);
  const ys = samplePath(yoke, 24);
  const y0 = Math.min(...ys.map((p) => p.y));
  const h = Math.max(...ys.map((p) => p.y)) - y0;
  return y < h ? widthAt(ys, y0 + y) : widthAt(b, by + (y - h));
}

/** Contorno del cuerpo a la altura y (cm desde el borde de arriba), sumando delantero y espalda. */
function circ(d: PatternDoc, y: number): number {
  const f = front(d);
  const fs = samplePath(f, 24);
  const fy = Math.min(...fs.map((p) => p.y));
  return f.quantity * widthAt(fs, fy + y) + back(d).quantity * backWidth(d, y);
}
const maxCirc = (d: PatternDoc, y0: number, y1: number): number => {
  let m = 0;
  for (let y = y0; y <= y1; y += 1) {
    const c = circ(d, y);
    if (Number.isFinite(c)) m = Math.max(m, c);
  }
  return m;
};

// ─── reglas ──────────────────────────────────────────────────────────────────

describe.each(KINDS)("patrón %s", (kind) => {
  const base = draft(kind);

  it("ninguna pieza se cruza consigo misma ni tiene valores raros, en todas las tallas", () => {
    for (const size of base.sizes) {
      for (const p of gradeDoc(base, size).pieces) {
        const s = samplePath(p, 16);
        expect(s.every((q) => Number.isFinite(q.x) && Number.isFinite(q.y)), `${p.name} ${size}`).toBe(true);
        expect(selfCrossings(s), `${p.name} ${size}`).toBe(0);
      }
    }
  });

  it("las tallas más grandes dan más tela", () => {
    let prev = 0;
    for (const size of base.sizes) {
      const d = gradeDoc(base, size);
      const tot = d.pieces.reduce((a, p) => a + (p.closed ? area(samplePath(p, 16)) * p.quantity : 0), 0);
      expect(tot, `${kind} ${size}`).toBeGreaterThan(prev);
      prev = tot;
    }
  });
});

describe("contorno contra medidas (holgura razonable)", () => {
  const TOPS: BlockKind[] = [
    "blusa-clasica", "chamarra-mezclilla", "camisa-hombre", "camisa-manga-corta",
    "sudadera-capucha", "polo", "playera-basica", "chaleco", "vestido-basico",
  ];

  it.each(TOPS)("%s: el contorno de pecho es el busto más una holgura de 2 a 24 cm (base)", (kind) => {
    const m = defaultMeasurementsFor(kind);
    const sisa = m.sisa ?? 23;
    const c = maxCirc(draft(kind), sisa - 2, sisa + 12);
    const bust = m.busto ?? 92;
    expect(c - bust, `${kind}: contorno ${c.toFixed(1)} busto ${bust}`).toBeGreaterThanOrEqual(2);
    expect(c - bust, `${kind}: contorno ${c.toFixed(1)} busto ${bust}`).toBeLessThanOrEqual(24);
  });

  const LOWERS: BlockKind[] = [
    "pantalon-denim", "pantalon-vestir", "short", "bermuda", "pants-jogger", "pantalon-cargo", "falda-recta", "falda-a",
  ];

  it.each(LOWERS)("%s: el contorno de cadera es la medida de cadera más una holgura de 0 a 14 cm", (kind) => {
    const m = defaultMeasurementsFor(kind);
    // en pantalones la ventana termina antes de la entrepierna (más abajo ya se mide el muslo)
    const isPants = !/^falda/.test(kind);
    const hip = maxCirc(draft(kind), 8, isPants ? (m.tiro ?? 25) * 0.7 : 24);
    expect(hip - (m.cadera ?? 100), `${kind}: contorno ${hip.toFixed(1)}`).toBeGreaterThanOrEqual(0);
    expect(hip - (m.cadera ?? 100), `${kind}: contorno ${hip.toFixed(1)}`).toBeLessThanOrEqual(14);
  });
});

describe("costuras que se cosen entre sí", () => {
  const SIDE_KINDS: BlockKind[] = [
    "pantalon-denim", "pantalon-vestir", "playera-basica", "falda-recta", "blusa-clasica", "chamarra-mezclilla",
    "short", "bermuda", "sudadera-capucha", "pants-jogger", "camisa-hombre", "camisa-manga-corta", "polo", "pantalon-cargo",
  ];

  /** Costado: del fondo de la sisa (o la cadera) hasta el bajo, con las pinzas cerradas. */
  /** El nodo del bajo en el costado: el más bajo entre los que están en el lado de afuera (los ruedos curvos son más altos de lado). */
  function hemIndex(ns: Piece["nodes"]): number {
    const maxX = Math.max(...ns.map((n) => n.at.x));
    let h = -1;
    ns.forEach((n, k) => {
      if (n.at.x < maxX - 3) return;
      if (h < 0 || n.at.y > ns[h]!.at.y + 1e-6 || (Math.abs(n.at.y - ns[h]!.at.y) < 0.6 && n.at.x > ns[h]!.at.x)) h = k;
    });
    return h;
  }
  function side(p0: Piece): number {
    const p = closeDarts(p0);
    const ns = p.nodes;
    let u = -1;
    ns.forEach((n, k) => { if (n.notch && (u < 0 || n.at.x > ns[u]!.at.x)) u = k; });
    return run(p, u, hemIndex(ns));
  }

  it.each(SIDE_KINDS)("%s: el costado del delantero mide lo mismo que el de la espalda (todas las tallas)", (kind) => {
    for (const size of draft(kind).sizes) {
      const d = gradeDoc(draft(kind), size);
      expect(Math.abs(side(front(d)) - side(back(d))), `${kind} ${size}`).toBeLessThan(0.6);
    }
  });

  it("vestido y falda en A: costados iguales", () => {
    for (const size of draft("vestido-basico").sizes) {
      const d = gradeDoc(draft("vestido-basico"), size);
      expect(Math.abs(run(closeDarts(front(d)), 4, 9) - run(closeDarts(back(d)), 4, 7)), size).toBeLessThan(0.6);
    }
    for (const size of draft("falda-a").sizes) {
      const d = gradeDoc(draft("falda-a"), size);
      expect(Math.abs(run(closeDarts(front(d)), 3, 5) - run(closeDarts(back(d)), 3, 5)), size).toBeLessThan(0.6);
    }
  });

  it("pantalones: la entrepierna del delantero mide lo mismo que la de la espalda", () => {
    const inseam = (p: Piece) => {
      const ns = p.nodes;
      const hOut = hemIndex(ns);
      const hIn = (hOut + 1) % ns.length;
      let c = -1;
      ns.forEach((n, k) => {
        if (k !== hOut && k !== hIn && n.at.y < ns[hOut]!.at.y - 5 && (c < 0 || n.at.x < ns[c]!.at.x)) c = k;
      });
      return run(p, hIn, c);
    };
    for (const kind of ["pantalon-denim", "pantalon-vestir", "short", "pants-jogger"] as BlockKind[]) {
      for (const size of draft(kind).sizes) {
        const d = gradeDoc(draft(kind), size);
        expect(Math.abs(inseam(front(d)) - inseam(back(d))), `${kind} ${size}`).toBeLessThan(1);
      }
    }
  });

  it("blusa y chamarra: el cuello mide lo mismo que el escote", () => {
    for (const kind of ["blusa-clasica", "chamarra-mezclilla"] as BlockKind[]) {
      for (const size of draft(kind).sizes) {
        const d = gradeDoc(draft(kind), size);
        // delantero: del centro (nodo 1) al hombro (nodo 2); espalda completa: del centro (0) al hombro (1)
        const neck = 2 * (direct(front(d), 1, 2) + direct(back(d), 0, 1));
        const collar = samplePath(named(d, /^Cuello/)!, 24);
        const width = Math.max(...collar.map((p) => p.x)) - Math.min(...collar.map((p) => p.x));
        expect(Math.abs(width - neck), `${kind} ${size}: escote ${neck.toFixed(1)} cuello ${width.toFixed(1)}`).toBeLessThan(2);
      }
    }
  });

  it("sudadera: el borde de la capucha mide la mitad del escote", () => {
    for (const size of draft("sudadera-capucha").sizes) {
      const d = gradeDoc(draft("sudadera-capucha"), size);
      const half = direct(front(d), 0, 1) + direct(back(d), 0, 1);
      const hood = named(d, /^Capucha/)!;
      const edge = plen(samplePath({ ...hood, closed: false, nodes: [hood.nodes[6]!, hood.nodes[7]!, hood.nodes[0]!] }, 24));
      expect(Math.abs(edge - half), `${size}: escote ${half.toFixed(1)} capucha ${edge.toFixed(1)}`).toBeLessThan(1);
    }
  });

  it("los puños miden lo mismo que la boca de la manga (o el 70-95 % si son de rib)", () => {
    const cases: Array<[BlockKind, boolean]> = [
      ["blusa-clasica", false], ["chamarra-mezclilla", false], ["camisa-hombre", false],
      ["sudadera-capucha", true], ["polo", true],
    ];
    for (const [kind, rib] of cases) {
      for (const size of draft(kind).sizes) {
        const d = gradeDoc(draft(kind), size);
        const sl = samplePath(named(d, /^Manga/)!, 24);
        const mouth = widthAt(sl, Math.max(...sl.map((p) => p.y)) - 0.4);
        const cuff = samplePath(named(d, /^Pu/)!, 24);
        const w = Math.max(...cuff.map((p) => p.x)) - Math.min(...cuff.map((p) => p.x));
        const h = Math.max(...cuff.map((p) => p.y)) - Math.min(...cuff.map((p) => p.y));
        const len = Math.max(w, h);
        if (rib) {
          expect(len / mouth, `${kind} ${size}`).toBeGreaterThan(0.7);
          expect(len / mouth, `${kind} ${size}`).toBeLessThan(0.95);
        } else {
          expect(Math.abs(len - mouth), `${kind} ${size}: boca ${mouth.toFixed(1)} puño ${len.toFixed(1)}`).toBeLessThan(2.5);
        }
      }
    }
  });
});

describe("playera básica (la foto de referencia es manga corta con cuello de rib)", () => {
  it("la manga es corta y la cabeza cierra con la sisa en todas las tallas", () => {
    for (const size of draft("playera-basica").sizes) {
      const d = gradeDoc(draft("playera-basica"), size);
      const f = named(d, /^Delantero/)!, b = named(d, /^Espalda/)!, s = named(d, /^Manga/)!;
      const armhole = direct(f, 2, 3) + direct(b, 2, 3);
      const cap = plen(samplePath({ ...s, closed: false, nodes: [s.nodes[4]!, s.nodes[0]!, s.nodes[1]!] }, 24));
      const sl = samplePath(s, 24);
      const length = Math.max(...sl.map((p) => p.y)) - Math.min(...sl.map((p) => p.y));
      expect(length, `${size}: largo de manga`).toBeGreaterThan(15);
      expect(length, `${size}: largo de manga`).toBeLessThan(32);
      expect(Math.abs(cap - armhole - 0.5), `${size}: cabeza ${cap.toFixed(1)} sisa ${armhole.toFixed(1)}`).toBeLessThanOrEqual(0.9);
    }
  });

  it("trae el cuello de rib y mide ~85 % del escote", () => {
    for (const size of draft("playera-basica").sizes) {
      const d = gradeDoc(draft("playera-basica"), size);
      const neck = 2 * (direct(named(d, /^Delantero/)!, 0, 1) + direct(named(d, /^Espalda/)!, 0, 1));
      const rib = samplePath(named(d, /^Cuello de rib/)!, 24);
      const len = Math.max(...rib.map((p) => p.x)) - Math.min(...rib.map((p) => p.x));
      expect(Math.abs(len - neck * 0.85), `${size}: escote ${neck.toFixed(1)} rib ${len.toFixed(1)}`).toBeLessThan(1);
    }
  });
});

describe("pantalones y shorts: las piezas que muestran las fotos de referencia", () => {
  const count = (d: PatternDoc, name: string) => d.pieces.filter((p) => p.name === name).reduce((a, p) => a + p.quantity, 0);
  const height = (p: Piece) => { const s = samplePath(p, 24); return Math.max(...s.map((q) => q.y)) - Math.min(...s.map((q) => q.y)); };

  it.each(["pantalon-denim", "short"] as BlockKind[])("%s: cinco bolsillos con canesú, pretina, trabillas y bragueta", (kind) => {
    const d = draft(kind);
    for (const [name, qty] of [
      ["Delantero", 2], ["Espalda", 2], ["Canesú", 2], ["Pretina", 1], ["Trabilla", 6],
      ["Bolsa de bolsillo delantero", 2], ["Vista de bolsillo delantero", 2], ["Bolsillo trasero", 2],
      ["Bolsillo moneda", 1], ["Vista de bragueta", 1],
    ] as Array<[string, number]>) {
      expect(count(d, name), `${kind}: ${name}`).toBe(qty);
    }
  });

  it.each(["pantalon-denim", "short"] as BlockKind[])("%s: el canesú mide 5-11 cm y encaja con la espalda en todas las tallas", (kind) => {
    for (const size of draft(kind).sizes) {
      const d = gradeDoc(draft(kind), size);
      const yoke = named(d, /^Canes/)!, lower = back(d);
      expect(height(yoke), `${kind} ${size}`).toBeGreaterThan(5);
      expect(height(yoke), `${kind} ${size}`).toBeLessThan(11);
      // la costura del canesú: el borde de abajo del canesú mide lo mismo que el de arriba de la espalda
      const ys = samplePath(yoke, 24), ls = samplePath(lower, 24);
      const yb = Math.max(...ys.map((p) => p.y)), lt = Math.min(...ls.map((p) => p.y));
      expect(Math.abs(widthAt(ys, yb - 0.05) - widthAt(ls, lt + 0.05)), `${kind} ${size}`).toBeLessThan(0.3);
      // canesú + espalda baja = la espalda entera (un poco más larga que el delantero por el tiro trasero)
      expect(height(yoke) + height(lower) - height(front(d)), `${kind} ${size}`).toBeLessThan(4);
    }
  });

  it.each(["pantalon-vestir", "bermuda"] as BlockKind[])("%s: el delantero marca el pliegue con dos piquetes en la cintura", (kind) => {
    for (const size of draft(kind).sizes) {
      const f = front(gradeDoc(draft(kind), size));
      const top = Math.min(...f.nodes.map((n) => n.at.y));
      const waistNotches = f.nodes.filter((n) => n.notch && n.at.y < top + 2);
      expect(waistNotches.length, `${kind} ${size}`).toBe(2);
    }
  });

  it("pantalón de vestir: pretina, trabillas, bolsas de bolsillo, vivos y bragueta", () => {
    const d = draft("pantalon-vestir");
    for (const [name, qty] of [
      ["Pretina", 1], ["Trabilla", 6], ["Bolsa de bolsillo lateral", 2], ["Bolsa de bolsillo trasero", 2],
      ["Vivo de bolsillo trasero", 4], ["Vista de bragueta", 1],
    ] as Array<[string, number]>) {
      expect(count(d, name), name).toBe(qty);
    }
  });

  it("bermuda: trae trabillas y bragueta", () => {
    const d = draft("bermuda");
    expect(count(d, "Trabilla")).toBe(6);
    expect(count(d, "Vista de bragueta")).toBe(1);
  });

  it("la pretina mide la cintura más 4 cm de montado (talla base)", () => {
    for (const kind of ["pantalon-denim", "pantalon-vestir", "short", "bermuda"] as BlockKind[]) {
      const p = samplePath(named(draft(kind), /^Pretina/)!, 24);
      const w = Math.max(...p.map((q) => q.x)) - Math.min(...p.map((q) => q.x));
      expect(Math.abs(w - ((defaultMeasurementsFor(kind).cintura ?? 80) + 4)), kind).toBeLessThan(0.1);
    }
  });
});

describe("el resto de prendas según las fotos de referencia", () => {
  const count = (d: PatternDoc, name: string) => d.pieces.filter((p) => p.name === name).reduce((a, p) => a + p.quantity, 0);

  it("falda recta: pretina y abertura trasera de 3 cm", () => {
    const d = draft("falda-recta");
    expect(count(d, "Pretina")).toBe(1);
    const b = samplePath(back(d), 24);
    const hem = Math.max(...b.map((p) => p.y));
    // en la abertura la espalda mide 3 cm más que arriba de ella
    expect(widthAt(b, hem - 3) - widthAt(b, hem - 30)).toBeGreaterThan(2.7);
    expect(widthAt(b, hem - 3) - widthAt(b, hem - 30)).toBeLessThan(3.3);
    expect(back(d).nodes.filter((n) => n.notch).length).toBeGreaterThanOrEqual(2); // cadera + tope de la abertura
  });

  it("falda en A: el bajo mide entre 1.6 y 2.1 veces la cintura (en la foto, ~1.9)", () => {
    for (const size of draft("falda-a").sizes) {
      const d = gradeDoc(draft("falda-a"), size);
      const h = Math.max(...samplePath(front(d), 24).map((p) => p.y)) - Math.min(...samplePath(front(d), 24).map((p) => p.y));
      const ratio = circ(d, h - 1) / netWaist(d);
      expect(ratio, size).toBeGreaterThan(1.6);
      expect(ratio, size).toBeLessThan(2.1);
    }
  });

  it("blusa y vestido: las pinzas de talle son líneas internas que caen dentro del delantero", () => {
    const inside = (piece: Piece, line: Piece) => {
      const host = samplePath(piece, 24);
      return samplePath(line, 24).every((q) => {
        let ins = false;
        for (let i = 0, j = host.length - 1; i < host.length; j = i++) {
          const a = host[i]!, b = host[j]!;
          if (a.y > q.y !== b.y > q.y && q.x < ((b.x - a.x) * (q.y - a.y)) / (b.y - a.y) + a.x) ins = !ins;
        }
        return ins;
      });
    };
    for (const [kind, name, n] of [["blusa-clasica", "Pinza de talle", 1], ["vestido-basico", "Pinza de talle", 2]] as Array<[BlockKind, string, number]>) {
      const d = draft(kind);
      const lines = d.pieces.filter((p) => !p.closed && p.name.startsWith(name));
      expect(lines, kind).toHaveLength(n);
      for (const l of lines) expect(inside(front(d), l), `${kind}: ${l.name}`).toBe(true);
    }
  });

  it.each(["camisa-hombre", "camisa-manga-corta", "blusa-clasica"] as BlockKind[])("%s: el ruedo es curvo (los costados quedan 5-7 cm más arriba que el centro)", (kind) => {
    for (const size of draft(kind).sizes) {
      const d = gradeDoc(draft(kind), size);
      for (const p of [front(d), back(d)]) {
        const ns = p.nodes;
        const maxY = Math.max(...ns.map((n) => n.at.y));
        const center = ns.find((n) => Math.abs(n.at.y - maxY) < 1e-6)!;
        const maxX = Math.max(...ns.map((n) => n.at.x));
        const side = ns.filter((n) => n.at.x > maxX - 1).reduce((a, n) => (n.at.y > a.at.y ? n : a));
        // el delantero de la blusa baja de más en el costado lo que se come la pinza de busto (1-5 cm según la talla): cosida queda a ~6
        const min = kind === "blusa-clasica" && p === front(d) ? 0.5 : 5;
        expect(center.at.y - side.at.y, `${kind} ${size} ${p.name}`).toBeGreaterThan(min);
        expect(center.at.y - side.at.y, `${kind} ${size} ${p.name}`).toBeLessThan(7);
      }
    }
  });

  it("bolsillos que faltaban: jogger (laterales), cargo (delanteros y bragueta), chamarra (laterales con vivo)", () => {
    expect(count(draft("pants-jogger"), "Bolsa de bolsillo lateral")).toBe(2);
    expect(count(draft("pantalon-cargo"), "Bolsa de bolsillo delantero")).toBe(2);
    expect(count(draft("pantalon-cargo"), "Vista de bragueta")).toBe(1);
    expect(count(draft("chamarra-mezclilla"), "Bolsa de bolsillo lateral")).toBe(2);
    expect(count(draft("chamarra-mezclilla"), "Vivo de bolsillo lateral")).toBe(4);
  });
});

describe("las pinzas no le quitan medida a la prenda ya cosida", () => {
  it.each(["falda-recta", "falda-a"] as BlockKind[])("%s: la cintura cosida es la medida de cintura más una holgura de 0 a 6 cm", (kind) => {
    const m = defaultMeasurementsFor(kind);
    const waist = netWaist(draft(kind));
    expect(waist - m.cintura, `${kind}: cintura neta ${waist.toFixed(1)}`).toBeGreaterThanOrEqual(0);
    expect(waist - m.cintura, `${kind}: cintura neta ${waist.toFixed(1)}`).toBeLessThanOrEqual(6);
  });
});
