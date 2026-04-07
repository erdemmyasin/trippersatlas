'use client';

export default function QuickReplies({ replies = [], onSelect }) {
  if (!replies.length) return null;

  return (
    <div style={s.wrap}>
      {replies.map((reply, i) => (
        <button
          key={i}
          style={s.btn}
          onClick={() => onSelect?.(reply)}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--gold-soft)';
            e.currentTarget.style.borderColor = 'var(--gold)';
            e.currentTarget.style.color = 'var(--gold)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--surface)';
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.color = 'var(--text2)';
          }}
        >
          {reply}
        </button>
      ))}
    </div>
  );
}

const s = {
  wrap: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    padding: '4px 0 8px',
    scrollbarWidth: 'none',
  },
  btn: {
    flexShrink: 0,
    padding: '7px 14px',
    borderRadius: 'var(--r-sm)',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text2)',
    fontFamily: 'var(--font-sans)',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 150ms ease',
    whiteSpace: 'nowrap',
  },
};
