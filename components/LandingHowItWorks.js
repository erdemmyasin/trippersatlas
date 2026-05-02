'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import {
  MessageCircle,
  Map,
  Sparkles,
  MapPinned,
  UtensilsCrossed,
  Mountain,
  Hotel,
  Plane,
  Car,
  Ship,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { GLOBE_VIDEO_MASK_PATHS } from '@/lib/globeVideoMaskRegions';

const QUIZ_CHIPS = [
  { id: 'explorer', label: 'Kaşif', Icon: MapPinned },
  { id: 'foodie', label: 'Gurme', Icon: UtensilsCrossed },
  { id: 'adventure', label: 'Maceraperest', Icon: Mountain },
];

const SERVICE_ICONS = [
  { key: 'tours', Icon: MapPinned, label: 'Turlar' },
  { key: 'hotel', Icon: Hotel, label: 'Oteller' },
  { key: 'flights', Icon: Plane, label: 'Uçuşlar' },
  { key: 'transfer', Icon: Car, label: 'Transfer' },
  { key: 'restaurant', Icon: UtensilsCrossed, label: 'Restoranlar' },
  { key: 'boat', Icon: Ship, label: 'Tekne' },
];

const MINI_TRIP = {
  title: 'Kapadokya Masalı',
  region: 'İÇ ANADOLU',
  regionColor: '#9C27B0',
  days: 3,
  locations: 2,
  query: 'Cappadocia balloon sunrise',
};

const STEPS = [
  {
    icon: MessageCircle,
    title: 'Hedefini anlat',
    body:
      'Sohbette doğal dilde yaz veya hızlı plandan şehir ve tarih seç. Atlas bağlamı anlar, yurt içi ve yurt dışı için aynı akışta çalışır.',
    extra: 'chips',
  },
  {
    icon: Sparkles,
    title: 'Önerileri incele',
    body:
      'Konaklama, ulaşım ve deneyim özetleri tek ekranda toplanır; istersen detaya geçip fiyat ve müsaitlik tarafını açarsın.',
    extra: 'services',
  },
  {
    icon: Map,
    title: 'Rotayı gör, kaydet, devam et',
    body:
      'Harita üzerinde güzergâh ve noktalar netleşir. Planını kaydedebilir, seyahat listene ekleyebilir veya sohbetle revize edebilirsin.',
    extra: 'trip',
  },
];

/** Yerel kompozit: public/videos/atlas-loop.mp4 (yoksa Pexels'e düşer). */
const LOCAL_LOOP = '/videos/atlas-loop.mp4';
const FALLBACK_LOOP =
  'https://videos.pexels.com/video-files/3044326/3044326-hd_1366_720_25fps.mp4';

function MiniTripCard() {
  const [imgSrc, setImgSrc] = useState(null);
  const [imgState, setImgState] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/image?query=${encodeURIComponent(MINI_TRIP.query)}&type=tour`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setImgSrc(data.url);
      })
      .catch(() => {
        if (!cancelled) setImgState('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Link href="/#destinations" className="l-how__trip-mini">
      <div className="l-how__trip-mini-img">
        {(!imgSrc || imgState === 'loading') && (
          <div className="l-how__trip-mini-skeleton" />
        )}
        {imgSrc && imgState !== 'error' && (
          <img
            src={imgSrc}
            alt={MINI_TRIP.title}
            loading="lazy"
            onLoad={() => setImgState('loaded')}
            onError={() => setImgState('error')}
            style={{ opacity: imgState === 'loaded' ? 1 : 0 }}
          />
        )}
        <span
          className="l-how__trip-mini-region"
          style={{ background: MINI_TRIP.regionColor }}
        >
          {MINI_TRIP.region}
        </span>
      </div>
      <div className="l-how__trip-mini-body">
        <strong className="l-how__trip-mini-title">{MINI_TRIP.title}</strong>
        <div className="l-how__trip-mini-meta">
          <span>
            <Calendar size={12} strokeWidth={2} aria-hidden /> {MINI_TRIP.days} Gün
          </span>
          <span>
            <MapPinned size={12} strokeWidth={2} aria-hidden /> {MINI_TRIP.locations} Lokasyon
          </span>
        </div>
        <span className="l-how__trip-mini-cta">
          Tüm geziler <ArrowRight size={13} strokeWidth={2.2} aria-hidden />
        </span>
      </div>
    </Link>
  );
}

export default function LandingHowItWorks() {
  const wrapRef = useRef(null);
  const videoRef = useRef(null);
  const [motionOk, setMotionOk] = useState(true);
  const maskId = `howGlobeVideoMask-${useId().replace(/:/g, '')}`;
  const maskUrl = `url(#${maskId})`;

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setMotionOk(!mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!motionOk) return;
    const el = wrapRef.current;
    const vid = videoRef.current;
    if (!el || !vid) return;

    const io = new IntersectionObserver(
      ([e]) => {
        if (!videoRef.current) return;
        if (e.isIntersecting && e.intersectionRatio > 0.12) {
          videoRef.current.play().catch(() => {});
        } else {
          videoRef.current.pause();
        }
      },
      { root: null, rootMargin: '80px 0px', threshold: [0, 0.12, 0.25] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [motionOk]);

  return (
    <section id="how-it-works" className="l-how" aria-labelledby="l-how-title">
      <div className="l-how__inner">
        <div className="l-how__copy">
          <span className="l-how__badge">Nasıl çalışır?</span>
          <h2 id="l-how-title" className="l-how__title">
            Birkaç adımda plana yaklaş
          </h2>
          <p className="l-how__lead">
            Atlas; sohbet, harita ve arama ekranlarını aynı akışta birleştirir. Aşağıdaki
            sıra tipik bir kullanım — metni sonra birlikte sıkılaştırırız.
          </p>
          <ol className="l-how__steps">
            {STEPS.map(({ icon: Icon, title, body, extra }) => (
              <li key={title} className="l-how__step">
                <div className="l-how__step-icon" aria-hidden>
                  <Icon size={22} strokeWidth={1.75} />
                </div>
                <div className="l-how__step-content">
                  <h3 className="l-how__step-title">{title}</h3>
                  <p className="l-how__step-body">{body}</p>

                  {extra === 'chips' && (
                    <div className="l-how__chips" role="list">
                      {QUIZ_CHIPS.map(({ id, label, Icon: ChipIcon }) => (
                        <Link
                          key={id}
                          href="/#quiz"
                          className="l-how__chip"
                          role="listitem"
                        >
                          <ChipIcon size={14} strokeWidth={2} aria-hidden />
                          {label}
                        </Link>
                      ))}
                      <Link href="/#quiz" className="l-how__chip l-how__chip--more">
                        +3 daha
                      </Link>
                    </div>
                  )}

                  {extra === 'services' && (
                    <Link href="/#services" className="l-how__svc-row">
                      {SERVICE_ICONS.map(({ key, Icon: SvcIcon, label }) => (
                        <span key={key} className="l-how__svc-pill" title={label}>
                          <SvcIcon size={15} strokeWidth={1.8} aria-hidden />
                        </span>
                      ))}
                      <span className="l-how__svc-caption">
                        6 hizmet · tek akış
                      </span>
                    </Link>
                  )}

                  {extra === 'trip' && <MiniTripCard />}
                </div>
              </li>
            ))}
          </ol>
          <div className="l-how__cta">
            <Link href="/chat" className="l-how__btn l-how__btn--primary">
              Atlas&apos;a sor
            </Link>
            <Link href="/explore" className="l-how__btn l-how__btn--ghost">
              Keşfet
            </Link>
          </div>
        </div>

        <div className="l-how__visual">
          <div ref={wrapRef} className="l-how__globe-stage">
            <svg className="l-how__svg-defs" aria-hidden focusable="false">
              <defs>
                <mask
                  id={maskId}
                  maskUnits="objectBoundingBox"
                  maskContentUnits="objectBoundingBox"
                  x="0"
                  y="0"
                  width="1"
                  height="1"
                >
                  <rect width="1" height="1" fill="black" />
                  <g fill="white">
                    {GLOBE_VIDEO_MASK_PATHS.map((d, i) => (
                      <path key={i} d={d} />
                    ))}
                  </g>
                </mask>
              </defs>
            </svg>
            <div className="l-how__globe-white-fill" aria-hidden />
            {motionOk ? (
              <video
                ref={videoRef}
                className="l-how__video"
                style={{ mask: maskUrl, WebkitMask: maskUrl }}
                muted
                loop
                playsInline
                preload="metadata"
                aria-label="Destinasyon görüntüsü — örnek döngü"
              >
                <source src={LOCAL_LOOP} type="video/mp4" />
                <source src={FALLBACK_LOOP} type="video/mp4" />
              </video>
            ) : (
              <div
                className="l-how__video l-how__video--static"
                style={{ mask: maskUrl, WebkitMask: maskUrl }}
                aria-hidden
              />
            )}
            <img
              className="l-how__globe-line"
              src="/landing-globe-line.png"
              alt=""
              width={800}
              height={800}
              decoding="async"
              draggable={false}
            />
          </div>
          <p className="l-how__visual-caption">
            {motionOk
              ? 'Deniz, dağ ve şehir kareleri kara parçalarının içinde döner.'
              : 'Hareket azaltıldı: sabit renk aynı maske ile gösteriliyor.'}
          </p>
        </div>
      </div>
    </section>
  );
}
