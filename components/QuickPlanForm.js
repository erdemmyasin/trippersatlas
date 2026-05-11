'use client';

import { useState } from 'react';
import { Building2, Plane, CarFront } from 'lucide-react';

const field = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--ta-ink-muted)',
  marginBottom: 6,
  fontFamily: 'var(--font-sans)',
};

const input = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid rgba(0,0,0,.1)',
  fontSize: 14,
  fontFamily: 'var(--font-sans)',
  outline: 'none',
  background: '#fff',
};

const rowGap = { display: 'grid', gap: 14, marginBottom: 14 };

const actions = { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 };

const btnGhost = {
  padding: '10px 16px',
  borderRadius: 10,
  border: '1px solid rgba(0,0,0,.12)',
  background: '#fff',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
};

const btnPrimary = {
  ...btnGhost,
  border: 'none',
  background: 'linear-gradient(160deg,#dce4ed,#4a6278)',
  color: '#15232f',
  fontWeight: 600,
};

function StayForm({ onCancel, onSubmit }) {
  const [city, setCity] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2');

  function handleSubmit(e) {
    e.preventDefault();
    const parts = [
      'Konaklama arıyorum.',
      city.trim() && `Şehir: ${city.trim()}`,
      checkIn && `Giriş: ${checkIn}`,
      checkOut && `Çıkış: ${checkOut}`,
      guests && `Kişi sayısı: ${guests}`,
    ].filter(Boolean);
    onSubmit(parts.join('. ') + '. Otel ve apart önerileri sun.');
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={rowGap}>
        <div>
          <label style={field}>Şehir</label>
          <input style={input} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Örn. Paris, Tokyo, İstanbul" required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={field}>Giriş tarihi</label>
            <input style={input} type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} required />
          </div>
          <div>
            <label style={field}>Çıkış tarihi</label>
            <input style={input} type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} required />
          </div>
        </div>
        <div>
          <label style={field}>Kişi sayısı</label>
          <input style={input} type="number" min={1} max={20} value={guests} onChange={(e) => setGuests(e.target.value)} required />
        </div>
      </div>
      <div style={actions}>
        <button type="button" style={btnGhost} onClick={onCancel}>
          İptal
        </button>
        <button type="submit" style={btnPrimary}>
          Gönder
        </button>
      </div>
    </form>
  );
}

function FlightForm({ onCancel, onSubmit }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [pax, setPax] = useState('1');

  function handleSubmit(e) {
    e.preventDefault();
    const text = [
      'Uçak bileti arıyorum.',
      `Nereden: ${from.trim()}`,
      `Nereye: ${to.trim()}`,
      `Tarih: ${date}`,
      `Yolcu: ${pax}`,
    ].join(' ');
    onSubmit(text + '. Uygun uçuş seçenekleri öner.');
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={rowGap}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={field}>Nereden</label>
            <input style={input} value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Örn. IST" required />
          </div>
          <div>
            <label style={field}>Nereye</label>
            <input style={input} value={to} onChange={(e) => setTo(e.target.value)} placeholder="Örn. AYT" required />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={field}>Tarih</label>
            <input style={input} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <label style={field}>Yolcu sayısı</label>
            <input style={input} type="number" min={1} max={9} value={pax} onChange={(e) => setPax(e.target.value)} required />
          </div>
        </div>
      </div>
      <div style={actions}>
        <button type="button" style={btnGhost} onClick={onCancel}>
          İptal
        </button>
        <button type="submit" style={btnPrimary}>
          Gönder
        </button>
      </div>
    </form>
  );
}

function CarForm({ onCancel, onSubmit }) {
  const [location, setLocation] = useState('');
  const [pickup, setPickup] = useState('');
  const [ret, setRet] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const text = [
      'Araç kiralama arıyorum.',
      `Lokasyon: ${location.trim()}`,
      `Alış: ${pickup}`,
      `İade: ${ret}`,
    ].join(' ');
    onSubmit(text + '. Araç kiralama seçenekleri öner.');
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={rowGap}>
        <div>
          <label style={field}>Alış / iade lokasyonu</label>
          <input style={input} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Örn. Sabiha Gökçen" required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={field}>Alış tarihi</label>
            <input style={input} type="date" value={pickup} onChange={(e) => setPickup(e.target.value)} required />
          </div>
          <div>
            <label style={field}>İade tarihi</label>
            <input style={input} type="date" value={ret} onChange={(e) => setRet(e.target.value)} required />
          </div>
        </div>
      </div>
      <div style={actions}>
        <button type="button" style={btnGhost} onClick={onCancel}>
          İptal
        </button>
        <button type="submit" style={btnPrimary}>
          Gönder
        </button>
      </div>
    </form>
  );
}

const titles = {
  stay: { title: 'Konaklama', Icon: Building2, sub: 'Otel ve apart ara' },
  flight: { title: 'Uçuş', Icon: Plane, sub: 'Uçak bileti bul' },
  car: { title: 'Araç Kiralama', Icon: CarFront, sub: 'Araç kirala' },
};

/**
 * @param {{ mode: 'stay'|'flight'|'car', onClose: () => void, onSubmit: (text: string) => Promise<void> }} props
 */
export default function QuickPlanForm({ mode, onClose, onSubmit }) {
  const [busy, setBusy] = useState(false);
  const meta = titles[mode];
  if (!meta) return null;
  const { Icon, title, sub } = meta;

  async function handleFormSubmit(text) {
    if (busy) return;
    setBusy(true);
    try {
      await onSubmit(text);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 30,
        background: 'rgba(26,25,22,.42)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backdropFilter: 'blur(4px)',
      }}
      role="presentation"
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#fff',
          borderRadius: 16,
          padding: '20px 20px 18px',
          boxShadow: '0 16px 48px rgba(0,0,0,.15)',
          border: '1px solid rgba(0,0,0,.06)',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="qp-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              display: 'grid',
              placeItems: 'center',
              background: 'linear-gradient(135deg,rgba(31,77,92,.2),rgba(31,77,92,.08))',
              flexShrink: 0,
            }}
          >
            <Icon size={22} strokeWidth={2} color="var(--ta-accent)" />
          </div>
          <div>
            <h2 id="qp-title" style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ta-ink)', fontFamily: 'var(--font-sans)' }}>
              {title}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ta-ink-muted)', fontFamily: 'var(--font-sans)' }}>{sub}</p>
          </div>
        </div>

        {mode === 'stay' && (
          <StayForm onCancel={onClose} onSubmit={handleFormSubmit} />
        )}
        {mode === 'flight' && (
          <FlightForm onCancel={onClose} onSubmit={handleFormSubmit} />
        )}
        {mode === 'car' && <CarForm onCancel={onClose} onSubmit={handleFormSubmit} />}

        {busy ? (
          <p style={{ margin: '12px 0 0', fontSize: 12, color: 'var(--ta-ink-muted)', textAlign: 'center' }}>Gönderiliyor…</p>
        ) : null}
      </div>
    </div>
  );
}
