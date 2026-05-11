'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Lock, MoreHorizontal, Trash2 } from 'lucide-react';
import { deleteCollection } from '@/lib/savedCollections';

/**
 * Resim 2 — Koleksiyon listesi grid (3-up).
 * Her kart: 2-pane thumbnail + private kilit ikonu (sol üst) + ⋮ context menü (sağ üst, hover).
 * Tıklanınca koleksiyon detay sayfasına gider.
 */
export default function CollectionsGrid({ collections, onChange }) {
  if (!collections?.length) return null;
  return (
    <div style={s.grid}>
      {collections.map((c) => (
        <CollectionCard key={c.id} collection={c} onChange={onChange} />
      ))}
    </div>
  );
}

function CollectionCard({ collection, onChange }) {
  const [hover, setHover] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    function onDoc(e) {
      if (menuRef.current?.contains(e.target)) return;
      setMenuOpen(false);
    }
    document.addEventListener('pointerdown', onDoc, true);
    return () => document.removeEventListener('pointerdown', onDoc, true);
  }, [menuOpen]);

  const placeCount = collection.places?.length || 0;
  const cover = collection.places?.[0]?.imageUrl || '';
  const cover2 = collection.places?.[1]?.imageUrl || '';
  const cover3 = collection.places?.[2]?.imageUrl || '';

  function handleDelete(e) {
    e.preventDefault();
    e.stopPropagation();
    deleteCollection(collection.id);
    setMenuOpen(false);
    onChange?.();
  }

  return (
    <div
      style={s.cardWrap}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setMenuOpen(false);
      }}
    >
      <Link href={`/saved/${collection.id}`} style={s.cardLink}>
        <div style={s.thumbs}>
          <div style={{ ...s.thumbBig, ...(cover ? { backgroundImage: `url(${cover})` } : {}) }} />
          <div style={s.thumbCol}>
            <div style={{ ...s.thumbSm, ...(cover2 ? { backgroundImage: `url(${cover2})` } : {}) }} />
            <div style={{ ...s.thumbSm, ...(cover3 ? { backgroundImage: `url(${cover3})` } : {}) }} />
          </div>

          {!collection.isPublic ? (
            <span style={s.lockBadge} aria-label="Özel koleksiyon">
              <Lock size={14} strokeWidth={2.2} color="#fff" />
            </span>
          ) : null}

          {hover ? (
            <div style={s.menuWrap} ref={menuRef}>
              <button
                type="button"
                style={s.menuTrigger}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMenuOpen((v) => !v);
                }}
                aria-label="Seçenekler"
                aria-expanded={menuOpen}
              >
                <MoreHorizontal size={16} strokeWidth={2.4} color="var(--ta-ink)" />
              </button>
              {menuOpen ? (
                <div style={s.menu} role="menu">
                  <button type="button" style={{ ...s.menuItem, ...s.menuItemDanger }} onClick={handleDelete}>
                    <Trash2 size={14} strokeWidth={2} aria-hidden />
                    Koleksiyonu sil
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </Link>

      <div style={s.meta}>
        <Link href={`/saved/${collection.id}`} style={s.metaLink}>
          <div style={s.metaTitle}>{collection.name}</div>
          <div style={s.metaSub}>{placeCount} yer</div>
        </Link>
      </div>
    </div>
  );
}

const s = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 'var(--space-6)',
  },
  cardWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  },
  cardLink: {
    display: 'block',
    textDecoration: 'none',
    color: 'inherit',
  },
  thumbs: {
    position: 'relative',
    display: 'grid',
    gridTemplateColumns: '1.4fr 1fr',
    gap: 'var(--space-2)',
    aspectRatio: '4 / 3',
    width: '100%',
  },
  thumbBig: {
    background: '#ececec',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    borderRadius: 'var(--radius-md)',
  },
  thumbCol: {
    display: 'grid',
    gridTemplateRows: '1fr 1fr',
    gap: 'var(--space-2)',
    minHeight: 0,
  },
  thumbSm: {
    background: '#ececec',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    borderRadius: 'var(--radius-md)',
  },
  lockBadge: {
    position: 'absolute',
    top: 'var(--space-3)',
    left: 'var(--space-3)',
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: 'rgba(15,23,32,.55)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
  },
  menuWrap: {
    position: 'absolute',
    top: 'var(--space-3)',
    right: 'var(--space-3)',
  },
  menuTrigger: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    border: 'none',
    background: '#fff',
    boxShadow: '0 2px 8px rgba(0,0,0,.18)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menu: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    right: 0,
    minWidth: 180,
    background: '#fff',
    borderRadius: 'var(--radius-md)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(0,0,0,.08)',
    boxShadow: '0 8px 28px rgba(0,0,0,.18)',
    padding: 'var(--space-1)',
    zIndex: 'var(--z-dropdown)',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    width: '100%',
    padding: 'var(--space-2) var(--space-3)',
    border: 'none',
    background: 'transparent',
    borderRadius: 'var(--radius-xs)',
    fontSize: 'var(--text-base)',
    fontFamily: 'var(--font-sans)',
    color: 'var(--ta-ink)',
    cursor: 'pointer',
    textAlign: 'left',
  },
  menuItemDanger: {
    color: 'var(--ta-danger)',
  },
  meta: {
    paddingTop: 'var(--space-1)',
  },
  metaLink: {
    textDecoration: 'none',
    color: 'inherit',
    display: 'block',
  },
  metaTitle: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-md)',
    fontWeight: 'var(--fw-bold)',
    color: 'var(--ta-ink)',
    lineHeight: 1.3,
  },
  metaSub: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    color: 'var(--ta-ink-muted)',
    marginTop: 'var(--space-px)',
  },
};
