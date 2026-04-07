'use client';

import { useState } from 'react';

export default function ListingCard({ listing }) {
  const [hovered, setHovered] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!listing) return null;

  const {
    name,
    location,
    price,
    priceUnit = 'gece',
    badge,
    emoji,
    trustSignal,
  } = listing;

  function handleReservation() {
    console.log('Rezervasyon:', listing);
  }

  return (
    <div style={s.card}>
      {/* Üst satır: emoji + badge */}
      <div style={s.topRow}>
        <span style={s.emoji}>{emoji || '🏨'}</span>
        {badge && <span style={s.badge}>{badge}</span>}
      </div>

      {/* Otel adı */}
      <p style={s.name}>{name}</p>

      {/* Lokasyon */}
      {location && <p style={s.location}>📍 {location}</p>}

      {/* Trust signal */}
      {trustSignal && <p style={s.trust}>★ {trustSignal}</p>}

      {/* Alt satır: buton + fiyat + kaydet */}
      <div style={s.bottomRow}>
        <button
          style={{ ...s.bookBtn, ...(hovered ? s.bookBtnHover : {}) }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={handleReservation}
        >
          Rezervasyon Yap
        </button>

        <div style={s.rightGroup}>
          {price != null && (
            <span style={s.price}>
              {price}
              <span style={s.priceUnit}> /{priceUnit}</span>
            </span>
          )}

          <button
            style={s.saveBtn}
            onClick={() => setSaved(v => !v)}
            title={saved ? 'Kaydedildi' : 'Kaydet'}
          >
            <BookmarkIcon filled={saved} />
          </button>
        </div>
      </div>
    </div>
  );
}

function BookmarkIcon({ filled }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? 'var(--gold)' : 'none'}
      stroke="var(--gold)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

const s = {
  card: {
    background: 'var(--surface)',
    borderRadius: '12px',
    boxShadow: 'var(--shadow-md)',
    padding: '14px 16px',
    width: '100%',
    maxWidth: '480px',
    marginBottom: '10px',
    border: '1px solid var(--border)',
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  emoji: {
    fontSize: '32px',
    lineHeight: 1,
  },
  badge: {
    background: 'var(--gold-soft)',
    color: 'var(--gold)',
    border: '1px solid var(--gold)',
    borderRadius: '99px',
    fontSize: '11px',
    fontWeight: 600,
    fontFamily: 'var(--font-sans)',
    padding: '2px 10px',
    letterSpacing: '0.02em',
  },
  name: {
    fontFamily: 'var(--font-serif)',
    fontWeight: 700,
    fontSize: '16px',
    color: 'var(--text1)',
    marginBottom: '4px',
    lineHeight: 1.3,
  },
  location: {
    fontSize: '12px',
    color: 'var(--text2)',
    marginBottom: '4px',
  },
  trust: {
    fontSize: '12px',
    color: 'var(--success)',
    marginBottom: '12px',
  },
  bottomRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    marginTop: '4px',
  },
  bookBtn: {
    border: '1.5px solid var(--gold)',
    borderRadius: '8px',
    color: 'var(--gold)',
    background: 'transparent',
    fontSize: '12px',
    fontWeight: 600,
    fontFamily: 'var(--font-sans)',
    padding: '6px 14px',
    cursor: 'pointer',
    transition: 'background 0.18s, color 0.18s',
    flexShrink: 0,
  },
  bookBtnHover: {
    background: 'var(--gold)',
    color: '#fff',
  },
  rightGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  price: {
    fontFamily: 'var(--font-mono)',
    fontWeight: 500,
    fontSize: '15px',
    color: 'var(--gold)',
  },
  priceUnit: {
    fontFamily: 'var(--font-sans)',
    fontSize: '11px',
    color: 'var(--text2)',
    fontWeight: 400,
  },
  saveBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
};
