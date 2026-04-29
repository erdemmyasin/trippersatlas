'use client';

import { LocaleCurrencyProvider } from '@/components/LocaleCurrencyContext';
import NewTripProvider from '@/components/NewTripProvider';

export default function AppProviders({ children }) {
  return (
    <LocaleCurrencyProvider>
      <NewTripProvider>{children}</NewTripProvider>
    </LocaleCurrencyProvider>
  );
}
