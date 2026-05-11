'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookHeart,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MapPin,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';

/**
 * Tam-ekran anı viewer — bir TripJournal entry'sine tıklanınca açılır.
 *
 * Props:
 *   open
 *   entries        — sıralı entry array (TripJournal'in liste'si)
 *   activeId       — açılışta hangi entry odaklı
 *   onClose
 *   onEdit(entry)
 *   onDelete(entry)
 *
 * Kontrol:
 *   ←/→ tuşları, sol/sağ click ile entry geçişi
 *   Esc ile kapatma
 */
export default function JournalEntryViewer({
  open,
  entries = [],
  activeId,
  onClose,
  onEdit,
  onDelete,
}) {
  const [index, setIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const i = entries.findIndex((e) => e.id === activeId);
    setIndex(i >= 0 ? i : 0);
    setMenuOpen(false);
  }, [open, activeId, entries]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') {
        onClose?.();
        return;
      }
      if (e.key === 'ArrowLeft') {
        setIndex((i) => Math.max(0, i - 1));
      } else if (e.key === 'ArrowRight') {
        setIndex((i) => Math.min(entries.length - 1, i + 1));
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, entries.length, onClose]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    function onDoc(e) {
      if (menuRef.current?.contains(e.target)) return;
      setMenuOpen(false);
    }
    document.addEventListener('pointerdown', onDoc, true);
    return () => document.removeEventListener('pointerdown', onDoc, true);
  }, [menuOpen]);

  const entry = entries[index];
  const hasPrev = index > 0;
  const hasNext = index < entries.length - 1;
  const dayLabel = useMemo(() => formatDay(entry?.capturedAt), [entry?.capturedAt]);

  if (!open || !entry) return null;

  const isPhoto = entry.mediaType === 'photo' && entry.mediaUrl;

  return (
    <div
      style={s.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Anı görüntüleyici"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div style={s.shell}>
        <header style={s.head}>
          <button type="button" style={s.iconBtn} onClick={onClose} aria-label="Kapat">
            <X size={18} strokeWidth={2.4} color="#fff" />
          </button>
          <div style={s.headTitle}>
            <Calendar size={14} strokeWidth={2.2} aria-hidden />
            {dayLabel}
            <span style={s.headSep}>·</span>
            <span style={s.headIndex}>{index + 1} / {entries.length}</span>
          </div>
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button
              type="button"
              style={s.iconBtn}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Seçenekler"
              aria-expanded={menuOpen}
            >
              <MoreHorizontal size={18} strokeWidth={2.4} color="#fff" />
            </button>
            {menuOpen ? (
              <div style={s.menu}>
                <button
                  type="button"
                  style={s.menuItem}
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit?.(entry);
                  }}
                >
                  <Pencil size={14} strokeWidth={2.2} aria-hidden />
                  Düzenle
                </button>
                <button
                  type="button"
                  style={{ ...s.menuItem, ...s.menuItemDanger }}
                  onClick={() => {
                    if (typeof window !== 'undefined' && !window.confirm('Bu anıyı silmek istediğine emin misin?')) return;
                    setMenuOpen(false);
                    onDelete?.(entry);
                  }}
                >
                  <Trash2 size={14} strokeWidth={2.2} aria-hidden />
                  Sil
                </button>
              </div>
            ) : null}
          </div>
        </header>

        <div style={s.stage}>
          {/* Sol ok */}
          <button
            type="button"
            style={{ ...s.navBtn, left: 'var(--space-3)', visibility: hasPrev ? 'visible' : 'hidden' }}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            aria-label="Önceki anı"
          >
            <ChevronLeft size={22} strokeWidth={2.4} color="#fff" />
          </button>

          {isPhoto ? (
            <img src={entry.mediaUrl} alt={entry.caption || 'Anı'} style={s.photo} />
          ) : (
            <div style={s.notePane}>
              <BookHeart size={48} strokeWidth={1.4} color="rgba(255,255,255,.55)" aria-hidden />
              <p style={s.noteText}>{entry.caption || '—'}</p>
            </div>
          )}

          {/* Sağ ok */}
          <button
            type="button"
            style={{ ...s.navBtn, right: 'var(--space-3)', visibility: hasNext ? 'visible' : 'hidden' }}
            onClick={() => setIndex((i) => Math.min(entries.length - 1, i + 1))}
            aria-label="Sonraki anı"
          >
            <ChevronRight size={22} strokeWidth={2.4} color="#fff" />
          </button>
        </div>

        <footer style={s.foot}>
          {isPhoto && entry.caption ? (
            <p style={s.caption}>{entry.caption}</p>
          ) : null}
          {entry.locationLabel ? (
            <div style={s.locationRow}>
              <MapPin size={14} strokeWidth={2.2} aria-hidden />
              <span>{entry.locationLabel}</span>
            </div>
          ) : null}
        </footer>
      </div>
    </div>
  );
}

function formatDay(iso) {
  if (!iso) return '';
  try {
    const d = new Date(`${String(iso).slice(0, 10)}T12:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('tr-TR', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

const s = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 32, 0.92)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    zIndex: 'var(--z-modal)',
    display: 'flex',
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  shell: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    color: '#fff',
    fontFamily: 'var(--font-sans)',
  },
  head: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-4) var(--space-5)',
    flexShrink: 0,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(255,255,255,.10)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headTitle: {
    flex: 1,
    minWidth: 0,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--fw-semibold)',
    color: 'rgba(255,255,255,.85)',
  },
  headSep: { color: 'rgba(255,255,255,.40)' },
  headIndex: { color: 'rgba(255,255,255,.65)' },
  menu: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    right: 0,
    minWidth: 180,
    background: '#fff',
    color: 'var(--ta-ink)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-1)',
    boxShadow: '0 16px 48px rgba(0,0,0,.35)',
    zIndex: 1,
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
  stage: {
    position: 'relative',
    flex: 1,
    minHeight: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-4)',
  },
  photo: {
    maxWidth: 'min(100%, 1120px)',
    maxHeight: '100%',
    objectFit: 'contain',
    borderRadius: 'var(--radius-md)',
    boxShadow: '0 24px 80px rgba(0,0,0,.45)',
  },
  notePane: {
    maxWidth: 'min(620px, 90%)',
    padding: 'var(--space-7) var(--space-6)',
    borderRadius: 'var(--radius-lg)',
    background: 'rgba(255,255,255,.05)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(255,255,255,.10)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--space-4)',
    textAlign: 'center',
  },
  noteText: {
    margin: 0,
    fontFamily: 'var(--font-serif)',
    fontWeight: 'var(--fw-semibold)',
    fontSize: 'var(--text-2xl)',
    lineHeight: 'var(--text-2xl-lh)',
    color: 'rgba(255,255,255,.92)',
    letterSpacing: '-0.01em',
  },
  navBtn: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: 44,
    height: 44,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(255,255,255,.12)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  foot: {
    flexShrink: 0,
    padding: 'var(--space-4) var(--space-6) var(--space-7)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
    maxWidth: 720,
    width: '100%',
    margin: '0 auto',
  },
  caption: {
    margin: 0,
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-lg)',
    lineHeight: 'var(--text-lg-lh)',
    color: 'rgba(255,255,255,.95)',
  },
  locationRow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-1)',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    color: 'rgba(255,255,255,.70)',
  },
};
