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
    gap: '6px',
    padding: '12px 16px',
    background: 'white',
    borderRadius: '999px',
    border: '1px solid rgba(0,0,0,.05)',
    marginLeft: '46px',
    width: 'fit-content',
    boxShadow: '0 4px 12px rgba(0,0,0,.04)',
  },
  dot1: { ...dotBase },
  dot2: { ...dotBase, animationDelay: '.16s' },
  dot3: { ...dotBase, animationDelay: '.32s' },
};
