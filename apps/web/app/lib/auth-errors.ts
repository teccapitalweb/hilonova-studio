// Mensajes en español para los errores de Firebase Auth (el código viene en `error.code`).

const MESSAGES: Record<string, string> = {
  "auth/email-already-in-use": "Ya existe una cuenta con ese correo. Entra con tu contraseña o usa «Olvidé mi contraseña».",
  "auth/invalid-email": "El correo no es válido.",
  "auth/weak-password": "La contraseña es muy débil. Usa al menos 8 caracteres.",
  "auth/missing-password": "Escribe tu contraseña.",
  "auth/invalid-credential": "Correo o contraseña incorrectos.",
  "auth/wrong-password": "Correo o contraseña incorrectos.",
  "auth/user-not-found": "Correo o contraseña incorrectos.",
  "auth/user-disabled": "Esta cuenta está desactivada. Escríbenos para ayudarte.",
  "auth/too-many-requests": "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
  "auth/network-request-failed": "No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.",
  "auth/popup-blocked": "El navegador bloqueó la ventana de Google. Permite las ventanas emergentes e inténtalo de nuevo.",
  "auth/unauthorized-domain": "Esta dirección no está autorizada en Firebase. Avisa al administrador.",
  "auth/operation-not-allowed": "Este método de acceso no está activado en Firebase. Avisa al administrador.",
};

/** Errores que no son fallas (la persona cerró la ventana): no se muestra nada. */
const SILENT = new Set(["auth/popup-closed-by-user", "auth/cancelled-popup-request"]);

export function authErrorCode(err: unknown): string {
  if (typeof err === "object" && err !== null && "code" in err) return String((err as { code: unknown }).code);
  return "";
}

/** Texto para mostrar a la persona; cadena vacía si no hay nada que decir. */
export function authErrorMessage(err: unknown): string {
  const code = authErrorCode(err);
  if (SILENT.has(code)) return "";
  return MESSAGES[code] ?? "No pudimos completar la operación. Inténtalo de nuevo en un momento.";
}
