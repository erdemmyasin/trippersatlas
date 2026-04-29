'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  MessageCircle, Briefcase, Search, Heart, Bell,
  Compass, Plus, ChevronRight, ChevronLeft, PenLine, Map,
  MoreHorizontal, Pencil, Unlink, Trash2, Image, X,
} from 'lucide-react';
import { getChats, saveChat, deleteChat as deleteStoredChat } from '@/lib/chatStore';
import { getTrips, saveTrip, deleteTrip as deleteStoredTrip } from '@/lib/tripStore';

const NAV_ITEMS = [
  { id: 'chats',   Icon: MessageCircle, label: 'Sohbetler',    href: '/chat',    hasPanel: true },
  { id: 'trips',   Icon: Briefcase,     label: 'Geziler',      href: '/trips',   hasPanel: false },
  { id: 'explore', Icon: Search,        label: 'Keşfet',       href: '/explore', hasPanel: false },
  { id: 'saved',   Icon: Heart,         label: 'Kaydedilenler', href: '#',        hasPanel: false },
  { id: 'updates', Icon: Bell,          label: 'Güncellemeler', href: '#',        hasPanel: false },
  { id: 'inspire', Icon: Compass,       label: 'İlham',        href: '/',        hasPanel: false },
  { id: 'create',  Icon: Plus,          label: 'Oluştur',      href: '/chat',    hasPanel: false },
];

const EXP_KEY = 'ta_sidebar_expanded';

export default function AppSidebar({ activeId = 'chats' }) {
  const [expanded, setExpanded] = useState(false);
  const [panel, setPanel]       = useState(null);
  const [chatCount, setChatCount] = useState(0);
  const [chats, setChats]       = useState([]);
  const [trips, setTrips]       = useState([]);
  const [hovered, setHovered]   = useState(null);
  const [logoHover, setLogoHover] = useState(false);
  const [search, setSearch]     = useState('');
  const [ctxMenu, setCtxMenu]   = useState(null);
  const [editId, setEditId]     = useState(null);
  const [editVal, setEditVal]   = useState('');
  const editRef = useRef(null);

  useEffect(() => {
    try { if (localStorage.getItem(EXP_KEY) === 'true') setExpanded(true); } catch {}
    setChatCount(getChats().length);
  }, []);

  function loadMergedTrips() {
    let fromHeader = [];
    try {
      const r = localStorage.getItem('trips');
      if (r) fromHeader = JSON.parse(r);
      if (!Array.isArray(fromHeader)) fromHeader = [];
    } catch {
      fromHeader = [];
    }
    const fromStore = getTrips();
    const seen = new Set();
    const out = [];
    for (const t of fromHeader) {
      if (t?.id != null && !seen.has(String(t.id))) {
        seen.add(String(t.id));
        out.push(t);
      }
    }
    for (const t of fromStore) {
      if (t?.id != null && !seen.has(String(t.id))) {
        seen.add(String(t.id));
        out.push(t);
      }
    }
    return out;
  }

  function refreshData() {
    setChats(getChats());
    setTrips(loadMergedTrips());
    setChatCount(getChats().length);
  }

  useEffect(() => {
    function onTripsUpdated() {
      refreshData();
    }
    window.addEventListener('tripsUpdated', onTripsUpdated);
    return () => window.removeEventListener('tripsUpdated', onTripsUpdated);
  }, []);

  useEffect(() => {
    if (panel === 'chats') { refreshData(); setSearch(''); }
  }, [panel]);

  useEffect(() => {
    if (editId && editRef.current) editRef.current.focus();
  }, [editId]);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') { setCtxMenu(null); setEditId(null); } }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  function toggleExpand() {
    setExpanded(v => {
      const next = !v;
      try { localStorage.setItem(EXP_KEY, String(next)); } catch {}
      return next;
    });
  }

  function handleNavClick(item, e) {
    if (item.hasPanel) { e.preventDefault(); setPanel(p => p === item.id ? null : item.id); return; }
    setPanel(null);
  }

  /* ── Chat actions ── */
  function startRenameChat(chat) {
    setCtxMenu(null);
    setEditId(chat.id);
    setEditVal(chat.title || '');
  }
  function commitRenameChat(chat) {
    const trimmed = editVal.trim() || 'Başlıksız';
    saveChat({ ...chat, title: trimmed });
    setEditId(null);
    refreshData();
  }
  function removeChatFromTrip(chat) {
    setCtxMenu(null);
    saveChat({ ...chat, tripName: null });
    refreshData();
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
    setEditId(trip.id);
    setEditVal(trip.name || '');
  }
  function commitRenameTrip(trip) {
    const trimmed = editVal.trim() || 'Yeni Gezi';
    saveTrip({ ...trip, name: trimmed });
    setEditId(null);
    refreshData();
  }
  function handleDeleteTrip(id) {
    setCtxMenu(null);
    if (!confirm('Bu geziyi silmek istediğinize emin misiniz?')) return;
    deleteStoredTrip(id);
    refreshData();
  }

  const sideW = expanded ? 220 : 56;
  const filteredChats = search.trim()
    ? chats.filter(c => (c.title || '').toLowerCase().includes(search.toLowerCase()))
    : chats;
  const filteredTrips = search.trim()
    ? trips.filter(t => (t.name || '').toLowerCase().includes(search.toLowerCase()))
    : trips;

  return (
    <>
      <div style={{ display: 'flex', flexShrink: 0, height: '100%', position: 'relative', zIndex: 20 }}>
        {/* ═══ SIDEBAR ═══ */}
        <aside style={{ ...st.sidebar, width: sideW, minWidth: sideW }}>
          {/* Logo + expand/collapse */}
          {expanded ? (
            <div style={st.topExp}>
              <div style={st.topExpLeft} onClick={() => window.location.reload()}>
                <span style={st.logoGold}>◈</span>
                <span style={st.logoLabel}>Atlas</span>
              </div>
              <button style={st.arrowBtn} onClick={toggleExpand}>
                <ChevronLeft size={16} strokeWidth={2} color="#6B6760" />
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
                  <ChevronRight size={18} color="#A8A59E" />
                ) : (
                  <span style={{ fontSize: 22, color: '#B8934A' }}>◈</span>
                )}
              </div>
            </div>
          )}

          <nav style={st.nav}>
            {NAV_ITEMS.map(item => {
              const isAct = item.id === activeId;
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
                    color={isAct || isOpen ? '#1A1916' : '#6B6760'} />
                  {expanded && (
                    <span style={{ ...st.navLabel, fontWeight: isAct ? 600 : 500, color: isAct || isOpen ? '#1A1916' : '#6B6760' }}>
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

          <div style={st.footer}>
            <Link href="/chat" style={{ ...st.newBtn, padding: expanded ? '0 14px' : '0' }} title="Yeni Sohbet">
              {expanded ? <span style={st.newBtnTxt}>Yeni Sohbet</span> : <MessageCircle size={18} strokeWidth={1.8} color="#6B6760" />}
            </Link>
          </div>
        </aside>

        {/* ═══ PANEL ═══ */}
        <div style={{ ...st.panel, width: panel ? 280 : 0, opacity: panel ? 1 : 0, borderRight: panel ? '1px solid rgba(0,0,0,.06)' : 'none' }}>
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
                    background: '#F4F3EF',
                    borderRadius: 20,
                    padding: '7px 12px',
                  }}
                >
                  <Search size={14} color="#A8A59E" />
                  <input
                    placeholder="Ara..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      fontSize: 13,
                      color: '#1A1916',
                      width: '100%',
                      fontFamily: '"Inter", var(--font-sans)',
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
                    background: '#F4F3EF',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <X size={16} color="#6B6860" />
                </div>
              </div>

              <Link href="/chat" style={st.pAction}><PenLine size={16} strokeWidth={2} color="#1A1916" /><span style={st.pActLabel}>Yeni Sohbet</span></Link>
              <Link href="/trips" style={st.pAction} onClick={() => setPanel(null)}><Map size={16} strokeWidth={2} color="#1A1916" /><span style={st.pActLabel}>Yeni Gezi</span></Link>

              {/* Trips */}
              {filteredTrips.length > 0 && (
                <>
                  <div style={st.pSection}>Geziler</div>
                  {filteredTrips.map(trip => (
                    <PanelRow key={trip.id} type="trip" item={trip}
                      isEditing={editId === trip.id} editVal={editVal} editRef={editRef}
                      onEditChange={setEditVal}
                      onEditCommit={() => commitRenameTrip(trip)}
                      ctxOpen={ctxMenu === trip.id}
                      onCtxToggle={() => setCtxMenu(ctxMenu === trip.id ? null : trip.id)}
                      onRename={() => startRenameTrip(trip)}
                      onDelete={() => handleDeleteTrip(trip.id)}
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
                    isEditing={editId === chat.id} editVal={editVal} editRef={editRef}
                    onEditChange={setEditVal}
                    onEditCommit={() => commitRenameChat(chat)}
                    ctxOpen={ctxMenu === chat.id}
                    onCtxToggle={() => setCtxMenu(ctxMenu === chat.id ? null : chat.id)}
                    onRename={() => startRenameChat(chat)}
                    onRemoveTrip={() => removeChatFromTrip(chat)}
                    onDelete={() => handleDeleteChat(chat.id)}
                    onClosePanel={() => setPanel(null)} />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {panel && <div style={st.panelOverlay} onClick={() => { setPanel(null); setCtxMenu(null); }} />}
      {ctxMenu && <div style={{ position: 'fixed', inset: 0, zIndex: 25 }} onClick={() => setCtxMenu(null)} />}
    </>
  );
}

/* ── Panel Row with context menu ── */
function PanelRow({
  type, item, isEditing, editVal, editRef, onEditChange, onEditCommit,
  ctxOpen, onCtxToggle, onRename, onRemoveTrip, onDelete, onClosePanel,
}) {
  const [rowHov, setRowHov] = useState(false);
  const isChat = type === 'chat';

  if (isEditing) {
    return (
      <div style={st.pRow}>
        <input ref={editRef} style={st.editInput} value={editVal}
          onChange={e => onEditChange(e.target.value)}
          onBlur={onEditCommit}
          onKeyDown={e => { if (e.key === 'Enter') onEditCommit(); if (e.key === 'Escape') onEditCommit(); }} />
      </div>
    );
  }

  return (
    <div style={{ ...st.pRow, ...(rowHov ? st.pRowHov : {}) }}
      onMouseEnter={() => setRowHov(true)} onMouseLeave={() => setRowHov(false)}>
      <Link href={isChat ? '/chat' : '/trips'} style={st.pRowLink} onClick={onClosePanel}>
        {!isChat && <div style={st.pThumb}>🧳</div>}
        <div style={st.pMeta}>
          <span style={st.pName}>{isChat ? (item.title || 'Başlıksız') : item.name}</span>
          {isChat && item.tripName && <span style={st.pSub}>{item.tripName}</span>}
        </div>
      </Link>

      {/* ··· button — visible on hover */}
      <button style={{ ...st.ctxBtn, opacity: rowHov || ctxOpen ? 1 : 0 }}
        onClick={e => { e.stopPropagation(); onCtxToggle(); }}>
        <MoreHorizontal size={15} strokeWidth={2} color="#6B6760" />
      </button>

      {/* Dropdown */}
      {ctxOpen && (
        <div style={st.ctxMenu}>
          <button style={st.ctxItem} onClick={onRename}>
            <Pencil size={14} strokeWidth={2} color="#1A1916" />
            <span>{isChat ? 'Sohbeti Yeniden Adlandır' : 'Geziyi Yeniden Adlandır'}</span>
          </button>
          {isChat && item.tripName && (
            <button style={st.ctxItem} onClick={onRemoveTrip}>
              <Unlink size={14} strokeWidth={2} color="#1A1916" />
              <span>Geziden Çıkar</span>
            </button>
          )}
          {!isChat && (
            <button style={st.ctxItem} onClick={() => {}}>
              <Image size={14} strokeWidth={2} color="#1A1916" />
              <span>Fotoğrafı Değiştir</span>
            </button>
          )}
          <div style={st.ctxDivider} />
          <button style={{ ...st.ctxItem, ...st.ctxDanger }} onClick={onDelete}>
            <Trash2 size={14} strokeWidth={2} color="#A84A4A" />
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
    display: 'flex', flexDirection: 'column', background: '#FFFFFF',
    borderRight: '1px solid rgba(0,0,0,.06)',
    transition: 'width .25s ease, min-width .25s ease',
    overflow: 'hidden', flexShrink: 0, height: '100%', zIndex: 2,
  },
  /* Expanded top: ◈ Atlas ... < */
  topExp: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 10px 8px', flexShrink: 0,
  },
  topExpLeft: {
    display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
  },
  logoGold: { fontSize: 22, color: '#c79a46', lineHeight: 1 },
  logoLabel: {
    fontFamily: '"Inter", var(--font-sans)', fontWeight: 800, fontSize: 17,
    letterSpacing: '-0.02em', color: '#1A1916', whiteSpace: 'nowrap',
  },
  arrowBtn: {
    width: 28, height: 28, borderRadius: 8,
    background: 'transparent', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0,
  },

  /* Collapsed top */
  topCol: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 2, padding: '12px 0 4px', flexShrink: 0,
  },

  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: 2, padding: '4px 8px', overflowY: 'auto' },
  navItem: { display: 'flex', alignItems: 'center', gap: 12, height: 42, borderRadius: 10, textDecoration: 'none', transition: 'background .12s', position: 'relative', flexShrink: 0 },
  navAct: { background: 'rgba(0,0,0,.06)' },
  navHov: { background: 'rgba(0,0,0,.03)' },
  navLabel: { fontFamily: '"Inter", var(--font-sans)', fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden' },
  badge: { marginLeft: 'auto', background: '#1A1916', color: 'white', fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 999, fontFamily: '"Inter", var(--font-sans)', lineHeight: '18px' },
  badgeMini: { position: 'absolute', top: 4, right: 4, width: 8, height: 8, padding: 0, borderRadius: 999, fontSize: 0 },

  footer: { padding: '8px 8px 14px', flexShrink: 0 },
  newBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: 40, borderRadius: 999, background: 'rgba(0,0,0,.05)', textDecoration: 'none', transition: 'background .12s' },
  newBtnTxt: { fontFamily: '"Inter", var(--font-sans)', fontSize: 14, fontWeight: 500, color: '#1A1916' },

  /* Panel */
  panel: { background: '#FFFFFF', overflow: 'hidden', transition: 'width .25s ease, opacity .25s ease', flexShrink: 0, height: '100%', zIndex: 1 },
  panelInner: { width: 280, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 0, height: '100%', overflowY: 'auto' },
  panelOverlay: { position: 'fixed', inset: 0, zIndex: 15, background: 'transparent' },

  pAction: { display: 'flex', alignItems: 'center', gap: 12, height: 40, padding: '0 12px', borderRadius: 8, textDecoration: 'none', transition: 'background .12s', flexShrink: 0 },
  pActLabel: { fontFamily: '"Inter", var(--font-sans)', fontSize: 14, fontWeight: 500, color: '#1A1916' },
  pSection: { fontFamily: '"Inter", var(--font-sans)', fontSize: 11, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: '#A8A59E', padding: '16px 12px 6px', flexShrink: 0 },

  /* Panel rows */
  pRow: { position: 'relative', display: 'flex', alignItems: 'center', borderRadius: 8, transition: 'background .12s', flexShrink: 0 },
  pRowHov: { background: 'rgba(0,0,0,.03)' },
  pRowLink: { flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', textDecoration: 'none', minWidth: 0 },
  pThumb: { width: 32, height: 32, borderRadius: 8, background: 'rgba(0,0,0,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 },
  pMeta: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 },
  pName: { fontFamily: '"Inter", var(--font-sans)', fontSize: 14, fontWeight: 500, color: '#1A1916', lineHeight: 1.35, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  pSub: { fontFamily: '"Inter", var(--font-sans)', fontSize: 12, color: '#A8A59E', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  pEmpty: { fontFamily: '"Inter", var(--font-sans)', fontSize: 13, color: '#A8A59E', padding: '8px 12px', margin: 0 },

  /* Inline edit */
  editInput: {
    width: '100%', height: 36, padding: '0 12px', margin: '2px 0',
    border: '1px solid rgba(199,154,70,.4)', borderRadius: 8,
    fontFamily: '"Inter", var(--font-sans)', fontSize: 14, color: '#1A1916',
    outline: 'none', background: 'rgba(199,154,70,.06)',
  },

  /* Context menu trigger */
  ctxBtn: {
    width: 28, height: 28, borderRadius: 6,
    background: 'transparent', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0, marginRight: 6,
    transition: 'opacity .12s, background .12s',
  },

  /* Dropdown */
  ctxMenu: {
    position: 'absolute', top: '100%', right: 8, zIndex: 30,
    minWidth: 180, background: '#FFFFFF',
    borderRadius: 12, padding: 4,
    boxShadow: '0 4px 16px rgba(0,0,0,.12)',
    border: '1px solid rgba(0,0,0,.06)',
  },
  ctxItem: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
    height: 36, padding: '0 12px', borderRadius: 8,
    border: 'none', background: 'transparent', cursor: 'pointer',
    fontFamily: '"Inter", var(--font-sans)', fontSize: 13, fontWeight: 500,
    color: '#1A1916', textAlign: 'left', transition: 'background .12s',
  },
  ctxDanger: { color: '#A84A4A' },
  ctxDivider: { height: 1, background: 'rgba(0,0,0,.06)', margin: '2px 4px' },
};
