'use client';

const CHATS_KEY = 'ta_chats';
const CHATS_META_KEY = 'ta_chats_meta';
const CHAT_MSG_PREFIX = 'ta_chat_msgs_';
const ACTIVE_KEY = 'ta_active_chat';
export const UI_LAST_KEY = 'ta_last_active_ui';

function chatMsgKey(id) {
  return `${CHAT_MSG_PREFIX}${String(id)}`;
}

function nowIso() {
  return new Date().toISOString();
}

/** @param {number|string|Date} v */
function toIso(v) {
  if (v == null) return nowIso();
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return v;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? nowIso() : d.toISOString();
}

function migrateLegacyIfNeeded() {
  if (typeof window === 'undefined') return;
  try {
    if (localStorage.getItem(CHATS_META_KEY)) return;
    const raw = localStorage.getItem(CHATS_KEY);
    if (!raw) return;
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return;
    const metas = [];
    for (const c of arr) {
      if (!c || c.id == null) continue;
      const id = String(c.id);
      const createdAt = toIso(c.createdAt);
      const updatedAt = toIso(c.updatedAt ?? c.createdAt);
      metas.push({
        id: c.id,
        title: c.title || 'Başlıksız',
        tripName: c.tripName ?? null,
        tripId: c.tripId != null ? String(c.tripId) : null,
        createdAt,
        updatedAt,
      });
      const stored = messagesToStorageFormat(c.messages || [], null);
      localStorage.setItem(chatMsgKey(id), JSON.stringify(stored));
    }
    localStorage.setItem(CHATS_META_KEY, JSON.stringify(metas));
  } catch {
    /* ignore */
  }
}

/** UI (assistant) → depolama (ai) */
export function messagesToStorageFormat(msgs, prevStored) {
  if (!Array.isArray(msgs)) return [];
  return msgs.map((m, i) => {
    const prev = Array.isArray(prevStored) ? prevStored[i] : null;
    const role =
      m.role === 'assistant' || m.role === 'ai' ? 'ai' : 'user';
    return {
      role,
      content: String(m.content ?? ''),
      timestamp: prev?.timestamp || nowIso(),
      listings: m.listings ?? [],
      quickReplies: m.quickReplies ?? [],
      proactive: m.proactive ?? [],
      localInsights: m.localInsights ?? [],
    };
  });
}

/** Depolama → ChatArea (assistant) — eski kayıtlarda role: 'assistant' olabilir */
export function messagesFromStorage(msgs) {
  if (!Array.isArray(msgs)) return [];
  return msgs.map((m) => ({
    role: m.role === 'ai' || m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.content ?? ''),
    listings: m.listings ?? [],
    quickReplies: m.quickReplies ?? [],
    proactive: m.proactive ?? [],
    localInsights: m.localInsights ?? [],
  }));
}

function readMetaList() {
  migrateLegacyIfNeeded();
  try {
    const raw = localStorage.getItem(CHATS_META_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeMetaList(metas) {
  localStorage.setItem(CHATS_META_KEY, JSON.stringify(metas));
}

function readStoredMessages(id) {
  try {
    const raw = localStorage.getItem(chatMsgKey(String(id)));
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeStoredMessages(id, storageMsgs) {
  localStorage.setItem(chatMsgKey(String(id)), JSON.stringify(storageMsgs));
}

/** Sidebar: sadece özet (mesaj yok) — hızlı */
export function listChatMetas() {
  return readMetaList();
}

/** Tam sohbet (mesajlar dahil) */
export function getChat(id) {
  if (id == null) return null;
  const sid = String(id);
  const meta = readMetaList().find((c) => String(c.id) === sid);
  if (!meta) return null;
  const stored = readStoredMessages(sid);
  return {
    id: meta.id,
    title: meta.title || 'Başlıksız',
    tripName: meta.tripName ?? null,
    tripId: meta.tripId != null ? String(meta.tripId) : null,
    createdAt: meta.createdAt,
    updatedAt: meta.updatedAt,
    filterSnapshot: meta.filterSnapshot ?? null,
    archived: !!meta.archived,
    messages: messagesFromStorage(stored),
  };
}

/** Geriye dönük: tüm sohbetleri mesajlarıyla döndürür (az sayıda kayıt için) */
export function getChats() {
  return readMetaList()
    .map((m) => getChat(m.id))
    .filter(Boolean);
}

export function saveChat(chat) {
  if (!chat || chat.id == null) return null;
  const sid = String(chat.id);
  const existing = getChat(chat.id);
  const prevStored = readStoredMessages(sid);
  const uiMessages =
    chat.messages !== undefined ? chat.messages : existing?.messages ?? [];
  const storageMsgs = messagesToStorageFormat(uiMessages, prevStored);
  const title =
    chat.title !== undefined
      ? chat.title
      : existing?.title || deriveChatTitle(uiMessages);
  const tripName =
    chat.tripName !== undefined ? chat.tripName : existing?.tripName ?? null;
  const tripId =
    chat.tripId !== undefined
      ? chat.tripId != null
        ? String(chat.tripId)
        : null
      : existing?.tripId ?? null;
  const filterSnapshot =
    chat.filterSnapshot !== undefined
      ? chat.filterSnapshot
      : existing?.filterSnapshot ?? null;
  const archived =
    chat.archived !== undefined ? !!chat.archived : !!existing?.archived;
  const createdAt = toIso(
    chat.createdAt !== undefined ? chat.createdAt : existing?.createdAt ?? Date.now()
  );
  const updatedAt = nowIso();

  const metas = readMetaList();
  const idx = metas.findIndex((c) => String(c.id) === sid);
  const row = {
    id: chat.id,
    title,
    tripName,
    tripId,
    filterSnapshot,
    archived,
    createdAt,
    updatedAt,
  };
  if (idx >= 0) metas[idx] = row;
  else metas.unshift(row);
  writeMetaList(metas);
  writeStoredMessages(sid, storageMsgs);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('chatsUpdated'));
  }
  return getChat(chat.id);
}

export function deleteChat(id) {
  const sid = String(id);
  try {
    localStorage.removeItem(chatMsgKey(sid));
  } catch {
    /* ignore */
  }
  const metas = readMetaList().filter((c) => String(c.id) !== sid);
  writeMetaList(metas);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('chatsUpdated'));
  }
}

/** Sohbeti arşivler; yan panel listesinde gizlenir (veri silinmez). */
export function setChatArchived(id, archived = true) {
  if (id == null) return;
  const sid = String(id);
  const metas = readMetaList();
  const idx = metas.findIndex((c) => String(c.id) === sid);
  if (idx < 0) return;
  metas[idx] = { ...metas[idx], archived: !!archived };
  writeMetaList(metas);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('chatsUpdated'));
  }
}

export function getActiveId() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_KEY);
}

export function setActiveId(id) {
  if (id) {
    try {
      localStorage.setItem(ACTIVE_KEY, String(id));
    } catch {
      /* ignore */
    }
  }
}

export function getLastUiContext() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(UI_LAST_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (o && (o.mode === 'chat' || o.mode === 'trip') && o.id != null) return o;
  } catch {
    /* ignore */
  }
  return null;
}

export function setLastUiContext(mode, id) {
  if (typeof window === 'undefined' || id == null) return;
  try {
    localStorage.setItem(
      UI_LAST_KEY,
      JSON.stringify({ mode, id: String(id) })
    );
  } catch {
    /* ignore */
  }
}

/**
 * @param {string | { tripName?: string | null; tripId?: string | null } | null | undefined} arg
 * Eski kullanım: createChat('İsim') veya createChat().
 */
export function createChat(arg) {
  let tripName = null;
  let tripId = null;
  if (typeof arg === 'string') {
    tripName = arg.trim() || null;
  } else if (arg != null && typeof arg === 'object') {
    if (arg.tripName != null) tripName = String(arg.tripName).trim() || null;
    if (arg.tripId != null) tripId = String(arg.tripId);
  }
  const id = `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const t = nowIso();
  return {
    id,
    title: 'Başlıksız',
    tripName,
    tripId,
    messages: [],
    createdAt: t,
    updatedAt: t,
  };
}

/** Belirli bir geziye bağlı sohbet özetleri (meta, yeniden eskiye) */
export function listChatsForTrip(tripId) {
  if (tripId == null) return [];
  const sid = String(tripId);
  return readMetaList()
    .filter((m) => m.tripId != null && String(m.tripId) === sid && !m.archived)
    .sort((a, b) => {
      const ta = new Date(a.updatedAt || 0).getTime();
      const tb = new Date(b.updatedAt || 0).getTime();
      return tb - ta;
    });
}

/** İlk kullanıcı mesajından başlık — en fazla 30 karakter */
export function deriveChatTitle(messages) {
  const firstUser = Array.isArray(messages)
    ? messages.find((m) => m.role === 'user')
    : null;
  if (!firstUser) return 'Başlıksız';
  const text = String(firstUser.content || '').trim();
  if (text.length <= 30) return text || 'Başlıksız';
  return text.slice(0, 27) + '...';
}
