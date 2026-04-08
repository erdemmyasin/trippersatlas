'use client';

import { useState } from 'react';

const BUDGET_CATS = [
  { key: 'accommodation', label: 'Konaklama' },
  { key: 'transport',     label: 'Transfer' },
  { key: 'activities',    label: 'Aktiviteler' },
  { key: 'extras',        label: 'Diğer' },
];

const CHECKLIST = [
  { id: 'dest',        label: 'Şehir ve tarih aralığı netleşti' },
  { id: 'lodging',     label: 'Konaklama tipi daraltıldı' },
  { id: 'transfer',    label: 'Transfer talebi opsiyonel tutuluyor' },
  { id: 'activities',  label: 'Aktivite rotası hazır' },
  { id: 'reservation', label: 'Plan istenirse rezervasyona çevrilebilir' },
];

const MARKERS = [
  { top: '43%', left: '58%', label: 'Riverside Heritage', active: true },
  { top: '38%', left: '63%', label: 'Stone Court',        active: false },
  { top: '56%', left: '47%', label: 'Arkeoloji Müzesi',   active: false },
  { top: '34%', left: '52%', label: 'Amasya Kalesi',      active: false },
  { top: '49%', left: '68%', label: 'Akşam yemeği',       active: false },
];

export default function RightPanel({ budget = {}, completedModules = new Set() }) {
  const [checked, setChecked] = useState({});

  function toggle(id) { setChecked(prev => ({ ...prev, [id]: !prev[id] })); }
  function isItemDone(item) { return !!checked[item.id] || completedModules.has(item.id); }

  const values    = BUDGET_CATS.map(c => budget[c.key] ?? 0);
  const total     = values.reduce((a, b) => a + b, 0);
  const doneCount = CHECKLIST.filter(isItemDone).length;

  return (
    <>
      {/* ── CSS Harita ── */}
      <div style={s.map}>
        <div className="ta-map-grid" />

        {/* Rota çizgisi */}
        <div style={s.route} />

        {/* Header pills */}
        <div style={s.mapHeader}>
          <span style={s.mapPill}>Harita görünümü · Amasya</span>
          <span style={s.mapPill}>3 otel · 4 durak · 1 transfer</span>
        </div>

        {/* Markers */}
        {MARKERS.map((m, i) => (
          <div key={i} style={{ ...s.markerWrap, top: m.top, left: m.left }}>
            <div style={{ ...s.marker, ...(m.active ? s.markerActive : {}) }} />
            <span style={s.markerLabel}>{m.label}</span>
          </div>
        ))}
      </div>

      {/* ── Bütçe Kartı ── */}
      <div style={s.budgetCard}>
        <div style={s.budgetTop}>
          <div>
            <div style={s.budgetMuted}>Tahmini toplam</div>
            <div style={s.budgetTotal}>
              ₺{total > 0 ? total.toLocaleString('tr-TR') : '0'}
            </div>
          </div>
          <div style={s.budgetMuted}>Esnek plan</div>
        </div>

        <div style={s.breakdown}>
          {BUDGET_CATS.map((cat, i) => {
            const val = values[i];
            const pct = total > 0 ? Math.round((val / total) * 100) : 0;
            return (
              <div key={cat.key} style={s.lineItem}>
                <span style={s.lineLabel}>{cat.label}</span>
                <strong style={s.lineAmt}>₺{val.toLocaleString('tr-TR')}</strong>
                <div style={s.bar}>
                  <div style={{ ...s.fill, width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Plan Kontrol Listesi ── */}
      <div style={s.checkCard}>
        <div style={{ ...s.sectionTitle, marginBottom: '10px' }}>
          <span>Plan kontrol listesi</span>
          <span style={s.checkCount}>{doneCount}/{CHECKLIST.length}</span>
        </div>

        {/* micro progress */}
        <div style={s.microTrack}>
          <div style={{ ...s.microFill, width: `${Math.round((doneCount / CHECKLIST.length) * 100)}%` }} />
        </div>

        <div style={s.checkList}>
          {CHECKLIST.map(item => {
            const done = isItemDone(item);
            return (
              <div key={item.id} style={s.checkItem} onClick={() => toggle(item.id)}>
                <div style={{ ...s.checkBullet, ...(done ? s.checkBulletDone : {}) }}>
                  {done ? '✓' : '·'}
                </div>
                <span style={{
                  ...s.checkLabel,
                  color: done ? 'var(--muted)' : '#453d34',
                  textDecoration: done ? 'line-through' : 'none',
                }}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

const s = {
  /* ── Map ── */
  map: {
    position: 'relative',
    borderRadius: '24px',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,.55)',
    background: `
      radial-gradient(circle at 25% 30%, rgba(122,175,132,.9), rgba(122,175,132,.16) 24%, transparent 26%),
      radial-gradient(circle at 74% 46%, rgba(122,175,132,.8), rgba(122,175,132,.12) 23%, transparent 24%),
      linear-gradient(135deg,#e2ebdf 0%,#d7e3d2 38%,#d5dfd1 39%,#d8d9e6 39.5%,#d2d6ec 100%)
    `,
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.28)',
    minHeight: '200px',
  },
  route: {
    position: 'absolute',
    left: '44%', top: '33%', width: '28%', height: '24%',
    borderStyle: 'dashed',
    borderWidth: '2px',
    borderTopColor: 'rgba(31,27,22,.35)',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRadius: '50%',
    transform: 'rotate(8deg)',
    zIndex: 1,
  },
  mapHeader: {
    position: 'absolute',
    top: '12px', left: '12px', right: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
    zIndex: 3,
  },
  mapPill: {
    background: 'rgba(20,20,20,.72)',
    color: 'white',
    padding: '8px 11px',
    borderRadius: '999px',
    fontSize: '11px',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    boxShadow: '0 10px 22px rgba(0,0,0,.12)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '48%',
  },
  markerWrap: {
    position: 'absolute',
    zIndex: 2,
    transform: 'translate(-50%,-50%)',
    display: 'flex',
    alignItems: 'center',
  },
  marker: {
    width: '18px', height: '18px',
    borderRadius: '999px',
    background: '#1d1a16',
    border: '2.5px solid rgba(255,255,255,.8)',
    boxShadow: '0 6px 14px rgba(0,0,0,.18)',
    flexShrink: 0,
  },
  markerActive: {
    background: 'linear-gradient(180deg,#d3ab5f,#c08d36)',
    width: '22px', height: '22px',
  },
  markerLabel: {
    marginLeft: '6px',
    background: 'rgba(29,26,22,.88)',
    color: 'white',
    fontSize: '10px',
    fontWeight: 700,
    padding: '5px 8px',
    borderRadius: '999px',
    whiteSpace: 'nowrap',
    boxShadow: '0 8px 16px rgba(0,0,0,.12)',
    fontFamily: 'var(--font-sans)',
  },

  /* ── Budget ── */
  budgetCard: {
    border: '1px solid var(--line)',
    background: 'rgba(255,255,255,.8)',
    borderRadius: '20px',
    padding: '16px',
  },
  budgetTop: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: '10px',
    marginBottom: '12px',
  },
  budgetMuted: {
    color: 'var(--muted)',
    fontSize: '12px',
    fontFamily: 'var(--font-sans)',
    marginBottom: '2px',
  },
  budgetTotal: {
    fontFamily: 'var(--font-serif)',
    fontSize: '32px',
    letterSpacing: '-0.04em',
    fontWeight: 700,
    color: 'var(--text1)',
    lineHeight: 1,
  },
  breakdown: {
    display: 'grid',
    gap: '10px',
  },
  lineItem: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: '8px',
    alignItems: 'center',
    fontSize: '13px',
    fontFamily: 'var(--font-sans)',
    color: 'var(--text1)',
  },
  lineLabel: { color: '#453d34' },
  lineAmt:   { color: 'var(--text1)', fontWeight: 700 },
  bar: {
    gridColumn: '1 / -1',
    height: '8px',
    background: 'rgba(20,20,20,.06)',
    borderRadius: '999px',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    background: 'linear-gradient(90deg,#d3ab5f,#c08d36)',
    borderRadius: '999px',
    transition: 'width 0.4s ease',
  },

  /* ── Checklist ── */
  checkCard: {
    border: '1px solid var(--line)',
    background: 'rgba(255,255,255,.8)',
    borderRadius: '20px',
    padding: '16px',
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: 'var(--muted)',
    textTransform: 'uppercase',
    letterSpacing: '.08em',
    fontWeight: 700,
    fontFamily: 'var(--font-sans)',
  },
  checkCount: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--gold-deep)',
    fontWeight: 500,
    textTransform: 'none',
    letterSpacing: 0,
  },
  microTrack: {
    height: '3px',
    background: 'rgba(20,20,20,.07)',
    borderRadius: '999px',
    overflow: 'hidden',
    marginBottom: '12px',
  },
  microFill: {
    height: '100%',
    background: 'var(--green)',
    borderRadius: '999px',
    transition: 'width .3s ease',
  },
  checkList: {
    display: 'grid',
    gap: '10px',
  },
  checkItem: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    fontSize: '13px',
    cursor: 'pointer',
    userSelect: 'none',
  },
  checkBullet: {
    width: '18px', height: '18px',
    borderRadius: '6px',
    border: '1px solid rgba(0,0,0,.14)',
    background: 'rgba(20,20,20,.03)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--muted)',
    fontSize: '12px',
    fontWeight: 900,
    flexShrink: 0,
    fontFamily: 'var(--font-sans)',
    transition: 'background .15s, border-color .15s',
  },
  checkBulletDone: {
    background: 'var(--green)',
    border: '1px solid var(--green)',
    color: 'white',
  },
  checkLabel: {
    fontFamily: 'var(--font-sans)',
    fontSize: '12px',
    lineHeight: 1.4,
  },
};
