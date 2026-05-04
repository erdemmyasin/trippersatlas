'use client';

import { useState, useRef, useEffect } from 'react';
import { TRIP_LS, notifyTripStorage } from '@/lib/tripChipStorage';
import { isTurkeyPrimaryMarket } from '@/lib/taRegion';
import {
  Wallet,
  Scale,
  Star,
  Gem,
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin,
  X as LucideX,
  FileText,
  ChevronDown,
  Check,
} from 'lucide-react';

const DEFAULT_DEST_IMAGE =
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=96&h=96&fit=crop';

const LOC_TYPE_OPTIONS = [
  { value: 'stay', pill: 'Konaklama', menu: 'Konaklama' },
  { value: 'visit', pill: 'Ziyaret', menu: 'Ziyaret' },
  { value: 'depart', pill: 'Hareket', menu: 'Hareket' },
  { value: 'transit', pill: 'Transit', menu: 'Transit' },
  { value: 'return', pill: 'Dönüş', menu: 'Dönüş' },
];

async function fetchCityImageUrl(city) {
  const q = encodeURIComponent(`${String(city).trim()} city travel`);
  try {
    const res = await fetch(`/api/image?query=${q}&type=tour`);
    const data = await res.json();
    if (data?.url && typeof data.url === 'string') return data.url;
  } catch {
    /* ignore */
  }
  return DEFAULT_DEST_IMAGE;
}

function parseSummaryToLocations(summary) {
  const s = summary != null ? String(summary).trim() : '';
  if (!s) return [];
  return s
    .split(/\s*·\s*/)
    .map((part, i) => ({
      id: `s-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 9)}`,
      city: part.trim(),
      country: isTurkeyPrimaryMarket() ? 'Türkiye' : '',
      type: 'visit',
      nights: 0,
      imageUrl: DEFAULT_DEST_IMAGE,
    }))
    .filter((l) => l.city);
}

const MONTHS = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
const BUDGET_LEVELS = [
  { id: 'economy',  label: 'Ekonomik', desc: 'Uygun fiyatlı seçenekler', Icon: Wallet },
  { id: 'standard', label: 'Dengeli',  desc: 'Kalite/fiyat dengesi',       Icon: Scale },
  { id: 'good',     label: 'Konforlu', desc: 'Konforlu seçenekler',        Icon: Star },
  { id: 'luxury',   label: 'Lüks',     desc: 'En yüksek kalite',           Icon: Gem },
];

function loadLocationsFromStorage(initialSummary) {
  if (typeof window === 'undefined') {
    return parseSummaryToLocations(initialSummary);
  }
  try {
    const raw = localStorage.getItem(TRIP_LS.locations);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* ignore */
  }
  return parseSummaryToLocations(initialSummary);
}

function loadDatesModalState() {
  if (typeof window === 'undefined') {
    return {
      tab: 'dates',
      startDate: null,
      endDate: null,
      flexDays: 8,
      flexMonths: [],
      flexibility: '',
      currentMonth: new Date(),
    };
  }
  let startDate = null;
  let endDate = null;
  try {
    const sd = localStorage.getItem(TRIP_LS.startDate);
    const ed = localStorage.getItem(TRIP_LS.endDate);
    if (sd) {
      const d = new Date(sd);
      if (!Number.isNaN(d.getTime())) startDate = d;
    }
    if (ed) {
      const d = new Date(ed);
      if (!Number.isNaN(d.getTime())) endDate = d;
    }
  } catch {
    /* ignore */
  }
  const tab = localStorage.getItem(TRIP_LS.dateTab) || 'dates';
  const flexParsed = parseInt(localStorage.getItem(TRIP_LS.flexDays) || '8', 10);
  const flexDays = Number.isFinite(flexParsed) && flexParsed >= 1 ? flexParsed : 8;
  let flexMonths = [];
  try {
    const fm = localStorage.getItem(TRIP_LS.flexMonths);
    if (fm) {
      const p = JSON.parse(fm);
      if (Array.isArray(p)) flexMonths = p;
    }
  } catch {
    /* ignore */
  }
  const flexibility = localStorage.getItem(TRIP_LS.flexibility) ?? '';
  let currentMonth = new Date();
  if (startDate && !Number.isNaN(startDate.getTime())) {
    currentMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  }
  return { tab, startDate, endDate, flexDays, flexMonths, flexibility, currentMonth };
}

const DEFAULT_TRAVELERS = {
  adults: 1,
  children: 0,
  infants: 0,
  seniors: 0,
  pets: 0,
};

function loadTravelersFromStorage() {
  if (typeof window === 'undefined') return { ...DEFAULT_TRAVELERS };
  try {
    const raw = localStorage.getItem(TRIP_LS.travelers);
    if (raw) {
      const t = JSON.parse(raw);
      if (t && typeof t === 'object') {
        return { ...DEFAULT_TRAVELERS, ...t };
      }
    }
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_TRAVELERS };
}

function loadBudgetIdFromStorage() {
  if (typeof window === 'undefined') return 'standard';
  try {
    const v = localStorage.getItem(TRIP_LS.budget);
    if (!v) return 'standard';
    const byLabel = BUDGET_LEVELS.find((l) => l.label === v);
    if (byLabel) return byLabel.id;
    const byId = BUDGET_LEVELS.find((l) => l.id === v);
    if (byId) return byId.id;
  } catch {
    /* ignore */
  }
  return 'standard';
}

export default function ChipModal({ chip, onClose, onSave, onOpenNotes, destInitialSummary }) {
  const cardSize = CARD_SIZES[chip?.id] ?? CARD_SIZES.default;

  return (
    <>
      <div style={s.backdrop} onClick={onClose} aria-hidden />
      <div
        style={{ ...s.card, ...cardSize }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="chip-modal-title"
      >
        <button type="button" style={s.closeBtn} onClick={onClose} aria-label="Kapat">
          <LucideX size={18} strokeWidth={2} aria-hidden />
        </button>

        {chip?.id !== 'pax' && chip?.id !== 'dates' && chip?.id !== 'dest' && (
          <h2 id="chip-modal-title" style={s.title}>{TITLES[chip?.id] ?? chip?.label}</h2>
        )}

        <div style={s.body}>
          {chip?.id === 'dest'   && (
            <DestModal
              onSave={onSave}
              onClose={onClose}
              initialDestinationSummary={destInitialSummary}
            />
          )}
          {chip?.id === 'dates'  && <DatesModal  onSave={onSave} onClose={onClose} />}
          {chip?.id === 'pax'    && <PaxModal    onSave={onSave} onClose={onClose} onOpenNotes={onOpenNotes} />}
          {chip?.id === 'budget' && <BudgetModal onSave={onSave} onClose={onClose} />}
        </div>
      </div>
    </>
  );
}

const TITLES = {
  dest:   'Nereye?',
  dates:  'Ne zaman?',
  pax:    'Kimler?',
  budget: 'Bütçe Seviyesi',
};

const CARD_SIZES = {
  dest: { width: '520px', maxWidth: '95vw', maxHeight: '86vh' },
  dates: { width: '680px', maxWidth: '95vw', maxHeight: '92vh' },
  pax: { width: '480px', maxHeight: '86vh' },
  budget: { width: '520px', maxHeight: '78vh' },
  default: { width: '560px', maxHeight: '82vh' },
};

const TR_MONTHS_FULL = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];
const TR_DAYS_SHORT = ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'];

const FLEX_OPTIONS = [
  { id: 'exact', label: 'Kesin tarihler' },
  { id: '1', label: '± 1 gün' },
  { id: '2', label: '± 2 gün' },
  { id: '3', label: '± 3 gün' },
  { id: 'week', label: '± 1 hafta' },
];

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function addMonthsDate(d, delta) {
  const x = new Date(d);
  x.setDate(1);
  x.setMonth(x.getMonth() + delta);
  return x;
}

function diffInclusiveDays(a, b) {
  const t0 = startOfDay(a).getTime();
  const t1 = startOfDay(b).getTime();
  return Math.round(Math.abs(t1 - t0) / 86400000) + 1;
}

function formatRangeSubtitle(start, end) {
  if (!start || !end) return '';
  const lo = start <= end ? start : end;
  const hi = start <= end ? end : start;
  const n = diffInclusiveDays(lo, hi);
  return `${lo.getDate()} ${MONTHS[lo.getMonth()]} - ${hi.getDate()} ${MONTHS[hi.getMonth()]} · ${n} gün`;
}

function monthKeyFromYm(y, m0) {
  return `${y}-${String(m0 + 1).padStart(2, '0')}`;
}

function parseMonthKey(k) {
  const [ys, ms] = k.split('-');
  return { y: parseInt(ys, 10), m0: parseInt(ms, 10) - 1 };
}

function buildFlexChipText(flexDays, flexMonthKeys, flexibility) {
  const parts = [`${flexDays} gün`];
  if (flexMonthKeys.length) {
    const labels = [...flexMonthKeys]
      .sort()
      .map((k) => {
        const { y, m0 } = parseMonthKey(k);
        return `${TR_MONTHS_FULL[m0]} ${y}`;
      })
      .join(', ');
    parts.push(labels);
  }
  let t = parts.join(' · ');
  if (flexibility && flexibility !== 'exact') {
    const opt = FLEX_OPTIONS.find((o) => o.id === flexibility);
    if (opt) t += ` · ${opt.label}`;
  }
  return t;
}

function firstMonthShortFromKeys(keys) {
  if (!keys?.length) return '';
  const sorted = [...keys].sort();
  const { m0 } = parseMonthKey(sorted[0]);
  return MONTHS[m0];
}

function destPillLabel(type) {
  return LOC_TYPE_OPTIONS.find((o) => o.value === type)?.pill ?? 'Ziyaret';
}

/* ── Destinasyon ── */
function DestModal({ onSave, onClose, initialDestinationSummary }) {
  void onClose;
  const [locations, setLocations] = useState(() =>
    loadLocationsFromStorage(initialDestinationSummary)
  );
  const [addRowOpen, setAddRowOpen] = useState(false);
  const [addQuery, setAddQuery] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [expandedNightsId, setExpandedNightsId] = useState(null);
  const [typeMenuHover, setTypeMenuHover] = useState(null);
  const imageRequestedRef = useRef(new Set());
  const openDdRef = useRef(null);

  useEffect(() => {
    if (!openDropdownId) return undefined;
    function onDoc(e) {
      if (openDdRef.current?.contains(e.target)) return;
      setOpenDropdownId(null);
    }
    const t = window.setTimeout(() => {
      document.addEventListener('click', onDoc);
    }, 0);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('click', onDoc);
    };
  }, [openDropdownId]);

  useEffect(() => {
    try {
      localStorage.setItem(TRIP_LS.locations, JSON.stringify(locations));
      notifyTripStorage();
    } catch {
      /* ignore */
    }
  }, [locations]);

  useEffect(() => {
    locations.forEach((loc) => {
      if (!loc.city.trim() || imageRequestedRef.current.has(loc.id)) return;
      imageRequestedRef.current.add(loc.id);
      fetchCityImageUrl(loc.city).then((url) => {
        setLocations((prev) =>
          prev.map((l) => (l.id === loc.id ? { ...l, imageUrl: url } : l))
        );
      });
    });
  }, [locations]);

  function commitAddLocation() {
    const t = addQuery.trim();
    if (!t) return;
    const id = `n-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    imageRequestedRef.current.add(id);
    setLocations((prev) => [
      ...prev,
      {
        id,
        city: t,
        country: isTurkeyPrimaryMarket() ? 'Türkiye' : '',
        type: 'visit',
        nights: 0,
        imageUrl: DEFAULT_DEST_IMAGE,
      },
    ]);
    setAddQuery('');
    setAddRowOpen(false);
    fetchCityImageUrl(t).then((url) => {
      setLocations((prev) =>
        prev.map((l) => (l.id === id ? { ...l, imageUrl: url } : l))
      );
    });
  }

  function clearAll() {
    imageRequestedRef.current.clear();
    setLocations([]);
    setAddRowOpen(false);
    setAddQuery('');
    setOpenDropdownId(null);
    setExpandedNightsId(null);
  }

  const validLocations = locations.filter((l) => l.city.trim());
  const canUpdate = validLocations.length > 0;

  return (
    <div style={s.destWrap}>
      <h2 id="chip-modal-title" style={s.destHeadTitle}>
        Nereye?
      </h2>

      <div style={s.destList}>
        {locations.map((loc) => (
          <div key={loc.id} style={s.destItemBlock}>
            <div style={s.destRow}>
              <div style={s.destThumb}>
                {loc.imageUrl ? (
                  <img src={loc.imageUrl} alt="" style={s.destThumbImg} />
                ) : (
                  <MapPin size={22} strokeWidth={2} color="#7f7466" aria-hidden />
                )}
              </div>
              <div style={s.destMid}>
                <div style={s.destCity}>{loc.city || '—'}</div>
                <div style={s.destCountry}>{loc.country}</div>
              </div>
              <div style={s.destRight}>
                <div
                  ref={openDropdownId === loc.id ? openDdRef : null}
                  style={s.destDdWrap}
                >
                  <button
                    type="button"
                    style={s.destDdTrigger}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdownId((cur) => (cur === loc.id ? null : loc.id));
                    }}
                  >
                    <span>{destPillLabel(loc.type)}</span>
                    <ChevronDown size={14} strokeWidth={2} aria-hidden />
                  </button>
                  {openDropdownId === loc.id && (
                    <div style={s.destDdMenu} role="listbox">
                      {LOC_TYPE_OPTIONS.map((opt) => {
                        const sel = loc.type === opt.value;
                        const ho = typeMenuHover === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            role="option"
                            aria-selected={sel}
                            style={{
                              ...s.destDdItem,
                              ...(sel ? s.destDdItemSelected : {}),
                              ...(ho && !sel ? s.destDdItemHover : {}),
                            }}
                            onMouseEnter={() => setTypeMenuHover(opt.value)}
                            onMouseLeave={() => setTypeMenuHover(null)}
                            onClick={() => {
                              setLocations((prev) =>
                                prev.map((l) =>
                                  l.id === loc.id ? { ...l, type: opt.value } : l
                                )
                              );
                              if (opt.value !== 'stay') {
                                setExpandedNightsId((ex) =>
                                  ex === loc.id ? null : ex
                                );
                              }
                              setOpenDropdownId(null);
                            }}
                          >
                            {sel ? (
                              <Check size={16} strokeWidth={2} aria-hidden />
                            ) : (
                              <span style={s.destDdCheckSp} aria-hidden />
                            )}
                            <span>{opt.menu}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                {loc.type === 'stay' && (
                  <button
                    type="button"
                    style={s.destBtnGhost}
                    onClick={() => {
                      setExpandedNightsId((ex) => {
                        const closing = ex === loc.id;
                        if (!closing) {
                          setLocations((prev) =>
                            prev.map((l) =>
                              l.id === loc.id && (l.nights || 0) < 1
                                ? { ...l, nights: 3 }
                                : l
                            )
                          );
                        }
                        return closing ? null : loc.id;
                      });
                    }}
                  >
                    Gün Ekle
                  </button>
                )}
                <button
                  type="button"
                  style={s.destRemoveBtn}
                  aria-label="Kaldır"
                  onClick={() => {
                    imageRequestedRef.current.delete(loc.id);
                    setLocations((prev) => prev.filter((l) => l.id !== loc.id));
                    setOpenDropdownId((o) => (o === loc.id ? null : o));
                    setExpandedNightsId((ex) => (ex === loc.id ? null : ex));
                  }}
                >
                  <LucideX size={18} strokeWidth={2} />
                </button>
              </div>
            </div>
            {loc.type === 'stay' && expandedNightsId === loc.id && (
              <div style={s.destNightsRow}>
                <span style={s.destNightsLabel}>Kaç gece?</span>
                <div style={s.destNightsStep}>
                  <button
                    type="button"
                    style={s.destStepBtn}
                    onClick={() =>
                      setLocations((prev) =>
                        prev.map((l) =>
                          l.id === loc.id
                            ? {
                                ...l,
                                nights: Math.max(1, (l.nights || 1) - 1),
                              }
                            : l
                        )
                      )
                    }
                  >
                    −
                  </button>
                  <span style={s.destStepVal}>
                    {Math.max(1, loc.nights || 1)}
                  </span>
                  <button
                    type="button"
                    style={s.destStepBtn}
                    onClick={() =>
                      setLocations((prev) =>
                        prev.map((l) =>
                          l.id === loc.id
                            ? { ...l, nights: (l.nights || 1) + 1 }
                            : l
                        )
                      )
                    }
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {addRowOpen ? (
        <div style={s.destAddRow}>
          <input
            style={s.destAddInput}
            placeholder="Şehir ara…"
            value={addQuery}
            onChange={(e) => setAddQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              e.preventDefault();
              commitAddLocation();
            }}
            autoFocus
          />
          <button type="button" style={s.destAddOk} onClick={commitAddLocation}>
            Ekle
          </button>
          <button
            type="button"
            style={s.destAddCancel}
            onClick={() => {
              setAddRowOpen(false);
              setAddQuery('');
            }}
          >
            İptal
          </button>
        </div>
      ) : (
        <button
          type="button"
          style={s.destAddTrigger}
          onClick={() => setAddRowOpen(true)}
        >
          + Lokasyon Ekle
        </button>
      )}

      <div style={s.destFooter}>
        <button type="button" style={s.dmClear} onClick={clearAll}>
          Temizle
        </button>
        <button
          type="button"
          style={{
            ...s.dmUpdate,
            ...(!canUpdate ? s.dmUpdateDisabled : {}),
          }}
          disabled={!canUpdate}
          onClick={() => {
            if (!canUpdate) return;
            onSave?.({
              locations: validLocations,
              locs: validLocations.map((l) => ({
                name: l.city,
                province: l.country,
                days: l.type === 'stay' ? Math.max(1, l.nights || 1) : 1,
                img: l.imageUrl,
              })),
            });
          }}
        >
          Güncelle
        </button>
      </div>
    </div>
  );
}

/* ── Tarihler ── */
export function DatesModal({ onSave }) {
  const dmInit = loadDatesModalState();
  const [tab, setTab] = useState(dmInit.tab);
  const [startDate, setStartDate] = useState(dmInit.startDate);
  const [endDate, setEndDate] = useState(dmInit.endDate);
  const [flexDays, setFlexDays] = useState(dmInit.flexDays);
  const [flexDaysDraft, setFlexDaysDraft] = useState(String(dmInit.flexDays));
  const [flexMonths, setFlexMonths] = useState(dmInit.flexMonths);
  const [flexibility, setFlexibility] = useState(dmInit.flexibility);
  const [currentMonth, setCurrentMonth] = useState(dmInit.currentMonth);
  const [flexDropOpen, setFlexDropOpen] = useState(false);
  const [flexMenuHover, setFlexMenuHover] = useState(null);
  const flexDropRef = useRef(null);
  const flexStripRef = useRef(null);

  const today = startOfDay(new Date());
  const anchor = new Date(currentMonth);
  anchor.setDate(1);
  const leftY = anchor.getFullYear();
  const leftM = anchor.getMonth();
  const rightAnchor = addMonthsDate(anchor, 1);
  const rightY = rightAnchor.getFullYear();
  const rightM = rightAnchor.getMonth();

  const subtitle = startDate && endDate ? formatRangeSubtitle(startDate, endDate) : '';

  useEffect(() => {
    try {
      if (startDate) localStorage.setItem(TRIP_LS.startDate, startDate.toISOString());
      else localStorage.removeItem(TRIP_LS.startDate);
      if (endDate) localStorage.setItem(TRIP_LS.endDate, endDate.toISOString());
      else localStorage.removeItem(TRIP_LS.endDate);
      localStorage.setItem(TRIP_LS.dateTab, tab);
      localStorage.setItem(TRIP_LS.flexDays, String(flexDays));
      localStorage.setItem(TRIP_LS.flexMonths, JSON.stringify(flexMonths));
      localStorage.setItem(TRIP_LS.flexibility, flexibility);
      notifyTripStorage();
    } catch {
      /* ignore */
    }
  }, [startDate, endDate, tab, flexDays, flexMonths, flexibility]);

  useEffect(() => {
    if (!flexDropOpen) return;
    function onDoc(e) {
      if (flexDropRef.current && !flexDropRef.current.contains(e.target)) {
        setFlexDropOpen(false);
      }
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, [flexDropOpen]);

  useEffect(() => {
    setFlexDaysDraft(String(flexDays));
  }, [flexDays]);

  function handleDayClick(y, m0, day) {
    const d = new Date(y, m0, day);
    if (startOfDay(d) < today) return;
    if (!startDate || (startDate && endDate)) {
      setStartDate(d);
      setEndDate(null);
      return;
    }
    if (d < startDate) {
      setEndDate(startDate);
      setStartDate(d);
    } else {
      setEndDate(d);
    }
  }

  function sameCalendarDay(a, b) {
    if (!a || !b) return false;
    return startOfDay(a).getTime() === startOfDay(b).getTime();
  }

  function renderMonthGrid(y, m0) {
    const dim = daysInMonth(y, m0);
    const lead = new Date(y, m0, 1).getDay();
    const cells = [];
    for (let i = 0; i < lead; i += 1) cells.push(null);
    for (let d = 1; d <= dim; d += 1) cells.push(d);

    const sd = startDate ? startOfDay(startDate) : null;
    const ed = endDate ? startOfDay(endDate) : null;
    let loT = sd && ed ? sd.getTime() : null;
    let hiT = sd && ed ? ed.getTime() : null;
    if (loT != null && hiT != null && loT > hiT) {
      const x = loT;
      loT = hiT;
      hiT = x;
    }
    let rangeStartD = startDate;
    let rangeEndD = endDate;
    if (
      startDate &&
      endDate &&
      startOfDay(startDate).getTime() > startOfDay(endDate).getTime()
    ) {
      rangeStartD = endDate;
      rangeEndD = startDate;
    }

    return (
      <div style={s.dmCal}>
        <div style={s.dmCalTitle}>{`${TR_MONTHS_FULL[m0]} ${y}`}</div>
        <div style={s.dmWeekRow}>
          {TR_DAYS_SHORT.map((wd) => (
            <div key={wd} style={s.dmWeekCell}>{wd}</div>
          ))}
        </div>
        <div style={s.dmGrid}>
          {cells.map((day, idx) => {
            if (day == null) {
              return <div key={`e-${idx}`} style={s.dmDayPh} />;
            }
            const d = new Date(y, m0, day);
            const t = startOfDay(d).getTime();
            const past = t < today.getTime();
            const hasStart = Boolean(startDate);
            const hasEnd = Boolean(endDate);
            const isStart =
              hasStart &&
              (hasEnd
                ? sameCalendarDay(d, rangeStartD)
                : sameCalendarDay(d, startDate));
            const isEnd = hasEnd && sameCalendarDay(d, rangeEndD);
            const isInRange =
              hasStart && hasEnd && loT != null && hiT != null && t > loT && t < hiT;
            const singleDayRange =
              hasStart && hasEnd && sameCalendarDay(startDate, endDate);

            const circleStyle = {
              position: 'relative',
              zIndex: 1,
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--ta-ink)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              fontSize: 13,
              flexShrink: 0,
            };

            let inner;
            let btnStyle = { ...s.dmDayCell };
            if (past) btnStyle = { ...btnStyle, ...s.dmDayPast };

            if (!past && isInRange) {
              inner = (
                <>
                  <div
                    aria-hidden
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'rgba(0,0,0,.06)',
                      zIndex: 0,
                    }}
                  />
                  <span style={{ position: 'relative', zIndex: 1 }}>{day}</span>
                </>
              );
              btnStyle = { ...btnStyle, justifyContent: 'center' };
            } else if (!past && singleDayRange && (isStart || isEnd)) {
              inner = <span style={circleStyle}>{day}</span>;
              btnStyle = { ...btnStyle, justifyContent: 'center' };
            } else if (!past && hasStart && hasEnd && !singleDayRange && isStart) {
              inner = (
                <>
                  <div
                    aria-hidden
                    style={{
                      position: 'absolute',
                      left: '50%',
                      right: 0,
                      top: 0,
                      bottom: 0,
                      background: 'rgba(0,0,0,.06)',
                      zIndex: 0,
                    }}
                  />
                  <span style={circleStyle}>{day}</span>
                </>
              );
              btnStyle = { ...btnStyle, justifyContent: 'flex-start' };
            } else if (!past && hasStart && hasEnd && !singleDayRange && isEnd) {
              inner = (
                <>
                  <div
                    aria-hidden
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: '50%',
                      top: 0,
                      bottom: 0,
                      background: 'rgba(0,0,0,.06)',
                      zIndex: 0,
                    }}
                  />
                  <span style={{ ...circleStyle, marginLeft: 'auto' }}>{day}</span>
                </>
              );
              btnStyle = { ...btnStyle, justifyContent: 'flex-end' };
            } else if (!past && hasStart && !hasEnd && isStart) {
              inner = <span style={circleStyle}>{day}</span>;
              btnStyle = { ...btnStyle, justifyContent: 'center' };
            } else {
              inner = (
                <span style={{ position: 'relative', zIndex: 1 }}>{day}</span>
              );
              btnStyle = { ...btnStyle, justifyContent: 'center' };
            }

            return (
              <button
                key={day}
                type="button"
                disabled={past}
                onClick={() => handleDayClick(y, m0, day)}
                style={btnStyle}
              >
                {inner}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const flexStripStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const flexMonthSlots = Array.from({ length: 18 }, (_, i) => {
    const d = addMonthsDate(flexStripStart, i);
    return { y: d.getFullYear(), m0: d.getMonth(), key: monthKeyFromYm(d.getFullYear(), d.getMonth()) };
  });

  function toggleFlexMonth(key) {
    setFlexMonths((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key].sort()
    );
  }

  function scrollFlexStrip(direction) {
    const el = flexStripRef.current;
    if (!el) return;
    const step = Math.max(200, Math.round(el.clientWidth * 0.75));
    el.scrollBy({ left: direction * step, behavior: 'smooth' });
  }

  function resolveFlexDaysFromDraft() {
    const n = parseInt(flexDaysDraft, 10);
    if (!Number.isFinite(n) || n < 1) {
      const v = Math.max(1, flexDays);
      setFlexDays(v);
      return v;
    }
    const v = Math.min(999, n);
    setFlexDays(v);
    return v;
  }

  function clearAll() {
    setTab('dates');
    setStartDate(null);
    setEndDate(null);
    setFlexDays(8);
    setFlexDaysDraft('8');
    setFlexMonths([]);
    setFlexibility('');
    setCurrentMonth(new Date());
    try {
      localStorage.removeItem(TRIP_LS.startDate);
      localStorage.removeItem(TRIP_LS.endDate);
      localStorage.setItem(TRIP_LS.dateTab, 'dates');
      localStorage.setItem(TRIP_LS.flexDays, '8');
      localStorage.setItem(TRIP_LS.flexMonths, '[]');
      localStorage.setItem(TRIP_LS.flexibility, '');
      notifyTripStorage();
    } catch {
      /* ignore */
    }
  }

  const canUpdate =
    tab === 'dates'
      ? Boolean(startDate && endDate)
      : flexDays >= 1;

  const flexEff = flexibility === '' ? 'exact' : flexibility;
  const flexPillLabel = '± Esneklik ekle';

  return (
    <div style={s.dmWrap}>
      <h2 id="chip-modal-title" style={s.dmHeadTitle}>Ne zaman?</h2>
      <p style={s.dmHeadSub}>{subtitle}</p>

      <div style={s.dmTabBar}>
        <button
          type="button"
          style={{ ...s.dmTab, ...(tab === 'dates' ? s.dmTabOn : s.dmTabOff) }}
          onClick={() => setTab('dates')}
        >
          Tarih Seçin
        </button>
        <button
          type="button"
          style={{ ...s.dmTab, ...(tab === 'flex' ? s.dmTabOn : s.dmTabOff) }}
          onClick={() => setTab('flex')}
        >
          Esnek Tarih
        </button>
      </div>

      {tab === 'dates' && (
        <>
          <div style={s.dmFlexPillRow} ref={flexDropRef}>
            <button
              type="button"
              style={s.dmFlexPill}
              onClick={() => setFlexDropOpen((o) => !o)}
            >
              {flexPillLabel}
            </button>
            {flexDropOpen && (
              <div style={s.dmFlexMenu}>
                {FLEX_OPTIONS.map((opt) => {
                  const checked = flexEff === opt.id;
                  const hovered = flexMenuHover === opt.id && !checked;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      style={{
                        ...s.dmFlexMenuRow,
                        ...(checked ? s.dmFlexMenuRowSelected : {}),
                        ...(hovered ? s.dmFlexMenuRowHover : {}),
                      }}
                      onMouseEnter={() => setFlexMenuHover(opt.id)}
                      onMouseLeave={() => setFlexMenuHover(null)}
                      onClick={() => {
                        setFlexibility(opt.id === 'exact' ? '' : opt.id);
                        setFlexDropOpen(false);
                      }}
                    >
                      <span
                        style={
                          checked ? s.dmFlexRadioDotFilled : s.dmFlexRadioDotEmpty
                        }
                        aria-hidden
                      >
                        {checked ? <span style={s.dmFlexRadioInnerDot} /> : null}
                      </span>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div style={s.dmNav}>
            <button
              type="button"
              style={s.dmNavBtn}
              aria-label="Önceki ay"
              onClick={() => setCurrentMonth((prev) => addMonthsDate(prev, -1))}
            >
              <ChevronLeft size={20} strokeWidth={2} />
            </button>
            <button
              type="button"
              style={s.dmNavBtn}
              aria-label="Sonraki ay"
              onClick={() => setCurrentMonth((prev) => addMonthsDate(prev, 1))}
            >
              <ChevronRight size={20} strokeWidth={2} />
            </button>
          </div>
          <div style={s.dmTwoCal}>
            {renderMonthGrid(leftY, leftM)}
            {renderMonthGrid(rightY, rightM)}
          </div>
        </>
      )}

      {tab === 'flex' && (
        <div style={s.dmFlexBody}>
          <div style={s.dmFlexPillRow} ref={flexDropRef}>
            <button
              type="button"
              style={s.dmFlexPill}
              onClick={() => setFlexDropOpen((o) => !o)}
            >
              {flexPillLabel}
            </button>
            {flexDropOpen && (
              <div style={s.dmFlexMenu}>
                {FLEX_OPTIONS.map((opt) => {
                  const checked = flexEff === opt.id;
                  const hovered = flexMenuHover === opt.id && !checked;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      style={{
                        ...s.dmFlexMenuRow,
                        ...(checked ? s.dmFlexMenuRowSelected : {}),
                        ...(hovered ? s.dmFlexMenuRowHover : {}),
                      }}
                      onMouseEnter={() => setFlexMenuHover(opt.id)}
                      onMouseLeave={() => setFlexMenuHover(null)}
                      onClick={() => {
                        setFlexibility(opt.id === 'exact' ? '' : opt.id);
                        setFlexDropOpen(false);
                      }}
                    >
                      <span
                        style={
                          checked ? s.dmFlexRadioDotFilled : s.dmFlexRadioDotEmpty
                        }
                        aria-hidden
                      >
                        {checked ? <span style={s.dmFlexRadioInnerDot} /> : null}
                      </span>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div style={s.dmFlexCounterBlock}>
            <div style={s.dmFlexCounterLabel}>Kaç Gün?</div>
            <div style={s.dmFlexCounterRow}>
              <button
                type="button"
                style={s.dmFlexStep}
                onClick={() => setFlexDays((d) => Math.max(1, d - 1))}
                aria-label="Bir gün azalt"
              >
                −
              </button>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                aria-label="Gün sayısı"
                style={s.dmFlexStepInput}
                value={flexDaysDraft}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '');
                  setFlexDaysDraft(v);
                }}
                onBlur={() => {
                  const n = parseInt(flexDaysDraft, 10);
                  if (!Number.isFinite(n) || n < 1) {
                    setFlexDays(1);
                    return;
                  }
                  setFlexDays(Math.min(999, n));
                }}
              />
              <button
                type="button"
                style={s.dmFlexStep}
                aria-label="Bir gün artır"
                onClick={() => setFlexDays((d) => Math.min(999, d + 1))}
              >
                +
              </button>
            </div>
          </div>
          <div style={s.dmFlexSectionTitle}>İstediğin Zaman Seyahat Et</div>
          <div style={s.dmFlexStripRow}>
            <button
              type="button"
              style={s.dmFlexStripNavBtn}
              aria-label="Önceki aylar"
              onClick={() => scrollFlexStrip(-1)}
            >
              <ChevronLeft size={20} strokeWidth={2} />
            </button>
            <div ref={flexStripRef} style={s.dmFlexStrip}>
              {flexMonthSlots.map(({ y, m0, key }) => {
                const sel = flexMonths.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    style={{ ...s.dmFlexCard, ...(sel ? s.dmFlexCardOn : {}) }}
                    onClick={() => toggleFlexMonth(key)}
                  >
                    <Calendar size={18} strokeWidth={2} color="var(--ta-ink)" />
                    <span style={s.dmFlexCardLabel}>{TR_MONTHS_FULL[m0]}</span>
                    <span style={s.dmFlexCardYear}>{y}</span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              style={s.dmFlexStripNavBtn}
              aria-label="Sonraki aylar"
              onClick={() => scrollFlexStrip(1)}
            >
              <ChevronRight size={20} strokeWidth={2} />
            </button>
          </div>
        </div>
      )}

      <div style={s.dmFooter}>
        <button type="button" style={s.dmClear} onClick={clearAll}>
          Temizle
        </button>
        <button
          type="button"
          style={{ ...s.dmUpdate, ...(!canUpdate ? s.dmUpdateDisabled : {}) }}
          disabled={!canUpdate}
          onClick={() => {
            if (tab === 'dates' && startDate && endDate) {
              const lo = startDate <= endDate ? startDate : endDate;
              const hi = startDate <= endDate ? endDate : startDate;
              onSave?.({
                tab: 'dates',
                datesChipText: formatRangeSubtitle(startDate, endDate),
                nights: Math.max(0, diffInclusiveDays(lo, hi) - 1),
                month: MONTHS[lo.getMonth()],
                flexibility: flexEff,
                flexDays,
                flexMonths,
                startDate: lo.toISOString(),
                endDate: hi.toISOString(),
              });
            } else if (tab === 'flex') {
              const fd = resolveFlexDaysFromDraft();
              onSave?.({
                tab: 'flex',
                datesChipText: buildFlexChipText(fd, flexMonths, flexEff),
                nights: fd,
                month: firstMonthShortFromKeys(flexMonths),
                flexibility: flexEff,
                flexDays: fd,
                flexMonths,
              });
            }
          }}
        >
          Güncelle
        </button>
      </div>
    </div>
  );
}

function paxGezginTotal(t) {
  return (t.adults || 0) + (t.children || 0) + (t.seniors || 0);
}

function buildPaxChipText(t) {
  const parts = [];
  if (t.adults > 0) parts.push(`${t.adults} yetişkin`);
  if (t.children > 0) parts.push(`${t.children} çocuk`);
  if (t.infants > 0) parts.push(`${t.infants} bebek`);
  if (t.seniors > 0) parts.push(`${t.seniors} yaşlı`);
  if (t.pets > 0) parts.push(`${t.pets} evcil hayvan`);
  return parts.length ? parts.join(' · ') : '1 yetişkin';
}

/* ── Kişi sayısı ── */
function PaxModal({ onSave, onClose, onOpenNotes }) {
  const [travelers, setTravelers] = useState(loadTravelersFromStorage);

  useEffect(() => {
    try {
      localStorage.setItem(TRIP_LS.travelers, JSON.stringify(travelers));
      notifyTripStorage();
    } catch {
      /* ignore */
    }
  }, [travelers]);

  const totalGezgin = paxGezginTotal(travelers);

  function patch(key, delta) {
    setTravelers((prev) => {
      const next = { ...prev, [key]: Math.max(0, (prev[key] || 0) + delta) };
      if (key === 'adults' && next.adults < 1) next.adults = 1;
      return next;
    });
  }

  return (
    <div style={s.paxWrap}>
      <h2 id="chip-modal-title" style={s.paxHeadTitle}>Kimler?</h2>
      <p style={s.paxHeadSub}>
        {totalGezgin} gezgin
      </p>

      <PaxCatRow
        label="Yetişkinler"
        sub="13 yaş ve üzeri"
        val={travelers.adults}
        onDec={() => patch('adults', -1)}
        onInc={() => patch('adults', 1)}
        minGuard
      />
      <div style={s.paxDivider} />
      <PaxCatRow
        label="Çocuklar"
        sub="2-12 yaş arası"
        val={travelers.children}
        onDec={() => patch('children', -1)}
        onInc={() => patch('children', 1)}
      />
      <div style={s.paxDivider} />
      <PaxCatRow
        label="Bebekler"
        sub="2 yaş altı"
        val={travelers.infants}
        onDec={() => patch('infants', -1)}
        onInc={() => patch('infants', 1)}
      />
      <div style={s.paxDivider} />
      <PaxCatRow
        label="Yaşlılar"
        sub="65 yaş ve üzeri"
        val={travelers.seniors}
        onDec={() => patch('seniors', -1)}
        onInc={() => patch('seniors', 1)}
      />
      <div style={s.paxDivider} />
      <PaxCatRow
        label="Evcil Hayvan"
        sub="Hizmet hayvanı mı?"
        val={travelers.pets}
        onDec={() => patch('pets', -1)}
        onInc={() => patch('pets', 1)}
      />

      <div style={s.paxDivider} />

      <div style={s.paxHint}>
        <span style={s.paxHintIcon} aria-hidden>
          <FileText size={16} strokeWidth={1.75} color="var(--ta-accent-deep)" />
        </span>
        <div style={s.paxHintTextWrap}>
          <span style={s.paxHintLine}>Engeli veya özel ihtiyacı olan</span>
          <span style={s.paxHintLine}>gezgininiz var mı?</span>
          <button
            type="button"
            style={s.paxHintLink}
            onClick={() => {
              onClose();
              onOpenNotes?.();
            }}
          >
            Notlar bölümüne ekleyin →
          </button>
        </div>
      </div>

      <button
        type="button"
        style={s.paxUpdateBtn}
        onClick={() => {
          onSave?.({
            travelers,
            paxChipText: buildPaxChipText(travelers),
          });
        }}
      >
        Güncelle
      </button>
    </div>
  );
}

function PaxCatRow({ label, sub, val, onDec, onInc, minGuard }) {
  return (
    <div style={s.paxCatRow}>
      <div>
        <div style={s.paxCatLabel}>{label}</div>
        <div style={s.paxCatSub}>{sub}</div>
      </div>
      <div style={s.paxStepper}>
        <button
          type="button"
          style={{
            ...s.paxRoundBtn,
            ...(minGuard && val <= 1 ? s.paxRoundBtnDisabled : {}),
          }}
          onClick={onDec}
          disabled={minGuard && val <= 1}
          aria-label={`${label} azalt`}
        >
          <Minus size={16} strokeWidth={2} color="var(--ta-ink)" />
        </button>
        <span style={s.paxStepVal}>{val}</span>
        <button type="button" style={s.paxRoundBtn} onClick={onInc} aria-label={`${label} arttır`}>
          <Plus size={16} strokeWidth={2} color="var(--ta-ink)" />
        </button>
      </div>
    </div>
  );
}

/* ── Bütçe ── */
function BudgetModal({ onSave, onClose }) {
  const [selected, setSelected] = useState(loadBudgetIdFromStorage);

  useEffect(() => {
    try {
      const lvl = BUDGET_LEVELS.find((l) => l.id === selected);
      localStorage.setItem(TRIP_LS.budget, lvl?.label ?? '');
      notifyTripStorage();
    } catch {
      /* ignore */
    }
  }, [selected]);

  return (
    <div style={s.budgetGrid}>
      {BUDGET_LEVELS.map((lvl) => {
        const Icon = lvl.Icon;
        const active = selected === lvl.id;
        return (
          <button
            key={lvl.id}
            type="button"
            style={{ ...s.budgetOption, ...(active ? s.budgetOptionActive : s.budgetOptionIdle) }}
            onClick={() => setSelected(lvl.id)}
          >
            <span style={s.budgetIconWrap}>
              <Icon size={28} color="var(--ta-ink)" strokeWidth={1.75} aria-hidden />
            </span>
            <strong style={s.budgetLabel}>{lvl.label}</strong>
            <span style={s.budgetDesc}>{lvl.desc}</span>
          </button>
        );
      })}

      <button
        type="button"
        style={{ ...s.budgetSaveBtn, gridColumn: '1 / -1' }}
        onClick={() => {
          const lvl = BUDGET_LEVELS.find((l) => l.id === selected);
          onSave?.({ level: selected, budget: lvl?.label ?? 'Dengeli' });
          onClose();
        }}
      >
        Kaydet
      </button>
    </div>
  );
}

/* ── Styles ── */
const s = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,.2)',
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)',
    zIndex: 999,
  },
  card: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 1000,
    minWidth: 320,
    width: '560px',
    maxWidth: 'min(96vw, 820px)',
    maxHeight: '82vh',
    background: '#fff',
    borderRadius: 16,
    padding: '24px',
    boxShadow: '0 8px 32px rgba(0,0,0,.16)',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    fontFamily: 'var(--font-sans)',
  },
  closeBtn: {
    position: 'absolute',
    top: '16px',
    left: '18px',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '1px solid rgba(0,0,0,.10)',
    background: 'rgba(0,0,0,.04)',
    fontSize: '13px',
    color: 'var(--text2)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    fontFamily: 'var(--font-sans)',
    fontWeight: 800,
    fontSize: '20px',
    color: 'var(--text1)',
    padding: '0 0 8px',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    minHeight: 0,
    padding: '8px 0 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },

  /* Destinasyon modal */
  destWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    marginTop: -4,
  },
  destHeadTitle: {
    margin: 0,
    textAlign: 'center',
    fontFamily: 'var(--font-sans)',
    fontWeight: 800,
    fontSize: 22,
    color: 'var(--ta-ink)',
    letterSpacing: '-0.02em',
    marginBottom: 16,
  },
  destList: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: 12,
  },
  destItemBlock: { marginBottom: 8 },
  destRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    border: '1px solid rgba(0,0,0,.08)',
    borderRadius: 12,
    boxSizing: 'border-box',
  },
  destThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    overflow: 'hidden',
    flexShrink: 0,
    background: 'rgba(0,0,0,.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  destThumbImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  destMid: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  destCity: {
    fontFamily: 'var(--font-sans)',
    fontWeight: 700,
    fontSize: 14,
    color: 'var(--ta-ink)',
  },
  destCountry: {
    fontFamily: 'var(--font-sans)',
    fontSize: 12,
    color: '#7f7466',
  },
  destRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  destDdWrap: {
    position: 'relative',
    flexShrink: 0,
  },
  destDdTrigger: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    border: '1px solid rgba(0,0,0,.12)',
    borderRadius: 999,
    padding: '5px 10px',
    fontSize: 13,
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    color: 'var(--ta-ink)',
    background: '#fff',
    cursor: 'pointer',
  },
  destDdMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 6,
    minWidth: 180,
    background: '#fff',
    border: '1px solid rgba(0,0,0,.08)',
    borderRadius: 12,
    boxShadow: '0 4px 16px rgba(0,0,0,.1)',
    padding: 4,
    zIndex: 40,
    boxSizing: 'border-box',
  },
  destDdItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    padding: '9px 14px',
    border: 'none',
    borderRadius: 8,
    background: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--ta-ink)',
    textAlign: 'left',
    boxSizing: 'border-box',
  },
  destDdItemSelected: {
    fontWeight: 700,
  },
  destDdItemHover: {
    background: 'var(--ta-muted-bg)',
  },
  destDdCheckSp: {
    width: 16,
    height: 16,
    flexShrink: 0,
  },
  destBtnGhost: {
    border: 'none',
    background: 'none',
    padding: '4px 6px',
    fontFamily: 'var(--font-sans)',
    fontSize: 12,
    fontWeight: 600,
    color: '#B8934A',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  destRemoveBtn: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    border: '1px solid rgba(0,0,0,.08)',
    background: 'rgba(0,0,0,.03)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
    color: 'var(--ta-ink)',
    flexShrink: 0,
  },
  destNightsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
    paddingRight: 4,
  },
  destNightsLabel: {
    fontFamily: 'var(--font-sans)',
    fontSize: 13,
    color: '#7f7466',
  },
  destNightsStep: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  destStepBtn: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    border: '1px solid rgba(0,0,0,.15)',
    background: '#fff',
    cursor: 'pointer',
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--ta-ink)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  destStepVal: {
    fontFamily: 'var(--font-sans)',
    fontWeight: 700,
    fontSize: 15,
    minWidth: 20,
    textAlign: 'center',
    color: 'var(--ta-ink)',
  },
  destAddTrigger: {
    width: '100%',
    padding: '12px 14px',
    marginBottom: 12,
    borderRadius: 12,
    border: '1px dashed rgba(0,0,0,.15)',
    background: 'rgba(0,0,0,.02)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 700,
    fontSize: 14,
    color: 'var(--ta-ink)',
    cursor: 'pointer',
  },
  destAddRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  destAddInput: {
    flex: 1,
    minWidth: 160,
    height: 40,
    border: '1px solid rgba(0,0,0,.1)',
    borderRadius: 12,
    padding: '0 12px',
    fontFamily: 'var(--font-sans)',
    fontSize: 14,
    outline: 'none',
  },
  destAddOk: {
    height: 40,
    padding: '0 16px',
    borderRadius: 12,
    border: 'none',
    background: 'var(--ta-ink)',
    color: '#fff',
    fontFamily: 'var(--font-sans)',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
  },
  destAddCancel: {
    height: 40,
    padding: '0 12px',
    borderRadius: 12,
    border: '1px solid rgba(0,0,0,.1)',
    background: '#fff',
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
    color: '#7f7466',
  },
  destFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTop: '1px solid rgba(0,0,0,.06)',
  },

  /* Dates modal */
  dmWrap: { display: 'flex', flexDirection: 'column', gap: 0, marginTop: -4 },
  dmHeadTitle: {
    margin: 0,
    textAlign: 'center',
    fontFamily: 'var(--font-sans)',
    fontWeight: 800,
    fontSize: '22px',
    color: 'var(--ta-ink)',
    letterSpacing: '-0.02em',
  },
  dmHeadSub: {
    margin: '6px 0 14px',
    textAlign: 'center',
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    fontSize: '15px',
    color: '#7f7466',
    minHeight: '22px',
  },
  dmTabBar: {
    display: 'flex',
    gap: 8,
    marginBottom: 12,
  },
  dmTab: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    fontFamily: 'var(--font-sans)',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    border: '1px solid transparent',
    transition: 'background .15s, border-color .15s, color .15s',
  },
  dmTabOn: {
    background: '#fff',
    border: '1px solid var(--ta-ink)',
    color: 'var(--ta-ink)',
  },
  dmTabOff: {
    background: 'rgba(0,0,0,.06)',
    color: '#7f7466',
    border: '1px solid rgba(0,0,0,.06)',
  },
  dmFlexPillRow: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 16,
  },
  dmFlexPill: {
    border: '1px solid rgba(0,0,0,.15)',
    borderRadius: 999,
    padding: '6px 16px',
    fontSize: 13,
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    background: '#fff',
    color: 'var(--ta-ink)',
    cursor: 'pointer',
  },
  dmFlexMenu: {
    position: 'absolute',
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    marginTop: 6,
    minWidth: 200,
    padding: 8,
    background: '#FFFFFF',
    borderRadius: 16,
    border: '1px solid rgba(0,0,0,.08)',
    boxShadow: '0 8px 24px rgba(0,0,0,.12)',
    zIndex: 30,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  dmFlexMenuRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    padding: '10px 14px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--ta-ink)',
    textAlign: 'left',
    borderRadius: 10,
    boxSizing: 'border-box',
  },
  dmFlexMenuRowSelected: {
    background: 'var(--ta-ink)',
    color: '#fff',
  },
  dmFlexMenuRowHover: {
    background: 'var(--ta-muted-bg)',
  },
  dmFlexRadioDotEmpty: {
    width: 16,
    height: 16,
    borderRadius: '50%',
    border: '1.5px solid #D0CCC4',
    flexShrink: 0,
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dmFlexRadioDotFilled: {
    width: 16,
    height: 16,
    borderRadius: '50%',
    background: 'var(--ta-ink)',
    border: '2px solid #fff',
    flexShrink: 0,
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dmFlexRadioInnerDot: {
    width: 5,
    height: 5,
    borderRadius: '50%',
    background: '#fff',
  },
  dmNav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    padding: '0 4px',
  },
  dmNavBtn: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: '1px solid rgba(0,0,0,.1)',
    background: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
    color: 'var(--ta-ink)',
  },
  dmTwoCal: {
    display: 'flex',
    gap: 16,
    marginBottom: 16,
    minWidth: 0,
  },
  dmCal: { flex: 1, minWidth: 0 },
  dmCalTitle: {
    fontFamily: 'var(--font-sans)',
    fontWeight: 700,
    fontSize: 14,
    color: 'var(--ta-ink)',
    textAlign: 'center',
    marginBottom: 8,
  },
  dmWeekRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 0,
    marginBottom: 4,
  },
  dmWeekCell: {
    fontSize: 11,
    fontWeight: 600,
    color: '#7f7466',
    textAlign: 'center',
    fontFamily: 'var(--font-sans)',
  },
  dmGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 0,
  },
  dmDayPh: { minHeight: 36 },
  dmDayCell: {
    minHeight: 36,
    border: 'none',
    borderRadius: 0,
    background: 'transparent',
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    fontSize: 13,
    color: 'var(--ta-ink)',
    cursor: 'pointer',
    padding: 0,
    width: '100%',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    boxSizing: 'border-box',
  },
  dmDayPast: {
    opacity: 0.35,
    cursor: 'not-allowed',
    pointerEvents: 'none',
  },
  dmFlexBody: { marginBottom: 8 },
  dmFlexCounterBlock: {
    marginBottom: 18,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  dmFlexCounterLabel: {
    fontFamily: 'var(--font-sans)',
    fontWeight: 700,
    fontSize: 14,
    color: 'var(--ta-ink)',
    marginBottom: 10,
    textAlign: 'center',
    width: '100%',
  },
  dmFlexCounterRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    width: '100%',
  },
  dmFlexStep: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: '1px solid rgba(0,0,0,.2)',
    background: '#fff',
    cursor: 'pointer',
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--ta-ink)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  dmFlexStepVal: {
    fontFamily: 'var(--font-sans)',
    fontWeight: 700,
    fontSize: 18,
    minWidth: 28,
    textAlign: 'center',
    color: 'var(--ta-ink)',
  },
  dmFlexStepInput: {
    width: 52,
    minWidth: 40,
    maxWidth: 72,
    border: 'none',
    background: 'transparent',
    outline: 'none',
    textAlign: 'center',
    fontFamily: 'var(--font-sans)',
    fontWeight: 700,
    fontSize: 18,
    color: 'var(--ta-ink)',
    padding: 0,
    margin: 0,
    lineHeight: 1.2,
  },
  dmFlexSectionTitle: {
    fontFamily: 'var(--font-sans)',
    fontWeight: 700,
    fontSize: 14,
    color: 'var(--ta-ink)',
    marginBottom: 12,
    textAlign: 'center',
    width: '100%',
  },
  dmFlexStripRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    minWidth: 0,
    marginBottom: 8,
  },
  dmFlexStripNavBtn: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: '1px solid rgba(0,0,0,.1)',
    background: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
    color: 'var(--ta-ink)',
    flexShrink: 0,
  },
  dmFlexStrip: {
    display: 'flex',
    gap: 10,
    overflowX: 'auto',
    paddingBottom: 8,
    flex: 1,
    minWidth: 0,
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'thin',
  },
  dmFlexCard: {
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: '12px 16px',
    minWidth: 100,
    borderRadius: 14,
    border: '2px solid rgba(0,0,0,.08)',
    background: '#fff',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    boxSizing: 'border-box',
  },
  dmFlexCardOn: {
    border: '2px solid var(--ta-ink)',
  },
  dmFlexCardLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--ta-ink)',
    whiteSpace: 'nowrap',
    marginTop: 2,
  },
  dmFlexCardYear: {
    fontSize: 12,
    fontWeight: 600,
    color: '#7f7466',
    lineHeight: 1.2,
  },
  dmFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTop: '1px solid rgba(0,0,0,.06)',
  },
  dmClear: {
    border: 'none',
    background: 'none',
    padding: '8px 4px',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    fontSize: 15,
    color: '#7f7466',
  },
  dmUpdate: {
    padding: '12px 28px',
    borderRadius: 999,
    border: 'none',
    background: 'var(--ta-ink)',
    color: '#fff',
    fontFamily: 'var(--font-sans)',
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
  },
  dmUpdateDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },

  /* Pax */
  paxWrap: { display: 'flex', flexDirection: 'column', gap: 0, marginTop: -4 },
  paxHeadTitle: {
    margin: 0,
    textAlign: 'center',
    fontFamily: 'var(--font-sans)',
    fontWeight: 800,
    fontSize: '22px',
    color: 'var(--ta-ink)',
    letterSpacing: '-0.02em',
  },
  paxHeadSub: {
    margin: '6px 0 18px',
    textAlign: 'center',
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    fontSize: '15px',
    color: '#7f7466',
  },
  paxCatRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    padding: '14px 0',
    minWidth: 0,
  },
  paxCatLabel: { fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '14px', color: 'var(--ta-ink)' },
  paxCatSub: { fontFamily: 'var(--font-sans)', fontSize: '12px', color: '#7f7466', marginTop: '3px' },
  paxStepper: { display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 },
  paxRoundBtn: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    border: '1px solid rgba(0,0,0,.2)',
    background: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    flexShrink: 0,
  },
  paxRoundBtnDisabled: {
    opacity: 0.35,
    cursor: 'not-allowed',
  },
  paxStepVal: {
    fontFamily: 'var(--font-sans)',
    fontWeight: 700,
    fontSize: '16px',
    minWidth: 20,
    textAlign: 'center',
    color: 'var(--ta-ink)',
  },
  paxDivider: {
    height: 0,
    border: 'none',
    borderTop: '1px solid rgba(0,0,0,.06)',
    margin: 0,
  },
  paxHint: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
    padding: '14px 0',
  },
  paxHintIcon: { fontSize: 14, lineHeight: 1.4, flexShrink: 0 },
  paxHintTextWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    alignItems: 'flex-start',
  },
  paxHintLine: {
    fontFamily: 'var(--font-sans)',
    fontSize: 13,
    color: '#7f7466',
    lineHeight: 1.45,
  },
  paxHintLink: {
    border: 'none',
    background: 'none',
    padding: 0,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    fontSize: 13,
    fontWeight: 600,
    color: '#B8934A',
    textAlign: 'left',
  },
  paxUpdateBtn: {
    width: '100%',
    height: 52,
    borderRadius: 999,
    border: 'none',
    background: 'var(--ta-ink)',
    color: '#fff',
    fontFamily: 'var(--font-sans)',
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
    marginTop: 8,
  },
  counterRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  counterBtn: {
    width: '36px', height: '36px',
    borderRadius: '50%',
    border: '2px solid rgba(0,0,0,.14)',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--text1)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  counterVal: { fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '16px', minWidth: '24px', textAlign: 'center', color: 'var(--text1)' },

  /* Budget levels */
  budgetGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  budgetOption: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '10px',
    padding: '20px',
    borderRadius: '14px',
    cursor: 'pointer',
    transition: 'border-color .15s, background .15s',
    fontFamily: 'var(--font-sans)',
    boxSizing: 'border-box',
  },
  budgetOptionIdle: {
    border: '1px solid rgba(0,0,0,.1)',
    background: '#fff',
  },
  budgetOptionActive: {
    border: '2px solid var(--ta-ink)',
    background: 'rgba(0,0,0,.03)',
  },
  budgetIconWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 0,
  },
  budgetLabel: {
    fontFamily: 'var(--font-sans)',
    fontWeight: 700,
    fontSize: '15px',
    color: 'var(--ta-ink)',
    textAlign: 'center',
  },
  budgetDesc: {
    fontFamily: 'var(--font-sans)',
    fontSize: '12px',
    color: '#7f7466',
    textAlign: 'center',
    lineHeight: 1.45,
  },
  budgetSaveBtn: {
    width: '100%',
    height: '52px',
    borderRadius: '999px',
    border: 'none',
    background: 'var(--ta-ink)',
    color: '#fff',
    fontFamily: 'var(--font-sans)',
    fontWeight: 700,
    fontSize: '15px',
    cursor: 'pointer',
    marginTop: '4px',
    transition: 'opacity .15s',
  },
};
