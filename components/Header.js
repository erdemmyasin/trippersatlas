'use client';

import { useState } from 'react';

/* Örnek plan pilleri — ileride planContext'ten beslenebilir */
const DEFAULT_PILLS = [
  { id: 'dest',    icon: '📍', label: 'Destinasyon seçin' },
  { id: 'dates',   icon: '📅', label: 'Tarih seçin' },
  { id: 'pax',     icon: '👤', label: 'Kişi sayısı' },
  { id: 'budget',  icon: '💰', label: 'Bütçe seviyesi' },
];

export default function Header({ planPills }) {
  const [lang, setLang] = useState('TR');
  const [loginHov, setLoginHov] = useState(false);

  const pills = planPills ?? DEFAULT_PILLS;

  return (
    <header style={s.header}>
      {/* Sol: Logo */}
      <div style={s.logoGroup}>
        <span style={s.logoIcon}>🗺️</span>
        <span style={s.logoText}>
          Tripper<span style={s.logoGold}>Atlas</span>
        </span>
      </div>

      {/* Orta: Plan pilleri */}
      <div style={s.pillsRow}>
        {pills.map((p, i) => (
          <span key={p.id ?? i} style={s.pill}>
            <span style={s.pillIcon}>{p.icon}</span>
            {p.label}
          </span>
        ))}
      </div>

      {/* Sağ */}
      <div style={s.actions}>
        <button style={s.langBtn} onClick={() => setLang(l => l === 'TR' ? 'EN' : 'TR')}>
          <span style={s.langActive}>{lang}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
            stroke="var(--text3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        <button
          style={{ ...s.loginBtn, ...(loginHov ? s.loginHov : {}) }}
          onMouseEnter={() => setLoginHov(true)}
          onMouseLeave={() => setLoginHov(false)}
        >
          Giriş Yap
        </button>
      </div>
    </header>
  );
}

const s = {
  header: {
    height: '56px',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '0 24px',
    background: 'rgba(250,250,248,0.97)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(0,0,0,.08)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    flexShrink: 0,
  },

  /* Logo */
  logoGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    flexShrink: 0,
  },
  logoIcon: { fontSize: '20px', lineHeight: 1 },
  logoText: {
    fontFamily: 'var(--font-serif)',
    fontWeight: 700,
    fontSize: '18px',
    color: 'var(--text1)',
    lineHeight: 1,
    letterSpacing: '-0.01em',
    whiteSpace: 'nowrap',
  },
  logoGold: { color: 'var(--gold)' },

  /* Plan pilleri */
  pillsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
    flexWrap: 'nowrap',
  },
  pill: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: '99px',
    padding: '4px 11px',
    fontFamily: 'var(--font-sans)',
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--text2)',
    whiteSpace: 'nowrap',
    cursor: 'default',
  },
  pillIcon: { fontSize: '12px' },

  /* Sağ */
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexShrink: 0,
  },
  langBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: 'none',
    border: '1px solid var(--border)',
    borderRadius: '7px',
    padding: '5px 9px',
    cursor: 'pointer',
  },
  langActive: {
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    fontSize: '12px',
    color: 'var(--text1)',
  },
  loginBtn: {
    border: '1.5px solid var(--gold)',
    borderRadius: '8px',
    color: 'var(--gold)',
    background: 'transparent',
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    fontSize: '12px',
    padding: '6px 16px',
    cursor: 'pointer',
    transition: 'background 0.18s, color 0.18s',
    whiteSpace: 'nowrap',
  },
  loginHov: {
    background: 'var(--gold)',
    color: '#fff',
  },
};
