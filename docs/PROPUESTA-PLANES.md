# Propuesta de planes y costos de HiloNova Studio

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

Decisión del 23 de octubre: **un solo plan con un solo precio** (el original, $490 al mes), sin precios por partes (nada de precio de lanzamiento, plan de aprendiz ni meses gratis incluidos). Los alumnos del curso pagan **el mismo plan con un código de descuento**.

| | **Estudio** |
|---|---|
| Precio | **$490 al mes**, más IVA |
| Usuarios | Hasta 2 |
| Proyectos guardados | Ilimitados |
| 17 prendas base, editor, graduación y trazo con consumo | Sí |
| Ficha técnica en PDF y variantes de modelo | Sí |
| Exportar PDF, SVG y PDF 1:1 para plotter | Sí |
| Exportar DXF estilo AAMA | Sí (en validación hasta probarlo en Gerber) |
| Soporte | Ayuda dentro de la app y correo |

**Por qué un solo precio:** es más fácil de explicar, de cobrar y de mantener; no hay límites que construir ni controlar por plan. Se quitaron los planes Taller/Maquila/Industrial anteriores, el plan Aprendiz y el precio de lanzamiento. Un plan de equipo con roles se puede ofrecer más adelante, cuando existan las cuentas de equipo.

**Por qué $490:** es el precio original más bajo de la pantalla de planes. Los programas profesionales (Gerber AccuMark, Lectra Modaris) se venden por cotización anual y cuestan mucho más; CLO 3D (otro tipo de programa) aparece entre US$25 y US$60 al mes según fuentes poco fiables.

### Código de descuento para alumnos del curso

Cómo funcionaría (se puede hacer con los códigos promocionales de Stripe, que permiten limitar cada código a un solo uso y ponerle fecha de vencimiento):
- Cada alumno recibe **su propio código**, de **un solo uso**.
- **Vale 24 horas** desde que se le entrega; después ya no sirve y se pide uno nuevo en el curso.
- Se escribe al momento de pagar. El plan y su precio son los mismos para todos.
- El código solo existe cuando hay cobro (Stripe) y cuentas reales; hoy la pantalla solo lo explica, no lo valida.

Lo que hay que decidir: **cuánto es el descuento**, **si aplica solo al primer pago, a los primeros meses o siempre**, y cómo le llega el código al alumno (lo envía el curso al terminar, o se genera al pedirlo). Con un descuento del 30 % solo en el primer pago, por ejemplo, el primer cobro sería $343 más IVA (ejemplo, no una recomendación).

## 3. Costos de operarlo

Hoy (todo local) el costo es $0. Al cobrar y tener cuentas hay costos reales.

**Comisión de Stripe (varía por fuente; confirmar en stripe.com/mx/pricing):** las fuentes consultadas coinciden en 3.6 % + $3 MXN por pago con tarjeta nacional más IVA sobre la comisión, y una la sube a 3.85 % + $3 (más 0.5 % en cobros recurrentes). Con 3.6 % + $3 + IVA:

| Precio | Comisión de Stripe | Te queda |
|---|---|---|
| $490 | ≈ $20.6 + IVA ≈ $23.9 | ≈ $466 |
| $343 (con 30 % de descuento, ejemplo) | ≈ $15.4 + IVA ≈ $17.9 | ≈ $325 |

Es alrededor del 5 % del precio (más en los pagos chicos por el cargo fijo de $3). Pago con OXXO o transferencia (SPEI) tienen otras tarifas.

**Servicios para tener cuentas y guardar proyectos en la nube (estimado, por confirmar con cotización real):**
- Servidor y base de datos para cuentas y proyectos: del orden de US$25 al mes en un plan básico.
- Dominio y correo: unos US$15 al año el dominio; correo transaccional con plan gratis al inicio.
- Facturación (CFDI) automática: servicio aparte, por cotizar.
- Mi trabajo de construir cuentas, cobro y límites por plan no está incluido aquí.

Con un tipo de cambio supuesto de $18 a $20 por dólar, los costos fijos serían del orden de **$600 a $1,000 al mes** al inicio.

**Punto de equilibrio aproximado (solo servicios, sin mi trabajo):** con $1,000 de costos fijos y $466 netos por cada suscripción de $490, hacen falta **3 suscriptores** que paguen el precio completo (4 si entran con descuento en el primer pago).

## 4. Lo que hay que construir para cumplir esta propuesta

En este orden (de menor a mayor trabajo):
1. **Pantalla de planes con el plan único** y el aviso del código de descuento. (Hecho.)
2. **Cuentas reales** (correo y contraseña o Google), base de datos y guardado en la nube. (Grande. Depende del jefe.)
3. **Cobro con Stripe**: suscripción mensual con renovación; el cobro avisa al sistema y se activa o se corta el acceso. (Grande.)
4. **Código de descuento** de un solo uso con vencimiento de 24 horas, con los códigos promocionales de Stripe, y la forma de entregárselo al alumno. (Mediano; va junto con el cobro.)
5. **Tallas 38 a 44**, solo si se quiere ofrecer más de 28–36. (Poco trabajo; no está probado con los patrones base.)
6. **Facturación CFDI** y publicación en internet con dominio propio.
7. **Cuentas de equipo con roles**, como plan aparte, más adelante.

## 5. Decisiones que necesita tomar el jefe

1. ¿Se aprueba el plan único a $490 al mes (más IVA o IVA incluido)?
2. **Código de descuento:** ¿de cuánto es y aplica al primer pago, a unos meses o siempre?
3. ¿Cómo le llega el código al alumno y quién lo genera?
4. ¿Cobro con tarjeta por Stripe, además de OXXO o transferencia?
5. ¿Quién atenderá el soporte (correo) y con qué tiempo de respuesta?
6. ¿Se necesita factura (CFDI) automática desde el inicio?
7. ¿Se ofrece después un plan de equipo?

## Fuentes de los datos externos
- Comisión de Stripe en México (secundarias; confirmar en la página oficial de Stripe): [guía de pasarelas en México](https://www.guiadesoftware.com/blog/mejor-pasarela-pago-mexico), [Expansión](https://expansion.mx/tecnologia/2019/10/25/sabes-como-pagas-rappi-o-uber-detras-de-tu-operacion-esta-stripe), [Harbiz](https://intercom.help/harbiz-help/es/articles/5901434-como-conecto-mi-cuenta-de-pagos-y-planes-desde-harbiz).
- Programas de la competencia: [Lectra, suscripción de Modaris y AccuMark](https://www.lectra.com/en/library/why-you-should-switch-to-modaris-and-gerber-accumark-software-subscriptions) (precio por cotización) y una [comparación de terceros](https://eathealthy365.com/cost-of-cad-clothing-design-software/) (poca fiabilidad; los precios de CLO, Tailornova, Valentina y Seamly2D son orientativos).
