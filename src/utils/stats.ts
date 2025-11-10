// src/utils/stats.ts
import { DailyLog, WeeklyStatsSummary } from '../types';
import { getTodayISO } from './date';

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

// NUEVA FUNCIÓN: Calcula la racha actual y la más larga
export const calculateStreakStats = (
  allLogs: DailyLog[], 
  targetKcal: number
): { currentStreak: number; longestStreak: number } => {
  const safeTarget = getSafeTarget(targetKcal);
  // Tolerancia del 5%
  const tolerance = safeTarget * 0.05; 
  const isTargetMet = (kcal: number) => Math.abs(kcal - safeTarget) <= tolerance;

  // 1. Obtener datos de logs, filtrar días sin kcal y ordenar por fecha
  const logData = allLogs
    .filter(log => log.totalKcal > 0)
    .map(log => ({ 
      dateISO: log.dateISO, 
      totalKcal: log.totalKcal 
    }))
    .sort((a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime());
    
  // 2. Calcular Racha Más Larga (Histórica)
  let longestStreak = 0;
  let currentHistoricalStreak = 0;
  let lastDate: Date | null = null;
  
  for (const log of logData) {
    const logDate = new Date(log.dateISO);
    logDate.setHours(0, 0, 0, 0); 
    
    const metTarget = isTargetMet(log.totalKcal);
    
    let isConsecutive = false;
    if (lastDate) {
      const expectedNextDay = new Date(lastDate);
      expectedNextDay.setDate(expectedNextDay.getDate() + 1);
      // Comparar cadenas ISO (YYYY-MM-DD)
      if (expectedNextDay.toISOString().split('T')[0] === logDate.toISOString().split('T')[0]) {
        isConsecutive = true;
      }
    }
    
    if (metTarget) {
      if (isConsecutive || !lastDate) {
        currentHistoricalStreak++;
      } else {
        currentHistoricalStreak = 1;
      }
    } else {
      currentHistoricalStreak = 0;
    }
    
    longestStreak = Math.max(longestStreak, currentHistoricalStreak);
    if (metTarget) {
      lastDate = logDate;
    } else {
      lastDate = null; 
    }
  }
  
  // 3. Calcular Racha Actual (terminando hoy/ayer)
  let currentStreak = 0;
  let currentDateISO = getTodayISO();
  
  // Recorrer desde hoy hacia atrás
  for (let i = 0; i < 365; i++) { // Límite de 1 año por seguridad
    const log = allLogs.find(l => l.dateISO === currentDateISO);
    const metTarget = log ? isTargetMet(log.totalKcal) : false;
    
    if (metTarget) {
      currentStreak++;
    } else {
      // Si hoy no se cumplió la meta, o si se encuentra un día no cumplido, la racha se rompe
      break;
    }
    
    // Mover al día anterior
    const prevDate = new Date(currentDateISO);
    prevDate.setDate(prevDate.getDate() - 1);
    currentDateISO = prevDate.toISOString().split('T')[0];
  }
  
  return { 
    currentStreak: clampNumber(currentStreak), 
    longestStreak: clampNumber(longestStreak) 
  };
};


export const calculateWeeklySummary = (
  logs: DailyLog[], // ESTOS SON TODOS LOS LOGS DEL USUARIO
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
  
  // NUEVA: Calcular la racha con todos los logs
  const { currentStreak, longestStreak } = calculateStreakStats(logs, safeTarget);

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
    // NUEVOS CAMPOS
    currentStreak,
    longestStreak,
  };
};
