'use client';

import { useState, useEffect, useMemo, useCallback, useRef, useLayoutEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeftRight,
  SlidersHorizontal,
  Heart,
  Bookmark,
  Share2,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Plane,
  Star,
  Sparkles,
  Hotel,
  MapPin,
  Calendar,
  Users,
} from 'lucide-react';
import {
  useIsPhoneLayout,
  useIsCompactSearchLayout,
  useSearchMapSplitWide,
} from '@/components/SearchScreenPrimitives';
import { useLocaleCurrency } from '@/components/LocaleCurrencyContext';
import QuickPlanMap from '@/components/QuickPlanMap';
import StaySearchScreen from '@/components/StaySearchScreen';
import TourLodgingToolbar, { tourAirportBoxLine } from '@/components/TourLodgingToolbar';
import {
  QuickPlanCalendarPopover,
  QuickPlanAirportPickerPanel,
  QuickPlanFlightPaxPanel,
  formatShortRangeTR,
  formatSingleDateTR,
} from '@/components/QuickPlanAnchoredWidgets';
import { useQuickPlanBarDismiss } from '@/hooks/useQuickPlanBarDismiss';
import { airportFromStatic, normalizeIata, centerFromMarkers } from '@/lib/airportsGeo';
import { qp } from '@/lib/quickPlanFilterStyles';
import { datePanelCoords, popoverCoords } from '@/lib/popoverCoords';

function parseHm(t) {
  if (!t || typeof t !== 'string') return 0;
  const [h, m] = t.split(':').map((x) => Number(x));
  if (Number.isNaN(h)) return 0;
  return h * 60 + (Number.isNaN(m) ? 0 : m);
}

function fmtDuration(min) {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h <= 0) return `${m} dk`;
  if (m === 0) return `${h} sa`;
  return `${h} sa ${m} dk`;
}

function fmtPrice(n, currency, locale = 'tr-TR') {
  const cur = currency === 'TRY' || currency === 'TRL' ? '₺' : currency === 'EUR' ? '€' : currency === 'USD' ? '$' : `${currency} `;
  const rounded = Math.round(Number(n) || 0);
  if (cur.length <= 2) return `${cur}${rounded.toLocaleString(locale)}`;
  return `${cur}${rounded.toLocaleString(locale)}`;
}

function fmtNavDayTR(iso) {
  if (!iso) return '';
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'short' });
}

function addDaysIso(iso, delta) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

function fmtRouteLabel(originCode, destCode) {
  const o = normalizeIata(originCode);
  const d = normalizeIata(destCode);
  const a1 = airportFromStatic(o);
  const a2 = airportFromStatic(d);
  const shortCity = (name) => {
    if (!name) return '';
    const i = name.indexOf('(');
    return (i > 0 ? name.slice(0, i) : name).trim();
  };
  const left = a1 ? shortCity(a1.name) : o;
  const right = a2 ? shortCity(a2.name) : d;
  return `${left} → ${right}`;
}

function cityFromAirportCode(code) {
  const ap = airportFromStatic(normalizeIata(code));
  if (!ap?.name) return 'İstanbul';
  let n = ap.name.replace(/\s*\([^)]+\)\s*$/, '').trim();
  n = n.replace(/\s*Havalimanı.*$/i, '').trim();
  n = n.replace(/\s+Airport.*$/i, '').trim();
  return n || 'İstanbul';
}

function tourLodgingSeed(origin, destination, dateOut, dateIn) {
  const s = `${normalizeIata(origin)}|${normalizeIata(destination)}|${dateOut}|${dateIn}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return Math.abs(h) % 2147483646 || 1;
}

function tourPackageTitle(hotelName, includeCar) {
  return `${hotelName} + Uçuş${includeCar ? ' + Araç' : ''}`;
}

const HOTELS = [
  { title: 'Radisson Blu', sub: 'İstanbul · 5★', nights: '3 gece' },
  { title: 'Rixos Premium', sub: 'Antalya · 5★', nights: '5 gece' },
  { title: 'Argos in Cappadocia', sub: 'Nevşehir · 4★', nights: '2 gece' },
];

const CARS = [
  { title: 'Küçük sınıf', sub: 'Ekonomi · 2-4 kişi' },
  { title: 'Standart', sub: 'Orta · 4-5 kişi' },
  { title: 'Büyük / SUV', sub: 'Geniş bagaj · 5-7 kişi' },
];

function SkeletonCards({ compact }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[1, 2, 3, 4, 5].map((k) => (
        <div
          key={k}
          className="ta-flight-skel"
          style={{
            background: '#fff',
            border: '1px solid rgba(0,0,0,.08)',
            borderRadius: 12,
            padding: 18,
            display: 'grid',
            gridTemplateColumns: compact ? '1fr' : '140px 1fr 120px',
            gap: 16,
          }}
        >
          <div style={{ height: 48, background: '#eee', borderRadius: 8 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ height: 14, background: '#eee', borderRadius: 4, width: '70%' }} />
            <div style={{ height: 12, background: '#f0f0f0', borderRadius: 4, width: '50%' }} />
          </div>
          <div style={{ height: 40, background: '#eee', borderRadius: 8 }} />
        </div>
      ))}
    </div>
  );
}

export default function FlightSearchScreen({
  /** Üst bar başlığı (ör. tur sayfasında "Turlar") */
  title = 'Uçuş',
  /** true ise gidiş-dönüş / tek yön seçimi gösterilmez; her zaman gidiş+dönüş aranır */
  hideTripTypeToggle = false,
  /** true: üst şerit uçuş filtresi kalır, sonuçlar konaklama (otel) kartlarıdır */
  lodgingTourResults = false,
} = {}) {
  const { currency: prefCurrency, locale } = useLocaleCurrency();
  const isPhone = useIsPhoneLayout();
  const isCompact = useIsCompactSearchLayout();
  const splitWide = useSearchMapSplitWide(1100);
  const [tripType, setTripType] = useState('round');
  const effectiveTripType = hideTripTypeToggle ? 'round' : tripType;
  const [origin, setOrigin] = useState('AYT');
  const [destination, setDestination] = useState('IST');
  const [dateOut, setDateOut] = useState(() => new Date().toISOString().slice(0, 10));
  const [dateIn, setDateIn] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().slice(0, 10);
  });
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infantsLap, setInfantsLap] = useState(0);
  const [infantsSeat, setInfantsSeat] = useState(0);
  /** Tur konaklama: her odanın yetişkin/çocuk sayısı */
  const [lodgingGuestRooms, setLodgingGuestRooms] = useState(() => [
    { adults: 1, children: 0, infantsLap: 0, infantsSeat: 0 },
  ]);
  const [cabin, setCabin] = useState('ECONOMY');

  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [rawFlights, setRawFlights] = useState([]);
  /** Konaklama aramasını tetikler; seed gidiş gününü tarih seçicideki gün ile eşler (stale browseDate sorunu olmaz) */
  const [stayTourKick, setStayTourKick] = useState(() => ({ n: 0, seed: 0 }));
  const [mockBanner, setMockBanner] = useState(false);
  const [includeCarAddon, setIncludeCarAddon] = useState(false);
  const [savedIds, setSavedIds] = useState(() => new Set());
  const [likedIds, setLikedIds] = useState(() => new Set());

  const [sortTab, setSortTab] = useState('cheap');
  const [stopDirect, setStopDirect] = useState(true);
  const [stopOne, setStopOne] = useState(true);
  const [stopTwoPlus, setStopTwoPlus] = useState(true);
  const [airlinePick, setAirlinePick] = useState({});
  const [depRange, setDepRange] = useState([0, 24 * 60 - 1]);
  const [arrRange, setArrRange] = useState([0, 24 * 60 - 1]);
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [durRange, setDurRange] = useState([0, 24 * 60]);
  const [bounds, setBounds] = useState({
    price: [0, 50000],
    dur: [30, 800],
    dep: [0, 24 * 60 - 1],
    arr: [0, 24 * 60 - 1],
  });

  const [filterDrawer, setFilterDrawer] = useState(false);
  const [flightMapMarkers, setFlightMapMarkers] = useState([]);
  const [browseDate, setBrowseDate] = useState(() => new Date().toISOString().slice(0, 10));

  const flightBarRef = useRef(null);
  const originBtnRef = useRef(null);
  const destBtnRef = useRef(null);
  const dateBtnRef = useRef(null);
  const paxBtnRef = useRef(null);
  const origPopoverRef = useRef(null);
  const destPopoverRef = useRef(null);
  const datePopoverRef = useRef(null);
  const paxPopoverRef = useRef(null);

  const [airWhich, setAirWhich] = useState(null);
  const [airQuery, setAirQuery] = useState('');
  const [airPopLayout, setAirPopLayout] = useState({ top: 0, left: 0, width: 'min(340px, calc(100vw - 20px))' });

  const [datePopOpen, setDatePopOpen] = useState(false);
  const [datePopLayout, setDatePopLayout] = useState({ top: 0, left: 10 });

  const [paxPopOpen, setPaxPopOpen] = useState(false);
  const [paxPopLayout, setPaxPopLayout] = useState({ top: 0, left: 0, width: 'min(380px, calc(100vw - 20px))' });

  const closeQuickFlightPanels = useCallback(() => {
    setAirWhich(null);
    setDatePopOpen(false);
    setPaxPopOpen(false);
  }, []);

  useLayoutEffect(() => {
    if (!airWhich) return undefined;
    const el = airWhich === 'o' ? originBtnRef.current : destBtnRef.current;
    function u() {
      setAirPopLayout({ ...popoverCoords(el, 340), width: 'min(340px, calc(100vw - 20px))' });
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
    if (!datePopOpen) return undefined;
    const el = dateBtnRef.current;
    function u() {
      setDatePopLayout(datePanelCoords(el, 504));
    }
    u();
    window.addEventListener('resize', u);
    window.addEventListener('scroll', u, true);
    return () => {
      window.removeEventListener('resize', u);
      window.removeEventListener('scroll', u, true);
    };
  }, [datePopOpen]);

  useLayoutEffect(() => {
    if (!paxPopOpen) return undefined;
    const el = paxBtnRef.current;
    function u() {
      setPaxPopLayout({ ...popoverCoords(el, 380), width: 'min(380px, calc(100vw - 20px))' });
    }
    u();
    window.addEventListener('resize', u);
    window.addEventListener('scroll', u, true);
    return () => {
      window.removeEventListener('resize', u);
      window.removeEventListener('scroll', u, true);
    };
  }, [paxPopOpen]);

  const quickFlightPanelsOpen =
    !lodgingTourResults && !!(airWhich || datePopOpen || paxPopOpen);

  const ignoreQuickFlightPointer = useCallback(
    (t) =>
      !!(flightBarRef.current?.contains(t)) ||
      !!(origPopoverRef.current?.contains(t)) ||
      !!(destPopoverRef.current?.contains(t)) ||
      !!(datePopoverRef.current?.contains(t)) ||
      !!(paxPopoverRef.current?.contains(t)),
    []
  );

  useQuickPlanBarDismiss(quickFlightPanelsOpen, ignoreQuickFlightPointer, closeQuickFlightPanels);

  const flightMapCenter = useMemo(() => centerFromMarkers(flightMapMarkers), [flightMapMarkers]);

  const mapsKey = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY : '';
  const showFlightMapUi = !!mapsKey && flightMapMarkers.length > 0;

  useEffect(() => {
    if (!lodgingTourResults) return;
    const ta = lodgingGuestRooms.reduce((s, r) => s + (Number(r.adults) || 0), 0);
    const tc = lodgingGuestRooms.reduce((s, r) => s + (Number(r.children) || 0), 0);
    const til = lodgingGuestRooms.reduce((s, r) => s + (Number(r.infantsLap) || 0), 0);
    const tis = lodgingGuestRooms.reduce((s, r) => s + (Number(r.infantsSeat) || 0), 0);
    setAdults(Math.max(1, ta));
    setChildren(tc);
    setInfantsLap(til);
    setInfantsSeat(tis);
  }, [lodgingTourResults, lodgingGuestRooms]);

  useEffect(() => {
    if (lodgingTourResults) return;
    if (!hasSearched || !mapsKey) {
      setFlightMapMarkers([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const o = normalizeIata(origin);
      const d = normalizeIata(destination);
      const out = [];
      const pushStatic = (code, leg) => {
        const s = airportFromStatic(code);
        if (s) {
          out.push({
            id: `ap-${code}`,
            lat: s.lat,
            lng: s.lng,
            title: s.name,
            price: leg,
          });
        }
      };
      if (o === d) {
        pushStatic(o, 'Kalkış / Varış');
      } else {
        pushStatic(o, 'Kalkış');
        pushStatic(d, 'Varış');
      }

      async function geocodeLeg(code, leg) {
        if (airportFromStatic(code)) return;
        try {
          const r = await fetch(
            `/api/places/geocode?address=${encodeURIComponent(`${code} Airport`)}`
          );
          const j = await r.json();
          if (cancelled || j.lat == null || j.lng == null) return;
          if (out.some((x) => x.id === `ap-${code}`)) return;
          out.push({
            id: `ap-${code}`,
            lat: j.lat,
            lng: j.lng,
            title: `${code} · Havalimanı`,
            price: leg,
          });
        } catch (e) {
          console.error('Airport geocode', e);
        }
      }

      if (o === d) {
        await geocodeLeg(o, 'Kalkış / Varış');
      } else {
        await geocodeLeg(o, 'Kalkış');
        await geocodeLeg(d, 'Varış');
      }

      if (!cancelled) setFlightMapMarkers(out);
    })();
    return () => {
      cancelled = true;
    };
  }, [hasSearched, origin, destination, mapsKey, lodgingTourResults]);

  const airlines = useMemo(() => {
    const m = new Map();
    rawFlights.forEach((f) => {
      const key = f.airline || f.airlineCode || '?';
      if (!m.has(key)) m.set(key, f.airlineCode || key);
    });
    return Array.from(m.entries()).map(([name, code]) => ({ name, code }));
  }, [rawFlights]);

  useEffect(() => {
    if (!rawFlights.length) {
      setBounds({
        price: [0, 50000],
        dur: [30, 800],
        dep: [0, 24 * 60 - 1],
        arr: [0, 24 * 60 - 1],
      });
      setAirlinePick({});
      return;
    }
    let pMin = Infinity;
    let pMax = -Infinity;
    let dMin = Infinity;
    let dMax = -Infinity;
    let depMn = Infinity;
    let depMx = -Infinity;
    let arrMn = Infinity;
    let arrMx = -Infinity;
    for (const f of rawFlights) {
      pMin = Math.min(pMin, f.price);
      pMax = Math.max(pMax, f.price);
      dMin = Math.min(dMin, f.duration);
      dMax = Math.max(dMax, f.duration);
      const dm = parseHm(f.departure);
      const am = parseHm(f.arrival);
      depMn = Math.min(depMn, dm);
      depMx = Math.max(depMx, dm);
      arrMn = Math.min(arrMn, am);
      arrMx = Math.max(arrMx, am);
    }
    const pb = [Math.floor(pMin), Math.ceil(pMax)];
    const db = [Math.floor(dMin), Math.ceil(dMax)];
    const deb = [Math.max(0, depMn - 60), Math.min(24 * 60 - 1, depMx + 60)];
    const arb = [Math.max(0, arrMn - 60), Math.min(24 * 60 - 1, arrMx + 60)];
    setBounds({ price: pb, dur: db, dep: deb, arr: arb });
    setPriceRange(pb);
    setDurRange(db);
    setDepRange(deb);
    setArrRange(arb);
    const next = {};
    const list = [];
    const seen = new Set();
    rawFlights.forEach((f) => {
      const name = f.airline || f.airlineCode || '?';
      if (!seen.has(name)) {
        seen.add(name);
        list.push({ name, code: f.airlineCode || name });
      }
    });
    list.forEach((a) => {
      next[a.name] = true;
    });
    setAirlinePick(next);
  }, [rawFlights]);

  const filteredSorted = useMemo(() => {
    let list = rawFlights.filter((f) => {
      const stops = f.stops ?? 0;
      const okStop =
        (stops === 0 && stopDirect) ||
        (stops === 1 && stopOne) ||
        (stops >= 2 && stopTwoPlus);
      if (!okStop) return false;
      const name = f.airline || '';
      if (airlines.length && airlinePick[name] === false) return false;
      const dm = parseHm(f.departure);
      const am = parseHm(f.arrival);
      if (dm < depRange[0] || dm > depRange[1]) return false;
      if (am < arrRange[0] || am > arrRange[1]) return false;
      if (f.price < priceRange[0] || f.price > priceRange[1]) return false;
      if (f.duration < durRange[0] || f.duration > durRange[1]) return false;
      return true;
    });

    if (sortTab === 'cheap') {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortTab === 'short') {
      list = [...list].sort((a, b) => a.duration - b.duration);
    } else {
      const byP = [...list].sort((a, b) => a.price - b.price);
      const byD = [...list].sort((a, b) => a.duration - b.duration);
      const r = (arr, id) => arr.findIndex((x) => x.id === id);
      list = [...list].sort(
        (a, b) => r(byP, a.id) + r(byD, a.id) - (r(byP, b.id) + r(byD, b.id))
      );
    }
    return list;
  }, [
    rawFlights,
    stopDirect,
    stopOne,
    stopTwoPlus,
    airlinePick,
    airlines.length,
    depRange,
    arrRange,
    priceRange,
    durRange,
    sortTab,
  ]);

  const splitFlightDesktop =
    hasSearched && splitWide && !loading && filteredSorted.length > 0 && showFlightMapUi;

  const tourStayEmbedConfig = useMemo(
    () => ({
      requestId: stayTourKick.n,
      city: cityFromAirportCode(destination),
      mockSeed: stayTourKick.seed,
      listedHotelTitle: (h) => tourPackageTitle(h.name, includeCarAddon),
    }),
    [stayTourKick.n, stayTourKick.seed, destination, includeCarAddon]
  );

  const search = useCallback(
    async (outDateOverride) => {
      const outD = outDateOverride != null ? outDateOverride : dateOut;
      setBrowseDate(outD);
      if (outDateOverride != null) setDateOut(outDateOverride);
      if (lodgingTourResults) {
        setHasSearched(true);
        const seed = tourLodgingSeed(origin, destination, outD, dateIn);
        setStayTourKick((prev) => ({ n: prev.n + 1, seed }));
        return;
      }
      setLoading(true);
      setHasSearched(true);
      setMockBanner(false);
      try {
        const res = await fetch('/api/flights/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            origin: origin.trim(),
            destination: destination.trim(),
            date: outD,
            returnDate: effectiveTripType === 'round' ? dateIn : null,
            adults,
            children,
            infants: infantsLap + infantsSeat,
            cabinClass: cabin,
            currency: prefCurrency,
          }),
        });
        const data = await res.json();
        setRawFlights(Array.isArray(data.flights) ? data.flights : []);
        setMockBanner(Boolean(data.mock));
      } catch {
        setRawFlights([]);
      } finally {
        setLoading(false);
      }
    },
    [
      lodgingTourResults,
      origin,
      destination,
      dateOut,
      dateIn,
      effectiveTripType,
      adults,
      children,
      infantsLap,
      infantsSeat,
      cabin,
      prefCurrency,
    ]
  );

  const shiftFlightBrowseDay = useCallback(
    (delta) => {
      const iso = addDaysIso(browseDate, delta);
      search(iso);
    },
    [browseDate, search]
  );

  const routeLine = useMemo(() => fmtRouteLabel(origin, destination), [origin, destination]);
  const browsePrevIso = useMemo(() => addDaysIso(browseDate, -1), [browseDate]);
  const browseNextIso = useMemo(() => addDaysIso(browseDate, 1), [browseDate]);

  function swapAirports() {
    const t = origin;
    setOrigin(destination);
    setDestination(t);
  }

  function openFlightAir(which) {
    setDatePopOpen(false);
    setPaxPopOpen(false);
    setAirWhich((prev) => (prev === which ? null : which));
    setAirQuery(which === 'o' ? origin : destination);
  }

  function toggleAirline(name) {
    setAirlinePick((prev) => ({ ...prev, [name]: !prev[name] }));
  }

  const filterPanelBody = (
    <>
      <div style={{ ...st.filterTitle, marginTop: 0 }}>Sıralama</div>
      <div style={st.tabs}>
        {[
          { id: 'cheap', label: 'En ucuz' },
          { id: 'best', label: 'En iyi' },
          { id: 'short', label: 'En kısa' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSortTab(t.id)}
            style={{
              ...st.tabBtn,
              ...(sortTab === t.id ? st.tabBtnOn : {}),
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

          <div style={st.filterTitle}>Kabin</div>
          <div style={st.tabs}>
            <button
              type="button"
              onClick={() => setCabin('ECONOMY')}
              style={{
                ...st.tabBtn,
                ...(cabin === 'ECONOMY' ? st.tabBtnOn : {}),
              }}
            >
              Ekonomi
            </button>
            <button
              type="button"
              onClick={() => setCabin('BUSINESS')}
              style={{
                ...st.tabBtn,
                ...(cabin === 'BUSINESS' ? st.tabBtnOn : {}),
              }}
            >
              Business
            </button>
          </div>

          <div style={st.filterTitle}>Aktarma</div>
          <label style={st.ckRow}>
            <input type="checkbox" checked={stopDirect} onChange={(e) => setStopDirect(e.target.checked)} />
            Direkt
          </label>
          <label style={st.ckRow}>
            <input type="checkbox" checked={stopOne} onChange={(e) => setStopOne(e.target.checked)} />
            1 aktarma
          </label>
          <label style={st.ckRow}>
            <input type="checkbox" checked={stopTwoPlus} onChange={(e) => setStopTwoPlus(e.target.checked)} />
            2+ aktarma
          </label>

          <div style={st.filterTitle}>Kalkış saati</div>
          <RangeDual
            min={bounds.dep[0]}
            max={bounds.dep[1]}
            value={depRange}
            onChange={setDepRange}
            format={(v) => {
              const h = Math.floor(v / 60);
              const m = v % 60;
              return `${h}:${String(m).padStart(2, '0')}`;
            }}
          />

          <div style={st.filterTitle}>İniş saati</div>
          <RangeDual
            min={bounds.arr[0]}
            max={bounds.arr[1]}
            value={arrRange}
            onChange={setArrRange}
            format={(v) => {
              const h = Math.floor(v / 60);
              const m = v % 60;
              return `${h}:${String(m).padStart(2, '0')}`;
            }}
          />

          <div style={st.filterTitle}>Havayolu</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
            {airlines.map((a) => (
              <label key={a.name} style={st.ckRow}>
                <input
                  type="checkbox"
                  checked={airlinePick[a.name] !== false}
                  onChange={() => toggleAirline(a.name)}
                />
                <span style={{ marginLeft: 6 }}>{a.name}</span>
                <span style={{ color: 'var(--ta-ink-subtle)', fontSize: 11, marginLeft: 4 }}>({a.code})</span>
              </label>
            ))}
            {!airlines.length ? <span style={st.mutedSm}>Sonuç yok</span> : null}
          </div>

      <div style={st.filterTitle}>Fiyat</div>
      <RangeDual
        min={bounds.price[0]}
        max={Math.max(bounds.price[1], bounds.price[0] + 1)}
        value={priceRange}
        onChange={setPriceRange}
        format={(v) => `₺${Math.round(v).toLocaleString('tr-TR')}`}
      />

          <div style={st.filterTitle}>Süre</div>
          <RangeDual
            min={bounds.dur[0]}
            max={Math.max(bounds.dur[1], bounds.dur[0] + 1)}
            value={durRange}
            onChange={setDurRange}
            format={(v) => fmtDuration(v)}
          />
    </>
  );

  const filterPanel = (
    <div style={st.filterCol}>
      <div style={st.filterPanelHeading}>Filtreler</div>
      {filterPanelBody}
    </div>
  );

  const flightListBody = (
    <>
      {isCompact && hasSearched && !lodgingTourResults ? (
        <button type="button" style={st.mobileFilterFab} onClick={() => setFilterDrawer(true)}>
          <SlidersHorizontal size={18} />
          Filtreler
        </button>
      ) : null}

      {hasSearched ? (
        <div style={st.dateNavWrap}>
          <div style={st.dateNavPanel} role="navigation" aria-label="Gidiş tarihi">
            <button
              type="button"
              style={st.dateNavBtn}
              disabled={loading}
              onClick={() => shiftFlightBrowseDay(-1)}
            >
              <ChevronLeft size={18} />
              <span>{fmtNavDayTR(browsePrevIso)}</span>
            </button>
            <div style={st.dateNavCenter}>
              <span style={st.dateNavRoute}>{routeLine}</span>
              <span style={st.dateNavDay}>{fmtNavDayTR(browseDate)}</span>
            </div>
            <button
              type="button"
              style={st.dateNavBtn}
              disabled={loading}
              onClick={() => shiftFlightBrowseDay(1)}
            >
              <span>{fmtNavDayTR(browseNextIso)}</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      ) : null}

      {mockBanner ? (
        <div style={st.mockNote}>Örnek veriler gösteriliyor (Amadeus anahtarı yok veya API hatası).</div>
      ) : null}

      {!hasSearched ? (
        <div style={st.empty}>
          <span style={st.emptyPlane} aria-hidden>
            <Plane size={52} strokeWidth={1.4} color="var(--ta-accent-deep)" />
          </span>
          <p style={st.emptyTitle}>{title}</p>
          <p style={st.emptySub}>
            {hideTripTypeToggle
              ? 'Havalimanı kodlarıyla arayın, gidiş ve dönüş tarihlerini seçin, fiyatları karşılaştırın.'
              : 'Havalimanı kodlarıyla arayın; gidiş-dönüş veya tek yön seçin, fiyatları karşılaştırın.'}
          </p>
        </div>
      ) : loading ? (
        <SkeletonCards compact={isPhone} />
      ) : filteredSorted.length === 0 ? (
        <div style={st.empty}>
          <span style={st.emptyPlane} aria-hidden>
            <Plane size={52} strokeWidth={1.4} color="var(--ta-accent-deep)" />
          </span>
          <p style={st.emptyTitle}>Bu filtrelere uygun uçuş yok</p>
          <p style={st.emptySub}>Fiyat aralığını veya sıralamayı yeniden deneyin.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredSorted.map((f) => (
            <article
              key={f.id}
              style={{
                ...st.card,
                ...(isPhone ? st.cardMobile : {}),
              }}
              className="ta-stay-card"
            >
              <div style={st.cardLeft}>
                <div style={st.logoCircle}>{(f.airlineCode || 'TA').slice(0, 2)}</div>
                <div>
                  <div style={st.airlineName}>{f.airline}</div>
                  <div style={st.airlineCode}>{f.airlineCode}</div>
                </div>
              </div>
              <div style={st.cardMid}>
                <div style={st.timeRow}>
                  <span style={st.timeBig}>{f.departure}</span>
                  <span style={st.timeSep}>→</span>
                  <span style={st.timeBig}>{f.arrival}</span>
                </div>
                <div style={st.metaRow}>
                  {fmtDuration(f.duration)}
                  <span style={st.dot}>·</span>
                  {f.direct || f.stops === 0 ? 'Direkt' : `${f.stops} aktarma`}
                  <span style={st.dot}>·</span>
                  {f.departureCode} — {f.arrivalCode}
                </div>
                <div style={st.cabinFoot}>{f.cabinLabel || f.cabin}</div>
              </div>
              <div style={{ ...st.cardRight, ...(isPhone ? { textAlign: 'left' } : {}) }}>
                <div style={st.price}>{fmtPrice(f.price, f.currency, locale)}</div>
                <button type="button" style={{ ...st.selectBtn, maxWidth: isPhone ? '100%' : undefined }}>
                  Seçin
                </button>
                <div style={{ ...st.cardActions, justifyContent: isPhone ? 'flex-start' : 'flex-end' }}>
                  <button
                    type="button"
                    style={st.iconAct}
                    onClick={() => {
                      const text = `${f.airline} ${f.departure}-${f.arrival} ${fmtPrice(f.price, f.currency, locale)}`;
                      if (navigator.share) navigator.share({ title: 'Uçuş', text }).catch(() => {});
                      else navigator.clipboard?.writeText(text);
                    }}
                    aria-label="Paylaş"
                  >
                    <Share2 size={16} color="var(--ta-ink-subtle)" />
                    Paylaş
                  </button>
                  <button
                    type="button"
                    style={st.iconAct}
                    onClick={() =>
                      setSavedIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(f.id)) next.delete(f.id);
                        else next.add(f.id);
                        return next;
                      })
                    }
                    aria-label="Kaydet"
                  >
                    <Bookmark
                      size={16}
                      color={savedIds.has(f.id) ? 'var(--ta-accent-deep)' : 'var(--ta-ink-subtle)'}
                      fill={savedIds.has(f.id) ? 'var(--ta-accent-deep)' : 'transparent'}
                    />
                    Kaydet
                  </button>
                  <button
                    type="button"
                    style={st.iconAct}
                    onClick={() =>
                      setLikedIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(f.id)) next.delete(f.id);
                        else next.add(f.id);
                        return next;
                      })
                    }
                    aria-label="Beğen"
                  >
                    <Heart
                      size={16}
                      color={likedIds.has(f.id) ? 'var(--ta-accent-deep)' : 'var(--ta-ink-subtle)'}
                      fill={likedIds.has(f.id) ? 'var(--ta-accent-deep)' : 'transparent'}
                    />
                    Beğen
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {hasSearched && !loading ? (
        <>
          <section style={st.section}>
            <h2 style={st.sectionTitle}>Yakınındaki tesisler</h2>
            <div style={{ ...st.cardRow, gridTemplateColumns: isPhone ? '1fr' : 'repeat(3, 1fr)' }}>
              {HOTELS.map((h) => (
                <Link key={h.title} href="/stay" className="ta-flight-promo" style={st.promoCard}>
                  <div style={st.promoStars} aria-hidden>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={12} fill="var(--ta-accent)" stroke="var(--ta-accent)" />
                    ))}
                  </div>
                  <div style={st.promoTitle}>{h.title}</div>
                  <div style={st.promoSub}>{h.sub}</div>
                  <div style={st.promoTag}>{h.nights}</div>
                </Link>
              ))}
            </div>
          </section>
          <section style={st.section}>
            <h2 style={st.sectionTitle}>Araçla gezin</h2>
            <div style={{ ...st.cardRow, gridTemplateColumns: isPhone ? '1fr' : 'repeat(3, 1fr)' }}>
              {CARS.map((c) => (
                <Link key={c.title} href="/cars" className="ta-flight-promo" style={st.promoCard}>
                  <div style={st.promoTitle}>{c.title}</div>
                  <div style={st.promoSub}>{c.sub}</div>
                  <div style={st.promoTag}>Hızlı Plan → Araç</div>
                </Link>
              ))}
            </div>
          </section>
        </>
      ) : null}

      {isCompact && hasSearched && !loading && showFlightMapUi && !lodgingTourResults ? (
        <div
          style={{
            marginTop: 20,
            borderRadius: 16,
            overflow: 'hidden',
            border: '1px solid rgba(0,0,0,.1)',
            minHeight: 280,
          }}
        >
          <QuickPlanMap
            showChrome={false}
            center={flightMapCenter}
            markers={flightMapMarkers}
            zoom={5}
            minHeight={280}
          />
        </div>
      ) : null}
    </>
  );

  const pillBarTabletScroll = isCompact && !isPhone;

  return (
    <div style={st.wrap}>
      <div style={qp.stickyTop}>
        <div style={qp.stickyInner}>
          <div style={{ ...qp.topBarRow, ...(isPhone ? qp.topBarRowMobile : {}) }}>
            <div
              style={
                pillBarTabletScroll
                  ? qp.pillScrollOuter
                  : { width: '100%', minWidth: 0, display: 'flex', justifyContent: isPhone ? 'stretch' : 'center' }
              }
            >
              <div
                style={{
                  ...qp.barCluster,
                  ...(lodgingTourResults
                    ? { width: '100%', minWidth: 0 }
                    : {
                        ...(isPhone ? { justifyContent: 'center' } : {}),
                        ...(pillBarTabletScroll ? { flexWrap: 'nowrap' } : {}),
                      }),
                }}
              >
                {lodgingTourResults ? (
                  <TourLodgingToolbar
                    title={title}
                    origin={origin}
                    destination={destination}
                    setOrigin={setOrigin}
                    setDestination={setDestination}
                    onSwap={swapAirports}
                    dateOut={dateOut}
                    dateIn={dateIn}
                    setDateOut={setDateOut}
                    setDateIn={setDateIn}
                    guestRooms={lodgingGuestRooms}
                    setGuestRooms={setLodgingGuestRooms}
                    includeCarAddon={includeCarAddon}
                    setIncludeCarAddon={setIncludeCarAddon}
                    onSearch={() => search()}
                  />
                ) : (
                  <div ref={flightBarRef} style={{ display: 'contents' }}>
                    <div style={{ ...qp.titlePill, alignSelf: 'center' }}>
                      <span style={qp.spark} aria-hidden>
                        <Sparkles size={13} strokeWidth={2.2} color="var(--ta-accent)" />
                      </span>
                      <span style={qp.titleTxt}>{title}</span>
                    </div>
                    {!hideTripTypeToggle ? (
                      <>
                        {!isPhone ? <span style={qp.barSep} /> : null}
                        <div
                          style={{
                            ...qp.toggleRow,
                            alignSelf: 'center',
                            ...(isPhone ? { width: '100%', justifyContent: 'center' } : {}),
                          }}
                        >
                          <button
                            type="button"
                            style={{ ...qp.tripMiniPill, ...(tripType === 'round' ? qp.tripMiniPillOn : {}) }}
                            onClick={() => {
                              closeQuickFlightPanels();
                              setTripType('round');
                            }}
                          >
                            Gidiş-Dönüş
                          </button>
                          <button
                            type="button"
                            style={{ ...qp.tripMiniPill, ...(tripType === 'one' ? qp.tripMiniPillOn : {}) }}
                            onClick={() => {
                              closeQuickFlightPanels();
                              setTripType('one');
                            }}
                          >
                            Tek Yön
                          </button>
                        </div>
                        {!isPhone ? <span style={qp.barSep} /> : null}
                      </>
                    ) : null}
                    <div style={qp.linkedRoute}>
                      <div style={qp.routeShell}>
                        <button
                          ref={originBtnRef}
                          type="button"
                          style={qp.routeSegBtn}
                          onClick={() => openFlightAir('o')}
                          aria-expanded={airWhich === 'o'}
                          aria-haspopup="dialog"
                        >
                          <MapPin size={18} strokeWidth={1.85} color="#1a3764" aria-hidden />
                          <span style={{ minWidth: 0, flex: 1 }}>
                            <span style={qp.fieldLbl}>Kalkış</span>
                            <span
                              style={{
                                ...qp.fieldVal,
                                ...(normalizeIata(origin) ? {} : qp.fieldPlaceholder),
                              }}
                            >
                              {normalizeIata(origin) ? tourAirportBoxLine(origin) : 'Kalkış havalimanı'}
                            </span>
                          </span>
                        </button>
                        <button type="button" style={qp.swapFab} onClick={swapAirports} aria-label="Nereden nereye değiştir">
                          <ArrowLeftRight size={15} color="#1a73e8" />
                        </button>
                        <button
                          ref={destBtnRef}
                          type="button"
                          style={qp.routeSegBtn}
                          onClick={() => openFlightAir('d')}
                          aria-expanded={airWhich === 'd'}
                          aria-haspopup="dialog"
                        >
                          <MapPin size={18} strokeWidth={1.85} color="#1a3764" aria-hidden />
                          <span style={{ minWidth: 0, flex: 1 }}>
                            <span style={qp.fieldLbl}>Varış</span>
                            <span
                              style={{
                                ...qp.fieldVal,
                                ...(normalizeIata(destination) ? {} : qp.fieldPlaceholder),
                              }}
                            >
                              {normalizeIata(destination) ? tourAirportBoxLine(destination) : 'Varış havalimanı'}
                            </span>
                          </span>
                        </button>
                      </div>
                    </div>
                    <button
                      ref={dateBtnRef}
                      type="button"
                      style={{
                        ...qp.fieldCard,
                        ...qp.fieldCardGrow,
                        ...qp.fieldCardStatic,
                        flex: '1 1 200px',
                        ...(isPhone ? { width: '100%' } : {}),
                      }}
                      onClick={() => {
                        setAirWhich(null);
                        setPaxPopOpen(false);
                        setDatePopOpen((v) => !v);
                      }}
                      aria-expanded={datePopOpen}
                      aria-haspopup="dialog"
                    >
                      <Calendar size={18} strokeWidth={1.85} color="#1a3764" aria-hidden />
                      <span style={{ minWidth: 0, flex: 1 }}>
                        <span style={qp.fieldLbl}>{effectiveTripType === 'round' ? 'Tarihler' : 'Gidiş'}</span>
                        <span style={qp.fieldVal}>
                          {effectiveTripType === 'round'
                            ? formatShortRangeTR(dateOut, dateIn)
                            : formatSingleDateTR(dateOut)}
                        </span>
                      </span>
                    </button>
                    <button
                      ref={paxBtnRef}
                      type="button"
                      style={{
                        ...qp.fieldCard,
                        ...qp.fieldCardGrow,
                        ...qp.fieldCardStatic,
                        flex: '1 1 160px',
                        ...(isPhone ? { width: '100%' } : {}),
                      }}
                      onClick={() => {
                        setAirWhich(null);
                        setDatePopOpen(false);
                        setPaxPopOpen((v) => !v);
                      }}
                      aria-expanded={paxPopOpen}
                      aria-haspopup="dialog"
                    >
                      <Users size={18} strokeWidth={1.85} color="#1a3764" aria-hidden />
                      <span style={{ minWidth: 0, flex: 1 }}>
                        <span style={qp.fieldLbl}>Yolcular</span>
                        <span style={qp.fieldVal}>
                          {`${adults + children + infantsLap + infantsSeat} yolcu`}
                        </span>
                      </span>
                    </button>
                    {!isPhone ? <span style={qp.barSep} /> : null}
                    <div
                      style={{
                        alignSelf: 'center',
                        flexShrink: 0,
                        ...(isPhone ? { width: '100%', marginTop: 8 } : {}),
                      }}
                    >
                      <button
                        type="button"
                        style={{
                          ...qp.searchBtn,
                          ...(isPhone ? { width: '100%', justifyContent: 'center' } : {}),
                          ...(loading ? { opacity: 0.65, cursor: 'not-allowed' } : {}),
                        }}
                        onClick={() => {
                          closeQuickFlightPanels();
                          search();
                        }}
                        disabled={loading}
                        aria-label={loading ? 'Aranıyor' : 'Ara'}
                      >
                        <Search size={16} strokeWidth={2.25} color="#FFFFFF" aria-hidden />
                        {loading ? 'Aranıyor…' : 'Ara'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {!lodgingTourResults ? (
        <>
          {airWhich === 'o' ? (
            <QuickPlanAirportPickerPanel
              innerRef={origPopoverRef}
              layout={airPopLayout}
              query={airQuery}
              setQuery={setAirQuery}
              onPickIata={(iata) => {
                setOrigin(normalizeIata(iata));
                setAirWhich(null);
              }}
              aria-label="Kalkış havalimanı"
            />
          ) : null}
          {airWhich === 'd' ? (
            <QuickPlanAirportPickerPanel
              innerRef={destPopoverRef}
              layout={airPopLayout}
              query={airQuery}
              setQuery={setAirQuery}
              onPickIata={(iata) => {
                setDestination(normalizeIata(iata));
                setAirWhich(null);
              }}
              aria-label="Varış havalimanı"
            />
          ) : null}
          <QuickPlanCalendarPopover
            innerRef={datePopoverRef}
            open={datePopOpen}
            mode={effectiveTripType === 'round' ? 'range' : 'single'}
            committedStart={dateOut}
            committedEnd={dateIn}
            layout={datePopLayout}
            onApply={(s, e) => {
              setDateOut(s);
              setDateIn(effectiveTripType === 'round' ? e : s);
              setDatePopOpen(false);
            }}
            aria-label={effectiveTripType === 'round' ? 'Gidiş ve dönüş tarihleri' : 'Gidiş tarihi'}
          />
          {paxPopOpen ? (
            <QuickPlanFlightPaxPanel
              innerRef={paxPopoverRef}
              layout={paxPopLayout}
              adults={adults}
              setAdults={setAdults}
              childrenCount={children}
              setChildrenCount={setChildren}
              infantsLap={infantsLap}
              setInfantsLap={setInfantsLap}
              infantsSeat={infantsSeat}
              setInfantsSeat={setInfantsSeat}
            />
          ) : null}
        </>
      ) : null}

      <div
        style={{
          ...st.mainScroll,
          ...(splitFlightDesktop && !lodgingTourResults ? st.mainScrollSplit : {}),
          ...(lodgingTourResults ? { overflow: 'hidden', display: 'flex', flexDirection: 'column' } : {}),
        }}
      >
        {lodgingTourResults ? (
          !hasSearched ? (
            <div
              style={{
                flex: 1,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                overflow: 'auto',
              }}
            >
              <div style={st.empty}>
                <span style={st.emptyPlane} aria-hidden>
                  <Hotel size={52} strokeWidth={1.4} color="var(--ta-accent-deep)" />
                </span>
                <p style={st.emptyTitle}>{title}</p>
                <p style={st.emptySub}>
                  Üstteki Varış koduna göre ({cityFromAirportCode(destination)}) oteller yüklenecek. Ara’ya bastığınızda
                  Konaklama ekranındaki gibi hızlı filtreler, sonuç listesi ve harita alanı açılır. Kart adları: Otel +
                  Uçuş
                  {includeCarAddon ? ' + Araç' : ''} biçimindedir.
                </p>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {stayTourKick.n > 0 ? <StaySearchScreen tourEmbed={tourStayEmbedConfig} /> : null}
            </div>
          )
        ) : splitFlightDesktop ? (
          <div style={st.bodySplitMap}>
            <aside style={st.filterAsideSplit}>{filterPanel}</aside>
            <div style={st.listScrollColFlight}>{flightListBody}</div>
            <aside style={st.mapAsideSplit}>
              <div style={st.mapSplitInner}>
                <div style={st.mapSplitFrame}>
                  <QuickPlanMap
                    showChrome={false}
                    center={flightMapCenter}
                    markers={flightMapMarkers}
                    zoom={5}
                    minHeight={0}
                    fillHeight
                  />
                </div>
              </div>
            </aside>
          </div>
        ) : (
          <div
            style={{
              ...st.bodyRow,
              ...(!hasSearched ? { flex: 1, minHeight: 0, alignItems: 'stretch' } : {}),
            }}
          >
            {hasSearched && !isCompact ? <aside style={st.aside}>{filterPanel}</aside> : null}
            <main style={{ ...st.main, ...(!hasSearched ? { display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, minHeight: 0 } : {}) }}>
              {flightListBody}
            </main>
            {hasSearched && !isCompact && !loading && showFlightMapUi ? (
              <aside style={st.mapAside}>
                <div style={{ position: 'sticky', top: 24 }}>
                  <QuickPlanMap
                    showChrome={false}
                    center={flightMapCenter}
                    markers={flightMapMarkers}
                    zoom={5}
                    minHeight={400}
                  />
                </div>
              </aside>
            ) : null}
          </div>
        )}
      </div>

      {isCompact && filterDrawer && !lodgingTourResults ? (
        <div style={st.drawerOverlay} role="presentation" onClick={() => setFilterDrawer(false)}>
          <div style={st.drawer} role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
            <div style={st.drawerHead}>
              <span style={st.drawerTitle}>Filtreler</span>
              <button type="button" style={st.drawerClose} onClick={() => setFilterDrawer(false)} aria-label="Kapat">
                <X size={20} />
              </button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: '0 16px 24px' }}>
              <div style={st.filterCol}>{filterPanelBody}</div>
            </div>
            <div style={st.drawerFoot}>
              <button type="button" style={st.searchBtn} onClick={() => setFilterDrawer(false)}>
                Sonuçları göster ({filteredSorted.length})
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RangeDual({ min, max, value, onChange, format }) {
  const lo = value[0];
  const hi = value[1];
  const span = Math.max(1, max - min);
  return (
    <div style={{ marginTop: 6, marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ta-ink-muted)', marginBottom: 4 }}>
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
          style={{ ...st.range, position: 'absolute', width: '100%', pointerEvents: 'auto' }}
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
          style={{ ...st.range, position: 'absolute', width: '100%', pointerEvents: 'auto' }}
        />
      </div>
    </div>
  );
}

const st = {
  wrap: {
    minHeight: 0,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg)',
    fontFamily: 'var(--font-sans)',
  },
  stickyBarTop: {
    flexShrink: 0,
    zIndex: 25,
    background: '#fff',
    boxShadow: '0 1px 10px rgba(0,0,0,.05)',
    borderBottom: '1px solid rgba(0,0,0,.06)',
  },
  stickyInner: { maxWidth: 1320, margin: '0 auto', padding: '12px 20px 14px', boxSizing: 'border-box' },
  topBarRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    width: '100%',
    boxSizing: 'border-box',
  },
  topBarRowMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  pillBar: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '4px 8px',
    padding: '6px 5px 6px 8px',
    border: '1px solid var(--line)',
    borderRadius: 999,
    background: 'var(--surface2)',
    boxShadow: 'var(--shadow-sm)',
    width: 'max-content',
    maxWidth: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
  },
  pillBarMobile: {
    borderRadius: 20,
    padding: '10px 12px',
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'stretch',
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  pillBarDesktop: {
    width: '100%',
    maxWidth: '100%',
    padding: '10px 12px 10px 14px',
    minHeight: 56,
    flexWrap: 'nowrap',
    alignItems: 'center',
  },
  pillScrollOuter: {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    overflowX: 'auto',
    overflowY: 'hidden',
    WebkitOverflowScrolling: 'touch',
    boxSizing: 'border-box',
    paddingBottom: 4,
    scrollbarGutter: 'stable',
  },
  pillBarTabletWide: {
    width: 'max-content',
    maxWidth: 'none',
  },
  flightBarCluster: {
    flex: '1 1 auto',
    minWidth: 0,
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '4px 8px',
  },
  pillGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    flexShrink: 0,
    minWidth: 0,
  },
  pillGroupMobile: {
    alignItems: 'center',
    width: '100%',
  },
  pillGroupLbl: {
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--ta-ink-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    lineHeight: 1,
    whiteSpace: 'nowrap',
    textAlign: 'center',
  },
  toggleCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flexShrink: 0,
  },
  barSepTall: {
    height: 44,
    alignSelf: 'center',
  },
  airportField: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    flexShrink: 0,
  },
  fieldLbl: {
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--ta-ink-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    lineHeight: 1,
    whiteSpace: 'nowrap',
  },
  titlePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    padding: '4px 10px',
    borderRadius: 999,
    flexShrink: 0,
  },
  titleStar: { display: 'inline-flex', alignItems: 'center', flexShrink: 0 },
  titleText: { fontSize: 13, fontWeight: 700, color: 'var(--text1)', whiteSpace: 'nowrap' },
  barSep: {
    width: 1,
    height: 16,
    background: 'rgba(0,0,0,.10)',
    margin: '0 6px',
    flexShrink: 0,
  },
  barDot: {
    color: 'rgba(0,0,0,.25)',
    fontSize: 14,
    padding: '0 2px',
    userSelect: 'none',
    flexShrink: 0,
  },
  tripToggles: { display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 },
  miniPill: {
    padding: '5px 10px',
    borderRadius: 999,
    border: '1px solid rgba(0,0,0,.12)',
    background: '#fff',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--ta-ink-muted)',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  miniPillOn: {
    background: 'var(--ta-accent-soft)',
    borderColor: 'var(--ta-accent)',
    color: 'var(--ta-ink)',
  },
  flightCodeInp: {
    border: 'none',
    background: 'transparent',
    fontSize: 13,
    fontWeight: 700,
    fontFamily: 'inherit',
    color: 'var(--ta-ink)',
    width: 56,
    maxWidth: 64,
    padding: '6px 4px',
    outline: 'none',
    textAlign: 'center',
    letterSpacing: '0.04em',
    boxSizing: 'border-box',
  },
  swapChip: {
    width: 32,
    height: 32,
    borderRadius: 999,
    border: '1px solid rgba(0,0,0,.1)',
    background: 'var(--ta-muted-bg)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    padding: 0,
  },
  dateRow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
    minWidth: 0,
  },
  chipDate: {
    border: 'none',
    background: 'transparent',
    fontSize: 12,
    fontWeight: 600,
    fontFamily: 'inherit',
    color: 'var(--ta-ink)',
    padding: '3px 2px',
    minWidth: 0,
    flex: '0 1 auto',
  },
  dateArrow: {
    color: 'var(--ta-ink-subtle)',
    fontSize: 13,
    userSelect: 'none',
    flexShrink: 0,
    lineHeight: 1,
    alignSelf: 'center',
  },
  flightPaxRow: {
    display: 'inline-flex',
    alignItems: 'stretch',
    flexWrap: 'wrap',
    gap: 0,
    padding: '4px 6px 4px 8px',
    borderRadius: 999,
    border: '1px solid var(--ta-border-strong)',
    background: 'linear-gradient(180deg, var(--ta-elevated) 0%, var(--ta-muted-bg) 100%)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,.85), 0 1px 2px rgba(15, 23, 32, 0.04)',
    flexShrink: 0,
  },
  flightPaxSeg: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    padding: '2px 10px',
    borderRight: '1px solid var(--ta-border)',
  },
  flightPaxSegLast: { borderRight: 'none' },
  searchBlack: {
    display: 'inline-flex',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    flexShrink: 0,
    padding: '7px 14px',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: 'inherit',
    lineHeight: 1.2,
    border: '1px solid rgba(0,0,0,.15)',
    borderRadius: 999,
    background: 'var(--ta-ink)',
    color: '#FFFFFF',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    minHeight: 34,
  },
  mainScroll: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    overflowX: 'hidden',
    WebkitOverflowScrolling: 'touch',
  },
  mainScrollSplit: { overflow: 'hidden' },
  bodySplitMap: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
    maxWidth: 'none',
    margin: 0,
    gap: 14,
    padding: 0,
    boxSizing: 'border-box',
  },
  filterAsideSplit: {
    width: 260,
    flexShrink: 0,
    minHeight: 0,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    alignSelf: 'stretch',
    background: '#fff',
    border: '1px solid rgba(0,0,0,.08)',
    borderRadius: 12,
    padding: '16px 14px',
    boxSizing: 'border-box',
    marginLeft: 12,
  },
  listScrollColFlight: {
    position: 'relative',
    flex: '0 1 720px',
    minWidth: 260,
    maxWidth: 780,
    minHeight: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    WebkitOverflowScrolling: 'touch',
    padding: '12px 12px 28px 10px',
    boxSizing: 'border-box',
  },
  mapAsideSplit: {
    flex: '1 1 0',
    minWidth: 280,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    padding: '12px 20px 22px 0',
    boxSizing: 'border-box',
  },
  mapSplitInner: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  mapSplitFrame: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 18,
    overflow: 'hidden',
    boxShadow: '0 10px 32px rgba(35,28,18,.12)',
  },
  searchBtn: {
    padding: '12px 22px',
    borderRadius: 10,
    border: 'none',
    background: 'var(--ta-accent)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 8px rgba(74,98,120,.35)',
  },
  bodyRow: {
    flex: 1,
    display: 'flex',
    minHeight: 0,
    maxWidth: 'none',
    margin: 0,
    width: '100%',
    boxSizing: 'border-box',
    padding: '20px 20px 40px 12px',
    gap: 20,
    alignItems: 'flex-start',
  },
  aside: {
    width: 260,
    flexShrink: 0,
    position: 'sticky',
    top: 156,
    alignSelf: 'flex-start',
    maxHeight: 'calc(100vh - 170px)',
    overflowY: 'auto',
    background: '#fff',
    border: '1px solid rgba(0,0,0,.08)',
    borderRadius: 12,
    padding: '16px 14px',
    boxSizing: 'border-box',
  },
  main: { flex: 1, minWidth: 0, position: 'relative' },
  mapAside: { width: 300, flexShrink: 0, position: 'relative' },
  filterCol: {},
  filterPanelHeading: {
    fontSize: 14,
    fontWeight: 800,
    color: 'var(--ta-ink)',
    margin: '0 0 14px',
    paddingBottom: 10,
    borderBottom: '1px solid rgba(0,0,0,.08)',
    fontFamily: 'var(--font-sans)',
  },
  filterTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--ta-ink)',
    marginTop: 12,
    marginBottom: 8,
  },
  tabs: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  tabBtn: {
    padding: '6px 10px',
    borderRadius: 8,
    border: '1px solid rgba(0,0,0,.1)',
    background: '#fff',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    color: 'var(--ta-ink-muted)',
  },
  tabBtnOn: {
    background: 'var(--ta-accent)',
    color: '#fff',
    borderColor: 'var(--ta-accent)',
  },
  ckRow: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ta-ink)', cursor: 'pointer' },
  mutedSm: { fontSize: 12, color: 'var(--ta-ink-subtle)' },
  range: { width: '100%', accentColor: 'var(--ta-accent)' },
  empty: {
    textAlign: 'center',
    padding: '48px 24px',
    color: 'var(--muted)',
  },
  emptyPlane: { display: 'flex', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 600, color: 'var(--ta-ink-muted)', margin: '0 0 8px' },
  emptySub: { fontSize: 14, color: 'var(--ta-ink-subtle)', margin: 0 },
  mockNote: {
    fontSize: 12,
    color: 'var(--ta-ink-muted)',
    background: 'var(--ta-accent-soft)',
    padding: '8px 12px',
    borderRadius: 8,
    marginBottom: 12,
    border: '1px solid rgba(74,98,120,.25)',
  },
  card: {
    display: 'grid',
    gridTemplateColumns: 'minmax(128px,168px) 1fr minmax(158px,188px)',
    gap: 16,
    background: '#fff',
    border: '1px solid rgba(0,0,0,.08)',
    borderRadius: 12,
    padding: '18px 20px',
    alignItems: 'center',
    transition: 'box-shadow .2s',
    boxSizing: 'border-box',
  },
  cardMobile: {
    gridTemplateColumns: '1fr',
    justifyItems: 'stretch',
    textAlign: 'left',
  },
  cardLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 10,
    background: 'var(--ta-muted-bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 13,
    color: 'var(--ta-accent-deep)',
  },
  airlineName: { fontWeight: 700, fontSize: 14, color: 'var(--ta-ink)' },
  airlineCode: { fontSize: 11, color: 'var(--ta-ink-subtle)', marginTop: 2 },
  cardMid: { minWidth: 0 },
  timeRow: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  timeBig: { fontSize: 22, fontWeight: 800, color: 'var(--ta-ink)', fontVariantNumeric: 'tabular-nums' },
  timeSep: { color: 'var(--ta-ink-subtle)', fontWeight: 600 },
  metaRow: { fontSize: 13, color: 'var(--ta-ink-muted)', marginTop: 6 },
  dot: { margin: '0 4px', color: '#ccc' },
  cabinFoot: { fontSize: 12, color: 'var(--ta-ink-subtle)', marginTop: 8 },
  cardRight: { textAlign: 'right' },
  price: { fontSize: 24, fontWeight: 800, color: 'var(--ta-ink)', fontVariantNumeric: 'tabular-nums' },
  selectBtn: {
    marginTop: 10,
    padding: '10px 18px',
    borderRadius: 10,
    border: 'none',
    background: 'var(--ta-accent)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: 'inherit',
    width: '100%',
    boxSizing: 'border-box',
  },
  cardActions: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 6,
    justifyContent: 'flex-end',
    marginTop: 10,
    alignItems: 'center',
    width: '100%',
    minWidth: 0,
  },
  iconAct: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--ta-ink-muted)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 2px',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  section: { marginTop: 36 },
  sectionTitle: { fontSize: 18, fontWeight: 700, color: 'var(--ta-ink)', margin: '0 0 14px' },
  cardRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 },
  promoCard: {
    background: '#fff',
    border: '1px solid rgba(0,0,0,.08)',
    borderRadius: 12,
    padding: 16,
    textDecoration: 'none',
    color: 'inherit',
    transition: 'box-shadow .2s',
    display: 'block',
  },
  promoStars: { display: 'flex', gap: 2, marginBottom: 6 },
  promoTitle: { fontWeight: 700, fontSize: 15, color: 'var(--ta-ink)' },
  promoSub: { fontSize: 12, color: 'var(--ta-ink-muted)', marginTop: 4 },
  promoTag: { fontSize: 11, color: 'var(--ta-accent-deep)', marginTop: 10, fontWeight: 600 },
  dateNavWrap: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    padding: '0 8px 14px',
    marginBottom: 2,
    boxSizing: 'border-box',
  },
  dateNavPanel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    width: '100%',
    maxWidth: 720,
    padding: '10px 16px',
    background: '#fff',
    borderRadius: 999,
    border: '1px solid rgba(0,0,0,.08)',
    boxShadow: '0 6px 24px rgba(35,28,18,.08)',
    boxSizing: 'border-box',
  },
  dateNavBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 12px',
    borderRadius: 12,
    border: 'none',
    background: '#F2F0EB',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--ta-ink)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    flexShrink: 0,
    maxWidth: '42%',
  },
  dateNavCenter: {
    flex: '1 1 auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minWidth: 0,
    padding: '0 6px',
    textAlign: 'center',
  },
  dateNavRoute: {
    fontSize: 14,
    fontWeight: 800,
    color: 'var(--ta-ink)',
    lineHeight: 1.25,
    wordBreak: 'break-word',
  },
  dateNavDay: { fontSize: 12, fontWeight: 500, color: 'var(--ta-ink-muted)' },
  mobileFilterFab: {
    position: 'sticky',
    top: 8,
    zIndex: 5,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    padding: '10px 16px',
    borderRadius: 999,
    border: '1px solid rgba(0,0,0,.1)',
    background: '#fff',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 2px 10px rgba(0,0,0,.08)',
  },
  drawerOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,.35)',
    zIndex: 100,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  drawer: {
    width: 'min(360px, 92vw)',
    height: '100%',
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '-4px 0 24px rgba(0,0,0,.12)',
  },
  drawerHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 16px 8px',
    borderBottom: '1px solid rgba(0,0,0,.06)',
  },
  drawerTitle: { fontWeight: 700, fontSize: 16 },
  drawerClose: { border: 'none', background: 'var(--ta-muted-bg)', borderRadius: 8, padding: 8, cursor: 'pointer' },
  drawerFoot: { padding: 16, borderTop: '1px solid rgba(0,0,0,.06)' },
};
