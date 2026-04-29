'use client';

/**
 * Sohbet /chat: “Akıllı öneri” soldaki plan panelinden çıkarılıp haritanın altında gösterilir.
 */
export default function ChatMapSmartInsight() {
  return (
    <div style={s.wrap}>
      <div style={s.sectionTitle}>
        <span>Akıllı öneri</span>
      </div>
      <div style={s.adviceCard}>
        <p style={s.adviceText}>
          Konaklama ve aktiviteler netleşmeye yaklaştı. İstersen bir sonraki adımda yalnızca transfer kısmını
          tamamlayıp planı sabitleyebiliriz.
        </p>
      </div>
    </div>
  );
}

const s = {
  wrap: {
    flexShrink: 0,
    width: '100%',
    boxSizing: 'border-box',
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10px',
    fontSize: '12px',
    color: 'var(--muted)',
    textTransform: 'uppercase',
    letterSpacing: '.08em',
    fontWeight: 700,
    fontFamily: 'var(--font-sans)',
  },
  adviceCard: {
    border: '1px solid var(--line)',
    background: 'rgba(255,255,255,.72)',
    borderRadius: '18px',
    padding: '14px',
    boxSizing: 'border-box',
  },
  adviceText: {
    fontFamily: 'var(--font-sans)',
    fontSize: '13px',
    color: 'var(--ta-ink-muted)',
    lineHeight: 1.5,
    margin: 0,
  },
};
