'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Map, Sparkles } from 'lucide-react';
import { GLOBE_VIDEO_MASK_PATHS } from '@/lib/globeVideoMaskRegions';

const STEPS = [
  {
    icon: MessageCircle,
    title: 'Hedefini anlat',
    body:
      'Sohbette doğal dilde yaz veya hızlı plandan şehir ve tarih seç. Atlas bağlamı anlar, yurt içi ve yurt dışı için aynı akışta çalışır.',
  },
  {
    icon: Sparkles,
    title: 'Önerileri incele',
    body:
      'Konaklama, ulaşım ve deneyim özetleri tek ekranda toplanır; istersen detaya geçip fiyat ve müsaitlik tarafını açarsın.',
  },
  {
    icon: Map,
    title: 'Rotayı gör, kaydet, devam et',
    body:
      'Harita üzerinde güzergâh ve noktalar netleşir. Planını kaydedebilir, seyahat listene ekleyebilir veya sohbetle revize edebilirsin.',
  },
];

/** Küçük dosya; görünür alanda oynat (IntersectionObserver). */
const LOOP_SRC =
  'https://videos.pexels.com/video-files/3044326/3044326-hd_1366_720_25fps.mp4';

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
            {STEPS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="l-how__step">
                <div className="l-how__step-icon" aria-hidden>
                  <Icon size={22} strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="l-how__step-title">{title}</h3>
                  <p className="l-how__step-body">{body}</p>
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
                src={LOOP_SRC}
                muted
                loop
                playsInline
                preload="metadata"
                aria-label="Destinasyon görüntüsü — örnek döngü"
              />
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
              ? 'Video yalnızca kara parça içlerinde oynar; geri kalan alan beyaz zemine oturur.'
              : 'Hareket azaltıldı: sabit renk aynı maske ile gösteriliyor.'}
          </p>
        </div>
      </div>
    </section>
  );
}
