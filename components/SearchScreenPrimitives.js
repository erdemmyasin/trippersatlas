'use client';

import { useState, useEffect } from 'react';

/** @param {string} query CSS media query, örn. '(max-width: 1024px)' */
export function useMatchMedia(query) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const fn = () => setMatches(mq.matches);
    fn();
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, [query]);
  return matches;
}

/** Dikey telefon — sütun düzeni, tam genişlik kontroller */
export function useIsPhoneLayout() {
  return useMatchMedia('(max-width: 600px)');
}

/** Tablet + telefon — harita üçlü bölünmez; dar masaüstü dahil ≤1024 */
export function useIsCompactSearchLayout() {
  return useMatchMedia('(max-width: 1024px)');
}

/** Filtre + liste + harita üçlü sütun (otobüs / uçuş / konaklama / araç) */
export function useSearchMapSplitWide(minPx = 1100) {
  return useMatchMedia(`(min-width: ${minPx}px)`);
}

export function useIsMobile(breakpoint = 900) {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const fn = () => setM(mq.matches);
    fn();
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, [breakpoint]);
  return m;
}

export function RangeDual({ min, max, value, onChange, format }) {
  const lo = value[0];
  const hi = value[1];
  return (
    <div style={{ marginTop: 6, marginBottom: 14 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11,
          color: 'var(--ta-ink-muted)',
          marginBottom: 4,
        }}
      >
        <span>{format(lo)}</span>
        <span>{format(hi)}</span>
      </div>
      <div style={{ position: 'relative', height: 28 }}>
        <input
          type="range"
          min={min}
          max={max}
          value={Math.min(lo, hi)}
          onChange={(e) => {
            const v = Number(e.target.value);
            onChange([Math.min(v, hi), hi]);
          }}
          style={{
            position: 'absolute',
            width: '100%',
            accentColor: 'var(--ta-accent)',
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={Math.max(lo, hi)}
          onChange={(e) => {
            const v = Number(e.target.value);
            onChange([lo, Math.max(v, lo)]);
          }}
          style={{
            position: 'absolute',
            width: '100%',
            accentColor: 'var(--ta-accent)',
          }}
        />
      </div>
    </div>
  );
}

export function CounterMini({ label, value, min, max, onChange, compact }) {
  const btn = compact ? miniBtnCompact : miniBtn;
  const gap = compact ? 6 : 10;
  const innerGap = compact ? 5 : 8;
  const valW = compact ? 18 : 22;
  const valFs = compact ? 12 : 14;
  const labFs = compact ? 11 : 12;
  const padY = compact ? '1px 0' : '4px 0';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: label ? 'space-between' : 'center',
        gap,
        padding: padY,
      }}
    >
      {label ? (
        <span style={{ fontSize: labFs, fontWeight: 600, color: 'var(--ta-ink-2)' }}>{label}</span>
      ) : null}
      <div style={{ display: 'flex', alignItems: 'center', gap: innerGap }}>
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          style={{
            ...btn,
            ...(value <= min
              ? { opacity: 0.42, cursor: 'not-allowed', boxShadow: 'none' }
              : {}),
          }}
        >
          −
        </button>
        <span
          style={{
            width: valW,
            textAlign: 'center',
            fontWeight: 700,
            fontSize: valFs,
            color: 'var(--ta-ink)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          style={{
            ...btn,
            ...(value >= max
              ? { opacity: 0.42, cursor: 'not-allowed', boxShadow: 'none' }
              : {}),
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}

const miniBtnBase = {
  cursor: 'pointer',
  lineHeight: 1,
  padding: 0,
  fontFamily: 'inherit',
  color: 'var(--ta-ink)',
  border: '1px solid var(--ta-border-strong)',
  background: 'var(--ta-elevated)',
  boxShadow: '0 1px 0 rgba(255,255,255,.9) inset',
};

const miniBtn = {
  ...miniBtnBase,
  width: 28,
  height: 28,
  borderRadius: 8,
  fontSize: 16,
};

const miniBtnCompact = {
  ...miniBtnBase,
  width: 22,
  height: 22,
  borderRadius: 7,
  fontSize: 13,
};
