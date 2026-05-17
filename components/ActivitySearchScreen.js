'use client';

import { useState, useMemo, useCallback, useLayoutEffect, useRef } from 'react';
import {
  SlidersHorizontal,
  Heart,
  Search,
  X,
  Sparkles,
  Tent,
  Ship,
  Landmark,
  UtensilsCrossed,
  UserRound,
  Waves,
  LayoutGrid,
  MapPin,
  Calendar,
  Building2,
  Users,
  Ticket,
} from 'lucide-react';
import { useIsPhoneLayout, useIsCompactSearchLayout } from '@/components/SearchScreenPrimitives';
import { useLocaleCurrency } from '@/components/LocaleCurrencyContext';
import { qp } from '@/lib/quickPlanFilterStyles';
import FilterField from '@/components/FilterField';
import EmptyState from '@/components/EmptyState';
import TripifyButton from '@/components/TripifyButton';
import { useSearchParams } from 'next/navigation';
import { useExclusivePopover } from '@/hooks/useExclusivePopover';
import { datePanelCoords, popoverCoords } from '@/lib/popoverCoords';
import { useQuickPlanBarDismiss } from '@/hooks/useQuickPlanBarDismiss';
import {
  QuickPlanCalendarPopover,
  QuickPlanActivityParticipantsPanel,
  formatShortRangeTR,
} from '@/components/QuickPlanAnchoredWidgets';

function hashSeed(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  }
  return Math.abs(h) >>> 0;
}

function rnd(seed, salt) {
  const x = Math.sin(hashSeed(`${seed}:${salt}`)) * 10000;
  return x - Math.floor(x);
}

function fmtPrice(n, currency, locale = 'tr-TR') {
  const cur =
    currency === 'TRY' || currency === 'TRL'
      ? '₺'
      : currency === 'EUR'
        ? '€'
        : currency === 'USD'
          ? '$'
          : `${currency} `;
  const rounded = Math.round(Number(n) || 0);
  if (cur.length <= 2) return `${cur}${rounded.toLocaleString(locale)}`;
  return `${cur}${rounded.toLocaleString(locale)}`;
}

function addDaysIso(iso, delta) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

const PLACES = [
  { id: 'ist', draft: 'İstanbul', primary: 'İstanbul (ve çevresi)', secondary: 'İstanbul, Türkiye' },
  { id: 'ant', draft: 'Antalya', primary: 'Antalya (ve çevresi)', secondary: 'Antalya, Türkiye' },
  { id: 'nev', draft: 'Nevşehir', primary: 'Nevşehir (Kapadokya)', secondary: 'Nevşehir, Türkiye' },
  { id: 'izm', draft: 'İzmir', primary: 'İzmir (ve çevresi)', secondary: 'İzmir, Türkiye' },
  { id: 'bod', draft: 'Muğla', primary: 'Bodrum · Muğla', secondary: 'Muğla, Türkiye' },
  { id: 'ank', draft: 'Ankara', primary: 'Ankara (ve çevresi)', secondary: 'Ankara, Türkiye' },
];

const SECTION_META = [
  { slug: 'day', heading: 'Günübirlik geziler', chipIcon: Tent, chipLabel: 'Günübirlik' },
  { slug: 'boat', heading: 'Tekne turları', chipIcon: Ship, chipLabel: 'Tekne' },
  { slug: 'culture', heading: 'Kültür & miras', chipIcon: Landmark, chipLabel: 'Kültür' },
  { slug: 'food', heading: 'Yemek & içki deneyimleri', chipIcon: UtensilsCrossed, chipLabel: 'Yemek' },
  { slug: 'private', heading: 'Özel turlar', chipIcon: UserRound, chipLabel: 'Özel' },
  { slug: 'water', heading: 'Su sporları', chipIcon: Waves, chipLabel: 'Su sporları' },
];

const THEME_OPTS = [
  { id: 'walking', label: 'Yürüyüş turları' },
  { id: 'cruise', label: 'Gece & yemek cruise' },
  { id: 'museum', label: 'Müze girişleri' },
  { id: 'heritage', label: 'UNESCO & tarih' },
  { id: 'foodie', label: 'Yerel tadım' },
];

const PRICE_BANDS = [
  { id: 'b0', min: 0, max: 1500 },
  { id: 'b1', min: 1500, max: 3500 },
  { id: 'b2', min: 3500, max: 7000 },
  { id: 'b3', min: 7000, max: Infinity },
];

const DUR_BANDS = [
  { id: 'd0', maxH: 3 },
  { id: 'd1', minH: 3, maxH: 5 },
  { id: 'd2', minH: 5, maxH: 7 },
  { id: 'd3', minH: 7, maxH: 24 },
];

const TITLE_FRAGS = {
  day: ['Şehir turu · rehber', 'Ada & doğa çıkışı', 'Kalabalıktan uzak vadiler', 'Gün doğumu foto turu'],
  boat: ['Boğaz günbatımı cruise', 'Adalar tekne turu', 'Öğle tekne mangalı', 'Lüks yat özel tur'],
  culture: ['Topkapı öncelikli giriş', 'Ayasofya küçük grup', 'Klasik tarih yürüyüşü', 'Osman sarayları izi'],
  food: ['Sokak lezzeti turu', 'Meyhane tadım akşamı', 'Kahvaltılı köprü kenarı', 'Helva & kahve workshop'],
  private: ['Özel araç şehir turu', 'VIP rehber eşlik', 'Çift özel çıkış', 'Ailenize özel rota'],
  water: ['Rüzgârlı sörfin', 'Kano & lagün', 'Jet ski blok', 'Şnorkelli koylar'],
};

function buildActivities(seed, cityLabel) {
  const city = cityLabel.trim() || 'İstanbul';
  const list = [];
  let idx = 0;
  SECTION_META.forEach(({ slug }) => {
    const variants = TITLE_FRAGS[slug] || ['Deneyim'];
    for (let k = 0; k < 4; k++) {
      idx += 1;
      const r = rnd(seed, `${slug}-${k}`);
      const titleBase = variants[Math.floor(r * variants.length)];
      const rating = Math.round((7 + r * 2.8 + (k % 3) * 0.07) * 10) / 10;
      const reviews = Math.floor(120 + rnd(seed, `rv-${slug}-${k}`) * 4800);
      const durH =
        slug === 'day'
          ? 4 + rnd(seed, `dh-${k}`) * 8
          : slug === 'boat'
            ? 2 + rnd(seed, `dh2-${k}`) * 4
            : 1.5 + rnd(seed, `dh3-${k}`) * 5;
      const hoursRounded = Math.round(durH * 2) / 2;
      const durationLabel = hoursRounded >= 6 ? `Tam gün` : `${hoursRounded} sa`;

      const freeCancel = rnd(seed, `fc-${slug}-${k}`) > 0.35;
      const skipLine = slug === 'culture' && rnd(seed, `sk-${k}`) > 0.5;
      const privateTour = slug === 'private' || rnd(seed, `pr-${k}`) > 0.82;
      const sellsOut = rnd(seed, `so-${k}`) > 0.88;

      const base = 850 + rnd(seed, `bp-${slug}-${k}`) * 5200 + (rating - 7) * 180;
      const price = Math.round(base / 10) * 10;

      const themes = [];
      const thPick = rnd(seed, `th-${slug}-${k}`);
      if (slug === 'day' || thPick > 0.55) themes.push('walking');
      if (slug === 'boat') themes.push('cruise');
      if (slug === 'culture') themes.push('museum', 'heritage');
      if (slug === 'food') themes.push('foodie');
      if (!themes.length) themes.push(['walking', 'heritage'][k % 2]);

      const wheelchair = rnd(seed, `wh-${k}`) > 0.55;
      const stroller = rnd(seed, `st-${k}`) > 0.45;
      const serviceAnimal = rnd(seed, `sa-${k}`) > 0.72;

      const hue = Math.floor(rnd(seed, `hue-${idx}`) * 360);

      list.push({
        id: `${seed}-${slug}-${k}`,
        sectionSlug: slug,
        title: `${titleBase} (${city})`,
        rating,
        reviews,
        durationLabel,
        durationH: hoursRounded,
        freeCancel,
        skipLine,
        privateTour,
        sellsOut,
        price,
        themes: [...new Set(themes)],
        wheelchair,
        stroller,
        serviceAnimal,
        hue,
      });
    }
  });
  return list;
}

export default function ActivitySearchScreen() {
  const { currency: prefCurrency, locale } = useLocaleCurrency();
  const isPhone = useIsPhoneLayout();
  const isCompact = useIsCompactSearchLayout();

  /** Arama/mock için şehir adı */
  const [destinationDraft, setDestinationDraft] = useState('İstanbul');
  const searchParams = useSearchParams();
  const activePlanId = searchParams?.get('planId') || null;
  /** Kutuda gösterilen tam satır */
  const [destinationLine, setDestinationLine] = useState('İstanbul (ve çevresi), İstanbul, Türkiye');
  /** Çift tarih — aktivite gününde yaygın (başlangıç / bitiş) */
  const [dateStart, setDateStart] = useState(() => new Date().toISOString().slice(0, 10));
  const [dateEnd, setDateEnd] = useState(() => addDaysIso(new Date().toISOString().slice(0, 10), 1));

  const activityPanel = useExclusivePopover();
  const destPopoverOpen = activityPanel.isOpen('dest');
  const dateModalOpen = activityPanel.isOpen('date');
  const paxModalOpen = activityPanel.isOpen('pax');
  const setDestPopoverOpen = (v) => (typeof v === 'function' ? (v(destPopoverOpen) ? activityPanel.open('dest') : activityPanel.close()) : v ? activityPanel.open('dest') : activityPanel.close());
  const setDateModalOpen = (v) => (typeof v === 'function' ? (v(dateModalOpen) ? activityPanel.open('date') : activityPanel.close()) : v ? activityPanel.open('date') : activityPanel.close());
  const setPaxModalOpen = (v) => (typeof v === 'function' ? (v(paxModalOpen) ? activityPanel.open('pax') : activityPanel.close()) : v ? activityPanel.open('pax') : activityPanel.close());
  const [placeQuery, setPlaceQuery] = useState('');
  const [participantCount, setParticipantCount] = useState(2);
  const barRef = useRef(null);
  const destPopoverRef = useRef(null);
  const dateModalRef = useRef(null);
  const dateBtnRef = useRef(null);
  const paxBtnRef = useRef(null);
  const paxPopoverRef = useRef(null);
  const [datePopPos, setDatePopPos] = useState({ top: 0, left: 0 });
  const [paxPopPos, setPaxPopPos] = useState({ top: 0, left: 0 });

  /** Submitted trip context (sticky title + catalogue seed) */
  const [submittedDestination, setSubmittedDestination] = useState('');
  const [catalogSeed, setCatalogSeed] = useState(null);

  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [likedIds, setLikedIds] = useState(() => new Set());

  const [chipSection, setChipSection] = useState('');
  const [sortBy, setSortBy] = useState('recommended');
  const [filterDrawer, setFilterDrawer] = useState(false);

  const [guestRating, setGuestRating] = useState('any');
  /** İşaretliyken yalnızca bu özelliği taşıyan aktiviteler gösterilir */
  const [fltFreeCancel, setFltFreeCancel] = useState(false);
  const [fltSellsOut, setFltSellsOut] = useState(false);
  const [fltSkip, setFltSkip] = useState(false);
  const [fltPrivate, setFltPrivate] = useState(false);

  const [pricePick, setPricePick] = useState(() =>
    PRICE_BANDS.reduce((acc, b) => {
      acc[b.id] = true;
      return acc;
    }, {})
  );
  const [durPick, setDurPick] = useState(() =>
    DUR_BANDS.reduce((acc, d) => {
      acc[d.id] = true;
      return acc;
    }, {})
  );

  const [facWheelchair, setFacWheelchair] = useState(false);
  const [facStroller, setFacStroller] = useState(false);
  const [facAnimal, setFacAnimal] = useState(false);

  const [themesPick, setThemesPick] = useState(() => THEME_OPTS.reduce((acc, t) => ({ ...acc, [t.id]: true }), {}));

  const closeActivityPanels = useCallback(() => {
    setDestPopoverOpen(false);
    setDateModalOpen(false);
    setPaxModalOpen(false);
  }, []);

  const activityPanelsActive = activityPanel.anyOpen;
  const ignoreActivityPointer = useCallback(
    (t) =>
      !!(barRef.current?.contains(t)) ||
      !!(destPopoverRef.current?.contains(t)) ||
      !!(dateModalRef.current?.contains(t)) ||
      !!(paxPopoverRef.current?.contains(t)),
    []
  );
  useQuickPlanBarDismiss(activityPanelsActive, ignoreActivityPointer, closeActivityPanels);

  useLayoutEffect(() => {
    if (!dateModalOpen) return undefined;
    function update() {
      setDatePopPos(datePanelCoords(dateBtnRef.current, 504));
    }
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [dateModalOpen]);

  useLayoutEffect(() => {
    if (!paxModalOpen) return undefined;
    function update() {
      setPaxPopPos({ ...popoverCoords(paxBtnRef.current, 320), width: 'min(300px, calc(100vw - 20px))' });
    }
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [paxModalOpen]);

  const catalog = useMemo(() => {
    if (catalogSeed == null) return [];
    return buildActivities(catalogSeed, submittedDestination || destinationDraft);
  }, [catalogSeed, submittedDestination, destinationDraft]);

  const filteredSorted = useMemo(() => {
    let list = catalog.filter((a) => {
      if (chipSection && a.sectionSlug !== chipSection) return false;

      const gr =
        guestRating === 'any' ? 0 : guestRating === '9' ? 9 : guestRating === '8' ? 8 : guestRating === '7' ? 7 : 0;
      if (gr > 0 && a.rating < gr - 0.001) return false;

      if (fltFreeCancel && !a.freeCancel) return false;
      if (fltSellsOut && !a.sellsOut) return false;
      if (fltSkip && !a.skipLine) return false;
      if (fltPrivate && !a.privateTour) return false;

      if (facWheelchair && !a.wheelchair) return false;
      if (facStroller && !a.stroller) return false;
      if (facAnimal && !a.serviceAnimal) return false;

      const anyPrice = PRICE_BANDS.some((b) => pricePick[b.id]);
      if (anyPrice) {
        const okPrice = PRICE_BANDS.some((b) => pricePick[b.id] && a.price >= b.min && a.price < b.max);
        if (!okPrice) return false;
      }

      const anyDur = DUR_BANDS.some((d) => durPick[d.id]);
      if (anyDur) {
        const h = a.durationH;
        const okDur = DUR_BANDS.some((d) => {
          if (!durPick[d.id]) return false;
          if (d.id === 'd0') return h > 0 && h <= 3;
          if (d.id === 'd1') return h > 3 && h <= 5;
          if (d.id === 'd2') return h > 5 && h <= 7;
          return h > 7 || a.durationLabel === 'Tam gün';
        });
        if (!okDur) return false;
      }

      const themesOn = Object.keys(themesPick).filter((tid) => themesPick[tid]);
      if (themesOn.length && themesOn.length < THEME_OPTS.length) {
        if (!a.themes.some((t) => themesPick[t])) return false;
      }

      return true;
    });

    if (sortBy === 'cheap') list = [...list].sort((a, b) => a.price - b.price);
    else if (sortBy === 'expensive') list = [...list].sort((a, b) => b.price - a.price);
    else if (sortBy === 'rating') list = [...list].sort((a, b) => b.rating - a.rating);
    else
      list = [...list].sort(
        (a, b) => b.rating * Math.log10(b.reviews + 10) - a.rating * Math.log10(a.reviews + 10)
      );
    return list;
  }, [
    catalog,
    chipSection,
    guestRating,
    fltFreeCancel,
    fltSellsOut,
    fltSkip,
    fltPrivate,
    pricePick,
    durPick,
    facWheelchair,
    facStroller,
    facAnimal,
    themesPick,
    sortBy,
  ]);

  const placeSuggestions = useMemo(() => {
    const q = placeQuery.trim().toLowerCase();
    if (!q) return PLACES;
    return PLACES.filter(
      (p) =>
        p.primary.toLowerCase().includes(q) ||
        p.secondary.toLowerCase().includes(q) ||
        p.draft.toLowerCase().includes(q)
    );
  }, [placeQuery]);

  function selectPlace(p) {
    setDestinationDraft(p.draft);
    setDestinationLine(`${p.primary}, ${p.secondary}`);
    setDestPopoverOpen(false);
  }

  function commitFreeTextDestination() {
    const raw = (placeQuery.trim() || destinationDraft).trim() || 'İstanbul';
    const cap = raw.charAt(0).toLocaleUpperCase('tr-TR') + raw.slice(1);
    setDestinationDraft(cap);
    setDestinationLine(`${cap} (ve çevresi), ${cap}, Türkiye`);
    setDestPopoverOpen(false);
  }

  const sectionsForRender = useMemo(() => {
    const secOrder = SECTION_META.map((s) => s.slug);
    return secOrder.map((slug) => {
      const meta = SECTION_META.find((s) => s.slug === slug);
      const rows = filteredSorted.filter((a) => a.sectionSlug === slug);
      return { ...meta, rows };
    }).filter((s) => {
      if (chipSection && s.slug !== chipSection) return false;
      return s.rows.length > 0;
    });
  }, [filteredSorted, chipSection]);

  const runSearch = useCallback(() => {
    const dest = destinationDraft.trim() || 'İstanbul';
    setLoading(true);
    setHasSearched(true);
    const seed = hashSeed(`${dest}|${dateStart}|${dateEnd}|${participantCount}|activity`);
    setSubmittedDestination(dest);
    setCatalogSeed(seed);
    window.setTimeout(() => setLoading(false), 420);
  }, [destinationDraft, dateStart, dateEnd, participantCount]);

  function togglePick(setter, key) {
    setter((p) => ({ ...p, [key]: !p[key] }));
  }

  const filterBody = (
    <>
      <div style={sx.filterHeading}>Misafir puanı</div>
      {[
        { id: 'any', label: 'Fark etmez' },
        { id: '9', label: 'Mükemmel 9+' },
        { id: '8', label: 'Çok iyi 8+' },
        { id: '7', label: 'İyi 7+' },
      ].map(({ id, label }) => (
        <label key={id} style={sx.ckRow}>
          <input type="radio" name="act-gr" checked={guestRating === id} onChange={() => setGuestRating(id)} />
          {label}
        </label>
      ))}

      <div style={sx.filterHeading}>Öne çıkanlar</div>
      <label style={sx.ckRow}>
        <input type="checkbox" checked={fltFreeCancel} onChange={(e) => setFltFreeCancel(e.target.checked)} />
        Ücretsiz iptal
      </label>
      <label style={sx.ckRow}>
        <input type="checkbox" checked={fltSellsOut} onChange={(e) => setFltSellsOut(e.target.checked)} />
        Çabucak tükenebilir
      </label>
      <label style={sx.ckRow}>
        <input type="checkbox" checked={fltSkip} onChange={(e) => setFltSkip(e.target.checked)} />
        Sırayı atlama
      </label>
      <label style={sx.ckRow}>
        <input type="checkbox" checked={fltPrivate} onChange={(e) => setFltPrivate(e.target.checked)} />
        Özel tur
      </label>

      <div style={sx.filterHeading}>Fiyat aralığı</div>
      {PRICE_BANDS.map((b) => (
        <label key={b.id} style={sx.ckRow}>
          <input type="checkbox" checked={pricePick[b.id]} onChange={() => togglePick(setPricePick, b.id)} />
          {`${fmtPrice(b.min, prefCurrency, locale)} – ${b.max === Infinity ? fmtPrice(b.min + 5000, prefCurrency, locale) + '+' : fmtPrice(b.max, prefCurrency, locale)}`}
        </label>
      ))}

      <div style={sx.filterHeading}>Süre</div>
      {DUR_BANDS.map((d) => (
        <label key={d.id} style={sx.ckRow}>
          <input type="checkbox" checked={durPick[d.id]} onChange={() => togglePick(setDurPick, d.id)} />
          {d.maxH <= 3
            ? '0–3 saat'
            : d.maxH <= 5
              ? '3–5 saat'
              : d.maxH <= 7
                ? '5–7 saat'
                : 'Tam gün'}
        </label>
      ))}

      <div style={sx.filterHeading}>Erişilebilirlik</div>
      <label style={sx.ckRow}>
        <input type="checkbox" checked={facWheelchair} onChange={(e) => setFacWheelchair(e.target.checked)} />
        Tekerlekli sandalye uygun
      </label>
      <label style={sx.ckRow}>
        <input type="checkbox" checked={facStroller} onChange={(e) => setFacStroller(e.target.checked)} />
        Bebek arabası uygun
      </label>
      <label style={sx.ckRow}>
        <input type="checkbox" checked={facAnimal} onChange={(e) => setFacAnimal(e.target.checked)} />
        Refakat hayvanına izin
      </label>

      <div style={sx.filterHeading}>Temalar</div>
      {THEME_OPTS.map((t) => (
        <label key={t.id} style={sx.ckRow}>
          <input
            type="checkbox"
            checked={themesPick[t.id]}
            onChange={() => togglePick(setThemesPick, t.id)}
          />
          {t.label}
        </label>
      ))}
    </>
  );

  const pillScroll = isCompact && !isPhone;

  return (
    <div style={sx.wrap}>
      <div style={qp.stickyTop}>
        <div style={qp.stickyInner}>
          <div style={{ ...qp.topBarRow, ...(isPhone ? qp.topBarRowMobile : {}) }}>
            <div
              style={
                pillScroll ? qp.pillScrollOuter : { width: '100%', minWidth: 0, display: 'flex', justifyContent: 'center' }
              }
            >
              <div
                ref={barRef}
                style={{
                  ...qp.barCluster,
                  ...(pillScroll ? { flexWrap: 'nowrap', width: 'max-content', maxWidth: 'none' } : {}),
                }}
              >
                  <div style={qp.titlePill}>
                    <span style={qp.spark} aria-hidden>
                      <Sparkles size={11} strokeWidth={2.2} color="var(--ta-accent)" />
                    </span>
                    <span style={qp.titleTxt}>Aktiviteler</span>
                  </div>
                  {!isPhone ? <span style={qp.barSep} /> : null}
                  <div style={qp.clusterFieldsRow}>
                    <div style={qp.clusterFieldWrap}>
                      <FilterField
                        icon={MapPin}
                        label="Destinasyon"
                        value={destinationLine}
                        flex="1 1 auto"
                        extraStyle={{ width: '100%' }}
                        grow={false}
                        expanded={destPopoverOpen}
                        onClick={() => {
                          setPlaceQuery(destinationDraft);
                          setDestPopoverOpen((v) => !v);
                          setDateModalOpen(false);
                          setPaxModalOpen(false);
                        }}
                      />
                      {destPopoverOpen ? (
                        <div ref={destPopoverRef} role="dialog" aria-label="Destinasyon ara" style={sx.destPopoverPanel}>
                        <div style={{ position: 'relative' }}>
                          <input
                            value={placeQuery}
                            onChange={(e) => setPlaceQuery(e.target.value)}
                            style={sx.destPopoverInputHighlight}
                            placeholder="Şehir veya bölge"
                            aria-label="Destinasyon yazın"
                          />
                          <button
                            type="button"
                            aria-label="Temizle"
                            style={sx.destPopoverClear}
                            onClick={() => setPlaceQuery('')}
                          >
                            <X size={16} aria-hidden />
                          </button>
                        </div>
                        <hr style={{ border: 'none', borderTop: '1px solid #e9edf4', margin: '4px -4px 0' }} />
                        <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                          {placeSuggestions.map((p) => (
                            <button key={p.id} type="button" style={sx.destSuggestRow} onClick={() => selectPlace(p)}>
                              <Building2 size={20} color="#243652" aria-hidden />
                              <span style={{ minWidth: 0 }}>
                                <span style={{ display: 'block', fontWeight: 700, color: '#0f2942', fontSize: 15 }}>{p.primary}</span>
                                <span style={{ display: 'block', fontSize: 13, color: 'var(--ta-ink-muted)', marginTop: 2 }}>
                                  {p.secondary}
                                </span>
                              </span>
                            </button>
                          ))}
                        </div>
                        <hr style={{ border: 'none', borderTop: '1px solid #e9edf4', margin: '0 -4px' }} />
                        <button type="button" style={sx.destSearchWideRow} onClick={commitFreeTextDestination}>
                          <Search size={20} aria-hidden strokeWidth={2} color="#243652" />
                          <span style={{ fontWeight: 700, color: '#0f2942', textAlign: 'left' }}>
                            {`“${placeQuery.trim() || destinationDraft}” için ara`}
                          </span>
                        </button>
                      </div>
                    ) : null}
                    </div>
                    <div style={{ ...qp.clusterFieldWrap, flex: '0 1 170px' }}>
                      <FilterField
                        ref={dateBtnRef}
                        icon={Calendar}
                        label="Tarih"
                        value={formatShortRangeTR(dateStart, dateEnd)}
                        flex="1 1 auto"
                        extraStyle={{ width: '100%' }}
                        grow={false}
                        expanded={dateModalOpen}
                        onClick={() => {
                          setDestPopoverOpen(false);
                          setPaxModalOpen(false);
                          setDateModalOpen((v) => !v);
                        }}
                      />
                    </div>
                    <div style={{ ...qp.clusterFieldWrap, flex: '0 1 150px' }}>
                      <FilterField
                        ref={paxBtnRef}
                        icon={Users}
                        label="Katılımcılar"
                        value={`${participantCount} kişi`}
                        flex="1 1 auto"
                        extraStyle={{ width: '100%' }}
                        grow={false}
                        expanded={paxModalOpen}
                        onClick={() => {
                          setDestPopoverOpen(false);
                          setDateModalOpen(false);
                          setPaxModalOpen((v) => !v);
                        }}
                      />
                    </div>
                  </div>
                  {!isPhone ? <span style={qp.barSep} /> : null}
                  <button
                    type="button"
                    style={{ ...qp.searchBtn, ...(isPhone ? { width: '100%', justifyContent: 'center' } : {}) }}
                    onClick={() => {
                      closeActivityPanels();
                      runSearch();
                    }}
                    disabled={loading}
                  >
                    <Search size={15} strokeWidth={2.25} color="#FFFFFF" aria-hidden />
                    {loading ? 'Aranıyor…' : 'Ara'}
                  </button>
            </div>
            </div>
          </div>
        </div>
      </div>

      <QuickPlanCalendarPopover
        innerRef={dateModalRef}
        open={dateModalOpen}
        mode="range"
        committedStart={dateStart}
        committedEnd={dateEnd}
        layout={datePopPos}
        aria-label="Tarih aralığı"
        onApply={(s, e) => {
          setDateStart(s);
          setDateEnd(e);
          setDateModalOpen(false);
        }}
      />
      {paxModalOpen ? (
        <QuickPlanActivityParticipantsPanel
          innerRef={paxPopoverRef}
          layout={paxPopPos}
          adults={participantCount}
          onChange={setParticipantCount}
        />
      ) : null}

      <div style={sx.mainScroll}>
        {!hasSearched ? (
          <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <EmptyState
              icon={Ticket}
              title="Şehir ve tarih seçerek başlayın"
              description="Arama öncesi yalnızca destinasyon ve tarih gereklidir. Sonrasında yan filtreler ve kategori bölümleri açılır."
            />
          </div>
        ) : (
          <div
            style={{
              ...sx.bodyRow,
              ...(isCompact ? { padding: '12px', flexDirection: 'column' } : {}),
            }}
          >
            {!isCompact ? (
              <aside style={sx.aside}>
                <div style={sx.filterPanelHdr}>Filtreler</div>
                <div>{filterBody}</div>
              </aside>
            ) : null}

            <main style={{ flex: 1, minWidth: 0 }}>
              {isCompact ? (
                <button type="button" style={sx.mobileFab} onClick={() => setFilterDrawer(true)}>
                  <SlidersHorizontal size={18} />
                  Filtreler
                </button>
              ) : null}

              <div style={{ ...sx.pageHeadRow, ...(isPhone ? { flexDirection: 'column', alignItems: 'flex-start', gap: 12 } : {}) }}>
                <h1 style={sx.cityTitle}>{submittedDestination.trim() || 'Aktiviteler'}</h1>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <span style={{ fontSize: 13, color: 'var(--ta-ink-muted)', fontWeight: 600 }}>Sırala:</span>
                  <select style={sx.select} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="recommended">En popüler</option>
                    <option value="rating">Puana göre</option>
                    <option value="cheap">Önce uygun</option>
                    <option value="expensive">Önce yüksek fiyat</option>
                  </select>
                </label>
              </div>

              <div style={sx.chipRow}>
                <button type="button" style={{ ...sx.chip, ...(!chipSection ? sx.chipOn : {}) }} onClick={() => setChipSection('')}>
                  <LayoutGrid size={16} aria-hidden />
                  Tümü
                </button>
                {SECTION_META.map(({ slug, chipIcon: Icon, chipLabel }) => (
                  <button
                    key={slug}
                    type="button"
                    style={{ ...sx.chip, ...(chipSection === slug ? sx.chipOn : {}) }}
                    onClick={() => setChipSection(slug)}
                  >
                    <Icon size={16} aria-hidden />
                    {chipLabel}
                  </button>
                ))}
              </div>

              {loading ? (
                <div style={{ display: 'grid', gap: 14 }}>
                  {[1, 2, 3, 4, 5].map((k) => (
                    <div
                      key={k}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: isPhone ? '1fr' : '180px 1fr 140px',
                        gap: 14,
                        background: '#fff',
                        border: '1px solid rgba(0,0,0,.08)',
                        borderRadius: 12,
                        padding: 14,
                      }}
                    >
                      <div style={{ height: 108, borderRadius: 10, background: '#e8eaef' }} />
                      <div>
                        <div style={{ height: 14, width: '70%', background: '#e8eaef', borderRadius: 4 }} />
                        <div style={{ height: 12, width: '40%', marginTop: 12, background: '#f1f3f6', borderRadius: 4 }} />
                      </div>
                      <div style={{ alignSelf: 'end' }}>
                        <div style={{ height: 12, width: '60%', marginLeft: 'auto', background: '#f1f3f6', borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredSorted.length === 0 ? (
                <EmptyState
                  icon={Ticket}
                  tone="muted"
                  title="Uygun aktivite bulunamadı"
                  description="Sol filtreleri gevşetmeyi veya kategori sekmelerini sıfırlamayı deneyin."
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 36, paddingBottom: 40 }}>
                  {sectionsForRender.map((sec) => (
                    <section key={sec.slug}>
                      <h2 style={sx.sectionH}>{sec.heading}</h2>
                      <div style={{ display: 'grid', gridTemplateColumns: isPhone ? '1fr' : 'repeat(2, minmax(0,1fr))', gap: 16 }}>
                        {(chipSection === sec.slug ? sec.rows : sec.rows.slice(0, 4)).map((a) => (
                          <article key={a.id} style={{ ...sx.card, ...(isPhone ? { gridTemplateColumns: '1fr' } : {}) }}>
                            <div style={sx.imgWrap}>
                              <div
                                style={{
                                  ...sx.imgPh,
                                  background: `linear-gradient(145deg,hsl(${a.hue},62%,52%) 0%,hsl(${a.hue},45%,38%) 100%)`,
                                }}
                              />
                              <button
                                type="button"
                                style={sx.heartFab}
                                onClick={() =>
                                  setLikedIds((prev) => {
                                    const n = new Set(prev);
                                    if (n.has(a.id)) n.delete(a.id);
                                    else n.add(a.id);
                                    return n;
                                  })
                                }
                                aria-label={likedIds.has(a.id) ? 'Favoriden çıkar' : 'Favorilere ekle'}
                              >
                                <Heart
                                  size={17}
                                  color={likedIds.has(a.id) ? 'var(--ta-accent-deep)' : '#fff'}
                                  fill={likedIds.has(a.id) ? 'var(--ta-accent-deep)' : 'transparent'}
                                  strokeWidth={2}
                                />
                              </button>
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <h3 style={sx.cardTitle}>{a.title}</h3>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                                <span style={sx.ratingPill}>{a.rating.toFixed(1)}</span>
                                <span style={sx.revMuted}>({a.reviews.toLocaleString(locale)} yorum)</span>
                              </div>
                              <div style={sx.metaLine}>
                                <span>{a.durationLabel}</span>
                                {a.freeCancel ? (
                                  <>
                                    <span style={sx.dot}>·</span>
                                    <span style={sx.greenTag}>Ücretsiz iptal</span>
                                  </>
                                ) : null}
                                {a.skipLine ? (
                                  <>
                                    <span style={sx.dot}>·</span>
                                    <span>Hızlı giriş</span>
                                  </>
                                ) : null}
                              </div>
                            </div>
                            <div
                              style={{
                                alignSelf: isPhone ? 'flex-start' : 'end',
                                textAlign: isPhone ? 'left' : 'right',
                              }}
                            >
                              <div style={sx.priceFrom}>Başlayan fiyatlar</div>
                              <div style={sx.priceMain}>{fmtPrice(a.price, prefCurrency, locale)}</div>
                              <div style={sx.priceSub}>kişi başı</div>
                              <div style={{ marginTop: 6, display: 'flex', justifyContent: isPhone ? 'flex-start' : 'flex-end' }}>
                                <TripifyButton
                                  serviceType="activity"
                                  listing={{
                                    name: a.title || a.name || 'Aktivite',
                                    location: a.city || a.location || destinationDraft || '',
                                    price: Number(a.price) || 0,
                                    type: 'activity',
                                    imageUrl: a.imageUrl || a.photo || null,
                                  }}
                                  destination={a.city || a.location || destinationDraft || ''}
                                  autoBook={false}
                                  preferTripId={activePlanId}
                                />
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                      {!chipSection && sec.rows.length > 4 ? (
                        <div style={{ marginTop: 16 }}>
                          <button type="button" style={sx.seeAll} onClick={() => setChipSection(sec.slug)}>
                            Tümünü gör · {sec.chipLabel}
                          </button>
                        </div>
                      ) : null}
                    </section>
                  ))}
                </div>
              )}
            </main>
          </div>
        )}
      </div>

      {isCompact && filterDrawer ? (
        <div style={sx.drawerOverlay} role="presentation" onClick={() => setFilterDrawer(false)}>
          <div style={sx.drawer} role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
            <div style={sx.drawerHead}>
              <span style={{ fontWeight: 800, fontSize: 16 }}>Filtreler</span>
              <button type="button" style={sx.drawerClose} onClick={() => setFilterDrawer(false)} aria-label="Kapat">
                <X size={20} />
              </button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: '12px 16px 120px' }}>{filterBody}</div>
            <div style={{ padding: 16, borderTop: '1px solid rgba(0,0,0,.06)', background: '#fff' }}>
              <button type="button" style={sx.applyBtn} onClick={() => setFilterDrawer(false)}>
                Sonuçları göster ({filteredSorted.length})
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const sx = {
  wrap: { minHeight: 0, flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)', fontFamily: 'var(--font-sans)' },
  stickyTop: {
    flexShrink: 0,
    zIndex: 'var(--z-sticky)',
    background: '#fff',
    boxShadow: '0 1px 10px rgba(0,0,0,.05)',
    borderBottomWidth: 'var(--border-thin)',
    borderBottomStyle: 'solid',
    borderBottomColor: 'rgba(0,0,0,.06)',
    overflow: 'visible',
  },
  stickyInner: { maxWidth: 1320, margin: '0 auto', padding: 'var(--space-3) var(--space-4) var(--space-3)', boxSizing: 'border-box' },
  topRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' },
  pillScrollOuter: {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
    paddingBottom: 4,
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
    maxWidth: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
  },
  pillBarDesktop: {
    width: '100%',
    maxWidth: '100%',
    padding: '10px 12px 10px 14px',
    minHeight: 56,
    flexWrap: 'nowrap',
  },
  /** Aktivite: destinasyon+tarih kartları sığdırmak için */
  pillBarDesktopAct: {
    width: '100%',
    maxWidth: '100%',
    padding: '7px 10px',
    flexWrap: 'wrap',
    alignItems: 'center',
    minHeight: 50,
    borderRadius: 14,
  },
  pillBarMobile: { borderRadius: 20, padding: '10px 12px', flexDirection: 'column', alignItems: 'stretch' },
  clusterAct: {
    flex: '1 1 auto',
    minWidth: 0,
    width: '100%',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'stretch',
    gap: '8px 10px',
  },
  actFieldsRow: {
    flex: '1 1 auto',
    display: 'flex',
    gap: 10,
    alignItems: 'stretch',
    flexWrap: 'wrap',
    minWidth: 0,
  },
  actFieldWrap: {
    flex: '1 1 156px',
    minWidth: 0,
    maxWidth: '100%',
    position: 'relative',
  },
  cluster: {
    flex: '1 1 auto',
    minWidth: 0,
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '4px 8px',
  },
  titlePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    padding: '4px 10px',
    borderRadius: 999,
    flexShrink: 0,
  },
  titleText: { fontSize: 12, fontWeight: 700, color: 'var(--text1)', whiteSpace: 'nowrap' },
  barSep: { width: 1, height: 36, background: 'rgba(0,0,0,.10)', margin: '0 5px', flexShrink: 0 },
  barDot: { color: 'rgba(0,0,0,.25)', fontSize: 14, padding: '0 2px' },
  airportField: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 3,
    flexShrink: 0,
    minWidth: 0,
  },
  fieldLbl: {
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--ta-ink-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    lineHeight: 1,
  },
  destInp: {
    border: 'none',
    background: 'transparent',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: 'inherit',
    color: 'var(--ta-ink)',
    minWidth: 140,
    maxWidth: 'min(380px, 48vw)',
    width: 'min(360px, 100%)',
    padding: '6px 4px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  chipDate: {
    border: 'none',
    background: 'transparent',
    fontSize: 12,
    fontWeight: 600,
    fontFamily: 'inherit',
    color: 'var(--ta-ink)',
    padding: '6px 2px',
  },
  actFieldCard: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 12px',
    borderRadius: 10,
    border: '1px solid #dfe4ec',
    background: '#fff',
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'left',
    boxSizing: 'border-box',
    flex: '1 1 auto',
    width: '100%',
    minWidth: 0,
    maxWidth: '100%',
    boxShadow: '0 1px 2px rgba(15,41,74,.05)',
    transition: 'border-color .15s, box-shadow .15s',
  },
  actFieldLbl: {
    display: 'block',
    fontSize: 10,
    fontWeight: 650,
    color: '#65758c',
    lineHeight: 1.2,
    marginBottom: 2,
    letterSpacing: '0.01em',
  },
  actFieldVal: {
    display: 'block',
    fontSize: 13,
    fontWeight: 800,
    color: '#132d4f',
    lineHeight: 1.28,
    whiteSpace: 'normal',
    wordBreak: 'break-word',
  },
  destPopoverPanel: {
    position: 'absolute',
    left: 0,
    top: 'calc(100% + 10px)',
    width: 'min(420px, calc(100vw - 48px))',
    zIndex: 50,
    background: '#fff',
    borderRadius: 14,
    border: '1px solid #e3eaf3',
    boxShadow: '0 16px 48px rgba(15,41,74,.14)',
    padding: '12px 10px',
    boxSizing: 'border-box',
  },
  destPopoverInputHighlight: {
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: 6,
    border: 'none',
    padding: '10px 36px 10px 10px',
    fontSize: 14,
    fontWeight: 600,
    fontFamily: 'inherit',
    background: '#1a73e8',
    color: '#fff',
    outline: 'none',
  },
  destPopoverClear: {
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 36,
    height: 36,
    borderRadius: 999,
    border: 'none',
    background: 'rgba(255,255,255,.24)',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  destSuggestRow: {
    width: '100%',
    border: 'none',
    borderRadius: 10,
    background: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '12px 8px',
    fontFamily: 'inherit',
    textAlign: 'left',
    transition: 'background .12s',
  },
  destSearchWideRow: {
    width: '100%',
    border: 'none',
    borderRadius: 12,
    background: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 8px 4px',
    fontFamily: 'inherit',
    textAlign: 'left',
  },
  datePopoverFixed: {
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
  calHeaderDates: {
    display: 'flex',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 10,
    fontWeight: 800,
    color: '#0f2942',
  },
  calHeaderSeg: {
    border: 'none',
    background: 'transparent',
    padding: 0,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  calHeaderSegInner: { display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 },
  calHdrTxt: { fontSize: 14 },
  calHdrUnderline: {
    alignSelf: 'stretch',
    height: 3,
    borderRadius: 2,
    background: '#1a73e8',
  },
  calHdrUnderlineOff: { alignSelf: 'stretch', height: 3 },
  calHeaderArrow: { color: '#5a6982', fontWeight: 600, fontSize: 16 },
  dualCalNavRow: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
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
  calMonthTitle: {
    textAlign: 'center',
    fontWeight: 800,
    fontSize: 13,
    color: '#0f2942',
  },
  calDayGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
    gridAutoRows: 30,
    columnGap: 3,
    rowGap: 4,
    width: '100%',
    boxSizing: 'border-box',
  },
  calDowHdr: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 700,
    color: '#929fb4',
    textTransform: 'capitalize',
  },
  calGhostCell: { height: 30, minHeight: 30, visibility: 'hidden', pointerEvents: 'none' },
  calDayBtn: {
    width: '100%',
    minWidth: 0,
    height: 30,
    border: 'none',
    borderRadius: 999,
    cursor: 'pointer',
    fontSize: 13,
    fontFamily: 'inherit',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
  },
  calFooterDone: {
    borderTop: '1px solid #eef2f8',
    marginTop: 12,
    paddingTop: 10,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  calDoneBtn: {
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
  searchBlack: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 14px',
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 999,
    border: '1px solid rgba(0,0,0,.15)',
    background: 'var(--ta-ink)',
    color: '#FFFFFF',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  mainScroll: { flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' },
  bodyRow: {
    flex: 1,
    display: 'flex',
    minHeight: 0,
    gap: 20,
    maxWidth: 1320,
    margin: '0 auto',
    width: '100%',
    padding: '20px 20px 48px',
    boxSizing: 'border-box',
    alignItems: 'flex-start',
  },
  aside: {
    width: 272,
    flexShrink: 0,
    alignSelf: 'flex-start',
    position: 'sticky',
    top: 12,
    maxHeight: 'calc(100vh - 140px)',
    overflowY: 'auto',
    background: '#fff',
    border: '1px solid rgba(0,0,0,.08)',
    borderRadius: 14,
    padding: '18px 16px',
    boxSizing: 'border-box',
  },
  filterPanelHdr: {
    fontSize: 15,
    fontWeight: 800,
    borderBottom: '1px solid rgba(0,0,0,.08)',
    paddingBottom: 12,
    marginBottom: 4,
  },
  filterHeading: { fontSize: 12, fontWeight: 700, marginTop: 14, marginBottom: 10, color: 'var(--ta-ink)' },
  ckRow: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ta-ink)', cursor: 'pointer', marginBottom: 6 },
  pageHeadRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' },
  cityTitle: { fontSize: 'clamp(26px, 3.8vw, 36px)', fontWeight: 800, margin: '0 0 4px', color: 'var(--ta-ink)' },
  select: {
    padding: '8px 12px',
    borderRadius: 10,
    border: '1px solid rgba(0,0,0,.12)',
    fontWeight: 600,
    fontSize: 13,
    fontFamily: 'inherit',
    background: '#fff',
  },
  chipRow: {
    display: 'flex',
    gap: 8,
    overflowX: 'auto',
    padding: '14px 0 18px',
    WebkitOverflowScrolling: 'touch',
    scrollbarGutter: 'stable',
    flexWrap: 'nowrap',
  },
  chip: {
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 16px',
    borderRadius: 999,
    border: '1px solid rgba(0,0,0,.1)',
    background: '#fff',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: 'inherit',
    color: 'var(--ta-ink-muted)',
  },
  chipOn: {
    borderColor: 'var(--ta-accent)',
    background: 'var(--ta-accent-soft)',
    color: 'var(--ta-ink)',
  },
  card: {
    display: 'grid',
    gridTemplateColumns: 'minmax(148px,1fr) minmax(0,1.35fr) minmax(118px,.75fr)',
    gap: 16,
    background: '#fff',
    borderRadius: 14,
    border: '1px solid rgba(0,0,0,.09)',
    padding: 14,
    boxSizing: 'border-box',
  },
  imgWrap: { position: 'relative', borderRadius: 12, overflow: 'hidden', minHeight: 102 },
  imgPh: { position: 'absolute', inset: 0 },
  heartFab: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 999,
    border: 'none',
    background: 'rgba(0,0,0,.28)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    backdropFilter: 'blur(8px)',
  },
  cardTitle: { margin: 0, fontSize: 15.5, fontWeight: 700, lineHeight: 1.35, color: 'var(--ta-ink)' },
  ratingPill: {
    fontSize: 12,
    fontWeight: 800,
    background: '#0d7a4d',
    color: '#fff',
    padding: '4px 8px',
    borderRadius: 6,
    display: 'inline-block',
    fontVariantNumeric: 'tabular-nums',
  },
  revMuted: { fontSize: 12.5, color: 'var(--ta-ink-muted)' },
  metaLine: { marginTop: 10, fontSize: 13, color: 'var(--ta-ink-muted)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4 },
  dot: { color: '#cfd3d9' },
  greenTag: { color: '#0d6842', fontWeight: 600 },
  priceFrom: { fontSize: 11.5, color: 'var(--ta-ink-muted)' },
  priceMain: { fontSize: 21, fontWeight: 800, color: 'var(--ta-ink)', marginTop: 4, fontVariantNumeric: 'tabular-nums' },
  priceSub: { fontSize: 12, color: 'var(--ta-ink-subtle)', marginTop: 4 },
  sectionH: { fontSize: 19, fontWeight: 750, margin: '0 0 16px', color: 'var(--ta-ink)' },
  seeAll: {
    border: 'none',
    background: 'none',
    padding: 0,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    color: 'var(--ta-accent-deep)',
    textDecoration: 'underline',
  },
  empty: { textAlign: 'center', padding: '52px 20px', color: 'var(--muted)', maxWidth: 520 },
  emptyTitle: { fontSize: 19, fontWeight: 650, margin: '0 0 10px', color: 'var(--ta-ink-muted)' },
  emptySub: { margin: 0, fontSize: 14.5, color: 'var(--ta-ink-subtle)', lineHeight: 1.55 },
  mobileFab: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 18px',
    borderRadius: 999,
    border: '1px solid rgba(0,0,0,.1)',
    background: '#fff',
    marginBottom: 14,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 2px 10px rgba(0,0,0,.08)',
    fontFamily: 'inherit',
  },
  drawerOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,.35)',
    zIndex: 120,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  drawer: {
    width: 'min(380px, 92vw)',
    height: '100%',
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
  },
  drawerHead: { padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  drawerClose: { border: 'none', background: '#f4f6f9', padding: 8, borderRadius: 8, cursor: 'pointer' },
  applyBtn: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    border: 'none',
    background: 'var(--ta-accent)',
    color: '#fff',
    fontWeight: 750,
    fontSize: 15,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};
