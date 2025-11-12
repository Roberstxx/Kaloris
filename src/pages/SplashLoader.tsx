import React, { useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type SplashState = {
  text?: string;
  durationMs?: number;
  next?: string;
};

export default function SplashLoader() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { text, durationMs, next }: SplashState = (state as SplashState) || {};

  const prefersReduced = useMemo(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  const ms = prefersReduced ? 1000 : (Number(durationMs) || 4000);
  const timerRef = useRef<number | null>(null);

  const todayStr = useMemo(() => {
    const d = new Date();
    const s = d.toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }, []);

  const phrase = (text?.trim() || "Tu progreso empieza con un solo paso consciente.");
  const goNext = () => navigate(next || "/dashboard", { replace: true });

  useEffect(() => {
    timerRef.current = window.setTimeout(goNext, ms);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ms, next]);

  const onSkip = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    goNext();
  };

  return (
    <section className="screen" role="dialog" aria-modal="true" aria-labelledby="quote-text">
      <header className="topbar">
        <span className="brand" aria-label="Nombre de la app">Kaloris</span>
        <span aria-hidden="true"></span>
      </header>

      <main className="content">
        <h1 className="quote" id="quote-text">
          <span id="quote-value">
            <mark>{phrase}</mark>
          </span>
        </h1>
        <p className="meta" id="today">{todayStr}</p>
      </main>

      <button className="skip" id="skipBtn" type="button" aria-label="Saltar introducción" onClick={onSkip}>
        Saltar
      </button>

      <div className="progress" aria-hidden="true">
        <i
          style={{
            animation: prefersReduced ? "none" : `fill ${ms}ms cubic-bezier(.22,.61,.36,1) forwards`,
            width: prefersReduced ? "100%" : undefined,
          }}
        />
      </div>

      <style>{`
        :root{
          --bg: #0b0c0f; --fg: #e7e9ee; --muted:#a3a8b3;
          --accent:#6ee7b7; --ring: color-mix(in oklab, var(--accent), transparent 70%);
          --max-ch: 18ch;
        }
        @media (prefers-color-scheme: light){
          :root{
            --bg:#f7f8fb; --fg:#0b0c0f; --muted:#6b7280; --accent:#0ea5e9;
            --ring: color-mix(in oklab, var(--accent), transparent 80%);
          }
        }
        * { box-sizing: border-box; }
        html,body { height: 100%; }
        body{ margin:0; background: var(--bg); color: var(--fg); }
        .screen{
          position: fixed; inset: 0; display: grid; grid-template-rows: auto 1fr auto; align-items: center;
          background:
            radial-gradient(1200px 600px at 50% 100%, color-mix(in oklab, var(--ring), transparent 88%), transparent),
            linear-gradient(180deg, color-mix(in oklab, var(--bg), #000 3%), var(--bg));
          z-index: 9999;
        }
        .topbar{ display:flex; align-items:center; justify-content:space-between; padding: clamp(12px, 2vw, 28px); }
        .brand{
          letter-spacing: .04em; font-weight: 600; font-size: clamp(12px, 1.2vw, 14px);
          text-transform: uppercase; color: var(--muted);
          border: 1px solid color-mix(in oklab, var(--muted), transparent 70%);
          padding: .35rem .55rem; border-radius: 999px; backdrop-filter: blur(2px);
        }
        .content{ display: grid; place-items: center; padding-inline: clamp(16px, 4vw, 48px); text-align: center; }
        .quote{
          max-width: var(--max-ch); margin: 0; line-height: 1.12; font-weight: 700;
          font-size: clamp(1.8rem, 6.2vw, 5.5rem); letter-spacing: -0.015em;
          opacity: 0; transform: translateY(6px); animation: rise .6s ease forwards .12s;
        }
        .quote mark{
          background: linear-gradient(90deg, color-mix(in oklab, var(--accent), transparent 60%), transparent);
          color: inherit; padding: 0 .06em; border-radius: .2em; box-decoration-break: clone;
        }
        .meta{
          margin-top: clamp(10px, 1.6vw, 18px); color: var(--muted);
          font-size: clamp(.9rem, 1.4vw, 1.05rem);
          opacity: 0; transform: translateY(6px); animation: rise .6s ease forwards .22s;
        }
        .skip{
          position: fixed; right: clamp(12px, 2vw, 24px); bottom: clamp(12px, 2vw, 24px);
          appearance: none;
          border: 1px solid color-mix(in oklab, var(--muted), transparent 60%);
          background: color-mix(in oklab, var(--bg), var(--fg) 2%);
          color: var(--fg); font-size: .95rem; padding: .55rem .8rem; border-radius: 999px;
          opacity: .85; transition: transform .15s ease, opacity .15s ease, background .2s ease, border-color .2s ease;
        }
        .skip:hover{ opacity: 1; transform: translateY(-1px); }
        .skip:focus-visible{ outline: none; box-shadow: 0 0 0 6px var(--ring); }
        .progress{ position: fixed; left: 0; right: 0; bottom: 0; height: 3px; overflow: hidden;
          background: color-mix(in oklab, var(--muted), transparent 85%);
        }
        .progress > i{ display:block; height:100%; width: 0%;
          background: linear-gradient(90deg, var(--accent), color-mix(in oklab, var(--accent), #fff 20%));
        }
        @keyframes fill{ to{ width: 100%; } }
        @keyframes rise{ to{ opacity:1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce){
          .quote, .meta{ animation: none; opacity: 1; transform: none; }
        }
      `}</style>
    </section>
  );
}
