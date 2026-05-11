'use client';

export default function TypingIndicator() {
  return (
    <div style={s.wrap}>
      <div style={s.dot1} />
      <div style={s.dot2} />
      <div style={s.dot3} />
    </div>
  );
}

const dotBase = {
  width: '7px',
  height: '7px',
  borderRadius: '50%',
  background: '#baa889',
  animation: 'ta-bounce 1.2s infinite ease-in-out',
};

const s = {
  wrap: {
    display: 'inline-flex',
    gap: 'var(--space-2)',
    padding: 'var(--space-3) var(--space-4)',
    background: 'white',
    borderRadius: 'var(--radius-pill)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(0,0,0,.05)',
    marginLeft: '46px',
    width: 'fit-content',
    boxShadow: '0 4px 12px rgba(0,0,0,.04)',
  },
  dot1: { ...dotBase },
  dot2: { ...dotBase, animationDelay: '.16s' },
  dot3: { ...dotBase, animationDelay: '.32s' },
};
