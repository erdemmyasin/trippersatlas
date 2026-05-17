'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AppSidebar from '@/components/AppSidebar';
import StaySearchScreen from '@/components/StaySearchScreen';
import ActivePlanBanner from '@/components/ActivePlanBanner';

function StayPageInner() {
  const sp = useSearchParams();
  const planId = sp?.get('planId') || null;
  return (
    <div style={lay.shell}>
      <AppSidebar activeId="quickPlan" />
      <main style={lay.main}>
        {planId ? (
          <div style={lay.bannerWrap}>
            <ActivePlanBanner tripId={planId} />
          </div>
        ) : null}
        <div style={lay.stayFill}>
          <StaySearchScreen />
        </div>
      </main>
    </div>
  );
}

export default function StayPage() {
  return (
    <Suspense fallback={null}>
      <StayPageInner />
    </Suspense>
  );
}

const lay = {
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
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  stayFill: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  bannerWrap: {
    flexShrink: 0,
    padding: '12px clamp(16px, 3vw, 32px) 0',
  },
};
