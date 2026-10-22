# Hilonova Studio — guía para Claude

## Qué es

SaaS **B2B** de **patronaje digital** para maquilas y talleres de confección
(cliente: consultora **Hilonova**). El patronista mete medidas, el sistema traza
el bloque base, lo gradúa, acomoda el trazo y exporta **DXF-AAMA** (intercambio
con Gerber/Lectra) + PDF mosaico/plotter. Pieza piloto: **mezclilla/denim**.

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
- `packages/blocks`: reglas de patronaje por medidas (denim primero).
- `packages/export`: DXF-AAMA, SVG, PDF.

Backend previsto (fases siguientes): **Supabase** (Postgres + Auth + Storage,
multi-tenant con RLS por organización) y **Stripe** (pagos; evaluar Mercado Pago).

## Convenciones

- Paquetes internos bajo scope `@hilonova/*`, enlazados con `workspace:*`.
- El motor (`geometry`) no importa React ni nada de UI: debe correr igual en web
  y en el futuro shell de escritorio.
- Diseño: marca Hilonova elevada (navy/teal, bronce, salvia, crema). Dos mundos:
  **estudio claro** (producto/landing) y **taller oscuro** (editor/trazo/ficha).
  Nada de look "IA genérica".
- No incluir secretos de `.env` en reportes, prompts ni commits.

## Comandos

```bash
pnpm install
pnpm dev          # web en http://localhost:4321
pnpm build
pnpm typecheck
```
