'use client';

import {
  Lightbulb,
  ListOrdered,
  CalendarCheck,
  Image as ImageIcon,
  Info,
  CalendarDays,
} from 'lucide-react';
import { ta } from '@/lib/brandStyles';

const TOOLS = [
  { id: 'ideas', label: 'Fikirler', Icon: Lightbulb },
  { id: 'itinerary', label: 'Program', Icon: ListOrdered },
  { id: 'bookings', label: 'Rezervasyonlar', Icon: CalendarCheck },
  { id: 'media', label: 'Medya', Icon: ImageIcon },
  { id: 'prefs', label: 'Gezi tercihleri', Icon: Info },
  { id: 'calendar', label: 'Takvim', Icon: CalendarDays },
];

export default function TripToolsGrid() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--space-3)',
        flexShrink: 0,
      }}
    >
      {TOOLS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 'var(--space-2)',
            padding: 'var(--space-3) var(--space-3) var(--space-3)',
            borderRadius: 'var(--radius-md)',
            borderWidth: 'var(--border-thin)',
            borderStyle: 'solid',
            borderColor: 'rgba(0,0,0,.07)',
            background: 'rgba(255,255,255,.92)',
            cursor: 'pointer',
            textAlign: 'left',
            fontFamily: 'var(--font-sans)',
            boxShadow: '0 1px 0 rgba(255,255,255,.9) inset',
            transition: 'background var(--duration-fast) var(--ease-out)',
          }}
        >
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: ta.mutedBg,
              color: ta.inkMuted,
            }}
          >
            <Icon size={17} strokeWidth={2} aria-hidden />
          </span>
          <span style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-semibold)', color: ta.ink }}>{label}</span>
        </button>
      ))}
    </div>
  );
}
