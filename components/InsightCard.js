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
    background: 'rgba(255,255,255,.85)',
    border: '1px solid rgba(0,0,0,.06)',
    borderRadius: '18px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    boxShadow: '0 14px 28px rgba(0,0,0,.05)',
  },
  badge: {
    display: 'inline-flex',
    alignSelf: 'flex-start',
    borderRadius: '999px',
    background: 'rgba(20,20,20,.05)',
    fontSize: '11px',
    fontWeight: 800,
    color: '#51493f',
    padding: '5px 9px',
    fontFamily: 'var(--font-sans)',
    marginBottom: '2px',
  },
  text: {
    fontFamily: 'var(--font-sans)',
    fontSize: '13px',
    color: '#51493f',
    lineHeight: 1.5,
  },
  confirm: {
    fontFamily: 'var(--font-sans)',
    fontSize: '11px',
    color: 'var(--muted)',
  },
};
