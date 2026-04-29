'use client';

import GoogleMap from '@/components/GoogleMap';

/**
 * Hızlı plan (konaklama / uçuş / araç) için ortak harita çerçevesi.
 * NEXT_PUBLIC_GOOGLE_MAPS_KEY yoksa veya merkez geçersizse `fallback` gösterilir.
 */
export default function QuickPlanMap({
  headline = 'Harita',
  subline = '',
  center,
  markers = [],
  zoom = 12,
  minHeight = 320,
  onMarkerClick,
  focusRequest = null,
  fallback = null,
  /** Başlık + çerçeve olmadan sadece harita (ör. sohbet sağ panel) */
  showChrome = true,
  /** Üst konteyner yüksekliğini doldur (yan panel harita — alt boşluk olmasın) */
  fillHeight = false,
}) {
  const key = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY : '';
  const ok =
    key && center && Number.isFinite(center.lat) && Number.isFinite(center.lng);

  if (!ok) {
    return fallback ? <>{fallback}</> : null;
  }

  if (!showChrome) {
    return (
      <div
        style={{
          width: '100%',
          height: fillHeight ? '100%' : undefined,
          minHeight: fillHeight ? 0 : minHeight,
          flex: fillHeight ? '1 1 0' : undefined,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <GoogleMap
          center={center}
          markers={markers}
          zoom={zoom}
          onMarkerClick={onMarkerClick}
          focusRequest={focusRequest}
          flexFill={fillHeight}
          style={
            fillHeight
              ? { flex: '1 1 0', minHeight: 0, width: '100%' }
              : { width: '100%', minHeight }
          }
        />
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        height: fillHeight ? '100%' : undefined,
        minHeight: fillHeight ? 0 : undefined,
        flex: fillHeight ? '1 1 0' : undefined,
      }}
    >
      {(headline || subline) && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0,
          }}
        >
          {headline ? (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--ta-ink)',
                background: 'rgba(255,255,255,.92)',
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid rgba(0,0,0,.08)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {headline}
            </span>
          ) : null}
          {subline ? (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--ta-ink-muted)',
                background: 'rgba(255,255,255,.88)',
                padding: '6px 10px',
                borderRadius: 8,
                fontFamily: 'var(--font-sans)',
              }}
            >
              {subline}
            </span>
          ) : null}
        </div>
      )}
      <div
        style={{
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid rgba(0,0,0,.08)',
          minHeight: fillHeight ? 0 : minHeight,
          flex: fillHeight ? '1 1 0' : undefined,
          background: '#e8ebe5',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <GoogleMap
          center={center}
          markers={markers}
          zoom={zoom}
          onMarkerClick={onMarkerClick}
          focusRequest={focusRequest}
          flexFill={fillHeight}
          style={fillHeight ? { flex: '1 1 0', minHeight: 0 } : undefined}
        />
      </div>
    </div>
  );
}
