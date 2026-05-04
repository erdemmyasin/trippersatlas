/** @param {HTMLElement | null} el */
export function popoverCoords(el, popW = 340) {
  if (!el) return { top: 0, left: 10 };
  const r = el.getBoundingClientRect();
  const margin = 10;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 400;
  const w = Math.min(popW, vw - 2 * margin);
  let left = r.left;
  if (left + w > vw - margin) left = Math.max(margin, vw - margin - w);
  return { top: r.bottom + margin, left };
}

/** @param {HTMLElement | null} el */
export function datePanelCoords(el, preferredW = 504) {
  if (!el) return { top: 0, left: 10 };
  const r = el.getBoundingClientRect();
  const margin = 10;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 400;
  const w = Math.min(preferredW, vw - 2 * margin);
  let left = r.left;
  if (left + w > vw - margin) left = Math.max(margin, vw - margin - w);
  return { top: r.bottom + margin, left, width: w };
}
