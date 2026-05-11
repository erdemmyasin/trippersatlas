'use client';

import { useCallback, useMemo, useState } from 'react';

/**
 * Mutually exclusive popover state — yalnızca tek bir ID aynı anda açık.
 *
 * Tipik kullanım — search ekranlarında 3-4 popover (city, date, pax, ...) için
 * ayrı `useState` + bir tıklamada diğerlerini kapatma boilerplate'ini ortadan kaldırır.
 *
 * @example
 * const popover = useExclusivePopover();
 *
 * <FilterField
 *   expanded={popover.isOpen('city')}
 *   onClick={() => popover.toggle('city')}
 * />
 *
 * // anyOpen → çubukta global "açık popover" durumu için
 * const quickPanelsOpen = popover.anyOpen;
 *
 * // close → backdrop tıklamasında / arama gönderiminde hepsini kapat
 * onSearch={() => { popover.close(); doSearch(); }}
 *
 * @returns {{
 *   openId: string|null,
 *   anyOpen: boolean,
 *   isOpen: (id: string) => boolean,
 *   open: (id: string) => void,
 *   close: () => void,
 *   toggle: (id: string) => void,
 * }}
 */
export function useExclusivePopover(initialId = null) {
  const [openId, setOpenId] = useState(initialId);

  const isOpen = useCallback((id) => openId === id, [openId]);
  const open = useCallback((id) => setOpenId(id), []);
  const close = useCallback(() => setOpenId(null), []);
  const toggle = useCallback((id) => {
    setOpenId((cur) => (cur === id ? null : id));
  }, []);

  return useMemo(
    () => ({
      openId,
      anyOpen: openId != null,
      isOpen,
      open,
      close,
      toggle,
    }),
    [openId, isOpen, open, close, toggle]
  );
}

export default useExclusivePopover;
