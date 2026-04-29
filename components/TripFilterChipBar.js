'use client';

export const CHIP_IDS = ['dest', 'dates', 'pax', 'budget'];

export function chipLabel(id, meta) {
  if (id === 'dest') return meta.destination || 'Destinasyon';
  if (id === 'dates') {
    if (meta.datesChipText) return meta.datesChipText;
    if (meta.nights && meta.month) return `${meta.nights} gece ${meta.month}`;
    return 'Tarih';
  }
  if (id === 'pax') {
    if (meta.paxChipText) return meta.paxChipText;
    return 'Kişi sayısı';
  }
  if (id === 'budget') return meta.budget || 'Bütçe';
  return '';
}

/** Trip chip satırında gösterim: her kelimenin ilk harfi (tr-TR, i→İ) */
function capitalizeTurkishWord(word) {
  if (!word) return word;
  if (/^\d+$/.test(word)) return word;
  const m = word.match(/^(\d+)([a-zA-ZğüşöçıİĞÜŞÖÇı].*)$/u);
  if (m) {
    return m[1] + capitalizeTurkishWord(m[2]);
  }
  if (!/[a-zA-ZğüşöçıİĞÜŞÖÇı]/u.test(word)) return word;
  return (
    word.charAt(0).toLocaleUpperCase('tr-TR') +
    word.slice(1).toLocaleLowerCase('tr-TR')
  );
}

export function formatChipText(input) {
  if (input == null || input === '') return input;
  const str = String(input);
  return str
    .split(/(\s*·\s*)/)
    .map((segment) => {
      if (/^\s*·\s*$/.test(segment)) return segment;
      return segment
        .split(/\s+/)
        .filter(Boolean)
        .map(capitalizeTurkishWord)
        .join(' ');
    })
    .join('');
}

/**
 * Header ve plan dropdown içi: aynı ChipModal / notlar davranışı (üst state Header’da).
 * @param {'header'|'panel'} variant — header: nokta ayraçlı satır; panel: sarmalanmış chip satırı
 */
export default function TripFilterChipBar({
  variant = 'header',
  tripMetaForChips,
  openModal,
  setOpenModal,
  notesModalOpen,
  setNotesModalOpen,
  notes = [],
  stageChipId = null,
}) {
  const isPanel = variant === 'panel';

  const chipButtons = CHIP_IDS.map((chipId, i) => {
    const label = formatChipText(chipLabel(chipId, tripMetaForChips));
    const modalOpen = openModal?.id === chipId;
    const stageOn = stageChipId === chipId;
    const highlighted = modalOpen || stageOn;
    const btn = (
      <button
        type="button"
        key={chipId}
        style={{
          ...ts.chip,
          ...(highlighted ? ts.chipHi : ts.chipLo),
        }}
        onClick={() => {
          setNotesModalOpen(false);
          const lbl = formatChipText(chipLabel(chipId, tripMetaForChips));
          setOpenModal((c) => (c?.id === chipId ? null : { id: chipId, label: lbl }));
        }}
      >
        {label}
      </button>
    );
    if (isPanel) return btn;
    return (
      <span key={chipId} style={ts.chipRow}>
        {i > 0 ? <span style={ts.dot}>·</span> : null}
        {btn}
      </span>
    );
  });

  const notesLabel = formatChipText(notes.length ? `${notes.length} not` : 'Notlar');
  const notesButton = (
    <button
      type="button"
      style={{
        ...ts.chip,
        ...(notesModalOpen ? ts.chipHi : ts.chipLo),
      }}
      onClick={() => {
        setOpenModal(null);
        setNotesModalOpen((o) => !o);
      }}
    >
      {notesLabel}
    </button>
  );

  const notesBlock = isPanel ? (
    notesButton
  ) : (
    <span style={ts.chipRow}>
      <span style={ts.dot}>·</span>
      {notesButton}
    </span>
  );

  if (isPanel) {
    return (
      <div style={ts.panelWrap}>
        {chipButtons}
        {notesBlock}
      </div>
    );
  }

  return (
    <>
      {chipButtons}
      {notesBlock}
    </>
  );
}

const ts = {
  panelWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '8px',
    rowGap: '8px',
  },
  chipRow: {
    display: 'inline-flex',
    alignItems: 'center',
  },
  dot: {
    color: 'rgba(0,0,0,.25)',
    fontSize: '14px',
    padding: '0 2px',
    userSelect: 'none',
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '5px 10px',
    borderRadius: '999px',
    boxSizing: 'border-box',
    background: 'transparent',
    color: 'var(--text1)',
    fontSize: '13px',
    fontWeight: 600,
    fontFamily: 'var(--font-sans)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'border-color .15s, color .15s',
  },
  chipLo: {
    border: '1.5px solid rgba(0,0,0,.12)',
    color: 'var(--text2)',
    fontWeight: 500,
  },
  chipHi: {
    border: '1.5px solid var(--ta-ink)',
    color: 'var(--text1)',
    fontWeight: 600,
  },
};
