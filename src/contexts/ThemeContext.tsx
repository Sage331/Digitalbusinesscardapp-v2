import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  bg: string;
  textMain: string;
  textSub: string;
  cardBg: string;
  border: string;
  primary: string;
}

export const lightTheme: ThemeColors = {
  bg: '#f8f9fc',
  textMain: '#0f172a',
  textSub: '#64748b',
  cardBg: '#ffffff',
  border: '#f1f5f9',
  primary: '#2563eb',
};

export const darkTheme: ThemeColors = {
  bg: '#0f172a',
  textMain: '#f8fafc',
  textSub: '#94a3b8',
  cardBg: '#1e293b',
  border: '#334155',
  primary: '#3b82f6',
};

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
  theme: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('connectme_theme').then((savedMode) => {
      if (savedMode) setThemeModeState(savedMode as ThemeMode);
      setIsReady(true);
    });
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await AsyncStorage.setItem('connectme_theme', mode);
  };

  const isDark = themeMode === 'system' ? systemColorScheme === 'dark' : themeMode === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  if (!isReady) return null;

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, isDark, theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};