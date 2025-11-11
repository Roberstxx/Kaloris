// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseOptions } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as fbSignOut,
  type User,
  type UserCredential,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * Helper: no rompas el build si falta una env; deja string "" y avisa en runtime.
 */
const env = (v?: string) => (v && v.trim()) || "";

/**
 * Configuración tomada de variables Vite (Vercel / .env)
 */
const firebaseConfig: FirebaseOptions = {
  apiKey: env(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: env(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: env(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: env(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: env(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: env(import.meta.env.VITE_FIREBASE_APP_ID),
  measurementId: env(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID), // opcional
};

/**
 * === Export que tu SessionContext espera para mostrar el banner de configuración ===
 */
const requiredForClient: Record<string, string | undefined> = {
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId as string | undefined,
  appId: firebaseConfig.appId,
};

export const firebaseConfigIssues = {
  missing: Object.entries(requiredForClient)
    .filter(([, v]) => !v)
    .map(([k]) => k),
};

/**
 * Si la config está incompleta, corta operaciones de Auth con un error claro.
 * (No rompe el build; solo evita errores crípticos en runtime).
 */
function ensureFirebaseReady() {
  if (firebaseConfigIssues.missing.length) {
    const list = firebaseConfigIssues.missing.join(", ");
    const msg =
      `Configuración de Firebase incompleta. Faltan: ${list}. ` +
      `Revisa tus variables .env (todas con prefijo VITE_) y vuelve a desplegar.`;
    // Log útil para diagnóstico
    console.error("[FIREBASE CONFIG ERROR]", { missing: firebaseConfigIssues.missing, firebaseConfig });
    const e = new Error(msg) as Error & { code?: string };
    e.code = "auth/configuration-not-found";
    throw e;
  }
}

/**
 * Inicialización única (evita doble init en HMR/SSR)
 */
export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

/**
 * Mapeo de errores de Firebase Auth a mensajes amistosos
 * (Tu UI usa getAuthErrorMessage(err, fallback), así que preservamos err.code)
 */
const ERROR_MAP: Record<string, string> = {
  "auth/invalid-email": "El correo no tiene un formato válido.",
  "auth/user-disabled": "Tu cuenta está deshabilitada.",
  "auth/user-not-found": "No existe una cuenta con ese correo.",
  "auth/wrong-password": "La contraseña es incorrecta.",
  "auth/too-many-requests": "Demasiados intentos. Intenta más tarde.",
  "auth/network-request-failed": "Problema de red. Revisa tu conexión.",
  "auth/invalid-api-key": "API Key inválida. Revisa la configuración.",
  "auth/configuration-not-found": "Configuración de Firebase incompleta.",
};

function wrapAuthError(err: any, fallback = "Ocurrió un error.") {
  const code: string = err?.code || "";
  const msg = ERROR_MAP[code] || fallback;
  const e = new Error(msg) as Error & { code?: string; raw?: any };
  e.code = code || "auth/unknown";
  e.raw = err;
  return e;
}

/**
 * === API que usa tu SessionContext ===
 * - onChange(cb)
 * - signInEmail(email, password) -> User
 * - signUpEmail(email, password, displayName?) -> UserCredential
 * - signOut()
 */
export const authApi = {
  onChange(cb: (user: User | null) => void) {
    return onAuthStateChanged(auth, cb);
  },

  async signInEmail(email: string, password: string): Promise<User> {
    ensureFirebaseReady();
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return cred.user;
    } catch (err: any) {
      console.error("[LOGIN ERROR]", { code: err?.code, message: err?.message });
      throw wrapAuthError(err, "Ocurrió un error al iniciar sesión.");
    }
  },

  async signUpEmail(email: string, password: string, displayName?: string): Promise<UserCredential> {
    ensureFirebaseReady();
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }
      return cred;
    } catch (err: any) {
      console.error("[SIGNUP ERROR]", { code: err?.code, message: err?.message });
      throw wrapAuthError(err, "Ocurrió un error al crear la cuenta.");
    }
  },

  signOut() {
    ensureFirebaseReady();
    return fbSignOut(auth);
  },
};

