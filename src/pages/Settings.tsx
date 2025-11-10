// src/pages/Settings.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Home, History, Settings as SettingsIcon, Edit, X } from "lucide-react";
import { useSession } from "../context/SessionContext";
import { ActivityLevel, Sex } from "../types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { isCloudinaryConfigured, uploadImageToCloudinary } from "@/lib/cloudinary";

const ACTIVITY_LEVELS: Record<ActivityLevel, { label: string; factor: number; help: string }> = {
  sedentario: { label: "Sedentario", factor: 1.2, help: "Poco o nada de ejercicio" },
  ligero: { label: "Ligero", factor: 1.375, help: "Ejercicio 1–3 veces por semana" },
  moderado: { label: "Moderado", factor: 1.55, help: "Ejercicio 3–5 veces por semana" },
  intenso: { label: "Intenso", factor: 1.725, help: "Entrenamientos fuertes 6–7 veces" },
  muy_intenso: { label: "Muy intenso", factor: 1.9, help: "Trabajo físico o doble sesión diaria" },
};

const LEGACY_ACTIVITY_MAP: Record<string, ActivityLevel> = {
  sedentary: "sedentario",
  light: "ligero",
  moderate: "moderado",
  intense: "intenso",
  athlete: "muy_intenso",
};

const DEFAULT_ACTIVITY: ActivityLevel = "moderado";

const normalizeActivity = (value?: string): ActivityLevel => {
  if (value && Object.prototype.hasOwnProperty.call(ACTIVITY_LEVELS, value)) {
    return value as ActivityLevel;
  }
  if (value && LEGACY_ACTIVITY_MAP[value]) {
    return LEGACY_ACTIVITY_MAP[value];
  }
  return DEFAULT_ACTIVITY;
};

const resolveMacros = (macros?: { carbPct: number; protPct: number; fatPct: number }) => ({
  carbPct: Number(macros?.carbPct ?? 50),
  protPct: Number(macros?.protPct ?? 25),
  fatPct: Number(macros?.fatPct ?? 25),
});

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateProfile, logout } = useSession();

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) navigate("/login");
  }, [isAuthenticated, navigate]);

  const profileSnapshot = useMemo(() => {
    return {
      name: user?.name ?? "",
      email: user?.email ?? "",
      username: user?.username ?? "",
      sex: (user?.sex as Sex) ?? "male",
      age: Number(user?.age ?? 21),
      heightCm: Number(user?.heightCm ?? 170),
      weightKg: Number(user?.weightKg ?? 70),
      activity: normalizeActivity(user?.activity),
      tdee: Number(user?.tdee ?? 2000),
      macros: resolveMacros(user?.macros),
      avatarUrl: user?.avatarUrl ?? "",
    };
  }, [user]);

  const [sex, setSex] = useState<Sex>(profileSnapshot.sex);
  const [age, setAge] = useState<number>(profileSnapshot.age);
  const [heightCm, setHeightCm] = useState<number>(profileSnapshot.heightCm);
  const [weightKg, setWeightKg] = useState<number>(profileSnapshot.weightKg);
  const [activity, setActivity] = useState<ActivityLevel>(profileSnapshot.activity);
  const [targetKcal, setTargetKcal] = useState<number>(profileSnapshot.tdee);
  const [carbPct, setCarbPct] = useState<number>(profileSnapshot.macros.carbPct);
  const [protPct, setProtPct] = useState<number>(profileSnapshot.macros.protPct);
  const [fatPct, setFatPct] = useState<number>(profileSnapshot.macros.fatPct);
  const [avatarUrl, setAvatarUrl] = useState<string>(profileSnapshot.avatarUrl);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cloudinaryEnabled = useMemo(() => isCloudinaryConfigured(), []);

  useEffect(() => {
    setSex(profileSnapshot.sex);
    setAge(profileSnapshot.age);
    setHeightCm(profileSnapshot.heightCm);
    setWeightKg(profileSnapshot.weightKg);
    setActivity(profileSnapshot.activity);
    setTargetKcal(profileSnapshot.tdee);
    setCarbPct(profileSnapshot.macros.carbPct);
    setProtPct(profileSnapshot.macros.protPct);
    setFatPct(profileSnapshot.macros.fatPct);
    setAvatarUrl(profileSnapshot.avatarUrl);
    setAvatarError(null);
  }, [profileSnapshot]);

  const pctTotal = carbPct + protPct + fatPct;

  const bmr = useMemo(() => {
    const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
    return Math.round(sex === "male" ? base + 5 : base - 161);
  }, [sex, weightKg, heightCm, age]);

  const tdeeSuggested = useMemo(() => {
    const factor = ACTIVITY_LEVELS[activity].factor;
    return Math.round(bmr * factor);
  }, [bmr, activity]);

  useEffect(() => {
    if (Math.abs(targetKcal - tdeeSuggested) < 50) setTargetKcal(tdeeSuggested);
  }, [tdeeSuggested]); // eslint-disable-line react-hooks/exhaustive-deps

  const carbGr = useMemo(() => Math.round((targetKcal * (carbPct / 100)) / 4), [targetKcal, carbPct]);
  const protGr = useMemo(() => Math.round((targetKcal * (protPct / 100)) / 4), [targetKcal, protPct]);
  const fatGr = useMemo(() => Math.round((targetKcal * (fatPct / 100)) / 9), [targetKcal, fatPct]);

  const handleAvatarFile = async (file: File) => {
    if (!file) return;
    if (!cloudinaryEnabled) {
      setAvatarError("Cloudinary no está configurado.");
      return;
    }
    setAvatarError(null);
    setIsUploadingAvatar(true);
    try {
      const response = await uploadImageToCloudinary(file, { folder: "kaloris/profile" });
      const nextUrl = (response.secure_url ?? response.url ?? "").trim();
      if (!nextUrl) {
        throw new Error("La respuesta de Cloudinary no devolvió una URL válida.");
      }
      setAvatarUrl(nextUrl);
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : "No se pudo subir la imagen. Intenta nuevamente.";
      setAvatarError(message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      void handleAvatarFile(file);
    }
    // Reset para permitir volver a subir el mismo archivo
    event.target.value = "";
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl("");
  };

  const handleSave = () => {
    if (pctTotal !== 100) {
      alert("El reparto de macros debe sumar 100%.");
      return;
    }
    const next = {
      sex,
      age,
      heightCm,
      weightKg,
      activity,
      tdee: targetKcal,
      macros: { carbPct, protPct, fatPct },
      avatarUrl: avatarUrl.trim(),
    };

    updateProfile(next);
    alert("Cambios guardados.");
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setSex(profileSnapshot.sex);
    setAge(profileSnapshot.age);
    setHeightCm(profileSnapshot.heightCm);
    setWeightKg(profileSnapshot.weightKg);
    setActivity(profileSnapshot.activity);
    setTargetKcal(profileSnapshot.tdee);
    setCarbPct(profileSnapshot.macros.carbPct);
    setProtPct(profileSnapshot.macros.protPct);
    setFatPct(profileSnapshot.macros.fatPct);
    setAvatarUrl(profileSnapshot.avatarUrl);
    setAvatarError(null);
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const fallbackInitials = useMemo(() => {
    const source = `${profileSnapshot.name || profileSnapshot.username || ""}`.trim();
    if (!source) return "👤";
    const letters = source
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
    return letters || "👤";
  }, [profileSnapshot.name, profileSnapshot.username]);

  if (!user) return null;

  return (
    <div>
      <header
        className="header"
        style={{
          background: "var(--surface-elevated)",
          borderBottom: "1px solid var(--border)",
          padding: "1rem 0",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div className="container" style={{ maxWidth: "100%", width: "100%", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h1
              className="logo"
              style={{
                margin: 0,
                fontSize: "1.25rem",
                background: "var(--gradient-brand)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Contador de Calorías
            </h1>
            <nav style={{ display: "flex", gap: ".5rem", alignItems: "center" }}>
              <Link to="/dashboard" className="navLink" style={navLinkStyle}>
                <Home size={20} />
              </Link>
              <Link to="/historial" className="navLink" style={navLinkStyle}>
                <History size={20} />
              </Link>
              <Link to="/settings" className="navLink" style={navLinkStyle}>
                <SettingsIcon size={20} />
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container" style={{ paddingTop: "2rem", paddingBottom: "3rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 style={{ margin: 0 }}>Ajustes</h2>
          {!isEditing && (
            <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
              <Edit size={16} style={{ marginRight: "0.5rem" }} />
              Editar Perfil
            </button>
          )}
        </div>

        <div style={gridTwoCols}>
          <section className="card" style={{ background: "var(--surface-elevated)" }}>
            <h3 style={{ marginBottom: "1rem" }}>Perfil</h3>

            <div style={avatarRow}>
              <Avatar className="h-16 w-16">
                {avatarUrl && <AvatarImage src={avatarUrl} alt="Foto de perfil" />}
                <AvatarFallback>{fallbackInitials}</AvatarFallback>
              </Avatar>
              <div style={{ flex: 1 }}>
                <span className="label" style={{ display: "block", marginBottom: ".25rem" }}>
                  Foto de perfil
                </span>
                {isEditing ? (
                  <>
                    <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", alignItems: "center" }}>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleAvatarInputChange}
                        disabled={!cloudinaryEnabled}
                      />
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAvatar || !cloudinaryEnabled}
                      >
                        {cloudinaryEnabled
                          ? isUploadingAvatar
                            ? "Subiendo…"
                            : "Cambiar foto"
                          : "Configura Cloudinary"}
                      </button>
                      {avatarUrl && (
                        <button
                          className="btn btn-secondary"
                          type="button"
                          onClick={handleRemoveAvatar}
                          disabled={isUploadingAvatar}
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                    {!cloudinaryEnabled && (
                      <small style={helperText}>
                        Copia el valor completo <code>cloudinary://&#123;api_key&#125;:&#123;api_secret&#125;@&#123;cloud_name&#125;</code>
                        que aparece en <strong>Settings → API Keys</strong> de Cloudinary y pégalo en tu archivo
                        <code>.env</code> como <code>VITE_CLOUDINARY_URL</code> sin dejar llaves, corchetes ni textos de ejemplo.
                      </small>
                    )}
                    {avatarError && (
                      <small style={errorText}>{avatarError}</small>
                    )}
                  </>
                ) : (
                  <small style={{ color: "var(--text-tertiary)" }}>
                    Esta imagen se mostrará en toda la aplicación.
                  </small>
                )}
              </div>
            </div>

            <div style={row}>
              <div style={labelCol}>
                <span className="label">Información básica</span>
              </div>
            </div>
            <div style={rowsGrid}>
              <div>
                <span className="label">Nombre</span>
                <div className="input" style={readOnlyInput}>{profileSnapshot.name}</div>
              </div>
              <div>
                <span className="label">Email</span>
                <div className="input" style={readOnlyInput}>{profileSnapshot.email || "-"}</div>
              </div>
              <div>
                <span className="label">Usuario</span>
                <div className="input" style={readOnlyInput}>{profileSnapshot.username || "-"}</div>
              </div>
            </div>

            <div style={{ marginTop: "1.25rem", marginBottom: ".5rem", display: "flex", alignItems: "center", gap: ".5rem" }}>
              <span className="label" style={{ margin: 0 }}>Datos físicos</span>
            </div>

            {isEditing ? (
              <div style={rowsGrid}>
                <div>
                  <span className="label">Sexo</span>
                  <select className="input" value={sex} onChange={(e) => setSex(e.target.value as Sex)}>
                    <option value="male">Hombre</option>
                    <option value="female">Mujer</option>
                  </select>
                </div>
                <div>
                  <span className="label">Edad (años)</span>
                  <input
                    className="input"
                    type="number"
                    value={age || ""}
                    onChange={(e) => setAge(Number(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <span className="label">Altura (cm)</span>
                  <input
                    className="input"
                    type="number"
                    value={heightCm || ""}
                    onChange={(e) => setHeightCm(Number(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <span className="label">Peso (kg)</span>
                  <input
                    className="input"
                    type="number"
                    value={weightKg || ""}
                    onChange={(e) => setWeightKg(Number(e.target.value) || 0)}
                  />
                </div>
              </div>
            ) : (
              <div style={rowsGrid}>
                <div>
                  <span className="label">Sexo</span>
                  <div className="input" style={readOnlyInput}>{sex === "male" ? "Hombre" : "Mujer"}</div>
                </div>
                <div>
                  <span className="label">Edad (años)</span>
                  <div className="input" style={readOnlyInput}>{age}</div>
                </div>
                <div>
                  <span className="label">Altura (cm)</span>
                  <div className="input" style={readOnlyInput}>{heightCm} cm</div>
                </div>
                <div>
                  <span className="label">Peso (kg)</span>
                  <div className="input" style={readOnlyInput}>{weightKg} kg</div>
                </div>
              </div>
            )}

            <div style={{ marginTop: "1.25rem", marginBottom: ".5rem", display: "flex", alignItems: "center", gap: ".5rem" }}>
              <span className="label" style={{ margin: 0 }}>Actividad y Meta</span>
            </div>

            {isEditing ? (
              <div style={rowsGrid}>
                <div>
                  <span className="label">Nivel</span>
                  <select
                    className="input"
                    value={activity}
                    onChange={(e) => setActivity(normalizeActivity(e.target.value))}
                  >
                    {Object.entries(ACTIVITY_LEVELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label} · x{v.factor}
                      </option>
                    ))}
                  </select>
                  <small style={{ color: "var(--text-tertiary)" }}>
                    {ACTIVITY_LEVELS[activity].help} — Multiplicador {ACTIVITY_LEVELS[activity].factor.toFixed(3)}
                  </small>
                </div>

                <div>
                  <span className="label">BMR estimado</span>
                  <div className="input" style={readOnlyInput}>{bmr} kcal</div>
                </div>

                <div>
                  <span className="label">TDEE sugerido</span>
                  <div className="input" style={readOnlyInput}>{tdeeSuggested} kcal</div>
                </div>

                <div>
                  <span className="label">Meta diaria (TDEE en kcal)</span>
                  <input
                    className="input"
                    type="number"
                    value={targetKcal || ""}
                    onChange={(e) => setTargetKcal(Number(e.target.value) || 0)}
                  />
                </div>
              </div>
            ) : (
              <div style={rowsGrid}>
                <div>
                  <span className="label">Nivel</span>
                  <div className="input" style={readOnlyInput}>{ACTIVITY_LEVELS[activity].label}</div>
                </div>
                <div>
                  <span className="label">BMR estimado</span>
                  <div className="input" style={readOnlyInput}>{bmr} kcal</div>
                </div>
                <div>
                  <span className="label">TDEE sugerido</span>
                  <div className="input" style={readOnlyInput}>{tdeeSuggested} kcal</div>
                </div>
                <div>
                  <span className="label">Meta diaria (TDEE)</span>
                  <div className="input" style={readOnlyInput}>{targetKcal} kcal</div>
                </div>
              </div>
            )}

            <div style={{ marginTop: "1.25rem" }}>
              <span className="label">Reparto de macros (%)</span>
              {isEditing ? (
                <div style={rowsGrid}>
                  <div>
                    <span className="label">Carbohidratos</span>
                    <input
                      className="input"
                      type="number"
                      value={carbPct || ""}
                      onChange={(e) => setCarbPct(Number(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <span className="label">Proteína</span>
                    <input
                      className="input"
                      type="number"
                      value={protPct || ""}
                      onChange={(e) => setProtPct(Number(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <span className="label">Grasa</span>
                    <input
                      className="input"
                      type="number"
                      value={fatPct || ""}
                      onChange={(e) => setFatPct(Number(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <span className="label">Total</span>
                    <div className="input" style={readOnlyInput}>{pctTotal}%</div>
                  </div>
                </div>
              ) : (
                <div style={rowsGrid}>
                  <div>
                    <span className="label">Carbohidratos</span>
                    <div className="input" style={readOnlyInput}>{carbPct}%</div>
                  </div>
                  <div>
                    <span className="label">Proteína</span>
                    <div className="input" style={readOnlyInput}>{protPct}%</div>
                  </div>
                  <div>
                    <span className="label">Grasa</span>
                    <div className="input" style={readOnlyInput}>{fatPct}%</div>
                  </div>
                  <div>
                    <span className="label">Total</span>
                    <div className="input" style={readOnlyInput}>{pctTotal}%</div>
                  </div>
                </div>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "1rem",
                  marginTop: "1rem",
                }}
              >
                <div className="card" style={{ padding: "1rem" }}>
                  <div className="label" style={{ marginBottom: ".25rem" }}>Carbohidratos (g/día)</div>
                  <strong>{carbGr} g</strong>
                </div>
                <div className="card" style={{ padding: "1rem" }}>
                  <div className="label" style={{ marginBottom: ".25rem" }}>Proteína (g/día)</div>
                  <strong>{protGr} g</strong>
                </div>
                <div className="card" style={{ padding: "1rem" }}>
                  <div className="label" style={{ marginBottom: ".25rem" }}>Grasa (g/día)</div>
                  <strong>{fatGr} g</strong>
                </div>
              </div>
            </div>

            {isEditing && (
              <div
                style={{
                  display: "flex",
                  gap: ".75rem",
                  marginTop: "1.5rem",
                  flexWrap: "wrap",
                  borderTop: "1px solid var(--border)",
                  paddingTop: "1.5rem",
                }}
              >
                <button className="btn btn-primary" onClick={handleSave}>
                  Guardar cambios
                </button>
                <button className="btn btn-secondary" onClick={handleCancelEdit}>
                  <X size={16} style={{ marginRight: "0.25rem" }} />
                  Cancelar
                </button>
              </div>
            )}
          </section>

          <section className="card" style={{ background: "var(--surface-elevated)" }}>
            <h3 style={{ marginBottom: "1rem" }}>Sesión</h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>
              Control de acceso. Puedes cerrar sesión de forma segura. Tus datos quedan guardados localmente.
            </p>
            <button className="btn btn-danger" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Settings;

const navLinkStyle: React.CSSProperties = {
  width: 44,
  height: 44,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 12,
  color: "var(--text-secondary)",
  transition: "var(--transition)",
};

const gridTwoCols: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "1.5rem",
};

const row: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between" };

const labelCol: React.CSSProperties = { display: "flex", alignItems: "center", gap: ".5rem" };

const rowsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "1rem",
  marginTop: ".5rem",
};

const readOnlyInput: React.CSSProperties = {
  background: "var(--surface)",
  pointerEvents: "none",
  userSelect: "none",
  padding: "0.5rem 0.75rem",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  color: "var(--text)",
  lineHeight: "1.5",
  fontSize: "0.875rem",
};

const avatarRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "1rem",
  marginBottom: "1.5rem",
  flexWrap: "wrap",
};

const helperText: React.CSSProperties = {
  color: "var(--text-tertiary)",
  display: "block",
  marginTop: "0.5rem",
};

const errorText: React.CSSProperties = {
  color: "var(--status-error, #ef4444)",
  display: "block",
  marginTop: "0.5rem",
};
