// Genera docs/COMMITS.md a partir del historial de git.
// Uso: node scripts/commit-log.mjs
//
// Cada commit se documenta en su mensaje (asunto + cuerpo con Qué / Por qué /
// Verificación); este script solo lo publica en una bitácora legible. Así la
// bitácora nunca se desincroniza del historial real.

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" });

const SEP = "\u001e"; // separador de registros
const FLD = "\u001f"; // separador de campos
const raw = git("log", `--format=%H${FLD}%ad${FLD}%an${FLD}%s${FLD}%b${SEP}`, "--date=short");

const commits = raw
  .split(SEP)
  .map((r) => r.trim())
  .filter(Boolean)
  .map((r) => {
    const [hash, date, author, subject, body = ""] = r.split(FLD);
    return { hash, date, author, subject, body: body.trim() };
  });

const branch = git("rev-parse", "--abbrev-ref", "HEAD").trim();

let out = `# Bitácora de commits — Hilonova Studio

> Generado con \`node scripts/commit-log.mjs\`. No editar a mano.
> Rama: \`${branch}\` · Commits: ${commits.length}

## Cómo se documenta un commit

El mensaje de cada commit es la documentación. Formato:

\`\`\`
tipo(alcance): resumen corto en español

Qué: qué cambió, en una o dos frases.
Por qué: el problema o la necesidad.
Verificación: cómo se comprobó (build, typecheck, prueba manual...).
Archivos: los principales.
\`\`\`

Tipos: \`feat\`, \`fix\`, \`chore\`, \`style\`, \`docs\`, \`refactor\`, \`test\`.
Después de commitear, correr \`node scripts/commit-log.mjs\` y commitear la
bitácora como \`docs: actualizar bitácora\`.

---

`;

for (const c of commits) {
  out += `## ${c.subject}\n\n`;
  out += `- Commit: \`${c.hash.slice(0, 7)}\`\n- Fecha: ${c.date}\n- Autor: ${c.author}\n\n`;
  out += c.body ? `${c.body}\n\n` : `_Sin descripción ampliada._\n\n`;
}

mkdirSync(join(root, "docs"), { recursive: true });
writeFileSync(join(root, "docs", "COMMITS.md"), out, "utf8");
console.log(`docs/COMMITS.md generado (${commits.length} commits)`);
