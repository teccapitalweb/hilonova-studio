# Handoff — Hilonova Studio

Guía rápida para quien agarre el proyecto después. Léela antes de abrir el
editor.

## Qué es

SaaS **B2B** de patronaje digital para maquilas/talleres de confección en
México. El patronista mete medidas, el sistema traza el bloque base, lo gradúa
por talla, acomoda el trazo y exporta **DXF-AAMA** (intercambio con
Gerber/Lectra) + PDF mosaico + Tech Pack PDF.

Web primero (Next.js 15). Escritorio (Tauri) reutilizará el motor en una
fase posterior. Cursos / academia están **fuera de alcance** — es otro
proyecto.

## Cómo arrancar

```bash
git clone https://github.com/teccapitalweb/hilonova-studio.git
cd hilonova-studio
pnpm install
pnpm dev          # web en http://localhost:4321
```

Node ≥ 20 y pnpm ≥ 11 (viene fijado en `packageManager`).

Un `pnpm dev` básico ya te da la landing en `/`, el flujo de signup en
`/auth/signup`, el dashboard en `/app`, y el editor en `/studio`.

## Decisiones clave que ya tomamos

Nada de esto es sagrado, pero cambiarlo tiene efectos:

1. **Auth es mock sobre `localStorage`.** La API de `apps/web/app/lib/auth.ts`
   es la que se migrará a Supabase: su firma pública (`signUp`, `signIn`,
   `useSession`, `signOut`, `signInWithProvider`) ya está pensada para que
   la implementación cambie sin tocar las páginas.
2. **Biblioteca de patrones también `localStorage`** (misma lógica — ver
   `apps/web/app/lib/library.ts`). Guarda documentos serializados con
   `@hilonova/geometry`.
3. **El motor (`@hilonova/geometry`) NO conoce React.** TypeScript puro,
   serializable. Esto es a propósito: el shell de escritorio Tauri usará
   el mismo paquete sin cambios.
4. **Zustand para estado del editor** (`apps/web/app/studio/store.ts`).
   Todas las mutaciones del documento pasan por `apply(next)` encima de un
   historial inmutable, así `undo/redo` funciona siempre.
5. **Puerto dev `4321`** fijado en `apps/web/package.json`.
6. **GitHub Pages estático** con `NEXT_PUBLIC_BASE_PATH=/hilonova-studio`.
   El workflow está en `.github/workflows/pages.yml` — no lo toques salvo
   que sepas qué haces.
7. **No commitear nada de `.env`** — no hay nada por ahora, pero cuando
   venga Supabase los Service Role Keys etc. van a env vars.

## Estructura — qué está dónde

```
packages/
├─ geometry/src/
│  ├─ vec.ts            Vec2 helpers
│  ├─ bezier.ts         Cubic Bézier (de Casteljau), samplePath, bounds
│  ├─ doc.ts            PatternDoc / Piece / Node + mutaciones inmutables
│  ├─ piece.ts          Shoelace area, offset-stroke utilities
│  ├─ history.ts        Undo/redo (commit/undo/redo/canUndo/canRedo)
│  ├─ offset.ts         Offset de contorno para margen de costura
│  └─ index.ts          Re-exports + utilidades de unidades (cm/mm/in)
│
├─ blocks/src/index.ts  BLOCK_CATALOG, draftBlock, graduateBlock,
│                       4 drafts: pantalón denim, pantalón vestir,
│                       playera básica, falda recta.
│
└─ export/src/
   ├─ dxf.ts            Export DXF-AAMA/ASTM D6673 (layers 1,4,5,8,15)
   ├─ svg.ts            Export SVG limpio
   ├─ pdf.ts            PDF A4 mosaico (tiled) para imprimir en casa
   └─ techpack.ts       Tech Pack PDF multi-página (cover+medidas+flats+BOM)

apps/web/app/
├─ page.tsx             Landing
├─ (saas)/
│  ├─ layout.tsx        Layout del área autenticada
│  ├─ SaasNav.tsx       Nav superior (hilonova · Patrones · Precios · Cuenta)
│  └─ saas.css          Estilos del shell SaaS + auth
│
├─ auth/
│  ├─ AuthAside.tsx     Aside premium con gradiente + stitch animado + hilos
│  ├─ SsoButtons.tsx    Google / Apple SSO (mock)
│  ├─ signin/page.tsx
│  └─ signup/page.tsx
│
├─ app/
│  ├─ page.tsx          Dashboard: hero + stats + biblioteca con thumbnails
│  └─ new/              "Elige un bloque" — galería visual
│
├─ account/page.tsx     Cuenta: plan, perfil, cambiar plan
├─ pricing/page.tsx     Planes
│
├─ studio/              EDITOR CAD (el corazón)
│  ├─ page.tsx          Entry
│  ├─ Shell.tsx         TopBar + rail + 3 vistas (editor/trazo/ficha) + HUD nido
│  ├─ Canvas.tsx        Canvas 2D con pan/zoom/snap, dibuja piezas + nido
│  ├─ Trazo.tsx         Vista de nesting (acomodo en tela)
│  ├─ TechPack.tsx      Vista Ficha: form + preview A4 en vivo
│  ├─ MeasurementSilhouette.tsx   Siluetas SVG del panel de medidas
│  ├─ ExportModal.tsx   Modal export (DXF/SVG/PDF/TechPack)
│  ├─ store.ts          Zustand store del editor
│  ├─ nest.ts           buildNest() para dibujar tallas superpuestas
│  ├─ nesting.ts        Algoritmo shelf-packing para el trazo
│  └─ studio.css        Todos los estilos del editor (oscuro)
│
└─ lib/
   ├─ auth.ts           Mock de auth (localStorage)
   ├─ library.ts        Mock de biblioteca de patrones
   └─ paths.ts          withBase() para GitHub Pages basePath

scripts/
└─ remove-bg.mjs        Convierte las imágenes fuente (jpg/png/webp) a PNG
                        transparentes con flood-fill + detección de huecos
                        interiores + limpieza de islas. Usa @cwasm/webp
                        (puro wasm, sin binarios nativos).
```

## Flujo típico del patronista

1. Entra a `/auth/signup` → crea cuenta mock (va a `/app`)
2. Dashboard vacío → click **"Nuevo patrón"** → `/app/new`
3. Elige un bloque de la galería (pantalón denim / vestir / playera / falda)
4. Se guarda en `localStorage` y abre en `/studio?id=...`
5. En el **tab Editor**: ajusta medidas con el panel visual (hover sobre un
   campo ilumina la medida en la silueta), ve el patrón redibujarse al
   instante. Toggle el **HUD "Nido de tallas"** abajo-izquierda para ver
   las N tallas superpuestas en colores.
6. En el **tab Trazo**: ve cómo se acomodan las piezas en el ancho de tela
   (150 cm denim estándar) con % de aprovechamiento.
7. En el **tab Ficha**: llena referencia, cliente, temporada, BOM,
   especificaciones; preview A4 en vivo a la derecha.
8. Click **Exportar** → DXF (para Gerber/Lectra), PDF mosaico (para
   imprimir en casa), PDF Tech Pack (para la maquila), o SVG.

## Qué funciona de verdad

- Motor de geometría: curvas Bézier, offset de costura, undo/redo, serialize/deserialize.
- 4 bloques paramétricos reales con reglas de graduación propias.
- Export DXF-AAMA validado con layers correctos.
- Export PDF mosaico A4 (~2.3 MB para un pantalón) y SVG (~14 KB).
- Tech Pack PDF multi-página (~55 KB).
- Nesting shelf-packing con cálculo de utilización.
- SaaS mock funcional end-to-end (signup → editor → export).

## Qué NO funciona todavía (o es mock)

- **Auth real** — todo vive en `localStorage.hilonova.session.v1`.
- **Supabase / backend** — no hay backend. Nada se persiste al servidor.
- **Stripe / pagos** — no hay cobros, los planes son solo UI.
- **Google / Apple SSO real** — los botones hacen `signInWithProvider` mock
  que crea una sesión fake con un email predeterminado.
- **Compartir patrones** entre usuarios del taller.
- **Más bloques** (chamarra, vestido, pants, blusa). El catálogo está hecho
  para extenderse: añadir a `BLOCK_CATALOG` y a `draftBlock()` en
  `packages/blocks/src/index.ts`.
- **Herramientas internas del editor**: no se pueden agregar pinzas,
  bolsillos ni líneas internas manualmente. Solo mover nodos existentes y
  marcar piquetes.

## Dónde seguir — fases propuestas

Están ordenadas por valor comercial, no por dificultad:

1. **Supabase + Stripe real** → el SaaS deja de ser demo.
   - Migrar `apps/web/app/lib/auth.ts` manteniendo la firma pública.
   - Agregar `pattern_items` table con RLS por `org_id`.
   - Stripe Checkout para los 3 planes.
2. **Editor con más herramientas** (pinzas, bolsillos, líneas internas,
   rotar/mover/escalar piezas). Requiere ampliar los `Tool` del store y
   nuevos path tools en `Canvas.tsx`.
3. **Más bloques** del catálogo mexicano: pants deportivos, blusa manga
   larga, vestido A, chamarra denim.
4. **Compartir patrón** con enlace privado dentro de la organización.
5. **Shell de escritorio Tauri** reutilizando `@hilonova/geometry`.

## Convenciones

- Scope `@hilonova/*`, enlazados con `workspace:*`.
- El motor (`geometry`) **no importa React** ni DOM — para que corra en
  Tauri sin cambios.
- Paleta: navy `#14192A` / `#1F2A48` / `#0D1428`, accent `#F0662C` /
  `#FF7E45`. Dos mundos: estudio claro (producto/landing) y taller oscuro
  (editor/trazo).
- Fuentes: Bricolage Grotesque (display) + Plus Jakarta Sans (texto) +
  IBM Plex Mono (datos). Vía `next/font`.
- No crear archivos `.md` nuevos sin razón — este monorepo trata de
  mantener el root limpio.

## Gotchas conocidos

- **`demoJeanDoc()` fue removido** del store para evitar el "flash de
  denim" al abrir una playera. Si lo necesitas de nuevo, está en
  `@hilonova/blocks` pero el store usa `draftBlock(blockKind, ...)`.
- **`.studio-body--trazo` modifier** se usa también para la vista Ficha
  (no solo Trazo). La CSS usa `.studio-body.studio-body--trazo` doble
  para ganarle a los media queries de la grilla por defecto.
- **El `blockKind` vive en el `PatternDoc`** (campo opcional). Si lo pierdes,
  el store cae a `"pantalon-denim"` como default.
- **jimp 1.6 no decodifica webp.** Para procesar webp usa `@cwasm/webp`
  como hace `scripts/remove-bg.mjs`.
- **Dev server imprime errores de HMR viejos** (`MeasurementsButton is not
  defined`, `photoPath is not defined`) en el console del browser al navegar
  por `/studio`. Son artefactos del cache tras refactors; un reload limpio
  los resuelve y no indican bugs reales.

## Branch y commits

Trabajamos directo en `main`. El workflow de Pages dispara en cada push.

Para commits, el convenio hasta ahora:
- `feat(web): ...` nuevas features del app
- `feat(blocks): ...` motor de patronaje
- `fix(studio): ...` bugs del editor
- `chore: ...` tooling, deps, configs
- `style(web): ...` solo estilos

Si vas a hacer cambios grandes, abre una rama y PR. Si son fixes pequeños,
commit directo a main está bien.

## Contacto

Lo construyó Miguel con Claude Code. Si tienes dudas sobre decisiones
pasadas, el histórico está en los commits y en este archivo.
