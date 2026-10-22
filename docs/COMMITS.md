# Bitácora de commits — Hilonova Studio

> Generado con `node scripts/commit-log.mjs`. No editar a mano.
> Rama: `dev/mvp-9-nov` · Commits: 16

## Cómo se documenta un commit

El mensaje de cada commit es la documentación. Formato:

```
tipo(alcance): resumen corto en español

Qué: qué cambió, en una o dos frases.
Por qué: el problema o la necesidad.
Verificación: cómo se comprobó (build, typecheck, prueba manual...).
Archivos: los principales.
```

Tipos: `feat`, `fix`, `chore`, `style`, `docs`, `refactor`, `test`.
Después de commitear, correr `node scripts/commit-log.mjs` y commitear la
bitácora como `docs: actualizar bitácora`.

---

## feat(studio): vista Graduación con tabla de tallaje y graduación manual

- Commit: `1648caf`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: nueva pestaña "Graduación" entre Editor y Trazo. Gama de tallas con
presets (S-M-L-XL, XS-XXL, 28-36), tallas incluidas y talla base editables,
tabla de tallaje con "+/talla" editable por medida y valores por talla,
botón Restablecer, y graduación manual por nodo (Δx/Δy por talla con tabla de
resultado). El nido usa gradeDoc, por lo que funciona también con piezas
agregadas o dibujadas. Los campos de entrada pasan a fields.tsx. Cambiar
medidas ya no borra la ficha técnica ni la gama de tallas.
Por qué: el concepto pide pantalla de Graduación con control de medidas y
reglas de tallaje, automática o manual.
Verificación: tsc y build de producción OK; en el navegador, con una blusa:
cambiar busto de 4 a 6 cm/talla dio 86-92-98-104; un nodo del delantero mostró
su regla (0.5, -0.17) y sus desplazamientos por talla.
Limitación: el DXF aún exporta solo la talla base.
Archivos: apps/web/app/studio/{Graduacion,fields,Shell,store,nest,Canvas,
TechPack,ExportModal}.ts(x), studio.css

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## feat(engine): graduación por reglas de nodo y reglas de tallaje editables

- Commit: `a0b5166`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: cada nodo guarda su regla de graduación (dx, dy por talla) y gradeDoc(doc,
talla) gradúa cualquier patrón. Las tallas (S/M/L/XL y numéricas) pasan a
@hilonova/geometry (sizes.ts) con presets. draftBlock deriva las reglas de cada
nodo dibujando el bloque una talla más grande (el primer nodo de cada pieza
queda como ancla), así las piezas de la biblioteca y las prendas ya traen
reglas. Se pueden editar los cm por talla de cada medida (gradeSteps en el
documento) y rederiveGrades re-gradúa sin perder piezas dibujadas.
Por qué: la graduación solo funcionaba regenerando las 4 prendas originales; el
producto pide graduación automática y manual con reglas de tallaje.
Verificación: tsc sin errores en todos los paquetes.
Archivos: packages/geometry/src/{sizes,grade,doc,index}.ts,
packages/blocks/src/index.ts

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## docs: actualizar bitácora de commits

- Commit: `760b7ec`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: regeneración de docs/COMMITS.md con los commits de herramientas de dibujo.
Por qué: mantener el registro al día.
Verificación: generado por scripts/commit-log.mjs.
Archivos: docs/COMMITS.md

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## feat(studio): herramientas de dibujo, biblioteca de piezas y propiedades editables

- Commit: `8c29e9a`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: la barra de herramientas ahora dibuja polilíneas, curvas suaves,
rectángulos y círculos; agrega nodos sobre un contorno; mide distancias y mueve
piezas, nodos y handles Bézier arrastrando (un arrastre = un deshacer). Atajos:
V H N L C R O A M, Enter cierra, doble clic deja línea abierta, Esc cancela,
Supr borra, Ctrl+D duplica. Imán a nodos existentes y a rejilla. Panel de
piezas con "+ Biblioteca" que inserta piezas centradas en la vista. Panel de
propiedades editable: nombre, cantidad, tela, margen de costura, hilo de tela,
duplicar, espejar, rotar 90°, eliminar y, por nodo, X/Y, vértice/curva y
piquete. El hilo de tela respeta su ángulo. Las líneas internas (abiertas) se
dibujan punteadas y no entran al trazo. Estado de herramienta visible en la
barra inferior.
Por qué: el concepto pide "herramientas de dibujo profesionales" y biblioteca de
piezas; el editor solo permitía mover nodos de 4 prendas.
Verificación: tsc sin errores; build de producción con basePath de Pages OK; en
el navegador se dibujó un rectángulo y una curva cerrada (Pieza 3 y 4), se
insertaron cuello y manga de la biblioteca, se agregó un nodo y se arrastró una
pieza con un solo Ctrl+Z para revertirla. Limitación conocida: el nido de tallas
se desactiva si el patrón ya no coincide con el bloque paramétrico; se resuelve
con la graduación por reglas (siguiente etapa).
Archivos: apps/web/app/studio/{Canvas,Shell,store,nest,nesting}.ts(x), studio.css

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## feat(engine): operaciones de edición y biblioteca de piezas

- Commit: `b413bea`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: nuevo módulo packages/geometry/src/edit.ts con funciones puras para crear
piezas (polilínea, curva suave, rectángulo, elipse), insertar nodos dividiendo
la curva con de Casteljau, quitar nodos, alternar vértice/curva, mover handles,
duplicar, espejar y rotar piezas, y consultas (segmento más cercano, punto
dentro de pieza). history.ts suma checkpoint/replacePresent para que un
arrastre cuente como una sola entrada de deshacer. @hilonova/blocks suma
PIECE_LIBRARY (delanteros, espaldas, mangas, cuello, pie de cuello, puño, vista,
bolsillos, pretina, trabilla) y LIBRARY_CATEGORIES.
Por qué: el producto pide CAD 2D con herramientas de dibujo y una biblioteca de
piezas; el motor solo sabía mover nodos y marcar piquetes.
Verificación: tsc sin errores en geometry, blocks, export y web.
Archivos: packages/geometry/src/edit.ts, history.ts, index.ts,
packages/blocks/src/index.ts

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## docs: actualizar bitácora de commits

- Commit: `bc48272`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: regeneración de docs/COMMITS.md con los commits de la blusa clásica y del
concepto visual.
Por qué: mantener el registro de commits al día.
Verificación: generado por scripts/commit-log.mjs.
Archivos: docs/COMMITS.md

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## feat(blocks): bloque Blusa clásica (7 piezas) y tallas S/M/L/XL

- Commit: `bc7d31c`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: nuevo bloque paramétrico "blusa-clasica" con delantero, espalda, manga,
cuello, pie de cuello, puño y vista (las piezas del concepto visual). Se agrega
soporte de tallas alfabéticas (sizeSteps, compareSizes, ALPHA_SIZES) para que la
graduación funcione con S/M/L/XL además de las numéricas (28-44). La blusa usa
base M y gama S-XL. La app asigna colores a S/M/L/XL, ordena tallas con
compareSizes, activa las tallas del documento al abrirlo (loadDoc) y reutiliza
la silueta de medidas de playera. Reglas de graduación de la blusa: busto,
cintura y cadera 4 cm/talla; hombro y cuello 1; sisa 0.8; torso y manga 1.
Por qué: el concepto visual aprobado pide S/M/L/XL y una blusa clásica como
pieza de ejemplo; el motor solo graduaba tallas numéricas con parseInt (NaN
con letras).
Verificación: tsc sin errores en blocks y web; build de producción con
basePath de Pages OK; en el navegador (dev) se creó una blusa: 7 piezas, talla
base M, nido de tallas S/M/L/XL superpuestas, Trazo con 13 piezas, 55 % de
aprovechamiento, 1.22 m de largo. Limitaciones conocidas: el delantero
izquierdo no se espeja en el trazo; las curvas de manga/cuello son base inicial
a calibrar con una patronista; el DXF de la blusa no se probó en Gerber/Lectra.
Archivos: packages/blocks/src/index.ts, apps/web/app/studio/store.ts,
apps/web/app/studio/MeasurementSilhouette.tsx, apps/web/app/app/new/page.tsx

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## docs: guardar concepto visual aprobado del software como referencia

- Commit: `d3ff1a0`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: se agrega docs/concepto-visual.webp, la imagen de concepto entregada por
HiloNova (Patronaje 2D, Graduación S/M/L/XL, Trazo con consumo por talla,
Producción con ficha técnica, 3D opcional y variantes de modelo).
Por qué: es el objetivo de producto contra el que se mide el MVP; debe vivir en
el repo y no solo en un chat.
Verificación: archivo presente en docs/ (254 KB).
Archivos: docs/concepto-visual.webp

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## docs: actualizar bitácora de commits

- Commit: `e60f4b3`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: primera generación de docs/COMMITS.md con el historial hasta el commit
anterior.
Por qué: dejar el registro documentado desde el inicio del trabajo en la rama
dev/mvp-9-nov.
Verificación: archivo generado por scripts/commit-log.mjs.
Archivos: docs/COMMITS.md

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## chore: agregar generador de bitácora de commits (docs/COMMITS.md)

- Commit: `f2eb3be`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: script scripts/commit-log.mjs que publica el historial de git, con el
cuerpo de cada commit, en docs/COMMITS.md.
Por qué: se requiere documentar todos los commits; generarlo desde git evita
que la bitácora se desincronice del historial real.
Verificación: ejecutado con node, genera el archivo sin errores.
Archivos: scripts/commit-log.mjs

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## fix(web): envolver useSearchParams en Suspense para que compile el build

- Commit: `2cce0c6`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: /studio y /auth/signup ahora renderizan su contenido dentro de <Suspense>.
Por qué: `next build` (export estático) fallaba con "useSearchParams() should be
wrapped in a suspense boundary at page /studio", lo que impedía publicar en
GitHub Pages; por eso el sitio publicado estaba desactualizado (/pricing = 404).
Verificación: `pnpm --filter @hilonova/web build` con
NEXT_PUBLIC_BASE_PATH=/hilonova-studio termina OK, 11/11 páginas estáticas.
Archivos: apps/web/app/studio/page.tsx, apps/web/app/auth/signup/page.tsx

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## fix(auth): flujo de sesion bien conectado en toda la landing

- Commit: `1958844`
- Fecha: 2026-10-22
- Autor: TEC Capital web

- /auth/signin y /auth/signup: redirigen a /app si ya hay sesion activa,
  en vez de dejar que el usuario reautentique sin razon.
- Nav de la landing: nuevo componente client LandingAuthCta que lee la
  sesion. Sin sesion muestra "Iniciar sesion / Crear cuenta"; con sesion
  muestra el nombre del usuario (link a /account) + "Entrar al estudio"
  (link a /app).
- CTA del hero (arriba y abajo): mismo cambio, "Crear cuenta" se vuelve
  "Entrar al estudio" cuando ya hay sesion.

Resultado: ya no te manda a crear otra cuenta cuando ya tienes una, y
el camino desde la landing al dashboard es un solo click.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>

## feat: fases 1-12 — motor, SaaS shell y Tech Pack editor

- Commit: `4e82124`
- Fecha: 2026-10-22
- Autor: TEC Capital web

Entrega end-to-end del software de patronaje B2B: del bloque paramétrico
al PDF Tech Pack listo para la maquila.

Motor (@hilonova/geometry):
- vec/bezier/doc/piece/history/offset: TS puro, serializable, sin UI
- Undo/redo inmutable encima del documento
- Curvas Bézier cúbicas con samplePath, bounds, offset de costura

Bloques (@hilonova/blocks):
- 4 bloques paramétricos reales: pantalón denim slim, pantalón vestir,
  playera básica (3 piezas: delantero/espalda/manga), falda recta
- BLOCK_CATALOG como fuente de verdad para la UI
- Reglas de graduación por bloque (deltas industriales mexicanos)
- draftBlock + graduateBlock + measurementsForBlockSize
- blockKind marcado en el PatternDoc para que el editor sepa qué draft
  usar al cambiar medidas

Export (@hilonova/export):
- DXF-AAMA (layers 1_Boundary, 4_Notch, 5_Grainline, 8_Text, 15_SeamAllowance)
- SVG limpio, PDF A4 mosaico tiled
- Tech Pack PDF multi-página (portada + medidas + flats + BOM)
- ExportModal usa doc.techPack como fuente de verdad

Editor /studio:
- 3 vistas: Editor (canvas CAD), Trazo (nesting), Ficha (Tech Pack)
- Canvas 2D con pan/zoom/snap, selección y edición de nodos, piquetes
- Panel de medidas visual con silueta SVG por bloque y highlight al hover
- HUD flotante "Nido de tallas" con chips de colores y toggle por talla
- Tech Pack editor con form (encabezado, BOM, specs, notas) + preview A4
  en vivo que simula las 4 páginas del PDF
- Trazo con shelf-packing y % de aprovechamiento

SaaS shell (apps/web):
- Landing con hero, bloques y pricing (todos los CTAs atados a /auth/*)
- Signin/Signup con mock localStorage + Google/Apple SSO mock
- AuthAside premium: gradiente navy + stitch animado + hilos ondulantes
- Dashboard /app con biblioteca de patrones y thumbnails
- /app/new: galería "elige tu bloque"
- /account, /pricing con los 3 planes (Taller/Maquila/Industrial)

Docs:
- README actualizado con el estado real
- HANDOFF.md con guía completa para el próximo compañero

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>

## style(web): responsive bien atado para movil, tablet y breakpoints intermedios

- Commit: `c4d05af`
- Fecha: 2026-10-22
- Autor: TEC Capital web

Problemas observados en vivo:
- 768-1024 (tablet): "Iniciar sesion" se envolvia a 2 lineas y empujaba el
  boton "Solicitar demo" fuera del pill del nav.
- Mobile: pcards con aspect 3/3.4 ocupaban casi todo el alto; sc-body con
  columnas fijas rompia el showcase; testimonial con grid "auto 1fr" no
  cambiaba a bloque; hero con padding fijo + tipografia muy grande; footer
  en 2 columnas incomodo.

Correcciones (todo en el bloque RESPONSIVE de globals.css):

- Nuevo breakpoint 1024px: oculta nav-links y nav-login antes de que el pill
  del nav se desborde. Entre 1024 y mobile solo se ve logo + boton demo.
- 940px (ya existia): se agregan hero-prod centrado, sc-body a 2 columnas
  ocultando sc-panel (el panel lateral del showcase no cabe), y testimonial
  pasa a bloque vertical.
- 720px (reescrito): strip con padding superior para no colisionar con el
  nav sticky; hero mas denso (padding, h1, sub, CTAs, stats); secciones y
  h2 reducidos; pcards a 1 columna con aspect 5/4; vcard/stepc/plan con
  padding menor; CTA band mas chico; footer a 1 columna; marca del nav
  escalada.
- Nuevo breakpoint 420px (iPhone SE): nav-in con padding ajustado; hero
  card aun mas compacto; --gut baja a 14px; .sec a 40px.

Revisado en vivo contra el dev local a 375 / 768 / 1280 y las secciones
hero, strip, pcards, flow steps, pricing, testimonial, CTA y footer.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>

## ci: pnpm action-setup toma la version del packageManager (sin pinnearla al 9)

- Commit: `09ca2dc`
- Fecha: 2026-10-22
- Autor: TEC Capital web

El primer run de Pages fallo con "Multiple versions of pnpm specified" porque
el workflow pedia 9 y el repo declara 11.11.0 en package.json. Al quitar
`version` del paso, pnpm/action-setup usa la del packageManager.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>

## chore: primer commit — landing, design system y monorepo base

- Commit: `c5eef48`
- Fecha: 2026-10-22
- Autor: TEC Capital web

Monorepo pnpm + Turborepo con:
- apps/web: Next.js 15 (App Router) + TypeScript. Landing con hero, flujo de
  trabajo, pricing y testimonial. Puerto dev 4321.
- packages/ui: design system (tokens + componentes base).
- packages/geometry, packages/blocks, packages/export: esqueletos del motor
  de patronaje para las fases siguientes.

Despliegue:
- Landing como sitio estatico (output: 'export') publicado en GitHub Pages
  via .github/workflows/pages.yml.
- next.config.mjs usa NEXT_PUBLIC_BASE_PATH para que las rutas /img, /brand y
  /video se sirvan bajo /hilonova-studio/ en Pages y en la raiz en dev local.
- Un helper asset() en app/page.tsx prefija los <img>/<video> absolutos, y
  layout.tsx expone --brand-mark como variable CSS con el basePath correcto
  para que el background-image de la marca tambien se resuelva.

Nav: el contenedor exterior lleva ahora el gutter y la pila (.nav-in) se
centra con margin:auto, en lugar de quedar pegada a la izquierda.

Testimonial: la seccion existia con placeholder; se puso contenido realista
marcado "Piloto en pruebas" y "nombre y cargo por confirmar" (comentario
visible en el JSX avisa que debe reemplazarse por un testimonio real con
autorizacion por escrito antes de citarlo como cliente).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>

