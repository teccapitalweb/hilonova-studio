# Mapa de las tres piezas de HiloNova y cómo conectarlas

Fecha: 23 de octubre de 2026. Todo local; nada de esto está publicado por mí.

## 1. Qué es cada pieza

| | **Sitio de formación** | **Página de HiloNova CAD** | **HiloNova Studio (el programa)** |
|---|---|---|---|
| Carpeta | `hilonova-web` | `HiloNova-CAD` | `hilonova-studio` |
| Dirección | **hilonovamx.com** (ya está en línea, con dominio propio) | Ninguna: no está publicada con dominio | Ninguna: solo corre en mi computadora |
| Qué es | La página de la consultora: capacitación para la industria textil, programas, cursos con temario en PDF y formación para empresas | Una página de venta del software "HiloNova CAD": módulos, flujo, exportación, precio, preguntas | El programa real: editor de patrones, graduación, trazo, producción, planes, ayuda |
| Para quién | Supervisores, talleres, emprendedores que quieren capacitarse | Quien quiere comprar el software | El patronista o alumno que lo usa |
| Estado | Completa y publicada | Solo la página de venta; **el programa que enseña no existe en esa carpeta** | Funciona (577 pruebas), sin cobro ni cuentas reales |

**Detalle importante de HiloNova-CAD:** su `app.html` llama a archivos (`assets/css/app.css` y `assets/js/app/main.js`) que **no están en la carpeta**. Es una cáscara vacía: si alguien da clic en "Probar gratis" no hay programa. Es el primer intento del software, antes de HiloNova Studio.

## 2. Cómo se conectan hoy

**No se conectan.** El sitio de formación no menciona el software. La página de CAD solo enlaza a su propia `app.html` vacía. El programa no enlaza a ninguna de las dos.

## 3. Lo que la página de CAD dice y no coincide

La página de CAD tiene otra historia comercial y promete cosas que el programa real no tiene:

| La página de CAD dice | Realidad |
|---|---|
| Licencia de **pago único** | Lo decidido hoy es **suscripción mensual de $490** |
| El precio aparece como "$ —" | Sin precio definido |
| "Probar gratis": modo demo sin límite, con exportación y nube bloqueadas hasta comprar | El programa no tiene modo demo con candados; el cupón de alumnos es otra cosa (1 mes y 3 exportaciones) |
| "Tus proyectos se guardan en la nube con tu cuenta" | Hoy se guardan solo en el navegador; no hay nube |
| "Funciona en Chrome, Edge o Safari, en computadora o tablet" | Solo probado en Chrome de escritorio |
| Bases: "blusa, falda recta y pantalón base" | Hay 17 prendas |
| "Margen de costura por tramo" | El margen es uno solo por pieza |
| "Acomodo automático que prueba cientos de combinaciones" y "sentido de tela, orilla y encogimiento" | El trazo es un acomodo rápido; no considera encogimiento ni rayas |
| "Costo por prenda con tela, avíos y minutos de confección, y planeación de lote" | El reporte da consumo y costo de tela por talla; no hay avíos, minutos ni planeación de lote |
| "Pago con tarjeta por Stripe; la licencia se activa al confirmar" | No hay Stripe conectado |
| "Tu inscripción incluye un código de acceso" | Coincide con la idea del cupón, pero el cupón aún no existe |

**Conclusión:** esa página no se debe publicar como está. Sirve como base de ideas (y la parte del código para alumnos coincide con la decisión), pero hay que reescribirla con lo que el programa sí hace.

## 4. Propuesta: cómo debería quedar conectado

La idea: **una sola puerta de entrada y un solo camino.**

```
hilonovamx.com  (formación, ya publicada)
   │  agrega una sección y botón "Software HiloNova"
   ▼
Página del software  (precio, qué incluye, cupón de alumnos)
   │  "Crear cuenta" / "Entrar"
   ▼
El programa  (HiloNova Studio)
   ▲
   │  el alumno recibe su cupón al terminar el curso
Curso de Patronaje Digital
```

**Qué se hace en cada carpeta:**

1. **`hilonova-web` (sitio de formación):** agregar un botón "Software" en el menú y una sección que explique el programa y lleve a su página. En la sección del curso de patronaje, un aviso: "al terminar recibes un cupón de un mes para usar HiloNova". Hoy el sitio no dice nada del software.
2. **`HiloNova-CAD` (página de venta antigua):** **retirarla** o dejarla como borrador. Su lugar lo toma la página principal de HiloNova Studio, que ya trae el plan honesto de $490 y el cupón. Así no hay dos páginas de venta que se contradigan.
3. **`hilonova-studio` (el programa):** su página principal y la de planes pasan a ser "la página del software". Falta corregir en ella las frases que no son ciertas ("28–44 tallas", "DXF-AAMA nativo", "−12 % de merma", el testimonio de muestra) antes de enlazarla desde el sitio de formación.

**Dónde vive cada cosa (para decidir):**
- Sitio de formación: `hilonovamx.com` (ya existe).
- Página del software: una dirección como `software.hilonovamx.com` o `hilonovamx.com/software`.
- El programa: la misma dirección del software, o `app.hilonovamx.com`.
Esto requiere acceso al dominio (DNS) y es una decisión de quien lo administre.

**El camino del alumno:** termina el curso → recibe su cupón (un solo uso, se canjea en 24 horas) → abre la página del software → crea su cuenta → canjea el cupón → 1 mes completo con 3 exportaciones → paga si quiere seguir. Esto último necesita cuentas y cobro, que dependen del jefe.

## 5. Decisiones que hacen falta

1. **El nombre del producto:** ¿"HiloNova CAD" (la página antigua) o "HiloNova Studio" (el programa)? Hay que usar uno solo en todas partes.
2. **¿Cuál es la página oficial del software?** Mi recomendación: la de HiloNova Studio, y retirar la de CAD.
3. **¿Quién controla el dominio hilonovamx.com** y puede crear `software.hilonovamx.com`?
4. **Modelo de venta:** la página antigua dice pago único; lo decidido es suscripción mensual de $490. ¿Se mantiene la suscripción?
5. **El cupón de alumnos:** ¿lo entrega el curso al terminar? ¿Se menciona en el sitio de formación? (Ya está en `PREGUNTAS-PARA-EL-JEFE.md`.)
6. **¿Cuándo se publica?** Nada se ha subido; antes hay que corregir las frases falsas de la página principal y confirmar el modelo de venta.

## 6. Orden de trabajo sugerido

1. Corregir las frases falsas de la página principal de HiloNova Studio (se puede hacer ya, es solo texto).
2. Decidir nombre y página oficial (la decisión es del jefe).
3. Preparar en `hilonova-web` el botón y la sección "Software" (queda lista pero **sin publicar** hasta que haya a dónde enlazar).
4. Con las respuestas del jefe: cuentas, cobro con Stripe y cupón de alumnos.
5. Probar el DXF en Gerber y la validación del maestro; después, publicar.

## 7. Lo que ya se conectó (23 de octubre, solo en local)

Se decidió trabajar con **HiloNova CAD** (la página de venta) y **HiloNova Studio** (el programa). Quedaron conectados así:

- **Carpeta `HiloNova-CAD`, rama local `dev/conectar-con-studio`** (no subida):
  - `index.html` es una página nueva que funciona sola, con el plan único y el cupón de alumnos, y con capturas reales del programa.
  - `app.html` redirige al programa.
  - `programa/` es el programa compilado (sitio estático); se llega desde los botones "Entrar", "Crear cuenta" y "Ver el plan y el cupón".
- **Carpeta `hilonova-studio`:** el script `scripts/publicar-en-cad.mjs` compila el programa con la ruta `/programa` y lo copia a `HiloNova-CAD/programa`. Se quitaron los testimonios inventados de las pantallas de entrar y crear cuenta.
- **No se tocó `hilonova-web`** (el sitio de formación); ahí falta agregar el botón "Software".

**Cómo verlo en local:** con el servidor de la carpeta de CAD abierto (`python -m http.server 8099 --directory C:\dev\hilonova\HiloNova-CAD`), abrir `http://localhost:8099/`. Abrir los archivos con doble clic no funciona (los enlaces y las rutas necesitan un servidor).

**Para publicarlo hay que decidir la dirección:** con un dominio propio (por ejemplo `software.hilonovamx.com`) basta la ruta `/programa` y se publica la carpeta `HiloNova-CAD` tal cual. Si se publica en una carpeta (por ejemplo `usuario.github.io/HiloNova-CAD/`), se vuelve a generar con `node scripts/publicar-en-cad.mjs "" /HiloNova-CAD/programa`.

**Pendiente antes de publicar:** la portada propia del programa (la de `hilonova-studio`) sigue con frases que no son ciertas, pero ya no se publica dentro de CAD (su lugar lo toma la página de CAD). Los botones "Continuar con Google" y "Continuar con Apple" de entrar y crear cuenta no son reales: crean una cuenta de mentira con un nombre inventado. Hay que quitarlos o conectarlos de verdad cuando existan las cuentas.
