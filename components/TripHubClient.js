'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Sparkles, X } from 'lucide-react';
import AppSidebar from '@/components/AppSidebar';
import LeftPanel from '@/components/LeftPanel';
import TripFilterChipBar from '@/components/TripFilterChipBar';
import ChipModal from '@/components/ChipModal';
import ChatInput from '@/components/ChatInput';
import { findMergedTripById } from '@/lib/tripMerge';
import { getTripWorkspace, saveTripWorkspace } from '@/lib/tripWorkspaceStore';
import { saveTrip } from '@/lib/tripStore';
import {
  mergeTripMetaForChips,
  readTripMetaSnapshot,
  seedTripChipsFromTrip,
  TRIP_LS,
  notifyTripStorage,
} from '@/lib/tripChipStorage';
import { listChatsForTrip, getChat } from '@/lib/chatStore';
import { trackEvent } from '@/lib/analytics';
import { appendRegionalGeocodeContext } from '@/lib/taRegion';
import TripHubRightColumn from '@/components/TripHubRightColumn';
import TripJournal from '@/components/TripJournal';
import AddJournalEntryModal from '@/components/AddJournalEntryModal';

const EMPTY_BUDGET = { accommodation: 0, transport: 0, activities: 0, extras: 0 };

const TYPE_TO_CAT = {
  hotel: 'accommodation',
  villa: 'accommodation',
  clinic: 'accommodation',
  transfer: 'transport',
  car: 'transport',
  tour: 'activities',
  boat: 'activities',
  restaurant: 'extras',
};
const TYPE_TO_MODULE = {
  hotel: 'lodging',
  villa: 'lodging',
  clinic: 'lodging',
  transfer: 'transfer',
  car: 'transfer',
  tour: 'activities',
  boat: 'activities',
};

const INITIAL_TRIP_META = {
  destination: '',
  nights: 0,
  month: '',
  datesChipText: '',
  travelers: null,
  paxChipText: '',
  budget: '',
  travelType: '',
};

function readNotesFromStorage() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TRIP_LS.notes);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === 'string');
    }
  } catch {
    /* ignore */
  }
  return [];
}

function buildSmartInsight(tripMeta, tripName) {
  const dest = String(tripMeta.destination || '').trim() || 'Destinasyon';
  const title = String(tripName || '').trim() || 'Geziniz';
  return {
    title,
    body: `${dest} için güzel duraklar seçmiş görünüyorsun. Konaklama veya yapılacaklar listesini birlikte sıkılaştırmak ister misin?`,
    actions: [
      { label: 'Otel ara', q: `${dest} için uygun butik otel öner` },
      { label: 'Gezilecek yerler', q: `${dest} gezilecek yer ve müze önerileri` },
      { label: 'Yerel lezzet', q: `${dest} yöresel yemek ve restoran önerileri` },
    ],
  };
}

export default function TripHubClient({ tripId: rawTripId }) {
  const router = useRouter();
  const tripId = String(rawTripId || '').trim();
  const [tripMeta, setTripMeta] = useState(INITIAL_TRIP_META);
  const [titleDraft, setTitleDraft] = useState('');
  const [openModal, setOpenModal] = useState(null);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [journalAddOpen, setJournalAddOpen] = useState(false);
  const [journalEditingEntry, setJournalEditingEntry] = useState(null);
  const [notes, setNotes] = useState([]);
  const [input, setInput] = useState('');
  const [notesHydrated, setNotesHydrated] = useState(false);
  const [lsTick, setLsTick] = useState(0);
  const [chatMetas, setChatMetas] = useState([]);
  const [budget, setBudget] = useState(EMPTY_BUDGET);
  const [completedModules, setCompletedModules] = useState(() => new Set());
  const [bookedServices, setBookedServices] = useState(() => new Set());
  const [paidServices, setPaidServices] = useState(() => new Set());
  const [selectedListings, setSelectedListings] = useState({});
  const [geoCenter, setGeoCenter] = useState({ lat: 41.0082, lng: 28.9784 });
  const [planHydrated, setPlanHydrated] = useState(false);

  const reloadTrip = useCallback(() => {
    const t = findMergedTripById(tripId);
    const ws = getTripWorkspace(tripId);
    const tm = { ...INITIAL_TRIP_META, ...(ws.topBarData?.tripMeta || {}) };
    setTripMeta(tm);
    setTitleDraft(String(t?.name || ws.topBarData?.planName || 'Gezi'));
    const plan = ws.plan || {};
    setBudget({ ...EMPTY_BUDGET, ...(plan.budget || {}) });
    setCompletedModules(new Set(plan.completedModules || []));
    setBookedServices(new Set(plan.bookedServices || []));
    setPaidServices(new Set(plan.paidServices || []));
    setSelectedListings(
      plan.selectedListings && typeof plan.selectedListings === 'object'
        ? plan.selectedListings
        : {}
    );
    if (t) seedTripChipsFromTrip(t);
    setLsTick((x) => x + 1);
    // planHydrated state son set edilir — aynı render batch'inde state ile birlikte
    // commit olur, sonraki render hem hydrated=true hem populated state ile çalışır,
    // auto-save effect güvenle yazar (boş override yok).
    setPlanHydrated(true);
  }, [tripId]);

  useEffect(() => {
    if (!tripId || !planHydrated) return;
    saveTripWorkspace(tripId, {
      plan: {
        budget,
        completedModules: Array.from(completedModules),
        bookedServices: Array.from(bookedServices),
        paidServices: Array.from(paidServices),
        selectedListings,
      },
    });
  }, [tripId, planHydrated, budget, completedModules, bookedServices, paidServices, selectedListings]);

  useEffect(() => {
    reloadTrip();
  }, [reloadTrip]);

  useEffect(() => {
    const d = String(tripMeta?.destination || '').trim();
    if (!d || !process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY) return;
    let cancelled = false;
    fetch(`/api/places/geocode?address=${encodeURIComponent(appendRegionalGeocodeContext(d))}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled || j.lat == null || j.lng == null) return;
        setGeoCenter({ lat: j.lat, lng: j.lng });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [tripMeta.destination]);

  useEffect(() => {
    setNotes(readNotesFromStorage());
    setNotesHydrated(true);
  }, []);

  useEffect(() => {
    if (!notesHydrated) return;
    try {
      localStorage.setItem(TRIP_LS.notes, JSON.stringify(notes));
      notifyTripStorage();
    } catch {
      /* ignore */
    }
  }, [notes, notesHydrated]);

  useEffect(() => {
    function bump() {
      setChatMetas(listChatsForTrip(tripId));
    }
    bump();
    window.addEventListener('chatsUpdated', bump);
    return () => window.removeEventListener('chatsUpdated', bump);
  }, [tripId]);

  const fromLs = useMemo(() => readTripMetaSnapshot(), [lsTick, tripMeta]);
  const tripMetaForChips = useMemo(
    () => mergeTripMetaForChips(tripMeta, fromLs),
    [tripMeta, fromLs]
  );

  const applyTripMeta = useCallback((update) => {
    setTripMeta((prev) => {
      const next = typeof update === 'function' ? update(prev) : { ...prev, ...update };
      queueMicrotask(() => {
        saveTripWorkspace(tripId, { topBarData: { tripMeta: next } });
      });
      return next;
    });
  }, [tripId]);

  const handleChipModalSave = useCallback(
    (data) => {
      const id = openModal?.id;
      if (id === 'dest') {
        const names = (data.locs || [])
          .map((l) => String(l?.name ?? '').trim())
          .filter(Boolean);
        const destination = names.length ? names.join(' · ') : '';
        applyTripMeta({ destination });
        const t = findMergedTripById(tripId);
        if (t) saveTrip({ ...t, destination });
      } else if (id === 'dates') {
        applyTripMeta({
          nights: data.nights ?? 0,
          month: data.month ?? '',
          datesChipText: data.datesChipText ?? '',
        });
      } else if (id === 'pax') {
        const tr = data.travelers || {};
        const adults = Number(tr.adults) || 0;
        const children = Number(tr.children) || 0;
        const seniors = Number(tr.seniors) || 0;
        const total = adults + children + seniors;
        applyTripMeta({
          travelers: Math.max(1, total || 1),
          paxChipText: data.paxChipText || '',
        });
      } else if (id === 'budget') {
        applyTripMeta({ budget: data.budget ?? '' });
      }
      setOpenModal(null);
      setLsTick((x) => x + 1);
    },
    [openModal?.id, applyTripMeta, tripId]
  );

  const addNote = () => {
    if (input.trim()) {
      setNotes((prev) => [...prev, input.trim()]);
      setInput('');
    }
  };

  const removeNote = (i) => {
    setNotes((prev) => prev.filter((_, idx) => idx !== i));
  };

  const persistTitle = () => {
    const v = titleDraft.trim() || 'Gezi';
    setTitleDraft(v);
    const t = findMergedTripById(tripId);
    if (t) saveTrip({ ...t, name: v });
    saveTripWorkspace(tripId, { topBarData: { planName: v } });
    reloadTrip();
  };

  const insight = useMemo(
    () => buildSmartInsight(tripMetaForChips, titleDraft),
    [tripMetaForChips, titleDraft]
  );

  const mapHeadline = useMemo(() => {
    const d = String(tripMetaForChips.destination || '').trim();
    return d ? `Harita · ${d}` : 'Harita';
  }, [tripMetaForChips.destination]);

  const sohbeteBaslaMeta = useMemo(() => {
    const metas = listChatsForTrip(tripId);
    let hasAnyMessages = false;
    let emptyChatId = null;
    for (const m of metas) {
      const full = getChat(m.id);
      const n = full?.messages?.length ?? 0;
      if (n > 0) hasAnyMessages = true;
      else if (!emptyChatId) emptyChatId = m.id;
    }
    const show = Boolean(!hasAnyMessages && emptyChatId);
    return { show, chatId: emptyChatId };
  }, [tripId, chatMetas]);

  const startChatWithText = (text) => {
    const q = String(text || '').trim();
    if (!q) return;
    const enc = encodeURIComponent(q);
    router.push(`/chat?newChat=1&trip=${encodeURIComponent(tripId)}&q=${enc}`);
  };

  const handleListingDeselect = useCallback((listing) => {
    const { type, price = 0, name } = listing;
    const cat = TYPE_TO_CAT[type] ?? 'extras';
    const modId = TYPE_TO_MODULE[type];
    setBudget((prev) => ({ ...prev, [cat]: Math.max(0, prev[cat] - Number(price)) }));
    setSelectedListings((prev) => {
      const next = { ...prev };
      delete next[name];
      if (modId) {
        const still = Object.values(next).some((l) => TYPE_TO_MODULE[l.type] === modId);
        if (!still) {
          setCompletedModules((pm) => {
            const a = new Set(pm);
            a.delete(modId);
            return a;
          });
        }
      }
      return next;
    });
    trackEvent('listing.remove', { name, type, price: Number(price) || 0, source: 'trip.hub' });
  }, []);

  if (!tripId) {
    return (
      <div style={s.shell}>
        <p style={s.err}>Gezi bulunamadı.</p>
      </div>
    );
  }

  return (
    <div style={s.shell}>
      <AppSidebar activeId="trips" uiMode="trip" highlightTripId={tripId} />

      <div className="main-layout" style={s.main}>
        <header style={s.topBar}>
          <Link href="/trips" style={s.backLink}>
            <ChevronLeft size={18} strokeWidth={2.2} aria-hidden />
            Planlar
          </Link>
        </header>

        <div style={s.bodyRow}>
          <aside className="ta-panel" style={s.leftRail}>
            <div style={s.leftRailInner}>
              <LeftPanel
                hidePlanTitle
                hideSmartSuggestion
                planBadgeLabel={null}
                embedded={false}
                planName={titleDraft}
                completedModules={completedModules}
                bookedServices={bookedServices}
                paidServices={paidServices}
                onBookService={(id) =>
                  setBookedServices((prev) => new Set([...prev, id]))
                }
                onUnbookService={(id) => {
                  setBookedServices((prev) => {
                    const n = new Set(prev);
                    n.delete(id);
                    return n;
                  });
                  setPaidServices((prev) => {
                    const n = new Set(prev);
                    n.delete(id);
                    return n;
                  });
                }}
                onPayService={(id) =>
                  setPaidServices((prev) => new Set([...prev, id]))
                }
                onUnpayService={(id) =>
                  setPaidServices((prev) => {
                    const n = new Set(prev);
                    n.delete(id);
                    return n;
                  })
                }
                budget={budget}
                selectedListings={selectedListings}
                onDeselect={handleListingDeselect}
                onServiceClick={(svcId) => {
                  const route = {
                    lodging: '/stay',
                    flight: '/flights',
                    bus: '/bus',
                    car: '/cars',
                    activity: '/aktiviteler',
                  }[svcId];
                  if (!route) return;
                  router.push(`${route}?planId=${encodeURIComponent(tripId)}`);
                }}
                bottomSlot={
                  sohbeteBaslaMeta.show ? (
                    <Link
                      href={`/chat?chat=${encodeURIComponent(String(sohbeteBaslaMeta.chatId))}`}
                      style={s.sohbeteBaslaBtn}
                    >
                      Sohbete Başla
                    </Link>
                  ) : null
                }
              />
            </div>
          </aside>

          <div style={s.centerWrap}>
          <div style={s.scroll}>
          <div style={s.column}>
            <div style={s.titleRow}>
              <input
                type="text"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={persistTitle}
                maxLength={56}
                aria-label="Gezi adı"
                style={s.titleInput}
              />
              <button
                type="button"
                style={s.askAtlasBtn}
                onClick={() => {
                  const dest = String(tripMetaForChips?.destination || titleDraft || 'Bu seyahatim').trim();
                  const nights = Number(tripMetaForChips?.nights) || 0;
                  const lst = Object.values(selectedListings || {});
                  const svcLines = lst
                    .slice(0, 5)
                    .map((l) => `- ${l.name}${l.price ? ` (₺${Number(l.price).toLocaleString('tr-TR')})` : ''}`)
                    .join('\n');
                  const parts = [`${dest}${nights > 0 ? ` (${nights} gece)` : ''} için planlama yardımı istiyorum.`];
                  if (svcLines) {
                    parts.push(`\nMevcut seçimlerim:\n${svcLines}`);
                  }
                  parts.push('\nNe önerirsin? Eksik kalanları birlikte tamamlayalım.');
                  startChatWithText(parts.join('\n'));
                }}
                aria-label="Atlas'a bu planı sor"
              >
                <Sparkles size={14} strokeWidth={2.4} color="var(--ta-accent)" aria-hidden />
                Atlas'a bu planı sor
              </button>
            </div>

            <div style={s.chipWrap}>
              <TripFilterChipBar
                variant="panel"
                tripMetaForChips={tripMetaForChips}
                openModal={openModal}
                setOpenModal={setOpenModal}
                notesModalOpen={notesModalOpen}
                setNotesModalOpen={setNotesModalOpen}
                notes={notes}
                stageChipId={null}
              />
            </div>

            <div style={s.smartCard}>
              <div style={s.smartHead}>
                <span style={s.smartIcon} aria-hidden>
                  <Sparkles size={18} strokeWidth={2.2} color="#fff" />
                </span>
                <p style={s.smartBody}>{insight.body}</p>
              </div>
              <div style={s.smartActions}>
                {insight.actions.map((a) => (
                  <button
                    key={a.label}
                    type="button"
                    style={s.smartPill}
                    onClick={() => startChatWithText(a.q)}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={s.composerCard}>
              <p style={s.composerHint}>
                Mesajınız yeni bir Atlas sohbeti açar; gezi bağlamı otomatik eklenir.
              </p>
              <ChatInput
                onSend={startChatWithText}
                disabled={false}
                submitLabel="Sohbet başlat"
                showHint={false}
                placeholder="Atlas'a sorunuzu yazın…"
              />
            </div>

            <div style={s.chatsHead}>
              <span style={s.chatsTitle}>Sohbetler</span>
              <span style={s.chatsCount}>{chatMetas.length}</span>
            </div>
            <div style={s.chatList}>
              {chatMetas.length === 0 ? (
                <p style={s.chatEmpty}>
                  Bu planla ilgili henüz sohbet başlatmadınız.
                </p>
              ) : (
                chatMetas.map((c) => (
                  <Link
                    key={c.id}
                    href={`/chat?chat=${encodeURIComponent(String(c.id))}`}
                    style={s.chatRow}
                  >
                    <div style={s.chatRowText}>
                      <span style={s.chatRowTitle}>{c.title || 'Başlıksız'}</span>
                      <span style={s.chatRowDate}>
                        {new Date(c.updatedAt || c.createdAt).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <ChevronRight size={18} color="var(--ta-ink-muted)" aria-hidden />
                  </Link>
                ))
              )}
            </div>

            <TripJournal
              tripId={tripId}
              tripName={titleDraft}
              onAdd={() => setJournalAddOpen(true)}
              onEditEntry={(entry) => setJournalEditingEntry(entry)}
            />

            <AddJournalEntryModal
              open={journalAddOpen || Boolean(journalEditingEntry)}
              onClose={() => {
                setJournalAddOpen(false);
                setJournalEditingEntry(null);
              }}
              trip={{
                id: tripId,
                destination: tripMeta?.destination || '',
                startDate: tripMeta?.startDate || '',
                endDate: tripMeta?.endDate || '',
              }}
              editingEntry={journalEditingEntry}
            />
          </div>
          </div>
          </div>

          <aside className="ta-panel" style={s.rightRail}>
            <div style={s.rightRailInner}>
              <TripHubRightColumn
                geoCenter={geoCenter}
                mapHeadline={mapHeadline}
                mapSubline=""
              />
            </div>
          </aside>
        </div>
      </div>

      {notesModalOpen && (
        <>
          <div style={nm.overlay} onClick={() => setNotesModalOpen(false)} aria-hidden />
          <div
            style={nm.panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="trip-notes-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              style={nm.closeTop}
              onClick={() => setNotesModalOpen(false)}
              aria-label="Kapat"
            >
              <X size={20} strokeWidth={2} color="var(--ta-ink-subtle)" />
            </button>
            <h2 id="trip-notes-title" style={nm.title}>
              Seyahat Tercihleri
            </h2>
            <div style={nm.inputBox}>
              <textarea
                style={nm.textarea}
                placeholder="Tercih ekle..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    addNote();
                  }
                }}
                rows={3}
              />
              <div style={nm.inputFooter}>
                <button type="button" style={nm.cancelBtn} onClick={() => setInput('')}>
                  İptal
                </button>
                <button type="button" style={nm.addBtn} onClick={addNote} aria-label="Not ekle">
                  +
                </button>
              </div>
            </div>
            <div style={nm.separator} />
            <div style={nm.list}>
              {notes.map((text, idx) => (
                <div key={`${idx}-${text.slice(0, 24)}`} style={nm.noteRow}>
                  <span style={nm.noteText}>{text}</span>
                  <button
                    type="button"
                    style={nm.noteRemove}
                    onClick={() => removeNote(idx)}
                    aria-label="Notu sil"
                  >
                    <X size={16} strokeWidth={2} color="var(--ta-ink-subtle)" />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" style={nm.doneBtn} onClick={() => setNotesModalOpen(false)}>
              Tamam
            </button>
          </div>
        </>
      )}

      {openModal && (
        <ChipModal
          chip={openModal}
          destInitialSummary={tripMetaForChips.destination}
          onClose={() => setOpenModal(null)}
          onSave={handleChipModalSave}
          onOpenNotes={() => {
            setOpenModal(null);
            setNotesModalOpen(true);
          }}
        />
      )}
    </div>
  );
}

const nm = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,.3)',
    zIndex: 'calc(var(--z-modal) - 1)',
  },
  panel: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 480,
    maxWidth: '90vw',
    boxSizing: 'border-box',
    background: '#fff',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-6)',
    paddingTop: 'var(--space-5)',
    boxShadow: '0 8px 32px rgba(0,0,0,.16)',
    zIndex: 'var(--z-modal)',
    fontFamily: 'var(--font-sans)',
  },
  closeTop: {
    position: 'absolute',
    top: 'var(--space-4)',
    right: 'var(--space-4)',
    width: 36,
    height: 36,
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  title: {
    margin: 0,
    paddingRight: 'var(--space-8)',
    paddingBottom: 'var(--space-4)',
    fontSize: 'var(--text-xl)',
    fontWeight: 'var(--fw-extrabold)',
    color: 'var(--ta-ink)',
    letterSpacing: '-0.02em',
  },
  inputBox: {
    background: 'var(--ta-muted-bg)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-3)',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    boxSizing: 'border-box',
    minHeight: 72,
    border: 'none',
    background: 'transparent',
    resize: 'vertical',
    fontSize: 'var(--text-md)',
    fontFamily: 'var(--font-sans)',
    color: 'var(--ta-ink)',
    outline: 'none',
    lineHeight: 1.45,
  },
  inputFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 'var(--space-3)',
  },
  cancelBtn: {
    border: 'none',
    background: 'transparent',
    fontSize: 'var(--text-base)',
    color: 'var(--ta-ink-subtle)',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    padding: 'var(--space-1) 0',
    marginRight: 'var(--space-2)',
  },
  addBtn: {
    width: 'var(--space-7)',
    height: 'var(--space-7)',
    borderRadius: '50%',
    border: 'none',
    background: 'var(--ta-ink)',
    color: '#fff',
    fontSize: 'var(--text-xl)',
    lineHeight: 1,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    fontWeight: 'var(--fw-regular)',
  },
  separator: {
    border: 'none',
    borderTopWidth: 'var(--border-thin)',
    borderTopStyle: 'solid',
    borderTopColor: 'rgba(0,0,0,.06)',
    margin: 'var(--space-4) 0 0',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 'min(280px, 40vh)',
    overflowY: 'auto',
    marginBottom: 'var(--space-4)',
  },
  noteRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--space-3)',
    borderBottomWidth: 'var(--border-thin)',
    borderBottomStyle: 'solid',
    borderBottomColor: 'rgba(0,0,0,.06)',
    padding: 'var(--space-3) 0',
    minWidth: 0,
  },
  noteText: {
    flex: 1,
    minWidth: 0,
    fontSize: 'var(--text-md)',
    color: 'var(--ta-ink)',
    lineHeight: 1.45,
    wordBreak: 'break-word',
  },
  noteRemove: {
    flexShrink: 0,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    padding: 'var(--space-1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--radius-xs)',
  },
  doneBtn: {
    width: '100%',
    height: 48,
    borderRadius: 'var(--radius-pill)',
    border: 'none',
    background: 'var(--ta-ink)',
    color: '#fff',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--fw-bold)',
    fontSize: 'var(--text-lg)',
    cursor: 'pointer',
  },
};

const s = {
  shell: {
    display: 'flex',
    height: '100%',
    minHeight: 0,
    overflow: 'hidden',
    background: 'var(--bg)',
  },
  main: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    /* Sol flyout menü ile gezi alanı arasında nefes */
    marginLeft: 'var(--space-3)',
    paddingTop: 'var(--space-2)',
    paddingRight: 'var(--space-2)',
    boxSizing: 'border-box',
  },
  bodyRow: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
    gap: 'var(--space-3)',
    marginTop: 'var(--space-3)',
    paddingLeft: 'var(--space-px)',
    paddingRight: 'var(--space-px)',
    boxSizing: 'border-box',
  },
  leftRail: {
    width: 252,
    flexShrink: 0,
    minHeight: 0,
    borderRadius: 'var(--radius-md)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'var(--ta-border)',
    background: 'rgba(255,255,255,.78)',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  leftRailInner: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    padding: 'var(--space-2) var(--space-2) var(--space-3)',
    boxSizing: 'border-box',
  },
  centerWrap: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  rightRail: {
    width: 312,
    flexShrink: 0,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    overflow: 'hidden',
    borderRadius: 'var(--radius-md)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'var(--ta-border)',
    background: 'rgba(255,255,255,.72)',
  },
  rightRailInner: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    padding: 'var(--space-2) var(--space-2) var(--space-3)',
    boxSizing: 'border-box',
    overflowY: 'auto',
    overflowX: 'hidden',
    WebkitOverflowScrolling: 'touch',
  },
  topBar: {
    flexShrink: 0,
    padding: 'var(--space-3) var(--space-5)',
    borderBottomWidth: 'var(--border-thin)',
    borderBottomStyle: 'solid',
    borderBottomColor: 'var(--ta-border)',
    background: 'var(--ta-elevated)',
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-md)',
    fontWeight: 'var(--fw-semibold)',
    color: 'var(--ta-accent-deep)',
    textDecoration: 'none',
  },
  scroll: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  column: {
    maxWidth: 520,
    width: '100%',
    margin: 0,
    marginRight: 'auto',
    padding: 'var(--space-5) var(--space-3) var(--space-8) var(--space-1)',
    boxSizing: 'border-box',
  },
  titleInput: {
    flex: 1,
    minWidth: 0,
    border: 'none',
    background: 'transparent',
    fontFamily: 'var(--font-serif)',
    fontWeight: 'var(--fw-extrabold)',
    fontSize: 'var(--text-3xl)',
    lineHeight: 'var(--text-3xl-lh)',
    color: 'var(--ta-ink)',
    outline: 'none',
    boxSizing: 'border-box',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    marginBottom: 'var(--space-4)',
  },
  askAtlasBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--fw-bold)',
    letterSpacing: '0.01em',
    color: 'var(--ta-accent)',
    background: 'rgba(31,77,92,0.06)',
    borderRadius: 'var(--radius-pill)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(31,77,92,0.32)',
    cursor: 'pointer',
    flexShrink: 0,
    whiteSpace: 'nowrap',
    transition: 'background var(--duration-fast) var(--ease-out), border-color var(--duration-fast) var(--ease-out)',
  },
  chipWrap: {
    marginBottom: 'var(--space-5)',
  },
  smartCard: {
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'var(--ta-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-5)',
    background: 'rgba(255,255,255,.85)',
    marginBottom: 'var(--space-5)',
  },
  smartHead: {
    display: 'flex',
    gap: 'var(--space-3)',
    alignItems: 'flex-start',
  },
  smartIcon: {
    flexShrink: 0,
    width: 'var(--space-8)',
    height: 'var(--space-8)',
    borderRadius: '50%',
    background: 'var(--ta-ink)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smartBody: {
    margin: 0,
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-lg)',
    fontWeight: 'var(--fw-semibold)',
    lineHeight: 'var(--text-lg-lh)',
    color: 'var(--ta-ink-2)',
  },
  smartActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--space-2)',
    marginTop: 'var(--space-3)',
  },
  smartPill: {
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(0,0,0,.1)',
    background: 'rgba(31,77,92,.08)',
    color: 'var(--ta-accent-deep)',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--fw-semibold)',
    padding: 'var(--space-2) var(--space-4)',
    borderRadius: 'var(--radius-pill)',
    cursor: 'pointer',
  },
  composerCard: {
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'var(--ta-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-3)',
    background: 'var(--ta-elevated)',
    marginBottom: 'var(--space-7)',
  },
  composerHint: {
    margin: '0 0 var(--space-3)',
    fontSize: 'var(--text-sm)',
    color: 'var(--muted)',
    fontFamily: 'var(--font-sans)',
    lineHeight: 'var(--text-sm-lh)',
  },
  chatsHead: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    marginBottom: 'var(--space-3)',
  },
  chatsTitle: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--fw-bold)',
    color: 'var(--ta-ink)',
  },
  chatsCount: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--fw-semibold)',
    color: 'var(--muted)',
  },
  chatList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
  },
  chatEmpty: {
    fontSize: 'var(--text-base)',
    color: 'var(--muted)',
    fontFamily: 'var(--font-sans)',
    lineHeight: 1.5,
    margin: 0,
  },
  sohbeteBaslaBtn: {
    display: 'block',
    width: '100%',
    boxSizing: 'border-box',
    textAlign: 'center',
    padding: 'var(--space-3) var(--space-4)',
    borderRadius: 'var(--radius-md)',
    background:
      'linear-gradient(135deg, var(--ta-night-a), var(--ta-night-b) 55%, var(--ta-accent))',
    color: '#fff',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--fw-bold)',
    fontSize: 'var(--text-md)',
    textDecoration: 'none',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(15, 23, 32, 0.12)',
  },
  tripEmptyChatLink: {
    display: 'inline-block',
    marginTop: 'var(--space-3)',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--fw-semibold)',
    color: 'var(--ta-accent-deep)',
  },
  chatRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--space-3)',
    padding: 'var(--space-3) var(--space-4)',
    borderRadius: 'var(--radius-md)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'var(--ta-border)',
    background: 'rgba(255,255,255,.9)',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'background var(--duration-base) var(--ease-out)',
  },
  chatRowText: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
    minWidth: 0,
  },
  chatRowTitle: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-lg)',
    fontWeight: 'var(--fw-bold)',
    color: 'var(--ta-ink)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  chatRowDate: {
    fontSize: 'var(--text-sm)',
    color: 'var(--muted)',
    fontFamily: 'var(--font-sans)',
  },
  err: { padding: 'var(--space-6)', fontFamily: 'var(--font-sans)' },
};
