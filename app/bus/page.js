'use client';

import AppSidebar from '@/components/AppSidebar';
import BusSearchScreen from '@/components/BusSearchScreen';

export default function BusPage() {
  return (
    <div style={lay.shell}>
      <AppSidebar activeId="quickPlan" />
      <main style={lay.main}>
        <div style={lay.fill}>
          <BusSearchScreen />
        </div>
      </main>
    </div>
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
};
