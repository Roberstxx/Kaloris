// src/context/IntakeContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { DailyLog, IntakeEntry } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { getTodayISO } from '../utils/date';
import { useSession } from './SessionContext';

interface IntakeContextType {
  todayEntries: IntakeEntry[];
  todayTotal: number;
  addEntry: (entry: Omit<IntakeEntry, 'id' | 'userId' | 'dateISO'>) => void;
  updateEntry: (id: string, units: number) => void;
  deleteEntry: (id: string) => void;
  resetToday: () => void;
  undoLast: () => void;
  getLogsForDateRange: (dates: string[]) => DailyLog[];
}

const IntakeContext = createContext<IntakeContextType | undefined>(undefined);

const LOGS_KEY = 'cc_logs_v1';
const CHECK_INTERVAL_MS = 30 * 1000; // valida cambio de día en vivo

export const IntakeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useSession();

  // Día activo controlado para evitar inconsistencias de fecha
  const [currentDateISO, setCurrentDateISO] = useState<string>(() => getTodayISO());

  // Persistencia de todos los logs (array) en localStorage
  const [logs, setLogs] = useLocalStorage<DailyLog[]>(LOGS_KEY, []);

  // Estado derivado del día activo
  const [todayEntries, setTodayEntries] = useState<IntakeEntry[]>([]);
  const [todayTotal, setTodayTotal] = useState(0);

  // Carga las entradas para un dateISO dado (default: currentDateISO)
  const loadForDate = (dateISO: string = currentDateISO) => {
    if (!user) return;
    const todayLog = logs.find((l) => l.userId === user.id && l.dateISO === dateISO);
    if (todayLog) {
      setTodayEntries(todayLog.entries);
      setTodayTotal(todayLog.totalKcal);
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

    // reemplaza el log del (user, currentDateISO)
    const updated = logs.filter(
      (l) => !(l.userId === user.id && l.dateISO === currentDateISO)
    );
    setLogs([...updated, newLog]);

    setTodayTotal(total);
  };

  // Rollover: si cambia el día mientras la app está abierta, actualiza currentDateISO y recarga
  const validateRollover = () => {
    const today = getTodayISO();
    if (today !== currentDateISO) {
      setCurrentDateISO(today);
      // cargar datos del nuevo día
      // (espera al siguiente efecto que depende de currentDateISO para cargar del LS)
    }
  };

  // Al montar y cuando cambian usuario, logs o currentDateISO: sincroniza estado derivado
  useEffect(() => {
    if (!user) {
      setTodayEntries([]);
      setTodayTotal(0);
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

  // === API ===

  const addEntry = (entry: Omit<IntakeEntry, 'id' | 'userId' | 'dateISO'>) => {
    if (!user) return;
    const newEntry: IntakeEntry = {
      ...entry,
      id: `entry_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      userId: user.id,
      dateISO: currentDateISO,
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
      return log || { userId: user.id, dateISO, entries: [], totalKcal: 0 };
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
      }}
    >
      {children}
    </IntakeContext.Provider>
  );
};

export const useIntake = () => {
  const ctx = useContext(IntakeContext);
  if (!ctx) throw new Error('useIntake must be used within IntakeProvider');
  return ctx;
};
