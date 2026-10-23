// @hilonova/blocks — bloques paramétricos de patronaje.
// Fase 2: el bloque de pantalón denim se GENERA a partir de medidas reales
// (cintura, cadera, tiro, largo, muslo, bajo) siguiendo reglas de patronaje
// industrial. No más polígonos fijos: cambias una medida, cambia el patrón.

import {
  addDart,
  clonePiece,
  contourRun,
  nearestSegment,
  sizeSteps,
  emptyDoc,
  emptyPiece,
  node,
  pieceFromPoints,
  rectPiece,
  type Node,
  type PatternDoc,
  type Piece,
  type Vec2,
} from "@hilonova/geometry";

// ─── tallas ──────────────────────────────────────────────────────────────────
// Las utilidades de tallas viven en @hilonova/geometry (las usa también la
// graduación del motor); se reexportan aquí por compatibilidad.
export { ALPHA_SIZES, sizeSteps, compareSizes } from "@hilonova/geometry";

// ─── medidas de cuerpo ───────────────────────────────────────────────────────

/** Medidas de cuerpo (cm). Reciben lo que el patronista mide con la cinta.
 *  Los campos opcionales se usan según el bloque: pantalón necesita cintura/cadera/tiro,
 *  playera necesita busto/hombro/sisa, falda necesita cintura/cadera/largoFalda, etc. */
export interface BodyMeasurements {
  // ── tronco ──
  busto?: number;         // contorno de busto / pecho
  cintura: number;        // contorno de cintura
  cadera: number;         // contorno de cadera
  hombro?: number;        // ancho de hombro a hombro
  cuello?: number;        // contorno de cuello
  sisa?: number;          // profundidad de sisa
  largoTorso?: number;    // de hombro a cintura (para playera/camisa)
  largoManga?: number;    // de hombro al puño
  // ── pantalón ──
  tiro?: number;          // de cintura a entrepierna
  largo?: number;         // largo total exterior (pantalón)
  muslo?: number;         // contorno de muslo
  bajo?: number;          // abertura del bajo
  // ── falda ──
  largoFalda?: number;    // de cintura al bajo (falda)
}

/** Medidas para la talla base por defecto (32), industria mexicana.
 *  Incluye tronco y pantalón; sirve de arranque para cualquier bloque. */
export const DEFAULT_MEASUREMENTS: BodyMeasurements = {
  busto: 92,
  cintura: 80,
  cadera: 100,
  hombro: 42,
  cuello: 38,
  sisa: 23,
  largoTorso: 42,
  largoManga: 60,
  tiro: 25,
  largo: 104,
  muslo: 56,
  bajo: 19,
  largoFalda: 60,
};

// ─── bloque paramétrico de pantalón denim ────────────────────────────────────

/**
 * Dibuja el delantero y la espalda de un pantalón slim a partir de medidas.
 * Siguiendo convenciones de patronaje industrial: trabaja con 1/4 de los
 * contornos (porque la pieza es la mitad y la cintura/cadera se dividen).
 *
 * Sistema de coordenadas: X derecha hacia fuera (lado), Y abajo (del cuerpo).
 * Origen = esquina superior interior (centro frente / centro espalda).
 */
export function draftPantalonDenim(m: BodyMeasurements): PatternDoc {
  const doc = emptyDoc("Jean Slim · desde medidas");

  // factores de ensanche (ease) propios del patronaje industrial
  const cinturaE = m.cintura + 1;     // +1 cm de ease
  const caderaE = m.cadera + 2;       // +2 cm de ease
  const musloE = (m.muslo ?? m.cadera * 0.56) + 3;
  const bajoE = (m.bajo ?? 19) + 1;

  // cuartos (una pieza es media delantera/espalda, y la cintura/cadera se dividen entre lados)
  const qCintura = cinturaE / 4;
  const qCadera = caderaE / 4;
  // contorno total de la pierna a la altura del muslo y del bajo; delantero 47 %, espalda 53 %
  const hemTotal = bajoE * 2;

  const tiro = m.tiro ?? 25;
  const largo = m.largo ?? 104;
  const yCadera = tiro * 0.78;          // altura de cadera relativa al tiro
  const yEntrepierna = tiro;
  const yRodilla = largo * 0.56;
  const kneeTotal = hemTotal + (musloE - hemTotal) * 0.45;
  // el costado va recto de la cadera al bajo: se interpola para ubicar la rodilla
  const outerAt = (xHip: number, xHem: number, y: number) =>
    xHip + (xHem - xHip) * ((y - yCadera) / (largo - yCadera));

  // ── delantero ─────────────────────────────────────────────────────────────
  const front = emptyPiece("Delantero", 2);
  front.fabric = "mezclilla 12 oz";
  front.seamAllowance = 1;
  front.grainAngle = 0;
  front.nodes = [
    // cintura · lado (origen)
    node({ x: 0, y: 0 }),
    // cintura · centro-frente (ligera inclinación)
    node(
      { x: qCintura, y: 1 },
      { handleIn: { x: -qCintura * 0.3, y: -0.5 }, handleOut: { x: 2, y: 1 } },
    ),
    // cadera lado
    node(
      { x: qCadera, y: yCadera },
      { handleIn: { x: 0, y: -yCadera * 0.3 }, handleOut: { x: 1, y: yCadera * 0.4 } },
    ),
    // bajo exterior
    node({ x: qCadera - 1, y: largo }),
    // bajo interior
    node({ x: qCadera - 1 - hemTotal * 0.47, y: largo }),
    // rodilla interior (ligera curva para muslo)
    node(
      { x: outerAt(qCadera, qCadera - 1, yRodilla) - kneeTotal * 0.47, y: yRodilla },
      {
        handleIn: { x: 0.5, y: (largo - yRodilla) * 0.4 },
        handleOut: { x: -0.5, y: -(yRodilla - yEntrepierna) * 0.4 },
      },
    ),
    // entrepierna (el delantero toma el 47 % del contorno del muslo; sale hacia afuera del centro)
    node(
      { x: qCadera - musloE * 0.47, y: yEntrepierna },
      { handleIn: { x: 1, y: (yEntrepierna - yCadera) * 0.3 }, handleOut: { x: 0.5, y: -4 } },
    ),
    // tiro delantero (curva del tiro al bajar de cintura centro)
    node(
      { x: qCintura * 0.1, y: yCadera * 0.9 },
      {
        handleIn: { x: qCintura * 0.3, y: yEntrepierna * 0.25 },
        handleOut: { x: -0.5, y: -yCadera * 0.4 },
      },
    ),
  ];

  // ── espalda ───────────────────────────────────────────────────────────────
  const back = emptyPiece("Espalda", 2);
  back.fabric = "mezclilla 12 oz";
  back.seamAllowance = 1;
  back.grainAngle = 0;
  const bOff = qCadera + 15;            // desplazamiento horizontal para separarlo del frente
  back.nodes = [
    node({ x: bOff + 0, y: -1.5 }),                                     // cintura lado (sube)
    node(
      { x: bOff + qCintura + 1.5, y: 0.5 },
      { handleIn: { x: -qCintura * 0.35, y: 0 }, handleOut: { x: 2, y: 0.8 } },
    ),                                                                   // cintura centro
    node(
      { x: bOff + qCadera + 1, y: yCadera },
      { handleIn: { x: 0, y: -yCadera * 0.3 }, handleOut: { x: 1, y: yCadera * 0.4 } },
    ),                                                                   // cadera lado
    node({ x: bOff + qCadera - 1, y: largo }),                           // bajo exterior
    node({ x: bOff + qCadera - 1 - hemTotal * 0.53, y: largo }),         // bajo interior
    node(
      { x: bOff + outerAt(qCadera + 1, qCadera - 1, yRodilla) - kneeTotal * 0.53, y: yRodilla },
      {
        handleIn: { x: 0.5, y: (largo - yRodilla) * 0.4 },
        handleOut: { x: -0.5, y: -(yRodilla - yEntrepierna) * 0.4 },
      },
    ),                                                                   // rodilla interior
    node(
      { x: bOff + qCadera + 1 - musloE * 0.53, y: yEntrepierna },
      { handleIn: { x: 1, y: (yEntrepierna - yCadera) * 0.3 }, handleOut: { x: 1.5, y: -6 } },
    ),                                                                   // entrepierna espalda (más abierta)
    node(
      { x: bOff - 2, y: yCadera * 0.85 },
      {
        handleIn: { x: qCintura * 0.4, y: yEntrepierna * 0.3 },
        handleOut: { x: -0.5, y: -yCadera * 0.4 },
      },
    ),                                                                   // tiro trasero (curva más pronunciada)
  ];

  // piquetes industriales: cadera y rodilla
  front.nodes[2] = { ...front.nodes[2]!, notch: true };
  front.nodes[5] = { ...front.nodes[5]!, notch: true };
  back.nodes[2] = { ...back.nodes[2]!, notch: true };
  back.nodes[5] = { ...back.nodes[5]!, notch: true };

  doc.pieces = [front, back];
  return doc;
}

/** Documento demo precargado — ahora derivado del paramétrico con la talla base. */
export function demoJeanDoc(): PatternDoc {
  return draftPantalonDenim(DEFAULT_MEASUREMENTS);
}

// ─── graduación por reglas ───────────────────────────────────────────────────

/**
 * Reglas de graduación industriales para pantalón denim (compatibilidad).
 * Las reglas por bloque viven en `GRADE_RULES` más abajo.
 */
const DELTA_PER_STEP = {
  cintura: 4,
  cadera: 4,
  tiro: 0.5,
  largo: 1,
  muslo: 2,
  bajo: 1,
} as const;

/** Devuelve las medidas para una talla, derivadas de la base + deltas estándar. */
export function measurementsForSize(
  size: string,
  base: BodyMeasurements,
  baseSize: string,
): BodyMeasurements {
  const steps = sizeSteps(size, baseSize);
  return {
    ...base,
    cintura: base.cintura + steps * DELTA_PER_STEP.cintura,
    cadera:  base.cadera  + steps * DELTA_PER_STEP.cadera,
    tiro:    (base.tiro ?? 25)  + steps * DELTA_PER_STEP.tiro,
    largo:   (base.largo ?? 104) + steps * DELTA_PER_STEP.largo,
    muslo:   (base.muslo ?? 56) + steps * DELTA_PER_STEP.muslo,
    bajo:    (base.bajo  ?? 19) + steps * DELTA_PER_STEP.bajo,
  };
}

/**
 * Gradúa el bloque de pantalón denim para una lista de tallas.
 * Devuelve un `PatternDoc` por talla; para la base conserva las medidas tal cual.
 */
export function graduatePantalon(
  base: BodyMeasurements,
  baseSize: string,
  sizes: readonly string[],
): Array<{ size: string; doc: PatternDoc }> {
  return sizes.map((size) => ({
    size,
    doc: draftPantalonDenim(measurementsForSize(size, base, baseSize)),
  }));
}

// ─── bloque de playera básica (cuello redondo) ──────────────────────────────

/** Playera básica unisex: frente, espalda y manga.
 *  Usa busto/hombro/sisa/largoTorso/largoManga/cuello. */
export function draftPlayeraBasica(m: BodyMeasurements): PatternDoc {
  const doc = emptyDoc("Playera básica · desde medidas");

  const bustoE = (m.busto ?? m.cadera * 0.92) + 4;      // +4 cm ease
  const hombro = m.hombro ?? 42;
  const sisa = m.sisa ?? 23;
  const largoT = m.largoTorso ?? 42;
  const largoManga = m.largoManga ?? 60;
  const cuello = m.cuello ?? 38;
  const largoTot = largoT + 24;                          // de hombro al bajo (+ caída)

  const qBusto = bustoE / 4;
  const hombroMedio = hombro / 2;
  const anchoCuello = cuello / 6 + 0.5;                  // escote cuello T
  const profundidadCuello = anchoCuello + 1.2;

  // ── frente ─────────────────────────────────────────────────────────────────
  const front = emptyPiece("Delantero playera", 2);
  front.fabric = "jersey algodón 180 gsm";
  front.seamAllowance = 1;
  front.grainAngle = 0;
  front.nodes = [
    // escote centro-frente
    node({ x: 0, y: profundidadCuello }),
    // hombro cuello
    node(
      { x: anchoCuello, y: 0 },
      { handleIn: { x: -anchoCuello * 0.4, y: -profundidadCuello * 0.4 }, handleOut: { x: 2, y: 0 } },
    ),
    // hombro lado
    node({ x: hombroMedio, y: 2 }),
    // sisa inicio
    node(
      { x: qBusto, y: sisa },
      { handleIn: { x: 0, y: -sisa * 0.4 }, handleOut: { x: 0, y: 1.5 } },
    ),
    // costado bajo
    node({ x: qBusto, y: largoTot }),
    // bajo centro
    node({ x: 0, y: largoTot }),
  ];
  front.closed = true;

  // ── espalda ────────────────────────────────────────────────────────────────
  const back = emptyPiece("Espalda playera", 2);
  back.fabric = "jersey algodón 180 gsm";
  back.seamAllowance = 1;
  back.grainAngle = 0;
  const bOff = qBusto + 10;
  back.nodes = [
    node({ x: bOff + 0, y: anchoCuello * 0.5 }),  // escote centro-espalda (más subido)
    node(
      { x: bOff + anchoCuello, y: 0 },
      { handleIn: { x: -anchoCuello * 0.3, y: -anchoCuello * 0.3 }, handleOut: { x: 2, y: 0 } },
    ),
    node({ x: bOff + hombroMedio, y: 2 }),
    node(
      { x: bOff + qBusto, y: sisa },
      { handleIn: { x: 0, y: -sisa * 0.4 }, handleOut: { x: 0, y: 1.5 } },
    ),
    node({ x: bOff + qBusto, y: largoTot }),
    node({ x: bOff + 0, y: largoTot }),
  ];
  back.closed = true;

  // ── manga corta ────────────────────────────────────────────────────────────
  // cae a ~37 % del largo del brazo (22 cm con el brazo de 60) y su cabeza se ajusta a la sisa
  const sleeveLen = clamp(largoManga * 0.37, 18, 26);
  const bicepP = (m.busto ?? m.cadera * 0.92) * 0.3 + 4;
  const armLen = pathLen([front.nodes[2]!, front.nodes[3]!]) + pathLen([back.nodes[2]!, back.nodes[3]!]);
  const sleeveRaw = fitSleeve(bicepP, sleeveLen, bicepP * 0.9, armLen + 0.5, sisa * 1.2);
  const sw = nodesWidth(sleeveRaw);
  const sOff = bOff + qBusto + 12;
  const sleeve = mk("Manga", 2, "jersey algodón 180 gsm", shiftNodes(sleeveRaw, sOff - sw.min, 0));
  sleeve.seamAllowance = 1;
  sleeve.grainAngle = 0;

  // ── cuello de rib: una tira que se dobla; mide ~85 % del escote para que abrace ────────
  const neckLen = 2 * (pathLen([front.nodes[0]!, front.nodes[1]!]) + pathLen([back.nodes[0]!, back.nodes[1]!]));
  const rib = rectPiece("Cuello de rib", { x: sOff + (sw.max - sw.min) + 10, y: 0 }, { x: sOff + (sw.max - sw.min) + 10 + neckLen * 0.85, y: 5 });
  rib.quantity = 1;
  rib.fabric = "rib 1x1";

  front.nodes[2] = { ...front.nodes[2]!, notch: true };  // piquete hombro
  front.nodes[3] = { ...front.nodes[3]!, notch: true };  // piquete sisa
  back.nodes[3] = { ...back.nodes[3]!, notch: true };
  sleeve.nodes[0] = { ...sleeve.nodes[0]!, notch: true };// cumbre de manga

  doc.pieces = [front, back, sleeve, rib];
  return doc;
}

// ─── bloque de falda recta ──────────────────────────────────────────────────

/** Falda recta clásica con pinzas (frente/espalda). Usa cintura/cadera/largoFalda. */
export function draftFaldaRecta(m: BodyMeasurements): PatternDoc {
  const doc = emptyDoc("Falda recta · desde medidas");

  const cinturaE = m.cintura + 1;
  const caderaE = m.cadera + 2;
  const largoF = m.largoFalda ?? 60;
  const altCadera = 20;                                  // ~20 cm bajo cintura

  const qCintura = cinturaE / 4;
  const qCadera = caderaE / 4;

  // ── frente ─────────────────────────────────────────────────────────────────
  const front = emptyPiece("Delantero falda", 2);
  front.fabric = "gabardina stretch";
  front.seamAllowance = 1;
  front.grainAngle = 0;
  front.nodes = [
    node({ x: 0, y: 0 }),                                // centro-frente cintura
    node({ x: qCintura, y: 0 }),                         // cintura lado
    node(
      { x: qCadera, y: altCadera },
      { handleIn: { x: 0, y: -altCadera * 0.4 }, handleOut: { x: 0, y: 1 } },
    ),                                                    // cadera lado
    node({ x: qCadera, y: largoF }),                     // bajo lado
    node({ x: 0, y: largoF }),                           // bajo centro-frente
  ];
  front.closed = true;

  // ── espalda ────────────────────────────────────────────────────────────────
  const back = emptyPiece("Espalda falda", 2);
  back.fabric = "gabardina stretch";
  back.seamAllowance = 1;
  back.grainAngle = 0;
  const bOff = qCadera + 12;
  back.nodes = [
    node({ x: bOff + 0, y: 0 }),
    node({ x: bOff + qCintura, y: 0 }),
    node(
      { x: bOff + qCadera, y: altCadera },
      { handleIn: { x: 0, y: -altCadera * 0.4 }, handleOut: { x: 0, y: 1 } },
    ),
    node({ x: bOff + qCadera, y: largoF }),
    node({ x: bOff + 0, y: largoF }),
  ];
  back.closed = true;

  front.nodes[2] = { ...front.nodes[2]!, notch: true };
  back.nodes[2] = { ...back.nodes[2]!, notch: true };

  // pinzas de cintura: 1 en el delantero y 1 en la espalda por mitad; absorben la diferencia con la cadera
  const dartDiff = qCadera - qCintura;
  const wF = clamp(dartDiff * 0.4, 1.2, 3);
  const wB = clamp(dartDiff * 0.55, 1.5, 3.5);
  front.nodes = dartAt(front, { x: qCintura * 0.5, y: 0 }, wF, { x: qCintura * 0.5, y: 9 }).nodes;
  back.nodes = dartAt(back, { x: bOff + qCintura * 0.5, y: 0 }, wB, { x: bOff + qCintura * 0.5, y: 12 }).nodes;

  doc.pieces = [front, back];
  return doc;
}

// ─── bloque de pantalón de vestir (bajo recto, pinzas) ──────────────────────

/** Variante del pantalón: bajo recto parejo al muslo (vestir) en lugar de slim. */
export function draftPantalonVestir(m: BodyMeasurements): PatternDoc {
  // Reutilizamos el denim pero con el bajo casi igual al muslo (= pierna recta).
  // `bajo` es la mitad del contorno del bajo: 0.9 × el muslo, entre dos.
  const bajoRecto = ((m.muslo ?? m.cadera * 0.56) * 0.45);
  const doc = draftPantalonDenim({ ...m, bajo: bajoRecto });
  doc.name = "Pantalón vestir · desde medidas";
  for (const p of doc.pieces) p.fabric = "gabardina 240 gsm";
  return doc;
}

// ─── bloque de blusa clásica (camisera, manga larga con puño) ───────────────

/** Arma una pieza simétrica completa a partir de su mitad derecha.
 *  `half` va del centro-arriba (x=0) al centro-abajo (x=0); el primer y el
 *  último nodo deben estar sobre x=0. */
function fullFromHalf(half: Node[]): Node[] {
  const head = half.map((n, i) =>
    i === 0 && n.handleOut
      ? { ...n, handleIn: { x: -n.handleOut.x, y: n.handleOut.y } }
      : n,
  );
  const mirrored = half
    .slice(1, -1)
    .map((n) => {
      const extra: Partial<Omit<Node, "id" | "at">> = {};
      if (n.notch) extra.notch = true;
      if (n.handleOut) extra.handleIn = { x: -n.handleOut.x, y: n.handleOut.y };
      if (n.handleIn) extra.handleOut = { x: -n.handleIn.x, y: n.handleIn.y };
      return node({ x: -n.at.x, y: n.at.y }, extra);
    })
    .reverse();
  return [...head, ...mirrored];
}

const shiftNodes = (nodes: Node[], dx: number, dy: number): Node[] =>
  nodes.map((n) => ({ ...n, at: { x: n.at.x + dx, y: n.at.y + dy } }));

const nodesWidth = (nodes: Node[]): { min: number; max: number } => {
  const xs = nodes.map((n) => n.at.x);
  return { min: Math.min(...xs), max: Math.max(...xs) };
};

/**
 * Blusa clásica de manga larga con puño y cuello camisero. 7 piezas:
 * delantero (×2, con extensión de abotonadura), espalda (×1, completa),
 * manga (×2), cuello (×2), pie de cuello (×2), puño (×2) y vista (×2).
 *
 * Usa busto, cintura, cadera, hombro, cuello, sisa, largoTorso y largoManga.
 * Talla base M; gama S · M · L · XL. Es un bloque base de partida: la
 * holgura y las curvas se calibran con el patronista.
 */
export function draftBlusaClasica(m: BodyMeasurements): PatternDoc {
  const doc = emptyDoc("Blusa clásica · desde medidas");
  doc.baseSize = "M";
  doc.sizes = ["S", "M", "L", "XL"];

  const busto = m.busto ?? 92;
  const hombro = m.hombro ?? 42;
  const sisa = m.sisa ?? 23;
  const largoT = m.largoTorso ?? 42;
  const largoManga = m.largoManga ?? 60;
  const cuello = m.cuello ?? 38;

  // holguras (cm) sobre contorno completo, para tejido plano
  const q = (busto + 8) / 4;
  const qF = q - 0.5;                    // el delantero toma un poco menos que la espalda
  const qB = q + 0.5;
  const qWF = (m.cintura + 8) / 4 - 0.5;
  const qWB = (m.cintura + 8) / 4 + 0.5;
  const qHF = (m.cadera + 8) / 4 - 0.5;
  const qHB = (m.cadera + 8) / 4 + 0.5;
  const sx = hombro / 2;                 // punta de hombro
  const hemY = largoT + 18;              // largo total desde el hombro-cuello

  const nF = cuello / 6 + 0.5;           // ancho de escote
  const dF = nF + 1.7;                   // profundidad escote delantero
  const nB = nF + 0.3;
  const dB = 2;
  const dropF = 4.5;                     // caída de hombro
  const dropB = 4.2;
  const ext = 2;                         // extensión de abotonadura

  const FABRIC = "popelina 120 hilos";

  // ── delantero (mitad derecha + extensión) ─────────────────────────────────
  const front = emptyPiece("Delantero", 2);
  front.fabric = FABRIC;
  front.nodes = [
    node({ x: -ext, y: dF }),
    node({ x: 0, y: dF }, { notch: true, handleOut: { x: nF * 0.55, y: 0 } }),
    node({ x: nF, y: 0 }, { notch: true, handleIn: { x: 0, y: dF * 0.55 } }),
    node({ x: sx, y: dropF }, { handleOut: { x: -0.8, y: 3.5 } }),
    node(
      { x: sx - 1, y: dropF + (sisa - dropF) * 0.55 },
      { handleIn: { x: 0, y: -3 }, handleOut: { x: 0, y: 3 } },
    ),
    node({ x: qF, y: sisa }, { notch: true, handleIn: { x: -2.5, y: -1.5 } }),
    node({ x: qWF, y: largoT }),
    node({ x: qHF, y: hemY }),
    node({ x: -ext, y: hemY }),
  ];

  // pinza de busto en el costado (la mitad izquierda sale igual porque el delantero va ×2)
  {
    const sDart = clamp(8 / Math.max(1, largoT - sisa), 0.15, 0.6);
    front.nodes = dartAt(
      front,
      { x: qF + (qWF - qF) * sDart, y: sisa + (largoT - sisa) * sDart },
      bustDartWidth(busto),
      { x: qF * 0.45, y: sisa + 5 },
    ).nodes;
  }

  // ── espalda (completa, simétrica) ─────────────────────────────────────────
  const back = emptyPiece("Espalda", 1);
  back.fabric = FABRIC;
  back.nodes = fullFromHalf([
    node({ x: 0, y: dB }, { notch: true, handleOut: { x: nB * 0.55, y: 0 } }),
    node({ x: nB, y: 0 }, { notch: true, handleIn: { x: 0, y: dB * 0.55 } }),
    node({ x: sx, y: dropB }, { handleOut: { x: -0.8, y: 3.5 } }),
    node(
      { x: sx - 0.8, y: dropB + (sisa - dropB) * 0.55 },
      { handleIn: { x: 0, y: -3 }, handleOut: { x: 0, y: 3 } },
    ),
    node({ x: qB, y: sisa }, { notch: true, handleIn: { x: -2.5, y: -1.5 } }),
    node({ x: qWB, y: largoT }),
    node({ x: qHB, y: hemY }),
    node({ x: 0, y: hemY }, { notch: true }),
  ]);

  // ── manga larga ───────────────────────────────────────────────────────────
  const bicep = busto * 0.29 + 6;        // ancho de manga a la sisa
  const capH = sisa * 0.6;               // altura de cabeza de manga
  const cuffL = 23;                      // largo del puño
  const cuffH = 6;                       // alto del puño
  const sleeveLen = largoManga - cuffH;
  const wrist = cuffL + 1;               // abertura de manga (con fruncido leve)
  const sleeve = emptyPiece("Manga", 2);
  sleeve.fabric = FABRIC;
  // la cabeza mide la sisa (delantera + trasera) más 2.5 cm de holgura
  const armLen = pathLen(front.nodes.slice(3, 6)) + pathLen(back.nodes.slice(2, 5));
  sleeve.nodes = fitSleeve(bicep, sleeveLen, wrist, armLen + 2.5, sisa * 1.2);
  void capH;

  // ── cuello camisero (hoja) y pie de cuello ────────────────────────────────
  const lc = cuello / 2 + 0.5;
  const collar = emptyPiece("Cuello", 2);
  collar.fabric = FABRIC;
  collar.nodes = fullFromHalf([
    node({ x: 0, y: 0 }, { notch: true, handleOut: { x: lc * 0.5, y: 0.2 } }),
    node({ x: lc, y: 1 }, { handleIn: { x: -lc * 0.35, y: 0 } }),
    node({ x: lc + 0.5, y: 7 }, { handleOut: { x: -lc * 0.3, y: 0.9 } }),
    node({ x: 0, y: 5.5 }, { notch: true, handleIn: { x: lc * 0.3, y: 0.2 } }),
  ]);

  const stand = emptyPiece("Pie de cuello", 2);
  stand.fabric = FABRIC;
  stand.nodes = fullFromHalf([
    node({ x: 0, y: 0 }, { notch: true, handleOut: { x: lc * 0.5, y: 0.2 } }),
    node({ x: lc + 1.5, y: -0.3 }),
    node({ x: lc + 1.5, y: 3.2 }),
    node({ x: 0, y: 3.5 }, { notch: true, handleIn: { x: lc * 0.5, y: 0.1 } }),
  ]);

  // ── puño y vista ──────────────────────────────────────────────────────────
  const cuff = emptyPiece("Puño", 2);
  cuff.fabric = FABRIC;
  cuff.nodes = [
    node({ x: 0, y: 0 }, { notch: true }),
    node({ x: cuffL, y: 0 }),
    node({ x: cuffL, y: cuffH }),
    node({ x: 0, y: cuffH }),
  ];

  const facing = emptyPiece("Vista", 2);
  facing.fabric = FABRIC;
  facing.nodes = [
    node({ x: -ext, y: dF }),
    node({ x: 3.2, y: dF - 2.6 }),
    node({ x: 3.2, y: hemY }),
    node({ x: -ext, y: hemY }),
  ];

  // ── distribución sobre la mesa (sin empalmes) ─────────────────────────────
  const gap = 8;
  let cursor = 0;
  const place = (p: Piece, y: number): void => {
    const { min, max } = nodesWidth(p.nodes);
    p.nodes = shiftNodes(p.nodes, cursor - min, y);
    cursor += max - min + gap;
  };
  place(front, 0);
  place(back, 0);
  place(sleeve, 0);
  cursor = 0;
  const row2 = hemY + gap;
  place(collar, row2);
  place(stand, row2);
  place(cuff, row2);
  place(facing, row2);

  doc.pieces = [front, back, sleeve, collar, stand, cuff, facing];
  return doc;
}

// ─── ayudas compartidas por las prendas nuevas ──────────────────────────────

const SML_SIZES = ["S", "M", "L", "XL"];

/** Pone la gama S-M-L-XL con base M (prendas de tronco, vestidos, jogger…). */
function withSml(doc: PatternDoc): PatternDoc {
  doc.sizes = [...SML_SIZES];
  doc.baseSize = "M";
  return doc;
}

interface Torso {
  busto: number;
  q: number;
  qF: number;
  qB: number;
  hombro: number;
  sisa: number;
  largoT: number;
  largoManga: number;
  cuello: number;
}

/** Medidas de tronco con holgura `ease` sobre el contorno de busto. */
function torsoOf(m: BodyMeasurements, ease: number): Torso {
  const busto = m.busto ?? 92;
  const q = (busto + ease) / 4;
  return {
    busto,
    q,
    qF: q - 0.5,
    qB: q + 0.5,
    hombro: m.hombro ?? 42,
    sisa: m.sisa ?? 23,
    largoT: m.largoTorso ?? 42,
    largoManga: m.largoManga ?? 60,
    cuello: m.cuello ?? 38,
  };
}

/** Hombro y sisa: de la punta de hombro al fondo de la sisa. `inset` mete la curva hacia el cuerpo. */
function armholeNodes(sx: number, drop: number, qx: number, sisa: number, inset: number): Node[] {
  return [
    node({ x: sx, y: drop }, { handleOut: { x: -0.8, y: 3.5 } }),
    node(
      { x: sx - inset, y: drop + (sisa - drop) * 0.55 },
      { handleIn: { x: 0, y: -3 }, handleOut: { x: 0, y: 3 } },
    ),
    node({ x: qx, y: sisa }, { notch: true, handleIn: { x: -2.5, y: -1.5 } }),
  ];
}

/** Manga de una pieza (cabeza + caída), con el centro de la cabeza en x=0. */
function sleeveNodes(bicep: number, capH: number, len: number, wrist: number): Node[] {
  return [
    node({ x: 0, y: 0 }, { notch: true, handleIn: { x: -bicep * 0.28, y: 0 }, handleOut: { x: bicep * 0.28, y: 0 } }),
    node({ x: bicep / 2, y: capH }, { notch: true, handleIn: { x: -bicep * 0.05, y: -capH * 0.55 } }),
    node({ x: wrist / 2, y: len }),
    node({ x: -wrist / 2, y: len }),
    node({ x: -bicep / 2, y: capH }, { notch: true, handleOut: { x: bicep * 0.05, y: -capH * 0.55 } }),
  ];
}

/**
 * Abre una pinza en el contorno de `piece` cerca de `near` (la boca) con la punta en `apex`.
 * Si la boca no cabe en ese tramo, devuelve la pieza sin cambios.
 */
function dartAt(piece: Piece, near: Vec2, width: number, apex: Vec2): Piece {
  const hit = nearestSegment(piece, near);
  if (!hit) return piece;
  return addDart(piece, hit.segIndex, hit.t, width, apex) ?? piece;
}

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

/** Ancho de la pinza de busto según el contorno de busto (más busto, más pinza). */
const bustDartWidth = (busto: number): number => clamp(2 + (busto - 88) * 0.15, 1.5, 6);

/** Largo (cm) del contorno que recorren estos nodos, de uno a otro. */
function pathLen(nodes: Node[]): number {
  if (nodes.length < 2) return 0;
  const tmp = { ...emptyPiece("tmp"), closed: false, nodes };
  return contourRun(tmp, nodes[0]!.id, nodes[nodes.length - 1]!.id)?.length ?? 0;
}

/**
 * Manga de una pieza cuya cabeza mide `target` cm (sisa + holgura). Ajusta la altura de la
 * cabeza por bisección (más alta = cabeza más larga) sin pasar del 62 % del largo de la
 * manga; si aun así no alcanza, ensancha la manga. Así encaja en la sisa de cualquier
 * talla y medida, en vez de depender de una proporción fija.
 */
function fitSleeve(bicep: number, len: number, wrist: number, target: number, maxCap: number): Node[] {
  // longitud de la cabeza (por arriba: sisa izquierda → cumbre → sisa derecha)
  const capLen = (b: number, capH: number): number => {
    const ns = sleeveNodes(b, capH, len, wrist);
    return pathLen([ns[4]!, ns[0]!, ns[1]!]);
  };
  const lo = 0.5;
  const hi = Math.min(maxCap, len * 0.62);
  let b = bicep;
  for (let i = 0; i < 120 && capLen(b, hi) < target; i++) b *= 1.01;
  if (capLen(b, lo) > target) return sleeveNodes(b, lo, len, wrist);
  let a = lo;
  let c = hi;
  for (let i = 0; i < 40; i++) {
    const mid = (a + c) / 2;
    if (capLen(b, mid) < target) a = mid; else c = mid;
  }
  return sleeveNodes(b, (a + c) / 2, len, wrist);
}

/** Hoja de cuello camisero completa (simétrica). */
function collarNodes(lc: number, h: number): Node[] {
  return fullFromHalf([
    node({ x: 0, y: 0 }, { notch: true, handleOut: { x: lc * 0.5, y: 0.2 } }),
    node({ x: lc, y: 1 }, { handleIn: { x: -lc * 0.35, y: 0 } }),
    node({ x: lc + 0.5, y: h }, { handleOut: { x: -lc * 0.3, y: 0.9 } }),
    node({ x: 0, y: h - 1.5 }, { notch: true, handleIn: { x: lc * 0.3, y: 0.2 } }),
  ]);
}

/** Pieza con nombre, cantidad, tela y nodos listos. */
function mk(name: string, qty: number, fabric: string, nodes: Node[], closed = true): Piece {
  const p = emptyPiece(name, qty);
  p.fabric = fabric;
  p.nodes = nodes;
  p.closed = closed;
  if (!closed) p.seamAllowance = 0;
  return p;
}

/** Reparte las piezas sobre la mesa: una fila por grupo, sin empalmes. */
function layoutRows(rows: Piece[][], gap = 8): Piece[] {
  const out: Piece[] = [];
  let y = 0;
  for (const row of rows) {
    let x = 0;
    let rowH = 0;
    for (const p of row) {
      const xs = p.nodes.map((n) => n.at.x);
      const ys = p.nodes.map((n) => n.at.y);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      p.nodes = shiftNodes(p.nodes, x - minX, y - minY);
      x += maxX - minX + gap;
      rowH = Math.max(rowH, maxY - minY);
      out.push(p);
    }
    y += rowH + gap;
  }
  return out;
}

// ─── chamarra de mezclilla (trucker) ────────────────────────────────────────

/** Chamarra de mezclilla con faja, bolsillos de pecho con solapa, cuello y puños. 9 piezas. */
export function draftChamarraMezclilla(m: BodyMeasurements): PatternDoc {
  const doc = withSml(emptyDoc("Chamarra de mezclilla · desde medidas"));
  const F = "mezclilla 12 oz";
  const t = torsoOf(m, 14);
  const sx = t.hombro / 2 + 0.5;
  const nF = t.cuello / 6 + 1;
  const dF = nF + 2.5;
  const nB = nF + 0.3;
  const dB = 2.5;
  const ext = 2.5;                       // extensión de abotonadura
  const under = t.sisa + 1.5;            // fondo de sisa (chamarra: más holgado)
  const hemY = t.largoT + 8;             // el cuerpo termina donde empieza la faja

  const front = mk("Delantero", 2, F, [
    node({ x: -ext, y: dF }),
    node({ x: 0, y: dF }, { notch: true, handleOut: { x: nF * 0.55, y: 0 } }),
    node({ x: nF, y: 0 }, { notch: true, handleIn: { x: 0, y: dF * 0.55 } }),
    ...armholeNodes(sx, 4.5, t.qF, under, 1),
    node({ x: t.qF, y: hemY }),
    node({ x: -ext, y: hemY }),
  ]);
  const back = mk("Espalda", 1, F, fullFromHalf([
    node({ x: 0, y: dB }, { notch: true, handleOut: { x: nB * 0.55, y: 0 } }),
    node({ x: nB, y: 0 }, { notch: true, handleIn: { x: 0, y: dB * 0.55 } }),
    ...armholeNodes(sx, 4.2, t.qB, under, 0.8),
    node({ x: t.qB, y: hemY }),
    node({ x: 0, y: hemY }, { notch: true }),
  ]));

  const bicep = t.busto * 0.3 + 8;
  const wrist = 24;
  const armLen = pathLen(armholeNodes(sx, 4.5, t.qF, under, 1)) + pathLen(armholeNodes(sx, 4.2, t.qB, under, 0.8));
  const sleeve = mk("Manga", 2, F, fitSleeve(bicep, t.largoManga - 7, wrist, armLen + 3, under * 1.2));
  // el cuello se cose a todo el escote: delantero (×2) + espalda (×2 medios arcos)
  const neckLen = 2 * (pathLen([front.nodes[1]!, front.nodes[2]!]) + pathLen([back.nodes[0]!, back.nodes[1]!]));
  const collar = mk("Cuello", 2, F, collarNodes(neckLen / 2, 7.5));
  const cuff = rectPiece("Puño", { x: 0, y: 0 }, { x: wrist, y: 7 });
  cuff.quantity = 2; cuff.fabric = F;
  const fajaF = rectPiece("Faja delantera", { x: 0, y: 0 }, { x: t.qF + ext, y: 6 });
  fajaF.quantity = 2; fajaF.fabric = F;
  const fajaB = rectPiece("Faja espalda", { x: 0, y: 0 }, { x: t.qB * 2, y: 6 });
  fajaB.quantity = 1; fajaB.fabric = F;
  const pocket = pieceFromPoints(
    "Bolsillo de pecho",
    [{ x: 0, y: 0 }, { x: 12, y: 0 }, { x: 12, y: 11 }, { x: 6, y: 14 }, { x: 0, y: 11 }],
    { closed: true, smooth: false, quantity: 2 },
  );
  pocket.fabric = F;
  const flap = pieceFromPoints(
    "Solapa",
    [{ x: 0, y: 0 }, { x: 12, y: 0 }, { x: 12, y: 4 }, { x: 6, y: 6 }, { x: 0, y: 4 }],
    { closed: true, smooth: false, quantity: 2 },
  );
  flap.fabric = F;

  doc.pieces = layoutRows([[front, back, sleeve], [collar, cuff, fajaF, fajaB], [pocket, flap]]);
  return doc;
}

// ─── pantalones cortos, bermuda y jogger ────────────────────────────────────

interface TrouserOpts {
  name: string;
  fabric: string;
  hipEase: number;
  thighEase: number;
  extras?: (c: { qW: number; hemTotal: number; cintura: number }) => Piece[];
  /** pinza de cintura en la espalda */
  backDart?: boolean;
}

/**
 * Delantero y espalda de un pantalón recto o ahusado, de cualquier largo.
 * `muslo` es el contorno del muslo y `bajo` la mitad del contorno del bajo.
 * La anchura de cada pieza sale de repartir el contorno entre delantero (47 %)
 * y espalda (53 %). Sin pinzas: la curva de cadera absorbe la diferencia con la cintura.
 */
function draftTrouser(m: BodyMeasurements, o: TrouserOpts): PatternDoc {
  const doc = emptyDoc(o.name);
  const tiro = m.tiro ?? 25;
  const largo = m.largo ?? 60;
  const qW = (m.cintura + 1) / 4;
  const qH = (m.cadera + o.hipEase) / 4;
  const thighTotal = (m.muslo ?? 58) + o.thighEase;
  const hemTotal = (m.bajo ?? 28) * 2;
  const yHip = tiro * 0.75;
  const yFork = tiro * 0.55;

  const frontCrotchX = qH - thighTotal * 0.47;
  const frontHemOut = qH + 0.5;
  const frontHemIn = frontHemOut - hemTotal * 0.47;
  const front = mk("Delantero", 2, o.fabric, [
    node({ x: 0, y: 0 }),
    node({ x: qW, y: 0 }, { handleOut: { x: 0.5, y: yHip * 0.4 } }),
    node({ x: qH, y: yHip }, { notch: true, handleIn: { x: -1, y: -yHip * 0.4 } }),
    node({ x: frontHemOut, y: largo }),
    node({ x: frontHemIn, y: largo }),
    node({ x: frontCrotchX, y: tiro }, { notch: true, handleOut: { x: -frontCrotchX * 0.6, y: 0 } }),
    node({ x: 0, y: yFork }, { handleIn: { x: 0, y: (tiro - yFork) * 0.5 } }),
  ]);

  const qHb = qH + 0.5;
  const backCrotchX = qHb - thighTotal * 0.53;
  const backHemOut = qHb + 0.5;
  const backHemIn = backHemOut - hemTotal * 0.53;
  const back = mk("Espalda", 2, o.fabric, [
    node({ x: -3, y: -2.5 }),
    node({ x: qW + 1.5 - 3, y: -0.5 }, { handleOut: { x: 0.5, y: yHip * 0.4 } }),
    node({ x: qHb, y: yHip }, { notch: true, handleIn: { x: -1, y: -yHip * 0.4 } }),
    node({ x: backHemOut, y: largo }),
    node({ x: backHemIn, y: largo }),
    node({ x: backCrotchX, y: tiro }, { notch: true, handleOut: { x: (-1.5 - backCrotchX) * 0.6, y: 0 } }),
    node({ x: -1.5, y: yFork }, { handleIn: { x: 0, y: (tiro - yFork) * 0.5 } }),
  ]);

  if (o.backDart) {
    // el borde de cintura de la espalda va de (-3, -2.5) a (qW - 1.5, -0.5): la pinza cae al 45 % del borde
    const bx = -3 + (qW - 1.5 + 3) * 0.45;
    const by = -2.5 + 2 * 0.45;
    back.nodes = dartAt(back, { x: bx, y: by }, clamp((qH - qW) * 0.5, 1.5, 3.5), { x: bx, y: by + 12 }).nodes;
  }

  const extras = o.extras ? o.extras({ qW, hemTotal, cintura: m.cintura }) : [];
  doc.pieces = layoutRows([[front, back], extras]);
  return doc;
}

/** Short de mezclilla: pierna recta, largo corto. */
export function draftShort(m: BodyMeasurements): PatternDoc {
  return draftTrouser(m, {
    name: "Short · desde medidas",
    fabric: "mezclilla 10 oz",
    hipEase: 4,
    thighEase: 4,
    extras: ({ cintura }) => [
      withQty(rectPiece("Pretina", { x: 0, y: 0 }, { x: cintura + 4, y: 8 }), 1, "mezclilla 10 oz"),
      withQty(
        pieceFromPoints(
          "Bolsillo trasero",
          [{ x: 0, y: 0 }, { x: 14, y: 0 }, { x: 14, y: 12 }, { x: 7, y: 16 }, { x: 0, y: 12 }],
          { closed: true, smooth: false },
        ),
        2,
        "mezclilla 10 oz",
      ),
    ],
  });
}

/** Bermuda: pierna recta a la rodilla, en gabardina. */
export function draftBermuda(m: BodyMeasurements): PatternDoc {
  return draftTrouser(m, {
    name: "Bermuda · desde medidas",
    fabric: "gabardina 240 gsm",
    hipEase: 5,
    thighEase: 5,
    backDart: true,
    extras: ({ cintura }) => [
      withQty(rectPiece("Pretina", { x: 0, y: 0 }, { x: cintura + 4, y: 8 }), 1, "gabardina 240 gsm"),
      withQty(rectPiece("Bolsillo", { x: 0, y: 0 }, { x: 16, y: 18 }), 4, "forro de bolsillo"),
    ],
  });
}

/** Pants jogger: pierna ahusada con puño de tobillo y pretina de elástico. */
export function draftPantsJogger(m: BodyMeasurements): PatternDoc {
  const doc = draftTrouser(m, {
    name: "Pants jogger · desde medidas",
    fabric: "french terry 280 gsm",
    hipEase: 8,
    thighEase: 8,
    extras: ({ cintura, hemTotal }) => [
      withQty(rectPiece("Pretina elástica", { x: 0, y: 0 }, { x: cintura + 2, y: 8 }), 1, "french terry 280 gsm"),
      withQty(rectPiece("Puño de tobillo", { x: 0, y: 0 }, { x: hemTotal * 0.8, y: 9 }), 2, "rib 1x1"),
    ],
  });
  return withSml(doc);
}

// ─── falda en A ──────────────────────────────────────────────────────────────

/** Falda en A con delantero al doblez, espalda con cierre en el centro y pretina. */
export function draftFaldaA(m: BodyMeasurements): PatternDoc {
  const doc = withSml(emptyDoc("Falda en A · desde medidas"));
  const F = "gabardina stretch";
  const largoF = m.largoFalda ?? 55;
  const qW = (m.cintura + 2) / 4;
  const qH = (m.cadera + 4) / 4;
  const hipY = 18;
  const qHem = qH + largoF * 0.12;       // vuelo de la A

  const front = mk("Delantero", 1, F, fullFromHalf([
    node({ x: 0, y: 0 }, { notch: true }),
    node({ x: qW, y: 0 }),
    node({ x: qH, y: hipY }, { notch: true, handleIn: { x: -0.5, y: -hipY * 0.35 } }),
    node({ x: qHem, y: largoF }),
    node({ x: 0, y: largoF + 0.8 }, { notch: true }),
  ]));
  const back = mk("Espalda", 2, F, [
    node({ x: 0, y: 0 }, { notch: true }),
    node({ x: qW + 0.5, y: 0 }),
    node({ x: qH + 0.5, y: hipY }, { notch: true, handleIn: { x: -0.5, y: -hipY * 0.35 } }),
    node({ x: qHem + 0.5, y: largoF }),
    node({ x: 0, y: largoF }),
  ]);
  const waistband = rectPiece("Pretina", { x: 0, y: 0 }, { x: m.cintura + 4, y: 6 });
  waistband.quantity = 1; waistband.fabric = F;

  // pinzas de cintura: 2 en el delantero (una por lado del doblez) y 1 por mitad en la espalda
  const dartDiff = qH - qW;
  const wF = clamp(dartDiff * 0.4, 1.2, 3);
  const wB = clamp(dartDiff * 0.55, 1.5, 3.5);
  for (const sign of [1, -1]) {
    front.nodes = dartAt(front, { x: sign * qW * 0.5, y: 0 }, wF, { x: sign * qW * 0.5, y: 9 }).nodes;
  }
  back.nodes = dartAt(back, { x: (qW + 0.5) * 0.5, y: 0 }, wB, { x: (qW + 0.5) * 0.5, y: 12 }).nodes;

  doc.pieces = layoutRows([[front, back], [waistband]]);
  return doc;
}

// ─── vestido básico ──────────────────────────────────────────────────────────

/** Vestido básico sin mangas, entallado y con vuelo, con vistas de escote. 4 piezas. */
export function draftVestidoBasico(m: BodyMeasurements): PatternDoc {
  const doc = withSml(emptyDoc("Vestido básico · desde medidas"));
  const F = "crepé";
  const t = torsoOf(m, 8);
  const sx = t.hombro / 2 - 2;
  const nF = t.cuello / 6 + 1.2;
  const dF = nF + 3.5;
  const nB = nF;
  const dB = 2.5;
  const waistY = t.largoT;
  const hipY = waistY + 20;
  const hemY = waistY + (m.largoFalda ?? 60);
  const qWF = (m.cintura + 4) / 4 - 0.5;
  const qHF = (m.cadera + 6) / 4 - 0.5;
  const qHemF = qHF + 5;

  const front = mk("Delantero", 1, F, fullFromHalf([
    node({ x: 0, y: dF }, { notch: true, handleOut: { x: nF * 0.55, y: 0 } }),
    node({ x: nF, y: 0 }, { notch: true, handleIn: { x: 0, y: dF * 0.55 } }),
    ...armholeNodes(sx, 3.5, t.qF, t.sisa, 2.2),
    node({ x: qWF, y: waistY }, { notch: true }),
    node({ x: qHF, y: hipY }),
    node({ x: qHemF, y: hemY }),
    node({ x: 0, y: hemY + 0.8 }, { notch: true }),
  ]));
  const back = mk("Espalda", 2, F, [
    node({ x: 0, y: dB }, { notch: true, handleOut: { x: nB * 0.55, y: 0 } }),
    node({ x: nB, y: 0 }, { notch: true, handleIn: { x: 0, y: dB * 0.55 } }),
    ...armholeNodes(sx, 3.2, t.qB, t.sisa, 2),
    node({ x: qWF + 1, y: waistY }, { notch: true }),
    node({ x: qHF + 1, y: hipY }),
    node({ x: qHemF + 1, y: hemY }),
    node({ x: 0, y: hemY }, { notch: true }),
  ]);

  // pinza de busto en el costado, a cada lado del delantero
  const bustW = bustDartWidth(t.busto);
  const sDart = clamp(8 / Math.max(1, waistY - t.sisa), 0.15, 0.6);
  const sideX = t.qF + (qWF - t.qF) * sDart;
  const sideY = t.sisa + (waistY - t.sisa) * sDart;
  for (const sign of [1, -1]) {
    front.nodes = dartAt(
      front,
      { x: sign * sideX, y: sideY },
      bustW,
      { x: sign * t.qF * 0.45, y: t.sisa + 5 },
    ).nodes;
  }

  const facingF = mk("Vista de escote delantera", 1, "entretela termoadherible", fullFromHalf([
    node({ x: 0, y: dF }, { handleOut: { x: nF * 0.55, y: 0 } }),
    node({ x: nF, y: 0 }, { handleIn: { x: 0, y: dF * 0.55 } }),
    node({ x: nF + 3.6, y: 0.9 }),
    node({ x: nF + 2.2, y: 5.2 }, { handleOut: { x: -nF * 0.2, y: (dF - 0.6) * 0.5 } }),
    node({ x: 0, y: dF + 4.6 }, { handleIn: { x: nF * 0.55, y: 0 } }),
  ]));
  const facingB = mk("Vista de escote espalda", 2, "entretela termoadherible", [
    node({ x: 0, y: dB }, { handleOut: { x: nB * 0.55, y: 0 } }),
    node({ x: nB, y: 0 }, { handleIn: { x: 0, y: dB * 0.55 } }),
    node({ x: nB + 3.6, y: 0.9 }),
    node({ x: nB + 2.2, y: 5 }),
    node({ x: 0, y: dB + 4.6 }),
  ]);

  doc.pieces = layoutRows([[front, back], [facingF, facingB]]);
  return doc;
}

// ─── sudadera con capucha ────────────────────────────────────────────────────

/** Sudadera de hombro caído con capucha, bolsillo canguro, puños y pretina de rib. 7 piezas. */
export function draftSudadera(m: BodyMeasurements): PatternDoc {
  const doc = withSml(emptyDoc("Sudadera con capucha · desde medidas"));
  const F = "french terry 280 gsm";
  const RIB = "rib 1x1";
  const t = torsoOf(m, 18);
  const sx = t.hombro / 2 + 3;           // hombro caído
  const nF = t.cuello / 6 + 1.5;
  const dF = nF + 3;
  const dB = 2;
  const under = t.sisa + 4;
  const hemY = t.largoT + 16;

  const front = mk("Delantero", 1, F, fullFromHalf([
    node({ x: 0, y: dF }, { notch: true, handleOut: { x: nF * 0.55, y: 0 } }),
    node({ x: nF, y: 0 }, { notch: true, handleIn: { x: 0, y: dF * 0.55 } }),
    ...armholeNodes(sx, 3, t.qF, under, 1.5),
    node({ x: t.qF, y: hemY }),
    node({ x: 0, y: hemY }, { notch: true }),
  ]));
  const back = mk("Espalda", 1, F, fullFromHalf([
    node({ x: 0, y: dB }, { notch: true, handleOut: { x: nF * 0.55, y: 0 } }),
    node({ x: nF, y: 0 }, { notch: true, handleIn: { x: 0, y: dB * 0.55 } }),
    ...armholeNodes(sx, 2.8, t.qB, under, 1.3),
    node({ x: t.qB, y: hemY }),
    node({ x: 0, y: hemY }, { notch: true }),
  ]));

  const wrist = 20;
  const armLen = pathLen(armholeNodes(sx, 3, t.qF, under, 1.5)) + pathLen(armholeNodes(sx, 2.8, t.qB, under, 1.3));
  const sleeve = mk("Manga", 2, F, fitSleeve(t.busto * 0.3 + 12, t.largoManga - 8, wrist, armLen, under * 1.2));

  const s = t.cuello / 38;               // la capucha crece con el cuello
  // el borde de abajo de cada mitad de capucha se cose a la mitad del escote (arco delantero + trasero)
  const hoodNeck = pathLen([front.nodes[0]!, front.nodes[1]!]) + pathLen([back.nodes[0]!, back.nodes[1]!]);
  const hood = pieceFromPoints(
    "Capucha",
    [
      { x: 0, y: 37 * s }, { x: 0, y: 12 * s }, { x: 6 * s, y: 2 * s }, { x: 20 * s, y: 0 },
      { x: 32 * s, y: 8 * s }, { x: 36 * s, y: 24 * s }, { x: hoodNeck * 0.95, y: 36 * s }, { x: hoodNeck * 0.475, y: 38.5 * s },
    ],
    { closed: true, smooth: true, quantity: 2 },
  );
  hood.fabric = F;
  const cuff = rectPiece("Puño de rib", { x: 0, y: 0 }, { x: wrist * 0.8, y: 8 });
  cuff.quantity = 2; cuff.fabric = RIB;
  const band = rectPiece("Pretina de rib", { x: 0, y: 0 }, { x: (t.qF + t.qB) * 2 * 0.85, y: 9 });
  band.quantity = 1; band.fabric = RIB;
  const pouch = pieceFromPoints(
    "Bolsillo canguro",
    [{ x: 4, y: 0 }, { x: 34, y: 0 }, { x: 38, y: 24 }, { x: 0, y: 24 }],
    { closed: true, smooth: false },
  );
  pouch.fabric = F;

  doc.pieces = layoutRows([[front, back, sleeve], [hood, cuff, band, pouch]]);
  return doc;
}

// ─── camisa de hombre, polo, chaleco y pantalón cargo ───────────────────────

/** Pie de cuello completo (simétrico). */
function standNodes(lc: number): Node[] {
  return fullFromHalf([
    node({ x: 0, y: 0 }, { notch: true, handleOut: { x: lc * 0.5, y: 0.2 } }),
    node({ x: lc + 1.5, y: -0.3 }),
    node({ x: lc + 1.5, y: 3.2 }),
    node({ x: 0, y: 3.5 }, { notch: true, handleIn: { x: lc * 0.5, y: 0.1 } }),
  ]);
}

/** Camisa de hombre con canesú, tapeta, cuello con pie, bolsillo y, si es larga, puño. */
function draftCamisa(m: BodyMeasurements, name: string, short: boolean): PatternDoc {
  const doc = withSml(emptyDoc(name));
  const F = "oxford 130 g";
  const t = torsoOf(m, 16);
  const sx = t.hombro / 2;
  const nF = t.cuello / 6 + 0.8;
  const dF = nF + 1.5;
  const nB = nF + 0.3;
  const dB = 2;
  const yokeY = 9;                       // altura del canesú
  const hemY = t.largoT + 30;
  const under = t.sisa;

  const front = mk("Delantero", 2, F, [
    node({ x: 0, y: dF }, { notch: true, handleOut: { x: nF * 0.55, y: 0 } }),
    node({ x: nF, y: 0 }, { notch: true, handleIn: { x: 0, y: dF * 0.55 } }),
    ...armholeNodes(sx, 4.8, t.qF, under, 1),
    node({ x: t.qF, y: hemY }),
    node({ x: 0, y: hemY }, { notch: true }),
  ]);
  const yoke = mk("Canesú", 2, F, fullFromHalf([
    node({ x: 0, y: dB }, { notch: true, handleOut: { x: nB * 0.55, y: 0 } }),
    node({ x: nB, y: 0 }, { notch: true, handleIn: { x: 0, y: dB * 0.55 } }),
    node({ x: sx, y: 4.4 }, { handleOut: { x: -0.3, y: 2 } }),
    node({ x: sx - 0.6, y: yokeY }),
    node({ x: 0, y: yokeY }, { notch: true }),
  ]));
  const back = mk("Espalda", 1, F, fullFromHalf([
    node({ x: 0, y: yokeY }, { notch: true }),
    node({ x: sx - 0.6, y: yokeY }),
    node(
      { x: sx - 1.2, y: yokeY + (under - yokeY) * 0.5 },
      { handleIn: { x: 0, y: -2 }, handleOut: { x: 0, y: 2.5 } },
    ),
    node({ x: t.qB, y: under }, { notch: true, handleIn: { x: -2.5, y: -1.5 } }),
    node({ x: t.qB, y: hemY }),
    node({ x: 0, y: hemY }, { notch: true }),
  ]));

  const bicep = t.busto * 0.285 + 8;
  const wrist = short ? bicep * 0.82 : 25;
  const backArm = [
    node({ x: sx, y: 4.4 }, { handleOut: { x: -0.3, y: 2 } }),
    node({ x: sx - 0.6, y: yokeY }),
    node({ x: sx - 1.2, y: yokeY + (under - yokeY) * 0.5 }, { handleIn: { x: 0, y: -2 }, handleOut: { x: 0, y: 2.5 } }),
    node({ x: t.qB, y: under }, { handleIn: { x: -2.5, y: -1.5 } }),
  ];
  const armLen = pathLen(armholeNodes(sx, 4.8, t.qF, under, 1)) + pathLen(backArm);
  const sleeve = mk(
    "Manga", 2, F,
    fitSleeve(bicep, short ? 24 : t.largoManga - 6.5, wrist, armLen + 2.5, under * 1.2),
  );
  const lc = t.cuello / 2 + 1.5;
  const collar = mk("Cuello", 2, F, collarNodes(lc, 7));
  const stand = mk("Pie de cuello", 2, F, standNodes(lc));
  const placket = rectPiece("Tapeta", { x: 0, y: 0 }, { x: 4.5, y: hemY - dF });
  placket.quantity = 2; placket.fabric = F;
  const pocket = pieceFromPoints(
    "Bolsillo de pecho",
    [{ x: 0, y: 0 }, { x: 11, y: 0 }, { x: 11, y: 11 }, { x: 5.5, y: 12.5 }, { x: 0, y: 11 }],
    { closed: true, smooth: false },
  );
  pocket.fabric = F;

  const row2: Piece[] = [yoke, collar, stand, placket, pocket];
  if (!short) {
    const cuff = rectPiece("Puño", { x: 0, y: 0 }, { x: wrist, y: 6.5 });
    cuff.quantity = 2; cuff.fabric = F;
    row2.splice(3, 0, cuff);
  }
  doc.pieces = layoutRows([[front, back, sleeve], row2]);
  return doc;
}

/** Camisa de hombre manga larga con puño. 9 piezas. */
export function draftCamisaHombre(m: BodyMeasurements): PatternDoc {
  return draftCamisa(m, "Camisa de hombre · desde medidas", false);
}

/** Camisa de hombre manga corta. 8 piezas. */
export function draftCamisaMangaCorta(m: BodyMeasurements): PatternDoc {
  return draftCamisa(m, "Camisa manga corta · desde medidas", true);
}

/** Playera polo: cuello de polo, abertura con tapeta, manga corta con puño de rib. 7 piezas. */
export function draftPolo(m: BodyMeasurements): PatternDoc {
  const doc = withSml(emptyDoc("Playera polo · desde medidas"));
  const F = "piqué 200 gsm";
  const RIB = "rib 1x1";
  const t = torsoOf(m, 12);
  const sx = t.hombro / 2;
  const nF = t.cuello / 6 + 1.2;
  const dF = nF + 5;
  const dB = 2;
  const hemY = t.largoT + 22;

  const front = mk("Delantero", 1, F, fullFromHalf([
    node({ x: 0, y: dF }, { notch: true, handleOut: { x: nF * 0.55, y: 0 } }),
    node({ x: nF, y: 0 }, { notch: true, handleIn: { x: 0, y: dF * 0.55 } }),
    ...armholeNodes(sx, 3.5, t.qF, t.sisa, 1.2),
    node({ x: t.qF, y: hemY }),
    node({ x: 0, y: hemY }, { notch: true }),
  ]));
  const back = mk("Espalda", 1, F, fullFromHalf([
    node({ x: 0, y: dB }, { notch: true, handleOut: { x: nF * 0.55, y: 0 } }),
    node({ x: nF, y: 0 }, { notch: true, handleIn: { x: 0, y: dB * 0.55 } }),
    ...armholeNodes(sx, 3.3, t.qB, t.sisa, 1),
    node({ x: t.qB, y: hemY }),
    node({ x: 0, y: hemY }, { notch: true }),
  ]));

  const bicep = t.busto * 0.3 + 6;
  const wrist = bicep * 0.92;
  const armLen = pathLen(armholeNodes(sx, 3.5, t.qF, t.sisa, 1.2)) + pathLen(armholeNodes(sx, 3.3, t.qB, t.sisa, 1));
  const sleeve = mk("Manga", 2, F, fitSleeve(bicep, 22, wrist, armLen + 0.5, t.sisa * 1.2));
  const cuff = rectPiece("Puño de manga", { x: 0, y: 0 }, { x: wrist * 0.85, y: 6 });
  cuff.quantity = 2; cuff.fabric = RIB;
  const L = t.cuello + 2;
  const collar = pieceFromPoints(
    "Cuello de polo",
    [{ x: 0, y: 0 }, { x: L, y: 0 }, { x: L - 2.5, y: 9 }, { x: 2.5, y: 9 }],
    { closed: true, smooth: false },
  );
  collar.fabric = F;
  const placket = rectPiece("Tapeta de abertura", { x: 0, y: 0 }, { x: 3.5, y: 16 });
  placket.quantity = 2; placket.fabric = F;

  doc.pieces = layoutRows([[front, back, sleeve], [collar, cuff, placket]]);

  // línea de la abertura (interna, abierta) sobre el delantero, ya colocado
  const anchor = front.nodes[0]!.at;
  const slit = mk(
    "Abertura del cuello", 1, F,
    [node({ x: anchor.x, y: anchor.y }), node({ x: anchor.x, y: anchor.y + 14 })],
    false,
  );
  doc.pieces.push(slit);
  return doc;
}

/** Chaleco con forro, escote en V, bajo en punta y vivos de bolsillo. 5 piezas. */
export function draftChaleco(m: BodyMeasurements): PatternDoc {
  const doc = withSml(emptyDoc("Chaleco · desde medidas"));
  const F = "casimir";
  const LIN = "forro de poliéster";
  const t = torsoOf(m, 8);
  const sx = t.hombro / 2 - 2;
  const nF = t.cuello / 6 + 1;
  const nB = nF + 0.3;
  const dB = 2.5;
  const vY = 22;                         // dónde termina el escote en V
  const ext = 2;
  const under = t.sisa + 1;
  const hemY = t.largoT + 8;

  const frontPiece = (name: string, fabric: string): Piece =>
    mk(name, 2, fabric, [
      node({ x: -ext, y: vY }),
      node({ x: nF, y: 0 }, { notch: true }),
      ...armholeNodes(sx, 3.8, t.qF, under, 2.2),
      node({ x: t.qF, y: hemY }),
      node({ x: t.qF * 0.45, y: hemY + 2 }),
      node({ x: -ext, y: hemY + 5 }, { notch: true }),
    ]);
  const backPiece = (name: string, fabric: string): Piece =>
    mk(name, 1, fabric, fullFromHalf([
      node({ x: 0, y: dB }, { notch: true, handleOut: { x: nB * 0.55, y: 0 } }),
      node({ x: nB, y: 0 }, { notch: true, handleIn: { x: 0, y: dB * 0.55 } }),
      ...armholeNodes(sx, 3.5, t.qB, under, 2),
      node({ x: t.qB, y: hemY }),
      node({ x: 0, y: hemY + 1.5 }, { notch: true }),
    ]));

  const welt = rectPiece("Vivo de bolsillo", { x: 0, y: 0 }, { x: 15, y: 4 });
  welt.quantity = 4; welt.fabric = F;

  doc.pieces = layoutRows([
    [frontPiece("Delantero", F), backPiece("Espalda", F)],
    [frontPiece("Forro delantero", LIN), backPiece("Forro espalda", LIN), welt],
  ]);
  return doc;
}

/** Pantalón cargo: pierna recta con bolsillos de fuelle y solapa, pretina y trabillas. */
export function draftPantalonCargo(m: BodyMeasurements): PatternDoc {
  const F = "twill 8 oz";
  return draftTrouser(m, {
    name: "Pantalón cargo · desde medidas",
    fabric: F,
    hipEase: 6,
    thighEase: 6,
    backDart: true,
    extras: ({ cintura }) => [
      withQty(rectPiece("Pretina", { x: 0, y: 0 }, { x: cintura + 4, y: 8 }), 1, F),
      withQty(rectPiece("Bolsillo cargo", { x: 0, y: 0 }, { x: 20, y: 22 }), 2, F),
      withQty(
        pieceFromPoints(
          "Solapa cargo",
          [{ x: 0, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 5 }, { x: 10, y: 7 }, { x: 0, y: 5 }],
          { closed: true, smooth: false },
        ),
        2,
        F,
      ),
      withQty(
        pieceFromPoints(
          "Bolsillo trasero",
          [{ x: 0, y: 0 }, { x: 15, y: 0 }, { x: 15, y: 13 }, { x: 7.5, y: 17 }, { x: 0, y: 13 }],
          { closed: true, smooth: false },
        ),
        2,
        F,
      ),
      withQty(rectPiece("Trabilla", { x: 0, y: 0 }, { x: 9, y: 2.5 }), 6, F),
    ],
  });
}

// ─── catálogo de bloques (fuente de verdad para la UI) ──────────────────────

export type BlockKind =
  | "pantalon-denim"
  | "pantalon-vestir"
  | "playera-basica"
  | "falda-recta"
  | "blusa-clasica"
  | "chamarra-mezclilla"
  | "short"
  | "bermuda"
  | "vestido-basico"
  | "sudadera-capucha"
  | "falda-a"
  | "pants-jogger"
  | "camisa-hombre"
  | "camisa-manga-corta"
  | "polo"
  | "chaleco"
  | "pantalon-cargo";

export interface BlockMeta {
  kind: BlockKind;
  name: string;
  tag: string;              // etiqueta corta (ej. "pantalón · denim")
  blurb: string;            // 1 línea
  pieces: number;           // nº de piezas que genera
  fields: Array<keyof BodyMeasurements>; // qué medidas pide
  iconPath: string;         // SVG path (viewBox 0 0 24 24) para la galería
  /** medidas de arranque propias de la prenda (p. ej. el largo de un short) */
  defaults?: Partial<BodyMeasurements>;
}

export const BLOCK_CATALOG: readonly BlockMeta[] = [
  {
    kind: "pantalon-denim",
    name: "Pantalón denim slim",
    tag: "pantalón · mezclilla",
    blurb: "Jean slim clásico desde cintura, cadera, tiro y largo.",
    pieces: 2,
    fields: ["cintura", "cadera", "tiro", "largo", "muslo", "bajo"],
    iconPath: "M8 3h8l1 7v11h-4l-.5-8h-1L11 21H7V10z",
  },
  {
    kind: "pantalon-vestir",
    name: "Pantalón de vestir",
    tag: "pantalón · gabardina",
    blurb: "Pierna recta, bajo parejo. Para uniforme o línea formal.",
    pieces: 2,
    fields: ["cintura", "cadera", "tiro", "largo", "muslo"],
    iconPath: "M8 3h8v7l-1 11h-3l-.5-10h-1L10 21H7l-1-11z",
  },
  {
    kind: "playera-basica",
    name: "Playera básica",
    tag: "playera · jersey",
    blurb: "Cuello redondo con cuello de rib, manga corta. El caballito de maquila mexicana.",
    pieces: 4,
    fields: ["busto", "cintura", "hombro", "sisa", "largoTorso", "largoManga", "cuello"],
    iconPath: "M4 5l4-2h8l4 2-1 4-2-.5V21H7V6.5L5 9z",
  },
  {
    kind: "falda-recta",
    name: "Falda recta",
    tag: "falda · gabardina",
    blurb: "Falda tubo con pinzas de cintura, de cintura a rodilla o midi.",
    pieces: 2,
    fields: ["cintura", "cadera", "largoFalda"],
    iconPath: "M7 3h10l1 5-1 13H7L6 8z",
  },
  {
    kind: "blusa-clasica",
    name: "Blusa clásica",
    tag: "blusa · popelina",
    blurb: "Camisera de manga larga con pinza de busto, puño y cuello. 7 piezas, tallas S a XL.",
    pieces: 7,
    fields: ["busto", "cintura", "cadera", "hombro", "sisa", "largoTorso", "largoManga", "cuello"],
    iconPath: "M4 6l5-3 3 3 3-3 5 3-2 5-2-1v10H8V10l-2 1z",
  },
  {
    kind: "chamarra-mezclilla",
    name: "Chamarra de mezclilla",
    tag: "chamarra · mezclilla",
    blurb: "Trucker con faja, bolsillos de pecho con solapa, cuello y puños. 9 piezas.",
    pieces: 9,
    fields: ["busto", "cintura", "hombro", "sisa", "largoTorso", "largoManga", "cuello"],
    iconPath: "M3 7l5-3 4 2 4-2 5 3-1 5-2-1v9H6v-9l-2 1z",
    defaults: { largoTorso: 44, largoManga: 62 },
  },
  {
    kind: "short",
    name: "Short",
    tag: "short · mezclilla",
    blurb: "Pierna recta y corta, con pretina y bolsillos traseros.",
    pieces: 4,
    fields: ["cintura", "cadera", "tiro", "largo", "muslo", "bajo"],
    iconPath: "M7 3h10l1 8-1 9h-4l-1-8-1 8H7l-1-9z",
    defaults: { largo: 45, muslo: 58, bajo: 31 },
  },
  {
    kind: "bermuda",
    name: "Bermuda",
    tag: "bermuda · gabardina",
    blurb: "Pierna recta a la rodilla, con pinza trasera, pretina y bolsillos.",
    pieces: 4,
    fields: ["cintura", "cadera", "tiro", "largo", "muslo", "bajo"],
    iconPath: "M7 3h10l1 10-1 8h-4l-1-9-1 9H7l-1-8z",
    defaults: { largo: 58, muslo: 58, bajo: 29 },
  },
  {
    kind: "vestido-basico",
    name: "Vestido básico",
    tag: "vestido · crepé",
    blurb: "Sin mangas, entallado, con pinza de busto y vistas de escote. 4 piezas.",
    pieces: 4,
    fields: ["busto", "cintura", "cadera", "hombro", "sisa", "largoTorso", "cuello", "largoFalda"],
    iconPath: "M8 3h8l1 6-3 3 4 9H6l4-9-3-3z",
    defaults: { largoFalda: 60 },
  },
  {
    kind: "sudadera-capucha",
    name: "Sudadera con capucha",
    tag: "sudadera · french terry",
    blurb: "Hombro caído, capucha, bolsillo canguro y rib en puños y pretina. 7 piezas.",
    pieces: 7,
    fields: ["busto", "cintura", "hombro", "sisa", "largoTorso", "largoManga", "cuello"],
    iconPath: "M8 3l4 2 4-2 4 4-2 4-2-1v10H8V10l-2 1-2-4z",
    defaults: { largoTorso: 44, largoManga: 62 },
  },
  {
    kind: "falda-a",
    name: "Falda en A",
    tag: "falda · gabardina",
    blurb: "Con vuelo y pinzas de cintura, delantero al doblez, cierre atrás y pretina.",
    pieces: 3,
    fields: ["cintura", "cadera", "largoFalda"],
    iconPath: "M8 3h8l1 4 3 14H4L7 7z",
    defaults: { largoFalda: 55 },
  },
  {
    kind: "pants-jogger",
    name: "Pants jogger",
    tag: "pants · french terry",
    blurb: "Pierna ahusada con puño de tobillo y pretina elástica.",
    pieces: 4,
    fields: ["cintura", "cadera", "tiro", "largo", "muslo", "bajo"],
    iconPath: "M8 3h8l1 7-1 10-3 1-1-8-1 8-3-1-1-10z",
    defaults: { largo: 100, muslo: 62, bajo: 17 },
  },
  {
    kind: "camisa-hombre",
    name: "Camisa de hombre",
    tag: "camisa · oxford",
    blurb: "Manga larga con canesú, tapeta, cuello con pie, puño y bolsillo. 9 piezas.",
    pieces: 9,
    fields: ["busto", "cintura", "hombro", "sisa", "largoTorso", "largoManga", "cuello"],
    iconPath: "M4 6l5-3 3 2 3-2 5 3-2 5-2-1v10H8V10l-2 1z M12 5v15",
    defaults: { busto: 100, cintura: 88, cadera: 102, hombro: 46, cuello: 39, sisa: 25, largoTorso: 44, largoManga: 64 },
  },
  {
    kind: "camisa-manga-corta",
    name: "Camisa manga corta",
    tag: "camisa · oxford",
    blurb: "Igual que la camisa de hombre con manga corta sin puño. 8 piezas.",
    pieces: 8,
    fields: ["busto", "cintura", "hombro", "sisa", "largoTorso", "cuello"],
    iconPath: "M4 7l5-3 3 2 3-2 5 3-1 4-3-1v10H8V10l-3 1z M12 6v14",
    defaults: { busto: 100, cintura: 88, cadera: 102, hombro: 46, cuello: 39, sisa: 25, largoTorso: 44 },
  },
  {
    kind: "polo",
    name: "Playera polo",
    tag: "polo · piqué",
    blurb: "Cuello de polo, abertura con tapeta y manga corta con puño. 7 piezas.",
    pieces: 7,
    fields: ["busto", "cintura", "hombro", "sisa", "largoTorso", "cuello"],
    iconPath: "M4 6l5-3 3 3 3-3 5 3-1 4-3-1v10H8V9l-3 1z M12 6v6",
    defaults: { busto: 100, cintura: 90, hombro: 45, cuello: 38, sisa: 24, largoTorso: 43 },
  },
  {
    kind: "chaleco",
    name: "Chaleco",
    tag: "chaleco · casimir",
    blurb: "Escote en V y bajo en punta, con forro y vivos de bolsillo. 5 piezas.",
    pieces: 5,
    fields: ["busto", "cintura", "hombro", "sisa", "largoTorso", "cuello"],
    iconPath: "M7 3l5 7 5-7 2 3-2 3v12H7V9L5 6z",
    defaults: { busto: 100, cintura: 88, hombro: 44, cuello: 39, sisa: 25, largoTorso: 43 },
  },
  {
    kind: "pantalon-cargo",
    name: "Pantalón cargo",
    tag: "pantalón · twill",
    blurb: "Pierna recta con pinza trasera, bolsillos de fuelle y solapa, pretina y trabillas. 7 piezas.",
    pieces: 7,
    fields: ["cintura", "cadera", "tiro", "largo", "muslo", "bajo"],
    iconPath: "M8 3h8l1 8-1 10h-3l-1-8-1 8H8L7 11z M9 12h2v3H9z",
    defaults: { cintura: 84, cadera: 104, tiro: 27, largo: 104, muslo: 62, bajo: 24 },
  },
] as const;

/** Medidas de arranque de una prenda: las de fábrica con las propias del bloque encima. */
export function defaultMeasurementsFor(kind: BlockKind): BodyMeasurements {
  const meta = BLOCK_CATALOG.find((b) => b.kind === kind);
  return { ...DEFAULT_MEASUREMENTS, ...(meta?.defaults ?? {}) };
}

/** Punto de entrada por tipo de prenda.
 *  Marca el `blockKind` en el documento para que el editor sepa qué
 *  draft usar al cambiar medidas. */
function draftBlockRaw(kind: BlockKind, m: BodyMeasurements): PatternDoc {
  let doc: PatternDoc;
  switch (kind) {
    case "pantalon-denim":  doc = draftPantalonDenim(m); break;
    case "pantalon-vestir": doc = draftPantalonVestir(m); break;
    case "playera-basica":  doc = draftPlayeraBasica(m); break;
    case "falda-recta":     doc = draftFaldaRecta(m); break;
    case "blusa-clasica":   doc = draftBlusaClasica(m); break;
    case "chamarra-mezclilla": doc = draftChamarraMezclilla(m); break;
    case "short":           doc = draftShort(m); break;
    case "bermuda":         doc = draftBermuda(m); break;
    case "vestido-basico":  doc = draftVestidoBasico(m); break;
    case "sudadera-capucha": doc = draftSudadera(m); break;
    case "falda-a":         doc = draftFaldaA(m); break;
    case "pants-jogger":    doc = draftPantsJogger(m); break;
    case "camisa-hombre":   doc = draftCamisaHombre(m); break;
    case "camisa-manga-corta": doc = draftCamisaMangaCorta(m); break;
    case "polo":            doc = draftPolo(m); break;
    case "chaleco":         doc = draftChaleco(m); break;
    case "pantalon-cargo":  doc = draftPantalonCargo(m); break;
  }
  doc.blockKind = kind;
  return doc;
}

/**
 * Dibuja el bloque y le adjunta las reglas de graduación de cada nodo.
 * La regla se deriva dibujando el bloque una talla más grande y midiendo cuánto
 * se movió cada nodo, relativo al primer nodo de su pieza (que queda fijo como
 * ancla). `rules` son los cm por talla editados por el usuario (pisan los del bloque).
 */
export function draftBlock(
  kind: BlockKind,
  m: BodyMeasurements,
  rules?: Deltas,
): PatternDoc {
  const base = draftBlockRaw(kind, m);
  const up = draftBlockRaw(kind, measurementsForSteps(kind, m, 1, rules));
  base.pieces = base.pieces.map((piece, i) => {
    const upPiece = up.pieces[i];
    if (!upPiece || upPiece.nodes.length !== piece.nodes.length) return piece;
    const o0 = piece.nodes[0]!.at;
    const o1 = upPiece.nodes[0]!.at;
    const ax = o1.x - o0.x;
    const ay = o1.y - o0.y;
    return {
      ...piece,
      nodes: piece.nodes.map((n, j) => {
        const u = upPiece.nodes[j]!.at;
        const dx = round2(u.x - n.at.x - ax);
        const dy = round2(u.y - n.at.y - ay);
        return dx === 0 && dy === 0 ? n : { ...n, grade: { dx, dy } };
      }),
    };
  });
  if (rules && Object.keys(rules).length) base.gradeSteps = { ...rules } as Record<string, number>;
  base.measurements = { ...m } as Record<string, number>;
  return base;
}

const round2 = (v: number): number => Math.round(v * 100) / 100;

/**
 * Vuelve a derivar las reglas de graduación de un documento ya existente
 * (tras editar las reglas de tallaje o las medidas) sin perder piezas dibujadas:
 * las piezas se emparejan por nombre y solo se actualizan si siguen teniendo el
 * mismo número de nodos.
 */
export function rederiveGrades(
  doc: PatternDoc,
  kind: BlockKind,
  m: BodyMeasurements,
  rules?: Deltas,
): PatternDoc {
  const fresh = draftBlock(kind, m, rules);
  return {
    ...doc,
    ...(fresh.gradeSteps ? { gradeSteps: fresh.gradeSteps } : { gradeSteps: undefined }),
    pieces: doc.pieces.map((piece) => {
      const match = fresh.pieces.find((f) => f.name === piece.name);
      if (!match || match.nodes.length !== piece.nodes.length) return piece;
      return {
        ...piece,
        nodes: piece.nodes.map((n, j) => {
          const { grade: _old, ...rest } = n;
          const g = match.nodes[j]!.grade;
          return g ? { ...rest, grade: g } : rest;
        }),
      };
    }),
  };
}

// ─── graduación por bloque ──────────────────────────────────────────────────

export type Deltas = Partial<Record<keyof BodyMeasurements, number>>;

/** Reglas de graduación por bloque: cuánto crece cada medida por "paso"
 *  (= salto estándar entre dos tallas consecutivas, p.ej. 30 → 32). */
export const GRADE_RULES: Record<BlockKind, Deltas> = {
  "pantalon-denim": {
    cintura: 4, cadera: 4, tiro: 0.5, largo: 1, muslo: 2, bajo: 1,
  },
  "pantalon-vestir": {
    cintura: 4, cadera: 4, tiro: 0.5, largo: 1, muslo: 2, bajo: 1,
  },
  "playera-basica": {
    busto: 4, cintura: 4, hombro: 1, sisa: 0.6, largoTorso: 1,
    largoManga: 1, cuello: 0.6,
  },
  "falda-recta": {
    cintura: 4, cadera: 4, largoFalda: 0.5,
  },
  "blusa-clasica": {
    busto: 4, cintura: 4, cadera: 4, hombro: 1, sisa: 0.8, largoTorso: 1,
    largoManga: 1, cuello: 1,
  },
  "chamarra-mezclilla": {
    busto: 4, cintura: 4, hombro: 1, sisa: 0.8, largoTorso: 1, largoManga: 1, cuello: 1,
  },
  short: { cintura: 4, cadera: 4, tiro: 0.5, largo: 0.5, muslo: 2, bajo: 1 },
  bermuda: { cintura: 4, cadera: 4, tiro: 0.5, largo: 0.8, muslo: 2, bajo: 1 },
  "vestido-basico": {
    busto: 4, cintura: 4, cadera: 4, hombro: 1, sisa: 0.8, largoTorso: 1, cuello: 1, largoFalda: 1,
  },
  "sudadera-capucha": {
    busto: 4, cintura: 4, hombro: 1, sisa: 0.8, largoTorso: 1, largoManga: 1, cuello: 1,
  },
  "falda-a": { cintura: 4, cadera: 4, largoFalda: 0.5 },
  "pants-jogger": { cintura: 4, cadera: 4, tiro: 0.5, largo: 1, muslo: 2, bajo: 0.5 },
  "camisa-hombre": {
    busto: 4, cintura: 4, cadera: 4, hombro: 1, sisa: 0.8, largoTorso: 1, largoManga: 1, cuello: 1,
  },
  "camisa-manga-corta": {
    busto: 4, cintura: 4, cadera: 4, hombro: 1, sisa: 0.8, largoTorso: 1, cuello: 1,
  },
  polo: { busto: 4, cintura: 4, hombro: 1, sisa: 0.8, largoTorso: 1, cuello: 1 },
  chaleco: { busto: 4, cintura: 4, hombro: 1, sisa: 0.8, largoTorso: 1, cuello: 1 },
  "pantalon-cargo": { cintura: 4, cadera: 4, tiro: 0.5, largo: 1, muslo: 2, bajo: 1 },
};

/** Reglas efectivas (cm por talla) de un bloque: las de fábrica con las editadas encima. */
export function gradeRulesFor(kind: BlockKind, custom?: Deltas): Deltas {
  return { ...GRADE_RULES[kind], ...(custom ?? {}) };
}

/** Medidas tras `steps` pasos de talla respecto a las medidas base. */
export function measurementsForSteps(
  kind: BlockKind,
  base: BodyMeasurements,
  steps: number,
  custom?: Deltas,
): BodyMeasurements {
  const out: BodyMeasurements = { ...base };
  for (const [key, delta] of Object.entries(gradeRulesFor(kind, custom)) as [keyof BodyMeasurements, number][]) {
    const current = base[key];
    if (typeof current === "number") {
      (out[key] as number) = current + steps * delta;
    }
  }
  return out;
}

/** Devuelve las medidas para una talla aplicando las reglas del bloque. */
export function measurementsForBlockSize(
  kind: BlockKind,
  size: string,
  base: BodyMeasurements,
  baseSize: string,
  custom?: Deltas,
): BodyMeasurements {
  return measurementsForSteps(kind, base, sizeSteps(size, baseSize), custom);
}

/** Gradúa cualquier bloque para una lista de tallas. */
export function graduateBlock(
  kind: BlockKind,
  base: BodyMeasurements,
  baseSize: string,
  sizes: readonly string[],
): Array<{ size: string; doc: PatternDoc }> {
  return sizes.map((size) => ({
    size,
    doc: draftBlock(kind, measurementsForBlockSize(kind, size, base, baseSize)),
  }));
}

export const findBlock = (kind: BlockKind): BlockMeta =>
  BLOCK_CATALOG.find((b) => b.kind === kind) ?? BLOCK_CATALOG[0]!;

// ─── biblioteca de piezas ───────────────────────────────────────────────────

export type LibraryCategory =
  | "Delanteros"
  | "Espaldas"
  | "Mangas"
  | "Cuellos"
  | "Puños y vistas"
  | "Bolsillos"
  | "Complementos";

export interface LibraryEntry {
  id: string;
  name: string;
  category: LibraryCategory;
  /** de dónde sale (prenda o "genérico") */
  source: string;
  /** Genera la pieza con ids nuevos, ajustada a las medidas dadas. */
  make(m: BodyMeasurements): Piece;
}

/** Entrada de biblioteca tomada de una pieza de un bloque paramétrico. */
function fromBlock(
  kind: BlockKind,
  pieceName: string,
  name: string,
  category: LibraryCategory,
  source: string,
): LibraryEntry {
  return {
    id: `${kind}:${pieceName}`,
    name,
    category,
    source,
    make: (m) => {
      const piece = draftBlock(kind, m).pieces.find((p) => p.name === pieceName);
      if (!piece) throw new Error(`biblioteca: pieza "${pieceName}" no existe en ${kind}`);
      return clonePiece(piece, name);
    },
  };
}

const withQty = (p: Piece, quantity: number, fabric?: string): Piece => ({
  ...p,
  quantity,
  ...(fabric ? { fabric } : {}),
});

/** Piezas reutilizables para insertar en cualquier patrón. */
export const PIECE_LIBRARY: readonly LibraryEntry[] = [
  fromBlock("blusa-clasica", "Delantero", "Delantero de blusa", "Delanteros", "Blusa clásica"),
  fromBlock("playera-basica", "Delantero playera", "Delantero de playera", "Delanteros", "Playera básica"),
  fromBlock("pantalon-denim", "Delantero", "Delantero de pantalón", "Delanteros", "Pantalón"),
  fromBlock("falda-recta", "Delantero falda", "Delantero de falda", "Delanteros", "Falda recta"),
  fromBlock("blusa-clasica", "Espalda", "Espalda de blusa", "Espaldas", "Blusa clásica"),
  fromBlock("playera-basica", "Espalda playera", "Espalda de playera", "Espaldas", "Playera básica"),
  fromBlock("pantalon-denim", "Espalda", "Espalda de pantalón", "Espaldas", "Pantalón"),
  fromBlock("falda-recta", "Espalda falda", "Espalda de falda", "Espaldas", "Falda recta"),
  fromBlock("blusa-clasica", "Manga", "Manga larga", "Mangas", "Blusa clásica"),
  fromBlock("playera-basica", "Manga", "Manga corta", "Mangas", "Playera básica"),
  fromBlock("blusa-clasica", "Cuello", "Cuello camisero", "Cuellos", "Blusa clásica"),
  fromBlock("blusa-clasica", "Pie de cuello", "Pie de cuello", "Cuellos", "Blusa clásica"),
  fromBlock("blusa-clasica", "Puño", "Puño de camisa", "Puños y vistas", "Blusa clásica"),
  fromBlock("blusa-clasica", "Vista", "Vista delantera", "Puños y vistas", "Blusa clásica"),
  fromBlock("chamarra-mezclilla", "Bolsillo de pecho", "Bolsillo de pecho", "Bolsillos", "Chamarra de mezclilla"),
  fromBlock("chamarra-mezclilla", "Solapa", "Solapa de bolsillo", "Bolsillos", "Chamarra de mezclilla"),
  fromBlock("sudadera-capucha", "Bolsillo canguro", "Bolsillo canguro", "Bolsillos", "Sudadera con capucha"),
  fromBlock("chamarra-mezclilla", "Cuello", "Cuello de chamarra", "Cuellos", "Chamarra de mezclilla"),
  fromBlock("sudadera-capucha", "Capucha", "Capucha", "Cuellos", "Sudadera con capucha"),
  fromBlock("sudadera-capucha", "Delantero", "Delantero de sudadera", "Delanteros", "Sudadera con capucha"),
  fromBlock("vestido-basico", "Delantero", "Delantero de vestido", "Delanteros", "Vestido básico"),
  fromBlock("chamarra-mezclilla", "Delantero", "Delantero de chamarra", "Delanteros", "Chamarra de mezclilla"),
  fromBlock("short", "Delantero", "Delantero de short", "Delanteros", "Short"),
  fromBlock("vestido-basico", "Espalda", "Espalda de vestido", "Espaldas", "Vestido básico"),
  fromBlock("sudadera-capucha", "Espalda", "Espalda de sudadera", "Espaldas", "Sudadera con capucha"),
  fromBlock("chamarra-mezclilla", "Espalda", "Espalda de chamarra", "Espaldas", "Chamarra de mezclilla"),
  fromBlock("short", "Espalda", "Espalda de short", "Espaldas", "Short"),
  fromBlock("chamarra-mezclilla", "Manga", "Manga de chamarra", "Mangas", "Chamarra de mezclilla"),
  fromBlock("sudadera-capucha", "Manga", "Manga de sudadera", "Mangas", "Sudadera con capucha"),
  fromBlock("chamarra-mezclilla", "Puño", "Puño de chamarra", "Puños y vistas", "Chamarra de mezclilla"),
  fromBlock("sudadera-capucha", "Puño de rib", "Puño de rib", "Puños y vistas", "Sudadera con capucha"),
  fromBlock("vestido-basico", "Vista de escote delantera", "Vista de escote", "Puños y vistas", "Vestido básico"),
  fromBlock("pants-jogger", "Puño de tobillo", "Puño de tobillo", "Complementos", "Pants jogger"),
  fromBlock("pants-jogger", "Pretina elástica", "Pretina elástica", "Complementos", "Pants jogger"),
  fromBlock("camisa-hombre", "Delantero", "Delantero de camisa", "Delanteros", "Camisa de hombre"),
  fromBlock("camisa-hombre", "Espalda", "Espalda de camisa", "Espaldas", "Camisa de hombre"),
  fromBlock("camisa-hombre", "Canesú", "Canesú", "Espaldas", "Camisa de hombre"),
  fromBlock("camisa-hombre", "Manga", "Manga de camisa", "Mangas", "Camisa de hombre"),
  fromBlock("camisa-manga-corta", "Manga", "Manga corta de camisa", "Mangas", "Camisa manga corta"),
  fromBlock("polo", "Manga", "Manga de polo", "Mangas", "Playera polo"),
  fromBlock("camisa-hombre", "Cuello", "Cuello de camisa", "Cuellos", "Camisa de hombre"),
  fromBlock("camisa-hombre", "Pie de cuello", "Pie de cuello de camisa", "Cuellos", "Camisa de hombre"),
  fromBlock("polo", "Cuello de polo", "Cuello de polo", "Cuellos", "Playera polo"),
  fromBlock("camisa-hombre", "Puño", "Puño de camisa de hombre", "Puños y vistas", "Camisa de hombre"),
  fromBlock("camisa-hombre", "Tapeta", "Tapeta de camisa", "Puños y vistas", "Camisa de hombre"),
  fromBlock("polo", "Tapeta de abertura", "Tapeta de polo", "Puños y vistas", "Playera polo"),
  fromBlock("chaleco", "Delantero", "Delantero de chaleco", "Delanteros", "Chaleco"),
  fromBlock("chaleco", "Espalda", "Espalda de chaleco", "Espaldas", "Chaleco"),
  fromBlock("chaleco", "Vivo de bolsillo", "Vivo de bolsillo", "Bolsillos", "Chaleco"),
  fromBlock("pantalon-cargo", "Bolsillo cargo", "Bolsillo cargo (fuelle)", "Bolsillos", "Pantalón cargo"),
  fromBlock("pantalon-cargo", "Solapa cargo", "Solapa de bolsillo cargo", "Bolsillos", "Pantalón cargo"),
  fromBlock("pantalon-cargo", "Delantero", "Delantero de pantalón cargo", "Delanteros", "Pantalón cargo"),
  fromBlock("pantalon-cargo", "Espalda", "Espalda de pantalón cargo", "Espaldas", "Pantalón cargo"),
  {
    id: "generico:bolsillo-parche",
    name: "Bolsillo parche",
    category: "Bolsillos",
    source: "Genérico",
    make: () =>
      withQty(rectPiece("Bolsillo parche", { x: 0, y: 0 }, { x: 12, y: 14 }), 2),
  },
  {
    id: "generico:bolsillo-trasero",
    name: "Bolsillo trasero (pico)",
    category: "Bolsillos",
    source: "Pantalón",
    make: () =>
      withQty(
        pieceFromPoints(
          "Bolsillo trasero",
          [
            { x: 0, y: 0 }, { x: 14, y: 0 }, { x: 14, y: 12 },
            { x: 7, y: 16 }, { x: 0, y: 12 },
          ],
          { closed: true, smooth: false },
        ),
        2,
        "mezclilla 12 oz",
      ),
  },
  {
    id: "generico:pretina",
    name: "Pretina",
    category: "Complementos",
    source: "Pantalón y falda",
    make: (m) => withQty(rectPiece("Pretina", { x: 0, y: 0 }, { x: m.cintura + 4, y: 8 }), 1),
  },
  {
    id: "generico:trabilla",
    name: "Trabilla",
    category: "Complementos",
    source: "Pantalón",
    make: () => withQty(rectPiece("Trabilla", { x: 0, y: 0 }, { x: 8, y: 2.5 }), 5),
  },
];

export const LIBRARY_CATEGORIES: readonly LibraryCategory[] = [
  "Delanteros",
  "Espaldas",
  "Mangas",
  "Cuellos",
  "Puños y vistas",
  "Bolsillos",
  "Complementos",
];

export const VERSION = "0.7.0";
