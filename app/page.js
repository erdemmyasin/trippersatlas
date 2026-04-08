'use client';

import { useState } from 'react';
import Header     from '@/components/Header';
import LeftPanel  from '@/components/LeftPanel';
import ChatArea   from '@/components/ChatArea';
import RightPanel from '@/components/RightPanel';

/* Listing tipi → bütçe kategorisi (RightPanel'deki key'lerle eşleşmeli) */
const TYPE_TO_CAT = {
  hotel:      'accommodation',
  villa:      'accommodation',
  clinic:     'accommodation',
  transfer:   'transport',
  car:        'transport',
  tour:       'activities',
  boat:       'activities',
  restaurant: 'extras',
};

/* Listing tipi → sol panel modül id'si */
const TYPE_TO_MODULE = {
  hotel:    'lodging',
  villa:    'lodging',
  clinic:   'lodging',
  transfer: 'transfer',
  car:      'transfer',
  tour:     'activities',
  boat:     'activities',
};

const EMPTY_BUDGET = { accommodation: 0, transport: 0, activities: 0, extras: 0 };

const DEFAULT_PILLS = [
  { id: 'dest',   icon: '📍', label: 'Destinasyon seçin' },
  { id: 'dates',  icon: '📅', label: 'Tarih seçin' },
  { id: 'pax',    icon: '👤', label: 'Kişi sayısı' },
  { id: 'budget', icon: '💰', label: 'Bütçe seviyesi' },
];

export default function Page() {
  const [budget, setBudget]                 = useState(EMPTY_BUDGET);
  const [completedModules, setCompletedModules] = useState(new Set());
  const [selectedListings, setSelectedListings] = useState({});
  const [planPills, setPlanPills]           = useState(DEFAULT_PILLS);

  function handleListingSelect(listing) {
    const { type, price = 0, location = '' } = listing;

    /* 1 — Bütçe güncelle */
    const cat = TYPE_TO_CAT[type] ?? 'extras';
    setBudget(prev => ({ ...prev, [cat]: prev[cat] + Number(price) }));

    /* 2 — Sol panel modülünü tamamlandı işaretle */
    const modId = TYPE_TO_MODULE[type];
    if (modId) {
      setCompletedModules(prev => new Set([...prev, modId]));
    }

    /* 3 — Kartı seçildi olarak işaretle */
    setSelectedListings(prev => ({ ...prev, [listing.name]: true }));

    /* 4 — Header destinasyon pill'ini güncelle */
    const city = location.split(/[,·\-]/)[0].trim();
    if (city) {
      setPlanPills(prev =>
        prev.map(p => p.id === 'dest' ? { ...p, icon: '📍', label: city } : p)
      );
    }
  }

  return (
    <div style={s.shell}>
      <Header planPills={planPills} />

      <div style={s.body}>
        <aside style={s.left}>
          <LeftPanel completedModules={completedModules} />
        </aside>

        <ChatArea
          onListingSelect={handleListingSelect}
          selectedListings={selectedListings}
        />

        <aside style={s.right}>
          <RightPanel budget={budget} completedModules={completedModules} />
        </aside>
      </div>
    </div>
  );
}

const s = {
  shell: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: 'var(--bg)',
    overflow: 'hidden',
  },
  body: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  left: {
    width: '260px',
    flexShrink: 0,
    background: 'var(--surface)',
    borderRight: '1px solid var(--border)',
    overflowY: 'auto',
    padding: '16px 12px',
  },
  right: {
    width: '220px',
    flexShrink: 0,
    background: 'var(--surface)',
    borderLeft: '1px solid var(--border)',
    overflowY: 'auto',
    padding: '16px 12px',
  },
};
