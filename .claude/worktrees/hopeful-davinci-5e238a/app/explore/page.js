'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import AppSidebar from '@/components/AppSidebar';

const DESTINATIONS = [
  { id: 'antalya',    name: 'Antalya',    lat: 36.8969, lng: 30.7133 },
  { id: 'istanbul',   name: 'İstanbul',   lat: 41.0082, lng: 28.9784 },
  { id: 'bodrum',     name: 'Bodrum',     lat: 37.0344, lng: 27.4305 },
  { id: 'cappadocia', name: 'Kapadokya',  lat: 38.6431, lng: 34.8289 },
  { id: 'izmir',      name: 'İzmir',      lat: 38.4192, lng: 27.1287 },
  { id: 'trabzon',    name: 'Trabzon',    lat: 41.0027, lng: 39.7168 },
  { id: 'ankara',     name: 'Ankara',     lat: 39.9334, lng: 32.8597 },
  { id: 'bursa',      name: 'Bursa',      lat: 40.1885, lng: 29.0610 },
  { id: 'mardin',     name: 'Mardin',     lat: 37.3212, lng: 40.7245 },
  { id: 'fethiye',    name: 'Fethiye',    lat: 36.6220, lng: 29.1142 },
];

const TABS = [
  { id: 'foryou',      label: 'Senin İçin' },
  { id: 'todo',        label: 'Yapılacaklar' },
  { id: 'restaurants', label: 'Restoranlar' },
  { id: 'stays',       label: 'Konaklama' },
  { id: 'locations',   label: 'Mekanlar' },
  { id: 'guides',      label: 'Rehberler' },
];

export default function ExplorePage() {
  const [dest, setDest]           = useState('antalya');
  const [destOpen, setDestOpen]   = useState(false);
  const [activeTab, setActiveTab] = useState('foryou');
  const [query, setQuery]         = useState('');
  const [places, setPlaces]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [savedIds, setSavedIds]   = useState(new Set());
  const [hovId, setHovId]         = useState(null);
  const [selId, setSelId]         = useState(null);

  const destObj = DESTINATIONS.find(d => d.id === dest) || DESTINATIONS[0];

  const fetchPlaces = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ destination: dest, tab: activeTab });
      if (query.trim()) p.set('query', query.trim());
      const res = await fetch(`/api/places?${p}`);
      const data = await res.json();
      setPlaces(data.places || []);
    } catch { setPlaces([]); }
    finally { setLoading(false); }
  }, [dest, activeTab, query]);

  useEffect(() => { fetchPlaces(); }, [fetchPlaces]);

  function toggleSave(id) {
    setSavedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  return (
    <div style={lay.shell}>
      <AppSidebar activeId="explore" />

      {/* ═══ CONTENT ═══ */}
      <main style={lay.content}>
        {/* Dest header */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <button style={lay.destBtn} onClick={() => setDestOpen(o => !o)}>
            {destObj.name}
            <span style={{ ...lay.chevron, transform: destOpen ? 'rotate(180deg)' : '' }}>⌄</span>
          </button>
          {destOpen && (
            <>
              <div style={lay.overlay} onClick={() => setDestOpen(false)} />
              <div style={lay.dropdown}>
                {DESTINATIONS.map(d => (
                  <button key={d.id} style={{ ...lay.dropItem, ...(d.id === dest ? lay.dropItemActive : {}) }}
                    onClick={() => { setDest(d.id); setDestOpen(false); }}>
                    {d.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Search */}
        <div style={lay.searchRow}>
          <div style={lay.searchBox}>
            <span style={{ fontSize: 16, opacity: .45 }}>🔍</span>
            <input style={lay.searchInput} placeholder="Ara..." value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchPlaces()} />
          </div>
          <button style={lay.filterBtn}>
            <FilterIcon /> Filtreler
          </button>
        </div>

        {/* Tabs */}
        <div style={lay.tabs}>
          {TABS.map(t => (
            <button key={t.id}
              style={{ ...lay.tab, ...(activeTab === t.id ? lay.tabActive : {}) }}
              onClick={() => setActiveTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Section title */}
        <h2 style={lay.sectionTitle}>
          {TABS.find(t => t.id === activeTab)?.label || 'Senin İçin'}
        </h2>

        {/* Grid */}
        <div style={lay.grid}>
          {loading ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />) :
           places.length === 0 ? (
             <div style={lay.empty}>
               <span style={{ fontSize: 40, opacity: .5 }}>🔍</span>
               <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--muted)' }}>
                 Bu kategoride sonuç bulunamadı.
               </p>
             </div>
           ) : places.map((p, i) => (
             <PlaceCard key={p.id} place={p} index={i}
               saved={savedIds.has(p.id)}
               hovered={hovId === p.id}
               selected={selId === p.id}
               onSave={() => toggleSave(p.id)}
               onHover={() => setHovId(p.id)}
               onLeave={() => setHovId(null)}
               onClick={() => setSelId(p.id)} />
           ))}
        </div>
      </main>

      {/* ═══ MAP ═══ */}
      <div style={lay.mapPanel}>
        <div style={lay.mapBg}>
          <div className="ta-map-grid" />

          {/* Pins */}
          {places.slice(0, 8).map((p, i) => (
            <div key={p.id}
              style={{
                ...lay.pin,
                top: `${18 + (i % 3) * 22}%`,
                left: `${12 + ((i * 31) % 70)}%`,
                ...(hovId === p.id || selId === p.id ? lay.pinActive : {}),
              }}
              onClick={() => setSelId(p.id)}>
              <div style={{
                ...lay.pinDot,
                ...(hovId === p.id || selId === p.id ? lay.pinDotActive : {}),
              }} />
              <span style={lay.pinLabel}>{p.name.split(' ').slice(0, 2).join(' ')}</span>
            </div>
          ))}

          {/* Header pills */}
          <div style={lay.mapHeader}>
            <span style={lay.mapPill}>{destObj.name}</span>
            <span style={lay.mapPill}>{places.length} mekan</span>
          </div>

          {/* Explore btn */}
          <button style={lay.exploreBtn} onClick={fetchPlaces}>
            Bu alanı keşfet
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Place Card ── */
const GRADS = [
  'linear-gradient(135deg,#667eea,#764ba2)',
  'linear-gradient(135deg,#f093fb,#f5576c)',
  'linear-gradient(135deg,#4facfe,#00f2fe)',
  'linear-gradient(135deg,#43e97b,#38f9d7)',
  'linear-gradient(135deg,#fa709a,#fee140)',
  'linear-gradient(135deg,#a18cd1,#fbc2eb)',
];

function PlaceCard({ place, index, saved, hovered, selected, onSave, onHover, onLeave, onClick }) {
  const [imgOk, setImgOk] = useState(false);
  const grad = GRADS[index % GRADS.length];

  return (
    <div id={`place-${place.id}`}
      style={{
        ...c.card,
        ...(selected ? c.cardSelected : {}),
        ...(hovered ? { transform: 'translateY(-3px)', boxShadow: '0 10px 28px rgba(0,0,0,.10)' } : {}),
      }}
      onMouseEnter={onHover} onMouseLeave={onLeave} onClick={onClick}>

      {/* Image */}
      <div style={c.imgWrap}>
        {place.photoUrl ? (
          <img src={place.photoUrl} alt={place.name} loading="lazy"
            style={{ ...c.img, opacity: imgOk ? 1 : 0 }}
            onLoad={() => setImgOk(true)}
            onError={e => { e.target.style.display = 'none'; }} />
        ) : null}
        {!imgOk && (
          <div style={{ ...c.placeholder, background: grad }}>
            <span style={{ fontSize: 32 }}>{place.categoryIcon || '📍'}</span>
          </div>
        )}

        {/* Photo dots */}
        <div style={c.dots}>
          {[0,1,2,3,4].map(d => (
            <div key={d} style={{ ...c.dot, opacity: d === 0 ? 1 : .4 }} />
          ))}
        </div>

        {/* Actions */}
        <div style={c.actions}>
          <button style={{ ...c.actBtn, ...(saved ? { background: 'rgba(255,255,255,.95)' } : {}) }}
            onClick={e => { e.stopPropagation(); onSave(); }}>
            {saved ? '❤️' : '🤍'}
          </button>
          <button style={c.actBtn} onClick={e => e.stopPropagation()}>➕</button>
        </div>

        {/* Info */}
        <button style={c.infoBtn} onClick={e => e.stopPropagation()}>ⓘ</button>
      </div>

      {/* Body */}
      <div style={c.body}>
        <div style={c.titleRow}>
          <h3 style={c.name}>{place.name}</h3>
          {place.rating > 0 && (
            <span style={c.rating}>
              <span style={{ color: '#F59E0B' }}>★</span> {place.rating.toFixed(1)}
            </span>
          )}
        </div>
        <div style={c.cat}>
          <span>{place.categoryIcon}</span>
          <span>{place.category}</span>
        </div>
        <p style={c.addr}>{place.address}</p>
        {place.userRatingsTotal > 0 && (
          <p style={c.mentions}>
            👥 {place.userRatingsTotal.toLocaleString('tr-TR')} değerlendirme
          </p>
        )}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={c.card}>
      <div style={{ ...c.imgWrap, background: '#e8e5e0' }}>
        <div style={c.shimmer} />
      </div>
      <div style={{ ...c.body, gap: 10 }}>
        <div style={{ ...c.skelLine, width: '75%' }} />
        <div style={{ ...c.skelLine, width: '50%' }} />
        <div style={{ ...c.skelLine, width: '60%' }} />
      </div>
    </div>
  );
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/>
      <line x1="12" y1="18" x2="20" y2="18"/>
      <circle cx="6" cy="12" r="2" fill="currentColor"/><circle cx="14" cy="18" r="2" fill="currentColor"/>
    </svg>
  );
}

/* ═══ Layout styles ═══ */
const lay = {
  shell: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
    background: 'var(--bg)',
  },

  /* Content */
  content: {
    flex: 1, minWidth: 0,
    overflowY: 'auto', padding: '24px 28px',
    display: 'flex', flexDirection: 'column',
  },
  destBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    background: 'none', border: 'none', cursor: 'pointer',
    fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 28,
    color: 'var(--text1)', letterSpacing: '-0.02em',
  },
  chevron: { fontSize: 18, color: 'var(--muted)', transition: 'transform .2s' },
  overlay: { position: 'fixed', inset: 0, zIndex: 40 },
  dropdown: {
    position: 'absolute', top: 'calc(100% + 8px)', left: 0,
    minWidth: 200, maxHeight: 320, overflowY: 'auto',
    background: 'rgba(253,252,249,.98)', backdropFilter: 'blur(16px)',
    border: '1px solid rgba(0,0,0,.08)', borderRadius: 16,
    boxShadow: '0 16px 36px rgba(0,0,0,.14)', padding: 6, zIndex: 50,
  },
  dropItem: {
    width: '100%', textAlign: 'left', padding: '10px 14px', borderRadius: 10,
    border: 'none', background: 'transparent', cursor: 'pointer',
    fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: 'var(--text1)',
  },
  dropItemActive: {
    background: 'rgba(199,154,70,.10)', color: 'var(--gold-deep)', fontWeight: 700,
  },

  /* Search */
  searchRow: { display: 'flex', gap: 10, marginBottom: 16 },
  searchBox: {
    flex: 1, display: 'flex', alignItems: 'center', gap: 10,
    height: 44, padding: '0 14px',
    border: '1px solid rgba(0,0,0,.10)', borderRadius: 12, background: 'white',
  },
  searchInput: {
    flex: 1, border: 'none', outline: 'none', background: 'transparent',
    fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text1)',
  },
  filterBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    height: 44, padding: '0 16px',
    border: '1px solid rgba(0,0,0,.10)', borderRadius: 12, background: 'white',
    cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13,
    fontWeight: 600, color: 'var(--text1)', whiteSpace: 'nowrap',
  },

  /* Tabs */
  tabs: {
    display: 'flex', gap: 6, marginBottom: 20,
    overflowX: 'auto', scrollbarWidth: 'none',
  },
  tab: {
    padding: '8px 18px', borderRadius: 999,
    border: '1px solid rgba(0,0,0,.10)', background: 'white',
    fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
    color: 'var(--text2)', cursor: 'pointer', whiteSpace: 'nowrap',
  },
  tabActive: {
    background: 'var(--text1)', color: 'white', borderColor: 'var(--text1)',
  },

  sectionTitle: {
    fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 18,
    color: 'var(--text1)', marginBottom: 16,
  },

  /* Grid */
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0,1fr))',
    gap: 18, paddingBottom: 40,
  },

  empty: {
    gridColumn: '1 / -1', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 12, padding: '60px 20px', textAlign: 'center',
  },

  /* Map panel */
  mapPanel: {
    borderLeft: '1px solid rgba(0,0,0,.06)', overflow: 'hidden',
  },
  mapBg: {
    position: 'relative', width: '100%', height: '100%',
    background: `
      radial-gradient(circle at 25% 30%, rgba(122,175,132,.9), rgba(122,175,132,.16) 24%, transparent 26%),
      radial-gradient(circle at 74% 46%, rgba(122,175,132,.8), rgba(122,175,132,.12) 23%, transparent 24%),
      linear-gradient(135deg,#e2ebdf 0%,#d7e3d2 38%,#d5dfd1 39%,#d8d9e6 39.5%,#d2d6ec 100%)`,
  },
  pin: {
    position: 'absolute', zIndex: 2, display: 'flex', alignItems: 'center',
    cursor: 'pointer', transition: 'transform .15s',
  },
  pinActive: { transform: 'scale(1.15)', zIndex: 3 },
  pinDot: {
    width: 16, height: 16, borderRadius: 999,
    background: '#1d1a16', border: '2.5px solid rgba(255,255,255,.8)',
    boxShadow: '0 4px 10px rgba(0,0,0,.18)', flexShrink: 0,
  },
  pinDotActive: {
    background: 'linear-gradient(180deg,#d3ab5f,#c08d36)',
    width: 20, height: 20,
  },
  pinLabel: {
    marginLeft: 5, background: 'rgba(29,26,22,.88)', color: 'white',
    fontSize: 10, fontWeight: 700, padding: '4px 7px', borderRadius: 999,
    whiteSpace: 'nowrap', boxShadow: '0 4px 10px rgba(0,0,0,.12)',
    fontFamily: 'var(--font-sans)',
  },
  mapHeader: {
    position: 'absolute', top: 12, left: 12, right: 12,
    display: 'flex', justifyContent: 'space-between', zIndex: 4,
  },
  mapPill: {
    background: 'rgba(20,20,20,.72)', color: 'white',
    padding: '8px 12px', borderRadius: 999, fontSize: 11, fontWeight: 600,
    backdropFilter: 'blur(10px)', boxShadow: '0 6px 16px rgba(0,0,0,.12)',
    fontFamily: 'var(--font-sans)',
  },
  exploreBtn: {
    position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
    padding: '12px 24px', borderRadius: 999,
    background: 'rgba(29,26,22,.92)', color: 'white', border: 'none',
    cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 700,
    fontSize: 13, boxShadow: '0 8px 24px rgba(0,0,0,.2)', zIndex: 4,
  },
};

/* ═══ Card styles ═══ */
const c = {
  card: {
    borderRadius: 16, overflow: 'hidden', background: 'white',
    border: '1px solid rgba(0,0,0,.06)', boxShadow: '0 2px 8px rgba(0,0,0,.04)',
    cursor: 'pointer', transition: 'transform .2s, box-shadow .2s, border-color .2s',
  },
  cardSelected: {
    borderColor: 'var(--gold)',
    boxShadow: '0 0 0 2px rgba(199,154,70,.2), 0 10px 28px rgba(0,0,0,.08)',
  },
  imgWrap: {
    position: 'relative', height: 170, overflow: 'hidden', background: '#e8e5e0',
  },
  img: {
    width: '100%', height: '100%', objectFit: 'cover',
    transition: 'opacity .4s',
  },
  placeholder: {
    position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
  },
  dots: {
    position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
    display: 'flex', gap: 4, zIndex: 2,
  },
  dot: {
    width: 6, height: 6, borderRadius: 99, background: 'white',
    boxShadow: '0 1px 3px rgba(0,0,0,.2)',
  },
  actions: {
    position: 'absolute', top: 10, right: 10,
    display: 'flex', gap: 6, zIndex: 2,
  },
  actBtn: {
    width: 32, height: 32, borderRadius: '50%',
    background: 'rgba(255,255,255,.88)', border: 'none', cursor: 'pointer',
    display: 'grid', placeItems: 'center', fontSize: 14,
    boxShadow: '0 2px 8px rgba(0,0,0,.12)',
  },
  infoBtn: {
    position: 'absolute', bottom: 10, right: 10,
    width: 26, height: 26, borderRadius: '50%',
    background: 'rgba(0,0,0,.45)', border: 'none', cursor: 'pointer',
    display: 'grid', placeItems: 'center', fontSize: 12, color: 'white',
    zIndex: 2, backdropFilter: 'blur(4px)',
  },
  body: { padding: 14, display: 'flex', flexDirection: 'column', gap: 4 },
  titleRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8,
  },
  name: {
    fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14,
    color: 'var(--text1)', lineHeight: 1.35, margin: 0,
  },
  rating: {
    display: 'inline-flex', alignItems: 'center', gap: 3,
    fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700,
    color: 'var(--text1)', whiteSpace: 'nowrap', flexShrink: 0,
  },
  cat: {
    display: 'flex', alignItems: 'center', gap: 5,
    fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text2)',
  },
  addr: {
    fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text3)',
    lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden',
    textOverflow: 'ellipsis', margin: 0,
  },
  mentions: {
    fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text3)',
    marginTop: 2,
  },
  shimmer: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(90deg, #e8e5e0 25%, #f0ede8 50%, #e8e5e0 75%)',
    backgroundSize: '200% 100%',
    animation: 'skeletonShimmer 1.4s ease-in-out infinite',
  },
  skelLine: {
    height: 12, borderRadius: 6,
    background: 'linear-gradient(90deg, #e8e5e0 25%, #f0ede8 50%, #e8e5e0 75%)',
    backgroundSize: '200% 100%',
    animation: 'skeletonShimmer 1.4s ease-in-out infinite',
  },
};
