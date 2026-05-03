'use client';

import AppSidebar from '@/components/AppSidebar';
import QuickPlanComingSoonPane from '@/components/QuickPlanComingSoonPane';

export default function AktivitelerPage() {
  return (
    <div style={lay.shell}>
      <AppSidebar activeId="quickPlan" />
      <main style={lay.main}>
        <div style={lay.fill}>
          <QuickPlanComingSoonPane
            title="Aktiviteler"
            body="Burada yapılacaklar, giriş biletleri ve deneyim araması için ekranı konumlandıracağız. Tasarıma sonra geçeceğiz."
          />
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
