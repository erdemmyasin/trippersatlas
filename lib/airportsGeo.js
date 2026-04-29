/**
 * Hızlı plan / uçuş haritası — yaygın IATA kodları (TR hub’ları + sık uluslararası kodlar).
 * Küresel kullanımda harita yine bu tablodan beslenir; kod seti zamanla genişletilebilir.
 */

export const AIRPORTS_BY_IATA = {
  IST: { lat: 41.2753, lng: 28.7519, name: 'İstanbul Havalimanı (IST)' },
  SAW: { lat: 40.8986, lng: 29.3092, name: 'Sabiha Gökçen (SAW)' },
  AYT: { lat: 36.8987, lng: 30.8005, name: 'Antalya (AYT)' },
  ESB: { lat: 40.1281, lng: 32.9951, name: 'Ankara Esenboğa (ESB)' },
  ADB: { lat: 38.2924, lng: 27.157, name: 'İzmir Adnan Menderes (ADB)' },
  BJV: { lat: 37.2506, lng: 27.6647, name: 'Milas-Bodrum (BJV)' },
  DLM: { lat: 36.7131, lng: 29.7013, name: 'Dalaman (DLM)' },
  GZP: { lat: 36.2992, lng: 32.3014, name: 'Gazipaşa-Alanya (GZP)' },
  TZX: { lat: 40.9953, lng: 39.7897, name: 'Trabzon (TZX)' },
  ERZ: { lat: 39.9565, lng: 41.1702, name: 'Erzurum (ERZ)' },
  VAN: { lat: 38.4682, lng: 43.3323, name: 'Van Ferit Melen (VAN)' },
  ADA: { lat: 36.9822, lng: 35.2804, name: 'Adana (ADA)' },
  GZT: { lat: 36.9472, lng: 37.4787, name: 'Gaziantep (GZT)' },
  KYA: { lat: 37.979, lng: 32.5616, name: 'Konya (KYA)' },
  NAV: { lat: 38.7719, lng: 34.5345, name: 'Kapadokya/Nevşehir (NAV)' },
  DNZ: { lat: 37.7856, lng: 29.7013, name: 'Çardak Denizli (DNZ)' },
  EDO: { lat: 39.5546, lng: 27.0138, name: 'Balıkesir Koca Seyit (EDO)' },
  // Yurtdışı — sık kullanılan
  FRA: { lat: 50.0379, lng: 8.5622, name: 'Frankfurt (FRA)' },
  MUC: { lat: 48.3538, lng: 11.7861, name: 'Münih (MUC)' },
  CDG: { lat: 49.0097, lng: 2.5479, name: 'Paris CDG (CDG)' },
  LHR: { lat: 51.47, lng: -0.4543, name: 'Londra Heathrow (LHR)' },
  LGW: { lat: 51.1537, lng: -0.1821, name: 'Londra Gatwick (LGW)' },
  STN: { lat: 51.886, lng: 0.2389, name: 'Londra Stansted (STN)' },
  AMS: { lat: 52.3105, lng: 4.7683, name: 'Amsterdam (AMS)' },
  DXB: { lat: 25.2532, lng: 55.3657, name: 'Dubai (DXB)' },
  DOH: { lat: 25.2731, lng: 51.6081, name: 'Doha (DOH)' },
  JFK: { lat: 40.6413, lng: -73.7781, name: 'New York JFK (JFK)' },
  SVO: { lat: 55.9726, lng: 37.4146, name: 'Moskova Sheremetyevo (SVO)' },
  VIE: { lat: 48.1103, lng: 16.5697, name: 'Viyana (VIE)' },
  ZRH: { lat: 47.4647, lng: 8.5492, name: 'Zürih (ZRH)' },
  BRU: { lat: 50.9014, lng: 4.4844, name: 'Brüksel (BRU)' },
  RHO: { lat: 36.4054, lng: 28.0862, name: 'Rodos (RHO)' },
  HER: { lat: 35.3397, lng: 25.1803, name: 'Heraklion (HER)' },
};

export function normalizeIata(code) {
  return String(code || '')
    .trim()
    .toUpperCase()
    .slice(0, 3);
}

export function airportFromStatic(code) {
  const c = normalizeIata(code);
  return AIRPORTS_BY_IATA[c] || null;
}

/** @returns {{ id: string, lat: number, lng: number, title: string, price?: string }[]} */
export function buildAirportMarkersFromCodes(originCode, destCode) {
  const o = normalizeIata(originCode);
  const d = normalizeIata(destCode);
  const markers = [];
  const a1 = airportFromStatic(o);
  const a2 = airportFromStatic(d);
  if (a1) {
    markers.push({
      id: `ap-${o}`,
      lat: a1.lat,
      lng: a1.lng,
      title: a1.name,
      price: 'Kalkış',
    });
  }
  if (a2) {
    markers.push({
      id: `ap-${d}`,
      lat: a2.lat,
      lng: a2.lng,
      title: a2.name,
      price: 'Varış',
    });
  }
  return markers;
}

export function centerFromMarkers(markers, fallback = { lat: 41.0082, lng: 28.9784 }) {
  const valid = (markers || []).filter((m) => Number.isFinite(m.lat) && Number.isFinite(m.lng));
  if (valid.length === 0) return fallback;
  const la = valid.reduce((s, m) => s + m.lat, 0) / valid.length;
  const ln = valid.reduce((s, m) => s + m.lng, 0) / valid.length;
  return { lat: la, lng: ln };
}
