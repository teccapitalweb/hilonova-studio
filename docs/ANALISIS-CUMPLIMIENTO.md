# HiloNova Studio: análisis de cumplimiento y preguntas para el maestro costurero

Fecha: 23 de octubre de 2026. Rama local `dev/mvp-9-nov` (nada subido a internet).
Todo lo que dice "verificado" se comprobó en el código o en la app; lo que dice "no verificado" nadie lo ha probado todavía.

Cómo leer el estado de cada punto:
- **CUMPLE**: está hecho y probado.
- **PARCIAL**: existe, pero con límites que se explican.
- **NO CUMPLE**: no existe o se quitó.
- **DEPENDE DE OTROS**: lo único que falta es una decisión o una prueba que no hace el software.

---

## 1. Resumen

| Lo que se pidió | Estado |
|---|---|
| CAD 2D con herramientas de dibujo | **CUMPLE** (12 herramientas), con límites de edición avanzada |
| Biblioteca de piezas | **CUMPLE** (17 prendas por piezas + "Mis piezas") |
| Graduación automática S/M/L/XL | **CUMPLE** |
| Graduación manual | **CUMPLE** (por nodo y por talla) |
| Trazo inteligente con consumo por talla | **CUMPLE** con límites (heurística, rotación solo a 180°) |
| % de aprovechamiento | **CUMPLE** |
| Producción: ficha técnica | **CUMPLE** |
| Producción: variantes de modelo | **CUMPLE** |
| Producción: vista 3D opcional | **NO CUMPLE** (se quitó; el resultado no tenía la calidad pedida) |
| Producción: exportar | **CUMPLE** (DXF, SVG, PDF 1:1, PDF de ficha); DXF sin probar en Gerber |
| Menú lateral (Proyectos, Materiales, Librería, Reportes, Configuración) | **CUMPLE** (9 secciones) |
| App web con Stripe | **NO CUMPLE** (la pantalla de planes es una simulación) |

Fuera de lo pedido, pero hecho: guardado automático y respaldo, ayuda dentro de la app, 17 patrones base con pinzas, 560 pruebas automáticas.

---

## 2. Punto por punto

### 2.1 CAD 2D con herramientas de dibujo — CUMPLE

**Lo que hay (verificado):**
- Dibujo: polilínea (L), curva suave (C), rectángulo (R), círculo (O), agregar nodo (A).
- Edición: seleccionar y mover nodos, manijas de curva o piezas completas (V); mano (H); espejar; girar 90° o a un ángulo libre; duplicar (Ctrl+D); copiar y pegar; selección múltiple (Ctrl+clic, recuadro, Ctrl+A); borrar; deshacer y rehacer.
- Patronaje: piquetes (N), pinzas (P: clic en el contorno y luego dentro de la pieza), textos pegados a la pieza (T), medir distancia (M), **verificar costuras** (S: compara dos tramos que se cosen, con holgura prevista).
- Ayudas: rejilla con imán (snap), margen de costura visible, hilo de tela con ángulo por pieza, nido de tallas, zoom y mover la vista.
- Cada pieza tiene nombre, cantidad que se corta, tela, margen de costura e hilo.

**Límites (no existe):**
- Unir dos piezas en una, o partir una pieza con una línea desde la pantalla (el motor sí sabe partir, pero solo se usa dentro de las prendas base).
- Abrir y cerrar pinzas (transferir una pinza a otro lugar), abrir y separar para dar vuelo.
- Marca de "al doblez" en una pieza (las prendas simétricas se dibujan completas).
- Margen de costura distinto por lado (hoy es uno solo por pieza: no se puede poner 1 cm en costura y 3 cm en dobladillo).
- Marcas de taladro, curvas con herramienta de suavizado, escalado de una pieza.
- Unidades: solo centímetros en pantalla.

### 2.2 Biblioteca de piezas — CUMPLE

- Las 17 prendas aportan sus piezas, organizadas por categoría (delanteros, espaldas, mangas, cuellos, puños y vistas, bolsillos, complementos).
- "Mis piezas": cualquier pieza se guarda y se reutiliza.
- Al insertar, la pieza se agrega al proyecto abierto y se ajusta a las medidas del proyecto.
- Límite: no hay piezas sueltas "genéricas" (un cuello mao, por ejemplo) fuera de las 17 prendas.

### 2.3 Graduación — CUMPLE

**Automática (verificado):**
- Tres gamas listas: S·M·L·XL, XS a XXL y numeración 28·30·32·34·36 (base 32).
- Cada prenda trae reglas de cuántos centímetros crece cada medida por talla (ejemplo: busto, cintura y cadera +4 cm; hombro +1; sisa +0.8; largo de torso +1; para pantalón: tiro +0.5, muslo +2, bajo +1).
- La tabla de tallaje se puede editar: se cambian los centímetros por talla y el patrón se gradúa solo.
- Nido de tallas: todas las tallas encimadas, cada color una talla.

**Manual (verificado):** se selecciona un nodo y se escribe cuánto se mueve a lo ancho (Δx) y a lo largo (Δy) en cada talla; sirve también para patrones en blanco.

**Límites y riesgos:**
- La graduación es lineal: el mismo paso en cada talla (de S a M igual que de L a XL).
- **Las reglas de graduación son valores genéricos míos, no validados por un patronista.** Es la pregunta más importante para el maestro.
- La página de planes dice "Graduación completa 28–44", pero el programa solo trae la numeración 28 a 36. Hay que corregir el texto o ampliar las tallas.

### 2.4 Trazo inteligente — CUMPLE con límites

**Lo que hace (verificado):**
- Acomoda las piezas reales (con su margen de costura) en una tela del ancho que se elija, usando todas las copias.
- Prueba giro de 180° (conserva el hilo) y espejo en las copias impares.
- Trazo por talla y trazo combinado (una prenda de cada talla), con consumo en metros por prenda y por talla, y el porcentaje de aprovechamiento.
- Exporta el trazo a DXF (con el borde de la tela), PDF a escala 1:1 que se reparte en páginas, y SVG.
- Materiales: ancho y precio de la tela se traen de la pestaña Materiales.

**Límites:**
- Es un acomodo automático rápido (celdas de 1 cm), no un optimizador: un marcador hecho a mano o con Gerber/Lectra puede aprovechar más tela.
- No gira a ángulos libres, solo 0° y 180°.
- No considera telas con rayas o cuadros que se casan, dirección de pelo, ni defectos de la tela.
- No calcula encogimiento de la tela ni tendido (cuántas capas).
- **No se ha comparado el aprovechamiento con el de un trazo real hecho por un maestro.**

### 2.5 Producción — PARCIAL (por la vista 3D)

**Ficha técnica — CUMPLE:** portada, tabla de medidas por talla, vistas planas de las piezas y lista de materiales; se descarga como PDF.
**Variantes de modelo — CUMPLE:** guarda versiones del mismo diseño (manga 3/4, otro largo, etc.) y compara cuánta tela gasta cada una.
**Vista 3D opcional — NO CUMPLE:** se hizo una versión que envolvía las piezas planas en un cuerpo, pero el resultado no tenía la calidad pedida (se ve como una forma lisa, sin cuello, botones ni pliegues). Se quitó. Lograr algo como la imagen de referencia (render con detalle) requiere otro enfoque: simulación de tela sobre un maniquí, que son semanas de trabajo.
**Exportar — CUMPLE:** DXF (capas estilo AAMA/ASTM), SVG, PDF mosaico y PDF para plotter a escala 1:1, PDF de la ficha técnica.
**Pendiente de prueba:** el DXF no se ha abierto en Gerber ni Lectra; el PDF 1:1 no se ha impreso y medido con regla. Hay un paquete de prueba listo en `docs/prueba-gerber/`.

### 2.6 Menú lateral — CUMPLE

Proyectos, Patronaje 2D, Graduación, Trazo, Producción, Materiales, Librería, Reportes (consumo y costo por talla; se baja como CSV o se imprime) y Configuración (preferencias, respaldo y restauración).

### 2.7 App web con Stripe — NO CUMPLE

Lo que existe hoy es una simulación (verificado en el código):
- Crear cuenta e iniciar sesión son falsos: cualquier correo entra y nada se valida; no hay servidor ni base de datos.
- La pantalla de planes (Taller $490, Maquila $1,290, Industrial a medida) solo cambia una etiqueta en el navegador. No cobra.
- Los planes no limitan nada (todos pueden exportar DXF, usar trazo, etc.).
- No hay Stripe, ni facturación, ni recuperación de contraseña.
- Los planes y precios los puso el compañero que empezó el proyecto; no vienen de lo pedido.
- La app no está publicada en internet (todo local, como se pidió).

**Depende de decisiones del jefe**: precio, pago único o mensual, código o tarjeta, cuenta de Stripe, si va incluido en el curso. Las preguntas están en `docs/PREGUNTAS-PARA-EL-JEFE.md`.

---

## 3. Los 17 patrones base

Cada pieza y detalle viene de las fotos de referencia. Las medidas (cm) no se pudieron validar con las fotos porque no traen escala. Se verifica de forma automática que: ninguna pieza se cruza, las tallas crecen, el contorno de pecho y de cadera es la medida más una holgura razonable, los costados y las entrepiernas del delantero y la espalda miden lo mismo (con las pinzas cosidas), el cuello mide lo que el escote y la manga cierra con la sisa.

| Prenda | Piezas | Lo que ya trae | Simplificaciones o dudas para el maestro |
|---|---|---|---|
| Pantalón denim slim | 10 | Delantero, espalda baja, canesú, pretina, 6 trabillas, bolsa y vista de bolsillo delantero, bolsillo trasero, moneda, vista de bragueta | Canesú recto (el real suele ir en V); tamaño de bolsas; forma del tiro |
| Pantalón de vestir | 8 | Pliegue marcado, pinza trasera, pretina, trabillas, bolsas laterales y traseras, vivos, bragueta | El pliegue es cintura 3 cm más ancha con 2 piquetes (no dibujado); sin forro de rodilla |
| Playera básica | 4 | Delantero, espalda, manga corta ajustada a la sisa, cuello de rib | Largo de manga (22 cm); sin dobladillo marcado; tejido de punto sin elongación |
| Falda recta | 3 | Pinzas, abertura trasera de 3 cm × 20 cm, pretina | Cierre y su vista no están; abertura simétrica |
| Blusa clásica | 8 | Delantero con pinza de busto y de talle, espalda, manga con puño, cuello con pie, vista, ruedo curvo | Posición de las pinzas; tapeta vs. vista |
| Chamarra de mezclilla | 14 | Canesús, delantero en dos paneles, faja, bolsillos de pecho con solapa y laterales con vivo, cuello, puños | Canesú recto; paneles sin pinza de pecho; manga sin tapeta |
| Short | 10 | Igual que el denim (cinco bolsillos) | Largo del tiro y del muslo |
| Bermuda | 6 | Pliegue marcado, pinza trasera, pretina, trabillas, bolsillos, bragueta | Igual que el pantalón de vestir |
| Vestido básico | 6 | Delantero con pinza de busto y pinzas de talle, espalda con cierre, vistas | Sin forro; cierre invisible no dibujado; pinzas de talle son líneas, no cortes |
| Sudadera con capucha | 8 | Hombro caído, capucha con su borde calculado al escote, canguro, rib en puños y pretina, cordón | Capucha de una sola pieza por lado; ojales del cordón no marcados |
| Falda en A | 4 | Delantero en 3 paneles, espalda con pinza, pretina | Posición de las costuras de panel; vuelo (bajo ≈ 1.8 × cintura) |
| Pants jogger | 6 | Pretina elástica con cordón, puño de tobillo, bolsas de bolsillo laterales | Anchura de pierna en el muslo y en el tobillo |
| Camisa de hombre | 9 | Canesú, tapeta, cuello con pie, puño, bolsillo, ruedo curvo, marcas de ojal en las puntas | Cuello button-down solo marcado con textos; sin pliegue en la espalda |
| Camisa manga corta | 8 | Igual sin puño | Largo de manga |
| Playera polo | 7 | Cuello de polo, tapeta de abertura, puño de rib en manga | Forma del cuello; abertura como línea interna |
| Chaleco | 5 | Escote en V, forro, vivos de bolsillo, bajo en punta | Falta pieza de ojal y botones; forro igual al exterior |
| Pantalón cargo | 9 | Bolsillos de fuelle y solapas, bolsillos delanteros y traseros, trabillas, pretina, bragueta | Fuelle de los bolsillos no se dibuja; rodilleras no están |

**Defectos propios que ya se corrigieron en esta sesión** (para transparencia con el maestro): el pantalón de mezclilla y el de vestir tenían la entrepierna mal puesta; el cuello de la chamarra medía 3 cm menos que su escote; la capucha de la sudadera medía 34 cm contra 24 del escote; y las pinzas de los patrones base le quitaban hasta 10 cm a la cintura de las faldas (todas corregidas y con pruebas que lo vigilan).

---

## 4. Calidad y confiabilidad

| Tema | Estado |
|---|---|
| Pruebas automáticas | **CUMPLE**: 560 pruebas (patrones, graduación, DXF, trazo, guardado, ayuda); no están conectadas para correr solas al subir cambios |
| Guardado | **CUMPLE**: automático a los 1.5 s; avisa si el navegador no deja guardar; avisa al cerrar con cambios sin guardar |
| Respaldo | **CUMPLE**: respaldo completo y restauración; recordatorio semanal si no se ha descargado |
| Ayuda dentro de la app | **CUMPLE**: guía por pantalla, primeros pasos, patrón en blanco, atajos |
| Proyectos solo en el navegador | **PARCIAL**: si se borra el navegador sin respaldo, se pierden; sin servidor no hay sincronía entre equipos |
| DXF en Gerber/Lectra | **DEPENDE DE OTROS**: sin probar; riesgos conocidos: unidades, graduado como piezas sueltas y no como reglas, faltan nombre de pieza y talla dentro del archivo |
| PDF 1:1 en plotter | **DEPENDE DE OTROS**: sin imprimir y medir |
| Otros navegadores y tablet | **DEPENDE DE OTROS**: solo probado en Chrome de escritorio |
| Rendimiento con proyectos grandes | **No verificado** |
| Accesibilidad (lector de pantalla, solo teclado) | **No evaluado** |
| Idioma | Solo español |
| Seguridad y privacidad | Datos solo locales; el acceso es simulado (cualquiera entra) |

---

## 5. Preguntas para el maestro costurero

Ordenadas de la más importante a la menos. Se pueden contestar con una frase.

### A. Medidas y tallas
1. ¿Qué medidas de cuerpo se toman para cada prenda? ¿Faltan alguna (altura de busto, ancho de espalda, contorno de brazo, etc.)?
2. ¿La numeración de pantalón 28 a 36 (de 2 en 2) corresponde a cintura en pulgadas? ¿Hasta qué talla debe llegar (28–44 como prometen los planes, o más)?
3. ¿Se usan tallas alfabéticas (S, M, L, XL) o numéricas para cada prenda en la maquila?
4. ¿Cuántos centímetros crece **cada medida por talla** en su método? Hoy uso: busto, cintura y cadera +4 cm por talla, hombro +1, sisa +0.8, largo de torso +1, tiro +0.5, muslo +2, bajo +1.
5. ¿Esa graduación es igual en todas las tallas o cambia (por ejemplo, de XL a XXL se crece distinto)?
6. ¿Las tallas de hombre y de mujer usan reglas distintas?

### B. Holguras (cuánto más grande que el cuerpo)
7. ¿Cuánta holgura lleva cada prenda? Hoy: blusa +8 cm de busto, camisa de hombre +16, chamarra +14 a 19, sudadera +18, polo +12, playera +4 (tejido de punto), vestido +8.
8. ¿Cuánta holgura en la cintura y la cadera de falda y pantalón? Hoy en la cadera: falda recta +2, pantalón de vestir +2, short +4, bermuda +5, cargo +6, jogger +8.
9. En tejido de punto, ¿se reduce el patrón (elongación negativa)? ¿Cuánto en cuello de rib, puños y pretina? Hoy: rib al 85 % del escote, puño de rib al 80 %.

### C. Márgenes y dobladillos
10. ¿Qué margen de costura se usa en cada tipo de costura y en cada tela? Hoy: 1 cm en todo.
11. ¿Qué dobladillo lleva cada prenda (bajo de falda, de pantalón, de manga)? Hoy el programa no lo maneja por separado del margen de costura.
12. ¿Qué marcas lleva una pieza en la maquila: piquetes, taladros, hilo, nombre, talla, cantidad? ¿Cómo se rotulan?

### D. Detalles de cada prenda (las simplificaciones de la tabla 3)
13. **Canesú del jean y de la chamarra:** ¿recto o en V? ¿A cuántos centímetros del cuello va?
14. **Pliegue de pantalón de vestir y bermuda:** ¿de cuánto es el pliegue (hoy 3 cm de cintura) y dónde va exactamente?
15. **Bolsillos:** ¿medidas estándar de la bolsa de bolsillo delantero, trasero y moneda? Hoy uso 16×26, 14×16 y 6.5×7.5.
16. **Pinzas:** ¿ancho y posición de la pinza de busto, de talle y de cintura? Hoy la pinza de cintura toma del 40 al 55 % de la diferencia entre un cuarto de cadera y un cuarto de cintura, y la de busto crece con el busto (≈2.6 cm con busto 92).
17. **Cuellos:** ¿cómo se calcula la longitud del cuello contra el escote en camisa, chamarra y polo? Hoy: igual al escote; el polo al 78 %.
18. **Mangas:** ¿cuánta holgura lleva la cabeza de manga respecto a la sisa en cada prenda (hoy 0 a 3 cm)? ¿Altura de la cabeza?
19. **Tiro y entrepierna:** ¿cómo se calcula el tiro de delantero y espalda, y cuánto más largo es el trasero? Hoy la espalda del pantalón mide 1.5 cm más de alto que el delantero.
20. **Falda en A:** ¿cuánto vuelo es normal (hoy el bajo es 1.8 veces la cintura)? ¿Cuántos paneles lleva y dónde van las costuras?
21. **Chaleco:** ¿cómo va la punta del bajo y el forro?
22. **Cierres, botones y ojales:** ¿se dibujan como piezas o solo como marcas? ¿Las vistas y entretelas se incluyen como piezas?

### E. Tela y trazo
23. ¿Qué ancho de tela usan normalmente (150, 160, 180 cm)?
24. ¿Qué eficiencia (aprovechamiento) es normal en un marcador real: 75, 80, 85 %?
25. ¿Giran las piezas a otros ángulos que no sean 180° (por ejemplo 90°), según la tela?
26. ¿Cómo se manejan tela con dirección, rayas o cuadros? ¿Se casan?
27. ¿Cuánto se deja entre piezas y a la orilla de la tela?
28. ¿Cómo se calcula el consumo oficial: ¿marcador por talla o promedio por prenda? ¿Se agrega un porcentaje de merma?
29. ¿Se considera encogimiento de la tela (lavado) al cortar?

### F. Producción y ficha técnica
30. ¿Qué datos lleva una ficha técnica de maquila? Hoy: portada, medidas por talla, vistas planas y lista de materiales. ¿Qué falta (tolerancias de medida, puntos de medición, secuencia de costura, tiempos, puntada y aguja)?
31. ¿Qué incluye la lista de materiales (tela, forro, entretela, hilo, botones, cierres, etiquetas)?
32. ¿Para qué sirven las variantes de modelo en la práctica (mismas piezas con otro largo o cuello)?

### G. Archivos para fábrica
33. ¿La maquila usa Gerber, Lectra u otro software? ¿Qué versión?
34. ¿Qué formato exacto piden: DXF-AAMA, DXF-ASTM, o el archivo propio del programa?
35. ¿En qué unidad llegan los archivos (cm, mm, pulgadas)?
36. ¿Usan plotter para imprimir el trazo? ¿De qué ancho de papel?

### H. Alcance del curso
37. De las 17 prendas, ¿cuáles se enseñan en el curso y en qué orden?
38. ¿Qué espera hacer el alumno con el software: solo ver y graduar los patrones base, o crear patrones propios en blanco?
39. ¿El software es de práctica o para producir de verdad? (Cambia qué tan exactas deben ser las medidas.)
40. ¿Hay algo que el maestro usa todos los días y no está en el programa?

---

## 6. Riesgos conocidos, dichos claro

1. **Las medidas, holguras y reglas de graduación son valores razonables pero no validados por un patronista.** Hasta que el maestro los revise, no se deben presentar como estándar.
2. **La Vista 3D pedida no existe.** Si es obligatoria para el curso, es un proyecto aparte de semanas.
3. **El cobro con Stripe y las cuentas reales no existen.** Es la parte más grande por hacer y depende de las respuestas del jefe.
4. **El DXF no se ha abierto en Gerber ni Lectra.** Es el archivo que la maquila usa de verdad.
5. **Los proyectos viven solo en el navegador.** Sin respaldo, un alumno puede perderlos.
6. **Los planes que se muestran (y sus límites) son de otra persona y no se aplican.** Hay que cuidar no prometerlos.
7. **Pruebas sin hacer:** otros navegadores y tablet (el usuario aún no tiene dónde), proyectos grandes, accesibilidad, impresión real a 1:1.

## 7. Después de la reunión

1. Con las respuestas A, B y C se ajustan holguras, reglas de graduación y márgenes (cambios en los patrones y en las pruebas).
2. Con las respuestas D se terminan las simplificaciones de cada prenda.
3. Con E y F se afinan el trazo y la ficha técnica.
4. Con G se corrige el DXF y se prueba en Gerber.
5. Con H se decide si hace falta la Vista 3D y cuántas prendas se pulen primero.
6. Con las respuestas del jefe se construye el cobro, las cuentas y la publicación.
