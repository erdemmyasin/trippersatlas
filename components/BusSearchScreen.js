'use client';

import { useMemo, useState, useCallback, useEffect, useRef, useLayoutEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Plane,
  SlidersHorizontal,
  Shield,
  Users,
  Search,
  X,
  Heart,
  Bookmark,
  Share2,
  Bus,
  Sparkles,
  MapPin,
  Calendar,
} from 'lucide-react';
import {
  useIsPhoneLayout,
  useIsCompactSearchLayout,
  useSearchMapSplitWide,
} from '@/components/SearchScreenPrimitives';
import QuickPlanMap from '@/components/QuickPlanMap';
import { centerFromMarkers } from '@/lib/airportsGeo';
import { getMockBusTrips, uniqCompanies, uniqStations } from '@/lib/busSearchMock';
import { appendRegionalGeocodeContext } from '@/lib/taRegion';
import { qp } from '@/lib/quickPlanFilterStyles';
import FilterField from '@/components/FilterField';
import EmptyState from '@/components/EmptyState';
import SkeletonList from '@/components/SkeletonList';
import TripifyButton from '@/components/TripifyButton';
import SaveToCollectionButton from '@/components/SaveToCollectionButton';
import { useSearchParams } from 'next/navigation';
import { useExclusivePopover } from '@/hooks/useExclusivePopover';
import { datePanelCoords, popoverCoords } from '@/lib/popoverCoords';
import { useQuickPlanBarDismiss } from '@/hooks/useQuickPlanBarDismiss';
import {
  QuickPlanCalendarPopover,
  QuickPlanCityTextPanel,
  QuickPlanBusPaxPanel,
  formatSingleDateTR,
} from '@/components/QuickPlanAnchoredWidgets';

function BusRoutePlaceholder({ from, to, fillHeight }) {
  return (
    <div
      style={{
        width: '100%',
        borderRadius: fillHeight ? 0 : 12,
        border: fillHeight ? 'none' : '1px solid rgba(0,0,0,.08)',
        background: 'linear-gradient(165deg,#e8e4dc 0%,#d4cfc4 45%,#c9c2b5 100%)',
        minHeight: fillHeight ? 0 : 300,
        height: fillHeight ? '100%' : undefined,
        flex: fillHeight ? '1 1 0' : undefined,
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.35,
          backgroundImage:
            'repeating-linear-gradient(90deg,transparent,transparent 28px,rgba(255,255,255,.12) 28px,rgba(255,255,255,.12) 29px)',
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
          background: 'rgba(255,255,255,.9)',
          padding: '6px 10px',
          borderRadius: 8,
        }}
      >
        Güzergâh — demo
      </div>
      {[
        { x: 28, y: 52, label: from || 'Kalkış' },
        { x: 72, y: 48, label: to || 'Varış' },
      ].map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            transform: 'translate(-50%, -50%)',
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: i === 0 ? 'var(--ta-accent-deep)' : 'var(--ta-ink)',
            border: '2px solid #fff',
            boxShadow: '0 2px 8px rgba(0,0,0,.2)',
          }}
          title={p.label}
        />
      ))}
    </div>
  );
}

function parseDepMin(dep) {
  const [h, m] = String(dep).split(':').map((x) => Number(x));
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

function fmtNavDay(d) {
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'short' });
}

function addDays(iso, delta) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

function initials(name) {
  return String(name)
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function BusSkeleton({ narrow }) {
  return <SkeletonList rows={5} narrow={narrow} />;
}

const sideSelect = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '6px 8px',
  borderRadius: 8,
  border: '1px solid rgba(0,0,0,.1)',
  fontSize: 12,
  fontWeight: 600,
  fontFamily: 'inherit',
  color: 'var(--ta-ink)',
  background: '#fff',
  outline: 'none',
  cursor: 'pointer',
};

export default function BusSearchScreen() {
  const isPhone = useIsPhoneLayout();
  const isCompact = useIsCompactSearchLayout();
  const splitWide = useSearchMapSplitWide(1100);
  const [from, setFrom] = useState('Antalya');
  const [to, setTo] = useState('Ankara');
  const [travelDate, setTravelDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [resultDate, setResultDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const [filterCompany, setFilterCompany] = useState('');
  const [filterDep, setFilterDep] = useState('');
  const [filterArr, setFilterArr] = useState('');
  const [filterSeat, setFilterSeat] = useState('');
  const [filterTime, setFilterTime] = useState('');
  const [sortBy, setSortBy] = useState('cheap');

  const [filterDrawer, setFilterDrawer] = useState(false);
  const [savedIds, setSavedIds] = useState(() => new Set());
  const [likedIds, setLikedIds] = useState(() => new Set());
  const searchParams = useSearchParams();
  const activePlanId = searchParams?.get('planId') || null;
  const [busMapMarkers, setBusMapMarkers] = useState([]);

  const busBarRef = useRef(null);
  const fromBtnRef = useRef(null);
  const toBtnRef = useRef(null);
  const dateBtnRef = useRef(null);
  const paxBtnRef = useRef(null);
  const busCityPopRef = useRef(null);
  const busDatePopRef = useRef(null);
  const busPaxPopRef = useRef(null);

  const busPanel = useExclusivePopover();
  const busCityPick = busPanel.openId === 'from' || busPanel.openId === 'to' ? busPanel.openId : null;
  const busDateOpen = busPanel.isOpen('date');
  const busPaxOpen = busPanel.isOpen('pax');
  const setBusCityPick = (id) => (id ? busPanel.open(id) : busPanel.close());
  const [busCityDraft, setBusCityDraft] = useState('');
  const [busCityLayout, setBusCityLayout] = useState({ top: 0, left: 0, width: 'min(340px, calc(100vw - 20px))' });
  const [busDateLayout, setBusDateLayout] = useState({ top: 0, left: 10 });
  const [busPaxLayout, setBusPaxLayout] = useState({ top: 0, left: 0, width: 'min(320px, calc(100vw - 20px))' });
  const [busPaxCount, setBusPaxCount] = useState(2);
  const closeBusPanels = busPanel.close;

  useLayoutEffect(() => {
    if (!busCityPick) return undefined;
    const el = busCityPick === 'from' ? fromBtnRef.current : toBtnRef.current;
    function u() {
      setBusCityLayout({ ...popoverCoords(el, 340), width: 'min(340px, calc(100vw - 20px))' });
    }
    u();
    window.addEventListener('resize', u);
    window.addEventListener('scroll', u, true);
    return () => {
      window.removeEventListener('resize', u);
      window.removeEventListener('scroll', u, true);
    };
  }, [busCityPick]);

  useLayoutEffect(() => {
    if (!busDateOpen) return undefined;
    function u() {
      setBusDateLayout(datePanelCoords(dateBtnRef.current, 504));
    }
    u();
    window.addEventListener('resize', u);
    window.addEventListener('scroll', u, true);
    return () => {
      window.removeEventListener('resize', u);
      window.removeEventListener('scroll', u, true);
    };
  }, [busDateOpen]);

  useLayoutEffect(() => {
    if (!busPaxOpen) return undefined;
    function u() {
      setBusPaxLayout({ ...popoverCoords(paxBtnRef.current, 300), width: 'min(320px, calc(100vw - 20px))' });
    }
    u();
    window.addEventListener('resize', u);
    window.addEventListener('scroll', u, true);
    return () => {
      window.removeEventListener('resize', u);
      window.removeEventListener('scroll', u, true);
    };
  }, [busPaxOpen]);

  const busPanelsActive = busPanel.anyOpen;
  const ignoreBusPointer = useCallback(
    (t) =>
      !!(busBarRef.current?.contains(t)) ||
      !!(busCityPopRef.current?.contains(t)) ||
      !!(busDatePopRef.current?.contains(t)) ||
      !!(busPaxPopRef.current?.contains(t)),
    []
  );
  useQuickPlanBarDismiss(busPanelsActive, ignoreBusPointer, closeBusPanels);

  const mapsKey = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY : '';
  const splitBusDesktop = hasSearched && splitWide;
  const useBusGoogleMap = !!mapsKey && busMapMarkers.length > 0;
  const busMapCenter = useMemo(() => centerFromMarkers(busMapMarkers), [busMapMarkers]);

  useEffect(() => {
    if (!hasSearched || !splitWide) {
      setBusMapMarkers([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const out = [];
      async function geo(city, leg) {
        const q = String(city || '').trim();
        if (!q) return;
        try {
          const r = await fetch(
            `/api/places/geocode?address=${encodeURIComponent(appendRegionalGeocodeContext(q))}`
          );
          const j = await r.json();
          if (cancelled || j.lat == null || j.lng == null) return;
          out.push({
            id: `bus-${leg}-${q}`,
            lat: j.lat,
            lng: j.lng,
            title: `${leg}: ${q}`,
            price: leg,
          });
        } catch {
          /* ignore */
        }
      }
      await geo(from, 'Kalkış');
      await geo(to, 'Varış');
      if (!cancelled) setBusMapMarkers(out);
    })();
    return () => {
      cancelled = true;
    };
  }, [hasSearched, splitWide, from, to]);

  const rawTrips = useMemo(() => getMockBusTrips({ from, to }), [from, to]);
  const companies = useMemo(() => uniqCompanies(rawTrips), [rawTrips]);
  const depStations = useMemo(() => uniqStations(rawTrips, 'depStation'), [rawTrips]);
  const arrStations = useMemo(() => uniqStations(rawTrips, 'arrStation'), [rawTrips]);

  const filtered = useMemo(() => {
    let list = rawTrips.slice();
    if (filterCompany) list = list.filter((t) => t.company === filterCompany);
    if (filterDep) list = list.filter((t) => t.depStation === filterDep);
    if (filterArr) list = list.filter((t) => t.arrStation === filterArr);
    if (filterSeat) list = list.filter((t) => t.seatLayout === filterSeat);
    if (filterTime) {
      list = list.filter((t) => {
        const m = parseDepMin(t.dep);
        if (filterTime === 'morning') return m < 12 * 60;
        if (filterTime === 'afternoon') return m >= 12 * 60 && m < 17 * 60;
        if (filterTime === 'evening') return m >= 17 * 60;
        return true;
      });
    }
    if (sortBy === 'cheap') list.sort((a, b) => a.price - b.price);
    else if (sortBy === 'early') list.sort((a, b) => parseDepMin(a.dep) - parseDepMin(b.dep));
    else if (sortBy === 'short') list.sort((a, b) => a.durMin - b.durMin);
    return list;
  }, [rawTrips, filterCompany, filterDep, filterArr, filterSeat, filterTime, sortBy]);

  const swapEnds = useCallback(() => {
    setFrom(to);
    setTo(from);
  }, [from, to]);

  const search = useCallback(async () => {
    setLoading(true);
    setHasSearched(true);
    setResultDate(travelDate);
    try {
      await new Promise((r) => setTimeout(r, 500));
    } finally {
      setLoading(false);
    }
  }, [travelDate]);

  const prevDay = useCallback(() => {
    setResultDate((d) => addDays(d, -1));
  }, []);
  const nextDay = useCallback(() => {
    setResultDate((d) => addDays(d, 1));
  }, []);

  const todayIso = new Date().toISOString().slice(0, 10);
  const tomorrowIso = addDays(todayIso, 1);

  const resultD = new Date(`${resultDate}T12:00:00`);
  const prevD = new Date(resultD);
  prevD.setDate(prevD.getDate() - 1);
  const nextD = new Date(resultD);
  nextD.setDate(nextD.getDate() + 1);

  const filterPanelBody = (
    <>
      <div style={{ ...st.filterTitle, marginTop: 0 }}>Firmalar</div>
      <select style={sideSelect} value={filterCompany} onChange={(e) => setFilterCompany(e.target.value)} aria-label="Firmalar">
        <option value="">Tümü</option>
        {companies.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>

      <div style={st.filterTitle}>Kalkış</div>
      <select style={sideSelect} value={filterDep} onChange={(e) => setFilterDep(e.target.value)} aria-label="Kalkış">
        <option value="">Tümü</option>
        {depStations.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>

      <div style={st.filterTitle}>Varış</div>
      <select style={sideSelect} value={filterArr} onChange={(e) => setFilterArr(e.target.value)} aria-label="Varış">
        <option value="">Tümü</option>
        {arrStations.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>

      <div style={st.filterTitle}>Koltuk</div>
      <select style={sideSelect} value={filterSeat} onChange={(e) => setFilterSeat(e.target.value)} aria-label="Koltuk">
        <option value="">Tümü</option>
        <option value="2+1">2+1</option>
        <option value="2+2">2+2</option>
      </select>

      <div style={st.filterTitle}>Kalkış saati</div>
      <select style={sideSelect} value={filterTime} onChange={(e) => setFilterTime(e.target.value)} aria-label="Saat">
        <option value="">Tümü</option>
        <option value="morning">Sabah (06–12)</option>
        <option value="afternoon">Öğlen (12–17)</option>
        <option value="evening">Akşam (17+)</option>
      </select>

      <div style={st.filterTitle}>Sırala</div>
      <select style={sideSelect} value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sırala">
        <option value="cheap">En ucuz</option>
        <option value="early">En erken kalkış</option>
        <option value="short">En kısa süre</option>
      </select>
    </>
  );

  const filterPanel = (
    <div style={st.filterCol}>
      <div style={st.filterPanelHeading}>Otobüs</div>
      {filterPanelBody}
    </div>
  );

  const listBody = (
    <>
      {isCompact && hasSearched ? (
        <button type="button" style={st.mobileFilterFab} onClick={() => setFilterDrawer(true)}>
          <SlidersHorizontal size={18} />
          Filtreler
        </button>
      ) : null}

      {!hasSearched ? (
        <EmptyState
          icon={Bus}
          title="Otobüs Ara"
          description="Kalkış ve varış şehrini seçin, tarihi belirleyin; seferleri listeleyin."
        />
      ) : loading ? (
        <BusSkeleton narrow={isPhone} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Bus}
          tone="muted"
          title="Bu filtrelere uygun sefer yok"
          description="Filtreleri genişletmeyi veya güzergâhı değiştirmeyi deneyin."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={dateNavWrap}>
            <div style={dateNavPanel} role="navigation" aria-label="Sefer tarihi">
              <button type="button" style={dateNavBtn} onClick={prevDay}>
                <ChevronLeft size={18} />
                <span>{fmtNavDay(prevD)}</span>
              </button>
              <div style={dateNavCenter}>
                <span style={dateNavRoute}>
                  {from} → {to}
                </span>
                <span style={dateNavSub}>{fmtNavDay(resultD)}</span>
              </div>
              <button type="button" style={dateNavBtn} onClick={nextDay}>
                <span>{fmtNavDay(nextD)}</span>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div style={flightBanner}>
            <div style={flightBannerLeft}>
              <div style={flightIconWrap}>
                <Plane size={20} color="var(--ta-accent-deep)" />
                <span style={flightIconLbl}>Uçuş</span>
              </div>
              <div>
                <p style={flightBannerQ}>{to} seyahatini uçakla yapmaya ne dersin?</p>
                <p style={flightBannerSub}>Daha hızlı ulaşım için uçuş seçeneğini inceleyin.</p>
              </div>
            </div>
            <div style={flightBannerRight}>
              <div style={flightMeta}>
                <span>
                  {from} → {to}
                </span>
                <span style={flightMetaSub}>Direkt uçuş</span>
              </div>
              <Link href="/flights" style={{ textDecoration: 'none' }}>
                <span style={st.searchBtn}>İncele</span>
              </Link>
            </div>
          </div>

          {filtered.map((trip) => (
            <article
              key={trip.id}
              style={{
                ...st.card,
                ...(isPhone ? st.cardMobile : {}),
                ...(splitBusDesktop ? st.busCardCompact : {}),
              }}
            >
              <div style={st.cardLeft}>
                <div style={{ ...st.logoCircle, ...(splitBusDesktop ? st.busLogoSm : {}) }}>{initials(trip.company)}</div>
                <div>
                  <div style={{ ...st.airlineName, ...(splitBusDesktop ? st.busNameSm : {}) }}>{trip.company}</div>
                  <div style={{ ...st.airlineCode, ...(splitBusDesktop ? st.busMetaSm : {}) }}>
                    {trip.seatLayout} · Şehirler arası
                  </div>
                </div>
              </div>
              <div style={st.cardMid}>
                <div style={st.timeRow}>
                  <span style={{ ...st.timeBig, ...(splitBusDesktop ? st.busTimeSm : {}) }}>{trip.dep}</span>
                  <span style={st.timeSep}>→</span>
                  <span style={{ ...st.timeBig, ...(splitBusDesktop ? st.busTimeSm : {}) }}>{trip.arr}</span>
                </div>
                <div style={{ ...st.metaRow, ...(splitBusDesktop ? st.busMetaRowSm : {}) }}>
                  {fmtDuration(trip.durMin)}
                  <span style={st.dot}>·</span>
                  {trip.depStation}
                  <span style={st.dot}>·</span>
                  {trip.arrStation}
                </div>
                <div style={tagRow}>
                  {trip.onlineCancel ? (
                    <span style={tagOk}>
                      <Shield size={12} style={{ marginRight: 4 }} aria-hidden />
                      Online iptal
                    </span>
                  ) : null}
                  {trip.seatsLeft != null && trip.seatsLeft <= 8 ? (
                    <span style={tagWarn}>
                      <Users size={12} style={{ marginRight: 4 }} aria-hidden />
                      Son {trip.seatsLeft} koltuk
                    </span>
                  ) : null}
                </div>
              </div>
              <div style={{ ...st.cardRight, ...(isPhone ? { textAlign: 'left' } : {}) }}>
                <div style={{ ...st.price, ...(splitBusDesktop ? st.busPriceSm : {}) }}>
                  {trip.price.toLocaleString('tr-TR')} ₺
                </div>
                <button
                  type="button"
                  style={{
                    ...st.selectBtn,
                    maxWidth: isPhone ? '100%' : undefined,
                    ...(splitBusDesktop ? st.busSelectSm : {}),
                  }}
                >
                  Koltuk seç
                </button>
                <div style={{ marginTop: 6, alignSelf: isPhone ? 'flex-start' : 'flex-end' }}>
                  <TripifyButton
                    serviceType="bus"
                    listing={{
                      name: `${trip.company} ${trip.dep} → ${trip.arr}`,
                      location: trip.arrStation || '',
                      price: Number(trip.price) || 0,
                      type: 'bus',
                    }}
                    destination={trip.arrStation || ''}
                    autoBook={false}
                    preferTripId={activePlanId}
                  />
                </div>
                <div style={{ ...st.cardActions, justifyContent: isPhone ? 'flex-start' : 'flex-end' }}>
                  <button
                    type="button"
                    style={st.iconAct}
                    onClick={() => {
                      const text = `${trip.company} ${trip.dep} ${trip.price} ₺`;
                      if (navigator.share) navigator.share({ title: 'Otobüs', text }).catch(() => {});
                      else navigator.clipboard?.writeText(text);
                    }}
                    aria-label="Paylaş"
                  >
                    <Share2 size={16} color="var(--ta-ink-subtle)" />
                    Paylaş
                  </button>
                  <SaveToCollectionButton
                    place={{
                      id: `bus-${trip.id}`,
                      name: `${trip.company} ${trip.dep} → ${trip.arr}`,
                      category: 'location',
                      city: trip.arrStation || '',
                    }}
                  />
                  <button
                    type="button"
                    style={st.iconAct}
                    onClick={() =>
                      setLikedIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(trip.id)) next.delete(trip.id);
                        else next.add(trip.id);
                        return next;
                      })
                    }
                    aria-label="Beğen"
                  >
                    <Heart
                      size={16}
                      color={likedIds.has(trip.id) ? 'var(--ta-accent-deep)' : 'var(--ta-ink-subtle)'}
                      fill={likedIds.has(trip.id) ? 'var(--ta-accent-deep)' : 'transparent'}
                    />
                    Beğen
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
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
                ref={busBarRef}
                style={{
                  ...qp.barCluster,
                  ...(isPhone ? { justifyContent: 'center' } : {}),
                  ...(pillBarTabletScroll ? { flexWrap: 'nowrap', width: 'max-content', maxWidth: 'none' } : {}),
                }}
              >
                <div style={{ ...qp.titlePill, alignSelf: 'center' }}>
                  <span style={qp.spark} aria-hidden>
                    <Sparkles size={13} strokeWidth={2.2} color="var(--ta-accent)" />
                  </span>
                  <span style={qp.titleTxt}>Otobüs Ara</span>
                </div>
                {!isPhone ? <span style={qp.barSep} /> : null}
                <div style={qp.linkedRoute}>
                    <div style={qp.routeShell}>
                      <button
                        ref={fromBtnRef}
                        type="button"
                        style={qp.routeSegBtn}
                        aria-expanded={busCityPick === 'from'}
                        aria-haspopup="dialog"
                        onClick={() => {
                          const willOpen = busPanel.openId !== 'from';
                          busPanel.toggle('from');
                          if (willOpen) setBusCityDraft(from);
                        }}
                      >
                        <MapPin size={18} strokeWidth={1.85} color="#1a3764" aria-hidden />
                        <span style={{ minWidth: 0, flex: 1 }}>
                          <span style={qp.fieldLbl}>Nereden</span>
                          <span style={{ ...(String(from || '').trim() ? qp.fieldVal : qp.fieldPlaceholder) }}>
                            {String(from || '').trim() || 'Şehir'}
                          </span>
                        </span>
                      </button>
                      <button type="button" style={qp.swapFab} onClick={swapEnds} aria-label="Kalkış ve varışı değiştir">
                        <ArrowLeftRight size={15} color="#1a73e8" />
                      </button>
                      <button
                        ref={toBtnRef}
                        type="button"
                        style={qp.routeSegBtn}
                        aria-expanded={busCityPick === 'to'}
                        aria-haspopup="dialog"
                        onClick={() => {
                          const willOpen = busPanel.openId !== 'to';
                          busPanel.toggle('to');
                          if (willOpen) setBusCityDraft(to);
                        }}
                      >
                        <MapPin size={18} strokeWidth={1.85} color="#1a3764" aria-hidden />
                        <span style={{ minWidth: 0, flex: 1 }}>
                          <span style={qp.fieldLbl}>Nereye</span>
                          <span style={{ ...(String(to || '').trim() ? qp.fieldVal : qp.fieldPlaceholder) }}>
                            {String(to || '').trim() || 'Şehir'}
                          </span>
                        </span>
                      </button>
                    </div>
                  </div>
                  <FilterField
                    ref={dateBtnRef}
                    icon={Calendar}
                    label="Tarih"
                    value={formatSingleDateTR(travelDate)}
                    flex="1 1 170px"
                    isPhone={isPhone}
                    expanded={busDateOpen}
                    onClick={() => busPanel.toggle('date')}
                  />
                  <FilterField
                    ref={paxBtnRef}
                    icon={Users}
                    label="Yolcular"
                    value={`${busPaxCount} yolcu`}
                    flex="1 1 150px"
                    isPhone={isPhone}
                    expanded={busPaxOpen}
                    onClick={() => busPanel.toggle('pax')}
                  />
                {!isPhone ? <span style={qp.barSep} aria-hidden /> : null}
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
                      closeBusPanels();
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

      {busCityPick ? (
        <QuickPlanCityTextPanel
          innerRef={busCityPopRef}
          layout={busCityLayout}
          draft={busCityDraft}
          setDraft={setBusCityDraft}
          placeholder="Şehir"
          aria-label={busCityPick === 'from' ? 'Nereden' : 'Nereye'}
          onDone={() => {
            if (busCityPick === 'from') setFrom(busCityDraft);
            else setTo(busCityDraft);
            setBusCityPick(null);
          }}
        />
      ) : null}
      <QuickPlanCalendarPopover
        innerRef={busDatePopRef}
        open={busDateOpen}
        mode="single"
        committedStart={travelDate}
        committedEnd={travelDate}
        layout={busDateLayout}
        aria-label="Seyahat tarihi"
        onApply={(s, e) => {
          void e;
          setTravelDate(s);
          busPanel.close();
        }}
      >
        <div style={{ ...qp.miniPillRow, justifyContent: 'flex-start' }}>
          <button
            type="button"
            style={{ ...qp.miniPill, ...(travelDate === todayIso ? qp.miniPillOn : {}) }}
            onClick={() => setTravelDate(todayIso)}
          >
            Bugün
          </button>
          <button
            type="button"
            style={{ ...qp.miniPill, ...(travelDate === tomorrowIso ? qp.miniPillOn : {}) }}
            onClick={() => setTravelDate(tomorrowIso)}
          >
            Yarın
          </button>
        </div>
      </QuickPlanCalendarPopover>
      {busPaxOpen ? (
        <QuickPlanBusPaxPanel innerRef={busPaxPopRef} layout={busPaxLayout} value={busPaxCount} onChange={setBusPaxCount} />
      ) : null}

      <div
        style={{
          ...st.mainScroll,
          ...(splitBusDesktop ? st.mainScrollSplit : {}),
        }}
      >
        {splitBusDesktop ? (
          <div style={st.bodySplitMap}>
            <aside style={st.filterAsideSplit}>{filterPanel}</aside>
            <div style={st.listScrollColBus}>
              {listBody}
            </div>
            <aside style={st.mapAsideSplit}>
              <div style={st.mapSplitInner}>
                <div style={st.mapSplitFrame}>
                  {useBusGoogleMap ? (
                    <QuickPlanMap
                      showChrome={false}
                      center={busMapCenter}
                      markers={busMapMarkers}
                      zoom={6}
                      minHeight={0}
                      fillHeight
                    />
                  ) : (
                    <BusRoutePlaceholder from={from} to={to} fillHeight />
                  )}
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
            <main
              style={{
                ...st.main,
                ...(!hasSearched ? { display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, minHeight: 0 } : {}),
              }}
            >
              {listBody}
            </main>
          </div>
        )}
      </div>

      {isCompact && filterDrawer ? (
        <div style={st.drawerOverlay} role="presentation" onClick={() => setFilterDrawer(false)}>
          <div style={st.drawer} role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
            <div style={st.drawerHead}>
              <span style={st.drawerTitle}>Otobüs</span>
              <button type="button" style={st.drawerClose} onClick={() => setFilterDrawer(false)} aria-label="Kapat">
                <X size={20} />
              </button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: '0 16px 24px' }}>
              <div style={st.filterCol}>{filterPanelBody}</div>
            </div>
            <div style={st.drawerFoot}>
              <button type="button" style={st.searchBtn} onClick={() => setFilterDrawer(false)}>
                Sonuçları göster ({filtered.length})
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const dateNavWrap = {
  display: 'flex',
  justifyContent: 'center',
  width: '100%',
  padding: '0 8px 14px',
  marginBottom: 2,
  boxSizing: 'border-box',
};

const dateNavPanel = {
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
  flexWrap: 'wrap',
};

const dateNavBtn = {
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
};

const dateNavCenter = {
  flex: '1 1 auto',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 2,
  minWidth: 0,
  padding: '0 6px',
  textAlign: 'center',
};

const dateNavRoute = { fontSize: 14, fontWeight: 800, color: 'var(--ta-ink)', lineHeight: 1.25, wordBreak: 'break-word' };
const dateNavSub = { fontSize: 12, color: 'var(--ta-ink-muted)', fontWeight: 500 };

const flightBanner = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 14,
  padding: '14px 16px',
  borderRadius: 12,
  background: 'var(--ta-accent-soft)',
  border: '1px solid rgba(31,77,92,.28)',
  marginBottom: 12,
};

const flightBannerLeft = { display: 'flex', alignItems: 'center', gap: 14, flex: '1 1 240px', minWidth: 0 };
const flightIconWrap = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 2,
  flexShrink: 0,
};
const flightIconLbl = { fontSize: 10, fontWeight: 700, color: 'var(--ta-accent-deep)', textTransform: 'uppercase' };
const flightBannerQ = { margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--ta-ink)' };
const flightBannerSub = { margin: '4px 0 0', fontSize: 12, color: 'var(--ta-ink-muted)' };
const flightBannerRight = { display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 };
const flightMeta = { display: 'flex', flexDirection: 'column', fontSize: 12, fontWeight: 700, color: 'var(--ta-ink)' };
const flightMetaSub = { fontSize: 11, fontWeight: 600, color: 'var(--ta-accent-deep)' };

const tagRow = { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 };
const tagOk = {
  display: 'inline-flex',
  alignItems: 'center',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--green)',
  background: 'var(--success-soft)',
  padding: '4px 8px',
  borderRadius: 8,
};
const tagWarn = {
  display: 'inline-flex',
  alignItems: 'center',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--ta-accent-deep)',
  background: 'rgba(31,77,92,0.12)',
  padding: '4px 8px',
  borderRadius: 8,
};

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
    width: 'max-content',
    maxWidth: '100%',
    padding: '10px 6px 10px 14px',
    minHeight: 56,
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: '4px 4px',
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
    maxWidth: 'none',
  },
  busBarCluster: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '4px 8px',
    minWidth: 0,
  },
  busBarClusterDesktop: {
    flex: '0 1 auto',
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
  barSepTall: { height: 44, alignSelf: 'center' },
  barDot: {
    color: 'rgba(0,0,0,.25)',
    fontSize: 14,
    padding: '0 2px',
    userSelect: 'none',
    flexShrink: 0,
  },
  locFieldCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
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
    lineHeight: 1,
    whiteSpace: 'nowrap',
    textAlign: 'center',
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
  busCityInp: { width: 120, maxWidth: 140, textAlign: 'center' },
  chipFullWidth: { width: '100%', maxWidth: 'none' },
  chipDate: {
    border: 'none',
    background: 'transparent',
    fontSize: 12,
    fontWeight: 600,
    fontFamily: 'inherit',
    color: 'var(--ta-ink)',
    padding: '3px 2px',
    minWidth: 0,
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
    gap: 12,
    padding: 0,
    boxSizing: 'border-box',
  },
  filterAsideSplit: {
    width: 200,
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
  listScrollColBus: {
    position: 'relative',
    flex: '1 1 320px',
    minWidth: 280,
    maxWidth: 'none',
    minHeight: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    WebkitOverflowScrolling: 'touch',
    padding: '12px 8px 28px 6px',
    boxSizing: 'border-box',
  },
  mapAsideSplit: {
    flex: '0 1 520px',
    width: 520,
    maxWidth: 520,
    minWidth: 300,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    alignSelf: 'stretch',
    boxSizing: 'border-box',
    padding: '12px 12px 22px 0',
  },
  mapSplitInner: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  mapSplitFrame: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 18,
    overflow: 'hidden',
    boxShadow: '0 10px 32px rgba(35,28,18,.12)',
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
    width: 200,
    flexShrink: 0,
    position: 'sticky',
    top: 24,
    alignSelf: 'flex-start',
    maxHeight: 'calc(100vh - 120px)',
    overflowY: 'auto',
    background: '#fff',
    border: '1px solid rgba(0,0,0,.08)',
    borderRadius: 12,
    padding: '12px 10px',
    boxSizing: 'border-box',
  },
  main: { flex: 1, minWidth: 0, position: 'relative' },
  filterCol: {},
  filterPanelHeading: {
    fontSize: 13,
    fontWeight: 800,
    color: 'var(--ta-ink)',
    margin: '0 0 10px',
    paddingBottom: 8,
    borderBottom: '1px solid rgba(0,0,0,.08)',
    fontFamily: 'var(--font-sans)',
  },
  filterTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--ta-ink)',
    marginTop: 10,
    marginBottom: 6,
  },
  busCardCompact: {
    gridTemplateColumns: 'minmax(100px,124px) 1fr minmax(128px,168px)',
    gap: 12,
    padding: '12px 16px',
  },
  busLogoSm: { width: 36, height: 36, fontSize: 11 },
  busTimeSm: { fontSize: 17 },
  busPriceSm: { fontSize: 20 },
  busSelectSm: { marginTop: 8, padding: '8px 12px', fontSize: 12 },
  busNameSm: { fontSize: 13 },
  busMetaSm: { fontSize: 10 },
  busMetaRowSm: { fontSize: 11, marginTop: 4 },
  searchBtn: {
    display: 'inline-block',
    padding: '10px 18px',
    borderRadius: 10,
    border: 'none',
    background: 'var(--ta-accent)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 2px 8px rgba(31,77,92,.35)',
  },
  empty: {
    textAlign: 'center',
    padding: '48px 24px',
    color: 'var(--muted)',
  },
  emptyPlane: { display: 'flex', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 600, color: 'var(--ta-ink-muted)', margin: '0 0 8px' },
  emptySub: { fontSize: 14, color: 'var(--ta-ink-subtle)', margin: 0 },
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
