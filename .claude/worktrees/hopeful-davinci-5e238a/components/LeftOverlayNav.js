'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  MessageCircle, Briefcase, Search, Heart, Bell,
  Compass, Plus, ArrowLeft, PenLine, Map,
} from 'lucide-react';
import { getChats } from '@/lib/chatStore';
import { getTrips } from '@/lib/tripStore';

const NAV_ITEMS = [
  { id: 'chats',   Icon: MessageCircle, label: 'Sohbetler',    href: null },
  { id: 'trips',   Icon: Briefcase,     label: 'Geziler',      href: '/trips' },
  { id: 'explore', Icon: Search,        label: 'Keşfet',       href: '/explore' },
  { id: 'saved',   Icon: Heart,         label: 'Kaydedilenler', href: '#' },
  { id: 'updates', Icon: Bell,          label: 'Güncellemeler', href: '#' },
  { id: 'inspire', Icon: Compass,       label: 'İlham',        href: '/' },
  { id: 'create',  Icon: Plus,          label: 'Oluştur',      href: '/plan' },
];

const ICON_NAV = [
  { id: 'chats',   Icon: MessageCircle },
  { id: 'trips',   Icon: Briefcase },
  { id: 'explore', Icon: Search },
  { id: 'saved',   Icon: Heart },
  { id: 'updates', Icon: Bell },
  { id: 'inspire', Icon: Compass },
  { id: 'create',  Icon: Plus },
];

export default function LeftOverlayNav({
  isOpen,
  onClose,
  chatList: externalChats,
  activeChatId,
  onNewChat,
  onSelectChat,
}) {
  const [view, setView] = useState('nav');
  const [chats, setChats] = useState([]);
  const [trips, setTrips] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      setView('nav');
      setChats(externalChats?.length ? externalChats : getChats());
      setTrips(getTrips());
      setSearch('');
    }
  }, [isOpen, externalChats]);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose?.(); }
    if (isOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const chatCount = chats.length;

  const filteredChats = search.trim()
    ? chats.filter(c => (c.title || '').toLowerCase().includes(search.toLowerCase()))
    : chats;
  const filteredTrips = search.trim()
    ? trips.filter(t => (t.name || '').toLowerCase().includes(search.toLowerCase()))
    : trips;

  function handleNavClick(item) {
    if (item.id === 'chats') {
      setView('chats');
      return;
    }
    onClose?.();
  }

  return (
    <>
      {/* Dim overlay */}
      <div style={{ ...s.overlay, opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none' }}
        onClick={onClose} />

      {/* ═══ STATE 1: Main Nav ═══ */}
      <aside style={{
        ...s.drawer,
        width: 240,
        transform: isOpen && view === 'nav' ? 'translateX(0)' : 'translateX(-100%)',
        opacity: isOpen && view === 'nav' ? 1 : 0,
      }}>
        {/* Logo */}
        <div style={s.logoRow}>
          <span style={s.logoStar}>✦</span>
        </div>

        {/* Nav items */}
        <nav style={s.navList}>
          {NAV_ITEMS.map(item => {
            const isChats = item.id === 'chats';
            const inner = (
              <div style={{ ...s.navItem, ...(isChats ? s.navItemActive : {}) }}
                onMouseEnter={e => { if (!isChats) e.currentTarget.style.background = 'rgba(0,0,0,.03)'; }}
                onMouseLeave={e => { if (!isChats) e.currentTarget.style.background = 'transparent'; }}>
                <item.Icon size={20} strokeWidth={1.8} color="#1A1916" />
                <span style={s.navLabel}>{item.label}</span>
                {isChats && chatCount > 0 && (
                  <span style={s.badge}>{chatCount}</span>
                )}
              </div>
            );

            if (item.href && item.id !== 'chats') {
              return (
                <Link key={item.id} href={item.href} style={s.navLink}
                  onClick={() => handleNavClick(item)}>
                  {inner}
                </Link>
              );
            }
            return (
              <button key={item.id} style={s.navBtn}
                onClick={() => handleNavClick(item)}>
                {inner}
              </button>
            );
          })}
        </nav>

        {/* New chat button */}
        <div style={s.bottomArea}>
          <button style={s.newChatBtnMain}
            onClick={() => { onNewChat?.(); onClose?.(); }}>
            Yeni Sohbet
          </button>
        </div>
      </aside>

      {/* ═══ STATE 2: Chats Panel ═══ */}
      <aside style={{
        ...s.drawer,
        width: 280,
        transform: isOpen && view === 'chats' ? 'translateX(0)' : 'translateX(-100%)',
        opacity: isOpen && view === 'chats' ? 1 : 0,
        display: 'flex', flexDirection: 'row',
      }}>
        {/* Narrow icon rail */}
        <div style={s.iconRail}>
          <button style={s.railBtn} onClick={() => setView('nav')} title="Geri">
            <ArrowLeft size={18} strokeWidth={2} color="#1A1916" />
          </button>

          <div style={s.railDivider} />

          {ICON_NAV.map(n => (
            <button key={n.id} style={{ ...s.railBtn, ...(n.id === 'chats' ? s.railBtnActive : {}) }}
              onClick={() => {
                if (n.id === 'chats') return;
                const found = NAV_ITEMS.find(i => i.id === n.id);
                if (found?.href) { onClose?.(); window.location.href = found.href; }
              }}
              title={NAV_ITEMS.find(i => i.id === n.id)?.label}>
              <n.Icon size={18} strokeWidth={1.8} color={n.id === 'chats' ? '#1A1916' : '#A8A59E'} />
            </button>
          ))}
        </div>

        {/* Content panel */}
        <div style={s.chatsContent}>
          {/* Search */}
          <div style={s.searchWrap}>
            <Search size={15} strokeWidth={2} color="#A8A59E" style={{ flexShrink: 0 }} />
            <input style={s.searchInput} placeholder="Ara..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {/* New chat / New trip */}
          <button style={s.actionRow}
            onClick={() => { onNewChat?.(); onClose?.(); }}>
            <PenLine size={16} strokeWidth={2} color="#1A1916" />
            <span style={s.actionLabel}>Yeni Sohbet</span>
          </button>
          <button style={s.actionRow}
            onClick={() => { onClose?.(); window.location.href = '/trips'; }}>
            <Map size={16} strokeWidth={2} color="#1A1916" />
            <span style={s.actionLabel}>Yeni Gezi</span>
          </button>

          {/* Trips */}
          {filteredTrips.length > 0 && (
            <>
              <div style={s.sectionTitle}>Geziler</div>
              {filteredTrips.map(trip => (
                <Link key={trip.id} href="/trips" style={s.chatRow} onClick={() => onClose?.()}>
                  <div style={s.tripThumb}>🧳</div>
                  <span style={s.chatName}>{trip.name}</span>
                </Link>
              ))}
            </>
          )}

          {/* Chats */}
          <div style={s.sectionTitle}>Sohbetler</div>
          {filteredChats.length === 0 ? (
            <p style={s.emptyText}>Henüz sohbet yok.</p>
          ) : (
            filteredChats.map(chat => (
              <button key={chat.id}
                style={{ ...s.chatRow, ...(activeChatId === chat.id ? s.chatRowActive : {}) }}
                onClick={() => { onSelectChat?.(chat); onClose?.(); }}>
                <div style={s.chatMeta}>
                  <span style={s.chatName}>{chat.title || 'Başlıksız'}</span>
                  {chat.tripName && (
                    <span style={s.chatSub}>{chat.tripName}</span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </aside>
    </>
  );
}

/* ═══ Styles ═══ */
const s = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(20,16,10,.28)', zIndex: 90,
    transition: 'opacity .2s ease',
    backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)',
  },
  drawer: {
    position: 'fixed', top: 0, left: 0, bottom: 0,
    zIndex: 100,
    background: '#FFFFFF',
    borderRight: '1px solid rgba(0,0,0,.06)',
    boxShadow: '4px 0 24px rgba(0,0,0,.10)',
    transition: 'transform .2s ease, opacity .2s ease, width .2s ease',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  },

  /* ── STATE 1 ── */
  logoRow: {
    padding: '20px 20px 12px',
  },
  logoStar: {
    fontSize: 20, color: '#1A1916', fontWeight: 700,
  },

  navList: {
    flex: 1, padding: '4px 12px',
    display: 'flex', flexDirection: 'column', gap: 0,
    overflowY: 'auto',
  },
  navLink: { textDecoration: 'none' },
  navBtn: { background: 'none', border: 'none', padding: 0, width: '100%', cursor: 'pointer' },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 14,
    height: 44, padding: '0 12px', borderRadius: 10,
    transition: 'background .12s',
  },
  navItemActive: {
    background: 'rgba(0,0,0,.05)',
    borderRadius: 999,
  },
  navLabel: {
    fontFamily: '"Inter", var(--font-sans)', fontSize: 15, fontWeight: 500,
    color: '#1A1916', flex: 1,
  },
  badge: {
    background: '#1A1916', color: 'white',
    fontSize: 11, fontWeight: 700,
    padding: '2px 8px', borderRadius: 999,
    lineHeight: '18px', fontFamily: '"Inter", var(--font-sans)',
  },

  bottomArea: {
    padding: '12px 16px 20px',
  },
  newChatBtnMain: {
    width: '100%', height: 44, borderRadius: 999,
    background: 'rgba(0,0,0,.05)', border: 'none',
    fontFamily: '"Inter", var(--font-sans)', fontSize: 14, fontWeight: 500,
    color: '#1A1916', cursor: 'pointer',
    transition: 'background .12s',
  },

  /* ── STATE 2 ── */
  iconRail: {
    width: 48, flexShrink: 0,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '14px 0 12px', gap: 2,
    borderRight: '1px solid rgba(0,0,0,.06)',
  },
  railBtn: {
    width: 36, height: 36, borderRadius: 10,
    background: 'transparent', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'background .12s',
    flexShrink: 0,
  },
  railBtnActive: {
    background: 'rgba(0,0,0,.06)',
  },
  railDivider: {
    width: 24, height: 1, background: 'rgba(0,0,0,.06)',
    margin: '6px 0',
  },

  chatsContent: {
    flex: 1, overflowY: 'auto',
    padding: '12px 10px',
    display: 'flex', flexDirection: 'column', gap: 0,
  },

  searchWrap: {
    display: 'flex', alignItems: 'center', gap: 8,
    height: 38, padding: '0 12px',
    borderRadius: 999, background: 'rgba(0,0,0,.04)',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1, border: 'none', outline: 'none', background: 'transparent',
    fontFamily: '"Inter", var(--font-sans)', fontSize: 14,
    color: '#1A1916',
  },

  actionRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    width: '100%', height: 40, padding: '0 12px',
    borderRadius: 8, border: 'none', background: 'transparent',
    cursor: 'pointer', textDecoration: 'none',
    transition: 'background .12s', textAlign: 'left',
  },
  actionLabel: {
    fontFamily: '"Inter", var(--font-sans)', fontSize: 14, fontWeight: 500,
    color: '#1A1916',
  },

  sectionTitle: {
    fontFamily: '"Inter", var(--font-sans)', fontSize: 11, fontWeight: 600,
    letterSpacing: '.04em', textTransform: 'uppercase',
    color: '#A8A59E', padding: '16px 12px 6px',
  },

  chatRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: 'none', background: 'transparent', cursor: 'pointer',
    textDecoration: 'none', textAlign: 'left',
    transition: 'background .12s',
  },
  chatRowActive: { background: 'rgba(0,0,0,.05)' },
  tripThumb: {
    width: 32, height: 32, borderRadius: 8,
    background: 'rgba(0,0,0,.06)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 16, flexShrink: 0,
  },
  chatMeta: {
    flex: 1, minWidth: 0,
    display: 'flex', flexDirection: 'column', gap: 1,
  },
  chatName: {
    fontFamily: '"Inter", var(--font-sans)', fontSize: 14, fontWeight: 500,
    color: '#1A1916', lineHeight: 1.35,
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  chatSub: {
    fontFamily: '"Inter", var(--font-sans)', fontSize: 12,
    color: '#A8A59E', lineHeight: 1.3,
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  emptyText: {
    fontFamily: '"Inter", var(--font-sans)', fontSize: 13,
    color: '#A8A59E', padding: '8px 12px',
  },
};
