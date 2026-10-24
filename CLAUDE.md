# Hilonova Studio — guía para Claude

## Qué es

Programa web de **patronaje digital** para maquilas, talleres y alumnos de confección
(cliente: consultora **Hilonova**). El patronista mete medidas, el sistema traza
el bloque base (17 prendas), lo gradúa, acomoda el trazo y exporta PDF (mosaico,
1:1 para plotter, ficha técnica), SVG y **DXF estilo AAMA (en validación, aún sin
probar en Gerber/Lectra)**. Pieza piloto: **mezclilla/denim**.

- **Web primero.** Escritorio (Tauri) reutilizará el motor en fase posterior.
- **Fuera de alcance:** cursos / LMS / certificados. Eso es otro proyecto.

## Stack

- Monorepo **pnpm + Turborepo**.
- `apps/web`: **Next.js 15** (App Router) + TypeScript. Puerto dev **4321**.
- `packages/ui`: design system. Tokens en `src/tokens.css` (fuente de verdad);
  equivalentes TS en `src/index.ts`. Fuentes vía `next/font` (Archivo,
  IBM Plex Sans, IBM Plex Mono).
- `packages/geometry`: **el corazón**. TS puro, sin UI, serializable. Aquí van
  curvas, offset de costura, graduación, undo/redo (Fase 1+).
- `packages/blocks`: reglas de patronaje por medidas (17 prendas).
- `packages/export`: DXF, SVG, PDF mosaico, ficha técnica, trazo.

Backend: **Firebase** (Authentication + Firestore, plan gratis; **sin Blaze**, sin
funciones en la nube). Cuentas reales, patrones guardados en `users/{uid}/patterns`.
Cobro: **enlace de pago de Stripe + acceso dado a mano** (`access/{uid}`), con el
interruptor `lib/billing-config.ts` apagado hasta probarlo. Detalle y decisiones en
`HANDOFF.md` y `docs/CAMBIOS-OCT-2026.md`.

## Convenciones

- Paquetes internos bajo scope `@hilonova/*`, enlazados con `workspace:*`.
- El motor (`geometry`) no importa React ni nada de UI: debe correr igual en web
  y en el futuro shell de escritorio.
- Diseño: marca Hilonova elevada (navy/teal, bronce, salvia, crema). Dos mundos:
  **estudio claro** (producto/landing) y **taller oscuro** (editor/trazo/ficha).
  Nada de look "IA genérica".
- No incluir secretos de `.env` ni llaves de Stripe en reportes, prompts ni commits
  (la configuración **pública** de Firebase sí puede ir en el código).
- Cada commit documentado (*Qué / Por qué / Verificación / Archivos*) y regenerar
  `docs/COMMITS.md` con `node scripts/commit-log.mjs`.
- Nada se publica ni se sube a `main` sin que el negocio lo pida; las páginas no
  prometen lo que el programa no hace (hay pruebas que lo vigilan).
- Textos al usuario en español sencillo.

## Comandos

```bash
pnpm install
pnpm dev          # web en http://localhost:4321
pnpm build
pnpm typecheck
pnpm test         # 667 pruebas (Vitest)
```
