'use client';

import { Suspense } from 'react';
import ChatPlanWorkspace from '@/components/ChatPlanWorkspace';

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 200,
            color: 'var(--muted)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          Yükleniyor…
        </div>
      }
    >
      <ChatPlanWorkspace />
    </Suspense>
  );
}
