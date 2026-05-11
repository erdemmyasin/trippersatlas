'use client';

/**
 * Atomic skeleton — yükleme placeholder'ı.
 *
 * Kullanım:
 *   <Skeleton width={44} height={44} radius={10} />
 *   <Skeleton width="70%" height={14} />
 *   <Skeleton circle size={32} />
 *   <Skeleton width="100%" height={120} radius={16} />
 *
 * Shimmer animation `globals.css`'teki `@keyframes skeletonShimmer` ile çalışır.
 */
export default function Skeleton({
  width = '100%',
  height = 16,
  radius = 'var(--radius-xs)',
  circle = false,
  size,
  style,
  ...rest
}) {
  const w = circle ? size || 32 : width;
  const h = circle ? size || 32 : height;
  const br = circle ? '50%' : radius;

  return (
    <span
      aria-hidden
      style={{
        display: 'block',
        width: typeof w === 'number' ? `${w}px` : w,
        height: typeof h === 'number' ? `${h}px` : h,
        borderRadius: br,
        background:
          'linear-gradient(90deg, var(--ta-skeleton) 25%, var(--ta-skeleton-shine) 50%, var(--ta-skeleton) 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeletonShimmer 1.4s ease-in-out infinite',
        ...style,
      }}
      {...rest}
    />
  );
}
