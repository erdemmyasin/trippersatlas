'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

let mapsLoadPromise = null;

function loadMapsScript(apiKey) {
  if (typeof window === 'undefined') return Promise.reject(new Error('ssr'));
  if (window.google?.maps?.Map) return Promise.resolve();
  if (mapsLoadPromise) return mapsLoadPromise;
  mapsLoadPromise = new Promise((resolve, reject) => {
    const cb = `__taGmInit_${Date.now()}`;
    window[cb] = () => {
      try {
        delete window[cb];
      } catch {
        /* ignore */
      }
      resolve();
    };
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&loading=async&callback=${cb}`;
    s.async = true;
    s.onerror = () => {
      try {
        delete window[cb];
      } catch {
        /* ignore */
      }
      mapsLoadPromise = null;
      reject(new Error('maps_load_failed'));
    };
    document.head.appendChild(s);
  });
  return mapsLoadPromise;
}

function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Atlas — açık, minimal harita */
const MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#f4f3ef' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#5c574f' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f4f3ef' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#d8d4cc' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e5e2db' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#d0ccc4' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c5d4cc' }] },
];

function buildInfoHtml(m) {
  const img = m.imageUrl
    ? `<img src="${esc(m.imageUrl)}" alt="" style="width:100%;max-height:100px;object-fit:cover;border-radius:8px;margin-bottom:8px;" />`
    : '';
  const price = m.price ? `<div style="font-weight:800;color:#2f3f52;margin-top:4px;">${esc(m.price)}</div>` : '';
  const rating =
    m.rating != null
      ? `<div style="display:flex;align-items:center;gap:4px;font-size:12px;color:#2e7d32;font-weight:600;margin-top:2px;font-family:General Sans,ui-sans-serif,sans-serif;"><svg width="12" height="12" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" stroke-width="1" aria-hidden="true"><path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg><span>${esc(String(m.rating))}</span></div>`
      : '';
  return `<div style="font-family:General Sans,ui-sans-serif,sans-serif;max-width:220px;padding:4px;">
    ${img}
    <div style="font-weight:700;font-size:14px;color:var(--ta-ink);">${esc(m.title || '')}</div>
    ${rating}
    ${price}
  </div>`;
}

function markerIconForVariant(g, variant) {
  const sel = variant === 'selected';
  const hov = variant === 'hover';
  const scale = sel ? 11 : hov ? 9 : 7;
  const fill = sel ? '#2f3f52' : '#6a7c8e';
  return {
    path: g.SymbolPath.CIRCLE,
    fillColor: fill,
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
    scale,
  };
}

export default function GoogleMap({
  center = { lat: 41.0082, lng: 28.9784 },
  markers = [],
  zoom = 12,
  onMarkerClick,
  /** { lat, lng, at?: number } — haritayı bu noktaya yakınlaştır (kart Seç vb.) */
  focusRequest = null,
  /** Üst flex sütununda kalan yüksekliği doldur (minHeight 0) */
  flexFill = false,
  className,
  style,
}) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const boundsSigRef = useRef('');
  const iwRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const onMarkerClickRef = useRef(onMarkerClick);
  onMarkerClickRef.current = onMarkerClick;
  const focusRequestRef = useRef(focusRequest);
  focusRequestRef.current = focusRequest;

  const clearMarkers = useCallback(() => {
    for (const x of markersRef.current) {
      try {
        x.setMap(null);
      } catch {
        /* ignore */
      }
    }
    markersRef.current = [];
  }, []);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    if (!key) {
      setLoading(false);
      setError('no_key');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        await loadMapsScript(key);
        if (cancelled || !ref.current) return;
        const g = window.google?.maps;
        if (!g) throw new Error('no_google');

        const map = new g.Map(ref.current, {
          center: { lat: Number(center.lat), lng: Number(center.lng) },
          zoom,
          styles: MAP_STYLE,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
        });
        mapRef.current = map;
        iwRef.current = new g.InfoWindow();

        setLoading(false);
        setError(null);
      } catch (e) {
        console.error('GoogleMap init', e);
        if (!cancelled) {
          setLoading(false);
          setError(String(e?.message || e));
        }
      }
    })();

    return () => {
      cancelled = true;
      clearMarkers();
      mapRef.current = null;
      iwRef.current = null;
    };
    // Harita tek sefer oluşturulur; merkez/zoom marker effect içinde güncellenir.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once
  }, [clearMarkers]);

  useEffect(() => {
    const map = mapRef.current;
    const g = window.google?.maps;
    if (!map || !g || loading || error) return;

    clearMarkers();
    const iw = iwRef.current;

    const valid = (markers || []).filter((m) => m != null && Number.isFinite(m.lat) && Number.isFinite(m.lng));
    if (valid.length === 0) {
      boundsSigRef.current = '';
      map.setCenter({ lat: Number(center.lat), lng: Number(center.lng) });
      map.setZoom(zoom);
      return;
    }

    const boundsSig = valid.map((m) => `${m.lat},${m.lng}`).join('|');
    const boundsChanged = boundsSig !== boundsSigRef.current;
    boundsSigRef.current = boundsSig;

    const fr = focusRequestRef.current;
    const hasFocus = fr && Number.isFinite(fr.lat) && Number.isFinite(fr.lng);

    if (!hasFocus && boundsChanged) {
      if (valid.length === 1) {
        map.setCenter({ lat: valid[0].lat, lng: valid[0].lng });
        map.setZoom(Math.max(zoom, 14));
      } else {
        const bounds = new g.LatLngBounds();
        valid.forEach((m) => bounds.extend({ lat: m.lat, lng: m.lng }));
        map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 });
      }
    }

    valid.forEach((m) => {
      const variant = m.variant === 'selected' ? 'selected' : m.variant === 'hover' ? 'hover' : 'default';
      const marker = new g.Marker({
        position: { lat: m.lat, lng: m.lng },
        map,
        title: m.title || '',
        icon: markerIconForVariant(g, variant),
        zIndex: variant === 'selected' ? 30 : variant === 'hover' ? 20 : 10,
      });
      marker.addListener('click', () => {
        onMarkerClickRef.current?.(m);
        if (iw) {
          iw.setContent(buildInfoHtml(m));
          iw.open({ map, anchor: marker });
        }
      });
      markersRef.current.push(marker);
    });
  }, [markers, center.lat, center.lng, zoom, loading, error, clearMarkers]);

  useEffect(() => {
    const map = mapRef.current;
    const g = window.google?.maps;
    if (!map || !g || loading || error) return;
    if (!focusRequest || !Number.isFinite(focusRequest.lat) || !Number.isFinite(focusRequest.lng)) return;
    map.panTo({ lat: focusRequest.lat, lng: focusRequest.lng });
    map.setZoom(15);
  }, [focusRequest, loading, error]);

  const wrapStyle = {
    width: '100%',
    height: '100%',
    minHeight: flexFill ? 0 : 280,
    position: 'relative',
    borderRadius: 'inherit',
    overflow: 'hidden',
    ...style,
  };

  return (
    <div className={className} style={wrapStyle}>
      {loading ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg,#e8e6e1 25%,#f2f0ec 50%,#e8e6e1 75%)',
            backgroundSize: '200% 100%',
            animation: 'skeletonShimmer 1.4s ease-in-out infinite',
            zIndex: 2,
          }}
          aria-hidden
        />
      ) : null}
      {error === 'no_key' ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            fontSize: 12,
            color: 'var(--ta-ink-muted)',
            padding: 16,
            textAlign: 'center',
            zIndex: 1,
          }}
        >
          Harita için NEXT_PUBLIC_GOOGLE_MAPS_KEY tanımlayın
        </div>
      ) : null}
      {error && error !== 'no_key' ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            fontSize: 12,
            color: 'var(--ta-ink-muted)',
            zIndex: 1,
          }}
        >
          Harita yüklenemedi
        </div>
      ) : null}
      <div
        ref={ref}
        style={{ width: '100%', height: '100%', minHeight: flexFill ? 0 : 280 }}
      />
    </div>
  );
}
