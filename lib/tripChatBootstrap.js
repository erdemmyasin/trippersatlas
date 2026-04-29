import { getTripWorkspace } from '@/lib/tripWorkspaceStore';

/**
 * Geziye bağlı yeni sohbet: modele giden ilk blok (kullanıcı mesajına önek).
 */
export function buildTripChatBootstrapBlock(trip, workspace) {
  const ws = workspace || getTripWorkspace(trip?.id);
  const tm = ws?.topBarData?.tripMeta || {};
  const name = String(trip?.name || ws?.topBarData?.planName || 'Gezi').trim();
  const dest = String(trip?.destination || tm.destination || '').trim() || '—';
  const dates = String(tm.datesChipText || '').trim();
  const pax = String(tm.paxChipText || '').trim();
  const budget = String(tm.budget || trip?.budget || '').trim();
  const lines = [
    '[ATLAS_GEZI_BAGLAMI]',
    `Gezi adı: ${name}`,
    `Destinasyon: ${dest}`,
  ];
  if (dates) lines.push(`Tarih: ${dates}`);
  if (pax) lines.push(`Kişi: ${pax}`);
  if (budget) lines.push(`Bütçe: ${budget}`);
  if (trip?.startDate && trip?.endDate) {
    lines.push(`Kayıtlı tarih aralığı: ${trip.startDate} → ${trip.endDate}`);
  }
  lines.push(
    'Yanıtlarken bu gezinin bağlamını dikkate al. Kullanıcı aşağıdaki soruyu gezi planlaması için soruyor.'
  );
  return lines.join('\n');
}
