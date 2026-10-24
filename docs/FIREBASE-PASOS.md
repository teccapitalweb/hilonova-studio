# Cuentas reales con Firebase: pasos y estado

Fecha: 23 de octubre de 2026. Todo local; nada está publicado.

## Estado

**Proyecto creado el 23 de octubre de 2026:** `hilonova-studio` (plan Spark, gratis) en la cuenta de Google del negocio. Ya están activados el acceso con correo/contraseña y con Google, y creada la base de datos Firestore (ubicación en Estados Unidos). Su configuración pública está en `apps/web/app/lib/firebase-config.ts`. Falta probar el registro con una cuenta real y confirmar que las reglas de `firebase/firestore.rules` estén publicadas.

| Parte | Estado |
|---|---|
| Crear cuenta con correo y contraseña | Hecho y probado contra el emulador local de Firebase |
| Entrar, salir, contraseña equivocada, sesión que sigue al recargar | Hecho y probado contra el emulador |
| «Continuar con Google» | Hecho en el código; falta probarlo con un proyecto real (el emulador no abre la ventana de Google) |
| «Olvidé mi contraseña» | Hecho en el código; falta probarlo con un proyecto real (el correo solo sale en uno real) |
| Correo de verificación | Se envía al crear la cuenta; hoy no se exige para usar el programa |
| Perfil (nombre y taller) en Firestore | Hecho en el código y con reglas de seguridad; falta probarlo con un proyecto real (no hay Java para el emulador de Firestore) |
| Guardar los patrones en la nube | **Hecho en el código** y probado con una nube de mentira (20 pruebas); falta probarlo con Firestore real y **volver a publicar las reglas** de `firebase/firestore.rules` (ahora incluyen `users/{uid}/patterns`) |
| Cupón de alumnos, límite de 3 exportaciones, cobro | **No hecho** (pasos 4 y 5) |
| Botón «Continuar con Apple» | Quitado: pide cuenta de desarrollador de Apple (unos $99 USD al año) |

Mientras `apps/web/app/lib/firebase-config.ts` esté vacío, el programa funciona en **modo de prueba**: la cuenta vive solo en el navegador y la pantalla de registro lo dice. Con la configuración puesta, las cuentas son reales.

## Lo que hace quien administra el negocio

1. Entra a **console.firebase.google.com** con la cuenta de Google del negocio.
2. **Agregar proyecto**. Nombre sugerido: `hilonova-studio`. Google Analytics se puede dejar apagado.
3. **Compilación → Authentication → Comenzar → Método de acceso**. Activa:
   - **Correo electrónico/contraseña** (solo esa casilla, sin «vínculo por correo»).
   - **Google**. Pide un correo de asistencia: el del negocio.
4. **Compilación → Firestore Database → Crear base de datos**. Elige la ubicación más cercana (por ejemplo `us-central` o `nam5`) y modo **producción**.
5. En Firestore, pestaña **Reglas**, borra lo que haya, pega el contenido de `firebase/firestore.rules` y pulsa **Publicar**.
6. **Configuración del proyecto (la rueda) → General → Tus apps → icono Web (`</>`)**. Ponle un nombre (`hilonova-web`), no actives Hosting, y registra la app. Copia el bloque `firebaseConfig`.
7. Pega esos valores en `apps/web/app/lib/firebase-config.ts` (o mándalos y se pegan por ti). No son contraseñas.
8. **Authentication → Configuración → Dominios autorizados**: `localhost` ya está. Antes de publicar hay que agregar el dominio final.
9. **Authentication → Plantillas**: en cada plantilla, el lápiz y el idioma **Español**, para que los correos de verificación y de cambio de contraseña lleguen en español.

## Cómo probarlo con el proyecto real

1. Con el programa corriendo (`http://localhost:4321`), abre `/auth/signup/` y crea una cuenta con un correo tuyo.
2. Debe entrar al panel. Revisa el correo: llega el de verificación.
3. En la consola: **Authentication → Usuarios** aparece la cuenta; **Firestore → users** aparece su perfil con `name`, `orgName` y `createdAt`.
4. Cierra sesión y entra con la contraseña. Prueba una contraseña equivocada: dice «Correo o contraseña incorrectos».
5. Prueba «Olvidé mi contraseña» y «Continuar con Google».

## Lo que falta antes de publicar (no depende de Firebase)

- **Aviso de privacidad y términos:** ya existen en `/privacidad` y `/terminos` (se abren desde el registro). Por decisión del negocio no llevan razón social, domicilio ni correo de contacto: el aviso dice que HiloNova es el responsable y que se le escribe por los medios que publica en su sitio. Si se quiere un aviso con todos los datos de identificación del responsable, hay que agregarlos y que un abogado revise el texto.
- **Todas las cuentas tienen hoy el plan completo gratis.** El control de quién pagó o canjeó un cupón se construye en el servidor (pasos 4 y 5).
- **Versión de Next.js:** la 15.1.6 tiene una vulnerabilidad conocida (CVE-2025-66478). Hay que subir a una versión corregida antes de publicar.
- **Cobro:** se hace con un enlace de pago de Stripe y acceso dado a mano; **no necesita el plan Blaze** (ver `docs/COBRO-PASOS.md`).

## Cómo se probó aquí

Con el emulador local de Authentication (`firebase emulators:start --only auth`, configuración en `firebase/firebase.json`) y un segundo servidor de desarrollo con `NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR=http://127.0.0.1:9099` y `NEXT_DIST_DIR=.next-test`. Ese emulador no necesita Java; el de Firestore sí.

## Guardado de patrones en la nube (cómo funciona)

- Cada patrón es un documento en `users/{uid}/patterns/{id}` con `name`, `doc` (el patrón en JSON), `createdAt` y `updatedAt`. Un patrón pesa entre 2 y 9 KB; el límite de Firestore es 1 MB.
- El navegador sigue siendo la copia de trabajo. Cada cambio se anota en una cola (`hilonova.cloudq.v1`) y se sube a los 20 segundos, al cerrar sesión y al salir de la página. Así no se gasta el límite diario de escrituras del plan gratis (20,000).
- Al entrar con la cuenta se baja lo de la nube y se mezcla con lo del navegador: gana lo editado más recientemente; lo que solo existe aquí se sube. La mezcla completa se hace una vez por sesión del navegador (para cuidar las lecturas); los cambios hechos en otra computadora aparecen al abrir una sesión nueva del navegador.
- Si en el navegador había patrones de otra cuenta, se apartan en `hilonova.library.orphan.v1` (copia de seguridad en ese navegador) y no se suben a la cuenta nueva.
- Sin internet: todo sigue funcionando; los cambios quedan en la cola y el editor avisa «sin conexión con la nube».
- No se sincronizan todavía: materiales, «Mis piezas» y preferencias (siguen solo en el navegador). Hay que descargar respaldo.

### Prueba manual con el proyecto real
1. Publica las reglas nuevas (Firestore → Reglas → pegar `firebase/firestore.rules` → Publicar).
2. Entra con tu cuenta, crea un patrón y espera 20 segundos: en el editor debe decir «en la nube». En Firestore → `users` → tu documento → `patterns` debe aparecer el patrón.
3. Abre el programa en otro navegador (o en incógnito), entra con la misma cuenta: el patrón debe aparecer en «Proyectos».
4. Borra el patrón en uno; tras 20 segundos desaparece de la nube.
