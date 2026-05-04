import { loadAtlasPrefs } from '@/lib/atlasPrefs';

export async function callClaude(messages, planContext = {}) {
  const atlasPrefs =
    typeof window !== 'undefined' ? loadAtlasPrefs() : { lang: 'TR', currency: 'TRY' };
  const explicitChoice =
    typeof window !== 'undefined' ? loadAtlasPrefs({ hasUserChoice: true }) : null;
  const userLang = explicitChoice?.lang || undefined;
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, planContext, atlasPrefs, userLang }),
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  const json = await res.json();
  return json.data;
}
