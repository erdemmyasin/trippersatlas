'use client';

import {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AppSidebar from '@/components/AppSidebar';
import Header from '@/components/Header';
import TripRouteHeader from '@/components/TripRouteHeader';
import TripToolsGrid from '@/components/TripToolsGrid';
import LeftPanel from '@/components/LeftPanel';
import RightPanelFeed from '@/components/RightPanelFeed';
import ChatArea from '@/components/ChatArea';
import QuickPlanForm from '@/components/QuickPlanForm';
import RightPanel, { DEFAULT_MAP_MARKERS } from '@/components/RightPanel';
import { trackEvent } from '@/lib/analytics';
import {
  getChat,
  saveChat,
  getActiveId,
  setActiveId,
  createChat,
  deriveChatTitle,
  setLastUiContext,
  getLastUiContext,
  deleteChat,
  setChatArchived,
} from '@/lib/chatStore';
import {
  TRIP_LS,
  notifyTripStorage,
  clearTripChipSessionStorage,
  mergeTripMetaForChips,
  readTripMetaSnapshot,
  seedTripChipsFromTrip,
} from '@/lib/tripChipStorage';
import { isChatTripMetaComplete } from '@/lib/chatTripMetaGate';
import { buildEmptyHero } from '@/lib/chatCollectWelcome';
import { useLocaleCurrency } from '@/components/LocaleCurrencyContext';
import { findMergedTripById } from '@/lib/tripMerge';
import { createTrip, saveTrip } from '@/lib/tripStore';
import { getTripWorkspace, saveTripWorkspace, defaultTripWorkspace } from '@/lib/tripWorkspaceStore';
import { listingMapKey } from '@/lib/listingMapKey';
import { appendRegionalGeocodeContext, defaultTripDestinationLabel } from '@/lib/taRegion';
import { readTripNotesFromLs } from '@/lib/atlasFilterSnapshot';

function mergeByListingKey(prev, next) {
  const m = new Map();
  for (const x of prev) {
    if (x?.listingKey) m.set(x.listingKey, { ...x });
  }
  for (const x of next) {
    if (x?.listingKey) m.set(x.listingKey, { ...m.get(x.listingKey), ...x });
  }
  return [...m.values()];
}

const MONTHS_SHORT_TR = [
  'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara',
];

function tripDatesToMeta(startIso, endIso) {
  let datesChipText = '';
  let nights = 0;
  let month = '';
  if (!startIso || !endIso) return { datesChipText, nights, month };
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { datesChipText, nights, month };
  }
  const lo = start <= end ? start : end;
  const hi = start <= end ? end : start;
  const days = Math.round(Math.abs(hi.getTime() - lo.getTime()) / 86400000) + 1;
  nights = Math.max(0, days - 1);
  datesChipText = `${lo.getDate()} ${MONTHS_SHORT_TR[lo.getMonth()]} - ${hi.getDate()} ${MONTHS_SHORT_TR[hi.getMonth()]} · ${days} gün`;
  month = MONTHS_SHORT_TR[lo.getMonth()] || '';
  return { datesChipText, nights, month };
}

function buildPaxFromTravelers(t) {
  if (!t || typeof t !== 'object') {
    return { paxChipText: '1 yetişkin', travelers: 1 };
  }
  const adults = Number(t.adults) || 0;
  const children = Number(t.children) || 0;
  const seniors = Number(t.seniors) || 0;
  const infants = Number(t.infants) || 0;
  const pets = Number(t.pets) || 0;
  const parts = [];
  if (adults > 0) parts.push(`${adults} yetişkin`);
  if (children > 0) parts.push(`${children} çocuk`);
  if (infants > 0) parts.push(`${infants} bebek`);
  if (seniors > 0) parts.push(`${seniors} yaşlı`);
  if (pets > 0) parts.push(`${pets} evcil hayvan`);
  const total = adults + children + seniors + infants;
  const paxChipText = parts.length ? parts.join(' · ') : '1 yetişkin';
  return { paxChipText, travelers: Math.max(1, total || 1) };
}

const TYPE_TO_CAT = {
  hotel: 'accommodation', villa: 'accommodation', clinic: 'accommodation',
  flight: 'transport', bus: 'transport', car: 'transport', transfer: 'transport',
  tour: 'activities', boat: 'activities', activity: 'activities',
  restaurant: 'extras', extra: 'extras',
};
/**
 * Listing türü → aktive olacak servis id'leri.
 * "Tur" özel: arka planda Konaklama + Uçuş (+ paket araba içeriyorsa Araç) aktif.
 */
const TYPE_TO_SERVICES = {
  hotel:      ['lodging'],
  villa:      ['lodging'],
  clinic:     ['lodging'],
  flight:     ['flight'],
  bus:        ['bus'],
  car:        ['car'],
  transfer:   ['car'],
  tour:       ['lodging', 'flight', 'activity'],
  boat:       ['activity'],
  activity:   ['activity'],
  restaurant: ['extras'],
  extra:      ['extras'],
};
const EMPTY_BUDGET = { accommodation: 0, transport: 0, activities: 0, extras: 0 };

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

/** /chat sohbet: chip’ler sıfırlandığında kişi varsayılanı 1 yetişkin */
const DEFAULT_SOBHET_TRIP_META = {
  ...INITIAL_TRIP_META,
  travelers: 1,
  paxChipText: '1 yetişkin',
};

const EMPTY_CHAT_SYNC_TRIP = {
  destination: '',
  startDate: undefined,
  endDate: undefined,
  travelers: { adults: 1, children: 0, seniors: 0, infants: 0, pets: 0 },
  budget: '',
  notes: [],
};

const INITIAL_SAVED_PLANS = [
  { id: 'sp1', name: 'Bodrum Yaz Tatili', subtitle: 'Bodrum · 7 gece · 2 kişi', date: 'Haz 2026' },
  { id: 'sp2', name: 'İstanbul Kültür Turu', subtitle: 'İstanbul · 4 gece · 1 kişi', date: 'Tem 2026' },
  { id: 'sp3', name: 'Kapadokya Kaçamağı', subtitle: 'Nevşehir · 3 gece · 2 kişi', date: 'Ağu 2026' },
];

let _planIdCounter = 10;

export default function ChatPlanWorkspace({
  forcedTripId = null,
  sidebarActiveId = 'chats',
  headerVariant = 'default',
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { lang: activeLang } = useLocaleCurrency();
  const emptyHero = useMemo(() => buildEmptyHero(activeLang), [activeLang]);
  const lastForcedTripLoadRef = useRef(null);

  const [uiMode, setUiMode] = useState('chat');
  const [activeChat, setActiveChat] = useState(null);
  const [activeTripId, setActiveTripId] = useState(null);
  const [feedKey, setFeedKey] = useState('init');
  const [feedMessages, setFeedMessages] = useState([]);

  const [activePlanId, setActivePlanId] = useState('active');
  const [planName, setPlanName] = useState('Yeni Seyahat Planı');
  const [budget, setBudget] = useState(EMPTY_BUDGET);
  const [completedModules, setCompletedModules] = useState(new Set());
  const [bookedServices, setBookedServices] = useState(new Set());
  const [paidServices, setPaidServices] = useState(new Set());
  const [selectedListings, setSelectedListings] = useState({});
  const [tripMeta, setTripMeta] = useState(DEFAULT_SOBHET_TRIP_META);
  const [chatFlowPhase, setChatFlowPhase] = useState('collect_meta');
  const [chipTick, setChipTick] = useState(0);
  const [mapMarkers, setMapMarkers] = useState(DEFAULT_MAP_MARKERS);
  const [geoCenter, setGeoCenter] = useState({ lat: 41.0082, lng: 28.9784 });
  const [resolvedMapPins, setResolvedMapPins] = useState([]);
  const [hoveredListingKey, setHoveredListingKey] = useState(null);
  const [mapPinSelectedKey, setMapPinSelectedKey] = useState(null);
  const [listingHighlightFromMapKey, setListingHighlightFromMapKey] = useState(null);
  const [mapFocusRequest, setMapFocusRequest] = useState(null);
  const [assistantSignal, setAssistantSignal] = useState(null);
  const [savedPlans, setSavedPlans] = useState(INITIAL_SAVED_PLANS);
  const [mapVisible, setMapVisible] = useState(false);

  const activeChatRef = useRef(null);
  activeChatRef.current = activeChat;
  const liveMessagesRef = useRef([]);
  const uiModeRef = useRef('chat');
  uiModeRef.current = uiMode;
  const activeTripIdRef = useRef(null);
  activeTripIdRef.current = activeTripId;
  const urlBootRef = useRef(false);
  const [quickPlanMode, setQuickPlanMode] = useState(null);
  const [pendingTripBootstrap, setPendingTripBootstrap] = useState(null);
  const chatAreaRef = useRef(null);
  const tripMetaRef = useRef(tripMeta);
  tripMetaRef.current = tripMeta;
  const geoCenterRef = useRef(geoCenter);
  geoCenterRef.current = geoCenter;
  const resolvedMapPinsRef = useRef(resolvedMapPins);
  resolvedMapPinsRef.current = resolvedMapPins;
  const resolveListingsTimerRef = useRef(null);
  const resolveListingsGenRef = useRef(0);
  const lastAutoFocusSigRef = useRef('');
  const handledQsRef = useRef('');
  const navHandlersRef = useRef({
    runNewChat() {},
    loadChatById() {},
    loadTripById() {},
    bootstrapFromLastUi() {},
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('ta_active_trip_id', String(activePlanId));
    } catch {
      /* ignore */
    }
  }, [activePlanId]);

  useEffect(() => {
    setResolvedMapPins([]);
    setHoveredListingKey(null);
    setMapPinSelectedKey(null);
    setListingHighlightFromMapKey(null);
    setMapFocusRequest(null);
  }, [feedKey]);

  useEffect(() => {
    if (!mapPinSelectedKey) setMapFocusRequest(null);
  }, [mapPinSelectedKey]);

  /* Pin API'den sonra gelirse Seç sonrası haritayı bir kez odakla */
  useEffect(() => {
    if (!mapPinSelectedKey) {
      lastAutoFocusSigRef.current = '';
      return;
    }
    const pin = resolvedMapPins.find((p) => p.listingKey === mapPinSelectedKey);
    if (!pin || !Number.isFinite(pin.lat) || !Number.isFinite(pin.lng)) return;
    const sig = `${mapPinSelectedKey}|${pin.lat}|${pin.lng}`;
    if (lastAutoFocusSigRef.current === sig) return;
    lastAutoFocusSigRef.current = sig;
    setMapFocusRequest({ lat: pin.lat, lng: pin.lng, at: Date.now() });
  }, [resolvedMapPins, mapPinSelectedKey]);

  useEffect(() => {
    const d = String(tripMeta?.destination || '').trim();
    if (!d || !process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY) return;
    let cancelled = false;
    fetch(`/api/places/geocode?address=${encodeURIComponent(appendRegionalGeocodeContext(d))}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled || j.lat == null || j.lng == null) return;
        setGeoCenter({ lat: j.lat, lng: j.lng });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [tripMeta.destination]);

  const persistCurrentWorkspace = useCallback(() => {
    const mode = uiModeRef.current;
    const tripId = activeTripIdRef.current;
    const curChat = activeChatRef.current;
    if (mode === 'trip' && tripId) {
      saveTripWorkspace(tripId, {
        messages: liveMessagesRef.current,
        plan: {
          completedModules: Array.from(completedModules),
          bookedServices: Array.from(bookedServices),
          paidServices: Array.from(paidServices),
          budget,
          selectedListings,
        },
        mapData: { markers: mapMarkers },
        topBarData: { planName, tripMeta },
      });
    } else if (mode === 'chat' && curChat) {
      saveChat({
        ...curChat,
        messages: liveMessagesRef.current,
        title: deriveChatTitle(liveMessagesRef.current),
      });
    }
  }, [budget, completedModules, bookedServices, paidServices, mapMarkers, planName, selectedListings, tripMeta]);

  /** Sohbet açık kalsın; üst plandaki gezi verisini seçilen kayıttan doldurur */
  const hydratePlanFromStoredTrip = useCallback((trip) => {
    if (!trip) return;
    const id = String(trip.id);
    const merged = findMergedTripById(id) || trip;
    const ws = getTripWorkspace(id);
    const plan = ws.plan || {};
    const top = ws.topBarData || {};
    setPlanName(top.planName || merged.name || 'Yeni Seyahat Planı');
    setBudget({ ...EMPTY_BUDGET, ...(plan.budget || {}) });
    setCompletedModules(new Set(plan.completedModules || []));
    setBookedServices(new Set(plan.bookedServices || []));
    setPaidServices(new Set(plan.paidServices || []));
    setSelectedListings(plan.selectedListings || {});
    const { datesChipText, nights, month } = tripDatesToMeta(merged.startDate, merged.endDate);
    const { paxChipText, travelers } = buildPaxFromTravelers(merged.travelers);
    const tm = top.tripMeta || {};
    setTripMeta({
      ...INITIAL_TRIP_META,
      ...tm,
      destination: String(merged.destination || tm.destination || '').trim(),
      nights,
      month,
      datesChipText,
      travelers,
      paxChipText,
      budget: typeof merged.budget === 'string' ? merged.budget : (tm.budget ?? ''),
      travelType: tm.travelType || '',
    });
    const m = ws.mapData?.markers;
    setMapMarkers(Array.isArray(m) && m.length > 0 ? m : DEFAULT_MAP_MARKERS);
    setActivePlanId(id);
    seedTripChipsFromTrip(merged);
    setChipTick((t) => t + 1);
  }, []);

  const handlePickTripFromPlanMenu = useCallback(
    (trip) => {
      if (!trip) return;
      persistCurrentWorkspace();
      hydratePlanFromStoredTrip(trip);
      trackEvent('plan.switch', { planId: trip.id, name: trip.name, source: 'header.planMenu.trips' });
    },
    [hydratePlanFromStoredTrip, persistCurrentWorkspace]
  );

  const applyTripRecord = useCallback((trip) => {
    if (!trip) return;
    const id = String(trip.id);
    const ws = getTripWorkspace(id);
    setUiMode('trip');
    setActiveTripId(id);
    setFeedKey(`trip-${id}`);
    const msgs = ws.messages || [];
    setFeedMessages(msgs);
    liveMessagesRef.current = msgs;
    setPlanName(ws.topBarData.planName || trip.name || 'Yeni Seyahat Planı');
    setBudget({ ...EMPTY_BUDGET, ...ws.plan.budget });
    setCompletedModules(new Set(ws.plan.completedModules || []));
    setBookedServices(new Set(ws.plan.bookedServices || []));
    setPaidServices(new Set(ws.plan.paidServices || []));
    setSelectedListings(ws.plan.selectedListings || {});
    setTripMeta({ ...INITIAL_TRIP_META, ...ws.topBarData.tripMeta });
    const m = ws.mapData?.markers;
    setMapMarkers(Array.isArray(m) && m.length > 0 ? m : DEFAULT_MAP_MARKERS);
    setActivePlanId(id);
    const { datesChipText, nights, month } = tripDatesToMeta(trip.startDate, trip.endDate);
    const { paxChipText, travelers } = buildPaxFromTravelers(trip.travelers);
    const tm = ws.topBarData.tripMeta || {};
    setTripMeta({
      ...INITIAL_TRIP_META,
      ...tm,
      destination: String(trip.destination || tm.destination || '').trim(),
      nights,
      month,
      datesChipText,
      travelers,
      paxChipText,
      budget: typeof trip.budget === 'string' ? trip.budget : (tm.budget ?? ''),
      travelType: tm.travelType || '',
    });
    seedTripChipsFromTrip(trip);
    setLastUiContext('trip', id);
    setActiveChat(null);
  }, []);

  const resetPlanAndMapUi = useCallback(() => {
    setActivePlanId('active');
    setPlanName('Yeni Seyahat Planı');
    setBudget(EMPTY_BUDGET);
    setCompletedModules(new Set());
    setBookedServices(new Set());
    setPaidServices(new Set());
    setSelectedListings({});
    setTripMeta(DEFAULT_SOBHET_TRIP_META);
    setMapMarkers(DEFAULT_MAP_MARKERS);
  }, []);

  const loadChatById = useCallback(
    (rawId, opts = {}) => {
      persistCurrentWorkspace();
      const c = getChat(rawId);
      if (!c) return;
      setUiMode('chat');
      setActiveTripId(null);
      setActiveChat(c);
      setFeedKey(`chat-${c.id}`);
      const rawMsgs = c.messages || [];
      const hadStored = rawMsgs.length > 0;
      const msgs = hadStored ? rawMsgs : [];
      setFeedMessages(msgs);
      liveMessagesRef.current = msgs;
      setActiveId(c.id);
      setLastUiContext('chat', c.id);
      setChatFlowPhase(hadStored ? 'suggesting' : 'collect_meta');
      if (!hadStored) {
        try {
          saveChat({ ...c, messages: [] });
        } catch {
          /* ignore */
        }
      }
      if (c.tripId) {
        const trip = findMergedTripById(c.tripId);
        if (trip) {
          queueMicrotask(() => {
            hydratePlanFromStoredTrip(trip);
          });
        }
      }
    },
    [persistCurrentWorkspace, hydratePlanFromStoredTrip]
  );

  const loadTripById = useCallback(
    (rawId) => {
      persistCurrentWorkspace();
      let trip = findMergedTripById(rawId);
      if (!trip) {
        const ws = getTripWorkspace(rawId);
        trip = {
          id: rawId,
          name: ws.topBarData.planName || 'Gezi',
          destination: String(ws.topBarData.tripMeta?.destination || defaultTripDestinationLabel() || 'Seyahat'),
          startDate: null,
          endDate: null,
          travelers: {},
          budget: '',
          notes: [],
        };
      }
      applyTripRecord(trip);
    },
    [applyTripRecord, persistCurrentWorkspace]
  );

  const runNewChat = useCallback(() => {
    persistCurrentWorkspace();
    resetPlanAndMapUi();
    clearTripChipSessionStorage();
    setTripMeta(DEFAULT_SOBHET_TRIP_META);
    seedTripChipsFromTrip(EMPTY_CHAT_SYNC_TRIP);
    const fresh = createChat();
    const seeded = { ...fresh, messages: [] };
    saveChat(seeded);
    setUiMode('chat');
    setActiveTripId(null);
    setActiveChat(seeded);
    setFeedKey(`chat-${fresh.id}`);
    setFeedMessages([]);
    liveMessagesRef.current = [];
    setActiveId(fresh.id);
    setLastUiContext('chat', fresh.id);
    setChatFlowPhase('collect_meta');
    trackEvent('chat.new');
    return fresh.id;
  }, [persistCurrentWorkspace, resetPlanAndMapUi]);

  const bootstrapFromLastUi = useCallback(() => {
    const last = getLastUiContext();
    if (last?.mode === 'trip' && last.id) {
      const trip = findMergedTripById(last.id);
      if (trip) {
        applyTripRecord(trip);
        return;
      }
      loadTripById(last.id);
      return;
    }
    if (last?.mode === 'chat' && last.id) {
      const c = getChat(last.id);
      if (c) {
        loadChatById(c.id);
        return;
      }
    }
    const savedId = getActiveId();
    const c = savedId ? getChat(savedId) : null;
    if (c) {
      loadChatById(c.id);
      return;
    }
    runNewChat();
  }, [applyTripRecord, loadChatById, loadTripById, runNewChat]);

  navHandlersRef.current = {
    runNewChat,
    loadChatById,
    loadTripById,
    bootstrapFromLastUi,
  };

  useEffect(() => {
    if (!pendingTripBootstrap) return;
    if (feedKey !== `chat-${pendingTripBootstrap.chatId}`) return;
    const { userText } = pendingTripBootstrap;
    let cancelled = false;
    queueMicrotask(async () => {
      if (cancelled) return;
      try {
        await chatAreaRef.current?.sendBootstrapUser?.(userText);
      } finally {
        if (!cancelled) setPendingTripBootstrap(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [feedKey, pendingTripBootstrap]);

  const queryString = searchParams.toString();

  /* /trips/[id] rotası: URL sorgusu olmadan doğrudan gezi yükle */
  useEffect(() => {
    if (!forcedTripId) {
      lastForcedTripLoadRef.current = null;
      return;
    }
    const id = String(forcedTripId);
    if (lastForcedTripLoadRef.current === id) return;
    lastForcedTripLoadRef.current = id;
    urlBootRef.current = true;
    navHandlersRef.current.loadTripById(id);
  }, [forcedTripId]);

  useEffect(() => {
    if (forcedTripId) return;
    const qs = queryString;
    if (qs) {
      if (handledQsRef.current === qs) return;
      handledQsRef.current = qs;
      const sp = new URLSearchParams(qs);
      const qp = sp.get('quickPlan');
      if (qp === 'tour') {
        router.replace('/turlar', { scroll: false });
        urlBootRef.current = true;
        return;
      }
      if (qp === 'activities') {
        router.replace('/aktiviteler', { scroll: false });
        urlBootRef.current = true;
        return;
      }
      if (qp === 'flight') {
        router.replace('/flights', { scroll: false });
        urlBootRef.current = true;
        return;
      }
      if (qp === 'stay') {
        router.replace('/stay', { scroll: false });
        urlBootRef.current = true;
        return;
      }
      if (qp === 'car') {
        router.replace('/cars', { scroll: false });
        urlBootRef.current = true;
        return;
      }
      if (qp === 'bus') {
        router.replace('/bus', { scroll: false });
        urlBootRef.current = true;
        return;
      }
      const h = navHandlersRef.current;
      const tripBootId = sp.get('trip');
      const qBoot = sp.get('q');
      if (
        sp.get('newChat') === '1' &&
        tripBootId &&
        qBoot != null &&
        String(qBoot).trim() !== ''
      ) {
        const userText = decodeURIComponent(String(qBoot).replace(/\+/g, ' ')).trim();
        if (userText) {
          const trip =
            findMergedTripById(tripBootId) || {
              id: tripBootId,
              name: 'Gezi',
              destination: '',
            };
          const c = createChat({ tripName: trip.name, tripId: String(tripBootId) });
          saveChat({ ...c, messages: [] });
          h.loadChatById(c.id, { emptyForBootstrap: true });
          setPendingTripBootstrap({
            chatId: c.id,
            tripId: String(tripBootId),
            userText,
          });
          router.replace('/chat', { scroll: false });
          urlBootRef.current = true;
          return;
        }
      }
      if (sp.get('newChat') === '1' && tripBootId) {
        const qEmpty = qBoot == null || String(qBoot).trim() === '';
        if (qEmpty) {
          const trip =
            findMergedTripById(tripBootId) || {
              id: tripBootId,
              name: 'Gezi',
              destination: '',
            };
          const c = createChat({ tripName: trip.name, tripId: String(tripBootId) });
          saveChat({ ...c, messages: [] });
          h.loadChatById(c.id, { emptyForBootstrap: true });
          router.replace('/chat', { scroll: false });
          urlBootRef.current = true;
          return;
        }
      }
      if (sp.get('newChat') === '1') {
        h.runNewChat();
        const rawDest = sp.get('dest');
        if (rawDest) {
          const decoded = decodeURIComponent(String(rawDest).replace(/\+/g, ' ')).trim();
          if (decoded) {
            queueMicrotask(() => {
              setTripMeta((prev) => ({ ...prev, destination: decoded }));
            });
          }
        }
      } else if (sp.get('chat')) h.loadChatById(sp.get('chat'));
      else if (sp.get('trip')) h.loadTripById(sp.get('trip'));
      else if (!urlBootRef.current) {
        urlBootRef.current = true;
        h.bootstrapFromLastUi();
      }
      router.replace('/chat', { scroll: false });
      urlBootRef.current = true;
      return;
    }
    handledQsRef.current = '';
    if (!urlBootRef.current) {
      urlBootRef.current = true;
      let heroText = '';
      try {
        heroText = (sessionStorage.getItem('ta_hero_prompt') || '').trim();
        if (heroText) sessionStorage.removeItem('ta_hero_prompt');
      } catch {
        /* ignore */
      }
      if (heroText) {
        const cid = navHandlersRef.current.runNewChat();
        if (cid != null) {
          queueMicrotask(() => {
            setPendingTripBootstrap({ chatId: cid, userText: heroText });
          });
        }
      } else {
        navHandlersRef.current.bootstrapFromLastUi();
      }
    }
  }, [queryString, router, forcedTripId]);

  useEffect(() => {
    function onQuickPlan(e) {
      const c = e?.detail?.category;
      if (c === 'tour') {
        router.push('/turlar');
        return;
      }
      if (c === 'activities') {
        router.push('/aktiviteler');
        return;
      }
      if (c === 'flight') {
        router.push('/flights');
        return;
      }
      if (c === 'stay') {
        router.push('/stay');
        return;
      }
      if (c === 'car') {
        router.push('/cars');
        return;
      }
      if (c === 'bus') {
        router.push('/bus');
        return;
      }
    }
    window.addEventListener('taQuickPlan', onQuickPlan);
    return () => window.removeEventListener('taQuickPlan', onQuickPlan);
  }, [router]);

  useEffect(() => {
    if (!quickPlanMode) return;
    function onKey(ev) {
      if (ev.key === 'Escape') setQuickPlanMode(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [quickPlanMode]);

  useEffect(() => {
    if (uiMode === 'chat' && activeChat?.id) {
      setLastUiContext('chat', activeChat.id);
    }
    if (uiMode === 'trip' && activeTripId) {
      setLastUiContext('trip', activeTripId);
    }
  }, [uiMode, activeChat?.id, activeTripId]);

  useEffect(() => {
    function bump() {
      setChipTick((t) => t + 1);
    }
    window.addEventListener('trip-local-storage', bump);
    window.addEventListener('storage', bump);
    return () => {
      window.removeEventListener('trip-local-storage', bump);
      window.removeEventListener('storage', bump);
    };
  }, []);

  const mergedTripMetaForGate = useMemo(
    () => mergeTripMetaForChips(tripMeta, readTripMetaSnapshot()),
    [tripMeta, chipTick]
  );

  useEffect(() => {
    if (headerVariant !== 'default' || uiMode !== 'chat') return;
    if (chatFlowPhase !== 'collect_meta') return;
    if (isChatTripMetaComplete(mergedTripMetaForGate)) {
      setChatFlowPhase('suggesting');
    }
  }, [headerVariant, uiMode, chatFlowPhase, mergedTripMetaForGate]);

  useEffect(() => {
    /** Plan/bütçe değişiklikleri için workspace persist hedefi:
     *  - Doğrudan /trips/{id} sayfasındaysak → o trip
     *  - /chat'te ve aktif sohbet bir trip'e bağlıysa → bağlı trip
     *  Aksi halde sadece chat içi state; trip workspace dokunulmaz.
     */
    let targetTripId = null;
    if (uiMode === 'trip' && activeTripId) {
      targetTripId = String(activeTripId);
    } else if (uiMode === 'chat' && activeChat?.tripId) {
      targetTripId = String(activeChat.tripId);
    }
    if (!targetTripId) return;

    const t = setTimeout(() => {
      saveTripWorkspace(targetTripId, {
        plan: {
          completedModules: Array.from(completedModules),
          bookedServices: Array.from(bookedServices),
          paidServices: Array.from(paidServices),
          budget,
          selectedListings,
        },
        mapData: { markers: mapMarkers },
        topBarData: { planName, tripMeta },
      });
    }, 400);
    return () => clearTimeout(t);
  }, [
    uiMode,
    activeTripId,
    activeChat?.tripId,
    planName,
    budget,
    completedModules,
    bookedServices,
    paidServices,
    selectedListings,
    tripMeta,
    mapMarkers,
  ]);

  const resolveMarkersFromListings = useCallback(async (listings) => {
    if (typeof window === 'undefined' || !process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY) return;
    const items = listings
      .filter((l) => {
        const t = String(l?.type || '').toLowerCase();
        if (t === 'car' || t === 'transfer') return false;
        return String(l?.name || '').trim().length > 0;
      })
      .slice(0, 12)
      .map((l) => ({
        name: l.name,
        location:
          l.location ||
          tripMetaRef.current?.destination ||
          defaultTripDestinationLabel() ||
          '',
        type: l.type,
        price: l.price,
        imageUrl: l.imageUrl,
        trustSignal: l.trustSignal,
        listingKey: listingMapKey(l),
      }));
    if (!items.length) return;
    const gen = ++resolveListingsGenRef.current;
    try {
      const bias = geoCenterRef.current;
      const res = await fetch('/api/places/resolve-markers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          bias:
            bias && Number.isFinite(bias.lat) && Number.isFinite(bias.lng)
              ? { lat: bias.lat, lng: bias.lng }
              : undefined,
        }),
      });
      const json = await res.json();
      if (gen !== resolveListingsGenRef.current) return;
      if (Array.isArray(json.markers) && json.markers.length) {
        setResolvedMapPins((prev) => mergeByListingKey(prev, json.markers));
      }
    } catch {
      /* Places hatası: sessizce */
    }
  }, []);

  const handleAssistantResponse = useCallback(
    (data) => {
      if (!data || typeof data !== 'object') return;
      setAssistantSignal({
        _t: Date.now(),
        stage: data.stage,
        budgetUpdate: data.budgetUpdate,
        listings: data.listings,
        travelType: data.travelType,
      });
      if (Array.isArray(data.listings) && data.listings.length) {
        if (typeof window !== 'undefined') {
          window.clearTimeout(resolveListingsTimerRef.current);
          const batch = data.listings;
          resolveListingsTimerRef.current = window.setTimeout(() => {
            void resolveMarkersFromListings(batch);
          }, 420);
        }
      }
    },
    [resolveMarkersFromListings]
  );

  const handleMessagesChange = useCallback(
    (messages) => {
      liveMessagesRef.current = messages;
      if (uiModeRef.current === 'chat') {
        const current = activeChatRef.current;
        if (!current) return;
        const title = deriveChatTitle(messages);
        const updated = { ...current, messages, title };
        saveChat(updated);
        setActiveChat(updated);
        return;
      }
      if (uiModeRef.current === 'trip' && activeTripIdRef.current) {
        saveTripWorkspace(activeTripIdRef.current, { messages });
      }
    },
    []
  );

  function handlePlanNameChange(name) {
    setPlanName(name);
    trackEvent('plan.rename', { name });
  }

  function handleNewPlan() {
    persistCurrentWorkspace();
    setUiMode('chat');
    setActiveTripId(null);
    const snapshot = {
      id: `sp${++_planIdCounter}`,
      name: planName,
      subtitle: buildSubtitle(),
      date: new Date().toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' }),
    };
    setSavedPlans((prev) => [snapshot, ...prev]);
    setActivePlanId(`sp${_planIdCounter}`);
    setPlanName('Yeni Seyahat Planı');
    setBudget(EMPTY_BUDGET);
    setCompletedModules(new Set());
    setBookedServices(new Set());
    setPaidServices(new Set());
    setSelectedListings({});
    setTripMeta(INITIAL_TRIP_META);
    trackEvent('plan.create', { source: 'header.dropdown' });
  }

  function handleSwitchPlan(plan) {
    persistCurrentWorkspace();
    setUiMode('chat');
    setActiveTripId(null);
    setActivePlanId(plan.id);
    setPlanName(plan.name);
    trackEvent('plan.switch', { planId: plan.id, name: plan.name });
  }

  function handleActivateStoredTrip(trip) {
    if (!trip) return;
    persistCurrentWorkspace();
    applyTripRecord(trip);
    trackEvent('plan.switch', { planId: trip.id, name: trip.name });
  }

  function handleListingSelect(listing) {
    const { type, price = 0, location = '' } = listing;
    const lk = listingMapKey(listing);
    setMapPinSelectedKey(lk);
    const pin = resolvedMapPinsRef.current.find((p) => p.listingKey === lk);
    if (pin && Number.isFinite(pin.lat) && Number.isFinite(pin.lng)) {
      lastAutoFocusSigRef.current = `${lk}|${pin.lat}|${pin.lng}`;
      setMapFocusRequest({ lat: pin.lat, lng: pin.lng, at: Date.now() });
    }
    const cat = TYPE_TO_CAT[type] ?? 'extras';
    setBudget((prev) => ({ ...prev, [cat]: prev[cat] + Number(price) }));
    const svcIds = TYPE_TO_SERVICES[type] || [];
    // Tur içerisinde araç paket varsa "car" da aktive olur
    if (type === 'tour' && listing?.includesCar) svcIds.push('car');
    if (svcIds.length > 0) {
      setCompletedModules((prev) => new Set([...prev, ...svcIds]));
    }
    setSelectedListings((prev) => ({ ...prev, [listing.name]: listing }));
    const city = location.split(/[,·\-]/)[0].trim();
    if (city) setTripMeta((prev) => ({ ...prev, destination: city }));
    trackEvent('listing.select', { name: listing.name, type, location, price: Number(price) || 0 });
  }

  function handleListingDeselect(listing) {
    const { type, price = 0, name } = listing;
    const lk = listingMapKey(listing);
    setMapPinSelectedKey((cur) => (cur === lk ? null : cur));
    const cat = TYPE_TO_CAT[type] ?? 'extras';
    const svcIds = TYPE_TO_SERVICES[type] || [];
    setBudget((prev) => ({ ...prev, [cat]: Math.max(0, prev[cat] - Number(price)) }));
    setSelectedListings((prev) => {
      const next = { ...prev };
      delete next[name];
      // Bu listing'in aktive ettiği her servis için: başka bir listing aynı servisi
      // hâlâ destekliyor mu kontrol et; yoksa servisi tamamlanmışlardan çıkar.
      if (svcIds.length > 0) {
        setCompletedModules((pm) => {
          const a = new Set(pm);
          for (const sid of svcIds) {
            const stillUsed = Object.values(next).some((l) =>
              (TYPE_TO_SERVICES[l.type] || []).includes(sid)
            );
            if (!stillUsed) a.delete(sid);
          }
          return a;
        });
      }
      return next;
    });
    trackEvent('listing.remove', { name, type, price: Number(price) || 0 });
  }

  function buildSubtitle() {
    return tripMeta.destination || 'Taslak plan';
  }

  const highlightChatId = uiMode === 'chat' ? activeChat?.id : null;
  const highlightTripId = uiMode === 'trip' ? activeTripId : null;

  const chatGoogleMarkers = useMemo(() => {
    return resolvedMapPins.map((m) => {
      const key = m.listingKey;
      let variant = 'default';
      if (key && key === mapPinSelectedKey) variant = 'selected';
      else if (key && key === hoveredListingKey) variant = 'hover';
      return { ...m, variant };
    });
  }, [resolvedMapPins, mapPinSelectedKey, hoveredListingKey]);

  const handleMapMarkerClick = useCallback((marker) => {
    const key = marker?.listingKey;
    if (!key) return;
    setListingHighlightFromMapKey(key);
    chatAreaRef.current?.scrollToListingKey?.(key);
  }, []);

  const handleShareChat = useCallback(async () => {
    const cur = activeChatRef.current;
    if (!cur?.id || typeof window === 'undefined') return;
    const url = `${window.location.origin}/chat?chat=${encodeURIComponent(String(cur.id))}`;
    try {
      await navigator.clipboard.writeText(url);
      window.alert('Sohbet bağlantısı panoya kopyalandı.');
    } catch {
      window.prompt('Bağlantıyı kopyalayın:', url);
    }
  }, []);

  const handleCreateTripFromChat = useCallback(() => {
    const cur = activeChatRef.current;
    if (!cur?.id) return;
    const dest = String(tripMetaRef.current?.destination || '').trim();
    const titleBase =
      cur.title && cur.title !== 'Başlıksız' ? String(cur.title).trim() : '';
    const trip = createTrip({
      name: titleBase || undefined,
      destination: dest || undefined,
    });
    saveTrip(trip);
    saveTripWorkspace(String(trip.id), defaultTripWorkspace());
    const updated = { ...cur, tripId: String(trip.id), tripName: trip.name };
    saveChat(updated);
    setActiveChat(updated);
    hydratePlanFromStoredTrip(trip);
    trackEvent('trip.create_from_chat', { chatId: cur.id, tripId: trip.id });
  }, [hydratePlanFromStoredTrip]);

  const handleArchiveChat = useCallback(() => {
    const cur = activeChatRef.current;
    if (!cur?.id) return;
    setChatArchived(cur.id, true);
    navHandlersRef.current.runNewChat();
    trackEvent('chat.archive', { chatId: cur.id });
  }, []);

  const handleDeleteChat = useCallback(() => {
    const cur = activeChatRef.current;
    if (!cur?.id) return;
    if (!window.confirm('Bu sohbet kalıcı olarak silinsin mi?')) return;
    deleteChat(cur.id);
    navHandlersRef.current.runNewChat();
    trackEvent('chat.delete', { chatId: cur.id, source: 'chat_overflow' });
  }, []);

  const planWorkspaceSlot = (
    <LeftPanel
      hidePlanTitle
      embedded
      hideSmartSuggestion
      planBadgeLabel={null}
      planName={planName}
      onPlanNameChange={handlePlanNameChange}
      completedModules={completedModules}
      bookedServices={bookedServices}
      paidServices={paidServices}
      onBookService={(id) =>
        setBookedServices((prev) => new Set([...prev, id]))
      }
      onUnbookService={(id) => {
        setBookedServices((prev) => {
          const n = new Set(prev);
          n.delete(id);
          return n;
        });
        // booked çıkınca paid de gitmeli
        setPaidServices((prev) => {
          const n = new Set(prev);
          n.delete(id);
          return n;
        });
      }}
      onPayService={(id) =>
        setPaidServices((prev) => new Set([...prev, id]))
      }
      onUnpayService={(id) =>
        setPaidServices((prev) => {
          const n = new Set(prev);
          n.delete(id);
          return n;
        })
      }
      budget={budget}
      selectedListings={selectedListings}
      onDeselect={handleListingDeselect}
    />
  );

  /** Yalnız /chat + sohbet modu; gezi detay ekranı hariç */
  const chatSohbetChrome = headerVariant === 'default' && uiMode === 'chat';
  /** Seyahat modülleri / bütçe / plan özeti dropdown: sadece sohbet planlamasında */
  const planSlotForHeader = chatSohbetChrome ? planWorkspaceSlot : null;

  const planContextForApi = useMemo(() => {
    const base = {
      chatFlowPhase: chatSohbetChrome ? chatFlowPhase : 'suggesting',
    };
    if (!chatSohbetChrome) return base;
    const merged = mergeTripMetaForChips(tripMeta, readTripMetaSnapshot());
    return {
      ...base,
      atlasTripMeta: {
        destination: String(merged.destination ?? '').trim(),
        datesChipText: String(merged.datesChipText ?? '').trim(),
        nights: merged.nights != null ? Number(merged.nights) : 0,
        month: String(merged.month ?? '').trim(),
        travelers: merged.travelers != null ? merged.travelers : null,
        paxChipText: String(merged.paxChipText ?? '').trim(),
        budget: String(merged.budget ?? '').trim(),
        travelType: String(merged.travelType ?? '').trim(),
      },
      atlasNotes: readTripNotesFromLs(),
    };
  }, [chatSohbetChrome, chatFlowPhase, tripMeta, chipTick]);

  const chatOverflowActions = useMemo(() => {
    if (!chatSohbetChrome || activeChat?.id == null) return null;
    return {
      onShare: handleShareChat,
      onCreateTrip: handleCreateTripFromChat,
      onArchive: handleArchiveChat,
      onDelete: handleDeleteChat,
    };
  }, [
    chatSohbetChrome,
    activeChat?.id,
    handleShareChat,
    handleCreateTripFromChat,
    handleArchiveChat,
    handleDeleteChat,
  ]);

  return (
    <div style={s.shell}>
      <AppSidebar
        activeId={sidebarActiveId}
        uiMode={uiMode}
        highlightChatId={highlightChatId}
        highlightTripId={highlightTripId}
      />

      <div className="main-layout" style={s.main}>
        {headerVariant === 'tripDetail' ? (
          <TripRouteHeader planName={planName} tripMeta={tripMeta} backHref="/trips" />
        ) : (
          <Header
            planName={planName}
            tripMeta={tripMeta}
            onTripMetaChange={setTripMeta}
            assistantSignal={assistantSignal}
            savedPlans={savedPlans}
            activePlanId={activePlanId}
            onNewPlan={handleNewPlan}
            onSwitchPlan={handleSwitchPlan}
            onActivateStoredTrip={handleActivateStoredTrip}
            onPickTripFromPlanMenu={chatSohbetChrome ? handlePickTripFromPlanMenu : undefined}
            planWorkspaceSlot={planSlotForHeader}
            onPlanNameChange={handlePlanNameChange}
            atlasAskMode={chatSohbetChrome}
            onAtlasAskFromFilters={(msg) => {
              void chatAreaRef.current?.sendAtlasFilterPrompt?.(msg);
            }}
            planDropdownMinimal={chatSohbetChrome}
            linkedTripIdForPlanMenu={
              chatSohbetChrome && activeChat?.tripId ? String(activeChat.tripId) : null
            }
            activeChatIdForPlanMenu={chatSohbetChrome ? activeChat?.id ?? null : null}
            activeChatTripIdForPlanMenu={
              chatSohbetChrome && activeChat?.tripId ? String(activeChat.tripId) : null
            }
            hideFilterChipBar={chatSohbetChrome}
            budgetTotal={
              chatSohbetChrome
                ? Object.values(budget).reduce((a, b) => a + (Number(b) || 0), 0)
                : 0
            }
            bookedCount={chatSohbetChrome ? bookedServices.size : 0}
          />
        )}

        <div className="content-area">
          <div style={s.center}>
            {quickPlanMode ? (
              <QuickPlanForm
                mode={quickPlanMode}
                onClose={() => setQuickPlanMode(null)}
                onSubmit={async (text) => {
                  await chatAreaRef.current?.sendQuickPlanMessage?.(text);
                  setQuickPlanMode(null);
                }}
              />
            ) : null}
            <ChatArea
              ref={chatAreaRef}
              key={feedKey}
              chatId={feedKey}
              initialMessages={feedMessages}
              onMessagesChange={handleMessagesChange}
              onAssistantResponse={handleAssistantResponse}
              onListingSelect={handleListingSelect}
              onListingDeselect={handleListingDeselect}
              selectedListings={selectedListings}
              listingHighlightFromMapKey={listingHighlightFromMapKey}
              onListingHoverKey={(k) => {
                setHoveredListingKey(k);
                if (k) setListingHighlightFromMapKey(null);
              }}
              submitButtonLabel="Gönder"
              submitIconOnly={chatSohbetChrome}
              planContextForApi={planContextForApi}
              noWelcomeWhenEmpty
              emptyHero={emptyHero}
              chatOverflowActions={chatOverflowActions}
              showComposerTokens={chatSohbetChrome}
              tripMetaForTokens={mergedTripMetaForGate}
              boundTrip={
                chatSohbetChrome && activeChat?.tripId
                  ? {
                      id: String(activeChat.tripId),
                      name:
                        findMergedTripById(activeChat.tripId)?.name ||
                        activeChat?.tripName ||
                        'Planınıza',
                    }
                  : null
              }
            />
          </div>

          <aside
            className="ta-panel"
            style={{
              ...s.right,
              ...(headerVariant === 'tripDetail'
                ? { overflowY: 'hidden', overflowX: 'hidden' }
                : {}),
            }}
          >
            {chatSohbetChrome ? (
              <div style={s.feedSplit}>
                <div
                  style={{
                    ...s.feedPane,
                    ...(mapVisible ? s.feedPaneShrunk : {}),
                  }}
                >
                  <RightPanelFeed
                    destination={tripMeta?.destination || ''}
                    onPickCity={(city) => {
                      chatAreaRef.current?.sendAtlasFilterPrompt?.(
                        `${city} hakkında daha fazla göster — neler önerirsin?`
                      );
                    }}
                    onShowOnMap={(city) => {
                      setMapVisible(true);
                      if (city) {
                        try {
                          fetch(`/api/places/geocode?address=${encodeURIComponent(appendRegionalGeocodeContext(city))}`)
                            .then((r) => r.json())
                            .then((j) => {
                              if (j?.lat != null && j?.lng != null) {
                                setGeoCenter({ lat: j.lat, lng: j.lng });
                                setMapFocusRequest({ lat: j.lat, lng: j.lng, at: Date.now() });
                              }
                            })
                            .catch(() => {});
                        } catch {
                          /* ignore */
                        }
                      }
                    }}
                  />
                </div>
                {mapVisible ? (
                  <div style={s.mapPane}>
                    <button
                      type="button"
                      style={s.mapCloseBtn}
                      onClick={() => setMapVisible(false)}
                      aria-label="Haritayı kapat"
                    >
                      ×
                    </button>
                    <RightPanel
                      completedModules={completedModules}
                      markers={mapMarkers}
                      hideMapOverlay
                      googleMap={{
                        center: geoCenter,
                        markers: chatGoogleMarkers,
                        zoom: 12,
                        focusRequest: mapFocusRequest,
                        onMarkerClick: handleMapMarkerClick,
                      }}
                    />
                  </div>
                ) : null}
              </div>
            ) : (
              <RightPanel
                completedModules={completedModules}
                markers={mapMarkers}
                hideMapOverlay={headerVariant === 'tripDetail'}
                googleMap={{
                  center: geoCenter,
                  markers: chatGoogleMarkers,
                  zoom: 12,
                  focusRequest: mapFocusRequest,
                  onMarkerClick: handleMapMarkerClick,
                }}
                mapHeadline={tripMeta.destination ? `Harita · ${tripMeta.destination}` : 'Harita görünümü'}
                mapSubline={resolvedMapPins.length ? `${resolvedMapPins.length} öneri` : ''}
              />
            )}
            {headerVariant === 'tripDetail' ? (
              <div style={{ flexShrink: 0, overflowY: 'auto', minHeight: 0 }}>
                <TripToolsGrid />
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}

const s = {
  shell: {
    display: 'flex',
    height: '100%',
    minHeight: 0,
    overflow: 'hidden',
    background: 'var(--bg)',
  },
  main: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    overflow: 'hidden',
  },
  center: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    minHeight: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  right: {
    width: 360,
    flexShrink: 0,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
    padding: 'var(--space-3)',
    boxSizing: 'border-box',
    minHeight: 0,
    overflowY: 'auto',
  },
  feedSplit: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
  },
  feedPane: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    transition: 'flex var(--duration-slow) var(--ease-out)',
  },
  feedPaneShrunk: {
    flex: '0 1 45%',
    minHeight: 220,
  },
  mapPane: {
    position: 'relative',
    flex: '1 1 50%',
    minHeight: 220,
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(31,77,92,0.12)',
    boxShadow: '0 10px 28px rgba(31,77,92,0.08)',
    display: 'flex',
    flexDirection: 'column',
    animation: 'feedMapSlide var(--duration-slow) var(--ease-out)',
  },
  mapCloseBtn: {
    position: 'absolute',
    top: 'var(--space-3)',
    left: 'var(--space-3)',
    zIndex: 3,
    width: 30,
    height: 30,
    borderRadius: '50%',
    border: 'none',
    background: 'var(--ta-ink)',
    cursor: 'pointer',
    fontSize: 20,
    fontWeight: 'var(--fw-bold)',
    lineHeight: 1,
    color: '#fff',
    boxShadow: '0 6px 16px rgba(31,77,92,0.28)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 2,
  },
};
