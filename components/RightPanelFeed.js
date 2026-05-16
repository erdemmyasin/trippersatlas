'use client';

import { useMemo } from 'react';
import { Heart, MapPin, Play } from 'lucide-react';
import { FEED_MOCK, getPosterUrl, sortFeedByDestination } from '@/lib/feedMockData';

function formatLikes(n) {
  if (n >= 1000) {
    const k = n / 1000;
    return `${k.toFixed(k >= 10 ? 0 : 1)}K`;
  }
  return String(n);
}

function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Cinematic Editorial sağ panel — portrait reels akışı.
 * Mock veriyle başlar; sonra Instagram embed/oEmbed bağlanacak (schema aynı).
 *
 * Props:
 *  - destination: bağlam, akış sıralamasını etkiler (eşleşenler üste).
 *  - onPickCity:  bir karta tıklayınca chat'e "Bana {şehir} hakkında daha fazla göster"
 *                 prompt'u düşmek için workspace callback'i.
 *  - onShowOnMap: "📍 Haritada" tıklamasında çalışır — workspace harita slide-in açar.
 */
export default function RightPanelFeed({
  destination = '',
  onPickCity,
  onShowOnMap,
}) {
  const items = useMemo(
    () => sortFeedByDestination(FEED_MOCK, destination),
    [destination]
  );

  return (
    <div style={s.wrap}>
      <div style={s.head}>
        <span style={s.eyebrow}>Bu hafta keşfedilenler</span>
        <span style={s.headMeta}>{items.length} reel</span>
      </div>

      <div style={s.feed} role="feed" aria-label="Atlas akışı">
        {items.map((it) => (
          <article key={it.id} style={s.card}>
            <button
              type="button"
              style={s.poster}
              onClick={() => onPickCity?.(it.city)}
              aria-label={`${it.city} reel — sohbete ekle`}
            >
              <span
                style={{
                  ...s.posterImg,
                  backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0) 38%, rgba(0,0,0,.72) 100%), url(${getPosterUrl(it.poster)})`,
                }}
                aria-hidden
              />
              <span style={s.playBadge} aria-hidden>
                <Play size={14} strokeWidth={2.4} color="#fff" />
              </span>
              <span style={s.regionTag}>{it.region.toUpperCase()}</span>
              <span style={s.bottomOverlay}>
                <span style={s.cityRow}>
                  <MapPin size={12} strokeWidth={2.4} color="#fff" aria-hidden />
                  <span style={s.cityName}>{it.city}</span>
                </span>
                <span style={s.caption}>{it.caption}</span>
                <span style={s.metaRow}>
                  <span style={s.handle}>{it.handle}</span>
                  <span style={s.metaSep}>·</span>
                  <span style={s.metaDuration}>{formatDuration(it.durationSec)}</span>
                  <span style={s.metaLikes}>
                    <Heart size={11} strokeWidth={2.2} color="rgba(255,255,255,.85)" aria-hidden />
                    {formatLikes(it.likes)}
                  </span>
                </span>
              </span>
            </button>
            <button
              type="button"
              style={s.mapBtn}
              onClick={() => onShowOnMap?.(it.city)}
              aria-label={`${it.city} haritada göster`}
            >
              <MapPin size={12} strokeWidth={2.4} color="var(--ta-accent)" aria-hidden />
              Haritada
            </button>
          </article>
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  eyebrow: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--fw-bold)',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--ta-accent)',
  },
  headMeta: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-xs)',
    color: 'var(--ta-ink-muted)',
  },
  feed: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
    paddingRight: 2,
  },
  card: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  },
  poster: {
    position: 'relative',
    width: '100%',
    aspectRatio: '9 / 14',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    background: '#0b1b22',
    boxShadow: '0 10px 28px rgba(31,77,92,0.18)',
    transition: 'transform var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out)',
  },
  posterImg: {
    position: 'absolute',
    inset: 0,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },
  playBadge: {
    position: 'absolute',
    top: 'var(--space-3)',
    left: 'var(--space-3)',
    width: 30,
    height: 30,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.18)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(255,255,255,0.30)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  regionTag: {
    position: 'absolute',
    top: 'var(--space-3)',
    right: 'var(--space-3)',
    padding: '3px 8px',
    fontSize: 10,
    fontWeight: 'var(--fw-bold)',
    letterSpacing: '0.10em',
    color: '#fff',
    background: 'rgba(31,77,92,0.65)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    borderRadius: 'var(--radius-pill)',
    fontFamily: 'var(--font-sans)',
  },
  bottomOverlay: {
    position: 'absolute',
    left: 'var(--space-3)',
    right: 'var(--space-3)',
    bottom: 'var(--space-3)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
    textAlign: 'left',
  },
  cityRow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  },
  cityName: {
    fontFamily: 'var(--font-serif)',
    fontWeight: 'var(--fw-bold)',
    fontSize: 'var(--text-xl)',
    lineHeight: 1.1,
    letterSpacing: '-0.01em',
    color: '#fff',
    textShadow: '0 2px 6px rgba(0,0,0,0.55)',
  },
  caption: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-xs)',
    lineHeight: 1.35,
    color: 'rgba(255,255,255,0.92)',
    textShadow: '0 1px 3px rgba(0,0,0,0.6)',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  metaRow: {
    marginTop: 4,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontFamily: 'var(--font-sans)',
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
    textShadow: '0 1px 2px rgba(0,0,0,0.6)',
  },
  handle: {
    fontWeight: 'var(--fw-semibold)',
  },
  metaSep: {
    opacity: 0.6,
  },
  metaDuration: {
    fontVariantNumeric: 'tabular-nums',
  },
  metaLikes: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    marginLeft: 'auto',
  },
  mapBtn: {
    alignSelf: 'flex-start',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '4px 10px',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--fw-semibold)',
    color: 'var(--ta-accent)',
    background: 'transparent',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(31,77,92,0.22)',
    borderRadius: 'var(--radius-pill)',
    cursor: 'pointer',
    transition: 'background var(--duration-fast) var(--ease-out), border-color var(--duration-fast) var(--ease-out)',
  },
};
