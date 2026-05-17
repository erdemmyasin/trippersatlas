'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { findMergedTripById } from '@/lib/tripMerge';

/**
 * Hızlı plan ekranlarının üstünde küçük "Aktif plan" şeridi — kullanıcı
 * /trips/{id} detaydan ?planId=... ile geldiğinde gösterilir. Buradan eklenen
 * her listing TripifyButton'da aktif plana yönlendirilir.
 *
 * Props:
 *  - tripId: aktif planın id'si
 */
export default function ActivePlanBanner({ tripId }) {
  const [trip, setTrip] = useState(null);
  useEffect(() => {
    if (!tripId) return;
    setTrip(findMergedTripById(tripId));
  }, [tripId]);
  if (!tripId || !trip) return null;
  return (
    <Link href={`/trips/${encodeURIComponent(tripId)}`} style={s.wrap}>
      <ChevronLeft size={14} strokeWidth={2.4} aria-hidden style={{ flexShrink: 0 }} />
      <span style={s.eyebrow}>Aktif Plan</span>
      <span style={s.sep} aria-hidden>·</span>
      <span style={s.name}>{trip.name}</span>
      {trip.destination ? (
        <>
          <span style={s.sep} aria-hidden>·</span>
          <span style={s.dest}>{trip.destination}</span>
        </>
      ) : null}
      <span style={s.hint}>Seçtiklerin doğrudan buraya eklenir</span>
    </Link>
  );
}

const s = {
  wrap: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 14px',
    marginBottom: 12,
    background: 'rgba(31, 77, 92, 0.06)',
    border: '1px solid rgba(31, 77, 92, 0.28)',
    borderRadius: 999,
    color: 'var(--ta-ink)',
    fontFamily: 'var(--font-sans)',
    fontSize: 12,
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'background var(--duration-fast) var(--ease-out), border-color var(--duration-fast) var(--ease-out)',
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: 'var(--ta-accent)',
  },
  sep: {
    color: 'rgba(31, 77, 92, 0.40)',
  },
  name: {
    fontWeight: 700,
    color: 'var(--ta-ink)',
  },
  dest: {
    color: 'var(--ta-ink-muted)',
  },
  hint: {
    marginLeft: 6,
    paddingLeft: 8,
    borderLeft: '1px solid rgba(31, 77, 92, 0.22)',
    color: 'var(--ta-ink-muted)',
    fontSize: 11,
  },
};
