const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const ref = searchParams.get('ref');
  const maxwidth = searchParams.get('maxwidth') || '400';

  if (!ref || !API_KEY) {
    return new Response(null, { status: 404 });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth}&photo_reference=${encodeURIComponent(ref)}&key=${API_KEY}`;
    const res = await fetch(url, { redirect: 'follow' });

    if (!res.ok) return new Response(null, { status: 502 });

    return new Response(res.body, {
      headers: {
        'Content-Type': res.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}
