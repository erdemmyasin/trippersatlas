'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { loadAtlasPrefs, saveAtlasPrefs, normalizeLang, normalizeCurrency } from '@/lib/atlasPrefs';

const LocaleCurrencyContext = createContext(null);

export function LocaleCurrencyProvider({ children }) {
  const [lang, setLangState] = useState('TR');
  const [currency, setCurrencyState] = useState('TRY');
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const p = loadAtlasPrefs();
    setLangState(p.lang);
    setCurrencyState(p.currency);
    setReady(true);
  }, []);

  useEffect(() => {
    function onStorage(e) {
      if (e.key === 'atlas_pref_lang' || e.key === 'atlas_pref_currency' || e.key === null) {
        const p = loadAtlasPrefs();
        setLangState(p.lang);
        setCurrencyState(p.currency);
      }
    }
    function onCustom() {
      const p = loadAtlasPrefs();
      setLangState(p.lang);
      setCurrencyState(p.currency);
    }
    window.addEventListener('storage', onStorage);
    window.addEventListener('atlas-prefs-change', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('atlas-prefs-change', onCustom);
    };
  }, []);

  useEffect(() => {
    if (!ready || typeof document === 'undefined') return;
    const htmlLang = lang === 'EN' ? 'en' : 'tr';
    document.documentElement.lang = htmlLang;
  }, [lang, ready]);

  const setLang = useCallback((next) => {
    const v = normalizeLang(next);
    setLangState(v);
    saveAtlasPrefs({ lang: v });
  }, []);

  const setCurrency = useCallback((next) => {
    const v = normalizeCurrency(next);
    setCurrencyState(v);
    saveAtlasPrefs({ currency: v });
  }, []);

  const value = useMemo(
    () => ({
      lang,
      currency,
      setLang,
      setCurrency,
      ready,
    }),
    [lang, currency, setLang, setCurrency, ready]
  );

  return <LocaleCurrencyContext.Provider value={value}>{children}</LocaleCurrencyContext.Provider>;
}

export function useLocaleCurrency() {
  const ctx = useContext(LocaleCurrencyContext);
  if (!ctx) {
    throw new Error('useLocaleCurrency must be used within LocaleCurrencyProvider');
  }
  return ctx;
}
