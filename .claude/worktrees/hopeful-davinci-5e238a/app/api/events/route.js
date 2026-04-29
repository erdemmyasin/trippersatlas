import { promises as fs } from 'node:fs';
import path from 'node:path';

export const runtime = 'nodejs';

const DATA_DIR = path.join(process.cwd(), 'data');
const EVENTS_FILE = path.join(DATA_DIR, 'events.ndjson');

function toSafeString(v, fallback = '') {
  return typeof v === 'string' ? v : fallback;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const row = {
      event: toSafeString(body?.event, 'unknown.event'),
      sessionId: toSafeString(body?.sessionId, 'anon'),
      page: toSafeString(body?.page),
      meta: body?.meta && typeof body.meta === 'object' ? body.meta : {},
      ts: Number(body?.ts) || Date.now(),
      receivedAt: new Date().toISOString(),
      userAgent: req.headers.get('user-agent') ?? '',
      ip:
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        req.headers.get('x-real-ip') ??
        '',
    };

    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.appendFile(EVENTS_FILE, `${JSON.stringify(row)}\n`, 'utf8');

    return Response.json({ success: true });
  } catch (error) {
    console.error('[events] write failed:', error);
    return Response.json({ success: false }, { status: 400 });
  }
}
