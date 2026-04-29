/**
 * Google Places API (New) — server-side only.
 * https://places.googleapis.com/v1/
 */

import {
  placesTextSearchLocale,
  defaultHotelTextQueryPrefix,
  defaultRestaurantFallbackQuery,
} from '@/lib/taRegion';

const PLACES_BASE = 'https://places.googleapis.com/v1';

function getKey() {
  const k = process.env.GOOGLE_PLACES_KEY;
  if (!k) throw new Error('GOOGLE_PLACES_KEY is not set');
  return k;
}

const SEARCH_FIELD_MASK = [
  'places.displayName',
  'places.formattedAddress',
  'places.rating',
  'places.userRatingCount',
  'places.priceLevel',
  'places.photos',
  'places.location',
  'places.id',
  'places.types',
  'places.websiteUri',
].join(',');

const DETAILS_FIELD_MASK = [
  'displayName',
  'formattedAddress',
  'rating',
  'userRatingCount',
  'priceLevel',
  'photos',
  'location',
  'id',
  'types',
  'websiteUri',
  'nationalPhoneNumber',
  'regularOpeningHours',
].join(',');

/** @param {string} photoName e.g. places/ChIJ.../photos/AWn5SU... */
export function getPhotoUrl(photoName, maxWidth = 400) {
  if (!photoName) return null;
  const key = process.env.GOOGLE_PLACES_KEY;
  if (!key) return null;
  const path = String(photoName).replace(/^\/+/, '');
  return `https://places.googleapis.com/v1/${encodeURIComponent(path)}/media?maxWidthPx=${maxWidth}&key=${key}`;
}

function mapPriceLevel(level) {
  if (level == null || level === 'PRICE_LEVEL_UNSPECIFIED') return { label: '—', night: 3200 };
  if (typeof level === 'number') {
    if (level === 0) return { label: '₺', night: 800 };
    if (level === 1) return { label: '₺₺', night: 1800 };
    if (level === 2) return { label: '₺₺₺', night: 3500 };
    if (level === 3) return { label: '₺₺₺₺', night: 5500 };
    if (level === 4) return { label: '₺₺₺₺₺', night: 8500 };
  }
  const s = String(level);
  if (s.includes('FREE') || s === 'PRICE_LEVEL_FREE') return { label: '₺', night: 800 };
  if (s.includes('INEXPENSIVE')) return { label: '₺₺', night: 1800 };
  if (s.includes('MODERATE')) return { label: '₺₺₺', night: 3500 };
  if (s.includes('VERY_EXPENSIVE')) return { label: '₺₺₺₺₺', night: 8500 };
  if (s.includes('EXPENSIVE')) return { label: '₺₺₺₺', night: 5500 };
  return { label: '—', night: 3200 };
}

function starsFromRating(rating) {
  const r = Number(rating);
  if (!Number.isFinite(r)) return 4;
  if (r >= 4.6) return 5;
  if (r >= 4.1) return 4;
  if (r >= 3.5) return 4;
  return 3;
}

/**
 * @param {object} place raw Place from API
 * @returns {object}
 */
export function normalizePlace(place) {
  const loc = place.location || {};
  const lat = loc.latitude ?? null;
  const lng = loc.longitude ?? null;
  const name = place.displayName?.text || '';
  const photoName = place.photos?.[0]?.name || null;
  const photo = getPhotoUrl(photoName, 400);
  const resourceName = place.name || (place.id ? `places/${place.id}` : '');
  const placeId =
    String(place.id || '')
      .replace(/^places\//, '')
      .trim() ||
    resourceName.replace(/^places\//, '') ||
    '';
  const { label: priceLabel, night: priceNight } = mapPriceLevel(place.priceLevel);

  const addr = place.formattedAddress || '';
  const district = addr.split(',').slice(0, 2).join(',').trim() || addr || name;

  return {
    name,
    address: addr,
    rating: place.rating ?? null,
    reviews: place.userRatingCount ?? 0,
    price: priceLabel,
    priceNight,
    photo,
    photoName,
    lat,
    lng,
    placeId,
    placeResourceName: resourceName,
    types: place.types || [],
    websiteUri: place.websiteUri || null,
    stars: starsFromRating(place.rating),
    district,
  };
}

/**
 * @param {object} opts
 * @param {string} opts.textQuery
 * @param {string} [opts.includedType] lodging | restaurant | ...
 * @param {number} [opts.lat]
 * @param {number} [opts.lng]
 * @param {number} [opts.radiusMeters] default 50000
 * @param {number} [opts.maxResultCount] default 20
 */
export async function searchPlaces({
  textQuery,
  includedType,
  lat,
  lng,
  radiusMeters = 50000,
  maxResultCount = 20,
  languageCode,
  regionCode,
} = {}) {
  if (!textQuery || !String(textQuery).trim()) {
    return { places: [], error: 'empty_query' };
  }

  const loc = placesTextSearchLocale();
  const lang = languageCode ?? loc.languageCode;
  const reg = regionCode !== undefined ? regionCode : loc.regionCode;

  const key = getKey();
  const body = {
    textQuery: String(textQuery).trim(),
    maxResultCount: Math.min(Math.max(1, maxResultCount), 20),
    languageCode: lang,
  };
  if (reg) body.regionCode = reg;

  if (includedType) {
    body.includedType = includedType;
  }

  if (typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng)) {
    body.locationBias = {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: Math.min(Math.max(500, radiusMeters), 50000),
      },
    };
  }

  const res = await fetch(`${PLACES_BASE}/places:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': SEARCH_FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error('Places searchText error:', res.status, json);
    return { places: [], error: json?.error?.message || `http_${res.status}`, raw: json };
  }

  const list = Array.isArray(json.places) ? json.places : [];
  return { places: list.map(normalizePlace), error: null };
}

export async function searchHotels(query, location = {}) {
  const q = location.city ? `${query} ${location.city}`.trim() : query;
  return searchPlaces({
    textQuery: q || defaultHotelTextQueryPrefix(),
    includedType: 'lodging',
    lat: location.lat,
    lng: location.lng,
    radiusMeters: location.radius ?? 25000,
    maxResultCount: 20,
  });
}

export async function searchRestaurants(query, location = {}) {
  const q = location.city ? `${query} ${location.city}`.trim() : query;
  return searchPlaces({
    textQuery: q || defaultRestaurantFallbackQuery(),
    includedType: 'restaurant',
    lat: location.lat,
    lng: location.lng,
    radiusMeters: location.radius ?? 15000,
    maxResultCount: 20,
  });
}

/**
 * @param {string} query
 * @param {string} type 'hotel' | 'restaurant' | 'lodging' | 'cafe' | etc.
 */
export async function searchPlacesByType(query, type, location = {}) {
  const typeMap = {
    hotel: 'lodging',
    lodging: 'lodging',
    restaurant: 'restaurant',
    cafe: 'cafe',
    bar: 'bar',
    tourist_attraction: 'tourist_attraction',
    car_rental: 'car_rental',
  };
  const included = typeMap[String(type).toLowerCase()] || type || undefined;
  const q = location.city ? `${query} ${location.city}`.trim() : query;
  return searchPlaces({
    textQuery: q,
    includedType: included,
    lat: location.lat,
    lng: location.lng,
    radiusMeters: location.radius ?? 30000,
    maxResultCount: 20,
  });
}

/**
 * @param {string} placeResourceName full resource e.g. places/ChIJ...
 */
export async function getPlaceDetails(placeResourceName) {
  if (!placeResourceName) return { place: null, error: 'no_id' };
  const key = getKey();
  const name = placeResourceName.startsWith('places/')
    ? placeResourceName
    : `places/${placeResourceName}`;
  const placeId = name.replace(/^places\//, '');
  const url = `${PLACES_BASE}/places/${encodeURIComponent(placeId)}`;
  const res = await fetch(url, {
    headers: {
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': DETAILS_FIELD_MASK,
    },
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('Place details error:', res.status, json);
    return { place: null, error: json?.error?.message || `http_${res.status}` };
  }

  return { place: normalizePlace(json), error: null };
}
