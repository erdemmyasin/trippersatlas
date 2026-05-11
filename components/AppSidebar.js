'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MessageCircle, Briefcase, Bookmark, ThumbsUp,
  Compass, Sparkles, Search, ChevronRight, ChevronLeft, PenLine, Map,
  MoreHorizontal, Pencil, Trash2, X, Building2, Plane, CarFront, Bus, MapPinned, Ticket, Zap, Luggage,
} from 'lucide-react';
import AtlasLogo from '@/components/AtlasLogo';
import NavLocaleCurrency from '@/components/NavLocaleCurrency';
import SidebarAccount from '@/components/SidebarAccount';
import { useNewTrip } from '@/components/NewTripProvider';
import { ta } from '@/lib/brandStyles';
import { listChatMetas, saveChat, deleteChat as deleteStoredChat } from '@/lib/chatStore';

function listActiveChatMetas() {
  return listChatMetas().filter((c) => !c.archived);
}
import { getTrips, saveTrip, deleteTrip as deleteStoredTrip } from '@/lib/tripStore';
import { TRIPS_HEADER_KEY, loadMergedTrips } from '@/lib/tripMerge';
import { deleteTripWorkspace } from '@/lib/tripWorkspaceStore';
const TA_ACTIVE_TRIP_ID = 'ta_active_trip_id';

function updateTripInBothStorages(tripId, updates) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(TRIPS_HEADER_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        const idx = arr.findIndex((t) => String(t.id) === String(tripId));
        if (idx >= 0) {
          arr[idx] = { ...arr[idx], ...updates };
          localStorage.setItem(TRIPS_HEADER_KEY, JSON.stringify(arr));
        }
      }
    }
  } catch {
    throw new Error('trip_rename_header');
  }
  const trips = getTrips();
  const storeIdx = trips.findIndex((t) => String(t.id) === String(tripId));
  if (storeIdx >= 0) {
    saveTrip({ ...trips[storeIdx], ...updates });
    return;
  }
  try {
    const raw2 = localStorage.getItem(TRIPS_HEADER_KEY);
    if (!raw2) return;
    const arr2 = JSON.parse(raw2);
    if (!Array.isArray(arr2)) return;
    const t = arr2.find((x) => String(x.id) === String(tripId));
    if (t) saveTrip({ ...t });
  } catch {
    throw new Error('trip_rename_mirror');
  }
}

function deleteTripFromBothStorages(tripId) {
  if (typeof window === 'undefined') return;
  deleteStoredTrip(tripId);
  try {
    deleteTripWorkspace(tripId);
  } catch {
    /* ignore */
  }
  try {
    const raw = localStorage.getItem(TRIPS_HEADER_KEY);
    if (!raw) return;
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return;
    const next = arr.filter((t) => String(t.id) !== String(tripId));
    localStorage.setItem(TRIPS_HEADER_KEY, JSON.stringify(next));
  } catch {
    throw new Error('trip_delete_header');
  }
}

function QuickPlanNavIcon({ size = 20, color = ta.inkMuted, strokeWidth = 2 }) {
  return (
    <Zap
      size={size}
      strokeWidth={strokeWidth}
      color={color}
      aria-hidden
      style={{ flexShrink: 0 }}
    />
  );
}

const NAV_ITEMS = [
  { id: 'chats',   Icon: MessageCircle, label: 'Sohbetler',     href: '/chat',    hasPanel: true },
  { id: 'trips',   Icon: Briefcase,     label: 'Geziler',       href: '/trips',   hasPanel: false },
  { id: 'quickPlan', Icon: QuickPlanNavIcon, label: 'Hızlı Plan', href: '/chat', hasPanel: true },
  { id: 'saved',   Icon: Bookmark,      label: 'Kaydedilenler', href: '/saved',   hasPanel: false },
  { id: 'likes',   Icon: ThumbsUp,      label: 'Beğeniler',     href: '/likes',   hasPanel: false },
  { id: 'explore', Icon: Compass,       label: 'Keşfet',        href: '/explore', hasPanel: false },
  { id: 'inspire', Icon: Sparkles,      label: 'İlham Ol',      href: '/inspire', hasPanel: false },
];

const EXP_KEY = 'ta_sidebar_expanded';

export default function AppSidebar({
  activeId = 'chats',
  uiMode = 'chat',
  highlightChatId = null,
  highlightTripId = null,
}) {
  const pathname = usePathname();
  const { openNewTrip } = useNewTrip();
  /** /chat: ana içerik (header + sohbet) üstte kalmaması için panel + dim yükseltilir */
  const isChatPath = pathname === '/chat';
  const [expanded, setExpanded] = useState(false);
  const [panel, setPanel]       = useState(null);
  const [chatCount, setChatCount] = useState(0);
  const [chats, setChats]       = useState([]);
  const [trips, setTrips]       = useState([]);
  const [hovered, setHovered]   = useState(null);
  const [logoHover, setLogoHover] = useState(false);
  const [search, setSearch]     = useState('');
  const [ctxMenu, setCtxMenu]   = useState(null);
  const [inlineEdit, setInlineEdit] = useState(null);
  const [editVal, setEditVal]   = useState('');
  const [tripDeleteModal, setTripDeleteModal] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [exitingTripIds, setExitingTripIds] = useState(() => new Set());
  const editRef = useRef(null);
  const commitLockRef = useRef(false);

  const panelStackBoost = isChatPath && Boolean(panel);
  const zPanelDim = panelStackBoost ? 250 : 28;
  /** Flyout her zaman ctx scrim’den üstte olmalı; aksi halde /chat’te Sil menüsü tıklanmıyor */
  const zPanelFlyout = panelStackBoost ? (ctxMenu ? 270 : 260) : ctxMenu ? 44 : 30;
  const zCtxScrim = ctxMenu ? (panelStackBoost ? 265 : 38) : 0;

  useEffect(() => {
    try { if (localStorage.getItem(EXP_KEY) === 'true') setExpanded(true); } catch {}
    setChatCount(listActiveChatMetas().length);
  }, []);

  function refreshData() {
    setChats(listActiveChatMetas());
    setTrips(loadMergedTrips());
    setChatCount(listActiveChatMetas().length);
  }

  useEffect(() => {
    function onTripsUpdated() {
      refreshData();
    }
    function onChatsUpdated() {
      refreshData();
    }
    window.addEventListener('tripsUpdated', onTripsUpdated);
    window.addEventListener('chatsUpdated', onChatsUpdated);
    return () => {
      window.removeEventListener('tripsUpdated', onTripsUpdated);
      window.removeEventListener('chatsUpdated', onChatsUpdated);
    };
  }, []);

  useEffect(() => {
    if (panel === 'chats') { refreshData(); setSearch(''); }
  }, [panel]);

  useEffect(() => {
    if (inlineEdit && editRef.current) {
      editRef.current.focus();
      requestAnimationFrame(() => {
        try {
          editRef.current?.select?.();
        } catch {
          /* ignore */
        }
      });
    }
  }, [inlineEdit]);

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 3500);
    return () => clearTimeout(t);
  }, [toastMsg]);

  useEffect(() => {
    function onKey(e) {
      if (e.key !== 'Escape') return;
      if (tripDeleteModal) {
        setTripDeleteModal(null);
        return;
      }
      if (panel) {
        setPanel(null);
        setCtxMenu(null);
        return;
      }
      if (inlineEdit) {
        setInlineEdit(null);
        setEditVal('');
        return;
      }
      setCtxMenu(null);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [tripDeleteModal, inlineEdit, panel]);

  function toggleExpand() {
    setExpanded(v => {
      const next = !v;
      try { localStorage.setItem(EXP_KEY, String(next)); } catch {}
      return next;
    });
  }

  function handleNavClick(item, e) {
    if (item.hasPanel) {
      e.preventDefault();
      setCtxMenu(null);
      setPanel((p) => (p === item.id ? null : item.id));
      return;
    }
    setPanel(null);
    setCtxMenu(null);
  }

  function openQuickPlanCategory(cat) {
    setCtxMenu(null);
    setPanel(null);
    if (cat === 'tour') {
      window.location.href = '/turlar';
      return;
    }
    if (cat === 'activities') {
      window.location.href = '/aktiviteler';
      return;
    }
    if (cat === 'flight') {
      window.location.href = '/flights';
      return;
    }
    if (cat === 'stay') {
      window.location.href = '/stay';
      return;
    }
    if (cat === 'car') {
      window.location.href = '/cars';
      return;
    }
    if (cat === 'bus') {
      window.location.href = '/bus';
      return;
    }
    if (pathname !== '/chat') {
      window.location.href = `/chat?quickPlan=${cat}`;
      return;
    }
    window.dispatchEvent(new CustomEvent('taQuickPlan', { detail: { category: cat } }));
  }

  function showToast(msg) {
    setToastMsg(msg);
  }

  /* ── Chat actions ── */
  function startRenameChat(chat) {
    setCtxMenu(null);
    setInlineEdit({ type: 'chat', id: chat.id, original: chat.title || '' });
    setEditVal(chat.title || '');
  }
  function commitRenameChat(chat) {
    if (commitLockRef.current) return;
    commitLockRef.current = true;
    try {
      const trimmed = editVal.trim() || 'Başlıksız';
      try {
        saveChat({ ...chat, title: trimmed });
      } catch {
        showToast('Kaydedilemedi');
        return;
      }
      setInlineEdit(null);
      setEditVal('');
      refreshData();
    } finally {
      commitLockRef.current = false;
    }
  }
  function cancelRenameChat() {
    setInlineEdit(null);
    setEditVal('');
  }
  function handleDeleteChat(id) {
    setCtxMenu(null);
    if (!confirm('Bu sohbeti silmek istediğinize emin misiniz?')) return;
    deleteStoredChat(id);
    refreshData();
  }

  /* ── Trip actions ── */
  function startRenameTrip(trip) {
    setCtxMenu(null);
    setInlineEdit({ type: 'trip', id: trip.id, original: trip.name || '' });
    setEditVal(trip.name || '');
  }
  function commitRenameTrip(trip) {
    if (commitLockRef.current) return;
    commitLockRef.current = true;
    try {
      const fromState =
        inlineEdit?.type === 'trip' && String(inlineEdit.id) === String(trip.id)
          ? inlineEdit.original
          : trip.name || '';
      const prevName = fromState || trip.name || '';
      const trimmed = editVal.trim();
      const nextName = trimmed || prevName;
      try {
        updateTripInBothStorages(trip.id, { name: nextName });
      } catch {
        showToast('Kaydedilemedi');
        return;
      }
      setCtxMenu(null);
      setInlineEdit(null);
      setEditVal('');
      refreshData();
      try {
        window.dispatchEvent(new Event('tripsUpdated'));
      } catch {
        /* ignore */
      }
    } finally {
      commitLockRef.current = false;
    }
  }
  function cancelRenameTrip() {
    setInlineEdit(null);
    setEditVal('');
  }
  function openDeleteTripModal(trip) {
    setCtxMenu(null);
    setTripDeleteModal({ id: trip.id, name: trip.name || 'Gezi' });
  }
  function confirmDeleteTrip() {
    if (!tripDeleteModal) return;
    const { id } = tripDeleteModal;
    setTripDeleteModal(null);
    setCtxMenu(null);
    const sid = String(id);
    setExitingTripIds((s) => new Set(s).add(sid));
    window.setTimeout(() => {
      try {
        deleteTripFromBothStorages(id);
        refreshData();
        try {
          window.dispatchEvent(new Event('tripsUpdated'));
        } catch {
          /* ignore */
        }
        let active = null;
        try {
          active = localStorage.getItem(TA_ACTIVE_TRIP_ID);
        } catch {
          /* ignore */
        }
        if (active != null && String(id) === String(active)) {
          try {
            localStorage.removeItem(TA_ACTIVE_TRIP_ID);
          } catch {
            /* ignore */
          }
        }
      } catch {
        showToast('Silinemedi');
      } finally {
        setExitingTripIds((s) => {
          const n = new Set(s);
          n.delete(sid);
          return n;
        });
      }
    }, 300);
  }

  /** Dar şerit genişliği — flex düzeninde yalnızca bu kadar yer ayrılır; geniş sidebar ve paneller fixed overlay. */
  const RAIL_W = 56;
  const sidebarW = expanded ? 220 : RAIL_W;
  const filteredChats = search.trim()
    ? chats.filter(c => (c.title || '').toLowerCase().includes(search.toLowerCase()))
    : chats;
  const filteredTrips = search.trim()
    ? trips.filter(t => (t.name || '').toLowerCase().includes(search.toLowerCase()))
    : trips;

  const panelFlyoutLeft = sidebarW;
  const panelDimLeft = panel ? sidebarW + 280 : 0;

  return (
    <>
      {/* Ana flex satırında yalnızca dar ray genişliği — sayfa içeriği genişlemez / kaymaz */}
      <div
        style={{
          width: RAIL_W,
          flexShrink: 0,
          height: '100%',
          minHeight: 0,
          alignSelf: 'stretch',
        }}
        aria-hidden
      />

      {/* Sabit sol sidebar: genişletilince içeriğin üzerine bindirir */}
      <aside
        style={{
          ...st.sidebar,
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: sidebarW,
          minWidth: sidebarW,
          /* ctx tam ekran scrim (z38) altında kalmamalı — tıklanabilir kalsın */
          zIndex: ctxMenu && panel === 'chats' ? 42 : 34,
          transition: 'width .25s ease, min-width .25s ease',
          boxShadow: expanded ? '4px 0 24px rgba(35,28,18,.08)' : 'none',
        }}
      >
          {/* Logo + expand/collapse */}
          {expanded ? (
            <div style={st.topExp}>
              <div style={st.topExpBalancer} aria-hidden />
              <Link href="/" style={st.topExpLogo}>
                <AtlasLogo height={38} style={{ flexShrink: 0 }} />
              </Link>
              <button type="button" style={st.arrowBtn} onClick={toggleExpand} aria-label="Kenar çubuğunu daralt">
                <ChevronLeft size={16} strokeWidth={2} color={ta.inkMuted} />
              </button>
            </div>
          ) : (
            <div style={st.topCol}>
              <div
                onClick={toggleExpand}
                onMouseEnter={() => setLogoHover(true)}
                onMouseLeave={() => setLogoHover(false)}
                style={{
                  width: 48,
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {logoHover ? (
                  <ChevronRight size={18} color={ta.inkSubtle} />
                ) : (
                  <AtlasLogo height={30} />
                )}
              </div>
            </div>
          )}

          <nav style={st.nav}>
            {NAV_ITEMS.map(item => {
              const hrefMatch =
                item.href !== '#' &&
                item.href &&
                (pathname === item.href ||
                  (item.id === 'trips' && pathname.startsWith('/trips')));
              const onChatPath = pathname === '/chat';
              const onFlightsPath = pathname === '/flights';
              let isAct = hrefMatch || item.id === activeId;
              if (onChatPath) {
                if (item.id === 'chats') {
                  isAct = panel === 'chats' || panel == null;
                } else if (item.id === 'quickPlan') {
                  isAct = panel === 'quickPlan';
                }
              } else if (
                (onFlightsPath || pathname === '/stay' || pathname === '/cars') &&
                item.id === 'quickPlan'
              ) {
                isAct = true;
              }
              const isOpen = panel === item.id;
              return (
                <Link key={item.id} href={item.href}
                  style={{
                    ...st.navItem,
                    ...(isAct || isOpen ? st.navAct : {}),
                    ...(hovered === item.id && !isAct && !isOpen ? st.navHov : {}),
                    justifyContent: expanded ? 'flex-start' : 'center',
                    padding: expanded ? '0 14px' : '0',
                  }}
                  onClick={e => handleNavClick(item, e)}
                  onMouseEnter={() => setHovered(item.id)}
                  onMouseLeave={() => setHovered(null)}
                  title={!expanded ? item.label : undefined}>
                  <item.Icon size={20} strokeWidth={isAct || isOpen ? 2.2 : 1.8}
                    color={isAct || isOpen ? ta.ink : ta.inkMuted} />
                  {expanded && (
                    <span style={{ ...st.navLabel, fontWeight: isAct ? 600 : 500, color: isAct || isOpen ? ta.ink : ta.inkMuted }}>
                      {item.label}
                    </span>
                  )}
                  {item.id === 'chats' && chatCount > 0 && (
                    <span style={{ ...st.badge, ...(expanded ? {} : st.badgeMini) }}>{expanded ? chatCount : ''}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div style={st.footerCol}>
            {expanded ? (
              <div style={{ padding: '0 10px 10px', width: '100%', boxSizing: 'border-box' }}>
                <NavLocaleCurrency className="l-prefs--stack" />
              </div>
            ) : null}
            <SidebarAccount expanded={expanded} />
          </div>
        </aside>

      {/* Sohbetler / Hızlı Plan: içeriğin üzerine kayar panel */}
      {panel ? (
        <>
          <div
            role="presentation"
            style={{
              position: 'fixed',
              left: panelDimLeft,
              top: 0,
              right: 0,
              bottom: 0,
              zIndex: zPanelDim,
              background: 'rgba(15, 12, 8, 0.2)',
            }}
            onClick={() => {
              setPanel(null);
              setCtxMenu(null);
            }}
          />
          <div
            style={{
              position: 'fixed',
              left: panelFlyoutLeft,
              top: 0,
              bottom: 0,
              width: 280,
              /* ctx scrim; /chat’te ana layout’un altında kalmaması için yüksek z-index */
              zIndex: zPanelFlyout,
              background: ta.surface,
              borderRight: '1px solid rgba(0,0,0,.08)',
              boxShadow: '8px 0 32px rgba(35,28,18,.12)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
          {panel === 'chats' && (
            <div style={st.panelInner}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 12px 8px',
                }}
              >
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: ta.mutedBg,
                    borderRadius: 20,
                    padding: '7px 12px',
                  }}
                >
                  <Search size={14} color={ta.inkSubtle} />
                  <input
                    placeholder="Ara..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      fontSize: 13,
                      color: ta.ink,
                      width: '100%',
                      fontFamily: 'var(--font-sans)',
                    }}
                  />
                </div>
                <div
                  onClick={() => setPanel(null)}
                  style={{
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 20,
                    background: ta.mutedBg,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <X size={16} color={ta.inkMuted} />
                </div>
              </div>

              <Link href="/chat?newChat=1" style={st.pAction} onClick={() => setPanel(null)}><PenLine size={16} strokeWidth={2} color={ta.ink} /><span style={st.pActLabel}>Yeni Sohbet</span></Link>
              <button
                type="button"
                style={{ ...st.pAction, font: 'inherit', textAlign: 'left' }}
                onClick={() => {
                  setPanel(null);
                  openNewTrip();
                }}
              >
                <Map size={16} strokeWidth={2} color={ta.ink} />
                <span style={st.pActLabel}>Yeni Gezi</span>
              </button>

              {/* Trips */}
              {filteredTrips.length > 0 && (
                <>
                  <div style={st.pSection}>Geziler</div>
                  {filteredTrips.map(trip => (
                    <PanelRow key={trip.id} type="trip" item={trip}
                      isActive={uiMode === 'trip' && highlightTripId != null && String(highlightTripId) === String(trip.id)}
                      isEditing={inlineEdit?.type === 'trip' && String(inlineEdit.id) === String(trip.id)}
                      editVal={editVal} editRef={editRef}
                      onEditChange={setEditVal}
                      onEditCommit={() => commitRenameTrip(trip)}
                      onEditCancel={cancelRenameTrip}
                      exiting={exitingTripIds.has(String(trip.id))}
                      ctxOpen={ctxMenu === trip.id}
                      onCtxToggle={() => setCtxMenu(ctxMenu === trip.id ? null : trip.id)}
                      onRename={() => startRenameTrip(trip)}
                      onDelete={() => openDeleteTripModal(trip)}
                      onClosePanel={() => setPanel(null)} />
                  ))}
                </>
              )}

              {/* Chats */}
              <div style={st.pSection}>Sohbetler</div>
              {filteredChats.length === 0 ? (
                <p style={st.pEmpty}>Henüz sohbet yok.</p>
              ) : (
                filteredChats.map(chat => (
                  <PanelRow key={chat.id} type="chat" item={chat}
                    isActive={uiMode === 'chat' && highlightChatId != null && String(highlightChatId) === String(chat.id)}
                    isEditing={inlineEdit?.type === 'chat' && String(inlineEdit.id) === String(chat.id)}
                    editVal={editVal} editRef={editRef}
                    onEditChange={setEditVal}
                    onEditCommit={() => commitRenameChat(chat)}
                    onEditCancel={cancelRenameChat}
                    ctxOpen={ctxMenu === chat.id}
                    onCtxToggle={() => setCtxMenu(ctxMenu === chat.id ? null : chat.id)}
                    onRename={() => startRenameChat(chat)}
                    onDelete={() => handleDeleteChat(chat.id)}
                    onClosePanel={() => setPanel(null)} />
                ))
              )}
            </div>
          )}

          {panel === 'quickPlan' && (
            <div style={st.panelInner}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 12px 8px',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 700,
                    fontSize: 15,
                    color: ta.ink,
                  }}
                >
                  Hızlı Plan
                </span>
                <button
                  type="button"
                  onClick={() => setPanel(null)}
                  style={{
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 20,
                    background: ta.mutedBg,
                    cursor: 'pointer',
                    flexShrink: 0,
                    border: 'none',
                    padding: 0,
                  }}
                  aria-label="Kapat"
                >
                  <X size={16} color={ta.inkMuted} />
                </button>
              </div>

              <QuickPlanPanelRow
                icon={MapPinned}
                title="Turlar"
                subtitle="Rehberli ve günlük turlara göz at"
                onClick={() => openQuickPlanCategory('tour')}
              />
              <QuickPlanPanelRow
                icon={Building2}
                title="Konaklama"
                subtitle="Otel ve apart ara"
                onClick={() => openQuickPlanCategory('stay')}
              />
              <QuickPlanPanelRow
                icon={Plane}
                title="Uçuşlar"
                subtitle="Uçak bileti bul"
                onClick={() => openQuickPlanCategory('flight')}
              />
              <QuickPlanPanelRow
                icon={Bus}
                title="Otobüsler"
                subtitle="Şehirler arası sefer ara"
                onClick={() => openQuickPlanCategory('bus')}
              />
              <QuickPlanPanelRow
                icon={CarFront}
                title="Araç Kiralama"
                subtitle="Günlük ve dönemlik kiralama"
                onClick={() => openQuickPlanCategory('car')}
              />
              <QuickPlanPanelRow
                icon={Ticket}
                title="Aktiviteler"
                subtitle="Deneyimler ve yapılacaklar"
                onClick={() => openQuickPlanCategory('activities')}
              />
            </div>
          )}
          </div>
        </>
      ) : null}

      {ctxMenu ? (
        <div
          role="presentation"
          style={{ position: 'fixed', inset: 0, zIndex: zCtxScrim }}
          onClick={() => setCtxMenu(null)}
        />
      ) : null}

      {tripDeleteModal && (
        <div
          style={st.modalOverlay}
          role="presentation"
          onClick={() => setTripDeleteModal(null)}
        >
          <div
            style={st.modalBox}
            role="dialog"
            aria-modal="true"
            aria-labelledby="trip-del-title"
            onClick={(e) => e.stopPropagation()}
          >
            <p id="trip-del-title" style={st.modalText}>
              Bu geziyi silmek istediğinize emin misiniz?
            </p>
            <div style={st.modalActions}>
              <button type="button" style={st.modalBtnCancel} onClick={() => setTripDeleteModal(null)}>
                İptal
              </button>
              <button type="button" style={st.modalBtnDanger} onClick={confirmDeleteTrip}>
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMsg && (
        <div style={st.toast} role="status">
          {toastMsg}
        </div>
      )}
    </>
  );
}

function QuickPlanPanelRow({ icon: Icon, title, subtitle, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...st.pRow,
        width: '100%',
        border: 'none',
        background: hov ? 'rgba(0,0,0,.04)' : 'transparent',
        cursor: 'pointer',
        textAlign: 'left',
        padding: 0,
        borderRadius: 8,
        transition: 'background .12s',
      }}
    >
      <div style={{ ...st.pRowLink, width: '100%', boxSizing: 'border-box' }}>
        <div style={st.pThumb}>
          <Icon
            size={18}
            strokeWidth={hov ? 2.2 : 2}
            color={hov ? ta.ink : ta.inkMuted}
          />
        </div>
        <div style={st.pMeta}>
          <span style={st.pName}>{title}</span>
          <span style={st.pSub}>{subtitle}</span>
        </div>
      </div>
    </button>
  );
}

/* ── Panel Row with context menu ── */
function PanelRow({
  type, item, isActive = false, isEditing, editVal, editRef, onEditChange, onEditCommit, onEditCancel,
  ctxOpen, onCtxToggle, onRename, onDelete, onClosePanel,
  exiting = false,
}) {
  const [rowHov, setRowHov] = useState(false);
  const isChat = type === 'chat';

  if (isEditing) {
    return (
      <div style={st.pRow}>
        <input
          ref={editRef}
          style={st.editInput}
          value={editVal}
          onChange={(e) => onEditChange(e.target.value)}
          onBlur={() => onEditCommit()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onEditCommit();
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              onEditCancel?.();
            }
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        ...st.pRow,
        ...(isActive ? st.pRowActive : {}),
        ...(rowHov ? st.pRowHov : {}),
        opacity: exiting ? 0 : 1,
        transition: 'opacity 0.28s ease',
        pointerEvents: exiting ? 'none' : undefined,
      }}
      onMouseEnter={() => setRowHov(true)}
      onMouseLeave={() => setRowHov(false)}
    >
      <Link
        href={
          isChat
            ? `/chat?chat=${encodeURIComponent(String(item.id))}`
            : `/trips/${encodeURIComponent(String(item.id))}`
        }
        style={st.pRowLink}
        onClick={onClosePanel}
      >
        {!isChat && (
          <div style={st.pThumb}>
            <Luggage size={16} strokeWidth={2} color={ta.inkMuted} aria-hidden />
          </div>
        )}
        <div style={st.pMeta}>
          <span style={st.pName}>{isChat ? (item.title || 'Başlıksız') : item.name}</span>
          {isChat && item.tripName && <span style={st.pSub}>{item.tripName}</span>}
        </div>
      </Link>

      {/* ··· button — visible on hover */}
      <button
        type="button"
        style={{ ...st.ctxBtn, opacity: rowHov || ctxOpen ? 1 : 0 }}
        onClick={(e) => {
          e.stopPropagation();
          onCtxToggle();
        }}
      >
        <MoreHorizontal size={15} strokeWidth={2} color={ta.inkMuted} />
      </button>

      {/* Dropdown */}
      {ctxOpen && (
        <div style={st.ctxMenu}>
          <button
            type="button"
            style={st.ctxItem}
            onClick={(e) => {
              e.stopPropagation();
              onRename();
            }}
          >
            <Pencil size={14} strokeWidth={2} color={ta.ink} />
            <span>{isChat ? 'Sohbeti Yeniden Adlandır' : 'Geziyi Yeniden Adlandır'}</span>
          </button>
          <div style={st.ctxDivider} />
          <button
            type="button"
            style={{ ...st.ctxItem, ...st.ctxDanger }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 size={14} strokeWidth={2} color={ta.danger} />
            <span>{isChat ? 'Sohbeti Sil' : 'Geziyi Sil'}</span>
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══ Styles ═══ */
const st = {
  sidebar: {
    display: 'flex', flexDirection: 'column', background: ta.surface,
    borderRightWidth: 'var(--border-thin)',
    borderRightStyle: 'solid',
    borderRightColor: 'rgba(0,0,0,.06)',
    transition: 'width var(--duration-slow) var(--ease-out), min-width var(--duration-slow) var(--ease-out)',
    overflow: 'hidden', flexShrink: 0, height: '100%', zIndex: 'var(--z-raised)',
  },
  /* Expanded top: ortada logo; sağda daralt; solda görsel denge için eş genişlik */
  topExp: {
    display: 'flex',
    alignItems: 'center',
    padding: 'var(--space-3) var(--space-3) var(--space-2)',
    flexShrink: 0,
    gap: 0,
  },
  topExpBalancer: { width: 28, flexShrink: 0, pointerEvents: 'none' },
  topExpLogo: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 0,
    textDecoration: 'none',
    color: 'inherit',
    cursor: 'pointer',
  },
  arrowBtn: {
    width: 28, height: 28, borderRadius: 'var(--radius-xs)',
    background: 'transparent', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0,
  },

  /* Collapsed top */
  topCol: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 'var(--space-px)', padding: 'var(--space-3) 0 var(--space-1)', flexShrink: 0,
  },

  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-px)', padding: 'var(--space-1) var(--space-2)', overflowY: 'auto' },
  navItem: { display: 'flex', alignItems: 'center', gap: 'var(--space-3)', height: 42, borderRadius: 'var(--radius-sm)', textDecoration: 'none', transition: 'background var(--duration-fast) var(--ease-out)', position: 'relative', flexShrink: 0 },
  navAct: {
    background: 'rgba(31,77,92,0.08)',
    boxShadow: 'inset 3px 0 0 var(--ta-accent)',
  },
  navHov: { background: 'rgba(31,77,92,0.04)' },
  navLabel: { fontFamily: 'var(--font-sans)', fontSize: 'var(--text-md)', whiteSpace: 'nowrap', overflow: 'hidden' },
  badge: { marginLeft: 'auto', background: 'var(--ta-accent)', color: 'white', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', padding: '1px 7px', borderRadius: 'var(--radius-pill)', fontFamily: 'var(--font-sans)', lineHeight: '18px' },
  badgeMini: { position: 'absolute', top: 4, right: 4, width: 8, height: 8, padding: 0, borderRadius: 'var(--radius-pill)', fontSize: 0 },

  footer: { padding: 'var(--space-2) var(--space-2) var(--space-3)', flexShrink: 0 },
  footerCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
    padding: 'var(--space-2) var(--space-2) var(--space-3)',
    flexShrink: 0,
    borderTopWidth: 'var(--border-thin)',
    borderTopStyle: 'solid',
    borderTopColor: 'rgba(0,0,0,.05)',
  },

  panelInner: {
    width: 280,
    padding: 'var(--space-3) var(--space-3)',
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    boxSizing: 'border-box',
  },

  pAction: { display: 'flex', alignItems: 'center', gap: 'var(--space-3)', height: 'var(--space-8)', padding: '0 var(--space-3)', borderRadius: 'var(--radius-xs)', textDecoration: 'none', transition: 'background var(--duration-fast) var(--ease-out)', flexShrink: 0 },
  pActLabel: { fontFamily: 'var(--font-sans)', fontSize: 'var(--text-md)', fontWeight: 'var(--fw-medium)', color: ta.ink },
  pSection: { fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)', letterSpacing: '.04em', textTransform: 'uppercase', color: ta.inkSubtle, padding: 'var(--space-4) var(--space-3) var(--space-1)', flexShrink: 0 },

  /* Panel rows */
  pRow: { position: 'relative', display: 'flex', alignItems: 'center', borderRadius: 'var(--radius-xs)', transition: 'background var(--duration-fast) var(--ease-out)', flexShrink: 0 },
  pRowActive: { background: 'rgba(31,77,92,.12)' },
  pRowHov: { background: 'rgba(0,0,0,.03)' },
  pRowLink: { flex: 1, display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)', textDecoration: 'none', minWidth: 0 },
  pThumb: { width: 'var(--space-7)', height: 'var(--space-7)', borderRadius: 'var(--radius-xs)', background: 'rgba(0,0,0,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xl)', flexShrink: 0 },
  pMeta: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 },
  pName: { fontFamily: 'var(--font-sans)', fontSize: 'var(--text-md)', fontWeight: 'var(--fw-medium)', color: ta.ink, lineHeight: 1.35, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  pSub: { fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: ta.inkSubtle, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  pEmpty: { fontFamily: 'var(--font-sans)', fontSize: 'var(--text-base)', color: ta.inkSubtle, padding: 'var(--space-2) var(--space-3)', margin: 0 },

  /* Inline edit */
  editInput: {
    width: '100%', height: 36, padding: '0 var(--space-3)', margin: '2px 0',
    borderWidth: 'var(--border-thin)', borderStyle: 'solid', borderColor: 'rgba(31,77,92,.4)', borderRadius: 'var(--radius-xs)',
    fontFamily: 'var(--font-sans)', fontSize: 'var(--text-md)', color: ta.ink,
    outline: 'none', background: 'rgba(31,77,92,.06)',
  },

  /* Context menu trigger */
  ctxBtn: {
    width: 28, height: 28, borderRadius: 'var(--radius-xs)',
    background: 'transparent', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0, marginRight: 'var(--space-2)',
    transition: 'opacity var(--duration-fast) var(--ease-out), background var(--duration-fast) var(--ease-out)',
  },

  /* Dropdown */
  ctxMenu: {
    position: 'absolute', top: '100%', right: 'var(--space-2)', zIndex: 'var(--z-dropdown)',
    minWidth: 180, background: ta.surface,
    borderRadius: 'var(--radius-md)', padding: 'var(--space-1)',
    boxShadow: '0 4px 16px rgba(0,0,0,.12)',
    borderWidth: 'var(--border-thin)', borderStyle: 'solid', borderColor: 'rgba(0,0,0,.06)',
  },
  ctxItem: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
    height: 36, padding: '0 var(--space-3)', borderRadius: 'var(--radius-xs)',
    border: 'none', background: 'transparent', cursor: 'pointer',
    fontFamily: 'var(--font-sans)', fontSize: 'var(--text-base)', fontWeight: 'var(--fw-medium)',
    color: ta.ink, textAlign: 'left', transition: 'background var(--duration-fast) var(--ease-out)',
  },
  ctxDanger: { color: ta.danger },
  ctxDivider: { height: 'var(--border-thin)', background: 'rgba(0,0,0,.06)', margin: '2px var(--space-1)' },

  modalOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 'var(--z-overlay)',
    background: 'rgba(0,0,0,.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-5)',
  },
  modalBox: {
    width: '100%',
    maxWidth: 360,
    background: ta.surface,
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-5) var(--space-5) var(--space-4)',
    boxShadow: '0 8px 32px rgba(0,0,0,.15)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(0,0,0,.06)',
  },
  modalText: {
    margin: 0,
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-lg)',
    fontWeight: 'var(--fw-medium)',
    color: ta.ink,
    lineHeight: 'var(--text-lg-lh)',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 'var(--space-3)',
    marginTop: 'var(--space-5)',
  },
  modalBtnCancel: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-md)',
    fontWeight: 'var(--fw-medium)',
    padding: 'var(--space-2) var(--space-4)',
    borderRadius: 'var(--radius-sm)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(0,0,0,.1)',
    background: ta.surface,
    color: ta.ink,
    cursor: 'pointer',
  },
  modalBtnDanger: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-md)',
    fontWeight: 'var(--fw-semibold)',
    padding: 'var(--space-2) var(--space-4)',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    background: ta.danger,
    color: 'white',
    cursor: 'pointer',
  },
  toast: {
    position: 'fixed',
    bottom: 'var(--space-6)',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 'var(--z-toast)',
    maxWidth: 'min(90vw, 360px)',
    padding: 'var(--space-3) var(--space-5)',
    borderRadius: 'var(--radius-md)',
    background: ta.ink,
    color: 'white',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--fw-medium)',
    boxShadow: '0 4px 20px rgba(0,0,0,.2)',
  },
};
