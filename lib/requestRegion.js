/**
 * Sunucu tarafı bölge/dil tespiti.
 *
 * Öncelik: kullanıcı tercihi (cookie) → host geo header → Accept-Language → varsayılan.
 *
 * Hosting bağımsızlığı: Vercel (`x-vercel-ip-country`), Cloudflare (`cf-ipcountry`),
 * Netlify/Akamai (`x-country`) header'larını sırayla kontrol eder. Host değişirse
 * yalnızca burayı güncellemek yeterli.
 */

const TR_LIKE_LANG_PREFIXES = ['tr'];

function pickCountryFromHeaders(headers) {
  const get = (k) => headers.get?.(k) || headers[k] || '';
  const candidates = [
    get('x-vercel-ip-country'),
    get('cf-ipcountry'),
    get('x-country'),
    get('x-geo-country'),
  ];
  for (const raw of candidates) {
    const v = String(raw || '').trim().toUpperCase();
    if (v && v !== 'XX' && v !== 'T1') return v;
  }
  return '';
}

function pickLangFromAcceptLanguage(headers) {
  const raw = headers.get?.('accept-language') || headers['accept-language'] || '';
  const first = String(raw)
    .split(',')[0]
    .split(';')[0]
    .trim()
    .toLowerCase();
  if (!first) return '';
  if (TR_LIKE_LANG_PREFIXES.some((p) => first.startsWith(p))) return 'TR';
  return 'EN';
}

function pickLangFromCountry(country) {
  if (!country) return '';
  if (country === 'TR') return 'TR';
  return 'EN';
}

/**
 * @param {Headers|Record<string,string>} headers
 * @param {{ get?: (n: string) => { value?: string } | undefined } | Record<string,string> | undefined} cookies
 * @returns {{ country: string, lang: 'TR'|'EN', source: string }}
 */
export function getRequestRegion(headers, cookies) {
  const cookieLangRaw =
    (cookies?.get?.('atlas_pref_lang')?.value) ||
    (typeof cookies?.atlas_pref_lang === 'string' ? cookies.atlas_pref_lang : '') ||
    '';
  const cookieLang = String(cookieLangRaw).toUpperCase();
  if (cookieLang === 'TR' || cookieLang === 'EN') {
    return { country: '', lang: cookieLang, source: 'cookie' };
  }

  const country = pickCountryFromHeaders(headers);
  const langFromCountry = pickLangFromCountry(country);
  if (langFromCountry) {
    return { country, lang: langFromCountry, source: 'geo' };
  }

  const langFromAccept = pickLangFromAcceptLanguage(headers);
  if (langFromAccept) {
    return { country, lang: langFromAccept, source: 'accept-language' };
  }

  return { country, lang: 'TR', source: 'default' };
}
