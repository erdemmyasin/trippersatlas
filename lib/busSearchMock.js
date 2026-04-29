/**
 * Şehirler otobüs — örnek sefer verisi (API yok; arayüz / filtre demoları).
 */

const BASE_TRIPS = [
  {
    id: 'b1',
    company: 'Isparta Petrol Turizm',
    dep: '05:30',
    arr: '13:50',
    durMin: 500,
    depStation: 'Antalya Otogar',
    arrStation: 'Ankara (AŞTİ)',
    seatLayout: '2+1',
    price: 840,
    onlineCancel: true,
    seatsLeft: 4,
  },
  {
    id: 'b2',
    company: 'Özkaymak',
    dep: '08:15',
    arr: '16:40',
    durMin: 505,
    depStation: 'Antalya Otogar',
    arrStation: 'Ankara (AŞTİ)',
    seatLayout: '2+2',
    price: 720,
    onlineCancel: true,
    seatsLeft: null,
  },
  {
    id: 'b3',
    company: 'Kamil Koç',
    dep: '11:00',
    arr: '19:20',
    durMin: 500,
    depStation: 'Antalya Otogar',
    arrStation: 'Ankara (AŞTİ)',
    seatLayout: '2+1',
    price: 899,
    onlineCancel: false,
    seatsLeft: 12,
  },
  {
    id: 'b4',
    company: 'Metro Turizm',
    dep: '14:30',
    arr: '22:55',
    durMin: 505,
    depStation: 'Antalya Otogar',
    arrStation: 'Ankara (AŞTİ)',
    seatLayout: '2+2',
    price: 650,
    onlineCancel: true,
    seatsLeft: 2,
  },
  {
    id: 'b5',
    company: 'Ali Osman Ulusoy',
    dep: '22:00',
    arr: '06:15',
    durMin: 495,
    depStation: 'Antalya Otogar',
    arrStation: 'Ankara (AŞTİ)',
    seatLayout: '2+1',
    price: 780,
    onlineCancel: true,
    seatsLeft: null,
  },
  {
    id: 'b6',
    company: 'Pamukkale Turizm',
    dep: '09:45',
    arr: '18:05',
    durMin: 500,
    depStation: 'Antalya Otogar',
    arrStation: 'Ankara (AŞTİ)',
    seatLayout: '2+1',
    price: 825,
    onlineCancel: true,
    seatsLeft: 8,
  },
];

function hashRoute(from, to) {
  const s = `${from}|${to}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Güzergâha göre hafif varyasyon (fiyat / saat) ile liste üretir.
 */
export function getMockBusTrips({ from = 'Antalya', to = 'Ankara' } = {}) {
  const h = hashRoute(from, to);
  const fromU = String(from).toUpperCase();
  const toU = String(to).toUpperCase();

  return BASE_TRIPS.map((t, i) => {
    const priceJitter = ((h + i * 17) % 80) - 40;
    const minJitter = ((h + i * 11) % 25) - 12;
    const depHm = t.dep.split(':').map(Number);
    let depMin = depHm[0] * 60 + depHm[1] + minJitter;
    depMin = ((depMin % (24 * 60)) + 24 * 60) % (24 * 60);
    const dh = Math.floor(depMin / 60);
    const dm = depMin % 60;
    const depStr = `${String(dh).padStart(2, '0')}:${String(dm).padStart(2, '0')}`;
    const arrMinTotal = depMin + t.durMin;
    const ah = Math.floor(arrMinTotal / 60) % 24;
    const am = arrMinTotal % 60;
    const arrStr = `${String(ah).padStart(2, '0')}:${String(am).padStart(2, '0')}`;

    return {
      ...t,
      dep: depStr,
      arr: arrStr,
      durMin: t.durMin + (minJitter % 15),
      price: Math.max(380, t.price + priceJitter),
      routeLine: `${fromU} → ${toU}`,
      depStation: `${fromU} (Otogar)`,
      arrStation: `${toU} (AŞTİ)`,
    };
  });
}

export function uniqCompanies(trips) {
  return [...new Set(trips.map((t) => t.company))].sort((a, b) => a.localeCompare(b, 'tr'));
}

export function uniqStations(trips, key) {
  return [...new Set(trips.map((t) => t[key]))].sort((a, b) => a.localeCompare(b, 'tr'));
}
