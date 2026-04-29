/** Amadeus ISO-8601 duration PT2H30M → dakika */
export function parseDurationMinutes(iso) {
  if (!iso || typeof iso !== 'string') return 0;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return 0;
  const h = Number(m[1]) || 0;
  const min = Number(m[2]) || 0;
  return h * 60 + min;
}

function padTime(d) {
  const h = d.getHours();
  const mi = d.getMinutes();
  return `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}`;
}

/**
 * Amadeus v2 flight-offers → birleşik kart listesi (gidiş özeti)
 */
export function normalizeAmadeusOffers(apiJson) {
  const data = Array.isArray(apiJson?.data) ? apiJson.data : [];
  const carriers = apiJson?.dictionaries?.carriers || {};
  const out = [];

  for (let i = 0; i < data.length; i++) {
    const offer = data[i];
    const it0 = offer.itineraries?.[0];
    if (!it0?.segments?.length) continue;
    const segs = it0.segments;
    const first = segs[0];
    const last = segs[segs.length - 1];
    const stops = Math.max(0, segs.length - 1);
    const code = first.carrierCode || 'XX';
    const airline = carriers[code] || code;
    const dep = new Date(first.departure?.at || 0);
    const arr = new Date(last.arrival?.at || 0);
    const durMin = parseDurationMinutes(it0.duration) || Math.max(30, (arr - dep) / 60000);
    const price = offer.price?.grandTotal || offer.price?.total || '0';
    const currency = offer.price?.currency || 'EUR';

    out.push({
      id: offer.id || `amadeus-${i}`,
      airline,
      airlineCode: code,
      departure: padTime(dep),
      arrival: padTime(arr),
      departureCode: first.departure?.iataCode || '',
      arrivalCode: last.arrival?.iataCode || '',
      duration: durMin,
      stops,
      direct: stops === 0,
      price: Number.parseFloat(String(price).replace(',', '.')) || 0,
      currency,
      cabin: offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || 'ECONOMY',
      raw: offer,
    });
  }
  return out;
}

const AIRLINES = [
  { code: 'PC', name: 'Pegasus' },
  { code: 'TK', name: 'Türk Hava Yolları' },
  { code: 'VF', name: 'AJet' },
  { code: 'XQ', name: 'SunExpress' },
];

function randomBetween(a, b) {
  return a + Math.floor(Math.random() * (b - a + 1));
}

/** TRY cinsinden mock — API yok veya hata durumunda */
export function getMockFlights({ origin = 'AYT', destination = 'IST', date = '2025-06-15' }) {
  const flights = [];
  const baseDate = new Date(`${date}T00:00:00`);
  if (Number.isNaN(baseDate.getTime())) {
    baseDate.setTime(Date.now());
  }

  for (let i = 0; i < 10; i++) {
    const al = AIRLINES[i % AIRLINES.length];
    const direct = i % 3 !== 0;
    const stops = direct ? 0 : i % 2 === 0 ? 1 : 2;
    const depH = 6 + (i * 2) % 14;
    const depM = (i * 17) % 60;
    const durMin = direct ? randomBetween(75, 140) : randomBetween(180, 400);
    const dep = new Date(baseDate);
    dep.setHours(depH, depM, 0, 0);
    const arr = new Date(dep.getTime() + durMin * 60000);

    const pad = (d) =>
      `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

    flights.push({
      id: `mock-${i}-${al.code}`,
      airline: al.name,
      airlineCode: al.code,
      departure: pad(dep),
      arrival: pad(arr),
      departureCode: origin.toUpperCase(),
      arrivalCode: destination.toUpperCase(),
      duration: durMin,
      stops,
      direct: stops === 0,
      price: randomBetween(7000, 12000),
      currency: 'TRY',
      cabin: i % 4 === 0 ? 'BUSINESS' : 'ECONOMY',
    });
  }
  return flights;
}
