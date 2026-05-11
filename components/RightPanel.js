'use client';

import { Compass } from 'lucide-react';
import QuickPlanMap from '@/components/QuickPlanMap';

export const DEFAULT_MAP_MARKERS = [
  { top: '43%', left: '58%', label: 'Nehir Kenarı Konak', active: true },
  { top: '38%', left: '63%', label: 'Taş Avlu', active: false },
  { top: '56%', left: '47%', label: 'Arkeoloji Müzesi', active: false },
  { top: '34%', left: '52%', label: 'Amasya Kalesi', active: false },
  { top: '49%', left: '68%', label: 'Akşam yemeği', active: false },
];

export default function RightPanel({
  completedModules = new Set(),
  markers = DEFAULT_MAP_MARKERS,
  googleMap = null,
  mapHeadline = 'Harita görünümü',
  mapSubline = '',
  /** Gezi detay sağ panel: üstteki “Harita · …” rozetlerini kaldır, harita kutuyu doldursun */
  hideMapOverlay = false,
}) {
  /* completedModules arka plan takibi için korunur */
  void completedModules;
  const list = Array.isArray(markers) && markers.length > 0 ? markers : DEFAULT_MAP_MARKERS;

  const mapsKey = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY : '';
  const gm = googleMap && mapsKey && googleMap.center && Number.isFinite(googleMap.center.lat) && Number.isFinite(googleMap.center.lng);

  if (gm) {
    const gMarkers = Array.isArray(googleMap.markers) ? googleMap.markers : [];
    return (
      <>
        <div
          style={{
            ...s.mapShell,
            ...(hideMapOverlay
              ? {
                  flex: '1 1 0',
                  minHeight: 200,
                  minWidth: 0,
                }
              : {}),
          }}
        >
          <div style={s.mapInner}>
            <QuickPlanMap
              showChrome={false}
              fillHeight
              center={googleMap.center}
              markers={gMarkers}
              zoom={googleMap.zoom ?? 12}
              minHeight={0}
              onMarkerClick={googleMap.onMarkerClick}
              focusRequest={googleMap.focusRequest}
            />
          </div>
          {!hideMapOverlay ? (
            <div style={s.mapBadge} aria-hidden>
              <Compass size={12} strokeWidth={2.2} color="var(--ta-accent)" />
              <span>Atlas haritası</span>
            </div>
          ) : null}
        </div>
      </>
    );
  }

  return (
    <>
      {/* ── CSS Harita ── */}
      <div style={s.map}>
        <div className="ta-map-grid" />

        {/* Rota çizgisi */}
        <div style={s.route} />

        {/* Header pills */}
        <div style={s.mapHeader}>
          <span style={s.mapPill}>Harita görünümü · Amasya</span>
          <span style={s.mapPill}>3 otel · 4 durak · 1 transfer</span>
        </div>

        {/* Markers */}
        {list.map((m, i) => (
          <div key={i} style={{ ...s.markerWrap, top: m.top, left: m.left }}>
            <div style={{ ...s.marker, ...(m.active ? s.markerActive : {}) }} />
            <span style={s.markerLabel}>{m.label}</span>
          </div>
        ))}
      </div>

    </>
  );
}

const s = {
  /* ── Map (Google) ── */
  mapShell: {
    position: 'relative',
    minHeight: 0,
    flex: 1,
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    background: '#e8ebe5',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(31,77,92,0.12)',
    boxShadow: '0 10px 28px rgba(31,77,92,0.08)',
  },
  mapInner: {
    position: 'absolute',
    inset: 0,
    borderRadius: 'inherit',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
  mapBadge: {
    position: 'absolute',
    top: 'var(--space-3)',
    left: 'var(--space-3)',
    zIndex: 2,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-1)',
    padding: '6px var(--space-3)',
    borderRadius: 'var(--radius-pill)',
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(31,77,92,0.12)',
    boxShadow: '0 4px 12px rgba(31,77,92,0.10)',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--fw-bold)',
    letterSpacing: '0.04em',
    color: 'var(--ta-ink)',
    pointerEvents: 'none',
  },
  /* ── CSS Map (fallback) ── */
  map: {
    position: 'relative',
    borderRadius: '24px',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,.55)',
    background: `
      radial-gradient(circle at 25% 30%, rgba(122,175,132,.9), rgba(122,175,132,.16) 24%, transparent 26%),
      radial-gradient(circle at 74% 46%, rgba(122,175,132,.8), rgba(122,175,132,.12) 23%, transparent 24%),
      linear-gradient(135deg,#e2ebdf 0%,#d7e3d2 38%,#d5dfd1 39%,#d8d9e6 39.5%,#d2d6ec 100%)
    `,
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.28)',
    /* flex: 1 ile page.js'deki 1fr grid row'unu tam dolduracak */
    minHeight: 0,
    flex: 1,
  },
  route: {
    position: 'absolute',
    left: '44%', top: '33%', width: '28%', height: '24%',
    borderStyle: 'dashed',
    borderWidth: '2px',
    borderTopColor: 'rgba(31,27,22,.35)',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRadius: '50%',
    transform: 'rotate(8deg)',
    zIndex: 1,
  },
  mapHeader: {
    position: 'absolute',
    top: '12px', left: '12px', right: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
    zIndex: 3,
  },
  mapPill: {
    background: 'rgba(20,20,20,.72)',
    color: 'white',
    padding: '8px 11px',
    borderRadius: '999px',
    fontSize: '11px',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    boxShadow: '0 10px 22px rgba(0,0,0,.12)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '48%',
  },
  markerWrap: {
    position: 'absolute',
    zIndex: 2,
    transform: 'translate(-50%,-50%)',
    display: 'flex',
    alignItems: 'center',
  },
  marker: {
    width: '18px', height: '18px',
    borderRadius: '999px',
    background: '#1d1a16',
    border: '2.5px solid rgba(255,255,255,.8)',
    boxShadow: '0 6px 14px rgba(0,0,0,.18)',
    flexShrink: 0,
  },
  markerActive: {
    background: 'linear-gradient(180deg,#5f7a94,#3d5266)',
    width: '22px', height: '22px',
  },
  markerLabel: {
    marginLeft: '6px',
    background: 'rgba(29,26,22,.88)',
    color: 'white',
    fontSize: '10px',
    fontWeight: 700,
    padding: '5px 8px',
    borderRadius: '999px',
    whiteSpace: 'nowrap',
    boxShadow: '0 8px 16px rgba(0,0,0,.12)',
    fontFamily: 'var(--font-sans)',
  },

  /* ── Budget ── */
  budgetCard: {
    border: '1px solid var(--line)',
    background: 'rgba(255,255,255,.8)',
    borderRadius: '20px',
    padding: '16px',
  },
  budgetTop: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: '10px',
    marginBottom: '12px',
  },
  budgetMuted: {
    color: 'var(--muted)',
    fontSize: '12px',
    fontFamily: 'var(--font-sans)',
    marginBottom: '2px',
  },
  budgetTotal: {
    fontFamily: 'var(--font-serif)',
    fontSize: '32px',
    letterSpacing: '-0.04em',
    fontWeight: 700,
    color: 'var(--text1)',
    lineHeight: 1,
  },
  breakdown: {
    display: 'grid',
    gap: '10px',
  },
  lineItem: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: '8px',
    alignItems: 'center',
    fontSize: '13px',
    fontFamily: 'var(--font-sans)',
    color: 'var(--text1)',
  },
  lineLabel: { color: '#453d34' },
  lineAmt:   { color: 'var(--text1)', fontWeight: 700 },
  bar: {
    gridColumn: '1 / -1',
    height: '8px',
    background: 'rgba(20,20,20,.06)',
    borderRadius: '999px',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    background: 'linear-gradient(90deg,#5f7a94,#3d5266)',
    borderRadius: '999px',
    transition: 'width 0.4s ease',
  },

  /* ── Checklist ── */
  checkCard: {
    border: '1px solid var(--line)',
    background: 'rgba(255,255,255,.8)',
    borderRadius: '20px',
    padding: '16px',
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: 'var(--muted)',
    textTransform: 'uppercase',
    letterSpacing: '.08em',
    fontWeight: 700,
    fontFamily: 'var(--font-sans)',
  },
  checkCount: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--ta-accent-deep)',
    fontWeight: 500,
    textTransform: 'none',
    letterSpacing: 0,
  },
  microTrack: {
    height: '3px',
    background: 'rgba(20,20,20,.07)',
    borderRadius: '999px',
    overflow: 'hidden',
    marginBottom: '12px',
  },
  microFill: {
    height: '100%',
    background: 'var(--green)',
    borderRadius: '999px',
    transition: 'width .3s ease',
  },
  checkList: {
    display: 'grid',
    gap: '10px',
  },
  checkItem: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    fontSize: '13px',
    cursor: 'pointer',
    userSelect: 'none',
  },
  checkBullet: {
    width: '18px', height: '18px',
    borderRadius: '6px',
    border: '1px solid rgba(0,0,0,.14)',
    background: 'rgba(20,20,20,.03)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--muted)',
    fontSize: '12px',
    fontWeight: 900,
    flexShrink: 0,
    fontFamily: 'var(--font-sans)',
    transition: 'background .15s, border-color .15s',
  },
  checkBulletDone: {
    background: 'var(--green)',
    border: '1px solid var(--green)',
    color: 'white',
  },
  checkLabel: {
    fontFamily: 'var(--font-sans)',
    fontSize: '12px',
    lineHeight: 1.4,
  },
};
