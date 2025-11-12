import React, { useEffect, useState } from "react";
import { Link, NavigateFunction, useNavigate } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import styles from "./Login.module.css";
import { getAuthErrorMessage } from "@/utils/firebaseErrors";
import { getDailyQuoteCachedES } from "@/lib/dailyQuote";

const carouselImages = [ "/image/login-1.png", "/image/login-2.jpg", "/image/login-3.jpg" ];

type PendingSplash = {
  text: string;
  next: string;
  durationMs: number;
} | null;

export default function Login() {
  const navigate: NavigateFunction = useNavigate();
  const { login, isAuthenticated, needsProfile } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [slide, setSlide] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🟢 Nuevo: guardamos “lo que el splash necesita” y navegamos cuando la sesión esté lista
  const [pendingSplash, setPendingSplash] = useState<PendingSplash>(null);

  // Si ya está autenticado, vete directo (en caso de entrar a /login logueado)
  useEffect(() => {
    if (!isAuthenticated) return;
    if (pendingSplash) {
      // venimos de un login recién hecho: ahora sí navega al splash
      navigate("/splash", {
        replace: true,
        state: { ...pendingSplash, from: "login" },
      });
      setPendingSplash(null);
      return;
    }
    // sesión ya existente
    navigate(needsProfile ? "/registro" : "/dashboard");
  }, [isAuthenticated, needsProfile, navigate, pendingSplash]);

  // Carrusel
  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % carouselImages.length), 4500);
    return () => clearInterval(id);
  }, []);

  // Prefetch silencioso de la frase del día
  useEffect(() => {
    getDailyQuoteCachedES().catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const ok = await login(email, password, remember);
      if (!ok) {
        setIsSubmitting(false);
        setError("Correo o contraseña incorrectos");
        return;
      }

      // Prepara la frase y el destino, pero NO navegues aún
      let text = "Tu constancia construye tu meta.";
      try { text = await getDailyQuoteCachedES(); } catch {}
      const next = needsProfile ? "/registro" : "/dashboard";

      // 🟢 Guardar intención de splash; el useEffect de arriba navegará
      setPendingSplash({ text, next, durationMs: 5000 });
      // No seteamos false aquí; dejamos el botón en “Procesando…” un instante hasta que cambie la ruta
    } catch (err) {
      setIsSubmitting(false);
      setError(
        getAuthErrorMessage(
          err,
          "Ocurrió un error inesperado al iniciar sesión. Vuelve a intentarlo."
        )
      );
    }
  };

  const disabled = isSubmitting;

  return (
    <div className={styles.pageSplit}>
      <aside className={styles.mediaPanel}>
        {carouselImages.map((src, i) => (
          <img key={src} src={src} alt=""
            className={`${styles.slide} ${i === slide ? styles.slideActive : ""}`} />
        ))}
        <div className={styles.mediaOverlay} />
        <div className={styles.mediaCaption}>
          <h3>Kaloris</h3>
          <p>Convierte cada bocado en tu progreso</p>
        </div>
        <div className={styles.dots}>
          {carouselImages.map((_, i) => (
            <button key={i}
              className={`${styles.dot} ${i === slide ? styles.dotActive : ""}`}
              onClick={() => setSlide(i)} aria-label={`Ir a imagen ${i + 1}`} disabled={disabled}/>
          ))}
        </div>
      </aside>

      <main className={styles.formPanel}>
        <div className={styles.card}>
          <img src="/image/LogoK.png" alt="Logo" className={styles.logoImg} />
          <header className={styles.header}>
            <h1>Bienvenido</h1>
            <p>Inicia sesión para continuar</p>
          </header>

          <form className={styles.form} onSubmit={handleSubmit} noValidate aria-busy={disabled}>
            <label htmlFor="email">Correo</label>
            <div className={styles.field}>
              <input id="email" type="email" className={styles.input} placeholder="tucorreo@gmail.com"
                     value={email} onChange={(e) => setEmail(e.target.value)}
                     autoComplete="email" required disabled={disabled}/>
            </div>

            <label htmlFor="password">Contraseña</label>
            <div className={styles.field}>
              <input id="password" type={showPwd ? "text" : "password"} className={styles.input}
                     value={password} onChange={(e) => setPassword(e.target.value)}
                     autoComplete="current-password" required disabled={disabled}/>
              <button type="button" className={styles.eye}
                      onClick={() => setShowPwd((v) => !v)}
                      aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                      disabled={disabled}>
                {showPwd ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2"/>
                    <path d="M10.6 10.6A3 3 0 0012 15a3 3 0 002.4-4.4M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
                          stroke="currentColor" strokeWidth="2" fill="none"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
                          stroke="currentColor" strokeWidth="2" fill="none"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
                  </svg>
                )}
              </button>
            </div>

            <label className={styles.checkbox}>
              <input type="checkbox" checked={remember}
                     onChange={(e) => setRemember(e.target.checked)} disabled={disabled}/>
              Recordar sesión
            </label>

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" className={styles.cta} disabled={disabled}>
              <span className={styles.ctaIcon} aria-hidden>↪</span>
              {disabled ? "Procesando…" : "Ingresar"}
            </button>
          </form>

          <footer className={styles.footer}>
            ¿No tienes cuenta? <Link to="/register">Crear cuenta</Link>
            <br />
            <a href="#" className={styles.forgot}>¿Olvidaste tu contraseña?</a>
          </footer>
        </div>
      </main>
    </div>
  );
}

