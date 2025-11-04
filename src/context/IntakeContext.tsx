// src/context/IntakeContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { DailyLog, IntakeEntry, WeeklyStatsSummary } from '../types';
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

interface IntakeContextType {
  todayEntries: IntakeEntry[];
  todayTotal: number;
  addEntry: (entry: Omit<IntakeEntry, 'id' | 'userId' | 'dateISO'>) => void;
  updateEntry: (id: string, units: number) => void;
  deleteEntry: (id: string) => void;
  resetToday: () => void;
  undoLast: () => void;
  getLogsForDateRange: (dates: string[]) => DailyLog[];
  weeklyStats: WeeklyStatsSummary;
}

const IntakeContext = createContext<IntakeContextType | undefined>(undefined);

const LOGS_KEY = 'cc_logs_v1';
const CHECK_INTERVAL_MS = 30 * 1000; // valida cambio de día en vivo

const logDocId = (userId: string, dateISO: string) => `${userId}_${dateISO}`;

const defaultWeeklyStats = (dates: string[]): WeeklyStatsSummary => ({
  periodStart: dates[0] ?? '',
  periodEnd: dates[dates.length - 1] ?? '',
  totalKcal: 0,
  averageKcal: 0,
  daysWithinTarget: 0,
  compliance: 0,
  trend: 0,
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
    if (!user) return;
    const todayLog = logs.find((l) => l.userId === user.id && l.dateISO === dateISO);
    if (todayLog) {
      const entries = todayLog.entries ?? [];
      const recalculatedTotal = entries.reduce((sum, e) => sum + e.kcalPerUnit * e.units, 0);
      setTodayEntries(entries);
      setTodayTotal(recalculatedTotal);

      if (recalculatedTotal !== todayLog.totalKcal) {
        setLogs((prev) =>
          prev.map((log) =>
            log.userId === user.id && log.dateISO === dateISO
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
    if (!user) return;

    const total = entries.reduce((sum, e) => sum + e.kcalPerUnit * e.units, 0);

    const newLog: DailyLog = {
      userId: user.id,
      dateISO: currentDateISO,
      entries,
      totalKcal: total,
    };

    setLogs((prev) => {
      const updated = prev.filter(
        (l) => !(l.userId === user.id && l.dateISO === currentDateISO)
      );
      return [...updated, newLog];
    });

    if (db) {
      void setDoc(doc(db, 'dailyLogs', logDocId(user.id, currentDateISO)), newLog, { merge: true }).catch(
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
      // cargar datos del nuevo día
      // (espera al siguiente efecto que depende de currentDateISO para cargar del estado)
    }
  };

  // Al montar y cuando cambian usuario, logs o currentDateISO: sincroniza estado derivado
  useEffect(() => {
    if (!user) {
      setTodayEntries([]);
      setTodayTotal(0);
      setWeeklyStats(defaultWeeklyStats(getLastNDays(7)));
      return;
    }
    loadForDate(currentDateISO);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, logs, currentDateISO]);

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
    if (!user) {
      setLogs(readLocalLogs());
      setWeeklyStats(defaultWeeklyStats(getLastNDays(7)));
      return;
    }

    if (!db) {
      setLogs(readLocalLogs().filter((log) => log.userId === user.id));
      const dates = getLastNDays(7);
      const summary = calculateWeeklySummary(
        readLocalLogs().filter((log) => log.userId === user.id),
        user.tdee ?? 2000,
        dates
      );
      setWeeklyStats({ ...summary, updatedAt: new Date().toISOString() });
      return;
    }

    const logsRef = collection(db, 'dailyLogs');
    const logsQuery = query(logsRef, where('userId', '==', user.id));
    let unsub: (() => void) | undefined;

    (async () => {
      try {
        const snapshot = await getDocs(logsQuery);
        if (snapshot.empty) {
          const localLogs = readLocalLogs().filter((log) => log.userId === user.id);
          if (localLogs.length > 0) {
            await Promise.all(
              localLogs.map((log) =>
                setDoc(doc(db, 'dailyLogs', logDocId(user.id, log.dateISO)), log, {
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
              userId: data.userId ?? user.id,
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
  }, [user?.id]);

  // Recalcula resumen semanal cuando cambian logs, usuario o fecha actual
  useEffect(() => {
    const dates = getLastNDays(7);
    if (!user) {
      setWeeklyStats(defaultWeeklyStats(dates));
      return;
    }

    const userLogs = logs.filter((log) => log.userId === user.id);
    const summary = calculateWeeklySummary(userLogs, user.tdee ?? 2000, dates);
    setWeeklyStats((prev) => {
      const metricsChanged =
        prev.periodStart !== summary.periodStart ||
        prev.periodEnd !== summary.periodEnd ||
        prev.totalKcal !== summary.totalKcal ||
        prev.averageKcal !== summary.averageKcal ||
        prev.daysWithinTarget !== summary.daysWithinTarget ||
        prev.compliance !== summary.compliance ||
        prev.trend !== summary.trend ||
        prev.bestDay?.dateISO !== summary.bestDay?.dateISO ||
        prev.bestDay?.totalKcal !== summary.bestDay?.totalKcal;

      if (!metricsChanged) {
        return { ...prev, ...summary, updatedAt: prev.updatedAt };
      }

      return { ...summary, updatedAt: new Date().toISOString() };
    });
  }, [logs, user?.id, user?.tdee, currentDateISO]);

  useEffect(() => {
    if (!db || !user) return;
    if (!weeklyStats.periodStart || !weeklyStats.periodEnd) return;

    const serialized = JSON.stringify(weeklyStats);
    if (lastPersistedWeeklyStats.current === serialized) return;
    lastPersistedWeeklyStats.current = serialized;

    void setDoc(doc(db, 'profiles', user.id, 'stats', 'weekly'), weeklyStats, { merge: true }).catch(
      (error) => {
        console.error('No se pudieron guardar las estadísticas semanales', error);
      }
    );
  }, [db, user, weeklyStats]);

  useEffect(() => {
    lastPersistedWeeklyStats.current = null;
  }, [user?.id]);

  useEffect(() => {
    if (!db || !user) return;
    const statsRef = doc(db, 'profiles', user.id, 'stats', 'weekly');
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
  }, [db, user?.id]);

  // === API ===

  const addEntry = (entry: Omit<IntakeEntry, 'id' | 'userId' | 'dateISO'>) => {
    if (!user) return;
    const consumedAtISO = normalizeConsumedAt(entry.consumedAt);
    const meal = entry.meal ?? classifyMealByTime(new Date(consumedAtISO));
    const newEntry: IntakeEntry = {
      ...entry,
      id: `entry_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      userId: user.id,
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

  const undoStackRef = useRef<string[]>([]); // guarda ids añadidos (simple)
  // si quieres un undo “real”, empuja ids en addEntry y sácalos aquí; por ahora, deshace el último item
  const undoLast = () => {
    if (todayEntries.length === 0) return;
    const updated = todayEntries.slice(0, -1);
    setTodayEntries(updated);
    saveTodayLog(updated);
  };

  const getLogsForDateRange = (dates: string[]): DailyLog[] => {
    if (!user) return [];
    return dates.map((dateISO) => {
      const log = logs.find((l) => l.userId === user.id && l.dateISO === dateISO);
      const entries = log?.entries ?? [];
      const totalKcal = entries.reduce((sum, e) => sum + e.kcalPerUnit * e.units, 0);
      return { userId: user.id, dateISO, entries, totalKcal };
    });
  };

  // Derivados por si luego los quieres memorizar (ya están en estado)
  useMemo(() => todayEntries, [todayEntries]);
  useMemo(() => todayTotal, [todayTotal]);

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
