'use client';

import Header    from '@/components/Header';
import LeftPanel from '@/components/LeftPanel';
import ChatArea  from '@/components/ChatArea';
import RightPanel from '@/components/RightPanel';

export default function Page() {
  return (
    <div style={s.shell}>
      {/* ── Header ── */}
      <Header />

      {/* ── Body ── */}
      <div style={s.body}>
        {/* Sol Panel */}
        <aside style={s.left}>
          <LeftPanel />
        </aside>

        {/* Orta: Chat */}
        <ChatArea />

        {/* Sağ Panel */}
        <aside style={s.right}>
          <RightPanel />
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
