import { NextResponse } from 'next/server';

const TOKEN = process.env.TRAVELPAYOUTS_TOKEN;

// Şehir ID mapping
const CITY_IDS = {
  istanbul: 12209,
  bodrum: 11945,
  antalya: 11499,
  kapadokya: 12256,
  izmir: 12204,
  ankara: 11519,
  alanya: 11498,
  fethiye: 11973,
  marmaris: 12118,
  cesme: 11897,
  default: 12209,
};

function getCityId(destination) {
  const lower = destination?.toLowerCase() || '';
  for (const [key, id] of Object.entries(CITY_IDS)) {
    if (lower.includes(key)) return id;
  }
  return CITY_IDS.default;
}

function getTomorrowDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function getNextWeekDate() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const destination = searchParams.get('destination') || 'istanbul';
  const checkIn = searchParams.get('checkIn') || getTomorrowDate();
  const checkOut = searchParams.get('checkOut') || getNextWeekDate();
  const limit = searchParams.get('limit') || '5';

  const cityId = getCityId(destination);

  try {
    if (!TOKEN) {
      return NextResponse.json({
        success: false,
        hotels: [],
        error: 'Missing TRAVELPAYOUTS_TOKEN',
      });
    }

    const url = `https://yasen.hotellook.com/tp/public/widget_location_dump.json` +
      `?currency=try` +
      `&language=tr` +
      `&limit=${limit}` +
      `&id=${cityId}` +
      `&type=popularity` +
      `&check_in=${checkIn}` +
      `&check_out=${checkOut}` +
      `&token=${TOKEN}`;

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 3600 },
    });

    if (!response.ok) throw new Error('API error');

    const data = await response.json();
    const rows = Array.isArray(data) ? data : [];

    // Veriyi normalize et
    const hotels = rows.slice(0, Number.parseInt(limit, 10)).map((hotel) => ({
      id: hotel.id,
      name: hotel.name || hotel.hotelName,
      location: destination,
      price: hotel.priceFrom || hotel.price || 0,
      priceUnit: 'gece',
      stars: hotel.stars,
      rating: hotel.rating ? (hotel.rating / 10).toFixed(1) : null,
      reviewCount: hotel.reviewCount || 0,
      type: 'hotel',
      affiliatePlatform: 'booking',
      bookingUrl: `https://www.hotellook.com/hotels/${hotel.id}?marker=717530`,
      imageUrl: hotel.photoUrl || null,
    }));

    return NextResponse.json({ success: true, hotels, cityId });
  } catch (error) {
    console.error('Hotellook API error:', error);
    return NextResponse.json({
      success: false,
      hotels: [],
      error: error.message,
    });
  }
}
