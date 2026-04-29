import { geocodeAddress } from '@/lib/googleGeocode';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address') || '';
    const { lat, lng, formattedAddress, error } = await geocodeAddress(address);
    if (error && lat == null) {
      return Response.json({ lat: null, lng: null, formattedAddress: null, error }, { status: 200 });
    }
    return Response.json({ lat, lng, formattedAddress, error: null });
  } catch (e) {
    console.error('places/geocode', e);
    return Response.json({ lat: null, lng: null, error: String(e?.message || e) }, { status: 500 });
  }
}
