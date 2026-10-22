# Hilonova Studio

Software de **patronaje digital** B2B para maquilas y talleres de confección.
Del bloque paramétrico a la exportación **DXF-AAMA**, en un solo flujo.

> Web primero (SaaS). Una versión de escritorio (Tauri) reutilizará el mismo
> motor en una fase posterior.

**Estado actual: Fase 12 completa** — editor funcional con 4 bloques
paramétricos, graduación visual, panel de medidas con silueta y editor de
Tech Pack con preview en vivo. SaaS con auth mock (localStorage), pricing,
dashboard y biblioteca.

Para el próximo compañero: lee **[HANDOFF.md](./HANDOFF.md)** antes de empezar.

## Monorepo

```
hilonova-studio/
├─ apps/
│  └─ web/                        Next.js 15 (App Router) — todo el frontend
│     └─ app/
│        ├─ page.tsx              Landing pública
│        ├─ (saas)/               Shell del área autenticada (nav + layout)
│        ├─ auth/                 Signin / Signup con mock + Google/Apple SSO mock
│        ├─ app/                  Dashboard + galería "nuevo patrón"
│        ├─ account/              Cuenta del usuario
│        ├─ pricing/              Planes y precios
│        ├─ studio/               Editor CAD con 3 vistas: Editor, Trazo, Ficha
│        └─ lib/                  auth, library (localStorage), paths helpers
└─ packages/
   ├─ ui/                         Design system: tokens de marca
   ├─ geometry/                   Motor de patronaje puro TS (sin UI)
   ├─ blocks/                     Bloques paramétricos por medidas
   └─ export/                     Exportadores: DXF-AAMA, SVG, PDF, Tech Pack PDF
```

Gestor: **pnpm** workspaces + **Turborepo**.

## Requisitos

- Node >= 20
- pnpm >= 11 (viene configurado en `packageManager`)

## Desarrollo

```bash
pnpm install
pnpm dev          # web en http://localhost:4321
```

Otros scripts:

```bash
pnpm build        # build de todos los paquetes/apps
pnpm typecheck    # typecheck del monorepo
pnpm test         # pruebas automáticas (Vitest, carpeta tests/)
pnpm format       # prettier
```

Las pruebas cubren el motor y las 17 prendas (piezas completas, graduación,
reglas de tallaje), el trazo (sin empalmes, dentro de la tela) y el DXF
(estructura R12, margen de costura por fuera, tallas). Corre `pnpm test` antes
de cada commit.

Scripts útiles (en `/scripts`):

```bash
node scripts/remove-bg.mjs   # regenera los PNG transparentes del aside auth
                             # desde las imágenes fuente (soporta jpg/png/webp)
```

## Rutas principales

| Ruta | Qué es |
|------|--------|
| `/` | Landing pública con hero, bloques y pricing |
| `/pricing` | Planes (Taller $490, Maquila $1,290, Industrial a medida) |
| `/auth/signin` · `/auth/signup` | Login/registro con mock + SSO mock |
| `/app` | Dashboard del taller · biblioteca de patrones |
| `/app/new` | Galería "elige un bloque" para arrancar |
| `/studio?id=<pt_id>` | Editor con 3 vistas: Editor · Trazo · Ficha |
| `/account` | Cuenta del usuario |

## Hoja de ruta — qué está hecho

| Fase | Entregable | Estado |
|------|------------|--------|
| 0 | Monorepo, design system, landing | ✅ |
| 1 | Motor de geometría (vec/bezier/doc/piece/history/offset) + lienzo | ✅ |
| 2 | Patronaje real: costura, piquetes; bloque de pantalón denim | ✅ |
| 3 | Graduación por reglas | ✅ |
| 4 | Export DXF-AAMA + PDF mosaico + SVG | ✅ |
| 5 | Trazo (nesting shelf-packing) + Tech Pack PDF | ✅ |
| 6 | SaaS: auth mock, dashboard, biblioteca, pricing, account | ✅ |
| 7 | SSO Google/Apple mock, UX elevado | ✅ |
| 8 | Aside premium en auth (gradiente + stitch animado + hilos) | ✅ |
| 9 | Catálogo de bloques (pantalón denim, pantalón vestir, playera, falda) | ✅ |
| 10 | Panel de medidas visual con silueta interactiva | ✅ |
| 11 | Nido de tallas visual con HUD flotante + colores por talla | ✅ |
| 12 | Tech Pack editor (form + preview A4 en vivo + export custom) | ✅ |

## Fases pendientes

| Fase | Entregable |
|------|------------|
| 13+ | Más herramientas en el editor: pinzas, bolsillos, líneas internas |
| | Supabase + persistencia real (migrar del mock localStorage) |
| | Stripe (o Mercado Pago) para los planes |
| | Shell de escritorio con Tauri reutilizando `@hilonova/geometry` |

## Despliegue

La landing + app (`apps/web`) se publica como **sitio estático** en
**GitHub Pages**: https://teccapitalweb.github.io/hilonova-studio/

Cada push a `main` dispara `.github/workflows/pages.yml`, que corre
`next build` con `NEXT_PUBLIC_BASE_PATH=/hilonova-studio` y sube el `out/`.

Para probar el build de Pages en local (Git Bash):

```bash
MSYS_NO_PATHCONV=1 NEXT_PUBLIC_BASE_PATH=/hilonova-studio \
  pnpm --filter @hilonova/web build
# resultado en apps/web/out/
```

## Alcance

Este repositorio es **solo el software de patronaje**. La plataforma de cursos
/ academia de Hilonova es un proyecto aparte, fuera de este monorepo.

No incluir secretos de `.env` en commits, reportes o prompts.
