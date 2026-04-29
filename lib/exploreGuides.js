/**
 * Keşfet sayfası rehberleri + İlham Ol kullanıcı içerikleri.
 */

export const USER_GUIDES_LS = 'ta_user_guides';

export const FEATURED_GUIDES = [
  {
    id: 'fg-1',
    title: "İstanbul'da 4 Günlük Mükemmel Rota",
    location: 'İstanbul, Türkiye',
    author: 'Atlas',
    authorAvatar: 'A',
    badge: '4 gün',
    likes: 234,
    imageQuery: 'istanbul bosphorus aerial',
    isOfficial: true,
  },
  {
    id: 'fg-2',
    title: "Kapadokya'da Balon ve Vadi Turu",
    location: 'Nevşehir, Türkiye',
    author: 'Atlas',
    authorAvatar: 'A',
    badge: '27 mekan',
    likes: 891,
    imageQuery: 'cappadocia valley turkey',
    isOfficial: true,
  },
  {
    id: 'fg-3',
    title: "Ege'de Mavi Yolculuk Rehberi",
    location: 'Bodrum, Türkiye',
    author: 'Atlas',
    authorAvatar: 'A',
    badge: '12 durak',
    likes: 445,
    imageQuery: 'aegean sea turkey yacht',
    isOfficial: true,
  },
  {
    id: 'fg-4',
    title: 'Doğu Anadolu Kültür Rotası',
    location: 'Doğu Türkiye',
    author: 'Atlas',
    authorAvatar: 'A',
    badge: '8 gün',
    likes: 123,
    imageQuery: 'eastern turkey landscape',
    isOfficial: true,
  },
  {
    id: 'fg-5',
    title: 'Antalya Sahil ve Antik Kent Turu',
    location: 'Antalya, Türkiye',
    author: 'Atlas',
    authorAvatar: 'A',
    badge: '34 mekan',
    likes: 567,
    imageQuery: 'antalya old city turkey',
    isOfficial: true,
  },
];

export function loadUserGuides() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(USER_GUIDES_LS);
    if (!raw) return [];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

export function saveUserGuides(list) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USER_GUIDES_LS, JSON.stringify(list));
    window.dispatchEvent(new Event('userGuidesUpdated'));
  } catch {
    /* ignore */
  }
}

export function appendUserGuide(guide) {
  const list = loadUserGuides();
  list.unshift(guide);
  saveUserGuides(list);
}

/** Beğeni anahtarı: likes localStorage içinde `guide:${id}` */
export function guideLikeKey(id) {
  return `guide:${id}`;
}
