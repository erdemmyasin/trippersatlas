'use client';

import { useState } from 'react';

const MODULES = [
  {
    id: 'purpose',
    label: 'Amaç / Plan türü',
    status: 'active',   /* active | open | passive | locked */
    badges: ['active'],
    desc: 'Fikir kılıcına başlamak için amaç ve seyahat türünü belirleyin.',
    options: ['Şehir keşfi', 'Yürüyüş planı', 'Kültür turu'],
    subAdd: false,
  },
  {
    id: 'lodging',
    label: 'Konaklama',
    status: 'open',
    badges: ['open', 'locked'],
    desc: 'Butik otel ve özel konut seçeneklerini ön plana çıkarabilirsiniz.',
    options: ['Butik otel', 'Merkez de', 'Villa'],
    subAdd: true,
  },
  {
    id: 'transfer',
    label: 'Transfer',
    status: 'open',
    badges: ['open', 'locked'],
    desc: 'Havalimanı karşılama ve dönüş transferini değerlendiriyoruz.',
    options: ['Karşılama', 'Özel araç', 'Havalimanı VIP'],
    subAdd: true,
  },
  {
    id: 'transport',
    label: 'Ulaşım',
    status: 'passive',
    badges: ['passive', 'locked'],
    desc: 'Henüz kullanıcı tarafından talep edilmediğinden sonra aktifleşecek.',
    options: ['Uçuş', 'Tren', 'Otobüs'],
    subAdd: false,
  },
  {
    id: 'activities',
    label: 'Aktiviteler',
    status: 'passive',
    badges: ['passive', 'locked'],
    desc: 'Destinasyona göre deneyim ve tur seçenekleri eklenebilir.',
    options: ['Müze turu', 'Tekne', 'Yemek deneyimi'],
    subAdd: true,
  },
];

const BADGE_MAP = {
  active:  { label: 'Aktif',   bg: 'rgba(16,185,129,0.13)',  color: '#059669' },
  open:    { label: 'Açık',    bg: 'rgba(16,185,129,0.13)',  color: '#059669' },
  passive: { label: 'Pasif',   bg: 'rgba(107,114,128,0.12)', color: '#6B7280' },
  locked:  { label: 'Kilitli', bg: 'rgba(245,158,11,0.13)',  color: '#D97706' },
};

export default function LeftPanel({ completedModules = new Set() }) {
  return (
    <div style={s.panel}>
      {/* Başlık satırı */}
      <div style={s.topBar}>
        <span style={s.topTitle}>SEYAHAT MODÜLLERİ</span>
        <span style={s.planTag}>ESNEK PLAN</span>
      </div>

      {/* Modüller */}
      <div style={s.moduleList}>
        {MODULES.map(mod => (
          <ModuleBlock key={mod.id} mod={mod} isDone={completedModules.has(mod.id)} />
        ))}
      </div>
    </div>
  );
}

function ModuleBlock({ mod, isDone }) {
  const [open, setOpen] = useState(mod.status === 'active' || mod.status === 'open');

  const isActive  = mod.status === 'active';
  const isPassive = mod.status === 'passive' && !isDone;

  /* Tamamlandıysa yeşil, aktifse altın, açıksa yeşil, diğer şeffaf */
  const leftBorderColor = isDone
    ? '#059669'
    : isActive
      ? 'var(--gold)'
      : mod.status === 'open'
        ? '#059669'
        : 'transparent';

  return (
    <div style={{
      ...s.block,
      opacity: isPassive ? 0.72 : 1,
      borderLeft: `3px solid ${leftBorderColor}`,
      background: isDone ? 'rgba(5,150,105,0.04)' : 'var(--surface)',
    }}>
      {/* Module header */}
      <button style={s.modHead} onClick={() => setOpen(o => !o)}>
        <span style={{
          ...s.modLabel,
          color: isDone ? '#059669' : isActive ? 'var(--gold)' : 'var(--text1)',
        }}>
          {mod.label}
        </span>
        <div style={s.badgeRow}>
          {isDone ? (
            /* Tamamlandı badge'i — diğer badge'lerin yerine */
            <span style={{ ...s.badge, background: 'rgba(5,150,105,0.13)', color: '#059669' }}>
              ✓ Tamamlandı
            </span>
          ) : (
            mod.badges.map(b => (
              <span key={b} style={{ ...s.badge, background: BADGE_MAP[b].bg, color: BADGE_MAP[b].color }}>
                {BADGE_MAP[b].label}
              </span>
            ))
          )}
          <ChevronIcon open={open} />
        </div>
      </button>

      {/* Expanded content */}
      {open && (
        <div style={s.modBody}>
          <p style={s.desc}>{mod.desc}</p>
          <div style={s.optionRow}>
            {mod.options.map(opt => (
              <span key={opt} style={s.optPill}>{opt}</span>
            ))}
          </div>
          {mod.subAdd && (
            <button style={s.subAdd}>＋ alt başlık ekle</button>
          )}
        </div>
      )}
    </div>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="var(--text3)" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', flexShrink: 0 }}
    >
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

const s = {
  panel: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    gap: '0',
  },

  /* Top bar */
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  topTitle: {
    fontFamily: 'var(--font-sans)',
    fontWeight: 700,
    fontSize: '10px',
    letterSpacing: '0.1em',
    color: 'var(--text3)',
    textTransform: 'uppercase',
  },
  planTag: {
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    fontSize: '9px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--gold)',
    background: 'var(--gold-soft)',
    border: '1px solid var(--gold)',
    borderRadius: '99px',
    padding: '2px 8px',
  },

  /* Module blocks */
  moduleList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  block: {
    borderRadius: '8px',
    overflow: 'hidden',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    transition: 'opacity 0.2s',
  },
  modHead: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '9px 10px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    gap: '6px',
  },
  modLabel: {
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    fontSize: '12px',
    color: 'var(--text1)',
    textAlign: 'left',
    flex: 1,
    lineHeight: 1.2,
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flexShrink: 0,
  },
  badge: {
    fontSize: '9px',
    fontWeight: 600,
    fontFamily: 'var(--font-sans)',
    padding: '2px 7px',
    borderRadius: '99px',
    letterSpacing: '0.02em',
    whiteSpace: 'nowrap',
  },

  /* Module body */
  modBody: {
    padding: '2px 10px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    borderTop: '1px solid var(--border)',
  },
  desc: {
    fontFamily: 'var(--font-sans)',
    fontSize: '11px',
    color: 'var(--text3)',
    lineHeight: 1.5,
    paddingTop: '6px',
  },
  optionRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '5px',
  },
  optPill: {
    fontFamily: 'var(--font-sans)',
    fontSize: '11px',
    fontWeight: 500,
    color: 'var(--text2)',
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    padding: '3px 9px',
    cursor: 'default',
    whiteSpace: 'nowrap',
  },
  subAdd: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    fontSize: '11px',
    color: 'var(--gold)',
    fontWeight: 500,
    padding: 0,
    textAlign: 'left',
  },
};
