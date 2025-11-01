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

const missing = requiredEnvKeys.filter((key) => !import.meta.env[key]);

if (missing.length > 0) {
  throw new Error(
    `Firebase configuration is incomplete. Missing: ${missing.join(", ")}. ` +
      `Define them in your environment (e.g. Vercel Project Settings or a .env file).`
  );
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const authApi = {
  onChange: (cb: (u: FirebaseUser | null) => void) => onAuthStateChanged(auth, cb),
  signInEmail: (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password),
  signUpEmail: async (email: string, password: string, displayName?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) await updateProfile(cred.user, { displayName });
    return cred;
  },
  signInGoogle: () => signInWithPopup(auth, googleProvider),
  signOut: () => signOut(auth),
};
console.log("🔥 Firebase API KEY:", import.meta.env.VITE_FIREBASE_API_KEY);
