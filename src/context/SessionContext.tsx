// src/context/SessionContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi, firebaseConfigIssues, db } from "@/lib/firebase";
import type { User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";

// Extra de perfil que NO guarda Firebase (lo persistimos por usuario)
type MacroSplit = {
  carbPct: number;
  protPct: number;
  fatPct: number;
};

type UserPreferences = {
  theme?: "light" | "dark";
  locale?: string;
  notifications?: boolean;
};

type ExtraProfile = {
  sex?: "male" | "female";
  age?: number;
  weightKg?: number;
  heightCm?: number;
  activity?: string;
  tdee?: number;
  macros?: MacroSplit;
  username?: string; // por compatibilidad con tu UI
  name?: string;
  preferences?: UserPreferences;
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
  isLoading: boolean;
  profileComplete: boolean;
  needsProfile: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  register: (data: { name?: string; username?: string; email: string; password: string }) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<ExtraProfile>) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
};

const SessionContext = createContext<SessionState | undefined>(undefined);

const profileKey = (uid: string) => `cc_profile_${uid}`;

type StoredProfile = ExtraProfile & {
  // compatibilidad con datos antiguos
  weight?: number;
  height?: number;
};

function normalizePreferences(raw: UserPreferences | null | undefined): UserPreferences | undefined {
  if (!raw) return undefined;
  const prefs: UserPreferences = {};
  if (raw.theme === "light" || raw.theme === "dark") {
    prefs.theme = raw.theme;
  }
  if (typeof raw.locale === "string" && raw.locale.trim().length > 0) {
    prefs.locale = raw.locale;
  }
  if (typeof raw.notifications === "boolean") {
    prefs.notifications = raw.notifications;
  }
  return Object.keys(prefs).length > 0 ? prefs : undefined;
}

function normalizeProfile(raw: StoredProfile | null | undefined): ExtraProfile {
  if (!raw) return {};

  const profile: ExtraProfile = { ...raw };

  if (profile.weightKg === undefined && typeof raw.weight === "number") {
    profile.weightKg = raw.weight;
  }

  if (profile.heightCm === undefined && typeof raw.height === "number") {
    profile.heightCm = raw.height;
  }

  if (profile.macros) {
    profile.macros = {
      carbPct: Number(profile.macros.carbPct ?? 0),
      protPct: Number(profile.macros.protPct ?? 0),
      fatPct: Number(profile.macros.fatPct ?? 0),
    };
  }

  const prefs = normalizePreferences(raw.preferences);
  if (prefs) {
    profile.preferences = prefs;
  } else {
    delete profile.preferences;
  }

  return profile;
}

function mergeProfile(base: ExtraProfile, patch: Partial<ExtraProfile>): ExtraProfile {
  const merged: StoredProfile = {
    ...base,
    ...patch,
  };

  if (patch.macros) {
    merged.macros = {
      ...(base.macros ?? {}),
      ...patch.macros,
    } as MacroSplit;
  }

  if (patch.preferences) {
    merged.preferences = {
      ...(base.preferences ?? {}),
      ...patch.preferences,
    } as UserPreferences;
  }

  return normalizeProfile(merged);
}

function loadLocalProfile(uid: string): ExtraProfile {
  try {
    const raw = localStorage.getItem(profileKey(uid));
    return raw ? normalizeProfile(JSON.parse(raw)) : {};
  } catch {
    return {};
  }
}

function saveLocalProfile(uid: string, p: ExtraProfile) {
  localStorage.setItem(profileKey(uid), JSON.stringify(p));
}

function hasProfileData(profile: ExtraProfile) {
  return Object.keys(profile).length > 0;
}

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const missingKeys = firebaseConfigIssues.missing;
  const showConfigNotice = missingKeys.length > 0;

  const [user, setUser] = useState<AppUser | null>(null);
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [ready, setReady] = useState<boolean>(false);
  const [profileComplete, setProfileComplete] = useState(false);

  useEffect(() => {
    if (showConfigNotice) {
      setUser(null);
      setProfileComplete(false);
      setAuthUser(null);
      return;
    }

    const unsub = authApi.onChange((fbUser) => {
      setAuthUser(fbUser);
    });

    return () => {
      unsub();
    };
  }, [showConfigNotice]);

  useEffect(() => {
    if (!authUser) {
      setUser(null);
      setProfileComplete(false);
      setReady(true);
      return undefined;
    }

    if (!db) {
      const extra = loadLocalProfile(authUser.uid);
      setProfileComplete(isProfileComplete(extra));

      const name = authUser.displayName || extra.name || extra.username || "";
      const username = extra.username || (authUser.email ? authUser.email.split("@")[0] : "");

      setUser({
        id: authUser.uid,
        name,
        username,
        email: authUser.email,
        ...extra,
      });
      setReady(true);
      return undefined;
    }

    setReady(false);
    const profileRef = doc(db, "profiles", authUser.uid);
    let unsubProfile: (() => void) | undefined;

    (async () => {
      try {
        const snapshot = await getDoc(profileRef);
        if (!snapshot.exists()) {
          const local = loadLocalProfile(authUser.uid);
          if (hasProfileData(local)) {
            await setDoc(profileRef, local, { merge: true });
          }
        }
      } catch (error) {
        console.error("Error preparando el perfil de Firestore", error);
      }

      unsubProfile = onSnapshot(
        profileRef,
        (snap) => {
          const extra = snap.exists()
            ? normalizeProfile(snap.data() as StoredProfile)
            : {};

          saveLocalProfile(authUser.uid, extra);
          setProfileComplete(isProfileComplete(extra));

          const name = authUser.displayName || extra.name || extra.username || "";
          const username = extra.username || (authUser.email ? authUser.email.split("@")[0] : "");

          setUser({
            id: authUser.uid,
            name,
            username,
            email: authUser.email,
            ...extra,
          });
          setReady(true);
        },
        (error) => {
          console.error("Error al escuchar el perfil de Firestore", error);
          const fallback = loadLocalProfile(authUser.uid);
          setProfileComplete(isProfileComplete(fallback));

          const name = authUser.displayName || fallback.name || fallback.username || "";
          const username =
            fallback.username || (authUser.email ? authUser.email.split("@")[0] : "");

          setUser({
            id: authUser.uid,
            name,
            username,
            email: authUser.email,
            ...fallback,
          });
          setReady(true);
        }
      );
    })();

    return () => {
      unsubProfile?.();
    };
  }, [authUser]);

  const value = useMemo<SessionState>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading: !ready,
      profileComplete,
      needsProfile: !!user && !profileComplete,
      login: async (email, password) => {
        if (!email.includes("@")) {
          throw new Error("Usa tu correo electrónico para iniciar sesión.");
        }
        await authApi.signInEmail(email, password);
        return true;
      },
      register: async ({ name, username, email, password }) => {
        if (!email) throw new Error("El correo es obligatorio.");
        const cred = await authApi.signUpEmail(email, password, name || username);

        const previous = loadLocalProfile(cred.user.uid);
        const base: ExtraProfile = { name, username };
        const merged = mergeProfile(previous, base);

        if (db) {
          await setDoc(doc(db, "profiles", cred.user.uid), merged, { merge: true });
        }

        saveLocalProfile(cred.user.uid, merged);

        const resolvedName = cred.user.displayName || merged.name || merged.username || "";
        const resolvedUsername = merged.username || (cred.user.email ? cred.user.email.split("@")[0] : "");

        setProfileComplete(isProfileComplete(merged));
        setUser({
          id: cred.user.uid,
          name: resolvedName,
          username: resolvedUsername,
          email: cred.user.email,
          ...merged,
        });

        setReady(true);
        return true;
      },
      logout: () => {
        authApi.signOut();
      },
      updateProfile: (data) => {
        if (!user) return;
        const merged = mergeProfile(loadLocalProfile(user.id), data);

        if (db) {
          void setDoc(doc(db, "profiles", user.id), merged, { merge: true });
        }

        saveLocalProfile(user.id, merged);
        setUser((prev) => (prev ? { ...prev, ...merged } : prev));
        setProfileComplete(isProfileComplete(merged));
      },
      updatePreferences: (prefs) => {
        if (!user) {
          if (typeof window !== "undefined" && prefs.theme) {
            window.localStorage.setItem("theme", prefs.theme);
          }
          return;
        }

        const merged = mergeProfile(loadLocalProfile(user.id), { preferences: prefs });

        if (db) {
          void setDoc(
            doc(db, "profiles", user.id),
            { preferences: merged.preferences },
            { merge: true }
          );
        }

        saveLocalProfile(user.id, merged);
        setUser((prev) => (prev ? { ...prev, preferences: merged.preferences } : prev));
      },
    }),
    [user, profileComplete, ready]
  );

  const configNotice = useMemo(() => {
    if (!showConfigNotice) return null;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-900 px-6 text-center text-slate-100">
        <div className="max-w-lg space-y-3">
          <h1 className="text-3xl font-semibold text-white">Configura tus credenciales de Firebase</h1>
          <p className="text-base leading-relaxed text-slate-200">
            Para que el login funcione en producción necesitas definir las variables de entorno de Firebase en Vercel (o un
            archivo <code>.env</code>). Agrega las siguientes claves con los valores de tu proyecto y vuelve a desplegar:
          </p>
          <ul className="rounded-lg bg-slate-800 p-4 text-left text-sm font-mono text-slate-100">
            {missingKeys.map((key) => (
              <li key={key}>{key}</li>
            ))}
          </ul>
          <p className="text-sm text-slate-300">
            Proyecto → Settings → Environment Variables → añade cada clave con su valor (<strong>Scope:</strong> Production) y haz un
            redeploy.
          </p>
        </div>
      </div>
    );
  }, [missingKeys, showConfigNotice]);

  return (
    <SessionContext.Provider value={value}>
      {showConfigNotice
        ? configNotice
        : ready
          ? children
          : (
            <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
              <div className="flex flex-col items-center gap-3">
                <span className="inline-flex h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-white" aria-hidden="true" />
                <p className="text-sm font-medium">Cargando tu sesión…</p>
              </div>
            </div>
            )}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
};
