'use client';

import { useState, useEffect } from 'react';
import {
  Sparkles,
  Luggage,
  Link2,
  Share2,
  Image as ImageIcon,
  Square,
  CheckSquare,
  Trash2,
  MoreHorizontal,
} from 'lucide-react';
import { tripStoreDefaultImageQuery } from '@/lib/taRegion';
import Link from 'next/link';
import AppSidebar from '@/components/AppSidebar';
import { useNewTrip } from '@/components/NewTripProvider';
import { getTrips, saveTrip, deleteTrip } from '@/lib/tripStore';

export default function TripsPage() {
  const { openNewTrip } = useNewTrip();
  const [trips, setTrips]           = useState([]);
  const [bookedOnly, setBookedOnly] = useState(false);
  const [menuOpen, setMenuOpen]     = useState(null);

  useEffect(() => {
    setTrips(getTrips());
  }, []);

  useEffect(() => {
    function onTripsUpdated() {
      setTrips(getTrips());
    }
    window.addEventListener('tripsUpdated', onTripsUpdated);
    return () => window.removeEventListener('tripsUpdated', onTripsUpdated);
  }, []);

  const filtered = bookedOnly ? trips.filter(t => t.booked) : trips;

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

      <main style={{ ...lay.content, position: 'relative' }}>
        {/* Header */}
        <div style={lay.header}>
          <div style={lay.headerTop}>
            <h1 style={lay.title}>Gezileriniz</h1>
            <button
              type="button"
              style={{ ...lay.newTripBtn, font: 'inherit' }}
              onClick={() => openNewTrip()}
            >
              <Sparkles size={14} strokeWidth={2.1} color="#fff" aria-hidden />
              Yeni Gezi
            </button>
          </div>
          <div style={lay.headerSub}>
            <label style={lay.toggle}>
              <div
                style={{
                  ...lay.toggleTrack,
                  background: bookedOnly ? 'var(--ta-night-b)' : 'rgba(15, 23, 32, 0.18)',
                }}
                onClick={() => setBookedOnly((v) => !v)}
                role="presentation"
              >
                <div
                  style={{
                    ...lay.toggleKnob,
                    transform: bookedOnly ? 'translateX(16px)' : 'translateX(2px)',
                  }}
                />
              </div>
              <span style={lay.toggleLabel}>Sadece Rezervasyonlar</span>
            </label>
          </div>
        </div>

        {/* Trip Grid */}
        {filtered.length === 0 ? (
          bookedOnly ? (
            <div style={lay.emptyBookedOnly}>
              <p style={lay.emptyBookedTitle}>Rezervasyonlu gezi yok</p>
              <p style={lay.emptyBookedSub}>
                Gezi kartından &quot;Rezerveli&quot; seçtiğiniz planlar burada görünür. Filtreyi kapatınca tüm
                gezilerinize dönersiniz.
              </p>
              <div style={lay.emptyBookedActions}>
                <button
                  type="button"
                  style={{ ...lay.emptyBtn, font: 'inherit', marginTop: 0 }}
                  onClick={() => openNewTrip()}
                >
                  <Sparkles size={16} strokeWidth={2.2} aria-hidden />
                  Yeni Gezi Oluştur
                </button>
                <button
                  type="button"
                  style={lay.emptyBookedSecondary}
                  onClick={() => setBookedOnly(false)}
                >
                  Tüm gezileri göster
                </button>
              </div>
            </div>
          ) : (
            <div style={lay.empty}>
              <span style={lay.emptyIcon} aria-hidden>
                <Luggage size={52} strokeWidth={1.4} color="var(--ta-accent-deep)" />
              </span>
              <p style={lay.emptyTitle}>Henüz geziniz yok</p>
              <p style={lay.emptySub}>Yeni bir seyahat planı oluşturarak başlayın.</p>
            </div>
          )
        ) : (
          <div className="trips-grid">
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

        {menuOpen ? (
          <div
            style={lay.menuBackdrop}
            role="presentation"
            aria-hidden
            onClick={() => setMenuOpen(null)}
          />
        ) : null}
      </main>

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
    const q = trip.imageQuery || tripStoreDefaultImageQuery(trip.destination);
    fetch(`/api/image?query=${encodeURIComponent(q)}&type=tour`)
      .then(r => r.json())
      .then(d => { if (!cancelled) setImgSrc(d.url); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [trip.imageUrl, trip.imageQuery, trip.destination]);

  return (
    <div
      style={{
        ...tc.card,
        overflow: menuOpen ? 'visible' : 'hidden',
        zIndex: menuOpen ? 25 : undefined,
      }}
    >
      <Link
        href={`/trips/${encodeURIComponent(String(trip.id))}`}
        style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
        aria-label={`${trip.name} gezisini aç`}
        onClick={(e) => {
          if (menuOpen) e.preventDefault();
        }}
      >
      <div style={tc.imgWrap}>
        {imgSrc && (
          <img src={imgSrc} alt={trip.name} style={{ ...tc.img, opacity: imgOk ? 1 : 0 }}
            loading="lazy" onLoad={() => setImgOk(true)} onError={() => setImgOk(false)} />
        )}
        {!imgOk && <div style={tc.shimmer} />}

        <div style={tc.gradient} />

        <button type="button" style={tc.menuBtn} onClick={e => { e.stopPropagation(); onMenuToggle(); }} aria-label="Menü">
          <MoreHorizontal size={17} strokeWidth={2} aria-hidden />
        </button>

        <div style={tc.bottomText}>
          <h3 style={tc.tripName}>{trip.name}</h3>
          <p style={tc.tripSub}>
            {trip.destination} · {trip.days} gün{trip.month ? ` · ${trip.month}` : ''}
          </p>
        </div>

        {trip.booked && <span style={tc.bookedBadge}>Rezerveli</span>}
      </div>
      </Link>

      {menuOpen ? (
        <div style={tc.menu} role="menu" onClick={(e) => e.stopPropagation()}>
          <button type="button" style={tc.menuItem} onClick={onMenuClose}>
            <Link2 size={14} strokeWidth={2} aria-hidden /> Ortak Gezgin Davet Et
          </button>
          <button type="button" style={tc.menuItem} onClick={onMenuClose}>
            <Share2 size={14} strokeWidth={2} aria-hidden /> Gezini paylaş
          </button>
          <button type="button" style={tc.menuItem} onClick={onMenuClose}>
            <ImageIcon size={14} strokeWidth={2} aria-hidden /> Fotoğrafı Değiştir
          </button>
          <button type="button" style={tc.menuItem} onClick={() => onToggleBooked()}>
            {trip.booked ? <Square size={14} strokeWidth={2} aria-hidden /> : <CheckSquare size={14} strokeWidth={2} aria-hidden />}{' '}
            {trip.booked ? 'Rezerve kaldır' : 'Rezerveli işaretle'}
          </button>
          <div style={tc.menuDivider} />
          <button type="button" style={{ ...tc.menuItem, ...tc.menuItemDanger }} onClick={onDelete}>
            <Trash2 size={14} strokeWidth={2} aria-hidden /> Geziyi Sil
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* ═══ Layout Styles ═══ */
const lay = {
  shell: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
    background: 'var(--ta-canvas-top, #fff)',
  },

  content: {
    flex: 1,
    minWidth: 0,
    width: '100%',
    maxWidth: 'none',
    overflowY: 'auto',
    overflowX: 'auto',
    padding: '32px clamp(16px, 3vw, 40px) 40px',
    boxSizing: 'border-box',
  },
  menuBackdrop: {
    position: 'absolute',
    inset: 0,
    zIndex: 14,
    background: 'transparent',
    cursor: 'default',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 0,
    marginBottom: 28,
    width: '100%',
    boxSizing: 'border-box',
  },
  headerTop: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 16,
    width: '100%',
    boxSizing: 'border-box',
  },
  headerSub: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
    width: '100%',
    boxSizing: 'border-box',
  },
  title: {
    fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 32,
    color: 'var(--text1)', letterSpacing: '-0.02em', margin: 0,
    flex: '0 1 auto',
    minWidth: 0,
    lineHeight: 1.15,
    paddingRight: 8,
  },
  toggle: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
    userSelect: 'none',
  },
  toggleTrack: {
    width: 34,
    height: 20,
    borderRadius: 999,
    position: 'relative',
    cursor: 'pointer',
    transition: 'background .2s',
    flexShrink: 0,
  },
  toggleKnob: {
    position: 'absolute',
    top: 2,
    width: 16,
    height: 16,
    borderRadius: '50%',
    background: 'var(--ta-elevated)',
    transition: 'transform .2s',
    boxShadow: '0 1px 3px rgba(15, 23, 32, 0.2)',
  },
  toggleLabel: {
    fontFamily: 'var(--font-sans)',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--ta-accent-deep)',
    letterSpacing: '0.01em',
    whiteSpace: 'nowrap',
  },
  newTripBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
    marginLeft: 'auto',
    padding: '8px 16px',
    borderRadius: 12,
    background: 'linear-gradient(135deg, var(--ta-night-a), var(--ta-night-b) 55%, var(--ta-accent))',
    color: '#fff',
    border: '1px solid rgba(15, 23, 32, 0.12)',
    boxShadow: '0 4px 14px rgba(15, 23, 32, 0.12)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  },

  emptyBookedOnly: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    maxWidth: 'min(720px, 100%)',
    margin: '24px 0 0 0',
    padding: '20px 22px',
    borderRadius: 16,
    background: 'var(--ta-elevated)',
    border: '1px solid var(--ta-border)',
    boxShadow: '0 4px 16px rgba(15, 23, 32, 0.06)',
  },
  emptyBookedTitle: {
    fontFamily: 'var(--font-sans)',
    fontWeight: 700,
    fontSize: 16,
    color: 'var(--text1)',
    margin: 0,
    lineHeight: 1.3,
  },
  emptyBookedSub: {
    fontFamily: 'var(--font-sans)',
    fontSize: 14,
    fontWeight: 400,
    color: 'var(--text2)',
    margin: '8px 0 0',
    lineHeight: 1.5,
  },
  emptyBookedActions: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    marginTop: 18,
  },
  emptyBookedSecondary: {
    padding: '12px 18px',
    borderRadius: 12,
    border: '1px solid rgba(14, 47, 58, 0.22)',
    background: 'transparent',
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    fontSize: 14,
    color: 'var(--ta-accent-deep)',
    cursor: 'pointer',
  },
  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 14, padding: '100px 20px', textAlign: 'center',
  },
  emptyIcon: { display: 'flex', justifyContent: 'center', opacity: 0.55 },
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
    justifyContent: 'center',
    padding: '14px 28px', borderRadius: 14, marginTop: 8,
    background: 'linear-gradient(180deg,#5f7a94,#3d5266)', color: 'white',
    border: '1px solid var(--ta-accent-border)',
    boxShadow: '0 8px 20px rgba(14, 47, 58, 0.24)',
    fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 15,
    cursor: 'pointer',
  },
};

/* ═══ Trip Card Styles ═══ */
const tc = {
  card: {
    borderRadius: 16,
    background: 'white',
    boxShadow: '0 2px 8px rgba(0,0,0,.06)',
    cursor: 'pointer',
    transition: 'transform .2s, box-shadow .2s',
    position: 'relative',
    boxSizing: 'border-box',
  },
  imgWrap: {
    position: 'relative',
    height: 200,
    overflow: 'hidden',
    background: '#e8e5e0',
    borderRadius: '16px 16px 0 0',
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
    position: 'absolute', top: 10, right: 10,
    width: 30, height: 30, borderRadius: '50%',
    background: 'rgba(0,0,0,.35)', border: 'none',
    color: 'white',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(4px)', zIndex: 6,
  },
  menu: {
    position: 'absolute',
    top: 44,
    left: 8,
    right: 8,
    width: 'auto',
    zIndex: 30,
    background: 'var(--ta-elevated)',
    borderRadius: 12,
    padding: 4,
    boxShadow: '0 12px 32px rgba(15, 23, 32, 0.16)',
    border: '1px solid var(--ta-border)',
    boxSizing: 'border-box',
  },
  menuItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    padding: '6px 8px',
    borderRadius: 6,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text1)',
    textAlign: 'left',
    lineHeight: 1.3,
    whiteSpace: 'normal',
    transition: 'background .12s',
  },
  menuItemDanger: { color: '#A84A4A' },
  menuDivider: { height: 1, background: 'rgba(0,0,0,.06)', margin: '2px 2px' },
  bottomText: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: '12px 14px', zIndex: 2,
  },
  tripName: {
    fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 15,
    color: 'white', margin: 0, lineHeight: 1.35,
    textShadow: '0 1px 4px rgba(0,0,0,.3)',
  },
  tripSub: {
    fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500,
    color: 'rgba(255,255,255,.8)', margin: '4px 0 0',
    textShadow: '0 1px 3px rgba(0,0,0,.3)',
  },
  bookedBadge: {
    position: 'absolute', top: 10, left: 10,
    padding: '5px 12px', borderRadius: 999,
    background: 'rgba(47,143,107,.85)', color: 'white',
    fontSize: 11, fontWeight: 800, backdropFilter: 'blur(4px)',
    fontFamily: 'var(--font-sans)', zIndex: 2,
  },
};
