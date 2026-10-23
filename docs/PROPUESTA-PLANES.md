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
| "Bloques de mezclilla" solo en Taller | Las 17 prendas están en todos | Aclarar que las 17 prendas van en todos los planes |

## 2. Planes propuestos

Tres planes, cada uno con lo que se puede cumplir. Precios en pesos mexicanos al mes, **más IVA** (la página actual ya habla de factura con IVA desglosado).

| | **Aprendiz** | **Taller** | **Equipo** |
|---|---|---|---|
| Para quién | Alumnos del curso | Patronista independiente o taller chico | Taller o maquila con varias personas |
| Precio sugerido | Incluido 3 meses con el curso; después **$149 / mes** | **$390 / mes** (precio de lanzamiento; después $490) | **$990 / mes** (precio de lanzamiento; después $1,290) |
| Precio anual | 2 meses gratis | 2 meses gratis | 2 meses gratis |
| 17 prendas base y editor completo | Sí | Sí | Sí |
| Graduación y trazo con consumo | Sí | Sí | Sí |
| Proyectos guardados | Hasta 10 | Ilimitados | Ilimitados |
| Exportar PDF, SVG y ficha técnica | Sí | Sí | Sí |
| Exportar DXF y PDF 1:1 (plotter) | No | Sí | Sí |
| Usuarios | 1 | 2 | 8 (cuando existan las cuentas de equipo) |
| Soporte | Ayuda en la app y comunidad | Correo | Correo con respuesta en 1 día hábil |

**Por qué estos precios:**
- Los programas profesionales (Gerber AccuMark, Lectra Modaris) se venden por suscripción anual con cotización y cuestan mucho más; Optitex también es por cotización. Valentina y Seamly2D son gratuitos (código abierto).
- CLO 3D, que es otro tipo de programa (ropa en 3D), aparece en una comparación de terceros entre US$25 y US$60 al mes. Los $490 y $1,290 que ya tenía la pantalla equivalen a unos US$25 y US$65, parecido.
- Mientras el software no esté validado por un maestro ni probado en Gerber, un **precio de lanzamiento menor** ($390 y $990) protege la confianza de los primeros clientes. Se sube a $490 y $1,290 cuando esté validado.
- El plan "Aprendiz" evita cobrarle dos veces al alumno del curso de $550 y crea el hábito de usar el programa.

**Se recomienda no ofrecer el plan Industrial por ahora.** Quien lo pida se atiende con una cotización aparte.

## 3. Costos de operarlo

Hoy (todo local) el costo es $0. Al cobrar y tener cuentas hay costos reales.

**Comisión de Stripe (varía por fuente; confirmar en stripe.com/mx/pricing):** las fuentes consultadas coinciden en 3.6 % + $3 MXN por pago con tarjeta nacional más IVA sobre la comisión, y una la sube a 3.85 % + $3 (más 0.5 % en cobros recurrentes). Con 3.6 % + $3 + IVA:

| Precio | Comisión de Stripe | Te queda |
|---|---|---|
| $149 | ≈ $8.4 + IVA ≈ $9.7 | ≈ $139 |
| $390 | ≈ $17.0 + IVA ≈ $19.8 | ≈ $370 |
| $990 | ≈ $38.6 + IVA ≈ $44.8 | ≈ $945 |

Es alrededor del 4.5 al 6.5 % del precio (más en los pagos chicos por el cargo fijo de $3). Pago con OXXO o transferencia (SPEI) tienen otras tarifas.

**Servicios para tener cuentas y guardar proyectos en la nube (estimado, por confirmar con cotización real):**
- Servidor y base de datos para cuentas y proyectos: del orden de US$25 al mes en un plan básico.
- Dominio y correo: unos US$15 al año el dominio; correo transaccional con plan gratis al inicio.
- Facturación (CFDI) automática: servicio aparte, por cotizar.
- Mi trabajo de construir cuentas, cobro y límites por plan no está incluido aquí.

Con un tipo de cambio supuesto de $18 a $20 por dólar, los costos fijos serían del orden de **$600 a $1,000 al mes** al inicio.

**Punto de equilibrio aproximado (solo servicios, sin mi trabajo):** con $1,000 de costos fijos y $370 netos por cada plan Taller, hacen falta **3 suscriptores Taller** para cubrirlos. Con $945 netos por plan Equipo, hacen falta **2**.

## 4. Lo que hay que construir para cumplir esta propuesta

En este orden (de menor a mayor trabajo):
1. **Corregir la pantalla de planes** con los textos verdaderos de la sección 1 y los precios de la tabla. (Poco trabajo.)
2. **Agregar las tallas 38 a 44** si se quiere mantener "graduación completa". (Poco trabajo; cada talla extra no se ha probado con los patrones base.)
3. **Aplicar los límites por plan en el programa:** 10 proyectos en Aprendiz y exportación a DXF y plotter solo en Taller y Equipo. (Mediano.)
4. **Cuentas reales** (correo y contraseña o Google), base de datos y guardado en la nube. (Grande. Depende de la decisión del jefe.)
5. **Cobro con Stripe**, con suscripción mensual o anual y renovación; el cobro avisa al sistema y se activa o se corta el acceso. (Grande.)
6. **Cuentas de equipo con roles** para el plan Equipo. (Grande; se puede dejar para después y vender el plan Equipo con 1 usuario por ahora.)
7. **Facturación CFDI** y publicación en internet con dominio propio.

## 5. Decisiones que necesita tomar el jefe

1. ¿Se aprueban los tres planes y los precios (o se ajustan)? ¿Los precios llevan IVA incluido o aparte?
2. ¿El alumno del curso recibe 3 meses del plan Aprendiz incluidos, otro periodo, o paga aparte?
3. ¿Se mantiene el precio de lanzamiento y hasta cuándo?
4. ¿Cobro con tarjeta por Stripe, además de OXXO o transferencia?
5. ¿Se quita el plan Industrial?
6. ¿Quién atenderá el soporte (correo) y con qué tiempo de respuesta?
7. ¿Se necesita factura (CFDI) automática desde el inicio?

## Fuentes de los datos externos
- Comisión de Stripe en México (secundarias; confirmar en la página oficial de Stripe): [guía de pasarelas en México](https://www.guiadesoftware.com/blog/mejor-pasarela-pago-mexico), [Expansión](https://expansion.mx/tecnologia/2019/10/25/sabes-como-pagas-rappi-o-uber-detras-de-tu-operacion-esta-stripe), [Harbiz](https://intercom.help/harbiz-help/es/articles/5901434-como-conecto-mi-cuenta-de-pagos-y-planes-desde-harbiz).
- Programas de la competencia: [Lectra, suscripción de Modaris y AccuMark](https://www.lectra.com/en/library/why-you-should-switch-to-modaris-and-gerber-accumark-software-subscriptions) (precio por cotización) y una [comparación de terceros](https://eathealthy365.com/cost-of-cad-clothing-design-software/) (poca fiabilidad; los precios de CLO, Tailornova, Valentina y Seamly2D son orientativos).
