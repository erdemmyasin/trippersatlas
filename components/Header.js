'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { X, ChevronDown, Briefcase, Plus, Check, Sparkles, ChevronLeft, MessageCircle } from 'lucide-react';
import ChipModal from './ChipModal';
import TripFilterChipBar, { chipLabel, formatChipText, CHIP_IDS } from '@/components/TripFilterChipBar';
import NavLocaleCurrency from '@/components/NavLocaleCurrency';
import { useLocaleCurrency } from '@/components/LocaleCurrencyContext';
import {
  mergeTripMetaForChips,
  readTripMetaSnapshot,
  TRIP_LS,
  notifyTripStorage,
} from '@/lib/tripChipStorage';
import { tripCardImageSearchQuery } from '@/lib/taRegion';
import { useNewTrip } from '@/components/NewTripProvider';
import { loadMergedTrips, findMergedTripById } from '@/lib/tripMerge';
import { listChatsForTrip } from '@/lib/chatStore';

const NOTES_LEGACY_KEY = 'ta_header_trip_notes';
const LS_TRIPS_KEY = 'trips';

function formatTripListDate(trip, locale = 'tr-TR') {
  try {
    if (trip?.startDate && trip?.endDate) {
      const a = new Date(trip.startDate);
      const b = new Date(trip.endDate);
      if (!Number.isNaN(a.getTime()) && !Number.isNaN(b.getTime())) {
        return `${a.toLocaleDateString(locale, { day: 'numeric', month: 'short' })} – ${b.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}`;
      }
    }
    if (trip?.createdAt) {
      const c = new Date(trip.createdAt);
      if (!Number.isNaN(c.getTime())) {
        return c.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
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

function formatChatRowDate(meta, locale = 'tr-TR') {
  try {
    const d = new Date(meta?.updatedAt || meta?.createdAt);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
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

/** Claude stage → özet chip vurgusu */
const STAGE_TO_CHIP = {
  purpose: 'dest',
  accommodation: 'dest',
  transport: 'dates',
  transfer: 'dates',
  activities: 'pax',
  extras: 'budget',
};

export default function Header({
  planPills: _planPills,
  tripMeta: controlledTripMeta,
  onTripMetaChange,
  assistantSignal,
  planName,
  savedPlans = [],
  activePlanId,
  onMenuClick,
  onNewPlan,
  onSwitchPlan,
  onActivateStoredTrip,
  /** /chat minimal menü: gezi seçildiğinde sohbet kalır, plan verisi yüklenir */
  onPickTripFromPlanMenu = null,
  /** Sol panel içeriği: plan pill açılır menüde gösterilir */
  planWorkspaceSlot = null,
  onPlanNameChange,
  /** /chat: chip satırı sonunda Atlas’a Sor (sohbet) */
  atlasAskMode = false,
  onAtlasAskFromFilters,
  /**
   * /chat sohbet: Plan adı + LeftPanel (modüller, bütçe, plan özeti); bu blokta Geziler / Yeni gezi yok.
   */
  planDropdownMinimal = false,
  /** Açık sohbet bir geziye bağlıysa menü açılışında gezi sohbetleri paneli */
  linkedTripIdForPlanMenu = null,
  /** Gezi sohbetleri listesinde seçili sohbet (tik) */
  activeChatIdForPlanMenu = null,
  /** Açık sohbetin gezi bağlantısı (Sohbete Devam eşlemesi) */
  activeChatTripIdForPlanMenu = null,
}) {
  void _planPills;
  void savedPlans;

  const router = useRouter();
  const { locale } = useLocaleCurrency();
  const { openNewTrip } = useNewTrip();
  const [loginHov, setLoginHov]   = useState(false);
  const [dropOpen, setDropOpen]   = useState(false);
  const [openModal, setOpenModal] = useState(null);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [notes, setNotes] = useState([]);
  const [input, setInput] = useState('');
  const [notesHydrated, setNotesHydrated] = useState(false);
  const [localTripMeta, setLocalTripMeta] = useState(INITIAL_TRIP_META);
  const [stageChipId, setStageChipId] = useState(null);
  const [planCreateOk, setPlanCreateOk] = useState(false);
  const [trips, setTrips] = useState([]);
  const [hoverTripId, setHoverTripId] = useState(null);
  /** planDropdownMinimal: trips | tripChats | modules */
  const [planMinimalPanel, setPlanMinimalPanel] = useState('trips');
  const [tripChatsFocusTrip, setTripChatsFocusTrip] = useState(null);
  /** tripChats listesinden seçilen sohbet: modüller panelinde "Sohbete Devam Et" */
  const [modulesContinueChatId, setModulesContinueChatId] = useState(null);
  const [chatListTick, setChatListTick] = useState(0);
  const lastAssistantTRef = useRef(null);
  const tripPillWrapRef = useRef(null);
  const dropWasOpenRef = useRef(false);
  useEffect(() => {
    function bump() {
      setChatListTick((x) => x + 1);
    }
    window.addEventListener('chatsUpdated', bump);
    return () => window.removeEventListener('chatsUpdated', bump);
  }, []);

  useEffect(() => {
    if (!dropOpen) {
      setPlanMinimalPanel('trips');
      setTripChatsFocusTrip(null);
      setModulesContinueChatId(null);
    }
  }, [dropOpen]);

  useEffect(() => {
    if (!dropOpen || !planDropdownMinimal) {
      dropWasOpenRef.current = dropOpen;
      return;
    }
    if (!dropWasOpenRef.current && linkedTripIdForPlanMenu) {
      const trip = findMergedTripById(linkedTripIdForPlanMenu);
      if (trip) {
        if (typeof onPickTripFromPlanMenu === 'function') {
          onPickTripFromPlanMenu(trip);
        }
        setTripChatsFocusTrip(trip);
        setModulesContinueChatId(
          activeChatIdForPlanMenu != null ? String(activeChatIdForPlanMenu) : null
        );
        setPlanMinimalPanel('modules');
      }
    }
    dropWasOpenRef.current = dropOpen;
  }, [dropOpen, planDropdownMinimal, linkedTripIdForPlanMenu, activeChatIdForPlanMenu, onPickTripFromPlanMenu]);

  const tripChatsList = useMemo(() => {
    if (!tripChatsFocusTrip?.id) return [];
    return listChatsForTrip(String(tripChatsFocusTrip.id));
  }, [tripChatsFocusTrip, chatListTick]);

  const modulesBackTargetTrip = useMemo(
    () =>
      tripChatsFocusTrip ||
      (String(activePlanId) !== 'active' ? findMergedTripById(activePlanId) : null),
    [tripChatsFocusTrip, activePlanId]
  );

  const tripContextIdForModules = useMemo(() => {
    if (tripChatsFocusTrip?.id != null) return String(tripChatsFocusTrip.id);
    if (linkedTripIdForPlanMenu) return String(linkedTripIdForPlanMenu);
    if (String(activePlanId) !== 'active') return String(activePlanId);
    return null;
  }, [tripChatsFocusTrip, linkedTripIdForPlanMenu, activePlanId]);

  const effectiveContinueChatId = useMemo(() => {
    if (modulesContinueChatId) return String(modulesContinueChatId);
    if (
      activeChatIdForPlanMenu &&
      activeChatTripIdForPlanMenu &&
      tripContextIdForModules &&
      String(activeChatTripIdForPlanMenu) === String(tripContextIdForModules)
    ) {
      return String(activeChatIdForPlanMenu);
    }
    return null;
  }, [
    modulesContinueChatId,
    activeChatIdForPlanMenu,
    activeChatTripIdForPlanMenu,
    tripContextIdForModules,
  ]);

  useEffect(() => {
    if (dropOpen && planDropdownMinimal && planMinimalPanel === 'tripChats' && !tripChatsFocusTrip) {
      setPlanMinimalPanel('trips');
    }
  }, [dropOpen, planDropdownMinimal, planMinimalPanel, tripChatsFocusTrip]);

  useEffect(() => {
    if (!dropOpen) return;
    function onPointerDownOutside(ev) {
      const root = tripPillWrapRef.current;
      if (!root) return;
      if (!root.contains(ev.target)) setDropOpen(false);
    }
    document.addEventListener('mousedown', onPointerDownOutside, true);
    document.addEventListener('touchstart', onPointerDownOutside, { capture: true, passive: true });
    return () => {
      document.removeEventListener('mousedown', onPointerDownOutside, true);
      document.removeEventListener('touchstart', onPointerDownOutside, true);
    };
  }, [dropOpen]);

  const loadTrips = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      setTrips(loadMergedTrips());
    } catch {
      setTrips([]);
    }
  }, []);

  useEffect(() => {
    loadTrips();
    window.addEventListener('tripsUpdated', loadTrips);
    window.addEventListener('storage', loadTrips);
    return () => {
      window.removeEventListener('tripsUpdated', loadTrips);
      window.removeEventListener('storage', loadTrips);
    };
  }, [loadTrips]);

  useEffect(() => {
    if (dropOpen) loadTrips();
  }, [dropOpen, loadTrips]);

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
    function bump() {
      setLsTick((t) => t + 1);
    }
    window.addEventListener('trip-local-storage', bump);
    window.addEventListener('storage', bump);
    return () => {
      window.removeEventListener('trip-local-storage', bump);
      window.removeEventListener('storage', bump);
    };
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
    } catch {
      /* ignore */
    }
    if (destStr && typeof window !== 'undefined') {
      const q = encodeURIComponent(tripCardImageSearchQuery(destStr.split(' · ')[0]));
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

  /** Sohbet sağ panelindeki "Akıllı öneri" → ilgili chip'i aç */
  useEffect(() => {
    function onOpenChip(ev) {
      const id = ev?.detail?.id;
      if (!id || !CHIP_IDS.includes(id)) return;
      const lbl = formatChipText(chipLabel(id, localTripMeta));
      setOpenModal({ id, label: lbl });
    }
    window.addEventListener('atlas-open-chip', onOpenChip);
    return () => window.removeEventListener('atlas-open-chip', onOpenChip);
  }, [localTripMeta]);

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
    <header style={{ ...s.header, ...(dropOpen ? s.headerDropOpen : {}) }}>
      <div style={s.headerLeft} aria-hidden="true" />
      {/* ── Orta: pill bar + Plan Oluştur ── */}
      <div
        style={{
          ...s.center,
          ...(dropOpen ? s.centerDropOpen : {}),
        }}
      >
        <div style={s.centerRow}>
        <div
          style={{
            ...s.pillBar,
            ...(dropOpen ? s.pillBarDropOpen : {}),
          }}
        >
          {/* Trip name dropdown */}
          <div ref={tripPillWrapRef} style={s.tripPillWrap}>
            <button
              type="button"
              style={{ ...s.tripPill, ...(dropOpen ? s.tripPillOpen : {}) }}
              onClick={() => setDropOpen((o) => !o)}
            >
              <span style={s.tripStar} aria-hidden>
                <Sparkles size={13} strokeWidth={2.2} color="var(--ta-accent-deep)" />
              </span>
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

            {dropOpen && planDropdownMinimal && planWorkspaceSlot ? (
              <>
                <div style={s.dropOverlay} onClick={() => setDropOpen(false)} />
                <div
                  style={{
                    ...s.dropdown,
                    ...s.dropdownMinimalChat,
                    ...(planMinimalPanel === 'modules' ? s.dropdownMinimalChatFlex : {}),
                  }}
                >
                  {planMinimalPanel === 'trips' ? (
                    <>
                      <div style={s.planMinimalTripsHeaderRow}>
                        <span style={s.planMinimalTripsTitle}>Gezilerim</span>
                        <button
                          type="button"
                          style={s.dropMenuCloseBtnCompact}
                          onClick={() => setDropOpen(false)}
                          aria-label="Menüyü kapat"
                        >
                          <X size={15} strokeWidth={2.2} color="var(--text3)" aria-hidden />
                        </button>
                      </div>
                      <div
                        style={s.planMinimalTripsList}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        {trips.length === 0 ? (
                          <p style={s.planMinimalTripsEmpty}>Henüz kayıtlı gezi yok.</p>
                        ) : (
                          trips.map((trip) => {
                            const sel = String(activePlanId) === String(trip.id);
                            const hovered = hoverTripId === trip.id;
                            return (
                              <button
                                key={trip.id}
                                type="button"
                                style={{
                                  ...s.dropTripRow,
                                  ...(sel ? s.dropItemActive : {}),
                                  ...(!sel && hovered ? s.dropTripRowHover : {}),
                                }}
                                onMouseEnter={() => setHoverTripId(trip.id)}
                                onMouseLeave={() => setHoverTripId(null)}
                                onClick={() => {
                                  setNotes(readNotesFromStorage());
                                  if (typeof onPickTripFromPlanMenu === 'function') {
                                    onPickTripFromPlanMenu(trip);
                                  } else {
                                    onActivateStoredTrip?.(trip);
                                  }
                                  setTripChatsFocusTrip(trip);
                                  setModulesContinueChatId(null);
                                  setPlanMinimalPanel('tripChats');
                                }}
                              >
                                <Briefcase size={16} color="var(--ta-accent-deep)" strokeWidth={2} aria-hidden />
                                <div style={s.dropTripTextCol}>
                                  <span style={s.dropTripTitle}>{trip.name}</span>
                                  <span style={s.dropTripSub}>
                                    {(trip.destination && String(trip.destination).trim()) || '—'} ·{' '}
                                    {formatTripListDate(trip, locale)}
                                  </span>
                                </div>
                                {sel ? (
                                  <Check size={16} color="var(--ta-accent-deep)" strokeWidth={2.5} aria-hidden />
                                ) : null}
                              </button>
                            );
                          })
                        )}
                      </div>
                      <div style={s.dropdownMinimalFooter}>
                        <button
                          type="button"
                          style={s.dropdownGeziBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDropOpen(false);
                            openNewTrip();
                          }}
                        >
                          <Sparkles size={14} strokeWidth={2.1} color="#fff" aria-hidden />
                          Gezi Oluştur
                        </button>
                      </div>
                    </>
                  ) : planMinimalPanel === 'tripChats' && tripChatsFocusTrip ? (
                    <>
                      <div style={s.planMinimalTripsHeaderRow}>
                        <span style={s.planMinimalTripsTitle}>Gezi sohbetleri</span>
                        <button
                          type="button"
                          style={s.dropMenuCloseBtnCompact}
                          onClick={() => setDropOpen(false)}
                          aria-label="Menüyü kapat"
                        >
                          <X size={15} strokeWidth={2.2} color="var(--text3)" aria-hidden />
                        </button>
                      </div>
                      <button
                        type="button"
                        style={s.planMinimalBackBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlanMinimalPanel('trips');
                        }}
                      >
                        <ChevronLeft size={16} strokeWidth={2.2} color="var(--ta-accent-deep)" aria-hidden />
                        Gezilerime Geri Dön
                      </button>
                      <div
                        style={s.planMinimalTripsList}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        {tripChatsList.length === 0 ? (
                          <p style={s.planMinimalTripsEmpty}>
                            Bu geziyle henüz sohbet yok. Aşağıdan yeni sohbet oluşturabilirsiniz.
                          </p>
                        ) : (
                          tripChatsList.map((c) => {
                            const sel =
                              (activeChatIdForPlanMenu != null &&
                                String(activeChatIdForPlanMenu) === String(c.id)) ||
                              String(modulesContinueChatId) === String(c.id);
                            const hovered = hoverTripId === c.id;
                            return (
                              <button
                                key={c.id}
                                type="button"
                                style={{
                                  ...s.dropTripRow,
                                  ...(sel ? s.dropItemActive : {}),
                                  ...(!sel && hovered ? s.dropTripRowHover : {}),
                                }}
                                onMouseEnter={() => setHoverTripId(c.id)}
                                onMouseLeave={() => setHoverTripId(null)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNotes(readNotesFromStorage());
                                  if (typeof onPickTripFromPlanMenu === 'function' && tripChatsFocusTrip) {
                                    onPickTripFromPlanMenu(tripChatsFocusTrip);
                                  }
                                  setModulesContinueChatId(String(c.id));
                                  setPlanMinimalPanel('modules');
                                }}
                              >
                                <MessageCircle
                                  size={16}
                                  color="var(--ta-accent-deep)"
                                  strokeWidth={2}
                                  aria-hidden
                                />
                                <div style={s.dropTripTextCol}>
                                  <span style={s.dropTripTitle}>{c.title || 'Başlıksız'}</span>
                                  <span style={s.dropTripSub}>{formatChatRowDate(c, locale)}</span>
                                </div>
                                {sel ? (
                                  <Check size={16} color="var(--ta-accent-deep)" strokeWidth={2.5} aria-hidden />
                                ) : null}
                              </button>
                            );
                          })
                        )}
                      </div>
                      <div style={s.dropdownMinimalFooter}>
                        <button
                          type="button"
                          style={s.dropdownGeziBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (typeof onPickTripFromPlanMenu === 'function' && tripChatsFocusTrip) {
                              onPickTripFromPlanMenu(tripChatsFocusTrip);
                            }
                            setModulesContinueChatId(null);
                            setDropOpen(false);
                            router.push(
                              `/chat?newChat=1&trip=${encodeURIComponent(String(tripChatsFocusTrip.id))}`
                            );
                          }}
                        >
                          <MessageCircle size={14} strokeWidth={2.1} color="#fff" aria-hidden />
                          Sohbet oluştur
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        style={s.planMinimalBackBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          const tr =
                            tripChatsFocusTrip ||
                            (String(activePlanId) !== 'active'
                              ? findMergedTripById(activePlanId)
                              : null);
                          if (tr) {
                            setTripChatsFocusTrip(tr);
                            setModulesContinueChatId(null);
                            setPlanMinimalPanel('tripChats');
                          } else {
                            setModulesContinueChatId(null);
                            setPlanMinimalPanel('trips');
                          }
                        }}
                      >
                        <ChevronLeft size={16} strokeWidth={2.2} color="var(--ta-accent-deep)" aria-hidden />
                        {modulesBackTargetTrip ? 'Gezi sohbetlerine dön' : 'Gezilerime Dön'}
                      </button>
                      <div style={s.planMinimalTopRow}>
                        {typeof onPlanNameChange === 'function' ? (
                          <div style={s.planMinimalInputWrap}>
                            <input
                              type="text"
                              key={displayName}
                              defaultValue={displayName}
                              maxLength={48}
                              aria-label="Plan adı"
                              style={s.planNameDropInputCompact}
                              onClick={(e) => e.stopPropagation()}
                              onBlur={(e) => {
                                const v = e.target.value.trim() || 'Yeni Seyahat Planı';
                                if (v !== displayName) onPlanNameChange(v);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') e.currentTarget.blur();
                              }}
                            />
                          </div>
                        ) : (
                          <div style={s.planMinimalInputWrap} aria-hidden />
                        )}
                        <button
                          type="button"
                          style={s.dropMenuCloseBtnCompact}
                          onClick={() => setDropOpen(false)}
                          aria-label="Menüyü kapat"
                        >
                          <X size={15} strokeWidth={2.2} color="var(--text3)" aria-hidden />
                        </button>
                      </div>
                      <div style={s.minimalModulesShell}>
                        <div
                          style={s.minimalModulesScroll}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          <div style={s.planSlotTripFrameInMenu}>{planWorkspaceSlot}</div>
                        </div>
                        {effectiveContinueChatId ? (
                          <div style={s.modulesStickyFooter}>
                            <button
                              type="button"
                              style={s.dropdownGeziBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                setDropOpen(false);
                                router.push(
                                  `/chat?chat=${encodeURIComponent(String(effectiveContinueChatId))}`
                                );
                                setModulesContinueChatId(null);
                              }}
                            >
                              <MessageCircle size={14} strokeWidth={2.1} color="#fff" aria-hidden />
                              Sohbete Devam Et
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : dropOpen ? (
              <>
                <div style={s.dropOverlay} onClick={() => setDropOpen(false)} />
                <div style={s.dropdown}>
                  <div style={s.dropMenuHeaderRow}>
                    <span style={s.dropMenuHeaderTitle}>Plan menüsü</span>
                    <button
                      type="button"
                      style={s.dropMenuCloseBtn}
                      onClick={() => setDropOpen(false)}
                      aria-label="Menüyü kapat"
                    >
                      <X size={16} strokeWidth={2.2} color="var(--text3)" aria-hidden />
                    </button>
                  </div>
                  <div style={s.dropSectionLabel}>Mevcut Plan</div>
                  <div style={{ ...s.dropItem, ...s.dropItemActive }}>
                    <span style={s.dropIcon} aria-hidden>
                      <Sparkles size={14} strokeWidth={2.2} color="var(--ta-accent-deep)" />
                    </span>
                    <div style={s.dropItemMeta}>
                      <span style={{ ...s.dropTripTitle, color: 'var(--ta-accent-deep)' }}>{displayName}</span>
                    </div>
                    <Check size={16} color="var(--ta-accent-deep)" strokeWidth={2.5} aria-hidden />
                  </div>

                  {trips.length > 0 ? (
                    <>
                      <div style={s.dropDivider} />
                      <div style={s.dropSectionLabel}>Geziler</div>
                      {trips.map((trip) => {
                        const sel = String(activePlanId) === String(trip.id);
                        const hovered = hoverTripId === trip.id;
                        return (
                          <button
                            key={trip.id}
                            type="button"
                            style={{
                              ...s.dropTripRow,
                              ...(sel ? s.dropItemActive : {}),
                              ...(!sel && hovered ? s.dropTripRowHover : {}),
                            }}
                            onMouseEnter={() => setHoverTripId(trip.id)}
                            onMouseLeave={() => setHoverTripId(null)}
                            onClick={() => {
                              onActivateStoredTrip?.(trip);
                              setNotes(readNotesFromStorage());
                              setDropOpen(false);
                              if (typeof window !== 'undefined') {
                                window.location.href = `/trips/${encodeURIComponent(String(trip.id))}`;
                              }
                            }}
                          >
                            <Briefcase size={16} color="var(--ta-accent-deep)" strokeWidth={2} aria-hidden />
                            <div style={s.dropTripTextCol}>
                              <span style={s.dropTripTitle}>{trip.name}</span>
                              <span style={s.dropTripSub}>
                                {(trip.destination && String(trip.destination).trim()) || '—'} ·{' '}
                                {formatTripListDate(trip, locale)}
                              </span>
                            </div>
                            {sel ? (
                              <Check size={16} color="var(--ta-accent-deep)" strokeWidth={2.5} aria-hidden />
                            ) : null}
                          </button>
                        );
                      })}
                    </>
                  ) : null}

                  {planWorkspaceSlot ? (
                    <>
                      <div style={s.dropDivider} />
                      <div style={s.dropSectionLabel}>Plan adı</div>
                      {typeof onPlanNameChange === 'function' ? (
                        <div style={{ padding: '2px 8px 8px' }}>
                          <input
                            type="text"
                            key={displayName}
                            defaultValue={displayName}
                            maxLength={48}
                            aria-label="Plan adı"
                            style={s.planNameDropInput}
                            onClick={(e) => e.stopPropagation()}
                            onBlur={(e) => {
                              const v = e.target.value.trim() || 'Yeni Seyahat Planı';
                              if (v !== displayName) onPlanNameChange(v);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') e.currentTarget.blur();
                            }}
                          />
                        </div>
                      ) : null}
                      <div
                        style={s.planWorkspaceSlotWrap}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        {planWorkspaceSlot}
                      </div>
                    </>
                  ) : null}

                  <div style={s.dropDivider} />
                  <button
                    type="button"
                    style={s.dropNew}
                    onClick={() => {
                      setDropOpen(false);
                      openNewTrip();
                    }}
                  >
                    <Plus size={16} color="var(--ta-accent-deep)" strokeWidth={2.2} />
                    Yeni Gezi Oluştur
                  </button>
                </div>
              </>
            ) : null}
          </div>

          {/* Separator */}
          <span style={s.barSep} />

          {/* Trip summary chips — referans: Interior · 5 days in Jul · … */}
          <TripFilterChipBar
            variant="header"
            tripMetaForChips={tripMetaForChips}
            openModal={openModal}
            setOpenModal={setOpenModal}
            notesModalOpen={notesModalOpen}
            setNotesModalOpen={setNotesModalOpen}
            notes={notes}
            stageChipId={stageChipId}
          />
        </div>
        <button
          type="button"
          style={s.planCreateChipBtn}
          onClick={() => {
            if (atlasAskMode) {
              onAtlasAskFromFilters?.(
                'Üstteki seyahat filtrelerime göre özet ve önerilerini güncelle.'
              );
              return;
            }
            handlePlanCreateFromChips();
          }}
        >
          {atlasAskMode ? (
            <Sparkles size={14} strokeWidth={2.5} color="#FFFFFF" aria-hidden />
          ) : (
            <Plus size={14} strokeWidth={2.5} color="#FFFFFF" aria-hidden />
          )}
          {atlasAskMode ? "Atlas'a Sor" : 'Plan Oluştur'}
        </button>
        </div>
      </div>

      {/* ── Sağ: dil + para + giriş ── */}
      <div style={s.right}>
        {planCreateOk ? (
          <div style={s.planToast} role="status">
            <Check size={14} strokeWidth={2.5} aria-hidden style={{ flexShrink: 0 }} />
            Gezi oluşturuldu
          </div>
        ) : null}
        <NavLocaleCurrency />

        <Link
          href="/auth/giris"
          style={{ ...s.loginBtn, ...(loginHov ? s.loginBtnHov : {}), textDecoration: 'none' }}
          onMouseEnter={() => setLoginHov(true)}
          onMouseLeave={() => setLoginHov(false)}
        >
          Giriş Yap
        </Link>
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
            <X size={20} strokeWidth={2} color="var(--ta-ink-subtle)" />
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
                  <X size={16} strokeWidth={2} color="var(--ta-ink-subtle)" />
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
    color: 'var(--ta-ink)',
    letterSpacing: '-0.02em',
  },
  inputBox: {
    background: 'var(--ta-muted-bg)',
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
    color: 'var(--ta-ink)',
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
    color: 'var(--ta-ink-subtle)',
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
    background: 'var(--ta-ink)',
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
    color: 'var(--ta-ink)',
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
    background: 'var(--ta-ink)',
    color: '#fff',
    fontFamily: 'var(--font-sans)',
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
  },
};

function HamburgerIcon() {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
      <rect y="0"  width="18" height="2" rx="1" fill="currentColor" />
      <rect y="6"  width="14" height="2" rx="1" fill="currentColor" />
      <rect y="12" width="18" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}

const s = {
  header: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto',
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
  headerDropOpen: {
    zIndex: 2000,
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

  headerLeft: {
    minWidth: 0,
    flexShrink: 0,
  },

  /* Center */
  center: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
    overflow: 'hidden',
  },
  centerDropOpen: {
    overflow: 'visible',
  },
  centerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    minWidth: 0,
    maxWidth: '100%',
  },
  planCreateChipBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexShrink: 0,
    padding: '6px 14px',
    fontSize: '13px',
    fontWeight: 600,
    fontFamily: 'var(--font-sans)',
    border: '1px solid rgba(0,0,0,.15)',
    borderRadius: '999px',
    background: 'var(--ta-ink)',
    color: '#FFFFFF',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
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
  pillBarDropOpen: {
    overflow: 'visible',
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
    background: 'rgba(74,98,120,.10)',
  },
  tripStar: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
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
    cursor: 'pointer',
    background: 'rgba(15, 23, 32, 0.12)',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: '8px',
    minWidth: '280px',
    maxWidth: 'min(400px, calc(100vw - 24px))',
    maxHeight: 'min(88vh, 820px)',
    overflowY: 'auto',
    overflowX: 'hidden',
    WebkitOverflowScrolling: 'touch',
    background: '#FFFFFF',
    border: '1px solid rgba(0,0,0,.08)',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,.12)',
    padding: '8px',
    zIndex: 1000,
    boxSizing: 'border-box',
  },
  dropMenuHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    padding: '2px 2px 8px',
    marginBottom: 2,
    borderBottom: '1px solid rgba(0,0,0,.06)',
  },
  dropMenuHeaderTitle: {
    fontFamily: 'var(--font-sans)',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '.06em',
    textTransform: 'uppercase',
    color: 'var(--text3)',
  },
  dropMenuCloseBtn: {
    flexShrink: 0,
    width: 32,
    height: 32,
    borderRadius: 10,
    border: '1px solid rgba(0,0,0,.08)',
    background: 'rgba(0,0,0,.04)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
  },
  dropdownMinimalChat: {
    minWidth: 260,
    maxWidth: 'min(352px, calc(100vw - 20px))',
    padding: '10px 10px 10px',
    background: 'var(--ta-elevated)',
    border: '1px solid var(--ta-border-strong)',
    borderRadius: 16,
    boxShadow: '0 12px 40px rgba(15, 23, 32, 0.14)',
  },
  dropdownMinimalChatFlex: {
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 'min(88vh, 720px)',
    minHeight: 0,
    boxSizing: 'border-box',
  },
  planMinimalTripsHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottom: '1px solid rgba(0,0,0,.06)',
  },
  planMinimalTripsTitle: {
    fontFamily: 'var(--font-sans)',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '.08em',
    textTransform: 'uppercase',
    color: 'var(--text3)',
  },
  planMinimalTripsList: {
    maxHeight: 'min(42vh, 320px)',
    overflowY: 'auto',
    overflowX: 'hidden',
    WebkitOverflowScrolling: 'touch',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    paddingBottom: 4,
  },
  planMinimalTripsEmpty: {
    margin: '12px 4px 16px',
    fontFamily: 'var(--font-sans)',
    fontSize: 13,
    color: 'var(--muted)',
    lineHeight: 1.45,
  },
  planMinimalBackBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    padding: '6px 8px',
    border: 'none',
    borderRadius: 10,
    background: 'rgba(74,98,120,.08)',
    color: 'var(--ta-accent-deep)',
    fontFamily: 'var(--font-sans)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
    boxSizing: 'border-box',
    justifyContent: 'flex-start',
  },
  minimalModulesShell: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    marginTop: 2,
  },
  minimalModulesScroll: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    WebkitOverflowScrolling: 'touch',
    paddingRight: 2,
    boxSizing: 'border-box',
  },
  planSlotTripFrameInMenu: {
    padding: '6px 4px 6px',
    borderRadius: 14,
    background: 'rgba(74,98,120,.05)',
    border: '1px solid var(--ta-border)',
    boxSizing: 'border-box',
  },
  modulesStickyFooter: {
    flexShrink: 0,
    paddingTop: 10,
    paddingBottom: 2,
    marginTop: 'auto',
    borderTop: '1px solid rgba(0,0,0,.1)',
    background: 'var(--ta-elevated)',
    boxSizing: 'border-box',
  },
  dropdownMinimalFooter: {
    marginTop: 10,
    paddingTop: 10,
    borderTop: '1px solid rgba(0,0,0,.06)',
  },
  dropdownGeziBtn: {
    width: '100%',
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '10px 14px',
    borderRadius: 12,
    background: 'linear-gradient(135deg, var(--ta-night-a), var(--ta-night-b) 55%, var(--ta-accent))',
    color: '#fff',
    border: '1px solid rgba(15, 23, 32, 0.12)',
    boxShadow: '0 4px 14px rgba(15, 23, 32, 0.12)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  },
  planMinimalTopRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  planMinimalInputWrap: {
    flex: 1,
    minWidth: 0,
  },
  planNameDropInputCompact: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '7px 10px',
    borderRadius: 10,
    border: '1px solid rgba(74,98,120,.28)',
    background: 'rgba(255,255,255,.95)',
    fontFamily: 'var(--font-serif)',
    fontWeight: 700,
    fontSize: 13,
    color: 'var(--text1)',
    outline: 'none',
  },
  dropMenuCloseBtnCompact: {
    flexShrink: 0,
    width: 30,
    height: 30,
    borderRadius: 9,
    border: '1px solid rgba(0,0,0,.08)',
    background: 'rgba(0,0,0,.04)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
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
  dropTripRow: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid transparent',
    background: 'transparent',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background .15s',
    boxSizing: 'border-box',
    fontFamily: 'var(--font-sans)',
  },
  dropTripRowHover: {
    background: 'var(--ta-muted-bg)',
  },
  dropTripTextCol: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  dropTripTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--text1)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  dropTripSub: {
    fontSize: '11px',
    color: 'var(--text3)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
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
    background: 'rgba(74,98,120,.08)',
    border: '1px solid rgba(74,98,120,.18)',
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
    background: 'rgba(74,98,120,.08)',
    border: '1px solid rgba(74,98,120,.18)',
  },
  dropItemMeta: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
    minWidth: 0,
  },
  dropIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
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
    border: '1px solid rgba(74,98,120,.2)',
    background: 'rgba(74,98,120,.06)',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    fontSize: '13px',
    color: 'var(--ta-accent-deep)',
    transition: 'background .15s',
  },
  planWorkspaceSlotWrap: {
    overflowX: 'hidden',
    padding: '4px 4px 10px',
    borderRadius: '12px',
    background: 'rgba(74,98,120,.04)',
    border: '1px solid rgba(0,0,0,.05)',
    boxSizing: 'border-box',
  },
  planNameDropInput: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '9px 11px',
    borderRadius: '10px',
    border: '1px solid rgba(74,98,120,.28)',
    background: 'rgba(255,255,255,.95)',
    fontFamily: 'var(--font-serif)',
    fontWeight: 700,
    fontSize: '14px',
    color: 'var(--text1)',
    outline: 'none',
  },
  planDropTripLabel: {
    fontFamily: 'var(--font-sans)',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '.06em',
    textTransform: 'uppercase',
    color: 'var(--text3)',
    padding: '2px 4px 8px',
  },
  planNameDropInputTrip: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '9px 11px',
    borderRadius: 10,
    border: '1px solid rgba(74,98,120,.28)',
    background: 'rgba(255,255,255,.95)',
    fontFamily: 'var(--font-serif)',
    fontWeight: 700,
    fontSize: 14,
    color: 'var(--text1)',
    outline: 'none',
    marginBottom: 10,
  },
  planSlotTripFrame: {
    padding: '6px 4px 6px',
    borderRadius: 14,
    background: 'rgba(74,98,120,.05)',
    border: '1px solid var(--ta-border)',
    maxHeight: 'min(58vh, 520px)',
    overflowY: 'auto',
    overflowX: 'hidden',
    WebkitOverflowScrolling: 'touch',
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
    border: '1.5px solid var(--ta-ink)',
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
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
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
  selectTrigger: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    whiteSpace: 'nowrap',
    textAlign: 'left',
  },
  selectLangTrigger: {
    minWidth: 46,
  },
  selectCurTrigger: {
    minWidth: 76,
  },
  selectMenu: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    right: 0,
    minWidth: 'max(100%, 200px)',
    background: '#fff',
    border: '1px solid rgba(0,0,0,.1)',
    borderRadius: 10,
    boxShadow: '0 10px 28px rgba(15,23,32,.12)',
    zIndex: 5000,
    padding: 4,
    maxHeight: 280,
    overflowY: 'auto',
  },
  selectMenuItem: {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '8px 10px',
    border: 'none',
    borderRadius: 6,
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 13,
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
    color: 'var(--text1)',
  },
  selectMenuItemOn: {
    background: 'rgba(0,0,0,.06)',
    fontWeight: 700,
  },
  selectChevron: {
    position: 'absolute',
    right: '6px',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
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
