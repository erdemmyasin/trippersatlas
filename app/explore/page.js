'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Heart, Plus, MapPin, Search } from 'lucide-react';
import AppSidebar from '@/components/AppSidebar';
import {
  FEATURED_GUIDES,
  loadUserGuides,
  guideLikeKey,
} from '@/lib/exploreGuides';
import { tripCardImageSearchQuery } from '@/lib/taRegion';

const LIKES_LS = 'likes';

function loadLikedMap() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LIKES_LS);
    if (!raw) return {};
    const p = JSON.parse(raw);
    return p && typeof p === 'object' && !Array.isArray(p) ? p : {};
  } catch {
    return {};
  }
}

function persistLikedMap(map) {
  try {
    localStorage.setItem(LIKES_LS, JSON.stringify(map));
    window.dispatchEvent(new Event('likesStorageUpdated'));
  } catch {
    /* ignore */
  }
}

const COLLECTIONS = ['Mekanlarım', 'Favori rotalar', 'Tatil 2026'];

function GuideImage({ guide }) {
  const [url, setUrl] = useState(guide.coverUrl || null);
  const [loading, setLoading] = useState(!guide.coverUrl);

  useEffect(() => {
    if (guide.coverUrl) {
      setUrl(guide.coverUrl);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const q = encodeURIComponent(tripCardImageSearchQuery(guide.imageQuery || guide.title || ''));
    fetch(`/api/image?query=${q}&type=tour`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const u = data?.url;
        setUrl(typeof u === 'string' && u ? u : null);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [guide.coverUrl, guide.imageQuery, guide.title]);

  const fallback =
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop';
  const src = url || (!loading ? fallback : null);

  return (
    <div style={st.imgWrap}>
      {loading && <div style={st.skeleton} />}
      {src ? (
        <img
          src={src}
          alt=""
          style={st.img}
          onError={(e) => {
            e.target.src = fallback;
          }}
        />
      ) : null}
    </div>
  );
}

function GuideCard({
  guide,
  likedMap,
  onToggleLike,
  plusOpen,
  onPlusToggle,
  onPickCollection,
}) {
  const lk = guideLikeKey(guide.id);
  const userLiked = Boolean(likedMap[lk]);
  const displayLikes = guide.likes + (userLiked ? 1 : 0);

  return (
    <div className="explore-guide-card" style={st.card}>
      <div style={st.cardInner}>
        <GuideImage guide={guide} />
        <div style={st.badgeTL}>{guide.badge}</div>
        <div style={st.actionsTR}>
          <button
            type="button"
            style={{
              ...st.roundAct,
              ...(userLiked ? { color: '#e11d48' } : {}),
            }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleLike(guide.id);
            }}
            aria-label="Beğen"
          >
            <Heart
              size={16}
              strokeWidth={2}
              color={userLiked ? '#e11d48' : 'var(--ta-ink)'}
              fill={userLiked ? '#e11d48' : 'none'}
            />
          </button>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              style={st.roundAct}
              onClick={(e) => {
                e.stopPropagation();
                onPlusToggle(guide.id);
              }}
              aria-label="Koleksiyon"
            >
              <Plus size={16} strokeWidth={2} color="var(--ta-ink)" />
            </button>
            {plusOpen === guide.id && (
              <>
                <div
                  style={st.dropOverlay}
                  onClick={() => onPlusToggle(null)}
                />
                <div style={st.plusDrop}>
                  <div style={st.plusDropTitle}>Koleksiyona ekle</div>
                  {COLLECTIONS.map((name) => (
                    <button
                      key={name}
                      type="button"
                      style={st.plusDropItem}
                      onClick={() => onPickCollection(name, guide)}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div style={st.cardBody}>
        <h3 style={st.cardTitle}>{guide.title}</h3>
        <div style={st.locRow}>
          <MapPin size={14} strokeWidth={2} color="var(--ta-ink-muted)" />
          <span style={st.loc}>{guide.location}</span>
        </div>
        <div style={st.authorRow}>
          <span
            style={{
              ...st.avatar,
              ...(guide.isOfficial ? st.avatarOfficial : {}),
            }}
          >
            {guide.authorAvatar || '?'}
          </span>
          <span style={st.authorName}>{guide.author}</span>
          <span style={st.likeHint}>
            <Heart size={12} strokeWidth={2} aria-hidden />
            {displayLikes}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const [search, setSearch] = useState('');
  const [userGuides, setUserGuides] = useState([]);
  const [likedMap, setLikedMap] = useState({});
  const [plusOpen, setPlusOpen] = useState(null);

  useEffect(() => {
    setLikedMap(loadLikedMap());
    setUserGuides(loadUserGuides());
    function onLikes() {
      setLikedMap(loadLikedMap());
    }
    function onGuides() {
      setUserGuides(loadUserGuides());
    }
    window.addEventListener('likesStorageUpdated', onLikes);
    window.addEventListener('userGuidesUpdated', onGuides);
    return () => {
      window.removeEventListener('likesStorageUpdated', onLikes);
      window.removeEventListener('userGuidesUpdated', onGuides);
    };
  }, []);

  const filterStr = search.trim().toLowerCase();
  const match = useCallback(
    (g) => {
      if (!filterStr) return true;
      return (
        String(g.title || '')
          .toLowerCase()
          .includes(filterStr) ||
        String(g.location || '')
          .toLowerCase()
          .includes(filterStr) ||
        String(g.author || '')
          .toLowerCase()
          .includes(filterStr)
      );
    },
    [filterStr]
  );

  const featuredFiltered = useMemo(
    () => FEATURED_GUIDES.filter(match),
    [match]
  );
  const allGuides = useMemo(
    () => [...FEATURED_GUIDES, ...userGuides],
    [userGuides]
  );
  const allFiltered = useMemo(() => allGuides.filter(match), [allGuides, match]);

  function toggleLike(id) {
    const lk = guideLikeKey(id);
    setLikedMap((prev) => {
      const next = { ...prev, [lk]: !prev[lk] };
      persistLikedMap(next);
      return next;
    });
  }

  function pickCollection(name, guide) {
    setPlusOpen(null);
    try {
      const raw = localStorage.getItem('saved') || '[]';
      const arr = JSON.parse(raw);
      const list = Array.isArray(arr) ? arr : [];
      list.push({
        id: `col-${Date.now()}`,
        name: guide.title,
        location: guide.location,
        collection: name,
        from: 'explore-guide',
        guideId: guide.id,
        savedAt: new Date().toISOString(),
      });
      localStorage.setItem('saved', JSON.stringify(list));
    } catch {
      /* ignore */
    }
  }

  return (
    <div style={st.shell}>
      <style>{`
        @keyframes exploreSk {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .explore-guide-card { transition: transform 0.2s ease; }
        .explore-guide-card:hover { transform: scale(1.01); }
        @media (max-width: 1400px) {
          .explore-grid-5 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
        }
        @media (max-width: 1100px) {
          .explore-grid-5 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
        }
        @media (max-width: 800px) {
          .explore-grid-5 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        }
      `}</style>
      <AppSidebar activeId="explore" />

      <main style={st.main}>
        <h1 className="ta-h1" style={st.h1}>
          Keşfet
        </h1>

        <div style={st.searchBox}>
          <Search size={20} strokeWidth={2} color="var(--ta-ink-subtle)" />
          <input
            type="search"
            placeholder="Lokasyon veya kullanıcı ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={st.searchInput}
          />
        </div>

        <section style={st.section}>
          <h2 style={st.sectionTitle}>Popüler İçerikler</h2>
          <div style={st.rowScroll}>
            {featuredFiltered.map((g) => (
              <div key={g.id} style={st.scrollCard}>
                <GuideCard
                  guide={g}
                  likedMap={likedMap}
                  onToggleLike={toggleLike}
                  plusOpen={plusOpen}
                  onPlusToggle={setPlusOpen}
                  onPickCollection={pickCollection}
                />
              </div>
            ))}
          </div>
        </section>

        <section style={st.section}>
          <h2 style={st.sectionTitle}>Tüm İçerikler</h2>
          <div className="explore-grid-5" style={st.grid5}>
            {allFiltered.map((g) => (
              <GuideCard
                key={g.id}
                guide={g}
                likedMap={likedMap}
                onToggleLike={toggleLike}
                plusOpen={plusOpen}
                onPlusToggle={setPlusOpen}
                onPickCollection={pickCollection}
              />
            ))}
          </div>
          {allFiltered.length === 0 && (
            <p style={st.empty}>Sonuç bulunamadı.</p>
          )}
        </section>

        <div style={{ paddingBottom: 48 }} />
      </main>
    </div>
  );
}

const st = {
  shell: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
    background: '#FAFAF8',
  },
  main: {
    flex: 1,
    minWidth: 0,
    overflowY: 'auto',
    padding: '28px 32px',
    boxSizing: 'border-box',
  },
  h1: {
    margin: '0 0 20px',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    padding: '14px 18px',
    borderRadius: 14,
    background: 'var(--ta-muted-bg)',
    border: '1px solid rgba(0,0,0,.06)',
    boxSizing: 'border-box',
    marginBottom: 36,
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: 15,
    color: 'var(--ta-ink)',
    fontFamily: 'var(--font-sans)',
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    margin: '0 0 16px',
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--ta-ink)',
    fontFamily: 'var(--font-sans)',
  },
  rowScroll: {
    display: 'flex',
    gap: 16,
    overflowX: 'auto',
    paddingBottom: 8,
    scrollbarWidth: 'thin',
  },
  scrollCard: {
    flex: '0 0 220px',
    width: 220,
    minWidth: 220,
  },
  grid5: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
    gap: 16,
  },
  empty: {
    color: 'var(--ta-ink-muted)',
    fontSize: 14,
    fontFamily: 'var(--font-sans)',
    padding: '24px 0',
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    background: '#FFFFFF',
    border: '1px solid rgba(0,0,0,.06)',
    cursor: 'pointer',
    boxShadow: '0 2px 10px rgba(0,0,0,.04)',
  },
  cardInner: {
    position: 'relative',
  },
  imgWrap: {
    position: 'relative',
    height: 200,
    background: '#E4E2DC',
    overflow: 'hidden',
  },
  skeleton: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(90deg,#e4e2dc 25%,#f0ede8 50%,#e4e2dc 75%)',
    backgroundSize: '200% 100%',
    animation: 'exploreSk 1.2s ease-in-out infinite',
    zIndex: 1,
  },
  img: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  badgeTL: {
    position: 'absolute',
    top: 10,
    left: 10,
    padding: '5px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700,
    color: '#FFFFFF',
    background: 'rgba(0,0,0,.5)',
    fontFamily: 'var(--font-sans)',
    backdropFilter: 'blur(8px)',
  },
  actionsTR: {
    position: 'absolute',
    top: 10,
    right: 10,
    display: 'flex',
    gap: 8,
    zIndex: 2,
  },
  roundAct: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(255,255,255,.88)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 10px rgba(0,0,0,.1)',
  },
  dropOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 40,
  },
  plusDrop: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    zIndex: 50,
    minWidth: 200,
    background: '#FFFFFF',
    borderRadius: 12,
    border: '1px solid rgba(0,0,0,.08)',
    boxShadow: '0 8px 28px rgba(0,0,0,.12)',
    padding: '8px 0',
    overflow: 'hidden',
  },
  plusDropTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--ta-ink-subtle)',
    textTransform: 'uppercase',
    letterSpacing: '.06em',
    padding: '6px 14px 8px',
    fontFamily: 'var(--font-sans)',
  },
  plusDropItem: {
    width: '100%',
    textAlign: 'left',
    padding: '10px 14px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--ta-ink)',
    fontFamily: 'var(--font-sans)',
  },
  cardBody: {
    padding: '12px 14px 14px',
  },
  cardTitle: {
    margin: 0,
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--ta-ink)',
    lineHeight: 1.35,
    fontFamily: 'var(--font-sans)',
  },
  locRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  loc: {
    fontSize: 12,
    color: 'var(--ta-ink-muted)',
    fontFamily: 'var(--font-sans)',
  },
  authorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: 'rgba(0,0,0,.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 800,
    color: 'var(--ta-ink)',
    fontFamily: 'var(--font-sans)',
    flexShrink: 0,
  },
  avatarOfficial: {
    background: 'linear-gradient(135deg,#dce4ed,#4a6278)',
    color: '#fff',
    border: '1px solid rgba(74,98,120,.4)',
  },
  authorName: {
    flex: 1,
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--ta-ink)',
    fontFamily: 'var(--font-sans)',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  likeHint: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 12,
    color: 'var(--ta-ink-muted)',
    fontFamily: 'var(--font-sans)',
    flexShrink: 0,
  },
};
