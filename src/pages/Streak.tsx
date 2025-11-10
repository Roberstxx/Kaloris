import React, { useMemo } from 'react';
import { Flame, Star, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useIntake } from '../context/IntakeContext';
import { DailyLog } from '../types';
import { formatNumber, formatKcal } from '../utils/format';
import { getTodayISO, getLastNDays, getDateLabel } from '../utils/date';
import styles from './Streak.module.css';

// Componente auxiliar para la tarjeta de resumen
const StatCard: React.FC<{ icon: React.ReactNode; value: string | number; label: string }> = ({
  icon,
  value,
  label,
}) => (
  <div className={styles.card}>
    <div className={styles.icon}>{icon}</div>
    <p className={styles.value}>{value}</p>
    <p className={styles.label}>{label}</p>
  </div>
);

// NUEVO COMPONENTE: Calendario de Racha Visual (Mejorado)
const StreakCalendar: React.FC<{ 
    logs: DailyLog[]; 
    safeGoal: number;
    isGoalMet: (kcal: number) => boolean;
    currentStreak: number; // Nuevo prop para resaltar la racha
}> = ({ logs, safeGoal, isGoalMet, currentStreak }) => {
  
  const LAST_N_DAYS = 30;
  const todayISO = getTodayISO();

  // 1. Prepara los datos del historial
  const lastNDaysISO = useMemo(() => getLastNDays(LAST_N_DAYS), []); 
  const logsMap = useMemo(() => {
    return new Map(logs.map(log => [log.dateISO, log]));
  }, [logs]);

  // Nombres de los días de la semana
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  
  // Lógica para determinar el primer día de la grilla (alinear correctamente)
  const firstDayOfRange = new Date(lastNDaysISO[0]);
  const firstDayOfWeek = firstDayOfRange.getDay(); // 0=Domingo, 1=Lunes, etc.
  const emptyCellsCount = firstDayOfWeek;

  // Lógica para determinar qué días son parte de la racha actual
  const streakDates = useMemo(() => {
      const dates = [];
      // La racha se calcula desde el día actual (o el último día cumplido) hacia atrás
      for (let i = 0; i < currentStreak; i++) {
          const d = new Date(todayISO);
          d.setDate(d.getDate() - i);
          dates.push(d.toISOString().split('T')[0]);
      }
      return new Set(dates);
  }, [currentStreak, todayISO]);

  // Renderizar las celdas del calendario
  const calendarCells = useMemo(() => {
    const cells: React.ReactNode[] = [];
    // 5% de tolerancia para meta, 10% para "cerca"
    const nearThreshold = safeGoal * 0.05; 
    const closeThreshold = safeGoal * 0.10;

    // Celdas vacías iniciales para alinear con el día de la semana
    for (let i = 0; i < emptyCellsCount; i++) {
        cells.push(<div key={`empty-pre-${i}`} className={styles.cellEmpty} />);
    }

    // Celdas de los últimos 30 días
    lastNDaysISO.forEach(dateISO => {
        const log = logsMap.get(dateISO);
        const dateObj = new Date(dateISO);
        const dayOfMonth = dateObj.getDate();
        const isToday = dateISO === todayISO;
        const isPartofStreak = streakDates.has(dateISO);
        
        let statusClass = styles.cellEmpty;
        let tooltipText = `${getDateLabel(dateISO)}: Día sin datos.`;
        
        if (log && log.totalKcal > 0) {
            const isMet = isGoalMet(log.totalKcal);
            const deviation = Math.abs(log.totalKcal - safeGoal);

            if (isMet) {
                statusClass = styles.cellSuccess;
                tooltipText = `${getDateLabel(dateISO)}: ✅ META ALCANZADA | Consumido: ${formatKcal(log.totalKcal)}`;
            } else if (deviation <= closeThreshold) { 
                statusClass = styles.cellNear;
                tooltipText = `${getDateLabel(dateISO)}: ⚠️ FUERA DE RANGO (Cerca) | Consumido: ${formatKcal(log.totalKcal)}`;
            } else {
                statusClass = styles.cellFail;
                tooltipText = `${getDateLabel(dateISO)}: ❌ META FALLIDA | Consumido: ${formatKcal(log.totalKcal)}`;
            }
        }

        cells.push(
            <div 
                key={dateISO} 
                className={`${styles.dayCell} ${statusClass} ${isToday ? styles.cellToday : ''} ${isPartofStreak ? styles.cellCurrentStreak : ''}`}
                title={tooltipText}
            >
                {dayOfMonth}
            </div>
        );
    });

    return cells;
  }, [lastNDaysISO, logsMap, isGoalMet, safeGoal, emptyCellsCount, todayISO, streakDates]);


  return (
    <div className={styles.calendarContainer}>
        <div className={styles.calendarHeader}>
            <h3>Cumplimiento Diario (Últimos {LAST_N_DAYS} Días)</h3>
        </div>
        
        <div className={styles.calendarGrid}>
            {dayNames.map(day => (
                <div key={day} className={styles.dayLabel}>{day}</div>
            ))}
            {calendarCells}
        </div>
        
        <div className={styles.legend}>
            <p style={{ fontWeight: 700, margin: 0, width: '100%' }}>Significado de Colores:</p>
            <div className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.dotSuccess}`} /> 
                <span>Meta Alcanzada (± 5% de la meta)</span>
            </div>
            <div className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.dotNear}`} /> 
                <span>Cerca del Límite (± 10% de desviación)</span>
            </div>
            <div className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.dotFail}`} /> 
                <span>Meta Fallida (+ 10% de desviación)</span>
            </div>
            <div className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.dotEmpty}`} /> 
                <span>Sin Registro (Día sin datos)</span>
            </div>
            <div className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.dotSuccess}`} style={{ border: '2px solid var(--accent)' }}/> 
                <span>Parte de Racha Actual</span>
            </div>
        </div>
    </div>
  );
};

// Componente principal de la página
const StreakPage: React.FC = () => {
  const { getLogsForDateRange, weeklyStats, userTdee } = useIntake();

  const { currentStreak, longestStreak } = weeklyStats;
  const safeGoal = userTdee || 2000;
  const tolerance = safeGoal * 0.05; // 5% de tolerancia

  // Función para determinar si la meta fue alcanzada
  const isGoalMet = (kcal: number) => Math.abs(kcal - safeGoal) <= tolerance;

  // Obtenemos todos los logs para el historial y cálculo 
  const allLogs = getLogsForDateRange(getLastNDays(365));

  // Preparamos logs ordenados
  const sortedLogs = useMemo(() => {
    return allLogs
      .filter(log => log.totalKcal > 0)
      .sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime());
  }, [allLogs]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>
          <Flame size={32} /> Racha de Metas Calóricas
        </h1>
        <Link to="/dashboard" className="btn btn-secondary">
          Volver al Dashboard
        </Link>
      </div>

      <div className={styles.overviewGrid}>
        <StatCard
          icon={<Flame size={40} />}
          value={currentStreak}
          label="Días Consecutivos (Actual)"
        />
        <StatCard
          icon={<Star size={40} />}
          value={longestStreak}
          label="Racha Más Larga (Histórica)"
        />
        <StatCard
          icon={<CheckCircle size={40} />}
          value={`${formatNumber(safeGoal)} ± ${formatNumber(tolerance)}`}
          label={`Rango de Meta Diaria (kcal)`}
        />
      </div>

      <div className={styles.historySection}>
        {/* Usamos el nuevo componente visual de calendario */}
        <StreakCalendar 
            logs={sortedLogs} 
            safeGoal={safeGoal} 
            isGoalMet={isGoalMet} 
            currentStreak={currentStreak}
        />
        
        {/* La lista simple está oculta en CSS */}
        <div className={styles.historyList}>
          <h2>Últimos Días Registrados</h2>
        </div>
      </div>
    </div>
  );
};

export default StreakPage;