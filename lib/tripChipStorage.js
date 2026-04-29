/**
 * Trip chip modalları + Header özet çipleri için localStorage anahtarları ve okuma/yazma yardımcıları.
 */

export const TRIP_LS = {
  locations: 'trip_locations',
  startDate: 'trip_startDate',
  endDate: 'trip_endDate',
  dateTab: 'trip_dateTab',
  flexDays: 'trip_flexDays',
  flexMonths: 'trip_flexMonths',
  flexibility: 'trip_flexibility',
  travelers: 'trip_travelers',
  budget: 'trip_budget',
  notes: 'trip_notes',
};

const MONTHS_SHORT = [
  'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara',
];

const TR_MONTHS_FULL = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

const FLEX_OPTIONS = [
  { id: 'exact', label: 'Kesin tarihler' },
  { id: '1', label: '± 1 gün' },
  { id: '2', label: '± 2 gün' },
  { id: '3', label: '± 3 gün' },
  { id: 'week', label: '± 1 hafta' },
];

export function notifyTripStorage() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('trip-local-storage'));
  }
}

/**
 * Kayıtlı geziden üst chip satırı (TRIP_LS) alanlarını doldurur — sohbet / gezi çalışma alanı senkronu.
 * @param {object} trip — destination, startDate, endDate, travelers, budget, notes
 */
export function seedTripChipsFromTrip(trip) {
  if (!trip || typeof window === 'undefined') return;
  try {
    const dest = String(trip.destination || '').trim();
    const cities = dest.split(/\s*·\s*/).map((s) => s.trim()).filter(Boolean);
    const locs = cities.map((city) => ({ city, name: city }));
    localStorage.setItem(TRIP_LS.locations, JSON.stringify(locs));
    if (trip.startDate) localStorage.setItem(TRIP_LS.startDate, trip.startDate);
    else localStorage.removeItem(TRIP_LS.startDate);
    if (trip.endDate) localStorage.setItem(TRIP_LS.endDate, trip.endDate);
    else localStorage.removeItem(TRIP_LS.endDate);
    const tr = trip.travelers && typeof trip.travelers === 'object' ? trip.travelers : {};
    localStorage.setItem(TRIP_LS.travelers, JSON.stringify(tr));
    localStorage.setItem(
      TRIP_LS.budget,
      typeof trip.budget === 'string' ? trip.budget : ''
    );
    const notesArr = Array.isArray(trip.notes)
      ? trip.notes.filter((x) => typeof x === 'string')
      : [];
    localStorage.setItem(TRIP_LS.notes, JSON.stringify(notesArr));
    notifyTripStorage();
  } catch {
    /* ignore */
  }
}

/** Yeni sohbet: üst chip oturumunu sıfırlar (SSR güvenli) */
export function clearTripChipSessionStorage() {
  if (typeof window === 'undefined') return;
  try {
    Object.values(TRIP_LS).forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    });
    notifyTripStorage();
  } catch {
    /* ignore */
  }
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function diffInclusiveDays(a, b) {
  const t0 = startOfDay(a).getTime();
  const t1 = startOfDay(b).getTime();
  return Math.round(Math.abs(t1 - t0) / 86400000) + 1;
}

function formatRangeSubtitle(lo, hi) {
  const a = lo <= hi ? lo : hi;
  const b = lo <= hi ? hi : lo;
  const n = diffInclusiveDays(a, b);
  return `${a.getDate()} ${MONTHS_SHORT[a.getMonth()]} - ${b.getDate()} ${MONTHS_SHORT[b.getMonth()]} · ${n} gün`;
}

function parseMonthKey(k) {
  const [ys, ms] = String(k).split('-');
  return { y: parseInt(ys, 10), m0: parseInt(ms, 10) - 1 };
}

function buildFlexChipText(flexDays, flexMonthKeys, flexibility) {
  const parts = [`${flexDays} gün`];
  if (flexMonthKeys?.length) {
    const labels = [...flexMonthKeys]
      .sort()
      .map((key) => {
        const { y, m0 } = parseMonthKey(key);
        if (Number.isNaN(m0)) return '';
        return `${TR_MONTHS_FULL[m0]} ${y}`;
      })
      .filter(Boolean)
      .join(', ');
    if (labels) parts.push(labels);
  }
  let t = parts.join(' · ');
  const flexEff = flexibility === '' ? 'exact' : flexibility;
  if (flexEff && flexEff !== 'exact') {
    const opt = FLEX_OPTIONS.find((o) => o.id === flexEff);
    if (opt) t += ` · ${opt.label}`;
  }
  return t;
}

function firstMonthShortFromKeys(keys) {
  if (!keys?.length) return '';
  const sorted = [...keys].sort();
  const { m0 } = parseMonthKey(sorted[0]);
  if (Number.isNaN(m0) || m0 < 0 || m0 > 11) return '';
  return MONTHS_SHORT[m0];
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

const EMPTY_META = {
  destination: '',
  nights: 0,
  month: '',
  datesChipText: '',
  travelers: null,
  paxChipText: '',
  budget: '',
};

/**
 * localStorage'dan chip satırı için tripMeta alanlarını okur (SSR güvenli).
 */
export function readTripMetaSnapshot() {
  if (typeof window === 'undefined') return { ...EMPTY_META };
  const out = { ...EMPTY_META };
  try {
    const raw = localStorage.getItem(TRIP_LS.locations);
    if (raw) {
      const locs = JSON.parse(raw);
      if (Array.isArray(locs) && locs.length) {
        const names = locs
          .map((l) => String(l?.city ?? l?.name ?? '').trim())
          .filter(Boolean);
        if (names.length) out.destination = names.join(' · ');
      }
    }
  } catch {
    /* ignore */
  }
  try {
    const sd = localStorage.getItem(TRIP_LS.startDate);
    const ed = localStorage.getItem(TRIP_LS.endDate);
    if (sd && ed) {
      const start = new Date(sd);
      const end = new Date(ed);
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        const lo = start <= end ? start : end;
        const hi = start <= end ? end : start;
        out.datesChipText = formatRangeSubtitle(lo, hi);
        out.nights = Math.max(0, diffInclusiveDays(lo, hi) - 1);
        out.month = MONTHS_SHORT[lo.getMonth()];
      }
    } else if (localStorage.getItem(TRIP_LS.dateTab) === 'flex') {
      const fd = parseInt(localStorage.getItem(TRIP_LS.flexDays) || '8', 10);
      const flexDays = Number.isFinite(fd) && fd >= 1 ? fd : 8;
      let fm = [];
      try {
        const fms = localStorage.getItem(TRIP_LS.flexMonths);
        if (fms) fm = JSON.parse(fms);
        if (!Array.isArray(fm)) fm = [];
      } catch {
        fm = [];
      }
      const flex = localStorage.getItem(TRIP_LS.flexibility) || '';
      out.datesChipText = buildFlexChipText(flexDays, fm, flex);
      out.nights = flexDays;
      out.month = firstMonthShortFromKeys(fm);
    }
  } catch {
    /* ignore */
  }
  try {
    const tr = localStorage.getItem(TRIP_LS.travelers);
    if (tr) {
      const t = JSON.parse(tr);
      if (t && typeof t === 'object') {
        out.paxChipText = buildPaxChipText(t);
        out.travelers = Math.max(1, paxGezginTotal(t) || 1);
      }
    }
  } catch {
    /* ignore */
  }
  try {
    const b = localStorage.getItem(TRIP_LS.budget);
    if (b) out.budget = b;
  } catch {
    /* ignore */
  }
  return out;
}

/**
 * Üst bileşenden gelen tripMeta ile LS özetini birleştirir; anlamlı parent değeri LS'yi ezer.
 */
export function mergeTripMetaForChips(parent, fromLs) {
  const p = parent || {};
  const ls = fromLs || { ...EMPTY_META };
  return {
    ...EMPTY_META,
    ...ls,
    ...p,
    destination:
      String(p.destination ?? '').trim() ? p.destination : ls.destination || '',
    datesChipText:
      String(p.datesChipText ?? '').trim()
        ? p.datesChipText
        : ls.datesChipText || '',
    month: String(p.month ?? '').trim() ? p.month : ls.month || '',
    nights:
      p.nights != null && Number(p.nights) > 0 ? p.nights : ls.nights || 0,
    paxChipText:
      String(p.paxChipText ?? '').trim() ? p.paxChipText : ls.paxChipText || '',
    travelers:
      p.travelers != null && p.travelers !== ''
        ? p.travelers
        : ls.travelers,
    budget: String(p.budget ?? '').trim() ? p.budget : ls.budget || '',
  };
}
