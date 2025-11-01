import React, { useEffect, useState } from "react";
import { FirebaseError } from "firebase/app";
import { Link, NavigateFunction, useNavigate } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import styles from "./Login.module.css";

const carouselImages = [
  // 🔁 Sustituye por tus rutas reales
  "/src/assets/login-1.png",
  "/src/assets/login-2.jpg",
  "/src/assets/login-3.jpg",
];

export default function Login() {
  const navigate: NavigateFunction = useNavigate();
  const { login, isAuthenticated } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, navigate]);

  // ⏱️ Carrusel simple (no cambia tu UI del form)
  useEffect(() => {
    const id = setInterval(
      () => setSlide((s) => (s + 1) % carouselImages.length),
      4500
    );
    return () => clearInterval(id);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const ok = await login(email, password, remember);
      if (ok) {
        navigate("/dashboard");
      } else {
        setError("Correo o contraseña incorrectos");
      }
    } catch (err) {
      let message = "No se pudo iniciar sesión. Inténtalo de nuevo.";

      if (err instanceof FirebaseError) {
        switch (err.code) {
          case "auth/user-not-found":
            message = "No encontramos una cuenta con ese correo. Regístrate para continuar.";
            break;
          case "auth/wrong-password":
            message = "La contraseña no coincide con el correo ingresado.";
            break;
          case "auth/invalid-credential":
            message = "El correo o la contraseña no son correctos.";
            break;
          case "auth/invalid-email":
            message = "El correo que ingresaste no es válido.";
            break;
          default:
            message = "Ocurrió un error inesperado al iniciar sesión. Vuelve a intentarlo.";
        }
      } else if (err instanceof Error) {
        message = "Ocurrió un error inesperado al iniciar sesión. Vuelve a intentarlo.";
      }

      setError(message);
    }
  };

  return (
    <div className={styles.pageSplit}>
      {/* Panel visual (50%) */}
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
          <h3>AI Generative</h3>
          <p>Anything you can Imagine</p>
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

      {/* Panel del formulario (50%) */}
      <main className={styles.formPanel}>
        <div className={styles.card}>
          {/* Logo real */}
          <img src="/src/assets/LogoK.png" alt="Logo" className={styles.logoImg} />

          <header className={styles.header}>
            <h1>Bienvenido</h1>
            <p>Inicia sesión para continuar</p>
          </header>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <label htmlFor="email">Correo</label>
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
                type={showPwd ? "text" : "password"}
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className={styles.eye}
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPwd ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" />
                    <path
                      d="M10.6 10.6A3 3 0 0012 15a3 3 0 002.4-4.4M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                    />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="3"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                    />
                  </svg>
                )}
              </button>
            </div>

            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Recordar sesión
            </label>

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" className={styles.cta}>
              <span className={styles.ctaIcon} aria-hidden>
                ↪
              </span>
              Ingresar
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
