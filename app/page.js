'use client';

import { useState } from 'react';
import Header          from '@/components/Header';
import LeftPanel       from '@/components/LeftPanel';
import LeftOverlayNav  from '@/components/LeftOverlayNav';
import ChatArea        from '@/components/ChatArea';
import RightPanel      from '@/components/RightPanel';

const TYPE_TO_CAT = {
  hotel: 'accommodation', villa: 'accommodation', clinic: 'accommodation',
  transfer: 'transport',  car: 'transport',
  tour: 'activities',     boat: 'activities',
  restaurant: 'extras',
};

const TYPE_TO_MODULE = {
  hotel: 'lodging', villa: 'lodging', clinic: 'lodging',
  transfer: 'transfer', car: 'transfer',
  tour: 'activities', boat: 'activities',
};

const EMPTY_BUDGET = { accommodation: 0, transport: 0, activities: 0, extras: 0 };

const DEFAULT_PILLS = [
  { id: 'dest',   icon: '📍', label: 'Destinasyon' },
  { id: 'dates',  icon: '📅', label: 'Tarih' },
  { id: 'pax',    icon: '👤', label: 'Kişi sayısı' },
  { id: 'budget', icon: '💰', label: 'Bütçe' },
];

export default function Page() {
  /* ── Nav drawer ── */
  const [navOpen, setNavOpen] = useState(false);

  /* ── Plan state ── */
  const [budget, setBudget]                     = useState(EMPTY_BUDGET);
  const [completedModules, setCompletedModules] = useState(new Set());
  const [selectedListings, setSelectedListings] = useState({});
  const [planPills, setPlanPills]               = useState(DEFAULT_PILLS);

  function handleListingSelect(listing) {
    const { type, price = 0, location = '' } = listing;

    const cat = TYPE_TO_CAT[type] ?? 'extras';
    setBudget(prev => ({ ...prev, [cat]: prev[cat] + Number(price) }));

    const modId = TYPE_TO_MODULE[type];
    if (modId) setCompletedModules(prev => new Set([...prev, modId]));

    setSelectedListings(prev => ({ ...prev, [listing.name]: true }));

    const city = location.split(/[,·\-]/)[0].trim();
    if (city) {
      setPlanPills(prev =>
        prev.map(p => p.id === 'dest' ? { ...p, icon: '📍', label: city } : p)
      );
    }
  }

  return (
    <div style={s.shell}>
      {/* Drawer nav — LeftPanel'in üstünde katman */}
      <LeftOverlayNav isOpen={navOpen} onClose={() => setNavOpen(false)} />

      <Header
        planPills={planPills}
        onMenuClick={() => setNavOpen(true)}
      />

      <div style={s.body}>
        {/* Sol Panel */}
        <aside className="ta-panel" style={s.left}>
          <LeftPanel completedModules={completedModules} />
        </aside>

        {/* Orta: Chat */}
        <ChatArea
          onListingSelect={handleListingSelect}
          selectedListings={selectedListings}
        />

        {/* Sağ Panel */}
        <aside className="ta-panel" style={s.right}>
          <RightPanel budget={budget} completedModules={completedModules} />
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
    display: 'grid',
    gridTemplateRows: '1fr auto auto',
    gap: '14px',
    padding: '14px',
    minHeight: 0,
    overflow: 'hidden',
  },
};
