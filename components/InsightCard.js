'use client';

import { MessageCircle, Search, ThumbsUp } from 'lucide-react';

const SOURCE_META = {
  Google: { label: 'Google içgörüsü', bg: 'rgba(66,133,244,0.10)', color: '#4285F4', Icon: Search },
  Reddit: { label: 'Reddit yorumu', bg: 'rgba(255,69,0,0.10)', color: '#FF4500', Icon: MessageCircle },
  'Ekşi Sözlük': { label: 'Ekşi Sözlük', bg: 'rgba(0,128,96,0.10)', color: '#008060', Icon: MessageCircle },
};

const DEFAULT_META = {
  label: 'Yerel yorumlar',
  bg: 'rgba(107,114,128,0.10)',
  color: '#6B7280',
  Icon: MessageCircle,
};

export default function InsightCard({ insight }) {
  if (!insight) return null;

  const { source, text, confirmations } = insight;
  const meta = SOURCE_META[source] ?? DEFAULT_META;
  const BadgeIcon = meta.Icon;

  return (
    <div style={s.card}>
      <span style={{ ...s.badge, background: meta.bg, color: meta.color }}>
        <BadgeIcon size={12} strokeWidth={2} aria-hidden style={{ flexShrink: 0 }} />
        {meta.label}
      </span>
      <p style={s.text}>{text}</p>
      {confirmations > 0 && (
        <p style={s.confirm}>
          <ThumbsUp size={12} strokeWidth={2} aria-hidden style={{ flexShrink: 0 }} />
          {confirmations} kişi onayladı
        </p>
      )}
    </div>
  );
}

const s = {
  card: {
    background: 'rgba(255,255,255,.85)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(0,0,0,.06)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-4)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
    boxShadow: '0 14px 28px rgba(0,0,0,.05)',
  },
  badge: {
    display: 'inline-flex',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 'var(--space-2)',
    borderRadius: 'var(--radius-pill)',
    background: 'rgba(20,20,20,.05)',
    fontSize: 'var(--text-xs)',
    lineHeight: 'var(--text-xs-lh)',
    fontWeight: 'var(--fw-extrabold)',
    color: '#51493f',
    padding: 'var(--space-1) var(--space-2)',
    fontFamily: 'var(--font-sans)',
    marginBottom: 'var(--space-px)',
  },
  text: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-base)',
    lineHeight: 'var(--text-base-lh)',
    color: '#51493f',
  },
  confirm: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-1)',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-xs)',
    lineHeight: 'var(--text-xs-lh)',
    color: 'var(--muted)',
  },
};
