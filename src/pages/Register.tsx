import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import styles from "./Login.module.css";
import { getAuthErrorMessage } from "@/utils/firebaseErrors";

const carouselImages = [
  // 🔁 Sustituye por tus rutas reales
  "/src/assets/login-1.png",
  "/src/assets/login-2.jpg",
  "/src/assets/login-3.jpg",
];

export default function Register() {
  const navigate = useNavigate();
  const { register: registerUser, isAuthenticated, needsProfile } = useSession();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd1, setShowPwd1] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setSlide((s) => (s + 1) % carouselImages.length),
      4500
    );
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    navigate(needsProfile ? "/registro" : "/dashboard", { replace: true });
  }, [isAuthenticated, needsProfile, navigate]);

  const validate = () => {
    if (!name.trim()) return "El nombre es obligatorio.";
    if (!email.trim()) return "El email es obligatorio.";
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) return "El email no es válido.";
    if (password.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
    if (password !== confirm) return "Las contraseñas no coinciden.";
    return "";
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = validate();
    if (msg) { setError(msg); return; }
    setError("");
    setLoading(true);
    try {
      const ok = await registerUser({ name, username, email, password });
      if (!ok) throw new Error("No se pudo crear la cuenta.");
      navigate("/registro", { replace: true });
    } catch (err: unknown) {
      setError(
        getAuthErrorMessage(
          err,
          "Ocurrió un error al crear la cuenta. Inténtalo de nuevo."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageSplit}>
      <aside className={styles.mediaPanel}>
        {carouselImages.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            className={`${styles.slide} ${i === slide ? styles.slideActive : ""}`}
          />
        ))}
        <div className={styles.mediaOverlay} />
        <div className={styles.mediaCaption}>
          <h3>Join us</h3>
          <p>Start tracking your calories</p>
        </div>
        <div className={styles.dots}>
          {carouselImages.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === slide ? styles.dotActive : ""}`}
              onClick={() => setSlide(i)}
              aria-label={`Ir a imagen ${i + 1}`}
            />
          ))}
        </div>
      </aside>

      <main className={styles.formPanel}>
        <div className={styles.card}>
          <header className={styles.header}>
            <h1>Crear Cuenta</h1>
            <p>Únete y comienza a controlar tus calorías</p>
          </header>

          <form className={styles.form} onSubmit={onSubmit} noValidate>
            <label htmlFor="name">Nombre</label>
            <div className={styles.field}>
              <input
                id="name"
                type="text"
                className={styles.input}
                placeholder="Tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <label htmlFor="username">Usuario (opcional)</label>
            <div className={styles.field}>
              <input
                id="username"
                type="text"
                className={styles.input}
                placeholder="usuario123"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <label htmlFor="email">Email</label>
            <div className={styles.field}>
              <input
                id="email"
                type="email"
                className={styles.input}
                placeholder="tucorreo@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <label htmlFor="password">Contraseña</label>
            <div className={styles.field}>
              <input
                id="password"
                type={showPwd1 ? "text" : "password"}
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className={styles.eye}
                onClick={() => setShowPwd1((v) => !v)}
                aria-label={showPwd1 ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {/* mismo icono del login */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
              </button>
            </div>

            <label htmlFor="confirm">Confirmar Contraseña</label>
            <div className={styles.field}>
              <input
                id="confirm"
                type={showPwd2 ? "text" : "password"}
                className={styles.input}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
              <button
                type="button"
                className={styles.eye}
                onClick={() => setShowPwd2((v) => !v)}
                aria-label={showPwd2 ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
              </button>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" className={styles.cta} disabled={loading}>
              <span className={styles.ctaIcon} aria-hidden>👤</span>
              {loading ? "Creando..." : "Crear Cuenta"}
            </button>
          </form>

          <footer className={styles.footer}>
            ¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
          </footer>
        </div>
      </main>
    </div>
  );
}
