# Propuesta de planes y costos de HiloNova Studio

> **Actualización del 23 de octubre de 2026:** se decidió cobrar con la cuenta de Stripe de Bioorigen, **sin límite de exportaciones** (no se puede hacer cumplir de forma segura en el navegador) y el acceso de alumnos lo da el negocio **a mano** por un mes (sin tarjeta). El cobro es un enlace de pago de Stripe, **sin plan Blaze ni servidor propio**. Los detalles y los pasos están en `docs/COBRO-PASOS.md`; lo que diga abajo sobre «3 exportaciones» quedó superado.


Fecha: 23 de octubre de 2026. Es una **propuesta para decidir**, no algo ya construido: hoy el cobro, las cuentas y los límites por plan no existen.
Los precios son sugerencias mías con los supuestos de abajo; deben validarlos el jefe y quien lleve las cuentas.

## 1. Qué puede prometer el software hoy (y qué no)

Solo se debe poner en un plan lo que el programa ya hace o lo que se puede construir con seguridad.

**Se puede prometer hoy (verificado):**
- Editor de patrones 2D con 12 herramientas, biblioteca de piezas y "Mis piezas".
- 17 prendas base con sus piezas, que se ajustan a las medidas.
- Graduación automática (S–XL, XS–XXL, 28–36) y manual por nodo.
- Trazo con consumo por talla y porcentaje de aprovechamiento.
- Ficha técnica en PDF y variantes de modelo.
- Materiales, reportes de consumo y costo, respaldo, ayuda dentro de la app.
- Exportar: PDF, SVG y DXF (el DXF se llama "formato estilo AAMA", aún sin probar en Gerber).

**NO se debe prometer todavía (la pantalla de planes actual lo promete):**
| Texto actual | Realidad | Qué hacer |
|---|---|---|
| "Graduación completa 28–44" | Solo 28 a 36 | Quitarlo, o agregar las tallas 38 a 44 (trabajo chico) |
| "Export DXF-AAMA nativo" | Sin probar en Gerber | Decir "DXF estilo AAMA (en validación)" hasta que se pruebe |
| "8 usuarios con roles" | No hay cuentas reales ni roles | Quitarlo hasta construir cuentas de equipo |
| "Inicio de sesión corporativo (SSO)" y "Acceso a la API" | No existen y no están planeados | Quitar el plan Industrial; ofrecer "contáctanos" |
| "Soporte por WhatsApp" | Es un servicio de una persona | Solo si alguien lo atenderá |
| "Bloques de mezclilla" solo en Taller | Las 17 prendas están en el plan | Aclarar que las 17 prendas van en el plan |

## 2. Plan propuesto: uno solo, con un solo precio

Decisión del 23 de octubre: **un solo plan con un solo precio** (el original, $490 al mes), sin precios por partes (nada de precio de lanzamiento, plan de aprendiz ni meses gratis incluidos). Los alumnos del curso reciben un cupón de **un mes con 3 exportaciones** (ver abajo); todos los demás pagan el plan normal.

| | **Completo** |
|---|---|
| Precio | **$490 al mes**, más IVA |
| Patronaje 2D | 12 herramientas, biblioteca de piezas y 17 prendas base |
| Graduación | Automática y manual. S–XL, XS–XXL y 28–36 |
| Trazo | Consumo de tela por talla y porcentaje de aprovechamiento |
| Producción | Ficha técnica, variantes de modelo y exportar PDF, SVG y DXF estilo AAMA (en validación hasta probarlo en Gerber) |
| Además | Proyectos ilimitados, ayuda dentro de la app y soporte por WhatsApp |
| Usuarios | 1 (las cuentas de equipo llegan después) |

La tarjeta está organizada por los cuatro módulos que se pidieron para que se pueda revisar punto por punto contra la lista de lo solicitado.

**Por qué un solo precio:** es más fácil de explicar, de cobrar y de mantener; no hay límites que construir ni controlar por plan. Se quitaron los planes Taller/Maquila/Industrial anteriores, el plan Aprendiz y el precio de lanzamiento. Un plan de equipo con roles se puede ofrecer más adelante, cuando existan las cuentas de equipo.

**Por qué $490:** es el precio original más bajo de la pantalla de planes. Los programas profesionales (Gerber AccuMark, Lectra Modaris) se venden por cotización anual y cuestan mucho más; CLO 3D (otro tipo de programa) aparece entre US$25 y US$60 al mes según fuentes poco fiables.

### Cupón para alumnos del curso: un mes con 3 exportaciones

Todos pagan el plan de $490 desde el primer día. Solo los alumnos del curso reciben un cupón:
- **1 mes con el programa completo, sin pagar** (editor, graduación, trazo, ficha técnica, las 17 prendas).
- **Con un límite: 3 exportaciones en total** durante ese mes. Cuenta como exportación cada archivo que sale del programa (DXF, PDF, SVG, ficha técnica o trazo). El respaldo de los proyectos **no** cuenta.
- El cupón es de **un solo uso** por alumno y hay que **canjearlo dentro de las 24 horas** desde que se recibe; si vence, se pide otro en el curso.
- Después del mes, para seguir usando el programa se paga el plan.

**Por qué funciona:** el alumno aprende y practica todo el mes sin límites, y se topa con el tope justo cuando quiere llevarse algo a la fábrica (exportar). Ahí es cuando le conviene pagar el segundo mes.

**Cómo se haría:** con los cupones de Stripe (permiten un solo uso, fecha de vencimiento y periodo de prueba de un mes). Contar las exportaciones requiere cuentas reales y un servidor: un contador en el navegador se podría borrar, así que esto se construye junto con las cuentas y el cobro. Hoy la pantalla solo lo explica, no lo aplica.

**Lo que hay que decidir:** qué pasa el día 31 (se recomienda que los proyectos se conserven solo para verlos y que el respaldo siempre se pueda descargar, en vez de bloquear todo), si se pide tarjeta para el mes gratis (se recomienda que no) y cómo le llega el cupón al alumno.

## 3. Costos de operarlo

Hoy (todo local) el costo es $0. Al cobrar y tener cuentas hay costos reales.

**Comisión de Stripe (varía por fuente; confirmar en stripe.com/mx/pricing):** las fuentes consultadas coinciden en 3.6 % + $3 MXN por pago con tarjeta nacional más IVA sobre la comisión, y una la sube a 3.85 % + $3 (más 0.5 % en cobros recurrentes). Con 3.6 % + $3 + IVA:

| Precio | Comisión de Stripe | Te queda |
|---|---|---|
| $490 | ≈ $20.6 + IVA ≈ $23.9 | ≈ $466 |

Es alrededor del 5 % del precio (más en los pagos chicos por el cargo fijo de $3). Pago con OXXO o transferencia (SPEI) tienen otras tarifas.

**Servicios para tener cuentas y guardar proyectos en la nube (estimado, por confirmar con cotización real):**
- Servidor y base de datos para cuentas y proyectos: del orden de US$25 al mes en un plan básico.
- Dominio y correo: unos US$15 al año el dominio; correo transaccional con plan gratis al inicio.
- Facturación (CFDI) automática: servicio aparte, por cotizar.
- Mi trabajo de construir cuentas, cobro y límites por plan no está incluido aquí.

Con un tipo de cambio supuesto de $18 a $20 por dólar, los costos fijos serían del orden de **$600 a $1,000 al mes** al inicio.

**Punto de equilibrio aproximado (solo servicios, sin mi trabajo):** con $1,000 de costos fijos y $466 netos por cada suscripción de $490, hacen falta **3 suscriptores** que paguen el precio completo. Los alumnos en su mes gratis no pagan ni generan comisión.

## 4. Lo que hay que construir para cumplir esta propuesta

En este orden (de menor a mayor trabajo):
1. **Pantalla de planes con el plan único** y el aviso del código de descuento. (Hecho.)
2. **Cuentas reales** (correo y contraseña o Google), base de datos y guardado en la nube. (Grande. Depende del jefe.)
3. **Cobro con Stripe**: suscripción mensual con renovación; el cobro avisa al sistema y se activa o se corta el acceso. (Grande.)
4. **Cupón del mes gratis** de un solo uso con vencimiento de 24 horas (cupones de Stripe), **contador de 3 exportaciones** por alumno y la forma de entregarle el cupón. (Mediano; va junto con las cuentas y el cobro.)
5. **Tallas 38 a 44**, solo si se quiere ofrecer más de 28–36. (Poco trabajo; no está probado con los patrones base.)
6. **Facturación CFDI** y publicación en internet con dominio propio.
7. **Cuentas de equipo con roles**, como plan aparte, más adelante.

## 5. Decisiones que necesita tomar el jefe

1. ¿Se aprueba el plan único a $490 al mes (más IVA o IVA incluido)?
2. **Cupón de alumnos:** ¿1 mes con 3 exportaciones? ¿Qué pasa el día 31? ¿Se pide tarjeta?
3. ¿Cómo le llega el cupón al alumno y quién lo genera?
4. ¿Cobro con tarjeta por Stripe, además de OXXO o transferencia?
5. ¿Quién atenderá el soporte (correo) y con qué tiempo de respuesta?
6. ¿Se necesita factura (CFDI) automática desde el inicio?
7. ¿Se ofrece después un plan de equipo?

## Fuentes de los datos externos
- Comisión de Stripe en México (secundarias; confirmar en la página oficial de Stripe): [guía de pasarelas en México](https://www.guiadesoftware.com/blog/mejor-pasarela-pago-mexico), [Expansión](https://expansion.mx/tecnologia/2019/10/25/sabes-como-pagas-rappi-o-uber-detras-de-tu-operacion-esta-stripe), [Harbiz](https://intercom.help/harbiz-help/es/articles/5901434-como-conecto-mi-cuenta-de-pagos-y-planes-desde-harbiz).
- Programas de la competencia: [Lectra, suscripción de Modaris y AccuMark](https://www.lectra.com/en/library/why-you-should-switch-to-modaris-and-gerber-accumark-software-subscriptions) (precio por cotización) y una [comparación de terceros](https://eathealthy365.com/cost-of-cad-clothing-design-software/) (poca fiabilidad; los precios de CLO, Tailornova, Valentina y Seamly2D son orientativos).
