import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt } from '@/lib/systemPrompt';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const FALLBACK = {
  message: 'Bir sorun oluştu, lütfen tekrar deneyin.',
  travelType: 'neutral',
  stage: 'purpose',
  language: 'tr',
  listings: [],
  proactive: [],
  localInsights: [],
  quickReplies: ['Tekrar dene', 'Başka bir şey sor'],
  budgetUpdate: { accommodation: 0, transport: 0, transfer: 0, activities: 0, extras: 0 },
};

export async function POST(req) {
  try {
    const { messages = [], planContext = {} } = await req.json();

    const systemPrompt = buildSystemPrompt(planContext);

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages: messages.map(({ role, content }) => ({ role, content })),
    });

    const raw = response.content?.[0]?.text ?? '';

    let parsed;
    try {
      // JSON yanıtı temizle (bazen ```json blokları gelebilir)
      const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      console.error('JSON parse hatası:', raw);
      return Response.json({ success: false, data: FALLBACK }, { status: 200 });
    }

    return Response.json({ success: true, data: parsed });
  } catch (err) {
    console.error('Chat API hatası:', err);
    return Response.json({ success: false, data: FALLBACK }, { status: 200 });
  }
}
