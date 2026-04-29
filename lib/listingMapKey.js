/** Sohbet listesi ↔ harita pini için kararlı anahtar */
export function listingMapKey(listing) {
  const n = String(listing?.name ?? '').trim();
  const l = String(listing?.location ?? '').trim();
  return `${n}|${l}`.toLowerCase();
}

export function listingMapDataAttr(listing) {
  return encodeURIComponent(listingMapKey(listing));
}
