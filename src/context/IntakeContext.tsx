// src/context/IntakeContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { DailyLog, IntakeEntry, WeeklyStatsSummary, IntakeContextType } from '../types'; // <-- IMPORTADO CORRECTAMENTE
import { getLastNDays, getTodayISO } from '../utils/date';
import { classifyMealByTime, normalizeConsumedAt } from '../utils/meals';
import { useSession } from './SessionContext';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { calculateWeeklySummary } from '../utils/stats';

// ELIMINADA LA INTERFAZ MAL UBICADA: Ahora se usa IntakeContextType importada

const IntakeContext = createContext<IntakeContextType | undefined>(undefined);

const LOGS_KEY = 'cc_logs_v1';
const CHECK_INTERVAL_MS = 30 * 1000; 

const logDocId = (userId: string, dateISO: string) => `${userId}_${dateISO}`;

const defaultWeeklyStats = (dates: string[]): WeeklyStatsSummary => ({
  periodStart: dates[0] ?? '',
  periodEnd: dates[dates.length - 1] ?? '',
  totalKcal: 0,
  averageKcal: 0,
  daysWithinTarget: 0,
  compliance: 0,
  trend: 0,
  currentStreak: 0, 
  longestStreak: 0, 
  updatedAt: '',
});

function readLocalLogs(): DailyLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOGS_KEY);
    return raw ? (JSON.parse(raw) as DailyLog[]) : [];
  } catch (error) {
    console.error('No se pudieron leer los registros locales', error);
    return [];
  }
}

function writeLocalLogs(logs: DailyLog[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error('No se pudieron guardar los registros locales', error);
  }
}

export const IntakeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useSession();
  const userId = user?.id ?? null;
  const userTdee = user?.tdee ?? 2000; 

  // Día activo controlado para evitar inconsistencias de fecha
  const [currentDateISO, setCurrentDateISO] = useState<string>(() => getTodayISO());

  // Persistencia en memoria, sincronizada con Firestore o localStorage
  const [logs, setLogs] = useState<DailyLog[]>(() => readLocalLogs());

  // Estado derivado del día activo
  const [todayEntries, setTodayEntries] = useState<IntakeEntry[]>([]);
  const [todayTotal, setTodayTotal] = useState(0);

  const [weeklyStats, setWeeklyStats] = useState<WeeklyStatsSummary>(() =>
    defaultWeeklyStats(getLastNDays(7))
  );

  const lastPersistedWeeklyStats = useRef<string | null>(null);

  // Carga las entradas para un dateISO dado (default: currentDateISO)
  const loadForDate = (dateISO: string = currentDateISO) => {
    if (!userId) return;
    const todayLog = logs.find((l) => l.userId === userId && l.dateISO === dateISO);
    if (todayLog) {
      const entries = todayLog.entries ?? [];
      const recalculatedTotal = entries.reduce((sum, e) => sum + e.kcalPerUnit * e.units, 0);
      setTodayEntries(entries);
      setTodayTotal(recalculatedTotal);

      if (recalculatedTotal !== todayLog.totalKcal) {
        setLogs((prev) =>
          prev.map((log) =>
            log.userId === userId && log.dateISO === dateISO
              ? { ...log, totalKcal: recalculatedTotal }
              : log
          )
        );
      }
    } else {
      setTodayEntries([]);
      setTodayTotal(0);
    }
  };

  // Guarda (crea/actualiza) el log del día activo
  const saveTodayLog = (entries: IntakeEntry[]) => {
    if (!userId) return;

    const total = entries.reduce((sum, e) => sum + e.kcalPerUnit * e.units, 0);

    const newLog: DailyLog = {
      userId,
      dateISO: currentDateISO,
      entries,
      totalKcal: total,
    };

    setLogs((prev) => {
      const updated = prev.filter(
        (l) => !(l.userId === userId && l.dateISO === currentDateISO)
      );
      return [...updated, newLog];
    });

    if (db) {
      void setDoc(doc(db, 'dailyLogs', logDocId(userId, currentDateISO)), newLog, { merge: true }).catch(
        (error) => {
          console.error('No se pudo guardar el log en Firestore', error);
        }
      );
    }

    setTodayTotal(total);
  };

  // Rollover: si cambia el día mientras la app está abierta, actualiza currentDateISO y recarga
  const validateRollover = () => {
    const today = getTodayISO();
    if (today !== currentDateISO) {
      setCurrentDateISO(today);
    }
  };

  // Al montar y cuando cambian usuario, logs o currentDateISO: sincroniza estado derivado
  useEffect(() => {
    if (!userId) {
      setTodayEntries([]);
      setTodayTotal(0);
      setWeeklyStats(defaultWeeklyStats(getLastNDays(7)));
      return;
    }
    loadForDate(currentDateISO);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, logs, currentDateISO]);

  // Intervalo para detectar cambio de fecha en vivo (ej. medianoche)
  useEffect(() => {
    const id = setInterval(validateRollover, CHECK_INTERVAL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDateISO]);

  // Al volver la pestaña a foco, revalida fecha
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') validateRollover();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sincroniza logs con localStorage para fallback/offline
  useEffect(() => {
    writeLocalLogs(logs);
  }, [logs]);

  // Escucha cambios en Firestore para el usuario autenticado
  useEffect(() => {
    if (!userId) {
      setLogs(readLocalLogs());
      setWeeklyStats(defaultWeeklyStats(getLastNDays(7)));
      return;
    }

    if (!db) {
      const localLogs = readLocalLogs().filter((log) => log.userId === userId);
      setLogs(localLogs);
      const dates = getLastNDays(7);
      const summary = calculateWeeklySummary(localLogs, userTdee, dates);
      setWeeklyStats({ ...summary, updatedAt: new Date().toISOString() });
      return;
    }

    const logsRef = collection(db, 'dailyLogs');
    const logsQuery = query(logsRef, where('userId', '==', userId));
    let unsub: (() => void) | undefined;

    (async () => {
      try {
        const snapshot = await getDocs(logsQuery);
        if (snapshot.empty) {
          const localLogs = readLocalLogs().filter((log) => log.userId === userId);
          if (localLogs.length > 0) {
            await Promise.all(
              localLogs.map((log) =>
                setDoc(doc(db, 'dailyLogs', logDocId(userId, log.dateISO)), log, {
                  merge: true,
                })
              )
            );
          }
        }
      } catch (error) {
        console.error('No se pudieron preparar los logs remotos', error);
      }

      unsub = onSnapshot(
        logsQuery,
        (snapshot) => {
          const remoteLogs: DailyLog[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data() as DailyLog;
            const entries = Array.isArray(data.entries) ? data.entries : [];
            const totalKcal =
              typeof data.totalKcal === 'number'
                ? data.totalKcal
                : entries.reduce((sum, e) => sum + e.kcalPerUnit * e.units, 0);
            return {
              userId: data.userId ?? userId,
              dateISO: data.dateISO,
              entries,
              totalKcal,
            };
          });
          setLogs(remoteLogs);
        },
        (error) => {
          console.error('Error al escuchar los logs diarios', error);
        }
      );
    })();

    return () => {
      unsub?.();
    };
  }, [userId, userTdee]);

  // Recalcula resumen semanal cuando cambian logs, usuario o fecha actual
  useEffect(() => {
    const dates = getLastNDays(7);
    if (!userId) {
      setWeeklyStats(defaultWeeklyStats(dates));
      return;
    }

    const userLogs = logs.filter((log) => log.userId === userId);
    const summary = calculateWeeklySummary(userLogs, userTdee, dates);
    setWeeklyStats((prev) => {
      const metricsChanged =
        prev.periodStart !== summary.periodStart ||
        prev.periodEnd !== summary.periodEnd ||
        prev.totalKcal !== summary.totalKcal ||
        prev.averageKcal !== summary.averageKcal ||
        prev.daysWithinTarget !== summary.daysWithinTarget ||
        prev.compliance !== summary.compliance ||
        prev.trend !== summary.trend ||
        prev.currentStreak !== summary.currentStreak ||
        prev.longestStreak !== summary.longestStreak ||
        prev.bestDay?.dateISO !== summary.bestDay?.dateISO ||
        prev.bestDay?.totalKcal !== summary.bestDay?.totalKcal;

      if (!metricsChanged) {
        return { ...prev, ...summary, updatedAt: prev.updatedAt };
      }

      return { ...summary, updatedAt: new Date().toISOString() };
    });
  }, [logs, userId, userTdee, currentDateISO]);

  useEffect(() => {
    if (!db || !userId) return;
    if (!weeklyStats.periodStart || !weeklyStats.periodEnd) return;

    const serialized = JSON.stringify(weeklyStats);
    if (lastPersistedWeeklyStats.current === serialized) return;
    lastPersistedWeeklyStats.current = serialized;

    void setDoc(doc(db, 'profiles', userId, 'stats', 'weekly'), weeklyStats, { merge: true }).catch(
      (error) => {
        console.error('No se pudieron guardar las estadísticas semanales', error);
      }
    );
  }, [userId, weeklyStats]);

  useEffect(() => {
    lastPersistedWeeklyStats.current = null;
  }, [userId]);

  useEffect(() => {
    if (!db || !userId) return;
    const statsRef = doc(db, 'profiles', userId, 'stats', 'weekly');
    const unsubscribe = onSnapshot(
      statsRef,
      (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.data() as WeeklyStatsSummary;
        setWeeklyStats((prev) => {
          if (data.updatedAt && prev.updatedAt && prev.updatedAt >= data.updatedAt) {
            return prev;
          }
          lastPersistedWeeklyStats.current = JSON.stringify(data);
          return { ...prev, ...data };
        });
      },
      (error) => {
        console.error('Error al escuchar las estadísticas semanales', error);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // === API ===

  const addEntry = (entry: Omit<IntakeEntry, 'id' | 'userId' | 'dateISO'>) => {
    if (!userId) return;

    const consumedAtISO = normalizeConsumedAt(entry.consumedAt);
    const meal = entry.meal ?? classifyMealByTime(new Date(consumedAtISO));

    const normalizeName = (value?: string) => value?.trim().toLowerCase() ?? '';

    const duplicateIndex = todayEntries.findIndex((existing) => {
      if (entry.foodId && existing.foodId) {
        return entry.foodId === existing.foodId;
      }

      if (!entry.foodId && !existing.foodId) {
        const sameName = normalizeName(entry.customName) === normalizeName(existing.customName);
        const sameKcal = existing.kcalPerUnit === entry.kcalPerUnit;
        return sameName && sameKcal;
      }

      return false;
    });

    if (duplicateIndex >= 0) {
      const increment = entry.units ?? 1;
      const updated = todayEntries.map((existing, index) =>
        index === duplicateIndex
          ? {
              ...existing,
              units: existing.units + increment,
              consumedAt: consumedAtISO || existing.consumedAt,
              meal: existing.meal ?? meal,
            }
          : existing
      );

      setTodayEntries(updated);
      saveTodayLog(updated);
      return;
    }

    const newEntry: IntakeEntry = {
      ...entry,
      id: `entry_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      userId,
      dateISO: currentDateISO,
      consumedAt: consumedAtISO,
      meal,
    };

    const updated = [...todayEntries, newEntry];
    setTodayEntries(updated);
    saveTodayLog(updated);
  };

  const updateEntry = (id: string, units: number) => {
    const updated = todayEntries.map((e) => (e.id === id ? { ...e, units } : e));
    setTodayEntries(updated);
    saveTodayLog(updated);
  };

  const deleteEntry = (id: string) => {
    const updated = todayEntries.filter((e) => e.id !== id);
    setTodayEntries(updated);
    saveTodayLog(updated);
  };

  const resetToday = () => {
    setTodayEntries([]);
    saveTodayLog([]);
  };

  const undoLast = () => {
    if (todayEntries.length === 0) return;
    const updated = todayEntries.slice(0, -1);
    setTodayEntries(updated);
    saveTodayLog(updated);
  };

  const getLogsForDateRange = (dates: string[]): DailyLog[] => {
    if (!userId) return [];
    return dates.map((dateISO) => {
      const log = logs.find((l) => l.userId === userId && l.dateISO === dateISO);
      const entries = log?.entries ?? [];
      const totalKcal = entries.reduce((sum, e) => sum + e.kcalPerUnit * e.units, 0);
      return { userId, dateISO, entries, totalKcal };
    });
  };

  return (
    <IntakeContext.Provider
      value={{
        todayEntries,
        todayTotal,
        addEntry,
        updateEntry,
        deleteEntry,
        resetToday,
        undoLast,
        getLogsForDateRange,
        weeklyStats,
        userTdee, // <-- EXPORTACIÓN CLAVE
      }}
    >
      {children}
    </IntakeContext.Provider>
  );
};

export const useIntake = () => {
  const context = useContext(IntakeContext);
  if (!context) {
    throw new Error('useIntake debe usarse dentro de un IntakeProvider');
  }
  return context;
};
