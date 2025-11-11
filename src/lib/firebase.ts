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

// No rompas el build si falta una env; deja string vacío y avisa en runtime.
const env = (v?: string) => (v && v.trim()) || "";

const firebaseConfig: FirebaseOptions = {
  apiKey: env(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: env(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: env(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: env(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: env(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: env(import.meta.env.VITE_FIREBASE_APP_ID),
  measurementId: env(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID), // opcional
};

// Campos requeridos para poder usar Auth/Firestore en cliente
const requiredForClient: Record<string, string | undefined> = {
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId as string | undefined,
  appId: firebaseConfig.appId,
};

// Exporta una lista de faltantes para aviso UI (banner en SessionContext)
export const firebaseConfigIssues = {
  missing: Object.entries(requiredForClient)
    .filter(([, v]) => !v)
    .map(([k]) => k),
};

// Helper: asegura que la config está completa ANTES de usar Auth.
// No rompe el build, pero evita errores crípticos como auth/invalid-api-key.
function ensureFirebaseReady() {
  if (firebaseConfigIssues.missing.length) {
    const list = firebaseConfigIssues.missing.join(", ");
    const msg =
      `Configuración de Firebase incompleta. Faltan: ${list}. ` +
      `Revisa tus variables .env (todas deben empezar con VITE_) ` +
      `y vuelve a desplegar.`;
    // Log visible y error claro para UI
    console.error("[FIREBASE CONFIG ERROR]", { missing: firebaseConfigIssues.missing, firebaseConfig });
    throw new Error(msg);
  }
}

// Inicialización única de SDKs
export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// === Wrapper que tu SessionContext espera ===
const ERROR_MAP: Record<string, string> = {
  "auth/invalid-email": "El correo no tiene un formato válido.",
  "auth/user-disabled": "Tu cuenta está deshabilitada.",
  "auth/user-not-found": "No existe una cuenta con ese correo.",
  "auth/wrong-password": "La contraseña es incorrecta.",
  "auth/invalid-api-key": "API Key inválida. Revisa tus variables .env.",
  "auth/network-request-failed": "Problema de red. Revisa tu conexión.",
  "auth/too-many-requests": "Demasiados intentos. Intenta más tarde.",
  "auth/configuration-not-found": "Configuración de Firebase incompleta.",
};

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
      console.error("[LOGIN ERROR]", { code: err?.code, message: err?.message, err });
      throw new Error(ERROR_MAP[err?.code] || "Ocurrió un error al iniciar sesión.");
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
      console.error("[SIGNUP ERROR]", { code: err?.code, message: err?.message, err });
      throw new Error(ERROR_MAP[err?.code] || "Ocurrió un error al crear la cuenta.");
    }
  },

  signOut() {
    ensureFirebaseReady();
    return fbSignOut(auth);
  },
};

