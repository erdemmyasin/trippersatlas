/**
 * AddPlacesModal için şehir bazlı mock POI verisi.
 * Schema:
 *   { id, name, category, city, country, imageUrl, rating, reviewCount, mentionedBy }
 *
 * Kategoriler:
 *   attraction (Things to do)
 *   restaurant (Restaurants)
 *   event      (Events)
 *   stay       (Stays)
 *   location   (Locations / districts)
 *
 * "For you" tüm kategorilerden karışık ilk 6 öğeyi gösterir.
 */

const UNSPLASH = (id, w = 600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const ANTALYA = [
  {
    id: 'antalya-duden',
    name: 'Düden Şelaleleri',
    category: 'attraction',
    city: 'Muratpaşa, Antalya',
    country: 'TR',
    imageUrl: UNSPLASH('photo-1601581875687-79f56cd23a4e'),
    rating: 4.7,
    reviewCount: 36000,
    mentionedBy: 'Ola Kim',
  },
  {
    id: 'antalya-hadrian',
    name: 'Hadrian Kapısı',
    category: 'attraction',
    city: 'Antalya',
    country: 'TR',
    imageUrl: UNSPLASH('photo-1572252009286-268acec5ca0a'),
    rating: 4.7,
    reviewCount: 16000,
    mentionedBy: '2 kişi',
  },
  {
    id: 'antalya-kaleici',
    name: 'Kaleiçi',
    category: 'location',
    city: 'Antalya',
    country: 'TR',
    imageUrl: UNSPLASH('photo-1559827260-dc66d52bef19'),
    rating: 4.6,
    reviewCount: 24500,
    mentionedBy: 'Ela Y.',
  },
  {
    id: 'antalya-7mehmet',
    name: '7 Mehmet',
    category: 'restaurant',
    city: 'Antalya',
    country: 'TR',
    imageUrl: UNSPLASH('photo-1517248135467-4c7edcad34c4'),
    rating: 4.5,
    reviewCount: 4200,
    mentionedBy: '4 kişi',
  },
  {
    id: 'antalya-museum',
    name: 'Antalya Müzesi',
    category: 'attraction',
    city: 'Konyaaltı, Antalya',
    country: 'TR',
    imageUrl: UNSPLASH('photo-1552084117-56a987a76ff4'),
    rating: 4.6,
    reviewCount: 9100,
    mentionedBy: 'Ahmet T.',
  },
  {
    id: 'antalya-konyaalti',
    name: 'Konyaaltı Plajı',
    category: 'attraction',
    city: 'Antalya',
    country: 'TR',
    imageUrl: UNSPLASH('photo-1507525428034-b723cf961d3e'),
    rating: 4.4,
    reviewCount: 18700,
  },
  {
    id: 'antalya-rixos',
    name: 'Rixos Premium',
    category: 'stay',
    city: 'Belek, Antalya',
    country: 'TR',
    imageUrl: UNSPLASH('photo-1618773928121-c32242e63f39'),
    rating: 4.6,
    reviewCount: 5400,
  },
];

const ISTANBUL = [
  {
    id: 'istanbul-sultan',
    name: 'Sultanahmet Camii',
    category: 'attraction',
    city: 'Fatih, İstanbul',
    country: 'TR',
    imageUrl: UNSPLASH('photo-1524231757912-21f4fe3a7200'),
    rating: 4.8,
    reviewCount: 92000,
    mentionedBy: '12 kişi',
  },
  {
    id: 'istanbul-galata',
    name: 'Galata Kulesi',
    category: 'attraction',
    city: 'Beyoğlu, İstanbul',
    country: 'TR',
    imageUrl: UNSPLASH('photo-1605196560547-b2f7281b7355'),
    rating: 4.6,
    reviewCount: 71000,
    mentionedBy: '7 kişi',
  },
  {
    id: 'istanbul-mikla',
    name: 'Mikla',
    category: 'restaurant',
    city: 'Beyoğlu, İstanbul',
    country: 'TR',
    imageUrl: UNSPLASH('photo-1414235077428-338989a2e8c0'),
    rating: 4.6,
    reviewCount: 3200,
    mentionedBy: 'Mehmet K.',
  },
  {
    id: 'istanbul-kadikoy',
    name: 'Kadıköy',
    category: 'location',
    city: 'İstanbul',
    country: 'TR',
    imageUrl: UNSPLASH('photo-1542379519-cc18b3c9b15d'),
    rating: 4.7,
    reviewCount: 41200,
  },
];

const BODRUM = [
  {
    id: 'bodrum-castle',
    name: 'Bodrum Kalesi',
    category: 'attraction',
    city: 'Bodrum',
    country: 'TR',
    imageUrl: UNSPLASH('photo-1533105079780-92b9be482077'),
    rating: 4.5,
    reviewCount: 22300,
    mentionedBy: 'Ela Y.',
  },
  {
    id: 'bodrum-marina',
    name: 'Bodrum Marina',
    category: 'location',
    city: 'Bodrum',
    country: 'TR',
    imageUrl: UNSPLASH('photo-1469854523086-cc02fe5d8800'),
    rating: 4.5,
    reviewCount: 8900,
  },
  {
    id: 'bodrum-mandarin',
    name: 'Mandarin Oriental Bodrum',
    category: 'stay',
    city: 'Göltürkbükü, Bodrum',
    country: 'TR',
    imageUrl: UNSPLASH('photo-1582719508461-905c673771fd'),
    rating: 4.8,
    reviewCount: 1900,
  },
];

const KAPADOKYA = [
  {
    id: 'cap-balloon',
    name: 'Sıcak Hava Balon Turu',
    category: 'attraction',
    city: 'Göreme, Nevşehir',
    country: 'TR',
    imageUrl: UNSPLASH('photo-1506905925346-21bda4d32df4'),
    rating: 4.9,
    reviewCount: 28600,
    mentionedBy: '15 kişi',
  },
  {
    id: 'cap-goreme',
    name: 'Göreme Açık Hava Müzesi',
    category: 'attraction',
    city: 'Göreme, Nevşehir',
    country: 'TR',
    imageUrl: UNSPLASH('photo-1508739773434-c26b3d09e071'),
    rating: 4.7,
    reviewCount: 19400,
  },
  {
    id: 'cap-uchisar',
    name: 'Uçhisar Kalesi',
    category: 'attraction',
    city: 'Uçhisar, Nevşehir',
    country: 'TR',
    imageUrl: UNSPLASH('photo-1610016302534-6f67f1c968d8'),
    rating: 4.6,
    reviewCount: 8800,
  },
];

const PLACES_BY_CITY = {
  Antalya: ANTALYA,
  İstanbul: ISTANBUL,
  Bodrum: BODRUM,
  Kapadokya: KAPADOKYA,
};

export const DISCOVER_CITIES = Object.keys(PLACES_BY_CITY);

/** Şehir + tab seçimine göre POI listesi (0–N adet) */
export function getDiscoverPlaces(city, tab) {
  const all = PLACES_BY_CITY[city] || [];
  if (!tab || tab === 'forYou') return all.slice(0, 6);
  return all.filter((p) => p.category === tab);
}

/** AddPlacesModal sekmeleri */
export const DISCOVER_TABS = [
  { id: 'forYou', label: 'Senin için' },
  { id: 'attraction', label: 'Yapılacaklar' },
  { id: 'restaurant', label: 'Restoranlar' },
  { id: 'event', label: 'Etkinlikler' },
  { id: 'stay', label: 'Konaklama' },
  { id: 'location', label: 'Lokasyonlar' },
];

export const DISCOVER_CATEGORY_LABEL = {
  attraction: 'Görülecek yer',
  restaurant: 'Restoran',
  event: 'Etkinlik',
  stay: 'Konaklama',
  location: 'Lokasyon',
};
