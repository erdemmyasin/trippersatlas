'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookHeart, MapPin, Trash2 } from 'lucide-react';
import { listEntries, removeEntry, subscribeJournal } from '@/lib/tripJournal';
import EmptyState from '@/components/EmptyState';
import JournalEntryViewer from '@/components/JournalEntryViewer';

/**
 * Trip detayında "Günlük" bölümü. Mevcut entry'leri gün gün gruplayıp
 * kronolojik olarak (eski → yeni) listeler. Boş durumda ipucu gösterir.
 *
 * @param {string} tripId
 * @param {string} [tripName]   — empty state metninde gezi adı için
 * @param {() => void} [onAdd]  — "Anı ekle" butonuyla bağlanır
 * @param {(entry) => void} [onEditEntry] — viewer'dan "Düzenle" tıklanınca
 */
export default function TripJournal({ tripId, tripName, onAdd, onEditEntry }) {
  const [entries, setEntries] = useState([]);
  const [viewerEntryId, setViewerEntryId] = useState(null);

  useEffect(() => {
    if (!tripId) return undefined;
    setEntries(listEntries(tripId));
    return subscribeJournal(() => setEntries(listEntries(tripId)));
  }, [tripId]);

  const groupedByDay = useMemo(() => groupByDay(entries), [entries]);

  if (!tripId) return null;

  if (entries.length === 0) {
    return (
      <section style={s.wrap}>
        <header style={s.headRow}>
          <h2 style={s.heading}>Günlük</h2>
        </header>
        <EmptyState
          icon={BookHeart}
          title="Anılarını ölümsüzleştir"
          description={
            tripName
              ? `${tripName} planından foto ve notlar ekle; tarihe göre kendi günlüğünü oluştur.`
              : 'Bu seyahatten foto ve notlar ekle; tarihe göre kendi günlüğünü oluştur.'
          }
          action={
            onAdd ? (
              <button type="button" style={s.primaryBtn} onClick={onAdd}>
                + Anı ekle
              </button>
            ) : null
          }
        />
      </section>
    );
  }

  return (
    <section style={s.wrap}>
      <header style={s.headRow}>
        <h2 style={s.heading}>Günlük</h2>
        <span style={s.count}>{entries.length} anı</span>
        {onAdd ? (
          <button type="button" style={s.primaryBtn} onClick={onAdd}>
            + Anı ekle
          </button>
        ) : null}
      </header>

      <div style={s.timeline}>
        {groupedByDay.map(({ day, dayLabel, items }) => (
          <div key={day} style={s.daySection}>
            <div style={s.dayLabel}>{dayLabel}</div>
            <div style={s.dayGrid}>
              {items.map((e) => (
                <JournalCard
                  key={e.id}
                  entry={e}
                  onOpen={() => setViewerEntryId(e.id)}
                  onRemove={() => {
                    if (typeof window !== 'undefined' && !window.confirm('Bu anıyı silmek istediğine emin misin?')) return;
                    removeEntry(tripId, e.id);
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <JournalEntryViewer
        open={Boolean(viewerEntryId)}
        entries={entries}
        activeId={viewerEntryId}
        onClose={() => setViewerEntryId(null)}
        onEdit={(entry) => {
          setViewerEntryId(null);
          onEditEntry?.(entry);
        }}
        onDelete={(entry) => {
          removeEntry(tripId, entry.id);
          setViewerEntryId(null);
        }}
      />
    </section>
  );
}

function JournalCard({ entry, onOpen, onRemove }) {
  const isPhoto = entry.mediaType === 'photo' && entry.mediaUrl;
  const handleRemove = (e) => {
    e.stopPropagation();
    onRemove?.();
  };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen?.();
    }
  };
  return (
    <article
      style={{ ...s.card, cursor: 'pointer' }}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      aria-label="Anıyı aç"
    >
      {isPhoto ? (
        <div style={{ ...s.media, backgroundImage: `url(${entry.mediaUrl})` }}>
          <button type="button" style={s.removeBtn} onClick={handleRemove} aria-label="Anıyı sil">
            <Trash2 size={14} strokeWidth={2.2} color="var(--ta-ink)" />
          </button>
        </div>
      ) : (
        <div style={s.noteMedia}>
          <BookHeart size={28} strokeWidth={1.8} color="var(--ta-ink-muted)" aria-hidden />
          <button type="button" style={s.removeBtn} onClick={handleRemove} aria-label="Anıyı sil">
            <Trash2 size={14} strokeWidth={2.2} color="var(--ta-ink)" />
          </button>
        </div>
      )}
      <div style={s.cardBody}>
        {entry.caption ? <p style={s.caption}>{entry.caption}</p> : null}
        {entry.locationLabel ? (
          <div style={s.locationRow}>
            <MapPin size={12} strokeWidth={2.2} color="var(--ta-ink-muted)" aria-hidden />
            <span>{entry.locationLabel}</span>
          </div>
        ) : null}
      </div>
    </article>
  );
}

/** capturedAt günü bazlı grupla; her grupta items zaten tarih içinde sıralı geliyor. */
function groupByDay(entries) {
  const map = new Map();
  for (const e of entries) {
    const key = e.capturedAt;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(e);
  }
  return [...map.entries()].map(([day, items]) => ({
    day,
    dayLabel: formatDay(day),
    items,
  }));
}

function formatDay(iso) {
  if (!iso) return '';
  try {
    const d = new Date(`${iso}T12:00:00`);
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
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
    paddingTop: 'var(--space-6)',
    fontFamily: 'var(--font-sans)',
  },
  headRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
  },
  heading: {
    margin: 0,
    fontFamily: 'var(--font-serif)',
    fontWeight: 'var(--fw-bold)',
    fontSize: 'var(--text-2xl)',
    lineHeight: 'var(--text-2xl-lh)',
    color: 'var(--ta-ink)',
    letterSpacing: '-0.01em',
  },
  count: {
    fontSize: 'var(--text-sm)',
    color: 'var(--ta-ink-muted)',
    flex: 1,
  },
  primaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-2) var(--space-4)',
    borderRadius: 'var(--radius-pill)',
    border: 'none',
    background: 'var(--ta-ink)',
    color: '#fff',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--fw-bold)',
    cursor: 'pointer',
    flexShrink: 0,
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-6)',
  },
  daySection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
  },
  dayLabel: {
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--fw-bold)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--ta-ink-muted)',
  },
  dayGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: 'var(--space-4)',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
    background: '#fff',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(0,0,0,.06)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
  },
  media: {
    position: 'relative',
    aspectRatio: '4 / 3',
    background: '#ececec',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },
  noteMedia: {
    position: 'relative',
    aspectRatio: '4 / 3',
    background: 'var(--ta-muted-bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: {
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
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
    padding: 'var(--space-3) var(--space-4) var(--space-4)',
  },
  caption: {
    margin: 0,
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-md)',
    lineHeight: 'var(--text-md-lh)',
    color: 'var(--ta-ink)',
  },
  locationRow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-1)',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    color: 'var(--ta-ink-muted)',
  },
};
