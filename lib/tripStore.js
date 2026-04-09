'use client';

const TRIPS_KEY = 'ta_trips';

const DEMO_TRIPS = [
  {
    id: 'demo_1',
    name: 'Amasya ve Alanya Yol Gezisi',
    destination: 'Türkiye',
    days: 5,
    month: 'Temmuz',
    imageQuery: 'Ankara Atakule tower autumn',
    imageUrl: null,
    booked: false,
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'demo_2',
    name: 'İstanbul Kültür ve Lezzet Turu',
    destination: 'Türkiye',
    days: 3,
    month: 'Ağustos',
    imageQuery: 'Istanbul Bosphorus sunset mosque',
    imageUrl: null,
    booked: true,
    createdAt: Date.now() - 172800000,
  },
];

export function getTrips() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TRIPS_KEY);
    if (!raw) {
      localStorage.setItem(TRIPS_KEY, JSON.stringify(DEMO_TRIPS));
      return DEMO_TRIPS;
    }
    return JSON.parse(raw);
  } catch { return []; }
}

function persist(trips) {
  localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
}

export function saveTrip(trip) {
  const trips = getTrips();
  const idx = trips.findIndex(t => t.id === trip.id);
  if (idx >= 0) trips[idx] = { ...trip, updatedAt: Date.now() };
  else trips.unshift({ ...trip, createdAt: Date.now(), updatedAt: Date.now() });
  persist(trips);
  return trips;
}

export function deleteTrip(id) {
  const trips = getTrips().filter(t => t.id !== id);
  persist(trips);
  return trips;
}

export function createTrip({ name, destination, days, month }) {
  return {
    id: `trip_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: name || 'Yeni Gezi',
    destination: destination || 'Türkiye',
    days: days || 5,
    month: month || new Date().toLocaleString('tr-TR', { month: 'long' }),
    imageQuery: `${destination || 'Turkey'} travel landmark`,
    imageUrl: null,
    booked: false,
    createdAt: Date.now(),
  };
}
