import { isTurkeyPrimaryMarket } from '@/lib/taRegion';

/** Yeni sohbet: önce üst filtreleri netleştirme; henüz destinasyon önerisi yok */
export const COLLECT_META_WELCOME = {
  role: 'assistant',
  content:
    'Merhaba, ben Atlas. Önce üstteki Destinasyon, Tarih ve Bütçe bilgilerini birlikte netleştirelim. Kişi sayısı şimdilik 1 yetişkin olarak ayarlı; değiştirmek istersen söylemen yeterli. Notlar isteğe bağlı — özel bir tercih yoksa boş bırakabilirsin. Bu adımlar tamamlanınca sana uygun önerilere geçeceğim.',
  listings: [],
  quickReplies: isTurkeyPrimaryMarket()
    ? ['Destinasyonu yazayım', 'Tarih konusunda yardım', 'Bütçe aralığı seçelim']
    : ['I will set destination', 'Help with dates', 'Pick a budget range'],
  proactive: [],
  localInsights: [],
};
