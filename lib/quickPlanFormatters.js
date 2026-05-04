export function formatShortRangeTR(start, end) {
  const opts = { day: 'numeric', month: 'short' };
  const a = `${new Date(`${start}T12:00:00`).toLocaleDateString('tr-TR', opts)}`;
  const b = `${new Date(`${end}T12:00:00`).toLocaleDateString('tr-TR', opts)}`;
  return `${a} – ${b}`;
}

export function fmtCalHeaderPart(iso) {
  if (!iso) return '—';
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatSingleDateTR(iso) {
  if (!iso) return '—';
  return new Date(`${iso}T12:00:00`).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
  });
}
