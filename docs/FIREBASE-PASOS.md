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
| Guardar los patrones en la nube | **No hecho** (paso 2) |
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
- **Cloud Functions y Stripe** necesitan el plan **Blaze** de Firebase (pago por uso, pide tarjeta; con poco tráfico casi no se paga). El registro y el guardado de patrones funcionan en el plan gratis.

## Cómo se probó aquí

Con el emulador local de Authentication (`firebase emulators:start --only auth`, configuración en `firebase/firebase.json`) y un segundo servidor de desarrollo con `NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR=http://127.0.0.1:9099` y `NEXT_DIST_DIR=.next-test`. Ese emulador no necesita Java; el de Firestore sí.
