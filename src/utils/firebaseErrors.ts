import { FirebaseError } from "firebase/app";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/user-not-found": "No encontramos una cuenta con ese correo. Regístrate para continuar.",
  "auth/wrong-password": "La contraseña no coincide con el correo ingresado.",
  "auth/invalid-credential": "El correo o la contraseña no son correctos.",
  "auth/invalid-email": "El correo que ingresaste no es válido.",
  "auth/email-already-in-use": "Este correo ya está registrado. Inicia sesión o usa otro correo.",
  "auth/weak-password": "La contraseña es muy corta. Usa al menos 6 caracteres.",
  "auth/missing-password": "Debes ingresar una contraseña para continuar.",
  "auth/operation-not-allowed": "El registro con correo y contraseña está deshabilitado. Contacta al administrador.",
  "auth/network-request-failed": "No pudimos conectarnos con el servidor. Revisa tu conexión e inténtalo de nuevo.",
  "auth/too-many-requests": "Se detectaron muchos intentos. Espera un momento antes de volver a intentar.",
};

export function getAuthErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof FirebaseError) {
    return AUTH_ERROR_MESSAGES[err.code] ?? fallback;
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}
