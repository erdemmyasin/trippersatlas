'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { DM_Sans } from 'next/font/google';
import {
  Lock,
  Search,
  Heart,
  Users,
  BookOpen,
  Download,
  Plus,
} from 'lucide-react';
import AppSidebar from '@/components/AppSidebar';
import { PlaceCategoryGlyph } from '@/components/AtlasGlyph';
import { loadSavedPlaces } from '@/lib/savedPlacesStore';

const dmSans = DM_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
});

const COLLECTIONS_LS = 'ta_saved_collections';

const DEFAULT_COLLECTIONS = [
  { id: 'default', name: 'Mekanlarım', private: true },
];

const PLACE_FILTER_CHIPS = [
  { id: 'all', label: 'Tümü' },
  { id: 'stay', label: 'Konaklamalar' },
  { id: 'restaurant', label: 'Restoranlar' },
  { id: 'activity', label: 'Aktiviteler' },
  { id: 'location', label: 'Lokasyonlar' },
];

function loadCollections() {
  if (typeof window === 'undefined') return DEFAULT_COLLECTIONS;
  try {
    const raw = localStorage.getItem(COLLECTIONS_LS);
    if (!raw) return [...DEFAULT_COLLECTIONS];
    const p = JSON.parse(raw);
    if (!Array.isArray(p) || p.length === 0) return [...DEFAULT_COLLECTIONS];
    const mapped = p.map((c) => ({
      id: String(c.id ?? 'c'),
      name: String(c.name || 'Koleksiyon'),
      private: Boolean(c.private),
    }));
    const hasDefault = mapped.some((c) => c.id === 'default');
    if (hasDefault) return mapped;
    return [...DEFAULT_COLLECTIONS, ...mapped];
  } catch {
    return [...DEFAULT_COLLECTIONS];
  }
}

function saveCollections(list) {
  try {
    localStorage.setItem(COLLECTIONS_LS, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

function categoryFilter(place, filterId) {
  const cat = String(place.category || '');
  if (filterId === 'all') return true;
  if (filterId === 'stay') return cat === 'Konaklama';
  if (filterId === 'restaurant') return cat === 'Restoran';
  if (filterId === 'activity') {
    return ['Müze', 'Doğa', 'Gece Hayatı', 'Sağlık', 'İbadet', 'Alışveriş'].includes(cat);
  }
  if (filterId === 'location') return cat === 'Gezilecek Yer';
  return true;
}

function CollectionCard({ collection, savedPlaces }) {
  const thumbs = savedPlaces.slice(0, 3).map((p) => p.photoUrl).filter(Boolean);
  const count = collection.id === 'default' ? savedPlaces.length : 0;
  const img0 = thumbs[0];
  const img1 = thumbs[1];
  const img2 = thumbs[2];

  return (
    <div style={st.card}>
      <div style={st.cardPhotoGrid}>
        {collection.private && (
          <div style={st.cardLock}>
            <Lock size={14} strokeWidth={2.2} color="var(--ta-ink)" />
          </div>
        )}
        <div style={{ ...st.bigCell, ...(img0 ? {} : st.ph) }}>
          {img0 ? <img src={img0} alt="" style={st.cellImg} /> : null}
        </div>
        <div style={{ ...st.smallCell, ...(img1 ? {} : st.ph) }}>
          {img1 ? <img src={img1} alt="" style={st.cellImg} /> : null}
        </div>
        <div style={{ ...st.smallCell, ...(img2 ? {} : st.ph) }}>
          {img2 ? <img src={img2} alt="" style={st.cellImg} /> : null}
        </div>
      </div>
      <div style={st.cardFooter}>
        <span style={st.cardName}>{collection.name}</span>
        <span style={st.cardCount}>{count} mekan</span>
      </div>
    </div>
  );
}

function EmptyPlaces() {
  return (
    <div style={st.emptyWrap}>
      <div
        style={{
          ...st.emptyOrb,
          background: 'linear-gradient(135deg, #f093fb, #f5576c)',
        }}
      >
        <Heart size={32} strokeWidth={2} color="#FFFFFF" fill="rgba(255,255,255,.25)" />
      </div>
      <h2 style={st.emptyTitle}>Henüz kaydedilen mekan yok.</h2>
      <p style={st.emptyText}>
        Sohbet veya keşfet sayfasında beğendiğin yerleri kaydet.
      </p>
      <Link href="/explore" style={st.emptyBtn}>
        Keşfetmeye Başla
      </Link>
    </div>
  );
}

function EmptyGuides() {
  return (
    <div style={st.emptyWrap}>
      <div
        style={{
          ...st.emptyOrb,
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
        }}
      >
        <Users size={32} strokeWidth={2} color="#FFFFFF" />
      </div>
      <h2 style={{ ...st.emptyTitle, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
        <BookOpen size={20} strokeWidth={2} color="var(--ta-ink)" aria-hidden />
        Henüz kaydedilen rehber yok.
      </h2>
      <p style={st.emptyText}>
        Atlas&apos;ın yerel uzmanlardan derlediği rehberleri keşfet.
      </p>
      <Link href="/explore" style={st.emptyBtn}>
        İlham Al
      </Link>
    </div>
  );
}

export default function SavedPage() {
  const [tab, setTab] = useState('collections');
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [collections, setCollections] = useState(DEFAULT_COLLECTIONS);
  const [placeQuery, setPlaceQuery] = useState('');
  const [placeFilter, setPlaceFilter] = useState('all');

  function refreshPlaces() {
    setSavedPlaces(loadSavedPlaces());
  }

  useEffect(() => {
    setCollections(loadCollections());
    refreshPlaces();
    function onSaved() {
      refreshPlaces();
    }
    window.addEventListener('savedPlacesUpdated', onSaved);
    return () => window.removeEventListener('savedPlacesUpdated', onSaved);
  }, []);

  const filteredPlaces = useMemo(() => {
    let list = savedPlaces.filter((p) => categoryFilter(p, placeFilter));
    const q = placeQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          String(p.name || '')
            .toLowerCase()
            .includes(q) ||
          String(p.address || '')
            .toLowerCase()
            .includes(q)
      );
    }
    return list;
  }, [savedPlaces, placeFilter, placeQuery]);

  const title =
    tab === 'collections'
      ? 'Koleksiyonlarınız'
      : tab === 'places'
        ? 'Kaydedilen Mekanlar'
        : 'Kaydedilen Rehberler';

  const guidesCount = 0;

  function handleCreateCollection() {
    const name = window.prompt('Yeni koleksiyon adı');
    if (!name || !name.trim()) return;
    const next = [
      ...collections,
      { id: `c-${Date.now()}`, name: name.trim(), private: false },
    ];
    setCollections(next);
    saveCollections(next);
  }

  return (
    <div className={dmSans.className} style={st.shell}>
      <AppSidebar activeId="saved" />

      <main style={st.main}>
        <header style={st.header}>
          <h1 style={st.pageTitle}>{title}</h1>
          {tab === 'collections' && (
            <div style={st.headerActions}>
              <button type="button" style={st.btnOutline} onClick={() => {}}>
                <Download size={16} strokeWidth={2} color="var(--ta-ink)" />
                İçe Aktar
              </button>
              <button type="button" style={st.btnDark} onClick={handleCreateCollection}>
                <Plus size={16} strokeWidth={2.2} color="#FFFFFF" />
                Oluştur
              </button>
            </div>
          )}
        </header>
        <div style={st.tabs}>
          <button
            type="button"
            style={{ ...st.tab, ...(tab === 'collections' ? st.tabOn : st.tabOff) }}
            onClick={() => setTab('collections')}
          >
            Koleksiyonlar {collections.length}
          </button>
          <button
            type="button"
            style={{ ...st.tab, ...(tab === 'places' ? st.tabOn : st.tabOff) }}
            onClick={() => setTab('places')}
          >
            Mekanlar {savedPlaces.length}
          </button>
          <button
            type="button"
            style={{ ...st.tab, ...(tab === 'guides' ? st.tabOn : st.tabOff) }}
            onClick={() => setTab('guides')}
          >
            Rehberler {guidesCount}
          </button>
        </div>

        {tab === 'collections' && (
          <div style={st.grid3}>
            {collections.map((c) => (
              <CollectionCard key={c.id} collection={c} savedPlaces={savedPlaces} />
            ))}
          </div>
        )}

        {tab === 'places' && (
          <div>
            <div style={st.searchWrap}>
              <Search size={18} strokeWidth={2} color="var(--ta-ink-subtle)" />
              <input
                type="search"
                placeholder="Mekan ara..."
                value={placeQuery}
                onChange={(e) => setPlaceQuery(e.target.value)}
                style={st.searchInput}
              />
            </div>
            <div style={st.chips}>
              {PLACE_FILTER_CHIPS.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  style={{
                    ...st.chip,
                    ...(placeFilter === ch.id ? st.chipOn : {}),
                  }}
                  onClick={() => setPlaceFilter(ch.id)}
                >
                  {ch.label}
                </button>
              ))}
            </div>
            {filteredPlaces.length === 0 ? (
              savedPlaces.length === 0 ? (
                <EmptyPlaces />
              ) : (
                <div style={st.emptyWrap}>
                  <p style={st.emptyText}>Bu filtreye uygun mekan yok.</p>
                </div>
              )
            ) : (
              <div style={st.placeGrid}>
                {filteredPlaces.map((p) => (
                  <div key={p.id} style={st.placeCard}>
                    <div style={st.placeImgWrap}>
                      {p.photoUrl ? (
                        <img src={p.photoUrl} alt="" style={st.placeImg} />
                      ) : (
                        <div style={st.placePh} />
                      )}
                    </div>
                    <div style={st.placeBody}>
                      <span style={st.placeName}>{p.name}</span>
                      <span style={st.placeMeta}>
                        <PlaceCategoryGlyph category={p.category} size={13} />
                        {p.category}
                      </span>
                      {p.address && <span style={st.placeAddr}>{p.address}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'guides' && <EmptyGuides />}
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
    padding: 40,
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
    marginBottom: 0,
  },
  pageTitle: {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    color: 'var(--ta-ink)',
    letterSpacing: '-0.02em',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  btnOutline: {
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
    cursor: 'pointer',
  },
  btnDark: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 22px',
    borderRadius: 999,
    border: 'none',
    background: 'var(--ta-ink)',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  tabs: {
    display: 'flex',
    gap: 28,
    borderBottom: '1px solid rgba(0,0,0,.08)',
    marginTop: 24,
    marginBottom: 32,
  },
  tab: {
    padding: '12px 4px',
    marginBottom: -1,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: 15,
    fontWeight: 600,
    borderBottom: '2px solid transparent',
  },
  tabOn: {
    color: 'var(--ta-ink)',
    borderBottomColor: 'var(--ta-ink)',
  },
  tabOff: {
    color: 'var(--ta-ink-subtle)',
    borderBottomColor: 'transparent',
  },
  grid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 20,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid rgba(0,0,0,.08)',
    background: '#FFFFFF',
  },
  cardPhotoGrid: {
    position: 'relative',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateRows: '1fr 1fr',
    gap: 4,
    padding: 4,
    height: 200,
    boxSizing: 'border-box',
    background: 'var(--ta-muted-bg)',
  },
  cardLock: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 2,
    width: 28,
    height: 28,
    borderRadius: 8,
    background: 'rgba(255,255,255,.92)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,.08)',
  },
  bigCell: {
    gridRow: 'span 2',
    borderRadius: 8,
    overflow: 'hidden',
    background: '#E4E2DC',
  },
  smallCell: {
    borderRadius: 8,
    overflow: 'hidden',
    background: '#E4E2DC',
  },
  ph: {
    background: '#D8D6D0',
  },
  cellImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  cardFooter: {
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  cardName: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--ta-ink)',
  },
  cardCount: {
    fontSize: 13,
    color: 'var(--ta-ink-muted)',
    fontWeight: 500,
  },
  searchWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    padding: '12px 16px',
    borderRadius: 12,
    background: 'var(--ta-muted-bg)',
    border: '1px solid rgba(0,0,0,.06)',
    boxSizing: 'border-box',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: 15,
    color: 'var(--ta-ink)',
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  chip: {
    padding: '8px 16px',
    borderRadius: 999,
    border: '1px solid rgba(0,0,0,.12)',
    background: '#FFFFFF',
    color: 'var(--ta-ink)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  chipOn: {
    background: 'var(--ta-ink)',
    color: '#FFFFFF',
    borderColor: 'var(--ta-ink)',
  },
  placeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 20,
  },
  placeCard: {
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid rgba(0,0,0,.08)',
    background: '#FFFFFF',
  },
  placeImgWrap: {
    height: 140,
    background: '#E4E2DC',
  },
  placeImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  placePh: {
    width: '100%',
    height: '100%',
    background: '#D8D6D0',
  },
  placeBody: {
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  placeName: {
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--ta-ink)',
  },
  placeMeta: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    color: 'var(--ta-ink-muted)',
  },
  placeAddr: {
    fontSize: 12,
    color: 'var(--ta-ink-subtle)',
    lineHeight: 1.4,
  },
  emptyWrap: {
    minHeight: 360,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '40px 20px',
  },
  emptyOrb: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    margin: '0 0 12px',
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--ta-ink)',
  },
  emptyText: {
    margin: 0,
    fontSize: 14,
    color: 'var(--ta-ink-muted)',
    maxWidth: 360,
    lineHeight: 1.55,
  },
  emptyBtn: {
    marginTop: 24,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 28px',
    borderRadius: 999,
    background: 'var(--ta-ink)',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 600,
    textDecoration: 'none',
  },
};
