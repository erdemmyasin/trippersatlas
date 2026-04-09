const FALLBACKS = {
  hotel:      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=220&fit=crop',
  villa:      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=220&fit=crop',
  restaurant: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=220&fit=crop',
  tour:       'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=220&fit=crop',
  transfer:   'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400&h=220&fit=crop',
  clinic:     'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=220&fit=crop',
  default:    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=220&fit=crop',
};

const imageCache = new Map();

function normalizeTr(text = '') {
  return String(text)
    .replace(/ğ/g, 'g').replace(/ü/g, 'u')
    .replace(/ş/g, 's').replace(/ı/g, 'i')
    .replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/Ğ/g, 'G').replace(/Ü/g, 'U')
    .replace(/Ş/g, 'S').replace(/İ/g, 'I')
    .replace(/Ö/g, 'O').replace(/Ç/g, 'C');
}

function buildImageQuery(listing) {
  const name = listing?.name || '';
  const location = listing?.location || '';
  const type = listing?.type || 'default';

  const normalized = normalizeTr(name);
  const suffix = {
    hotel: 'hotel luxury',
    villa: 'villa pool',
    tour: 'travel',
    clinic: 'medical modern',
    restaurant: 'restaurant food',
    transfer: 'airport transfer',
    boat: 'boat sea',
  }[type] || 'travel';

  const city = (location?.split(',')[0] || '').trim();
  return `${normalized} ${city} ${suffix}`.trim();
}

function pickLargestImage(items = []) {
  return items
    .slice()
    .sort((a, b) => {
      const aArea = (Number(a?.image?.width || a?.width) || 0) * (Number(a?.image?.height || a?.height) || 0);
      const bArea = (Number(b?.image?.width || b?.width) || 0) * (Number(b?.image?.height || b?.height) || 0);
      return bArea - aArea;
    })[0];
}

async function fetchGoogleImage(query) {
  const key = process.env.GOOGLE_CSE_API_KEY;
  const cx = process.env.GOOGLE_CSE_CX;
  if (!key || !cx) return null;

  const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(key)}&cx=${encodeURIComponent(cx)}&searchType=image&num=5&safe=active&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  const data = await res.json();
  const picked = pickLargestImage(data?.items ?? []);
  return picked?.link ?? null;
}

function extractOgImage(html) {
  if (!html) return null;
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m?.[1]) return m[1];
  }
  return null;
}

async function fetchWebsiteImage(websiteUrl) {
  if (!websiteUrl) return null;
  try {
    const normalized = /^https?:\/\//i.test(websiteUrl) ? websiteUrl : `https://${websiteUrl}`;
    const res = await fetch(normalized, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const html = await res.text();
    return extractOgImage(html);
  } catch {
    return null;
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const rawQuery = searchParams.get('query') || '';
  const explicitName = searchParams.get('name') || '';
  const name = explicitName || rawQuery || '';
  const location = searchParams.get('location') || '';
  const type = searchParams.get('type') || 'default';
  const website = searchParams.get('website') || '';

  const accessKey = process.env.NEXT_PUBLIC_UNSPLASH_KEY;
  const fallbackUrl = FALLBACKS[type] ?? FALLBACKS.default;
  const cacheKey = `${name}|${rawQuery}|${type}`;

  if (imageCache.has(cacheKey)) {
    return Response.json({ url: imageCache.get(cacheKey) });
  }

  try {
    const query = explicitName
      ? (buildImageQuery({ name, location, type }) || normalizeTr(rawQuery) || 'hotel travel')
      : (normalizeTr(rawQuery) || 'hotel travel');

    // 1) Unsplash (varsa)
    if (accessKey && accessKey !== 'buraya_key_gelecek') {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&content_filter=high&order_by=relevant&per_page=5&client_id=${accessKey}`,
        { next: { revalidate: 3600 } }
      );
      if (res.ok) {
        const data = await res.json();
        const best = (data?.results ?? [])
          .slice()
          .sort((a, b) => (Number(b?.likes) || 0) - (Number(a?.likes) || 0))[0];
        const unsplashUrl = best?.urls?.regular ?? best?.urls?.small ?? null;
        if (unsplashUrl) {
          imageCache.set(cacheKey, unsplashUrl);
          return Response.json({ url: unsplashUrl, source: 'unsplash' });
        }
      }
    }

    // 2) Google image search (opsiyonel, CSE key/cx varsa)
    const googleUrl = await fetchGoogleImage(query);
    if (googleUrl) {
      imageCache.set(cacheKey, googleUrl);
      return Response.json({ url: googleUrl, source: 'google' });
    }

    // 3) Listing website og:image (website verilmişse)
    const websiteImage = await fetchWebsiteImage(website);
    if (websiteImage) {
      imageCache.set(cacheKey, websiteImage);
      return Response.json({ url: websiteImage, source: 'website' });
    }

    // 4) Type fallback URL
    imageCache.set(cacheKey, fallbackUrl);
    return Response.json({ url: fallbackUrl, source: 'fallback' });
  } catch (err) {
    console.error('[image] provider error:', err.message);
    imageCache.set(cacheKey, fallbackUrl);
    return Response.json({ url: fallbackUrl });
  }
}
