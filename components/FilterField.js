'use client';

import { forwardRef } from 'react';
import { qp } from '@/lib/quickPlanFilterStyles';

/**
 * Atomic filter field — search bar'larındaki ikon+label+value kutusu.
 * `qp.fieldCard / fieldLbl / fieldVal` token'larını React komponenti olarak sarar.
 *
 * Örnek kullanım:
 *   <FilterField
 *     ref={cityBtnRef}
 *     icon={MapPin}
 *     label="Destinasyon"
 *     value={city.trim()}
 *     placeholder="Şehir / bölge"
 *     flex="1 1 180px"
 *     isPhone={isPhone}
 *     expanded={stayCityOpen}
 *     onClick={() => setStayCityOpen(v => !v)}
 *   />
 *
 * Notlar:
 * - `value` falsy / boş string ise `placeholder` muted stille gösterilir.
 * - `flex` desktop genişliği (örn. '1 1 180px'); isPhone=true iken otomatik full-width override.
 * - `grow` (default true) → `qp.fieldCardGrow` ekler (route/tarih gibi geniş kutular).
 *   Daha dar kutu için `grow={false}` kullan.
 * - `static` (default true) → `qp.fieldCardStatic` ekler (cursor: default; tıklanabilir alanlar
 *   içerideki çocuklarda olabilir). `onClick` direkt verilirse otomatik `static={false}` olur.
 * - `right` slot: kutunun sağ kenarına chevron veya ek ikon koymak için.
 */
const FilterField = forwardRef(function FilterField(
  {
    icon: Icon,
    label,
    value,
    placeholder = '',
    flex,
    isPhone = false,
    expanded,
    onClick,
    grow = true,
    static: isStatic,
    right,
    ariaLabel,
    extraStyle,
    minWidth,
    ...rest
  },
  ref
) {
  const filled = Boolean(String(value || '').trim());
  const showText = filled ? String(value).trim() : (placeholder || '');
  const valStyle = filled ? qp.fieldVal : { ...qp.fieldVal, ...qp.fieldPlaceholder };

  // Sadece tıklanabilir kutuların static=false olması mantıklı (cursor pointer).
  // Geriye dönük uyumluluk: caller `static` prop'unu açıkça geçerse ona uy; aksi halde
  // onClick varsa interaktif (false), yoksa statik (true).
  const useStatic = typeof isStatic === 'boolean' ? isStatic : !onClick;

  const baseStyle = {
    ...qp.fieldCard,
    ...(grow ? qp.fieldCardGrow : {}),
    ...(useStatic ? qp.fieldCardStatic : {}),
    ...(flex ? { flex } : {}),
    ...(minWidth != null ? { minWidth } : {}),
    ...(isPhone ? { width: '100%', flex: '1 1 100%' } : {}),
    ...(extraStyle || {}),
  };

  return (
    <button
      ref={ref}
      type="button"
      style={baseStyle}
      onClick={onClick}
      aria-expanded={expanded}
      aria-haspopup={onClick ? 'dialog' : undefined}
      aria-label={ariaLabel}
      {...rest}
    >
      {Icon ? <Icon size={18} strokeWidth={1.85} color="#1a3764" aria-hidden /> : null}
      <span style={{ minWidth: 0, flex: 1 }}>
        {label ? <span style={qp.fieldLbl}>{label}</span> : null}
        <span style={valStyle}>{showText}</span>
      </span>
      {right || null}
    </button>
  );
});

export default FilterField;
