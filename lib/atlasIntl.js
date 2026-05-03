import { normalizeLang, normalizeCurrency } from '@/lib/atlasPrefs';

/** Intl / API için BCP 47 yerel ayarı */
export function atlasLangToLocale(lang) {
  return normalizeLang(lang) === 'EN' ? 'en-US' : 'tr-TR';
}

/** Hotellook widget_location_dump — küçük harf para kodu */
export function atlasCurrencyToHotellook(currency) {
  const c = normalizeCurrency(currency).toLowerCase();
  if (c === 'try') return 'try';
  if (c === 'eur') return 'eur';
  return 'usd';
}

export function atlasLangToHotellookLanguage(lang) {
  return normalizeLang(lang) === 'EN' ? 'en' : 'tr';
}

export function formatAtlasMoney(amount, currency, lang) {
  const loc = atlasLangToLocale(lang);
  const cur = normalizeCurrency(currency);
  try {
    return new Intl.NumberFormat(loc, {
      style: 'currency',
      currency: cur,
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);
  } catch {
    return `${Number(amount) || 0} ${cur}`;
  }
}
