# Cobro: cómo funciona y pasos para encenderlo

Fecha: 23 de octubre de 2026. Sin servidor propio y **sin plan Blaze de Firebase**. Nada está publicado.

## Decisiones tomadas

- **Cuenta de Stripe:** la de Bioorigen. Los cobros de HiloNova aparecerán mezclados con los de ese negocio; el producto se llamará «HiloNova Studio».
- **Precio:** $490 MXN al mes, más IVA, un solo plan para una persona.
- **Orden:** primero la cuenta y después el pago.
- **Sin Blaze, sin funciones en la nube.** El pago se hace en un **enlace de pago de Stripe** y el acceso lo da el negocio **a mano**. Es lo más sencillo para empezar con pocos clientes. Si algún día hay muchos, se puede automatizar (eso sí requeriría Blaze); el código de esa versión automática quedó guardado en el historial de git (commit `dbb8955`).
- **Sin límite de exportaciones.**
- **Alumnos:** el negocio les da el acceso a mano por un mes, sin tarjeta y sin cobro (ver abajo). No se anuncia en las páginas públicas.

## Cómo funciona

1. La persona se registra y entra. Con el cobro encendido y sin acceso, ve **«Activa tu plan»** ($490 al mes) y el botón **«Pagar con tarjeta»**, que la lleva al enlace de pago de Stripe con su correo y su identificador de cuenta ya puestos.
2. Paga. Stripe regresa a la persona a `…/app/?pago=ok` («Gracias por tu pago, estamos activando tu cuenta») y **te avisa por correo**.
3. **Tú le das acceso** (2 minutos): ver «Dar acceso» más abajo. En cuanto lo haces, la pantalla de la persona se actualiza sola y entra al programa.
4. Hay un botón **«¿Ya pagaste o ya te dieron un acceso? Avísanos por WhatsApp»** (236 120 7101) para que la persona te escriba.
5. En «Cuenta → Facturación» aparece el estado y, si pones el enlace del portal de Stripe, el botón «Administrar suscripción» (cambiar tarjeta, ver recibos y cancelar).

**Límite honesto:** el programa corre en el navegador, así que la puerta de «Activa tu plan» frena al usuario común, no a un programador que modifique el código. Y como el acceso es a mano, **no es instantáneo**: hay un tiempo de espera hasta que lo activas.

## El interruptor

`apps/web/app/lib/billing-config.ts` tiene `enabled: false`. **Mientras esté en false, todas las cuentas entran gratis, como hoy.** Se enciende (junto con los enlaces `paymentLink` y `portalLink`) solo después de probar el pago en modo de prueba; si se enciende antes, nadie podría entrar.

## Pasos que haces tú (en el panel de Stripe, primero en **modo de prueba**)

Los objetos de prueba y los reales son distintos: todo esto se repite después en modo real.

1. **Producto y precio:** Catálogo de productos → Crear producto. Nombre `HiloNova Studio`, precio **recurrente**, **490.00 MXN**, mensual.
2. **Enlace de pago:** Enlaces de pago → Crear enlace. Elige ese producto y configura:
   - **Permitir códigos de promoción:** activado.
   - **Después del pago → Mostrar una página de confirmación propia** (redirigir) a `http://localhost:4321/app/?pago=ok` para la prueba; en producción, la dirección final del programa.
   - **IVA:** si el precio va «más IVA», agrega la tasa del 16 % (o activa el cobro automático de impuestos si tu cuenta lo permite). Si Stripe no te deja, el precio tendría que ser $568.40 con IVA incluido. Confirma con el contador cómo se factura.
3. **Portal de clientes (opcional pero recomendado):** Configuración → Facturación → Portal de clientes. Actívalo, permite actualizar el método de pago y **cancelar suscripciones**, y activa el **enlace para iniciar sesión** del portal.
4. **Mándame dos direcciones** (no son secretas): la del enlace de pago (`https://buy.stripe.com/…`) y la del portal (`https://billing.stripe.com/p/login/…`). Yo las pongo en `billing-config.ts`, enciendo el interruptor y probamos juntos con la tarjeta de prueba `4242 4242 4242 4242`.
5. Cuando la prueba salga bien, repite los pasos 1 a 3 en **modo real** y avísame para cambiar las direcciones.

## Dar acceso (cuando llega un pago, a un alumno o a una cortesía)

1. **Cómo saber quién es:** en Stripe, abre el pago (Pagos → el pago): en los detalles aparece el **correo** y el campo **`client_reference_id`**, que es el identificador de la cuenta. También puedes buscar el correo en Firebase → Authentication → Usuarios y copiar su **UID**.
2. En Firebase → Firestore Database → Datos → colección **`access`** → Agregar documento. **ID del documento = el UID** de la persona.
3. Campos (opcionales): `until` (texto con fecha, por ejemplo `2026-12-31T23:59:59.000Z`) y `note` (para acordarte por qué). Un documento vacío da acceso sin fecha de vencimiento.
4. **Alumnos:** pon `until` a 30 días desde hoy. Al vencer ven «Activa tu plan» y pueden pagar.
5. **Clientes de pago mensual:** deja sin `until`. **Cuando cancelen o no paguen** (Stripe te avisa por correo y lo ves en Pagos → Suscripciones), **borra su documento** de `access`.
6. Si prefieres no acordarte de cancelaciones, pon `until` = fin del periodo pagado + 3 días y renuévalo cada mes cuando llegue el pago.

## Costos

- **Firebase:** el plan gratis (Spark) alcanza.
- **Stripe:** una comisión por cada cobro (consulta su tabla de precios para México en stripe.com/mx/pricing).
