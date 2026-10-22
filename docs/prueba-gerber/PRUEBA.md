# Prueba de los archivos DXF en Gerber

Objetivo: comprobar que lo que exporta Hilonova Studio se abre bien en Gerber (AccuMark / PDS)
y que las piezas salen del tamaño correcto. Yo no puedo abrir Gerber, así que esta prueba la hace
quien tenga el programa y me manda lo que vea.

## Qué hay en esta carpeta

Seis prendas, cada una en dos archivos:

| Prenda | Talla base | Archivo de una talla | Archivo graduado (todas las tallas) |
|---|---|---|---|
| Falda recta | 32 | `falda-recta-talla-32.dxf` | `falda-recta-graduado.dxf` |
| Falda en A | M | `falda-a-talla-M.dxf` | `falda-a-graduado.dxf` |
| Blusa clásica | M | `blusa-clasica-talla-M.dxf` | `blusa-clasica-graduado.dxf` |
| Camisa de hombre | M | `camisa-hombre-talla-M.dxf` | `camisa-hombre-graduado.dxf` |
| Pantalón de vestir | 32 | `pantalon-vestir-talla-32.dxf` | `pantalon-vestir-graduado.dxf` |
| Playera básica | 32 | `playera-basica-talla-32.dxf` | `playera-basica-graduado.dxf` |

Los archivos salen de la app (Exportar → DXF); aquí están ya generados con las medidas por defecto.
Las unidades del archivo son **centímetros**.

## Cómo probar

1. En Gerber, abre el módulo de diseño de patrones e importa el DXF
   (normalmente *Archivo → Importar → DXF*; el nombre del menú cambia según la versión).
2. Si Gerber pregunta por unidades, elige **centímetros**. Anota si lo preguntó o no.
3. Empieza por `falda-recta-talla-32.dxf` (la más simple) y sigue con las demás.
4. Llena la tabla de abajo y mándame el resultado, con capturas de pantalla si algo sale mal.

## Qué revisar en cada archivo

| # | Revisión | Cómo saber que está bien |
|---|---|---|
| 1 | ¿Abre sin error? | No sale mensaje de error ni se cierra el programa |
| 2 | **Tamaño** | Mide una pieza con la herramienta de medir de Gerber y compara con la tabla de abajo |
| 3 | Piezas cerradas | El contorno de cada pieza es una línea continua, sin huecos |
| 4 | Piquetes | Aparecen en los lugares marcados (cantidad en la tabla de abajo) |
| 5 | Hilo de tela | Cada pieza trae su flecha de hilo, vertical |
| 6 | Margen de costura | Hay una línea exterior paralela al contorno, a la distancia del margen de cada pieza (normalmente 1 cm, capa 15) |
| 7 | Textos | Se lee el nombre de la pieza y la cantidad; sin letras raras |
| 8 | Capas | Las capas llegan separadas (1 contorno, 4 piquetes, 5 hilo, 8 texto, 15 margen) |
| 9 | Pinzas | En falda recta, falda en A y blusa se ve la pinza como un corte en V |
| 10 | Archivo graduado | Se ven todas las tallas, una debajo de otra, y cada talla es más grande que la anterior |

## Medidas esperadas (ancho × alto en cm, talla base)

| Prenda | Pieza (cantidad) | Ancho × alto | Piquetes |
|---|---|---|---|
| Falda recta | Delantero (×2) | 25.5 × 60.0 | 1 |
| Falda recta | Espalda (×2) | 25.5 × 60.0 | 1 |
| Falda en A | Delantero (×1) | 65.2 × 55.8 | 4 |
| Falda en A | Espalda (×2) | 33.1 × 55.0 | 2 |
| Falda en A | Pretina (×1) | 84.0 × 6.0 | 0 |
| Blusa clásica | Delantero (×2) | 28.5 × 60.0 | 3 |
| Blusa clásica | Espalda (×1) | 55.0 × 60.0 | 6 |
| Blusa clásica | Manga (×2) | 32.7 × 54.0 | 3 |
| Blusa clásica | Cuello (×2) | 40.0 × 7.2 | 2 |
| Blusa clásica | Pie de cuello (×2) | 42.0 × 3.8 | 2 |
| Blusa clásica | Puño (×2) | 23.0 × 6.0 | 1 |
| Blusa clásica | Vista (×2) | 5.2 × 54.1 | 0 |
| Camisa de hombre | Delantero (×2) | 28.5 × 74.0 | 4 |
| Camisa de hombre | Espalda (×1) | 59.0 × 65.0 | 4 |
| Camisa de hombre | Manga (×2) | 36.5 × 57.5 | 3 |
| Camisa de hombre | Canesú (×2) | 46.0 × 9.0 | 4 |
| Camisa de hombre | Cuello (×2) | 43.0 × 7.2 | 2 |
| Camisa de hombre | Pie de cuello (×2) | 45.0 × 3.8 | 2 |
| Camisa de hombre | Puño (×2) | 25.0 × 6.5 | 0 |
| Camisa de hombre | Tapeta (×2) | 4.5 × 65.2 | 0 |
| Camisa de hombre | Bolsillo de pecho (×1) | 11.0 × 12.5 | 0 |
| Pantalón de vestir | Delantero (×2) | 28.0 × 104.0 | 2 |
| Pantalón de vestir | Espalda (×2) | 31.5 × 105.5 | 2 |
| Playera básica | Delantero (×2) | 24.0 × 66.6 | 2 |
| Playera básica | Espalda (×2) | 24.0 × 66.4 | 1 |
| Playera básica | Manga (×2) | 32.5 × 60.0 | 1 |

Las medidas son del contorno sin margen de costura. Una diferencia de décimas por el redondeo
es normal; una diferencia de 10× (o de 2.54×) significa que Gerber leyó mal las unidades.

## Resultado (se llena en Gerber)

Versión de Gerber: ______________________

| Archivo | Abre | Tamaño correcto | Cerradas | Piquetes | Hilo | Margen | Textos | Capas | Notas |
|---|---|---|---|---|---|---|---|---|---|
| falda-recta-talla-32 | | | | | | | | | |
| falda-recta-graduado | | | | | | | | | |
| falda-a-talla-M | | | | | | | | | |
| falda-a-graduado | | | | | | | | | |
| blusa-clasica-talla-M | | | | | | | | | |
| blusa-clasica-graduado | | | | | | | | | |
| camisa-hombre-talla-M | | | | | | | | | |
| camisa-hombre-graduado | | | | | | | | | |
| pantalon-vestir-talla-32 | | | | | | | | | |
| pantalon-vestir-graduado | | | | | | | | | |
| playera-basica-talla-32 | | | | | | | | | |
| playera-basica-graduado | | | | | | | | | |

## Lo que ya sé que puede fallar (para no sorprendernos)

- **Unidades.** El archivo es DXF versión R12, que no tiene un campo oficial de unidades. Hilonova
  escribe centímetros, pero Gerber puede asumir milímetros o pulgadas. Si las piezas salen 10 veces
  más chicas o 2.54 veces más grandes, es esto, y se corrige del lado de Hilonova.
- **Graduado.** El archivo graduado pone cada talla como piezas separadas, no como reglas de
  graduación (puntos con incrementos) de Gerber. Sirve para ver y comparar las tallas, pero en
  Gerber no quedará graduado de forma automática.
- **Formato AAMA completo.** Hilonova usa los números de capa de AAMA/ASTM (1, 4, 5, 8, 15), pero
  no incluye todos los datos que algunos Gerber piden (nombre de pieza y talla dentro del archivo).
  Si Gerber importa las piezas sin nombre o sin cantidad, es esto.

Lo que me mandes con esta tabla me dice exactamente qué ajustar en el exportador.
