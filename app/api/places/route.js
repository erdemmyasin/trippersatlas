const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

const TYPE_MAP = {
  foryou:      '',
  todo:        'tourist_attraction',
  restaurants: 'restaurant',
  stays:       'lodging',
  locations:   'point_of_interest',
  guides:      'tourist_attraction',
};

const DESTINATIONS = {
  antalya:    { lat: 36.8969, lng: 30.7133 },
  istanbul:   { lat: 41.0082, lng: 28.9784 },
  bodrum:     { lat: 37.0344, lng: 27.4305 },
  cappadocia: { lat: 38.6431, lng: 34.8289 },
  izmir:      { lat: 38.4192, lng: 27.1287 },
  trabzon:    { lat: 41.0027, lng: 39.7168 },
  mugla:      { lat: 37.2153, lng: 28.3636 },
  ankara:     { lat: 39.9334, lng: 32.8597 },
  bursa:      { lat: 40.1885, lng: 29.0610 },
  mardin:     { lat: 37.3212, lng: 40.7245 },
  pamukkale:  { lat: 37.9204, lng: 29.1187 },
  fethiye:    { lat: 36.6220, lng: 29.1142 },
};

function buildPhotoUrl(photoRef) {
  return `/api/places/photo?ref=${encodeURIComponent(photoRef)}&maxwidth=400`;
}

function categorize(types = []) {
  if (types.includes('restaurant') || types.includes('food')) return 'Restoran';
  if (types.includes('lodging')) return 'Konaklama';
  if (types.includes('museum')) return 'Müze';
  if (types.includes('park') || types.includes('natural_feature')) return 'Doğa';
  if (types.includes('church') || types.includes('mosque') || types.includes('hindu_temple')) return 'İbadet';
  if (types.includes('shopping_mall') || types.includes('store')) return 'Alışveriş';
  if (types.includes('night_club') || types.includes('bar')) return 'Gece Hayatı';
  if (types.includes('spa') || types.includes('gym')) return 'Sağlık';
  return 'Gezilecek Yer';
}

const CAT_ICONS = {
  'Restoran': '🍽️', 'Konaklama': '🏨', 'Müze': '🏛️', 'Doğa': '🌿',
  'İbadet': '🕌', 'Alışveriş': '🛍️', 'Gece Hayatı': '🎵', 'Sağlık': '💆',
  'Gezilecek Yer': '📍',
};

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const dest = searchParams.get('destination') || 'antalya';
  const tab = searchParams.get('tab') || 'foryou';
  const query = searchParams.get('query') || '';
  const pagetoken = searchParams.get('pagetoken') || '';

  const coords = DESTINATIONS[dest] || DESTINATIONS.antalya;
  const placeType = TYPE_MAP[tab] || '';

  if (!API_KEY) {
    return Response.json({
      success: true,
      source: 'mock',
      center: coords,
      places: getMockPlaces(dest, tab),
    });
  }

  try {
    const searchQuery = query
      ? `${query} in ${dest}`
      : placeType
        ? `${placeType} in ${dest} Turkey`
        : `best places in ${dest} Turkey`;

    const params = new URLSearchParams({
      query: searchQuery,
      key: API_KEY,
      language: 'tr',
      region: 'tr',
    });
    if (placeType && !query) params.set('type', placeType);
    if (pagetoken) params.set('pagetoken', pagetoken);

    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`;
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) throw new Error(`Places API ${res.status}`);

    const data = await res.json();
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('[places] API status:', data.status, data.error_message);
      throw new Error(data.status);
    }

    const places = (data.results || []).map(p => {
      const cat = categorize(p.types || []);
      return {
        id: p.place_id,
        name: p.name,
        rating: p.rating || 0,
        userRatingsTotal: p.user_ratings_total || 0,
        category: cat,
        categoryIcon: CAT_ICONS[cat] || '📍',
        address: p.formatted_address || '',
        location: p.geometry?.location || coords,
        photoUrl: p.photos?.[0]?.photo_reference
          ? buildPhotoUrl(p.photos[0].photo_reference)
          : null,
        types: p.types || [],
        open: p.opening_hours?.open_now ?? null,
      };
    });

    return Response.json({
      success: true,
      source: 'google',
      center: coords,
      places,
      nextPageToken: data.next_page_token || null,
    });
  } catch (err) {
    console.error('[places] error:', err.message);
    return Response.json({
      success: false,
      source: 'mock',
      center: coords,
      places: getMockPlaces(dest, tab),
    });
  }
}

function getMockPlaces(dest, tab) {
  const coords = DESTINATIONS[dest] || DESTINATIONS.antalya;
  const city = dest.charAt(0).toUpperCase() + dest.slice(1);

  const all = [
    { name: 'Düden Şelalesi', cat: 'Doğa', rating: 4.7, total: 18420, offset: [0.01, 0.02] },
    { name: `${city} Kaleiçi`, cat: 'Gezilecek Yer', rating: 4.6, total: 9230, offset: [-0.005, -0.01] },
    { name: 'Hadrian Kapısı', cat: 'Gezilecek Yer', rating: 4.7, total: 14100, offset: [0.002, -0.005] },
    { name: `${city} Müzesi`, cat: 'Müze', rating: 4.5, total: 6800, offset: [-0.01, 0.015] },
    { name: 'Perge Antik Kenti', cat: 'Gezilecek Yer', rating: 4.7, total: 8900, offset: [0.04, -0.03] },
    { name: `Köfteci Yusuf`, cat: 'Restoran', rating: 4.3, total: 12400, offset: [0.003, 0.008] },
    { name: `${city} Balık Evi`, cat: 'Restoran', rating: 4.4, total: 5600, offset: [-0.007, 0.004] },
    { name: `Atatürk Parkı`, cat: 'Doğa', rating: 4.2, total: 3200, offset: [0.008, -0.012] },
    { name: `${city} Grand Hotel`, cat: 'Konaklama', rating: 4.1, total: 2100, offset: [-0.003, 0.009] },
    { name: `Konyaaltı Plajı`, cat: 'Doğa', rating: 4.5, total: 21000, offset: [-0.02, 0.04] },
    { name: `${city} Marina`, cat: 'Gezilecek Yer', rating: 4.3, total: 7500, offset: [0.005, -0.018] },
    { name: `Lara Beach Resort`, cat: 'Konaklama', rating: 4.6, total: 4300, offset: [0.03, 0.025] },
  ];

  const filtered = tab === 'foryou' ? all
    : tab === 'restaurants' ? all.filter(p => p.cat === 'Restoran')
    : tab === 'stays' ? all.filter(p => p.cat === 'Konaklama')
    : all.filter(p => !['Restoran', 'Konaklama'].includes(p.cat));

  return (filtered.length ? filtered : all).map((p, i) => ({
    id: `mock_${dest}_${i}`,
    name: p.name,
    rating: p.rating,
    userRatingsTotal: p.total,
    category: p.cat,
    categoryIcon: CAT_ICONS[p.cat] || '📍',
    address: `${city}, Türkiye`,
    location: { lat: coords.lat + p.offset[0], lng: coords.lng + p.offset[1] },
    photoUrl: null,
    types: [],
    open: null,
  }));
}
