'use client';

import { use } from 'react';
import AppSidebar from '@/components/AppSidebar';
import CollectionDetail from '@/components/CollectionDetail';

export default function CollectionDetailPage({ params }) {
  // Next 15+: params is a Promise — `use()` ile aç
  const resolved = use(params);
  const id = String(resolved?.id || '');

  return (
    <div style={s.shell}>
      <AppSidebar activeId="saved" />
      <main style={s.main}>
        <CollectionDetail id={id} />
      </main>
    </div>
  );
}

const s = {
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
    overflowY: 'auto',
    overflowX: 'hidden',
  },
};
