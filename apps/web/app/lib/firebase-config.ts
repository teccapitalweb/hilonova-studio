// Configuración pública de Firebase (consola de Firebase → Configuración del proyecto → Tus apps → Web).
// Estos valores NO son contraseñas: están hechos para ir en el código del sitio. Lo que protege los datos
// son las reglas de Firestore (firebase/firestore.rules) y la lista de dominios autorizados.
//
// Mientras estén vacíos, el programa funciona en «modo de prueba»: la cuenta se guarda solo en el navegador.

export const FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};
