# Bitácora de commits — Hilonova Studio

> Generado con `node scripts/commit-log.mjs`. No editar a mano.
> Rama: `dev/mvp-9-nov` · Commits: 45

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

## feat(studio): vista 3D de la prenda armada

- Commit: `9b5f94b`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: nueva pestaña Producción → Vista 3D. Arma el patrón sobre un cuerpo para
girarlo, acercarlo y verlo de frente, lado o espalda, en cada talla (S/M/L/XL o
la numeración de la prenda) y en 7 colores de tela, con o sin contornos de las
piezas. Cada pieza plana se envuelve alrededor de una sección elíptica cuya
circunferencia es el ancho del delantero más el de la espalda a cada altura;
las mangas van como tubos, el pantalón como dos piernas y las faldas como un
tronco. Al armar la prenda se cierran las pinzas (se quita la punta de la V) y
el ancho se suaviza para que no marque un pliegue en la axila. three.js se carga
solo al abrir esta pestaña.
Por qué: el encargo pedía una vista 3D opcional de la prenda en producción.
Verificación: 482 pruebas (61 de la vista 3D: familias de prenda, mallas sin
huecos ni NaN, tallas más grandes dan prendas más anchas, pinzas cerradas),
tipos sin errores en los 4 paquetes y build de producción correcto; revisada en
la app con blusa, camisa, falda en A y pantalón cargo. Es una vista aproximada:
no dibuja cuellos, puños ni bolsillos y no es una simulación de tela.
Archivos: apps/web/app/studio/drape.ts, apps/web/app/studio/Vista3D.tsx,
apps/web/app/studio/Produccion.tsx, apps/web/app/studio/studio.css,
apps/web/package.json, pnpm-lock.yaml, tests/drape.test.ts

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## feat(blocks): pinzas puestas en los patrones base

- Commit: `aa74a43`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: los patrones base ahora traen pinzas paramétricas, que se redibujan con las
medidas y se gradúan con las tallas: falda recta (cintura, delantero y espalda),
falda en A (2 en el delantero, 1 por mitad en la espalda), vestido básico
(pinza de busto a cada lado desde el costado), blusa clásica (pinza de busto
en el costado) y bermuda y pantalón cargo (pinza trasera de cintura). El ancho de
la pinza sale de las medidas: las de cintura reparten la diferencia con la cadera
(40 % delantero, 55 % espalda) y la de busto crece con el contorno de busto
(≈2.6 cm con busto 92). El margen de costura limita las puntas agudas a 2 ×
el margen (antes hasta 5 ×) para que no se dispare en el vértice de una pinza.
Por qué: faltaban las pinzas en las prendas que las necesitan.
Verificación: 421 pruebas (10 nuevas: cada prenda trae sus pinzas en las 4 tallas,
boca entre 0.8 y 7 cm, la playera no trae, más busto = pinza más ancha); en la app
el vestido muestra las dos pinzas de busto.
Archivos: packages/blocks/src/index.ts, packages/geometry/src/offset.ts,
tests/blocks.test.ts

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## docs: actualizar bitácora de commits

- Commit: `c57ba3b`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: regeneración de docs/COMMITS.md con exportar trazo y herramientas de edición.
Por qué: mantener el registro al día.
Verificación: generado por scripts/commit-log.mjs.
Archivos: docs/COMMITS.md

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## feat(studio): verificar costuras y mangas que encajan en la sisa

- Commit: `27358db`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: nueva herramienta Costura (S): se marcan tramos del contorno con dos clics en
nodos de una pieza; el lado A es la referencia y el lado B lo que se cose contra
A (cada lado puede sumar varios tramos, p. ej. sisa del delantero + sisa de la
espalda contra la cabeza de manga). El panel muestra A, B, la diferencia, una
holgura prevista editable (coincide si |B − A − holgura| ≤ 0.5 cm) y, al abrir una
comparación, el resultado de cada talla. Los tramos se resaltan en el lienzo (A
turquesa, B rosa). Las comprobaciones se guardan con el proyecto y sobreviven a
cambiar las medidas (se ubican por nombre de pieza e índice de nodo). Motor:
contourRun, sideLength, seamResult, makeSeamRun, resolveSeamRun.
Corrección de patrones encontrada con esta herramienta: las mangas de blusa,
camisas, chamarra, sudadera y polo tenían una altura de cabeza fija y no
cerraban con la sisa (blusa +4.7 a +6.3 cm de más; sudadera −3 a −5 cm de menos;
polo con formas rotas en S y XL). Ahora la cabeza de manga se ajusta a
sisa + holgura (2.5 cm tejido plano, 3 chamarra, 0 sudadera, 0.5 polo) por
bisección, limitada al 62 % del largo de la manga (si no alcanza, ensancha la manga).
Por qué: el concepto pide verificar que las costuras midan lo mismo.
Verificación: 411 pruebas (32 de costuras: tramos, comparación, flujo del
editor, supervivencia al cambio de medidas, mangas = sisa + holgura ±0.9 cm en
todas las tallas, hombros iguales ±0.6 cm, cabeza menor que la manga); tsc y build OK;
en la app, hombro del delantero 14.9 cm vs espalda 14.5 cm (✓ en S, M, L y XL).
Limitaciones: playera básica y camisas con canesú no están en la comprobación
automática del hombro; el margen de costura alrededor de pinzas angostas es aproximado.
Archivos: packages/geometry/src/{doc,edit}.ts, packages/blocks/src/index.ts,
apps/web/app/studio/{store,Canvas,Shell}.ts(x), studio.css, tests/seams.test.ts

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## feat(studio): herramienta de pinzas

- Commit: `bb74b94`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: nueva herramienta Pinza (P): 1.er clic en el contorno (la boca) y 2.º clic
dentro de la pieza (la punta). Abre una "V" en el contorno con el ancho de boca
configurado (0.5 a 12 cm, por defecto 2.5) centrada en el punto elegido; vista
previa mientras se mueve el cursor y avisos claros si la punta queda fuera de la
pieza o la boca no cabe en el tramo. Los nodos nuevos heredan una regla de
graduación interpolada de sus vecinos (también al agregar un nodo normal), así la
pinza se gradúa con la pieza. Motor: addDart y segmentTangent.
Por qué: el concepto y la práctica de patronaje piden pinzas; sin ellas los
patrones base de pecho, cintura y cadera quedan incompletos.
Verificación: 379 pruebas (13 nuevas de pinza: geometría, área quitada = triángulo,
boca exacta, límites, curvas, herencia de graduación, editor, DXF graduado con
pinza válido); en la app se abrió una pinza en el borde inferior del delantero de
una falda en A. Limitación: el margen de costura alrededor de una pinza muy
angosta es aproximado.
Archivos: packages/geometry/src/edit.ts, apps/web/app/studio/{store,Canvas,Shell}.ts(x),
tests/darts.test.ts

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## feat(studio): herramienta de texto pegado a la pieza

- Commit: `f4bc422`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: nueva herramienta Texto (T): clic sobre una pieza (o cerca de ella) agrega
una nota. Se edita en el panel (contenido y alto), se arrastra, se borra con Supr,
y acompaña a su pieza: se mueve, gira, espeja y se copia con ella. Sale en el DXF
(capa 8_Text, ASCII, también en el graduado, una vez por talla), en el SVG y en el
PDF mosaico. El modelo suma Piece.labels y el motor addLabelToPiece, updateLabel,
moveLabel, removeLabel, labelPosition y labelBox.
Por qué: el concepto pide herramienta de texto; las notas se pegan a la pieza
porque el DXF y el PDF reacomodan las piezas y un texto suelto quedaría fuera de
lugar.
Verificación: 366 pruebas (14 nuevas de textos: motor, editor y exportación); en
la app se agregó "Doblez al centro" sobre el delantero de una falda en A y se editó.
Archivos: packages/geometry/src/{doc,edit}.ts, packages/export/src/{dxf,svg,pdf}.ts,
apps/web/app/studio/{store,Canvas,Shell}.ts(x), tests/labels.test.ts

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## feat(studio): selección múltiple, copiar y pegar, y rotar a cualquier ángulo

- Commit: `d5f88aa`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: Ctrl+clic agrega o quita piezas de la selección (también en el panel de
piezas), Ctrl+arrastre en el vacío dibuja un recuadro que selecciona las piezas
que toca, Ctrl+A selecciona todo. Arrastrar una pieza seleccionada mueve todo el
grupo; Duplicar, Espejar, Copiar y Eliminar actúan sobre el grupo; Rotar gira el
grupo como un cuerpo rígido alrededor de su centro. Copiar/Pegar (Ctrl+C / Ctrl+V
y botones) con portapapeles que sobrevive al abrir otro proyecto; cada pegado
se desplaza 6 cm más. Nueva fila "Rotar" con ángulo libre (⟲ ⟳) para una pieza o
el grupo. El motor suma rotatePieceAbout y piecesCenter.
Por qué: faltaban herramientas básicas de un CAD profesional.
Verificación: 352 pruebas (12 nuevas del editor: selección, mover grupo,
rotación rígida y de ángulo libre, copiar/pegar entre proyectos, duplicar, borrar
con deshacer, espejar); en la app, Ctrl+A seleccionó 7 piezas y rotarlas 30° las
giró juntas.
Archivos: packages/geometry/src/edit.ts, apps/web/app/studio/{store,Canvas,Shell}.ts(x),
tests/editor.test.ts

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## feat(export): exportar el trazo a DXF, PDF 1:1 y SVG

- Commit: `4540990`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: nuevo exportador del trazo (packages/export/src/marker.ts) y tres botones en
la vista Trazo: DXF (capas AAMA más 20_Fabric con el borde de la tela; línea de la
pieza, línea de corte con margen, hilo, piquetes y rótulos con la talla), PDF a
escala 1:1 del tamaño real del trazo para plotter (con regla de control de 10 cm;
si el trazo pasa de 5 m se reparte en páginas continuas) y SVG a escala 1:1. Sirve
para una talla o para el trazo combinado. El trazo ahora guarda los piquetes ya
colocados. El DXF reutiliza los ayudantes de dxf.ts (ahora exportados).
Por qué: el concepto habla de preparación para corte en producción; el trazo solo
se veía en pantalla.
Verificación: 340 pruebas (30 nuevas del exportador); en la app, con una blusa, se
generaron los tres archivos: DXF con 13 piezas, 28 piquetes y 13 hilos, sin
observaciones del validador; PDF de 1524 × 1197.5 mm en una página (150 cm de tela
+ márgenes = escala 1:1). No se probó el DXF en Gerber/Lectra reales.
Archivos: packages/export/src/{marker,dxf,index}.ts,
apps/web/app/studio/{Trazo.tsx,nesting.ts,download.ts}, tests/marker.test.ts

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## docs: actualizar bitácora de commits

- Commit: `212a9f8`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: regeneración de docs/COMMITS.md con las pruebas automáticas.
Por qué: mantener el registro al día.
Verificación: generado por scripts/commit-log.mjs.
Archivos: docs/COMMITS.md

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## test: 310 pruebas automáticas del motor, las 17 prendas, el trazo y el DXF

- Commit: `bdff913`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: carpeta tests/ con cuatro archivos. geometry: margen de costura hacia afuera
sin importar el sentido de dibujo, sin picos con puntos repetidos, tallas,
graduación por reglas de nodo, espejar, rotar e insertar nodos. blocks: para cada
una de las 17 prendas, número de piezas igual al catálogo, medidas de arranque,
coordenadas finitas, áreas positivas, ids únicos, sin empalmes sobre la mesa,
graduación que crece de talla en talla y ancla fija, reglas de tallaje editadas,
y la biblioteca de piezas. nesting: todas las copias dentro de la tela y sin
empalmes, métricas coherentes, avisos de piezas que no caben, espejo de pares,
trazo combinado. dxf: estructura R12, solo entidades POLYLINE/VERTEX/SEQEND/
LINE/TEXT, ASCII, capas declaradas, margen por fuera y sin picos, hilo y rótulo
por pieza, todas las tallas en el graduado, y las 17 prendas exportan bien.
Por qué: red de seguridad para los errores encontrados y los que vengan.
Verificación: `pnpm test` → 310 pruebas pasan. Prueba de utilidad: con el
offset.ts y dxf.ts de antes de las correcciones fallan 58 pruebas.
También corrige un detalle que las pruebas encontraron: una pieza del trazo podía
sobresalir hasta ~0.05 cm del borde de la tela (el ancho se tomaba del último
centro de celda y no de la extensión real del contorno).
Archivos: tests/*.ts, apps/web/app/studio/nesting.ts, README.md

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## chore: agregar Vitest para pruebas automáticas

- Commit: `97e4557`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: se agrega vitest (^2.1.9) como dependencia de desarrollo en la raíz, los
scripts `pnpm test` y `pnpm test:watch`, y vitest.config.ts con alias a los
paquetes @hilonova/* para importar su código fuente. pnpm-workspace.yaml marca
esbuild con allowBuilds: false (su script de instalación es opcional).
Por qué: se encontraron tres errores en el DXF que las pruebas manuales no
detectaron; hace falta una red de seguridad que se corra con un comando.
Verificación: `pnpm install` y `pnpm test` corren sin errores.
Archivos: package.json, pnpm-lock.yaml, pnpm-workspace.yaml, vitest.config.ts

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## docs: actualizar bitácora de commits

- Commit: `7d5537d`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: regeneración de docs/COMMITS.md con la corrección del pico en el margen.
Por qué: mantener el registro al día.
Verificación: generado por scripts/commit-log.mjs.
Archivos: docs/COMMITS.md

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## fix(engine): el margen de costura ya no tiene un pico de 5 cm en el primer vértice

- Commit: `c5b1f3d`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: offsetPolyline descarta los puntos repetidos seguidos y el que cierra el
contorno repitiendo el primero antes de calcular las normales.
Por qué: el muestreo de una pieza cerrada repite su primer punto al final; la
tangente de largo cero descontrolaba la normal y el margen salía con un pico de
5 cm en ese vértice, en todas las piezas (se vio en un DXF descargado). Eso
también agrandaba artificialmente el alto de cada pieza en el trazo.
Verificación: tsc y build OK. DXF graduado de la falda en A regenerado y revisado:
24 polilíneas cerradas, sin observaciones; distancia máxima del margen al contorno
1.56 cm (antes 5.00 cm) y 0 piezas con picos (antes 12 de 12).
Archivos: packages/geometry/src/offset.ts

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## docs: actualizar bitácora de commits

- Commit: `fb811ca`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: regeneración de docs/COMMITS.md con la corrección del margen de costura.
Por qué: mantener el registro al día.
Verificación: generado por scripts/commit-log.mjs.
Archivos: docs/COMMITS.md

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## fix(engine): margen de costura siempre hacia afuera y DXF compatible con R12

- Commit: `872e0d1`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: offsetPolyline detecta el sentido del contorno con el área con signo, así
que un margen positivo siempre queda por fuera de la pieza (antes dependía de
cómo se dibujó: en muchas piezas quedaba hacia adentro). El DXF escribe las
polilíneas como POLYLINE + VERTEX + SEQEND (R12), que coincide con la cabecera
AC1009 y lo leen todos los CAD, en vez de LWPOLYLINE (R14). Los rótulos del DXF
se pasan a ASCII (sin acentos ni símbolos: "Puño" → "PUNO", "×" → "x").
Por qué: al revisar el DXF descargado se vio que la línea del margen de costura
caía dentro del contorno, lo que también achicaba las piezas que usa el trazo
para calcular consumo; y la cabecera declaraba R12 pero el archivo usaba una
entidad de R14.
Verificación: tsc OK y build OK. Se generó de nuevo el DXF graduado de la falda en
A y se validó con un lector propio: 24 polilíneas cerradas, 3288 vértices,
sin observaciones, 0 caracteres no ASCII, las 12 piezas con margen por fuera
(p. ej. 2905 cm² de contorno → 3123 cm² con costura). No se probó en Gerber ni
Lectra reales. Los consumos del trazo cambian (ahora se acomodan las piezas con
su margen real).
Archivos: packages/geometry/src/offset.ts, packages/export/src/dxf.ts

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## docs: actualizar bitácora de commits

- Commit: `48e2f59`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: regeneración de docs/COMMITS.md con las cinco prendas nuevas.
Por qué: mantener el registro al día.
Verificación: generado por scripts/commit-log.mjs.
Archivos: docs/COMMITS.md

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## feat(blocks): camisa de hombre, camisa manga corta, polo, chaleco y pantalón cargo

- Commit: `4cc3837`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: cinco prendas nuevas con reglas de graduación y medidas de arranque
propias. Camisa de hombre (9 piezas: delantero, espalda, canesú, manga, cuello,
pie de cuello, puño, tapeta, bolsillo de pecho) y Camisa manga corta (8, sin
puño). Playera polo (7: delantero, espalda, manga, cuello de polo, puño de rib,
tapeta y una línea interna de abertura sobre el delantero). Chaleco (5: escote
en V, bajo en punta, forro y vivos de bolsillo). Pantalón cargo (7: delantero,
espalda, pretina, bolsillo cargo con solapa, bolsillo trasero, trabillas). Las
piezas abiertas (líneas internas) ya no llevan margen de costura. La biblioteca
suma 19 piezas de estas prendas (canesú, tapeta, cuello de polo, bolsillo cargo,
etc.).
Por qué: el usuario pidió estas prendas después de las siete anteriores.
Verificación: tsc y build de producción OK; en el navegador cada prenda se crea
con el número de piezas esperado y la camisa manga corta gradúa S/M/L/XL
(busto 96-100-104-108). Limitaciones: patrones base sin pinzas ni fuelles
detallados; calibrar curvas con una patronista.
Archivos: packages/blocks/src/index.ts,
apps/web/app/studio/MeasurementSilhouette.tsx

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## docs: actualizar bitácora de commits

- Commit: `2c54d9e`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: regeneración de docs/COMMITS.md con los commits de las prendas nuevas.
Por qué: mantener el registro al día.
Verificación: generado por scripts/commit-log.mjs.
Archivos: docs/COMMITS.md

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## feat(studio): la galería usa las medidas propias de cada prenda y soporta los nuevos bloques

- Commit: `53dd085`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: "Nuevo patrón" crea cada prenda con sus medidas de arranque (un short no
nace con 104 cm de largo); la silueta del panel de medidas cubre las prendas
nuevas; el control de largo acepta desde 30 cm; el texto de la galería ya no
dice "talla 32".
Por qué: los bloques nuevos tienen largos muy distintos al pantalón.
Verificación: tsc y build de producción OK; recorrido en el navegador de las
siete prendas nuevas.
Archivos: apps/web/app/app/new/page.tsx,
apps/web/app/studio/{MeasurementSilhouette,Shell}.tsx

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## feat(blocks): siete prendas nuevas (chamarra, short, bermuda, vestido, sudadera, falda en A, jogger)

- Commit: `572d59f`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: nuevos bloques paramétricos con sus reglas de graduación: Chamarra de
mezclilla (9 piezas: delantero, espalda, manga, cuello, puño, faja delantera y
trasera, bolsillo de pecho y solapa), Short y Bermuda (delantero, espalda,
pretina y bolsillos), Vestido básico sin mangas (delantero, espalda con cierre y
vistas de escote), Sudadera con capucha (delantero, espalda, manga, capucha,
puño y pretina de rib, bolsillo canguro), Falda en A (delantero al doblez,
espalda, pretina) y Pants jogger (pierna ahusada, puño de tobillo, pretina
elástica). El catálogo suma "defaults" por prenda (largo de short 45 cm,
bermuda 58 cm, etc.) y defaultMeasurementsFor(); ayudas compartidas (armholeNodes,
sleeveNodes, collarNodes, layoutRows). La biblioteca de piezas suma 20 piezas
de estas prendas (capucha, bolsillo canguro, bolsillo de pecho, solapa, cuello
de chamarra, delanteros/espaldas/mangas nuevos, puños, pretina elástica).
Por qué: se pidieron más patrones antes de la vista 3D.
Verificación: tsc OK. En el navegador cada prenda se crea con sus piezas
(chamarra 9, short 4, vestido 4, sudadera 7, falda en A 3, jogger 4); el jogger
gradúa S/M/L/XL (cintura 76-80-84-88, largo 99-100-101-102) y entra al trazo
(62-69 %). Limitaciones: bloques base sin pinzas ni detalles de costura; las
curvas se calibran con una patronista.
Archivos: packages/blocks/src/index.ts

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## docs: actualizar bitácora de commits

- Commit: `0791572`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: regeneración de docs/COMMITS.md con la corrección de desplegables.
Por qué: mantener el registro al día.
Verificación: generado por scripts/commit-log.mjs.
Archivos: docs/COMMITS.md

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## fix(studio): desplegables legibles, límite en cm/talla y talla base real

- Commit: `54ca202`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: los desplegables (Material en el Trazo, Tipo en Materiales, Talla base en
Graduación, Paso de rejilla) usaban letra clara sobre fondo blanco y la lista
parecía vacía; ahora tienen fondo oscuro y letra clara. El campo de graduación
se renombra "cm/talla", se limita a 0-12 y explica que el busto de la talla base
se cambia en "Medidas". La ventana de medidas mostraba "talla 32" fijo; ahora
muestra la talla base real del patrón (M en la blusa).
Por qué: un usuario puso 40 en el campo de graduación creyendo que era el busto
y el patrón se deformó; y en su navegador la lista de materiales se veía vacía.
Verificación: tsc y build OK; en el navegador el desplegable lista 5 materiales
con colores legibles y elegir "Mezclilla 12 oz" fija ancho 150 cm, precio $120/m
y costo de tela de $129.74 por prenda.
Archivos: apps/web/app/studio/{Graduacion.tsx,Shell.tsx,studio.css}

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## docs: actualizar bitácora de commits

- Commit: `46ba40b`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: regeneración de docs/COMMITS.md con los commits del menú y las vistas.
Por qué: mantener el registro al día.
Verificación: generado por scripts/commit-log.mjs.
Archivos: docs/COMMITS.md

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## feat(studio): menú lateral, Proyectos, Materiales, Librería, Reportes, Configuración y Producción

- Commit: `0feb0e3`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: el studio gana el menú lateral del concepto (Proyectos, Patronaje 2D,
Graduación, Trazo, Producción, Materiales, Librería, Reportes, Configuración) y
las pestañas Diseño/Graduación/Trazo/Producción. Proyectos: abrir, duplicar,
eliminar, nuevo en blanco o desde prenda. Materiales: telas, forros, entretelas
y avíos con ancho y precio; el Trazo los puede elegir. Librería: piezas de
fábrica con vista previa y "mis piezas" (guardar desde el editor). Reportes:
consumo y costo de tela por talla, listado de piezas, CSV e impresión.
Configuración: rejilla, snap, margen de costura, ancho de tela, y respaldo
completo/restauración e importación/exportación de proyectos en .hilonova.json.
Producción: ficha técnica y variantes de modelo (guardar como variante nueva,
usar, guardar cambios, duplicar, eliminar, consumo comparado). Las medidas del
proyecto se restauran al abrirlo. Se corrigieron dos acciones del store
(toggleNotch y applyMeasurements) y applyMeasurements conserva variantes.
Por qué: el producto pide el menú lateral completo, variantes de modelo y que el
trabajo no se pierda (sin cuentas en la nube, el respaldo en archivo es clave).
Verificación: tsc y build de producción OK. En el navegador se recorrieron las
cinco pantallas; con una blusa se guardó "Modelo base" (7 piezas) y "Sin vista"
(6 piezas) y al cambiar de variante el editor volvió a 7 piezas.
Limitaciones: no hay vista 3D; datos solo en este navegador; sin Stripe.
Archivos: apps/web/app/studio/{Shell,store,Proyectos,Materiales,Libreria,
Reportes,Config,Produccion,thumbs,Trazo,nesting}.ts(x), studio.css,
apps/web/app/lib/{collection,materials,pieces,prefs,library}.ts

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## feat(engine): el proyecto guarda sus medidas y variantes de modelo

- Commit: `6946dd8`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: PatternDoc suma measurements (medidas con las que se dibujó), variants y
activeVariant (variantes de modelo con una foto de piezas, tallas, reglas y
medidas). draftBlock guarda las medidas en el documento.
Por qué: al reabrir un proyecto las medidas volvían a las de fábrica, y la
tabla de tallaje, la ficha y el tech pack salían con datos equivocados; además
el producto pide variantes de modelo.
Verificación: tsc sin errores en todos los paquetes.
Archivos: packages/geometry/src/doc.ts, packages/blocks/src/index.ts

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## docs: actualizar bitácora de commits

- Commit: `5a218af`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: regeneración de docs/COMMITS.md con los commits de trazo y DXF graduado.
Por qué: mantener el registro al día.
Verificación: generado por scripts/commit-log.mjs.
Archivos: docs/COMMITS.md

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## feat(export): DXF graduado con todas las tallas y hilo con ángulo

- Commit: `cb71565`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: exportDxfGraded genera un DXF con todas las tallas del documento, una
franja por talla, con la talla en el rótulo de cada pieza y las reglas de
graduación de los nodos. El hilo de tela del DXF respeta el ángulo de la pieza
y no se dibuja en líneas internas. El modal de exportación suma la opción
"Todas las tallas (graduado)".
Por qué: el DXF solo exportaba la talla base; la industria necesita el set
graduado para continuar en Gerber/Lectra.
Verificación: tsc y build OK; con una blusa S-M-L-XL el DXF trae 56 polilíneas
y 28 rótulos (7 piezas × 4 tallas). No se probó la apertura en Gerber/Lectra.
Archivos: packages/export/src/dxf.ts, apps/web/app/studio/ExportModal.tsx

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## feat(studio): trazo por contorno real con consumo por talla y costo de tela

- Commit: `455c90b`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: el trazo deja de acomodar cajas rectangulares. Cada pieza (con margen de
costura) se rasteriza en una rejilla de 1 cm y se coloca en la primera posición
libre, probando giro de 180° (respeta el hilo) y espejo en copias pares
(izquierda/derecha), así encaja piezas curvas entre sí. La vista Trazo ahora
tiene una pestaña por talla y un trazo "Combinado" (una prenda de cada talla),
consumo por talla con barras, aprovechamiento (dona), merma, aviso si una pieza
no cabe a lo ancho, precio de tela por metro y costo de tela por prenda. Las
piezas se colorean por tipo (o por talla en el combinado).
Por qué: el concepto pide trazo inteligente con consumo por talla y porcentaje
de aprovechamiento; el trazo anterior no rotaba, no espejaba y calculaba una
sola talla.
Verificación: tsc y build OK. Con la blusa: S 1.06 m (51 %), M 1.08 m (52 %),
L 1.10 m (54 %), XL 1.12 m (55 %); combinado 3.23 m, 72 % de aprovechamiento,
52 piezas, 0.81 m por prenda. Limitación: acomodo voraz en rejilla de 1 cm; no
reemplaza a un optimizador industrial.
Archivos: apps/web/app/studio/{nesting.ts,Trazo.tsx,store.ts,studio.css}

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## docs: actualizar bitácora de commits

- Commit: `434ddf3`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: regeneración de docs/COMMITS.md con los commits de graduación.
Por qué: mantener el registro al día.
Verificación: generado por scripts/commit-log.mjs.
Archivos: docs/COMMITS.md

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

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

