/**
 * Keşfet / sohbetten kaydedilen mekanlar (Kaydedilenler sayfası ile paylaşılır).
 */
export const SAVED_PLACES_KEY = 'ta_saved_places';

export function loadSavedPlaces() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SAVED_PLACES_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

export function persistSavedPlaces(places) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(places));
    window.dispatchEvent(new Event('savedPlacesUpdated'));
  } catch {
    /* ignore */
  }
}

/** place nesnesi API / explore kartı ile uyumlu alanlar içerir */
export function toggleSavedPlace(place) {
  if (!place?.id) return loadSavedPlaces();
  const list = loadSavedPlaces();
  const id = String(place.id);
  const idx = list.findIndex((p) => String(p.id) === id);
  let next;
  if (idx >= 0) {
    next = list.filter((_, i) => i !== idx);
  } else {
    next = [
      {
        id: place.id,
        name: place.name,
        category: place.category,
        address: place.address,
        photoUrl: place.photoUrl,
        rating: place.rating,
        savedAt: new Date().toISOString(),
      },
      ...list,
    ];
  }
  persistSavedPlaces(next);
  return next;
}

export function isPlaceSaved(placeId) {
  const list = loadSavedPlaces();
  return list.some((p) => String(p.id) === String(placeId));
}
