'use client';

import { useEffect, useState } from 'react';
import { Plus, BookmarkPlus } from 'lucide-react';
import AppSidebar from '@/components/AppSidebar';
import CollectionsGrid from '@/components/CollectionsGrid';
import CreateCollectionModal from '@/components/CreateCollectionModal';
import EmptyState from '@/components/EmptyState';
import { listCollections, subscribeCollections } from '@/lib/savedCollections';

export default function SavedPage() {
  const [collections, setCollections] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    setCollections(listCollections());
    const unsub = subscribeCollections((next) => setCollections(next));
    return unsub;
  }, []);

  function refresh() {
    setCollections(listCollections());
  }

  return (
    <div style={s.shell}>
      <AppSidebar activeId="saved" />
      <main style={s.main}>
        <div style={s.inner}>
          <header style={s.head}>
            <div>
              <h1 style={s.title}>Koleksiyonlar</h1>
              <p style={s.sub}>Beğendiğin yerleri listelere ayır, planla, paylaş.</p>
            </div>
            <button type="button" style={s.primaryBtn} onClick={() => setCreateOpen(true)}>
              <Plus size={16} strokeWidth={2.4} />
              Yeni koleksiyon
            </button>
          </header>

          {collections.length === 0 ? (
            <EmptyState
              icon={BookmarkPlus}
              title="Henüz koleksiyon yok"
              description="İlk koleksiyonunu oluştur ve kaydettiğin yerleri burada düzenle."
              action={
                <button
                  type="button"
                  style={s.primaryBtn}
                  onClick={() => setCreateOpen(true)}
                >
                  <Plus size={16} strokeWidth={2.4} />
                  Yeni koleksiyon
                </button>
              }
            />
          ) : (
            <CollectionsGrid collections={collections} onChange={refresh} />
          )}
        </div>
      </main>

      <CreateCollectionModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={refresh}
      />
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
  inner: {
    maxWidth: 1180,
    margin: '0 auto',
    padding: 'var(--space-7) var(--space-6) var(--space-9)',
    boxSizing: 'border-box',
  },
  head: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 'var(--space-4)',
    marginBottom: 'var(--space-7)',
    flexWrap: 'wrap',
  },
  title: {
    margin: 0,
    fontFamily: 'var(--font-serif)',
    fontWeight: 'var(--fw-bold)',
    fontSize: 'var(--text-3xl)',
    lineHeight: 'var(--text-3xl-lh)',
    color: 'var(--ta-ink)',
    letterSpacing: '-0.02em',
  },
  sub: {
    margin: 'var(--space-1) 0 0',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-md)',
    color: 'var(--ta-ink-muted)',
  },
  primaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-3) var(--space-5)',
    borderRadius: 'var(--radius-pill)',
    border: 'none',
    background: 'var(--ta-ink)',
    color: '#fff',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-md)',
    fontWeight: 'var(--fw-bold)',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'opacity var(--duration-fast) var(--ease-out)',
  },
};
