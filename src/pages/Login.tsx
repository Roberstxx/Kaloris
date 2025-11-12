import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, NavigateFunction } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import styles from "./Login.module.css";
import { getAuthErrorMessage } from "@/utils/firebaseErrors";

const carouselImages = [
  "/image/login-1.png",
  "/image/login-2.jpg",
  "/image/login-3.jpg",
];

export default function Login() {
  const navigate: NavigateFunction = useNavigate();
  const { login, isAuthenticated, needsProfile } = useSession();

  // --- Estado original ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [slide, setSlide] = useState(0);

  // --- Loader de frase del día ---
  const [loaderOpen, setLoaderOpen] = useState(false);
  const [loaderText, setLoaderText] = useState("Tu progreso empieza con un solo paso consciente.");
  const [pendingRedirect, setPendingRedirect] = useState(false);
  const closeTimer = useRef<number | null>(null);

  // --- Bloqueo de navegación para evitar la condición de carrera ---
  const blockNav = useRef(false);

  // Carrusel (sin cambios)
  useEffect(() => {
    const id = window.setInterval(
      () => setSlide((s) => (s + 1) % carouselImages.length),
      4500
    );
    return () => clearInterval(id);
  }, []);

  // Navegación automática original, ahora bloqueada si el loader está activo o si blockNav está levantado
  useEffect(() => {
    if (!isAuthenticated) return;
    if (blockNav.current || loaderOpen || pendingRedirect) return;
    navigate(needsProfile ? "/registro" : "/dashboard");
  }, [isAuthenticated, needsProfile, navigate, loaderOpen, pendingRedirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Bloquea navegación automática APENAS se intenta loguear
    blockNav.current = true;

    try {
      const ok = await login(email, password, remember);
      if (!ok) {
        blockNav.current = false;
        setError("Correo o contraseña incorrectos");
        return;
      }

      // Login OK → muestra loader y pide frase
      setPendingRedirect(true);
      setLoaderText("Cargando tu frase del día…");
      setLoaderOpen(true);

      try {
        const frase = await getDailyQuote();
        if (frase) setLoaderText(frase);
      } catch {
        setLoaderText("Tu constancia construye tu meta.");
      }

      // Cierre automático (~4s; respeta reduce motion)
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const ms = prefersReduced ? 1000 : 4000;
      closeTimer.current = window.setTimeout(() => handleCloseLoader(), ms);

    } catch (err) {
      blockNav.current = false;
      setError(
        getAuthErrorMessage(
          err,
          "Ocurrió un error inesperado al iniciar sesión. Vuelve a intentarlo."
        )
      );
    }
  };

  const handleCloseLoader = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setLoaderOpen(false);
    setPendingRedirect(false);
    blockNav.current = false; // liberar navegación

    // Redirige según tu estado real
    navigate(needsProfile ? "/registro" : "/dashboard");
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
          <h3>Kaloris</h3>
          <p>Convierte cada bocado en tu progreso</p>
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
          <img src="/image/LogoK.png" alt="Logo" className={styles.logoImg} />

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
                autoComplete="email"
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
                autoComplete="current-password"
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

      {/* ====== LOADER OVERLAY (minimal) ====== */}
      {loaderOpen && (
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="quote-text"
          style={loaderStyles.screen}
        >
          <header style={loaderStyles.topbar}>
            <span aria-label="Nombre de la app" style={loaderStyles.brand}>Kaloris</span>
            <span aria-hidden="true"></span>
          </header>

          <main style={loaderStyles.content}>
            <h1 id="quote-text" style={loaderStyles.quote}>
              <span>
                <mark style={loaderStyles.mark}>{loaderText}</mark>
              </span>
            </h1>
            <p style={loaderStyles.meta}>{formatToday()}</p>
          </main>

          <button
            type="button"
            aria-label="Saltar introducción"
            onClick={handleCloseLoader}
            style={loaderStyles.skip}
          >
            Saltar
          </button>

          <div aria-hidden="true" style={loaderStyles.progressWrap}>
            <i
              style={{
                ...loaderStyles.progressBar,
                animation: `fill 4000ms cubic-bezier(.22,.61,.36,1) forwards`,
              }}
            />
          </div>

          <style>
            {`
              @keyframes fill { to { width: 100%; } }
              @media (prefers-color-scheme: dark) {
                :root { --bg:#0b0c0f; --fg:#e7e9ee; --muted:#a3a8b3; --accent:#6ee7b7; }
              }
              @media (prefers-color-scheme: light) {
                :root { --bg:#f7f8fb; --fg:#0b0c0f; --muted:#6b7280; --accent:#0ea5e9; }
              }
            `}
          </style>
        </section>
      )}
    </div>
  );
}

/* ================= helpers ================= */

function formatToday() {
  const d = new Date();
  const s = d.toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

async function getDailyQuote(): Promise<string | null> {
  // API pública: cámbiala por tu endpoint (VITE_QUOTES_URL) o por Firestore cuando gustes.
  const controller = new AbortController();
  const t = window.setTimeout(() => controller.abort(), 3500);
  try {
    const res = await fetch(
      "https://api.quotable.io/random?tags=inspirational",
      { signal: controller.signal }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.content === "string" ? data.content : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/* ================= estilos inline del loader ================= */

const loaderStyles: Record<string, React.CSSProperties> = {
  screen: {
    position: "fixed",
    inset: 0,
    display: "grid",
    gridTemplateRows: "auto 1fr auto",
    alignItems: "center",
    background: "var(--bg)",
    color: "var(--fg)",
    zIndex: 9999,
    backgroundImage:
      "radial-gradient(1200px 600px at 50% 100%, color-mix(in oklab, var(--accent), transparent 85%), transparent)," +
      "linear-gradient(180deg, color-mix(in oklab, var(--bg), #000 3%), var(--bg))",
  },
  topbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "clamp(12px, 2vw, 28px)",
  },
  brand: {
    letterSpacing: ".04em",
    fontWeight: 600,
    fontSize: "clamp(12px, 1.2vw, 14px)",
    textTransform: "uppercase",
    color: "var(--muted)",
    border:
      "1px solid color-mix(in oklab, var(--muted), transparent 70%)" as any,
    padding: ".35rem .55rem",
    borderRadius: 999,
    backdropFilter: "blur(2px)",
  },
  content: {
    display: "grid",
    placeItems: "center",
    paddingInline: "clamp(16px, 4vw, 48px)",
    textAlign: "center",
  },
  quote: {
    maxWidth: "18ch",
    margin: 0,
    lineHeight: 1.12,
    fontWeight: 700,
    fontSize: "clamp(1.8rem, 6.2vw, 5.5rem)",
    letterSpacing: "-0.015em",
    fontFamily:
      "Poppins, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial",
  },
  mark: {
    background:
      "linear-gradient(90deg, color-mix(in oklab, var(--accent), transparent 60%), transparent)",
    borderRadius: ".2em",
    padding: "0 .06em",
  },
  meta: {
    marginTop: "clamp(10px, 1.6vw, 18px)",
    color: "var(--muted)",
    fontSize: "clamp(.9rem, 1.4vw, 1.05rem)",
  },
  skip: {
    position: "fixed",
    right: "clamp(12px, 2vw, 24px)",
    bottom: "clamp(12px, 2vw, 24px)",
    border: "1px solid rgba(120,120,120,.3)",
    background: "rgba(255,255,255,.02)",
    color: "var(--fg)",
    fontSize: ".95rem",
    padding: ".55rem .8rem",
    borderRadius: 999,
    opacity: 0.9,
    cursor: "pointer",
    transition: "transform .15s ease, opacity .15s ease",
  },
  progressWrap: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    overflow: "hidden",
    background: "rgba(120,120,120,.15)",
  },
  progressBar: {
    display: "block",
    height: "100%",
    width: "0%",
    background: "linear-gradient(90deg, var(--accent), rgba(255,255,255,.2))",
  },
};
