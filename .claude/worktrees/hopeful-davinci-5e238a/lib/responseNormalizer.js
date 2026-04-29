const VALID_TRAVEL_TYPES = new Set([
  'business', 'honeymoon', 'family', 'health', 'wellness',
  'cultural', 'adventure', 'digital_nomad', 'neutral',
]);

const VALID_STAGES = new Set([
  'purpose', 'discovery', 'accommodation', 'transport', 'transfer', 'activities', 'extras',
]);

const VALID_LISTING_TYPES = new Set([
  'hotel', 'villa', 'clinic', 'car', 'tour', 'transfer', 'restaurant', 'boat',
]);

const VALID_PLATFORMS = new Set(['booking', 'gyg', 'kiwitaxi', 'kiwi', 'skyscanner']);

function normalizeListing(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const type = VALID_LISTING_TYPES.has(raw.type) ? raw.type : 'hotel';
  const price = Number(raw.price);
  return {
    type,
    name:              String(raw.name  || '').trim(),
    location:          String(raw.location || '').trim(),
    price:             Number.isFinite(price) && price >= 0 ? price : 0,
    priceUnit:         String(raw.priceUnit || 'gece').trim(),
    badge:             raw.badge      ? String(raw.badge).trim()       : '',
    emoji:             raw.emoji      ? String(raw.emoji).trim()       : '',
    trustSignal:       raw.trustSignal ? String(raw.trustSignal).trim() : '',
    affiliatePlatform: VALID_PLATFORMS.has(raw.affiliatePlatform)
      ? raw.affiliatePlatform
      : 'booking',
    bookingUrl:        raw.bookingUrl ? String(raw.bookingUrl) : null,
    imageUrl:          raw.imageUrl   ? String(raw.imageUrl)   : null,
    priceIsReal:       Boolean(raw.priceIsReal),
  };
}

function normalizeBudgetUpdate(raw) {
  const keys = ['accommodation', 'transport', 'transfer', 'activities', 'extras'];
  const out = {};
  for (const k of keys) {
    const v = Number(raw?.[k]);
    out[k] = Number.isFinite(v) && v >= 0 ? v : 0;
  }
  return out;
}

export function normalizeResponse(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const listings = Array.isArray(raw.listings)
    ? raw.listings.map(normalizeListing).filter(Boolean)
    : [];

  const proactive = Array.isArray(raw.proactive)
    ? raw.proactive
        .filter(p => p && typeof p === 'object' && p.title)
        .slice(0, 2)
        .map(p => ({
          icon:        String(p.icon        || ''),
          title:       String(p.title       || ''),
          description: String(p.description || ''),
          price:       Number(p.price) || 0,
        }))
    : [];

  const localInsights = Array.isArray(raw.localInsights)
    ? raw.localInsights
        .filter(i => i && typeof i === 'object' && i.text)
        .slice(0, 2)
        .map(i => ({
          source:        String(i.source        || 'Google'),
          text:          String(i.text          || ''),
          confirmations: Number(i.confirmations) || 0,
        }))
    : [];

  const quickReplies = Array.isArray(raw.quickReplies)
    ? raw.quickReplies
        .filter(r => typeof r === 'string' && r.trim())
        .slice(0, 4)
    : [];

  return {
    message:      String(raw.message || '').trim(),
    travelType:   VALID_TRAVEL_TYPES.has(raw.travelType) ? raw.travelType : 'neutral',
    stage:        VALID_STAGES.has(raw.stage) ? raw.stage : 'purpose',
    language:     raw.language === 'en' ? 'en' : 'tr',
    listings,
    proactive,
    localInsights,
    quickReplies,
    budgetUpdate: normalizeBudgetUpdate(raw.budgetUpdate),
  };
}
