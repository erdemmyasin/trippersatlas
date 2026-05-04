'use client';

import { useEffect, useState } from 'react';
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
  CarFront,
  Bus,
  Ticket,
  Calendar,
  ArrowRight,
} from 'lucide-react';

const QUIZ_CHIPS = [
  { id: 'explorer', label: 'Kaşif', Icon: MapPinned },
  { id: 'foodie', label: 'Gurme', Icon: UtensilsCrossed },
  { id: 'adventure', label: 'Maceraperest', Icon: Mountain },
];

const SERVICE_ICONS = [
  { key: 'tours', Icon: MapPinned, label: 'Turlar' },
  { key: 'hotel', Icon: Hotel, label: 'Oteller' },
  { key: 'flights', Icon: Plane, label: 'Uçuşlar' },
  { key: 'bus', Icon: Bus, label: 'Otobüsler' },
  { key: 'carRental', Icon: CarFront, label: 'Araç Kiralama' },
  { key: 'activities', Icon: Ticket, label: 'Aktiviteler' },
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
      'Sohbette doğal dilde yazın veya hızlı plandan şehir ve tarih seçin. Atlas bağlamı anlar; yurt içi ve yurtdışı aynı akışta.',
    extra: 'chips',
  },
  {
    icon: Sparkles,
    title: 'Önerileri inceleyin',
    body:
      'Konaklama, ulaşım ve deneyim özetleri tek ekranda toplanır. İsterseniz detaya geçip fiyat ve müsaitlik tarafını açarsınız.',
    extra: 'services',
  },
  {
    icon: Map,
    title: 'Rotayı görün, kaydedin',
    body:
      'Haritada güzergâh ve duraklar netleşir. Planı kaydedebilir, listene ekleyebilir veya sohbetle güncelleyebilirsin.',
    extra: 'trip',
  },
];

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
    <Link href="/#destinations" className="l-how__mini">
      <div className="l-how__mini-img">
        {(!imgSrc || imgState === 'loading') && <div className="l-how__mini-skel" aria-hidden />}
        {imgSrc && imgState !== 'error' && (
          <img
            src={imgSrc}
            alt=""
            loading="lazy"
            onLoad={() => setImgState('loaded')}
            onError={() => setImgState('error')}
            className={imgState === 'loaded' ? 'l-how__mini-img-el--on' : 'l-how__mini-img-el'}
          />
        )}
        <span className="l-how__mini-tag" style={{ background: MINI_TRIP.regionColor }}>
          {MINI_TRIP.region}
        </span>
      </div>
      <div className="l-how__mini-body">
        <strong className="l-how__mini-title">{MINI_TRIP.title}</strong>
        <div className="l-how__mini-meta">
          <span>
            <Calendar size={12} strokeWidth={2} aria-hidden /> {MINI_TRIP.days} gün
          </span>
          <span>
            <MapPinned size={12} strokeWidth={2} aria-hidden /> {MINI_TRIP.locations} lokasyon
          </span>
        </div>
        <span className="l-how__mini-link">
          Tüm geziler <ArrowRight size={13} strokeWidth={2.2} aria-hidden />
        </span>
      </div>
    </Link>
  );
}

export default function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="l-how" aria-labelledby="l-how-title">
      <div className="l-how__wrap">
        <header className="l-how__header">
          <span className="l-how__eyebrow">Nasıl çalışır</span>
          <h2 id="l-how-title" className="l-how__heading">
            Üç adımda netleşen plan
          </h2>
          <p className="l-how__sub">
            Sohbet, özet öneriler ve harita tek akışta. Tipik bir yolculuk için sıra kabaca böyle işler —
            içeriği siz özelleştirdikçe Atlas güncellenir.
          </p>
        </header>

        <ul className="l-how__rail" role="list">
          {STEPS.map(({ icon: Icon, title, body, extra }, i) => (
            <li key={title} className="l-how__card">
              <div className="l-how__card-head">
                <span className="l-how__card-num" aria-hidden>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="l-how__card-icon-wrap" aria-hidden>
                  <Icon size={22} strokeWidth={1.75} />
                </div>
              </div>
              <h3 className="l-how__card-title">{title}</h3>
              <p className="l-how__card-desc">{body}</p>

              {extra === 'chips' ? (
                <div className="l-how__embed">
                  <p className="l-how__embed-label">Örnek gezgin tipi</p>
                  <div className="l-how__pill-row" role="list">
                    {QUIZ_CHIPS.map(({ id, label, Icon: Ci }) => (
                      <Link key={id} href="/#quiz" className="l-how__pill" role="listitem">
                        <Ci size={14} strokeWidth={2} aria-hidden />
                        {label}
                      </Link>
                    ))}
                    <Link href="/#quiz" className="l-how__pill l-how__pill--ghost" role="listitem">
                      +3 daha
                    </Link>
                  </div>
                </div>
              ) : null}

              {extra === 'services' ? (
                <div className="l-how__embed">
                  <p className="l-how__embed-label">Tek ekranda</p>
                  <Link href="/#services" className="l-how__icon-strip">
                    <span className="l-how__icon-strip-inner">
                      {SERVICE_ICONS.map(({ key, Icon: Si, label }) => (
                        <span key={key} className="l-how__icon-slot" title={label}>
                          <Si size={16} strokeWidth={1.8} aria-hidden />
                        </span>
                      ))}
                    </span>
                    <span className="l-how__icon-strip-cap">6 hizmet bir arada</span>
                  </Link>
                </div>
              ) : null}

              {extra === 'trip' ? (
                <div className="l-how__embed l-how__embed--flush">
                  <MiniTripCard />
                </div>
              ) : null}
            </li>
          ))}
        </ul>

        <div className="l-how__actions">
          <Link href="/chat" className="l-how__btn l-how__btn--primary">
            Atlas&apos;a sor
          </Link>
          <Link href="/explore" className="l-how__btn l-how__btn--ghost">
            Keşfet
          </Link>
        </div>
      </div>
    </section>
  );
}
