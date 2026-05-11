'use client';

import { Sparkles, MapPin } from 'lucide-react';

/**
 * Sağ panel — destinasyon henüz seçilmemişken haritanın yerine.
 * 4 popüler/öneri destinasyon kartı; tıklanınca üstteki destinasyon chip'i açılır.
 */

const UNSPLASH = (id, w = 400) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80&ixlib=rb-4.1.0`;

const INSPIRATIONS = [
  {
    city: 'Kapadokya',
    region: 'İç Anadolu',
    img: 'photo-1506905925346-21bda4d32df4',
    tagline: 'Balon ve peri bacaları',
  },
  {
    city: 'Bodrum',
    region: 'Ege',
    img: 'photo-1533105079780-92b9be482077',
    tagline: 'Mavi yolculuk',
  },
  {
    city: 'Antalya',
    region: 'Akdeniz',
    img: 'photo-1559827260-dc66d52bef19',
    tagline: 'Antik kentler',
  },
  {
    city: 'İstanbul',
    region: 'Marmara',
    img: 'photo-1524231757912-21f4fe3a7200',
    tagline: 'Tarih ve Boğaz',
  },
];

function pickInspiration(city) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('atlas-open-chip', { detail: { id: 'dest', preset: city } })
  );
}

export default function RightPanelInspirations() {
  return (
    <div style={s.wrap}>
      <div style={s.head}>
        <Sparkles size={14} strokeWidth={2.2} color="var(--ta-accent)" aria-hidden />
        <span style={s.headLbl}>Bu hafta öne çıkan</span>
      </div>
      <div style={s.grid}>
        {INSPIRATIONS.map((it) => (
          <button
            key={it.city}
            type="button"
            style={{
              ...s.card,
              backgroundImage: `linear-gradient(180deg, transparent 45%, rgba(0,0,0,.62) 100%), url(${UNSPLASH(it.img)})`,
            }}
            onClick={() => pickInspiration(it.city)}
            aria-label={`${it.city} için plan başlat`}
          >
            <span style={s.region}>{it.region.toUpperCase()}</span>
            <span style={s.body}>
              <span style={s.city}>
                <MapPin size={13} strokeWidth={2.2} aria-hidden />
                {it.city}
              </span>
              <span style={s.tag}>{it.tagline}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

const s = {
  wrap: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
  },
  head: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--fw-bold)',
    color: 'var(--ta-ink-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    flexShrink: 0,
  },
  headLbl: {
    lineHeight: 1.2,
  },
  grid: {
    flex: 1,
    minHeight: 0,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridAutoRows: '1fr',
    gap: 'var(--space-2)',
  },
  card: {
    position: 'relative',
    minHeight: 132,
    border: 'none',
    padding: 0,
    margin: 0,
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    cursor: 'pointer',
    color: '#fff',
    backgroundColor: 'var(--ta-muted-bg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    fontFamily: 'var(--font-sans)',
    boxShadow: '0 1px 3px rgba(15,41,74,.10)',
    transition: 'transform var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    textAlign: 'left',
    padding: 'var(--space-3)',
    boxSizing: 'border-box',
  },
  region: {
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--fw-bold)',
    letterSpacing: '0.08em',
    color: 'rgba(255,255,255,.92)',
    textShadow: '0 1px 2px rgba(0,0,0,.4)',
    background: 'rgba(31,77,92,.55)',
    padding: '3px 8px',
    borderRadius: 'var(--radius-pill)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-px)',
  },
  city: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-1)',
    fontFamily: 'var(--font-serif)',
    fontSize: 'var(--text-lg)',
    fontWeight: 'var(--fw-bold)',
    letterSpacing: '-0.01em',
    color: '#fff',
    textShadow: '0 1px 4px rgba(0,0,0,.5)',
  },
  tag: {
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--fw-medium)',
    color: 'rgba(255,255,255,.86)',
    textShadow: '0 1px 3px rgba(0,0,0,.45)',
  },
};
