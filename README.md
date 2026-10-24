# Hilonova Studio

Software de **patronaje digital** para maquilas, talleres y alumnos de confección.
Del bloque paramétrico (17 prendas) a la graduación, el trazo y la exportación
(PDF, SVG y DXF estilo AAMA), en un solo flujo.

> Web primero (SaaS). Una versión de escritorio (Tauri) reutilizará el mismo
> motor en una fase posterior.

**Estado actual (24 de octubre de 2026):** editor completo con 17 prendas base,
graduación automática y manual, trazo con consumo de tela, producción (ficha
técnica, variantes, reportes) y exportación. **Cuentas reales con Firebase**
(correo/contraseña y Google), patrones guardados también en la nube, términos y
privacidad, y cobro con enlace de pago de Stripe **apagado** hasta probarlo.
Lo que falta está en [HANDOFF.md](./HANDOFF.md).

Para el próximo compañero: lee **[HANDOFF.md](./HANDOFF.md)** y, para el detalle de
todo lo hecho, **[docs/CAMBIOS-OCT-2026.md](./docs/CAMBIOS-OCT-2026.md)**.

## Monorepo

```
hilonova-studio/
├─ apps/
│  └─ web/                        Next.js 15 (App Router) — todo el frontend
│     └─ app/
│        ├─ page.tsx              Landing pública
│        ├─ (saas)/               Shell del área autenticada (nav + layout)
│        ├─ auth/                 Entrar / crear cuenta (Firebase: correo y Google)
│        ├─ app/                  Panel «Tus patrones» + galería «nuevo patrón»
│        ├─ account/              Cuenta y facturación
│        ├─ terminos/ privacidad/ Textos legales
│        ├─ components/           PlanGate («Activa tu plan»)
│        ├─ studio/               Editor: Diseño, Graduación, Trazo, Producción + menú lateral
│        └─ lib/                  auth, firebase, cloud (nube), library, billing, paths
└─ packages/
   ├─ ui/                         Design system: tokens de marca
   ├─ geometry/                   Motor de patronaje puro TS (sin UI)
   ├─ blocks/                     Bloques paramétricos por medidas
   └─ export/                     Exportadores: DXF (estilo AAMA), SVG, PDF mosaico, Tech Pack PDF, trazo
└─ firebase/                      Reglas de Firestore y configuración del emulador
└─ docs/                          Bitácora, análisis, guías de Firebase y cobro
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

Las pruebas (667, en `tests/`) cubren el motor y las 17 prendas (piezas completas,
graduación, tallaje, pinzas, costuras), el trazo, el DXF, los PDF (mosaico y
ficha), las cuentas, el guardado en la nube (con una nube de mentira), la
regla de acceso del cobro y que las páginas no prometan lo que el programa no
hace. Corre `pnpm test` antes de cada commit.

Scripts útiles (en `/scripts`):

```bash
node scripts/remove-bg.mjs        # regenera los PNG transparentes del aside auth
node scripts/commit-log.mjs       # regenera docs/COMMITS.md (se hace en cada commit)
node scripts/publicar-en-cad.mjs  # compila el programa dentro de ../HiloNova-CAD/programa
```

## Rutas principales

| Ruta | Qué es |
|------|--------|
| `/` | Portada del programa |
| `/auth/signin` · `/auth/signup` | Entrar / crear cuenta (correo y contraseña, o Google) |
| `/app` | Panel «Tus patrones» (biblioteca) |
| `/app/new` | Galería «elige una prenda» (17 con foto) para arrancar |
| `/studio?id=<pt_id>` | Editor: Diseño · Graduación · Trazo · Producción |
| `/account` | Cuenta y facturación |
| `/terminos` · `/privacidad` | Textos legales |

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
| 13 | 17 prendas con pinzas; herramientas de dibujo (12), texto, pinzas, selección múltiple | ✅ |
| 14 | Graduación manual, trazo con consumo y costo, reportes, variantes, verificar costuras | ✅ |
| 15 | PDF mosaico sin hojas de más y ficha técnica completa | ✅ |
| 16 | Cuentas reales con Firebase y guardado de patrones en la nube | ✅ |
| 17 | Términos y privacidad; cobro con enlace de Stripe (apagado) | ✅ |

## Pendiente

| Entregable |
|------------|
| Probar el guardado en la nube con Firestore real; crear el enlace de pago de Stripe y encender el cobro |
| Validación del maestro costurero y prueba del DXF en Gerber |
| Sincronizar materiales y «Mis piezas» en la nube; pruebas en otros navegadores y tableta |
| Vista 3D (descartada por ahora); shell de escritorio con Tauri |

## Despliegue

La landing + app (`apps/web`) se publica como **sitio estático** en
**GitHub Pages**: https://teccapitalweb.github.io/hilonova-studio/

Cada push a `main` dispara `.github/workflows/pages.yml`, que corre
`next build` con `NEXT_PUBLIC_BASE_PATH=/hilonova-studio` y sube el `out/`.
El trabajo actual vive en la rama `dev/mvp-9-nov` (no publica nada hasta que se
una a `main`). Antes de publicar: agregar el dominio a los dominios autorizados
de Firebase Authentication (ver `docs/FIREBASE-PASOS.md` y `docs/COBRO-PASOS.md`).

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
