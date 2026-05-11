'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Bookmark,
  Briefcase,
  Copy,
  Heart,
  ListOrdered,
  MoreHorizontal,
  Pencil,
  PlusSquare,
  Star,
} from 'lucide-react';
import AppSidebar from '@/components/AppSidebar';
import ProfileTripsGrid from '@/components/ProfileTripsGrid';
import { AUTH_CHANGED, getCurrentUser } from '@/lib/authStore';
import { getTrips } from '@/lib/tripStore';

function initials(name) {
  if (!name || typeof name !== 'string') return '?';
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return '?';
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

function handleFromEmail(email) {
  if (!email) return 'gezgin';
  const local = String(email).split('@')[0] || 'gezgin';
  return local.replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase() || 'gezgin';
}

const TABS = [
  { id: 'trips', label: 'Geziler', icon: Briefcase, count: 0 },
  { id: 'collections', label: 'Koleksiyonlar', icon: Heart, count: 0 },
  { id: 'reviews', label: 'Değerlendirmeler', icon: Star, count: 0 },
  { id: 'guides', label: 'Rehberler', icon: ListOrdered, count: 0 },
];

export default function ProfilPage() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('trips');
  const [tripCount, setTripCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState('');
  const menuRef = useRef(null);

  function refresh() {
    setUser(getCurrentUser());
    try {
      setTripCount(getTrips().length);
    } catch {
      setTripCount(0);
    }
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
      if (!menuRef.current?.contains(e.target)) setMenuOpen(false);
    }
    if (menuOpen) {
      document.addEventListener('mousedown', onDoc);
      document.addEventListener('touchstart', onDoc, { passive: true });
    }
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('touchstart', onDoc);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  function copyProfileLink() {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/profil` : '';
    if (url && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setToast('Profil linki kopyalandı.');
        setMenuOpen(false);
      });
    }
  }

  const handle = user ? `@${handleFromEmail(user.email)}` : '@misafir';
  const letter = user ? initials(user.displayName) : '?';

  return (
    <div style={{ display: 'flex', height: '100vh', minHeight: 0, overflow: 'hidden' }}>
      <AppSidebar activeId="profil" />
      <main
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          overflowY: 'auto',
          background: 'var(--surface, #fff)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        {toast ? (
          <div
            style={{
              position: 'fixed',
              top: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 100,
              padding: '10px 18px',
              borderRadius: 12,
              background: 'var(--ta-ink)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              boxShadow: 'var(--shadow-md, 0 8px 24px rgba(0,0,0,.12))',
            }}
          >
            {toast}
          </div>
        ) : null}

        <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 64px' }}>
          {!user ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 20px',
                borderRadius: varR,
                border: '1px solid var(--line, rgba(0,0,0,.08))',
                background: 'var(--surface2, #f4f1ea)',
              }}
            >
              <div
                style={{
                  width: 88,
                  height: 88,
                  margin: '0 auto 20px',
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  fontWeight: 800,
                  color: 'var(--ta-ink-muted)',
                }}
              >
                ?
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--ta-ink)', marginBottom: 8 }}>
                Profilinizi görüntüleyin
              </h1>
              <p style={{ fontSize: 15, color: 'var(--ta-ink-muted)', marginBottom: 24, lineHeight: 1.5 }}>
                Koleksiyonlar, değerlendirmeler ve rehberleriniz burada listelenir.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                <Link href="/auth/giris" style={btnPrimary}>
                  Giriş yap
                </Link>
                <Link href="/auth/kayit" style={btnGhost}>
                  Üye ol
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Üst başlık */}
              <header
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 20,
                  marginBottom: 28,
                  flexWrap: 'wrap',
                }}
              >
                <div
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: '50%',
                    background: 'linear-gradient(145deg,#c8e0f5,#8ebfe8)',
                    color: '#1a3a5c',
                    fontWeight: 800,
                    fontSize: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 8px 28px rgba(35,28,18,.08)',
                  }}
                >
                  {letter}
                </div>
                <div style={{ flex: 1, minWidth: 200, paddingTop: 4 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <div>
                      <h1
                        style={{
                          margin: 0,
                          fontSize: 22,
                          fontWeight: 800,
                          color: 'var(--ta-ink)',
                          letterSpacing: '-0.02em',
                        }}
                      >
                        {handle}
                      </h1>
                      <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--ta-ink-muted)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--ta-ink)' }}>0</span> takip ·{' '}
                        <span style={{ fontWeight: 600, color: 'var(--ta-ink)' }}>0</span> takipçi
                      </p>
                      <p
                        style={{
                          margin: '10px 0 0',
                          fontSize: 15,
                          color: 'var(--ta-ink)',
                          fontWeight: 500,
                        }}
                      >
                        {user.displayName}
                      </p>
                    </div>
                    <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => setMenuOpen((v) => !v)}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          border: '1px solid rgba(0,0,0,.1)',
                          background: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                        aria-expanded={menuOpen}
                        aria-label="Profil menüsü"
                      >
                        <MoreHorizontal size={20} color="var(--ta-ink)" />
                      </button>
                      {menuOpen ? (
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: 6,
                            minWidth: 200,
                            background: '#fff',
                            borderRadius: 12,
                            border: '1px solid rgba(0,0,0,.08)',
                            boxShadow: '0 12px 40px rgba(35,28,18,.12)',
                            padding: 6,
                            zIndex: 40,
                          }}
                        >
                          <Link
                            href="/profil/ayarlar"
                            onClick={() => setMenuOpen(false)}
                            style={menuItem}
                          >
                            <Pencil size={16} strokeWidth={2} color="var(--ta-ink)" />
                            Profili düzenle
                          </Link>
                          <button type="button" onClick={copyProfileLink} style={menuItemBtn}>
                            <Copy size={16} strokeWidth={2} color="var(--ta-ink)" />
                            Linki kopyala
                          </button>
                          <Link href="/inspire" onClick={() => setMenuOpen(false)} style={menuItem}>
                            <PlusSquare size={16} strokeWidth={2} color="var(--ta-ink)" />
                            İçerik oluştur
                          </Link>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </header>

              {/* Sekmeler */}
              <div
                style={{
                  display: 'flex',
                  gap: 4,
                  borderBottom: '1px solid rgba(0,0,0,.08)',
                  marginBottom: 36,
                  overflowX: 'auto',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                {TABS.map((t) => {
                  const Icon = t.icon;
                  const active = tab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTab(t.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '12px 4px 14px',
                        marginRight: 20,
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: 14,
                        fontWeight: active ? 700 : 500,
                        color: active ? 'var(--ta-ink)' : 'var(--ta-ink-muted)',
                        whiteSpace: 'nowrap',
                        borderBottom: active ? '3px solid var(--ta-accent-deep, #2f3f52)' : '3px solid transparent',
                        marginBottom: -1,
                      }}
                    >
                      <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                      {t.label}{' '}
                      <span style={{ opacity: 0.75 }}>
                        {t.id === 'trips' ? tripCount : t.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Geziler */}
              {tab === 'trips' && <ProfileTripsGrid />}

              {/* Boş durumlar */}
              {tab === 'collections' && (
                <EmptyBlock
                  iconGrad="linear-gradient(135deg, #2f8f6b 0%, #3d8bc4 100%)"
                  iconInner={<Bookmark size={22} color="#fff" strokeWidth={2} />}
                  smallHeart
                  title="Henüz herkese açık koleksiyon yok"
                  subtitle="Kaydettiğiniz yerleri koleksiyon halinde paylaşmak için Keşfet veya Kaydedilenler’den başlayın."
                  action={
                    <Link href="/saved" style={btnPrimary}>
                      Kaydedilenlere git
                    </Link>
                  }
                />
              )}
              {tab === 'reviews' && (
                <EmptyBlock
                  iconGrad="linear-gradient(135deg, #4a6278 0%, #7a94ad 100%)"
                  iconInner={<Star size={22} color="var(--ta-ink)" strokeWidth={2} fill="rgba(26,25,22,.15)" />}
                  title="Değerlendirme yok"
                  subtitle="Konaklama ve mekân deneyimlerinizi paylaştığınızda burada görünecek."
                  action={
                    <Link href="/explore" style={btnPrimary}>
                      Keşfet
                    </Link>
                  }
                />
              )}
              {tab === 'guides' && (
                <EmptyBlock
                  iconGrad="linear-gradient(135deg, #8ebfe8 0%, #4a6278 100%)"
                  iconInner={<ListOrdered size={22} color="#fff" strokeWidth={2} />}
                  title="Rehber yayınlamadınız"
                  subtitle="Rota, mekân veya blog tarzı rehber oluşturup toplulukla paylaşın."
                  action={
                    <Link href="/inspire" style={btnPrimary}>
                      İlham Ol
                    </Link>
                  }
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function EmptyBlock({ iconGrad, iconInner, smallHeart, title, subtitle, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '12px 8px 40px' }}>
      <div
        style={{
          width: 88,
          height: 88,
          margin: '0 auto 22px',
          borderRadius: '50%',
          background: iconGrad,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          boxShadow: '0 12px 32px rgba(35,28,18,.1)',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'rgba(255,255,255,.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)',
          }}
        >
          {iconInner}
        </div>
        {smallHeart ? (
          <span
            style={{
              position: 'absolute',
              bottom: 10,
              right: 14,
              display: 'inline-flex',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.15))',
            }}
            aria-hidden
          >
            <Heart size={14} fill="rgba(255,255,255,.95)" stroke="rgba(255,255,255,.95)" strokeWidth={1.5} />
          </span>
        ) : null}
      </div>
      <h2
        style={{
          margin: '0 0 10px',
          fontSize: 20,
          fontWeight: 800,
          color: 'var(--ta-ink)',
          lineHeight: 1.3,
        }}
      >
        {title}
      </h2>
      <p
        style={{
          margin: '0 auto 24px',
          maxWidth: 400,
          fontSize: 15,
          color: 'var(--ta-ink-muted)',
          lineHeight: 1.55,
        }}
      >
        {subtitle}
      </p>
      {action}
    </div>
  );
}

const varR = 16;

const btnPrimary = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px 22px',
  borderRadius: 999,
  background: 'var(--ta-ink)',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: 14,
  border: 'none',
  cursor: 'pointer',
};

const btnGhost = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px 22px',
  borderRadius: 999,
  border: '1px solid rgba(0,0,0,.12)',
  color: 'var(--ta-ink)',
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: 14,
};

const menuItem = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  textDecoration: 'none',
  fontSize: 14,
  fontWeight: 500,
  color: 'var(--ta-ink)',
  boxSizing: 'border-box',
};

const menuItemBtn = {
  ...menuItem,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontFamily: 'inherit',
  textAlign: 'left',
};
