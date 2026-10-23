// Compila el programa para vivir dentro del sitio de HiloNova CAD y lo copia ahí.
//
// Uso:  node scripts/publicar-en-cad.mjs [carpeta-destino] [ruta-base]
//   carpeta-destino  por omisión ../HiloNova-CAD/programa
//   ruta-base        por omisión /programa  (si el sitio vive en una carpeta, p. ej. /HiloNova-CAD/programa)
//
// El programa es una exportación estática: no necesita servidor. La ruta base debe coincidir con la dirección
// real donde se publique (con dominio propio basta /programa). No sube nada a internet: solo copia archivos.

import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const web = join(root, "apps", "web");
const dest = resolve(process.argv[2] ?? join(root, "..", "HiloNova-CAD", "programa"));
const base = process.argv[3] ?? "/programa";

console.log(`Compilando con la ruta base ${base} …`);
const isWin = process.platform === "win32";
execFileSync(isWin ? "corepack.cmd" : "corepack", ["pnpm", "exec", "next", "build"], {
  cwd: web,
  stdio: "inherit",
  shell: isWin,
  env: { ...process.env, NEXT_PUBLIC_BASE_PATH: base, COREPACK_ENABLE_DOWNLOAD_PROMPT: "0" },
});

const out = join(web, "out");
if (!existsSync(out)) throw new Error("No se generó apps/web/out");

if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
cpSync(out, dest, { recursive: true });

// La portada del programa (con fotos y video) no se usa aquí: la página de venta es la de HiloNova CAD.
for (const trash of ["video", "logo-kit.html", "index.txt"]) rmSync(join(dest, trash), { recursive: true, force: true });
// de las imágenes solo se conservan las fotos de las prendas (las usa la galería "Elige un bloque")
for (const f of readdirSync(join(dest, "img"))) if (f !== "prendas") rmSync(join(dest, "img", f), { recursive: true, force: true });
const back = "../";
writeFileSync(
  join(dest, "index.html"),
  `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>HiloNova</title>` +
    `<meta http-equiv="refresh" content="0; url=auth/signin/"><link rel="canonical" href="auth/signin/"></head>` +
    `<body><p>Entrando… <a href="auth/signin/">Entrar al programa</a> · <a href="${back}">Volver al inicio</a></p></body></html>\n`,
);
console.log(`Listo: ${readdirSync(dest).length} elementos en ${dest}`);
console.log("Recuerda reiniciar el servidor de desarrollo si lo tenías abierto (comparten la carpeta .next).");
