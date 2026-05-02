'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import AppSidebar from '@/components/AppSidebar';
import { AUTH_CHANGED, getCurrentUser, signOut, updateProfile } from '@/lib/authStore';

export default function ProfilAyarlarPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [savedMsg, setSavedMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  function refresh() {
    const u = getCurrentUser();
    setUser(u);
    setName(u?.displayName || '');
  }

  useEffect(() => {
    refresh();
    function onAuth() {
      refresh();
    }
    window.addEventListener(AUTH_CHANGED, onAuth);
    return () => window.removeEventListener(AUTH_CHANGED, onAuth);
  }, []);

  async function onSave(e) {
    e.preventDefault();
    setErr('');
    setSavedMsg('');
    setLoading(true);
    try {
      await updateProfile({ displayName: name });
      setSavedMsg('Profil güncellendi.');
    } catch (er) {
      setErr(er?.message || 'Kaydedilemedi.');
    } finally {
      setLoading(false);
    }
  }

  function onLogout() {
    signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <div style={{ display: 'flex', height: '100vh', minHeight: 0, overflow: 'hidden' }}>
      <AppSidebar activeId="profil" />
      <main
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          overflowY: 'auto',
          background: 'var(--bg, #fff)',
          padding: '24px 20px 48px',
          fontFamily: 'var(--font-sans)',
        }}
      >
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <Link
            href="/profil"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--ta-ink-muted)',
              marginBottom: 20,
            }}
          >
            <ChevronLeft size={18} />
            Profilime dön
          </Link>

          <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 800, color: 'var(--ta-ink)' }}>Hesap ayarları</h1>
          <p style={{ margin: '0 0 28px', fontSize: 15, color: 'var(--ta-ink-muted)', lineHeight: 1.5 }}>
            Görünen ad ve oturum.
          </p>

          {!user ? (
            <div
              style={{
                background: '#fff',
                borderRadius: 14,
                padding: 24,
                border: '1px solid rgba(0,0,0,.08)',
              }}
            >
              <p style={{ margin: '0 0 16px', fontSize: 15, color: 'var(--ta-ink)' }}>
                Oturum açmadınız.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <Link href="/auth/giris" style={primaryLink}>
                  Giriş yap
                </Link>
                <Link href="/auth/kayit" style={secondaryLink}>
                  Üye ol
                </Link>
              </div>
            </div>
          ) : (
            <div
              style={{
                background: '#fff',
                borderRadius: 14,
                padding: 24,
                border: '1px solid rgba(0,0,0,.08)',
              }}
            >
              <form onSubmit={onSave}>
                <label style={lb}>
                  Görünen ad
                  <input style={inp} value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
                </label>
                <label style={lb}>
                  E-posta
                  <input style={{ ...inp, background: 'rgba(0,0,0,.04)', color: 'var(--ta-ink-muted)' }} value={user.email} readOnly />
                </label>
                <p style={{ margin: '-6px 0 16px', fontSize: 12, color: 'var(--ta-ink-subtle)' }}>
                  E-posta bu sürümde değiştirilemez.
                </p>
                {savedMsg ? (
                  <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--green, #2e7d32)', fontWeight: 600 }}>
                    {savedMsg}
                  </p>
                ) : null}
                {err ? (
                  <p style={{ margin: '0 0 10px', fontSize: 13, color: '#A84A4A', fontWeight: 600 }}>{err}</p>
                ) : null}
                <button type="submit" disabled={loading} style={btn}>
                  {loading ? 'Kaydediliyor…' : 'Kaydet'}
                </button>
              </form>
              <div style={{ height: 1, background: 'rgba(0,0,0,.08)', margin: '22px 0' }} />
              <button type="button" onClick={onLogout} style={dangerBtn}>
                Çıkış yap
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const lb = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  marginBottom: 16,
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--ta-ink-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const inp = {
  padding: '11px 12px',
  borderRadius: 10,
  border: '1px solid rgba(0,0,0,.12)',
  fontSize: 15,
  fontFamily: 'inherit',
  color: 'var(--ta-ink)',
  outline: 'none',
  boxSizing: 'border-box',
};

const btn = {
  padding: '11px 20px',
  borderRadius: 12,
  border: 'none',
  background: 'var(--ta-ink)',
  color: '#fff',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const dangerBtn = {
  padding: '11px 20px',
  borderRadius: 12,
  border: '1px solid rgba(168,74,74,.35)',
  background: '#fff',
  color: '#A84A4A',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const primaryLink = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '10px 18px',
  borderRadius: 12,
  background: 'var(--ta-ink)',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: 14,
};

const secondaryLink = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '10px 18px',
  borderRadius: 12,
  border: '1px solid rgba(0,0,0,.12)',
  color: 'var(--ta-ink)',
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: 14,
};
