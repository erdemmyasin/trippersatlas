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
    gap: '10px',
    flexWrap: 'wrap',
    paddingLeft: '46px',
    marginTop: '4px',
  },
  reply: {
    border: '1px solid rgba(0,0,0,.06)',
    background: 'rgba(255,255,255,.78)',
    borderRadius: '999px',
    padding: '9px 14px',
    fontSize: '13px',
    cursor: 'pointer',
    color: '#40372d',
    fontWeight: 600,
    fontFamily: 'var(--font-sans)',
    transition: 'background .15s, box-shadow .15s',
    boxShadow: '0 4px 10px rgba(0,0,0,.04)',
  },
};
