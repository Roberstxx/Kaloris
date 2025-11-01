// src/pages/Settings.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Home, History, Settings as SettingsIcon, Edit, X } from 'lucide-react'; // Iconos añadidos
import { useSession } from '../context/SessionContext';

type Sex = 'male' | 'female';
type ActivityKey = 'sedentary' | 'light' | 'moderate' | 'intense' | 'athlete';

const ACTIVITY_LEVELS: Record<ActivityKey, { label: string; factor: number; help: string }> = {
  sedentary: { label: 'Sedentario', factor: 1.20, help: 'Poco o nada de ejercicio' },
  light:     { label: 'Ligera',     factor: 1.375, help: 'Ejercicio 1–3 veces/sem' },
  moderate:  { label: 'Moderada',   factor: 1.55,  help: 'Ejercicio 3–5 veces/sem' },
  intense:   { label: 'Intensa',    factor: 1.725, help: 'Entrenos duros 6–7/sem' },
  athlete:   { label: 'Atleta',     factor: 1.90,  help: 'Doble sesión o trabajo físico' },
};

// Fallback suave por si el contexto aún no tiene updateUser/logout.
type MaybeFn<T extends any[]> = ((...args: T) => void) | undefined;

export default function Settings() {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateUser, logout } = useSession() as {
    user: any,
    isAuthenticated: boolean,
    updateUser: MaybeFn<[any]>,
    logout: MaybeFn<[]>
  };

  // --- NUEVO: Estado de Edición ---
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => { if (!isAuthenticated) navigate('/login'); }, [isAuthenticated, navigate]);
  if (!user) return null;

  // ---- Estado editable ----
  const [name] = useState<string>(user.name || '');
  const [email] = useState<string>(user.email || user.username || '');
  // Datos físicos
  const [sex, setSex] = useState<Sex>(user.sex || 'male');
  const [age, setAge] = useState<number>(Number(user.age ?? 21));
  const [height, setHeight] = useState<number>(Number(user.height ?? 170)); // cm
  const [weight, setWeight] = useState<number>(Number(user.weight ?? 70));  // kg
  const [activity, setActivity] = useState<ActivityKey>(user.activity || 'sedentary');

  // Meta diaria (kcal) editable.
  const [targetKcal, setTargetKcal] = useState<number>(Number(user.tdee ?? 2000));

  // Macros %
  const [carbPct, setCarbPct] = useState<number>(Number(user.macros?.carbPct ?? 50));
  const [protPct, setProtPct] = useState<number>(Number(user.macros?.protPct ?? 25));
  const [fatPct,  setFatPct]  = useState<number>(Number(user.macros?.fatPct  ?? 25));

  const pctTotal = carbPct + protPct + fatPct;

  // ---- Cálculos (sin cambios) ----
  const bmr = useMemo(() => {
    const base = 10 * weight + 6.25 * height - 5 * age;
    return Math.round((sex === 'male' ? base + 5 : base - 161));
  }, [sex, weight, height, age]);

  const tdeeSuggested = useMemo(() => {
    const factor = ACTIVITY_LEVELS[activity].factor;
    return Math.round(bmr * factor);
  }, [bmr, activity]);

  useEffect(() => {
    if (Math.abs(targetKcal - tdeeSuggested) < 50) setTargetKcal(tdeeSuggested);
  }, [tdeeSuggested]); // eslint-disable-line react-hooks/exhaustive-deps

  const carbGr = useMemo(() => Math.round((targetKcal * (carbPct / 100)) / 4), [targetKcal, carbPct]);
  const protGr = useMemo(() => Math.round((targetKcal * (protPct / 100)) / 4), [targetKcal, protPct]);
  const fatGr  = useMemo(() => Math.round((targetKcal * (fatPct  / 100)) / 9), [targetKcal, fatPct]);

  // ---- Acciones ----
  const handleSave = () => {
    if (pctTotal !== 100) {
      alert('El reparto de macros debe sumar 100%.');
      return;
    }
    const next = {
      ...user,
      name,
      email,
      sex,
      age,
      height,
      weight,
      activity,
      tdee: targetKcal,
      macros: { carbPct, protPct, fatPct }
    };

    if (typeof updateUser === 'function') {
      updateUser(next);
    } else {
      try {
        localStorage.setItem('kaloris_user', JSON.stringify(next));
      } catch {}
    }
    alert('Cambios guardados.');
    setIsEditing(false); // <-- Ocultar campos de edición
  };

  const handleCancelEdit = () => {
    // Revertir todos los estados al valor original del 'user'
    setSex(user.sex || 'male');
    setAge(Number(user.age ?? 21));
    setHeight(Number(user.height ?? 170));
    setWeight(Number(user.weight ?? 70));
    setActivity(user.activity || 'sedentary');
    setTargetKcal(Number(user.tdee ?? 2000));
    setCarbPct(Number(user.macros?.carbPct ?? 50));
    setProtPct(Number(user.macros?.protPct ?? 25));
    setFatPct(Number(user.macros?.fatPct ?? 25));
    
    setIsEditing(false); // Ocultar campos de edición
  };

  const handleLogout = () => {
    if (typeof logout === 'function') logout();
    navigate('/login');
  };

  return (
    <div>
      {/* HEADER (sin cambios) */}
      <header className="header" style={{ background: 'var(--surface-elevated)', borderBottom: '1px solid var(--border)', padding: '1rem 0', position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="container" style={{ maxWidth: '100%', width: '100%', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 className="logo" style={{ margin: 0, fontSize: '1.25rem', background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Contador de Calorías
            </h1>
            <nav style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
              <Link to="/dashboard" className="navLink" style={navLinkStyle}><Home size={20} /></Link>
              <Link to="/historial" className="navLink" style={navLinkStyle}><History size={20} /></Link>
              <Link to="/settings" className="navLink" style={navLinkStyle}><SettingsIcon size={20} /></Link>
            </nav>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem'}}>
          <h2 style={{ margin: 0 }}>Ajustes</h2>
          {/* --- BOTÓN DE EDICIÓN PRINCIPAL --- */}
          {!isEditing && (
            <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
              <Edit size={16} style={{marginRight: '0.5rem'}} />
              Editar Perfil
            </button>
          )}
        </div>


        <div style={gridTwoCols}>
          {/* Perfil + Actividad + Macros */}
          <section className="card" style={{ background: 'var(--surface-elevated)' }}>
            <h3 style={{ marginBottom: '1rem' }}>Perfil</h3>

            {/* INFO BÁSICA (siempre solo lectura) */}
            <div style={row}>
              <div style={labelCol}>
                <span className="label">Información básica</span>
              </div>
            </div>
            <div style={rowsGrid}>
              <div>
                <span className="label">Nombre</span>
                <div className="input" style={readOnlyInput}>{name}</div>
              </div>
              <div>
                <span className="label">Usuario</span>
                <div className="input" style={readOnlyInput}>{email}</div>
              </div>
            </div>

            {/* --- DATOS FÍSICOS (Condicional) --- */}
            <div style={{ marginTop: '1.25rem', marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <span className="label" style={{ margin: 0 }}>Datos físicos</span>
            </div>

            {isEditing ? (
              // --- MODO EDICIÓN ---
              <div style={rowsGrid}>
                <div>
                  <span className="label">Sexo</span>
                  <select className="input" value={sex} onChange={e => setSex(e.target.value as Sex)}>
                    <option value="male">Hombre</option>
                    <option value="female">Mujer</option>
                  </select>
                </div>
                <div>
                  <span className="label">Edad (años)</span>
                  <input className="input" type="number" value={age || ''} onChange={e => setAge(Number(e.target.value) || 0)} />
                </div>
                <div>
                  <span className="label">Altura (cm)</span>
                  <input className="input" type="number" value={height || ''} onChange={e => setHeight(Number(e.target.value) || 0)} />
                </div>
                <div>
                  <span className="label">Peso (kg)</span>
                  <input className="input" type="number" value={weight || ''} onChange={e => setWeight(Number(e.target.value) || 0)} />
                </div>
              </div>
            ) : (
              // --- MODO LECTURA ---
              <div style={rowsGrid}>
                <div>
                  <span className="label">Sexo</span>
                  <div className="input" style={readOnlyInput}>{sex === 'male' ? 'Hombre' : 'Mujer'}</div>
                </div>
                <div>
                  <span className="label">Edad (años)</span>
                  <div className="input" style={readOnlyInput}>{age}</div>
                </div>
                <div>
                  <span className="label">Altura (cm)</span>
                  <div className="input" style={readOnlyInput}>{height} cm</div>
                </div>
                <div>
                  <span className="label">Peso (kg)</span>
                  <div className="input" style={readOnlyInput}>{weight} kg</div>
                </div>
              </div>
            )}


            {/* --- ACTIVIDAD FÍSICA (Condicional) --- */}
            <div style={{ marginTop: '1.25rem', marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <span className="label" style={{ margin: 0 }}>Actividad y Meta</span>
            </div>

            {isEditing ? (
              // --- MODO EDICIÓN ---
              <div style={rowsGrid}>
                <div>
                  <span className="label">Nivel</span>
                  <select
                    className="input"
                    value={activity}
                    onChange={(e) => setActivity(e.target.value as ActivityKey)}
                  >
                    {Object.entries(ACTIVITY_LEVELS).map(([k, v]) => (
                      <option key={k} value={k}>{v.label} · x{v.factor}</option>
                    ))}
                  </select>
                  <small style={{ color: 'var(--text-tertiary)' }}>
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
                    value={targetKcal || ''}
                    onChange={e => setTargetKcal(Number(e.target.value) || 0)}
                  />
                </div>
              </div>
            ) : (
              // --- MODO LECTURA ---
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


            {/* --- MACROS (Condicional) --- */}
            <div style={{ marginTop: '1.25rem' }}>
              <span className="label">Reparto de macros (%)</span>
              {isEditing ? (
                // --- MODO EDICIÓN ---
                <div style={rowsGrid}>
                  <div>
                    <span className="label">Carbohidratos</span>
                    <input className="input" type="number" value={carbPct || ''} onChange={e => setCarbPct(Number(e.target.value) || 0)} />
                  </div>
                  <div>
                    <span className="label">Proteína</span>
                    <input className="input" type="number" value={protPct || ''} onChange={e => setProtPct(Number(e.target.value) || 0)} />
                  </div>
                  <div>
                    <span className="label">Grasa</span>
                    <input className="input" type="number" value={fatPct || ''} onChange={e => setFatPct(Number(e.target.value) || 0)} />
                  </div>
                  <div>
                    <span className="label">Total</span>
                    <div className="input" style={readOnlyInput}>{pctTotal}%</div>
                  </div>
                </div>
              ) : (
                // --- MODO LECTURA ---
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

              {/* Tarjetas de gramos (siempre visibles) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                <div className="card" style={{ padding: '1rem' }}>
                  <div className="label" style={{ marginBottom: '.25rem' }}>Carbohidratos (g/día)</div>
                  <strong>{carbGr} g</strong>
                </div>
                <div className="card" style={{ padding: '1rem' }}>
                  <div className="label" style={{ marginBottom: '.25rem' }}>Proteína (g/día)</div>
                  <strong>{protGr} g</strong>
                </div>
                <div className="card" style={{ padding: '1rem' }}>
                  <div className="label" style={{ marginBottom: '.25rem' }}>Grasa (g/día)</div>
                  <strong>{fatGr} g</strong>
                </div>
              </div>
            </div>

            {/* --- BOTONES (Condicional) --- */}
            {isEditing && (
              <div style={{ display: 'flex', gap: '.75rem', marginTop: '1.ms 5rem', flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                <button className="btn btn-primary" onClick={handleSave}>Guardar cambios</button>
                <button className="btn btn-secondary" onClick={handleCancelEdit}>
                  <X size={16} style={{marginRight: '0.25rem'}} />
                  Cancelar
                </button>
              </div>
            )}
          </section>

          {/* Sesión (sin cambios) */}
          <section className="card" style={{ background: 'var(--surface-elevated)' }}>
            <h3 style={{ marginBottom: '1rem' }}>Sesión</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Control de acceso. Puedes cerrar sesión de forma segura. Tus datos quedan guardados localmente.
            </p>
            <button className="btn btn-danger" onClick={handleLogout}>Cerrar sesión</button>
          </section>
        </div>
      </main>
    </div>
  );
}

/* === estilos inline (sin cambios) === */
const navLinkStyle: React.CSSProperties = {
  width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: 12, color: 'var(--text-secondary)', transition: 'var(--transition)'
};

const gridTwoCols: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '1.5rem'
};

const row: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between' };

const labelCol: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '.5rem' };

const rowsGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '1rem',
  marginTop: '.5rem'
};

const readOnlyInput: React.CSSProperties = {
  background: 'var(--surface)',
  pointerEvents: 'none',
  userSelect: 'none',
  /* Estos estilos son para que se vea igual que un .input pero sin serlo */
  padding: '0.5rem 0.75rem', /* Asumiendo padding de .input */
  border: '1px solid var(--border)', /* Asumiendo borde de .input */
  borderRadius: '6px', /* Asumiendo borde de .input */
  color: 'var(--text)',
  lineHeight: '1.5', /* Asumiendo altura de .input */
  fontSize: '0.875rem' /* Asumiendo fuente de .input */
};