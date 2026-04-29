'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { X, Mic, CarFront, Palmtree, Luggage, Sparkles } from 'lucide-react';
import { getCurrentUser } from '@/lib/authStore';
import { createTrip, saveTrip } from '@/lib/tripStore';
import { defaultTripWorkspace, saveTripWorkspace } from '@/lib/tripWorkspaceStore';
import { seedTripChipsFromTrip } from '@/lib/tripChipStorage';
import { setLastUiContext } from '@/lib/chatStore';
import { trackEvent } from '@/lib/analytics';

const NewTripContext = createContext(null);

const MONTHS_SHORT_TR = [
  'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara',
];

const DEFAULT_TRAVELERS = {
  adults: 1,
  children: 0,
  seniors: 0,
  infants: 0,
  pets: 0,
};

function tripTitleFromDestination(dest) {
  const d = String(dest || '').trim();
  if (!d) return 'Yeni Gezi';
  const first = d.split(/\s*·\s*/)[0]?.trim() || d;
  const title = `${first} Gezisi`;
  return title.length > 48 ? `${title.slice(0, 45)}…` : title;
}

function buildTopTripMeta(destination, startIso, endIso) {
  const base = {
    destination: String(destination || '').trim(),
    nights: 0,
    month: '',
    datesChipText: '',
    travelers: 1,
    paxChipText: '1 yetişkin',
    budget: '',
    travelType: '',
  };
  if (!startIso || !endIso) return base;
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return base;
  const lo = start <= end ? start : end;
  const hi = start <= end ? end : start;
  const days = Math.round(Math.abs(hi.getTime() - lo.getTime()) / 86400000) + 1;
  base.nights = Math.max(0, days - 1);
  base.month = MONTHS_SHORT_TR[lo.getMonth()] || '';
  base.datesChipText = `${lo.getDate()} ${MONTHS_SHORT_TR[lo.getMonth()]} - ${hi.getDate()} ${MONTHS_SHORT_TR[hi.getMonth()]} · ${days} gün`;
  return base;
}

export function useNewTrip() {
  const ctx = useContext(NewTripContext);
  return ctx ?? { openNewTrip: () => {}, closeNewTrip: () => {} };
}

export default function NewTripProvider({ children }) {
  const [open, setOpen] = useState(false);
  const openNewTrip = useCallback(() => setOpen(true), []);
  const closeNewTrip = useCallback(() => setOpen(false), []);
  const value = useMemo(
    () => ({ openNewTrip, closeNewTrip }),
    [openNewTrip, closeNewTrip]
  );

  return (
    <NewTripContext.Provider value={value}>
      {children}
      <NewTripModal open={open} onClose={closeNewTrip} />
    </NewTripContext.Provider>
  );
}

function NewTripModal({ open, onClose }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('Misafir');
  const [destination, setDestination] = useState('');
  const [timing, setTiming] = useState('flex');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [preferences, setPreferences] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const u = getCurrentUser();
    setDisplayName(u?.displayName?.trim() || 'Misafir');
  }, [open]);

  useEffect(() => {
    if (open) return;
    setDestination('');
    setTiming('flex');
    setStartDate('');
    setEndDate('');
    setPreferences('');
    setSubmitting(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
    return undefined;
  }, [open]);

  const canSubmit = useMemo(() => {
    const destOk = destination.trim().length > 0;
    if (!destOk) return false;
    if (timing === 'dates') {
      if (!startDate || !endDate) return false;
      const a = new Date(startDate);
      const b = new Date(endDate);
      if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return false;
      return a.getTime() <= b.getTime();
    }
    return true;
  }, [destination, timing, startDate, endDate]);

  function handleCreate(e) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const dest = destination.trim();
      const notesArr = preferences.trim() ? [preferences.trim()] : [];
      const monthNow = new Date().toLocaleString('tr-TR', { month: 'long' });
      let days = 5;
      let month = monthNow;
      let startIso;
      let endIso;
      if (timing === 'dates') {
        startIso = startDate;
        endIso = endDate;
        const lo = new Date(startIso);
        const hi = new Date(endIso);
        const n = Math.round(Math.abs(hi - lo) / 86400000) + 1;
        days = Math.max(1, n);
        month = MONTHS_SHORT_TR[lo.getMonth()] || monthNow;
      }
      const t = createTrip({
        name: tripTitleFromDestination(dest),
        destination: dest,
        days,
        month,
        startDate: startIso,
        endDate: endIso,
        notes: notesArr,
        travelers: { ...DEFAULT_TRAVELERS },
      });
      saveTrip(t);
      const topTripMeta = buildTopTripMeta(dest, startIso, endIso);
      saveTripWorkspace(t.id, {
        ...defaultTripWorkspace(),
        topBarData: {
          planName: 'Yeni Seyahat Planı',
          tripMeta: topTripMeta,
        },
        messages: [],
      });
      seedTripChipsFromTrip(t);
      setLastUiContext('trip', String(t.id));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('tripsUpdated'));
      }
      trackEvent('plan.create', { source: 'trips.newModal' });
      onClose();
      router.push('/trips');
    } catch {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div style={s.portal} role="dialog" aria-modal="true" aria-labelledby="new-trip-title">
      <button type="button" style={s.backdrop} onClick={onClose} aria-label="Kapat" />
      <div style={s.dialogWrap}>
        <div style={s.card} onClick={(e) => e.stopPropagation()}>
          <button type="button" style={s.closeBtn} onClick={onClose} aria-label="Kapat">
            <X size={20} strokeWidth={2} color="var(--ta-ink)" />
          </button>

          <div style={s.shell}>
            <div style={s.left}>
              <div style={s.leftInner}>
                <div style={s.decoCard}>
                  <CarFront size={64} strokeWidth={1.4} color="rgba(47,63,82,.35)" style={{ marginBottom: 8 }} />
                  <div style={s.decoRow}>
                    <Palmtree size={26} strokeWidth={1.8} color="var(--ta-accent-deep)" />
                    <Luggage size={26} strokeWidth={1.8} color="var(--ta-accent)" />
                    <Sparkles size={24} strokeWidth={1.8} color="#7c6cf0" />
                  </div>
                  <p style={s.decoTag}>Atlas ile yolculuğa hazır</p>
                </div>
              </div>
            </div>

            <div style={s.right}>
              <form style={s.form} onSubmit={handleCreate} noValidate>
                <h1 id="new-trip-title" style={s.title}>
                  Nereye, {displayName}?
                </h1>

                <label style={s.label}>Destinasyon</label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Nereye gidiyorsun?"
                  maxLength={120}
                  style={s.input}
                  autoComplete="off"
                  autoFocus
                />

                <label style={s.label}>Zamanlama</label>
                <div style={s.timingRow}>
                  <button
                    type="button"
                    onClick={() => setTiming('flex')}
                    style={{ ...s.pill, ...(timing === 'flex' ? s.pillOn : s.pillOff) }}
                  >
                    Esnek
                  </button>
                  <button
                    type="button"
                    onClick={() => setTiming('dates')}
                    style={{ ...s.pill, ...(timing === 'dates' ? s.pillOn : s.pillOff) }}
                  >
                    Tarih seç
                  </button>
                </div>
                {timing === 'dates' ? (
                  <div style={s.dateRow}>
                    <div style={s.dateCol}>
                      <span style={s.dateLab}>Başlangıç</span>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        style={s.input}
                      />
                    </div>
                    <div style={s.dateCol}>
                      <span style={s.dateLab}>Bitiş</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        style={s.input}
                      />
                    </div>
                  </div>
                ) : null}

                <label style={s.label}>Gezi tercihleri</label>
                <div style={s.taWrap}>
                  <textarea
                    value={preferences}
                    onChange={(e) => setPreferences(e.target.value)}
                    placeholder="Şimdilik bildiklerini yaz — yol arkadaşları, bütçe, mutlaka yapılacaklar, tercihler"
                    maxLength={2000}
                    rows={5}
                    style={s.textarea}
                  />
                  <button type="button" style={s.micBtn} tabIndex={-1} aria-label="Sesli giriş (yakında)">
                    <Mic size={18} strokeWidth={2} color="var(--ta-ink-muted)" />
                  </button>
                </div>
                <div style={s.counter}>{preferences.length}/2000 karakter</div>

                <button
                  type="submit"
                  disabled={!canSubmit || submitting}
                  style={{
                    ...s.submit,
                    ...(!canSubmit || submitting ? s.submitDisabled : {}),
                  }}
                >
                  {submitting ? 'Oluşturuluyor…' : 'Oluştur'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  portal: {
    position: 'fixed',
    inset: 0,
    zIndex: 12000,
    pointerEvents: 'auto',
    fontFamily: 'var(--font-sans)',
  },
  backdrop: {
    position: 'absolute',
    inset: 0,
    border: 'none',
    padding: 0,
    margin: 0,
    background: 'rgba(15, 23, 32, 0.45)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    cursor: 'pointer',
  },
  dialogWrap: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left))',
    boxSizing: 'border-box',
    pointerEvents: 'none',
  },
  card: {
    position: 'relative',
    width: 'min(960px, calc(100vw - 24px))',
    maxHeight: 'min(92vh, 900px)',
    overflow: 'hidden',
    borderRadius: 22,
    background: '#fff',
    boxShadow: '0 24px 80px rgba(0,0,0,.22)',
    border: '1px solid rgba(0,0,0,.08)',
    pointerEvents: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 2,
    width: 40,
    height: 40,
    borderRadius: 999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,.95)',
    border: '1px solid rgba(0,0,0,.08)',
    cursor: 'pointer',
    boxShadow: '0 2px 10px rgba(0,0,0,.06)',
  },
  shell: {
    display: 'flex',
    flexWrap: 'wrap',
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
  },
  left: {
    flex: '1 1 260px',
    minWidth: 240,
    maxWidth: 400,
    background: 'linear-gradient(165deg, #c8e6ff 0%, #e8f4ff 45%, #dcecf8 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 24px',
    boxSizing: 'border-box',
  },
  leftInner: {
    width: '100%',
    maxWidth: 320,
  },
  decoCard: {
    background: 'rgba(255,255,255,.55)',
    borderRadius: 20,
    padding: '28px 22px',
    border: '1px solid rgba(255,255,255,.8)',
    boxShadow: '0 12px 40px rgba(47,63,82,.08)',
    textAlign: 'center',
  },
  decoRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginTop: 10,
  },
  decoTag: {
    margin: '14px 0 0',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--ta-ink-muted)',
  },
  right: {
    flex: '1 1 320px',
    minWidth: 'min(100%, 260px)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '40px 32px 36px',
    boxSizing: 'border-box',
  },
  form: {
    width: '100%',
    maxWidth: 460,
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  title: {
    margin: '0 0 22px',
    fontFamily: 'var(--font-serif)',
    fontWeight: 700,
    fontSize: 26,
    letterSpacing: '-0.02em',
    color: 'var(--ta-ink)',
    lineHeight: 1.2,
    paddingRight: 36,
  },
  label: {
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--ta-ink)',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '12px 14px',
    borderRadius: 12,
    border: '1px solid rgba(47,63,82,.2)',
    fontSize: 15,
    fontFamily: 'var(--font-sans)',
    outline: 'none',
    background: '#fff',
    color: 'var(--ta-ink)',
  },
  timingRow: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
  },
  pill: {
    padding: '9px 18px',
    borderRadius: 999,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    border: '1.5px solid rgba(47,63,82,.22)',
    background: '#fff',
    color: 'var(--ta-ink)',
  },
  pillOn: {
    borderColor: 'var(--ta-ink)',
    background: 'rgba(74,98,120,.08)',
  },
  pillOff: {
    opacity: 0.85,
  },
  dateRow: {
    display: 'flex',
    gap: 12,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  dateCol: {
    flex: '1 1 130px',
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  dateLab: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--ta-ink-muted)',
  },
  taWrap: {
    position: 'relative',
    marginTop: 0,
  },
  textarea: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '12px 40px 12px 14px',
    borderRadius: 12,
    border: '1px solid rgba(47,63,82,.2)',
    fontSize: 15,
    fontFamily: 'var(--font-sans)',
    outline: 'none',
    resize: 'vertical',
    minHeight: 120,
    lineHeight: 1.45,
    color: 'var(--ta-ink)',
    background: '#fff',
  },
  micBtn: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 34,
    height: 34,
    borderRadius: 10,
    border: 'none',
    background: 'rgba(0,0,0,.04)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'default',
  },
  counter: {
    fontSize: 12,
    color: 'var(--ta-ink-muted)',
    textAlign: 'right',
    marginTop: 6,
    marginBottom: 6,
  },
  submit: {
    marginTop: 18,
    width: '100%',
    padding: '14px 18px',
    borderRadius: 999,
    border: 'none',
    fontSize: 16,
    fontWeight: 700,
    fontFamily: 'var(--font-sans)',
    background: 'var(--ta-ink)',
    color: '#fff',
    cursor: 'pointer',
    transition: 'opacity .15s',
  },
  submitDisabled: {
    opacity: 0.45,
    cursor: 'not-allowed',
  },
};
