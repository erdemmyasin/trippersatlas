'use client';

import { LocaleCurrencyProvider } from '@/components/LocaleCurrencyContext';
import NewTripProvider from '@/components/NewTripProvider';

export default function AppProviders({ children, initialLang, initialRegion }) {
  return (
    <LocaleCurrencyProvider initialLang={initialLang} initialRegion={initialRegion}>
      <NewTripProvider>{children}</NewTripProvider>
    </LocaleCurrencyProvider>
  );
}
