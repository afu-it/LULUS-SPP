'use client';

import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import en from '@/i18n/en.json';
import ms from '@/i18n/ms.json';

const I18N_STORAGE_KEY = 'lulus-spp:locale';

const dictionaries = {
  en,
  ms,
} as const;

export type Locale = keyof typeof dictionaries;

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

export const I18nContext = createContext<I18nContextValue | undefined>(undefined);

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>('ms');

  useEffect(() => {
    const storedLocale = window.localStorage.getItem(I18N_STORAGE_KEY);

    if (storedLocale === 'en' || storedLocale === 'ms') {
      setLocaleState(storedLocale);
    }
  }, []);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    window.localStorage.setItem(I18N_STORAGE_KEY, nextLocale);
  }, []);

  const t = useCallback(
    (key: string) => {
      const messages = dictionaries[locale] as Record<string, string>;
      return messages[key] ?? key;
    },
    [locale]
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
    }),
    [locale, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
