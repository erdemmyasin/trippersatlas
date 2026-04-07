'use client';

import { useState } from 'react';
import BudgetCard from './BudgetCard';

const CHECKLIST = [
  { id: 'purpose',      label: 'Amaç belirlendi' },
  { id: 'lodging',      label: 'Konaklama seçildi' },
  { id: 'transfer',     label: 'Transfer ayarlandı' },
  { id: 'activities',   label: 'Aktiviteler eklendi' },
  { id: 'reservation',  label: 'Rezervasyon tamamlandı' },
];

export default function RightPanel({ budget }) {
  const [checked, setChecked] = useState({});

  function toggle(id) {
    setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  }

  const doneCount = Object.values(checked).filter(Boolean).length;

  return (
    <div style={s.panel}>
      {/* Bütçe Kartı */}
      <BudgetCard budget={budget} />

      <div style={s.spacer} />

      {/* Kontrol Listesi */}
      <div style={s.checklistCard}>
        <div style={s.checklistHeader}>
          <p style={s.checklistTitle}>Kontrol Listesi</p>
          <span style={s.checklistCount}>{doneCount}/{CHECKLIST.length}</span>
        </div>

        {/* Mini progress */}
        <div style={s.miniTrack}>
          <div style={{
            ...s.miniFill,
            width: `${Math.round((doneCount / CHECKLIST.length) * 100)}%`,
          }} />
        </div>

        <ul style={s.checkList}>
          {CHECKLIST.map(item => {
            const isChecked = !!checked[item.id];
            return (
              <li key={item.id} style={s.checkItem} onClick={() => toggle(item.id)}>
                <span style={{
                  ...s.checkbox,
                  background: isChecked ? 'var(--success)' : 'transparent',
                  borderColor: isChecked ? 'var(--success)' : 'var(--text3)',
                }}>
                  {isChecked && <TickIcon />}
                </span>
                <span style={{
                  ...s.checkLabel,
                  color: isChecked ? 'var(--text3)' : 'var(--text2)',
                  textDecoration: isChecked ? 'line-through' : 'none',
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
    <svg width="9" height="9" viewBox="0 0 12 12"
      fill="none" stroke="#fff" strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round">
      <polyline points="10 3 5 9 2 6" />
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
  spacer: {
    height: '12px',
  },
  checklistCard: {
    background: 'var(--surface)',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
    padding: '14px',
    width: '100%',
  },
  checklistHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  checklistTitle: {
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    fontSize: '11px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--text3)',
  },
  checklistCount: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--gold)',
    fontWeight: 500,
  },
  miniTrack: {
    height: '3px',
    borderRadius: '99px',
    background: 'var(--surface2)',
    overflow: 'hidden',
    marginBottom: '12px',
  },
  miniFill: {
    height: '100%',
    borderRadius: '99px',
    background: 'var(--success)',
    transition: 'width 0.3s ease',
  },
  checkList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '9px',
  },
  checkItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    cursor: 'pointer',
    userSelect: 'none',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    borderRadius: '4px',
    border: '1.5px solid var(--text3)',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s, border-color 0.15s',
  },
  checkLabel: {
    fontFamily: 'var(--font-sans)',
    fontSize: '12px',
    lineHeight: 1.3,
    transition: 'color 0.15s',
  },
};
