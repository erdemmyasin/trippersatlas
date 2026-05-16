'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BookHeart, MapPinned } from 'lucide-react';
import { getTrips } from '@/lib/tripStore';
import { entryCounts, listEntries, subscribeJournal } from '@/lib/tripJournal';
import EmptyState from '@/components/EmptyState';

/**
 * Profil sayfasında "Geziler" sekmesi: kullanıcının tüm gezilerini grid olarak listeler.
 * Her kart: cover (en son anının fotosu / placeholder gradient) + başlık + tarih aralığı +
 * "N anı" rozeti. Tıklanınca trip detayına gider.
 */
export default function ProfileTripsGrid() {
  const [trips, setTrips] = useState([]);
  const [counts, setCounts] = useState({});
  const [coverByTripId, setCoverByTripId] = useState({});

  useEffect(() => {
    function refresh() {
      const ts = getTrips();
      setTrips(ts);
      setCounts(entryCounts());
      // Her trip için varsa son foto'yu kapak olarak kullan
      const covers = {};
      for (const t of ts) {
        const entries = listEntries(t.id);
        const lastPhoto = [...entries].reverse().find((e) => e.mediaType === 'photo' && e.mediaUrl);
        if (lastPhoto) covers[t.id] = lastPhoto.mediaUrl;
        else if (t.imageUrl) covers[t.id] = t.imageUrl;
      }
      setCoverByTripId(covers);
    }
    refresh();
    const unsub = subscribeJournal(refresh);
    return unsub;
  }, []);

  if (trips.length === 0) {
    return (
      <EmptyState
        icon={MapPinned}
        title="Henüz gezi yok"
        description="İlk seyahat planını oluştur; tamamlandıkça anılarını günlüğüne ekle, geçmişin burada toplansın."
        action={
          <Link href="/trips" style={s.primaryBtn}>
            Geziler sayfasına git
          </Link>
        }
      />
    );
  }

  return (
    <div style={s.grid}>
      {trips.map((t) => (
        <Link key={t.id} href={`/trips/${t.id}`} style={s.cardLink}>
          <article style={s.card}>
            <div
              style={{
                ...s.cover,
                ...(coverByTripId[t.id]
                  ? { backgroundImage: `url(${coverByTripId[t.id]})` }
                  : { background: defaultGradient(t.destination) }),
              }}
            >
              {!coverByTripId[t.id] ? (
                <div style={s.coverInitial}>{initials(t.destination || t.name)}</div>
              ) : null}
              {(counts[t.id] || 0) > 0 ? (
                <span style={s.entryBadge}>
                  <BookHeart size={12} strokeWidth={2.4} />
                  {counts[t.id]} anı
                </span>
              ) : null}
            </div>
            <div style={s.meta}>
              <div style={s.title}>{t.name || 'Yeni Gezi'}</div>
              <div style={s.sub}>
                {t.destination ? <span>{t.destination}</span> : null}
                {(t.startDate || t.endDate) ? (
                  <>
                    <span style={s.sep}>·</span>
                    <span>{formatDateRange(t.startDate, t.endDate, t.month, t.days)}</span>
                  </>
                ) : t.month ? (
                  <>
                    <span style={s.sep}>·</span>
                    <span>{t.month}</span>
                  </>
                ) : null}
              </div>
            </div>
          </article>
        </Link>
      ))}
    </div>
  );
}

function initials(s) {
  const parts = String(s || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'A';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function defaultGradient(destination) {
  // Destinasyona deterministik bir gradient ata (palet sınırlı, marka teal-slate ailesi)
  const seed = String(destination || '').length % 4;
  const palettes = [
    'linear-gradient(135deg, #1F4D5C 0%, #3A6F84 100%)',
    'linear-gradient(135deg, #2f8f6b 0%, #1F4D5C 100%)',
    'linear-gradient(135deg, #4a6278 0%, #5f7a94 100%)',
    'linear-gradient(135deg, #15232f 0%, #4a6278 100%)',
  ];
  return palettes[seed];
}

function formatDateRange(startIso, endIso, monthFallback, daysFallback) {
  if (startIso && endIso) {
    try {
      const s = new Date(`${String(startIso).slice(0, 10)}T12:00:00`);
      const e = new Date(`${String(endIso).slice(0, 10)}T12:00:00`);
      if (!Number.isNaN(s.getTime()) && !Number.isNaN(e.getTime())) {
        const sStr = s.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
        const eStr = e.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
        return `${sStr} – ${eStr}`;
      }
    } catch {
      /* ignore */
    }
  }
  if (monthFallback) {
    return daysFallback ? `${monthFallback} · ${daysFallback} gün` : monthFallback;
  }
  return daysFallback ? `${daysFallback} gün` : '';
}

const s = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 'var(--space-5)',
  },
  cardLink: {
    textDecoration: 'none',
    color: 'inherit',
    display: 'block',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
    background: 'transparent',
  },
  cover: {
    position: 'relative',
    aspectRatio: '4 / 3',
    borderRadius: 'var(--radius-lg)',
    background: '#ececec',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(255,255,255,.85)',
  },
  coverInitial: {
    fontFamily: 'var(--font-serif)',
    fontWeight: 'var(--fw-bold)',
    fontSize: 'var(--text-3xl)',
    letterSpacing: '0.04em',
    color: 'rgba(255,255,255,.92)',
    textShadow: '0 2px 6px rgba(0,0,0,.18)',
  },
  entryBadge: {
    position: 'absolute',
    top: 'var(--space-3)',
    right: 'var(--space-3)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-1)',
    padding: 'var(--space-1) var(--space-2)',
    borderRadius: 'var(--radius-pill)',
    background: 'rgba(15,23,32,.65)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    color: '#fff',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--fw-bold)',
  },
  meta: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
    paddingLeft: 'var(--space-1)',
  },
  title: {
    fontFamily: 'var(--font-serif)',
    fontSize: 17,
    fontWeight: 'var(--fw-bold)',
    color: 'var(--ta-ink)',
    lineHeight: 1.2,
    letterSpacing: '-0.01em',
  },
  sub: {
    display: 'inline-flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 'var(--space-1)',
    fontFamily: 'var(--font-sans)',
    fontSize: 11,
    fontWeight: 'var(--fw-bold)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--ta-ink-muted)',
  },
  sep: { color: 'var(--ta-ink-subtle)' },
  primaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-3) var(--space-5)',
    borderRadius: 'var(--radius-pill)',
    border: 'none',
    background: 'var(--ta-ink)',
    color: '#fff',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-md)',
    fontWeight: 'var(--fw-bold)',
    cursor: 'pointer',
    textDecoration: 'none',
  },
};
