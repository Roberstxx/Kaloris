import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { DailyLog } from '../types';
import { getDateLabel } from '../utils/date';
import { formatKcal } from '../utils/format';
import styles from './HistoryChart.module.css';

interface HistoryChartProps {
  logs: DailyLog[];
  targetKcal: number;
}

export const HistoryChart: React.FC<HistoryChartProps> = ({ logs, targetKcal }) => {
  const data = logs.map(log => ({
    date: getDateLabel(log.dateISO),
    fullDate: log.dateISO,
    kcal: log.totalKcal,
    target: targetKcal,
  }));

  const getBarColor = (kcal: number) => {
    const percent = targetKcal === 0 ? 0 : (kcal / targetKcal) * 100;
    if (percent > 105) return 'hsl(0, 75%, 55%)';
    if (percent >= 95) return 'hsl(28, 90%, 55%)';
    return 'hsl(158, 60%, 45%)';
  };

  return (
    <section className={styles.container} aria-label="Gráfica de barras de consumo energético">
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Consumo energético</h3>
          <p className={styles.subtitle}>
            Seguimiento diario frente a tu meta de {formatKcal(targetKcal)}.
          </p>
        </div>
      </div>
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={`${styles.dot} ${styles.dotSuccess}`} /> En rango óptimo
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.dot} ${styles.dotWarning}`} /> Cerca de la meta
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.dot} ${styles.dotDanger}`} /> Sobre la meta
        </span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="date"
            stroke="var(--text-tertiary)"
            style={{ fontSize: '0.75rem' }}
          />
          <YAxis
            stroke="var(--text-tertiary)"
            style={{ fontSize: '0.75rem' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--surface-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              color: 'var(--text)',
            }}
            formatter={(value: number) => [`${Math.round(value)} kcal`, 'Consumido']}
            labelFormatter={(label: string) => `Día ${label}`}
          />
          <ReferenceLine
            y={targetKcal}
            stroke="var(--brand)"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{ value: 'Meta', position: 'right', fill: 'var(--brand)', fontSize: 12 }}
          />
          <Bar dataKey="kcal" radius={[10, 10, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.kcal)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
};
