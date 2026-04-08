'use client';

import { useEffect, useState } from 'react';

const MENU_ITEMS = [
  { id: 'chats',    icon: '💬', label: 'Sohbetler',           badge: 1 },
  { id: 'trips',    icon: '🧳', label: 'Geziler',             badge: null },
  { id: 'explore',  icon: '🔍', label: 'Keşfet',              badge: null },
  { id: 'saved',    icon: '🤍', label: 'Kaydedilenler',       badge: null },
  { id: 'updates',  icon: '🔔', label: 'Güncellemeler',       badge: null },
  { id: 'inspire',  icon: '✦',  label: 'İlham',               badge: null },
];

export default function LeftOverlayNav({ isOpen, onClose }) {
  const [active, setActive] = useState('chats');

  /* ESC tuşu ile kapat */
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose?.(); }
    if (isOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  /* Body scroll kilidi */
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* Dim overlay */}
      <div
        style={{
          ...s.overlay,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside style={{
        ...s.drawer,
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
      }}>
        {/* ── Logo ── */}
        <div style={s.logoRow}>
          <span style={s.logoIcon}>✦</span>
          <span style={s.logoText}>TripperAtlas.</span>
          <button style={s.closeBtn} onClick={onClose} aria-label="Kapat">✕</button>
        </div>

        {/* ── Menü ── */}
        <nav style={s.nav}>
          {MENU_ITEMS.map(item => (
            <button
              key={item.id}
              style={{
                ...s.menuItem,
                ...(active === item.id ? s.menuItemActive : {}),
              }}
              onClick={() => setActive(item.id)}
            >
              <span style={s.menuIcon}>{item.icon}</span>
              <span style={s.menuLabel}>{item.label}</span>
              {item.badge != null && (
                <span style={s.badge}>{item.badge}</span>
              )}
            </button>
          ))}

          <div style={s.divider} />

          {/* Yeni plan oluştur */}
          <button style={s.newPlanBtn}>
            <span>➕</span>
            <span>Yeni plan oluştur</span>
          </button>
        </nav>

        {/* ── Alt kısım ── */}
        <div style={s.footer}>
          <button style={s.newChatBtn}>
            <span style={s.newChatIcon}>✦</span>
            Yeni sohbet
          </button>

          <div style={s.userRow}>
            <div style={s.avatar}>S</div>
            <span style={s.userName}>Seyahatçi</span>
            <button style={s.moreBtn}>···</button>
          </div>

          <p style={s.footerLinks}>
            Şartlar · Gizlilik · © 2026 TripperAtlas
          </p>
        </div>
      </aside>
    </>
  );
}

const s = {
  /* Dim backdrop */
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(20,16,10,.32)',
    zIndex: 90,
    transition: 'opacity .25s ease',
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)',
  },

  /* Drawer */
  drawer: {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    width: '240px',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(250,248,244,.98)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRight: '1px solid rgba(0,0,0,.06)',
    boxShadow: '4px 0 32px rgba(0,0,0,.12)',
    transition: 'transform .25s ease',
  },

  /* Logo row */
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '18px 16px 12px',
    borderBottom: '1px solid rgba(0,0,0,.05)',
  },
  logoIcon: {
    fontSize: '16px',
    color: 'var(--gold)',
    lineHeight: 1,
  },
  logoText: {
    fontFamily: 'var(--font-sans)',
    fontWeight: 800,
    fontSize: '16px',
    letterSpacing: '-0.02em',
    color: 'var(--text1)',
    flex: 1,
  },
  closeBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    border: '1px solid rgba(0,0,0,.07)',
    background: 'rgba(0,0,0,.03)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    color: 'var(--muted)',
    cursor: 'pointer',
    flexShrink: 0,
    fontFamily: 'var(--font-sans)',
  },

  /* Nav */
  nav: {
    flex: 1,
    overflowY: 'auto',
    padding: '10px 10px 6px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  menuItem: {
    width: '100%',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '0 10px',
    borderRadius: '12px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background .15s',
    color: 'var(--text1)',
    fontFamily: 'var(--font-sans)',
  },
  menuItemActive: {
    background: 'rgba(199,154,70,.12)',
    color: 'var(--gold-deep)',
  },
  menuIcon: {
    fontSize: '16px',
    width: '22px',
    textAlign: 'center',
    flexShrink: 0,
  },
  menuLabel: {
    flex: 1,
    fontSize: '14px',
    fontWeight: 600,
  },
  badge: {
    background: 'var(--gold)',
    color: 'white',
    fontSize: '10px',
    fontWeight: 800,
    fontFamily: 'var(--font-sans)',
    padding: '2px 7px',
    borderRadius: '999px',
    lineHeight: 1.6,
  },

  divider: {
    height: '1px',
    background: 'rgba(0,0,0,.06)',
    margin: '6px 4px',
  },

  newPlanBtn: {
    width: '100%',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '0 10px',
    borderRadius: '12px',
    border: '1px solid rgba(199,154,70,.28)',
    background: 'rgba(199,154,70,.10)',
    cursor: 'pointer',
    color: 'var(--gold-deep)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 700,
    fontSize: '14px',
    marginTop: '2px',
    transition: 'background .15s',
  },

  /* Footer */
  footer: {
    padding: '10px',
    borderTop: '1px solid rgba(0,0,0,.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  newChatBtn: {
    width: '100%',
    height: '42px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: '12px',
    border: '1px solid rgba(0,0,0,.08)',
    background: 'rgba(0,0,0,.03)',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    fontWeight: 700,
    fontSize: '13px',
    color: 'var(--text1)',
    transition: 'background .15s',
  },
  newChatIcon: {
    color: 'var(--gold)',
    fontSize: '14px',
  },

  userRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '4px 4px',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg,#f0d3a1,#c79a46)',
    color: 'white',
    fontSize: '13px',
    fontWeight: 800,
    fontFamily: 'var(--font-sans)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  userName: {
    flex: 1,
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    fontSize: '13px',
    color: 'var(--text1)',
  },
  moreBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    border: '1px solid rgba(0,0,0,.07)',
    background: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    color: 'var(--muted)',
    cursor: 'pointer',
    letterSpacing: '1px',
    flexShrink: 0,
  },

  footerLinks: {
    fontFamily: 'var(--font-sans)',
    fontSize: '11px',
    color: 'var(--muted)',
    textAlign: 'center',
    paddingBottom: '2px',
  },
};
