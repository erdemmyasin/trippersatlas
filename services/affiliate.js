/**
 * Ortaklık URL’leri. `label=tripperatlas` partner izleme etiketidir (tripperatlas.ai ile uyumlu);
 * kullanıcıya görünen ürün adı sitede Atlas olarak geçer.
 */
import { isTurkeyPrimaryMarket } from '@/lib/taRegion';

export function buildAffiliateUrl(listing) {
  const { affiliatePlatform, name } = listing;

  const IDS = {
    booking:    process.env.NEXT_PUBLIC_BOOKING_ID  || 'TEST123',
    gyg:        process.env.NEXT_PUBLIC_GYG_ID      || 'TEST456',
    kiwitaxi:   process.env.NEXT_PUBLIC_KIWI_ID     || 'TEST789',
    skyscanner: process.env.NEXT_PUBLIC_SKY_ID      || 'TEST000',
  };

  switch (affiliatePlatform) {
    case 'booking':
      return `https://www.booking.com/search.html?ss=${encodeURIComponent(name)}&aid=${IDS.booking}&label=tripperatlas`;
    case 'gyg':
      return `https://www.getyourguide.com/s/?q=${encodeURIComponent(name)}&partner_id=${IDS.gyg}`;
    case 'kiwitaxi':
      return `https://kiwitaxi.com/?ref=${IDS.kiwitaxi}`;
    case 'skyscanner':
      return isTurkeyPrimaryMarket()
        ? `https://www.skyscanner.com.tr/?associateid=${IDS.skyscanner}`
        : `https://www.skyscanner.net/transport/flights/?associateid=${IDS.skyscanner}`;
    default:
      return `https://www.booking.com/search.html?ss=${encodeURIComponent(name)}&aid=${IDS.booking}&label=tripperatlas`;
  }
}
