'use client';

import { useState, useEffect } from 'react';
import { Check, MapPin, Star } from 'lucide-react';
import { ListingTypeGlyph } from '@/components/AtlasGlyph';
import { buildAffiliateUrl } from '@/services/affiliate';
import { trackEvent } from '@/lib/analytics';
import { listingImageKeywordSuffix } from '@/lib/taRegion';

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
  const { name = '', type, location = '' } = listing;
  const typeKw = TYPE_KEYWORDS[type] ?? 'hotel,travel,luxury';

  /* Lokasyon keyword */
  const locLower = location.toLowerCase();
  let locKw = listingImageKeywordSuffix();
  for (const [key, kw] of Object.entries(LOCATION_KEYWORDS)) {
    if (locLower.includes(key)) { locKw = kw; break; }
  }

  /* Otel adından anlamlı kelimeler (3+ harf, max 2) */
  const stopWords = new Set(['the','bir','ve','de','da','otel','hotel','inn','suite','suites']);
  const nameWords = name
    .toLowerCase()
    .replace(/[^a-zğüşıöç\s]/gi, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !stopWords.has(w))
    .slice(0, 2)
    .join(',');

  return nameWords
    ? `${typeKw},${locKw},${nameWords}`
    : `${typeKw},${locKw}`;
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
  onPlanRemove,   /* page-level handler: remove from plan */
  isSelected = false,
  /** encodeURIComponent(listingMapKey) — haritadan scroll */
  listingDataAttr,
  /** listingMapKey — hover ile harita pini */
  listingHoverKey,
  onMapHoverKey,
  /** Haritadan pin tıklanınca kart vurgusu */
  highlightFromMap = false,
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
    type,
    trustSignal,
    affiliatePlatform,
    bookingUrl,
    priceIsReal,
  } = listing;

  const fallback = FALLBACKS[type] ?? FALLBACKS.default;
  const gradient = GRADIENTS[index % GRADIENTS.length];

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    let cancelled = false;
    const query = buildQuery(listing);
    fetch(
      `/api/image?query=${encodeURIComponent(query)}&name=${encodeURIComponent(name || '')}&location=${encodeURIComponent(location || '')}&type=${encodeURIComponent(type || 'hotel')}&website=${encodeURIComponent(listing?.website || '')}`
    )
      .then(r => r.json())
      .then(data => { if (!cancelled) setImgSrc(data.url || fallback); })
      .catch(() => { if (!cancelled) setImgSrc(fallback); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, type, location]);

  function handleRemove(e) {
    e.stopPropagation();
    trackEvent('listing.remove_click', { name, type });
    onPlanRemove?.(listing);
  }

  async function handleSelect() {
    if (loading) return;

    /* 1 — Plan state'ini güncelle (senkron, hızlı) */
    onPlanSelect?.(listing);

    /* 2 — Affiliate kaydı + yeni sekme */
    const url = bookingUrl || buildAffiliateUrl(listing);
    setLoading(true);
    try {
      await fetch('/api/affiliate/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingName: name, platform: affiliatePlatform || 'booking', url }),
      });
      trackEvent('affiliate.click', { listingName: name, platform: affiliatePlatform || 'booking', url });
    } catch { /* devam et */ }
    finally {
      setLoading(false);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  /* Compact mod */
  if (compact) {
    return (
      <div
        style={sc.card}
        {...(listingDataAttr ? { 'data-ta-listing': listingDataAttr } : {})}
        onMouseEnter={() => listingHoverKey && onMapHoverKey?.(listingHoverKey)}
        onMouseLeave={() => listingHoverKey && onMapHoverKey?.(null)}
      >
        <span style={sc.emoji}>
          <ListingTypeGlyph type={type} size={22} />
        </span>
        <div style={sc.body}>
          <p style={sc.name}>{name}</p>
          {location && (
            <p style={sc.loc}>
              <MapPin size={12} strokeWidth={2} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} aria-hidden />
              {location}
            </p>
          )}
          {trustSignal && (
            <p style={sc.trust}>
              <Star size={12} fill="#F59E0B" stroke="#F59E0B" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} aria-hidden />
              {trustSignal}
            </p>
          )}
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

  const mapRing = highlightFromMap && !isSelected;

  return (
    <div
      {...(listingDataAttr ? { 'data-ta-listing': listingDataAttr } : {})}
      onMouseEnter={() => listingHoverKey && onMapHoverKey?.(listingHoverKey)}
      onMouseLeave={() => listingHoverKey && onMapHoverKey?.(null)}
      style={{
        ...sg.card,
        borderWidth: isSelected ? 2 : mapRing ? 2 : 'var(--border-thin)',
        borderStyle: 'solid',
        borderColor: isSelected ? '#059669' : mapRing ? 'rgba(192,141,54,0.85)' : 'rgba(0,0,0,.06)',
        boxShadow: isSelected
          ? '0 0 0 3px rgba(47,143,107,0.18), 0 14px 28px rgba(0,0,0,.05)'
          : mapRing
            ? '0 0 0 3px rgba(192,141,54,0.22), 0 14px 28px rgba(0,0,0,.06)'
            : '0 14px 28px rgba(0,0,0,.05)',
      }}
    >
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
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- harici Unsplash/otel URL */}
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
          </>
        )}

        {/* Hata fallback: büyük emoji */}
        {imgState === 'error' && (
          <span style={sg.fallbackEmoji}>
            <ListingTypeGlyph type={type} size={40} color="rgba(255,255,255,.9)" />
          </span>
        )}

        {/* Alt-üst gradient overlay */}
        <div style={sg.overlay} />

        {/* Seçildi overlay */}
        {isSelected && (
          <div style={sg.selectedOverlay}>
            <span style={sg.selectedLabel}>
              <Check size={13} strokeWidth={2.5} aria-hidden />
              Seçildi
            </span>
          </div>
        )}

        {/* Badge */}
        {badge && <span style={sg.badge}>{badge}</span>}

        {/* Kaydet butonu */}
        <button
          style={sg.saveBtn}
          onClick={() => {
            const next = !saved;
            setSaved(next);
            trackEvent(next ? 'listing.save' : 'listing.unsave', { name, type });
          }}
          title={saved ? 'Kaydedildi' : 'Kaydet'}
        >
          <BookmarkIcon filled={saved} />
        </button>
      </div>

      {/* ── İçerik ── */}
      <div style={sg.body}>
        <p style={sg.name}>{name}</p>
        {location && (
          <p style={sg.loc}>
            <MapPin size={13} strokeWidth={2} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} aria-hidden />
            {location}
          </p>
        )}

        {ratingMatch ? (
          <p style={sg.rating}>
            <StarIcon />{' '}{ratingMatch[1]}
            <span style={sg.reviews}> · {Number(ratingMatch[2]).toLocaleString('tr-TR')} yorum</span>
          </p>
        ) : trustSignal ? (
          <p style={sg.rating}><StarIcon />{' '}{trustSignal}</p>
        ) : null}

        {/* Fiyat + Seç / Kaldır+Seçildi */}
        <div style={sg.foot}>
          {price != null && (
            <div style={sg.priceGroup}>
              <span style={sg.price}>₺{Number(price).toLocaleString('tr-TR')}</span>
              <span style={sg.unit}>/{priceUnit}</span>
              {priceIsReal && <span style={sg.realPriceTag}>Gerçek fiyat</span>}
            </div>
          )}

          {isSelected ? (
            /* Seçildi durumu: Kaldır + Seçildi */
            <div style={sg.selectedBtnGroup}>
              <button style={sg.removeBtn} onClick={handleRemove} title="Plandan kaldır">
                Kaldır
              </button>
              <button style={sg.selDoneBtn} disabled>
                <Check size={14} strokeWidth={2.5} aria-hidden />
                Seçildi
              </button>
            </div>
          ) : (
            <button
              style={{
                ...sg.selBtn,
                ...(selHov && !loading ? sg.selHov : {}),
                ...(loading ? sg.selLoading : {}),
              }}
              onMouseEnter={() => setSelHov(true)}
              onMouseLeave={() => setSelHov(false)}
              onClick={handleSelect}
              disabled={loading}
            >
              {loading ? '…' : 'Seç'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StarIcon() {
  return <Star size={14} fill="#F59E0B" stroke="#F59E0B" aria-hidden />;
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
    background: 'rgba(255,255,255,.85)',
    borderRadius: 'var(--radius-xl)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(0,0,0,.06)',
    boxShadow: '0 14px 28px rgba(0,0,0,.05)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    /* genişlik cards-row grid tarafından sabitlenir (248px) */
    flexShrink: 0,
  },
  imgWrap: {
    position: 'relative',
    height: '146px',
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
    fontSize: 'var(--space-10)',
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
    top: 'var(--space-3)',
    left: 'var(--space-3)',
    padding: 'var(--space-1) var(--space-3)',
    borderRadius: 'var(--radius-pill)',
    fontSize: 'var(--text-xs)',
    lineHeight: 'var(--text-xs-lh)',
    fontWeight: 'var(--fw-extrabold)',
    color: 'white',
    background: 'rgba(31,27,22,.72)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    whiteSpace: 'nowrap',
    zIndex: 'var(--z-raised)',
    fontFamily: 'var(--font-sans)',
  },
  saveBtn: {
    position: 'absolute',
    top: 'var(--space-3)',
    right: 'var(--space-3)',
    background: 'rgba(0,0,0,0.35)',
    border: 'none',
    borderRadius: '50%',
    width: 'var(--space-7)',
    height: 'var(--space-7)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(4px)',
    zIndex: 'var(--z-raised)',
  },
  body: {
    padding: 'var(--space-4)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
    flex: 1,
  },
  name: {
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--fw-extrabold)',
    fontSize: 'var(--text-lg)',
    color: 'var(--text1)',
    lineHeight: 1.3,
    marginBottom: 'var(--space-px)',
  },
  loc: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    lineHeight: 'var(--text-sm-lh)',
    color: 'var(--muted)',
    display: 'flex',
    gap: 'var(--space-2)',
    flexWrap: 'wrap',
  },
  rating: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    lineHeight: 'var(--text-sm-lh)',
    color: 'var(--muted)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    flexWrap: 'wrap',
  },
  reviews: { color: 'var(--text3)' },
  foot: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: 'var(--space-3)',
    gap: 'var(--space-3)',
  },
  priceGroup: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '2px',
  },
  price: {
    fontFamily: 'var(--font-sans)',
    fontWeight: 900,
    fontSize: 'var(--text-xl)',
    lineHeight: 'var(--text-xl-lh)',
    color: 'var(--ta-accent-deep)',
    letterSpacing: '-0.03em',
  },
  unit: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-xs)',
    color: 'var(--muted)',
    marginLeft: 'var(--space-px)',
  },
  realPriceTag: {
    marginLeft: 'var(--space-2)',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--fw-bold)',
    color: 'var(--green)',
    background: 'rgba(47,143,107,.10)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(47,143,107,.22)',
    borderRadius: 'var(--radius-pill)',
    padding: 'var(--space-px) var(--space-2)',
    whiteSpace: 'nowrap',
    alignSelf: 'center',
  },
  selBtn: {
    border: 0,
    background: 'linear-gradient(180deg,#5f7a94,#3d5266)',
    color: 'white',
    fontWeight: 'var(--fw-extrabold)',
    padding: 'var(--space-3) var(--space-4)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-base)',
    flexShrink: 0,
    transition: 'opacity var(--duration-fast) var(--ease-out)',
  },
  selHov:    { opacity: 0.88 },
  selLoading:{ opacity: 0.5, cursor: 'default' },

  /* Seçildi durumu butonları */
  selectedBtnGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-1)',
    flexShrink: 0,
  },
  removeBtn: {
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(0,0,0,.14)',
    background: 'white',
    color: 'var(--muted)',
    fontWeight: 'var(--fw-semibold)',
    padding: 'var(--space-2) var(--space-3)',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-xs)',
    transition: 'background var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out)',
    whiteSpace: 'nowrap',
  },
  selDoneBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    border: 0,
    background: 'linear-gradient(180deg,#3ea87a,#2f8f6b)',
    color: 'white',
    fontWeight: 'var(--fw-extrabold)',
    padding: 'var(--space-2) var(--space-3)',
    borderRadius: 'var(--radius-sm)',
    cursor: 'default',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    whiteSpace: 'nowrap',
  },

  /* Seçildi overlay */
  selectedOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(5,150,105,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 'calc(var(--z-raised) + 2)',
  },
  selectedLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    background: '#059669',
    color: '#fff',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--fw-bold)',
    fontSize: 'var(--text-base)',
    padding: 'var(--space-1) var(--space-5)',
    borderRadius: 'var(--radius-pill)',
    letterSpacing: '0.02em',
    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
  },
};

/* ── Compact card styles ── */
const sc = {
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    background: 'var(--surface)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: 'var(--space-3) var(--space-3)',
    marginBottom: 'var(--space-2)',
  },
  emoji:  { fontSize: 'var(--space-6)', flexShrink: 0 },
  body:   { flex: 1, minWidth: 0 },
  name:   { fontFamily: 'var(--font-serif)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--text-base)', color: 'var(--text1)' },
  loc:    { fontSize: 'var(--text-xs)', color: 'var(--text2)' },
  trust:  { fontSize: 'var(--text-xs)', color: 'var(--success)' },
  right:  { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--space-2)', flexShrink: 0 },
  price:  { fontFamily: 'var(--font-mono)', fontSize: 'var(--text-md)', fontWeight: 'var(--fw-semibold)', color: 'var(--text1)' },
  unit:   { fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', color: 'var(--text3)', marginLeft: 'var(--space-px)' },
  selBtn: {
    background: '#2A9D8F', color: '#fff', border: 'none', borderRadius: 'var(--radius-xs)',
    fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)', fontFamily: 'var(--font-sans)',
    padding: 'var(--space-1) var(--space-3)', cursor: 'pointer',
    transition: 'background var(--duration-fast) var(--ease-out)',
  },
  selHov: { background: '#21867A' },
};
