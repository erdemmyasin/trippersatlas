/**
 * Atlas header filtreleri → sohbet bağlamı (sürüm 1)
 *
 * Amaç: Üst bardaki destinasyon / tarih / kişi / bütçe (+ notlar) anlık görüntüsünü
 * modele iletmek. /chat akışında blok `planContext` + sistem prompt ile gider; kullanıcı
 * mesaj balonunda görünmez.
 *
 * Biçim:
 *   - Makine tarafı: [ATLAS_PLAN_CONTEXT schema="1"] … [/ATLAS_PLAN_CONTEXT] (YAML-benzeri satırlar)
 *
 * Not: Gezi detay (/trips/[id]) ekranı şimdilik bu akışı kullanmıyor; yalnızca
 * /chat sohbet modunda ChatPlanWorkspace’ten beslenir.
 */

import { TRIP_LS } from '@/lib/tripChipStorage';

export function readTripNotesFromLs() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TRIP_LS.notes);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x) => typeof x === 'string' && x.trim());
  } catch {
    return [];
  }
}

function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .trim();
}

/**
 * Sadece makine bloğu (sistem prompt / API bağlamı). Kullanıcıya gösterilmez.
 * @param {string[]|undefined} options.notes — tanımlıysa LS yerine bu dizi kullanılır
 */
export function buildAtlasPlanContextMachineBlock(tripMeta = {}, options = {}) {
  const notes = Array.isArray(options.notes) ? options.notes : readTripNotesFromLs();

  const fields = {
    destination: esc(tripMeta.destination),
    dates_chip: esc(tripMeta.datesChipText),
    nights: tripMeta.nights != null ? String(tripMeta.nights) : '',
    month: esc(tripMeta.month),
    travelers_count: tripMeta.travelers != null ? String(tripMeta.travelers) : '',
    pax_chip: esc(tripMeta.paxChipText),
    budget: esc(tripMeta.budget),
    travel_type: esc(tripMeta.travelType),
  };

  const lines = [
    '[ATLAS_PLAN_CONTEXT schema="1"]',
    ...Object.entries(fields).map(([k, v]) => `${k}: ${v}`),
  ];
  if (notes.length) {
    lines.push('notes:');
    for (const n of notes) {
      lines.push(`  - ${esc(n)}`);
    }
  }
  lines.push('[/ATLAS_PLAN_CONTEXT]');

  return lines.join('\n');
}

/**
 * tripMeta: Header ile uyumlu alanlar (destination, datesChipText, nights, month,
 * travelers, paxChipText, budget, travelType)
 * @deprecated Sohbette kullanıcıya görünmemesi için tercih: planContext.atlasTripMeta + sistem prompt.
 * Harici / test çağrıları için tam blok + talimat üretir.
 */
export function buildAtlasFilterUserMessage(tripMeta = {}, options = {}) {
  const machine = buildAtlasPlanContextMachineBlock(tripMeta, options);
  return `${machine}\n\nYukarıdaki kullanıcı tercihlerine uygun, uygulanabilir bir seyahat planı öner: özet güzergâh, konaklama önerisi tipi, ulaşım ve bütçe uyumu. Türkçe yanıt ver.`;
}

/**
 * @param {object} [options]
 * @param {string[]|undefined} [options.notes] — tanımlandıysa not sinyali yalnız bu diziyle ölçülür (kayıtlı sohbet filtresi).
 */
export function hasAtlasFilterSignal(tripMeta = {}, options = {}) {
  const { notes: notesOverride } = options;
  const d = String(tripMeta.destination || '').trim();
  const dates = String(tripMeta.datesChipText || '').trim();
  const pax = String(tripMeta.paxChipText || '').trim();
  const budget = String(tripMeta.budget || '').trim();
  const tt = String(tripMeta.travelType || '').trim();
  const n = Number(tripMeta.nights) || 0;
  if (d || dates || pax || budget || tt || n > 0) return true;
  if (notesOverride !== undefined) {
    return Array.isArray(notesOverride) && notesOverride.some((x) => String(x).trim());
  }
  return readTripNotesFromLs().length > 0;
}
