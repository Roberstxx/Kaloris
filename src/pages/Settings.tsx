// src/pages/Settings.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/ui/AppHeader";
import UserAvatar from "@/components/UserAvatar";
import { useSession } from "@/context/SessionContext";
import type { ActivityLevel, Sex } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"; // Importa los componentes de alerta

import styles from "./Settings.module.css";

/* =========================================================
   Utilidades de notificación y protección de navegación
   ========================================================= */

/** Hook de toast simple (sin dependencias externas) */
function useToast() {
  const [msg, setMsg] = React.useState<string | null>(null);

  const push = React.useCallback((text: string, ms = 2200) => {
    setMsg(text);
    // limpiar cualquier timeout previo
    window.clearTimeout((push as any)._t);
    (push as any)._t = window.setTimeout(() => setMsg(null), ms);
  }, []);

  return { msg, push };
}

/** Hook para advertir cierre/recarga si hay cambios sin guardar */
function useBeforeUnload(when: boolean) {
  React.useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!when) return;
      e.preventDefault();
      e.returnValue = ""; // obliga a mostrar el diálogo nativo
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [when]);
}

/* =========================================================
   Component
   ========================================================= */

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentario: "Sedentario",
  ligero: "Ligero",
  moderado: "Moderado",
  intenso: "Intenso",
  muy_intenso: "Muy intenso",
};

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, updateProfile, logout } = useSession();

  React.useEffect(() => {
    if (!isAuthenticated) navigate("/login");
  }, [isAuthenticated, navigate]);

  // ===== Snapshot de usuario (estado base) =====
  const snapshot = React.useMemo(() => {
    return {
      avatarUrl: user?.avatarUrl ?? "",
      name: user?.name ?? "",
      email: user?.email ?? "",
      username: user?.username ?? "",
      sex: (user?.sex as Sex) ?? "male",
      age: Number(user?.age ?? 21),
      heightCm: Number(user?.heightCm ?? 170),
      weightKg: Number(user?.weightKg ?? 70),
      activity: (user?.activity as ActivityLevel) ?? "moderado",
      tdee: Number(user?.tdee ?? 2000),
      macros: {
        carbPct: Number(user?.macros?.carbPct ?? 50),
        protPct: Number(user?.macros?.protPct ?? 25),
        fatPct: Number(user?.macros?.fatPct ?? 25),
      },
    };
  }, [user]);

  // ===== Estado editable (igual a tu versión original) =====
  const [avatarUrl, setAvatarUrl] = React.useState<string>(snapshot.avatarUrl);
  const [sex, setSex] = React.useState<Sex>(snapshot.sex);
  const [age, setAge] = React.useState<number>(snapshot.age);
  const [heightCm, setHeightCm] = React.useState<number>(snapshot.heightCm);
  const [weightKg, setWeightKg] = React.useState<number>(snapshot.weightKg);
  const [activity, setActivity] = React.useState<ActivityLevel>(snapshot.activity);
  const [tdee, setTdee] = React.useState<number>(snapshot.tdee);
  const [carbPct, setCarbPct] = React.useState<number>(snapshot.macros.carbPct);
  const [protPct, setProtPct] = React.useState<number>(snapshot.macros.protPct);
  const [fatPct, setFatPct] = React.useState<number>(snapshot.macros.fatPct);

  // ===== Modo edición (como tenías) =====
  const [isEditing, setIsEditing] = React.useState(false);

  // ===== Toast + dirty =====
  const { msg: toast, push: pushToast } = useToast();
  const [dirty, setDirty] = React.useState(false);
  const firstDirtyShown = React.useRef(false);

  // Estado para controlar el diálogo de alerta
  const [showLogoutDialog, setShowLogoutDialog] = React.useState(false);

  // Determinar si hay cambios respecto al snapshot
  React.useEffect(() => {
    const changed =
      avatarUrl !== snapshot.avatarUrl ||
      sex !== snapshot.sex ||
      age !== snapshot.age ||
      heightCm !== snapshot.heightCm ||
      weightKg !== snapshot.weightKg ||
      activity !== snapshot.activity ||
      tdee !== snapshot.tdee ||
      carbPct !== snapshot.macros.carbPct ||
      protPct !== snapshot.macros.protPct ||
      fatPct !== snapshot.macros.fatPct;

    setDirty(changed && isEditing);
  }, [
    isEditing,
    avatarUrl,
    sex,
    age,
    heightCm,
    weightKg,
    activity,
    tdee,
    carbPct,
    protPct,
    fatPct,
    snapshot,
  ]);

  // Mostrar aviso la primera vez que se ensucia el formulario
  React.useEffect(() => {
    if (dirty && !firstDirtyShown.current) {
      pushToast("Tienes cambios sin guardar.");
      firstDirtyShown.current = true;
    }
    if (!dirty) firstDirtyShown.current = false;
  }, [dirty, pushToast]);

  // Proteger cierre/recarga con cambios sin guardar
  useBeforeUnload(dirty);

  // ===== Handlers =====
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handlePickFile = () => fileInputRef.current?.click();

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite volver a seleccionar la misma imagen
    if (!file) return;

    // Solo previsualiza y marca como sucio; NO guarda aún (sin autosave)
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarUrl(String(reader.result || ""));
      pushToast("Imagen cargada. No olvides guardar los cambios.");
      setIsEditing(true); // si no estaba en edición, entra
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (carbPct + protPct + fatPct !== 100) {
      pushToast("El reparto de macros debe sumar 100%.");
      return;
    }

    const next = {
      avatarUrl,
      sex,
      age,
      heightCm,
      weightKg,
      activity,
      tdee,
      macros: { carbPct, protPct, fatPct },
    };

    await updateProfile(next);
    pushToast("Cambios guardados ✅");
    setIsEditing(false);
  };

  const handleCancel = () => {
    setAvatarUrl(snapshot.avatarUrl);
    setSex(snapshot.sex);
    setAge(snapshot.age);
    setHeightCm(snapshot.heightCm);
    setWeightKg(snapshot.weightKg);
    setActivity(snapshot.activity);
    setTdee(snapshot.tdee);
    setCarbPct(snapshot.macros.carbPct);
    setProtPct(snapshot.macros.protPct);
    setFatPct(snapshot.macros.fatPct);
    pushToast("Cambios descartados");
    setIsEditing(false);
  };

  // Handler de confirmación del diálogo
  const handleConfirmLogout = () => {
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
              Editar Perfil
            </button>
          ) : (
            <span style={{ color: "var(--text-tertiary)" }}>
              Estás editando. No olvides guardar los cambios.
            </span>
          )}
        </div>

        <section className="card" style={{ background: "var(--surface-elevated)", marginBottom: "1rem" }}>
          <h3 style={{ marginBottom: "1rem" }}>Perfil</h3>

          {/* Avatar */}
          <div style={{ display: "flex", alignItems: "center", gap: ".75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            <UserAvatar
              src={avatarUrl}
              name={user.name}
              username={user.username}
              size={64}
              style={{
                border: "2px solid var(--border)",
                backgroundColor: "var(--surface)",
                boxShadow: "0 2px 6px rgb(15 23 42 / 0.08)",
              }}
              imageStyle={{ width: "100%", height: "100%", objectFit: "cover" }}
              fallbackStyle={{
                fontSize: ".75rem",
                fontWeight: 600,
                letterSpacing: "0.02em",
                textTransform: "uppercase",
                color: "var(--text-secondary)",
              }}
            />

            <div style={{ flex: 1 }}>
              <span className="label" style={{ display: "block", marginBottom: ".25rem" }}>
                Foto de perfil
              </span>

              <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleAvatarFile}
                />

                <button className="btn btn-secondary" type="button" onClick={handlePickFile}>
                  Cambiar foto
                </button>

                {avatarUrl && isEditing && (
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => setAvatarUrl("")}
                  >
                    Quitar
                  </button>
                )}
              </div>

              <small style={{ color: "var(--text-tertiary)", display: "block", marginTop: ".5rem" }}>
                Esta imagen se mostrará en toda la aplicación.
              </small>
            </div>
          </div>

          {/* Información básica (solo lectura, como tenías) */}
          <div style={grid}>
            <div>
              <span className="label">Nombre</span>
              <div className="input" style={readonly}>{user.name || "-"}</div>
            </div>
            <div>
              <span className="label">Email</span>
              <div className="input" style={readonly}>{user.email || "-"}</div>
            </div>
            <div>
              <span className="label">Usuario</span>
              <div className="input" style={readonly}>{user.username || "-"}</div>
            </div>
          </div>
        </section>

        {/* Datos físicos */}
        <section className="card" style={{ background: "var(--surface-elevated)", marginBottom: "1rem" }}>
          <h3 style={{ marginBottom: "1rem" }}>Datos físicos</h3>

          {isEditing ? (
            <div style={grid}>
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
            <div style={grid}>
              <div>
                <span className="label">Sexo</span>
                <div className="input" style={readonly}>{sex === "male" ? "Hombre" : "Mujer"}</div>
              </div>
              <div>
                <span className="label">Edad</span>
                <div className="input" style={readonly}>{age}</div>
              </div>
              <div>
                <span className="label">Altura</span>
                <div className="input" style={readonly}>{heightCm} cm</div>
              </div>
              <div>
                <span className="label">Peso</span>
                <div className="input" style={readonly}>{weightKg} kg</div>
              </div>
            </div>
          )}
        </section>

        {/* Actividad, TDEE y Macros */}
        <section className="card" style={{ background: "var(--surface-elevated)" }}>
          <h3 style={{ marginBottom: "1rem" }}>Actividad y meta</h3>

          {isEditing ? (
            <>
              <div style={grid}>
                <div>
                  <span className="label">Actividad</span>
                  <select className="input" value={activity} onChange={(e) => setActivity(e.target.value as ActivityLevel)}>
                    {Object.entries(ACTIVITY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="label">Meta diaria (TDEE, kcal)</span>
                  <input className="input" type="number" value={tdee || ""} onChange={(e) => setTdee(Number(e.target.value) || 0)} />
                </div>
              </div>

              <div style={{ marginTop: "1rem" }}>
                <span className="label">Reparto de macros (%)</span>
                <div style={grid}>
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
                    <div className="input" style={readonly}>{carbPct + protPct + fatPct}%</div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: ".75rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
                <button className="btn btn-primary" onClick={handleSave}>Guardar cambios</button>
                <button className="btn btn-secondary" onClick={handleCancel}>Cancelar</button>
              </div>
            </>
          ) : (
            <>
              <div style={grid}>
                <div>
                  <span className="label">Actividad</span>
                  <div className="input" style={readonly}>{ACTIVITY_LABELS[activity]}</div>
                </div>
                <div>
                  <span className="label">Meta diaria (TDEE)</span>
                  <div className="input" style={readonly}>{tdee} kcal</div>
                </div>
              </div>

              <div style={{ marginTop: "1rem" }}>
                <span className="label">Reparto de macros (%)</span>
                <div style={grid}>
                  <div>
                    <span className="label">Carbohidratos</span>
                    <div className="input" style={readonly}>{carbPct}%</div>
                  </div>
                  <div>
                    <span className="label">Proteína</span>
                    <div className="input" style={readonly}>{protPct}%</div>
                  </div>
                  <div>
                    <span className="label">Grasa</span>
                    <div className="input" style={readonly}>{fatPct}%</div>
                  </div>
                  <div>
                    <span className="label">Total</span>
                    <div className="input" style={readonly}>{carbPct + protPct + fatPct}%</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>

        {/* 👈 SECCIÓN DE SESIÓN CORREGIDA */}
        <section className="card" style={{ background: "var(--surface-elevated)", marginTop: "1rem" }}>
          <h3 style={{ marginBottom: "1rem" }}>Sesión</h3>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>
            Puedes cerrar sesión de forma segura. Tus datos quedarán guardados localmente.
          </p>
          
          <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
            <AlertDialogTrigger asChild>
              {/* Este botón ahora SÓLO abre el diálogo */}
              <button
                className="btn btn-danger"
                onClick={() => setShowLogoutDialog(true)}
              >
                Cerrar sesión
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro de cerrar sesión?</AlertDialogTitle>
                <AlertDialogDescription>
                  {/* Mensaje condicional si hay cambios sin guardar */}
                  {dirty && (
                    <strong style={{ color: "var(--warning)", display: "block", marginBottom: "0.5rem" }}>
                      ¡Atención! Tienes cambios sin guardar que se perderán.
                    </strong>
                  )}
                  Se te redirigirá a la pantalla de inicio de sesión.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                {/* Botón de Cancelar (usa tu clase .btn-secondary) */}
                <AlertDialogCancel className="btn btn-secondary"> 
                  Cancelar
                </AlertDialogCancel>
                {/* Botón de Confirmar (usa tu clase .btn-danger) */}
                <AlertDialogAction
                  className="btn btn-danger" 
                  onClick={handleConfirmLogout} // Llama al handler simple de logout
                >
                  {dirty ? "Descartar cambios y Salir" : "Sí, cerrar sesión"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>
      </main>

      {/* Toast */}
      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
};

export default Settings;

/* ====== estilos inline usados arriba (mantén tu CSS como prefieras) ====== */

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "1rem",
};

const readonly: React.CSSProperties = {
  background: "var(--surface)",
  pointerEvents: "none",
  userSelect: "none",
  padding: "0.5rem 0.75rem",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  color: "var(--text)",
  lineHeight: 1.5,
  fontSize: "0.875rem",
};
