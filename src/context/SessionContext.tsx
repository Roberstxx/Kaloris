// src/context/SessionContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi, firebaseConfigIssues } from "@/lib/firebase";

// Extra de perfil que NO guarda Firebase (lo persistimos por usuario)
type ExtraProfile = {
  sex?: "male" | "female";
  age?: number;
  weightKg?: number;
  heightCm?: number;
  activity?: string;
  tdee?: number;
  username?: string; // por compatibilidad con tu UI
  name?: string;
};

const REQUIRED_PROFILE_FIELDS: (keyof ExtraProfile)[] = [
  "sex",
  "age",
  "weightKg",
  "heightCm",
  "activity",
  "tdee",
];

function isProfileComplete(profile: ExtraProfile): boolean {
  return REQUIRED_PROFILE_FIELDS.every((key) => {
    const value = profile[key];
    if (typeof value === "number") {
      return Number.isFinite(value) && value > 0;
    }
    return Boolean(value);
  });
}

// Usuario que expone el contexto (compatible con tu app)
export type AppUser = {
  id: string;
  name: string;
  username: string;
  email: string | null;
  tdee?: number;
} & ExtraProfile;

type SessionState = {
  user: AppUser | null;
  isAuthenticated: boolean;
  profileComplete: boolean;
  needsProfile: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  register: (data: { name?: string; username?: string; email: string; password: string }) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<ExtraProfile>) => void;
};

const SessionContext = createContext<SessionState | undefined>(undefined);

const profileKey = (uid: string) => `cc_profile_${uid}`;

function loadProfile(uid: string): ExtraProfile {
  try {
    const raw = localStorage.getItem(profileKey(uid));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function saveProfile(uid: string, p: ExtraProfile) {
  localStorage.setItem(profileKey(uid), JSON.stringify(p));
}

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (firebaseConfigIssues.missing.length > 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-900 px-6 text-center text-slate-100">
        <div className="max-w-lg space-y-3">
          <h1 className="text-3xl font-semibold text-white">Configura tus credenciales de Firebase</h1>
          <p className="text-base leading-relaxed text-slate-200">
            Para que el login funcione en producción necesitas definir las variables de entorno de
            Firebase en Vercel (o un archivo <code>.env</code>). Agrega las siguientes claves con los
            valores de tu proyecto y vuelve a desplegar:
          </p>
          <ul className="rounded-lg bg-slate-800 p-4 text-left text-sm font-mono text-slate-100">
            {firebaseConfigIssues.missing.map((key) => (
              <li key={key}>{key}</li>
            ))}
          </ul>
          <p className="text-sm text-slate-300">
            Proyecto → Settings → Environment Variables → añade cada clave con su valor (<strong>Scope:</strong> Production) y haz un redeploy.
          </p>
        </div>
      </div>
    );
  }

  const [user, setUser] = useState<AppUser | null>(null);
  const [ready, setReady] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);

  useEffect(() => {
    const unsub = authApi.onChange((fbUser) => {
      if (!fbUser) {
        setUser(null);
        setReady(true);
        setProfileComplete(false);
        return;
      }
      const extra = loadProfile(fbUser.uid);
      setProfileComplete(isProfileComplete(extra));
      const name = fbUser.displayName || extra.name || extra.username || "";
      const username = extra.username || (fbUser.email ? fbUser.email.split("@")[0] : "");
      setUser({
        id: fbUser.uid,
        name,
        username,
        email: fbUser.email,
        ...extra,
      });
      setReady(true);
    });
    return () => unsub();
  }, []);

  const value = useMemo<SessionState>(() => ({
    user,
    isAuthenticated: !!user,
    login: async (email, password) => {
      if (!email.includes("@")) throw new Error("Usa tu correo electrónico para iniciar sesión.");
      await authApi.signInEmail(email, password);
      return true;
    },
    register: async ({ name, username, email, password }) => {
      if (!email) throw new Error("El correo es obligatorio.");
      const cred = await authApi.signUpEmail(email, password, name || username);
      // guarda extras iniciales (nombre/username)
      const base: ExtraProfile = { name, username };
      saveProfile(cred.user.uid, { ...loadProfile(cred.user.uid), ...base });
      setProfileComplete(false);
      return true;
    },
    logout: () => { authApi.signOut(); },
    updateProfile: (data) => {
      if (!user) return;
      const merged = { ...loadProfile(user.id), ...data };
      saveProfile(user.id, merged);
      setUser({ ...user, ...merged });
      setProfileComplete(isProfileComplete(merged));
    },
    profileComplete,
    needsProfile: !!user && !profileComplete,
  }), [user, profileComplete]);

  // mientras carga el estado de Firebase, muestra children (Login ya espera redirección)
  return <SessionContext.Provider value={value}>{ready && children}</SessionContext.Provider>;
};

export const useSession = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
};
