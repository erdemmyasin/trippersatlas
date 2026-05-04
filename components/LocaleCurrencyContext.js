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
import { atlasLangToLocale } from '@/lib/atlasIntl';

const LocaleCurrencyContext = createContext(null);

export function LocaleCurrencyProvider({ children, initialLang, initialRegion }) {
  const seedLang = normalizeLang(initialLang || 'TR');
  const seedCurrency = normalizeCurrency(seedLang === 'TR' ? 'TRY' : 'EUR');
  const [lang, setLangState] = useState(seedLang);
  const [currency, setCurrencyState] = useState(seedCurrency);
  const [ready, setReady] = useState(false);
  const [region] = useState(() => initialRegion || null);

  useLayoutEffect(() => {
    const stored = loadAtlasPrefs({ hasUserChoice: true });
    if (stored) {
      setLangState(stored.lang);
      setCurrencyState(stored.currency);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    function onStorage(e) {
      if (e.key === 'atlas_pref_lang' || e.key === 'atlas_pref_currency' || e.key === null) {
        const p = loadAtlasPrefs();
        if (p) {
          setLangState(p.lang);
          setCurrencyState(p.currency);
        }
      }
    }
    function onCustom() {
      const p = loadAtlasPrefs();
      if (p) {
        setLangState(p.lang);
        setCurrencyState(p.currency);
      }
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

  const locale = useMemo(() => atlasLangToLocale(lang), [lang]);

  const value = useMemo(
    () => ({
      lang,
      currency,
      locale,
      setLang,
      setCurrency,
      ready,
      region,
    }),
    [lang, currency, locale, setLang, setCurrency, ready, region]
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
