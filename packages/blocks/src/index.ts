// @hilonova/blocks — bloques paramétricos de patronaje.
// Fase 2: el bloque de pantalón denim se GENERA a partir de medidas reales
// (cintura, cadera, tiro, largo, muslo, bajo) siguiendo reglas de patronaje
// industrial. No más polígonos fijos: cambias una medida, cambia el patrón.

import {
  clonePiece,
  sizeSteps,
  emptyDoc,
  emptyPiece,
  node,
  pieceFromPoints,
  rectPiece,
  type Node,
  type PatternDoc,
  type Piece,
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
  const qMuslo = musloE / 4;
  const qBajo = bajoE / 2;              // el bajo abre a la mitad en cada pierna

  const tiro = m.tiro ?? 25;
  const largo = m.largo ?? 104;
  const yCadera = tiro * 0.78;          // altura de cadera relativa al tiro
  const yEntrepierna = tiro;
  const yRodilla = largo * 0.56;

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
    node({ x: qCadera - 1 - qBajo, y: largo }),
    // rodilla interior (ligera curva para muslo)
    node(
      { x: qMuslo - qBajo * 0.9, y: yRodilla },
      {
        handleIn: { x: 0.5, y: (largo - yRodilla) * 0.4 },
        handleOut: { x: -0.5, y: -(yRodilla - yEntrepierna) * 0.4 },
      },
    ),
    // entrepierna (ancho de muslo delantero)
    node(
      { x: qMuslo - qCintura * 0.3, y: yEntrepierna },
      { handleIn: { x: 1, y: (yEntrepierna - yCadera) * 0.3 }, handleOut: { x: -2, y: -4 } },
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
    node({ x: bOff + qCadera - 1 - qBajo, y: largo }),                   // bajo interior
    node(
      { x: bOff + qMuslo - qBajo * 0.9 - 1, y: yRodilla },
      {
        handleIn: { x: 0.5, y: (largo - yRodilla) * 0.4 },
        handleOut: { x: -0.5, y: -(yRodilla - yEntrepierna) * 0.4 },
      },
    ),                                                                   // rodilla interior
    node(
      { x: bOff + qMuslo + 1, y: yEntrepierna },
      { handleIn: { x: 1, y: (yEntrepierna - yCadera) * 0.3 }, handleOut: { x: -3, y: -6 } },
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

  // ── manga ──────────────────────────────────────────────────────────────────
  const sleeve = emptyPiece("Manga", 2);
  sleeve.fabric = "jersey algodón 180 gsm";
  sleeve.seamAllowance = 1;
  sleeve.grainAngle = 0;
  const sOff = bOff + qBusto + 12;
  const anchoManga = (sisa + 2) * 1.3;                   // basado en profundidad de sisa
  const puno = anchoManga * 0.72;
  sleeve.nodes = [
    // copa centro (más alta)
    node({ x: sOff + anchoManga / 2, y: 0 }),
    // copa derecha
    node(
      { x: sOff + anchoManga, y: sisa * 0.65 },
      { handleIn: { x: -anchoManga * 0.2, y: -sisa * 0.3 }, handleOut: { x: 0, y: 1 } },
    ),
    // puño derecho
    node({ x: sOff + anchoManga / 2 + puno / 2, y: largoManga }),
    // puño izquierdo
    node({ x: sOff + anchoManga / 2 - puno / 2, y: largoManga }),
    // copa izquierda
    node(
      { x: sOff + 0, y: sisa * 0.65 },
      { handleIn: { x: 0, y: 1 }, handleOut: { x: anchoManga * 0.2, y: -sisa * 0.3 } },
    ),
  ];
  sleeve.closed = true;

  front.nodes[2] = { ...front.nodes[2]!, notch: true };  // piquete hombro
  front.nodes[3] = { ...front.nodes[3]!, notch: true };  // piquete sisa
  back.nodes[3] = { ...back.nodes[3]!, notch: true };
  sleeve.nodes[0] = { ...sleeve.nodes[0]!, notch: true };// cumbre de manga

  doc.pieces = [front, back, sleeve];
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

  doc.pieces = [front, back];
  return doc;
}

// ─── bloque de pantalón de vestir (bajo recto, pinzas) ──────────────────────

/** Variante del pantalón: bajo recto parejo al muslo (vestir) en lugar de slim. */
export function draftPantalonVestir(m: BodyMeasurements): PatternDoc {
  // Reutilizamos el denim pero con `bajo` igualado al muslo (= pierna recta)
  const bajoRecto = ((m.muslo ?? m.cadera * 0.56) * 0.95);
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
  sleeve.nodes = [
    node({ x: 0, y: 0 }, { notch: true, handleIn: { x: -bicep * 0.28, y: 0 }, handleOut: { x: bicep * 0.28, y: 0 } }),
    node({ x: bicep / 2, y: capH }, { notch: true, handleIn: { x: -bicep * 0.05, y: -capH * 0.55 } }),
    node({ x: wrist / 2, y: sleeveLen }),
    node({ x: -wrist / 2, y: sleeveLen }),
    node({ x: -bicep / 2, y: capH }, { notch: true, handleOut: { x: bicep * 0.05, y: -capH * 0.55 } }),
  ];

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

// ─── catálogo de bloques (fuente de verdad para la UI) ──────────────────────

export type BlockKind =
  | "pantalon-denim"
  | "pantalon-vestir"
  | "playera-basica"
  | "falda-recta"
  | "blusa-clasica";

export interface BlockMeta {
  kind: BlockKind;
  name: string;
  tag: string;              // etiqueta corta (ej. "pantalón · denim")
  blurb: string;            // 1 línea
  pieces: number;           // nº de piezas que genera
  fields: Array<keyof BodyMeasurements>; // qué medidas pide
  iconPath: string;         // SVG path (viewBox 0 0 24 24) para la galería
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
    blurb: "Cuello redondo, manga corta. El caballito de maquila mexicana.",
    pieces: 3,
    fields: ["busto", "cintura", "hombro", "sisa", "largoTorso", "largoManga", "cuello"],
    iconPath: "M4 5l4-2h8l4 2-1 4-2-.5V21H7V6.5L5 9z",
  },
  {
    kind: "falda-recta",
    name: "Falda recta",
    tag: "falda · gabardina",
    blurb: "Falda tubo con pinzas, de cintura a rodilla o midi.",
    pieces: 2,
    fields: ["cintura", "cadera", "largoFalda"],
    iconPath: "M7 3h10l1 5-1 13H7L6 8z",
  },
  {
    kind: "blusa-clasica",
    name: "Blusa clásica",
    tag: "blusa · popelina",
    blurb: "Camisera de manga larga con puño y cuello. 7 piezas, tallas S a XL.",
    pieces: 7,
    fields: ["busto", "cintura", "cadera", "hombro", "sisa", "largoTorso", "largoManga", "cuello"],
    iconPath: "M4 6l5-3 3 3 3-3 5 3-2 5-2-1v10H8V10l-2 1z",
  },
] as const;

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

export const VERSION = "0.5.0";
