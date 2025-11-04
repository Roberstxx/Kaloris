import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Scatter,
  ReferenceLine,
  Cell,
  TooltipProps,
} from 'recharts';
import { DailyLog } from '../types';
import { getDateLabel } from '../utils/date';
import { formatKcal } from '../utils/format';
import styles from './HistoryScatterChart.module.css';

type ScatterPoint = {
  index: number;
  date: string;
  kcal: number;
  difference: number;
  fill: string;
};

interface HistoryScatterChartProps {
  logs: DailyLog[];
  targetKcal: number;
}

export const HistoryScatterChart: React.FC<HistoryScatterChartProps> = ({ logs, targetKcal }) => {
  const data: ScatterPoint[] = useMemo(
    () =>
      logs.map((log, index) => {
        const difference = log.totalKcal - targetKcal;
        const percent = targetKcal === 0 ? 0 : (log.totalKcal / targetKcal) * 100;
        let fill = 'hsl(158, 60%, 45%)';
        if (percent > 105) fill = 'hsl(0, 75%, 55%)';
        else if (percent >= 95) fill = 'hsl(28, 90%, 55%)';

        return {
          index,
          date: getDateLabel(log.dateISO),
          kcal: log.totalKcal,
          difference,
          fill,
        };
      }),
    [logs, targetKcal]
  );

  const renderTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (!active || !payload || payload.length === 0) return null;
    const point = payload[0].payload as ScatterPoint;
    const deltaLabel = Math.round(point.difference);
    const isPositive = deltaLabel > 0;
    const isNegative = deltaLabel < 0;

    return (
      <div className={styles.tooltip}>
        <h4>{point.date}</h4>
        <p className={styles.tooltipValue}>{formatKcal(point.kcal)}</p>
        <p
          className={`${styles.tooltipDelta} ${
            isPositive ? styles.deltaPositive : isNegative ? styles.deltaNegative : styles.deltaNeutral
          }`}
        >
          {isPositive && `+${Math.abs(deltaLabel)} kcal sobre meta`}
          {isNegative && `${Math.abs(deltaLabel)} kcal por debajo`}
          {!isPositive && !isNegative && 'En la meta'}
        </p>
      </div>
    );
  };

  return (
    <section className={styles.container} aria-label="Gráfica de dispersión de tendencia semanal">
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Tendencia semanal</h3>
          <p className={styles.subtitle}>Visualiza la variación diaria alrededor de tu meta.</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 10, right: 16, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            type="number"
            dataKey="index"
            stroke="var(--text-tertiary)"
            tickFormatter={value => data[Math.round(value)]?.date ?? ''}
            ticks={data.map(point => point.index)}
            style={{ fontSize: '0.75rem' }}
          />
          <YAxis
            dataKey="kcal"
            stroke="var(--text-tertiary)"
            style={{ fontSize: '0.75rem' }}
          />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} content={renderTooltip} />
          <ReferenceLine
            y={targetKcal}
            stroke="var(--brand)"
            strokeDasharray="4 4"
            strokeWidth={1.5}
          />
          <Scatter
            data={data}
            dataKey="kcal"
            line={{ stroke: 'var(--brand)', strokeWidth: 2, strokeDasharray: '6 4' }}
            shape="circle"
          >
            {data.map(point => (
              <Cell key={point.index} fill={point.fill} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </section>
  );
};
