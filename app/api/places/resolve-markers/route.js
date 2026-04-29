import { searchPlaces } from '@/lib/googlePlaces';
import { placesTextSearchLocale } from '@/lib/taRegion';

const CACHE = new Map();
const CACHE_MAX = 200;

function cacheGet(k) {
  const e = CACHE.get(k);
  if (!e) return null;
  if (Date.now() > e.exp) {
    CACHE.delete(k);
    return null;
  }
  return e.val;
}

function cacheSet(k, val) {
  if (CACHE.size >= CACHE_MAX) {
    const first = CACHE.keys().next().value;
    if (first != null) CACHE.delete(first);
  }
  CACHE.set(k, { val, exp: Date.now() + 24 * 60 * 60 * 1000 });
}

function typeToIncluded(type) {
  const t = String(type || 'hotel').toLowerCase();
  if (t === 'restaurant') return 'restaurant';
  if (t === 'cafe') return 'cafe';
  if (t === 'villa' || t === 'hotel' || t === 'clinic' || t === 'accommodation') return 'lodging';
  if (t === 'tour' || t === 'boat') return 'tourist_attraction';
  return 'lodging';
}

function parseRatingFromTrust(trust) {
  if (!trust || typeof trust !== 'string') return null;
  const m = trust.match(/(\d+[.,]\d+|\d+)/);
  if (!m) return null;
  const n = Number(String(m[1]).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

async function resolveOnePlace({ textQuery, includedType, lat, lng }) {
  const common = {
    textQuery,
    maxResultCount: 1,
    ...placesTextSearchLocale(),
    radiusMeters: 50000,
    lat,
    lng,
  };

  let { places, error } = await searchPlaces({
    ...common,
    includedType,
  });

  if ((!places || !places[0]) && includedType) {
    const second = await searchPlaces({
      ...common,
      includedType: undefined,
    });
    places = second.places;
    error = second.error || error;
  }

  return { place: places?.[0] || null, error };
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const items = Array.isArray(body.items) ? body.items : [];
    const biasLat = body.bias?.lat != null ? Number(body.bias.lat) : undefined;
    const biasLng = body.bias?.lng != null ? Number(body.bias.lng) : undefined;
    const hasBias = Number.isFinite(biasLat) && Number.isFinite(biasLng);

    const markers = [];

    for (const it of items.slice(0, 12)) {
      const name = String(it.name || '').trim();
      const loc = String(it.location || '').trim();
      const listingKey = String(it.listingKey || '').trim() || `${name}|${loc}`.toLowerCase();
      if (!name) continue;

      const q = loc ? `${name} ${loc}` : name;
      const includedType = typeToIncluded(it.type);
      const cacheKey = `${q}|${hasBias ? `${biasLat},${biasLng}` : 'nb'}|${includedType || 'any'}`;
      const cached = cacheGet(cacheKey);
      if (cached) {
        markers.push({
          id: cached.id,
          listingKey,
          lat: cached.lat,
          lng: cached.lng,
          title: cached.title,
          rating: cached.rating,
          price:
            it.price != null
              ? `₺${Number(it.price).toLocaleString('tr-TR')}`
              : cached.price ?? null,
          imageUrl: it.imageUrl || cached.imageUrl || null,
        });
        continue;
      }

      const { place: p, error } = await resolveOnePlace({
        textQuery: q,
        includedType,
        lat: hasBias ? biasLat : undefined,
        lng: hasBias ? biasLng : undefined,
      });

      if (error) {
        /* sessizce devam */
      }

      if (p?.lat != null && p?.lng != null) {
        const rating = p.rating ?? parseRatingFromTrust(it.trustSignal);
        const row = {
          id: p.placeId || listingKey,
          listingKey,
          lat: p.lat,
          lng: p.lng,
          title: p.name || name,
          price: it.price != null ? `₺${Number(it.price).toLocaleString('tr-TR')}` : null,
          imageUrl: it.imageUrl || p.photo || null,
          rating,
        };
        cacheSet(cacheKey, {
          id: row.id,
          lat: row.lat,
          lng: row.lng,
          title: row.title,
          rating: row.rating,
          imageUrl: row.imageUrl,
        });
        markers.push(row);
      }

      await new Promise((r) => setTimeout(r, 100));
    }

    return Response.json({ markers });
  } catch (e) {
    console.error('places/resolve-markers', e);
    return Response.json({ markers: [], error: String(e?.message || e) }, { status: 500 });
  }
}
