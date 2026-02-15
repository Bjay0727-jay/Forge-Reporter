/**
 * Forge Cyber Defense - Theme Hook
 * Provides dark mode support across the app
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ThemeMode } from '../config/colors';
import { getThemeMode, setThemeMode, setCurrentMode, lightTheme, darkTheme } from '../config/colors';

interface ThemeContextType {
  mode: ThemeMode;
  colors: typeof lightTheme;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => getThemeMode());

  // Update colors when mode changes
  const colors = mode === 'dark' ? darkTheme : lightTheme;

  // Initialize theme on mount
  useEffect(() => {
    const initialMode = getThemeMode();
    setModeState(initialMode);
    setCurrentMode(initialMode);
    document.documentElement.setAttribute('data-theme', initialMode);
  }, []);

  // Set mode handler
  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    setThemeMode(newMode);
    setCurrentMode(newMode);
  }, []);

  // Toggle theme handler
  const toggleTheme = useCallback(() => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
  }, [mode, setMode]);

  return (
    <ThemeContext.Provider value={{ mode, colors, toggleTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
