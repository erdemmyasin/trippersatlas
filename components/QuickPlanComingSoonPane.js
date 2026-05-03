'use client';

/**
 * Konaklama / uçuş vb. tam ekranlar gelene dek Hızlı Plan altındaki turlar & aktiviteler için iskelet.
 */
export default function QuickPlanComingSoonPane({ title, body }) {
  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        overflow: 'auto',
        boxSizing: 'border-box',
        padding: '28px 24px',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--ta-ink-muted)',
        }}
      >
        Hızlı Plan
      </p>
      <h1
        style={{
          margin: '12px 0 10px',
          fontSize: 26,
          fontWeight: 700,
          color: 'var(--ta-ink)',
          lineHeight: 1.25,
        }}
      >
        {title}
      </h1>
      <p
        style={{
          margin: 0,
          maxWidth: 520,
          fontSize: 15,
          lineHeight: 1.55,
          color: 'var(--ta-ink-muted)',
        }}
      >
        {body}
      </p>
    </div>
  );
}
