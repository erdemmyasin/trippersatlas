'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AppSidebar from '@/components/AppSidebar';
import ActivitySearchScreen from '@/components/ActivitySearchScreen';
import ActivePlanBanner from '@/components/ActivePlanBanner';

function AktivitelerPageInner() {
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
        <div style={lay.fill}>
          <ActivitySearchScreen />
        </div>
      </main>
    </div>
  );
}

export default function AktivitelerPage() {
  return (
    <Suspense fallback={null}>
      <AktivitelerPageInner />
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
  fill: {
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
