'use client';

const SOURCE_META = {
  Google:        { label: '🔍 Google içgörüsü', bg: 'rgba(66,133,244,0.10)', color: '#4285F4' },
  Reddit:        { label: '💬 Reddit yorumu',   bg: 'rgba(255,69,0,0.10)',   color: '#FF4500' },
  'Ekşi Sözlük': { label: '📝 Ekşi Sözlük',    bg: 'rgba(0,128,96,0.10)',   color: '#008060' },
};

const DEFAULT_META = { label: '💬 Yerel yorumlar', bg: 'rgba(107,114,128,0.10)', color: '#6B7280' };

export default function InsightCard({ insight }) {
  if (!insight) return null;

  const { source, text, confirmations } = insight;
  const meta = SOURCE_META[source] ?? DEFAULT_META;

  return (
    <div style={s.card}>
      <span style={{ ...s.badge, background: meta.bg, color: meta.color }}>
        {meta.label}
      </span>
      <p style={s.text}>{text}</p>
      {confirmations > 0 && (
        <p style={s.confirm}>👍 {confirmations} kişi onayladı</p>
      )}
    </div>
  );
}

const s = {
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
    minWidth: 0,
  },
  badge: {
    display: 'inline-block',
    alignSelf: 'flex-start',
    borderRadius: '99px',
    fontSize: '11px',
    fontWeight: 600,
    fontFamily: 'var(--font-sans)',
    padding: '3px 10px',
    letterSpacing: '0.01em',
  },
  text: {
    fontFamily: 'var(--font-sans)',
    fontSize: '12px',
    color: 'var(--text2)',
    lineHeight: 1.55,
  },
  confirm: {
    fontFamily: 'var(--font-sans)',
    fontSize: '11px',
    color: 'var(--text3)',
  },
};
