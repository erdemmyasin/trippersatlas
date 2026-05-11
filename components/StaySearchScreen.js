'use client';

import { useState, useMemo, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import Link from 'next/link';
import {
  Heart,
  Bookmark,
  Share2,
  MapPin,
  Wand2,
  Map,
  X,
  ChevronDown,
  Search,
  Hotel,
  Sparkles,
  Star,
  Check,
  Calendar,
  Users,
} from 'lucide-react';
import { getMockHotels } from '@/lib/staySearchMock';
import { placesToStayHotels } from '@/lib/stayGoogleAdapter';
import {
  useIsPhoneLayout,
  useIsCompactSearchLayout,
  useSearchMapSplitWide,
  RangeDual,
} from '@/components/SearchScreenPrimitives';
import { StayFiltersModal } from '@/components/StayFiltersModal';
import QuickPlanMap from '@/components/QuickPlanMap';
import {
  appendRegionalGeocodeContext,
  defaultStayCity,
  defaultMapAnchorPreset,
  defaultHotelTextQueryPrefix,
} from '@/lib/taRegion';
import { qp } from '@/lib/quickPlanFilterStyles';
import FilterField from '@/components/FilterField';
import EmptyState from '@/components/EmptyState';
import SkeletonList from '@/components/SkeletonList';
import { useExclusivePopover } from '@/hooks/useExclusivePopover';
import { datePanelCoords, popoverCoords } from '@/lib/popoverCoords';
import { useQuickPlanBarDismiss } from '@/hooks/useQuickPlanBarDismiss';
import {
  QuickPlanCalendarPopover,
  QuickPlanStayGuestsPanel,
  QuickPlanCityTextPanel,
  formatShortRangeTR,
} from '@/components/QuickPlanAnchoredWidgets';

const STAR_OPTS = [1, 2, 3, 4, 5];
const TYPE_OPTS = ['Otel', 'Apart', 'Villa', 'Hostel', 'Pansiyon'];
const FEAT_OPTS = ['Havuz', 'Spa', 'Ücretsiz WiFi', 'Otopark', 'Kahvaltı dahil'];

function scoreLabel(s) {
  if (s >= 9) return 'Mükemmel';
  if (s >= 8) return 'Çok İyi';
  return 'İyi';
}

function scoreColor(s) {
  if (s >= 9) return { bg: 'rgba(34,139,34,.15)', fg: '#1d6b1d' };
  if (s >= 8) return { bg: 'rgba(76,175,80,.18)', fg: '#2e7d32' };
  return { bg: 'rgba(31,77,92,.2)', fg: 'var(--ta-accent-deep)' };
}

/** Mock mapX/mapY (0–100) → yaklaşık koordinat; şehir merkezine göre ~±8 km */
function approxLatLngFromMapPercent(anchor, mapX, mapY) {
  if (!anchor || !Number.isFinite(anchor.lat) || !Number.isFinite(anchor.lng)) return null;
  const x = ((Number(mapX) || 50) - 50) / 50;
  const y = (50 - (Number(mapY) || 50)) / 50;
  return {
    lat: anchor.lat + y * 0.07,
    lng: anchor.lng + x * 0.11,
  };
}

function resolveStayHotelCoords(h, mapAnchor) {
  if (Number.isFinite(h.lat) && Number.isFinite(h.lng)) {
    return { lat: h.lat, lng: h.lng };
  }
  if (h.mapX != null && h.mapY != null && mapAnchor) {
    return approxLatLngFromMapPercent(mapAnchor, h.mapX, h.mapY);
  }
  return null;
}

function percentile(sortedPrices, p) {
  if (!sortedPrices.length) return 0;
  const i = Math.min(sortedPrices.length - 1, Math.floor((p / 100) * (sortedPrices.length - 1)));
  return sortedPrices[i];
}

function StaySkeleton({ narrow }) {
  return <SkeletonList rows={5} narrow={narrow} />;
}

function StayMapPlaceholder({ hotels, hoveredId, setHoveredId, fillHeight = false, formatHotelTitle }) {
  const fmt = typeof formatHotelTitle === 'function' ? formatHotelTitle : (h) => h.name;
  return (
    <div
      style={{
        borderRadius: 12,
        border: '1px solid rgba(0,0,0,.08)',
        background: 'linear-gradient(165deg,#dfe8e4 0%,#c5d4cc 45%,#b8c9bf 100%)',
        minHeight: fillHeight ? 0 : 420,
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
          opacity: 0.35,
          backgroundImage:
            'repeating-linear-gradient(90deg,transparent,transparent 31px,rgba(255,255,255,.12) 31px,rgba(255,255,255,.12) 32px),repeating-linear-gradient(0deg,transparent,transparent 31px,rgba(255,255,255,.1) 31px,rgba(255,255,255,.1) 32px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          right: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--ta-ink)',
            background: 'rgba(255,255,255,.9)',
            padding: '6px 10px',
            borderRadius: 8,
          }}
        >
          Harita — demo
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--ta-ink-muted)',
            background: 'rgba(255,255,255,.9)',
            padding: '6px 10px',
            borderRadius: 8,
          }}
        >
          Haritada ara (API ile)
        </span>
      </div>
      {hotels.map((h) => {
        const active = hoveredId === h.id;
        const disp = fmt(h);
        const priceStr = `₺${Math.round(h.priceNight).toLocaleString('tr-TR')}`;
        return (
          <div
            key={h.id}
            style={{
              position: 'absolute',
              left: `${h.mapX}%`,
              top: `${h.mapY}%`,
              transform: 'translate(-50%, -100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              zIndex: active ? 4 : 2,
            }}
          >
            <button
              type="button"
              title={`${disp} · ${priceStr}/gece`}
              onMouseEnter={() => setHoveredId(h.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                border: 'none',
                padding: '4px 8px',
                borderRadius: 8,
                background: active ? 'var(--ta-ink)' : '#fff',
                color: active ? '#fff' : 'var(--ta-ink)',
                fontSize: 11,
                fontWeight: 800,
                boxShadow: '0 2px 10px rgba(0,0,0,.15)',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                whiteSpace: 'nowrap',
              }}
              aria-label={disp}
            >
              {priceStr}
            </button>
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: '7px solid transparent',
                borderRight: '7px solid transparent',
                borderTop: `8px solid ${active ? 'var(--ta-ink)' : '#fff'}`,
                filter: 'drop-shadow(0 2px 2px rgba(0,0,0,.12))',
              }}
            />
          </div>
        );
      })}
      {hoveredId ? (
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            right: 12,
            background: 'rgba(255,255,255,.96)',
            borderRadius: 10,
            padding: '10px 12px',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--ta-ink)',
            boxShadow: '0 4px 16px rgba(0,0,0,.1)',
            pointerEvents: 'none',
          }}
        >
          {(() => {
            const h = hotels.find((x) => x.id === hoveredId);
            if (!h) return null;
            return (
              <>
                {disp}
                <span style={{ color: 'var(--ta-accent-deep)', marginLeft: 8 }}>
                  ₺{Math.round(h.priceNight).toLocaleString('tr-TR')}/gece
                </span>
              </>
            );
          })()}
        </div>
      ) : null}
    </div>
  );
}

function buildDraftFromApplied({
  priceRange,
  distRange,
  stars,
  types,
  feats,
  scoreMin,
  freeCancelOnly,
  payLaterOnly,
  includeUnknownPrice,
  neighborhoods,
}) {
  return {
    priceRange: [...priceRange],
    distRange: [...distRange],
    stars: { ...stars },
    types: { ...types },
    feats: { ...feats },
    scoreMin,
    freeCancelOnly,
    payLaterOnly,
    includeUnknownPrice,
    neighborhoods: { ...neighborhoods },
  };
}

/** @typedef {{ requestId: number, city: string, mockSeed?: number, listedHotelTitle?: (h: { name: string }) => string }} StayTourEmbed */

export default function StaySearchScreen({
  /** `/turlar`: üst uçuş çubuğu dışında tüm Stay düzeni şehirden tetiklenir */
  tourEmbed = null,
} = {}) {
  const isPhone = useIsPhoneLayout();
  const isCompact = useIsCompactSearchLayout();
  const splitWide = useSearchMapSplitWide(1100);
  const [city, setCity] = useState(() => defaultStayCity());
  const [checkIn, setCheckIn] = useState(() => new Date().toISOString().slice(0, 10));
  const [checkOut, setCheckOut] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10);
  });
  const [rooms, setRooms] = useState(1);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  const [loading, setLoading] = useState(() => Boolean(tourEmbed && tourEmbed.requestId > 0));
  const [hasSearched, setHasSearched] = useState(() => Boolean(tourEmbed && tourEmbed.requestId > 0));
  const [raw, setRaw] = useState([]);
  const [saved, setSaved] = useState(() => new Set());
  const [liked, setLiked] = useState(() => new Set());
  const [hoverMap, setHoverMap] = useState(null);

  const [sortTab, setSortTab] = useState('rec');
  const [priceRange, setPriceRange] = useState([1500, 8000]);
  const [distRange, setDistRange] = useState([0, 15]);
  const [stars, setStars] = useState(() => Object.fromEntries(STAR_OPTS.map((s) => [s, true])));
  const [types, setTypes] = useState(() => Object.fromEntries(TYPE_OPTS.map((t) => [t, true])));
  const [feats, setFeats] = useState(() => Object.fromEntries(FEAT_OPTS.map((f) => [f, false])));
  const [scoreMin, setScoreMin] = useState('all');
  const [freeCancelOnly, setFreeCancelOnly] = useState(false);
  const [payLaterOnly, setPayLaterOnly] = useState(false);
  const [includeUnknownPrice, setIncludeUnknownPrice] = useState(false);
  const [neighborhoods, setNeighborhoods] = useState({});

  const [showMap, setShowMap] = useState(true);
  /** Son aramada geocode edilen şehir merkezi — mock otellerde pin için gerekli */
  const [mapAnchor, setMapAnchor] = useState(() => defaultMapAnchorPreset());
  const [allFiltersOpen, setAllFiltersOpen] = useState(false);
  const [smartOpen, setSmartOpen] = useState(false);
  const [modalDraft, setModalDraft] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const searchThrottleRef = useRef(0);

  const stayBarRef = useRef(null);
  const cityBtnRef = useRef(null);
  const dateBtnRef = useRef(null);
  const paxBtnRef = useRef(null);
  const stayCityPopRef = useRef(null);
  const stayDatePopRef = useRef(null);
  const stayPaxPopRef = useRef(null);

  const stayPanel = useExclusivePopover();
  const stayCityOpen = stayPanel.isOpen('city');
  const stayDateOpen = stayPanel.isOpen('date');
  const stayPaxOpen = stayPanel.isOpen('pax');
  const [stayCityDraft, setStayCityDraft] = useState('');
  const [stayCityLayout, setStayCityLayout] = useState({ top: 0, left: 0, width: 'min(340px, calc(100vw - 20px))' });
  const [stayDateLayout, setStayDateLayout] = useState({ top: 0, left: 10 });
  const [stayPaxLayout, setStayPaxLayout] = useState({ top: 0, left: 0, width: 'min(340px, calc(100vw - 20px))' });
  const closeStayQuickPanels = stayPanel.close;

  useLayoutEffect(() => {
    if (tourEmbed || !stayCityOpen) return undefined;
    const el = cityBtnRef.current;
    function u() {
      setStayCityLayout({ ...popoverCoords(el, 340), width: 'min(340px, calc(100vw - 20px))' });
    }
    u();
    window.addEventListener('resize', u);
    window.addEventListener('scroll', u, true);
    return () => {
      window.removeEventListener('resize', u);
      window.removeEventListener('scroll', u, true);
    };
  }, [tourEmbed, stayCityOpen]);

  useLayoutEffect(() => {
    if (tourEmbed || !stayDateOpen) return undefined;
    const el = dateBtnRef.current;
    function u() {
      setStayDateLayout(datePanelCoords(el, 504));
    }
    u();
    window.addEventListener('resize', u);
    window.addEventListener('scroll', u, true);
    return () => {
      window.removeEventListener('resize', u);
      window.removeEventListener('scroll', u, true);
    };
  }, [tourEmbed, stayDateOpen]);

  useLayoutEffect(() => {
    if (tourEmbed || !stayPaxOpen) return undefined;
    const el = paxBtnRef.current;
    function u() {
      setStayPaxLayout({ ...popoverCoords(el, 360), width: 'min(360px, calc(100vw - 20px))' });
    }
    u();
    window.addEventListener('resize', u);
    window.addEventListener('scroll', u, true);
    return () => {
      window.removeEventListener('resize', u);
      window.removeEventListener('scroll', u, true);
    };
  }, [tourEmbed, stayPaxOpen]);

  const stayQuickPanelsOpen = !tourEmbed && stayPanel.anyOpen;
  const ignoreStayQuickPointer = useCallback(
    (t) =>
      !!(stayBarRef.current?.contains(t)) ||
      !!(stayCityPopRef.current?.contains(t)) ||
      !!(stayDatePopRef.current?.contains(t)) ||
      !!(stayPaxPopRef.current?.contains(t)),
    []
  );
  useQuickPlanBarDismiss(stayQuickPanelsOpen, ignoreStayQuickPointer, closeStayQuickPanels);

  const bounds = useMemo(() => {
    if (!raw.length) return { price: [1500, 8000], dist: [0, 15] };
    let pMin = Infinity;
    let pMax = -Infinity;
    let dMin = Infinity;
    let dMax = -Infinity;
    for (const h of raw) {
      pMin = Math.min(pMin, h.priceNight);
      pMax = Math.max(pMax, h.priceNight);
      dMin = Math.min(dMin, h.distCenter);
      dMax = Math.max(dMax, h.distCenter);
    }
    const pb = [Math.floor(pMin), Math.ceil(pMax)];
    const db = [Math.max(0, Math.floor(dMin * 10) / 10), Math.ceil(dMax * 10) / 10];
    return { price: pb, dist: db };
  }, [raw]);

  const defaultDraft = useCallback(() => {
    const dist = bounds.dist;
    const price = bounds.price;
    const u = raw.length ? [...new Set(raw.map((h) => h.district))] : [];
    return {
      priceRange: [...price],
      distRange: [...dist],
      stars: Object.fromEntries(STAR_OPTS.map((s) => [s, true])),
      types: Object.fromEntries(TYPE_OPTS.map((t) => [t, true])),
      feats: Object.fromEntries(FEAT_OPTS.map((f) => [f, false])),
      scoreMin: 'all',
      freeCancelOnly: false,
      payLaterOnly: false,
      includeUnknownPrice: false,
      neighborhoods: Object.fromEntries(u.map((d) => [d, true])),
    };
  }, [bounds, raw]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    const [pLo, pHi] = priceRange;
    const [bPLo, bPHi] = bounds.price;
    if (pLo > bPLo + 1 || pHi < bPHi - 1) n++;
    const [dLo, dHi] = distRange;
    const [bDLo, bDHi] = bounds.dist;
    if (dLo > bDLo + 0.05 || dHi < bDHi - 0.05) n++;
    if (STAR_OPTS.some((s) => !stars[s])) n++;
    if (TYPE_OPTS.some((t) => !types[t])) n++;
    if (FEAT_OPTS.some((f) => feats[f])) n++;
    if (scoreMin !== 'all') n++;
    if (freeCancelOnly) n++;
    if (payLaterOnly) n++;
    if (includeUnknownPrice) n++;
    if (Object.values(neighborhoods).some((v) => v === false)) n++;
    return n;
  }, [
    priceRange,
    distRange,
    bounds,
    stars,
    types,
    feats,
    scoreMin,
    freeCancelOnly,
    payLaterOnly,
    includeUnknownPrice,
    neighborhoods,
  ]);

  const priceStats = useMemo(() => {
    const prices = raw.map((h) => h.priceNight).sort((a, b) => a - b);
    const p75 = Math.ceil(percentile(prices, 75));
    return { p75, prices };
  }, [raw]);

  const filtered = useMemo(() => {
    let list = raw.filter((h) => {
      if (h.priceNight < priceRange[0] || h.priceNight > priceRange[1]) return false;
      if (h.distCenter < distRange[0] || h.distCenter > distRange[1]) return false;
      if (!stars[h.stars]) return false;
      const typeOk = h.types.some((t) => types[t]);
      if (!typeOk) return false;
      const needFeats = FEAT_OPTS.filter((f) => feats[f]);
      if (needFeats.length && !needFeats.every((f) => h.features.includes(f))) return false;
      if (scoreMin === '9' && h.score < 9) return false;
      if (scoreMin === '8' && h.score < 8) return false;
      if (scoreMin === '7' && h.score < 7) return false;
      if (freeCancelOnly && !h.freeCancel) return false;
      if (payLaterOnly && !h.payAtHotel) return false;
      if (neighborhoods[h.district] === false) return false;
      return true;
    });

    if (sortTab === 'price') list = [...list].sort((a, b) => a.priceNight - b.priceNight);
    else if (sortTab === 'score') list = [...list].sort((a, b) => b.score - a.score);
    else if (sortTab === 'stars') list = [...list].sort((a, b) => b.stars - a.stars);
    else
      list = [...list].sort(
        (a, b) => b.score * 1000 - b.priceNight - (a.score * 1000 - a.priceNight)
      );

    return list;
  }, [
    raw,
    priceRange,
    distRange,
    stars,
    types,
    feats,
    scoreMin,
    sortTab,
    freeCancelOnly,
    payLaterOnly,
    neighborhoods,
  ]);

  const resolveListedTitle = useCallback(
    (h) => (tourEmbed?.listedHotelTitle ? tourEmbed.listedHotelTitle(h) : h.name),
    // Turda başlık fonksiyonu; turEmbed kimliği her render’da değişebilir, yalnızca formatter’ı izliyoruz
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listedHotelTitle değişince başlık güncellenir
    [tourEmbed?.listedHotelTitle]
  );

  const applyHotelList = useCallback((data) => {
    let pMin = Infinity;
    let pMax = -Infinity;
    let dMin = Infinity;
    let dMax = -Infinity;
    for (const h of data) {
      pMin = Math.min(pMin, h.priceNight);
      pMax = Math.max(pMax, h.priceNight);
      dMin = Math.min(dMin, h.distCenter);
      dMax = Math.max(dMax, h.distCenter);
    }
    const pb = [Math.floor(pMin), Math.ceil(pMax)];
    const db = [Math.max(0, Math.floor(dMin * 10) / 10), Math.ceil(dMax * 10) / 10];
    const u = [...new Set(data.map((h) => h.district))];
    setNeighborhoods(Object.fromEntries(u.map((d) => [d, true])));
    setPriceRange(pb);
    setDistRange(db);
    setRaw(data);
  }, []);

  const fetchHotelsForCity = useCallback(async (cityStrInput, { mockSeed: seedOpt } = {}) => {
    const cityStr = (cityStrInput || '').trim() || defaultStayCity();

    setLoading(true);
    setHasSearched(true);
    setSearchError(null);
    await new Promise((r) => setTimeout(r, 400));

    let center = { ...defaultMapAnchorPreset() };

    try {
      const geoRes = await fetch(
        `/api/places/geocode?address=${encodeURIComponent(appendRegionalGeocodeContext(cityStr))}`
      );
      const geo = await geoRes.json();
      if (geo?.lat != null && geo?.lng != null) {
        center = { lat: geo.lat, lng: geo.lng };
      }
    } catch (e) {
      console.error('Geocode error', e);
    }

    setMapAnchor(center);

    try {
      const res = await fetch('/api/places/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `${defaultHotelTextQueryPrefix()} ${cityStr}`.trim(),
          type: 'hotel',
          lat: center.lat,
          lng: center.lng,
          radius: 40000,
        }),
      });
      const data = await res.json();
      const places = data.places || [];
      if (!places.length) {
        throw new Error('empty_places');
      }
      const hotels = placesToStayHotels(places, cityStr, center);
      applyHotelList(hotels);
    } catch (e) {
      console.error('Places search failed:', e);
      setSearchError('Sonuç bulunamadı veya bağlantı hatası. Örnek veriler gösteriliyor.');
      const seed = typeof seedOpt === 'number' ? seedOpt : Date.now();
      const data = getMockHotels({ city: cityStr, seed });
      applyHotelList(data);
    } finally {
      setLoading(false);
    }
  }, [applyHotelList]);

  useEffect(() => {
    if (!tourEmbed || tourEmbed.requestId < 1) return;
    const cityStr = (tourEmbed.city || '').trim() || defaultStayCity();
    setCity(cityStr);
    void fetchHotelsForCity(cityStr, { mockSeed: tourEmbed.mockSeed });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- yalnızca yeni paket araması (requestId/şehir/seed)
  }, [tourEmbed?.requestId, tourEmbed?.city, tourEmbed?.mockSeed, fetchHotelsForCity]);

  const search = useCallback(() => {
    const now = Date.now();
    if (now - searchThrottleRef.current < 500) return;
    searchThrottleRef.current = now;
    const cityStr = city.trim() || defaultStayCity();
    void fetchHotelsForCity(cityStr, {});
  }, [city, fetchHotelsForCity]);

  const googleMapMarkers = useMemo(() => {
    const out = [];
    for (const h of filtered) {
      const pos = resolveStayHotelCoords(h, mapAnchor);
      if (!pos) continue;
      out.push({
        id: h.id,
        lat: pos.lat,
        lng: pos.lng,
        title: resolveListedTitle(h),
        price:
          h.source === 'google' && h.priceLevelLabel && h.priceLevelLabel !== '—'
            ? `${h.priceLevelLabel} · ~₺${h.priceNight.toLocaleString('tr-TR')}`
            : `₺${h.priceNight.toLocaleString('tr-TR')}`,
        imageUrl: h.photoUrl || undefined,
        rating: h.score,
      });
    }
    return out;
  }, [filtered, mapAnchor, resolveListedTitle]);

  const stayMapCenter = useMemo(() => {
    if (googleMapMarkers.length === 0) return mapAnchor;
    const la = googleMapMarkers.reduce((s, m) => s + m.lat, 0) / googleMapMarkers.length;
    const ln = googleMapMarkers.reduce((s, m) => s + m.lng, 0) / googleMapMarkers.length;
    return { lat: la, lng: ln };
  }, [googleMapMarkers, mapAnchor]);

  const mapsPublicKey = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY : '';
  const useGoogleMapUi = !!mapsPublicKey;

  const applyModal = useCallback(() => {
    if (!modalDraft) return;
    setPriceRange(modalDraft.priceRange);
    setDistRange(modalDraft.distRange);
    setStars(modalDraft.stars);
    setTypes(modalDraft.types);
    setFeats(modalDraft.feats);
    setScoreMin(modalDraft.scoreMin);
    setFreeCancelOnly(modalDraft.freeCancelOnly);
    setPayLaterOnly(modalDraft.payLaterOnly);
    setIncludeUnknownPrice(modalDraft.includeUnknownPrice);
    setNeighborhoods(modalDraft.neighborhoods);
    setAllFiltersOpen(false);
  }, [modalDraft]);

  const shareHotel = useCallback((h) => {
    if (typeof window === 'undefined') return;
    const displayName = resolveListedTitle(h);
    const line = `₺${Number(h.priceNight).toLocaleString('tr-TR')}/gece`;
    const blurb = `${displayName} · ${h.district} — ${line} (Atlas)`;
    const url = `${window.location.origin}/stay`;
    if (navigator.share) {
      navigator
        .share({ title: displayName, text: blurb, url })
        .catch(() => {
          navigator.clipboard?.writeText(`${blurb}\n${url}`).catch(() => {});
        });
      return;
    }
    navigator.clipboard?.writeText(`${blurb}\n${url}`).catch(() => {});
  }, [resolveListedTitle]);

  const openAllFilters = useCallback(() => {
    setModalDraft(
      buildDraftFromApplied({
        priceRange,
        distRange,
        stars,
        types,
        feats,
        scoreMin,
        freeCancelOnly,
        payLaterOnly,
        includeUnknownPrice,
        neighborhoods,
      })
    );
    setAllFiltersOpen(true);
  }, [
    priceRange,
    distRange,
    stars,
    types,
    feats,
    scoreMin,
    freeCancelOnly,
    payLaterOnly,
    includeUnknownPrice,
    neighborhoods,
  ]);

  const closeAllFilters = useCallback(() => setAllFiltersOpen(false), []);

  const chipUnderPriceActive =
    raw.length > 0 && priceStats.p75 > 0 && priceRange[1] <= priceStats.p75 + 50 && priceRange[1] < bounds.price[1];
  const chipBreakfastActive = !!feats['Kahvaltı dahil'];
  const chipStars4Active = !stars[1] && !stars[2] && !stars[3] && stars[4] && stars[5];
  const chipScore8Active = scoreMin === '8';

  const splitMapDesktop =
    hasSearched && splitWide && !loading && filtered.length > 0 && showMap;

  const resultsToolbar =
    hasSearched && !loading ? (
      <div style={fp.toolbar}>
        <div style={fp.toolbarHeadRow}>
          <div style={fp.toolbarBlockTitle}>Hızlı Filtreler</div>
          <div
            style={{
              ...fp.toolbarRow,
              ...(isCompact && !isPhone ? fp.toolbarRowHScroll : {}),
            }}
          >
          <button type="button" style={fp.allFiltersBtn} onClick={openAllFilters}>
            Tüm filtreler
            {activeFilterCount > 0 ? <span style={fp.badge}>{activeFilterCount}</span> : null}
          </button>

          <div style={{ position: 'relative' }}>
            <button
              type="button"
              style={fp.chipGhost}
              onClick={() => setSmartOpen((v) => !v)}
              aria-expanded={smartOpen}
            >
              <Wand2 size={15} />
              Akıllı filtreler
              <ChevronDown size={14} style={{ opacity: 0.7 }} />
            </button>
            {smartOpen ? (
              <div style={fp.smartMenu}>
                <div style={fp.smartMenuTitle}>Hazır filtre setleri</div>
                <button
                  type="button"
                  style={fp.smartItem}
                  onClick={() => {
                    setFeats((f) => ({ ...f, 'Kahvaltı dahil': true, 'Ücretsiz WiFi': true }));
                    setScoreMin('8');
                    setSmartOpen(false);
                  }}
                >
                  İş seyahati — Wi‑Fi + kahvaltı, 8+ puan
                </button>
                <button
                  type="button"
                  style={fp.smartItem}
                  onClick={() => {
                    setStars({ 1: false, 2: false, 3: false, 4: true, 5: true });
                    setFeats((f) => ({ ...f, Havuz: true }));
                    setSmartOpen(false);
                  }}
                >
                  Aile — 4★+, havuz
                </button>
                <button
                  type="button"
                  style={fp.smartItem}
                  onClick={() => {
                    setFreeCancelOnly(true);
                    setPayLaterOnly(false);
                    setSmartOpen(false);
                  }}
                >
                  Esnek iptal
                </button>
              </div>
            ) : null}
          </div>

          {!isPhone ? (
            <button
              type="button"
              style={{ ...fp.chipGhost, ...(showMap ? fp.chipDark : {}) }}
              onClick={() => setShowMap((v) => !v)}
            >
              <Map size={15} />
              Harita alanı
              {showMap ? <X size={14} style={{ opacity: 0.8 }} /> : null}
            </button>
          ) : null}

          {raw.length > 0 && priceStats.p75 > 0 ? (
            <button
              type="button"
              style={{ ...fp.chip, ...(chipUnderPriceActive ? fp.chipOn : {}) }}
              onClick={() => {
                if (chipUnderPriceActive) {
                  setPriceRange([bounds.price[0], bounds.price[1]]);
                } else {
                  setPriceRange([bounds.price[0], Math.min(priceStats.p75, bounds.price[1])]);
                }
              }}
            >
              ₺{priceStats.p75.toLocaleString('tr-TR')} altı
            </button>
          ) : null}
          <button
            type="button"
            style={{ ...fp.chip, ...(chipBreakfastActive ? fp.chipOn : {}) }}
            onClick={() => setFeats((f) => ({ ...f, 'Kahvaltı dahil': !f['Kahvaltı dahil'] }))}
          >
            Ücretsiz kahvaltı
          </button>
          <button
            type="button"
            style={{ ...fp.chip, ...(chipStars4Active ? fp.chipOn : {}) }}
            onClick={() => {
              if (chipStars4Active) {
                setStars(Object.fromEntries(STAR_OPTS.map((s) => [s, true])));
              } else {
                setStars({ 1: false, 2: false, 3: false, 4: true, 5: true });
              }
            }}
          >
            Yıldız 4+
          </button>
          <button
            type="button"
            style={{ ...fp.chip, ...(chipScore8Active ? fp.chipOn : {}) }}
            onClick={() => setScoreMin((s) => (s === '8' ? 'all' : '8'))}
          >
            8+ konuk puanı
          </button>
          </div>
        </div>
      </div>
    ) : null;

  const resultsHeader =
    hasSearched && !loading ? (
      <div style={fp.resultsHead}>
        <div style={fp.resultsHeadTitle}>Sonuç listesi</div>
        <div style={fp.resultsHeadRow}>
          <span style={fp.resultsCount}>
            <strong>{filtered.length}</strong> sonuç
          </span>
          <label style={fp.sortLab}>
            Sıralama
            <select
              value={sortTab}
              onChange={(e) => setSortTab(e.target.value)}
              style={fp.sortSel}
            >
              <option value="rec">Önerilen</option>
              <option value="price">Fiyat (artan)</option>
              <option value="score">Konuk puanı (yüksek)</option>
              <option value="stars">Yıldız (yüksek)</option>
            </select>
          </label>
        </div>
      </div>
    ) : null;

  const pillBarTabletScroll = isCompact && !isPhone;

  return (
    <div style={{ ...fp.wrap, ...(tourEmbed ? { flex: 1, minHeight: 0 } : {}) }}>
      <div style={qp.stickyTop}>
        <div style={qp.stickyInner}>
          {!tourEmbed ? (
            <div style={{ ...qp.topBarRow, ...(isPhone ? qp.topBarRowMobile : {}) }}>
              <div
                style={
                  pillBarTabletScroll
                    ? qp.pillScrollOuter
                    : { width: '100%', minWidth: 0, display: 'flex', justifyContent: isPhone ? 'stretch' : 'center' }
                }
              >
                <div
                  ref={stayBarRef}
                  style={{
                    ...qp.barCluster,
                    ...(pillBarTabletScroll ? { flexWrap: 'nowrap', width: 'max-content', maxWidth: 'none' } : {}),
                  }}
                >
                  <div style={{ ...qp.titlePill, alignSelf: 'center' }}>
                    <span style={qp.spark} aria-hidden>
                      <Sparkles size={13} strokeWidth={2.2} color="var(--ta-accent)" />
                    </span>
                    <span style={qp.titleTxt}>Konaklama</span>
                  </div>
                  {!isPhone ? <span style={qp.barSep} /> : null}
                  <FilterField
                    ref={cityBtnRef}
                    icon={MapPin}
                    label="Destinasyon"
                    value={city}
                    placeholder="Şehir / bölge"
                    flex="1 1 180px"
                    isPhone={isPhone}
                    expanded={stayCityOpen}
                    onClick={() => {
                      setStayCityDraft(city);
                      stayPanel.toggle('city');
                    }}
                  />
                  <FilterField
                    ref={dateBtnRef}
                    icon={Calendar}
                    label="Tarihler"
                    value={formatShortRangeTR(checkIn, checkOut)}
                    flex="1 1 200px"
                    isPhone={isPhone}
                    expanded={stayDateOpen}
                    onClick={() => stayPanel.toggle('date')}
                  />
                  <FilterField
                    ref={paxBtnRef}
                    icon={Users}
                    label="Oda ve misafir"
                    value={`${rooms} oda · ${adults + children} kişi`}
                    flex="1 1 170px"
                    isPhone={isPhone}
                    expanded={stayPaxOpen}
                    onClick={() => stayPanel.toggle('pax')}
                  />
                  {!isPhone ? <span style={qp.barSep} /> : null}
                  <div
                    style={{
                      alignSelf: 'center',
                      ...(isPhone ? { width: '100%', marginTop: 4 } : {}),
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
                        closeStayQuickPanels();
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
          ) : null}

          {resultsToolbar}
        </div>
      </div>

      {!tourEmbed ? (
        <>
          <QuickPlanCityTextPanel
            innerRef={stayCityPopRef}
            layout={stayCityOpen ? stayCityLayout : null}
            draft={stayCityDraft}
            setDraft={setStayCityDraft}
            placeholder="Şehir / bölge"
            aria-label="Destinasyon"
            onDone={() => {
              setCity(stayCityDraft);
              stayPanel.close();
            }}
          />
          <QuickPlanCalendarPopover
            innerRef={stayDatePopRef}
            open={stayDateOpen}
            mode="range"
            committedStart={checkIn}
            committedEnd={checkOut}
            layout={stayDateLayout}
            aria-label="Giriş ve çıkış tarihleri"
            onApply={(s, e) => {
              setCheckIn(s);
              setCheckOut(e);
              stayPanel.close();
            }}
          />
          {stayPaxOpen ? (
            <QuickPlanStayGuestsPanel
              innerRef={stayPaxPopRef}
              layout={stayPaxLayout}
              rooms={rooms}
              setRooms={setRooms}
              adults={adults}
              setAdults={setAdults}
              childrenCount={children}
              setChildrenCount={setChildren}
            />
          ) : null}
        </>
      ) : null}

      <div
        style={{
          ...fp.mainScroll,
          ...(splitMapDesktop ? fp.mainScrollSplit : {}),
        }}
      >
      <div
        style={{
          ...(splitMapDesktop
            ? fp.bodySplitMap
            : {
                ...(hasSearched ? fp.bodyResults : fp.body),
                ...(hasSearched && !isCompact && showMap && !loading && filtered.length > 0
                  ? { alignItems: 'stretch' }
                  : { flexDirection: 'column' }),
                ...(!hasSearched
                  ? {
                      flex: 1,
                      minHeight: 0,
                      alignItems: 'stretch',
                      justifyContent: 'center',
                    }
                  : {}),
              }),
        }}
      >
        <div
          style={{
            ...(splitMapDesktop
              ? fp.listScrollCol
              : {
                  ...(hasSearched ? fp.centerWide : fp.center),
                  flex:
                    hasSearched && !isCompact && showMap && filtered.length > 0
                      ? undefined
                      : hasSearched
                        ? 1
                        : undefined,
                  ...(!hasSearched
                    ? {
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flex: 1,
                        minHeight: 0,
                      }
                    : {}),
                }),
          }}
        >
          {isCompact && hasSearched ? (
            <button type="button" style={fp.fab} onClick={openAllFilters}>
              Tüm filtreler
              {activeFilterCount > 0 ? <span style={{ ...fp.badge, marginLeft: 8 }}>{activeFilterCount}</span> : null}
            </button>
          ) : null}

          {resultsHeader}

          {searchError ? (
            <div
              style={{
                marginBottom: 12,
                padding: '10px 14px',
                borderRadius: 10,
                background: 'rgba(31,77,92,.12)',
                border: '1px solid rgba(31,77,92,.28)',
                fontSize: 13,
                color: '#5c4a2a',
                fontWeight: 600,
              }}
            >
              {searchError}
            </div>
          ) : null}

          {!hasSearched ? (
            <EmptyState
              icon={Hotel}
              title="Konaklama"
              description="Otel ve diğer konaklama seçeneklerini filtreleyin, fiyatları karşılaştırın."
            />
          ) : loading ? (
            <StaySkeleton narrow={isPhone} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Hotel}
              tone="muted"
              title="Sonuç bulunamadı"
              description={'Filtreleri genişletmeyi veya "Tüm filtreler"den sıfırlamayı deneyin.'}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {filtered.map((h) => {
                const sc = scoreColor(h.score);
                return (
                  <article
                    key={h.id}
                    style={{
                      ...fp.card,
                      position: 'relative',
                      boxShadow:
                        hoverMap === h.id
                          ? 'inset 0 0 0 2px var(--ta-accent), 0 2px 14px rgba(0,0,0,.05)'
                          : undefined,
                      ...(isPhone ? { gridTemplateColumns: '1fr' } : {}),
                    }}
                    className="ta-stay-card"
                    onMouseEnter={() => setHoverMap(h.id)}
                    onMouseLeave={() => setHoverMap(null)}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr',
                        gap: 6,
                        width: isPhone ? 72 : 70,
                        flexShrink: 0,
                        alignContent: 'start',
                      }}
                    >
                      {h.photoUrl ? (
                        // Google Places foto URL'leri için doğrudan img (domain key ile gelir)
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={h.photoUrl}
                          alt=""
                          style={{
                            width: '100%',
                            height: isPhone ? 168 : 168,
                            borderRadius: 8,
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        Array.from({ length: 3 }).map((_, i) => (
                          <div
                            key={i}
                            style={{
                              width: isPhone ? 72 : 70,
                              height: 52,
                              borderRadius: 7,
                              background: 'linear-gradient(135deg,#e4e2de,#d0ccc4)',
                            }}
                          />
                        ))
                      )}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={fp.hotelName}>{resolveListedTitle(h)}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                        <span style={{ display: 'inline-flex', gap: 2 }} aria-hidden>
                          {Array.from({ length: Math.min(5, h.stars || 0) }).map((_, i) => (
                            <Star key={i} size={14} fill="var(--ta-accent)" stroke="var(--ta-accent)" />
                          ))}
                        </span>
                        <span style={{ color: 'var(--ta-ink-subtle)', fontSize: 13 }}>
                          {h.stars} yıldız
                        </span>
                      </div>
                      <div style={fp.loc}>
                        <MapPin size={14} style={{ flexShrink: 0 }} />
                        {h.district}
                      </div>
                      <div style={fp.badges}>
                        {(h.features || []).slice(0, 4).map((f) => (
                          <span key={f} style={fp.badge}>
                            {f}
                          </span>
                        ))}
                      </div>
                      <div style={fp.room}>Oda: {h.roomType}</div>
                      <div style={fp.policies}>
                        {h.freeCancel ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <Check size={14} strokeWidth={2.5} aria-hidden />
                            Ücretsiz iptal
                          </span>
                        ) : null}
                        {h.payAtHotel ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <Check size={14} strokeWidth={2.5} aria-hidden />
                            Ödemeyi otelde yapın
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div style={fp.priceColWrap}>
                      <div
                        style={{
                          ...fp.priceCol,
                          alignItems: isPhone ? 'flex-start' : 'flex-end',
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            padding: '6px 10px',
                            borderRadius: 10,
                            background: sc.bg,
                            color: sc.fg,
                            fontWeight: 800,
                            fontSize: 15,
                            textAlign: 'center',
                            minWidth: 48,
                            alignSelf: isPhone ? 'flex-start' : 'flex-end',
                          }}
                        >
                          {h.score.toFixed(1)}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ta-ink)' }}>{scoreLabel(h.score)}</div>
                        <div style={{ fontSize: 11, color: 'var(--ta-ink-subtle)' }}>
                          {h.reviewCount.toLocaleString('tr-TR')} değerlendirme
                        </div>
                        <div
                          style={{
                            ...fp.priceMainRow,
                            justifyContent: isPhone ? 'flex-start' : 'flex-end',
                            alignSelf: isPhone ? 'flex-start' : 'flex-end',
                          }}
                        >
                          {h.oldPriceNight ? (
                            <span style={fp.oldPrice}>₺{h.oldPriceNight.toLocaleString('tr-TR')}</span>
                          ) : null}
                          <span style={fp.bigPrice}>₺{h.priceNight.toLocaleString('tr-TR')}</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--ta-ink-muted)' }}>
                          {h.source === 'google' ? 'Tahmini gece (Places)' : 'gece başına'}
                        </div>
                        {h.priceLevelLabel && h.priceLevelLabel !== '—' ? (
                          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ta-accent-deep)' }}>
                            Fiyat seviyesi: {h.priceLevelLabel}
                          </div>
                        ) : null}
                        <button
                          type="button"
                          style={{
                            ...fp.btn,
                            ...fp.btnDeal,
                            marginTop: 8,
                            alignSelf: isPhone ? 'flex-start' : 'flex-end',
                          }}
                        >
                          Fırsatı Gör
                        </button>
                      </div>
                      <div style={fp.cardIconStack}>
                        <button
                          type="button"
                          style={fp.cardIconBtn}
                          onClick={() =>
                            setLiked((prev) => {
                              const n = new Set(prev);
                              if (n.has(h.id)) n.delete(h.id);
                              else n.add(h.id);
                              return n;
                            })
                          }
                          aria-label={liked.has(h.id) ? 'Beğeniyi kaldır' : 'Beğen'}
                          title="Beğen"
                        >
                          <Heart
                            size={17}
                            color={liked.has(h.id) ? '#c53030' : 'var(--ta-ink-muted)'}
                            fill={liked.has(h.id) ? '#c53030' : 'transparent'}
                            strokeWidth={2.2}
                          />
                        </button>
                        <button
                          type="button"
                          style={fp.cardIconBtn}
                          onClick={() =>
                            setSaved((prev) => {
                              const n = new Set(prev);
                              if (n.has(h.id)) n.delete(h.id);
                              else n.add(h.id);
                              return n;
                            })
                          }
                          aria-label={saved.has(h.id) ? 'Kaydı kaldır' : 'Kaydet'}
                          title="Kaydet"
                        >
                          <Bookmark
                            size={17}
                            color={saved.has(h.id) ? 'var(--ta-accent-deep)' : 'var(--ta-ink-muted)'}
                            fill={saved.has(h.id) ? 'rgba(31,77,92,.2)' : 'transparent'}
                            strokeWidth={2.2}
                          />
                        </button>
                        <button
                          type="button"
                          style={fp.cardIconBtn}
                          onClick={() => shareHotel(h)}
                          aria-label="Paylaş"
                          title="Paylaş"
                        >
                          <Share2 size={17} color="var(--ta-ink-muted)" strokeWidth={2.2} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {hasSearched && !loading && !tourEmbed ? (
            <section style={{ marginTop: 36 }}>
              <h2 style={fp.secTitle}>Diğer aramalar</h2>
              <div style={{ ...fp.promoRow, gridTemplateColumns: isPhone ? '1fr' : '1fr 1fr' }}>
                <Link href="/cars" className="ta-flight-promo" style={fp.promo}>
                  <div style={fp.promoT}>Araçla gezin</div>
                  <div style={fp.promoS}>Kiralık araç fiyatlarını karşılaştırın</div>
                </Link>
                <Link href="/flights" className="ta-flight-promo" style={fp.promo}>
                  <div style={fp.promoT}>Uçuş ara</div>
                  <div style={fp.promoS}>Gidiş-dönüş ve tek yön biletler</div>
                </Link>
              </div>
            </section>
          ) : null}

          {isCompact && hasSearched && !loading && filtered.length > 0 && showMap ? (
            <div
              style={{
                marginTop: 16,
                borderRadius: 16,
                overflow: 'hidden',
                border: '1px solid rgba(0,0,0,.1)',
                minHeight: 280,
              }}
            >
              {useGoogleMapUi ? (
                <QuickPlanMap
                  showChrome={false}
                  center={stayMapCenter}
                  markers={googleMapMarkers}
                  zoom={13}
                  minHeight={280}
                />
              ) : (
                <StayMapPlaceholder
                  hotels={filtered}
                  hoveredId={hoverMap}
                  setHoveredId={setHoverMap}
                  formatHotelTitle={resolveListedTitle}
                />
              )}
            </div>
          ) : null}
        </div>

        {splitMapDesktop ? (
          <aside style={fp.mapAsideSplit}>
            <div style={fp.mapSplitInner}>
              <div style={fp.mapSplitFrame}>
                {useGoogleMapUi ? (
                  <QuickPlanMap
                    showChrome={false}
                    center={stayMapCenter}
                    markers={googleMapMarkers}
                    zoom={13}
                    minHeight={0}
                    fillHeight
                  />
                ) : (
                  <StayMapPlaceholder
                    hotels={filtered}
                    hoveredId={hoverMap}
                    setHoveredId={setHoverMap}
                    fillHeight
                    formatHotelTitle={resolveListedTitle}
                  />
                )}
              </div>
            </div>
          </aside>
        ) : null}
      </div>
      </div>

      {allFiltersOpen && modalDraft ? (
        <StayFiltersModal
          open={allFiltersOpen}
          onClose={closeAllFilters}
          draft={modalDraft}
          setDraft={setModalDraft}
          onApply={applyModal}
          defaultDraft={defaultDraft}
          raw={raw}
          bounds={bounds}
          layout={isPhone ? 'fullscreen' : 'dialog'}
        />
      ) : null}
    </div>
  );
}

const fp = {
  wrap: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-sans)' },
  mainScroll: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    overflowX: 'hidden',
    WebkitOverflowScrolling: 'touch',
  },
  /** Masaüstü: harita sabit, sadece sol liste kayar */
  mainScrollSplit: {
    overflow: 'hidden',
  },
  bodySplitMap: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
    maxWidth: 'none',
    margin: 0,
    gap: 'var(--space-3)',
    padding: 0,
    boxSizing: 'border-box',
  },
  listScrollCol: {
    position: 'relative',
    flex: '0 1 720px',
    minWidth: 260,
    maxWidth: 780,
    minHeight: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    WebkitOverflowScrolling: 'touch',
    marginLeft: 'var(--space-3)',
    padding: 'var(--space-3) var(--space-3) var(--space-7) var(--space-3)',
    boxSizing: 'border-box',
  },
  mapAsideSplit: {
    flex: '1 1 0',
    minWidth: 280,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    padding: 'var(--space-3) var(--space-5) var(--space-5) 0',
    boxSizing: 'border-box',
  },
  mapSplitInner: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  mapSplitFrame: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    boxShadow: '0 10px 32px rgba(35,28,18,.12)',
  },
  sticky: {
    flexShrink: 0,
    zIndex: 'var(--z-sticky)',
    background: '#fff',
    boxShadow: '0 1px 10px rgba(0,0,0,.05)',
    borderBottomWidth: 'var(--border-thin)',
    borderBottomStyle: 'solid',
    borderBottomColor: 'rgba(0,0,0,.06)',
  },
  stickyInner: { maxWidth: 1320, margin: '0 auto', padding: 'var(--space-3) var(--space-5) var(--space-3)', boxSizing: 'border-box' },
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
  pillGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    gap: 'var(--space-1)',
    flexShrink: 0,
    minWidth: 0,
  },
  stayPillGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-1)',
    flexShrink: 0,
    minWidth: 0,
  },
  pillGroupMobile: {
    alignItems: 'center',
    width: '100%',
  },
  pillGroupLbl: {
    fontSize: 10,
    fontWeight: 'var(--fw-bold)',
    color: 'var(--ta-ink-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    lineHeight: 1,
    whiteSpace: 'nowrap',
    textAlign: 'center',
    width: '100%',
  },
  stayPillBar: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 'var(--space-1) var(--space-2)',
    padding: 'var(--space-2) var(--space-2) var(--space-2) var(--space-2)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'var(--line)',
    borderRadius: 'var(--radius-pill)',
    background: 'var(--surface2)',
    boxShadow: 'var(--shadow-sm)',
    width: 'max-content',
    maxWidth: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
  },
  stayPillBarMobile: {
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-3) var(--space-3)',
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'stretch',
    alignItems: 'stretch',
  },
  pillScrollOuter: {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    overflowX: 'auto',
    overflowY: 'hidden',
    WebkitOverflowScrolling: 'touch',
    boxSizing: 'border-box',
    paddingBottom: 'var(--space-1)',
    scrollbarGutter: 'stable',
  },
  stayPillBarTabletWide: {
    flexWrap: 'nowrap',
    alignItems: 'center',
    maxWidth: 'none',
    width: 'max-content',
  },
  stayTitlePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-1) var(--space-3)',
    borderRadius: 'var(--radius-pill)',
    flexShrink: 0,
  },
  stayStar: { display: 'inline-flex', alignItems: 'center', flexShrink: 0 },
  stayTitleText: { fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', color: 'var(--text1)', whiteSpace: 'nowrap' },
  barSep: {
    width: 'var(--border-thin)',
    height: 'var(--space-4)',
    background: 'rgba(0,0,0,.10)',
    margin: '0 var(--space-2)',
    flexShrink: 0,
  },
  barDot: {
    color: 'rgba(0,0,0,.25)',
    fontSize: 'var(--text-md)',
    padding: '0 var(--space-px)',
    userSelect: 'none',
    flexShrink: 0,
  },
  stayChipInp: {
    border: 'none',
    background: 'transparent',
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--fw-semibold)',
    fontFamily: 'inherit',
    color: 'var(--ta-ink)',
    minWidth: 96,
    maxWidth: 220,
    padding: 'var(--space-2) var(--space-2)',
    outline: 'none',
    textAlign: 'center',
  },
  stayFullWidth: {
    width: '100%',
    maxWidth: 'none',
    minWidth: 0,
    boxSizing: 'border-box',
  },
  stayDatePair: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    flexWrap: 'wrap',
    justifyContent: 'center',
    flexShrink: 0,
    minWidth: 0,
  },
  stayDateField: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--space-px)',
    flexShrink: 0,
    minWidth: 0,
  },
  stayChipFieldLbl: {
    fontSize: 10,
    fontWeight: 'var(--fw-bold)',
    color: 'var(--ta-ink-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    lineHeight: 1,
    whiteSpace: 'nowrap',
  },
  stayDateArrowPair: {
    color: 'var(--ta-ink-subtle)',
    fontSize: 'var(--text-base)',
    userSelect: 'none',
    flexShrink: 0,
    lineHeight: 1,
    paddingBottom: 'var(--space-px)',
  },
  stayChipDate: {
    border: 'none',
    background: 'transparent',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--fw-semibold)',
    fontFamily: 'inherit',
    color: 'var(--ta-ink)',
    padding: 'var(--space-px) var(--space-px)',
    minWidth: 0,
  },
  stayPaxRow: {
    display: 'inline-flex',
    alignItems: 'stretch',
    flexWrap: 'wrap',
    gap: 0,
    padding: 'var(--space-1) var(--space-2) var(--space-1) var(--space-2)',
    borderRadius: 'var(--radius-pill)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'var(--ta-border-strong)',
    background: 'linear-gradient(180deg, var(--ta-elevated) 0%, var(--ta-muted-bg) 100%)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,.85), 0 1px 2px rgba(15, 23, 32, 0.04)',
  },
  stayPaxSegment: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    padding: 'var(--space-px) var(--space-3)',
    borderRightWidth: 'var(--border-thin)',
    borderRightStyle: 'solid',
    borderRightColor: 'var(--ta-border)',
  },
  stayPaxSegmentLast: { borderRightWidth: 0 },
  staySearchBlack: {
    display: 'inline-flex',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 'var(--space-2)',
    flexShrink: 0,
    padding: 'var(--space-2) var(--space-4)',
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--fw-semibold)',
    fontFamily: 'inherit',
    lineHeight: 1.2,
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(0,0,0,.15)',
    borderRadius: 'var(--radius-pill)',
    background: 'var(--ta-ink)',
    color: '#FFFFFF',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    minHeight: 34,
  },
  toolbar: {
    marginTop: 'var(--space-3)',
    paddingTop: 'var(--space-3)',
    borderTopWidth: 'var(--border-thin)',
    borderTopStyle: 'solid',
    borderTopColor: 'rgba(0,0,0,.06)',
  },
  toolbarHeadRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 'var(--space-3) var(--space-4)',
    width: '100%',
  },
  toolbarBlockTitle: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--fw-extrabold)',
    color: 'var(--ta-ink)',
    marginBottom: 0,
    letterSpacing: '0.02em',
    fontFamily: 'var(--font-sans)',
    flexShrink: 0,
    lineHeight: 1.2,
    paddingTop: 'var(--space-px)',
  },
  toolbarRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 'var(--space-3)',
    flex: '1 1 0',
    minWidth: 200,
  },
  toolbarRowHScroll: {
    flexWrap: 'nowrap',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
    paddingBottom: 'var(--space-2)',
    scrollbarGutter: 'stable',
  },
  allFiltersBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-3) var(--space-4)',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    background: 'var(--ta-ink)',
    color: '#fff',
    fontWeight: 'var(--fw-bold)',
    fontSize: 'var(--text-base)',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  badge: {
    minWidth: 22,
    height: 22,
    padding: '0 var(--space-2)',
    borderRadius: 'var(--radius-pill)',
    background: 'var(--ta-accent)',
    color: '#fff',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--fw-extrabold)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipGhost: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-2) var(--space-4)',
    borderRadius: 'var(--radius-pill)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(0,0,0,.12)',
    background: '#fff',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--fw-semibold)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    color: 'var(--ta-ink)',
  },
  chipDark: {
    background: 'var(--ta-ink)',
    color: '#fff',
    borderColor: 'var(--ta-ink)',
  },
  chip: {
    padding: 'var(--space-2) var(--space-4)',
    borderRadius: 'var(--radius-pill)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(0,0,0,.12)',
    background: '#fff',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--fw-semibold)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    color: 'var(--ta-ink)',
  },
  chipOn: {
    borderColor: 'var(--ta-accent)',
    background: 'rgba(31,77,92,.12)',
    color: 'var(--ta-accent-deep)',
  },
  smartMenuTitle: {
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--fw-extrabold)',
    color: 'var(--ta-ink-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    padding: 'var(--space-3) var(--space-3) var(--space-2)',
    borderBottomWidth: 'var(--border-thin)',
    borderBottomStyle: 'solid',
    borderBottomColor: 'rgba(0,0,0,.06)',
  },
  smartMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: 'var(--space-2)',
    minWidth: 280,
    background: '#fff',
    borderRadius: 'var(--radius-md)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(0,0,0,.1)',
    boxShadow: '0 12px 40px rgba(0,0,0,.12)',
    zIndex: 'var(--z-dropdown)',
    padding: 0,
    overflow: 'hidden',
  },
  smartItem: {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: 'var(--space-3) var(--space-4)',
    border: 'none',
    borderRadius: 'var(--radius-xs)',
    background: 'transparent',
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--fw-semibold)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    color: 'var(--ta-ink)',
  },
  resultsHead: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 'var(--space-2)',
    marginBottom: 'var(--space-3)',
  },
  resultsHeadTitle: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--fw-extrabold)',
    color: 'var(--ta-ink)',
    letterSpacing: '0.02em',
    fontFamily: 'var(--font-sans)',
  },
  resultsHeadRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--space-3)',
    flexWrap: 'wrap',
  },
  resultsCount: { fontSize: 'var(--text-lg)', color: 'var(--ta-ink-muted)' },
  sortLab: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--fw-semibold)',
    color: 'var(--ta-ink-muted)',
  },
  sortSel: {
    padding: 'var(--space-2) var(--space-3)',
    borderRadius: 'var(--radius-sm)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(0,0,0,.12)',
    fontSize: 'var(--text-base)',
    fontFamily: 'inherit',
    fontWeight: 'var(--fw-semibold)',
    background: '#fff',
    cursor: 'pointer',
  },
  btn: {
    padding: 'var(--space-3) var(--space-5)',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    background: 'var(--ta-accent)',
    color: '#fff',
    fontWeight: 'var(--fw-bold)',
    fontSize: 'var(--text-md)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 2px 8px rgba(31,77,92,.35)',
  },
  btnDeal: {
    padding: 'var(--space-2) var(--space-4)',
    borderRadius: 'var(--radius-xs)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--fw-bold)',
    width: 'auto',
    alignSelf: 'flex-end',
    boxShadow: '0 1px 6px rgba(31,77,92,.3)',
  },
  body: {
    flex: 1,
    display: 'flex',
    maxWidth: 1320,
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box',
    padding: 'var(--space-5) var(--space-5) var(--space-8)',
    gap: 'var(--space-4)',
    alignItems: 'flex-start',
  },
  /** Arama sonrası: dar sol şerit + geniş liste (1320 merkez boşluğu yok) */
  bodyResults: {
    flex: 1,
    display: 'flex',
    maxWidth: 'none',
    margin: 0,
    width: '100%',
    boxSizing: 'border-box',
    padding: 'var(--space-5) var(--space-5) var(--space-8) var(--space-3)',
    gap: 'var(--space-4)',
    alignItems: 'flex-start',
  },
  center: {
    flex: '0 1 632px',
    minWidth: 280,
    maxWidth: '100%',
    position: 'relative',
  },
  centerWide: {
    flex: 1,
    minWidth: 0,
    maxWidth: 'none',
    position: 'relative',
  },
  fab: {
    display: 'inline-flex',
    alignItems: 'center',
    marginBottom: 'var(--space-3)',
    padding: 'var(--space-3) var(--space-4)',
    borderRadius: 'var(--radius-pill)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(0,0,0,.1)',
    background: '#fff',
    fontWeight: 'var(--fw-semibold)',
    fontSize: 'var(--text-base)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 2px 10px rgba(0,0,0,.08)',
  },
  empty: { textAlign: 'center', padding: 'var(--space-8) var(--space-4)', color: 'var(--muted)' },
  emptyIcon: { display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-3)' },
  emptyTitle: { fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-semibold)', color: 'var(--ta-ink-muted)', margin: '0 0 var(--space-2)' },
  emptySub: { fontSize: 'var(--text-md)', color: 'var(--ta-ink-subtle)', margin: 0 },
  card: {
    display: 'grid',
    gridTemplateColumns: 'minmax(64px,72px) 1fr minmax(172px, 210px)',
    gap: 'var(--space-4)',
    background: '#fff',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(0,0,0,.08)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-4) var(--space-5)',
    boxSizing: 'border-box',
  },
  priceColWrap: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 'var(--space-3)',
    width: '100%',
    minWidth: 0,
  },
  cardIconStack: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--space-2)',
    flexShrink: 0,
    paddingTop: 'var(--space-px)',
  },
  cardIconBtn: {
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(0,0,0,.08)',
    background: 'rgba(255,255,255,.98)',
    borderRadius: 'var(--radius-pill)',
    padding: 'var(--space-2)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 4px rgba(0,0,0,.06)',
    lineHeight: 0,
  },
  hotelName: { fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-extrabold)', color: 'var(--ta-ink)', paddingRight: 'var(--space-2)' },
  loc: { display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-base)', color: 'var(--ta-ink-muted)', marginTop: 'var(--space-2)' },
  badges: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 'var(--space-3)' },
  badge: {
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--fw-semibold)',
    padding: 'var(--space-1) var(--space-2)',
    borderRadius: 'var(--radius-xs)',
    background: 'var(--ta-accent-soft)',
    color: 'var(--ta-accent-deep)',
  },
  room: { fontSize: 'var(--text-base)', color: 'var(--ta-ink)', marginTop: 'var(--space-3)', fontWeight: 'var(--fw-medium)' },
  policies: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', fontSize: 'var(--text-sm)', color: '#2e7d32', marginTop: 'var(--space-2)', fontWeight: 'var(--fw-semibold)' },
  priceCol: { display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', textAlign: 'right' },
  priceMainRow: {
    display: 'inline-flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: 'var(--space-1) var(--space-3)',
  },
  oldPrice: { fontSize: 'var(--text-base)', color: 'var(--ta-ink-subtle)', textDecoration: 'line-through' },
  bigPrice: { fontSize: 'var(--text-2xl)', fontWeight: 'var(--fw-extrabold)', color: 'var(--ta-ink)' },
  secTitle: { fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-bold)', color: 'var(--ta-ink)', margin: '0 0 var(--space-3)' },
  promoRow: { display: 'grid', gap: 'var(--space-3)' },
  promo: {
    background: '#fff',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(0,0,0,.08)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-4)',
    textDecoration: 'none',
    color: 'inherit',
    display: 'block',
  },
  promoT: { fontWeight: 'var(--fw-bold)', fontSize: 'var(--text-lg)', color: 'var(--ta-ink)' },
  promoS: { fontSize: 'var(--text-sm)', color: 'var(--ta-ink-muted)', marginTop: 'var(--space-1)' },
};
