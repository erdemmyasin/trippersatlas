/** Sağ panel akışı için Instagram-style portrait reels mock verisi.
 *  Sonra gerçek Instagram embed API'sine bağlanacak — schema aynı kalmalı.
 *
 *  Schema:
 *    { id, handle, displayName, city, region, caption, poster, durationSec, likes }
 */

const UNSPLASH = (slug, w = 720) =>
  `https://images.unsplash.com/${slug}?auto=format&fit=crop&w=${w}&q=80&ixlib=rb-4.1.0`;

export const FEED_MOCK = [
  {
    id: 'r1',
    handle: '@karakaya_travel',
    displayName: 'Ece Karakaya',
    city: 'Kapadokya',
    region: 'İç Anadolu',
    caption: 'Sabahın 5\'inde balon turunda. Vadi sis altında.',
    poster: 'photo-1506905925346-21bda4d32df4',
    durationSec: 32,
    likes: 18420,
  },
  {
    id: 'r2',
    handle: '@bodrum_diary',
    displayName: 'Cem Aydın',
    city: 'Bodrum',
    region: 'Ege',
    caption: 'Gümüşlük gün batımı — mavi tur 3. günü.',
    poster: 'photo-1533105079780-92b9be482077',
    durationSec: 18,
    likes: 9210,
  },
  {
    id: 'r3',
    handle: '@anatolian_steps',
    displayName: 'Selin Yıldız',
    city: 'Antalya',
    region: 'Akdeniz',
    caption: 'Aspendos antik kentinde akşam konseri.',
    poster: 'photo-1559827260-dc66d52bef19',
    durationSec: 24,
    likes: 12380,
  },
  {
    id: 'r4',
    handle: '@istanbul_eats',
    displayName: 'Mehmet Demir',
    city: 'İstanbul',
    region: 'Marmara',
    caption: 'Karaköy\'de simit + Boğaz manzarası.',
    poster: 'photo-1524231757912-21f4fe3a7200',
    durationSec: 14,
    likes: 24100,
  },
  {
    id: 'r5',
    handle: '@dilay_travel',
    displayName: 'Dilay Sönmez',
    city: 'Fethiye',
    region: 'Ege',
    caption: 'Ölüdeniz paragliding — kuş bakışı 1900m.',
    poster: 'photo-1559128010-7c1ad6e1b6a5',
    durationSec: 41,
    likes: 31250,
  },
  {
    id: 'r6',
    handle: '@blacksea_route',
    displayName: 'Burak Çelik',
    city: 'Rize',
    region: 'Karadeniz',
    caption: 'Ayder yaylasında çay molası, sis arasında.',
    poster: 'photo-1597926726509-8d3c34d8b7be',
    durationSec: 22,
    likes: 7820,
  },
  {
    id: 'r7',
    handle: '@500kmtoparis',
    displayName: 'Zeynep Akın',
    city: 'Datça',
    region: 'Ege',
    caption: 'Knidos\'ta limondan limonata — yaz koyları.',
    poster: 'photo-1582721478779-0ae163c05a60',
    durationSec: 17,
    likes: 6440,
  },
  {
    id: 'r8',
    handle: '@solo_in_anatolia',
    displayName: 'Ahmet Polat',
    city: 'Mardin',
    region: 'Güneydoğu',
    caption: 'Eski şehirde gün batımı + taş sokaklar.',
    poster: 'photo-1564507592333-c60657eea523',
    durationSec: 28,
    likes: 14110,
  },
];

export function getPosterUrl(poster, width = 720) {
  return UNSPLASH(poster, width);
}

/** Destinasyon eşleşmesine göre sırala — eşleşen kartlar üste, gerisi alta. */
export function sortFeedByDestination(items, destination) {
  const dest = String(destination || '').trim().toLocaleLowerCase('tr-TR');
  if (!dest) return items;
  const score = (it) => {
    const city = String(it.city).toLocaleLowerCase('tr-TR');
    const region = String(it.region).toLocaleLowerCase('tr-TR');
    if (city.includes(dest) || dest.includes(city)) return 0;
    if (region.includes(dest) || dest.includes(region)) return 1;
    return 2;
  };
  return [...items].sort((a, b) => score(a) - score(b));
}
