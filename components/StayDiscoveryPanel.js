'use client';

import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';

/**
 * /stay arama öncesi boş ekran yerine bağlamsal discovery paneli.
 * Atlas Cinematic Editorial dilinde: eyebrow + serif başlık + öne çıkan şehirler
 * şeridi + küçük Atlas notu + "Atlas'a sor" çıkış kapısı.
 */

const UNSPLASH = (slug, w = 360) =>
  `https://images.unsplash.com/${slug}?auto=format&fit=crop&w=${w}&q=80`;

const POPULAR_STAY_CITIES = [
  { city: 'Antalya',   region: 'Akdeniz',     img: 'photo-1559827260-dc66d52bef19' },
  { city: 'İstanbul',  region: 'Marmara',     img: 'photo-1524231757912-21f4fe3a7200' },
  { city: 'Bodrum',    region: 'Ege',         img: 'photo-1533105079780-92b9be482077' },
  { city: 'Kapadokya', region: 'İç Anadolu',  img: 'photo-1506905925346-21bda4d32df4' },
  { city: 'Fethiye',   region: 'Ege',         img: 'photo-1559128010-7c1ad6e1b6a5' },
  { city: 'Çeşme',     region: 'Ege',         img: 'photo-1582721478779-0ae163c05a60' },
];

const ATLAS_NOTES = [
  {
    label: 'Erken rezervasyon',
    text: 'Üç hafta öncesinden bakan otelde ortalama %15 indirim yakalar.',
  },
  {
    label: 'Esnek tarih',
    text: 'Hafta içine kaydırılan rezervasyonlar hafta sonuna göre belirgin daha uygun.',
  },
];

export default function StayDiscoveryPanel({ onPickCity }) {
  const router = useRouter();

  function handleCityPick(city) {
    if (typeof onPickCity === 'function') {
      onPickCity(city);
    }
  }

  function handleAskAtlas() {
    router.push('/chat?newChat=1');
  }

  return (
    <section style={s.wrap} aria-label="Konaklama keşif paneli">
      <header style={s.head}>
        <span style={s.eyebrow}>Atlas · Konaklama</span>
        <h2 style={s.title}>Nereye konaklamak istersin?</h2>
        <p style={s.subtitle}>
          Üstten yer ve tarih seçerek arayın, ya da aşağıdaki şehirlerden ilhamla başlayın.
        </p>
      </header>

      <div style={s.section}>
        <div style={s.sectionEyebrow}>Bu Hafta Öne Çıkan</div>
        <div style={s.cities}>
          {POPULAR_STAY_CITIES.map((it) => (
            <button
              key={it.city}
              type="button"
              style={{
                ...s.cityCard,
                backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(15,23,32,.72) 100%), url(${UNSPLASH(it.img)})`,
              }}
              onClick={() => handleCityPick(it.city)}
              aria-label={`${it.city} için arama başlat`}
            >
              <span style={s.cityRegion}>{it.region.toUpperCase()}</span>
              <span style={s.cityName}>{it.city}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={s.notesRow}>
        {ATLAS_NOTES.map((n) => (
          <div key={n.label} style={s.note}>
            <span style={s.noteLabel}>{n.label}</span>
            <span style={s.noteText}>{n.text}</span>
          </div>
        ))}
      </div>

      <div style={s.askWrap}>
        <button type="button" style={s.askBtn} onClick={handleAskAtlas}>
          <Sparkles size={14} strokeWidth={2.4} color="var(--ta-accent)" aria-hidden />
          Ne aradığını Atlas'a anlat
        </button>
      </div>
    </section>
  );
}

const s = {
  wrap: {
    width: '100%',
    maxWidth: 980,
    margin: '0 auto',
    padding: 'var(--space-6) var(--space-2) var(--space-8)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-6)',
    boxSizing: 'border-box',
  },
  head: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: 'var(--space-2)',
  },
  eyebrow: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 12px',
    borderRadius: 999,
    background: 'rgba(31, 77, 92, 0.06)',
    border: '1px solid rgba(31, 77, 92, 0.22)',
    fontFamily: 'var(--font-sans)',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '0.20em',
    textTransform: 'uppercase',
    color: 'var(--ta-ink)',
  },
  title: {
    margin: 0,
    fontFamily: 'var(--font-serif)',
    fontWeight: 700,
    fontSize: 34,
    lineHeight: 1.1,
    letterSpacing: '-0.025em',
    color: 'var(--ta-ink)',
  },
  subtitle: {
    margin: 0,
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-md)',
    lineHeight: 1.5,
    color: 'var(--ta-ink-muted)',
    maxWidth: 38 + 'em',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
  },
  sectionEyebrow: {
    fontFamily: 'var(--font-sans)',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: 'var(--ta-ink-muted)',
    borderTop: '1px solid rgba(31, 77, 92, 0.18)',
    paddingTop: 'var(--space-3)',
  },
  cities: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: 'var(--space-3)',
  },
  cityCard: {
    position: 'relative',
    aspectRatio: '4 / 5',
    border: 'none',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0b1b22',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    cursor: 'pointer',
    padding: 'var(--space-3)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    textAlign: 'left',
    color: '#fff',
    boxShadow: '0 8px 22px rgba(31, 77, 92, 0.14)',
    transition: 'transform var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out)',
  },
  cityRegion: {
    alignSelf: 'flex-start',
    padding: '3px 8px',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.12em',
    color: '#fff',
    background: 'rgba(15, 23, 32, 0.55)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    borderRadius: 999,
    textTransform: 'uppercase',
    fontFamily: 'var(--font-sans)',
  },
  cityName: {
    fontFamily: 'var(--font-serif)',
    fontWeight: 700,
    fontSize: 22,
    letterSpacing: '-0.01em',
    color: '#fff',
    textShadow: '0 2px 6px rgba(0,0,0,0.55)',
  },
  notesRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 'var(--space-4)',
    borderTop: '1px solid rgba(31, 77, 92, 0.18)',
    paddingTop: 'var(--space-4)',
  },
  note: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  noteLabel: {
    fontFamily: 'var(--font-sans)',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--ta-accent)',
  },
  noteText: {
    fontFamily: 'var(--font-sans)',
    fontSize: 13,
    color: 'var(--ta-ink)',
    lineHeight: 1.55,
  },
  askWrap: {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: 'var(--space-3)',
  },
  askBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    borderRadius: 999,
    background: 'transparent',
    border: '1px solid rgba(31, 77, 92, 0.32)',
    fontFamily: 'var(--font-sans)',
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--ta-ink)',
    cursor: 'pointer',
    letterSpacing: '0.01em',
    transition: 'background var(--duration-fast) var(--ease-out), border-color var(--duration-fast) var(--ease-out)',
  },
};
