'use client';

import Skeleton from '@/components/Skeleton';

/**
 * Search ekranlarındaki sonuç listesi yüklenirken gösterilen skeleton.
 *
 * `narrow=true` mobil tek-kolon görünüm; aksi halde 3-kolon (icon-meta-price) layout.
 *
 * @example
 *   {loading ? <SkeletonList rows={5} narrow={isPhone} /> : <Results />}
 */
export default function SkeletonList({ rows = 5, narrow = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <article
          key={i}
          style={{
            background: '#fff',
            borderWidth: 'var(--border-thin)',
            borderStyle: 'solid',
            borderColor: 'rgba(0,0,0,.08)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-5)',
            display: 'grid',
            gridTemplateColumns: narrow ? '1fr' : 'minmax(128px, 168px) 1fr minmax(120px, 180px)',
            gap: 'var(--space-4)',
            alignItems: 'center',
          }}
        >
          {/* Sol: ikon/avatar */}
          <Skeleton width={44} height={44} radius="var(--radius-sm)" />

          {/* Orta: 2 satır metin */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <Skeleton width="70%" height={14} />
            <Skeleton width="50%" height={12} />
          </div>

          {/* Sağ: action */}
          {!narrow ? <Skeleton width="100%" height={40} radius="var(--radius-sm)" /> : null}
        </article>
      ))}
    </div>
  );
}
