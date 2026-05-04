'use client';

import { useEffect } from 'react';

/**
 * Üst bardaki sabit konumlu popover'lar için: bardaki ve panel içindeki tıklamaları yok sayar,
 * dışarı tıklanınca kapatır.
 */
export function useQuickPlanBarDismiss(isActive, shouldIgnoreTarget, onDismiss) {
  useEffect(() => {
    if (!isActive) return undefined;
    function onPointerDown(ev) {
      const t = ev.target;
      if (!(t instanceof Node)) return;
      if (shouldIgnoreTarget(t)) return;
      onDismiss();
    }
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [isActive, shouldIgnoreTarget, onDismiss]);

  useEffect(() => {
    if (!isActive) return undefined;
    function onEsc(e) {
      if (e.key !== 'Escape') return;
      onDismiss();
    }
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isActive, onDismiss]);
}
