import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DailyLog } from '../types';
import { getDateLabel } from '../utils/date';
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
    const percent = (kcal / targetKcal) * 100;
    if (percent > 105) return 'hsl(0, 75%, 55%)'; // danger
    if (percent >= 95) return 'hsl(28, 90%, 55%)'; // warning
    return 'hsl(158, 60%, 45%)'; // success
  };

  return (
    <div className={styles.container}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
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
          />
          <Bar dataKey="kcal" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.kcal)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
