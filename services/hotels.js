export async function fetchRealHotels(destination, checkIn, checkOut, options = {}) {
  try {
    const params = new URLSearchParams({
      destination: destination || 'istanbul',
      checkIn: checkIn || '',
      checkOut: checkOut || '',
      limit: '3',
    });
    if (options.lang) params.set('lang', String(options.lang));
    if (options.currency) params.set('currency', String(options.currency));

    const baseUrl = options.baseUrl || '';
    const res = await fetch(`${baseUrl}/api/hotels?${params.toString()}`);
    const data = await res.json();

    if (data.success && data.hotels.length > 0) {
      return data.hotels;
    }
    return null;
  } catch {
    return null;
  }
}
