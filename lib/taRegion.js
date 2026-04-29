/**
 * Ürün pazarı: varsayılan **global**; Türkiye ağırlıklı davranış için
 * `.env` içinde `NEXT_PUBLIC_TA_MARKET=tr` kullanın.
 *
 * Kullanım: geocode son eki, Places dil/bölge, varsayılan şehirler, görsel sorguları.
 */

export const TA_MARKET =
  typeof process.env.NEXT_PUBLIC_TA_MARKET === 'string' &&
  process.env.NEXT_PUBLIC_TA_MARKET.toLowerCase() === 'tr'
    ? 'tr'
    : 'global';

export function isTurkeyPrimaryMarket() {
  return TA_MARKET === 'tr';
}

/**
 * Geocode adresi. TR pazarında virgülsüz tek parça (ör. şehir adı) ise ", Türkiye" eklenir;
 * "Şehir, Ülke" veya zaten Türkiye/Turkey geçen metinler olduğu gibi bırakılır.
 */
export function appendRegionalGeocodeContext(addressLine) {
  const a = String(addressLine || '').trim();
  if (!a) return a;
  if (TA_MARKET !== 'tr') return a;
  const lower = a.toLowerCase();
  if (lower.includes('türkiye') || lower.includes('turkey')) return a;
  if (a.includes(',')) return a;
  return `${a}, Türkiye`;
}

/** Yeni gezi / boş meta için kısa hedef etiketi. */
export function defaultTripDestinationLabel() {
  return TA_MARKET === 'tr' ? 'Türkiye' : '';
}

/** Konaklama hızlı arama — boş alan doldurulunca kullanılan varsayılan şehir. */
export function defaultStayCity() {
  return TA_MARKET === 'tr' ? 'İstanbul' : 'London';
}

/** Harita başlangıç merkezi (arama öncesi). */
export function defaultMapAnchorPreset() {
  return TA_MARKET === 'tr'
    ? { lat: 41.0082, lng: 28.9784 }
    : { lat: 51.5074, lng: -0.1278 };
}

/** Araç kiralama varsayılan adres satırı. */
export function defaultCarLocationLine() {
  return TA_MARKET === 'tr' ? 'İstanbul, Türkiye' : 'London, United Kingdom';
}

/** Gezi / kart görsel araması (Unsplash vb.). */
export function tripCardImageSearchQuery(primaryDestination) {
  const d = String(primaryDestination || '').trim();
  if (!d) {
    return TA_MARKET === 'tr' ? 'Turkey travel' : 'travel destination';
  }
  if (TA_MARKET === 'tr') return `${d} Turkey travel`;
  return `${d} travel`;
}

/** tripStore / yeni gezi için imageQuery kökü. */
export function tripStoreDefaultImageQuery(destination) {
  const d = String(destination || '').trim();
  if (d) return `${d} travel landmark`;
  return TA_MARKET === 'tr' ? 'Turkey travel landmark' : 'travel landmark';
}

/** Google Places text search (dil / bölge önyargısı). */
export function placesTextSearchLocale() {
  if (TA_MARKET === 'tr') return { languageCode: 'tr', regionCode: 'tr' };
  return { languageCode: 'en', regionCode: undefined };
}

export function defaultHotelTextQueryPrefix() {
  return TA_MARKET === 'tr' ? 'oteller' : 'hotels';
}

export function defaultRestaurantFallbackQuery() {
  return TA_MARKET === 'tr' ? 'restoran' : 'restaurant';
}

/** Keşfet / liste görselleri için anahtar kelime. */
export function listingImageKeywordSuffix() {
  return TA_MARKET === 'tr' ? 'turkey,travel' : 'travel,destination';
}

/** Araç kiralama metin araması (mock / Places). */
export function carRentalSearchQueryFragment(cityLine) {
  const loc = String(cityLine || '').trim();
  if (TA_MARKET === 'tr') return `araç kiralama ${loc}`.trim();
  return `car rental ${loc}`.trim();
}
