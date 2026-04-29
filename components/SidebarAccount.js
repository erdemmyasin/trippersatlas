'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronRight, LogOut, MoreHorizontal, Settings, User } from 'lucide-react';
import { AUTH_CHANGED, getCurrentUser, signOut } from '@/lib/authStore';

function initials(name) {
  if (!name || typeof name !== 'string') return '?';
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return '?';
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

export default function SidebarAccount({ expanded }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  function refresh() {
    setUser(getCurrentUser());
  }

  useEffect(() => {
    refresh();
    function onAuth() {
      refresh();
    }
    window.addEventListener(AUTH_CHANGED, onAuth);
    return () => window.removeEventListener(AUTH_CHANGED, onAuth);
  }, []);

  useEffect(() => {
    function onDoc(e) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', onDoc);
      document.addEventListener('touchstart', onDoc, { passive: true });
    }
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('touchstart', onDoc);
    };
  }, [open]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  function handleLogout() {
    setOpen(false);
    signOut();
    if (pathname.startsWith('/profil')) router.push('/');
  }

  const display = user?.displayName || 'Misafir';
  const letter = user ? initials(user.displayName) : '?';

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', marginTop: 0 }}>
      {open ? (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 8,
            right: 8,
            marginBottom: 8,
            background: '#FFFFFF',
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(35,28,18,.14)',
            border: '1px solid rgba(0,0,0,.08)',
            overflow: 'hidden',
            zIndex: 50,
          }}
        >
          {user ? (
            <>
              <Link
                href="/profil"
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 12px',
                  textDecoration: 'none',
                  borderBottom: '1px solid rgba(0,0,0,.06)',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'linear-gradient(145deg,#b8d4f0,#7eb3e8)',
                    color: '#1a3a5c',
                    fontWeight: 800,
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {letter}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 700,
                      fontSize: 14,
                      color: 'var(--ta-ink)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user.displayName}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 12,
                      color: 'var(--ta-ink-muted)',
                      marginTop: 2,
                    }}
                  >
                    Profili görüntüle
                  </div>
                </div>
                <ChevronRight size={18} color="var(--ta-ink-subtle)" />
              </Link>

              <MenuBtn
                icon={Settings}
                label="Hesap ayarları"
                href="/profil/ayarlar"
                onNavigate={() => setOpen(false)}
              />
              <div style={{ height: 1, background: 'rgba(0,0,0,.06)', margin: '4px 0' }} />
              <MenuBtn
                as="a"
                href="mailto:?subject=Atlas%20Geri%20bildirim"
                icon={null}
                label="Geri bildirim"
                onNavigate={() => setOpen(false)}
              />
              <MenuBtn
                icon={null}
                label="Gizlilik politikası"
                href="/gizlilik"
                onNavigate={() => setOpen(false)}
              />
              <MenuBtn
                icon={null}
                label="Kullanım şartları"
                href="/kullanim"
                onNavigate={() => setOpen(false)}
              />
              <div style={{ height: 1, background: 'rgba(0,0,0,.06)', margin: '4px 0' }} />
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#A84A4A',
                  textAlign: 'left',
                }}
              >
                <LogOut size={16} strokeWidth={2} />
                Çıkış yap
              </button>
            </>
          ) : (
            <>
              <div
                style={{
                  padding: '12px 12px 8px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  color: 'var(--ta-ink-muted)',
                  lineHeight: 1.4,
                }}
              >
                Planlarınızı ve tercihlerinizi kaydetmek için giriş yapın veya üye olun.
              </div>
              <Link
                href="/auth/giris"
                onClick={() => setOpen(false)}
                style={{
                  display: 'block',
                  margin: '0 8px 6px',
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: 'var(--ta-ink)',
                  color: '#fff',
                  textAlign: 'center',
                  textDecoration: 'none',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                Giriş yap
              </Link>
              <Link
                href="/auth/kayit"
                onClick={() => setOpen(false)}
                style={{
                  display: 'block',
                  margin: '0 8px 12px',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid rgba(0,0,0,.12)',
                  color: 'var(--ta-ink)',
                  textAlign: 'center',
                  textDecoration: 'none',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                Üye ol
              </Link>
            </>
          )}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: expanded ? 10 : 0,
          justifyContent: expanded ? 'flex-start' : 'center',
          padding: expanded ? '8px 10px' : '8px 0',
          borderRadius: 10,
          border: '1px solid rgba(0,0,0,.08)',
          background: open ? 'rgba(0,0,0,.04)' : 'rgba(0,0,0,.03)',
          cursor: 'pointer',
          boxSizing: 'border-box',
        }}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: user ? 'linear-gradient(145deg,#b8d4f0,#7eb3e8)' : 'rgba(0,0,0,.08)',
            color: user ? '#1a3a5c' : 'var(--ta-ink-muted)',
            fontWeight: 800,
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {user ? letter : <User size={16} strokeWidth={2} />}
        </div>
        {expanded ? (
          <>
            <span
              style={{
                flex: 1,
                minWidth: 0,
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--ta-ink)',
                textAlign: 'left',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {display}
            </span>
            <MoreHorizontal size={18} color="var(--ta-ink-muted)" style={{ flexShrink: 0 }} />
          </>
        ) : null}
      </button>
    </div>
  );
}

function MenuBtn({ icon: Icon, label, href, onNavigate, as }) {
  const style = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--ta-ink)',
    textAlign: 'left',
    textDecoration: 'none',
    boxSizing: 'border-box',
  };

  if (as === 'a') {
    return (
      <a href={href} style={style} onClick={onNavigate}>
        {Icon ? <Icon size={16} strokeWidth={2} /> : null}
        {label}
      </a>
    );
  }

  return (
    <Link href={href} style={style} onClick={onNavigate}>
      {Icon ? <Icon size={16} strokeWidth={2} /> : null}
      {label}
    </Link>
  );
}
