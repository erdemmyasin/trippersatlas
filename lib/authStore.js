'use client';

const SESSION_KEY = 'ta_auth_session';
const USERS_KEY = 'ta_auth_users';

export const AUTH_CHANGED = 'taAuthChanged';

function dispatchAuth() {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new Event(AUTH_CHANGED));
  } catch {
    /* ignore */
  }
}

async function digestPassword(password) {
  const enc = new TextEncoder().encode(String(password));
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function readUsers() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return {};
    const o = JSON.parse(raw);
    return o && typeof o === 'object' ? o : {};
  } catch {
    return {};
  }
}

function saveUsers(users) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    throw new Error('Kayıt alanı dolu veya tarayıcı engelliyor.');
  }
}

/** Oturum özeti (şifre yok) */
export function getSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || typeof s.email !== 'string') return null;
    return { email: s.email, userId: s.userId };
  } catch {
    return null;
  }
}

/** Tam kullanıcı kaydı (şifre özeti dahil — yalnızca sunucu tarafında kullanılmalı; istemcide dikkatli) */
export function getUserRecord(email) {
  const users = readUsers();
  return users[String(email).toLowerCase().trim()] || null;
}

/** Arayüz için güvenli kullanıcı (şifre yok) */
export function getCurrentUser() {
  const s = getSession();
  if (!s) return null;
  const u = getUserRecord(s.email);
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    createdAt: u.createdAt,
  };
}

/**
 * @param {{ email: string, displayName: string, password: string }} input
 */
export async function signUp({ email, displayName, password }) {
  const em = String(email).toLowerCase().trim();
  const name = String(displayName).trim();
  if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
    throw new Error('Geçerli bir e-posta girin.');
  }
  if (name.length < 2) throw new Error('Ad en az 2 karakter olmalı.');
  if (String(password).length < 6) throw new Error('Şifre en az 6 karakter olmalı.');

  const users = readUsers();
  if (users[em]) throw new Error('Bu e-posta ile zaten kayıt var.');

  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `u_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const passwordHash = await digestPassword(password);

  users[em] = {
    id,
    email: em,
    displayName: name,
    passwordHash,
    createdAt: Date.now(),
  };
  saveUsers(users);

  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: id, email: em }));
  } catch {
    throw new Error('Oturum kaydedilemedi.');
  }
  dispatchAuth();
}

/**
 * @param {{ email: string, password: string }} input
 */
export async function signIn({ email, password }) {
  const em = String(email).toLowerCase().trim();
  const u = getUserRecord(em);
  if (!u) throw new Error('E-posta veya şifre hatalı.');
  const h = await digestPassword(password);
  if (h !== u.passwordHash) throw new Error('E-posta veya şifre hatalı.');
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: u.id, email: em }));
  } catch {
    throw new Error('Oturum kaydedilemedi.');
  }
  dispatchAuth();
}

export function signOut() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
  dispatchAuth();
}

export async function updateProfile({ displayName }) {
  const s = getSession();
  if (!s) throw new Error('Oturum yok.');
  const name = String(displayName).trim();
  if (name.length < 2) throw new Error('Ad en az 2 karakter olmalı.');
  const users = readUsers();
  const u = users[s.email];
  if (!u) throw new Error('Kullanıcı bulunamadı.');
  users[s.email] = { ...u, displayName: name };
  saveUsers(users);
  dispatchAuth();
}
