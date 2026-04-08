'use client';

import { useState } from 'react';

const CHECKLIST = [
  { id: 'dest',        label: 'Şehir ve tarih aralığı netleşti' },
  { id: 'lodging',     label: 'Konaklama tipi daraltıldı' },
  { id: 'transfer',    label: 'Transfer talebi opsiyonel tutuluyor' },
  { id: 'activities',  label: 'Aktivite rotası hazır' },
  { id: 'reservation', label: 'Plan iletiresve rezervasyona çevrildi' },
];

const BUDGET_CATS = [
  { key: 'accommodation', label: 'Konaklama', color: '#B8934A' },
  { key: 'transport',     label: 'Transfer',  color: '#2A9D8F' },
  { key: 'activities',    label: 'Aktiviteler', color: '#6366F1' },
  { key: 'extras',        label: 'Diğer',     color: '#F59E0B' },
];

/* Map pin positions for the decorative map */
const PINS = [
  { top: '38%', left: '42%', label: 'Otel A', active: true },
  { top: '55%', left: '28%', label: 'Otel B', active: false },
  { top: '62%', left: '60%', label: 'Otel C', active: false },
  { top: '30%', left: '66%', label: 'Müze',   active: false },
];

export default function RightPanel({ budget = {}, completedModules = new Set() }) {
  const [checked, setChecked] = useState({});

  const values = BUDGET_CATS.map(c => budget[c.key] ?? 0);
  const total  = values.reduce((a, b) => a + b, 0);
  /* Checklist item'ı tamamlanmış sayılır: kullanıcı tıkladıysa VEYA ilgili modül complete ise */
  function isItemDone(item) {
    return !!checked[item.id] || completedModules.has(item.id);
  }

  const doneCount = CHECKLIST.filter(isItemDone).length;

  function toggle(id) {
    setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div style={s.panel}>

      {/* ── Dekoratif Harita ── */}
      <div style={s.mapWrap}>
        {/* Overlay pills */}
        <div style={s.mapTopRow}>
          <span style={s.mapPill}>🗺️ Harita görünümü</span>
          <span style={s.mapPill}>{values.filter(v => v > 0).length} otel · durak</span>
        </div>

        {/* SVG harita arka planı */}
        <svg style={s.mapSvg} viewBox="0 0 200 130" xmlns="http://www.w3.org/2000/svg">
          {/* Yol çizgileri */}
          <path d="M20 65 Q60 40 100 65 T180 55" stroke="#c8c4bc" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          <path d="M40 100 Q80 80 110 95 T170 88" stroke="#c8c4bc" strokeWidth="2" fill="none" strokeLinecap="round"/>
          <path d="M90 20 L95 110" stroke="#c8c4bc" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          <path d="M130 15 L128 115" stroke="#c8c4bc" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          {/* Arazi blokları */}
          <rect x="45" y="35" width="30" height="18" rx="3" fill="#ddd9d0" opacity="0.7"/>
          <rect x="110" y="50" width="25" height="15" rx="3" fill="#ddd9d0" opacity="0.7"/>
          <rect x="55" y="75" width="20" height="12" rx="3" fill="#ddd9d0" opacity="0.7"/>
        </svg>

        {/* Pin'ler */}
        {PINS.map((pin, i) => (
          <div key={i} style={{ ...s.pin, top: pin.top, left: pin.left }}>
            <div style={{ ...s.pinDot, background: pin.active ? 'var(--gold)' : '#2A9D8F' }}>
              {pin.active && <div style={s.pinRipple} />}
            </div>
            <span style={s.pinLabel}>{pin.label}</span>
          </div>
        ))}
      </div>

      {/* ── Bütçe Özeti ── */}
      <div style={s.budgetCard}>
        <div style={s.budgetHeader}>
          <div>
            <p style={s.budgetEyebrow}>Tahmini toplam</p>
            <p style={s.budgetTotal}>₺{total > 0 ? total.toLocaleString('tr-TR') : '0'}</p>
          </div>
          <span style={s.flexTag}>Esnek plan</span>
        </div>

        <div style={s.catList}>
          {BUDGET_CATS.map((cat, i) => {
            const val = values[i];
            const pct = total > 0 ? Math.round((val / total) * 100) : 0;
            return (
              <div key={cat.key} style={s.catRow}>
                <div style={s.catMeta}>
                  <span style={s.catLabel}>{cat.label}</span>
                  <span style={s.catAmt}>₺{val.toLocaleString('tr-TR')}</span>
                </div>
                <div style={s.barTrack}>
                  <div style={{ ...s.barFill, width: `${pct}%`, background: cat.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Plan Kontrol Listesi ── */}
      <div style={s.checkCard}>
        <div style={s.checkHeader}>
          <p style={s.checkTitle}>PLAN KONTROL LİSTESİ</p>
          <span style={s.checkCount}>{doneCount}/{CHECKLIST.length}</span>
        </div>

        {/* Micro progress */}
        <div style={s.microTrack}>
          <div style={{
            ...s.microFill,
            width: `${Math.round((doneCount / CHECKLIST.length) * 100)}%`,
          }} />
        </div>

        <ul style={s.list}>
          {CHECKLIST.map(item => {
            const done = isItemDone(item);
            return (
              <li key={item.id} style={s.listItem} onClick={() => toggle(item.id)}>
                <span style={{
                  ...s.cb,
                  background: done ? '#059669' : 'transparent',
                  borderColor: done ? '#059669' : 'var(--text3)',
                }}>
                  {done && <TickIcon />}
                </span>
                <span style={{
                  ...s.cbLabel,
                  color: done ? 'var(--text3)' : 'var(--text2)',
                  textDecoration: done ? 'line-through' : 'none',
                }}>
                  {item.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function TickIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 12 12" fill="none"
      stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="10 3 5 9 2 6"/>
    </svg>
  );
}

const s = {
  panel: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    gap: '10px',
  },

  /* Map */
  mapWrap: {
    position: 'relative',
    borderRadius: '12px',
    overflow: 'hidden',
    background: '#EAE7DF',
    border: '1px solid var(--border)',
    minHeight: '160px',
  },
  mapTopRow: {
    position: 'absolute',
    top: '8px',
    left: '8px',
    right: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    gap: '6px',
    zIndex: 2,
  },
  mapPill: {
    background: 'rgba(255,255,255,0.88)',
    backdropFilter: 'blur(6px)',
    borderRadius: '99px',
    fontSize: '10px',
    fontWeight: 600,
    fontFamily: 'var(--font-sans)',
    color: 'var(--text2)',
    padding: '3px 9px',
    border: '1px solid var(--border)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  mapSvg: {
    width: '100%',
    height: '160px',
    display: 'block',
  },
  pin: {
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    zIndex: 2,
    cursor: 'default',
  },
  pinDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    border: '2px solid #fff',
    boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
    position: 'relative',
  },
  pinRipple: {
    position: 'absolute',
    inset: '-4px',
    borderRadius: '50%',
    border: '2px solid var(--gold)',
    opacity: 0.4,
    animation: 'ripple 2s ease-out infinite',
  },
  pinLabel: {
    background: 'rgba(255,255,255,0.92)',
    borderRadius: '4px',
    fontSize: '8px',
    fontWeight: 600,
    fontFamily: 'var(--font-sans)',
    color: 'var(--text1)',
    padding: '1px 5px',
    whiteSpace: 'nowrap',
    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
  },

  /* Budget */
  budgetCard: {
    background: 'var(--surface)',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
    padding: '14px',
  },
  budgetHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '14px',
    gap: '8px',
  },
  budgetEyebrow: {
    fontFamily: 'var(--font-sans)',
    fontSize: '10px',
    fontWeight: 600,
    color: 'var(--text3)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '2px',
  },
  budgetTotal: {
    fontFamily: 'var(--font-serif)',
    fontWeight: 700,
    fontSize: '24px',
    color: 'var(--gold)',
    lineHeight: 1,
  },
  flexTag: {
    background: 'var(--gold-soft)',
    color: 'var(--gold)',
    border: '1px solid var(--gold)',
    borderRadius: '99px',
    fontSize: '9px',
    fontWeight: 600,
    fontFamily: 'var(--font-sans)',
    padding: '3px 9px',
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
  catList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '9px',
  },
  catRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  catMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  catLabel: {
    fontFamily: 'var(--font-sans)',
    fontSize: '11px',
    color: 'var(--text2)',
  },
  catAmt: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--text1)',
  },
  barTrack: {
    height: '5px',
    background: 'var(--surface2)',
    borderRadius: '99px',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: '99px',
    transition: 'width 0.4s ease',
    minWidth: '0',
  },

  /* Checklist */
  checkCard: {
    background: 'var(--surface)',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
    padding: '14px',
  },
  checkHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  checkTitle: {
    fontFamily: 'var(--font-sans)',
    fontWeight: 700,
    fontSize: '10px',
    letterSpacing: '0.08em',
    color: 'var(--text3)',
  },
  checkCount: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--gold)',
    fontWeight: 500,
  },
  microTrack: {
    height: '3px',
    background: 'var(--surface2)',
    borderRadius: '99px',
    overflow: 'hidden',
    marginBottom: '12px',
  },
  microFill: {
    height: '100%',
    background: '#059669',
    borderRadius: '99px',
    transition: 'width 0.3s ease',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '9px',
  },
  listItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    cursor: 'pointer',
    userSelect: 'none',
  },
  cb: {
    width: '15px',
    height: '15px',
    borderRadius: '4px',
    border: '1.5px solid var(--text3)',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '1px',
    transition: 'background 0.15s, border-color 0.15s',
  },
  cbLabel: {
    fontFamily: 'var(--font-sans)',
    fontSize: '11px',
    lineHeight: 1.4,
    transition: 'color 0.15s',
  },
};
