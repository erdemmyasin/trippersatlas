'use client';

import { useState, useEffect } from 'react';
import { buildAffiliateUrl } from '@/services/affiliate';

/* ── Tip + lokasyon → Unsplash query ── */
const TYPE_KEYWORDS = {
  hotel:      'luxury,hotel,room',
  villa:      'villa,pool,luxury',
  clinic:     'medical,clinic,modern',
  car:        'car,rental,travel',
  tour:       'tour,travel,adventure',
  transfer:   'airport,transfer,car',
  restaurant: 'restaurant,food,dining',
  boat:       'boat,sea,travel',
};

const LOCATION_KEYWORDS = {
  istanbul:   'istanbul',
  bodrum:     'bodrum,aegean',
  kapadokya:  'cappadocia',
  cappadocia: 'cappadocia',
  antalya:    'antalya,mediterranean',
};

const FALLBACKS = {
  hotel:      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=220&fit=crop',
  villa:      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=220&fit=crop',
  restaurant: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=220&fit=crop',
  tour:       'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=220&fit=crop',
  transfer:   'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400&h=220&fit=crop',
  clinic:     'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=220&fit=crop',
  default:    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=220&fit=crop',
};

function buildQuery(listing) {
  const { type, location = '' } = listing;
  const typeKw = TYPE_KEYWORDS[type] ?? 'hotel,travel,luxury';
  const locLower = location.toLowerCase();
  let locKw = 'turkey,travel';
  for (const [key, kw] of Object.entries(LOCATION_KEYWORDS)) {
    if (locLower.includes(key)) { locKw = kw; break; }
  }
  return `${typeKw},${locKw}`;
}

/* ── Fallback gradients (indekse göre) ── */
const GRADIENTS = [
  'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
  'linear-gradient(135deg,#f093fb 0%,#f5576c 100%)',
  'linear-gradient(135deg,#4facfe 0%,#00f2fe 100%)',
  'linear-gradient(135deg,#43e97b 0%,#38f9d7 100%)',
  'linear-gradient(135deg,#fa709a 0%,#fee140 100%)',
];

export default function ListingCard({
  listing,
  index = 0,
  compact = false,
  onPlanSelect,   /* page-level handler: listing → budget + module update */
  isSelected = false,
}) {
  const [imgSrc, setImgSrc]     = useState(null);
  const [imgState, setImgState] = useState('loading');
  const [selHov, setSelHov]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [loading, setLoading]   = useState(false);

  if (!listing) return null;

  const {
    name,
    location,
    price,
    priceUnit = 'gece',
    badge,
    emoji,
    type,
    trustSignal,
    affiliatePlatform,
  } = listing;

  const fallback = FALLBACKS[type] ?? FALLBACKS.default;
  const gradient = GRADIENTS[index % GRADIENTS.length];

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    let cancelled = false;
    const query = buildQuery(listing);
    fetch(`/api/image?query=${encodeURIComponent(query)}&type=${encodeURIComponent(type || 'hotel')}`)
      .then(r => r.json())
      .then(data => { if (!cancelled) setImgSrc(data.url || fallback); })
      .catch(() => { if (!cancelled) setImgSrc(fallback); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, type, location]);

  async function handleSelect() {
    if (loading) return;

    /* 1 — Plan state'ini güncelle (senkron, hızlı) */
    onPlanSelect?.(listing);

    /* 2 — Affiliate kaydı + yeni sekme */
    const url = buildAffiliateUrl(listing);
    setLoading(true);
    try {
      await fetch('/api/affiliate/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingName: name, platform: affiliatePlatform || 'booking', url }),
      });
    } catch { /* devam et */ }
    finally {
      setLoading(false);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  /* Compact mod */
  if (compact) {
    return (
      <div style={sc.card}>
        <span style={sc.emoji}>{emoji || '🏨'}</span>
        <div style={sc.body}>
          <p style={sc.name}>{name}</p>
          {location && <p style={sc.loc}>📍 {location}</p>}
          {trustSignal && <p style={sc.trust}>★ {trustSignal}</p>}
        </div>
        <div style={sc.right}>
          {price != null && (
            <span style={sc.price}>
              ₺{Number(price).toLocaleString('tr-TR')}
              <span style={sc.unit}>/{priceUnit}</span>
            </span>
          )}
          <button
            style={{ ...sc.selBtn, ...(selHov ? sc.selHov : {}) }}
            onMouseEnter={() => setSelHov(true)}
            onMouseLeave={() => setSelHov(false)}
            onClick={handleSelect}
          >{loading ? '…' : 'Seç'}</button>
        </div>
      </div>
    );
  }

  /* Ekstra rating parse */
  const ratingMatch = (trustSignal || '').match(/(\d+\.\d+)\s*[·\-]\s*(\d+)\s*(yorum|review)/i);

  return (
    <div style={{
      ...sg.card,
      border: isSelected ? '2px solid #059669' : '1px solid var(--border)',
      boxShadow: isSelected ? '0 0 0 3px rgba(5,150,105,0.15)' : 'var(--shadow-sm)',
    }}>
      {/* ── Görsel alanı ── */}
      <div style={{
        ...sg.imgWrap,
        /* hata varsa gradient, aksi hâlde düz gri placeholder */
        background: imgState === 'error' ? gradient : '#e8e5e0',
      }}>
        {/* Skeleton: URL henüz gelmediyse veya yüklenmediyse */}
        {(imgSrc === null || imgState === 'loading') && <div style={sg.skeleton} />}

        {/* Fotoğraf — URL gelince mount et */}
        {imgSrc !== null && imgState !== 'error' && (
          <img
            src={imgSrc}
            alt={name}
            loading="lazy"
            style={{
              ...sg.img,
              opacity: imgState === 'loaded' ? 1 : 0,
              transition: 'opacity 0.35s ease',
            }}
            onLoad={() => setImgState('loaded')}
            onError={() => setImgState('error')}
          />
        )}

        {/* Hata fallback: büyük emoji */}
        {imgState === 'error' && (
          <span style={sg.fallbackEmoji}>{emoji || '🏨'}</span>
        )}

        {/* Alt-üst gradient overlay */}
        <div style={sg.overlay} />

        {/* Seçildi overlay */}
        {isSelected && (
          <div style={sg.selectedOverlay}>
            <span style={sg.selectedLabel}>✓ Seçildi</span>
          </div>
        )}

        {/* Badge */}
        {badge && <span style={sg.badge}>{badge}</span>}

        {/* Kaydet butonu */}
        <button
          style={sg.saveBtn}
          onClick={() => setSaved(v => !v)}
          title={saved ? 'Kaydedildi' : 'Kaydet'}
        >
          <BookmarkIcon filled={saved} />
        </button>
      </div>

      {/* ── İçerik ── */}
      <div style={sg.body}>
        <p style={sg.name}>{name}</p>
        {location && <p style={sg.loc}>📍 {location}</p>}

        {ratingMatch ? (
          <p style={sg.rating}>
            <StarIcon />{' '}{ratingMatch[1]}
            <span style={sg.reviews}> · {Number(ratingMatch[2]).toLocaleString('tr-TR')} yorum</span>
          </p>
        ) : trustSignal ? (
          <p style={sg.rating}><StarIcon />{' '}{trustSignal}</p>
        ) : null}

        {/* Fiyat + Seç */}
        <div style={sg.foot}>
          {price != null && (
            <div style={sg.priceGroup}>
              <span style={sg.price}>₺{Number(price).toLocaleString('tr-TR')}</span>
              <span style={sg.unit}>/{priceUnit}</span>
            </div>
          )}
          <button
            style={{
              ...sg.selBtn,
              ...(isSelected ? sg.selDone : {}),
              ...(selHov && !loading && !isSelected ? sg.selHov : {}),
              ...(loading ? sg.selLoading : {}),
            }}
            onMouseEnter={() => setSelHov(true)}
            onMouseLeave={() => setSelHov(false)}
            onClick={handleSelect}
            disabled={loading}
          >
            {loading ? '…' : isSelected ? '✓ Seçildi' : 'Seç'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StarIcon() {
  return <span style={{ color: '#F59E0B' }}>★</span>;
}

function BookmarkIcon({ filled }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24"
      fill={filled ? '#fff' : 'none'} stroke="#fff"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

/* ── Grid card styles ── */
const sg = {
  card: {
    background: 'var(--surface)',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    flex: '1 1 0',
    minWidth: '160px',
    maxWidth: '220px',
  },
  imgWrap: {
    position: 'relative',
    height: '220px',
    overflow: 'hidden',
    flexShrink: 0,
  },
  skeleton: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(90deg, #e8e5e0 25%, #f0ede8 50%, #e8e5e0 75%)',
    backgroundSize: '200% 100%',
    animation: 'skeletonShimmer 1.4s ease-in-out infinite',
  },
  img: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  fallbackEmoji: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%,-50%)',
    fontSize: '64px',
    lineHeight: 1,
    filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.15))',
  },
  /* Alttan üste şeffaf → %40 siyah gradient */
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0.10) 40%, transparent 70%)',
    pointerEvents: 'none',
  },
  badge: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    background: 'var(--gold)',
    color: '#fff',
    fontSize: '10px',
    fontWeight: 700,
    fontFamily: 'var(--font-sans)',
    padding: '3px 9px',
    borderRadius: '99px',
    letterSpacing: '0.02em',
    boxShadow: '0 1px 5px rgba(0,0,0,0.30)',
    whiteSpace: 'nowrap',
    zIndex: 1,
  },
  saveBtn: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    background: 'rgba(0,0,0,0.35)',
    border: 'none',
    borderRadius: '50%',
    width: '28px',
    height: '28px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(4px)',
    zIndex: 1,
  },
  body: {
    padding: '10px 12px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
  },
  name: {
    fontFamily: 'var(--font-serif)',
    fontWeight: 700,
    fontSize: '13px',
    color: 'var(--text1)',
    lineHeight: 1.3,
  },
  loc: {
    fontFamily: 'var(--font-sans)',
    fontSize: '11px',
    color: 'var(--text2)',
  },
  rating: {
    fontFamily: 'var(--font-sans)',
    fontSize: '11px',
    color: 'var(--text2)',
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
  },
  reviews: { color: 'var(--text3)' },
  foot: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: '8px',
    gap: '6px',
  },
  priceGroup: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '2px',
  },
  price: {
    fontFamily: 'var(--font-mono)',
    fontWeight: 600,
    fontSize: '14px',
    color: 'var(--text1)',
  },
  unit: {
    fontFamily: 'var(--font-sans)',
    fontSize: '10px',
    color: 'var(--text3)',
  },
  selBtn: {
    background: '#2A9D8F',
    color: '#fff',
    border: 'none',
    borderRadius: '7px',
    fontSize: '12px',
    fontWeight: 600,
    fontFamily: 'var(--font-sans)',
    padding: '5px 14px',
    cursor: 'pointer',
    transition: 'background 0.15s',
    flexShrink: 0,
  },
  selHov:    { background: '#21867A' },
  selLoading:{ opacity: 0.6, cursor: 'default' },
  selDone: {
    background: '#059669',
    cursor: 'default',
  },

  /* Seçildi overlay */
  selectedOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(5,150,105,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  selectedLabel: {
    background: '#059669',
    color: '#fff',
    fontFamily: 'var(--font-sans)',
    fontWeight: 700,
    fontSize: '13px',
    padding: '6px 18px',
    borderRadius: '99px',
    letterSpacing: '0.02em',
    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
  },
};

/* ── Compact card styles ── */
const sc = {
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '10px 12px',
    marginBottom: '8px',
  },
  emoji:  { fontSize: '24px', flexShrink: 0 },
  body:   { flex: 1, minWidth: 0 },
  name:   { fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: '13px', color: 'var(--text1)' },
  loc:    { fontSize: '11px', color: 'var(--text2)' },
  trust:  { fontSize: '11px', color: 'var(--success)' },
  right:  { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 },
  price:  { fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 600, color: 'var(--text1)' },
  unit:   { fontFamily: 'var(--font-sans)', fontSize: '10px', color: 'var(--text3)', marginLeft: '2px' },
  selBtn: {
    background: '#2A9D8F', color: '#fff', border: 'none', borderRadius: '7px',
    fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-sans)',
    padding: '4px 12px', cursor: 'pointer',
  },
  selHov: { background: '#21867A' },
};
