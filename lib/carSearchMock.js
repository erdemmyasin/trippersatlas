/** 15 araç — API yokken demo veri */

import { defaultStayCity } from '@/lib/taRegion';

const MODELS = [
  { name: 'Fiat Tipo', klass: 'Ekonomi' },
  { name: 'Renault Clio', klass: 'Ekonomi' },
  { name: 'Hyundai i20', klass: 'Ekonomi' },
  { name: 'Opel Corsa', klass: 'Kompakt' },
  { name: 'VW Golf', klass: 'Kompakt' },
  { name: 'Opel Mokka', klass: 'SUV' },
  { name: 'Dacia Sandero', klass: 'Ekonomi' },
  { name: 'Peugeot Traveller', klass: 'Minivan' },
  { name: 'VW Multivan', klass: 'Minivan' },
  { name: 'Toyota Corolla', klass: 'Orta' },
  { name: 'Skoda Octavia', klass: 'Orta' },
  { name: 'BMW 3 Serisi', klass: 'Orta' },
  { name: 'Mercedes Vito', klass: 'Minivan' },
  { name: 'Ford Kuga', klass: 'SUV' },
  { name: 'Renault Megane', klass: 'Orta' },
  { name: 'Ford Mondeo', klass: 'Büyük' },
  { name: 'VW Passat', klass: 'Büyük' },
];

const COMPANIES = ['Budget', 'Enterprise', 'AVEC', 'EuropCar', 'Garenta', 'Avis'];

const FUELS = ['Benzin', 'Dizel', 'Hybrid', 'Elektrik'];

function makeRng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function rng() {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

export function rentalDays(pickupIso, returnIso) {
  const a = new Date(pickupIso);
  const b = new Date(returnIso);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 3;
  const d = Math.max(1, Math.ceil((b - a) / 86400000));
  return Math.min(30, d);
}

/**
 * @param {{ location?: string, dropoffLocation?: string, pickupAt: string, returnAt: string, seed?: number }} p
 */
export function getMockCars(p) {
  const seed = Number(p.seed) || Date.now();
  const rng = makeRng(seed);
  const days = rentalDays(p.pickupAt, p.returnAt);
  const pickup = (p.location || '').trim() || defaultStayCity();
  const dropRaw = (p.dropoffLocation || '').trim();
  const drop = dropRaw || pickup;
  const list = [];

  for (let i = 0; i < 15; i++) {
    const m = MODELS[i % MODELS.length];
    const company = pick(rng, COMPANIES);
    const transmission = rng() > 0.42 ? 'Otomatik' : 'Manuel';
    const fuel = pick(rng, FUELS);
    let doors = 4;
    let seats = 5;
    let bags = 2;
    if (m.klass === 'Minivan') {
      doors = 5;
      seats = 7 + Math.floor(rng() * 2);
      bags = 4;
    } else if (m.klass === 'SUV') {
      doors = 5;
      seats = 5;
      bags = 3;
    } else if (m.klass === 'Ekonomi') {
      doors = 4;
      seats = 4 + Math.floor(rng() * 2);
      bags = 1 + Math.floor(rng() * 2);
    }

    const daily = Math.floor(800 + rng() * 2200);
    const total = Math.floor(daily * days * (0.95 + rng() * 0.2));
    const hasDiscount = rng() > 0.65;
    const discountPct = hasDiscount ? 10 + Math.floor(rng() * 20) : 0;

    const dropOpts = [
      `${drop} — Merkez ofis`,
      `${drop} — Havalimanı teslim`,
      `${pickup} — Alış ofisi`,
    ];

    list.push({
      id: `car-mock-${i}-${seed}`,
      name: m.name,
      orSimilar: m.klass,
      klass: m.klass,
      doors,
      seats,
      bags,
      transmission,
      transmissionCode: transmission === 'Otomatik' ? 'A' : 'M',
      fuel,
      company,
      pickup: `${pickup} — Ofis`,
      dropoff: pick(rng, dropOpts),
      freeCancel: rng() > 0.4,
      deliveryAvailable: rng() > 0.55,
      fullInsurance: rng() > 0.5,
      score: Math.round((7.2 + rng() * 2.2) * 10) / 10,
      totalPrice: hasDiscount ? Math.floor(total * (1 - discountPct / 100)) : total,
      strikeTotal: hasDiscount ? total : null,
      dailyPrice: Math.floor((hasDiscount ? total * (1 - discountPct / 100) : total) / days),
      discountPct: hasDiscount ? discountPct : 0,
      mapX: 15 + rng() * 70,
      mapY: 12 + rng() * 68,
    });
  }

  return list;
}
