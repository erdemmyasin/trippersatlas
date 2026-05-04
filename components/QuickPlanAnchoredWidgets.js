'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useIsPhoneLayout } from '@/components/SearchScreenPrimitives';
import { AIRPORTS_BY_IATA, normalizeIata } from '@/lib/airportsGeo';
import { buildCalendarCells, isoFromYMD } from '@/lib/calendarGrid';
import { fmtCalHeaderPart, formatShortRangeTR, formatSingleDateTR } from '@/lib/quickPlanFormatters';

export { formatShortRangeTR, formatSingleDateTR, fmtCalHeaderPart } from '@/lib/quickPlanFormatters';

function StepRow({ label, hint, value, min, max, onChange }) {
  const atMin = value <= min;
  const atMax = value >= max;
  return (
    <div style={qb.stepRow}>
      <div>
        <div style={qb.stepLabel}>{label}</div>
        {hint ? <div style={qb.stepHint}>{hint}</div> : null}
      </div>
      <div style={qb.stepCtrl}>
        <button
          type="button"
          aria-label="Azalt"
          disabled={atMin}
          style={{ ...qb.stepCirc, ...(atMin ? qb.stepCircOff : {}) }}
          onClick={() => onChange(value - 1)}
        >
          −
        </button>
        <span style={qb.stepVal}>{value}</span>
        <button
          type="button"
          aria-label="Arttır"
          disabled={atMax}
          style={{ ...qb.stepCirc, ...(atMax ? qb.stepCircOff : {}) }}
          onClick={() => onChange(value + 1)}
        >
          +
        </button>
      </div>
    </div>
  );
}

/**
 * Çift takvim tarih seçici ('range' veya tek gün 'single').
 * `layout`: { top, left } — sabit pozisyon (genişlik dahili ayarlanır).
 */
export function QuickPlanCalendarPopover({
  /** @type {React.RefObject<HTMLDivElement | null>} */
  innerRef,
  role = 'dialog',
  'aria-label': ariaLabel = 'Tarih seç',
  open,
  mode = 'range',
  committedStart,
  committedEnd,
  layout,
  /** @type {(start: string, end: string) => void} */
  onApply,
  /** İsteğe bağlı içerik (ör. Bugün/Yarın) takvim ile Tamam arası üstünde gösterilir */
  children,
}) {
  const isPhone = useIsPhoneLayout();
  const todayIso = new Date().toISOString().slice(0, 10);

  const [calDraftStart, setCalDraftStart] = useState('');
  const [calDraftEnd, setCalDraftEnd] = useState('');
  const [calMonthCursor, setCalMonthCursor] = useState(() =>
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`.slice(0, 10)
  );
  const [calSelecting, setCalSelecting] = useState('start');

  /* Popover açıldığında committed tarihlerden iç taslak senkronu — tur çubuğuyla aynı desen */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) return;
    if (mode === 'single') {
      const d = committedStart || todayIso;
      setCalDraftStart(d);
      setCalDraftEnd(d);
      setCalMonthCursor(`${d.slice(0, 8)}01`);
      return;
    }
    const start = committedStart || todayIso;
    let end = committedEnd || committedStart || todayIso;
    if (end < start) end = start;
    setCalDraftStart(start);
    setCalDraftEnd(end);
    setCalMonthCursor(`${start.slice(0, 8)}01`);
    setCalSelecting('start');
  }, [open, committedStart, committedEnd, mode, todayIso]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const calendarLeftMonth = useMemo(() => {
    const d = new Date(`${calMonthCursor}T12:00:00`);
    const y = d.getFullYear();
    const m = d.getMonth();
    return {
      cells: buildCalendarCells(y, m),
      title: new Date(y, m, 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
    };
  }, [calMonthCursor]);

  const calendarRightMonth = useMemo(() => {
    const d = new Date(`${calMonthCursor}T12:00:00`);
    let y = d.getFullYear();
    let m = d.getMonth() + 1;
    if (m > 11) {
      m = 0;
      y++;
    }
    return {
      cells: buildCalendarCells(y, m),
      title: new Date(y, m, 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
    };
  }, [calMonthCursor]);

  const shiftCalCursor = useCallback((deltaMonths) => {
    const cur = new Date(`${calMonthCursor}T12:00:00`);
    cur.setMonth(cur.getMonth() + deltaMonths);
    cur.setDate(1);
    setCalMonthCursor(isoFromYMD(cur.getFullYear(), cur.getMonth(), 1));
  }, [calMonthCursor]);

  function onPickCalendarDay(cell) {
    if (cell?.ghost || !cell?.iso) return;
    const dIso = cell.iso;
    if (mode === 'single') {
      setCalDraftStart(dIso);
      setCalDraftEnd(dIso);
      return;
    }
    if (calSelecting === 'start') {
      setCalDraftStart(dIso);
      setCalDraftEnd((prev) => (!prev || prev < dIso ? dIso : prev));
      setCalSelecting('end');
      return;
    }
    let s = calDraftStart;
    let e = dIso;
    if (e < s) [s, e] = [e, s];
    setCalDraftStart(s);
    setCalDraftEnd(e);
  }

  function applyModal() {
    if (mode === 'single') {
      onApply(calDraftStart || committedStart || todayIso, calDraftEnd || calDraftStart || todayIso);
      return;
    }
    let s = calDraftStart;
    let e = calDraftEnd;
    if (!s) s = todayIso;
    if (!e) e = s;
    if (e < s) [s, e] = [e, s];
    onApply(s, e);
  }

  if (!open) return null;

  const { top, left } = layout || { top: 0, left: 10 };

  return (
    <div
      ref={innerRef}
      role={role}
      aria-label={ariaLabel}
      style={{
        ...qb.dateFixed,
        top,
        ...(isPhone ? { left: 10, right: 10, width: 'auto', maxWidth: 'none' } : { left, width: 'min(504px, calc(100vw - 20px))' }),
      }}
    >
      <div style={qb.calHdr}>
        {mode === 'single' ? (
          <button type="button" style={qb.calSeg} onClick={() => setCalSelecting('start')}>
            <span style={qb.calSegIn}>
              <span style={qb.calHdrTxt}>{fmtCalHeaderPart(calDraftStart)}</span>
              <span style={qb.calUl} aria-hidden />
            </span>
          </button>
        ) : (
          <>
            <button type="button" style={qb.calSeg} onClick={() => setCalSelecting('start')}>
              <span style={qb.calSegIn}>
                <span style={qb.calHdrTxt}>{fmtCalHeaderPart(calDraftStart)}</span>
                <span style={calSelecting === 'start' ? qb.calUl : qb.calUlOff} aria-hidden />
              </span>
            </button>
            <span style={qb.calArr}>→</span>
            <button type="button" style={qb.calSeg} onClick={() => setCalSelecting('end')}>
              <span style={qb.calSegIn}>
                <span style={qb.calHdrTxt}>{fmtCalHeaderPart(calDraftEnd)}</span>
                <span style={calSelecting === 'end' ? qb.calUl : qb.calUlOff} aria-hidden />
              </span>
            </button>
          </>
        )}
      </div>
      <div style={qb.calNav}>
        <button type="button" aria-label="Önceki aylar" style={qb.calNavCirc} onClick={() => shiftCalCursor(-2)}>
          <ChevronLeft size={18} color="#5a6982" />
        </button>
        <button type="button" aria-label="Sonraki aylar" style={qb.calNavCirc} onClick={() => shiftCalCursor(2)}>
          <ChevronRight size={18} color="#5a6982" />
        </button>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: isPhone ? 'column' : 'row',
          flexWrap: 'nowrap',
          gap: isPhone ? 16 : 20,
          justifyContent: 'center',
          width: '100%',
        }}
      >
        {[calendarLeftMonth, calendarRightMonth].map((pane) => (
          <div
            key={pane.title}
            style={{
              flexShrink: 0,
              width: isPhone ? '100%' : 222,
              minWidth: isPhone ? 0 : 210,
              maxWidth: isPhone ? '100%' : 228,
              boxSizing: 'border-box',
              contain: 'layout',
            }}
          >
            <div style={qb.calMoTit}>{pane.title}</div>
            <div style={{ ...qb.calGrid, marginTop: 8 }}>
              {['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'].map((d, i) => (
                <span key={`${pane.title}-w${i}`} style={qb.calDow}>
                  {d}
                </span>
              ))}
            </div>
            <div style={{ ...qb.calGrid, marginTop: 8 }}>
              {pane.cells.map((cell) => {
                const iso = cell.iso;
                const inRange = iso >= calDraftStart && iso <= calDraftEnd && calDraftStart <= calDraftEnd;
                const isStart = iso === calDraftStart;
                const isEnd = iso === calDraftEnd;
                const isTd = iso === todayIso && !cell.ghost;
                let bg = 'transparent';
                let color = '#1a3764';
                let fw = 600;
                if (cell.ghost) return <div key={`${pane.title}-g-${iso}`} aria-hidden style={qb.calGhost} />;
                if (inRange && calDraftEnd >= calDraftStart) bg = 'rgba(26,115,232,.09)';
                if ((isStart || isEnd) && !cell.ghost) {
                  bg = 'var(--ta-accent, #1a73e8)';
                  color = '#fff';
                  fw = 800;
                }
                const ringToday = !isStart && !isEnd && isTd;
                return (
                  <button
                    key={`${pane.title}-${iso}`}
                    type="button"
                    style={{
                      ...qb.calDay,
                      background: bg,
                      color,
                      fontWeight: fw,
                      ...(ringToday
                        ? {
                            boxShadow: 'inset 0 0 0 2px var(--ta-accent, #1a73e8)',
                            background: '#fff',
                            color: 'var(--ta-accent, #1a73e8)',
                          }
                        : {}),
                    }}
                    onClick={() => onPickCalendarDay(cell)}
                  >
                    {cell.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {children ? <div style={{ marginTop: 10 }}>{children}</div> : null}
      <div style={qb.calFoot}>
        <button type="button" style={qb.calDone} onClick={applyModal}>
          Tamam
        </button>
      </div>
    </div>
  );
}

/**
 * Sabit pozisyonlu havalimanı listesi — tur çubuğu ile aynı mavi arama şeridi.
 */
export function QuickPlanAirportPickerPanel({
  innerRef,
  role = 'dialog',
  'aria-label': ariaLabel = 'Havalimanı ara',
  layout,
  query,
  setQuery,
  onPickIata,
}) {
  const airportList = useMemo(() => Object.entries(AIRPORTS_BY_IATA).map(([iata, o]) => ({ iata, name: o.name })), []);
  const airportFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return airportList;
    return airportList.filter((a) => a.iata.toLowerCase().includes(q) || a.name.toLowerCase().includes(q));
  }, [airportList, query]);

  if (!layout) return null;
  const { top, left, width } = layout;

  return (
    <div
      ref={innerRef}
      role={role}
      aria-label={ariaLabel}
      style={{ ...qb.popFixed, top, left, width: width ?? 'min(340px, calc(100vw - 20px))' }}
    >
      <div style={{ position: 'relative' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value.toUpperCase())}
          style={qb.airInp}
          placeholder="IATA veya şehir"
          maxLength={64}
          aria-label="Havalimanı ara"
        />
        <button type="button" aria-label="Temizle" style={qb.airClear} onClick={() => setQuery('')}>
          <X size={16} aria-hidden />
        </button>
      </div>
      <hr style={{ border: 'none', borderTop: '1px solid #e9edf4', margin: '8px 0' }} />
      <div style={{ maxHeight: 260, overflowY: 'auto' }}>
        {airportFiltered.map((a) => (
          <button key={a.iata} type="button" style={qb.airRow} onClick={() => onPickIata(normalizeIata(a.iata))}>
            <span style={{ fontWeight: 800, color: '#0f2942' }}>{a.iata}</span>
            <span style={{ fontSize: 13, color: '#5a6982', marginLeft: 10 }}>{a.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function QuickPlanFlightPaxPanel({
  innerRef,
  role = 'dialog',
  'aria-label': ariaLabel = 'Yolcular',
  layout,
  adults,
  setAdults,
  childrenCount,
  setChildrenCount,
  infantsLap,
  setInfantsLap,
  infantsSeat,
  setInfantsSeat,
}) {
  if (!layout) return null;
  const total = adults + childrenCount + infantsLap + infantsSeat;
  return (
    <div
      ref={innerRef}
      role={role}
      aria-label={ariaLabel}
      style={{
        ...qb.paxPop,
        top: layout.top,
        left: layout.left,
        width: layout.width ?? 'min(340px, calc(100vw - 20px))',
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: '#5a6982', marginBottom: 6 }}>
        Toplam <strong style={{ color: '#0f2942' }}>{total}</strong> yolcu
      </div>
      <StepRow label="Yetişkin" value={adults} min={1} max={9} onChange={setAdults} />
      <div style={qb.stepDivider} />
      <StepRow label="Çocuk" hint="Yaş 2–17" value={childrenCount} min={0} max={8} onChange={setChildrenCount} />
      <div style={qb.stepDivider} />
      <StepRow label="Bebek (kucağında)" hint="2 yaşından küçük" value={infantsLap} min={0} max={8} onChange={setInfantsLap} />
      <div style={qb.stepDivider} />
      <StepRow label="Bebek (koltukta)" hint="2 yaşından küçük" value={infantsSeat} min={0} max={8} onChange={setInfantsSeat} />
    </div>
  );
}

export function QuickPlanStayGuestsPanel({
  innerRef,
  role = 'dialog',
  'aria-label': ariaLabel = 'Oda ve misafir',
  layout,
  rooms,
  setRooms,
  adults,
  setAdults,
  childrenCount,
  setChildrenCount,
}) {
  if (!layout) return null;
  const total = adults + childrenCount;
  return (
    <div
      ref={innerRef}
      role={role}
      aria-label={ariaLabel}
      style={{
        ...qb.paxPop,
        top: layout.top,
        left: layout.left,
        width: layout.width ?? 'min(340px, calc(100vw - 20px))',
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: '#5a6982', marginBottom: 6 }}>
        {rooms} oda · <strong style={{ color: '#0f2942' }}>{total}</strong> kişi
      </div>
      <StepRow label="Oda" value={rooms} min={1} max={8} onChange={setRooms} />
      <div style={qb.stepDivider} />
      <StepRow label="Yetişkin" value={adults} min={1} max={12} onChange={setAdults} />
      <div style={qb.stepDivider} />
      <StepRow label="Çocuk" hint="Yaş 0–17" value={childrenCount} min={0} max={8} onChange={setChildrenCount} />
    </div>
  );
}

/** Metin konum düzenleme (şehir) + Tamam */
export function QuickPlanCityTextPanel({
  innerRef,
  role = 'dialog',
  'aria-label': ariaLabel = 'Konum',
  layout,
  draft,
  setDraft,
  placeholder,
  doneLabel = 'Tamam',
  onDone,
}) {
  if (!layout) return null;
  return (
    <div
      ref={innerRef}
      role={role}
      aria-label={ariaLabel}
      style={{ ...qb.popFixed, top: layout.top, left: layout.left, width: layout.width ?? 'min(340px, calc(100vw - 20px))' }}
    >
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          borderRadius: 10,
          border: '1px solid #dfe4ec',
          padding: '10px 12px',
          fontSize: 14,
          fontWeight: 600,
          fontFamily: 'inherit',
          outline: 'none',
        }}
        aria-label={ariaLabel}
      />
      <div style={{ ...qb.calFoot, borderTop: '1px solid #eef2f8', marginTop: 12 }}>
        <button type="button" style={qb.calDone} onClick={onDone}>
          {doneLabel}
        </button>
      </div>
    </div>
  );
}

/** Her 15 dakikada bir, 00:00–23:45 (yerel yazım HH:mm). */
export const QUARTER_HOUR_OPTIONS = (() => {
  const rows = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 15, 30, 45]) {
      rows.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return rows;
})();

/** Örn. 10:00 → "10:00 am" — araç kirada referans görünüm */
export function formatHm12En(hm) {
  const [hs, ms] = String(hm || '00:00').split(':');
  const h = Math.min(23, Math.max(0, Number(hs) || 0));
  const mn = Math.min(59, Math.max(0, Number(ms) || 0));
  const d = new Date(2000, 0, 1, h, mn);
  return d
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    .replace(/\u202f/g, ' ')
    .toLowerCase();
}

/**
 * Kaydırılabilir saat listesi (15 dk adım). `valueHm` "HH:mm" ile eşleşen satır vurgulanır.
 */
export function QuickPlanTimeListPopover({
  innerRef,
  role = 'dialog',
  'aria-label': ariaLabel = 'Saat seç',
  layout,
  valueHm,
  options = QUARTER_HOUR_OPTIONS,
  onSelect,
}) {
  if (!layout) return null;
  const { top, left, width } = layout;
  const norm = (t) => (String(t).length >= 5 ? String(t).slice(0, 5) : t);
  const current = norm(valueHm || '09:00');

  return (
    <div
      ref={innerRef}
      role={role}
      aria-label={ariaLabel}
      style={{
        ...qb.popFixed,
        padding: '6px 0',
        top,
        left,
        width: width ?? 'min(220px, calc(100vw - 20px))',
      }}
    >
      <div
        style={{
          maxHeight: 260,
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingRight: 4,
        }}
      >
        {options.map((hm) => {
          const sel = norm(hm) === current;
          return (
            <button
              key={hm}
              type="button"
              onClick={() => onSelect(norm(hm))}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                border: 'none',
                borderRadius: 6,
                background: sel ? 'rgba(26,115,232,.08)' : 'transparent',
                color: sel ? 'var(--ta-accent-deep, #0f2942)' : '#243652',
                fontWeight: sel ? 800 : 500,
                fontSize: 14,
                padding: '8px 12px',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {formatHm12En(norm(hm))}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** datetime-local + Tamam — araç kirada kullanılıyor */
export function QuickPlanDateTimeCommitPanel({
  innerRef,
  role = 'dialog',
  'aria-label': ariaLabel,
  layout,
  value,
  onChange,
  onDone,
  inputStyle = {},
}) {
  if (!layout) return null;
  return (
    <div
      ref={innerRef}
      role={role}
      aria-label={ariaLabel}
      style={{ ...qb.popFixed, top: layout.top, left: layout.left, width: layout.width ?? 'min(320px, calc(100vw - 20px))' }}
    >
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          borderRadius: 10,
          border: '1px solid #dfe4ec',
          padding: '8px 10px',
          fontSize: 14,
          fontWeight: 600,
          fontFamily: 'inherit',
          outline: 'none',
          ...inputStyle,
        }}
        aria-label={ariaLabel}
      />
      <div style={{ ...qb.calFoot, borderTop: '1px solid #eef2f8', marginTop: 12 }}>
        <button type="button" style={qb.calDone} onClick={onDone}>
          Tamam
        </button>
      </div>
    </div>
  );
}

/** Sürücü yaşı / benzeri <select> + Tamam */
export function QuickPlanSelectCommitPanel({
  innerRef,
  role = 'dialog',
  'aria-label': ariaLabel,
  layout,
  value,
  onChange,
  options,
  onDone,
}) {
  if (!layout) return null;
  return (
    <div
      ref={innerRef}
      role={role}
      aria-label={ariaLabel}
      style={{ ...qb.popFixed, top: layout.top, left: layout.left, width: layout.width ?? 'min(300px, calc(100vw - 20px))' }}
    >
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          borderRadius: 10,
          border: '1px solid #dfe4ec',
          padding: '10px 12px',
          fontSize: 14,
          fontWeight: 600,
          fontFamily: 'inherit',
          background: '#fff',
        }}
        aria-label={ariaLabel}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <div style={{ ...qb.calFoot, borderTop: '1px solid #eef2f8', marginTop: 12 }}>
        <button type="button" style={qb.calDone} onClick={onDone}>
          Tamam
        </button>
      </div>
    </div>
  );
}

/** Otobüs vb. için tek tam sayı (yolcu) */
export function QuickPlanBusPaxPanel({
  innerRef,
  role = 'dialog',
  'aria-label': ariaLabel = 'Yolcu sayısı',
  layout,
  value,
  onChange,
}) {
  if (!layout) return null;
  return (
    <div
      ref={innerRef}
      role={role}
      aria-label={ariaLabel}
      style={{
        ...qb.paxPop,
        top: layout.top,
        left: layout.left,
        width: layout.width ?? 'min(300px, calc(100vw - 20px))',
      }}
    >
      <StepRow label="Yolcu" hint="Bu sefer için" value={value} min={1} max={9} onChange={onChange} />
    </div>
  );
}

/** Aktiviteler için katılımcı sayısı */
export function QuickPlanActivityParticipantsPanel({
  innerRef,
  role = 'dialog',
  'aria-label': ariaLabel = 'Katılımcılar',
  layout,
  adults,
  onChange,
}) {
  if (!layout) return null;
  return (
    <div
      ref={innerRef}
      role={role}
      aria-label={ariaLabel}
      style={{
        ...qb.paxPop,
        top: layout.top,
        left: layout.left,
        width: layout.width ?? 'min(280px, calc(100vw - 20px))',
      }}
    >
      <StepRow label="Kişi sayısı" hint="Tek rezervasyon" value={adults} min={1} max={20} onChange={onChange} />
    </div>
  );
}

const qb = {
  popFixed: {
    position: 'fixed',
    zIndex: 280,
    background: '#fff',
    borderRadius: 14,
    border: '1px solid #e3eaf3',
    boxShadow: '0 16px 48px rgba(15,41,74,.2)',
    padding: 14,
    boxSizing: 'border-box',
  },
  airInp: {
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: 6,
    border: 'none',
    padding: '10px 38px 10px 10px',
    fontSize: 14,
    fontWeight: 700,
    fontFamily: 'inherit',
    background: '#1a73e8',
    color: '#fff',
    outline: 'none',
  },
  airClear: {
    position: 'absolute',
    right: 6,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 34,
    height: 34,
    borderRadius: 999,
    border: 'none',
    background: 'rgba(255,255,255,.24)',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  airRow: {
    width: '100%',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'baseline',
    padding: '10px 6px',
    flexWrap: 'wrap',
    textAlign: 'left',
    fontFamily: 'inherit',
  },
  paxPop: {
    position: 'fixed',
    zIndex: 280,
    background: '#fff',
    borderRadius: 14,
    border: '1px solid #e3eaf3',
    boxShadow: '0 16px 48px rgba(15,41,74,.2)',
    padding: '12px 18px 18px',
    boxSizing: 'border-box',
    maxHeight: 'min(72vh, 560px)',
    overflowY: 'auto',
  },
  dateFixed: {
    position: 'fixed',
    zIndex: 280,
    background: '#fff',
    borderRadius: 14,
    border: '1px solid #e3eaf3',
    boxShadow: '0 16px 48px rgba(15,41,74,.22)',
    padding: '12px 12px 10px',
    boxSizing: 'border-box',
    maxHeight: 'min(520px, 72vh)',
    overflowY: 'auto',
  },
  calHdr: { display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 12, marginBottom: 10, fontWeight: 800, color: '#0f2942' },
  calSeg: { border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: 'inherit' },
  calSegIn: { display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 },
  calHdrTxt: { fontSize: 14 },
  calUl: { alignSelf: 'stretch', height: 3, borderRadius: 2, background: '#1a73e8' },
  calUlOff: { alignSelf: 'stretch', height: 3 },
  calArr: { color: '#5a6982', fontWeight: 600, fontSize: 16 },
  calNav: { display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 8 },
  calNavCirc: {
    width: 34,
    height: 34,
    borderRadius: 999,
    border: '1px solid #e8edf6',
    background: '#fafbfd',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  calMoTit: { textAlign: 'center', fontWeight: 800, fontSize: 13, color: '#0f2942' },
  calDow: { textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#929fb4' },
  calGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
    gridAutoRows: 30,
    columnGap: 3,
    rowGap: 4,
    width: '100%',
    boxSizing: 'border-box',
  },
  calGhost: { height: 30, visibility: 'hidden', pointerEvents: 'none' },
  calDay: {
    width: '100%',
    height: 30,
    border: 'none',
    borderRadius: 999,
    cursor: 'pointer',
    fontSize: 13,
    padding: 0,
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
    boxSizing: 'border-box',
  },
  calFoot: {
    borderTop: '1px solid #eef2f8',
    marginTop: 12,
    paddingTop: 10,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  calDone: {
    padding: '8px 22px',
    borderRadius: 999,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 13,
    fontFamily: 'inherit',
    background: 'var(--ta-accent, #1a73e8)',
    color: '#fff',
  },
  stepRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '12px 0' },
  stepLabel: { fontWeight: 700, fontSize: 15, color: '#0f2942' },
  stepHint: { fontSize: 12, color: '#7a8aa3', marginTop: 4 },
  stepCtrl: { display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 },
  stepCirc: {
    width: 32,
    height: 32,
    borderRadius: 999,
    border: '1px solid #c5cedd',
    background: '#fff',
    fontSize: 18,
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    lineHeight: 1,
    color: '#243652',
  },
  stepCircOff: { opacity: 0.35, cursor: 'not-allowed' },
  stepVal: { fontSize: 16, fontWeight: 800, minWidth: 22, textAlign: 'center', color: '#0f2942' },
  stepDivider: { height: 1, background: '#eef2f8' },
};
