import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeState } from '../types';
import { useSession } from './SessionContext';

const STORAGE_KEY = 'theme';

// Devuelve 'light' o 'dark' según el sistema operativo (por si prefieres usarlo más adelante).
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const getStoredTheme = (): 'light' | 'dark' | null => {
  if (typeof window === 'undefined') return null;
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === 'light' || saved === 'dark' ? saved : null;
};

const ThemeContext = createContext<ThemeState | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updatePreferences } = useSession();

  /**
   * Calcula el tema inicial:
   *  - Primero intenta leer localStorage.
   *  - Si no hay preferencia guardada, usa 'dark' como valor por defecto.
   */
  const initialTheme = useMemo<'light' | 'dark'>(() => {
    const stored = getStoredTheme();
    if (stored) return stored;
    // Por defecto usa modo oscuro cuando no hay preferencia guardada
    return 'dark';
  }, []);

  const [theme, setTheme] = useState<'light' | 'dark'>(initialTheme);

  // Si el usuario tiene una preferencia de tema guardada en su perfil, se aplica.
  useEffect(() => {
    const preferred = user?.preferences?.theme;
    if (preferred && preferred !== theme) {
      setTheme(preferred);
    }
  }, [user?.preferences?.theme, theme]);

  // Actualiza el atributo data-theme y guarda el tema en localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, theme);
    }
  }, [theme]);

  // Cambia de tema y actualiza las preferencias del usuario si está autenticado
  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      updatePreferences({ theme: next });
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
