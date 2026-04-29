import { haversineKm } from '@/lib/geoUtils';
import { defaultStayCity } from '@/lib/taRegion';

/**
 * API /places/search çıktısını StaySearchScreen mock oteli şekline çevirir.
 */
export function placesToStayHotels(places, cityLabel, center) {
  const city = (cityLabel || defaultStayCity()).trim();
  const cLat = center?.lat;
  const cLng = center?.lng;

  return (places || []).map((p, i) => {
    const id = `g-${p.placeId || i}`;
    let dist = 2 + (i % 7) * 0.8;
    if (typeof cLat === 'number' && typeof cLng === 'number' && p.lat != null && p.lng != null) {
      dist = Math.round(haversineKm(cLat, cLng, p.lat, p.lng) * 10) / 10;
    }

    return {
      id,
      name: p.name || 'Otel',
      city,
      stars: p.stars ?? 4,
      district: p.district || p.address || city,
      features: [],
      types: ['Otel'],
      roomType: 'Standart oda',
      freeCancel: false,
      payAtHotel: false,
      score: typeof p.rating === 'number' ? Math.round(p.rating * 10) / 10 : 4.2,
      reviewCount: p.reviews || 0,
      priceNight: Math.max(500, Number(p.priceNight) || 2500),
      priceLevelLabel: p.price != null && p.price !== '' ? p.price : '—',
      oldPriceNight: null,
      photoCount: p.photo ? 1 : 3,
      photoUrl: p.photo || null,
      distCenter: dist,
      mapX: 15 + (i * 17) % 70,
      mapY: 12 + (i * 23) % 65,
      lat: p.lat,
      lng: p.lng,
      placeId: p.placeId,
      source: 'google',
    };
  });
}
