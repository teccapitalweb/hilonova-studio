# Hilonova Studio

Software de **patronaje digital** B2B para maquilas y talleres de confección.
Del bloque paramétrico a la exportación **DXF-AAMA**, en un solo flujo.

> Web primero (SaaS). Una versión de escritorio (Tauri) reutilizará el mismo
> motor en una fase posterior.

## Monorepo

```
hilonova-studio/
├─ apps/
│  └─ web/            Next.js 15 (App Router) · landing + app shell
└─ packages/
   ├─ ui/             Design system: tokens de marca + componentes
   ├─ geometry/       Motor de geometría de patronaje (núcleo, TS puro)
   ├─ blocks/         Bloques paramétricos por medidas (denim primero)
   └─ export/         Exportadores: DXF-AAMA, SVG, PDF
```

Gestor: **pnpm** workspaces + **Turborepo**.

## Requisitos

- Node >= 20
- pnpm >= 11

## Desarrollo

```bash
pnpm install
pnpm dev          # levanta la web en http://localhost:4321
```

Otros scripts:

```bash
pnpm build        # build de todos los paquetes/apps
pnpm typecheck    # typecheck del monorepo
pnpm format       # prettier
```

## Hoja de ruta

| Fase | Entregable |
|------|------------|
| **0** | Cimientos: monorepo, design system, landing, estructura. ← actual |
| 1 | Motor de geometría + lienzo del editor (curvas, cotas, undo/redo). |
| 2 | Patronaje real: costura, pinzas, piquetes; bloque de pantalón denim. |
| 3 | Graduación por reglas + nido de tallas. |
| 4 | Exportación DXF-AAMA + PDF (mosaico/plotter). |
| 5 | Trazo, consumo/aprovechamiento y ficha técnica. |
| 6 | SaaS: planes, pagos, organizaciones y asientos. |

## Despliegue

La landing (`apps/web`) se publica como **sitio estático** en
**GitHub Pages**: https://teccapitalweb.github.io/hilonova-studio/

Cada push a `main` dispara el workflow `.github/workflows/pages.yml`, que hace
`next build` con `NEXT_PUBLIC_BASE_PATH=/hilonova-studio` y sube el `out/`.

Para probar el build de Pages en local (Git Bash):

```bash
MSYS_NO_PATHCONV=1 NEXT_PUBLIC_BASE_PATH=/hilonova-studio \
  pnpm --filter @hilonova/web build
# resultado en apps/web/out/
```

## Alcance

Este repositorio es **solo el software de patronaje**. La plataforma de cursos
/ academia de Hilonova es un proyecto aparte.
