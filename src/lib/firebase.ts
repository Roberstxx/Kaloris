// src/lib/firebase.ts
import { initializeApp, type FirebaseOptions } from "firebase/app";
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

// Exporta una lista de faltantes para el aviso de configuración en SessionContext
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

// Inicializa SDKs
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// === Wrapper que tu SessionContext espera ===
export const authApi = {
  onChange(cb: (user: User | null) => void) {
    // Devuelve la función para desuscribirse (como espera tu código)
    return onAuthStateChanged(auth, cb);
  },

  async signInEmail(email: string, password: string): Promise<User> {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  },

  async signUpEmail(email: string, password: string, displayName?: string): Promise<UserCredential> {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(cred.user, { displayName });
    }
    return cred;
  },

  signOut() {
    return fbSignOut(auth);
  },
};
