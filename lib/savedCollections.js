/**
 * Saved Collections — kullanıcının kaydettiği yer listeleri.
 *
 * Schema:
 *   {
 *     id: string,
 *     name: string,            // 50 char max
 *     isPublic: boolean,       // true → herkes görür ve notlarını
 *     places: Place[],         // bu koleksiyona eklenen yerler
 *     coverPlaceIds: string[], // grid thumbnail için ilk 3 yer (ileride manuel seçim)
 *     createdAt: number,       // ms epoch
 *     updatedAt: number,
 *   }
 *
 * Place schema:
 *   {
 *     id: string,
 *     name: string,
 *     category: 'attraction' | 'restaurant' | 'stay' | 'event' | 'location',
 *     city?: string,
 *     country?: string,
 *     imageUrl?: string,
 *     rating?: number,
 *     reviewCount?: number,
 *     mentionedBy?: string,
 *     addedAt: number,
 *   }
 */

const STORAGE_KEY = 'atlas_saved_collections';
const NAME_MAX = 50;

/** localStorage'a yaz / oku güvenli sarmalayıcı */
function readRaw() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRaw(arr) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    window.dispatchEvent(new Event('atlas-collections-change'));
  } catch {
    /* ignore quota / serialize errors */
  }
}

function normalizePlace(p) {
  if (!p || typeof p !== 'object') return null;
  return {
    id: String(p.id ?? `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    name: String(p.name || ''),
    category: String(p.category || 'location'),
    city: p.city || '',
    country: p.country || '',
    imageUrl: p.imageUrl || '',
    rating: typeof p.rating === 'number' ? p.rating : null,
    reviewCount: typeof p.reviewCount === 'number' ? p.reviewCount : null,
    mentionedBy: p.mentionedBy || '',
    addedAt: Number(p.addedAt) || Date.now(),
  };
}

function normalizeCollection(c) {
  if (!c || typeof c !== 'object') return null;
  const places = Array.isArray(c.places) ? c.places.map(normalizePlace).filter(Boolean) : [];
  return {
    id: String(c.id ?? `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    name: String(c.name || 'Koleksiyon').slice(0, NAME_MAX),
    isPublic: !!c.isPublic,
    places,
    coverPlaceIds: Array.isArray(c.coverPlaceIds) ? c.coverPlaceIds.map(String) : [],
    createdAt: Number(c.createdAt) || Date.now(),
    updatedAt: Number(c.updatedAt) || Date.now(),
  };
}

/** Tüm koleksiyonları getirir (en yeni güncellenen başta). */
export function listCollections() {
  return readRaw()
    .map(normalizeCollection)
    .filter(Boolean)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getCollection(id) {
  const all = readRaw().map(normalizeCollection).filter(Boolean);
  return all.find((c) => c.id === String(id)) || null;
}

/**
 * Yeni koleksiyon oluştur. Name boş ya da 50+ char olamaz; isPublic default false.
 * @returns {Collection|null} Oluşturulan koleksiyon (başarısızsa null).
 */
export function createCollection({ name, isPublic = false } = {}) {
  const n = String(name || '').trim().slice(0, NAME_MAX);
  if (!n) return null;
  const now = Date.now();
  const c = normalizeCollection({
    id: `c-${now}-${Math.random().toString(36).slice(2, 8)}`,
    name: n,
    isPublic: !!isPublic,
    places: [],
    coverPlaceIds: [],
    createdAt: now,
    updatedAt: now,
  });
  const arr = readRaw();
  arr.push(c);
  writeRaw(arr);
  return c;
}

export function updateCollection(id, patch = {}) {
  const arr = readRaw();
  const idx = arr.findIndex((c) => String(c?.id) === String(id));
  if (idx < 0) return null;
  const cur = normalizeCollection(arr[idx]);
  const next = normalizeCollection({
    ...cur,
    ...patch,
    name: patch.name != null ? String(patch.name).slice(0, NAME_MAX) : cur.name,
    updatedAt: Date.now(),
  });
  arr[idx] = next;
  writeRaw(arr);
  return next;
}

export function deleteCollection(id) {
  const arr = readRaw().filter((c) => String(c?.id) !== String(id));
  writeRaw(arr);
}

export function addPlaceToCollection(id, place) {
  const cur = getCollection(id);
  if (!cur) return null;
  const np = normalizePlace(place);
  if (!np) return cur;
  if (cur.places.some((p) => p.id === np.id)) return cur;
  return updateCollection(id, { places: [...cur.places, np] });
}

export function removePlaceFromCollection(id, placeId) {
  const cur = getCollection(id);
  if (!cur) return null;
  return updateCollection(id, { places: cur.places.filter((p) => p.id !== String(placeId)) });
}

/** Subscribe helper — değişikliği dinle (Header chip senkronu vb.) */
export function subscribeCollections(handler) {
  if (typeof window === 'undefined') return () => {};
  function onChange() {
    handler(listCollections());
  }
  window.addEventListener('atlas-collections-change', onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener('atlas-collections-change', onChange);
    window.removeEventListener('storage', onChange);
  };
}

export const COLLECTION_NAME_MAX = NAME_MAX;
