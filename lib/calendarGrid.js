/** İki ay takvimleri için ortak ISO / hücre üretimi */

export function isoFromYMD(y, mIdx, day) {
  return `${y}-${String(mIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function buildCalendarCells(year, mIdx) {
  const cells = [];
  const firstWd = new Date(year, mIdx, 1).getDay();
  let py = year;
  let pmIdx = mIdx - 1;
  if (pmIdx < 0) {
    pmIdx = 11;
    py--;
  }
  const prevDim = new Date(py, pmIdx + 1, 0).getDate();
  for (let i = 0; i < firstWd; i++) {
    const day = prevDim - firstWd + 1 + i;
    cells.push({ iso: isoFromYMD(py, pmIdx, day), label: day, ghost: true });
  }
  const dim = new Date(year, mIdx + 1, 0).getDate();
  for (let d = 1; d <= dim; d++) {
    cells.push({ iso: isoFromYMD(year, mIdx, d), label: d, ghost: false });
  }
  let ny = year;
  let nmIdx = mIdx + 1;
  let nd = 1;
  if (nmIdx > 11) {
    nmIdx = 0;
    ny++;
  }
  while (cells.length < 42) {
    const maxD = new Date(ny, nmIdx + 1, 0).getDate();
    cells.push({ iso: isoFromYMD(ny, nmIdx, nd), label: nd, ghost: true });
    nd++;
    if (nd > maxD) {
      nd = 1;
      nmIdx++;
      if (nmIdx > 11) {
        nmIdx = 0;
        ny++;
      }
    }
  }
  return cells.slice(0, 42);
}
