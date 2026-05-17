'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Briefcase, Check, ChevronRight, Plus } from 'lucide-react';
import {
  appendListingToTrip,
  createTripFromService,
} from '@/lib/quickPlanToTrip';
import { getTrips } from '@/lib/tripStore';

/**
 * Hızlı plan listing kartlarına bağlanan ikon-only "plana kaydet" butonu.
 *
 * Tıklama → küçük dropdown:
 *   1. "+ Yeni Plan"   → createTripFromService + navigate to /trips/{id}
 *   2. "Plana Ekle ›"  → hover/click ile sağa nested submenu açılır,
 *                        kullanıcının mevcut planları listelenir, tıklanan plana
 *                        listing eklenir (appendListingToTrip), küçük tik geri bildirimi.
 */
export default function TripifyButton({
  serviceType,
  listing,
  destination,
  startDate,
  endDate,
  tripName,
  autoBook = true,
  navigateAfter = true,
  label = 'Plana kaydet',
  successLabel = 'Plana eklendi',
  /** Aktif "context" planı: varsa submenu'da en üste alınır, vurgulanır */
  preferTripId = null,
}) {
  const router = useRouter();
  const wrapRef = useRef(null);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [doneLabel, setDoneLabel] = useState(successLabel);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [submenuPos, setSubmenuPos] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const trips = useMemo(() => {
    if (!menuOpen) return [];
    const all = getTrips();
    if (!preferTripId) return all;
    const sid = String(preferTripId);
    const focus = all.find((t) => String(t.id) === sid);
    if (!focus) return all;
    return [focus, ...all.filter((t) => String(t.id) !== sid)];
  }, [menuOpen, preferTripId]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Buton pozisyonuna göre menü konumu (viewport-clamp + sağa açılmazsa sola sığdır)
  useLayoutEffect(() => {
    if (!menuOpen) return;
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const menuW = 200;
    const padding = 8;
    let left = rect.right - menuW;
    if (left < padding) left = padding;
    if (left + menuW > window.innerWidth - padding) {
      left = window.innerWidth - menuW - padding;
    }
    setMenuPos({ top: rect.bottom + 6, left });
  }, [menuOpen]);

  useLayoutEffect(() => {
    if (!submenuOpen) return;
    const menu = menuRef.current;
    if (!menu) return;
    const rect = menu.getBoundingClientRect();
    const subW = 260;
    let left = rect.right + 6;
    if (left + subW > window.innerWidth - 8) {
      // Sağa sığmıyorsa menünün soluna aç
      left = rect.left - subW - 6;
    }
    setSubmenuPos({ top: rect.top, left });
  }, [submenuOpen, menuOpen]);

  // Outside click + Escape — portal menü/submenu de "içerik" sayılır
  useEffect(() => {
    if (!menuOpen) return undefined;
    function onPointer(e) {
      if (wrapRef.current?.contains(e.target)) return;
      // portal içindeki menü/submenu kapanmasın
      const insidePortal = e.target.closest?.('[data-tripify-portal="true"]');
      if (insidePortal) return;
      setMenuOpen(false);
      setSubmenuOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setSubmenuOpen(false);
      }
    }
    document.addEventListener('pointerdown', onPointer, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  function handleNewPlan() {
    setMenuOpen(false);
    setSubmenuOpen(false);
    const id = createTripFromService({
      serviceType,
      listing,
      destination,
      startDate,
      endDate,
      tripName,
      autoBook,
    });
    if (!id) return;
    setDoneLabel('Plan oluşturuldu');
    setDone(true);
    if (navigateAfter) {
      setTimeout(() => {
        router.push(`/trips/${encodeURIComponent(id)}`);
      }, 450);
    }
  }

  function handleAppendToTrip(trip) {
    const ok = appendListingToTrip(trip.id, {
      serviceType,
      listing,
      autoBook,
    });
    setMenuOpen(false);
    setSubmenuOpen(false);
    if (ok) {
      setDoneLabel(`${trip.name} planına eklendi`);
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    }
  }

  const portal = mounted && menuOpen && typeof document !== 'undefined' ? createPortal(
    <>
      <div
        ref={menuRef}
        data-tripify-portal="true"
        style={{ ...s.menu, top: menuPos.top, left: menuPos.left }}
        role="menu"
      >
        <button
          type="button"
          style={s.menuItem}
          role="menuitem"
          onClick={handleNewPlan}
        >
          <span style={s.menuIcon} aria-hidden>
            <Plus size={13} strokeWidth={2.4} />
          </span>
          <span style={s.menuLabel}>Yeni Plan</span>
        </button>

        <button
          type="button"
          style={{
            ...s.menuItem,
            ...(submenuOpen ? s.menuItemActive : {}),
          }}
          role="menuitem"
          aria-haspopup="menu"
          aria-expanded={submenuOpen}
          onClick={() => setSubmenuOpen((v) => !v)}
          onMouseEnter={() => setSubmenuOpen(true)}
        >
          <span style={s.menuIcon} aria-hidden>
            <Briefcase size={13} strokeWidth={2.2} />
          </span>
          <span style={s.menuLabel}>Plana Ekle</span>
          <ChevronRight size={13} strokeWidth={2.2} aria-hidden style={{ marginLeft: 'auto' }} />
        </button>
      </div>

      {submenuOpen ? (
        <div
          data-tripify-portal="true"
          style={{ ...s.submenu, top: submenuPos.top, left: submenuPos.left }}
          role="menu"
        >
          <div style={s.submenuHead}>Mevcut planlar</div>
          {trips.length === 0 ? (
            <div style={s.submenuEmpty}>Henüz planınız yok</div>
          ) : (
            trips.slice(0, 8).map((trip) => {
              const isContext = preferTripId && String(trip.id) === String(preferTripId);
              return (
                <button
                  key={trip.id}
                  type="button"
                  role="menuitem"
                  style={{
                    ...s.submenuItem,
                    ...(isContext ? s.submenuItemContext : {}),
                  }}
                  onClick={() => handleAppendToTrip(trip)}
                >
                  {isContext ? (
                    <span style={s.submenuContextTag}>Aktif plan</span>
                  ) : null}
                  <span style={s.submenuName}>{trip.name}</span>
                  {trip.destination ? (
                    <span style={s.submenuDest}>{trip.destination}</span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </>,
    document.body
  ) : null;

  return (
    <div ref={wrapRef} style={s.wrap}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => {
          if (done) return;
          setMenuOpen((v) => !v);
          setSubmenuOpen(false);
        }}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        title={label}
        style={{
          ...s.btn,
          ...(done ? s.btnDone : s.btnIdle),
        }}
      >
        {done ? (
          <Check size={14} strokeWidth={2.6} aria-hidden />
        ) : (
          <Briefcase size={14} strokeWidth={2.2} aria-hidden />
        )}
      </button>

      {done && doneLabel ? (
        <div style={s.toast} role="status">{doneLabel}</div>
      ) : null}

      {portal}
    </div>
  );
}

const s = {
  wrap: {
    position: 'relative',
    display: 'inline-block',
  },
  btn: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    transition: 'background var(--duration-fast) var(--ease-out), border-color var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out)',
  },
  btnIdle: {
    background: 'rgba(31, 77, 92, 0.06)',
    borderColor: 'rgba(31, 77, 92, 0.32)',
    color: 'var(--ta-accent)',
  },
  btnDone: {
    background: 'var(--ta-accent)',
    borderColor: 'var(--ta-accent)',
    color: '#fff',
    cursor: 'default',
  },
  toast: {
    position: 'absolute',
    top: -32,
    right: 0,
    padding: '4px 10px',
    background: 'var(--ta-ink)',
    color: '#fff',
    fontFamily: 'var(--font-sans)',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.04em',
    borderRadius: 'var(--radius-pill)',
    whiteSpace: 'nowrap',
    boxShadow: '0 6px 16px rgba(15,23,32,0.20)',
    pointerEvents: 'none',
    zIndex: 30,
  },
  menu: {
    position: 'fixed',
    minWidth: 200,
    padding: 4,
    background: '#fff',
    borderRadius: 'var(--radius-md)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(31, 77, 92, 0.18)',
    boxShadow: '0 12px 32px rgba(15, 23, 32, 0.18)',
    zIndex: 2147483600,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  menuItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 10px',
    background: 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-xs)',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'var(--font-sans)',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--ta-ink)',
    lineHeight: 1.2,
    transition: 'background var(--duration-fast) var(--ease-out)',
  },
  menuItemActive: {
    background: 'rgba(31, 77, 92, 0.06)',
  },
  menuIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 22,
    height: 22,
    borderRadius: 'var(--radius-xs)',
    background: 'rgba(31, 77, 92, 0.08)',
    color: 'var(--ta-accent)',
    flexShrink: 0,
  },
  menuLabel: {
    flex: 1,
    minWidth: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  submenu: {
    position: 'fixed',
    minWidth: 260,
    maxHeight: 320,
    overflowY: 'auto',
    padding: 4,
    background: '#fff',
    borderRadius: 'var(--radius-md)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(31, 77, 92, 0.18)',
    boxShadow: '0 12px 32px rgba(15, 23, 32, 0.18)',
    zIndex: 2147483601,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  submenuHead: {
    padding: '6px 10px 4px',
    fontFamily: 'var(--font-sans)',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--ta-ink-muted)',
  },
  submenuEmpty: {
    padding: '8px 10px 12px',
    fontFamily: 'var(--font-sans)',
    fontSize: 12,
    color: 'var(--ta-ink-muted)',
  },
  submenuItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
    padding: '8px 10px',
    background: 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-xs)',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'var(--font-sans)',
    transition: 'background var(--duration-fast) var(--ease-out)',
  },
  submenuItemContext: {
    background: 'rgba(31, 77, 92, 0.08)',
    borderLeftWidth: 3,
    borderLeftStyle: 'solid',
    borderLeftColor: 'var(--ta-accent)',
    paddingLeft: 7,
  },
  submenuContextTag: {
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--ta-accent)',
  },
  submenuName: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--ta-ink)',
    lineHeight: 1.3,
    maxWidth: 220,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  submenuDest: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--ta-ink-muted)',
  },
};
