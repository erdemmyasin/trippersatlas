'use client';

import { useState, useMemo, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import {
  ArrowLeftRight,
  MapPin,
  Calendar,
  Users,
  Search,
  Sparkles,
  Car,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useIsPhoneLayout } from '@/components/SearchScreenPrimitives';
import { AIRPORTS_BY_IATA, airportFromStatic, normalizeIata } from '@/lib/airportsGeo';
import { buildCalendarCells, isoFromYMD } from '@/lib/calendarGrid';
import { qp as qpBar } from '@/lib/quickPlanFilterStyles';

function formatShortRangeTR(start, end) {
  const opts = { day: 'numeric', month: 'short' };
  const a = `${new Date(`${start}T12:00:00`).toLocaleDateString('tr-TR', opts)}`;
  const b = `${new Date(`${end}T12:00:00`).toLocaleDateString('tr-TR', opts)}`;
  return `${a} – ${b}`;
}

function fmtCalHeaderPart(iso) {
  if (!iso) return '—';
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function shortCity(apName) {
  if (!apName) return '';
  let n = apName.replace(/\s*\([^)]*\)\s*$/,'').trim();
  n = n.replace(/\s*Havalimanı.*$/i,'').trim();
  n = n.replace(/\s*Airport.*$/i,'').trim();
  return n || '';
}

/** Örn. Antalya (AYT–Antalya Intl.) */
export function tourAirportBoxLine(codeRaw) {
  const code = normalizeIata(codeRaw);
  if (!code) return 'Seçin';
  const ap = airportFromStatic(code);
  const city = ap ? shortCity(ap.name) : '';
  if (!ap) return code;
  return `${city} (${code}–${city} Intl.)`;
}

function popoverCoords(el, popW = 340) {
  if (!el) return { top: 0, left: 10 };
  const r = el.getBoundingClientRect();
  const margin = 10;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 400;
  const w = Math.min(popW, vw - 2 * margin);
  let left = r.left;
  if (left + w > vw - margin) left = Math.max(margin, vw - margin - w);
  return { top: r.bottom + margin, left };
}

function StepRow({ label, hint, value, min, max, onChange }) {
  const atMin = value <= min;
  const atMax = value >= max;
  return (
    <div style={tb.stepRow}>
      <div>
        <div style={tb.stepLabel}>{label}</div>
        {hint ? <div style={tb.stepHint}>{hint}</div> : null}
      </div>
      <div style={tb.stepCtrl}>
        <button
          type="button"
          aria-label="Azalt"
          disabled={atMin}
          style={{ ...tb.stepCirc, ...(atMin ? tb.stepCircOff : {}) }}
          onClick={() => onChange(value - 1)}
        >
          −
        </button>
        <span style={tb.stepVal}>{value}</span>
        <button
          type="button"
          aria-label="Arttır"
          disabled={atMax}
          style={{ ...tb.stepCirc, ...(atMax ? tb.stepCircOff : {}) }}
          onClick={() => onChange(value + 1)}
        >
          +
        </button>
      </div>
    </div>
  );
}

/** @typedef {{ adults: number, children: number, infantsLap: number, infantsSeat: number }} LodgingRoomGuest */

const MAX_ROOMS = 9;
const PER_ROOM_ADULT_MAX = 9;
const PER_ROOM_CHILD_MAX = 8;
const PER_ROOM_INFANT_MAX = 8;

function defaultGuestRoom() {
  return { adults: 1, children: 0, infantsLap: 0, infantsSeat: 0 };
}

/** Listeden eksik alanları doldurur (eski state uyumu). */
function normalizeGuestRoom(row) {
  const d = defaultGuestRoom();
  const a = Number(row?.adults);
  const adults = Number.isFinite(a) && a >= 1 ? Math.min(PER_ROOM_ADULT_MAX, a) : d.adults;
  const children = Math.min(PER_ROOM_CHILD_MAX, Math.max(0, Number(row?.children) || 0));
  const infantsLap = Math.min(PER_ROOM_INFANT_MAX, Math.max(0, Number(row?.infantsLap) || 0));
  const infantsSeat = Math.min(PER_ROOM_INFANT_MAX, Math.max(0, Number(row?.infantsSeat) || 0));
  return { adults, children, infantsLap, infantsSeat };
}

export default function TourLodgingToolbar({
  title,
  origin,
  destination,
  setOrigin,
  setDestination,
  onSwap,
  dateOut,
  dateIn,
  setDateOut,
  setDateIn,
  /** @type {LodgingRoomGuest[]} */
  guestRooms,
  setGuestRooms,
  includeCarAddon,
  setIncludeCarAddon,
  onSearch,
}) {
  const isPhone = useIsPhoneLayout();

  const barRef = useRef(null);
  const originBtnRef = useRef(null);
  const destBtnRef = useRef(null);
  const dateBtnRef = useRef(null);
  const paxBtnRef = useRef(null);

  const origPopoverRef = useRef(null);
  const destPopoverRef = useRef(null);
  const datePopoverRef = useRef(null);
  const paxPopoverRef = useRef(null);

  const [airWhich, setAirWhich] = useState(null); // 'o' | 'd'
  const [airQuery, setAirQuery] = useState('');
  const [airPopPos, setAirPopPos] = useState({ top: 0, left: 0 });

  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [calDraftStart, setCalDraftStart] = useState('');
  const [calDraftEnd, setCalDraftEnd] = useState('');
  const [calMonthCursor, setCalMonthCursor] = useState(() =>
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`.slice(0, 10)
  );
  const [calSelecting, setCalSelecting] = useState('start');
  const [datePopPos, setDatePopPos] = useState({ top: 0, left: 0 });

  const [paxOpen, setPaxOpen] = useState(false);
  const [paxPopPos, setPaxPopPos] = useState({ top: 0, left: 0 });

  const closeAllPanels = useCallback(() => {
    setAirWhich(null);
    setDateModalOpen(false);
    setPaxOpen(false);
  }, []);

  useEffect(() => {
    function onPointerDown(ev) {
      const t = ev.target;
      if (!(t instanceof Node)) return;
      if (origPopoverRef.current?.contains(t)) return;
      if (destPopoverRef.current?.contains(t)) return;
      if (datePopoverRef.current?.contains(t)) return;
      if (paxPopoverRef.current?.contains(t)) return;
      if (barRef.current?.contains(t)) return;
      closeAllPanels();
    }
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [closeAllPanels]);

  useEffect(() => {
    if (!dateModalOpen && !airWhich && !paxOpen) return undefined;
    function onEsc(e) {
      if (e.key !== 'Escape') return;
      closeAllPanels();
    }
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [dateModalOpen, airWhich, paxOpen, closeAllPanels]);

  useLayoutEffect(() => {
    if (!airWhich) return undefined;
    const el = airWhich === 'o' ? originBtnRef.current : destBtnRef.current;
    function u() {
      const p = popoverCoords(el, 340);
      setAirPopPos(p);
    }
    u();
    window.addEventListener('resize', u);
    window.addEventListener('scroll', u, true);
    return () => {
      window.removeEventListener('resize', u);
      window.removeEventListener('scroll', u, true);
    };
  }, [airWhich]);

  useLayoutEffect(() => {
    if (!dateModalOpen) return undefined;
    const el = dateBtnRef.current;
    function u() {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const margin = 10;
      const vw = window.innerWidth;
      const w = Math.min(504, vw - 2 * margin);
      let left = r.left;
      if (left + w > vw - margin) left = Math.max(margin, vw - margin - w);
      setDatePopPos({ top: r.bottom + margin, left });
    }
    u();
    window.addEventListener('resize', u);
    window.addEventListener('scroll', u, true);
    return () => {
      window.removeEventListener('resize', u);
      window.removeEventListener('scroll', u, true);
    };
  }, [dateModalOpen]);

  useLayoutEffect(() => {
    if (!paxOpen) return undefined;
    const el = paxBtnRef.current;
    function u() {
      setPaxPopPos(popoverCoords(el, 400));
    }
    u();
    window.addEventListener('resize', u);
    window.addEventListener('scroll', u, true);
    return () => {
      window.removeEventListener('resize', u);
      window.removeEventListener('scroll', u, true);
    };
  }, [paxOpen]);

  const airportList = useMemo(() => Object.entries(AIRPORTS_BY_IATA).map(([iata, o]) => ({ iata, name: o.name })), []);

  const airportFiltered = useMemo(() => {
    const q = airQuery.trim().toLowerCase();
    if (!q) return airportList;
    return airportList.filter((a) => a.iata.toLowerCase().includes(q) || a.name.toLowerCase().includes(q));
  }, [airportList, airQuery]);

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

  const todayIso = new Date().toISOString().slice(0, 10);

  function prepareDateDraft() {
    setCalDraftStart(dateOut);
    setCalDraftEnd(dateIn);
    const ref = dateOut || todayIso;
    setCalMonthCursor(`${ref.slice(0, 8)}01`);
    setCalSelecting('start');
  }

  function shiftCalCursor(deltaMonths) {
    const cur = new Date(`${calMonthCursor}T12:00:00`);
    cur.setMonth(cur.getMonth() + deltaMonths);
    cur.setDate(1);
    setCalMonthCursor(isoFromYMD(cur.getFullYear(), cur.getMonth(), 1));
  }

  function onPickCalendarDay(cell) {
    if (cell?.ghost || !cell?.iso) return;
    const dIso = cell.iso;
    if (calSelecting === 'start') {
      setCalDraftStart(dIso);
      if (!calDraftEnd || calDraftEnd < dIso) setCalDraftEnd(dIso);
      setCalSelecting('end');
      return;
    }
    let s = calDraftStart;
    let e = dIso;
    if (e < s) [s, e] = [e, s];
    setCalDraftStart(s);
    setCalDraftEnd(e);
  }

  function applyDateModal() {
    setDateOut(calDraftStart);
    setDateIn(calDraftEnd);
    setDateModalOpen(false);
  }

  function selectAirport(iata) {
    const c = normalizeIata(iata);
    if (airWhich === 'o') setOrigin(c);
    if (airWhich === 'd') setDestination(c);
    setAirWhich(null);
  }

  const normRooms = useMemo(() => guestRooms.map(normalizeGuestRoom), [guestRooms]);
  const lodgingAdults = useMemo(() => normRooms.reduce((s, r) => s + r.adults, 0), [normRooms]);
  const lodgingChildren = useMemo(() => normRooms.reduce((s, r) => s + r.children, 0), [normRooms]);
  const lodgingInfantsLap = useMemo(() => normRooms.reduce((s, r) => s + r.infantsLap, 0), [normRooms]);
  const lodgingInfantsSeat = useMemo(() => normRooms.reduce((s, r) => s + r.infantsSeat, 0), [normRooms]);
  const yolcuTop = lodgingAdults + lodgingChildren + lodgingInfantsLap + lodgingInfantsSeat;
  const paxSummary = `${yolcuTop} yolcu, ${guestRooms.length} oda`;

  const patchRoom = useCallback(
    (idx, patch) => {
      setGuestRooms((prev) =>
        prev.map((row, i) => {
          const base = normalizeGuestRoom(row);
          return i === idx ? normalizeGuestRoom({ ...base, ...patch }) : base;
        })
      );
    },
    [setGuestRooms]
  );

  const removeRoom = useCallback(
    (idx) => {
      setGuestRooms((prev) =>
        prev.length <= 1 ? prev.map(normalizeGuestRoom) : prev.filter((_, i) => i !== idx).map(normalizeGuestRoom)
      );
    },
    [setGuestRooms]
  );

  const addRoom = useCallback(() => {
    setGuestRooms((prev) =>
      prev.length >= MAX_ROOMS ? prev.map(normalizeGuestRoom) : [...prev.map(normalizeGuestRoom), defaultGuestRoom()]
    );
  }, [setGuestRooms]);

  function openAir(which) {
    setDateModalOpen(false);
    setPaxOpen(false);
    setAirWhich((prev) => (prev === which ? null : which));
    setAirQuery(which === 'o' ? origin : destination);
  }

  const airPopoverBody = (
    <>
      <div style={{ position: 'relative' }}>
        <input
          value={airQuery}
          onChange={(e) => setAirQuery(e.target.value.toUpperCase())}
          style={tb.airInp}
          placeholder="IATA veya şehir"
          maxLength={4}
          aria-label="Havalimanı ara"
        />
        <button type="button" aria-label="Temizle" style={tb.airClear} onClick={() => setAirQuery('')}>
          <X size={16} aria-hidden />
        </button>
      </div>
      <hr style={{ border: 'none', borderTop: '1px solid #e9edf4', margin: '8px 0' }} />
      <div style={{ maxHeight: 260, overflowY: 'auto' }}>
        {airportFiltered.map((a) => (
          <button key={a.iata} type="button" style={tb.airRow} onClick={() => selectAirport(a.iata)}>
            <span style={{ fontWeight: 800, color: '#0f2942' }}>{a.iata}</span>
            <span style={{ fontSize: 13, color: '#5a6982', marginLeft: 10 }}>{a.name}</span>
          </button>
        ))}
      </div>
    </>
  );

  return (
    <div style={tb.shell}>
      <div ref={barRef} style={tb.barCluster}>
        <div style={{ ...tb.titlePill, alignSelf: 'center' }}>
          <span style={tb.spark} aria-hidden>
            <Sparkles size={11} strokeWidth={2.2} color="var(--ta-accent)" />
          </span>
          <span style={tb.titleTxt}>{title}</span>
        </div>
        {!isPhone ? <span style={tb.barSep} /> : null}

        <div style={tb.linkedRoute}>
          <div style={tb.routeShell}>
            <button
              ref={originBtnRef}
              type="button"
              style={tb.routeSegBtn}
              onClick={() => openAir('o')}
              aria-expanded={airWhich === 'o'}
              aria-haspopup="dialog"
            >
              <MapPin size={18} strokeWidth={1.85} color="#1a3764" aria-hidden />
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={tb.fieldLbl}>Nereden</span>
                <span style={{ ...tb.fieldVal, ...(normalizeIata(origin) ? {} : tb.fieldPlaceholder) }}>
                  {normalizeIata(origin) ? tourAirportBoxLine(origin) : 'Kalkış havalimanı'}
                </span>
              </span>
            </button>
            <button type="button" style={tb.swapFab} onClick={onSwap} aria-label="Kalkış ve varış yerini değiştir">
              <ArrowLeftRight size={15} color="#1a73e8" />
            </button>
            <button
              ref={destBtnRef}
              type="button"
              style={tb.routeSegBtn}
              onClick={() => openAir('d')}
              aria-expanded={airWhich === 'd'}
              aria-haspopup="dialog"
            >
              <MapPin size={18} strokeWidth={1.85} color="#1a3764" aria-hidden />
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={tb.fieldLbl}>Nereye</span>
                <span style={{ ...tb.fieldVal, ...(normalizeIata(destination) ? {} : tb.fieldPlaceholder) }}>
                  {normalizeIata(destination) ? tourAirportBoxLine(destination) : 'Varış havalimanı'}
                </span>
              </span>
            </button>
          </div>
        </div>

        <button
          ref={dateBtnRef}
          type="button"
          style={tb.fieldCard}
          onClick={() => {
            setAirWhich(null);
            setPaxOpen(false);
            if (dateModalOpen) setDateModalOpen(false);
            else {
              prepareDateDraft();
              setDateModalOpen(true);
            }
          }}
          aria-expanded={dateModalOpen}
          aria-haspopup="dialog"
        >
          <Calendar size={18} strokeWidth={1.85} color="#1a3764" aria-hidden />
          <span style={{ minWidth: 0, flex: 1 }}>
            <span style={tb.fieldLbl}>Tarihler</span>
            <span style={tb.fieldVal}>{formatShortRangeTR(dateOut, dateIn)}</span>
          </span>
        </button>

        <button
          ref={paxBtnRef}
          type="button"
          style={tb.fieldCard}
          onClick={() => {
            setAirWhich(null);
            setDateModalOpen(false);
            setPaxOpen((v) => !v);
          }}
          aria-expanded={paxOpen}
          aria-haspopup="dialog"
        >
          <Users size={18} strokeWidth={1.85} color="#1a3764" aria-hidden />
          <span style={{ minWidth: 0, flex: 1 }}>
            <span style={tb.fieldLbl}>Yolcular</span>
            <span style={tb.fieldVal}>{paxSummary}</span>
          </span>
        </button>

        {!isPhone ? <span style={tb.barSep} /> : null}
        <button
          type="button"
          onClick={() => {
            closeAllPanels();
            setIncludeCarAddon((v) => !v);
          }}
          style={{
            ...tb.fieldCard,
            alignSelf: 'center',
            padding: '6px 10px',
            gap: 8,
            flex: '0 1 124px',
            ...(includeCarAddon
              ? {
                  borderColor: 'var(--ta-accent, #1a73e8)',
                  boxShadow: '0 1px 2px rgba(26,115,232,.2)',
                }
              : {}),
            ...(isPhone ? { width: '100%', flex: '1 1 100%', justifyContent: 'flex-start' } : {}),
          }}
          aria-pressed={includeCarAddon}
        >
          <Car size={16} strokeWidth={1.85} color="#1a3764" aria-hidden />
          <span style={{ minWidth: 0, flex: 1 }}>
            <span style={{ ...tb.fieldLbl, fontSize: 9 }}>Araç</span>
            <span style={{ ...tb.fieldVal, fontSize: 12 }}>{includeCarAddon ? 'Araç dahil' : '+ Araç ekle'}</span>
          </span>
        </button>
        {!isPhone ? <span style={tb.barSep} /> : null}
        <button
          type="button"
          style={{ ...tb.searchBtn, ...(isPhone ? { width: '100%', justifyContent: 'center' } : {}) }}
          onClick={() => {
            closeAllPanels();
            onSearch();
          }}
        >
          <Search size={15} strokeWidth={2.25} color="#FFFFFF" aria-hidden />
          Ara
        </button>
      </div>

      {airWhich === 'o' ? (
        <div
          ref={origPopoverRef}
          role="dialog"
          aria-label="Kalkış havalimanı"
          style={{ ...tb.popFixed, top: airPopPos.top, left: airPopPos.left, width: 'min(340px, calc(100vw - 20px))' }}
        >
          {airPopoverBody}
        </div>
      ) : null}
      {airWhich === 'd' ? (
        <div
          ref={destPopoverRef}
          role="dialog"
          aria-label="Varış havalimanı"
          style={{ ...tb.popFixed, top: airPopPos.top, left: airPopPos.left, width: 'min(340px, calc(100vw - 20px))' }}
        >
          {airPopoverBody}
        </div>
      ) : null}

      {paxOpen ? (
        <div
          ref={paxPopoverRef}
          role="dialog"
          aria-label="Yolcular ve odalar"
          style={{
            ...tb.paxPop,
            top: paxPopPos.top,
            left: paxPopPos.left,
            width: 'min(400px, calc(100vw - 20px))',
          }}
        >
          {normRooms.map((room, idx) => (
            <div key={`room-${idx}`} style={tb.roomSection}>
              <div style={tb.roomTitle}>{`Oda ${idx + 1}`}</div>
              <StepRow
                label="Yetişkin"
                value={room.adults}
                min={1}
                max={PER_ROOM_ADULT_MAX}
                onChange={(v) => patchRoom(idx, { adults: v })}
              />
              <div style={tb.stepDivider} />
              <StepRow
                label="Çocuk"
                hint="Yaş 2–17"
                value={room.children}
                min={0}
                max={PER_ROOM_CHILD_MAX}
                onChange={(v) => patchRoom(idx, { children: v })}
              />
              <div style={tb.stepDivider} />
              <StepRow
                label="Bebek (kucağında)"
                hint="2 yaşından küçük"
                value={room.infantsLap}
                min={0}
                max={PER_ROOM_INFANT_MAX}
                onChange={(v) => patchRoom(idx, { infantsLap: v })}
              />
              <div style={tb.stepDivider} />
              <StepRow
                label="Bebek (koltukta)"
                hint="2 yaşından küçük"
                value={room.infantsSeat}
                min={0}
                max={PER_ROOM_INFANT_MAX}
                onChange={(v) => patchRoom(idx, { infantsSeat: v })}
              />
              <div style={tb.roomActions}>
                <button
                  type="button"
                  disabled={guestRooms.length <= 1}
                  style={{
                    ...tb.textLinkBtn,
                    ...(guestRooms.length <= 1 ? tb.textLinkBtnOff : {}),
                  }}
                  onClick={() => removeRoom(idx)}
                >
                  Odayı kaldır
                </button>
              </div>
              {idx < guestRooms.length - 1 ? <div style={tb.roomBlockDivider} /> : null}
            </div>
          ))}
          <div style={tb.addRoomRow}>
            <button
              type="button"
              disabled={guestRooms.length >= MAX_ROOMS}
              style={{
                ...tb.textLinkBtn,
                ...(guestRooms.length >= MAX_ROOMS ? tb.textLinkBtnOff : {}),
              }}
              onClick={addRoom}
            >
              Başka oda ekle
            </button>
          </div>
        </div>
      ) : null}

      {dateModalOpen ? (
        <div
          ref={datePopoverRef}
          role="dialog"
          aria-label="Tarih aralığı"
          style={{
            ...tb.dateFixed,
            top: datePopPos.top,
            ...(isPhone ? { left: 10, right: 10, width: 'auto' } : { left: datePopPos.left, width: 'min(504px, calc(100vw - 20px))' }),
          }}
        >
          <div style={tb.calHdr}>
            <button type="button" style={tb.calSeg} onClick={() => setCalSelecting('start')}>
              <span style={tb.calSegIn}>
                <span style={tb.calHdrTxt}>{fmtCalHeaderPart(calDraftStart)}</span>
                <span style={calSelecting === 'start' ? tb.calUl : tb.calUlOff} aria-hidden />
              </span>
            </button>
            <span style={tb.calArr}>→</span>
            <button type="button" style={tb.calSeg} onClick={() => setCalSelecting('end')}>
              <span style={tb.calSegIn}>
                <span style={tb.calHdrTxt}>{fmtCalHeaderPart(calDraftEnd)}</span>
                <span style={calSelecting === 'end' ? tb.calUl : tb.calUlOff} aria-hidden />
              </span>
            </button>
          </div>
          <div style={tb.calNav}>
            <button type="button" aria-label="Önceki aylar" style={tb.calNavCirc} onClick={() => shiftCalCursor(-2)}>
              <ChevronLeft size={18} color="#5a6982" />
            </button>
            <button type="button" aria-label="Sonraki aylar" style={tb.calNavCirc} onClick={() => shiftCalCursor(2)}>
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
                <div style={tb.calMoTit}>{pane.title}</div>
                <div style={{ ...tb.calGrid, marginTop: 8 }}>
                  {['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'].map((d, i) => (
                    <span key={`${pane.title}-w${i}`} style={tb.calDow}>
                      {d}
                    </span>
                  ))}
                </div>
                <div style={{ ...tb.calGrid, marginTop: 8 }}>
                  {pane.cells.map((cell) => {
                    const iso = cell.iso;
                    const inRange = iso >= calDraftStart && iso <= calDraftEnd && calDraftStart <= calDraftEnd;
                    const isStart = iso === calDraftStart;
                    const isEnd = iso === calDraftEnd;
                    const isTd = iso === todayIso && !cell.ghost;
                    let bg = 'transparent';
                    let color = '#1a3764';
                    let fw = 600;
                    if (cell.ghost) return <div key={`${pane.title}-g-${iso}`} aria-hidden style={tb.calGhost} />;
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
                          ...tb.calDay,
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
          <div style={tb.calFoot}>
            <button type="button" style={tb.calDone} onClick={applyDateModal}>
              Tamam
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const tb = {
  ...qpBar,
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
    padding: '8px 18px 16px',
    boxSizing: 'border-box',
    maxHeight: 'min(72vh, 560px)',
    overflowY: 'auto',
  },
  roomSection: { paddingTop: 4, paddingBottom: 2 },
  roomTitle: { fontSize: 15, fontWeight: 800, color: '#0f2942', marginBottom: 2 },
  roomActions: { display: 'flex', justifyContent: 'flex-end', marginTop: 10, marginBottom: 2 },
  addRoomRow: { display: 'flex', justifyContent: 'flex-end', marginTop: 4, marginBottom: 8 },
  roomBlockDivider: { height: 1, background: '#e4ebf4', margin: '12px 0' },
  textLinkBtn: {
    border: 'none',
    background: 'transparent',
    padding: 0,
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--ta-accent, #1a73e8)',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  textLinkBtnOff: { opacity: 0.38, cursor: 'not-allowed', color: '#5a6982' },
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
};
