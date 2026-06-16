/**
 * LocaleContext — simple language switch provider.
 *
 * Supports: 'zh' (Simplified Chinese) | 'en' (English)
 * Persists to localStorage. Falls back to 'zh' if unset.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import zh from './zh';
import en from './en';

export type Locale = 'zh' | 'en';

const TRANSLATIONS: Record<Locale, Record<string, string>> = { zh, en };

const STORAGE_KEY = 'art-of-war-locale';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'zh',
  setLocale: () => {},
  t: (key: string) => key,
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'zh') return stored;
    } catch (_) {}
    return 'zh';
  });

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch (_) {}
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const table = TRANSLATIONS[locale];
      let text = table[key] ?? TRANSLATIONS['zh'][key] ?? key;

      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.replace(`{${k}}`, String(v));
        }
      }

      return text;
    },
    [locale]
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}
