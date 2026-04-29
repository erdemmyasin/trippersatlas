import { searchPlacesByType } from '@/lib/googlePlaces';

function mapTypeToIncluded(t) {
  const x = String(t || 'hotel').toLowerCase();
  if (x === 'hotel' || x === 'hotels') return 'lodging';
  return x;
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const query = String(body.query || '').trim();
    const type = body.type || 'hotel';
    const lat = body.lat != null ? Number(body.lat) : undefined;
    const lng = body.lng != null ? Number(body.lng) : undefined;
    const radius = body.radius != null ? Number(body.radius) : 25000;

    if (!query) {
      return Response.json({ ok: false, places: [], error: 'query_required' }, { status: 400 });
    }

    const included = mapTypeToIncluded(type);
    const { places, error } = await searchPlacesByType(query, included, {
      lat: Number.isFinite(lat) ? lat : undefined,
      lng: Number.isFinite(lng) ? lng : undefined,
      radius,
    });

    const out = (places || []).map((p) => ({
      name: p.name,
      address: p.address,
      rating: p.rating,
      reviews: p.reviews,
      price: p.price,
      photo: p.photo,
      lat: p.lat,
      lng: p.lng,
      placeId: p.placeId,
      placeResourceName: p.placeResourceName,
      priceNight: p.priceNight,
      stars: p.stars,
      district: p.district,
    }));

    return Response.json({ ok: !error, places: out, error: error || null });
  } catch (e) {
    console.error('places/search', e);
    return Response.json({ ok: false, places: [], error: String(e?.message || e) }, { status: 500 });
  }
}
