// src/lib/firebase.ts
import { initializeApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * Devuelve una variable de entorno limpia sin romper el build.
 * Si falta, devuelve cadena vacía para evitar fallos en Vercel.
 */
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

/**
 * Si se ejecuta en el navegador, verificamos si falta alguna variable
 * (para mostrar un error más claro sin tumbar el build).
 */
if (typeof window !== "undefined") {
  const missing = Object.entries(firebaseConfig)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missing.length > 0) {
    console.warn(
      "⚠️ Faltan variables de entorno de Firebase:",
      missing.join(", ")
    );
  }
}

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// 🔹 Export opcional si algún archivo lo espera:
export const firebaseConfigIssues = { missing: [] as string[] };
