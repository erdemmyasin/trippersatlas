'use client';

import { useState, useMemo, useCallback, useEffect, useRef, useLayoutEffect } from 'react';
import Link from 'next/link';
import {
  SlidersHorizontal,
  Heart,
  Bookmark,
  Share2,
  X,
  Search,
  Car,
  DoorOpen,
  User,
  Luggage,
  Settings2,
  Sparkles,
  ChevronDown,
  ChevronRight,
  MapPin,
  Calendar,
  ArrowLeftRight,
} from 'lucide-react';
import { getMockCars } from '@/lib/carSearchMock';
import {
  useIsPhoneLayout,
  useIsCompactSearchLayout,
  useSearchMapSplitWide,
  RangeDual,
} from '@/components/SearchScreenPrimitives';
import QuickPlanMap from '@/components/QuickPlanMap';
import { centerFromMarkers } from '@/lib/airportsGeo';
import {
  appendRegionalGeocodeContext,
  defaultCarLocationLine,
  defaultMapAnchorPreset,
  carRentalSearchQueryFragment,
} from '@/lib/taRegion';
import { qp } from '@/lib/quickPlanFilterStyles';
import { popoverCoords, datePanelCoords } from '@/lib/popoverCoords';
import { useQuickPlanBarDismiss } from '@/hooks/useQuickPlanBarDismiss';
import {
  QuickPlanCityTextPanel,
  QuickPlanCalendarPopover,
  QuickPlanTimeListPopover,
  QuickPlanSelectCommitPanel,
  formatHm12En,
} from '@/components/QuickPlanAnchoredWidgets';
import { formatShortRangeTR } from '@/lib/quickPlanFormatters';

const CAR_DRIVER_AGE_OPTS = [
  { value: '21-25', label: '21–25 yaş' },
  { value: '26-35', label: '26–35 yaş' },
  { value: '36-65', label: '36–65 yaş' },
  { value: '65+', label: '65+ yaş' },
];

function splitDateTimeLocal(v) {
  const s = String(v || '').trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (m) return { date: m[1], time: `${m[2]}:${m[3]}` };
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  const pad = (n) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function joinDateTimeLocal(dateIso, hm) {
  const t = String(hm || '10:00').length >= 5 ? String(hm).slice(0, 5) : '10:00';
  return `${dateIso}T${t}`;
}

const CLASSES = ['Ekonomi', 'Kompakt', 'Orta', 'Büyük', 'SUV', 'Minivan'];
const SHIFTS = ['Otomatik', 'Manuel'];
const FUELS = ['Benzin', 'Dizel', 'Hybrid', 'Elektrik'];
const COMPANIES = ['Enterprise', 'Budget', 'Avis', 'EuropCar', 'AVEC', 'Garenta'];
const PAX_OPTS = [
  { id: '2', label: '2', test: (s) => s <= 3 },
  { id: '4', label: '4', test: (s) => s === 4 },
  { id: '5', label: '5', test: (s) => s === 5 },
  { id: '7', label: '7+', test: (s) => s >= 7 },
];

function CarSkeleton({ narrow }) {
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
            padding: 16,
            display: 'grid',
            gridTemplateColumns: narrow ? '1fr' : 'minmax(168px,210px) 1fr minmax(200px,248px)',
            gap: 14,
          }}
        >
          <div style={{ height: 100, background: '#eee', borderRadius: 10 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ height: 16, background: '#eee', width: '55%', borderRadius: 4 }} />
            <div style={{ height: 12, background: '#f0f0f0', width: '70%', borderRadius: 4 }} />
            <div style={{ height: 12, background: '#f0f0f0', width: '90%', borderRadius: 4 }} />
          </div>
          <div style={{ height: 72, background: '#eee', borderRadius: 8 }} />
        </div>
      ))}
    </div>
  );
}

function CarMapPlaceholder({ cars, hoveredId, setHoveredId, onPinClick, fillHeight = false }) {
  return (
    <div
      style={{
        borderRadius: fillHeight ? 0 : 12,
        border: fillHeight ? 'none' : '1px solid rgba(0,0,0,.08)',
        background: 'linear-gradient(165deg,#d4dae3 0%,#b8c2d0 50%,#a8b3c4 100%)',
        minHeight: fillHeight ? 0 : 300,
        height: fillHeight ? '100%' : undefined,
        flex: fillHeight ? '1 1 0' : undefined,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.3,
          backgroundImage:
            'repeating-linear-gradient(90deg,transparent,transparent 28px,rgba(255,255,255,.15) 28px,rgba(255,255,255,.15) 29px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--ta-ink)',
          background: 'rgba(255,255,255,.88)',
          padding: '6px 10px',
          borderRadius: 8,
        }}
      >
        Kiralama noktaları
      </div>
      {cars.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onPinClick?.(c)}
          onMouseEnter={() => setHoveredId(c.id)}
          onMouseLeave={() => setHoveredId(null)}
          style={{
            position: 'absolute',
            left: `${c.mapX}%`,
            top: `${c.mapY}%`,
            transform: 'translate(-50%, -50%)',
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: hoveredId === c.id ? 'var(--ta-accent-deep)' : 'var(--ta-ink)',
            border: '2px solid #fff',
            boxShadow: '0 2px 8px rgba(0,0,0,.25)',
            cursor: 'pointer',
            padding: 0,
          }}
          aria-label={c.company}
        />
      ))}
      {hoveredId ? (
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            right: 10,
            background: 'rgba(255,255,255,.96)',
            borderRadius: 10,
            padding: '10px 12px',
            fontSize: 12,
            fontWeight: 600,
            boxShadow: '0 4px 16px rgba(0,0,0,.1)',
            pointerEvents: 'none',
          }}
        >
          {(() => {
            const c = cars.find((x) => x.id === hoveredId);
            if (!c) return null;
            return (
              <>
                {c.company} · {c.name}
                <span style={{ color: 'var(--ta-accent-deep)', marginLeft: 8 }}>
                  ₺{c.totalPrice.toLocaleString('tr-TR')}
                </span>
              </>
            );
          })()}
        </div>
      ) : null}
    </div>
  );
}

export default function CarSearchScreen() {
  const isPhone = useIsPhoneLayout();
  const isCompact = useIsCompactSearchLayout();
  const splitWide = useSearchMapSplitWide(1100);
  const [pickupLocation, setPickupLocation] = useState(() => defaultCarLocationLine());
  const [dropoffLocation, setDropoffLocation] = useState(() => defaultCarLocationLine());
  const defaultPickup = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };
  const defaultReturn = () => {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };
  const [pickupAt, setPickupAt] = useState(defaultPickup);
  const [returnAt, setReturnAt] = useState(defaultReturn);
  const [ageBracket, setAgeBracket] = useState('26-35');

  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [raw, setRaw] = useState([]);
  const [savedIds, setSavedIds] = useState(() => new Set());
  const [likedIds, setLikedIds] = useState(() => new Set());
  const [hoverMap, setHoverMap] = useState(null);
  const [mapTip, setMapTip] = useState(null);
  const [mapGeoCenter, setMapGeoCenter] = useState(() => defaultMapAnchorPreset());
  const [rentalOfficeMarkers, setRentalOfficeMarkers] = useState([]);

  const [sortTab, setSortTab] = useState('rec');
  const [filterSecOpen, setFilterSecOpen] = useState({
    class: true,
    shift: true,
    fuel: true,
    pax: true,
    company: true,
    dropoff: true,
    policy: true,
    price: true,
  });
  function toggleFilterSec(key) {
    setFilterSecOpen((p) => ({ ...p, [key]: !p[key] }));
  }
  const [classes, setClasses] = useState(() => Object.fromEntries(CLASSES.map((k) => [k, true])));
  const [shifts, setShifts] = useState(() => Object.fromEntries(SHIFTS.map((k) => [k, true])));
  const [fuels, setFuels] = useState(() => Object.fromEntries(FUELS.map((k) => [k, true])));
  const [pax, setPax] = useState(() => Object.fromEntries(PAX_OPTS.map((p) => [p.id, true])));
  const [comps, setComps] = useState(() => Object.fromEntries(COMPANIES.map((c) => [c, true])));
  const [policyCancel, setPolicyCancel] = useState(false);
  const [policyIns, setPolicyIns] = useState(false);
  const [priceRange, setPriceRange] = useState([7000, 35000]);

  const [filterDrawer, setFilterDrawer] = useState(false);
  const [dropoffPick, setDropoffPick] = useState({});

  const swapCarLocations = useCallback(() => {
    const p = pickupLocation;
    setPickupLocation(dropoffLocation);
    setDropoffLocation(p);
  }, [pickupLocation, dropoffLocation]);

  /* Sync filter keys when result set changes; Checkbox state merges with incoming keys. */
  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- derived keys from fetch results */
    setDropoffPick((prev) => {
      const next = { ...prev };
      for (const c of raw) {
        const k = c.dropoff;
        if (k != null && next[k] === undefined) next[k] = true;
      }
      for (const k of Object.keys(next)) {
        if (!raw.some((c) => c.dropoff === k)) delete next[k];
      }
      return next;
    });
  }, [raw]);

  const carBarRef = useRef(null);
  const pickLocBtnRef = useRef(null);
  const dropLocBtnRef = useRef(null);
  const datesBtnRef = useRef(null);
  const pickTimeBtnRef = useRef(null);
  const dropTimeBtnRef = useRef(null);
  const ageBtnRef = useRef(null);
  const carCityPopRef = useRef(null);
  const carDateRangePopoverRef = useRef(null);
  const pickTimePopoverRef = useRef(null);
  const dropTimePopoverRef = useRef(null);
  const agePopRef = useRef(null);

  const [carCityPick, setCarCityPick] = useState(null);
  const [carCityDraft, setCarCityDraft] = useState('');
  const [carCityLayout, setCarCityLayout] = useState({ top: 0, left: 0, width: 'min(340px, calc(100vw - 20px))' });

  const [carDatesOpen, setCarDatesOpen] = useState(false);
  const [carDateRangeLayout, setCarDateRangeLayout] = useState({ top: 0, left: 10 });

  const [pickTimeOpen, setPickTimeOpen] = useState(false);
  const [pickTimeLayout, setPickTimeLayout] = useState({ top: 0, left: 0, width: 'min(220px, calc(100vw - 20px))' });

  const [dropTimeOpen, setDropTimeOpen] = useState(false);
  const [dropTimeLayout, setDropTimeLayout] = useState({ top: 0, left: 0, width: 'min(220px, calc(100vw - 20px))' });

  const [agePopOpen, setAgePopOpen] = useState(false);
  const [ageDraft, setAgeDraft] = useState('26-35');
  const [agePopLayout, setAgePopLayout] = useState({ top: 0, left: 0, width: 'min(300px, calc(100vw - 20px))' });

  const closeCarQuickPanels = useCallback(() => {
    setCarCityPick(null);
    setCarDatesOpen(false);
    setPickTimeOpen(false);
    setDropTimeOpen(false);
    setAgePopOpen(false);
  }, []);

  useLayoutEffect(() => {
    if (!carCityPick) return undefined;
    const el = carCityPick === 'pickup' ? pickLocBtnRef.current : dropLocBtnRef.current;
    function u() {
      setCarCityLayout({ ...popoverCoords(el, 340), width: 'min(340px, calc(100vw - 20px))' });
    }
    u();
    window.addEventListener('resize', u);
    window.addEventListener('scroll', u, true);
    return () => {
      window.removeEventListener('resize', u);
      window.removeEventListener('scroll', u, true);
    };
  }, [carCityPick]);

  useLayoutEffect(() => {
    if (!carDatesOpen) return undefined;
    function u() {
      setCarDateRangeLayout(datePanelCoords(datesBtnRef.current, 504));
    }
    u();
    window.addEventListener('resize', u);
    window.addEventListener('scroll', u, true);
    return () => {
      window.removeEventListener('resize', u);
      window.removeEventListener('scroll', u, true);
    };
  }, [carDatesOpen]);

  useLayoutEffect(() => {
    if (!pickTimeOpen) return undefined;
    const el = pickTimeBtnRef.current;
    function u() {
      const r = popoverCoords(el, 220);
      const w = el ? `${Math.min(220, el.getBoundingClientRect().width)}px` : 'min(220px, calc(100vw - 20px))';
      setPickTimeLayout({ ...r, width: w });
    }
    u();
    window.addEventListener('resize', u);
    window.addEventListener('scroll', u, true);
    return () => {
      window.removeEventListener('resize', u);
      window.removeEventListener('scroll', u, true);
    };
  }, [pickTimeOpen]);

  useLayoutEffect(() => {
    if (!dropTimeOpen) return undefined;
    const el = dropTimeBtnRef.current;
    function u() {
      const r = popoverCoords(el, 220);
      const w = el ? `${Math.min(220, el.getBoundingClientRect().width)}px` : 'min(220px, calc(100vw - 20px))';
      setDropTimeLayout({ ...r, width: w });
    }
    u();
    window.addEventListener('resize', u);
    window.addEventListener('scroll', u, true);
    return () => {
      window.removeEventListener('resize', u);
      window.removeEventListener('scroll', u, true);
    };
  }, [dropTimeOpen]);

  useLayoutEffect(() => {
    if (!agePopOpen) return undefined;
    const el = ageBtnRef.current;
    function u() {
      setAgePopLayout({ ...popoverCoords(el, 320), width: 'min(300px, calc(100vw - 20px))' });
    }
    u();
    window.addEventListener('resize', u);
    window.addEventListener('scroll', u, true);
    return () => {
      window.removeEventListener('resize', u);
      window.removeEventListener('scroll', u, true);
    };
  }, [agePopOpen]);

  const carQuickPanelsActive = !!(carCityPick || carDatesOpen || pickTimeOpen || dropTimeOpen || agePopOpen);
  const ignoreCarQuickPointer = useCallback(
    (t) =>
      !!(carBarRef.current?.contains(t)) ||
      !!(carCityPopRef.current?.contains(t)) ||
      !!(carDateRangePopoverRef.current?.contains(t)) ||
      !!(pickTimePopoverRef.current?.contains(t)) ||
      !!(dropTimePopoverRef.current?.contains(t)) ||
      !!(agePopRef.current?.contains(t)),
    []
  );
  useQuickPlanBarDismiss(carQuickPanelsActive, ignoreCarQuickPointer, closeCarQuickPanels);

  const bounds = useMemo(() => {
    if (!raw.length) return { price: [7000, 35000] };
    let pMin = Infinity;
    let pMax = -Infinity;
    for (const c of raw) {
      pMin = Math.min(pMin, c.totalPrice);
      pMax = Math.max(pMax, c.totalPrice);
    }
    return { price: [Math.floor(pMin), Math.ceil(pMax)] };
  }, [raw]);

  const filtered = useMemo(() => {
    const activeClass = CLASSES.filter((k) => classes[k]);
    const activeShift = SHIFTS.filter((k) => shifts[k]);
    const activeFuel = FUELS.filter((k) => fuels[k]);
    const activePax = PAX_OPTS.filter((p) => pax[p.id]);
    const activeComp = COMPANIES.filter((k) => comps[k]);

    let list = raw.filter((c) => {
      if (c.totalPrice < priceRange[0] || c.totalPrice > priceRange[1]) return false;
      if (activeClass.length && !activeClass.includes(c.klass)) return false;
      if (activeShift.length && !activeShift.includes(c.transmission)) return false;
      if (activeFuel.length && !activeFuel.includes(c.fuel)) return false;
      if (activePax.length) {
        const okPax = activePax.some((p) => p.test(c.seats));
        if (!okPax) return false;
      }
      if (activeComp.length && !activeComp.includes(c.company)) return false;
      if (policyCancel && !c.freeCancel) return false;
      if (policyIns && !c.fullInsurance) return false;
      if (c.dropoff != null && dropoffPick[c.dropoff] === false) return false;
      return true;
    });

    if (sortTab === 'price') list = [...list].sort((a, b) => a.totalPrice - b.totalPrice);
    else if (sortTab === 'score') list = [...list].sort((a, b) => b.score - a.score);
    else
      list = [...list].sort(
        (a, b) => b.score * 800 - b.totalPrice - (a.score * 800 - a.totalPrice)
      );

    return list;
  }, [raw, priceRange, classes, shifts, fuels, pax, comps, policyCancel, policyIns, sortTab, dropoffPick]);

  const search = useCallback(async () => {
    setLoading(true);
    setHasSearched(true);
    await new Promise((r) => setTimeout(r, 650));
    let center = { ...defaultMapAnchorPreset() };
    try {
      const geoAddr = appendRegionalGeocodeContext(
        (pickupLocation || defaultCarLocationLine()).trim() || defaultCarLocationLine()
      );
      const geoRes = await fetch(`/api/places/geocode?address=${encodeURIComponent(geoAddr)}`);
      const geo = await geoRes.json();
      if (geo?.lat != null && geo?.lng != null) {
        center = { lat: geo.lat, lng: geo.lng };
      }
    } catch (e) {
      console.error('Car geocode', e);
    }
    setMapGeoCenter(center);

    const seed = Date.now();
    const list = getMockCars({
      location: pickupLocation,
      dropoffLocation,
      pickupAt: `${pickupAt}:00`,
      returnAt: `${returnAt}:00`,
      seed,
    });
    const withLL = list.map((c, i) => {
      const angle = (i / Math.max(list.length, 1)) * Math.PI * 2;
      return {
        ...c,
        lat: center.lat + 0.007 * Math.cos(angle) * (0.4 + (i % 5) * 0.15),
        lng: center.lng + 0.009 * Math.sin(angle) * (0.4 + (i % 4) * 0.12),
      };
    });
    let pMin = Infinity;
    let pMax = -Infinity;
    for (const c of withLL) {
      pMin = Math.min(pMin, c.totalPrice);
      pMax = Math.max(pMax, c.totalPrice);
    }
    const pb = [Math.floor(pMin), Math.ceil(pMax)];
    setPriceRange(pb);
    setRaw(withLL);
    setLoading(false);

    setRentalOfficeMarkers([]);
    const locStr = (pickupLocation || defaultCarLocationLine()).trim() || defaultCarLocationLine();
    const companies = [...new Set(withLL.map((c) => c.company))].slice(0, 6);
    (async () => {
      const pins = [];
      for (const comp of companies) {
        try {
          const res = await fetch('/api/places/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: `${comp} ${carRentalSearchQueryFragment(locStr)}`.trim(),
              type: 'car_rental',
              lat: center.lat,
              lng: center.lng,
              radius: 40000,
            }),
          });
          const data = await res.json();
          const p = data.places?.[0];
          if (p?.lat != null && p?.lng != null) {
            pins.push({
              id: `office-${comp}`,
              lat: p.lat,
              lng: p.lng,
              title: p.name || `${comp} ofis`,
              price: comp,
            });
          }
        } catch (e) {
          console.error('Rental office search', comp, e);
        }
        await new Promise((r) => setTimeout(r, 180));
      }
      setRentalOfficeMarkers(pins);
    })();
  }, [pickupLocation, dropoffLocation, pickupAt, returnAt]);

  const carFallbackMarkers = useMemo(
    () =>
      filtered
        .filter((c) => c.lat != null && c.lng != null)
        .map((c) => ({
          id: c.id,
          lat: c.lat,
          lng: c.lng,
          title: `${c.company} — ${c.name}`,
          price: `₺${c.totalPrice.toLocaleString('tr-TR')}`,
        })),
    [filtered]
  );

  const carMapMarkers = rentalOfficeMarkers.length > 0 ? rentalOfficeMarkers : carFallbackMarkers;

  const carMapDisplayCenter = useMemo(() => {
    if (rentalOfficeMarkers.length > 0) return centerFromMarkers(rentalOfficeMarkers, mapGeoCenter);
    return mapGeoCenter;
  }, [rentalOfficeMarkers, mapGeoCenter]);

  const useCarGoogleMap =
    typeof process !== 'undefined' &&
    !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY &&
    carMapMarkers.length > 0;
  const splitCarDesktop = hasSearched && splitWide && !loading && filtered.length > 0;

  const filterPanelBody = (
    <>
      <div style={{ ...cp.title, marginTop: 0 }}>Sıralama</div>
      <div style={cp.tabs}>
        {[
          { id: 'rec', label: 'Bizim Önerimiz' },
          { id: 'price', label: 'Fiyat (artan)' },
          { id: 'score', label: 'Puan' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSortTab(t.id)}
            style={{ ...cp.tab, ...(sortTab === t.id ? cp.tabOn : {}) }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        style={cp.filterSecBtn}
        onClick={() => toggleFilterSec('class')}
        aria-expanded={filterSecOpen.class}
      >
        <span>Araç sınıfı</span>
        <span style={cp.filterSecChev}>{filterSecOpen.class ? <ChevronDown size={14} aria-hidden /> : <ChevronRight size={14} aria-hidden />}</span>
      </button>
      {filterSecOpen.class
        ? CLASSES.map((k) => (
            <label key={k} style={cp.ck}>
              <input
                type="checkbox"
                checked={classes[k]}
                onChange={(e) => setClasses((prev) => ({ ...prev, [k]: e.target.checked }))}
              />
              {k}
            </label>
          ))
        : null}

      <button
        type="button"
        style={cp.filterSecBtn}
        onClick={() => toggleFilterSec('shift')}
        aria-expanded={filterSecOpen.shift}
      >
        <span>Vites</span>
        <span style={cp.filterSecChev}>{filterSecOpen.shift ? <ChevronDown size={14} aria-hidden /> : <ChevronRight size={14} aria-hidden />}</span>
      </button>
      {filterSecOpen.shift
        ? SHIFTS.map((k) => (
            <label key={k} style={cp.ck}>
              <input
                type="checkbox"
                checked={shifts[k]}
                onChange={(e) => setShifts((prev) => ({ ...prev, [k]: e.target.checked }))}
              />
              {k}
            </label>
          ))
        : null}

      <button
        type="button"
        style={cp.filterSecBtn}
        onClick={() => toggleFilterSec('fuel')}
        aria-expanded={filterSecOpen.fuel}
      >
        <span>Yakıt</span>
        <span style={cp.filterSecChev}>{filterSecOpen.fuel ? <ChevronDown size={14} aria-hidden /> : <ChevronRight size={14} aria-hidden />}</span>
      </button>
      {filterSecOpen.fuel
        ? FUELS.map((k) => (
            <label key={k} style={cp.ck}>
              <input
                type="checkbox"
                checked={fuels[k]}
                onChange={(e) => setFuels((prev) => ({ ...prev, [k]: e.target.checked }))}
              />
              {k}
            </label>
          ))
        : null}

      <button
        type="button"
        style={cp.filterSecBtn}
        onClick={() => toggleFilterSec('pax')}
        aria-expanded={filterSecOpen.pax}
      >
        <span>Yolcu kapasitesi</span>
        <span style={cp.filterSecChev}>{filterSecOpen.pax ? <ChevronDown size={14} aria-hidden /> : <ChevronRight size={14} aria-hidden />}</span>
      </button>
      {filterSecOpen.pax
        ? PAX_OPTS.map((p) => (
            <label key={p.id} style={cp.ck}>
              <input
                type="checkbox"
                checked={pax[p.id]}
                onChange={(e) => setPax((prev) => ({ ...prev, [p.id]: e.target.checked }))}
              />
              {p.label}
            </label>
          ))
        : null}

      <button
        type="button"
        style={cp.filterSecBtn}
        onClick={() => toggleFilterSec('company')}
        aria-expanded={filterSecOpen.company}
      >
        <span>Kiralama şirketi</span>
        <span style={cp.filterSecChev}>{filterSecOpen.company ? <ChevronDown size={14} aria-hidden /> : <ChevronRight size={14} aria-hidden />}</span>
      </button>
      {filterSecOpen.company
        ? COMPANIES.map((k) => (
            <label key={k} style={cp.ck}>
              <input
                type="checkbox"
                checked={comps[k]}
                onChange={(e) => setComps((prev) => ({ ...prev, [k]: e.target.checked }))}
              />
              {k}
            </label>
          ))
        : null}

      {Object.keys(dropoffPick).length > 0 ? (
        <>
          <button
            type="button"
            style={cp.filterSecBtn}
            onClick={() => toggleFilterSec('dropoff')}
            aria-expanded={filterSecOpen.dropoff}
          >
            <span>Teslim yeri</span>
            <span style={cp.filterSecChev}>{filterSecOpen.dropoff ? <ChevronDown size={14} aria-hidden /> : <ChevronRight size={14} aria-hidden />}</span>
          </button>
          {filterSecOpen.dropoff
            ? Object.keys(dropoffPick)
                .sort()
                .map((k) => (
                  <label key={k} style={cp.ck}>
                    <input
                      type="checkbox"
                      checked={!!dropoffPick[k]}
                      onChange={(e) =>
                        setDropoffPick((prev) => ({ ...prev, [k]: e.target.checked }))
                      }
                    />
                    {k}
                  </label>
                ))
            : null}
        </>
      ) : null}

      <button
        type="button"
        style={cp.filterSecBtn}
        onClick={() => toggleFilterSec('policy')}
        aria-expanded={filterSecOpen.policy}
      >
        <span>Politikalar</span>
        <span style={cp.filterSecChev}>{filterSecOpen.policy ? <ChevronDown size={14} aria-hidden /> : <ChevronRight size={14} aria-hidden />}</span>
      </button>
      {filterSecOpen.policy ? (
        <>
          <label style={cp.ck}>
            <input type="checkbox" checked={policyCancel} onChange={(e) => setPolicyCancel(e.target.checked)} />
            Ücretsiz iptal
          </label>
          <label style={cp.ck}>
            <input type="checkbox" checked={policyIns} onChange={(e) => setPolicyIns(e.target.checked)} />
            Tam sigorta dahil
          </label>
        </>
      ) : null}

      <button
        type="button"
        style={cp.filterSecBtn}
        onClick={() => toggleFilterSec('price')}
        aria-expanded={filterSecOpen.price}
      >
        <span>Fiyat (toplam ₺)</span>
        <span style={cp.filterSecChev}>{filterSecOpen.price ? <ChevronDown size={14} aria-hidden /> : <ChevronRight size={14} aria-hidden />}</span>
      </button>
      {filterSecOpen.price ? (
        <RangeDual
          min={bounds.price[0]}
          max={Math.max(bounds.price[1], bounds.price[0] + 1)}
          value={priceRange}
          onChange={setPriceRange}
          format={(v) => `₺${Math.round(v).toLocaleString('tr-TR')}`}
        />
      ) : null}
    </>
  );

  const filterPanel = (
    <div>
      <div style={cp.filterPanelHeading}>Filtreler</div>
      {filterPanelBody}
    </div>
  );

  function shareCar(c) {
    const text = `${c.company} — ${c.name} · ₺${c.totalPrice.toLocaleString('tr-TR')} toplam`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: 'Araç kiralama', text }).catch(() => {});
    } else if (typeof navigator !== 'undefined') {
      navigator.clipboard?.writeText(text);
    }
  }

  const carListBody = (
    <>
      {isCompact && hasSearched ? (
        <button type="button" style={cp.fab} onClick={() => setFilterDrawer(true)}>
          <SlidersHorizontal size={18} />
          Filtreler
        </button>
      ) : null}

      {!hasSearched ? (
        <div style={cp.empty}>
          <span style={cp.emptyIcon} aria-hidden>
            <Car size={48} strokeWidth={1.4} color="var(--ta-accent-deep)" />
          </span>
          <p style={cp.emptyTitle}>Araç Kiralama</p>
          <p style={cp.emptySub}>
            Lokasyon ve alış-teslim tarihlerini seçin; sınıfa göre filtreleyip fiyatları karşılaştırın.
          </p>
        </div>
      ) : loading ? (
        <CarSkeleton narrow={isPhone} />
      ) : filtered.length === 0 ? (
        <div style={cp.empty}>
          <span style={cp.emptyIcon} aria-hidden>
            <Car size={48} strokeWidth={1.4} color="var(--ta-accent-deep)" />
          </span>
          <p style={cp.emptyTitle}>Sonuç yok</p>
          <p style={cp.emptySub}>Filtreleri veya fiyat aralığını güncelleyin.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map((c) => (
            <article
              key={c.id}
              style={{
                ...cp.card,
                position: 'relative',
                boxShadow:
                  hoverMap === c.id ? 'inset 0 0 0 2px var(--ta-accent), 0 2px 14px rgba(0,0,0,.05)' : undefined,
                ...(isPhone ? { gridTemplateColumns: '1fr', paddingTop: 48 } : {}),
              }}
              className="ta-stay-card"
              onMouseEnter={() => setHoverMap(c.id)}
              onMouseLeave={() => setHoverMap(null)}
            >
              <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', flexDirection: 'row', gap: 6, zIndex: 2 }}>
                <button type="button" style={cp.iconBtn} onClick={() => shareCar(c)} aria-label="Paylaş" title="Paylaş">
                  <Share2 size={17} color="var(--ta-ink-muted)" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  style={cp.iconBtn}
                  onClick={() =>
                    setSavedIds((prev) => {
                      const n = new Set(prev);
                      if (n.has(c.id)) n.delete(c.id);
                      else n.add(c.id);
                      return n;
                    })
                  }
                  aria-label="Kaydet"
                  title="Kaydet"
                >
                  <Bookmark
                    size={17}
                    color={savedIds.has(c.id) ? 'var(--ta-accent-deep)' : 'var(--ta-ink-muted)'}
                    fill={savedIds.has(c.id) ? 'var(--ta-accent-deep)' : 'transparent'}
                    strokeWidth={2}
                  />
                </button>
                <button
                  type="button"
                  style={cp.iconBtn}
                  onClick={() =>
                    setLikedIds((prev) => {
                      const n = new Set(prev);
                      if (n.has(c.id)) n.delete(c.id);
                      else n.add(c.id);
                      return n;
                    })
                  }
                  aria-label="Beğen"
                  title="Beğen"
                >
                  <Heart
                    size={17}
                    color={likedIds.has(c.id) ? 'var(--ta-accent-deep)' : 'var(--ta-ink-muted)'}
                    fill={likedIds.has(c.id) ? 'var(--ta-accent-deep)' : 'transparent'}
                    strokeWidth={2}
                  />
                </button>
              </div>

              <div
                style={{
                  height: isPhone ? 140 : 120,
                  borderRadius: 12,
                  background: 'linear-gradient(160deg,#c5cbd4,#9aa3b0)',
                  flexShrink: 0,
                  alignSelf: isPhone ? 'stretch' : 'start',
                }}
              />

              <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0, paddingRight: isPhone ? 0 : 4 }}>
                <div style={{ ...cp.carName, paddingRight: isPhone ? 56 : 72 }}>{c.name}</div>
                <div style={cp.similar}>veya benzer {c.orSimilar}</div>
                <div style={cp.specs}>
                  <span style={cp.specItem}>
                    <DoorOpen size={14} strokeWidth={2} aria-hidden style={{ flexShrink: 0 }} /> {c.doors} kapı
                  </span>
                  <span style={cp.specItem}>
                    <User size={14} strokeWidth={2} aria-hidden style={{ flexShrink: 0 }} /> {c.seats} koltuk
                  </span>
                  <span style={cp.specItem}>
                    <Luggage size={14} strokeWidth={2} aria-hidden style={{ flexShrink: 0 }} /> {c.bags} bagaj
                  </span>
                  <span style={cp.specItem}>
                    <Settings2 size={14} strokeWidth={2} aria-hidden style={{ flexShrink: 0 }} /> {c.transmissionCode}
                  </span>
                </div>
                <div style={cp.badges}>
                  {c.deliveryAvailable ? <span style={cp.badge}>Teslimat müsait</span> : null}
                  {c.freeCancel ? <span style={cp.badge}>Ücretsiz iptal</span> : null}
                </div>
                <div style={cp.coRow}>
                  <span style={cp.coName}>{c.company}</span>
                  <button type="button" style={cp.moreLinkInline}>
                    Daha fazla bilgi
                  </button>
                </div>
              </div>

              <div
                style={{
                  ...cp.priceCol,
                  alignItems: isPhone ? 'flex-start' : 'flex-end',
                  justifyContent: 'flex-start',
                  minWidth: 0,
                  /* Üstteki sabit ikonların altında nefes: fiyat / günlük / buton aşağı kayar */
                  paddingTop: isPhone ? 8 : 56,
                }}
              >
                {c.discountPct > 0 ? (
                  <span
                    style={{
                      ...cp.discBadge,
                      alignSelf: isPhone ? 'flex-start' : 'flex-end',
                    }}
                  >
                    %{c.discountPct} indirim
                  </span>
                ) : null}
                <div
                  style={{
                    ...cp.priceMeta,
                    marginTop: c.discountPct > 0 ? 6 : 0,
                    alignSelf: isPhone ? 'flex-start' : 'flex-end',
                  }}
                >
                  Toplam
                </div>
                <div
                  style={{
                    ...cp.priceDaily,
                    alignSelf: isPhone ? 'flex-start' : 'flex-end',
                  }}
                >
                  Günlük ~₺{c.dailyPrice.toLocaleString('tr-TR')}
                </div>
                <div
                  style={{
                    ...cp.priceMainRow,
                    justifyContent: isPhone ? 'flex-start' : 'flex-end',
                    marginTop: 4,
                  }}
                >
                  {c.strikeTotal ? (
                    <span style={cp.strike}>₺{c.strikeTotal.toLocaleString('tr-TR')}</span>
                  ) : null}
                  <span style={cp.bigPrice}>₺{c.totalPrice.toLocaleString('tr-TR')}</span>
                </div>
                <button
                  type="button"
                  style={{ ...cp.btn, width: '100%', maxWidth: isPhone ? 'none' : 200, marginTop: 10 }}
                >
                  Rezerve et
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {hasSearched && !loading ? (
        <section style={{ marginTop: 36 }}>
          <h2 style={cp.secTitle}>Diğer aramalar</h2>
          <div style={{ ...cp.promoRow, gridTemplateColumns: isPhone ? '1fr' : '1fr 1fr' }}>
            <Link href="/stay" className="ta-flight-promo" style={cp.promo}>
              <div style={cp.promoT}>Yakınındaki oteller</div>
              <div style={cp.promoS}>Konaklama fırsatlarına göz atın</div>
            </Link>
            <Link href="/flights" className="ta-flight-promo" style={cp.promo}>
              <div style={cp.promoT}>Uçuş ara</div>
              <div style={cp.promoS}>Biletleri tek ekranda karşılaştırın</div>
            </Link>
          </div>
        </section>
      ) : null}

      {isCompact && hasSearched && !loading && filtered.length > 0 ? (
        <div
          style={{
            marginTop: 16,
            borderRadius: 16,
            overflow: 'hidden',
            border: '1px solid rgba(0,0,0,.1)',
            minHeight: 280,
          }}
        >
          {useCarGoogleMap ? (
            <QuickPlanMap
              showChrome={false}
              center={carMapDisplayCenter}
              markers={carMapMarkers}
              zoom={rentalOfficeMarkers.length ? 11 : 12}
              minHeight={280}
              onMarkerClick={(m) => setMapTip(m.id === mapTip ? null : m.id)}
            />
          ) : (
            <CarMapPlaceholder
              cars={filtered}
              hoveredId={hoverMap}
              setHoveredId={setHoverMap}
              onPinClick={(car) => setMapTip(car.id === mapTip ? null : car.id)}
            />
          )}
        </div>
      ) : null}
    </>
  );

  const mapTipBlock =
    mapTip ? (
      <div
        style={{
          marginTop: 10,
          fontSize: 12,
          padding: 10,
          background: '#fff',
          border: '1px solid rgba(0,0,0,.08)',
          borderRadius: 10,
          flexShrink: 0,
        }}
      >
        {(() => {
          if (String(mapTip).startsWith('office-')) {
            const pin = rentalOfficeMarkers.find((z) => z.id === mapTip);
            return (
              <>
                <strong>{pin?.title || mapTip.replace(/^office-/, '')}</strong>
                <div style={{ color: 'var(--ta-ink-muted)', marginTop: 4, fontSize: 11 }}>Kiralama ofisi (Google Places)</div>
              </>
            );
          }
          const x = filtered.find((z) => z.id === mapTip);
          if (!x) return null;
          return (
            <>
              <strong>{x.company}</strong>
              <div style={{ color: 'var(--ta-accent-deep)', fontWeight: 800, marginTop: 4 }}>
                ₺{x.totalPrice.toLocaleString('tr-TR')} toplam
              </div>
            </>
          );
        })()}
      </div>
    ) : null;

  const pillBarTabletScroll = isCompact && !isPhone;

  return (
    <div style={cp.wrap}>
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
                ref={carBarRef}
                style={{
                  ...qp.barCluster,
                  ...(pillBarTabletScroll ? { flexWrap: 'nowrap', width: 'max-content', maxWidth: 'none' } : {}),
                }}
              >
                <div style={{ ...qp.titlePill, alignSelf: 'center' }}>
                  <span style={qp.spark} aria-hidden>
                    <Sparkles size={13} strokeWidth={2.2} color="var(--ta-accent)" />
                  </span>
                  <span style={qp.titleTxt}>Araç Kiralama</span>
                </div>
                {!isPhone ? <span style={qp.barSep} /> : null}
                <div style={qp.linkedRoute}>
                  <div style={qp.routeShell}>
                    <button
                      ref={pickLocBtnRef}
                      type="button"
                      style={qp.routeSegBtn}
                      aria-expanded={carCityPick === 'pickup'}
                      aria-haspopup="dialog"
                      onClick={() => {
                        setCarDatesOpen(false);
                        setPickTimeOpen(false);
                        setDropTimeOpen(false);
                        setAgePopOpen(false);
                        setCarCityPick((prev) => {
                          const next = prev === 'pickup' ? null : 'pickup';
                          if (next === 'pickup') setCarCityDraft(pickupLocation);
                          return next;
                        });
                      }}
                    >
                      <MapPin size={18} strokeWidth={1.85} color="#1a3764" aria-hidden />
                      <span style={{ minWidth: 0, flex: 1 }}>
                        <span style={qp.fieldLbl}>Alış noktası</span>
                        <span
                          style={{
                            ...(String(pickupLocation || '').trim() ? qp.fieldVal : qp.fieldPlaceholder),
                          }}
                        >
                          {String(pickupLocation || '').trim() || 'Şehir'}
                        </span>
                      </span>
                    </button>
                    <button type="button" style={qp.swapFab} onClick={swapCarLocations} aria-label="Alış ve teslim yerini değiştir">
                      <ArrowLeftRight size={15} color="#1a73e8" />
                    </button>
                    <button
                      ref={dropLocBtnRef}
                      type="button"
                      style={qp.routeSegBtn}
                      aria-expanded={carCityPick === 'dropoff'}
                      aria-haspopup="dialog"
                      onClick={() => {
                        setCarDatesOpen(false);
                        setPickTimeOpen(false);
                        setDropTimeOpen(false);
                        setAgePopOpen(false);
                        setCarCityPick((prev) => {
                          const next = prev === 'dropoff' ? null : 'dropoff';
                          if (next === 'dropoff') setCarCityDraft(dropoffLocation);
                          return next;
                        });
                      }}
                    >
                      <MapPin size={18} strokeWidth={1.85} color="#1a3764" aria-hidden />
                      <span style={{ minWidth: 0, flex: 1 }}>
                        <span style={qp.fieldLbl}>Teslim noktası</span>
                        <span
                          style={{
                            ...(String(dropoffLocation || '').trim() ? qp.fieldVal : qp.fieldPlaceholder),
                          }}
                        >
                          {String(dropoffLocation || '').trim() || 'Şehir'}
                        </span>
                      </span>
                    </button>
                  </div>
                </div>
                <button
                  ref={datesBtnRef}
                  type="button"
                  style={{
                    ...qp.fieldCard,
                    ...qp.fieldCardGrow,
                    ...(isPhone ? { width: '100%', flex: '1 1 100%', minWidth: 0 } : { flex: '1 1 180px', minWidth: 0 }),
                  }}
                  aria-expanded={carDatesOpen}
                  aria-haspopup="dialog"
                  onClick={() => {
                    setCarCityPick(null);
                    setPickTimeOpen(false);
                    setDropTimeOpen(false);
                    setAgePopOpen(false);
                    setCarDatesOpen((v) => !v);
                  }}
                >
                  <Calendar size={18} strokeWidth={1.85} color="#1a3764" aria-hidden />
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={qp.fieldLbl}>Tarihler</span>
                    <span style={qp.fieldVal}>
                      {formatShortRangeTR(splitDateTimeLocal(pickupAt).date, splitDateTimeLocal(returnAt).date)}
                    </span>
                  </span>
                </button>
                <button
                  ref={pickTimeBtnRef}
                  type="button"
                  style={{
                    ...qp.fieldCard,
                    flex: isPhone ? '1 1 100%' : '0 1 110px',
                    minWidth: 0,
                    ...(isPhone ? { width: '100%' } : {}),
                  }}
                  aria-expanded={pickTimeOpen}
                  aria-haspopup="listbox"
                  onClick={() => {
                    setCarCityPick(null);
                    setCarDatesOpen(false);
                    setDropTimeOpen(false);
                    setAgePopOpen(false);
                    setPickTimeOpen((v) => !v);
                  }}
                >
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={qp.fieldLbl}>Alış saati</span>
                    <span style={qp.fieldVal}>{formatHm12En(splitDateTimeLocal(pickupAt).time)}</span>
                  </span>
                  <ChevronDown size={16} strokeWidth={2} color="#5a6982" aria-hidden style={{ flexShrink: 0 }} />
                </button>
                <button
                  ref={dropTimeBtnRef}
                  type="button"
                  style={{
                    ...qp.fieldCard,
                    flex: isPhone ? '1 1 100%' : '0 1 110px',
                    minWidth: 0,
                    ...(isPhone ? { width: '100%' } : {}),
                  }}
                  aria-expanded={dropTimeOpen}
                  aria-haspopup="listbox"
                  onClick={() => {
                    setCarCityPick(null);
                    setCarDatesOpen(false);
                    setPickTimeOpen(false);
                    setAgePopOpen(false);
                    setDropTimeOpen((v) => !v);
                  }}
                >
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={qp.fieldLbl}>Teslim saati</span>
                    <span style={qp.fieldVal}>{formatHm12En(splitDateTimeLocal(returnAt).time)}</span>
                  </span>
                  <ChevronDown size={16} strokeWidth={2} color="#5a6982" aria-hidden style={{ flexShrink: 0 }} />
                </button>
                <button
                  ref={ageBtnRef}
                  type="button"
                  style={{
                    ...qp.fieldCard,
                    ...qp.fieldCardStatic,
                    flex: isPhone ? '1 1 100%' : '0 1 110px',
                    minWidth: isPhone ? 0 : 100,
                    ...(isPhone ? { width: '100%' } : {}),
                  }}
                  aria-expanded={agePopOpen}
                  aria-haspopup="dialog"
                    onClick={() => {
                      setCarCityPick(null);
                      setCarDatesOpen(false);
                      setPickTimeOpen(false);
                      setDropTimeOpen(false);
                      setAgePopOpen((v) => {
                        const next = !v;
                        if (next) setAgeDraft(ageBracket);
                        return next;
                      });
                    }}
                >
                  <User size={18} strokeWidth={1.85} color="#1a3764" aria-hidden />
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={qp.fieldLbl}>Yaş</span>
                    <span style={qp.fieldVal}>{CAR_DRIVER_AGE_OPTS.find((o) => o.value === ageBracket)?.label ?? ageBracket}</span>
                  </span>
                </button>
                {!isPhone ? <span style={qp.barSep} aria-hidden /> : null}
                <div
                  style={{
                    alignSelf: 'center',
                    flexShrink: 0,
                    ...(isPhone ? { width: '100%', marginTop: 6 } : {}),
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
                      closeCarQuickPanels();
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
            </div>
          </div>
        </div>
      </div>

      {carCityPick ? (
        <QuickPlanCityTextPanel
          innerRef={carCityPopRef}
          layout={carCityLayout}
          draft={carCityDraft}
          setDraft={setCarCityDraft}
          placeholder="Şehir"
          aria-label={carCityPick === 'pickup' ? 'Alış lokasyonu' : 'Teslim lokasyonu'}
          onDone={() => {
            if (carCityPick === 'pickup') setPickupLocation(carCityDraft);
            else setDropoffLocation(carCityDraft);
            setCarCityPick(null);
          }}
        />
      ) : null}
      <QuickPlanCalendarPopover
        innerRef={carDateRangePopoverRef}
        open={carDatesOpen}
        mode="range"
        committedStart={splitDateTimeLocal(pickupAt).date}
        committedEnd={splitDateTimeLocal(returnAt).date}
        layout={carDateRangeLayout}
        aria-label="Alış ve teslim tarihleri"
        onApply={(startD, endD) => {
          const pu = splitDateTimeLocal(pickupAt);
          const re = splitDateTimeLocal(returnAt);
          let s = startD;
          let e = endD;
          if (e < s) [s, e] = [e, s];
          setPickupAt(joinDateTimeLocal(s, pu.time));
          setReturnAt(joinDateTimeLocal(e, re.time));
          setCarDatesOpen(false);
        }}
      />
      {pickTimeOpen ? (
        <QuickPlanTimeListPopover
          innerRef={pickTimePopoverRef}
          layout={pickTimeLayout}
          valueHm={splitDateTimeLocal(pickupAt).time}
          aria-label="Alış saati seç"
          onSelect={(hm) => {
            setPickupAt(joinDateTimeLocal(splitDateTimeLocal(pickupAt).date, hm));
            setPickTimeOpen(false);
          }}
        />
      ) : null}
      {dropTimeOpen ? (
        <QuickPlanTimeListPopover
          innerRef={dropTimePopoverRef}
          layout={dropTimeLayout}
          valueHm={splitDateTimeLocal(returnAt).time}
          aria-label="Teslim saati seç"
          onSelect={(hm) => {
            setReturnAt(joinDateTimeLocal(splitDateTimeLocal(returnAt).date, hm));
            setDropTimeOpen(false);
          }}
        />
      ) : null}
      {agePopOpen ? (
        <QuickPlanSelectCommitPanel
          innerRef={agePopRef}
          layout={agePopLayout}
          aria-label="Sürücü yaşı"
          value={ageDraft}
          onChange={setAgeDraft}
          options={CAR_DRIVER_AGE_OPTS}
          onDone={() => {
            setAgeBracket(ageDraft);
            setAgePopOpen(false);
          }}
        />
      ) : null}

      <div
        style={{
          ...cp.mainScroll,
          ...(splitCarDesktop ? cp.mainScrollSplit : {}),
        }}
      >
        {splitCarDesktop ? (
          <div style={cp.bodySplitMap}>
            <aside style={cp.filterAsideSplit}>{filterPanel}</aside>
            <div style={cp.listScrollColCar}>{carListBody}</div>
            <aside style={cp.mapAsideSplit}>
              <div style={cp.mapSplitInner}>
                <div style={cp.mapSplitFrame}>
                  {useCarGoogleMap ? (
                    <QuickPlanMap
                      showChrome={false}
                      center={carMapDisplayCenter}
                      markers={carMapMarkers}
                      zoom={rentalOfficeMarkers.length ? 11 : 12}
                      minHeight={0}
                      fillHeight
                      onMarkerClick={(m) => setMapTip(m.id === mapTip ? null : m.id)}
                    />
                  ) : (
                    <CarMapPlaceholder
                      cars={filtered}
                      hoveredId={hoverMap}
                      setHoveredId={setHoverMap}
                      onPinClick={(car) => setMapTip(car.id === mapTip ? null : car.id)}
                      fillHeight
                    />
                  )}
                </div>
                {mapTipBlock}
              </div>
            </aside>
          </div>
        ) : (
          <div
            style={{
              ...cp.body,
              ...(!hasSearched ? { flex: 1, minHeight: 0, alignItems: 'stretch' } : {}),
            }}
          >
            {hasSearched && !isCompact ? <aside style={cp.aside}>{filterPanel}</aside> : null}
            <div
              style={{
                ...cp.center,
                ...(!hasSearched
                  ? {
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      flex: 1,
                      minHeight: 0,
                    }
                  : {}),
              }}
            >
              {carListBody}
            </div>
            {hasSearched && !isCompact && !loading && filtered.length > 0 ? (
              <aside style={cp.mapAside}>
                <div style={{ position: 'sticky', top: 24 }}>
                  {useCarGoogleMap ? (
                    <QuickPlanMap
                      showChrome={false}
                      center={carMapDisplayCenter}
                      markers={carMapMarkers}
                      zoom={rentalOfficeMarkers.length ? 11 : 12}
                      minHeight={320}
                      onMarkerClick={(m) => setMapTip(m.id === mapTip ? null : m.id)}
                    />
                  ) : (
                    <CarMapPlaceholder
                      cars={filtered}
                      hoveredId={hoverMap}
                      setHoveredId={setHoverMap}
                      onPinClick={(car) => setMapTip(car.id === mapTip ? null : car.id)}
                    />
                  )}
                  {mapTipBlock}
                </div>
              </aside>
            ) : null}
          </div>
        )}
      </div>

      {isCompact && filterDrawer ? (
        <div style={cp.drawerBg} onClick={() => setFilterDrawer(false)} role="presentation">
          <div style={cp.drawer} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal>
            <div style={cp.drawerHead}>
              <span style={{ fontWeight: 700 }}>Filtreler</span>
              <button type="button" style={cp.drawerX} onClick={() => setFilterDrawer(false)}>
                <X size={20} />
              </button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: '0 14px 20px' }}>{filterPanelBody}</div>
            <div style={{ padding: 14, borderTop: '1px solid rgba(0,0,0,.06)' }}>
              <button type="button" style={{ ...cp.btn, width: '100%' }} onClick={() => setFilterDrawer(false)}>
                Göster ({filtered.length})
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const cp = {
  wrap: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-sans)' },
  stickyTop: {
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
    padding: '8px 5px 8px 8px',
    border: '1px solid var(--line)',
    borderRadius: 999,
    background: 'var(--surface2)',
    boxShadow: 'var(--shadow-sm)',
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
  },
  pillBarDesktop: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: '4px 4px',
    width: 'max-content',
    maxWidth: '100%',
    padding: '8px 6px 8px 8px',
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
  pillBarMain: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '4px 4px',
    flex: '0 1 auto',
    minWidth: 0,
  },
  pillBarMainMobile: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 8,
    width: '100%',
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
  pillGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    flexShrink: 0,
    minWidth: 0,
  },
  pillGroupDate: {
    flex: '1 1 150px',
    minWidth: 120,
    maxWidth: 220,
    flexShrink: 1,
  },
  pillGroupAge: {
    flex: '0 0 auto',
    flexShrink: 0,
    width: 'auto',
    maxWidth: 'none',
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
    margin: '0 4px',
    flexShrink: 0,
  },
  barDot: {
    color: 'rgba(0,0,0,.25)',
    fontSize: 14,
    padding: '0 2px',
    userSelect: 'none',
    flexShrink: 0,
  },
  chipInp: {
    border: 'none',
    background: 'transparent',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: 'inherit',
    color: 'var(--ta-ink)',
    minWidth: 0,
    padding: '6px 8px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  locFieldCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
    flexShrink: 0,
    minWidth: 0,
  },
  locFieldLbl: {
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--ta-ink-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    lineHeight: 1.25,
    whiteSpace: 'normal',
    textAlign: 'center',
    maxWidth: '100%',
  },
  pickupInp: {
    maxWidth: 160,
    width: 132,
    flex: '0 0 auto',
  },
  dropoffInp: {
    maxWidth: 160,
    width: 132,
    flex: '0 0 auto',
  },
  chipFullWidth: {
    width: '100%',
    maxWidth: 'none',
  },
  chipDateTime: {
    border: 'none',
    background: 'transparent',
    fontSize: 12,
    fontWeight: 600,
    fontFamily: 'inherit',
    color: 'var(--ta-ink)',
    padding: '4px 2px',
    minWidth: 0,
    maxWidth: 200,
    width: '100%',
    boxSizing: 'border-box',
  },
  chipSelect: {
    border: 'none',
    background: 'transparent',
    fontSize: 12,
    fontWeight: 600,
    fontFamily: 'inherit',
    color: 'var(--ta-ink)',
    padding: '6px 8px',
    cursor: 'pointer',
    maxWidth: 120,
    flexShrink: 0,
  },
  /* Tarih/saat alanları (chipDateTime) ile aynı görünüm */
  chipSelectAge: {
    fontSize: 12,
    fontWeight: 600,
    fontFamily: 'inherit',
    color: 'var(--ta-ink)',
    padding: '4px 2px',
    lineHeight: 1.25,
    maxWidth: 'none',
    width: 'auto',
    minWidth: 'min-content',
    boxSizing: 'border-box',
  },
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
    width: 220,
    flexShrink: 0,
    minHeight: 0,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    alignSelf: 'stretch',
    background: '#fff',
    border: '1px solid rgba(0,0,0,.08)',
    borderRadius: 12,
    padding: '12px 10px',
    boxSizing: 'border-box',
    marginLeft: 12,
  },
  listScrollColCar: {
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
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
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
  btn: {
    padding: '12px 20px',
    borderRadius: 10,
    border: 'none',
    background: 'var(--ta-accent)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 2px 8px rgba(74,98,120,.35)',
  },
  body: {
    flex: 1,
    display: 'flex',
    maxWidth: 'none',
    margin: 0,
    width: '100%',
    boxSizing: 'border-box',
    padding: '18px 20px 40px 12px',
    gap: 18,
    alignItems: 'flex-start',
  },
  aside: {
    width: 220,
    flexShrink: 0,
    background: '#fff',
    border: '1px solid rgba(0,0,0,.08)',
    borderRadius: 12,
    padding: '14px 12px',
    position: 'sticky',
    top: 158,
    maxHeight: 'calc(100vh - 176px)',
    overflowY: 'auto',
  },
  mapAside: { width: 280, flexShrink: 0 },
  center: { flex: 1, minWidth: 0, position: 'relative' },
  fab: {
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
  filterPanelHeading: {
    fontSize: 13,
    fontWeight: 800,
    color: 'var(--ta-ink)',
    margin: '0 0 12px',
    paddingBottom: 8,
    borderBottom: '1px solid rgba(0,0,0,.08)',
    fontFamily: 'var(--font-sans)',
  },
  filterSecBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
    padding: '8px 2px 6px 0',
    border: 'none',
    borderBottom: '1px solid rgba(0,0,0,.06)',
    background: 'transparent',
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--ta-ink)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'left',
    boxSizing: 'border-box',
  },
  filterSecChev: {
    fontSize: 10,
    color: 'var(--ta-ink-muted)',
    flexShrink: 0,
    marginLeft: 8,
  },
  title: { fontSize: 12, fontWeight: 700, color: 'var(--ta-ink)', marginTop: 10, marginBottom: 8 },
  tabs: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  tab: {
    padding: '6px 8px',
    borderRadius: 8,
    border: '1px solid rgba(0,0,0,.1)',
    background: '#fff',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    color: 'var(--ta-ink-muted)',
  },
  tabOn: { background: 'var(--ta-accent)', color: '#fff', borderColor: 'var(--ta-accent)' },
  ck: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ta-ink)', marginBottom: 6, cursor: 'pointer' },
  empty: { textAlign: 'center', padding: '40px 16px', color: 'var(--muted)' },
  emptyIcon: { display: 'flex', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: 600, color: 'var(--ta-ink-muted)', margin: '0 0 6px' },
  emptySub: { fontSize: 14, color: 'var(--ta-ink-subtle)', margin: 0 },
  card: {
    display: 'grid',
    gridTemplateColumns: 'minmax(168px,210px) 1fr minmax(200px,248px)',
    gap: 20,
    background: '#fff',
    border: '1px solid rgba(0,0,0,.08)',
    borderRadius: 12,
    padding: '18px 20px',
    boxSizing: 'border-box',
    alignItems: 'start',
  },
  iconBtn: {
    border: '1px solid rgba(0,0,0,.08)',
    background: '#fff',
    borderRadius: 999,
    padding: 7,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 6px rgba(0,0,0,.06)',
  },
  carName: { fontSize: 17, fontWeight: 800, color: 'var(--ta-ink)', lineHeight: 1.25, paddingRight: 72 },
  similar: { fontSize: 13, color: 'var(--ta-ink-muted)', marginTop: 6 },
  specs: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px 14px',
    fontSize: 12,
    marginTop: 12,
    color: 'var(--ta-ink)',
  },
  specItem: { display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' },
  badges: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  badge: {
    fontSize: 11,
    fontWeight: 600,
    color: '#2e7d32',
    padding: '4px 8px',
    borderRadius: 6,
    background: 'rgba(46,125,50,.08)',
  },
  coRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: '4px 10px',
    marginTop: 14,
  },
  coName: { fontWeight: 700, fontSize: 14, color: 'var(--ta-ink)' },
  moreLinkInline: {
    margin: 0,
    border: 'none',
    background: 'none',
    padding: 0,
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--ta-accent-deep)',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontFamily: 'inherit',
    flexShrink: 0,
  },
  priceCol: { display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'right' },
  priceMainRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: '4px 10px',
    width: '100%',
  },
  priceMeta: { fontSize: 11, fontWeight: 600, color: 'var(--ta-ink-muted)', marginTop: 0 },
  priceDaily: { fontSize: 12, color: 'var(--ta-ink-subtle)', marginTop: 2 },
  discBadge: {
    background: '#c62828',
    color: '#fff',
    fontSize: 10,
    fontWeight: 800,
    padding: '4px 8px',
    borderRadius: 6,
  },
  strike: { fontSize: 13, color: 'var(--ta-ink-subtle)', textDecoration: 'line-through' },
  bigPrice: { fontSize: 22, fontWeight: 800, color: 'var(--ta-ink)' },
  secTitle: { fontSize: 18, fontWeight: 700, color: 'var(--ta-ink)', margin: '0 0 12px' },
  promoRow: { display: 'grid', gap: 12 },
  promo: {
    background: '#fff',
    border: '1px solid rgba(0,0,0,.08)',
    borderRadius: 12,
    padding: 16,
    textDecoration: 'none',
    color: 'inherit',
    display: 'block',
  },
  promoT: { fontWeight: 700, fontSize: 15, color: 'var(--ta-ink)' },
  promoS: { fontSize: 12, color: 'var(--ta-ink-muted)', marginTop: 4 },
  drawerBg: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,.35)',
    zIndex: 100,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  drawer: {
    width: 'min(360px, 94vw)',
    height: '100%',
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
  },
  drawerHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    borderBottom: '1px solid rgba(0,0,0,.06)',
  },
  drawerX: { border: 'none', background: 'var(--ta-muted-bg)', borderRadius: 8, padding: 8, cursor: 'pointer' },
};
