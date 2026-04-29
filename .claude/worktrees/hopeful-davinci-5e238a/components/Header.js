'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { X, ChevronDown, Briefcase, Plus, Check } from 'lucide-react';
import ChipModal from './ChipModal';
import {
  mergeTripMetaForChips,
  readTripMetaSnapshot,
  TRIP_LS,
  notifyTripStorage,
} from '@/lib/tripChipStorage';

const NOTES_LEGACY_KEY = 'ta_header_trip_notes';
const LS_TRIPS_KEY = 'ta_trips';

function formatTripListDate(trip) {
  try {
    if (trip?.startDate && trip?.endDate) {
      const a = new Date(trip.startDate);
      const b = new Date(trip.endDate);
      if (!Number.isNaN(a.getTime()) && !Number.isNaN(b.getTime())) {
        return `${a.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} – ${b.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      }
    }
    if (trip?.createdAt) {
      const c = new Date(trip.createdAt);
      if (!Number.isNaN(c.getTime())) {
        return c.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    }
    if (trip?.month && trip?.days) {
      return `${trip.days} gün · ${trip.month}`;
    }
  } catch {
    /* ignore */
  }
  return '—';
}

function readLocationsTravelersBudgetNotes() {
  let locations = [];
  try {
    const r = typeof window !== 'undefined' ? localStorage.getItem(TRIP_LS.locations) : null;
    if (r) locations = JSON.parse(r);
    if (!Array.isArray(locations)) locations = [];
  } catch {
    locations = [];
  }
  let startDate = null;
  let endDate = null;
  try {
    if (typeof window !== 'undefined') {
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
    }
  } catch {
    /* ignore */
  }
  let travelers = {};
  try {
    const tr = typeof window !== 'undefined' ? localStorage.getItem(TRIP_LS.travelers) : null;
    if (tr) travelers = JSON.parse(tr);
    if (!travelers || typeof travelers !== 'object') travelers = {};
  } catch {
    travelers = {};
  }
  let budget = '';
  try {
    budget =
      typeof window !== 'undefined' ? localStorage.getItem(TRIP_LS.budget) || '' : '';
  } catch {
    budget = '';
  }
  let notes = [];
  try {
    const n = typeof window !== 'undefined' ? localStorage.getItem(TRIP_LS.notes) : null;
    if (n) {
      notes = JSON.parse(n);
      if (!Array.isArray(notes)) notes = [];
    }
  } catch {
    notes = [];
  }
  return { locations, startDate, endDate, travelers, budget, notes };
}

function readNotesFromStorage() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TRIP_LS.notes);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === 'string');
    }
    const old = localStorage.getItem(NOTES_LEGACY_KEY);
    if (old) {
      const parsed = JSON.parse(old);
      if (Array.isArray(parsed)) {
        const arr = parsed.filter((x) => typeof x === 'string');
        localStorage.setItem(TRIP_LS.notes, JSON.stringify(arr));
        return arr;
      }
    }
  } catch {
    /* ignore */
  }
  return [];
}

const INITIAL_TRIP_META = {
  destination: '',
  nights: 0,
  month: '',
  datesChipText: '',
  travelers: null,
  paxChipText: '',
  budget: '',
  travelType: '',
};

const CHIP_IDS = ['dest', 'dates', 'pax', 'budget'];

/** Claude stage → özet chip vurgusu */
const STAGE_TO_CHIP = {
  purpose: 'dest',
  accommodation: 'dest',
  transport: 'dates',
  transfer: 'dates',
  activities: 'pax',
  extras: 'budget',
};

function chipLabel(id, meta) {
  if (id === 'dest') return meta.destination || 'Destinasyon';
  if (id === 'dates') {
    if (meta.datesChipText) return meta.datesChipText;
    if (meta.nights && meta.month) return `${meta.nights} gece ${meta.month}`;
    return 'Tarih';
  }
  if (id === 'pax') {
    if (meta.paxChipText) return meta.paxChipText;
    return 'Kişi sayısı';
  }
  if (id === 'budget') return meta.budget || 'Bütçe';
  return '';
}

/** Trip chip satırında gösterim: her kelimenin ilk harfi (tr-TR, i→İ) */
function capitalizeTurkishWord(word) {
  if (!word) return word;
  if (/^\d+$/.test(word)) return word;
  const m = word.match(/^(\d+)([a-zA-ZğüşöçıİĞÜŞÖÇı].*)$/u);
  if (m) {
    return m[1] + capitalizeTurkishWord(m[2]);
  }
  if (!/[a-zA-ZğüşöçıİĞÜŞÖÇı]/u.test(word)) return word;
  return (
    word.charAt(0).toLocaleUpperCase('tr-TR') +
    word.slice(1).toLocaleLowerCase('tr-TR')
  );
}

function formatChipText(input) {
  if (input == null || input === '') return input;
  const str = String(input);
  return str
    .split(/(\s*·\s*)/)
    .map((segment) => {
      if (/^\s*·\s*$/.test(segment)) return segment;
      return segment
        .split(/\s+/)
        .filter(Boolean)
        .map(capitalizeTurkishWord)
        .join(' ');
    })
    .join('');
}

const LANGUAGES = [
  { code: 'TR', label: 'Türkçe' },
  { code: 'EN', label: 'İngilizce' },
  { code: 'DE', label: 'Almanca' },
  { code: 'FR', label: 'Fransızca' },
  { code: 'ES', label: 'İspanyolca' },
  { code: 'AR', label: 'العربية' },
  { code: 'RU', label: 'Русский' },
  { code: 'ZH', label: '中文' },
  { code: 'JA', label: '日本語' },
  { code: 'PT', label: 'Portekizce' },
  { code: 'IT', label: 'İtalyanca' },
  { code: 'KO', label: '한국어' },
];

const CURRENCIES = [
  { code: 'TRY', symbol: '₺', label: 'Türk Lirası' },
  { code: 'USD', symbol: '$', label: 'ABD Doları' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'İngiliz Sterlini' },
  { code: 'JPY', symbol: '¥', label: 'Japon Yeni' },
  { code: 'AED', symbol: 'د.إ', label: 'BAE Dirhemi' },
  { code: 'SAR', symbol: '﷼', label: 'Suudi Riyali' },
  { code: 'RUB', symbol: '₽', label: 'Rus Rublesi' },
  { code: 'CNY', symbol: '¥', label: 'Çin Yuanı' },
  { code: 'CHF', symbol: 'Fr', label: 'İsviçre Frangı' },
];

export default function Header({
  tripMeta: controlledTripMeta,
  onTripMetaChange,
  assistantSignal,
  planName,
  activePlanId,
  onMenuClick,
  onActivateStoredTrip,
}) {

  const [lang, setLang]           = useState('TR');
  const [currency, setCurrency]   = useState('TRY');
  const [loginHov, setLoginHov]   = useState(false);
  const [planHov, setPlanHov]     = useState(false);
  const [dropOpen, setDropOpen]   = useState(false);
  const [openModal, setOpenModal] = useState(null);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [notes, setNotes] = useState([]);
  const [input, setInput] = useState('');
  const [notesHydrated, setNotesHydrated] = useState(false);
  const [localTripMeta, setLocalTripMeta] = useState(INITIAL_TRIP_META);
  const [stageChipId, setStageChipId] = useState(null);
  const [planCreateOk, setPlanCreateOk] = useState(false);
  const [tripsTick, setTripsTick] = useState(0);
  const lastAssistantTRef = useRef(null);

  const storedTrips = useMemo(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(LS_TRIPS_KEY);
      const p = raw ? JSON.parse(raw) : [];
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }, [tripsTick]);

  useEffect(() => {
    function bump() {
      setTripsTick((t) => t + 1);
    }
    window.addEventListener('tripsUpdated', bump);
    return () => window.removeEventListener('tripsUpdated', bump);
  }, []);

  useEffect(() => {
    setNotes(readNotesFromStorage());
    setNotesHydrated(true);
  }, []);

  useEffect(() => {
    if (!notesHydrated) return;
    try {
      localStorage.setItem(TRIP_LS.notes, JSON.stringify(notes));
      notifyTripStorage();
    } catch {
      /* ignore */
    }
  }, [notes, notesHydrated]);

  const addNote = () => {
    if (input.trim()) {
      setNotes((prev) => [...prev, input.trim()]);
      setInput('');
    }
  };

  const removeNote = (i) => {
    setNotes((prev) => prev.filter((_, idx) => idx !== i));
  };

  const isControlled = controlledTripMeta !== undefined;
  const tripMeta = isControlled ? controlledTripMeta : localTripMeta;

  const [lsTick, setLsTick] = useState(0);
  useEffect(() => {
    const bump = () => setLsTick((t) => t + 1);
    window.addEventListener('trip-local-storage', bump);
    return () => window.removeEventListener('trip-local-storage', bump);
  }, []);

  const fromLs = useMemo(() => readTripMetaSnapshot(), [lsTick]);
  const tripMetaForChips = useMemo(
    () => mergeTripMetaForChips(tripMeta, fromLs),
    [tripMeta, fromLs]
  );

  const applyTripMeta = useCallback(
    (update) => {
      if (isControlled) {
        onTripMetaChange?.((prev) => {
          const p = prev ?? INITIAL_TRIP_META;
          return typeof update === 'function' ? update(p) : { ...p, ...update };
        });
      } else {
        setLocalTripMeta((prev) =>
          typeof update === 'function' ? update(prev) : { ...prev, ...update }
        );
      }
    },
    [isControlled, onTripMetaChange]
  );

  useEffect(() => {
    if (!assistantSignal || assistantSignal._t == null) return;
    if (lastAssistantTRef.current === assistantSignal._t) return;
    lastAssistantTRef.current = assistantSignal._t;
    const { stage, budgetUpdate, listings, travelType } = assistantSignal;
    if (stage && STAGE_TO_CHIP[stage]) setStageChipId(STAGE_TO_CHIP[stage]);
    applyTripMeta((prev) => {
      const next = { ...prev };
      if (travelType) next.travelType = travelType;
      const acc = Number(budgetUpdate?.accommodation) || 0;
      if (acc > 0 && Array.isArray(listings)) {
        const hotel = listings.find((l) => {
          const t = String(l?.type || '').toLowerCase();
          return t === 'hotel' || t === 'villa' || t === 'clinic' || t === 'accommodation';
        });
        if (hotel?.location) {
          next.destination = String(hotel.location).split(/[,·\-]/)[0].trim();
        }
      }
      const bu = budgetUpdate || {};
      const totalUsd = Object.values(bu).reduce((a, b) => a + Number(b || 0), 0);
      if (totalUsd > 0 && !String(prev.budget || '').trim()) {
        if (totalUsd >= 8000) next.budget = 'Lüks';
        else if (totalUsd >= 4000) next.budget = 'Konforlu';
        else if (totalUsd >= 1500) next.budget = 'Dengeli';
        else next.budget = 'Ekonomik';
      }
      return next;
    });
  }, [assistantSignal, applyTripMeta]);

  const displayName = planName || 'Seyahat Planınız';

  function handlePlanCreateFromChips() {
    const { locations, startDate, endDate, travelers, budget, notes } =
      readLocationsTravelersBudgetNotes();
    const cityPart = locations
      .map((l) => String(l?.city ?? l?.name ?? '').trim())
      .filter(Boolean);
    const destStr = cityPart.join(' · ');
    const newTrip = {
      id: Date.now(),
      name:
        cityPart.length > 0
          ? `${cityPart.join(' · ')} Gezisi`
          : 'Yeni Seyahat Planı',
      destination: cityPart.join(' · '),
      startDate: startDate?.toISOString?.() ?? undefined,
      endDate: endDate?.toISOString?.() ?? undefined,
      travelers,
      budget,
      notes,
      createdAt: new Date().toISOString(),
      imageUrl: '',
    };
    try {
      const trips = JSON.parse(localStorage.getItem(LS_TRIPS_KEY) || '[]');
      const list = Array.isArray(trips) ? trips : [];
      list.unshift(newTrip);
      localStorage.setItem(LS_TRIPS_KEY, JSON.stringify(list));
      window.dispatchEvent(new Event('tripsUpdated'));
      setTripsTick((t) => t + 1);
    } catch {
      /* ignore */
    }
    if (destStr && typeof window !== 'undefined') {
      const q = encodeURIComponent(`${destStr.split(' · ')[0]} Turkey travel`);
      fetch(`/api/image?query=${q}&type=tour`)
        .then((r) => r.json())
        .then((data) => {
          const url = data?.url;
          if (!url || typeof url !== 'string') return;
          try {
            const raw = localStorage.getItem(LS_TRIPS_KEY);
            const arr = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(arr)) return;
            const idx = arr.findIndex((x) => x.id === newTrip.id);
            if (idx >= 0) {
              arr[idx] = { ...arr[idx], imageUrl: url };
              localStorage.setItem(LS_TRIPS_KEY, JSON.stringify(arr));
              window.dispatchEvent(new Event('tripsUpdated'));
              setTripsTick((t) => t + 1);
            }
          } catch {
            /* ignore */
          }
        })
        .catch(() => {});
    }
    setPlanCreateOk(true);
    window.setTimeout(() => setPlanCreateOk(false), 2000);
  }

  function handleChipModalSave(data) {
    const id = openModal?.id;
    if (id === 'dest') {
      const names = (data.locs || [])
        .map((l) => String(l?.name ?? '').trim())
        .filter(Boolean);
      applyTripMeta({
        destination: names.length ? names.join(' · ') : '',
      });
    } else if (id === 'dates') {
      applyTripMeta({
        nights: data.nights ?? 0,
        month: data.month ?? '',
        datesChipText: data.datesChipText ?? '',
      });
    } else if (id === 'pax') {
      const tr = data.travelers || {};
      const adults = Number(tr.adults) || 0;
      const children = Number(tr.children) || 0;
      const seniors = Number(tr.seniors) || 0;
      const total = adults + children + seniors;
      applyTripMeta({
        travelers: Math.max(1, total || 1),
        paxChipText: data.paxChipText || '',
      });
    } else if (id === 'budget') {
      applyTripMeta({ budget: data.budget ?? '' });
    }
    setOpenModal(null);
  }

  return (
    <>
    <header style={s.header}>
      {/* ── Orta: tek birleşik pill bar ── */}
      <div style={s.center}>
        <div style={s.pillBar}>
          {/* Trip name dropdown */}
          <div style={s.tripPillWrap}>
            <button
              type="button"
              style={{ ...s.tripPill, ...(dropOpen ? s.tripPillOpen : {}) }}
              onClick={() => setDropOpen((o) => !o)}
            >
              <span style={s.tripStar}>✦</span>
              <span style={s.tripName}>{displayName}</span>
              <span
                style={{
                  ...s.chevron,
                  transform: dropOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ChevronDown size={12} color="var(--muted)" strokeWidth={2} />
              </span>
            </button>

            {dropOpen && (
              <>
                <div style={s.dropOverlay} onClick={() => setDropOpen(false)} />
                <div style={s.dropdown}>
                  <div style={s.dropSectionLabel}>Aktif Plan</div>
                  <div style={{ ...s.dropItem, ...s.dropItemActive }}>
                    <span style={s.dropIcon}>✦</span>
                    <div style={s.dropItemMeta}>
                      <span style={{ ...s.dropLabel, color: 'var(--gold-deep)' }}>{displayName}</span>
                    </div>
                    <Check size={16} color="var(--gold-deep)" strokeWidth={2.5} aria-hidden />
                  </div>

                  <div style={s.dropDivider} />
                  <div style={s.dropSectionRow}>
                    <Briefcase size={12} color="var(--text3)" strokeWidth={2} aria-hidden />
                    <span style={s.dropSectionLabelInline}>Geziler</span>
                  </div>
                  {storedTrips.length === 0 ? (
                    <div style={s.dropEmptyHint}>Kayıtlı gezi yok</div>
                  ) : (
                    storedTrips.map((trip) => {
                      const sel = String(activePlanId) === String(trip.id);
                      return (
                        <button
                          key={trip.id}
                          type="button"
                          style={{
                            ...s.dropTripBtn,
                            ...(sel ? s.dropItemActive : {}),
                          }}
                          onClick={() => {
                            onActivateStoredTrip?.(trip);
                            setDropOpen(false);
                          }}
                        >
                          <span style={s.dropIcon}>🧳</span>
                          <div style={s.dropItemMeta}>
                            <span style={s.dropLabel}>{trip.name}</span>
                          </div>
                          <span style={s.dropDate}>{formatTripListDate(trip)}</span>
                          {sel ? (
                            <Check size={16} color="var(--gold-deep)" strokeWidth={2.5} aria-hidden />
                          ) : null}
                        </button>
                      );
                    })
                  )}

                  <div style={s.dropDivider} />
                  <button
                    type="button"
                    style={s.dropNew}
                    onClick={() => {
                      setDropOpen(false);
                      if (typeof window !== 'undefined') window.location.href = '/trips';
                    }}
                  >
                    <Plus size={16} color="var(--gold-deep)" strokeWidth={2.2} />
                    Yeni Gezi Oluştur
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Separator */}
          <span style={s.barSep} />

          {/* Trip summary chips — referans: Interior · 5 days in Jul · … */}
          {CHIP_IDS.map((chipId, i) => {
            const label = formatChipText(chipLabel(chipId, tripMetaForChips));
            const modalOpen = openModal?.id === chipId;
            const stageOn = stageChipId === chipId;
            const highlighted = modalOpen || stageOn;
            return (
              <span key={chipId} style={s.chipRow}>
                {i > 0 && <span style={s.dot}>·</span>}
                <button
                  type="button"
                  style={{
                    ...s.chip,
                    ...(highlighted ? s.chipHi : s.chipLo),
                  }}
                  onClick={() => {
                    setNotesModalOpen(false);
                    setOpenModal((c) => (c?.id === chipId ? null : { id: chipId, label }));
                  }}
                >
                  {label}
                </button>
              </span>
            );
          })}
          <span style={s.chipRow}>
            <span style={s.dot}>·</span>
            <button
              type="button"
              style={{
                ...s.chip,
                ...(notesModalOpen ? s.chipHi : s.chipLo),
              }}
              onClick={() => {
                setOpenModal(null);
                setNotesModalOpen((o) => !o);
              }}
            >
              {formatChipText(
                notes.length ? `${notes.length} not` : 'Notlar'
              )}
            </button>
          </span>
        </div>
      </div>

      {/* ── Sağ: Plan Oluştur + dil + giriş ── */}
      <div style={s.right}>
        {planCreateOk ? (
          <div style={s.planToast} role="status">
            ✓ Gezi oluşturuldu
          </div>
        ) : null}
        <button
          type="button"
          style={{ ...s.planBtn, ...(planHov ? s.planBtnHov : {}) }}
          onMouseEnter={() => setPlanHov(true)}
          onMouseLeave={() => setPlanHov(false)}
          onClick={handlePlanCreateFromChips}
        >
          <Plus size={14} strokeWidth={2.5} color="white" />
          Plan Oluştur
        </button>

        <div style={s.selectWrap} title="Dil seçin">
          <select
            style={s.selectCompact}
            value={lang}
            onChange={(e) => setLang(e.target.value)}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.code} — {l.label}
              </option>
            ))}
          </select>
          <ChevronDown size={12} color="#6B6860" strokeWidth={2} style={s.selectChevron} aria-hidden />
        </div>

        <div style={s.selectWrap} title="Para birimi seçin">
          <select
            style={s.selectCompact}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} {c.code} — {c.label}
              </option>
            ))}
          </select>
          <ChevronDown size={12} color="#6B6860" strokeWidth={2} style={s.selectChevron} aria-hidden />
        </div>

        <button
          style={{ ...s.loginBtn, ...(loginHov ? s.loginBtnHov : {}) }}
          onMouseEnter={() => setLoginHov(true)}
          onMouseLeave={() => setLoginHov(false)}
        >
          Giriş Yap
        </button>
      </div>
    </header>
    {notesModalOpen && (
      <>
        <div
          style={nm.overlay}
          onClick={() => setNotesModalOpen(false)}
          aria-hidden
        />
        <div
          style={nm.panel}
          role="dialog"
          aria-modal="true"
          aria-labelledby="notes-modal-title"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            style={nm.closeTop}
            onClick={() => setNotesModalOpen(false)}
            aria-label="Kapat"
          >
            <X size={20} strokeWidth={2} color="#A8A59E" />
          </button>
          <h2 id="notes-modal-title" style={nm.title}>
            Seyahat Tercihleri
          </h2>
          <div style={nm.inputBox}>
            <textarea
              style={nm.textarea}
              placeholder="Tercih ekle..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  addNote();
                }
              }}
              rows={3}
            />
            <div style={nm.inputFooter}>
              <button
                type="button"
                style={nm.cancelBtn}
                onClick={() => setInput('')}
              >
                İptal
              </button>
              <button
                type="button"
                style={nm.addBtn}
                onClick={addNote}
                aria-label="Not ekle"
              >
                +
              </button>
            </div>
          </div>
          <div style={nm.separator} />
          <div style={nm.list}>
            {notes.map((text, idx) => (
              <div key={`${idx}-${text.slice(0, 24)}`} style={nm.noteRow}>
                <span style={nm.noteText}>{text}</span>
                <button
                  type="button"
                  style={nm.noteRemove}
                  onClick={() => removeNote(idx)}
                  aria-label="Notu sil"
                >
                  <X size={16} strokeWidth={2} color="#A8A59E" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            style={nm.doneBtn}
            onClick={() => setNotesModalOpen(false)}
          >
            Tamam
          </button>
        </div>
      </>
    )}
    {/* Viewport ortasında: header içinde backdrop-filter fixed’i kırıyor */}
    {openModal && (
      <ChipModal
        chip={openModal}
        destInitialSummary={tripMetaForChips.destination}
        onClose={() => setOpenModal(null)}
        onSave={handleChipModalSave}
        onOpenNotes={() => {
          setOpenModal(null);
          setNotesModalOpen(true);
        }}
      />
    )}
    </>
  );
}

const nm = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,.3)',
    zIndex: 999,
  },
  panel: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 480,
    maxWidth: '90vw',
    boxSizing: 'border-box',
    background: '#fff',
    borderRadius: 16,
    padding: 24,
    paddingTop: 20,
    boxShadow: '0 8px 32px rgba(0,0,0,.16)',
    zIndex: 1000,
    fontFamily: 'var(--font-sans)',
  },
  closeTop: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 10,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  title: {
    margin: 0,
    paddingRight: 40,
    paddingBottom: 16,
    fontSize: 18,
    fontWeight: 800,
    color: '#1A1916',
    letterSpacing: '-0.02em',
  },
  inputBox: {
    background: '#F4F3EF',
    borderRadius: 12,
    padding: 12,
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    boxSizing: 'border-box',
    minHeight: 72,
    border: 'none',
    background: 'transparent',
    resize: 'vertical',
    fontSize: 14,
    fontFamily: 'var(--font-sans)',
    color: '#1A1916',
    outline: 'none',
    lineHeight: 1.45,
  },
  inputFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  cancelBtn: {
    border: 'none',
    background: 'transparent',
    fontSize: 13,
    color: '#A8A59E',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    padding: '4px 0',
    marginRight: 8,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    border: 'none',
    background: '#1A1916',
    color: '#fff',
    fontSize: 20,
    lineHeight: 1,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    fontWeight: 400,
  },
  separator: {
    border: 'none',
    borderTop: '1px solid rgba(0,0,0,.06)',
    margin: '16px 0 0',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 'min(280px, 40vh)',
    overflowY: 'auto',
    marginBottom: 16,
  },
  noteRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderBottom: '1px solid rgba(0,0,0,.06)',
    padding: '14px 0',
    minWidth: 0,
  },
  noteText: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    color: '#1A1916',
    lineHeight: 1.45,
    wordBreak: 'break-word',
  },
  noteRemove: {
    flexShrink: 0,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    padding: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  doneBtn: {
    width: '100%',
    height: 48,
    borderRadius: 999,
    border: 'none',
    background: '#1A1916',
    color: '#fff',
    fontFamily: 'var(--font-sans)',
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
  },
};


const s = {
  header: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    alignItems: 'center',
    gap: '12px',
    padding: '0 18px',
    height: '56px',
    background: 'rgba(250,250,248,.95)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(0,0,0,.06)',
    position: 'sticky',
    top: 0,
    zIndex: 30,
    flexShrink: 0,
  },

  /* Left */
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  hamburger: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    border: '1px solid rgba(0,0,0,.07)',
    background: 'rgba(0,0,0,.03)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--text1)',
    flexShrink: 0,
    transition: 'background .15s',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  brandText: {
    fontFamily: 'var(--font-sans)',
    fontWeight: 800,
    fontSize: '18px',
    letterSpacing: '-0.03em',
    color: 'var(--text1)',
    whiteSpace: 'nowrap',
  },

  /* Center */
  center: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
    overflow: 'hidden',
  },

  /* Unified pill bar */
  pillBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '0',
    padding: '4px 6px 4px 4px',
    border: '1px solid rgba(0,0,0,.07)',
    borderRadius: '999px',
    background: 'rgba(255,255,255,.82)',
    boxShadow: '0 2px 10px rgba(0,0,0,.05)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    maxWidth: '100%',
  },
  barSep: {
    width: '1px',
    height: '16px',
    background: 'rgba(0,0,0,.10)',
    margin: '0 8px',
    flexShrink: 0,
  },
  chipRow: {
    display: 'inline-flex',
    alignItems: 'center',
  },
  dot: {
    color: 'rgba(0,0,0,.25)',
    fontSize: '14px',
    padding: '0 2px',
    userSelect: 'none',
  },

  /* Trip pill — now inside pillBar, no outer border */
  tripPillWrap: {
    position: 'relative',
    flexShrink: 0,
    zIndex: 1001,
  },
  tripPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    padding: '5px 10px',
    borderRadius: '999px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--text1)',
    whiteSpace: 'nowrap',
    transition: 'background .15s',
  },
  tripPillOpen: {
    background: 'rgba(199,154,70,.10)',
  },
  tripStar: {
    color: 'var(--gold)',
    fontSize: '12px',
  },
  tripName: { fontSize: '13px' },
  chevron: {
    width: '16px',
    height: '16px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transformOrigin: '50% 50%',
    color: 'var(--muted)',
    transition: 'transform .2s ease',
    flexShrink: 0,
  },
  chevronGlyph: {
    fontSize: '14px',
    lineHeight: 1,
    display: 'block',
    transform: 'translateY(-0.5px)',
  },

  /* Dropdown */
  dropOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 999,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: '8px',
    minWidth: '280px',
    background: '#FFFFFF',
    border: '1px solid rgba(0,0,0,.08)',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,.12)',
    padding: '8px',
    zIndex: 1000,
    boxSizing: 'border-box',
  },
  dropSectionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px 6px',
  },
  dropSectionLabelInline: {
    fontFamily: 'var(--font-sans)',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '.06em',
    textTransform: 'uppercase',
    color: 'var(--text3)',
  },
  dropEmptyHint: {
    fontFamily: 'var(--font-sans)',
    fontSize: '12px',
    color: 'var(--text3)',
    padding: '8px 10px 10px',
  },
  dropTripBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 10px',
    borderRadius: '12px',
    border: '1px solid transparent',
    background: 'transparent',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background .15s',
    boxSizing: 'border-box',
  },
  dropSectionLabel: {
    fontFamily: 'var(--font-sans)',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '.06em',
    textTransform: 'uppercase',
    color: 'var(--text3)',
    padding: '4px 10px 2px',
  },
  dropItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 10px',
    borderRadius: '12px',
    background: 'rgba(199,154,70,.08)',
    border: '1px solid rgba(199,154,70,.18)',
  },
  dropItemBtn: {
    width: '100%',
    cursor: 'pointer',
    background: 'transparent',
    border: '1px solid transparent',
    textAlign: 'left',
    transition: 'background .15s',
  },
  dropItemActive: {
    background: 'rgba(199,154,70,.08)',
    border: '1px solid rgba(199,154,70,.18)',
  },
  dropItemMeta: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
    minWidth: 0,
  },
  dropIcon: {
    fontSize: '14px',
    color: 'var(--gold)',
    flexShrink: 0,
  },
  dropLabel: {
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    fontSize: '13px',
    color: 'var(--text1)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '180px',
  },
  dropSub: {
    fontFamily: 'var(--font-sans)',
    fontSize: '11px',
    color: 'var(--text3)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  dropDate: {
    fontFamily: 'var(--font-sans)',
    fontSize: '11px',
    color: 'var(--text3)',
    flexShrink: 0,
  },
  dropActive: {
    fontFamily: 'var(--font-sans)',
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--green)',
    background: 'rgba(47,143,107,.10)',
    border: '1px solid rgba(47,143,107,.2)',
    borderRadius: '999px',
    padding: '2px 8px',
    flexShrink: 0,
  },
  dropDivider: {
    height: '1px',
    background: 'rgba(0,0,0,.05)',
    margin: '6px 2px',
  },
  dropNew: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px 10px',
    borderRadius: '12px',
    border: '1px solid rgba(199,154,70,.2)',
    background: 'rgba(199,154,70,.06)',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    fontSize: '13px',
    color: 'var(--gold-deep)',
    transition: 'background .15s',
  },

  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '5px 10px',
    borderRadius: '999px',
    boxSizing: 'border-box',
    background: 'transparent',
    color: 'var(--text1)',
    fontSize: '13px',
    fontWeight: 600,
    fontFamily: 'var(--font-sans)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'border-color .15s, color .15s',
  },
  chipLo: {
    border: '1.5px solid rgba(0,0,0,.12)',
    color: 'var(--text2)',
    fontWeight: 500,
  },
  chipHi: {
    border: '1.5px solid #1A1916',
    color: 'var(--text1)',
    fontWeight: 600,
  },

  /* Right */
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
    position: 'relative',
  },
  planToast: {
    position: 'fixed',
    top: '62px',
    right: '18px',
    zIndex: 2000,
    background: '#2f8f6b',
    color: '#fff',
    padding: '8px 14px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 700,
    fontFamily: 'var(--font-sans)',
    boxShadow: '0 8px 24px rgba(47,143,107,.35)',
    transition: 'opacity 0.2s ease, transform 0.2s ease',
  },
  selectWrap: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  selectCompact: {
    height: '30px',
    padding: '4px 8px',
    paddingRight: '26px',
    fontSize: '12px',
    border: '1px solid rgba(0,0,0,.08)',
    borderRadius: '8px',
    background: '#fff',
    color: 'var(--text1)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    outline: 'none',
    cursor: 'pointer',
    boxSizing: 'border-box',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
  },
  selectChevron: {
    position: 'absolute',
    right: '6px',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
  },
  planBtn: {
    height: '36px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '0 16px',
    borderRadius: '999px',
    background: 'linear-gradient(180deg,#d3ab5f,#c08d36)',
    color: 'white',
    border: '1px solid rgba(167,125,50,.28)',
    boxShadow: '0 6px 14px rgba(199,154,70,.28)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 700,
    fontSize: '13px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'opacity .15s',
  },
  planBtnHov: { opacity: 0.88 },
  planBtnStar: {
    fontSize: '12px',
    opacity: 0.9,
  },
  loginBtn: {
    height: '34px',
    borderRadius: '10px',
    border: '1px solid rgba(0,0,0,.12)',
    background: 'transparent',
    color: 'var(--text1)',
    padding: '0 14px',
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    fontSize: '12px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background .15s',
  },
  loginBtnHov: {
    background: 'rgba(0,0,0,.04)',
  },
};
