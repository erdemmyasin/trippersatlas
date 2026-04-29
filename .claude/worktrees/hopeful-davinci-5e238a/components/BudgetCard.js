'use client';

const CATEGORIES = [
  { key: 'accommodation', label: 'Konaklama',   icon: '🏨' },
  { key: 'transport',     label: 'Transfer',     icon: '🚗' },
  { key: 'activities',    label: 'Aktiviteler',  icon: '🎡' },
  { key: 'extras',        label: 'Diğer',        icon: '✨' },
];

export default function BudgetCard({ budget = {} }) {
  const values = CATEGORIES.map(c => budget[c.key] ?? 0);
  const total  = values.reduce((a, b) => a + b, 0);
  const limit  = budget.limit ?? 0;
  const pct    = limit > 0 ? Math.min(100, Math.round((total / limit) * 100)) : 0;

  return (
    <div style={s.card}>
      {/* Başlık */}
      <p style={s.cardTitle}>Bütçe Özeti</p>

      {/* Toplam */}
      <div style={s.totalRow}>
        <span style={s.totalLabel}>Toplam</span>
        <span style={s.totalAmount}>₺{total.toLocaleString('tr-TR')}</span>
      </div>

      {/* Progress bar */}
      <div style={s.barTrack}>
        <div style={{ ...s.barFill, width: `${pct}%` }} />
      </div>
      {limit > 0 && (
        <p style={s.barLabel}>
          Bütçe limiti: ₺{limit.toLocaleString('tr-TR')} ({pct}%)
        </p>
      )}

      <div style={s.divider} />

      {/* Kategoriler */}
      <div style={s.catList}>
        {CATEGORIES.map((cat, i) => (
          <div key={cat.key} style={s.catRow}>
            <span style={s.catIcon}>{cat.icon}</span>
            <span style={s.catLabel}>{cat.label}</span>
            <span style={s.catAmount}>₺{(values[i]).toLocaleString('tr-TR')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  card: {
    background: 'var(--surface)',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
    padding: '14px',
    width: '100%',
  },
  cardTitle: {
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    fontSize: '11px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--text3)',
    marginBottom: '10px',
  },
  totalRow: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: '10px',
  },
  totalLabel: {
    fontFamily: 'var(--font-sans)',
    fontSize: '12px',
    color: 'var(--text2)',
  },
  totalAmount: {
    fontFamily: 'var(--font-serif)',
    fontWeight: 700,
    fontSize: '22px',
    color: 'var(--gold)',
    lineHeight: 1,
  },
  barTrack: {
    height: '5px',
    borderRadius: '99px',
    background: 'var(--surface2)',
    overflow: 'hidden',
    marginBottom: '4px',
  },
  barFill: {
    height: '100%',
    borderRadius: '99px',
    background: 'var(--gold)',
    transition: 'width 0.4s ease',
  },
  barLabel: {
    fontFamily: 'var(--font-sans)',
    fontSize: '10px',
    color: 'var(--text3)',
    marginBottom: '8px',
  },
  divider: {
    height: '1px',
    background: 'var(--border)',
    margin: '10px 0',
  },
  catList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
  },
  catRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
  },
  catIcon: {
    fontSize: '13px',
    flexShrink: 0,
  },
  catLabel: {
    flex: 1,
    fontFamily: 'var(--font-sans)',
    fontSize: '12px',
    color: 'var(--text2)',
  },
  catAmount: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    color: 'var(--text1)',
    fontWeight: 500,
  },
};
