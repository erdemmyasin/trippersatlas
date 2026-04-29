'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import AppSidebar      from '@/components/AppSidebar';
import Header          from '@/components/Header';
import LeftPanel       from '@/components/LeftPanel';
import ChatArea        from '@/components/ChatArea';
import RightPanel      from '@/components/RightPanel';
import { trackEvent }  from '@/lib/analytics';
import { getChats, saveChat, saveChatListings, getActiveId, setActiveId, createChat, deriveChatTitle } from '@/lib/chatStore';

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


export default function ChatPage() {
  /* ── Chat persistence ── */
  const [chatList, setChatList]     = useState([]);
  const [activeChat, setActiveChat] = useState(null);

  useEffect(() => {
    const chats = getChats();
    setChatList(chats);
    const savedId = getActiveId();
    const found = chats.find(c => c.id === savedId);
    if (found) {
      setActiveChat(found);
      if (found.selectedListings && typeof found.selectedListings === 'object') {
        setSelectedListings(found.selectedListings);
        /* Bütçeyi seçili listinglerden yeniden hesapla */
        const restored = Object.values(found.selectedListings);
        if (restored.length) {
          const budgetMap = { accommodation: 0, transport: 0, activities: 0, extras: 0 };
          restored.forEach(l => {
            const cat = TYPE_TO_CAT[l.type] ?? 'extras';
            budgetMap[cat] = (budgetMap[cat] || 0) + Number(l.price || 0);
          });
          setBudget(budgetMap);
          const mods = new Set(
            restored.map(l => TYPE_TO_MODULE[l.type]).filter(Boolean)
          );
          setCompletedModules(mods);
        }
      }
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
    const fresh = createChat();
    saveChat(fresh);
    setActiveId(fresh.id);
    setActiveChat(fresh);
    setChatList(getChats());
    trackEvent('chat.new');
  }

  /* ── Plan state ── */
  const [activePlanId,  setActivePlanId]  = useState('active');
  const [planName,      setPlanName]      = useState('Yeni Seyahat Planı');
  const [budget,        setBudget]        = useState(EMPTY_BUDGET);
  const [completedModules, setCompletedModules] = useState(new Set());
  const [selectedListings, setSelectedListings] = useState({});
  const [tripMeta, setTripMeta]         = useState(INITIAL_TRIP_META);
  const [assistantSignal, setAssistantSignal] = useState(null);

  const handleAssistantResponse = useCallback((data) => {
    if (!data || typeof data !== 'object') return;
    setAssistantSignal({
      _t: Date.now(),
      stage: data.stage,
      budgetUpdate: data.budgetUpdate,
      listings: data.listings,
      travelType: data.travelType,
    });
  }, []);

  function handlePlanNameChange(name) {
    setPlanName(name);
    trackEvent('plan.rename', { name });
  }

  function handleActivateStoredTrip(trip) {
    if (!trip) return;
    setActivePlanId(String(trip.id));
    setPlanName(trip.name || 'Yeni Seyahat Planı');
    setTripMeta((prev) => ({
      ...prev,
      destination: trip.destination || prev.destination,
      budget: typeof trip.budget === 'string' ? trip.budget : prev.budget,
    }));
    trackEvent('plan.switch', { planId: trip.id, name: trip.name });
  }

  function handleListingSelect(listing) {
    const { type, price = 0, location = '' } = listing;
    const cat = TYPE_TO_CAT[type] ?? 'extras';
    setBudget(prev => ({ ...prev, [cat]: prev[cat] + Number(price) }));
    const modId = TYPE_TO_MODULE[type];
    if (modId) setCompletedModules(prev => new Set([...prev, modId]));
    setSelectedListings(prev => {
      const next = { ...prev, [listing.name]: listing };
      saveChatListings(activeChatRef.current?.id, next);
      return next;
    });
    const city = location.split(/[,·\-]/)[0].trim();
    if (city) setTripMeta(prev => ({ ...prev, destination: city }));
    trackEvent('listing.select', { name: listing.name, type, location, price: Number(price) || 0 });
  }

  function handleListingDeselect(listing) {
    const { type, price = 0, name } = listing;
    const cat   = TYPE_TO_CAT[type] ?? 'extras';
    const modId = TYPE_TO_MODULE[type];
    setBudget(prev => ({ ...prev, [cat]: Math.max(0, prev[cat] - Number(price)) }));
    setSelectedListings(prev => {
      const next = { ...prev };
      delete next[name];
      if (modId) {
        const still = Object.values(next).some(l => TYPE_TO_MODULE[l.type] === modId);
        if (!still) setCompletedModules(pm => { const a = new Set(pm); a.delete(modId); return a; });
      }
      saveChatListings(activeChatRef.current?.id, next);
      return next;
    });
    trackEvent('listing.remove', { name, type, price: Number(price) || 0 });
  }

  const planContext = useMemo(() => ({
    destination:     tripMeta.destination || '',
    nights:          tripMeta.nights      || 0,
    month:           tripMeta.month       || '',
    travelers:       tripMeta.travelers   || null,
    budget:          tripMeta.budget      || '',
    travelType:      tripMeta.travelType  || '',
    datesChipText:   tripMeta.datesChipText || '',
    selectedListings,
  }), [tripMeta, selectedListings]);

  function buildSubtitle() {
    return tripMeta.destination || 'Taslak plan';
  }

  return (
    <div style={s.shell}>
      <AppSidebar activeId="chats" />

      <div className="main-layout" style={s.main}>
        <Header
          planName={planName}
          tripMeta={tripMeta}
          onTripMetaChange={setTripMeta}
          assistantSignal={assistantSignal}
          activePlanId={activePlanId}
          onActivateStoredTrip={handleActivateStoredTrip}
        />

        <div className="content-area">
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

          <div style={s.center}>
            <ChatArea
              chatId={activeChat?.id}
              initialMessages={activeChat?.messages}
              onMessagesChange={handleMessagesChange}
              onAssistantResponse={handleAssistantResponse}
              onListingSelect={handleListingSelect}
              onListingDeselect={handleListingDeselect}
              selectedListings={selectedListings}
              planContext={planContext}
            />
          </div>

          <aside className="ta-panel" style={s.right}>
            <RightPanel completedModules={completedModules} />
          </aside>
        </div>
      </div>
    </div>
  );
}

const s = {
  shell: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
    background: 'var(--bg)',
  },
  main: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    overflow: 'hidden',
  },
  left: {
    width: 260,
    flexShrink: 0,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    overflow: 'hidden',
    padding: '18px',
    boxSizing: 'border-box',
  },
  center: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  right: {
    width: 360,
    flexShrink: 0,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    padding: '14px',
    boxSizing: 'border-box',
    minHeight: 0,
    overflowY: 'auto',
  },
};
