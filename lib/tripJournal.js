/**
 * Trip Journal — kullanıcının her gezisi için tutulan anı kayıtları.
 *
 * Schema (entry):
 *   {
 *     id: string,
 *     tripId: string,
 *     mediaType: 'photo' | 'note',
 *     mediaUrl: string,       // photo için src; note için boş string
 *     caption: string,        // 0–500 char
 *     locationLabel: string,  // ör. "Antalya — Konyaaltı"
 *     lat: number | null,
 *     lng: number | null,
 *     capturedAt: string,     // 'YYYY-MM-DD' — anının olduğu gün
 *     createdAt: number,      // ms epoch
 *   }
 *
 * Storage:
 *   localStorage['atlas_trip_journals']  = { [tripId]: Entry[] }
 *
 * API:
 *   listEntries(tripId)  →  Entry[] (capturedAt artan; eşitlikte createdAt)
 *   addEntry(tripId, partial)
 *   updateEntry(tripId, entryId, patch)
 *   removeEntry(tripId, entryId)
 *   subscribeJournal(handler)
 */

const STORAGE_KEY = 'atlas_trip_journals';
const CAPTION_MAX = 500;

function readMap() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(map) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    window.dispatchEvent(new Event('atlas-trip-journal-change'));
  } catch {
    /* quota / serialize errors */
  }
}

function normalizeEntry(e, tripId) {
  if (!e || typeof e !== 'object') return null;
  const id = String(e.id || `je-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const mediaType = e.mediaType === 'note' ? 'note' : 'photo';
  return {
    id,
    tripId: String(tripId),
    mediaType,
    mediaUrl: typeof e.mediaUrl === 'string' ? e.mediaUrl : '',
    caption: String(e.caption || '').slice(0, CAPTION_MAX),
    locationLabel: String(e.locationLabel || ''),
    lat: typeof e.lat === 'number' ? e.lat : null,
    lng: typeof e.lng === 'number' ? e.lng : null,
    capturedAt: String(e.capturedAt || new Date().toISOString().slice(0, 10)),
    createdAt: Number(e.createdAt) || Date.now(),
  };
}

/** Bir trip'in tüm günlük kayıtları (eski → yeni). */
export function listEntries(tripId) {
  if (!tripId) return [];
  const map = readMap();
  const arr = Array.isArray(map[tripId]) ? map[tripId] : [];
  return arr
    .map((e) => normalizeEntry(e, tripId))
    .filter(Boolean)
    .sort((a, b) => {
      if (a.capturedAt !== b.capturedAt) return a.capturedAt < b.capturedAt ? -1 : 1;
      return a.createdAt - b.createdAt;
    });
}

export function getEntry(tripId, entryId) {
  return listEntries(tripId).find((e) => e.id === String(entryId)) || null;
}

export function addEntry(tripId, partial = {}) {
  if (!tripId) return null;
  const map = readMap();
  const cur = Array.isArray(map[tripId]) ? map[tripId] : [];
  const e = normalizeEntry(partial, tripId);
  if (!e) return null;
  map[tripId] = [...cur, e];
  writeMap(map);
  return e;
}

export function updateEntry(tripId, entryId, patch = {}) {
  const map = readMap();
  const cur = Array.isArray(map[tripId]) ? map[tripId] : [];
  const idx = cur.findIndex((e) => String(e?.id) === String(entryId));
  if (idx < 0) return null;
  const next = normalizeEntry({ ...cur[idx], ...patch, id: cur[idx].id }, tripId);
  cur[idx] = next;
  map[tripId] = cur;
  writeMap(map);
  return next;
}

export function removeEntry(tripId, entryId) {
  const map = readMap();
  const cur = Array.isArray(map[tripId]) ? map[tripId] : [];
  map[tripId] = cur.filter((e) => String(e?.id) !== String(entryId));
  writeMap(map);
}

/** Tüm trip'lerin entry sayıları — profil sayfası vs. için. */
export function entryCounts() {
  const map = readMap();
  const out = {};
  for (const k of Object.keys(map)) {
    out[k] = Array.isArray(map[k]) ? map[k].length : 0;
  }
  return out;
}

/** Subscribe — değişiklikte çağrılan handler. */
export function subscribeJournal(handler) {
  if (typeof window === 'undefined') return () => {};
  function onChange() {
    handler();
  }
  window.addEventListener('atlas-trip-journal-change', onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener('atlas-trip-journal-change', onChange);
    window.removeEventListener('storage', onChange);
  };
}

export const JOURNAL_CAPTION_MAX = CAPTION_MAX;
