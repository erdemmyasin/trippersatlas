const FALLBACKS = {
  hotel:      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=220&fit=crop',
  villa:      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=220&fit=crop',
  restaurant: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=220&fit=crop',
  tour:       'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=220&fit=crop',
  transfer:   'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400&h=220&fit=crop',
  clinic:     'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=220&fit=crop',
  default:    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=220&fit=crop',
};

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query') || 'hotel,travel';
  const type  = searchParams.get('type')  || 'default';

  const accessKey = process.env.NEXT_PUBLIC_UNSPLASH_KEY;
  const fallbackUrl = FALLBACKS[type] ?? FALLBACKS.default;

  /* Key yoksa veya demo değerdeyse direkt fallback dön */
  if (!accessKey || accessKey === 'buraya_key_gelecek') {
    return Response.json({ url: fallbackUrl });
  }

  try {
    const res = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape&client_id=${accessKey}`,
      { next: { revalidate: 3600 } }   /* 1 saatlik cache */
    );

    if (!res.ok) throw new Error(`Unsplash ${res.status}`);

    const data = await res.json();
    const url  = data?.urls?.regular ?? data?.urls?.small ?? fallbackUrl;

    return Response.json({ url });
  } catch (err) {
    console.error('[image] Unsplash hatası:', err.message);
    return Response.json({ url: fallbackUrl });
  }
}
