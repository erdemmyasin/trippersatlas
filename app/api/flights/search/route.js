import { NextResponse } from 'next/server';
import { hasAmadeusCredentials, searchFlightsAmadeus } from '@/lib/amadeus';
import { normalizeAmadeusOffers, getMockFlights } from '@/lib/flightSearchUtils';

function cabinDisplay(c) {
  const u = String(c || '').toUpperCase();
  if (u === 'BUSINESS' || u === 'BUSINESS_CLASS') return 'Business';
  if (u === 'ECONOMY' || u === 'ECONOMIC') return 'Ekonomi';
  return c || 'Ekonomi';
}

function toClientFlight(f) {
  return {
    id: f.id,
    airline: f.airline,
    airlineCode: f.airlineCode,
    departure: f.departure,
    arrival: f.arrival,
    departureCode: f.departureCode,
    arrivalCode: f.arrivalCode,
    duration: f.duration,
    stops: f.stops,
    direct: Boolean(f.direct),
    price: f.price,
    currency: f.currency,
    cabin: f.cabin,
    cabinLabel: cabinDisplay(f.cabin),
  };
}

export async function POST(req) {
  let body = {};
  try {
    body = await req.json();
  } catch {
    /* ignore */
  }

  const origin = String(body.origin ?? 'AYT').trim().toUpperCase() || 'AYT';
  const destination = String(body.destination ?? 'IST').trim().toUpperCase() || 'IST';
  const date = String(body.date || '').slice(0, 10) || new Date().toISOString().slice(0, 10);
  const returnDate = body.returnDate ? String(body.returnDate).slice(0, 10) : null;
  const adults = Math.max(1, Number(body.adults) || 1);
  const children = Math.max(0, Number(body.children) || 0);
  const infants = Math.max(0, Number(body.infants) || 0);
  const cabinClass = String(body.cabinClass || 'ECONOMY').toUpperCase() === 'BUSINESS'
    ? 'BUSINESS'
    : 'ECONOMY';

  let mock = true;
  let flights = [];

  if (hasAmadeusCredentials()) {
    try {
      const json = await searchFlightsAmadeus({
        origin,
        destination,
        date,
        returnDate: returnDate || undefined,
        adults,
        children,
        infants,
        cabinClass,
      });
      flights = normalizeAmadeusOffers(json);
      mock = false;
    } catch {
      mock = true;
      flights = getMockFlights({ origin, destination, date });
    }
  } else {
    flights = getMockFlights({ origin, destination, date });
  }

  return NextResponse.json({
    flights: flights.map(toClientFlight),
    mock,
  });
}
