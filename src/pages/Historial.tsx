import React, { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, History, Settings, Flame, Target, TrendingUp, CalendarDays } from 'lucide-react';

import { HistoryChart } from '../components/HistoryChart';
import { HistoryScatterChart } from '../components/HistoryScatterChart';
import { ThemeToggle } from '../components/ThemeToggle';
import { useIntake } from '../context/IntakeContext';
import { useSession } from '../context/SessionContext';
import type { WeeklyStatsSummary } from '../types';
import { getLastNDays, getDateLabel } from '../utils/date';
import { formatKcal } from '../utils/format';
import styles from './Dashboard.module.css';
import historyStyles from './Historial.module.css';

type SummaryMetrics = Pick<WeeklyStatsSummary, 'totalKcal' | 'averageKcal' | 'daysWithinTarget' | 'compliance' | 'bestDay' | 'trend'>;

const Historial = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSession();
  const { getLogsForDateRange, weeklyStats } = useIntake();

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  const dates = getLastNDays(7);
  const logs = getLogsForDateRange(dates);

  if (!user) return null;

  const targetKcal = user.tdee || 2000;

  const summary = useMemo<SummaryMetrics>(() => {
    const hasRemoteSummary = Boolean(weeklyStats?.updatedAt);
    if (hasRemoteSummary) {
      return {
        totalKcal: weeklyStats.totalKcal,
        averageKcal: weeklyStats.averageKcal,
        daysWithinTarget: weeklyStats.daysWithinTarget,
        compliance: weeklyStats.compliance,
        bestDay: weeklyStats.bestDay,
        trend: weeklyStats.trend,
      };
    }

    if (!logs.length) {
      return {
        totalKcal: 0,
        averageKcal: 0,
        daysWithinTarget: 0,
        compliance: 0,
        bestDay: undefined,
        trend: 0,
      };
    }

    const totalKcal = logs.reduce((sum, log) => sum + log.totalKcal, 0);
    const averageKcal = totalKcal / logs.length;
    const withinRangeThreshold = targetKcal * 0.05;
    const daysWithinTarget = logs.filter((log) => Math.abs(log.totalKcal - targetKcal) <= withinRangeThreshold).length;
    const bestDay = logs.reduce((best, log) => {
      const bestDiff = Math.abs(best.totalKcal - targetKcal);
      const currentDiff = Math.abs(log.totalKcal - targetKcal);
      return currentDiff < bestDiff ? log : best;
    }, logs[0]!);
    const trend = logs.length >= 2 ? logs[logs.length - 1].totalKcal - logs[logs.length - 2].totalKcal : 0;

    return {
      totalKcal,
      averageKcal,
      daysWithinTarget,
      compliance: (daysWithinTarget / logs.length) * 100,
      bestDay: { dateISO: bestDay.dateISO, totalKcal: bestDay.totalKcal },
      trend,
    };
  }, [logs, targetKcal, weeklyStats]);

  const getDifferenceLabel = (difference: number) => {
    if (difference > 0) return `+${Math.abs(Math.round(difference))} kcal sobre meta`;
    if (difference < 0) return `${Math.abs(Math.round(difference))} kcal por debajo`;
    return 'En la meta';
  };

  const getDifferenceClass = (difference: number) => {
    if (difference > 0) return historyStyles.diffPositive;
    if (difference < 0) return historyStyles.diffNegative;
    return historyStyles.diffNeutral;
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className="container">
          <div className={styles.headerContent}>
            <h1 className={styles.logo}>Historial</h1>
            <nav className={styles.nav}>
              <Link to="/dashboard" className={styles.navLink} title="Dashboard">
                <Home size={20} />
              </Link>
              <Link to="/historial" className={styles.navLink} title="Historial">
                <History size={20} />
              </Link>
              <Link to="/settings" className={styles.navLink} title="Configuración">
                <Settings size={20} />
              </Link>
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </header>

      <main className={`container ${historyStyles.main}`}>
        <h2 className={historyStyles.sectionTitle}>Últimos 7 días</h2>

        <div className={historyStyles.summaryGrid}>
          <div className={historyStyles.summaryCard}>
            <div className={historyStyles.summaryHeader}>
              <Flame />
              <span>Promedio diario</span>
            </div>
            <p className={historyStyles.summaryValue}>{formatKcal(summary.averageKcal)}</p>
            <p className={historyStyles.summaryMeta}>Meta: {formatKcal(targetKcal)}</p>
          </div>

          <div className={historyStyles.summaryCard}>
            <div className={historyStyles.summaryHeader}>
              <CalendarDays />
              <span>Total semanal</span>
            </div>
            <p className={historyStyles.summaryValue}>{formatKcal(summary.totalKcal)}</p>
            <p className={historyStyles.summaryMeta}>{logs.length} días registrados</p>
          </div>

          <div className={historyStyles.summaryCard}>
            <div className={historyStyles.summaryHeader}>
              <Target />
              <span>Días en meta</span>
            </div>
            <p className={historyStyles.summaryValue}>{Math.round(summary.compliance)}%</p>
            <p className={historyStyles.summaryMeta}>
              {summary.daysWithinTarget} de {logs.length} días
            </p>
          </div>

          <div className={historyStyles.summaryCard}>
            <div className={historyStyles.summaryHeader}>
              <TrendingUp />
              <span>Tendencia reciente</span>
            </div>
            <p className={historyStyles.summaryValue}>
              {logs.length >= 2 ? `${summary.trend > 0 ? '+' : ''}${Math.round(summary.trend)} kcal` : 'Sin datos'}
            </p>
            <p className={historyStyles.summaryMeta}>
              {logs.length >= 2
                ? 'vs. día anterior'
                : 'Registra más días para ver la tendencia'}
            </p>
            {summary.bestDay && (
              <p className={historyStyles.summaryMeta}>
                Día más equilibrado: {getDateLabel(summary.bestDay.dateISO)}
              </p>
            )}
          </div>
        </div>

        <div className={historyStyles.chartsGrid}>
          <HistoryChart logs={logs} targetKcal={targetKcal} />
          <HistoryScatterChart logs={logs} targetKcal={targetKcal} />
        </div>

        <section className={historyStyles.historySection}>
          <div className={historyStyles.historyHeader}>
            <h3 className={historyStyles.historyTitle}>Detalle diario</h3>
            <p className={historyStyles.historySubtitle}>Meta diaria: {formatKcal(targetKcal)}</p>
          </div>

          {logs.length ? (
            <div className={historyStyles.timeline}>
              {logs.map((log) => {
                const difference = log.totalKcal - targetKcal;
                return (
                  <div key={log.dateISO} className={historyStyles.timelineItem}>
                    <span className={historyStyles.timelineDot} />
                    <div className={historyStyles.timelineCard}>
                      <div className={historyStyles.timelineRow}>
                        <span className={historyStyles.timelineDate}>{getDateLabel(log.dateISO)}</span>
                        <span className={historyStyles.timelineKcal}>{formatKcal(log.totalKcal)}</span>
                      </div>
                      <p className={historyStyles.timelineMeta}>
                        {log.entries.length} {log.entries.length === 1 ? 'registro' : 'registros'}
                      </p>
                      <span className={`${historyStyles.diffBadge} ${getDifferenceClass(difference)}`}>
                        {getDifferenceLabel(difference)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className={historyStyles.emptyState}>
              Aún no hay registros. Añade tus comidas para ver tu progreso.
            </p>
          )}
        </section>
      </main>
    </div>
  );
};

export default Historial;
