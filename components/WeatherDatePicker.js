'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

function pad2(n) {
  return String(n).padStart(2, '0');
}

/** Yerel takvim günü → YYYY-MM-DD */
export function formatLocalYmd(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseYmd(ymd) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [y, m, day] = ymd.split('-').map(Number);
  const d = new Date(y, m - 1, day);
  if (d.getFullYear() !== y || d.getMonth() !== m - 1 || d.getDate() !== day) return null;
  return d;
}

function addDays(d, n) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}

const WEEKDAYS_TR = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];

function monthMatrix(viewYear, viewMonth) {
  const first = new Date(viewYear, viewMonth, 1);
  const startPad = (first.getDay() + 6) % 7; // Monday = 0
  const dim = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let day = 1; day <= dim; day++) cells.push(new Date(viewYear, viewMonth, day));
  while (cells.length % 7 !== 0) cells.push(null);
  while (cells.length < 42) cells.push(null);
  return cells;
}

/**
 * @param {object} props
 * @param {string} props.value YYYY-MM-DD
 * @param {(ymd: string) => void} props.onChange
 * @param {string} props.minYmd
 * @param {string} props.maxYmd
 */
export default function WeatherDatePicker({ value, onChange, minYmd, maxYmd }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const parsed = parseYmd(value);
  const [viewYear, setViewYear] = useState(() => (parsed || new Date()).getFullYear());
  const [viewMonth, setViewMonth] = useState(() => (parsed || new Date()).getMonth());

  useEffect(() => {
    const p = parseYmd(value);
    if (p) {
      setViewYear(p.getFullYear());
      setViewMonth(p.getMonth());
    }
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const label = useMemo(() => {
    try {
      const d = parseYmd(value) || new Date();
      return new Intl.DateTimeFormat('tr-TR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(d);
    } catch {
      return value;
    }
  }, [value]);

  const inRange = useCallback(
    (ymd) => {
      if (!ymd) return false;
      return ymd >= minYmd && ymd <= maxYmd;
    },
    [minYmd, maxYmd]
  );

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const cells = useMemo(() => monthMatrix(viewYear, viewMonth), [viewYear, viewMonth]);

  const monthTitle = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(
        new Date(viewYear, viewMonth, 1)
      );
    } catch {
      return `${viewYear}-${viewMonth + 1}`;
    }
  }, [viewYear, viewMonth]);

  return (
    <div className="l-weather__datepick" ref={rootRef}>
      <button
        type="button"
        className="l-weather__date-trigger"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Tarih seç"
        onClick={() => setOpen((o) => !o)}
      >
        <Calendar size={15} strokeWidth={2} aria-hidden className="l-weather__date-trigger-icon" />
        <span className="l-weather__date-trigger-text">{label}</span>
      </button>
      {open ? (
        <div className="l-weather__date-popover" role="dialog" aria-label="Takvim">
          <div className="l-weather__date-pop-head">
            <button type="button" className="l-weather__date-nav" onClick={prevMonth} aria-label="Önceki ay">
              <ChevronLeft size={18} strokeWidth={2} />
            </button>
            <span className="l-weather__date-month-title">{monthTitle}</span>
            <button type="button" className="l-weather__date-nav" onClick={nextMonth} aria-label="Sonraki ay">
              <ChevronRight size={18} strokeWidth={2} />
            </button>
          </div>
          <div className="l-weather__date-weekdays">
            {WEEKDAYS_TR.map((w) => (
              <span key={w} className="l-weather__date-wd">
                {w}
              </span>
            ))}
          </div>
          <div className="l-weather__date-grid">
            {cells.map((cell, idx) => {
              if (!cell) return <span key={`e-${idx}`} className="l-weather__date-cell l-weather__date-cell--empty" />;
              const ymd = formatLocalYmd(cell);
              const ok = inRange(ymd);
              const isSel = ymd === value;
              return (
                <button
                  key={ymd}
                  type="button"
                  disabled={!ok}
                  className={`l-weather__date-cell ${isSel ? 'l-weather__date-cell--sel' : ''} ${!ok ? 'l-weather__date-cell--off' : ''}`}
                  onClick={() => {
                    if (!ok) return;
                    onChange(ymd);
                    setOpen(false);
                  }}
                >
                  {cell.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function weatherDateBounds() {
  const today = new Date();
  const minYmd = formatLocalYmd(today);
  const maxYmd = formatLocalYmd(addDays(today, 15));
  return { minYmd, maxYmd };
}
