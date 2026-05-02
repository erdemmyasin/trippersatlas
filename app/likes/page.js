'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Heart,
  Bookmark,
  Eye,
  MapPin,
  TrendingUp,
  Compass,
  Flame,
  Sparkles,
  Check,
} from 'lucide-react';
import AppSidebar from '@/components/AppSidebar';
import {
  FEATURED_GUIDES,
  loadUserGuides,
  guideLikeKey,
} from '@/lib/exploreGuides';

const LIKES_LS = 'likes';
const SAVED_LS = 'saved';

const FALLBACK_BY_TYPE = {
  destinasyon: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&h=400&fit=crop',
  aktivite: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&h=400&fit=crop',
  deneyim: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=600&h=400&fit=crop',
  restoran: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop',
  default: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&h=400&fit=crop',
};

const FILTER_CHIPS = [
  { id: 'all', label: 'Tümü' },
  { id: 'destinasyon', label: 'Destinasyonlar' },
  { id: 'aktivite', label: 'Aktiviteler' },
  { id: 'restoran', label: 'Restoranlar' },
  { id: 'deneyim', label: 'Deneyimler' },
];

const MOCK_LIKES_ITEMS = [
  {
    id: 1,
    name: 'Pamukkale Travertenleri',
    location: 'Denizli, Türkiye',
    type: 'destinasyon',
    quote: 'Beyaz teraslar ve turkuaz havuzlar — dünyada başka yok',
    likes: 2400,
    views: 12000,
    badge: 'trend',
    imageQuery: 'pamukkale travertine turkey',
    tall: true,
  },
  {
    id: 2,
    name: 'Kapadokya Balon Turu',
    location: 'Nevşehir, Türkiye',
    type: 'aktivite',
    quote: 'Gün doğumunda balonla süzmek — bir kere yaşanır',
    likes: 5600,
    views: 28000,
    badge: 'featured',
    imageQuery: 'cappadocia hot air balloon',
    tall: false,
  },
  {
    id: 3,
    name: 'Safranbolu Evleri',
    location: 'Karabük, Türkiye',
    type: 'destinasyon',
    quote: "Osmanlı'dan kalma taş sokaklar, zaman durmuş gibi",
    likes: 890,
    views: 4500,
    badge: null,
    imageQuery: 'safranbolu historic houses',
    tall: true,
  },
  {
    id: 4,
    name: 'Mavi Yolculuk',
    location: 'Ege Kıyıları, Türkiye',
    type: 'deneyim',
    quote: 'Tekneyle koy koy gezmek — yaz tatilinin zirvesi',
    likes: 3200,
    views: 15000,
    badge: 'trend',
    imageQuery: 'blue voyage turkey aegean boat',
    tall: false,
  },
  {
    id: 5,
    name: 'Ayasofya',
    location: 'İstanbul, Türkiye',
    type: 'destinasyon',
    quote: '1500 yıllık tarihin içinde durmanın hissi tarif edilemez',
    likes: 8900,
    views: 45000,
    badge: 'featured',
    imageQuery: 'hagia sophia istanbul',
    tall: false,
  },
  {
    id: 6,
    name: 'Kaş Dalış Deneyimi',
    location: 'Antalya, Türkiye',
    type: 'aktivite',
    quote: "Akdeniz'in dibindeki antik kalıntılar",
    likes: 1200,
    views: 6000,
    badge: null,
    imageQuery: 'kas diving turkey mediterranean',
    tall: true,
  },
  {
    id: 7,
    name: 'Mardin Sokaklarında Kaybolmak',
    location: 'Mardin, Türkiye',
    type: 'destinasyon',
    quote: 'Taş evler, baharatlı mutfak, sonsuz manzara',
    likes: 2100,
    views: 9800,
    badge: 'featured',
    imageQuery: 'mardin old city turkey',
    tall: false,
  },
  {
    id: 8,
    name: 'Trabzon Sümela Manastırı',
    location: 'Trabzon, Türkiye',
    type: 'destinasyon',
    quote: 'Kayaya oyulmuş manastır — yeşilin içinde gizli bir sır',
    likes: 1800,
    views: 8200,
    badge: null,
    imageQuery: 'sumela monastery trabzon',
    tall: true,
  },
  {
    id: 9,
    name: 'Nemrut Dağı Gün Doğumu',
    location: 'Adıyaman, Türkiye',
    type: 'aktivite',
    quote: 'Dev heykeller ve bulut denizi — unutulmaz bir sabah',
    likes: 3400,
    views: 16000,
    badge: 'trend',
    imageQuery: 'nemrut mountain statues sunrise',
    tall: false,
  },
  {
    id: 10,
    name: 'Asmalı Cavit Meyhanesi',
    location: 'İstanbul, Türkiye',
    type: 'restoran',
    quote: 'Meyhane kültürü, meze ve rakı — şehrin ruhu',
    likes: 4200,
    views: 19000,
    badge: null,
    imageQuery: 'istanbul meyhane turkish food',
    tall: true,
  },
  {
    id: 11,
    name: 'Ölüdeniz Yamaç Paraşütü',
    location: 'Fethiye, Türkiye',
    type: 'deneyim',
    quote: 'Turkuaz koy üzerinde süzülmek — özgürlük hissi',
    likes: 5100,
    views: 24000,
    badge: 'featured',
    imageQuery: 'oludeniz paragliding turkey',
    tall: false,
  },
  {
    id: 12,
    name: 'Efes Antik Kenti',
    location: 'İzmir, Türkiye',
    type: 'destinasyon',
    quote: 'Roma caddelerinde yürümek — tarih canlanıyor',
    likes: 6700,
    views: 31000,
    badge: null,
    imageQuery: 'ephesus ancient city turkey',
    tall: true,
  },
  {
    id: 13,
    name: 'Bodrum Yelken Okulu',
    location: 'Bodrum, Türkiye',
    type: 'aktivite',
    quote: 'Ege rüzgârında yelken açmak',
    likes: 980,
    views: 5200,
    badge: null,
    imageQuery: 'bodrum sailing turkey',
    tall: false,
  },
  {
    id: 14,
    name: 'Gaziantep Baklava Atölyesi',
    location: 'Gaziantep, Türkiye',
    type: 'restoran',
    quote: 'İnce katmanlar ve fıstık — tatlı bir seremoni',
    likes: 2800,
    views: 11000,
    badge: 'trend',
    imageQuery: 'gaziantep baklava turkey',
    tall: false,
  },
  {
    id: 15,
    name: 'Likya Yolu Trekking',
    location: 'Antalya–Muğla, Türkiye',
    type: 'deneyim',
    quote: 'Deniz manzaralı patikalar — haftalar sürebilir',
    likes: 1500,
    views: 7800,
    badge: null,
    imageQuery: 'lycian way hiking turkey coast',
    tall: true,
  },
  {
    id: 16,
    name: 'Aya İrini Müzesi',
    location: 'İstanbul, Türkiye',
    type: 'destinasyon',
    quote: 'Sultanahmet’te sakin bir nefes, Bizans akustiği',
    likes: 760,
    views: 4100,
    badge: null,
    imageQuery: 'hagia irene istanbul',
    tall: false,
  },
  {
    id: 17,
    name: 'Çıralı Deniz Kaplumbağaları',
    location: 'Antalya, Türkiye',
    type: 'aktivite',
    quote: 'Gece kumsalda Caretta gözlemi — doğa ve huzur',
    likes: 1900,
    views: 9200,
    badge: 'featured',
    imageQuery: 'cirali beach turkey turtle',
    tall: true,
  },
  {
    id: 18,
    name: 'Urla Şarap Bağları',
    location: 'İzmir, Türkiye',
    type: 'deneyim',
    quote: 'Ege’nin bağlarında gün batımı tadımı',
    likes: 2200,
    views: 10400,
    badge: null,
    imageQuery: 'urla wine vineyard turkey',
    tall: false,
  },
  {
    id: 19,
    name: 'Van Kahvaltısı Günü',
    location: 'Van, Türkiye',
    type: 'restoran',
    quote: 'Otlu peynir ve sıcak çörek — doyumsuz sofra',
    likes: 4100,
    views: 17500,
    badge: 'trend',
    imageQuery: 'van turkey breakfast cheese',
    tall: false,
  },
  {
    id: 20,
    name: 'Konya Mevlana Töreni',
    location: 'Konya, Türkiye',
    type: 'deneyim',
    quote: 'Semazenlerin dönüşünde iç huzur',
    likes: 6300,
    views: 29000,
    badge: 'featured',
    imageQuery: 'konya whirling dervishes',
    tall: true,
  },
];

function formatNum(n) {
  const x = Number(n) || 0;
  return x >= 1000 ? `${(x / 1000).toFixed(1)}K` : String(x);
}

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

function loadSavedArray() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SAVED_LS);
    if (!raw) return [];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

function persistSavedArray(arr) {
  try {
    localStorage.setItem(SAVED_LS, JSON.stringify(arr));
  } catch {
    /* ignore */
  }
}

function mapGuideToLikeItem(g) {
  return {
    id: guideLikeKey(g.id),
    name: g.title,
    location: g.location,
    type: 'destinasyon',
    quote:
      g.description ||
      `${g.author} tarafından paylaşılan rehber.`,
    likes: g.likes,
    views: g.views ?? Math.max(500, (g.likes || 0) * 4),
    badge: g.badge || null,
    imageQuery: g.imageQuery,
    tall: false,
    coverUrl: g.coverUrl,
  };
}

function LikeImage({ item }) {
  const [url, setUrl] = useState(item.coverUrl || null);
  const [loading, setLoading] = useState(!item.coverUrl);
  const h = item.tall ? 240 : 180;

  useEffect(() => {
    if (item.coverUrl) {
      setUrl(item.coverUrl);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setUrl(null);
    const q = encodeURIComponent(item.imageQuery || item.name);
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
  }, [item.coverUrl, item.imageQuery, item.name]);

  const fallback = FALLBACK_BY_TYPE[item.type] || FALLBACK_BY_TYPE.default;
  const src = url || (!loading ? fallback : null);

  return (
    <div style={{ position: 'relative', height: h, background: '#E4E2DC', overflow: 'hidden' }}>
      {loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg,#e4e2dc 25%,#f0ede8 50%,#e4e2dc 75%)',
            backgroundSize: '200% 100%',
            animation: 'likesSk 1.2s ease-in-out infinite',
          }}
        />
      )}
      {src ? (
        <img
          src={src}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={(e) => {
            e.target.src = fallback;
          }}
        />
      ) : null}
      {item.badge === 'trend' ? (
        <div style={st.badge}>
          <Flame size={13} strokeWidth={2} aria-hidden />
          Trend
        </div>
      ) : item.badge === 'featured' ? (
        <div style={st.badge}>
          <Sparkles size={13} strokeWidth={2} aria-hidden />
          Öne Çıkan
        </div>
      ) : item.badge ? (
        <div style={st.badge}>{item.badge}</div>
      ) : null}
    </div>
  );
}

export default function LikesPage() {
  const [filter, setFilter] = useState('all');
  const [liked, setLiked] = useState({});
  const [toast, setToast] = useState(false);
  const [userGuides, setUserGuides] = useState([]);

  useEffect(() => {
    function sync() {
      setLiked(loadLikedMap());
      setUserGuides(loadUserGuides());
    }
    sync();
    window.addEventListener('likesStorageUpdated', sync);
    window.addEventListener('userGuidesUpdated', sync);
    return () => {
      window.removeEventListener('likesStorageUpdated', sync);
      window.removeEventListener('userGuidesUpdated', sync);
    };
  }, []);

  const likedGuideItems = useMemo(() => {
    return [...FEATURED_GUIDES, ...userGuides]
      .filter((g) => liked[guideLikeKey(g.id)])
      .map(mapGuideToLikeItem);
  }, [liked, userGuides]);

  const allItems = useMemo(
    () => [...likedGuideItems, ...MOCK_LIKES_ITEMS],
    [likedGuideItems]
  );

  const filtered = useMemo(() => {
    if (filter === 'all') return allItems;
    return allItems.filter((x) => x.type === filter);
  }, [allItems, filter]);

  function toggleLike(id) {
    const key = String(id);
    setLiked((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      persistLikedMap(next);
      return next;
    });
  }

  function saveItem(item) {
    const arr = loadSavedArray();
    if (arr.some((x) => String(x.id) === String(item.id))) {
      setToast(true);
      window.setTimeout(() => setToast(false), 2000);
      return;
    }
    arr.push({
      id: item.id,
      name: item.name,
      location: item.location,
      type: item.type,
      quote: item.quote,
      imageQuery: item.imageQuery,
      savedFrom: 'likes',
      savedAt: new Date().toISOString(),
    });
    persistSavedArray(arr);
    setToast(true);
    window.setTimeout(() => setToast(false), 2000);
  }

  function displayLikes(item) {
    const delta = liked[String(item.id)] ? 1 : 0;
    return item.likes + delta;
  }

  return (
    <div style={st.shell}>
      <style>{`
        @keyframes likesSk {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .likes-card {
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .likes-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(0,0,0,.1);
        }
      `}</style>
      <AppSidebar activeId="likes" />

      <main style={st.main}>
        <header style={st.headRow}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h1 className="ta-h1" style={st.title}>
                Beğeniler
              </h1>
              <TrendingUp size={26} strokeWidth={2} color="var(--ta-ink)" aria-hidden />
            </div>
            <p style={st.subtitle}>Seni etkileyen yerler</p>
          </div>
          <Link href="/explore" style={st.exploreBtn}>
            <Compass size={16} strokeWidth={2} color="var(--ta-ink)" />
            Keşfet →
          </Link>
        </header>

        <div style={st.chipScroll}>
          {FILTER_CHIPS.map((c) => (
            <button
              key={c.id}
              type="button"
              style={{
                ...st.chip,
                ...(filter === c.id ? st.chipOn : st.chipOff),
              }}
              onClick={() => setFilter(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p style={st.emptyFilter}>Bu kategoride içerik bulunamadı</p>
        ) : (
          <div style={st.masonry}>
            {filtered.map((item) => (
              <article key={item.id} className="likes-card" style={st.card}>
                <LikeImage item={item} />
                <div style={st.cardBody}>
                  <h2 style={st.cardName}>{item.name}</h2>
                  <div style={st.locRow}>
                    <MapPin size={14} strokeWidth={2} color="var(--ta-ink-muted)" />
                    <span style={st.loc}>{item.location}</span>
                  </div>
                  <p style={st.quote}>{item.quote}</p>
                  <div style={st.metaRow}>
                    <span style={st.stats}>
                      <Heart size={12} strokeWidth={2} color="var(--ta-ink-muted)" aria-hidden />
                      {formatNum(displayLikes(item))}
                      <span style={{ opacity: 0.5 }}> · </span>
                      <Eye size={12} strokeWidth={2} color="var(--ta-ink-muted)" aria-hidden />
                      {formatNum(item.views)}
                    </span>
                    <div style={st.btnRow}>
                      <button
                        type="button"
                        style={{
                          ...st.smallBtn,
                          ...(liked[String(item.id)] ? st.smallBtnLiked : {}),
                        }}
                        onClick={() => toggleLike(item.id)}
                      >
                        <Heart
                          size={14}
                          strokeWidth={2}
                          color={liked[String(item.id)] ? '#e11d48' : 'var(--ta-ink)'}
                          fill={liked[String(item.id)] ? '#e11d48' : 'none'}
                        />
                        Beğen
                      </button>
                      <button type="button" style={st.smallBtn} onClick={() => saveItem(item)}>
                        <Bookmark size={14} strokeWidth={2} color="var(--ta-ink)" />
                        Kaydet
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {toast && (
          <div style={st.toast} role="status">
            <Check size={15} strokeWidth={2.5} aria-hidden />
            Kaydedildi
          </div>
        )}
      </main>
    </div>
  );
}

const st = {
  shell: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
    background: '#fff',
  },
  main: {
    flex: 1,
    minWidth: 0,
    overflowY: 'auto',
    padding: 40,
    boxSizing: 'border-box',
    position: 'relative',
  },
  headRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  title: {
    margin: 0,
  },
  subtitle: {
    margin: 0,
    fontSize: 14,
    color: 'var(--ta-ink-muted)',
    fontFamily: 'var(--font-sans)',
  },
  exploreBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 18px',
    borderRadius: 999,
    border: '1px solid rgba(0,0,0,.18)',
    background: '#FFFFFF',
    color: 'var(--ta-ink)',
    fontSize: 14,
    fontWeight: 600,
    fontFamily: 'var(--font-sans)',
    textDecoration: 'none',
  },
  chipScroll: {
    display: 'flex',
    gap: 8,
    overflowX: 'auto',
    flexWrap: 'nowrap',
    paddingBottom: 8,
    marginBottom: 20,
    scrollbarWidth: 'thin',
  },
  chip: {
    flexShrink: 0,
    padding: '6px 16px',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 600,
    fontFamily: 'var(--font-sans)',
    cursor: 'pointer',
    border: '1px solid transparent',
  },
  chipOn: {
    background: 'var(--ta-ink)',
    color: '#FFFFFF',
  },
  chipOff: {
    background: '#FFFFFF',
    color: 'var(--ta-ink-muted)',
    borderColor: 'rgba(0,0,0,.12)',
  },
  masonry: {
    columnCount: 2,
    columnGap: 16,
  },
  card: {
    breakInside: 'avoid',
    WebkitColumnBreakInside: 'avoid',
    marginBottom: 16,
    border: '1px solid rgba(0,0,0,.06)',
    borderRadius: 16,
    overflow: 'hidden',
    background: '#FFFFFF',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,.04)',
  },
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '4px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    color: '#FFFFFF',
    background: 'rgba(0,0,0,.5)',
    fontFamily: 'var(--font-sans)',
  },
  cardBody: {
    padding: 14,
  },
  cardName: {
    margin: 0,
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--ta-ink)',
    fontFamily: 'var(--font-sans)',
  },
  locRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  loc: {
    fontSize: 12,
    color: 'var(--ta-ink-muted)',
    fontFamily: 'var(--font-sans)',
  },
  quote: {
    margin: '6px 0 0',
    fontSize: 13,
    color: 'var(--ta-ink-muted)',
    fontStyle: 'italic',
    lineHeight: 1.5,
    maxHeight: '3em',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    fontFamily: 'var(--font-sans)',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  stats: {
    fontSize: 12,
    color: 'var(--ta-ink-muted)',
    fontFamily: 'var(--font-sans)',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  btnRow: {
    display: 'flex',
    gap: 8,
  },
  smallBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    height: 28,
    padding: '0 10px',
    borderRadius: 20,
    border: '1px solid rgba(0,0,0,.15)',
    background: '#FFFFFF',
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--ta-ink)',
    fontFamily: 'var(--font-sans)',
    cursor: 'pointer',
  },
  smallBtnLiked: {
    borderColor: 'rgba(225,29,72,.35)',
    background: 'rgba(225,29,72,.06)',
  },
  emptyFilter: {
    textAlign: 'center',
    padding: '48px 20px',
    fontSize: 15,
    color: 'var(--ta-ink-muted)',
    fontFamily: 'var(--font-sans)',
  },
  toast: {
    position: 'fixed',
    bottom: 32,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 22px',
    borderRadius: 12,
    background: 'var(--ta-ink)',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 600,
    fontFamily: 'var(--font-sans)',
    boxShadow: '0 8px 24px rgba(0,0,0,.18)',
  },
};
