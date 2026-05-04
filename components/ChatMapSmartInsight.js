'use client';

import { ArrowRight, MapPin, CalendarRange, Users, Wallet, Sparkles } from 'lucide-react';

/**
 * Sohbet /chat: "Akıllı öneri" — kullanıcıyı üstteki filtre çiplerini doldurmaya
 * yönlendirir. Eksik filtreyi tespit edip ilgili chip'i açma olayını tetikler.
 *
 * Header bu olayı dinler: window.dispatchEvent(new CustomEvent('atlas-open-chip',
 * { detail: { id } })).
 */
const FIELD_ORDER = ['dest', 'dates', 'budget', 'pax'];

function isFilled(id, meta) {
  if (!meta || typeof meta !== 'object') return false;
  if (id === 'dest') return Boolean(String(meta.destination || '').trim());
  if (id === 'dates') {
    if (String(meta.datesChipText || '').trim()) return true;
    if (Number(meta.nights) > 0 && String(meta.month || '').trim()) return true;
    return false;
  }
  if (id === 'pax') {
    const txt = String(meta.paxChipText || '').trim();
    return Boolean(txt) && txt !== '1 yetişkin';
  }
  if (id === 'budget') return Boolean(String(meta.budget || '').trim());
  return false;
}

const COPY = {
  dest: {
    icon: MapPin,
    label: 'Destinasyon',
    title: 'Önce nereye gideceğini söyle',
    desc: 'Şehir veya bölge yazınca öneriler tam yerinden gelmeye başlar.',
    cta: 'Destinasyon ekle',
  },
  dates: {
    icon: CalendarRange,
    label: 'Tarih',
    title: 'Tarihleri belirleyelim',
    desc: 'Tarih aralığı veya esnek mod seçtiğinde fiyat ve müsaitlik daha doğru olur.',
    cta: 'Tarih seç',
  },
  budget: {
    icon: Wallet,
    label: 'Bütçe',
    title: 'Bütçeyi söylemen yeterli',
    desc: 'Bütçe aralığını belirtirsen otel ve aktiviteler buna göre süzülür.',
    cta: 'Bütçe belirle',
  },
  pax: {
    icon: Users,
    label: 'Yolcu',
    title: 'Kim seyahat ediyor?',
    desc: 'Yetişkin/çocuk sayısı netleşince oda ve aktiviteler doğru filtrelenir.',
    cta: 'Yolcuları ayarla',
  },
};

const ALL_DONE = {
  icon: Sparkles,
  label: 'Hazır',
  title: 'Filtreler hazır görünüyor',
  desc: 'Atlas\'a istediğin önerileri sorabilirsin — sonuçlar üstteki filtrelere göre süzülür.',
  cta: null,
};

function openChip(id) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('atlas-open-chip', { detail: { id } }));
}

export default function ChatMapSmartInsight({ tripMeta }) {
  const nextId = FIELD_ORDER.find((id) => !isFilled(id, tripMeta));
  const copy = nextId ? COPY[nextId] : ALL_DONE;
  const Icon = copy.icon;
  const actionable = Boolean(nextId && copy.cta);

  return (
    <div style={s.wrap}>
      <div style={s.sectionTitle}>
        <span>Akıllı öneri</span>
      </div>
      <div style={s.adviceCard}>
        <div style={s.iconWrap} aria-hidden>
          <Icon size={18} strokeWidth={1.85} color="var(--ta-accent, #1a73e8)" />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={s.adviceHead}>{copy.title}</div>
          <p style={s.adviceText}>{copy.desc}</p>
          {actionable ? (
            <button
              type="button"
              style={s.ctaBtn}
              onClick={() => openChip(nextId)}
              aria-label={copy.cta}
            >
              <span>{copy.cta}</span>
              <ArrowRight size={14} strokeWidth={2.2} aria-hidden />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const s = {
  wrap: {
    flexShrink: 0,
    width: '100%',
    boxSizing: 'border-box',
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    fontSize: 12,
    color: 'var(--muted)',
    textTransform: 'uppercase',
    letterSpacing: '.08em',
    fontWeight: 700,
    fontFamily: 'var(--font-sans)',
  },
  adviceCard: {
    border: '1px solid var(--line)',
    background: 'rgba(255,255,255,.72)',
    borderRadius: 18,
    padding: 14,
    boxSizing: 'border-box',
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
  },
  iconWrap: {
    flexShrink: 0,
    width: 32,
    height: 32,
    borderRadius: 999,
    background: 'rgba(26,115,232,.10)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adviceHead: {
    fontFamily: 'var(--font-sans)',
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--ta-ink, #0f2942)',
    marginBottom: 4,
    lineHeight: 1.3,
  },
  adviceText: {
    fontFamily: 'var(--font-sans)',
    fontSize: 12,
    color: 'var(--ta-ink-muted)',
    lineHeight: 1.5,
    margin: '0 0 10px',
  },
  ctaBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    border: '1px solid var(--ta-accent, #1a73e8)',
    background: 'var(--ta-accent, #1a73e8)',
    color: '#fff',
    borderRadius: 999,
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 700,
    fontFamily: 'var(--font-sans)',
    cursor: 'pointer',
  },
};
