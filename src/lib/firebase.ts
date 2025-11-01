// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
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

const requiredEnvKeys = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_APP_ID",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
] as const;

type FirebaseEnvKey = (typeof requiredEnvKeys)[number];

const readEnv = (key: FirebaseEnvKey) => {
  const value = import.meta.env[key];
  if (!value) {
    console.error(`Missing environment variable: ${key}`);
  }
  return value;
};

const firebaseConfig = {
  apiKey: readEnv("VITE_FIREBASE_API_KEY"),
  authDomain: readEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: readEnv("VITE_FIREBASE_PROJECT_ID"),
  appId: readEnv("VITE_FIREBASE_APP_ID"),
  messagingSenderId: readEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  storageBucket: readEnv("VITE_FIREBASE_STORAGE_BUCKET"),
};

export const firebaseConfigIssues = {
  missing: requiredEnvKeys.filter((key) => !import.meta.env[key]),
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
    const cred = await createUserWithEmailAndPassword(
      requireAuth(),
      email,
      password
    );
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
