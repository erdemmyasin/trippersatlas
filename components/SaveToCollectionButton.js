'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bookmark, BookmarkCheck, ChevronRight, Plus } from 'lucide-react';
import {
  addPlaceToCollection,
  createCollection,
  listCollections,
} from '@/lib/savedCollections';

/**
 * Listing kartlarına bağlanan ikon-only "Koleksiyona Kaydet" butonu.
 * TripifyButton ile aynı UX deseni:
 *  - Click → dropdown (portal + position:fixed, Google Maps z-index sorunlarına bağışık)
 *      • Yeni Koleksiyon  → yeni koleksiyon yarat + listing'i içine koy
 *      • Mevcut Koleksiyon › → nested submenu, koleksiyon listesi, tıklanan'a ekler
 *
 * @param {object} props.place — { id, name, category, city, country, imageUrl, ... }
 *                               id otomatik üretilir (listing.id veya name'den).
 */
export default function SaveToCollectionButton({ place, label = 'Koleksiyona Kaydet' }) {
  const wrapRef = useRef(null);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [doneLabel, setDoneLabel] = useState('Kaydedildi');
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [submenuPos, setSubmenuPos] = useState({ top: 0, left: 0 });

  const collections = useMemo(() => (menuOpen ? listCollections() : []), [menuOpen]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!menuOpen || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const w = 220;
    const pad = 8;
    let left = rect.right - w;
    if (left < pad) left = pad;
    if (left + w > window.innerWidth - pad) left = window.innerWidth - w - pad;
    setMenuPos({ top: rect.bottom + 6, left });
  }, [menuOpen]);

  useLayoutEffect(() => {
    if (!submenuOpen || !menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const sw = 280;
    let left = rect.right + 6;
    if (left + sw > window.innerWidth - 8) left = rect.left - sw - 6;
    setSubmenuPos({ top: rect.top, left });
  }, [submenuOpen, menuOpen]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    function onPointer(e) {
      if (wrapRef.current?.contains(e.target)) return;
      if (e.target.closest?.('[data-savecol-portal="true"]')) return;
      setMenuOpen(false);
      setSubmenuOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setSubmenuOpen(false);
      }
    }
    document.addEventListener('pointerdown', onPointer, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  function flashDone(text) {
    setDoneLabel(text);
    setDone(true);
    setTimeout(() => setDone(false), 1800);
  }

  function handleNewCollection() {
    setMenuOpen(false);
    setSubmenuOpen(false);
    const baseName = String(place?.name || 'Koleksiyon').slice(0, 40);
    // Otomatik isim: listing adı veya zamansal "Koleksiyon"; sonra istenirse rename
    const c = createCollection({ name: baseName, isPublic: false });
    if (!c) return;
    addPlaceToCollection(c.id, place);
    flashDone(`${c.name} koleksiyonu oluşturuldu`);
  }

  function handleAppend(collection) {
    addPlaceToCollection(collection.id, place);
    setMenuOpen(false);
    setSubmenuOpen(false);
    flashDone(`${collection.name} koleksiyonuna eklendi`);
  }

  const portal =
    mounted && menuOpen && typeof document !== 'undefined'
      ? createPortal(
          <>
            <div
              ref={menuRef}
              data-savecol-portal="true"
              style={{ ...s.menu, top: menuPos.top, left: menuPos.left }}
              role="menu"
            >
              <button
                type="button"
                style={s.menuItem}
                role="menuitem"
                onClick={handleNewCollection}
              >
                <span style={s.menuIcon} aria-hidden>
                  <Plus size={13} strokeWidth={2.4} />
                </span>
                <span style={s.menuLabel}>Yeni Koleksiyon</span>
              </button>

              <button
                type="button"
                style={{ ...s.menuItem, ...(submenuOpen ? s.menuItemActive : {}) }}
                role="menuitem"
                aria-haspopup="menu"
                aria-expanded={submenuOpen}
                onClick={() => setSubmenuOpen((v) => !v)}
                onMouseEnter={() => setSubmenuOpen(true)}
              >
                <span style={s.menuIcon} aria-hidden>
                  <Bookmark size={13} strokeWidth={2.2} />
                </span>
                <span style={s.menuLabel}>Mevcut Koleksiyon</span>
                <ChevronRight size={13} strokeWidth={2.2} aria-hidden style={{ marginLeft: 'auto' }} />
              </button>
            </div>

            {submenuOpen ? (
              <div
                data-savecol-portal="true"
                style={{ ...s.submenu, top: submenuPos.top, left: submenuPos.left }}
                role="menu"
              >
                <div style={s.submenuHead}>Koleksiyonlarınız</div>
                {collections.length === 0 ? (
                  <div style={s.submenuEmpty}>Henüz koleksiyon yok</div>
                ) : (
                  collections.slice(0, 8).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      role="menuitem"
                      style={s.submenuItem}
                      onClick={() => handleAppend(c)}
                    >
                      <span style={s.submenuName}>{c.name}</span>
                      <span style={s.submenuMeta}>
                        {c.places.length} yer{c.isPublic ? ' · Herkese açık' : ''}
                      </span>
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </>,
          document.body
        )
      : null;

  return (
    <div ref={wrapRef} style={s.wrap}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => {
          if (done) return;
          setMenuOpen((v) => !v);
          setSubmenuOpen(false);
        }}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        title={label}
        style={{
          ...s.btn,
          ...(done ? s.btnDone : s.btnIdle),
        }}
      >
        {done ? (
          <BookmarkCheck size={14} strokeWidth={2.4} aria-hidden />
        ) : (
          <Bookmark size={14} strokeWidth={2.2} aria-hidden />
        )}
      </button>
      {done && doneLabel ? (
        <div style={s.toast} role="status">{doneLabel}</div>
      ) : null}
      {portal}
    </div>
  );
}

const s = {
  wrap: { position: 'relative', display: 'inline-block' },
  btn: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    transition: 'background var(--duration-fast) var(--ease-out), border-color var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out)',
  },
  btnIdle: {
    background: 'rgba(31, 77, 92, 0.06)',
    borderColor: 'rgba(31, 77, 92, 0.32)',
    color: 'var(--ta-accent)',
  },
  btnDone: {
    background: 'var(--ta-accent)',
    borderColor: 'var(--ta-accent)',
    color: '#fff',
    cursor: 'default',
  },
  toast: {
    position: 'absolute',
    top: -32,
    right: 0,
    padding: '4px 10px',
    background: 'var(--ta-ink)',
    color: '#fff',
    fontFamily: 'var(--font-sans)',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.04em',
    borderRadius: 'var(--radius-pill)',
    whiteSpace: 'nowrap',
    boxShadow: '0 6px 16px rgba(15,23,32,0.20)',
    pointerEvents: 'none',
    zIndex: 30,
  },
  menu: {
    position: 'fixed',
    minWidth: 220,
    padding: 4,
    background: '#fff',
    borderRadius: 'var(--radius-md)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(31, 77, 92, 0.18)',
    boxShadow: '0 12px 32px rgba(15, 23, 32, 0.18)',
    zIndex: 2147483600,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  menuItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 10px',
    background: 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-xs)',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'var(--font-sans)',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--ta-ink)',
    lineHeight: 1.2,
    transition: 'background var(--duration-fast) var(--ease-out)',
  },
  menuItemActive: { background: 'rgba(31, 77, 92, 0.06)' },
  menuIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 22,
    height: 22,
    borderRadius: 'var(--radius-xs)',
    background: 'rgba(31, 77, 92, 0.08)',
    color: 'var(--ta-accent)',
    flexShrink: 0,
  },
  menuLabel: {
    flex: 1,
    minWidth: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  submenu: {
    position: 'fixed',
    minWidth: 280,
    maxHeight: 320,
    overflowY: 'auto',
    padding: 4,
    background: '#fff',
    borderRadius: 'var(--radius-md)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(31, 77, 92, 0.18)',
    boxShadow: '0 12px 32px rgba(15, 23, 32, 0.18)',
    zIndex: 2147483601,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  submenuHead: {
    padding: '6px 10px 4px',
    fontFamily: 'var(--font-sans)',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--ta-ink-muted)',
  },
  submenuEmpty: {
    padding: '8px 10px 12px',
    fontFamily: 'var(--font-sans)',
    fontSize: 12,
    color: 'var(--ta-ink-muted)',
  },
  submenuItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
    padding: '8px 10px',
    background: 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-xs)',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'var(--font-sans)',
    transition: 'background var(--duration-fast) var(--ease-out)',
  },
  submenuName: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--ta-ink)',
    lineHeight: 1.3,
    maxWidth: 240,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  submenuMeta: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--ta-ink-muted)',
  },
};
