'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNewTrip } from '@/components/NewTripProvider';

/** Eski /trips/new bağlantıları: modal aç, tam sayfa yerine Geziler’e dön. */
export default function NewTripDeepLinkPage() {
  const router = useRouter();
  const { openNewTrip } = useNewTrip();

  useEffect(() => {
    openNewTrip();
    router.replace('/trips', { scroll: false });
  }, [openNewTrip, router]);

  return null;
}
