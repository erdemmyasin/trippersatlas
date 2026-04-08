'use client';

import { useState } from 'react';

export default function Header({ planPills, onMenuClick }) {
  const [lang, setLang]           = useState('TR');
  const [loginHov, setLoginHov]   = useState(false);
  const [planHov, setPlanHov]     = useState(false);
  const [dropOpen, setDropOpen]   = useState(false);
  const [activeChip, setActiveChip] = useState(null);

  const pills = planPills ?? DEFAULT_PILLS;

  return (
    <header style={s.header}>
      {/* ── Sol: hamburger + logo ── */}
      <div style={s.left}>
        <button style={s.hamburger} onClick={onMenuClick} aria-label="Menü">
          <HamburgerIcon />
        </button>

        <div style={s.brand}>
          <div className="ta-brand-mark" />
          <span style={s.brandText}>Atlas</span>
        </div>
      </div>

      {/* ── Orta: trip name + chips ── */}
      <div style={s.center}>
        {/* Trip name dropdown pill */}
        <div style={s.tripPillWrap}>
          <button
            style={{ ...s.tripPill, ...(dropOpen ? s.tripPillOpen : {}) }}
            onClick={() => setDropOpen(o => !o)}
          >
            <span style={s.tripStar}>✦</span>
            <span style={s.tripName}>Seyahat planınız</span>
            <span style={{ ...s.chevron, transform: dropOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
              ⌄
            </span>
          </button>

          {/* Mock dropdown */}
          {dropOpen && (
            <>
              <div style={s.dropOverlay} onClick={() => setDropOpen(false)} />
              <div style={s.dropdown}>
                <div style={s.dropItem}>
                  <span style={s.dropIcon}>✦</span>
                  <span style={s.dropLabel}>Seyahat planınız</span>
                  <span style={s.dropActive}>Aktif</span>
                </div>
                <div style={s.dropDivider} />
                <button style={s.dropNew} onClick={() => setDropOpen(false)}>
                  <span>➕</span> Yeni plan oluştur
                </button>
              </div>
            </>
          )}
        </div>

        {/* Chips */}
        <div style={s.chips}>
          {pills.map((p, i) => {
            const isActive = activeChip === p.id;
            const hasValue = p.label !== DEFAULT_PILLS.find(d => d.id === p.id)?.label;
            return (
              <button
                key={p.id ?? i}
                style={{
                  ...s.chip,
                  ...(isActive || hasValue ? s.chipActive : {}),
                }}
                onClick={() => setActiveChip(id => id === p.id ? null : p.id)}
              >
                <span style={s.chipIcon}>{p.icon}</span>
                <span style={s.chipLabel}>
                  {p.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Sağ: Plan Oluştur + dil + giriş ── */}
      <div style={s.right}>
        <button
          style={{ ...s.planBtn, ...(planHov ? s.planBtnHov : {}) }}
          onMouseEnter={() => setPlanHov(true)}
          onMouseLeave={() => setPlanHov(false)}
        >
          <span style={s.planBtnStar}>✦</span>
          Plan Oluştur
        </button>

        <select
          style={s.select}
          value={lang}
          onChange={e => setLang(e.target.value)}
        >
          <option>TR</option>
          <option>EN</option>
          <option>DE</option>
        </select>

        <button
          style={{ ...s.loginBtn, ...(loginHov ? s.loginBtnHov : {}) }}
          onMouseEnter={() => setLoginHov(true)}
          onMouseLeave={() => setLoginHov(false)}
        >
          Giriş Yap
        </button>
      </div>
    </header>
  );
}

function HamburgerIcon() {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
      <rect y="0"  width="18" height="2" rx="1" fill="currentColor" />
      <rect y="6"  width="14" height="2" rx="1" fill="currentColor" />
      <rect y="12" width="18" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}

const DEFAULT_PILLS = [
  { id: 'dest',   icon: '📍', label: 'Destinasyon' },
  { id: 'dates',  icon: '📅', label: 'Tarih' },
  { id: 'pax',    icon: '👤', label: 'Kişi sayısı' },
  { id: 'budget', icon: '💰', label: 'Bütçe' },
];

const s = {
  header: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto',
    alignItems: 'center',
    gap: '12px',
    padding: '0 14px',
    height: '56px',
    background: 'rgba(250,250,248,.95)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(0,0,0,.06)',
    position: 'sticky',
    top: 0,
    zIndex: 30,
    flexShrink: 0,
  },

  /* Left */
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  hamburger: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    border: '1px solid rgba(0,0,0,.07)',
    background: 'rgba(0,0,0,.03)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--text1)',
    flexShrink: 0,
    transition: 'background .15s',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  brandText: {
    fontFamily: 'var(--font-sans)',
    fontWeight: 800,
    fontSize: '18px',
    letterSpacing: '-0.03em',
    color: 'var(--text1)',
    whiteSpace: 'nowrap',
  },

  /* Center */
  center: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: 0,
    overflow: 'hidden',
  },

  /* Trip pill */
  tripPillWrap: {
    position: 'relative',
    flexShrink: 0,
  },
  tripPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 12px',
    borderRadius: '999px',
    border: '1px solid rgba(0,0,0,.08)',
    background: 'rgba(255,255,255,.82)',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text1)',
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 8px rgba(0,0,0,.05)',
    transition: 'border-color .15s, background .15s',
  },
  tripPillOpen: {
    border: '1px solid rgba(199,154,70,.4)',
    background: 'rgba(255,255,255,.95)',
  },
  tripStar: {
    color: 'var(--gold)',
    fontSize: '12px',
  },
  tripName: { fontSize: '13px' },
  chevron: {
    fontSize: '15px',
    color: 'var(--muted)',
    transition: 'transform .2s ease',
    lineHeight: 1,
  },

  /* Dropdown */
  dropOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 40,
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    left: 0,
    minWidth: '240px',
    background: 'rgba(253,252,249,.98)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(0,0,0,.08)',
    borderRadius: '18px',
    boxShadow: '0 16px 36px rgba(0,0,0,.12)',
    overflow: 'hidden',
    zIndex: 50,
    padding: '8px',
  },
  dropItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 10px',
    borderRadius: '12px',
    background: 'rgba(199,154,70,.08)',
    border: '1px solid rgba(199,154,70,.18)',
  },
  dropIcon: {
    fontSize: '14px',
    color: 'var(--gold)',
  },
  dropLabel: {
    flex: 1,
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    fontSize: '13px',
    color: 'var(--text1)',
  },
  dropActive: {
    fontFamily: 'var(--font-sans)',
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--green)',
    background: 'rgba(47,143,107,.10)',
    border: '1px solid rgba(47,143,107,.2)',
    borderRadius: '999px',
    padding: '2px 8px',
  },
  dropDivider: {
    height: '1px',
    background: 'rgba(0,0,0,.05)',
    margin: '6px 2px',
  },
  dropNew: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 10px',
    borderRadius: '12px',
    border: '1px solid rgba(199,154,70,.2)',
    background: 'rgba(199,154,70,.06)',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    fontSize: '13px',
    color: 'var(--gold-deep)',
    transition: 'background .15s',
  },

  /* Chips */
  chips: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
    overflow: 'hidden',
    minWidth: 0,
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '5px 11px',
    borderRadius: '999px',
    border: '1px solid rgba(0,0,0,.07)',
    background: 'rgba(255,255,255,.72)',
    color: 'var(--text2)',
    fontSize: '12px',
    fontWeight: 500,
    fontFamily: 'var(--font-sans)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background .15s, border-color .15s, color .15s',
    flexShrink: 0,
  },
  chipActive: {
    background: 'rgba(199,154,70,.12)',
    border: '1px solid rgba(199,154,70,.32)',
    color: 'var(--gold-deep)',
    fontWeight: 600,
  },
  chipIcon: { fontSize: '11px' },
  chipLabel: { fontSize: '12px' },

  /* Right */
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  planBtn: {
    height: '36px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '0 16px',
    borderRadius: '999px',
    background: 'linear-gradient(180deg,#d3ab5f,#c08d36)',
    color: 'white',
    border: '1px solid rgba(167,125,50,.28)',
    boxShadow: '0 6px 14px rgba(199,154,70,.28)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 700,
    fontSize: '13px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'opacity .15s',
  },
  planBtnHov: { opacity: 0.88 },
  planBtnStar: {
    fontSize: '12px',
    opacity: 0.9,
  },
  select: {
    height: '34px',
    borderRadius: '10px',
    border: '1px solid rgba(0,0,0,.08)',
    background: 'rgba(255,255,255,.82)',
    color: 'var(--text1)',
    padding: '0 10px',
    fontWeight: 600,
    fontSize: '12px',
    fontFamily: 'var(--font-sans)',
    cursor: 'pointer',
    outline: 'none',
  },
  loginBtn: {
    height: '34px',
    borderRadius: '10px',
    border: '1px solid rgba(0,0,0,.12)',
    background: 'transparent',
    color: 'var(--text1)',
    padding: '0 14px',
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    fontSize: '12px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background .15s',
  },
  loginBtnHov: {
    background: 'rgba(0,0,0,.04)',
  },
};
