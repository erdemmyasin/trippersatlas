'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Sun, Cloud, CloudSun, CloudRain, CloudSnow, Wind } from 'lucide-react';
import WeatherDatePicker, { formatLocalYmd, weatherDateBounds } from './WeatherDatePicker';

const PLACEHOLDER = Array.from({ length: 10 }, (_, i) => ({
  slug: `p${i}`,
  city: '…',
  country: '—',
  temperature: null,
  weatherCode: null,
  windKmh: null,
  ok: false,
}));

function weatherKind(code) {
  if (code == null) return 'cloud';
  if (code === 0) return 'sun';
  if (code === 1) return 'sun';
  if (code === 2) return 'partly';
  if (code === 3) return 'cloud';
  if (code >= 45 && code <= 48) return 'cloud';
  if (code >= 51 && code <= 57) return 'rain';
  if (code >= 61 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'rain';
  if (code >= 85 && code <= 86) return 'snow';
  if (code >= 95) return 'rain';
  return 'partly';
}

function WeatherIcon({ code }) {
  const k = weatherKind(code);
  const props = { size: 36, strokeWidth: 1.75, color: 'var(--ta-accent)', 'aria-hidden': true };
  if (k === 'sun') return <Sun {...props} />;
  if (k === 'partly') return <CloudSun {...props} />;
  if (k === 'rain') return <CloudRain {...props} />;
  if (k === 'snow') return <CloudSnow {...props} />;
  return <Cloud {...props} />;
}

/** Üst sıra: İş → Sağlık → Turizm; URL ile eşlem: /hizli-seyahat/is vb. */
export const HIZLI_SEYAHAT_TABS = [
  { set: 'business', path: 'is', label: 'İş' },
  { set: 'health', path: 'saglik', label: 'Sağlık' },
  { set: 'tourism', path: 'turizm', label: 'Turizm' },
];

function slugToSet(slug) {
  const row = HIZLI_SEYAHAT_TABS.find((d) => d.path === slug);
  return row ? row.set : 'business';
}

/**
 * @param {{ travelSlug?: 'is' | 'saglik' | 'turizm' }} props
 * — Landing: props yok, #weather ile sekme seçimi yerinde kalır.
 * — Ayrı sayfa: travelSlug ile set kilitlenir; sekmeler diğer sayfalara gider.
 */
export default function LandingCapitalsWeather({ travelSlug }) {
  const activeSlug =
    travelSlug && HIZLI_SEYAHAT_TABS.some((d) => d.path === travelSlug) ? travelSlug : undefined;
  const pageMode = Boolean(activeSlug);

  const [tab, setTab] = useState(() => (activeSlug ? slugToSet(activeSlug) : 'business'));
  const [selectedDate, setSelectedDate] = useState(() => formatLocalYmd(new Date()));
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const { minYmd, maxYmd } = useMemo(() => weatherDateBounds(), []);

  useEffect(() => {
    if (activeSlug) setTab(slugToSet(activeSlug));
  }, [activeSlug]);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    const today = formatLocalYmd(new Date());
    const qs = new URLSearchParams({ set: tab });
    if (selectedDate !== today) qs.set('date', selectedDate);
    fetch(`/api/weather/capitals?${qs.toString()}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j?.cities?.length) {
          setData(j);
          setErr(null);
        } else setErr('empty');
      })
      .catch(() => {
        if (!cancelled) setErr('fetch');
      });
    return () => {
      cancelled = true;
    };
  }, [tab, selectedDate]);

  const badgeForecast = data?.mode === 'forecast_day';
  const cities = data?.cities || [];
  const loading = !data && !err;

  const sectionId = pageMode ? undefined : 'weather';

  const tabSwitcher = pageMode ? (
    <nav className="l-weather__tabs l-weather__tabs--head" aria-label="Hızlı seyahat">
      {HIZLI_SEYAHAT_TABS.map(({ set: setKey, path, label }) => (
        <Link
          key={path}
          href={`/hizli-seyahat/${path}`}
          className={`l-weather__tab ${tab === setKey ? 'l-weather__tab--on' : ''}`}
          aria-current={tab === setKey ? 'page' : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  ) : (
    <div className="l-weather__tabs l-weather__tabs--head" role="tablist" aria-label="Şehir seti">
      {HIZLI_SEYAHAT_TABS.map(({ set: setKey, label }) => (
        <button
          key={setKey}
          type="button"
          role="tab"
          aria-selected={tab === setKey}
          className={`l-weather__tab ${tab === setKey ? 'l-weather__tab--on' : ''}`}
          onClick={() => setTab(setKey)}
        >
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <section id={sectionId} className="l-weather">
      <div className="l-section__inner l-weather__inner">
        <div className="l-weather__shell">
          <header className="l-weather__head">
            <div className="l-weather__head-top">
              <div className="l-weather__head-title-tabs">
                <h2 className="l-weather__title-main">Hızlı Seyahat</h2>
                {tabSwitcher}
              </div>
              <div className="l-weather__head-meta">
                <div className="l-weather__head-date-row">
                  <WeatherDatePicker
                    value={selectedDate}
                    onChange={setSelectedDate}
                    minYmd={minYmd}
                    maxYmd={maxYmd}
                  />
                  <span
                    className={`l-weather__live ${badgeForecast ? 'l-weather__live--forecast' : ''}`}
                    title={badgeForecast ? 'Open-Meteo günlük tahmin' : 'Open-Meteo anlık hava'}
                  >
                    <span className="l-weather__live-dot" aria-hidden />
                    {badgeForecast ? 'tahmin' : 'canlı'}
                  </span>
                </div>
                <p className="l-weather__date-hint">
                  <span className="l-weather__date-hint-main">
                    Tahmin için yalnızca bugünden itibaren 15 gün seçilebilir.
                  </span>
                  <span className="l-weather__date-hint-note">(hava verisi sağlayıcısı sınırı)</span>
                </p>
              </div>
            </div>
            <p className="l-weather__title-sub">Hava durumu</p>
            <p className="l-weather__sub">
              Bir şehre dokunun; Atlas ile o destinasyonda sohbeti başlatın.
            </p>
          </header>

          <div className="l-weather__grid">
            {(cities.length ? cities : PLACEHOLDER).map((c, i) => (
              <CityCard key={`${tab}-${c.slug || c.city || i}`} row={c} loading={loading} />
            ))}
          </div>
          {err ? (
            <p className="l-weather__footnote">Hava verisi şu an yüklenemedi; kısa süre sonra yenileyin.</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function CityCard({ row, loading }) {
  const cc = row.country === 'GB' ? 'UK' : row.country || '—';
  const href = `/chat?newChat=1&dest=${encodeURIComponent(row.city)}`;
  const temp =
    row.temperature != null && Number.isFinite(row.temperature) ? `${row.temperature}°` : '—';
  const wind = row.windKmh != null && Number.isFinite(row.windKmh) ? `${row.windKmh} km/h` : '—';

  return (
    <Link href={href} className={`l-weather__card ${loading ? 'l-weather__card--skeleton' : ''}`}>
      <div className="l-weather__card-top">
        <div className="l-weather__card-meta">
          <span className="l-weather__cc-single">{cc}</span>
        </div>
        <WeatherIcon code={row.weatherCode} />
      </div>
      <div className="l-weather__city">{loading ? '…' : row.city}</div>
      <div className="l-weather__card-bottom">
        <span className="l-weather__temp">{temp}</span>
        <span className="l-weather__wind">
          <Wind size={14} strokeWidth={2} color="var(--ta-ink-muted)" aria-hidden />
          {wind}
        </span>
      </div>
    </Link>
  );
}
