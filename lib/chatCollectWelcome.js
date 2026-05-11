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
  eyebrow: 'Atlas · Seyahat asistanın',
  title: 'Bugün nereye?',
  subtitle: 'Bir cümle yeter — gerisini birlikte planlayalım.',
  prompts: [
    'Hafta sonu kaçamağı öner',
    'Aileyle yaz tatili planla',
    'Solo şehir turu',
  ],
};

const EMPTY_HERO_EN = {
  eyebrow: 'Atlas · Your travel companion',
  title: 'Where to today?',
  subtitle: 'One sentence is enough — we will plan the rest together.',
  prompts: [
    'A weekend escape',
    'Family summer trip',
    'Solo city break',
  ],
};

export function buildEmptyHero(lang) {
  return String(lang || '').toUpperCase() === 'EN' ? EMPTY_HERO_EN : EMPTY_HERO_TR;
}
