'use client';

const SESSION_KEY = 'ta_session_id';

function getSessionId() {
  if (typeof window === 'undefined') return 'server';
  try {
    const existing = window.localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const next = window.crypto?.randomUUID?.() ?? `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(SESSION_KEY, next);
    return next;
  } catch {
    return `sess_${Date.now()}`;
  }
}

export async function trackEvent(event, meta = {}) {
  if (!event) return;
  const payload = {
    event,
    sessionId: getSessionId(),
    page: typeof window !== 'undefined' ? window.location.pathname : '',
    meta,
    ts: Date.now(),
  };

  try {
    const body = JSON.stringify(payload);
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon('/api/events', blob);
      return;
    }
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    });
  } catch {
    // telemetry never blocks UX
  }
}
