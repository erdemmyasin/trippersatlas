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
        <Sparkles size={12} strokeWidth={2.2} color="var(--ta-accent)" aria-hidden />
        <span>Atlas önerisi</span>
      </div>
      <div style={s.adviceCard}>
        <div style={s.accentBar} aria-hidden />
        <div style={s.adviceBody}>
          <div style={s.iconWrap} aria-hidden>
            <Icon size={18} strokeWidth={1.85} color="var(--ta-accent)" />
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
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    marginBottom: 'var(--space-3)',
    fontSize: 'var(--text-xs)',
    lineHeight: 'var(--text-xs-lh)',
    color: 'var(--ta-ink-muted)',
    textTransform: 'uppercase',
    letterSpacing: '.12em',
    fontWeight: 'var(--fw-bold)',
    fontFamily: 'var(--font-sans)',
  },
  adviceCard: {
    position: 'relative',
    background: 'var(--ta-muted-bg)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(31,77,92,0.10)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    boxShadow: '0 6px 18px rgba(31,77,92,0.06)',
    boxSizing: 'border-box',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    background: 'var(--ta-accent)',
  },
  adviceBody: {
    padding: 'var(--space-4) var(--space-4) var(--space-4) var(--space-5)',
    display: 'flex',
    gap: 'var(--space-3)',
    alignItems: 'flex-start',
  },
  iconWrap: {
    flexShrink: 0,
    width: 'var(--space-7)',
    height: 'var(--space-7)',
    borderRadius: 'var(--radius-pill)',
    background: 'rgba(31,77,92,0.10)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adviceHead: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-base)',
    lineHeight: 'var(--text-base-lh)',
    fontWeight: 'var(--fw-bold)',
    color: 'var(--ta-ink)',
    marginBottom: 'var(--space-1)',
  },
  adviceText: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    lineHeight: 'var(--text-sm-lh)',
    color: 'var(--ta-ink-muted)',
    margin: '0 0 var(--space-3)',
  },
  ctaBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'var(--ta-accent)',
    background: 'var(--ta-accent)',
    color: '#fff',
    borderRadius: 'var(--radius-pill)',
    padding: 'var(--space-2) var(--space-3)',
    fontSize: 'var(--text-sm)',
    lineHeight: 'var(--text-sm-lh)',
    fontWeight: 'var(--fw-bold)',
    fontFamily: 'var(--font-sans)',
    cursor: 'pointer',
    transition: 'opacity var(--duration-fast) var(--ease-out), transform var(--duration-fast) var(--ease-out)',
  },
};
