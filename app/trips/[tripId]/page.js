import { Suspense } from 'react';
import TripWorkspaceClient from './TripWorkspaceClient';

function Loading() {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        color: 'var(--muted)',
        fontFamily: 'var(--font-sans)',
        background: 'var(--bg)',
      }}
    >
      Yükleniyor…
    </div>
  );
}

export default async function TripDetailPage({ params }) {
  const { tripId } = await params;
  return (
    <Suspense fallback={<Loading />}>
      <TripWorkspaceClient tripId={tripId} />
    </Suspense>
  );
}
