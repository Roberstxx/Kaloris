// src/lib/firebase.ts
import { FirebaseOptions, initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
} from "firebase/auth";

const fallbackFirebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyDezSR_1PKfTGGF4zEFl192oqbQDqJrERA",
  authDomain: "contadorcaloriasl.firebaseapp.com",
  projectId: "contadorcaloriasl",
  storageBucket: "contadorcaloriasl.firebasestorage.app",
  messagingSenderId: "832159989579",
  appId: "1:832159989579:web:c7032fd53c6751861872ce",
  measurementId: "G-NXMEKREWQ1",
};

const requiredEnvKeys = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_APP_ID",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
] as const;

type FirebaseEnvKey = (typeof requiredEnvKeys)[number];

const envKeyToFirebaseKey: Record<FirebaseEnvKey, keyof FirebaseOptions> = {
  VITE_FIREBASE_API_KEY: "apiKey",
  VITE_FIREBASE_AUTH_DOMAIN: "authDomain",
  VITE_FIREBASE_PROJECT_ID: "projectId",
  VITE_FIREBASE_APP_ID: "appId",
  VITE_FIREBASE_MESSAGING_SENDER_ID: "messagingSenderId",
  VITE_FIREBASE_STORAGE_BUCKET: "storageBucket",
};

const missingKeys: FirebaseEnvKey[] = [];

const resolveValue = (key: FirebaseEnvKey): string => {
  const envValue = import.meta.env[key];
  if (typeof envValue === "string" && envValue.trim().length > 0) {
    return envValue;
  }

  const fallbackKey = envKeyToFirebaseKey[key];
  const fallbackValue = fallbackFirebaseConfig[fallbackKey];

  if (typeof fallbackValue === "string" && fallbackValue.trim().length > 0) {
    return fallbackValue;
  }

  missingKeys.push(key);
  console.error(`Missing Firebase configuration value for ${key}`);
  return "";
};

const firebaseConfig: FirebaseOptions = {
  apiKey: resolveValue("VITE_FIREBASE_API_KEY"),
  authDomain: resolveValue("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: resolveValue("VITE_FIREBASE_PROJECT_ID"),
  appId: resolveValue("VITE_FIREBASE_APP_ID"),
  messagingSenderId: resolveValue("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  storageBucket: resolveValue("VITE_FIREBASE_STORAGE_BUCKET"),
  measurementId: fallbackFirebaseConfig.measurementId,
};

export const firebaseConfigIssues = {
  missing: missingKeys,
};

const app = firebaseConfigIssues.missing.length === 0 ? initializeApp(firebaseConfig) : undefined;
export const auth = app ? getAuth(app) : undefined;
export const googleProvider = new GoogleAuthProvider();

export const authApi = {
  onChange: (cb: (u: FirebaseUser | null) => void) => {
    if (!auth) {
      cb(null);
      return () => undefined;
    }
    return onAuthStateChanged(auth, cb);
  },
  signInEmail: (email: string, password: string) =>
    signInWithEmailAndPassword(requireAuth(), email, password),
  signUpEmail: async (email: string, password: string, displayName?: string) => {
    const cred = await createUserWithEmailAndPassword(requireAuth(), email, password);
    if (displayName) await updateProfile(cred.user, { displayName });
    return cred;
  },
  signInGoogle: () => signInWithPopup(requireAuth(), googleProvider),
  signOut: () => signOut(requireAuth()),
};

function requireAuth() {
  if (!auth) {
    throw new Error(
      firebaseConfigIssues.missing.length
        ? `Faltan variables de entorno Firebase: ${firebaseConfigIssues.missing.join(", ")}`
        : "Firebase no pudo inicializarse."
    );
  }
  return auth;
}
