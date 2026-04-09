import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt } from '@/lib/systemPrompt';
import { fetchRealHotels } from '@/services/hotels';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const FALLBACK = {
  message: 'Bir sorun oluştu, lütfen tekrar deneyin.',
  travelType: 'neutral',
  stage: 'purpose',
  language: 'tr',
  listings: [],
  proactive: [],
  localInsights: [],
  quickReplies: ['Tekrar dene', 'Başka bir şey sor'],
  budgetUpdate: { accommodation: 0, transport: 0, transfer: 0, activities: 0, extras: 0 },
};

export async function POST(req) {
  try {
    const { messages = [], planContext = {} } = await req.json();

    const systemPrompt = buildSystemPrompt(planContext);

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages: messages.map(({ role, content }) => ({ role, content })),
    });

    const raw = response.content?.[0]?.text ?? '';

    let parsed;
    try {
      // JSON yanıtı temizle (bazen ```json blokları gelebilir)
      const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      console.error('JSON parse hatası:', raw);
      return Response.json({ success: false, data: FALLBACK }, { status: 200 });
    }

    const enriched = await enrichListingsWithRealHotelPrices(parsed, planContext, req);
    return Response.json({ success: true, data: enriched });
  } catch (err) {
    console.error('Chat API hatası:', err);
    return Response.json({ success: false, data: FALLBACK }, { status: 200 });
  }
}

async function enrichListingsWithRealHotelPrices(parsed, planContext, req) {
  if (!parsed || !Array.isArray(parsed.listings) || parsed.listings.length === 0) {
    return parsed;
  }

  const accommodationIndexes = [];
  parsed.listings.forEach((listing, idx) => {
    const t = String(listing?.type || '').toLowerCase();
    if (t === 'hotel' || t === 'villa' || t === 'accommodation') {
      accommodationIndexes.push(idx);
    }
  });

  if (accommodationIndexes.length === 0) return parsed;

  const destination =
    planContext?.destination ||
    parsed.listings[accommodationIndexes[0]]?.location ||
    'istanbul';

  const checkIn = planContext?.checkIn;
  const checkOut = planContext?.checkOut;
  const baseUrl = req.nextUrl.origin;

  const realHotels = await fetchRealHotels(destination, checkIn, checkOut, { baseUrl });
  if (!realHotels || realHotels.length === 0) return parsed;

  const nextListings = [...parsed.listings];
  accommodationIndexes.forEach((idx, localIdx) => {
    const real = realHotels[localIdx];
    if (!real) return;
    const current = nextListings[idx];
    nextListings[idx] = {
      ...current,
      // Claude ismini koru
      name: current.name,
      location: current.location || real.location,
      price: Number(real.price) || current.price,
      priceUnit: current.priceUnit || real.priceUnit || 'gece',
      bookingUrl: real.bookingUrl || current.bookingUrl,
      imageUrl: current.imageUrl || real.imageUrl || null,
      priceIsReal: Number(real.price) > 0,
      affiliatePlatform: current.affiliatePlatform || real.affiliatePlatform || 'booking',
    };
  });

  return { ...parsed, listings: nextListings };
}
