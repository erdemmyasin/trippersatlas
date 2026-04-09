'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppSidebar from '@/components/AppSidebar';
import { getTrips, saveTrip, deleteTrip, createTrip } from '@/lib/tripStore';

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

export default function TripsPage() {
  const [trips, setTrips]           = useState([]);
  const [bookedOnly, setBookedOnly] = useState(false);
  const [menuOpen, setMenuOpen]     = useState(null);
  const [modalOpen, setModalOpen]   = useState(false);
  const [form, setForm]             = useState({ name: '', destination: '', days: 5, month: MONTHS[new Date().getMonth()] });

  useEffect(() => { setTrips(getTrips()); }, []);

  const filtered = bookedOnly ? trips.filter(t => t.booked) : trips;

  function handleCreate() {
    const trip = createTrip(form);
    const updated = saveTrip(trip);
    setTrips(updated);
    setForm({ name: '', destination: '', days: 5, month: MONTHS[new Date().getMonth()] });
    setModalOpen(false);
  }

  function handleDelete(id) {
    const updated = deleteTrip(id);
    setTrips(updated);
    setMenuOpen(null);
  }

  function handleToggleBooked(trip) {
    const updated = saveTrip({ ...trip, booked: !trip.booked });
    setTrips(updated);
    setMenuOpen(null);
  }

  return (
    <div style={lay.shell}>
      <AppSidebar activeId="trips" />

      <main style={lay.content}>
        {/* Header */}
        <div style={lay.header}>
          <h1 style={lay.title}>Gezileriniz</h1>
          <div style={lay.headerRight}>
            <label style={lay.toggle}>
              <div style={{ ...lay.toggleTrack, background: bookedOnly ? '#1a1a1a' : 'rgba(0,0,0,.15)' }}
                onClick={() => setBookedOnly(v => !v)}>
                <div style={{ ...lay.toggleKnob, transform: bookedOnly ? 'translateX(20px)' : 'translateX(2px)' }} />
              </div>
              <span style={lay.toggleLabel}>Sadece Rezervasyonlar</span>
            </label>
            <button style={lay.newTripBtn} onClick={() => setModalOpen(true)}>
              <span style={{ color: 'var(--gold)', fontSize: 12 }}>✦</span>
              Yeni Gezi
            </button>
          </div>
        </div>

        {/* Trip Grid */}
        {filtered.length === 0 ? (
          <div style={lay.empty}>
            <span style={lay.emptyIcon}>🧳</span>
            <p style={lay.emptyTitle}>Henüz geziniz yok</p>
            <p style={lay.emptySub}>Yeni bir seyahat planı oluşturarak başlayın.</p>
            <button style={lay.emptyBtn} onClick={() => setModalOpen(true)}>
              <span>✦</span> Yeni plan oluştur
            </button>
          </div>
        ) : (
          <div style={lay.grid}>
            {filtered.map(trip => (
              <TripCard
                key={trip.id}
                trip={trip}
                menuOpen={menuOpen === trip.id}
                onMenuToggle={() => setMenuOpen(menuOpen === trip.id ? null : trip.id)}
                onMenuClose={() => setMenuOpen(null)}
                onDelete={() => handleDelete(trip.id)}
                onToggleBooked={() => handleToggleBooked(trip)}
              />
            ))}
          </div>
        )}
      </main>

      {/* ═══ CREATE MODAL ═══ */}
      {modalOpen && (
        <>
          <div style={lay.modalOverlay} onClick={() => setModalOpen(false)} />
          <div style={lay.modalWrap} onClick={() => setModalOpen(false)}>
            <div style={lay.modal} onClick={e => e.stopPropagation()}>
              <button style={lay.modalClose} onClick={() => setModalOpen(false)}>✕</button>
              <h2 style={lay.modalTitle}>Yeni gezi oluştur</h2>

              <div style={lay.field}>
                <label style={lay.fieldLabel}>Gezi adı</label>
                <input style={lay.fieldInput} placeholder="Ör: Kapadokya Macerası"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div style={lay.field}>
                <label style={lay.fieldLabel}>Destinasyon</label>
                <input style={lay.fieldInput} placeholder="Ör: Antalya"
                  value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} />
              </div>
              <div style={lay.fieldRow}>
                <div style={{ ...lay.field, flex: 1 }}>
                  <label style={lay.fieldLabel}>Süre (gün)</label>
                  <input style={lay.fieldInput} type="number" min="1" max="90"
                    value={form.days} onChange={e => setForm(f => ({ ...f, days: +e.target.value }))} />
                </div>
                <div style={{ ...lay.field, flex: 1 }}>
                  <label style={lay.fieldLabel}>Ay</label>
                  <select style={lay.fieldInput} value={form.month}
                    onChange={e => setForm(f => ({ ...f, month: e.target.value }))}>
                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <button style={lay.modalBtn}
                onClick={handleCreate}
                disabled={!form.name.trim()}>
                Oluştur
              </button>
            </div>
          </div>
        </>
      )}

      {/* Close menus on outside click */}
      {menuOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 5 }} onClick={() => setMenuOpen(null)} />}
    </div>
  );
}

/* ── Trip Card ── */
function TripCard({ trip, menuOpen, onMenuToggle, onMenuClose, onDelete, onToggleBooked }) {
  const [imgSrc, setImgSrc] = useState(trip.imageUrl);
  const [imgOk, setImgOk]   = useState(false);

  useEffect(() => {
    if (trip.imageUrl) { setImgSrc(trip.imageUrl); return; }
    let cancelled = false;
    const q = trip.imageQuery || `${trip.destination} Turkey travel landmark`;
    fetch(`/api/image?query=${encodeURIComponent(q)}&type=tour`)
      .then(r => r.json())
      .then(d => { if (!cancelled) setImgSrc(d.url); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [trip.imageUrl, trip.imageQuery, trip.destination]);

  return (
    <div style={tc.card}>
      {/* Image */}
      <div style={tc.imgWrap}>
        {imgSrc && (
          <img src={imgSrc} alt={trip.name} style={{ ...tc.img, opacity: imgOk ? 1 : 0 }}
            loading="lazy" onLoad={() => setImgOk(true)} onError={() => setImgOk(false)} />
        )}
        {!imgOk && <div style={tc.shimmer} />}

        {/* Gradient overlay */}
        <div style={tc.gradient} />

        {/* Menu button */}
        <button style={tc.menuBtn} onClick={e => { e.stopPropagation(); onMenuToggle(); }}>···</button>

        {/* Dropdown menu */}
        {menuOpen && (
          <div style={tc.menu}>
            <button style={tc.menuItem} onClick={onMenuClose}>
              <span>🔗</span> Ortak Gezgin Davet Et
            </button>
            <button style={tc.menuItem} onClick={onMenuClose}>
              <span>↑</span> Gezini paylaş
            </button>
            <button style={tc.menuItem} onClick={onMenuClose}>
              <span>🖼</span> Fotoğrafı Değiştir
            </button>
            <button style={tc.menuItem} onClick={() => onToggleBooked()}>
              <span>{trip.booked ? '☐' : '☑'}</span> {trip.booked ? 'Rezerve kaldır' : 'Rezerveli işaretle'}
            </button>
            <div style={tc.menuDivider} />
            <button style={{ ...tc.menuItem, ...tc.menuItemDanger }} onClick={onDelete}>
              <span>🗑</span> Geziyi Sil
            </button>
          </div>
        )}

        {/* Bottom text */}
        <div style={tc.bottomText}>
          <h3 style={tc.tripName}>{trip.name}</h3>
          <p style={tc.tripSub}>
            {trip.destination} · {trip.days} gün{trip.month ? ` · ${trip.month}` : ''}
          </p>
        </div>

        {/* Booked badge */}
        {trip.booked && <span style={tc.bookedBadge}>Rezerveli</span>}
      </div>
    </div>
  );
}

/* ═══ Layout Styles ═══ */
const lay = {
  shell: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
    background: '#FAFAF8',
  },

  content: {
    overflowY: 'auto', padding: '40px 48px',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 20, marginBottom: 32, flexWrap: 'wrap',
  },
  title: {
    fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 32,
    color: 'var(--text1)', letterSpacing: '-0.02em', margin: 0,
  },
  headerRight: { display: 'flex', alignItems: 'center', gap: 16 },
  toggle: { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' },
  toggleTrack: {
    width: 44, height: 26, borderRadius: 999, position: 'relative',
    cursor: 'pointer', transition: 'background .2s',
  },
  toggleKnob: {
    position: 'absolute', top: 3, width: 20, height: 20,
    borderRadius: '50%', background: 'white',
    transition: 'transform .2s', boxShadow: '0 1px 4px rgba(0,0,0,.25)',
  },
  toggleLabel: {
    fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, color: 'var(--text2)',
  },
  newTripBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '10px 20px', borderRadius: 999,
    background: 'linear-gradient(180deg,#d3ab5f,#c08d36)', color: 'white',
    border: '1px solid rgba(167,125,50,.28)',
    boxShadow: '0 6px 14px rgba(199,154,70,.28)',
    fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14,
    cursor: 'pointer', whiteSpace: 'nowrap',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 24,
  },

  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 14, padding: '100px 20px', textAlign: 'center',
  },
  emptyIcon: { fontSize: 56, opacity: .4 },
  emptyTitle: {
    fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 20,
    color: 'var(--text1)', margin: 0,
  },
  emptySub: {
    fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--muted)',
    margin: 0, maxWidth: 320,
  },
  emptyBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '14px 28px', borderRadius: 14, marginTop: 8,
    background: 'linear-gradient(180deg,#d3ab5f,#c08d36)', color: 'white',
    border: '1px solid rgba(167,125,50,.28)',
    boxShadow: '0 8px 20px rgba(199,154,70,.3)',
    fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 15,
    cursor: 'pointer',
  },

  /* Modal */
  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(20,16,10,.45)',
    backdropFilter: 'blur(4px)', zIndex: 200,
  },
  modalWrap: {
    position: 'fixed', inset: 0, zIndex: 210,
    display: 'grid', placeItems: 'center', padding: 20,
  },
  modal: {
    width: 440, maxWidth: '96vw', background: 'white',
    borderRadius: 24, padding: '32px 28px',
    boxShadow: '0 32px 80px rgba(0,0,0,.22)',
    position: 'relative', fontFamily: 'var(--font-sans)',
  },
  modalClose: {
    position: 'absolute', top: 16, right: 18,
    width: 32, height: 32, borderRadius: '50%',
    border: '1px solid rgba(0,0,0,.10)', background: 'rgba(0,0,0,.04)',
    fontSize: 13, color: 'var(--text2)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 20,
    color: 'var(--text1)', marginBottom: 24, letterSpacing: '-0.02em',
  },
  field: { marginBottom: 16 },
  fieldLabel: {
    display: 'block', fontWeight: 600, fontSize: 13,
    color: 'var(--muted)', marginBottom: 6,
  },
  fieldInput: {
    width: '100%', height: 46, borderRadius: 12,
    border: '1px solid rgba(0,0,0,.10)', padding: '0 14px',
    fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text1)',
    outline: 'none', background: 'white', boxSizing: 'border-box',
  },
  fieldRow: { display: 'flex', gap: 12 },
  modalBtn: {
    width: '100%', height: 50, borderRadius: 14, border: 'none',
    background: 'linear-gradient(180deg,#d3ab5f,#c08d36)', color: 'white',
    fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 15,
    cursor: 'pointer', marginTop: 8,
  },
};

/* ═══ Trip Card Styles ═══ */
const tc = {
  card: {
    borderRadius: 16, overflow: 'hidden', background: 'white',
    boxShadow: '0 2px 8px rgba(0,0,0,.06)',
    cursor: 'pointer', transition: 'transform .2s, box-shadow .2s',
    position: 'relative',
  },
  imgWrap: {
    position: 'relative', height: 240, overflow: 'hidden',
    background: '#e8e5e0',
  },
  img: {
    width: '100%', height: '100%', objectFit: 'cover',
    transition: 'opacity .4s, transform .3s',
  },
  shimmer: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(90deg, #e8e5e0 25%, #f0ede8 50%, #e8e5e0 75%)',
    backgroundSize: '200% 100%',
    animation: 'skeletonShimmer 1.4s ease-in-out infinite',
  },
  gradient: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,.65) 0%, rgba(0,0,0,.15) 40%, transparent 70%)',
    pointerEvents: 'none',
  },
  menuBtn: {
    position: 'absolute', top: 12, right: 12,
    width: 32, height: 32, borderRadius: '50%',
    background: 'rgba(0,0,0,.35)', border: 'none',
    color: 'white', fontSize: 16, fontWeight: 700,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(4px)', zIndex: 6,
    letterSpacing: 2,
  },
  menu: {
    position: 'absolute', top: 50, right: 12,
    width: 210, background: 'white',
    borderRadius: 14, padding: 6,
    boxShadow: '0 12px 36px rgba(0,0,0,.18)',
    zIndex: 10,
  },
  menuItem: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 12px', borderRadius: 8,
    border: 'none', background: 'transparent', cursor: 'pointer',
    fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
    color: 'var(--text1)', textAlign: 'left',
    transition: 'background .12s',
  },
  menuItemDanger: { color: '#A84A4A' },
  menuDivider: { height: 1, background: 'rgba(0,0,0,.06)', margin: '4px 4px' },
  bottomText: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: '16px 18px', zIndex: 2,
  },
  tripName: {
    fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 16,
    color: 'white', margin: 0, lineHeight: 1.35,
    textShadow: '0 1px 4px rgba(0,0,0,.3)',
  },
  tripSub: {
    fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
    color: 'rgba(255,255,255,.8)', margin: '4px 0 0',
    textShadow: '0 1px 3px rgba(0,0,0,.3)',
  },
  bookedBadge: {
    position: 'absolute', top: 12, left: 12,
    padding: '5px 12px', borderRadius: 999,
    background: 'rgba(47,143,107,.85)', color: 'white',
    fontSize: 11, fontWeight: 800, backdropFilter: 'blur(4px)',
    fontFamily: 'var(--font-sans)', zIndex: 2,
  },
};
