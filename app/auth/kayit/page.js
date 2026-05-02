'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signUp } from '@/lib/authStore';

export default function KayitPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    if (password !== password2) {
      setErr('Şifreler eşleşmiyor.');
      return;
    }
    setLoading(true);
    try {
      await signUp({ email, displayName, password });
      router.push('/profil');
      router.refresh();
    } catch (er) {
      setErr(er?.message || 'Kayıt başarısız.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'var(--bg, #fff)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          background: '#fff',
          borderRadius: 16,
          padding: '28px 28px 24px',
          boxShadow: '0 12px 40px rgba(35,28,18,.1)',
          border: '1px solid rgba(0,0,0,.06)',
          boxSizing: 'border-box',
        }}
      >
        <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: 'var(--ta-ink)' }}>Üye ol</h1>
        <p style={{ margin: '0 0 22px', fontSize: 14, color: 'var(--ta-ink-muted)', lineHeight: 1.45 }}>
          Atlas hesabı oluşturun. Veriler şu an tarayıcınızda saklanır; ileride sunucu hesabına
          taşınabilir.
        </p>
        <form onSubmit={onSubmit}>
          <label style={lb}>
            Ad soyad
            <input
              style={inp}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
              required
              minLength={2}
            />
          </label>
          <label style={lb}>
            E-posta
            <input
              style={inp}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label style={lb}>
            Şifre
            <input
              style={inp}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={6}
            />
          </label>
          <label style={lb}>
            Şifre tekrar
            <input
              style={inp}
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              autoComplete="new-password"
              required
              minLength={6}
            />
          </label>
          {err ? (
            <p style={{ margin: '0 0 12px', fontSize: 13, color: '#A84A4A', fontWeight: 600 }}>{err}</p>
          ) : null}
          <button type="submit" disabled={loading} style={btn}>
            {loading ? 'Kaydediliyor…' : 'Hesap oluştur'}
          </button>
        </form>
        <p style={{ margin: '18px 0 0', fontSize: 14, color: 'var(--ta-ink-muted)', textAlign: 'center' }}>
          Zaten hesabın var mı?{' '}
          <Link href="/auth/giris" style={{ color: 'var(--ta-accent-deep, #2f3f52)', fontWeight: 700 }}>
            Giriş yap
          </Link>
        </p>
        <p style={{ margin: '14px 0 0', textAlign: 'center' }}>
          <Link
            href="/"
            style={{
              fontSize: 13,
              color: 'var(--ta-ink-subtle)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              justifyContent: 'center',
            }}
          >
            <ArrowLeft size={14} strokeWidth={2} aria-hidden />
            Ana sayfa
          </Link>
        </p>
      </div>
    </div>
  );
}

const lb = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  marginBottom: 14,
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
  width: '100%',
  marginTop: 4,
  padding: '12px 16px',
  borderRadius: 12,
  border: 'none',
  background: 'var(--ta-ink)',
  color: '#fff',
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
};
