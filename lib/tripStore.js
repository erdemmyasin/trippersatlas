'use client';

import { defaultTripDestinationLabel, tripStoreDefaultImageQuery } from '@/lib/taRegion';

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
  const idx = trips.findIndex(t => String(t.id) === String(trip.id));
  if (idx >= 0) trips[idx] = { ...trip, updatedAt: Date.now() };
  else trips.unshift({ ...trip, createdAt: Date.now(), updatedAt: Date.now() });
  persist(trips);
  return trips;
}

export function deleteTrip(id) {
  const sid = String(id);
  const trips = getTrips().filter(t => String(t.id) !== sid);
  persist(trips);
  return trips;
}

export function createTrip({
  name,
  destination,
  days,
  month,
  startDate,
  endDate,
  notes,
  travelers,
} = {}) {
  const destRaw = destination != null ? String(destination).trim() : '';
  const dest = destRaw || defaultTripDestinationLabel() || 'Seyahat';
  const base = {
    id: `trip_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: name || 'Yeni Gezi',
    destination: dest,
    days: days || 5,
    month: month || new Date().toLocaleString('tr-TR', { month: 'long' }),
    imageQuery: tripStoreDefaultImageQuery(destRaw || defaultTripDestinationLabel()),
    imageUrl: null,
    booked: false,
    createdAt: Date.now(),
  };
  if (startDate) base.startDate = startDate;
  if (endDate) base.endDate = endDate;
  if (Array.isArray(notes) && notes.length) {
    base.notes = notes.filter((x) => typeof x === 'string' && x.trim());
  } else if (typeof notes === 'string' && notes.trim()) {
    base.notes = [notes.trim()];
  }
  if (travelers && typeof travelers === 'object') base.travelers = travelers;
  return base;
}
