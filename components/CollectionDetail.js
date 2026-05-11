'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Globe,
  HeartHandshake,
  Lock,
  MoreHorizontal,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  addPlaceToCollection,
  deleteCollection,
  getCollection,
  removePlaceFromCollection,
  subscribeCollections,
  updateCollection,
} from '@/lib/savedCollections';
import EmptyState from '@/components/EmptyState';
import AddPlacesModal from '@/components/AddPlacesModal';

/**
 * Resim 3 — Koleksiyon detay görünümü.
 * - Düzenlenebilir başlık
 * - Meta satırı: N yer · 🔒 Private | 🌐 Public
 * - Kullanıcı avatarı
 * - Grid: "Yer ekle" boş kartı + her place için kart
 *
 * @param {string} id  Collection ID (route param)
 * @param {() => void} [onRequestAddPlaces]  "Yer ekle" tıklamasında çağrılır;
 *   verilmezse modal yerine geçici uyarı yapılır.
 */
export default function CollectionDetail({ id, onRequestAddPlaces }) {
  const [collection, setCollection] = useState(() => getCollection(id));
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    setCollection(getCollection(id));
    const unsub = subscribeCollections(() => setCollection(getCollection(id)));
    return unsub;
  }, [id]);

  if (!collection) {
    return (
      <EmptyState
        icon={HeartHandshake}
        title="Koleksiyon bulunamadı"
        description="Bu koleksiyon silinmiş veya hiç mevcut olmamış olabilir."
        action={
          <Link href="/saved" style={s.backLink}>
            <ArrowLeft size={16} strokeWidth={2.2} />
            Tüm koleksiyonlar
          </Link>
        }
      />
    );
  }

  const placeCount = collection.places.length;

  function startEdit() {
    setDraftName(collection.name);
    setEditing(true);
  }
  function commitEdit() {
    const v = draftName.trim();
    if (v && v !== collection.name) {
      updateCollection(id, { name: v });
    }
    setEditing(false);
  }

  function togglePrivacy() {
    updateCollection(id, { isPublic: !collection.isPublic });
    setMenuOpen(false);
  }

  function handleDelete() {
    if (typeof window !== 'undefined' && !window.confirm('Koleksiyonu silmek istediğine emin misin?')) return;
    deleteCollection(id);
    setMenuOpen(false);
    if (typeof window !== 'undefined') {
      window.location.href = '/saved';
    }
  }

  function handleAdd() {
    if (onRequestAddPlaces) onRequestAddPlaces(collection);
    else setAddOpen(true);
  }

  return (
    <div style={s.wrap}>
      <div style={s.topRow}>
        <Link href="/saved" style={s.backLink}>
          <ArrowLeft size={18} strokeWidth={2.2} />
          Koleksiyonlar
        </Link>

        <div style={{ position: 'relative' }}>
          <button
            type="button"
            style={s.iconBtn}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Seçenekler"
            aria-expanded={menuOpen}
          >
            <MoreHorizontal size={18} strokeWidth={2.2} color="var(--ta-ink)" />
          </button>
          {menuOpen ? (
            <div style={s.menu}>
              <button type="button" style={s.menuItem} onClick={togglePrivacy}>
                {collection.isPublic ? <Lock size={14} strokeWidth={2} /> : <Globe size={14} strokeWidth={2} />}
                {collection.isPublic ? 'Özele al' : 'Açığa al'}
              </button>
              <button type="button" style={{ ...s.menuItem, ...s.menuItemDanger }} onClick={handleDelete}>
                <Trash2 size={14} strokeWidth={2} />
                Koleksiyonu sil
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div style={s.head}>
        {editing ? (
          <input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitEdit();
              if (e.key === 'Escape') setEditing(false);
            }}
            maxLength={50}
            autoFocus
            style={s.titleInput}
          />
        ) : (
          <h1
            style={s.title}
            onClick={startEdit}
            title="Başlığı düzenle"
            tabIndex={0}
            role="button"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                startEdit();
              }
            }}
          >
            {collection.name}
          </h1>
        )}

        <div style={s.metaRow}>
          <span>{placeCount} yer</span>
          <span style={s.metaSep}>·</span>
          {collection.isPublic ? (
            <span style={s.privacyChip}>
              <Globe size={13} strokeWidth={2.2} />
              Açık
            </span>
          ) : (
            <span style={s.privacyChip}>
              <Lock size={13} strokeWidth={2.2} />
              Özel
            </span>
          )}
        </div>
      </div>

      <div style={s.grid}>
        <button type="button" style={s.addTile} onClick={handleAdd}>
          <span style={s.addTileIcon}>
            <HeartHandshake size={36} strokeWidth={1.5} color="var(--ta-ink)" />
            <Plus size={14} strokeWidth={3} color="var(--ta-ink)" style={s.addTilePlus} />
          </span>
          <span style={s.addTileLabel}>Yer ekle</span>
        </button>

        {collection.places.map((p) => (
          <PlaceCard
            key={p.id}
            place={p}
            onRemove={() => {
              if (typeof window !== 'undefined' && !window.confirm(`"${p.name}" listeden kaldırılsın mı?`)) return;
              removePlaceFromCollection(id, p.id);
            }}
          />
        ))}
      </div>

      <AddPlacesModal
        open={addOpen}
        collection={collection}
        onClose={() => setAddOpen(false)}
        onAdd={(place) => addPlaceToCollection(id, place)}
      />
    </div>
  );
}

function PlaceCard({ place, onRemove }) {
  return (
    <div style={s.placeCard}>
      <div
        style={{
          ...s.placeImg,
          ...(place.imageUrl ? { backgroundImage: `url(${place.imageUrl})` } : {}),
        }}
      >
        <button type="button" style={s.placeRemove} onClick={onRemove} aria-label="Kaldır">
          <Trash2 size={14} strokeWidth={2.2} color="var(--ta-ink)" />
        </button>
      </div>
      <div style={s.placeMeta}>
        <div style={s.placeName}>{place.name || 'Yer'}</div>
        {(place.city || place.category) ? (
          <div style={s.placeSub}>
            {place.category ? `${place.category}` : ''}
            {place.category && place.city ? ' · ' : ''}
            {place.city || ''}
          </div>
        ) : null}
      </div>
    </div>
  );
}

const s = {
  wrap: {
    maxWidth: 1180,
    margin: '0 auto',
    padding: 'var(--space-7) var(--space-6) var(--space-9)',
    boxSizing: 'border-box',
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 'var(--space-4)',
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--fw-semibold)',
    color: 'var(--ta-ink-muted)',
    textDecoration: 'none',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(0,0,0,.10)',
    background: '#fff',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menu: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    right: 0,
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
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    width: '100%',
    padding: 'var(--space-2) var(--space-3)',
    border: 'none',
    background: 'transparent',
    borderRadius: 'var(--radius-xs)',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-base)',
    color: 'var(--ta-ink)',
    cursor: 'pointer',
    textAlign: 'left',
  },
  menuItemDanger: { color: 'var(--ta-danger)' },
  head: {
    marginBottom: 'var(--space-7)',
  },
  title: {
    display: 'inline-block',
    fontFamily: 'var(--font-serif)',
    fontWeight: 'var(--fw-bold)',
    fontSize: 'var(--text-3xl)',
    lineHeight: 'var(--text-3xl-lh)',
    color: 'var(--ta-ink)',
    letterSpacing: '-0.02em',
    cursor: 'text',
    padding: 'var(--space-1) var(--space-2)',
    margin: 'calc(-1 * var(--space-1)) calc(-1 * var(--space-2))',
    borderRadius: 'var(--radius-sm)',
    transition: 'background var(--duration-fast) var(--ease-out)',
    outline: 'none',
    maxWidth: '100%',
    wordBreak: 'break-word',
  },
  titleInput: {
    width: '100%',
    maxWidth: 540,
    padding: 'var(--space-2) var(--space-3)',
    fontFamily: 'var(--font-serif)',
    fontWeight: 'var(--fw-bold)',
    fontSize: 'var(--text-3xl)',
    lineHeight: 'var(--text-3xl-lh)',
    color: 'var(--ta-ink)',
    letterSpacing: '-0.02em',
    borderRadius: 'var(--radius-md)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'var(--ta-accent)',
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    marginTop: 'var(--space-3)',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-md)',
    color: 'var(--ta-ink-muted)',
  },
  metaSep: { color: 'var(--ta-ink-subtle)' },
  privacyChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-1)',
    color: 'var(--ta-ink-muted)',
    fontWeight: 'var(--fw-semibold)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: 'var(--space-4)',
  },
  addTile: {
    aspectRatio: '1 / 1',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--ta-muted-bg)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(0,0,0,.06)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-3)',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    color: 'var(--ta-ink-muted)',
    transition: 'background var(--duration-fast) var(--ease-out), transform var(--duration-fast) var(--ease-out)',
  },
  addTileIcon: {
    position: 'relative',
    display: 'inline-flex',
  },
  addTilePlus: {
    position: 'absolute',
    top: -2,
    right: -6,
    background: '#fff',
    borderRadius: '50%',
    padding: 1,
  },
  addTileLabel: {
    fontSize: 'var(--text-md)',
    fontWeight: 'var(--fw-semibold)',
    color: 'var(--ta-ink-muted)',
  },
  placeCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  },
  placeImg: {
    aspectRatio: '1 / 1',
    borderRadius: 'var(--radius-lg)',
    background: '#ececec',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative',
  },
  placeRemove: {
    position: 'absolute',
    top: 'var(--space-3)',
    right: 'var(--space-3)',
    width: 30,
    height: 30,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(255,255,255,.92)',
    boxShadow: '0 2px 8px rgba(0,0,0,.15)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeMeta: { paddingLeft: 'var(--space-1)' },
  placeName: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-md)',
    fontWeight: 'var(--fw-bold)',
    color: 'var(--ta-ink)',
  },
  placeSub: {
    marginTop: 'var(--space-px)',
    fontSize: 'var(--text-sm)',
    color: 'var(--ta-ink-muted)',
  },
};
