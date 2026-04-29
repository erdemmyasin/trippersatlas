/**
 * Geocoding API — server-side
 */

export async function geocodeAddress(address) {
  const key = process.env.GOOGLE_PLACES_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  if (!key) {
    console.error('Geocode: no API key');
    return { lat: null, lng: null, error: 'no_key' };
  }
  if (!address || !String(address).trim()) {
    return { lat: null, lng: null, error: 'empty' };
  }

  const params = new URLSearchParams({
    address: String(address).trim(),
    key,
  });

  const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
  const data = await res.json().catch(() => ({}));

  if (data.status !== 'OK' || !data.results?.[0]?.geometry?.location) {
    console.error('Geocode error:', data.status, data.error_message);
    return {
      lat: null,
      lng: null,
      error: data.error_message || data.status || 'geocode_failed',
    };
  }

  const loc = data.results[0].geometry.location;
  return {
    lat: loc.lat,
    lng: loc.lng,
    formattedAddress: data.results[0].formatted_address,
    error: null,
  };
}
