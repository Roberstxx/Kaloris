// src/pages/Settings.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Edit, X } from "lucide-react";
import { useSession } from "../context/SessionContext";
import { ActivityLevel, Sex } from "../types";
import UserAvatar from "@/components/UserAvatar";
import { isCloudinaryConfigured, uploadImageToCloudinary } from "@/lib/cloudinary";
import AppHeader from "@/components/ui/AppHeader";
import styles from "./Settings.module.css";

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

  // --- estado de subida de avatar / avisos
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cloudinaryEnabled = useMemo(() => isCloudinaryConfigured(), []);

  // --- toast simple
  const [toast, setToast] = useState<string | null>(null);
  const pushToast = (msg: string) => {
    setToast(msg);
    window.clearTimeout((pushToast as any)._t);
    (pushToast as any)._t = window.setTimeout(() => setToast(null), 2200);
  };

  // --- dirty detector (para barra de guardado y beforeunload)
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    const snap = profileSnapshot;
    const changed =
      sex !== snap.sex ||
      age !== snap.age ||
      heightCm !== snap.heightCm ||
      weightKg !== snap.weightKg ||
      activity !== snap.activity ||
      targetKcal !== snap.tdee ||
      carbPct !== snap.macros.carbPct ||
      protPct !== snap.macros.protPct ||
      fatPct !== snap.macros.fatPct ||
      avatarUrl !== snap.avatarUrl;

    setDirty(changed && isEditing);
  }, [
    isEditing,
    sex,
    age,
    heightCm,
    weightKg,
    activity,
    targetKcal,
    carbPct,
    protPct,
    fatPct,
    avatarUrl,
    profileSnapshot,
  ]);

  // advertencia al cerrar/recargar pestaña con cambios sin guardar
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

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

  // ===================== Avatar ======================
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
      if (!nextUrl) throw new Error("La respuesta de Cloudinary no devolvió una URL válida.");

      // 1) reflejar en UI
      setAvatarUrl(nextUrl);

      // 2) AUTOSAVE inmediato (solo avatar) -> sin necesidad de “Guardar cambios”
      await updateProfile({ avatarUrl: nextUrl });
      // si estabas editando otros campos, mantenemos el modo edición, pero la foto ya quedó persistida
      pushToast("Foto de perfil actualizada ✅");
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : "No se pudo subir la imagen. Intenta nuevamente.";
      setAvatarError(message);
      pushToast("Error al subir la imagen");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void handleAvatarFile(file);
    event.target.value = "";
  };

  const handleRemoveAvatar = async () => {
    // Limpia en UI y guarda de inmediato (consistente con autosave)
    setAvatarUrl("");
    await updateProfile({ avatarUrl: "" });
    pushToast("Foto removida ✅");
  };

  // ===================== Guardar / Cancelar ======================
  const handleSave = async () => {
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
      // avatarUrl ya se guarda c/ autosave; igual lo incluimos por consistencia
      avatarUrl: avatarUrl.trim(),
    };

    await updateProfile(next);
    pushToast("Cambios guardados ✅");
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
    pushToast("Cambios descartados");
  };

  const handleLogout = () => {
    if (dirty && !confirm("Tienes cambios sin guardar. ¿Salir de todos modos?")) return;
    logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <div>
      <AppHeader />

      <main className="container" style={{ paddingTop: "2rem", paddingBottom: "3rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 style={{ margin: 0 }}>Ajustes</h2>
          {!isEditing ? (
            <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
              <Edit size={16} style={{ marginRight: "0.5rem" }} />
              Editar Perfil
            </button>
          ) : (
            <span className={styles.muted}>Los cambios se guardarán al presionar “Guardar”. La foto se guarda automáticamente.</span>
          )}
        </div>

        <div style={gridTwoCols}>
          <section className="card" style={{ background: "var(--surface-elevated)" }}>
            <h3 style={{ marginBottom: "1rem" }}>Perfil</h3>

            <div style={avatarRow}>
              <UserAvatar
                src={avatarUrl}
                name={profileSnapshot.name}
                username={profileSnapshot.username}
                size={64}
                style={avatarPreview}
                imageStyle={avatarImageStyle}
                fallbackStyle={avatarFallbackStyle}
              />
              <div style={{ flex: 1 }}>
                <span className="label" style={{ display: "block", marginBottom: ".25rem" }}>
                  Foto de perfil
                </span>

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
                    Copia <code>cloudinary://&#123;api_key&#125;:&#123;api_secret&#125;@&#123;cloud_name&#125;</code> en tu <code>.env</code> como <code>VITE_CLOUDINARY_URL</code>.
                  </small>
                )}
                {avatarError && <small style={errorText}>{avatarError}</small>}

                <small className={styles.muted} style={{ display: "block", marginTop: ".5rem" }}>
                  Consejo: la foto se guarda automáticamente al subirla ✅
                </small>
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
                  <input className="input" type="number" value={age || ""} onChange={(e) => setAge(Number(e.target.value) || 0)} />
                </div>
                <div>
                  <span className="label">Altura (cm)</span>
                  <input className="input" type="number" value={heightCm || ""} onChange={(e) => setHeightCm(Number(e.target.value) || 0)} />
                </div>
                <div>
                  <span className="label">Peso (kg)</span>
                  <input className="input" type="number" value={weightKg || ""} onChange={(e) => setWeightKg(Number(e.target.value) || 0)} />
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
                  <select className="input" value={activity} onChange={(e) => setActivity(normalizeActivity(e.target.value))}>
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
                  <input className="input" type="number" value={targetKcal || ""} onChange={(e) => setTargetKcal(Number(e.target.value) || 0)} />
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
                    <input className="input" type="number" value={carbPct || ""} onChange={(e) => setCarbPct(Number(e.target.value) || 0)} />
                  </div>
                  <div>
                    <span className="label">Proteína</span>
                    <input className="input" type="number" value={protPct || ""} onChange={(e) => setProtPct(Number(e.target.value) || 0)} />
                  </div>
                  <div>
                    <span className="label">Grasa</span>
                    <input className="input" type="number" value={fatPct || ""} onChange={(e) => setFatPct(Number(e.target.value) || 0)} />
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

          <section className={`card ${styles.session}`} style={{ background: "var(--surface-elevated)" }}>
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

      {/* Toast flotante */}
      {toast && <div className={styles.toast}>{toast}</div>}

      {/* Barra fija de guardado cuando hay cambios */}
      {isEditing && dirty && (
        <div className={styles.saveBar}>
          <span>Tienes cambios sin guardar.</span>
          <div className={styles.saveBarActions}>
            <button className="btn btn-secondary" onClick={handleCancelEdit}>Descartar</button>
            <button className="btn btn-primary" onClick={handleSave}>Guardar ahora</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;

/* ===== estilos locales usados en la página (sin los del header) ===== */
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
  gap: ".75rem",
  marginBottom: "1.5rem",
  flexWrap: "wrap",
};

const avatarPreview: React.CSSProperties = {
  flexShrink: 0,
  border: "2px solid var(--border)",
  backgroundColor: "var(--surface)",
  boxShadow: "0 2px 6px rgb(15 23 42 / 0.08)",
};

const avatarImageStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const avatarFallbackStyle: React.CSSProperties = {
  fontSize: ".75rem",
  fontWeight: 600,
  letterSpacing: "0.02em",
  textTransform: "uppercase",
  color: "var(--text-secondary)",
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
