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
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  background: 'var(--ta-accent)',
  opacity: 0.6,
  animation: 'ta-bounce 1.2s infinite ease-in-out',
};

const s = {
  wrap: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-1)',
    paddingLeft: 'var(--space-5)',
    paddingTop: 2,
    paddingBottom: 2,
    borderLeftWidth: 2,
    borderLeftStyle: 'solid',
    borderLeftColor: '#C9A86A',
    width: 'fit-content',
    alignSelf: 'flex-start',
  },
  dot1: { ...dotBase },
  dot2: { ...dotBase, animationDelay: '.16s' },
  dot3: { ...dotBase, animationDelay: '.32s' },
};
