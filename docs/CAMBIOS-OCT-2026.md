# Todo lo que se hizo (22 al 24 de octubre de 2026)

Resumen de punta a punta del trabajo de estos días: qué se construyó, qué se decidió, qué se descartó y qué falta. El detalle commit por commit (con *Qué / Por qué / Verificación / Archivos*) está en [`COMMITS.md`](./COMMITS.md); aquí van los hashes como referencia.

Dos repositorios, dos ramas locales de trabajo:

| Repositorio | Rama | Qué es |
|---|---|---|
| `hilonova-studio` | `dev/mvp-9-nov` | El programa (monorepo: motor, prendas, exportadores, app web) |
| `HiloNova-CAD` | `dev/conectar-con-studio` | La página de venta + el programa ya compilado dentro de `programa/` |

`hilonova-web` (sitio de formación, hilonovamx.com) **no se tocó**.

---

## 1. Estado en una mirada

| Parte | Estado | Cómo se sabe |
|---|---|---|
| Patronaje 2D (12 herramientas), 17 prendas base con pinzas | Hecho | 667 pruebas automáticas + revisión contra fotos de referencia |
| Graduación automática y manual (S–XL, XS–XXL, 28–36) | Hecho | Pruebas + revisión en pantalla |
| Trazo con consumo por talla y % de aprovechamiento | Hecho | Pruebas |
| Producción: ficha técnica, variantes, reportes, exportar PDF/SVG/DXF | Hecho; **DXF sin probar en Gerber** | Pruebas; falta prueba real |
| PDF para pegar el molde y PDF de ficha técnica | Hecho | PDFs reales generados y revisados página por página |
| Cuentas reales (correo/contraseña y Google) con Firebase | Hecho | Registro real probado por el negocio; correo de verificación recibido |
| Guardado de patrones en la nube (Firestore) | Hecho en código y probado con nube de mentira | **Falta probarlo con Firestore real** |
| Términos de uso y aviso de privacidad | Hecho | Revisados en pantalla; **sin revisión de abogado** |
| Cobro con Stripe (enlace de pago + acceso a mano) | Programado, **apagado** (`enabled:false`) | Pruebas de la regla de acceso; **falta crear el enlace de pago** |
| Vista 3D | **Descartada** (se quitó a petición del usuario) | — |
| Validación del maestro costurero, prueba en Gerber | **Pendientes** (dependen de otras personas) | — |

---

## 2. Cronología por áreas

### 2.1 Motor y prendas (22 oct)
- Motor de geometría, edición, selección múltiple, copiar/pegar, rotar, texto pegado a la pieza, pinzas (`b413bea`, `d5f88aa`, `f4bc422`, `bb74b94`).
- 17 prendas base paramétricas (`bc7d31c`, `572d59f`, `4cc3837`) con pinzas puestas (`aa74a43`) y ajustadas a las fotos de referencia (`755c456`, `c1ca4ae`, `6002329`).
- Correcciones de patronaje: margen de costura siempre hacia afuera (`872e0d1`, `c5b1f3d`), entrepierna y bajo del pantalón (`23ee69a`), cuello de la chamarra y capucha (`c42c359`), playera con manga corta (`b211d45`), ruedo de la blusa (`d993f5c`) y que las pinzas no le quiten medida a la cintura (`d22b20e`).
- Graduación por reglas de nodo y tallaje editable (`a0b5166`, `1648caf`); trazo por contorno real con consumo y costo (`455c90b`); verificación de costuras y mangas que encajan en la sisa (`27358db`).
- DXF graduado, con hilo con ángulo, líneas internas y compatible con R12 (`cb71565`, `872e0d1`, `c1ca4ae`); exportar el trazo a DXF/PDF 1:1/SVG (`4540990`).
- Menú lateral completo: Proyectos, Materiales, Librería, Reportes, Configuración, Producción (`0feb0e3`).
- **Pruebas automáticas**: de 0 a 667 (`97e4557`, `bdff913` y siguientes), incluida una auditoría de los 17 patrones (`audit-patrones.test.ts`).

### 2.2 Experimentos descartados
- **Vista 3D**: se construyó (`9b5f94b`), no tuvo la calidad pedida y se **quitó a petición del usuario** (`2f3cc2a`). Sigue pendiente decidir si se rehace.

### 2.3 Confiabilidad y ayuda (22–23 oct)
- Guardado automático, aviso si el navegador no deja guardar y recordatorio de respaldo (`859f121`).
- Ayuda dentro de la app, guía del lienzo vacío y arreglo del patrón en blanco (`030a4b7`); la guía ahora se puede cerrar y se acuerda (`e152827`).
- Fotos de las 17 prendas en la galería (`fdb3157`, `13553e0`).

### 2.4 Plan y precio (23 oct)
Evolución de la decisión: planes Aprendiz/Taller/Equipo (`527f899`) → plan único con código de alumnos (`e85abdb`, `f956850`) → **plan único «Completo» a $490 al mes** organizado por los cuatro módulos y para un usuario (`5d6da5b`). Documentos: `PROPUESTA-PLANES.md`, `PREGUNTAS-PARA-EL-JEFE.md`.

### 2.5 Páginas y conexión (23 oct)
- Análisis de las tres piezas y su conexión: `MAPA-DE-PAGINAS.md` (`b4d3465`).
- Página de CAD reescrita con textos honestos y capturas reales; `app.html` ahora redirige al programa; el programa se compila dentro de `programa/` con `scripts/publicar-en-cad.mjs` (`a42a63c` en CAD, `a9a405d` en el programa). Se quitaron los testimonios inventados.
- Correcciones posteriores: soporte por WhatsApp (no existía correo), «12 herramientas», acceso de alumnos sin cifras ni «descuento» (`3532b43`, `4b4a52b`), una sola tarjeta de precio y letrero al día (`b74c4de`).
- Portada propia del programa sin frases falsas («−12 % de merma», «28–44», «DXF-AAMA nativo», Gerber/Lectra/HPGL, testimonio, enlaces muertos) (`b769471`).
- Panel «Tus patrones» sin «Precios», sin «Plan Completo» ni «Asientos del plan»; se eliminó `/pricing` (`b3540f0`, `00ec042` en CAD).

### 2.6 PDFs (23 oct, `9d0ca5b`)
- **Mosaico A4**: el pantalón bajó de **150 a 31 hojas** (48 MB → 0.4 MB): ya no reparte las piezas dos veces ni imprime hojas en blanco; trae hoja de instrucciones con cuadro de 10 cm y mapa de hojas.
- **Ficha técnica**: imprime todos los datos del formulario, todas las piezas (4 por hoja), sin referencia al azar ni materiales de un jean que nadie pidió; la vista previa ya no se sale de la hoja.

### 2.7 Cuentas reales (23 oct)
- Firebase Authentication: correo/contraseña (mínimo 8), Google, recuperar contraseña, correo de verificación en español (`db2b9d9`, `5fbba86`, `7769f5b`). Se quitaron los botones falsos de Google/Apple; **Apple queda fuera** (pide cuenta de desarrollador de pago).
- El negocio creó el proyecto `hilonova-studio` (plan gratis Spark), activó los accesos y Firestore, y publicó las reglas. Pasos: `FIREBASE-PASOS.md`.
- Modo de prueba de respaldo: si no hay configuración, la cuenta vive solo en el navegador y la pantalla lo dice.
- Probado por el negocio: registro, correo de verificación recibido, perfil guardado en Firestore, ventana de Google.

### 2.8 Guardado en la nube (23 oct, `c8d6930`)
Cada patrón se guarda en el navegador y en `users/{uid}/patterns/{id}`; cola de cambios que sube a los 20 s, al cerrar sesión y al salir; mezcla por fecha al entrar; sin internet todo sigue; los patrones de una cuenta nunca se suben a otra (copia apartada). 20 pruebas con una nube de mentira (se rompieron reglas a propósito para comprobar que fallaran). Materiales, «Mis piezas» y preferencias **siguen solo en el navegador**.

### 2.9 Legal (23 oct)
`/terminos` y `/privacidad` enlazados desde el registro (`af4e715`, `e1fa21a`). Por decisión del negocio **no llevan razón social, domicilio ni correo**; el aviso dice que HiloNova es el responsable y que se le escribe por los medios que publica. Sin revisión legal.

### 2.10 Cobro (23 oct)
Camino recorrido y por qué se cambió:
1. Se pensó en la extensión «Run Payments with Stripe» de Firebase → **descartada**: su repositorio se archivó en junio de 2026 y Firebase anuncia el cierre de extensiones.
2. Se escribieron funciones propias en la nube (`dbb8955`) → **retiradas**: requerían el plan Blaze y el negocio no lo quiere. El código sigue en el historial de git.
3. **Decisión final (`b769471`)**: enlace de pago de Stripe + acceso dado **a mano** con un documento `access/{uid}` en Firestore. Interruptor `enabled:false` en `apps/web/app/lib/billing-config.ts`: **mientras esté apagado, todos entran gratis**.
- Cuenta de Stripe: la de Bioorigen (se advirtió que mostrará «Bioorigen» y su mensaje de CO₂ a los clientes; se sugirió una cuenta nueva).
- IVA: el negocio dejó el precio **con IVA incluido** en Stripe; **los textos del programa todavía dicen «más IVA»** (pendiente de confirmar y cambiar).
- Sin límite de exportaciones. Alumnos: acceso a mano por 30 días, sin tarjeta, sin anunciarlo en páginas públicas.
- Pasos: `COBRO-PASOS.md`.

### 2.11 Seguridad
- Next.js 15.1.6 → **15.1.12** (la anterior tenía una vulnerabilidad conocida, CVE-2025-66478).
- Sin llaves secretas en el código; solo la configuración **pública** de Firebase (`firebase-config.ts`), hecha para eso. Las reglas de Firestore limitan cada cuenta a sus propios datos (`firebase/firestore.rules`).

---

## 3. Decisiones tomadas (resumen)

| Tema | Decisión |
|---|---|
| Nombre/páginas de trabajo | Se trabaja con la página de CAD + HiloNova Studio; `hilonova-web` queda aparte |
| Plan | Uno solo, «Completo», $490 MXN/mes, 1 usuario |
| Registro | Primero la cuenta, después el pago |
| Backend | Firebase (Auth + Firestore), plan gratis Spark; **sin Blaze** |
| Pago | Enlace de pago de Stripe + activación manual del acceso |
| Alumnos | 1 mes de acceso a mano, sin tarjeta, no se anuncia |
| Exportaciones | Sin límite |
| Vista 3D | Descartada por ahora |
| Apple | Fuera |
| Datos legales de la empresa | No se incluyen |
| Publicar | **Nada se publica** hasta que el negocio lo decida; solo se suben ramas |

## 4. Lo que falta

**Del negocio:** crear el enlace de pago en Stripe (modo de prueba primero) y mandar las direcciones; probar el guardado en la nube con dos navegadores; responder `PREGUNTAS-PARA-EL-JEFE.md` (dominio, nombre del producto, quién atiende el WhatsApp, factura/IVA); definir si se usa una cuenta de Stripe nueva.

**De otras personas:** que el maestro costurero valide los moldes (`ANALISIS-CUMPLIMIENTO.md`, sección 5); instalar Gerber y probar los DXF (`prueba-gerber/`).

**Del programa:** cambiar los textos de precio a «IVA incluido» (si se confirma); sincronizar materiales y «Mis piezas» en la nube; pruebas en otros navegadores y tableta (solo se ha probado en Chrome de escritorio); decidir si se rehace la vista 3D; botón «Software» en `hilonova-web`.

**Para publicar:** elegir dirección (dominio propio o carpeta de GitHub Pages; el programa compilado usa la ruta `/programa`), agregar el dominio a los dominios autorizados de Firebase Authentication y a las páginas de pago, y regenerar `programa/` con `node scripts/publicar-en-cad.mjs`.

## 5. Cómo se trabaja y se comprueba

```bash
pnpm install
pnpm dev                       # http://localhost:4321
pnpm test                      # 667 pruebas (Vitest)
cd apps/web && pnpm exec tsc --noEmit
node scripts/commit-log.mjs    # regenera docs/COMMITS.md (se hace en cada commit)
node scripts/publicar-en-cad.mjs   # compila el programa dentro de ../HiloNova-CAD/programa
```

Notas útiles:
- `publicar-en-cad.mjs` y `pnpm dev` comparten la carpeta `.next`: detener el servidor de desarrollo antes y reiniciarlo después.
- Para probar cuentas sin tocar el Firebase real: `firebase emulators:start --only auth --project demo-hilonova` (no necesita Java) y un segundo servidor con `NEXT_DIST_DIR=.next-test NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR=http://127.0.0.1:9099 pnpm exec next dev -p 4322`. El emulador de Firestore sí necesita Java (no instalado).
- Reglas de trabajo: cada commit documentado (*Qué / Por qué / Verificación / Archivos*) y bitácora regenerada; nada se publica sin que el negocio lo pida.
