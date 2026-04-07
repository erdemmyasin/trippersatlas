'use client';

import { useState } from 'react';

export default function Header() {
  const [lang, setLang] = useState('TR');
  const [loginHovered, setLoginHovered] = useState(false);

  function toggleLang() {
    setLang(prev => (prev === 'TR' ? 'EN' : 'TR'));
  }

  return (
    <header style={s.header}>
      {/* Sol: Logo */}
      <div style={s.logoGroup}>
        <span style={s.logoIcon}>🗺️</span>
        <span style={s.logoText}>
          Tripper<span style={s.logoGold}>Atlas</span>
        </span>
      </div>

      {/* Orta: Durum */}
      <div style={s.center}>
        <span style={s.status}>Seyahat planınız oluşturuluyor…</span>
      </div>

      {/* Sağ: Dil + Giriş */}
      <div style={s.actions}>
        <button style={s.langBtn} onClick={toggleLang} title="Dil seç">
          <span style={s.langActive}>{lang}</span>
          <span style={s.langSep}>/</span>
          <span style={s.langOther}>{lang === 'TR' ? 'EN' : 'TR'}</span>
        </button>

        <button
          style={{ ...s.loginBtn, ...(loginHovered ? s.loginBtnHover : {}) }}
          onMouseEnter={() => setLoginHovered(true)}
          onMouseLeave={() => setLoginHovered(false)}
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
    gap: '8px',
    flexShrink: 0,
  },
  logoIcon: {
    fontSize: '20px',
    lineHeight: 1,
  },
  logoText: {
    fontFamily: 'var(--font-serif)',
    fontWeight: 700,
    fontSize: '18px',
    color: 'var(--text1)',
    lineHeight: 1,
    letterSpacing: '-0.01em',
  },
  logoGold: {
    color: 'var(--gold)',
  },

  /* Orta */
  center: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '0 16px',
    overflow: 'hidden',
  },
  status: {
    fontFamily: 'var(--font-sans)',
    fontStyle: 'italic',
    fontSize: '12px',
    color: 'var(--text3)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  /* Sağ */
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 0,
  },
  langBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 6px',
    borderRadius: '6px',
  },
  langActive: {
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    fontSize: '12px',
    color: 'var(--text1)',
  },
  langSep: {
    fontFamily: 'var(--font-sans)',
    fontSize: '11px',
    color: 'var(--text3)',
  },
  langOther: {
    fontFamily: 'var(--font-sans)',
    fontWeight: 400,
    fontSize: '12px',
    color: 'var(--text3)',
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
  loginBtnHover: {
    background: 'var(--gold)',
    color: '#fff',
  },
};
