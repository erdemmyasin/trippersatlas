import { NextResponse } from 'next/server';

/**
 * Open-Meteo — anahtar gerektirmez.
 * ?set=business | tourism | health
 * Geriye dönük: capitals → business, popular → tourism
 */

/** Küresel iş / finans merkezleri (10); İstanbul her zaman ilk sırada. */
const SET_BUSINESS = [
  { slug: 'istanbul', city: 'İstanbul', country: 'TR', lat: 41.0082, lon: 28.9784 },
  { slug: 'london', city: 'London', country: 'GB', lat: 51.5074, lon: -0.1278 },
  { slug: 'new-york', city: 'New York', country: 'US', lat: 40.7128, lon: -74.006 },
  { slug: 'tokyo', city: 'Tokyo', country: 'JP', lat: 35.6762, lon: 139.6503 },
  { slug: 'singapore', city: 'Singapur', country: 'SG', lat: 1.3521, lon: 103.8198 },
  { slug: 'hong-kong', city: 'Hong Kong', country: 'HK', lat: 22.3193, lon: 114.1694 },
  { slug: 'dubai', city: 'Dubai', country: 'AE', lat: 25.2048, lon: 55.2708 },
  { slug: 'paris', city: 'Paris', country: 'FR', lat: 48.8566, lon: 2.3522 },
  { slug: 'frankfurt', city: 'Frankfurt', country: 'DE', lat: 50.1109, lon: 8.6821 },
  { slug: 'shanghai', city: 'Şanghay', country: 'CN', lat: 31.2304, lon: 121.4737 },
];

/** Turizm (10); İstanbul ilk sırada. */
const SET_TOURISM = [
  { slug: 'istanbul', city: 'İstanbul', country: 'TR', lat: 41.0082, lon: 28.9784 },
  { slug: 'bangkok', city: 'Bangkok', country: 'TH', lat: 13.7563, lon: 100.5018 },
  { slug: 'hong-kong', city: 'Hong Kong', country: 'HK', lat: 22.3193, lon: 114.1694 },
  { slug: 'london', city: 'London', country: 'GB', lat: 51.5074, lon: -0.1278 },
  { slug: 'macau', city: 'Macau', country: 'MO', lat: 22.1987, lon: 113.5439 },
  { slug: 'dubai', city: 'Dubai', country: 'AE', lat: 25.2048, lon: 55.2708 },
  { slug: 'mecca', city: 'Mecca', country: 'SA', lat: 21.3891, lon: 39.8579 },
  { slug: 'antalya', city: 'Antalya', country: 'TR', lat: 36.8969, lon: 30.7133 },
  { slug: 'paris', city: 'Paris', country: 'FR', lat: 48.8566, lon: 2.3522 },
  { slug: 'kuala-lumpur', city: 'Kuala Lumpur', country: 'MY', lat: 3.139, lon: 101.6869 },
];

/**
 * Sağlık turizmi / yoğun ziyaret — dünyada en çok ziyaret edilen ülkelerden
 * her biri için nüfusça en büyük şehir (örnek seçim, 10); İstanbul ilk sırada.
 */
const SET_HEALTH = [
  { slug: 'istanbul', city: 'İstanbul', country: 'TR', lat: 41.0082, lon: 28.9784 },
  { slug: 'paris', city: 'Paris', country: 'FR', lat: 48.8566, lon: 2.3522 },
  { slug: 'madrid', city: 'Madrid', country: 'ES', lat: 40.4168, lon: -3.7038 },
  { slug: 'new-york', city: 'New York', country: 'US', lat: 40.7128, lon: -74.006 },
  { slug: 'shanghai', city: 'Şanghay', country: 'CN', lat: 31.2304, lon: 121.4737 },
  { slug: 'rome', city: 'Roma', country: 'IT', lat: 41.9028, lon: 12.4964 },
  { slug: 'mexico-city', city: 'Mexico City', country: 'MX', lat: 19.4326, lon: -99.1332 },
  { slug: 'bangkok', city: 'Bangkok', country: 'TH', lat: 13.7563, lon: 100.5018 },
  { slug: 'berlin', city: 'Berlin', country: 'DE', lat: 52.52, lon: 13.405 },
  { slug: 'london', city: 'London', country: 'GB', lat: 51.5074, lon: -0.1278 },
];

const SETS = {
  business: SET_BUSINESS,
  tourism: SET_TOURISM,
  health: SET_HEALTH,
};

function resolveSetKey(raw) {
  if (raw === 'tourism' || raw === 'popular') return 'tourism';
  if (raw === 'health') return 'health';
  if (raw === 'business' || raw === 'capitals') return 'business';
  return 'business';
}

async function fetchCurrent({ lat, lon }) {
  const u = new URL('https://api.open-meteo.com/v1/forecast');
  u.searchParams.set('latitude', String(lat));
  u.searchParams.set('longitude', String(lon));
  u.searchParams.set('current', 'temperature_2m,weather_code,wind_speed_10m');
  u.searchParams.set('wind_speed_unit', 'kmh');
  u.searchParams.set('timezone', 'auto');
  const res = await fetch(u.toString(), { next: { revalidate: 600 } });
  if (!res.ok) throw new Error(`open_meteo_${res.status}`);
  const json = await res.json();
  const c = json?.current;
  if (!c || typeof c.temperature_2m !== 'number') throw new Error('open_meteo_parse');
  return {
    temperature: Math.round(c.temperature_2m),
    weatherCode: c.weather_code ?? null,
    windKmh: c.wind_speed_10m != null ? Math.round(Number(c.wind_speed_10m)) : null,
    time: c.time ?? null,
  };
}

/** Tek gün günlük tahmin (Open-Meteo). */
async function fetchDailyForDate({ lat, lon, date }) {
  const u = new URL('https://api.open-meteo.com/v1/forecast');
  u.searchParams.set('latitude', String(lat));
  u.searchParams.set('longitude', String(lon));
  u.searchParams.set('start_date', date);
  u.searchParams.set('end_date', date);
  u.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max');
  u.searchParams.set('wind_speed_unit', 'kmh');
  u.searchParams.set('timezone', 'auto');
  const res = await fetch(u.toString(), { next: { revalidate: 1800 } });
  if (!res.ok) throw new Error(`open_meteo_${res.status}`);
  const json = await res.json();
  const daily = json?.daily;
  const t0 = daily?.time?.[0];
  if (!daily?.time?.length || !t0) throw new Error('open_meteo_daily');
  const tmax = daily.temperature_2m_max?.[0];
  const tmin = daily.temperature_2m_min?.[0];
  if (typeof tmax !== 'number' || typeof tmin !== 'number') throw new Error('open_meteo_daily_temp');
  const temp = Math.round((tmax + tmin) / 2);
  const w = daily.wind_speed_10m_max?.[0];
  return {
    temperature: temp,
    weatherCode: daily.weather_code?.[0] ?? null,
    windKmh: w != null && Number.isFinite(Number(w)) ? Math.round(Number(w)) : null,
    time: t0,
  };
}

function parseDateParam(raw) {
  if (!raw || typeof raw !== 'string') return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const [y, m, d] = raw.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return raw;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const key = resolveSetKey(searchParams.get('set'));
  const rows = SETS[key] || SETS.business;
  const date = parseDateParam(searchParams.get('date'));

  try {
    const cities = await Promise.all(
      rows.map(async (row) => {
        try {
          const cur = date
            ? await fetchDailyForDate({ lat: row.lat, lon: row.lon, date })
            : await fetchCurrent({ lat: row.lat, lon: row.lon });
          return {
            ...row,
            ...cur,
            ok: true,
          };
        } catch {
          return {
            ...row,
            temperature: null,
            weatherCode: null,
            windKmh: null,
            time: null,
            ok: false,
          };
        }
      })
    );
    const payload = {
      set: key,
      cities,
      fetchedAt: new Date().toISOString(),
      ...(date ? { date, mode: 'forecast_day' } : { mode: 'current' }),
    };
    return NextResponse.json(payload);
  } catch (e) {
    console.error('weather/capitals', e);
    return NextResponse.json(
      {
        set: key,
        cities: rows.map((c) => ({
          ...c,
          ok: false,
          temperature: null,
          weatherCode: null,
          windKmh: null,
        })),
        error: String(e?.message || e),
      },
      { status: 200 }
    );
  }
}
