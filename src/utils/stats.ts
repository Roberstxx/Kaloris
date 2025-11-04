// src/utils/stats.ts
import { DailyLog, WeeklyStatsSummary } from '../types';

const clampNumber = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return value;
};

const getSafeTarget = (target: number | undefined): number => {
  if (!target || target <= 0) return 2000;
  return target;
};

const roundTo = (value: number, decimals = 2): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

export const calculateWeeklySummary = (
  logs: DailyLog[],
  targetKcal: number | undefined,
  periodDates: string[]
): WeeklyStatsSummary => {
  const safeTarget = getSafeTarget(targetKcal);
  const filledLogs = periodDates.map((dateISO) => {
    const log = logs.find((item) => item.dateISO === dateISO);
    const entries = log?.entries ?? [];
    const totalKcal = log?.totalKcal ?? entries.reduce((sum, entry) => sum + entry.kcalPerUnit * entry.units, 0);
    return {
      dateISO,
      totalKcal,
    };
  });

  const totalKcal = filledLogs.reduce((sum, log) => sum + log.totalKcal, 0);
  const averageKcal = filledLogs.length ? totalKcal / filledLogs.length : 0;
  const withinRangeThreshold = safeTarget * 0.05;
  const daysWithinTarget = filledLogs.filter(
    (log) => Math.abs(log.totalKcal - safeTarget) <= withinRangeThreshold
  ).length;

  let bestDay: WeeklyStatsSummary['bestDay'];
  if (filledLogs.length > 0) {
    const best = filledLogs.reduce((bestLog, current) => {
      const bestDiff = Math.abs(bestLog.totalKcal - safeTarget);
      const currentDiff = Math.abs(current.totalKcal - safeTarget);
      return currentDiff < bestDiff ? current : bestLog;
    }, filledLogs[0]!);
    bestDay = { dateISO: best.dateISO, totalKcal: best.totalKcal };
  }

  let trend = 0;
  if (filledLogs.length >= 2) {
    const last = filledLogs[filledLogs.length - 1];
    const previous = filledLogs[filledLogs.length - 2];
    trend = last.totalKcal - previous.totalKcal;
  }

  return {
    periodStart: periodDates[0] ?? '',
    periodEnd: periodDates[periodDates.length - 1] ?? '',
    totalKcal: clampNumber(roundTo(totalKcal, 2)),
    averageKcal: clampNumber(roundTo(averageKcal, 2)),
    daysWithinTarget,
    compliance: filledLogs.length ? clampNumber(roundTo((daysWithinTarget / filledLogs.length) * 100, 2)) : 0,
    trend: clampNumber(roundTo(trend, 2)),
    bestDay,
    updatedAt: '',
  };
};
