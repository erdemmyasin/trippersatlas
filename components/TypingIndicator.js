'use client';

export default function TypingIndicator() {
  return (
    <div style={s.wrap}>
      <div style={s.avatar}>A</div>
      <div style={s.bubble}>
        <span style={{ ...s.dot, animationDelay: '0ms' }} />
        <span style={{ ...s.dot, animationDelay: '160ms' }} />
        <span style={{ ...s.dot, animationDelay: '320ms' }} />
      </div>
      <style>{`
        @keyframes ta-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: .4; }
          30%            { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

const s = {
  wrap: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
    padding: '4px 0',
  },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'var(--gold-soft)',
    border: '1.5px solid var(--gold)',
    color: 'var(--gold)',
    fontSize: '11px',
    fontWeight: 600,
    fontFamily: 'var(--font-serif)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bubble: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '16px 16px 16px 4px',
    padding: '10px 14px',
    boxShadow: 'var(--shadow-sm)',
  },
  dot: {
    display: 'inline-block',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--text3)',
    animation: 'ta-bounce 1.1s ease-in-out infinite',
  },
};
