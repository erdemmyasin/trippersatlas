'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Plus, Search, Check, SlidersHorizontal, Star, X } from 'lucide-react';
import {
  DISCOVER_CITIES,
  DISCOVER_TABS,
  DISCOVER_CATEGORY_LABEL,
  getDiscoverPlaces,
} from '@/lib/discoverMockPlaces';

/**
 * Resim 4 — "Yer ekle" mini Keşfet modal'ı.
 * - Şehir picker (Antalya ▾)
 * - Arama input + Filtreler butonu (placeholder)
 * - Tab'lar: Senin için / Yapılacaklar / Restoranlar / Etkinlikler / Konaklama / Lokasyonlar
 * - Sonuç kartları (image + Add buton + name + category + city + rating + mentionedBy)
 *
 * @param {{ id, places }} collection  Eklendi/eklenmedi durumunu place.id ile kontrol eder.
 * @param {(place) => void} onAdd      Add tıklamasında çağrılır (modal açık kalır).
 * @param {() => void} onClose
 */
export default function AddPlacesModal({ open, collection, onAdd, onClose }) {
  const [city, setCity] = useState(DISCOVER_CITIES[0]);
  const [cityMenuOpen, setCityMenuOpen] = useState(false);
  const [tab, setTab] = useState('forYou');
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) {
      setCity(DISCOVER_CITIES[0]);
      setCityMenuOpen(false);
      setTab('forYou');
      setQuery('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const places = useMemo(() => {
    const list = getDiscoverPlaces(city, tab);
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((p) =>
      [p.name, p.city, DISCOVER_CATEGORY_LABEL[p.category] || ''].some((s) =>
        String(s).toLowerCase().includes(q)
      )
    );
  }, [city, tab, query]);

  const addedIds = useMemo(
    () => new Set((collection?.places || []).map((p) => p.id)),
    [collection]
  );

  if (!open) return null;

  return (
    <div
      style={s.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-places-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div style={s.card} onClick={(e) => e.stopPropagation()}>
        <button type="button" style={s.closeBtn} onClick={onClose} aria-label="Kapat">
          <X size={18} strokeWidth={2.2} color="var(--ta-ink)" />
        </button>

        <header style={s.head}>
          <h2 id="add-places-title" style={s.title}>Yer ekle</h2>
          <p style={s.sub}>Belirli mekanları veya yer türlerini ara</p>
        </header>

        <div style={s.divider} />

        <div style={s.scrollBody}>
          {/* Şehir picker */}
          <div style={s.cityRow}>
            <button
              type="button"
              style={s.cityBtn}
              onClick={() => setCityMenuOpen((v) => !v)}
              aria-expanded={cityMenuOpen}
            >
              {city}
              <ChevronDown size={20} strokeWidth={2.2} />
            </button>
            {cityMenuOpen ? (
              <div style={s.cityMenu} role="menu">
                {DISCOVER_CITIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    style={{
                      ...s.cityMenuItem,
                      ...(c === city ? s.cityMenuItemOn : {}),
                    }}
                    onClick={() => {
                      setCity(c);
                      setCityMenuOpen(false);
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* Arama + Filtreler */}
          <div style={s.searchRow}>
            <span style={s.searchInputWrap}>
              <Search size={16} strokeWidth={2.2} color="var(--ta-ink-muted)" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ara"
                style={s.searchInput}
              />
            </span>
            <button type="button" style={s.filterBtn} aria-label="Filtreler">
              <SlidersHorizontal size={16} strokeWidth={2.2} />
              Filtreler
            </button>
          </div>

          {/* Tab'lar */}
          <div style={s.tabsRow}>
            {DISCOVER_TABS.map((t) => {
              const on = t.id === tab;
              return (
                <button
                  key={t.id}
                  type="button"
                  style={{ ...s.tab, ...(on ? s.tabOn : {}) }}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Section title */}
          <h3 style={s.sectionTitle}>
            {DISCOVER_TABS.find((t) => t.id === tab)?.label || 'Senin için'}
          </h3>

          {/* Sonuç kartları */}
          {places.length === 0 ? (
            <div style={s.empty}>
              <p style={s.emptyTitle}>Sonuç bulunamadı</p>
              <p style={s.emptySub}>
                Farklı bir şehir veya kategori seçin, ya da arama terimini değiştirin.
              </p>
            </div>
          ) : (
            <div style={s.grid}>
              {places.map((p) => {
                const added = addedIds.has(p.id);
                return (
                  <article key={p.id} style={s.placeCard}>
                    <div
                      style={{
                        ...s.placeImg,
                        ...(p.imageUrl ? { backgroundImage: `url(${p.imageUrl})` } : {}),
                      }}
                    >
                      <button
                        type="button"
                        style={{ ...s.addBtn, ...(added ? s.addBtnOn : {}) }}
                        onClick={() => !added && onAdd?.(p)}
                        disabled={added}
                        aria-label={added ? 'Eklendi' : 'Listeye ekle'}
                      >
                        {added ? (
                          <>
                            <Check size={14} strokeWidth={2.4} />
                            Eklendi
                          </>
                        ) : (
                          <>
                            <Plus size={14} strokeWidth={2.4} />
                            Ekle
                          </>
                        )}
                      </button>
                    </div>
                    <div style={s.placeMeta}>
                      <div style={s.placeNameRow}>
                        <div style={s.placeName}>{p.name}</div>
                        {p.rating != null ? (
                          <div style={s.ratingPill}>
                            <Star size={12} strokeWidth={2} fill="#f59e0b" color="#f59e0b" />
                            <span>{p.rating.toFixed(1)}</span>
                            {p.reviewCount ? (
                              <span style={s.ratingCount}>
                                ({p.reviewCount >= 1000 ? `${Math.round(p.reviewCount / 1000)}b` : p.reviewCount})
                              </span>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                      <div style={s.placeCat}>
                        {DISCOVER_CATEGORY_LABEL[p.category] || p.category}
                      </div>
                      <div style={s.placeCity}>{p.city}</div>
                      {p.mentionedBy ? (
                        <div style={s.mention}>
                          <span style={s.mentionAvatar} aria-hidden>
                            {String(p.mentionedBy).charAt(0).toUpperCase()}
                          </span>
                          {p.mentionedBy} bahsetti
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,23,32,.45)',
    zIndex: 'var(--z-modal)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: 'var(--space-5) var(--space-4)',
    boxSizing: 'border-box',
    overflow: 'auto',
  },
  card: {
    position: 'relative',
    width: 'min(820px, 100%)',
    maxHeight: 'min(90vh, 920px)',
    background: '#fff',
    borderRadius: 'var(--radius-lg)',
    boxShadow: '0 24px 80px rgba(0,0,0,.22)',
    fontFamily: 'var(--font-sans)',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  closeBtn: {
    position: 'absolute',
    top: 'var(--space-4)',
    left: 'var(--space-4)',
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(0,0,0,.04)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  head: {
    paddingTop: 'var(--space-5)',
    paddingBottom: 'var(--space-3)',
    paddingLeft: 'var(--space-7)',
    paddingRight: 'var(--space-7)',
    textAlign: 'center',
    flexShrink: 0,
  },
  title: {
    margin: 0,
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--fw-bold)',
    fontSize: 'var(--text-xl)',
    color: 'var(--ta-ink)',
    letterSpacing: '-0.01em',
  },
  sub: {
    margin: 'var(--space-1) 0 0',
    fontSize: 'var(--text-sm)',
    color: 'var(--ta-ink-muted)',
  },
  divider: {
    height: 'var(--border-thin)',
    background: 'rgba(0,0,0,.08)',
    flexShrink: 0,
  },
  scrollBody: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: 'var(--space-5) var(--space-6) var(--space-7)',
  },
  cityRow: {
    position: 'relative',
    display: 'inline-block',
    marginBottom: 'var(--space-4)',
  },
  cityBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    border: 'none',
    background: 'transparent',
    padding: 0,
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--fw-extrabold)',
    fontSize: 'var(--text-2xl)',
    letterSpacing: '-0.02em',
    color: 'var(--ta-ink)',
    cursor: 'pointer',
  },
  cityMenu: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    left: 0,
    minWidth: 200,
    background: '#fff',
    borderRadius: 'var(--radius-md)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(0,0,0,.08)',
    boxShadow: '0 8px 28px rgba(0,0,0,.18)',
    padding: 'var(--space-1)',
    zIndex: 'var(--z-dropdown)',
  },
  cityMenuItem: {
    width: '100%',
    padding: 'var(--space-2) var(--space-3)',
    border: 'none',
    background: 'transparent',
    borderRadius: 'var(--radius-xs)',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-md)',
    fontWeight: 'var(--fw-medium)',
    color: 'var(--ta-ink)',
    cursor: 'pointer',
    textAlign: 'left',
  },
  cityMenuItemOn: {
    background: 'var(--ta-accent-soft)',
    color: 'var(--ta-accent-deep)',
    fontWeight: 'var(--fw-bold)',
  },
  searchRow: {
    display: 'flex',
    gap: 'var(--space-3)',
    alignItems: 'center',
    marginBottom: 'var(--space-4)',
  },
  searchInputWrap: {
    flex: 1,
    minWidth: 0,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-3) var(--space-4)',
    background: 'var(--ta-muted-bg)',
    borderRadius: 'var(--radius-pill)',
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    border: 'none',
    background: 'transparent',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-md)',
    color: 'var(--ta-ink)',
    outline: 'none',
  },
  filterBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-2) var(--space-4)',
    borderRadius: 'var(--radius-pill)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(0,0,0,.12)',
    background: '#fff',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--fw-semibold)',
    color: 'var(--ta-ink)',
    cursor: 'pointer',
    flexShrink: 0,
  },
  tabsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--space-2)',
    marginBottom: 'var(--space-5)',
  },
  tab: {
    padding: 'var(--space-2) var(--space-4)',
    borderRadius: 'var(--radius-pill)',
    border: 'none',
    background: 'transparent',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--fw-semibold)',
    color: 'var(--ta-ink-muted)',
    cursor: 'pointer',
  },
  tabOn: {
    background: 'var(--ta-ink)',
    color: '#fff',
  },
  sectionTitle: {
    margin: '0 0 var(--space-3)',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-lg)',
    fontWeight: 'var(--fw-bold)',
    color: 'var(--ta-ink)',
  },
  empty: {
    padding: 'var(--space-7) var(--space-4)',
    textAlign: 'center',
  },
  emptyTitle: {
    margin: 0,
    fontSize: 'var(--text-md)',
    fontWeight: 'var(--fw-bold)',
    color: 'var(--ta-ink-muted)',
  },
  emptySub: {
    margin: 'var(--space-2) 0 0',
    fontSize: 'var(--text-sm)',
    color: 'var(--ta-ink-subtle)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 'var(--space-5)',
  },
  placeCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  },
  placeImg: {
    aspectRatio: '4 / 3',
    borderRadius: 'var(--radius-md)',
    background: '#ececec',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative',
  },
  addBtn: {
    position: 'absolute',
    top: 'var(--space-3)',
    right: 'var(--space-3)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-1)',
    padding: 'var(--space-1) var(--space-3)',
    borderRadius: 'var(--radius-pill)',
    border: 'none',
    background: '#fff',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--fw-bold)',
    color: 'var(--ta-ink)',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,.18)',
  },
  addBtnOn: {
    background: 'var(--ta-sea)',
    color: '#fff',
    cursor: 'default',
  },
  placeMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-px)',
    paddingLeft: 'var(--space-1)',
  },
  placeNameRow: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 'var(--space-2)',
  },
  placeName: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-md)',
    fontWeight: 'var(--fw-bold)',
    color: 'var(--ta-ink)',
    flex: 1,
    minWidth: 0,
  },
  ratingPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-px)',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--fw-semibold)',
    color: 'var(--ta-ink)',
    flexShrink: 0,
  },
  ratingCount: {
    color: 'var(--ta-ink-muted)',
    fontWeight: 'var(--fw-regular)',
  },
  placeCat: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    color: 'var(--ta-ink-muted)',
  },
  placeCity: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    color: 'var(--ta-ink-subtle)',
  },
  mention: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    marginTop: 'var(--space-2)',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    color: 'var(--ta-ink-muted)',
  },
  mentionAvatar: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #6c3a91 0%, #a14fc4 100%)',
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
};
