/** Yeni sohbet karşılama mesajı — kullanıcı diline göre üretilir. */

const TR = {
  message:
    'Merhaba, ben Atlas. Önce üstteki Destinasyon, Tarih ve Bütçe bilgilerini birlikte netleştirelim. Kişi sayısı şimdilik 1 yetişkin olarak ayarlı; değiştirmek istersen söylemen yeterli. Notlar isteğe bağlı — özel bir tercih yoksa boş bırakabilirsin. Bu adımlar tamamlanınca sana uygun önerilere geçeceğim.',
  quickReplies: ['Destinasyonu yazayım', 'Tarih konusunda yardım', 'Bütçe aralığı seçelim'],
};

const EN = {
  message:
    "Hi, I'm Atlas. Let's first clarify the Destination, Dates and Budget at the top together. Travelers default to 1 adult — just tell me if you want to change it. Notes are optional; leave them blank if you have no special preference. Once these are set, I'll move on to tailored recommendations.",
  quickReplies: ['I will set destination', 'Help with dates', 'Pick a budget range'],
};

export function buildCollectMetaWelcome(lang) {
  const L = String(lang || '').toUpperCase() === 'EN' ? EN : TR;
  return {
    role: 'assistant',
    content: L.message,
    listings: [],
    quickReplies: L.quickReplies,
    proactive: [],
    localInsights: [],
  };
}

/** Geriye dönük uyumluluk için varsayılan (TR) — yeni kod buildCollectMetaWelcome kullanmalı. */
export const COLLECT_META_WELCOME = buildCollectMetaWelcome('TR');

const EMPTY_HERO_TR = {
  title: 'Bugün nereye?',
  subtitle: 'Selam, seyahat planlamanda yardımcı olmak için buradayım. Aklındakini yazman yeterli.',
};

const EMPTY_HERO_EN = {
  title: 'Where to today?',
  subtitle: "Hey there, I'm here to help you plan your trip. Just tell me what's on your mind.",
};

export function buildEmptyHero(lang) {
  return String(lang || '').toUpperCase() === 'EN' ? EMPTY_HERO_EN : EMPTY_HERO_TR;
}
