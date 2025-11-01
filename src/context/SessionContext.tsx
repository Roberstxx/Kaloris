// src/context/SessionContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "@/lib/firebase";

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
  const [user, setUser] = useState<AppUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = authApi.onChange((fbUser) => {
      if (!fbUser) {
        setUser(null);
        setReady(true);
        return;
      }
      const extra = loadProfile(fbUser.uid);
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
      return true;
    },
    logout: () => { authApi.signOut(); },
    updateProfile: (data) => {
      if (!user) return;
      const merged = { ...loadProfile(user.id), ...data };
      saveProfile(user.id, merged);
      setUser({ ...user, ...merged });
    },
  }), [user]);

  // mientras carga el estado de Firebase, muestra children (Login ya espera redirección)
  return <SessionContext.Provider value={value}>{ready && children}</SessionContext.Provider>;
};

export const useSession = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
};
