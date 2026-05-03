import { loadAtlasPrefs } from '@/lib/atlasPrefs';

export async function callClaude(messages, planContext = {}) {
  const atlasPrefs =
    typeof window !== 'undefined' ? loadAtlasPrefs() : { lang: 'TR', currency: 'TRY' };
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, planContext, atlasPrefs }),
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  const json = await res.json();
  return json.data;
}
