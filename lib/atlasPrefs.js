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

/**
 * Kullanıcının kaydettiği dil/para tercihini döner.
 * `hasUserChoice: true` geçildiğinde, tercih hiç kaydedilmemişse `null` döner —
 * böylece çağıran taraf sunucuda tespit edilmiş varsayılana yapışabilir.
 */
export function loadAtlasPrefs(opts) {
  const requireChoice = !!opts?.hasUserChoice;
  if (typeof window === 'undefined') {
    return requireChoice ? null : { lang: 'TR', currency: 'TRY' };
  }
  try {
    const rawLang = localStorage.getItem(ATLAS_PREF_LANG_KEY);
    const rawCur = localStorage.getItem(ATLAS_PREF_CURRENCY_KEY);
    if (requireChoice && rawLang == null && rawCur == null) return null;
    const lang = normalizeLang(rawLang);
    const currency = normalizeCurrency(rawCur);
    return { lang, currency };
  } catch {
    return requireChoice ? null : { lang: 'TR', currency: 'TRY' };
  }
}

const COOKIE_MAX_AGE = 400 * 24 * 60 * 60;

function syncAtlasPrefsCookies(lang, currency) {
  if (typeof document === 'undefined') return;
  const base = `;path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`;
  try {
    document.cookie = `atlas_pref_lang=${encodeURIComponent(normalizeLang(lang))}${base}`;
    document.cookie = `atlas_pref_currency=${encodeURIComponent(normalizeCurrency(currency))}${base}`;
  } catch {
    /* ignore */
  }
}

export function saveAtlasPrefs({ lang, currency } = {}) {
  if (typeof window === 'undefined') return;
  try {
    const prev = loadAtlasPrefs();
    const L = lang != null ? normalizeLang(lang) : prev.lang;
    const C = currency != null ? normalizeCurrency(currency) : prev.currency;
    if (lang != null) localStorage.setItem(ATLAS_PREF_LANG_KEY, L);
    if (currency != null) localStorage.setItem(ATLAS_PREF_CURRENCY_KEY, C);
    syncAtlasPrefsCookies(L, C);
    window.dispatchEvent(new Event('atlas-prefs-change'));
  } catch {
    /* ignore */
  }
}
