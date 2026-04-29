import Link from 'next/link';

export const metadata = {
  title: 'Gizlilik politikası — Atlas',
  description: 'Atlas gizlilik politikası özeti.',
};

export default function GizlilikPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '40px 24px 64px',
        maxWidth: 640,
        margin: '0 auto',
        fontFamily: 'var(--font-sans)',
        lineHeight: 1.6,
        color: 'var(--ta-ink)',
      }}
    >
      <Link
        href="/"
        style={{
          fontSize: 14,
          color: 'var(--ta-ink-muted)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Ana sayfa
      </Link>
      <h1 style={{ marginTop: 24, fontSize: 28, fontWeight: 800 }}>Gizlilik politikası</h1>
      <p style={{ color: 'var(--ta-ink-muted)', marginTop: 12 }}>
        Bu sayfa özet bilgilendirme amaçlıdır. Üyelik verileri şu an yalnızca tarayıcınızda (localStorage)
        saklanmaktadır; sunucuya gönderilmez. Üçüncü taraf hizmetleri (ör. harita, otel araması) kendi
        gizlilik koşullarına tabidir.
      </p>
      <p style={{ color: 'var(--ta-ink-muted)', marginTop: 12 }}>
        Sorularınız için uygulama içinden geri bildirim gönderebilirsiniz.
      </p>
    </div>
  );
}
