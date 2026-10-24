# Handoff — Hilonova Studio

Guía rápida para quien agarre el proyecto después. Léela antes de abrir el
editor. Lo que se hizo entre el 22 y el 24 de octubre de 2026, con todos los
detalles, está en **[docs/CAMBIOS-OCT-2026.md](./docs/CAMBIOS-OCT-2026.md)**.

## Qué es

Programa web de **patronaje digital** para maquilas, talleres y alumnos de
confección en México. El patronista mete medidas, el sistema traza el bloque
base (17 prendas), lo gradúa por talla, acomoda el trazo con consumo de tela y
exporta PDF (mosaico A4, 1:1 para plotter, ficha técnica), SVG y **DXF estilo
AAMA** (en validación: todavía no se prueba en Gerber/Lectra).

Web primero (Next.js 15). Escritorio (Tauri) reutilizaría el motor en una fase
posterior. Cursos / academia están **fuera de alcance** — es otro proyecto
(`hilonova-web`, hilonovamx.com).

Piezas del ecosistema (ver `docs/MAPA-DE-PAGINAS.md`):
- **`hilonova-studio`** (este repo): el programa.
- **`HiloNova-CAD`**: la página de venta; el programa compilado vive en su carpeta `programa/` (se genera con `scripts/publicar-en-cad.mjs`).
- **`hilonova-web`**: sitio de formación, no se tocó.

## Cómo arrancar

```bash
git clone https://github.com/teccapitalweb/hilonova-studio.git
cd hilonova-studio
git checkout dev/mvp-9-nov
pnpm install
pnpm dev          # http://localhost:4321
pnpm test         # 667 pruebas
```

Node ≥ 20 y pnpm ≥ 11 (viene fijado en `packageManager`). En Windows el
`pnpm` no siempre está en el PATH: se usa `corepack pnpm …`.

## Decisiones clave que ya tomamos

1. **Cuentas con Firebase** (Authentication + Firestore, plan gratis Spark).
   La configuración **pública** vive en `apps/web/app/lib/firebase-config.ts`
   (no es secreta; protegen las reglas de `firebase/firestore.rules`). Si esa
   configuración estuviera vacía, el programa entra en «modo de prueba» (cuenta
   solo en el navegador). **Sin plan Blaze**: no hay funciones en la nube.
2. **Patrones: navegador primero, nube después.** `lib/library.ts` guarda en
   `localStorage` (`library-raw.ts`) y `lib/cloud.ts` copia cada cambio a
   Firestore `users/{uid}/patterns/{id}` (cola, mezcla por fecha, separación
   entre cuentas). Materiales, «Mis piezas» y preferencias siguen solo en el
   navegador.
3. **Cobro con enlace de pago de Stripe + acceso a mano.** El interruptor
   `apps/web/app/lib/billing-config.ts` (`enabled`) viene **apagado**: mientras
   lo esté, todas las cuentas entran gratis. Con él encendido, `PlanGate` pide
   «Activa tu plan» a quien no tenga un documento `access/{uid}` en Firestore
   (lo crea el negocio a mano). Ver `docs/COBRO-PASOS.md`.
4. **Un solo plan «Completo»: $490 MXN al mes, 1 usuario.** Sin planes por
   partes ni límite de exportaciones. El acceso de alumnos lo da el negocio a
   mano por 30 días y **no se anuncia** en páginas públicas.
5. **El motor (`@hilonova/geometry`) NO conoce React.** TypeScript puro,
   serializable (para un futuro shell de escritorio).
6. **Zustand para el estado del editor** (`apps/web/app/studio/store.ts`).
   Toda mutación del documento pasa por `apply(next)` sobre un historial
   inmutable (undo/redo).
7. **Puerto dev `4321`.** GitHub Pages estático con `NEXT_PUBLIC_BASE_PATH`.
   El workflow `.github/workflows/pages.yml` **solo se dispara al subir a
   `main`**; las ramas de trabajo no publican nada.
8. **Honestidad ante todo:** ninguna página promete lo que el programa no hace
   (hay pruebas que lo vigilan: `portada-honesta`, `legal`, `oferta`).
9. **No commitear secretos.** `.env*` está ignorado. Las llaves de Stripe (si
   algún día hay funciones) irían como secretos de Firebase, nunca en el código.

## Estructura — qué está dónde

```
packages/
├─ geometry/src/   vec, bezier, doc (PatternDoc/Piece/Node/TechPackMeta), edit,
│                  grade, history, offset, piece, sizes
├─ blocks/src/     BLOCK_CATALOG (17 prendas), draftBlock, reglas de tallaje
└─ export/src/     dxf (R12, capas estilo AAMA, internas en capa 6), svg,
                   pdf (mosaico A4 con hoja de instrucciones), techpack, marker

apps/web/app/
├─ page.tsx             Portada del programa (sin cifras ni promesas sin respaldo)
├─ (saas)/              Nav superior (Patrones · Cuenta) + estilos
├─ auth/                signin/signup (correo+contraseña, Google), AuthAside, SsoButtons
├─ app/                 Panel «Tus patrones» y galería «Elige un bloque» (17 fotos)
├─ account/             Cuenta y facturación (estado del acceso)
├─ terminos/ privacidad/ + legal/   Textos legales (sin datos de la empresa)
├─ components/          PlanGate («Activa tu plan»), ScrollReveal
├─ studio/              EDITOR: Shell, Canvas, Graduacion, Trazo, Produccion, TechPack,
│                       Proyectos, Materiales, Libreria, Reportes, Config, Ayuda,
│                       ExportModal, store, nesting, estilos
└─ lib/                 auth, auth-errors, firebase, firebase-config, cloud,
                        cloud-merge, library, library-raw, billing, billing-core,
                        billing-config, collection, materials, pieces, prefs, paths

firebase/               firebase.json (emulador de Authentication) y firestore.rules
scripts/                commit-log.mjs (bitácora), publicar-en-cad.mjs, remove-bg.mjs
tests/                  21 archivos, 667 pruebas (Vitest)
docs/                   CAMBIOS-OCT-2026, COMMITS, ANALISIS-CUMPLIMIENTO, COBRO-PASOS,
                        FIREBASE-PASOS, MAPA-DE-PAGINAS, PROPUESTA-PLANES,
                        PREGUNTAS-PARA-EL-JEFE, prueba-gerber/
```

## Flujo típico

1. `/auth/signup`: crea la cuenta (correo y contraseña, o Google) → llega un correo de verificación.
2. `/app`: panel «Tus patrones» → «Nuevo patrón» → elige una de las 17 prendas (o «En blanco»).
3. `/studio?id=…`: editor. Pestañas **Diseño · Graduación · Trazo · Producción** y menú lateral (Proyectos, Materiales, Librería, Reportes, Configuración).
4. Se guarda solo (navegador) y, con cuenta, en la nube; el editor dice «en la nube».
5. **Exportar**: PDF mosaico A4, ficha técnica PDF, SVG, DXF (y desde Trazo: DXF/PDF 1:1/SVG del trazo).

## Qué funciona de verdad

- Motor, 17 prendas con pinzas, graduación automática y manual, trazo y reportes, ficha técnica, variantes de modelo, verificación de costuras.
- Cuentas reales (probadas por el negocio) y guardado de patrones en la nube (probado con nube de mentira).
- PDFs verificados visualmente; DXF validado en estructura (no en Gerber).

## Qué NO está terminado

- **Probar el guardado en la nube con Firestore real** y confirmar que las reglas de `patterns` están publicadas.
- **Cobro:** falta crear el enlace de pago en Stripe, ponerlo en `billing-config.ts` y encender `enabled`. Los textos dicen «más IVA» pero Stripe quedó con IVA incluido: confirmar y unificar.
- **Validación del maestro costurero** y **prueba del DXF en Gerber** (`docs/prueba-gerber/`).
- **Vista 3D**: descartada por ahora.
- **Sincronizar** materiales, «Mis piezas» y preferencias en la nube.
- **Otros navegadores y tableta**: solo se ha probado en Chrome de escritorio.
- **Revisión legal** de términos y privacidad; dominio y publicación.

## Convenciones

- Scope `@hilonova/*`, enlazados con `workspace:*`.
- El motor (`geometry`) **no importa React** ni DOM.
- Paleta: navy `#14192A` / `#1F2A48` / `#0D1428`, accent `#F0662C` / `#FF7E45`.
  Dos mundos: estudio claro (producto) y taller oscuro (editor).
- Fuentes: Bricolage Grotesque + Plus Jakarta Sans + IBM Plex Mono (`next/font`).
- Textos en español sencillo; nada se promete sin respaldo.
- **Cada commit documentado** (*Qué / Por qué / Verificación / Archivos*) y `node scripts/commit-log.mjs` para regenerar `docs/COMMITS.md`.

## Gotchas conocidos

- **`pnpm dev` y `publicar-en-cad.mjs` comparten `.next`:** parar el servidor antes de publicar y reiniciarlo después. Para un segundo servidor de pruebas: `NEXT_DIST_DIR=.next-test`.
- **Next regenera `apps/web/tsconfig.json`** al correr; descartar ese cambio (`git checkout apps/web/tsconfig.json`).
- **Windows:** avisos «LF will be replaced by CRLF» son normales; nombres de archivo sin distinguir mayúsculas (`Ayuda.tsx` vs `ayuda.ts` chocan).
- **Probar cuentas sin tocar el Firebase real:** emulador de Authentication (`firebase/firebase.json`, no necesita Java). El de Firestore sí necesita Java (no instalado).
- **Las capturas del navegador integrado salen en blanco al desplazarse** en algunas páginas: verificar leyendo el texto de la página.
- **El `blockKind` vive en el `PatternDoc`**; si se pierde, el store cae a `pantalon-denim`.
- **jimp no decodifica webp:** `scripts/remove-bg.mjs` usa `@cwasm/webp`.
- **La puerta «Activa tu plan» es del lado del navegador:** frena al usuario común, no a un programador.

## Ramas y commits

El trabajo está en la rama **`dev/mvp-9-nov`** (programa) y **`dev/conectar-con-studio`**
(página de CAD). `main` no se toca hasta que el negocio decida publicar: el
workflow de Pages dispara al subir a `main`. Convenio de commits:
`feat:` / `fix:` / `refactor:` / `docs:` / `test:` / `chore:`, con el cuerpo
*Qué / Por qué / Verificación / Archivos*.

## Contacto

Lo construyó Miguel con Claude Code. Dudas de decisiones pasadas: `docs/CAMBIOS-OCT-2026.md`
y el histórico de commits (`docs/COMMITS.md`).
