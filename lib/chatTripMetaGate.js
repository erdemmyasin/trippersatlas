/**
 * /chat sohbet akışı: üst bardaki zorunlu alanlar dolmadan öneri aşamasına geçilmez.
 * Kişi: varsayılan 1 yetişkin (chip dolu sayılır); notlar isteğe bağlı.
 */

export function isChatTripMetaComplete(meta) {
  if (!meta || typeof meta !== 'object') return false;
  const dest = String(meta.destination || '').trim();
  const budget = String(meta.budget || '').trim();
  const datesOk =
    String(meta.datesChipText || '').trim().length > 0 ||
    (Number(meta.nights) > 0 && String(meta.month || '').trim().length > 0);
  return Boolean(dest && datesOk && budget);
}
