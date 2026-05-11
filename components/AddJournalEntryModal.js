'use client';

import { useEffect, useRef, useState } from 'react';
import { Calendar, MapPin, Upload, X } from 'lucide-react';
import { addEntry, JOURNAL_CAPTION_MAX, updateEntry } from '@/lib/tripJournal';

/**
 * Trip Journal'a anı ekleme veya düzenleme modal'ı.
 *
 * @param {boolean} open
 * @param {() => void} onClose
 * @param {{ tripId: string, destination?: string, startDate?: string, endDate?: string }} trip
 * @param {object} [editingEntry] — verildiğinde modal düzenleme modunda açılır
 * @param {(entry) => void} [onSaved]
 */
export default function AddJournalEntryModal({ open, onClose, trip, editingEntry, onSaved }) {
  const tripId = trip?.id || trip?.tripId || editingEntry?.tripId || '';
  const isEditing = Boolean(editingEntry);
  const [previewUrl, setPreviewUrl] = useState('');
  const [mediaDataUrl, setMediaDataUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [capturedAt, setCapturedAt] = useState(() => defaultCapturedAt(trip));
  const [locationLabel, setLocationLabel] = useState(trip?.destination || '');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  // Modal açıldığında değerleri seed et; kapandığında temizle.
  // (Trip prop'u TripHubClient'te her render'da yeni inline object olduğu için
  //  `[open, trip]` dependency'si caption'ı sıfırlardı — sadece `[open]`'a bağla.)
  useEffect(() => {
    if (open) {
      if (editingEntry) {
        setPreviewUrl(editingEntry.mediaUrl || '');
        setMediaDataUrl(editingEntry.mediaUrl || '');
        setCaption(editingEntry.caption || '');
        setCapturedAt(editingEntry.capturedAt || defaultCapturedAt(trip));
        setLocationLabel(editingEntry.locationLabel || trip?.destination || '');
      } else {
        setPreviewUrl('');
        setMediaDataUrl('');
        setCaption('');
        setCapturedAt(defaultCapturedAt(trip));
        setLocationLabel(trip?.destination || '');
      }
    } else {
      setPreviewUrl('');
      setMediaDataUrl('');
      setCaption('');
      setBusy(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const trimmedCaption = caption.trim();
  const captionLen = trimmedCaption.length;
  // En az bir şey lazım: ya foto ya yazı; ikisi birden de olabilir.
  const hasContent = !!mediaDataUrl || trimmedCaption.length > 0;
  const canSave = !busy && !!tripId && hasContent && captionLen <= JOURNAL_CAPTION_MAX;

  function handleFile(file) {
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      window.alert('Sadece görsel dosyalar (jpg/png/webp) ekleyebilirsin.');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      window.alert('Dosya 4 MB\'dan büyük; küçült veya başka bir foto seç.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const v = String(reader.result || '');
      setMediaDataUrl(v);
      setPreviewUrl(v);
    };
    reader.readAsDataURL(file);
  }

  function handleSave() {
    if (!canSave) return;
    setBusy(true);
    const payload = {
      mediaType: mediaDataUrl ? 'photo' : 'note',
      mediaUrl: mediaDataUrl || '',
      caption: trimmedCaption,
      locationLabel: locationLabel.trim(),
      capturedAt,
    };
    const entry = isEditing
      ? updateEntry(tripId, editingEntry.id, payload)
      : addEntry(tripId, payload);
    if (entry) onSaved?.(entry);
    setBusy(false);
    onClose?.();
  }

  return (
    <div
      style={s.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-entry-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div style={s.card} onClick={(e) => e.stopPropagation()}>
        <button type="button" style={s.closeBtn} onClick={onClose} aria-label="Kapat">
          <X size={18} strokeWidth={2.2} color="var(--ta-ink)" />
        </button>

        <h2 id="add-entry-title" style={s.title}>{isEditing ? 'Anıyı düzenle' : 'Anı ekle'}</h2>
        <hr style={s.divider} />

        {previewUrl ? (
          <div style={{ ...s.preview, backgroundImage: `url(${previewUrl})` }}>
            <button
              type="button"
              style={s.previewClear}
              onClick={() => {
                setPreviewUrl('');
                setMediaDataUrl('');
                if (fileRef.current) fileRef.current.value = '';
              }}
            >
              Foto kaldır
            </button>
          </div>
        ) : (
          <button
            type="button"
            style={s.uploadTile}
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={18} strokeWidth={2} aria-hidden />
            <span>Foto ekle</span>
            <span style={s.uploadHint}>opsiyonel · jpg / png / webp · ≤ 4 MB</span>
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        <label style={s.label}>Anın</label>
        <textarea
          value={caption}
          maxLength={JOURNAL_CAPTION_MAX}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="O anki hissi, kokuyu, küçük detayı yaz…"
          rows={3}
          style={s.textarea}
        />
        <div style={s.counter}>{captionLen}/{JOURNAL_CAPTION_MAX} karakter</div>

        <div style={s.metaRow}>
          <label style={s.metaField}>
            <span style={s.metaLabel}>
              <Calendar size={14} strokeWidth={2.2} aria-hidden /> Tarih
            </span>
            <input
              type="date"
              value={capturedAt}
              onChange={(e) => setCapturedAt(e.target.value)}
              style={s.metaInput}
            />
          </label>
          <label style={s.metaField}>
            <span style={s.metaLabel}>
              <MapPin size={14} strokeWidth={2.2} aria-hidden /> Konum
            </span>
            <input
              type="text"
              value={locationLabel}
              maxLength={120}
              onChange={(e) => setLocationLabel(e.target.value)}
              placeholder="Antalya — Konyaaltı"
              style={s.metaInput}
            />
          </label>
        </div>

        <div style={s.footer}>
          <button type="button" style={s.cancelBtn} onClick={onClose} disabled={busy}>
            Vazgeç
          </button>
          <button
            type="button"
            style={{ ...s.saveBtn, ...(canSave ? {} : s.saveBtnDisabled) }}
            onClick={handleSave}
            disabled={!canSave}
          >
            {isEditing ? 'Değişiklikleri kaydet' : 'Anıyı kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}

function defaultCapturedAt(trip) {
  const today = new Date().toISOString().slice(0, 10);
  if (!trip) return today;
  const start = trip.startDate ? String(trip.startDate).slice(0, 10) : '';
  const end = trip.endDate ? String(trip.endDate).slice(0, 10) : '';
  if (!start) return today;
  if (today < start) return start;
  if (end && today > end) return end;
  return today;
}

const s = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,23,32,.45)',
    zIndex: 'var(--z-modal)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-4)',
    boxSizing: 'border-box',
  },
  card: {
    position: 'relative',
    width: 'min(560px, 100%)',
    maxHeight: 'min(92vh, 760px)',
    overflow: 'auto',
    background: '#fff',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-6)',
    boxShadow: '0 24px 80px rgba(0,0,0,.22)',
    fontFamily: 'var(--font-sans)',
    boxSizing: 'border-box',
  },
  closeBtn: {
    position: 'absolute',
    top: 'var(--space-4)',
    left: 'var(--space-4)',
    width: 36,
    height: 36,
    borderRadius: '50%',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(0,0,0,.10)',
    background: 'rgba(0,0,0,.04)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    margin: '0 0 var(--space-4)',
    paddingLeft: 56,
    paddingRight: 'var(--space-6)',
    fontSize: 'var(--text-xl)',
    fontWeight: 'var(--fw-bold)',
    color: 'var(--ta-ink)',
    textAlign: 'center',
    letterSpacing: '-0.01em',
  },
  divider: {
    border: 'none',
    borderTopWidth: 'var(--border-thin)',
    borderTopStyle: 'solid',
    borderTopColor: 'rgba(0,0,0,.08)',
    margin: 'var(--space-3) 0',
  },
  uploadTile: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    width: '100%',
    padding: 'var(--space-3) var(--space-4)',
    borderRadius: 'var(--radius-md)',
    borderWidth: 'var(--border-medium)',
    borderStyle: 'dashed',
    borderColor: 'rgba(0,0,0,.20)',
    background: 'var(--ta-muted-bg)',
    color: 'var(--ta-ink-muted)',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-md)',
    fontWeight: 'var(--fw-semibold)',
    cursor: 'pointer',
    marginBottom: 'var(--space-4)',
    boxSizing: 'border-box',
  },
  uploadHint: {
    fontWeight: 'var(--fw-regular)',
    fontSize: 'var(--text-sm)',
    color: 'var(--ta-ink-subtle)',
  },
  preview: {
    position: 'relative',
    width: '100%',
    aspectRatio: '4 / 3',
    borderRadius: 'var(--radius-md)',
    background: '#ececec',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    marginBottom: 'var(--space-4)',
  },
  previewClear: {
    position: 'absolute',
    top: 'var(--space-3)',
    right: 'var(--space-3)',
    padding: 'var(--space-1) var(--space-3)',
    borderRadius: 'var(--radius-pill)',
    border: 'none',
    background: 'rgba(255,255,255,.92)',
    color: 'var(--ta-ink)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--fw-bold)',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,.18)',
  },
  label: {
    display: 'block',
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--fw-bold)',
    color: 'var(--ta-ink)',
    marginBottom: 'var(--space-2)',
  },
  textarea: {
    width: '100%',
    boxSizing: 'border-box',
    padding: 'var(--space-3) var(--space-4)',
    borderRadius: 'var(--radius-md)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(0,0,0,.18)',
    background: '#fff',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-md)',
    color: 'var(--ta-ink)',
    outline: 'none',
    resize: 'vertical',
    minHeight: 80,
  },
  counter: {
    marginTop: 'var(--space-1)',
    textAlign: 'right',
    fontSize: 'var(--text-sm)',
    color: 'var(--ta-ink-subtle)',
    marginBottom: 'var(--space-4)',
  },
  metaRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--space-3)',
    marginBottom: 'var(--space-5)',
  },
  metaField: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
    minWidth: 0,
  },
  metaLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-1)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--fw-bold)',
    color: 'var(--ta-ink-muted)',
  },
  metaInput: {
    padding: 'var(--space-2) var(--space-3)',
    borderRadius: 'var(--radius-sm)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(0,0,0,.18)',
    background: '#fff',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-md)',
    color: 'var(--ta-ink)',
    outline: 'none',
    minWidth: 0,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 'var(--space-3)',
  },
  cancelBtn: {
    padding: 'var(--space-2) var(--space-4)',
    borderRadius: 'var(--radius-pill)',
    border: 'none',
    background: 'transparent',
    color: 'var(--ta-ink-muted)',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-md)',
    fontWeight: 'var(--fw-semibold)',
    cursor: 'pointer',
  },
  saveBtn: {
    padding: 'var(--space-3) var(--space-7)',
    borderRadius: 'var(--radius-pill)',
    border: 'none',
    background: 'var(--ta-ink)',
    color: '#fff',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-md)',
    fontWeight: 'var(--fw-bold)',
    cursor: 'pointer',
  },
  saveBtnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
};
