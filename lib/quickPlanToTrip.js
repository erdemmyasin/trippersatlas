/**
 * "Her şey bir gezi olabilir" — herhangi bir hızlı plan servisinden
 * (uçak, otel, otobüs, araç, aktivite) tek tıkla yeni bir gezi oluşturur,
 * servisi planda picked olarak işaretler, opsiyonel olarak booked yapar.
 *
 *   const tripId = createTripFromService({ serviceType: 'flight', listing, autoBook: true });
 *   router.push(`/trips/${tripId}`);
 */

import { createTrip, saveTrip } from '@/lib/tripStore';
import { saveTripWorkspace, defaultTripWorkspace } from '@/lib/tripWorkspaceStore';

/** Hızlı plan servis adı → TYPE_TO_SERVICES eşlemesinde kullanılan listing.type */
const SERVICE_TO_LISTING_TYPE = {
  stay:     'hotel',
  flight:   'flight',
  bus:      'bus',
  car:      'car',
  transfer: 'transfer',
  activity: 'activity',
  tour:     'tour',
};

/** TYPE_TO_SERVICES (ChatPlanWorkspace ile aynı kontrat) */
const TYPE_TO_SERVICES = {
  hotel:    ['lodging'],
  villa:    ['lodging'],
  flight:   ['flight'],
  bus:      ['bus'],
  car:      ['car'],
  transfer: ['transfer'],
  tour:     ['lodging', 'flight', 'activity'],
  boat:     ['activity'],
  activity: ['activity'],
  restaurant: ['extras'],
  extra:    ['extras'],
};

/** Servis → bütçe kategorisi */
const TYPE_TO_BUDGET_CAT = {
  hotel: 'accommodation', villa: 'accommodation',
  flight: 'transport', bus: 'transport', car: 'transport', transfer: 'transport',
  tour: 'activities', boat: 'activities', activity: 'activities',
  restaurant: 'extras', extra: 'extras',
};

const SERVICE_TITLE = {
  stay: 'Konaklama',
  flight: 'Uçuş',
  bus: 'Otobüs',
  car: 'Araç',
  transfer: 'Transfer',
  activity: 'Aktivite',
  tour: 'Tur',
};

/**
 * @param {object} opts
 * @param {'stay'|'flight'|'bus'|'car'|'activity'|'tour'|'transfer'} opts.serviceType
 * @param {object} opts.listing — { name, location, price, type, imageUrl, ... }
 * @param {string} [opts.destination] — şehir; verilmezse listing.location'dan çıkar
 * @param {string} [opts.startDate] — ISO
 * @param {string} [opts.endDate] — ISO
 * @param {string} [opts.tripName] — yoksa "{Servis Başlığı} · {Destinasyon}"
 * @param {boolean} [opts.autoBook=true] — gerçek rezervasyon yapıldıysa true
 * @returns {string|null} oluşturulan tripId, veya başarısızsa null
 */
export function createTripFromService(opts = {}) {
  if (typeof window === 'undefined') return null;
  const {
    serviceType,
    listing,
    destination: destOverride,
    startDate,
    endDate,
    tripName,
    autoBook = true,
  } = opts;

  if (!listing || !listing.name) return null;

  const listingType =
    listing.type ||
    SERVICE_TO_LISTING_TYPE[serviceType] ||
    'extra';

  const location = String(listing.location || '').trim();
  const destination =
    String(destOverride || '').trim() ||
    location.split(/[,·\-]/)[0].trim() ||
    'Seyahat';

  const name =
    String(tripName || '').trim() ||
    `${SERVICE_TITLE[serviceType] || 'Servis'} · ${destination}`;

  // 1. Trip kaydı
  const trip = createTrip({
    name,
    destination,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });
  try {
    saveTrip(trip);
  } catch {
    return null;
  }

  // 2. Workspace tohumla
  const ws = defaultTripWorkspace();
  const svcIds = TYPE_TO_SERVICES[listingType] || [];
  const catKey = TYPE_TO_BUDGET_CAT[listingType] || 'extras';
  const price = Number(listing.price) || 0;

  ws.plan.selectedListings = { [listing.name]: { ...listing, type: listingType } };
  ws.plan.completedModules = svcIds;
  ws.plan.bookedServices = autoBook ? [...svcIds] : [];
  ws.plan.budget = { accommodation: 0, transport: 0, activities: 0, extras: 0 };
  ws.plan.budget[catKey] = price;
  ws.topBarData.planName = name;
  ws.topBarData.tripMeta = {
    ...ws.topBarData.tripMeta,
    destination,
  };
  if (listing.imageUrl) ws.coverImage = listing.imageUrl;

  try {
    saveTripWorkspace(trip.id, ws);
  } catch {
    /* trip oluştu ama workspace yazılamadı — yine de id dön */
  }

  try {
    window.dispatchEvent(new Event('tripsUpdated'));
  } catch {
    /* ignore */
  }

  return trip.id;
}
