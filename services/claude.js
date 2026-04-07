export async function callClaude(messages, planContext = {}) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, planContext }),
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  const json = await res.json();
  return json.data;
}
