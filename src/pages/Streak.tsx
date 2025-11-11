import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Flame, Star, CheckCircle, CalendarDays, Home } from "lucide-react";
import AppHeader from "@/components/ui/AppHeader";
import { useIntake } from "@/context/IntakeContext";
import { DailyLog } from "@/types";
import { formatNumber, formatKcal } from "@/utils/format";
import { getTodayISO, getLastNDays } from "@/utils/date";
import styles from "./Streak.module.css";

/* ========= util de fechas ========= */
const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const toISO = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const getWeekdayMon0 = (d: Date) => ((d.getDay() + 6) % 7); // 0=lunes,6=domingo

function buildMonthMatrix(anchor: Date) {
  const first = startOfMonth(anchor);
  const leading = getWeekdayMon0(first); // celdas antes del día 1
  const start = new Date(first);
  start.setDate(first.getDate() - leading);

  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push(d);
  }
  return { first, cells };
}

/* ========= metric card ========= */
const StatCard: React.FC<{ icon: React.ReactNode; value: string | number; label: string }> = ({ icon, value, label }) => (
  <div className={styles.card}>
    <div className={styles.icon}>{icon}</div>
    <p className={styles.value}>{value}</p>
    <p className={styles.label}>{label}</p>
  </div>
);

/* ========= chips semanales ========= */
const WeekChips: React.FC<{ cells: Date[]; logsMap: Map<string, DailyLog>; meetsGoal: (k:number)=>boolean }> = ({ cells, logsMap, meetsGoal }) => {
  // 42 celdas = 6 semanas visibles
  const weeks = Array.from({ length: 6 }, (_, i) => cells.slice(i*7, i*7 + 7));
  return (
    <div className={styles.weekChips}>
      {weeks.map((week, idx) => {
        const days = week.map(d => logsMap.get(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`));
        const regs = days.filter(Boolean) as DailyLog[];
        const ok = regs.filter(r => meetsGoal(r.totalKcal)).length;
        const pct = regs.length ? Math.round((ok / regs.length)*100) : 0;
        return (
          <div key={idx} className={styles.weekChip} title={`Semana ${idx+1}: ${ok}/${regs.length} (${pct}%)`}>
            <span>Sem {idx+1}</span>
            <strong>{pct}%</strong>
          </div>
        );
      })}
    </div>
  );
};

const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const DOW = ["Lu","Ma","Mi","Ju","Vi","Sa","Do"];

const StreakPage: React.FC = () => {
  const { weeklyStats, userTdee, getLogsForDateRange } = useIntake();

  const safeGoal = userTdee || 2000;
  const tol5 = safeGoal * 0.05;
  const tol10 = safeGoal * 0.10;
  const meetsGoal = (k: number) => Math.abs(k - safeGoal) <= tol5;

  const todayISO = getTodayISO();
  const [viewDate, setViewDate] = useState(() => new Date());
  const [compact, setCompact] = useState(false);
  const [onlyWithData, setOnlyWithData] = useState(false);

  // racha
  const currentStreak = weeklyStats?.currentStreak ?? 0;
  const longestStreak = weeklyStats?.longestStreak ?? 0;
  const currentStreakSet = useMemo(() => new Set(getLastNDays(currentStreak)), [currentStreak]);

  // matriz mensual (siempre 6 filas)
  const { first, cells } = useMemo(
    () => buildMonthMatrix(new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)),
    [viewDate]
  );
  const monthTitle = `${MONTHS[first.getMonth()]} ${first.getFullYear()}`;

  // logs para las 42 fechas visibles
  const allISO = useMemo(() => cells.map(toISO), [cells]);
  const logs = getLogsForDateRange(allISO);
  const logsMap = useMemo(() => new Map(logs.map(l => [l.dateISO, l] as const)), [logs]);

  // últimos registros (extra)
  const lastRegisteredDays: DailyLog[] = useMemo(
    () => logs.filter(l => l.totalKcal > 0).sort((a,b)=> a.dateISO < b.dateISO ? 1 : -1).slice(0,10),
    [logs]
  );

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  const goToday   = () => setViewDate(new Date());

  // teclado ← →
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevMonth();
      if (e.key === "ArrowRight") nextMonth();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewDate]);

  // gestos touch
  const touchStart = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(dx) > 40) { dx < 0 ? nextMonth() : prevMonth(); }
    touchStart.current = null;
  };

  return (
    <div className={styles.page}>
      <AppHeader title="Racha de Metas" />

      <main className="container">
        <div className={styles.headerRow}>
          <h1 className={styles.h1}><Flame size={28}/> Racha de Metas Calóricas</h1>
        </div>

        {/* Métricas */}
        <div className={styles.overviewGrid}>
          <StatCard icon={<Flame size={40}/>} value={currentStreak} label="Días consecutivos (actual)"/>
          <StatCard icon={<Star size={40}/>} value={longestStreak} label="Racha más larga"/>
          <StatCard icon={<CheckCircle size={40}/>} value={`${formatNumber(safeGoal)} ± ${formatNumber(tol5)}`} label="Rango meta (±5%)"/>
        </div>

        {/* Calendario mensual */}
        <section
          className={`${styles.calendarCard} ${compact ? styles.compact : ""}`}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          aria-label="Calendario de racha mensual"
        >
          <div className={styles.calHeader}>
            <button className="btn btn-secondary" onClick={prevMonth} aria-label="Mes anterior">
              <ChevronLeft size={18}/>
            </button>

            <h3 className={styles.calTitle}>{monthTitle}</h3>

            <div className={styles.headerActions}>
              <button className="btn btn-secondary" onClick={goToday} aria-label="Ir a hoy">
                <Home size={16}/> Hoy
              </button>
              <label className={styles.compactToggle} title="Reducir espacios para ver más contenido">
                <input type="checkbox" checked={compact} onChange={(e)=>setCompact(e.target.checked)} />
                <span>Compacto</span>
              </label>
              <label className={styles.compactToggle} title="Ocultar días sin registro">
                <input type="checkbox" checked={onlyWithData} onChange={(e)=>setOnlyWithData(e.target.checked)} />
                <span>Solo con registro</span>
              </label>
              <button className="btn btn-secondary" onClick={nextMonth} aria-label="Mes siguiente">
                <ChevronRight size={18}/>
              </button>
            </div>
          </div>

          <div className={styles.dowRow}>{DOW.map(d => <div key={d} className={styles.dow}>{d}</div>)}</div>

          <div className={styles.grid}>
            {cells.map((d) => {
              const iso = toISO(d);
              const log = logsMap.get(iso);
              const kcal = log?.totalKcal ?? 0;

              const inMonth = d.getMonth() === first.getMonth();
              const isToday = iso === todayISO;
              const inStreak = currentStreakSet.has(iso);

              let stateClass = styles.cellEmpty;
              if (kcal > 0) {
                const diff = Math.abs(kcal - safeGoal);
                if (diff <= tol5) stateClass = styles.cellOk;
                else if (diff <= tol10) stateClass = styles.cellNear;
                else stateClass = styles.cellFail;
              }

              if (onlyWithData && kcal === 0) {
                // Mostrar aún así las celdas del mes para mantener cuadrícula (atenuadas)
                return (
                  <div
                    key={iso}
                    className={[styles.cell, styles.cellMuted, !inMonth ? styles.cellMuted : ""].join(" ")}
                    aria-hidden
                  >
                    <span className={styles.dateNum}>{d.getDate()}</span>
                  </div>
                );
              }

              return (
                <div
                  key={iso}
                  className={[
                    styles.cell,
                    inMonth ? "" : styles.cellMuted,
                    stateClass,
                    inStreak ? styles.cellStreak : "",
                    isToday ? styles.cellToday : ""
                  ].join(" ")}
                  tabIndex={0}
                  aria-label={kcal > 0 ? `${iso}: ${formatKcal(kcal)}` : `${iso}: Sin registro`}
                >
                  <span className={styles.dateNum}>{d.getDate()}</span>
                  {/* puntito de estado */}
                  <span className={styles.dot}/>
                  {/* Tooltip accesible */}
                  <div className={styles.tooltip} role="dialog" aria-hidden="true">
                    <span className={styles.tooltipTitle}>{iso}</span>
                    <span className={styles.tooltipLine}>
                      {kcal > 0 ? `Consumido: ${formatKcal(kcal)}` : "Sin registro"}
                    </span>
                    {kcal > 0 && (
                      <span
                        className={
                          styles.tooltipBadge + " " + (
                            Math.abs(kcal - safeGoal) <= tol5 ? styles.badgeOk :
                            Math.abs(kcal - safeGoal) <= tol10 ? styles.badgeNear : styles.badgeFail
                          )
                        }
                      >
                        {Math.abs(kcal - safeGoal) <= tol5 ? "En meta" :
                         Math.abs(kcal - safeGoal) <= tol10 ? "Cerca" : "Fuera"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Leyenda */}
          <div className={styles.legend}>
            <div className={styles.legendItem}><span className={`${styles.legendDot} ${styles.legOk}`}/><span>Meta alcanzada (±5%)</span></div>
            <div className={styles.legendItem}><span className={`${styles.legendDot} ${styles.legNear}`}/><span>Cerca (±10%)</span></div>
            <div className={styles.legendItem}><span className={`${styles.legendDot} ${styles.legFail}`}/><span>Fuera de meta</span></div>
            <div className={styles.legendItem}><span className={`${styles.legendDot} ${styles.legEmpty}`}/><span>Sin registro</span></div>
            <div className={styles.legendItem}><span className={`${styles.legendDot} ${styles.legStreak}`}/><span>Racha actual</span></div>
            <div className={styles.legendItem}><span className={`${styles.legendDot} ${styles.legToday}`}/><span>Hoy</span></div>
          </div>

          {/* Píldoras de meses */}
          <div className={styles.monthPills} role="tablist" aria-label="Seleccionar mes">
            {MONTHS.map((m, idx) => {
              const active = idx === first.getMonth();
              return (
                <button
                  key={m}
                  role="tab"
                  aria-selected={active}
                  className={`${styles.monthPill} ${active ? styles.monthPillActive : ""}`}
                  onClick={() => setViewDate(new Date(first.getFullYear(), idx, 1))}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {/* Chips semanales */}
          <WeekChips cells={cells} logsMap={logsMap} meetsGoal={meetsGoal} />
        </section>

        {/* Lista ligera de últimos registros */}
        <section className={styles.historyLite}>
          <h2>Últimos registros</h2>
          {lastRegisteredDays.length === 0 ? (
            <p className={styles.empty}>Aún no hay registros en este mes.</p>
          ) : (
            <ul className={styles.logList}>
              {lastRegisteredDays.map((l) => (
                <li key={l.dateISO}><span>{l.dateISO}</span><strong>{formatKcal(l.totalKcal)}</strong></li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
};

export default StreakPage;
