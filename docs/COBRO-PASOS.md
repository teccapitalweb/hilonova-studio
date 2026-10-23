# Cobro con Stripe: cómo funciona y pasos para encenderlo

Fecha: 23 de octubre de 2026. El código está hecho y probado con pruebas; falta publicarlo y probarlo con Stripe. Nada está publicado.

## Decisiones tomadas (23 de octubre)

- **Cuenta de Stripe:** la de Bioorigen. Los cobros de HiloNova aparecerán mezclados con los de ese negocio en su panel; el producto se llamará «HiloNova Studio».
- **Precio:** $490 MXN al mes, más IVA, un solo plan para una persona.
- **Orden:** primero la cuenta y después el pago (la persona se registra, entra y ve «Activa tu plan»).
- **Sin límite de exportaciones.** Se quitó la idea de las 3 exportaciones: no se puede hacer cumplir de forma segura en un programa que corre en el navegador.
- **Cupón de alumnos:** será un **código de promoción de Stripe** (el primer mes gratis, un solo uso, con fecha de vencimiento). Se escribe en la pantalla de pago de Stripe. Se crea desde el panel de Stripe, sin tocar el programa.
- **Por qué no se usó la extensión «Run Payments with Stripe» de Firebase:** su repositorio se archivó en junio de 2026 y Firebase anuncia el cierre de las extensiones. Se escribieron funciones propias (`firebase/functions/`).

## Cómo funciona

1. La persona se registra y entra. Si el cobro está encendido y no tiene plan, ve «Activa tu plan» con el botón «Pagar con tarjeta».
2. El botón llama a la función `crearPago`, que crea la pantalla de pago de Stripe (con campo para código de promoción) y manda a la persona allí.
3. Al pagar, Stripe avisa a la función `webhookStripe` (aviso firmado: se rechaza si la firma no es válida). La función guarda el estado en Firestore: `customers/{uid}/subscription/current`.
4. El programa lee ese documento en tiempo real: con estado `active`, `trialing` o `past_due` deja entrar. `past_due` (pago fallido) conserva el acceso mientras Stripe reintenta el cobro; si no se logra, Stripe cancela y el acceso termina.
5. En «Cuenta → Facturación» hay un botón «Administrar suscripción» (función `portalDePago`): cambiar tarjeta, ver recibos y cancelar.
6. **Acceso a mano:** un documento `access/{uid}` en Firestore da acceso sin pago (ventas por WhatsApp, cortesías, pruebas). Campos: `until` (fecha ISO, opcional; sin fecha no vence) y `note`.

Si no hay conexión, se confía en la última comprobación por 7 días.

**Límite honesto:** el programa corre en el navegador, así que la puerta de «Activa tu plan» frena al usuario común, no a un programador que modifique el código. Lo que sí está protegido en servidor es el cobro mismo y los datos de cada cuenta.

## El interruptor

`apps/web/app/lib/billing-config.ts` tiene `enabled: false`. **Mientras esté en false, todas las cuentas entran gratis, como hoy.** Se pone en true solo cuando el cobro ya funciona de punta a punta en modo de prueba; si se enciende antes, nadie podría entrar. (Lo cambia quien programa, después de la prueba.)

## Pasos que haces tú

### A. Plan Blaze de Firebase
Las funciones en la nube lo requieren. Es de pago por uso y pide tarjeta; con pocos usuarios casi no se paga.
1. En la consola de Firebase, abajo a la izquierda pulsa **Actualizar** (dice «Spark»).
2. Elige **Blaze** y agrega una cuenta de facturación de Google Cloud con tarjeta.
3. Pon una **alerta de presupuesto** (por ejemplo $5 USD) para enterarte si algo se dispara.

### B. Stripe (usa primero el **modo de prueba**)
En el panel de Stripe de Bioorigen, activa el **modo de prueba** (interruptor arriba). Los objetos de prueba y los reales son distintos: todo esto se repite después en modo real.
1. **Producto y precio:** Catálogo de productos → Crear producto. Nombre `HiloNova Studio`, precio **recurrente**, **490.00 MXN**, mensual. Copia el **identificador del precio** (empieza con `price_`).
2. **IVA (si el precio va «más IVA»):** Configuración → Impuestos → Tasas de impuestos → Crear. Nombre `IVA`, porcentaje `16`, **exclusivo**. Copia su identificador (empieza con `txr_`). Confirma con el contador si así se factura; si el precio ya incluyera IVA, no se crea.
3. **Portal de clientes:** Configuración → Facturación → Portal de clientes. Actívalo y permite: actualizar el método de pago, ver el historial de facturas y **cancelar suscripciones**.
4. **Cupón de alumnos:** Catálogo de productos → Cupones → Crear cupón: **100 % de descuento**, duración **una vez**. Luego, dentro del cupón, **Códigos de promoción** → Crear: el código (por ejemplo `ALUMNO-7K2P`), **límite de 1 canje** y **fecha de vencimiento** (24 horas después de entregarlo). Un código por alumno.
   - Ojo: Stripe pide tarjeta aunque el primer mes salga en $0, y **al terminar el mes cobra $490 automáticamente** si la persona no cancela. Hay que avisárselo a los alumnos.
5. **Llave de API restringida:** Desarrolladores → Claves de API → Crear clave restringida. Permisos de **escritura** en *Customers*, *Checkout Sessions* y *Customer portal*, y nada más. Copia la clave (empieza con `rk_test_`; Stripe la muestra una sola vez). **No la pegues en ningún chat ni archivo del proyecto**: solo en el paso C.

### C. Publicar las funciones (en la terminal de tu computadora)
Hace falta Node.js (ya lo tienes). Una sola vez: `npm install -g firebase-tools` y `firebase login` (abre el navegador; entra con la cuenta de Google del negocio).

Después, desde la carpeta `hilonova-studio\firebase`:

1. Copia `functions\.env.example` como `functions\.env` y pon tu `STRIPE_PRICE_ID` (y `STRIPE_TAX_RATE_ID` si aplica). Ese archivo no se sube a git.
2. Guarda la llave de Stripe como secreto (te la pide en pantalla, no queda escrita en ningún archivo):
   `firebase functions:secrets:set STRIPE_SECRET_KEY --project hilonova-studio`
3. Guarda un valor provisional para la firma del webhook:
   `firebase functions:secrets:set STRIPE_WEBHOOK_SECRET --project hilonova-studio` (escribe `whsec_pendiente`).
4. Publica: `firebase deploy --only functions,firestore:rules --project hilonova-studio`. Al terminar imprime la dirección de `webhookStripe`.
5. En Stripe: Desarrolladores → Webhooks → Agregar endpoint. Pega esa dirección y elige estos eventos: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`. Copia el **secreto de firma** (`whsec_…`).
6. Guárdalo de verdad: repite el paso 3 con ese valor y vuelve a publicar (paso 4).

### D. Probar en modo de prueba
1. Quien programa pone `enabled: true` en `billing-config.ts` (solo en local).
2. Entra con una cuenta; debe aparecer «Activa tu plan». Pulsa «Pagar con tarjeta».
3. En Stripe usa la tarjeta de prueba `4242 4242 4242 4242`, cualquier fecha futura y cualquier CVC.
4. Al volver, en unos segundos debe entrar al programa. En Firestore debe existir `customers/{uid}/subscription/current` con `status: active`.
5. En «Cuenta → Facturación» debe decir «Activa», y «Administrar suscripción» debe abrir el portal.
6. Prueba también un código de promoción y cancelar desde el portal (el acceso debe terminar).

### E. Pasar a cobros reales
Repite el paso B con el **modo real** de Stripe (producto, IVA, portal, cupones, llave y webhook), cambia los secretos y el `.env` a los valores reales y vuelve a publicar. Agrega el dominio final a `ALLOWED_ORIGINS` y a los dominios autorizados de Firebase Authentication.

## Dar acceso a mano (ventas por WhatsApp, cortesías)
1. Firebase → Authentication → Usuarios: copia el **UID** de la persona.
2. Firestore → Datos → colección `access` → Agregar documento con ese UID como ID.
3. Campos opcionales: `until` (texto con fecha, por ejemplo `2026-12-31T23:59:59.000Z`) y `note` (para acordarte por qué).
4. Para quitarlo, borra el documento.

## Costos
- **Firebase Blaze:** pago por uso; con pocos usuarios, centavos al mes.
- **Stripe:** una comisión por cada cobro (consulta su tabla de precios para México en stripe.com/mx/pricing).
