'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Header          from '@/components/Header';
import LeftPanel       from '@/components/LeftPanel';
import LeftOverlayNav  from '@/components/LeftOverlayNav';
import ChatArea        from '@/components/ChatArea';
import RightPanel      from '@/components/RightPanel';
import { trackEvent }  from '@/lib/analytics';
import { getChats, saveChat, getActiveId, setActiveId, createChat, deriveChatTitle } from '@/lib/chatStore';

/* ── Sabitler ── */
const TYPE_TO_CAT = {
  hotel: 'accommodation', villa: 'accommodation', clinic: 'accommodation',
  transfer: 'transport',  car: 'transport',
  tour: 'activities',     boat: 'activities',
  restaurant: 'extras',
};
const TYPE_TO_MODULE = {
  hotel: 'lodging', villa: 'lodging', clinic: 'lodging',
  transfer: 'transfer', car: 'transfer',
  tour: 'activities',   boat: 'activities',
};
const EMPTY_BUDGET = { accommodation: 0, transport: 0, activities: 0, extras: 0 };
const DEFAULT_PILLS = [
  { id: 'dest', label: 'Destinasyon' },
  { id: 'dates', label: 'Tarih' },
  { id: 'pax', label: 'Kişi sayısı' },
  { id: 'budget', label: 'Bütçe' },
];

const INITIAL_SAVED_PLANS = [
  { id: 'sp1', name: 'Bodrum Yaz Tatili',    subtitle: 'Bodrum · 7 gece · 2 kişi',      date: 'Haz 2026' },
  { id: 'sp2', name: 'İstanbul Kültür Turu', subtitle: 'İstanbul · 4 gece · 1 kişi',    date: 'Tem 2026' },
  { id: 'sp3', name: 'Kapadokya Kaçamağı',   subtitle: 'Nevşehir · 3 gece · 2 kişi',   date: 'Ağu 2026' },
];

let _planIdCounter = 10;

export default function PlanPage() {
  const [navOpen, setNavOpen] = useState(false);

  /* ── Chat persistence ── */
  const [chatList, setChatList] = useState([]);
  const [activeChat, setActiveChat] = useState(null);

  useEffect(() => {
    const chats = getChats();
    setChatList(chats);
    const savedId = getActiveId();
    const found = chats.find((c) => String(c.id) === String(savedId));
    if (found) {
      setActiveChat(found);
    } else {
      const fresh = createChat();
      setActiveChat(fresh);
      saveChat(fresh);
      setActiveId(fresh.id);
      setChatList([fresh, ...chats]);
    }
  }, []);

  const activeChatRef = useRef(null);
  activeChatRef.current = activeChat;

  const handleMessagesChange = useCallback((messages) => {
    const current = activeChatRef.current;
    if (!current) return;
    const title = deriveChatTitle(messages);
    const updated = { ...current, messages, title, updatedAt: Date.now() };
    saveChat(updated);
    setChatList(getChats());
  }, []);

  function handleNewChat() {
    const fresh = createChat(planName);
    saveChat(fresh);
    setActiveId(fresh.id);
    setActiveChat(fresh);
    setChatList(getChats());
    trackEvent('chat.new');
  }

  function handleSelectChat(chat) {
    setActiveId(chat.id);
    setActiveChat(chat);
    trackEvent('chat.switch', { chatId: chat.id });
  }

  const [activePlanId,  setActivePlanId]  = useState('active');
  const [planName,      setPlanName]      = useState('Yeni Seyahat Planı');
  const [budget,        setBudget]        = useState(EMPTY_BUDGET);
  const [completedModules, setCompletedModules] = useState(new Set());
  const [selectedListings, setSelectedListings] = useState({});
  const [planPills,     setPlanPills]     = useState(DEFAULT_PILLS);

  const [savedPlans, setSavedPlans] = useState(INITIAL_SAVED_PLANS);

  function handlePlanNameChange(name) {
    setPlanName(name);
    trackEvent('plan.rename', { name });
  }

  function handleNewPlan() {
    const snapshot = {
      id:       `sp${++_planIdCounter}`,
      name:     planName,
      subtitle: buildSubtitle(),
      date:     new Date().toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' }),
    };
    setSavedPlans(prev => [snapshot, ...prev]);

    setActivePlanId(`sp${_planIdCounter}`);
    setPlanName('Yeni Seyahat Planı');
    setBudget(EMPTY_BUDGET);
    setCompletedModules(new Set());
    setSelectedListings({});
    setPlanPills(DEFAULT_PILLS);
    trackEvent('plan.create', { source: 'header.dropdown' });
  }

  function handleSwitchPlan(plan) {
    setActivePlanId(plan.id);
    setPlanName(plan.name);
    trackEvent('plan.switch', { planId: plan.id, name: plan.name });
  }

  function handleListingSelect(listing) {
    const { type, price = 0, location = '' } = listing;
    const cat = TYPE_TO_CAT[type] ?? 'extras';
    setBudget(prev => ({ ...prev, [cat]: prev[cat] + Number(price) }));
    const modId = TYPE_TO_MODULE[type];
    if (modId) setCompletedModules(prev => new Set([...prev, modId]));
    setSelectedListings(prev => ({ ...prev, [listing.name]: listing }));
    const city = location.split(/[,·\-]/)[0].trim();
    if (city) {
      setPlanPills(prev =>
        prev.map(p => (p.id === 'dest' ? { ...p, label: city } : p))
      );
    }
    trackEvent('listing.select', {
      name: listing.name,
      type,
      location,
      price: Number(price) || 0,
    });
  }

  function handleListingDeselect(listing) {
    const { type, price = 0, name } = listing;
    const cat   = TYPE_TO_CAT[type]    ?? 'extras';
    const modId = TYPE_TO_MODULE[type];

    setBudget(prev => ({ ...prev, [cat]: Math.max(0, prev[cat] - Number(price)) }));

    setSelectedListings(prev => {
      const next = { ...prev };
      delete next[name];

      if (modId) {
        const stillHasModule = Object.values(next).some(
          l => TYPE_TO_MODULE[l.type] === modId
        );
        if (!stillHasModule) {
          setCompletedModules(prevModules => {
            const after = new Set(prevModules);
            after.delete(modId);
            return after;
          });
        }
      }
      return next;
    });

    trackEvent('listing.remove', {
      name,
      type,
      price: Number(price) || 0,
    });
  }

  useEffect(() => {
    function onClickCapture(event) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const clickable = target.closest('button, a, [role="button"]');
      if (!clickable) return;

      const label = (clickable.textContent || '').trim().slice(0, 120);
      const role = clickable.getAttribute('role') || '';
      const id = clickable.id || '';
      const className = typeof clickable.className === 'string' ? clickable.className : '';

      trackEvent('ui.click', {
        tag: clickable.tagName.toLowerCase(),
        role,
        id,
        className,
        label,
      });
    }

    document.addEventListener('click', onClickCapture, true);
    return () => document.removeEventListener('click', onClickCapture, true);
  }, []);

  function buildSubtitle() {
    const dest = planPills.find(p => p.id === 'dest');
    return dest?.label !== 'Destinasyon' ? dest.label : 'Taslak plan';
  }

  return (
    <div style={s.shell}>
      <LeftOverlayNav
        isOpen={navOpen}
        onClose={() => setNavOpen(false)}
        chatList={chatList}
        activeChatId={activeChat?.id}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        planName={planName}
      />

      <Header
        planName={planName}
        planPills={planPills}
        savedPlans={savedPlans}
        activePlanId={activePlanId}
        onMenuClick={() => setNavOpen(true)}
        onNewPlan={handleNewPlan}
        onSwitchPlan={handleSwitchPlan}
      />

      <div style={s.body}>
        <aside className="ta-panel" style={s.left}>
          <LeftPanel
            planName={planName}
            onPlanNameChange={handlePlanNameChange}
            completedModules={completedModules}
            budget={budget}
            selectedListings={selectedListings}
            onDeselect={handleListingDeselect}
          />
        </aside>

        <ChatArea
          chatId={activeChat?.id}
          initialMessages={activeChat?.messages}
          onMessagesChange={handleMessagesChange}
          onListingSelect={handleListingSelect}
          onListingDeselect={handleListingDeselect}
          selectedListings={selectedListings}
        />

        <aside className="ta-panel" style={s.right}>
          <RightPanel completedModules={completedModules} />
        </aside>
      </div>
    </div>
  );
}

const s = {
  shell: {
    display: 'grid',
    gridTemplateRows: 'auto 1fr',
    height: '100vh',
    overflow: 'hidden',
  },
  body: {
    display: 'grid',
    gridTemplateColumns: '280px minmax(0,1fr) 390px',
    gap: '18px',
    padding: '18px',
    minHeight: 0,
    overflow: 'hidden',
  },
  left: {
    padding: '18px',
    overflowY: 'auto',
    minHeight: 0,
  },
  right: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    padding: '14px',
    minHeight: 0,
    overflow: 'hidden',
  },
};
