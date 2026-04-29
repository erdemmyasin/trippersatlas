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
    gap: 12,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
  },
  card: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 14,
    border: '1px solid rgba(0,0,0,.08)',
    background: 'rgba(255,255,255,.95)',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'var(--font-sans)',
    boxSizing: 'border-box',
    minWidth: 0,
    transition: 'border-color .15s, background .15s',
  },
  iconWrap: {
    flexShrink: 0,
    width: 36,
    height: 36,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--ta-muted-bg)',
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--ta-ink)',
    lineHeight: 1.25,
    minWidth: 0,
  },
  mapShell: {
    flex: 1,
    minHeight: 280,
    borderRadius: 16,
    overflow: 'hidden',
    border: '1px solid rgba(0,0,0,.08)',
    background: '#e8ebe5',
    display: 'flex',
    flexDirection: 'column',
  },
  mapPills: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    padding: '8px 10px',
    flexShrink: 0,
    background: 'rgba(255,255,255,.9)',
    borderBottom: '1px solid rgba(0,0,0,.06)',
  },
  pill: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--ta-ink)',
    background: 'rgba(255,255,255,.95)',
    padding: '5px 9px',
    borderRadius: 8,
    border: '1px solid rgba(0,0,0,.08)',
    fontFamily: 'var(--font-sans)',
  },
  pillMuted: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--ta-ink-muted)',
    background: 'rgba(255,255,255,.9)',
    padding: '5px 9px',
    borderRadius: 8,
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
    padding: 16,
  },
  fallbackText: {
    fontFamily: 'var(--font-sans)',
    fontSize: 13,
    color: 'var(--muted)',
    textAlign: 'center',
    lineHeight: 1.45,
  },
};
