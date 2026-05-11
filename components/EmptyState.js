'use client';

/**
 * Atomic empty/info state — 6 search ekranındaki tekrarlayan pattern'in tek bileşeni:
 * dairesel ikon + başlık + açıklama + opsiyonel action.
 *
 * Kullanım:
 *   <EmptyState
 *     icon={Bus}
 *     title="Otobüs Ara"
 *     description="Kalkış ve varış şehrini seçin, tarihi belirleyin; seferleri listeleyin."
 *   />
 *
 *   <EmptyState
 *     icon={SearchX}
 *     tone="muted"
 *     title="Bu filtrelere uygun sefer yok"
 *     description="Filtreleri genişletmeyi deneyin."
 *     action={<button onClick={resetFilters}>Filtreleri sıfırla</button>}
 *   />
 *
 * `tone="error"` kırmızımsı tonda görünüm (henüz kullanılmıyor, ileride hata için).
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = 'default',
  iconSize = 36,
  maxWidth = 480,
  compact = false,
}) {
  const iconColor =
    tone === 'error' ? 'var(--ta-danger)' : tone === 'muted' ? 'var(--ta-ink-subtle)' : 'var(--ta-accent-deep)';
  const iconBg =
    tone === 'error'
      ? 'rgba(178, 61, 74, 0.10)'
      : tone === 'muted'
      ? 'var(--ta-muted-bg)'
      : 'var(--ta-accent-soft)';

  return (
    <div
      role="status"
      style={{
        ...s.wrap,
        ...(compact ? s.wrapCompact : {}),
        maxWidth,
      }}
    >
      {Icon ? (
        <span style={{ ...s.iconWrap, background: iconBg }} aria-hidden>
          <Icon size={iconSize} strokeWidth={1.6} color={iconColor} />
        </span>
      ) : null}
      {title ? <h3 style={s.title}>{title}</h3> : null}
      {description ? <p style={s.desc}>{description}</p> : null}
      {action ? <div style={s.action}>{action}</div> : null}
    </div>
  );
}

const s = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: 'var(--space-9) var(--space-6)',
    margin: '0 auto',
    color: 'var(--ta-ink-muted)',
    fontFamily: 'var(--font-sans)',
  },
  wrapCompact: {
    padding: 'var(--space-5) var(--space-4)',
  },
  iconWrap: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    height: 64,
    borderRadius: '50%',
    marginBottom: 'var(--space-4)',
  },
  title: {
    margin: '0 0 var(--space-2)',
    fontSize: 'var(--text-xl)',
    fontWeight: 'var(--fw-semibold)',
    color: 'var(--ta-ink)',
    letterSpacing: '-0.01em',
    lineHeight: 1.3,
  },
  desc: {
    margin: 0,
    fontSize: 'var(--text-md)',
    fontWeight: 'var(--fw-regular)',
    color: 'var(--ta-ink-subtle)',
    lineHeight: 1.55,
    maxWidth: '60ch',
  },
  action: {
    marginTop: 'var(--space-5)',
  },
};
