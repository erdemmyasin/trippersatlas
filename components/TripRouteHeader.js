'use client';

import Link from 'next/link';
import {
  ChevronLeft,
  UserRound,
  UserPlus,
  Share2,
  Upload,
  MoreHorizontal,
} from 'lucide-react';
import { ta } from '@/lib/brandStyles';

export default function TripRouteHeader({
  planName = 'Gezi',
  tripMeta = {},
  backHref = '/trips',
}) {
  const dest = String(tripMeta?.destination || '').trim();
  const sub = [dest, tripMeta?.datesChipText, tripMeta?.paxChipText]
    .filter(Boolean)
    .join(' · ');

  return (
    <header
      style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        minHeight: 56,
        padding: '10px 16px 10px 12px',
        borderBottom: '1px solid rgba(0,0,0,.06)',
        background: 'var(--ta-elevated, #fff)',
        boxSizing: 'border-box',
      }}
    >
      <Link
        href={backHref}
        aria-label="Gezilere dön"
        style={{
          width: 40,
          height: 40,
          borderRadius: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: ta.mutedBg,
          color: ta.ink,
          flexShrink: 0,
        }}
      >
        <ChevronLeft size={20} strokeWidth={2.2} aria-hidden />
      </Link>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <h1
          style={{
            margin: 0,
            fontFamily: 'var(--font-serif)',
            fontWeight: 700,
            fontSize: 18,
            letterSpacing: '-0.02em',
            color: ta.ink,
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {planName}
        </h1>
        {sub ? (
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              color: ta.inkMuted,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {sub}
          </p>
        ) : null}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <Link
          href="/profil"
          title="Profil"
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #7c6cf0, #a78bfa)',
            color: '#fff',
          }}
        >
          <UserRound size={18} strokeWidth={2} color="#fff" aria-hidden />
        </Link>
        <HeaderIconBtn label="Davet et" icon={UserPlus} />
        <HeaderIconBtn label="Paylaş" icon={Share2} />
        <HeaderIconBtn label="Yükle" icon={Upload} />
        <HeaderIconBtn label="Daha fazla" icon={MoreHorizontal} />
      </div>
    </header>
  );
}

function HeaderIconBtn({ label, icon: Icon }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        border: '1px solid rgba(0,0,0,.08)',
        background: ta.surface,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: ta.inkMuted,
      }}
    >
      <Icon size={17} strokeWidth={2} aria-hidden />
    </button>
  );
}
