// Quita el fondo blanco/gris de las imágenes 3D del aside y las guarda como
// PNG transparentes en apps/web/public/brand/.
//
// Estrategia: FLOOD-FILL desde las 4 esquinas con criterio de "fondo"
// (luminancia alta + baja saturación). Solo marca como transparentes los
// píxeles de fondo CONECTADOS al borde — así preserva blancos interiores
// (el hilo blanco de la aguja) y elimina la sombra gris proyectada en el
// fondo (que sí está conectada al borde).
//
// Luego aplica un feather de 1 px: los píxeles sólidos que colindan con
// transparentes y aún son claros reciben alpha interpolada → bordes suaves
// sin halo blanco.

import { Jimp } from "jimp";
import * as webp from "@cwasm/webp";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = resolve(ROOT, "apps/web/public/brand");

// Carpeta estable con las imágenes fuente adjuntadas en la sesión.
const SESSION_IMAGES =
  "C:\\Users\\MIGUEL~1\\AppData\\Local\\Temp\\claude\\C--dev\\c4380ead-c606-4490-a818-f85dbe334f69\\images";
const JOBS = [
  { in: `${SESSION_IMAGES}\\16.webp`, out: "obj-thread.png" },
  { in: `${SESSION_IMAGES}\\19.webp`, out: "obj-scissors.png" },
  { in: `${SESSION_IMAGES}\\17.png`,  out: "obj-pin.png" },
  { in: `${SESSION_IMAGES}\\18.png`,  out: "obj-needle.png" },
];

// Carga una imagen (jpg/png/webp) y devuelve un Jimp image con bitmap RGBA.
async function loadImage(path) {
  const buf = fs.readFileSync(path);
  if (path.toLowerCase().endsWith(".webp")) {
    const decoded = webp.decode(buf);
    // decoded = { data: Uint8Array RGBA, width, height }
    const img = new Jimp({ width: decoded.width, height: decoded.height, color: 0x00000000 });
    img.bitmap.data = Buffer.from(decoded.data);
    return img;
  }
  return await Jimp.fromBuffer(buf);
}

// Un píxel es "candidato a fondo" si es claro Y no tiene mucho color.
// Esto cubre blanco puro, sombras grises proyectadas y off-whites.
// Los colores saturados (naranja del carrete, cobre de las tijeras,
// cabeza naranja del alfiler) tienen sat alta y sobreviven.
const LUM_MIN   = 185; // ≥ este valor → podría ser fondo
const SAT_MAX   = 35;  // (max-min) rgb ≤ → gris/neutro
// Rango de feather para el borde (luminancia del propio píxel sólido en edge).
const FEATHER_LUM_HI = 220;
const FEATHER_LUM_LO = 170;

function isBgCandidate(data, idx) {
  const i = idx << 2;
  const r = data[i], g = data[i + 1], b = data[i + 2];
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  if (lum < LUM_MIN) return false;
  const sat = Math.max(r, g, b) - Math.min(r, g, b);
  return sat <= SAT_MAX;
}

// Criterio MUCHO más estricto para huecos interiores (óvalos de asas,
// espacios entre hojas): solo blanco casi-puro cuenta, para no confundir
// zonas de reflejo brillante del metal con un hueco.
const HOLE_LUM_MIN = 228;
const HOLE_SAT_MAX = 12;
const HOLE_MIN_PIXELS = 300; // componentes más pequeños se ignoran

function isHoleCandidate(data, idx) {
  const i = idx << 2;
  const r = data[i], g = data[i + 1], b = data[i + 2];
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  if (lum < HOLE_LUM_MIN) return false;
  const sat = Math.max(r, g, b) - Math.min(r, g, b);
  return sat <= HOLE_SAT_MAX;
}

for (const job of JOBS) {
  const img = await loadImage(job.in);
  const { data, width, height } = img.bitmap;
  const N = width * height;

  // 1) Flood-fill BFS desde todos los píxeles de borde.
  const bg = new Uint8Array(N);
  const q = new Int32Array(N); // suficiente capacidad: en el peor caso todos los píxeles entran
  let qHead = 0, qTail = 0;

  const enqueue = (idx) => {
    if (bg[idx]) return;
    if (!isBgCandidate(data, idx)) return;
    bg[idx] = 1;
    q[qTail++] = idx;
  };

  for (let x = 0; x < width; x++) {
    enqueue(x);                       // top
    enqueue((height - 1) * width + x); // bottom
  }
  for (let y = 0; y < height; y++) {
    enqueue(y * width);                   // left
    enqueue(y * width + (width - 1));     // right
  }

  while (qHead < qTail) {
    const idx = q[qHead++];
    const x = idx % width;
    const y = (idx - x) / width;
    if (x > 0)          enqueue(idx - 1);
    if (x < width - 1)  enqueue(idx + 1);
    if (y > 0)          enqueue(idx - width);
    if (y < height - 1) enqueue(idx + width);
  }

  // 1b) HUECOS INTERIORES: regiones de bg-candidate rodeadas por sólido,
  // no conectadas al borde (ej. óvalos de las asas de las tijeras, el
  // espacio entre las dos hojas). Hacemos un flood local desde cada
  // candidato no marcado; si el componente completo nunca toca el
  // exterior-bg y sí toca al menos un píxel sólido, es un hueco → bg.
  const seen = new Uint8Array(N);
  for (let start = 0; start < N; start++) {
    if (bg[start] || seen[start]) continue;
    if (!isHoleCandidate(data, start)) continue;

    const region = [];
    const stack = [start];
    seen[start] = 1;
    let touchedExterior = false;
    let touchedSolid = false;

    while (stack.length) {
      const i = stack.pop();
      region.push(i);
      const x = i % width;
      const y = (i - x) / width;
      const nbrs = [];
      if (x > 0)          nbrs.push(i - 1);
      if (x < width - 1)  nbrs.push(i + 1);
      if (y > 0)          nbrs.push(i - width);
      if (y < height - 1) nbrs.push(i + width);
      for (const n of nbrs) {
        if (seen[n]) continue;
        if (bg[n])  { touchedExterior = true; continue; }
        if (!isHoleCandidate(data, n)) { touchedSolid = true; continue; }
        seen[n] = 1;
        stack.push(n);
      }
    }

    if (!touchedExterior && touchedSolid && region.length >= HOLE_MIN_PIXELS) {
      for (const i of region) bg[i] = 1;
    }
  }

  // 1c) CLEANUP de islas sólidas pequeñas aisladas del cuerpo principal
  // (restos de sombras proyectadas en el fondo que quedaron opacas por
  // estar por debajo del threshold de luminancia). Un componente sólido
  // con menos de ISLAND_MAX_PIXELS se considera basura y se marca como bg.
  const ISLAND_MAX_PIXELS = 800;
  const seen2 = new Uint8Array(N);
  for (let start = 0; start < N; start++) {
    if (bg[start] || seen2[start]) continue;
    const region = [];
    const stack = [start];
    seen2[start] = 1;
    while (stack.length) {
      const i = stack.pop();
      region.push(i);
      const x = i % width;
      const y = (i - x) / width;
      const nbrs = [];
      if (x > 0)          nbrs.push(i - 1);
      if (x < width - 1)  nbrs.push(i + 1);
      if (y > 0)          nbrs.push(i - width);
      if (y < height - 1) nbrs.push(i + width);
      for (const n of nbrs) {
        if (seen2[n] || bg[n]) continue;
        seen2[n] = 1;
        stack.push(n);
      }
    }
    if (region.length < ISLAND_MAX_PIXELS) {
      for (const i of region) bg[i] = 1;
    }
  }

  // 2) Aplicar alpha: fondo→0, resto→255. Luego feather en el edge.
  for (let i = 0; i < N; i++) {
    data[(i << 2) + 3] = bg[i] ? 0 : 255;
  }

  // 3) Feather: para píxeles sólidos cuyo 4-vecinos tenga al menos un
  // transparente, interpolar alpha según su propia luminancia.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (bg[idx]) continue; // ya transparente
      const hasBgNbr =
        (x > 0          && bg[idx - 1]) ||
        (x < width - 1  && bg[idx + 1]) ||
        (y > 0          && bg[idx - width]) ||
        (y < height - 1 && bg[idx + width]);
      if (!hasBgNbr) continue;
      const i = idx << 2;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (lum >= FEATHER_LUM_HI) {
        data[i + 3] = 0;
      } else if (lum > FEATHER_LUM_LO) {
        const t = (FEATHER_LUM_HI - lum) / (FEATHER_LUM_HI - FEATHER_LUM_LO);
        data[i + 3] = Math.round(255 * t);
      }
      // < FEATHER_LUM_LO → alpha 255 (sin cambio)
    }
  }

  const outPath = resolve(OUT, job.out);
  await img.write(outPath);
  console.log(`✓ ${job.out}  (${width}x${height})`);
}

console.log("Done.");
