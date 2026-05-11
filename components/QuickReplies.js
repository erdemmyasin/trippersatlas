'use client';

export default function QuickReplies({ replies = [], onSelect }) {
  if (!replies.length) return null;

  return (
    <div style={s.wrap}>
      {replies.map((r, i) => (
        <button
          key={i}
          style={s.reply}
          onClick={() => onSelect?.(r)}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

const s = {
  wrap: {
    display: 'flex',
    gap: 'var(--space-3)',
    flexWrap: 'wrap',
    paddingLeft: '46px',
    marginTop: 'var(--space-1)',
  },
  reply: {
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(0,0,0,.06)',
    background: 'rgba(255,255,255,.78)',
    borderRadius: 'var(--radius-pill)',
    padding: 'var(--space-2) var(--space-4)',
    fontSize: 'var(--text-base)',
    lineHeight: 'var(--text-base-lh)',
    cursor: 'pointer',
    color: '#40372d',
    fontWeight: 'var(--fw-semibold)',
    fontFamily: 'var(--font-sans)',
    transition: 'background var(--duration-base) var(--ease-out), box-shadow var(--duration-base) var(--ease-out)',
    boxShadow: '0 4px 10px rgba(0,0,0,.04)',
  },
};
