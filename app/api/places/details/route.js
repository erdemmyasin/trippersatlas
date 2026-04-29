import { getPlaceDetails } from '@/lib/googlePlaces';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    let placeId = searchParams.get('placeId') || '';
    placeId = decodeURIComponent(placeId).trim();
    if (!placeId) {
      return Response.json({ ok: false, place: null, error: 'placeId_required' }, { status: 400 });
    }

    const resource = placeId.startsWith('places/') ? placeId : `places/${placeId}`;
    const { place, error } = await getPlaceDetails(resource);

    if (error || !place) {
      return Response.json({ ok: false, place: null, error: error || 'not_found' }, { status: 404 });
    }

    return Response.json({
      ok: true,
      place: {
        name: place.name,
        address: place.address,
        rating: place.rating,
        reviews: place.reviews,
        price: place.price,
        photo: place.photo,
        lat: place.lat,
        lng: place.lng,
        placeId: place.placeId,
        websiteUri: place.websiteUri,
      },
    });
  } catch (e) {
    console.error('places/details', e);
    return Response.json({ ok: false, place: null, error: String(e?.message || e) }, { status: 500 });
  }
}
