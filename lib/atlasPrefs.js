/** Atlas — dil ve para birimi (localStorage, tüm sayfalar) */

export const ATLAS_PREF_LANG_KEY = 'atlas_pref_lang';
export const ATLAS_PREF_CURRENCY_KEY = 'atlas_pref_currency';

export const ATLAS_LANGS = ['TR', 'EN'];
export const ATLAS_CURRENCIES = ['TRY', 'EUR', 'USD'];

export function normalizeLang(raw) {
  const u = String(raw || '').toUpperCase();
  return ATLAS_LANGS.includes(u) ? u : 'TR';
}

export function normalizeCurrency(raw) {
  const u = String(raw || '').toUpperCase();
  return ATLAS_CURRENCIES.includes(u) ? u : 'TRY';
}

export function loadAtlasPrefs() {
  if (typeof window === 'undefined') {
    return { lang: 'TR', currency: 'TRY' };
  }
  try {
    const lang = normalizeLang(localStorage.getItem(ATLAS_PREF_LANG_KEY));
    const currency = normalizeCurrency(localStorage.getItem(ATLAS_PREF_CURRENCY_KEY));
    return { lang, currency };
  } catch {
    return { lang: 'TR', currency: 'TRY' };
  }
}

export function saveAtlasPrefs({ lang, currency } = {}) {
  if (typeof window === 'undefined') return;
  try {
    if (lang != null) localStorage.setItem(ATLAS_PREF_LANG_KEY, normalizeLang(lang));
    if (currency != null) localStorage.setItem(ATLAS_PREF_CURRENCY_KEY, normalizeCurrency(currency));
    window.dispatchEvent(new Event('atlas-prefs-change'));
  } catch {
    /* ignore */
  }
}
