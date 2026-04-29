/**
 * Amadeus Test API — yalnızca sunucu tarafında kullanın (API route).
 * .env.local: AMADEUS_API_KEY, AMADEUS_API_SECRET
 */

const AMADEUS_KEY = process.env.AMADEUS_API_KEY || '';
const AMADEUS_SECRET = process.env.AMADEUS_API_SECRET || '';

export function hasAmadeusCredentials() {
  return Boolean(AMADEUS_KEY && AMADEUS_SECRET);
}

export async function getAmadeusToken() {
  const res = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: AMADEUS_KEY,
      client_secret: AMADEUS_SECRET,
    }).toString(),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Amadeus token ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  if (!data.access_token) throw new Error('Amadeus: no access_token');
  return data.access_token;
}

/**
 * @param {{
 *   origin: string,
 *   destination: string,
 *   date: string,
 *   returnDate?: string | null,
 *   adults?: number,
 *   children?: number,
 *   infants?: number,
 *   cabinClass?: string,
 * }} p
 */
export async function searchFlightsAmadeus(p) {
  const token = await getAmadeusToken();
  const params = new URLSearchParams({
    originLocationCode: p.origin.trim().toUpperCase(),
    destinationLocationCode: p.destination.trim().toUpperCase(),
    departureDate: p.date,
    adults: String(Math.max(1, p.adults || 1)),
    travelClass: p.cabinClass || 'ECONOMY',
    max: '20',
  });
  if (p.returnDate) params.append('returnDate', p.returnDate);
  const ch = Number(p.children) || 0;
  const inf = Number(p.infants) || 0;
  if (ch > 0) params.append('children', String(ch));
  if (inf > 0) params.append('infants', String(inf));

  const res = await fetch(
    `https://test.api.amadeus.com/v2/shopping/flight-offers?${params.toString()}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const json = await res.json();
  if (!res.ok) {
    const msg = json?.errors?.[0]?.detail || JSON.stringify(json).slice(0, 300);
    throw new Error(`Amadeus flights ${res.status}: ${msg}`);
  }
  return json;
}
