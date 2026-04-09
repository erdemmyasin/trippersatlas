'use client';

const CHATS_KEY = 'ta_chats';
const ACTIVE_KEY = 'ta_active_chat';

export function getChats() {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(CHATS_KEY) || '[]'); }
  catch { return []; }
}

function persistChats(chats) {
  localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
}

export function saveChat(chat) {
  const chats = getChats();
  const idx = chats.findIndex(c => c.id === chat.id);
  const updated = { ...chat, updatedAt: Date.now() };
  if (idx >= 0) chats[idx] = updated;
  else chats.unshift(updated);
  persistChats(chats);
  return updated;
}

export function deleteChat(id) {
  persistChats(getChats().filter(c => c.id !== id));
}

export function getActiveId() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_KEY);
}

export function setActiveId(id) {
  if (id) localStorage.setItem(ACTIVE_KEY, id);
}

export function createChat(tripName) {
  return {
    id: `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: 'Başlıksız',
    tripName: tripName || null,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function deriveChatTitle(messages) {
  const firstUser = messages.find(m => m.role === 'user');
  if (!firstUser) return 'Başlıksız';
  const text = (firstUser.content || '').trim();
  if (text.length <= 40) return text;
  return text.slice(0, 37) + '...';
}
