'use client';

import { getTrips } from '@/lib/tripStore';

export const TRIPS_HEADER_KEY = 'trips';

export function loadMergedTrips() {
  let fromHeader = [];
  try {
    const r =
      typeof window !== 'undefined' ? localStorage.getItem(TRIPS_HEADER_KEY) : null;
    if (r) fromHeader = JSON.parse(r);
    if (!Array.isArray(fromHeader)) fromHeader = [];
  } catch {
    fromHeader = [];
  }
  const fromStore = getTrips();
  const seen = new Set();
  const out = [];
  for (const t of fromHeader) {
    if (t?.id != null && !seen.has(String(t.id))) {
      seen.add(String(t.id));
      out.push(t);
    }
  }
  for (const t of fromStore) {
    if (t?.id != null && !seen.has(String(t.id))) {
      seen.add(String(t.id));
      out.push(t);
    }
  }
  return out;
}

export function findMergedTripById(id) {
  if (id == null) return null;
  const sid = String(id);
  return loadMergedTrips().find((t) => String(t.id) === sid) ?? null;
}
