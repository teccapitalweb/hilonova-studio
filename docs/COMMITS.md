# Bitácora de commits — Hilonova Studio

> Generado con `node scripts/commit-log.mjs`. No editar a mano.
> Rama: `dev/mvp-9-nov` · Commits: 90

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

## feat: cuentas reales con Firebase (correo y contraseña, Google) con modo de prueba de respaldo

- Commit: `db2b9d9`
- Fecha: 2026-10-23
- Autor: wh505010@gmail.com

Qué: la capa de cuentas (lib/auth.ts) ahora usa Firebase Authentication cuando hay un proyecto configurado en
lib/firebase-config.ts: crear cuenta con correo y contraseña (mínimo 8 caracteres, correo de verificación), entrar,
salir, «Olvidé mi contraseña» y «Continuar con Google». El nombre y el taller se guardan en Firestore (users/{uid})
con reglas que solo dejan a cada persona leer y escribir lo suyo (firebase/firestore.rules). El SDK se descarga solo
cuando hay proyecto configurado. Sin configuración el programa sigue en «modo de prueba» (cuenta local) y la
pantalla lo dice. Se quitan los botones falsos de Google y Apple que creaban una cuenta inventada; Apple queda fuera
(pide cuenta de desarrollador de pago). Los errores salen en español (auth-errors.ts) y un correo o contraseña mal
puestos no dicen cuál falló. signOut ahora se espera antes de cambiar de página (si no, la cuenta quedaba abierta).
Si el perfil no se puede leer se conserva el nombre del taller que ya había. «Crea tu cuenta gratis» pasa a «Crea tu
cuenta» (no es gratis). next.config acepta NEXT_DIST_DIR para tener un segundo servidor de pruebas. Se agrega
docs/FIREBASE-PASOS.md con los pasos para crear el proyecto, cómo probarlo y lo que falta antes de publicar.
Por qué: el registro era de mentira (localStorage) y no había forma de tener usuarios reales; Firebase encaja con el
ecosistema de Google que ya usa el negocio y con Stripe más adelante.
Verificación: contra el emulador local de Authentication y el programa en el navegador: contraseña corta rechazada;
crear cuenta (existe en el emulador con su nombre); entra al panel; recargar mantiene la sesión; cerrar sesión desde
el menú la cierra; contraseña equivocada dice «Correo o contraseña incorrectos»; contraseña correcta entra. Modo de
prueba revisado en el servidor normal (aviso visible, sin botones falsos). 16 pruebas nuevas (tests/cuentas.test.ts);
619 pruebas pasan y los tipos compilan. NO probado: Google, correos reales (verificación y restablecer contraseña) y
Firestore (no hay Java para su emulador); eso requiere el proyecto real.
Archivos: apps/web/app/lib/{auth.ts,auth-errors.ts,firebase.ts,firebase-config.ts}, apps/web/app/auth/{SsoButtons,signin,signup}.tsx,
apps/web/app/(saas)/{SaasNav.tsx,saas.css}, apps/web/app/account/page.tsx, apps/web/{next.config.mjs,package.json},
firebase/{firebase.json,firestore.rules}, docs/FIREBASE-PASOS.md, tests/cuentas.test.ts, pnpm-lock.yaml,
pnpm-workspace.yaml, .gitignore

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## docs: actualizar bitácora de commits

- Commit: `cd32fb0`
- Fecha: 2026-10-23
- Autor: wh505010@gmail.com

Qué: regeneración de docs/COMMITS.md.
Por qué: mantener el registro al día.
Verificación: generado por scripts/commit-log.mjs.
Archivos: docs/COMMITS.md

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## fix: PDF del mosaico sin hojas de más y ficha técnica igual a la vista previa

- Commit: `9d0ca5b`
- Fecha: 2026-10-23
- Autor: wh505010@gmail.com

Qué: (1) Mosaico A4: las piezas se imprimen donde están en el editor (antes se volvían a repartir en una fila
larga), solo salen las hojas que llevan dibujo, y cada hoja solo dibuja los tramos que le tocan. La primera hoja
es de instrucciones: imprimir al 100 %, cuadro de prueba de 10 × 10 cm y mapa de hojas. El pie de cada hoja dice
"hoja n de N · columna, fila". Se agrega planTiles() para poder probarlo. (2) Ficha técnica: el PDF imprime cliente,
temporada, patronista, descripción y notas; sin referencia imprime «—» (antes inventaba un número al azar); si se
borran todos los materiales ya no aparecen cierre, botón y remaches de un jean; las vistas planas llevan todas las
piezas, cuatro por hoja (antes solo las primeras cuatro); cada hoja trae "n / total". Se quitó "hilonova.mx" del
pie porque no está confirmado. La vista previa del programa usa los mismos valores de ejemplo y el mismo reparto
de piezas que el PDF. (3) Vista previa: las hojas no se encogen ni se salen, y las piezas quedan dentro de su
hoja.
Por qué: el jean salía en 150 hojas (48 MB), muchas en blanco, sin forma de comprobar la escala; y la ficha técnica
entregada al taller no tenía los datos que el usuario había llenado.
Verificación: jean 150 → 31 hojas con dibujo (0.4 MB); las 17 prendas bajan a entre 15 y 41 hojas; se generaron los
PDFs reales y se revisaron página por página (instrucciones con cuadro y mapa, portada con datos, tres hojas de
vistas planas con las 10 piezas, insumos con notas); la vista previa se midió en el navegador: 6 hojas de 640×905
sin elementos fuera de la hoja. 26 pruebas nuevas (tests/pdf.test.ts); 603 pruebas pasan y los tipos compilan.
Archivos: packages/export/src/{pdf,techpack}.ts, apps/web/app/studio/{ExportModal.tsx,TechPack.tsx,studio.css},
tests/pdf.test.ts

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## docs: actualizar bitácora de commits

- Commit: `0fac78a`
- Fecha: 2026-10-23
- Autor: wh505010@gmail.com

Qué: regeneración de docs/COMMITS.md.
Por qué: mantener el registro al día.
Verificación: generado por scripts/commit-log.mjs.
Archivos: docs/COMMITS.md

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## feat: script para colgar el programa dentro del sitio de CAD y quitar testimonios inventados

- Commit: `a9a405d`
- Fecha: 2026-10-23
- Autor: wh505010@gmail.com

Qué: scripts/publicar-en-cad.mjs compila el programa como sitio estático con una ruta base (por omisión /programa),
lo copia a ../HiloNova-CAD/programa, quita el video, las fotos de la portada y el logo-kit que ahí no se usan
(conserva las fotos de las prendas de la galería) y deja un index.html que redirige a la pantalla de entrar. Se
quitan los testimonios inventados ("Lucía Mendoza" y "Rodrigo Pérez") de las pantallas de entrar y de crear cuenta:
la propiedad quote de AuthAside pasa a ser opcional y no se usa. Se agrega al mapa de páginas lo que ya quedó
conectado, cómo verlo en local, cómo cambiar la ruta para publicar y lo pendiente (botones de Google y Apple
falsos, portada con frases no ciertas).
Por qué: conectar la página de HiloNova CAD con el programa real y no publicar testimonios que nadie dio.
Verificación: tipos sin errores; el script generó programa/ en HiloNova-CAD y se probó en local el recorrido completo.
Archivos: scripts/publicar-en-cad.mjs, apps/web/app/auth/{AuthAside.tsx,signin/page.tsx,signup/page.tsx},
docs/MAPA-DE-PAGINAS.md

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## docs: actualizar bitácora de commits

- Commit: `a5fd961`
- Fecha: 2026-10-23
- Autor: wh505010@gmail.com

Qué: regeneración de docs/COMMITS.md.
Por qué: mantener el registro al día.
Verificación: generado por scripts/commit-log.mjs.
Archivos: docs/COMMITS.md

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## docs: mapa de las tres piezas (sitio de formación, página de CAD y el programa) y cómo conectarlas

- Commit: `b4d3465`
- Fecha: 2026-10-23
- Autor: wh505010@gmail.com

Qué: docs/MAPA-DE-PAGINAS.md explica qué es cada carpeta (hilonova-web = sitio de formación con dominio propio
hilonovamx.com; HiloNova-CAD = página de venta antigua cuyo app.html llama a archivos que no existen; hilonova-studio
= el programa), que hoy no se enlazan entre sí, la tabla de lo que la página de CAD promete y no coincide con el
programa (pago único, demo con candados, nube, Safari y tablet, margen por tramo, costeo con minutos, Stripe), la
propuesta de conexión (una puerta de entrada: el sitio de formación enlaza a la página del software y al programa; el
alumno entra con su cupón), lo que hay que hacer en cada carpeta, las decisiones que faltan (nombre del producto,
página oficial, dominio, modelo de venta) y el orden de trabajo.
Por qué: el usuario pidió entender las otras dos páginas y conectar todo.
Verificación: leídos los README, títulos, enlaces, textos y archivos de las tres carpetas; se comprobó que
HiloNova-CAD no trae los archivos assets/css/app.css ni assets/js/app/main.js que su app.html pide, y que el sitio de
formación no menciona el software.
Archivos: docs/MAPA-DE-PAGINAS.md

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## docs: actualizar bitácora de commits

- Commit: `23cfe37`
- Fecha: 2026-10-23
- Autor: wh505010@gmail.com

Qué: regeneración de docs/COMMITS.md.
Por qué: mantener el registro al día.
Verificación: generado por scripts/commit-log.mjs.
Archivos: docs/COMMITS.md

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## feat(web): plan "Completo" organizado por los cuatro módulos y sin cuentas dobles

- Commit: `5d6da5b`
- Fecha: 2026-10-23
- Autor: wh505010@gmail.com

Qué: la tarjeta del plan único se reorganiza por los cuatro módulos que se pidieron (Patronaje 2D, Graduación, Trazo
y Producción), cada uno con lo que incluye, más una línea de condiciones (proyectos ilimitados, ayuda dentro de la
app y soporte por correo) y el recuadro de la oferta para alumnos (1 mes gratis con 3 exportaciones). El plan pasa
de llamarse "Estudio" (sonaba a plan de estudiantes) a "Completo", y se quita "hasta 2 usuarios": el plan es para 1
usuario hasta que existan las cuentas de equipo. La pantalla de planes, la página principal, la propuesta de
planes y las preguntas para el jefe (que ahora incluyen quién atenderá el soporte por correo) quedan con lo
mismo. Se corrige además el "Plan actual" de la tarjeta oscura, que salía con texto oscuro sobre fondo oscuro y no
se leía.
Por qué: el usuario eligió la propuesta A (por módulos) para poder revisar la tarjeta contra la lista de lo
solicitado, y pidió quitar las dos cuentas porque hoy no hay cuentas reales.
Verificación: 577 pruebas (plan "Completo", 1 usuario, sin textos de varios usuarios, organizado por los cuatro
módulos, DXF "en validación", tallas 28–36, migración de sesiones guardadas); tipos y build correctos; revisada la
pantalla de planes en la app.
Archivos: apps/web/app/{lib/auth.ts,pricing/page.tsx,page.tsx,account/page.tsx,auth/signup/page.tsx,(saas)/saas.css},
tests/planes.test.ts, docs/PROPUESTA-PLANES.md, docs/PREGUNTAS-PARA-EL-JEFE.md

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## docs: actualizar bitácora de commits

- Commit: `d1add5a`
- Fecha: 2026-10-23
- Autor: wh505010@gmail.com

Qué: regeneración de docs/COMMITS.md.
Por qué: mantener el registro al día.
Verificación: generado por scripts/commit-log.mjs.
Archivos: docs/COMMITS.md

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## feat(web): cupón de alumnos = un mes con el programa completo y 3 exportaciones

- Commit: `f956850`
- Fecha: 2026-10-23
- Autor: wh505010@gmail.com

Qué: la oferta para los alumnos del curso deja de ser un % de descuento y pasa a ser un cupón de un solo uso,
que se canjea dentro de las 24 horas desde que se recibe, con 1 mes con el programa completo y un tope de 3
exportaciones en total (cuenta como exportación cada archivo que sale: DXF, PDF, SVG, ficha técnica o trazo; el
respaldo de los proyectos no cuenta). Todos los demás pagan el plan de $490 al mes desde el primer día, sin mes
gratis. Los números viven en un solo archivo (lib/oferta.ts) que leen la pantalla de planes, la página principal y
las pruebas. Se actualizan la propuesta de planes (cupón, costos sin descuento, qué construir) y las preguntas para
el jefe (qué pasa el día 31, si se pide tarjeta, desde cuándo cuentan las 24 horas, cómo le llega el cupón).
Por qué: el usuario aclaró que el cupón es solo para alumnos, que durante el mes tienen acceso a todo y que el
límite es de 3 exportaciones, para que quieran pagar el segundo mes.
Verificación: 574 pruebas (3 nuevas: la oferta es 1 mes, 3 exportaciones, 24 horas y un solo uso; el plan sigue siendo
uno solo a $490; el respaldo no cuenta como exportación); tipos y build correctos; revisadas la pantalla de planes
y la página principal en la app. Aún no se aplica: contar exportaciones por persona requiere cuentas reales y
servidor.
Archivos: apps/web/app/{lib/oferta.ts,pricing/page.tsx,page.tsx}, tests/oferta.test.ts,
docs/PROPUESTA-PLANES.md, docs/PREGUNTAS-PARA-EL-JEFE.md

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## docs: actualizar bitácora de commits

- Commit: `5398b40`
- Fecha: 2026-10-23
- Autor: wh505010@gmail.com

Qué: regeneración de docs/COMMITS.md.
Por qué: mantener el registro al día.
Verificación: generado por scripts/commit-log.mjs.
Archivos: docs/COMMITS.md

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## feat(web): plan único a $490 y código de descuento para alumnos (sin meses gratis ni plan de aprendiz)

- Commit: `e85abdb`
- Fecha: 2026-10-23
- Autor: wh505010@gmail.com

Qué: se reemplazan los tres planes por uno solo, "Estudio", a $490 al mes más IVA (el precio original más bajo),
con todo el programa y hasta 2 usuarios. Se quitan el plan Aprendiz, el precio de lanzamiento, los "3 meses
incluidos con el curso" y el cobro anual. Los alumnos del curso pagan el mismo plan con un código de descuento
de un solo uso que vale 24 horas desde que lo reciben; la pantalla de planes y la landing lo explican (el monto
se confirma antes de activar el cobro) pero no lo validan, porque aún no hay cobro. La pantalla de planes pasa de
tres tarjetas y tabla comparativa a una tarjeta, la explicación del código y preguntas frecuentes. Las sesiones
guardadas con planes anteriores pasan al plan único. Los documentos de la propuesta de planes y de las preguntas
para el jefe se actualizan: plan único, comisiones de Stripe sobre $490, código de descuento (monto, a cuántos
pagos aplica, desde cuándo cuentan las 24 horas, cómo le llega al alumno).
Por qué: el usuario pidió manejar un solo costo (el original) y no tener precios por partes; el descuento para
alumnos va por código y no por un plan distinto.
Verificación: 571 pruebas (el plan es uno solo, $490, 2 usuarios; no aparecen precios por partes ni meses gratis;
no prometen 28-44, SSO, API, WhatsApp, nativo ni roles; el DXF dice "en validación"; las sesiones viejas migran);
tipos y build correctos; revisadas en la app la pantalla de planes y la cuenta.
Archivos: apps/web/app/{lib/auth.ts,pricing/page.tsx,page.tsx,account/page.tsx,auth/signup/page.tsx},
tests/planes.test.ts, docs/PROPUESTA-PLANES.md, docs/PREGUNTAS-PARA-EL-JEFE.md

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## docs: actualizar bitácora de commits

- Commit: `e2a95e8`
- Fecha: 2026-10-23
- Autor: wh505010@gmail.com

Qué: regeneración de docs/COMMITS.md.
Por qué: mantener el registro al día.
Verificación: generado por scripts/commit-log.mjs.
Archivos: docs/COMMITS.md

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## feat(web): planes Aprendiz, Taller y Equipo con solo lo que el software cumple

- Commit: `527f899`
- Fecha: 2026-10-23
- Autor: wh505010@gmail.com

Qué: la pantalla de planes, la sección de precios de la landing, la cuenta y el registro pasan de los planes
Taller / Maquila / Industrial a Aprendiz ($149 al mes; los primeros 3 meses incluidos con el curso), Taller
($390 de lanzamiento, después $490) y Equipo ($990 de lanzamiento, después $1,290), más IVA. Se quitó el plan
Industrial (SSO y API no existen) y lo que no es cierto: "graduación completa 28-44" (solo hay 28-36), "DXF-AAMA
nativo" (ahora "DXF estilo AAMA, en validación"), "8 usuarios con roles" (las cuentas de equipo con roles
"llegan después"), "soporte por WhatsApp" y "El más usado" (ahora "Recomendado"). La tabla comparativa y las
preguntas frecuentes se reescribieron; la pantalla de planes trae un aviso de que el cobro todavía no está activo
y los límites aún no se aplican. Las sesiones guardadas con los planes anteriores pasan al plan que los
reemplaza (maquila e industrial a equipo) y los usuarios del plan salen de una sola tabla.
Por qué: la propuesta de docs/PROPUESTA-PLANES.md, aprobada por el usuario para mostrársela al jefe con planes
que sí se puedan cumplir.
Verificación: 571 pruebas (11 nuevas: los tres planes, precio de lanzamiento menor al normal, usuarios 1/2/8, no
aparecen 28-44, SSO, API, WhatsApp, nativo ni Industrial, el DXF dice "en validación", migración de las sesiones
viejas); tipos y build correctos; revisadas la pantalla de planes y la landing en la app.
Archivos: apps/web/app/{lib/auth.ts,pricing/page.tsx,page.tsx,account/page.tsx,auth/signup/page.tsx,(saas)/saas.css},
tests/planes.test.ts

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## docs: actualizar bitácora de commits

- Commit: `f410208`
- Fecha: 2026-10-23
- Autor: wh505010@gmail.com

Qué: regeneración de docs/COMMITS.md.
Por qué: mantener el registro al día.
Verificación: generado por scripts/commit-log.mjs.
Archivos: docs/COMMITS.md

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## docs: propuesta de planes y costos

- Commit: `3f87a49`
- Fecha: 2026-10-23
- Autor: wh505010@gmail.com

Qué: docs/PROPUESTA-PLANES.md con lo que el software puede prometer hoy y lo que no (la pantalla de planes
actual promete graduación 28-44, DXF nativo, 8 usuarios con roles, SSO, API y WhatsApp que no existen), tres
planes propuestos (Aprendiz, Taller y Equipo) con precios de lanzamiento, comisiones de Stripe, costos estimados
de operarlo, punto de equilibrio, el orden de lo que hay que construir y las decisiones que debe tomar el jefe.
Por qué: el usuario pidió una propuesta de planes que el software sí pueda cumplir, con costos, para revisarla
más tarde con el equipo.
Verificación: las cuentas de comisión se recalcularon (3.6 % + $3 MXN + IVA sobre la comisión); las comisiones de
Stripe y los precios de la competencia vienen de fuentes secundarias y están marcados para confirmar en las
páginas oficiales; los costos de servidor son estimados.
Archivos: docs/PROPUESTA-PLANES.md

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## docs: actualizar bitácora de commits

- Commit: `c816231`
- Fecha: 2026-10-23
- Autor: wh505010@gmail.com

Qué: regeneración de docs/COMMITS.md.
Por qué: mantener el registro al día.
Verificación: generado por scripts/commit-log.mjs.
Archivos: docs/COMMITS.md

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## docs: análisis de cumplimiento y preguntas para el maestro costurero

- Commit: `ba499c6`
- Fecha: 2026-10-23
- Autor: wh505010@gmail.com

Qué: docs/ANALISIS-CUMPLIMIENTO.md con el estado de cada requisito pedido (cumple / parcial / no cumple /
depende de otros), los límites de cada módulo (CAD, graduación, trazo, producción, menú, Stripe), el detalle
de las 17 prendas con sus simplificaciones, la calidad y confiabilidad, 40 preguntas para el maestro costurero
ordenadas por tema (medidas y tallas, holguras, márgenes, detalles de cada prenda, tela y trazo, ficha técnica,
archivos de fábrica, alcance del curso), los riesgos conocidos y los siguientes pasos.
Por qué: preparar la reunión con el maestro costurero y decidir los siguientes trabajos.
Verificación: los datos de tallas, reglas de graduación, número de piezas, holguras y límites se comprobaron en el
código (catálogo de bloques, reglas de graduación, presets de tallas, trazo); lo no probado (Gerber, otros
navegadores, rendimiento) está marcado como tal.
Archivos: docs/ANALISIS-CUMPLIMIENTO.md

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## docs: actualizar bitácora de commits

- Commit: `bbce2d4`
- Fecha: 2026-10-23
- Autor: wh505010@gmail.com

Qué: regeneración de docs/COMMITS.md.
Por qué: mantener el registro al día.
Verificación: generado por scripts/commit-log.mjs.
Archivos: docs/COMMITS.md

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## feat(studio): ayuda dentro de la app, guía del lienzo vacío y arreglo del patrón en blanco

- Commit: `030a4b7`
- Fecha: 2026-10-23
- Autor: wh505010@gmail.com

Qué: botón «Ayuda» en la barra de arriba (con un punto naranja hasta la primera vez que se abre) que
abre una ventana con cuatro pestañas: «Esta pantalla» (la ayuda de la pantalla en que está el alumno,
para las 9 pantallas), «Primeros pasos», «Patrón en blanco» (paso a paso) y «Herramientas y atajos»
(las 12 herramientas con su letra y los atajos del teclado). Un proyecto en blanco sin piezas muestra sobre
el lienzo una guía con tres formas de empezar (dibujar con polilínea, curva o rectángulo; abrir la
biblioteca de piezas; elegir una prenda base) y un enlace a la guía completa; desaparece al dibujar la
primera pieza. Arreglo de un defecto: en un patrón en blanco el programa asumía un pantalón, así que cambiar
una medida en «Medidas» redibujaba el pantalón y borraba lo dibujado; ahora el botón dice «En blanco · sin
medidas» y cambiar medidas no hace nada en un patrón en blanco. El documento de demostración del editor
ahora trae su tipo de prenda (si no, se habría tomado por uno en blanco). La biblioteca de piezas pasó a
guardarse en el almacén (libOpen) para poder abrirla desde la guía.
Por qué: el alumno que elegía «En blanco» veía un lienzo vacío sin pistas, y un clic en Medidas le podía borrar
el trabajo; no había ninguna ayuda dentro del programa.
Verificación: 560 pruebas (10 nuevas: la ayuda cubre las 9 pantallas, los atajos documentados son los mismos del
editor, no promete vista 3D, y un patrón en blanco no se borra al cambiar medidas pero uno de prenda base sí
se redibuja); tipos y build de producción correctos; probado en la app: guía del lienzo vacío, dibujar una pieza
desde la guía, ventana de ayuda, cerrar con Esc.
Archivos: apps/web/app/studio/{Ayuda.tsx,ayuda-contenido.ts,Shell.tsx,Canvas.tsx,store.ts,Proyectos.tsx,studio.css},
packages/blocks/src/index.ts, tests/ayuda.test.ts

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## docs: actualizar bitácora de commits

- Commit: `3a4a038`
- Fecha: 2026-10-23
- Autor: wh505010@gmail.com

Qué: regeneración de docs/COMMITS.md.
Por qué: mantener el registro al día.
Verificación: generado por scripts/commit-log.mjs.
Archivos: docs/COMMITS.md

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## feat(web): las 17 prendas con su foto en la galería de bloques

- Commit: `13553e0`
- Fecha: 2026-10-23
- Autor: wh505010@gmail.com

Qué: se agregan las fotos de chamarra de mezclilla, sudadera con capucha, falda en A, pants jogger y camisa
de hombre; la galería ya no tiene ningún ícono. El mapa de fotos (PHOTOS) pasa a ser un Record completo de
BlockKind, así que agregar una prenda nueva sin foto es un error de tipos.
Por qué: con los paneles, cordones y el cuello con botones, las 5 prendas pendientes ya coinciden con su foto.
Verificación: revisado en la app: las 17 fotos cargan; tipos y build de producción correctos.
Archivos: apps/web/app/app/new/page.tsx, apps/web/public/img/prendas/{chamarra-mezclilla,sudadera-capucha,falda-a,pants-jogger,camisa-hombre}.webp
Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## feat(blocks): paneles, cordones y cuello con botones para cerrar las últimas 5 prendas

- Commit: `6002329`
- Fecha: 2026-10-23
- Autor: wh505010@gmail.com

Qué: la falda en A lleva el delantero en un panel central y dos del costado (dos costuras que salen de la
cintura y se abren hacia el bajo, sin pinzas de delantero; la espalda conserva su pinza); la chamarra lleva
canesú delantero y trasero (corte a 13 cm del cuello) y el delantero en panel central y panel del costado
(costura vertical a ~45 % del ancho); la sudadera trae el cordón de la capucha (3 veces el contorno del
cuello) y el jogger el cordón de la pretina (cintura + 40 cm); la camisa de hombre de manga larga trae una
marca de ojal en cada punta del cuello (cuello con botones). Para los paneles hay un corte general de piezas
(`splitByLine`) y se corrigió que en los lados rectos el nodo del corte quedaba fuera de la línea. La
biblioteca de piezas de la chamarra pasa a Delantero centro, Delantero costado, Canesú delantero y Canesú espalda.
Por qué: eran las 5 prendas que seguían con un detalle distinto al de su foto de referencia.
Verificación: 550 pruebas (98 de la auditoría): la manga cierra con la sisa repartida entre canesú y paneles,
el hombro delantero = trasero, el borde del canesú mide lo mismo que los bordes de arriba de los paneles, el
corte del canesú es recto, costados iguales, cordón y ojales presentes; tipos sin errores y build correcto.
Archivos: packages/blocks/src/index.ts, tests/audit-patrones.test.ts, tests/blocks.test.ts, tests/seams.test.ts
Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## fix(blocks): las pinzas ya no le quitan medida a la cintura ni al costado

- Commit: `d22b20e`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: al poner pinzas en los patrones base (aa74a43) se abrió la V de la pinza en un borde que ya medía
justo la medida, y al coserla la prenda perdía lo que la pinza se come: la falda recta quedaba con
71 cm de cintura neta (para 80) y la falda en A con 73; el delantero de la blusa y del vestido quedaba
más corto en el costado que la espalda por el ancho de la pinza de busto (2-5 cm); y las pinzas
traseras del bermuda, el cargo y el pantalón de vestir también restaban cintura. Ahora el borde de la
cintura se ensancha lo que se come cada pinza (falda recta, falda en A, bermuda, cargo, pantalón de vestir) y
el costado del delantero se alarga lo que se come la pinza de busto (blusa, vestido), así que ya cosidos
miden lo que deben.
Por qué: lo encontré al preparar los paneles de la falda en A; mi auditoría anterior no lo vio porque
medía el ancho de la pieza incluyendo el hueco de la pinza.
Verificación: 540 pruebas. La auditoría ahora mide la prenda cosida (el hueco y la boca de cada pinza no
cuentan): cintura neta de las faldas = medida + holgura de 0 a 6 cm, y costado delantero = costado
trasero en blusa y vestido con la boca de la pinza descontada. Antes del arreglo la cintura de la
falda recta daba 71.2 y la de la falda en A 72.7.
Archivos: packages/blocks/src/index.ts, tests/audit-patrones.test.ts

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## docs: actualizar bitácora de commits

- Commit: `250cafd`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: regeneración de docs/COMMITS.md.
Por qué: mantener el registro al día.
Verificación: generado por scripts/commit-log.mjs.
Archivos: docs/COMMITS.md

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## feat(web): fotos de las prendas en la galería de bloques

- Commit: `fdb3157`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: en "Elige un bloque para empezar" las 12 prendas cuyo patrón ya coincide con su foto de
referencia (pantalón denim, pantalón de vestir, playera básica, falda recta, blusa clásica, short,
bermuda, vestido básico, camisa manga corta, polo, chaleco y pantalón cargo) muestran su foto en la
tarjeta en lugar del ícono. Las fotos son recortes de las imágenes de referencia, cuadrados de
320 px en webp (2 a 6 KB cada uno, 17 KB el short). Chamarra, sudadera, falda en A, jogger y camisa de
hombre siguen con ícono hasta cerrar sus detalles pendientes (paneles, cordones y cuello con botones).
Por qué: se pidió que las prendas que ya están bien se vean con su imagen real.
Verificación: revisado en la app (escritorio): las fotos cargan (200) y las prendas pendientes
conservan el ícono; la lista de prendas con foto está en apps/web/app/app/new/page.tsx (PHOTOS).
Archivos: apps/web/app/app/new/page.tsx, apps/web/app/app/new/new.css, apps/web/public/img/prendas/*.webp

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## fix(blocks): ruedo curvo en la blusa clásica

- Commit: `d993f5c`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: la blusa clásica ahora tiene el ruedo curvo (los costados 6 cm más arriba que el centro, igual
que las camisas), como en la foto de referencia. En la prueba de rotación de un grupo de piezas se
cambió la medida: comparaba el centro de la caja de cada pieza, que cambia al girar una forma
asimétrica; ahora usa el promedio de los nodos, que se conserva al girar.
Por qué: la foto de la blusa muestra el ruedo curvo y el patrón lo traía recto.
Verificación: 538 pruebas (la de ruedo curvo incluye ahora la blusa), tipos sin errores.
Archivos: packages/blocks/src/index.ts, tests/audit-patrones.test.ts, tests/editor.test.ts

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## docs: actualizar bitácora de commits

- Commit: `df85273`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: regeneración de docs/COMMITS.md.
Por qué: mantener el registro al día.
Verificación: generado por scripts/commit-log.mjs.
Archivos: docs/COMMITS.md

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## feat(blocks): faldas, blusa, vestido, camisas, jogger, cargo y chamarra más cerca de las fotos; líneas internas en el DXF

- Commit: `c1ca4ae`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: falda recta con pretina y abertura trasera (3 cm de vista por mitad, 20 cm de alto, con piquete);
falda en A con más vuelo (el bajo pasa de 1.5 a ~1.8 veces la cintura, como en la foto); blusa y
vestido con pinzas de talle en forma de pez (líneas internas, no cortan la pieza); camisas con ruedo
curvo (los costados 6 cm más arriba que el centro); jogger con bolsas de bolsillo lateral, cargo con
bolsas de bolsillo delantero y bragueta, chamarra con bolsillos laterales y sus vivos. El DXF ahora
escribe las líneas internas (pinzas de talle, abertura del polo) en la capa 6 (InternalLine) y junto a su
pieza, sin rótulo; antes iban en la capa de contorno (1_Boundary), donde Gerber podría tomarlas por
una pieza rota.
Por qué: la comparación con las fotos de referencia mostró estas diferencias de pieza y de forma.
Verificación: 537 pruebas (9 nuevas, entre ellas que las líneas internas caen dentro de su pieza en
el DXF base y graduado), tipos sin errores, build de producción correcto y revisión de blusa, vestido y
falda recta en la app. No se tocó: cuello con botones de la camisa de hombre, cordón del jogger y de la
sudadera, paneles cosidos de la falda en A y de la chamarra; el canesú del jean es recto y el pliegue
del pantalón de vestir y la bermuda es solo cintura más ancha con piquetes (debe validarlo un patronista).
Archivos: packages/blocks/src/index.ts, packages/export/src/dxf.ts, tests/audit-patrones.test.ts,
tests/dxf.test.ts, tests/editor.test.ts
Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## feat(blocks): piezas de los pantalones y shorts según las fotos de referencia

- Commit: `755c456`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: el pantalón de mezclilla y el short pasan de 2-4 piezas a 10 (cinco bolsillos): la espalda
se parte en canesú + espalda baja (corte horizontal a 6.5 cm, con piquetes), y se agregan pretina,
6 trabillas, bolsa y vista de bolsillo delantero, bolsillo trasero, bolsillo moneda y vista de
bragueta. El pantalón de vestir (8 piezas) y la bermuda (6) ahora marcan el pliegue del frente
(la cintura del delantero crece 3 cm y dos piquetes marcan el doblez); el de vestir además trae pinza
trasera, pretina, trabillas, bolsas de bolsillo lateral y trasero, vivos y bragueta; la bermuda suma
trabillas y bragueta. El pantalón de vestir deja de derivarse del de mezclilla con piezas sobrantes.
Por qué: las fotos del cliente muestran jeans de cinco bolsillos y pantalones de vestir con pliegues,
pretina y trabillas; el patrón solo traía delantero y espalda y no alcanzaba para producirlos.
Verificación: 528 pruebas (9 nuevas: piezas y cantidades de cada prenda, canesú de 5-11 cm que encaja
con la espalda en todas las tallas, dos piquetes de pliegue, pretina = cintura + 4); la prueba de
contorno ahora cuenta el canesú; revisado en la app (2D) denim y vestir. Simplificaciones que debe
validar un patronista: el canesú es recto (el de un jean real suele ir en V), el pliegue es solo
la cintura más ancha con piquetes, y las bolsas de bolsillo son medidas estándar.
Archivos: packages/blocks/src/index.ts, tests/audit-patrones.test.ts

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## fix(blocks): playera básica con manga corta y cuello de rib

- Commit: `b211d45`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: la playera básica traía la manga con el largo del brazo completo (60 cm, manga larga) y
un trapecio sin ajustar a la sisa, y no tenía pieza de cuello. Ahora la manga es corta (37 % del
largo del brazo, 22 cm con el brazo de 60, limitado entre 18 y 26) y su cabeza se calcula contra
la sisa del delantero y la espalda (sisa + 0.5 cm), igual que las demás prendas; se agrega la
pieza "Cuello de rib" (tira que mide 85 % del escote) y el catálogo pasa de 3 a 4 piezas.
Por qué: la foto de referencia del cliente es una playera de manga corta con cuello de rib; el
patrón decía "manga corta" en el catálogo pero dibujaba manga larga.
Verificación: 519 pruebas (2 nuevas: manga corta que cierra con la sisa en las 5 tallas, y rib al
85 % del escote); revisada en la app.
Archivos: packages/blocks/src/index.ts, tests/audit-patrones.test.ts

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## docs: actualizar bitácora de commits

- Commit: `d958ac2`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: regeneración de docs/COMMITS.md.
Por qué: mantener el registro al día.
Verificación: generado por scripts/commit-log.mjs.
Archivos: docs/COMMITS.md

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## feat(studio): guardado automático, aviso si no se puede guardar y recordatorio de respaldo

- Commit: `859f121`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: el proyecto abierto se guarda solo 1.5 s después del último cambio y el nombre de la
barra muestra "guardado 06:23 p.m."; si hay cambios sin guardar y se intenta cerrar la
pestaña, el navegador avisa. Antes, cuando el navegador no podía guardar (sin espacio, modo
privado o almacenamiento bloqueado) el error se ignoraba y el patrón parecía guardado: ahora se
lanza un error y el editor lo muestra en la barra de estado ("No se pudo guardar... Descarga un
respaldo desde Configuración"); crear, duplicar y guardar desde otras pantallas también avisan.
Se pide al navegador almacenamiento persistente para que no borre los datos si le falta espacio.
En Proyectos aparece un recordatorio si nunca se ha descargado un respaldo o si pasaron 7 días
(el respaldo completo y la exportación de un proyecto ya existían en Configuración).
Por qué: los proyectos viven solo en el navegador del alumno; perderlos por no haber guardado o por
un fallo silencioso era el mayor riesgo de pérdida de trabajo.
Verificación: 517 pruebas (14 nuevas de la biblioteca con un almacenamiento simulado: guardar,
actualizar, borrar, fallo de escritura, respaldo y restauración sin duplicar, recordatorio); en la app:
el cambio de nombre se guardó solo, con el almacenamiento bloqueado apareció el aviso y quedó "sin
guardar", y al restaurarlo volvió a guardar y el aviso desapareció.
Archivos: apps/web/app/lib/library.ts, apps/web/app/studio/{Shell,Proyectos,Config}.tsx,
apps/web/app/app/page.tsx, apps/web/app/app/new/page.tsx, tests/library.test.ts

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## docs: actualizar bitácora de commits

- Commit: `ea04f34`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: regeneración de docs/COMMITS.md.
Por qué: mantener el registro al día.
Verificación: generado por scripts/commit-log.mjs.
Archivos: docs/COMMITS.md

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## fix(blocks): cuello de la chamarra y capucha de la sudadera miden lo que su escote + auditoría de los 17 patrones

- Commit: `c42c359`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: auditoría automática de los 17 patrones (tests/audit-patrones.test.ts, 70 pruebas) que revisa
en todas las tallas: piezas que no se cruzan ni tienen valores raros, más tela en tallas mayores,
contorno de pecho y de cadera contra la medida con una holgura razonable, costado del delantero
igual al de la espalda (con las pinzas cerradas), entrepierna igual, cuello igual al escote
(blusa y chamarra), borde de la capucha igual a la mitad del escote y puños iguales a la boca de la
manga. La auditoría encontró dos defectos además del pantalón (23ee69a): la chamarra tenía el
cuello 3 cm más corto que el escote (41 contra 44.2) y el borde de la capucha de la sudadera medía
34 cm contra 24 que pide el escote. Ahora el cuello de la chamarra y la capucha se calculan con
el largo real del escote y crecen con la talla.
Por qué: el error del pantalón apareció por casualidad en la vista 3D; esto lo busca en todas las
prendas de forma sistemática.
Verificación: 503 pruebas pasan; el resto de patrones cumple las reglas sin cambios (cintura, cadera,
busto y holguras dentro de lo normal, costados y entrepierna iguales); capucha revisada en la app.
Un patronista aún debe revisar el estilo de cada prenda: la auditoría solo comprueba medidas.
Archivos: packages/blocks/src/index.ts, tests/audit-patrones.test.ts

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## docs: actualizar bitácora de commits

- Commit: `acd4bfb`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: regeneración de docs/COMMITS.md.
Por qué: mantener el registro al día.
Verificación: generado por scripts/commit-log.mjs.
Archivos: docs/COMMITS.md

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## docs: preguntas para el jefe sobre planes y cobro

- Commit: `5aa858f`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: docs/PREGUNTAS-PARA-EL-JEFE.md con las decisiones que faltan para construir el cobro:
cómo se vende el software, los planes y precios, el precio para alumnos del curso, forma de
pago (Stripe), factura, fechas y publicación.
Por qué: el cobro y las cuentas dependen de decisiones de negocio, no técnicas.
Verificación: texto revisado contra lo que hay en la app (pantalla de planes y cuenta, que hoy
son una simulación sin cobro).
Archivos: docs/PREGUNTAS-PARA-EL-JEFE.md

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## docs: actualizar bitácora de commits

- Commit: `8da737a`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: regeneración de docs/COMMITS.md con el paquete de prueba de Gerber.
Por qué: mantener el registro al día.
Verificación: generado por scripts/commit-log.mjs.
Archivos: docs/COMMITS.md

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## docs: paquete de prueba de los DXF en Gerber

- Commit: `a62df70`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: carpeta docs/prueba-gerber con 12 archivos DXF (6 prendas: falda recta, falda en A,
blusa clásica, camisa de hombre, pantalón de vestir y playera básica, cada una en talla base
y graduada) y PRUEBA.md con los pasos, las medidas esperadas por pieza, la tabla de
resultados y los puntos donde ya se sabe que puede fallar (unidades, graduado, formato AAMA).
Por qué: los DXF solo se han validado con pruebas propias; falta abrirlos en Gerber.
Verificación: archivos generados con el exportador de la app; las medidas de la tabla salen
del mismo patrón. La prueba en Gerber la hace quien tenga el programa.
Archivos: docs/prueba-gerber/*

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## docs: actualizar bitácora de commits

- Commit: `f93672d`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: regeneración de docs/COMMITS.md con la eliminación de la vista 3D.
Por qué: mantener el registro al día.
Verificación: generado por scripts/commit-log.mjs.
Archivos: docs/COMMITS.md

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## revert: quitar la vista 3D

- Commit: `2f3cc2a`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: se elimina la pestaña Producción → Vista 3D, su código (drape.ts, Vista3D.tsx),
sus 61 pruebas, los estilos y la dependencia three.js. Producción vuelve a tener
Ficha técnica y Variantes de modelo.
Por qué: el resultado (piezas planas envueltas en un cuerpo) no tiene la calidad
que se pidió, que es una vista realista de la prenda con cuello, botones, puños
y pliegues; eso requiere otro enfoque, no un ajuste de este.
Verificación: 433 pruebas pasan, tipos sin errores y build de producción correcto.
Se conserva la corrección del pantalón de mezclilla y de vestir (commit 23ee69a).
Archivos: apps/web/app/studio/{Produccion.tsx,studio.css,Vista3D.tsx,drape.ts},
apps/web/package.json, pnpm-lock.yaml, tests/drape.test.ts

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## docs: actualizar bitácora de commits

- Commit: `feb0425`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: regeneración de docs/COMMITS.md con la corrección del pantalón.
Por qué: mantener el registro al día.
Verificación: generado por scripts/commit-log.mjs.
Archivos: docs/COMMITS.md

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## fix(blocks): entrepierna y bajo del pantalón de mezclilla y de vestir

- Commit: `23ee69a`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: el bloque de pantalón de mezclilla (y el de vestir, que se deriva de él)
colocaba la entrepierna hacia adentro del centro (x = +8.7 en vez de salir hacia
afuera) y usaba la medida de bajo a la mitad. La pierna medía solo 28 cm de
contorno en la entrepierna con un muslo de 56, y en el de vestir la rodilla
quedaba más ancha (72 cm) que la entrepierna. Ahora el delantero toma el 47 % y
la espalda el 53 % del contorno de muslo, rodilla y bajo, igual que ya hacían
short, bermuda, cargo y jogger. En el de vestir el bajo pasa a ser 0.9 × el
muslo (pierna recta).
Por qué: la vista 3D del pantalón de vestir salía como un jarrón; el defecto
estaba en el patrón, no en la vista.
Verificación: 494 pruebas (12 nuevas: en los 6 pantalones el contorno del muslo
queda cerca de la medida, no se estrecha en la entrepierna y la rodilla nunca es
más ancha que el muslo); revisado en la app en 3D y en 2D. Cambia la forma del
patrón de mezclilla y de vestir: conviene que la patronista lo revise.
Archivos: packages/blocks/src/index.ts, tests/pants.test.ts

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

## docs: actualizar bitácora de commits

- Commit: `77af61e`
- Fecha: 2026-10-22
- Autor: wh505010@gmail.com

Qué: regeneración de docs/COMMITS.md con la vista 3D.
Por qué: mantener el registro al día.
Verificación: generado por scripts/commit-log.mjs.
Archivos: docs/COMMITS.md

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

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

