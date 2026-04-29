/** 15 İstanbul oteli — API yokken demo veri */

const NAMES = [
  'Ramada by Wyndham İstanbul Pera',
  'Santa Sophia Hotel',
  'Beyoğlu Palace Spa Hotel',
  'Elite World İstanbul Taksim',
  'The Marmara Pera',
  'CVK Park Bosphorus Hotel',
  'Swissôtel The Bosphorus',
  'DoubleTree by Hilton Moda',
  'Radisson Blu Şişli',
  'Novotel İstanbul Bosphorus',
  'Mercure İstanbul Taksim',
  'The Galata Hotel',
  'Wes Hotel Karaköy',
  'Naz City Hotel Taksim',
  'Grand Hyatt İstanbul',
];

const DISTRICTS = [
  'Beyoğlu, İstanbul',
  'Fatih, Sultanahmet',
  'Şişli, Nişantaşı',
  'Beşiktaş, Ortaköy',
  'Kadıköy, Moda',
  'Üsküdar, Kuzguncuk',
  'Sarıyer, Maslak',
];

const FEATURE_POOL = ['Havuz', 'Spa', 'Ücretsiz WiFi', 'Otopark', 'Kahvaltı dahil', 'Fitness', 'Roof bar'];

const TYPES = ['Otel', 'Apart', 'Villa', 'Hostel', 'Pansiyon'];

const ROOMS = [
  'Standart Çift Kişilik',
  'Deluxe Oda',
  'Superior King',
  'Aile Odası',
  'Executive Suite',
];

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function subset(rng, arr, min, max) {
  const n = min + Math.floor(rng() * (max - min + 1));
  const shuffled = [...arr].sort(() => rng() - 0.5);
  return shuffled.slice(0, n);
}

/** @returns {() => number} 0..1 */
function makeRng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function rng() {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function getMockHotels({ city = 'İstanbul', seed = Date.now() } = {}) {
  const rng = makeRng(Number(seed) || 888);
  const list = [];

  for (let i = 0; i < 15; i++) {
    const stars = 3 + Math.floor(rng() * 3);
    const score = Math.round((7 + rng() * 2.5) * 10) / 10;
    const price = Math.floor(1500 + rng() * 6500);
    const oldPrice = rng() > 0.55 ? Math.floor(price * (1.08 + rng() * 0.15)) : null;
    const feats = subset(rng, FEATURE_POOL, 2, 5);
    const primaryType = pick(rng, TYPES);
    const reviewCount = 120 + Math.floor(rng() * 2800);

    list.push({
      id: `stay-mock-${i}-${seed}`,
      name: NAMES[i % NAMES.length],
      city: city || 'İstanbul',
      stars,
      district: pick(rng, DISTRICTS),
      features: feats,
      types: [primaryType, rng() > 0.7 ? pick(rng, TYPES.filter((t) => t !== primaryType)) : null].filter(Boolean),
      roomType: pick(rng, ROOMS),
      freeCancel: rng() > 0.35,
      payAtHotel: rng() > 0.5,
      score,
      reviewCount,
      priceNight: price,
      oldPriceNight: oldPrice,
      photoCount: 3,
      distCenter: Math.round((0.3 + rng() * 12) * 10) / 10,
      mapX: 12 + rng() * 76,
      mapY: 10 + rng() * 72,
    });
  }

  return list;
}
