'use client';

import {
  Lightbulb,
  ListOrdered,
  CalendarCheck,
  Image as ImageIcon,
  Info,
  CalendarDays,
} from 'lucide-react';
import QuickPlanMap from '@/components/QuickPlanMap';

const ACTIONS = [
  { id: 'ideas', label: 'Fikirler', Icon: Lightbulb },
  { id: 'itinerary', label: 'Program', Icon: ListOrdered },
  { id: 'bookings', label: 'Rezervasyonlar', Icon: CalendarCheck },
  { id: 'media', label: 'Medya', Icon: ImageIcon },
  { id: 'prefs', label: 'Gezi tercihleri', Icon: Info },
  { id: 'calendar', label: 'Takvim', Icon: CalendarDays },
];

/**
 * Gezi hub sağ sütun: 2×3 araç kartları + harita (referans düzen).
 */
export default function TripHubRightColumn({ geoCenter, mapHeadline = 'Harita', mapSubline = '' }) {
  const mapsKey = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY : '';
  const hasMap =
    mapsKey &&
    geoCenter &&
    Number.isFinite(geoCenter.lat) &&
    Number.isFinite(geoCenter.lng);

  return (
    <div style={s.wrap}>
      <div style={s.grid}>
        {ACTIONS.map(({ id, label, Icon }) => (
          <button key={id} type="button" style={s.card} aria-label={label}>
            <span style={s.iconWrap} aria-hidden>
              <Icon size={18} strokeWidth={2} color="var(--ta-ink-muted)" />
            </span>
            <span style={s.cardLabel}>{label}</span>
          </button>
        ))}
      </div>

      <div style={s.mapShell}>
        {(mapHeadline || mapSubline) && (
          <div style={s.mapPills}>
            {mapHeadline ? <span style={s.pill}>{mapHeadline}</span> : null}
            {mapSubline ? <span style={s.pillMuted}>{mapSubline}</span> : null}
          </div>
        )}
        {hasMap ? (
          <div style={s.mapFill}>
            <QuickPlanMap
              showChrome={false}
              fillHeight
              center={geoCenter}
              markers={[]}
              zoom={11}
              minHeight={0}
            />
          </div>
        ) : (
          <div style={s.mapFallback}>
            <span style={s.fallbackText}>
              Harita için destinasyon seçin veya Google Maps anahtarını yapılandırın.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  wrap: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--space-2)',
  },
  card: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-3) var(--space-3)',
    borderRadius: 'var(--radius-md)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(0,0,0,.08)',
    background: 'rgba(255,255,255,.95)',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'var(--font-sans)',
    boxSizing: 'border-box',
    minWidth: 0,
    transition: 'border-color var(--duration-base) var(--ease-out), background var(--duration-base) var(--ease-out)',
  },
  iconWrap: {
    flexShrink: 0,
    width: 36,
    height: 36,
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--ta-muted-bg)',
  },
  cardLabel: {
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--fw-semibold)',
    color: 'var(--ta-ink)',
    lineHeight: 1.25,
    minWidth: 0,
  },
  mapShell: {
    flex: 1,
    minHeight: 280,
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(0,0,0,.08)',
    background: '#e8ebe5',
    display: 'flex',
    flexDirection: 'column',
  },
  mapPills: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--space-2)',
    padding: 'var(--space-2) var(--space-3)',
    flexShrink: 0,
    background: 'rgba(255,255,255,.9)',
    borderBottomWidth: 'var(--border-thin)',
    borderBottomStyle: 'solid',
    borderBottomColor: 'rgba(0,0,0,.06)',
  },
  pill: {
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--fw-bold)',
    color: 'var(--ta-ink)',
    background: 'rgba(255,255,255,.95)',
    padding: 'var(--space-1) var(--space-2)',
    borderRadius: 'var(--radius-xs)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(0,0,0,.08)',
    fontFamily: 'var(--font-sans)',
  },
  pillMuted: {
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--fw-semibold)',
    color: 'var(--ta-ink-muted)',
    background: 'rgba(255,255,255,.9)',
    padding: 'var(--space-1) var(--space-2)',
    borderRadius: 'var(--radius-xs)',
    fontFamily: 'var(--font-sans)',
  },
  mapFill: {
    flex: 1,
    minHeight: 200,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  mapFallback: {
    flex: 1,
    minHeight: 280,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-4)',
  },
  fallbackText: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-base)',
    color: 'var(--muted)',
    textAlign: 'center',
    lineHeight: 1.45,
  },
};
