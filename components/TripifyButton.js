'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Check, BookmarkPlus } from 'lucide-react';
import { createTripFromService } from '@/lib/quickPlanToTrip';

/**
 * Herhangi bir hızlı plan listing kartına eklenir — tek tıkla servisi
 * yeni bir gezi olarak kaydeder ve kullanıcıyı isterse o geziye yönlendirir.
 *
 * Props:
 *  - serviceType: 'stay' | 'flight' | 'bus' | 'car' | 'activity' | 'tour' | 'transfer'
 *  - listing: { name, location, price, type, imageUrl, ... }
 *  - destination, startDate, endDate, tripName — opsiyonel ipuçları
 *  - autoBook (default: true) — gerçek rezervasyon yapıldıysa true
 *  - navigateAfter (default: true) — başarılı kayıttan sonra /trips/{id}'e git
 *  - variant: 'primary' | 'ghost' — görsel ton
 */
export default function TripifyButton({
  serviceType,
  listing,
  destination,
  startDate,
  endDate,
  tripName,
  autoBook = true,
  navigateAfter = true,
  variant = 'primary',
  label = 'Geziye dönüştür',
  successLabel = 'Geziye eklendi',
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [tripId, setTripId] = useState(null);

  function handleClick() {
    if (pending || done) return;
    setPending(true);
    try {
      const id = createTripFromService({
        serviceType,
        listing,
        destination,
        startDate,
        endDate,
        tripName,
        autoBook,
      });
      if (!id) {
        setPending(false);
        return;
      }
      setTripId(id);
      setDone(true);
      setPending(false);
      if (navigateAfter) {
        // Hafif gecikme: kullanıcı "✓ Geziye eklendi" tikini görsün
        setTimeout(() => {
          router.push(`/trips/${encodeURIComponent(id)}`);
        }, 500);
      }
    } catch {
      setPending(false);
    }
  }

  const style = {
    ...s.btn,
    ...(variant === 'ghost' ? s.btnGhost : s.btnPrimary),
    ...(done ? s.btnDone : {}),
    ...(pending ? s.btnPending : {}),
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending || done}
      style={style}
      aria-label={done ? successLabel : label}
      title={done && tripId ? 'Geziye git' : label}
    >
      {done ? (
        <>
          <Check size={13} strokeWidth={2.6} aria-hidden />
          {successLabel}
        </>
      ) : (
        <>
          <BookmarkPlus size={13} strokeWidth={2.2} aria-hidden />
          {label}
        </>
      )}
    </button>
  );
}

const s = {
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '6px 12px',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--fw-bold)',
    letterSpacing: '0.02em',
    borderRadius: 'var(--radius-pill)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background var(--duration-fast) var(--ease-out), border-color var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out)',
  },
  btnPrimary: {
    background: 'rgba(201,168,106,0.10)',
    borderColor: 'rgba(201,168,106,0.42)',
    color: '#9C7E3F',
  },
  btnGhost: {
    background: 'transparent',
    borderColor: 'rgba(31,77,92,0.20)',
    color: 'var(--ta-ink)',
  },
  btnPending: {
    opacity: 0.65,
    cursor: 'wait',
  },
  btnDone: {
    background: 'rgba(31,77,92,0.10)',
    borderColor: 'var(--ta-accent)',
    color: 'var(--ta-accent)',
    cursor: 'default',
  },
};
