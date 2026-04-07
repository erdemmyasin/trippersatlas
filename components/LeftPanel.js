'use client';

const MODULES = [
  { id: 'purpose',      icon: '🎯', label: 'Amaç',         status: 'active' },
  { id: 'lodging',      icon: '🏨', label: 'Konaklama',    status: 'idle' },
  { id: 'transfer',     icon: '🚗', label: 'Transfer',     status: 'idle' },
  { id: 'activities',   icon: '🎡', label: 'Aktiviteler',  status: 'idle' },
  { id: 'extras',       icon: '✨', label: 'Ek Hizmetler', status: 'idle' },
];

export default function LeftPanel() {
  return (
    <div style={s.panel}>
      {/* Başlık */}
      <div style={s.titleRow}>
        <span style={s.titleIcon}>🗺️</span>
        <h2 style={s.title}>Seyahat Planı</h2>
      </div>

      <div style={s.divider} />

      {/* Modül listesi */}
      <nav style={s.moduleList}>
        {MODULES.map(mod => (
          <ModuleRow key={mod.id} mod={mod} />
        ))}
      </nav>

      <div style={s.divider} />

      {/* Plan Özeti */}
      <div style={s.summary}>
        <p style={s.summaryTitle}>Plan Özeti</p>
        <div style={s.emptyState}>
          <span style={s.emptyIcon}>📋</span>
          <p style={s.emptyText}>Henüz seçilmemiş öğe yok</p>
          <p style={s.emptyHint}>Sohbete başlayın, planınız burada oluşsun.</p>
        </div>
      </div>
    </div>
  );
}

function ModuleRow({ mod }) {
  const isActive = mod.status === 'active';
  const isDone   = mod.status === 'done';

  return (
    <div style={{
      ...s.moduleRow,
      background: isActive ? 'var(--gold-soft)' : 'transparent',
      borderLeft: isActive
        ? '3px solid var(--gold)'
        : isDone
          ? '3px solid var(--success)'
          : '3px solid transparent',
    }}>
      <span style={s.moduleIcon}>{mod.icon}</span>

      <span style={{
        ...s.moduleLabel,
        color: isActive
          ? 'var(--gold)'
          : isDone
            ? 'var(--success)'
            : 'var(--text2)',
        fontWeight: isActive ? 600 : 400,
      }}>
        {mod.label}
      </span>

      <span style={s.statusDot}>
        {isDone
          ? <CheckIcon />
          : isActive
            ? <ActiveDot />
            : <IdleDot />}
      </span>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="var(--success)" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ActiveDot() {
  return (
    <span style={{
      display: 'inline-block',
      width: '7px',
      height: '7px',
      borderRadius: '50%',
      background: 'var(--gold)',
    }} />
  );
}

function IdleDot() {
  return (
    <span style={{
      display: 'inline-block',
      width: '7px',
      height: '7px',
      borderRadius: '50%',
      border: '1.5px solid var(--text3)',
    }} />
  );
}

const s = {
  panel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    width: '100%',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 0 12px',
  },
  titleIcon: {
    fontSize: '18px',
  },
  title: {
    fontFamily: 'var(--font-serif)',
    fontWeight: 700,
    fontSize: '16px',
    color: 'var(--text1)',
    lineHeight: 1,
  },
  divider: {
    height: '1px',
    background: 'var(--border)',
    margin: '4px 0',
  },
  moduleList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: '10px 0',
  },
  moduleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '9px 10px',
    borderRadius: '8px',
    cursor: 'default',
    transition: 'background 0.15s',
  },
  moduleIcon: {
    fontSize: '16px',
    flexShrink: 0,
  },
  moduleLabel: {
    flex: 1,
    fontFamily: 'var(--font-sans)',
    fontSize: '13px',
    lineHeight: 1,
  },
  statusDot: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '16px',
  },
  summary: {
    padding: '12px 0 4px',
  },
  summaryTitle: {
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    fontSize: '11px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--text3)',
    marginBottom: '10px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: '16px 8px',
    background: 'var(--surface2)',
    borderRadius: '10px',
    border: '1px dashed var(--border)',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: '22px',
    marginBottom: '2px',
  },
  emptyText: {
    fontFamily: 'var(--font-sans)',
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--text2)',
  },
  emptyHint: {
    fontFamily: 'var(--font-sans)',
    fontSize: '11px',
    color: 'var(--text3)',
    lineHeight: 1.4,
  },
};
