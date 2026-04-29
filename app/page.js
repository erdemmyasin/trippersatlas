'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Bot,
  Car,
  Check,
  Gem,
  Globe,
  Hotel,
  Camera,
  Landmark,
  Map,
  MapPinned,
  Menu,
  Mountain,
  Palmtree,
  Plane,
  Ship,
  Sparkles,
  UtensilsCrossed,
  Wallet,
  X,
} from 'lucide-react';
import AtlasLogo from '@/components/AtlasLogo';
import LandingCapitalsWeather from '@/components/LandingCapitalsWeather';
import LandingHowItWorks from '@/components/LandingHowItWorks';
import NavLocaleCurrency from '@/components/NavLocaleCurrency';

const SVC_ICON_MAP = {
  hotel: Hotel,
  transfer: Car,
  tours: MapPinned,
  restaurant: UtensilsCrossed,
  flights: Plane,
  boat: Ship,
};

/* ═══════════════════════════════════════════════════════════
   Atlas — Landing Page
   Atlas — küresel AI seyahat planlama (Türkiye ağırlığı isteğe bağlı .env ile)
   ═══════════════════════════════════════════════════════════ */

const POPULAR_TRIPS = [
  {
    id: 'istanbul-culture',
    region: 'MARMARA',
    regionColor: '#E91E63',
    title: 'Romantizm, Kültür, Lezzet: İstanbul Keşfi',
    days: 5,
    locations: 4,
    query: 'Istanbul Bosphorus sunset mosque',
  },
  {
    id: 'cappadocia-balloon',
    region: 'İÇ ANADOLU',
    regionColor: '#9C27B0',
    title: 'Peri Bacaları ve Balon Turu: Kapadokya Masalı',
    days: 3,
    locations: 2,
    query: 'Cappadocia balloon sunrise',
  },
  {
    id: 'bodrum-aegean',
    region: 'EGE',
    regionColor: '#2196F3',
    title: 'Ege Rüyası: Bodrum Mavi Yolculuk ve Plaj',
    days: 7,
    locations: 3,
    query: 'Bodrum castle marina boats',
  },
  {
    id: 'antalya-riviera',
    region: 'AKDENİZ',
    regionColor: '#FF5722',
    title: 'Turkuaz Kıyılar ve Antik Kentler: Antalya',
    days: 5,
    locations: 4,
    query: 'Antalya Turkey old town beach',
  },
  {
    id: 'trabzon-green',
    region: 'KARADENİZ',
    regionColor: '#4CAF50',
    title: 'Yeşilin Elli Tonu: Trabzon ve Uzungöl Kaçamağı',
    days: 4,
    locations: 3,
    query: 'Uzungol lake green mountain',
  },
  {
    id: 'izmir-efes',
    region: 'EGE',
    regionColor: '#2196F3',
    title: 'Antik Efes\'ten Alaçatı\'ya: İzmir Rotası',
    days: 4,
    locations: 3,
    query: 'Alacati Turkey colorful street',
  },
  {
    id: 'mardin-mezopotamya',
    region: 'GÜNEYDOĞU',
    regionColor: '#FF9800',
    title: 'Mezopotamya\'nın Kapısı: Mardin Taş Evler',
    days: 3,
    locations: 2,
    query: 'Mardin Turkey old city stone',
  },
  {
    id: 'pamukkale-thermal',
    region: 'EGE',
    regionColor: '#00BCD4',
    title: 'Beyaz Cennet: Pamukkale ve Antik Hierapolis',
    days: 2,
    locations: 2,
    query: 'Pamukkale travertine white pool',
  },
];

const FEAT_ICON_MAP = {
  ai: Bot,
  maps: Map,
  prices: Wallet,
  photos: Landmark,
  i18n: Globe,
  budget: Sparkles,
};

const FEATURES = [
  { icon: 'ai', title: 'Yapay Zeka Destekli Planlama', desc: 'Gelişmiş yapay zeka ile saniyeler içinde kişiselleştirilmiş seyahat planları oluşturun.' },
  { icon: 'maps', title: 'İnteraktif Haritalar', desc: 'Rotanızı harita üzerinde görün, noktalar arası mesafeleri ve süreleri anlık hesaplayın.' },
  { icon: 'prices', title: 'Gerçek Zamanlı Fiyatlar', desc: 'Oteller, transferler ve turlar için canlı fiyat karşılaştırması yapın.' },
  { icon: 'photos', title: 'Fotoğraf ve Yorumlar', desc: 'Her destinasyon için yüksek kaliteli görseller ve gerçek gezgin yorumları görün.' },
  {
    icon: 'i18n',
    title: 'Çoklu Dil Desteği',
    desc: 'Türkçe, İngilizce, Almanca ve 9 farklı dilde hizmet alın.',
    soon: true,
  },
  { icon: 'budget', title: 'Akıllı Bütçe Takibi', desc: 'Harcamalarınızı kategorilere göre takip edin, bütçenizi aşmayın.' },
];

const QUIZ_ICON_MAP = {
  explorer: MapPinned,
  relaxer: Palmtree,
  foodie: UtensilsCrossed,
  culture: Landmark,
  adventure: Mountain,
  luxury: Gem,
};

/** Sıra: üst satır Turlar–Oteller–Uçuşlar; alt satır Transfer–Restoranlar–Tekne */
const SERVICES = [
  { icon: 'tours', title: 'Turlar', desc: 'Rehberli ve özel tur deneyimleri', active: true, href: '/inspire' },
  { icon: 'hotel', title: 'Oteller', desc: 'En iyi fiyatlarla otel rezervasyonu', active: true, href: '/stay' },
  { icon: 'flights', title: 'Uçuşlar', desc: 'Uçak bileti karşılaştırması', active: true, href: '/flights' },
  { icon: 'transfer', title: 'Transfer', desc: 'Havalimanı karşılama ve özel araç', active: true, href: '/cars' },
  { icon: 'restaurant', title: 'Restoranlar', desc: 'Yerel lezzetler ve fine dining', active: true },
  { icon: 'boat', title: 'Tekne Turları', desc: 'Mavi tur ve günlük tekne gezileri', active: true, href: '/explore' },
];

const QUIZ_TYPES = [
  { id: 'explorer',   icon: 'explorer', title: 'Kaşif',         desc: 'Bilinmeyen yerleri keşfetmeyi seversin' },
  { id: 'relaxer',    icon: 'relaxer', title: 'Dinlenme Sever', desc: 'Huzur ve konfor önceliğin' },
  { id: 'foodie',     icon: 'foodie', title: 'Gurme',          desc: 'Yerel lezzetler seni heyecanlandırır' },
  { id: 'culture',    icon: 'culture', title: 'Kültür Tutkunu', desc: 'Tarih ve sanat peşinde koşarsın' },
  { id: 'adventure',  icon: 'adventure', title: 'Maceraperest',   desc: 'Adrenalin ve doğa sporları favorin' },
  { id: 'luxury',     icon: 'luxury', title: 'Lüks Gezgin',    desc: 'Premium deneyimler ararsın' },
];

const STATS = [
  { num: '50K+', label: 'Oluşturulan plan' },
  { num: '200+', label: 'Destinasyon' },
  { num: '15K+', label: 'Mutlu gezgin' },
  { num: '4.9',  label: 'Kullanıcı puanı' },
];

/* ── Dynamic Trip Card with image fetching ── */
function TripCard({ trip }) {
  const [imgSrc, setImgSrc] = useState(null);
  const [imgState, setImgState] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/image?query=${encodeURIComponent(trip.query)}&type=tour`)
      .then(r => r.json())
      .then(data => { if (!cancelled) setImgSrc(data.url); })
      .catch(() => { if (!cancelled) setImgState('error'); });
    return () => { cancelled = true; };
  }, [trip.query]);

  return (
    <Link href="/chat" className="l-trip__card">
      <div className="l-trip__img-wrap">
        {/* Skeleton shimmer while loading */}
        {(!imgSrc || imgState === 'loading') && <div className="l-trip__skeleton" />}

        {imgSrc && imgState !== 'error' && (
          <img
            src={imgSrc}
            alt={trip.title}
            className="l-trip__img"
            loading="lazy"
            onLoad={() => setImgState('loaded')}
            onError={() => setImgState('error')}
            style={{ opacity: imgState === 'loaded' ? 1 : 0 }}
          />
        )}

        {imgState === 'error' && (
          <div className="l-trip__img-fallback">
            <Map size={28} strokeWidth={1.6} color="var(--ta-sea)" aria-hidden />
          </div>
        )}

        {/* Region badge */}
        <span
          className="l-trip__region"
          style={{ background: trip.regionColor }}
        >
          {trip.region}
        </span>
      </div>

      <div className="l-trip__body">
        <h3 className="l-trip__title">{trip.title}</h3>
        <div className="l-trip__meta">
          <span className="l-trip__meta-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            {trip.days} Gün
          </span>
          <span className="l-trip__meta-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {trip.locations} Lokasyon
          </span>
        </div>
      </div>
    </Link>
  );
}

const NAV_SCROLL_THRESHOLD = 48;

export default function LandingPage() {
  const landingRef = useRef(null);
  const navSolidRef = useRef(false);
  const [navSolid, setNavSolid] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [quizSelected, setQuizSelected] = useState(null);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const root = landingRef.current;
    if (!root) return undefined;
    const syncNav = () => {
      const next = root.scrollTop > NAV_SCROLL_THRESHOLD;
      if (next === navSolidRef.current) return;
      navSolidRef.current = next;
      setNavSolid(next);
      if (next) setMobileMenu(false);
    };
    syncNav();
    root.addEventListener('scroll', syncNav, { passive: true });
    return () => root.removeEventListener('scroll', syncNav);
  }, []);

  const onBrandClick = useCallback((e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const root = landingRef.current;
    if (!root || root.scrollTop <= 0) return;
    e.preventDefault();
    root.scrollTo({ top: 0, behavior: 'smooth' });
    setMobileMenu(false);
  }, []);

  return (
    <div className="landing" ref={landingRef}>
      {/* ── NAVBAR ── */}
      <nav className={`l-nav ${navSolid ? 'l-nav--solid' : ''}`}>
        <div className="l-nav__inner">
          <Link href="/" className="l-nav__brand" onClick={onBrandClick}>
            <span className="l-nav__mark l-nav__mark--logo">
              <AtlasLogo height={26} />
            </span>
            <span className="l-nav__logo">Atlas</span>
          </Link>

          <div className="l-nav__links">
            <a href="#weather" className="l-nav__link">Hızlı Seyahat</a>
            <a href="#destinations" className="l-nav__link">Popüler Geziler</a>
            <a href="#services" className="l-nav__link">Tek Platform</a>
            <a href="#quiz" className="l-nav__link">Gezgin Tipi</a>
          </div>

          <div className="l-nav__actions">
            <NavLocaleCurrency />
            <Link href="/auth/giris" className="l-nav__login">
              Giriş Yap
            </Link>
          </div>

          <button
            type="button"
            className="l-nav__hamburger"
            onClick={() => setMobileMenu((v) => !v)}
            aria-label="Menü"
          >
            {mobileMenu ? <X size={22} strokeWidth={2} aria-hidden /> : <Menu size={22} strokeWidth={2} aria-hidden />}
          </button>
        </div>

        {mobileMenu && (
          <div className="l-nav__mobile">
            <div className="l-nav__mobile-prefs">
              <NavLocaleCurrency className="l-prefs--stack" />
            </div>
            <Link
              href="/auth/giris"
              className="l-nav__login l-nav__login--mobile-bar"
              onClick={() => setMobileMenu(false)}
            >
              Giriş Yap
            </Link>
            <a href="#weather" className="l-nav__mobile-link" onClick={() => setMobileMenu(false)}>Hızlı Seyahat</a>
            <a href="#destinations" className="l-nav__mobile-link" onClick={() => setMobileMenu(false)}>Popüler Geziler</a>
            <a href="#services" className="l-nav__mobile-link" onClick={() => setMobileMenu(false)}>Tek Platform</a>
            <a href="#quiz" className="l-nav__mobile-link" onClick={() => setMobileMenu(false)}>Gezgin Tipi</a>
          </div>
        )}
      </nav>

        {/* ── HERO ── */}
        <section className="l-hero">
        <div className="l-hero__bg" />
        <div className="l-hero__content">
          <div className="l-hero__badge">
            <span className="l-hero__badge-dot" />
            Yapay Zeka Destekli Seyahat Planlama
          </div>
          <h1 className="ta-display l-hero__title">
            Seyahati <br />
            <span className="l-hero__title--accent">yeniden keşfet.</span>
          </h1>
          <p className="l-hero__sub">
            Atlas, kişisel yapay zeka seyahat asistanınız. Dünyanın her yerinde
            destinasyonları keşfedin, planları özelleştirin ve kolayca
            rezervasyon adımlarına geçin.
          </p>
          <div className="l-hero__actions">
            <Link href="/chat" className="l-hero__btn l-hero__btn--primary">
              <Sparkles size={18} strokeWidth={2} aria-hidden />
              Atlas&apos;a Sor
            </Link>
            <a href="#weather" className="l-hero__btn l-hero__btn--secondary">
              Hızlı Seyahat
            </a>
          </div>
          <div className="l-hero__stats">
            {STATS.map(s => (
              <div key={s.label} className="l-hero__stat">
                <span className="l-hero__stat-num">{s.num}</span>
                <span className="l-hero__stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Floating chat preview */}
        <div className="l-hero__preview">
          <div className="l-hero__chat-mock">
            <div className="l-hero__chat-header">
              <div className="l-hero__chat-avatar">A</div>
              <div>
                <div className="l-hero__chat-name">Atlas</div>
                <div className="l-hero__chat-status">Çevrimiçi</div>
              </div>
            </div>
            <div className="l-hero__chat-body">
              <div className="l-hero__chat-msg l-hero__chat-msg--ai">
                Merhaba! Ben Atlas. Nereye gitmek istediğinizi birlikte netleştirelim — yurt içi veya yurt dışı.
              </div>
              <div className="l-hero__chat-msg l-hero__chat-msg--user">
                İstanbul&apos;da 3 günlük romantik bir kaçamak istiyorum
              </div>
              <div className="l-hero__chat-msg l-hero__chat-msg--ai">
                Harika bir tercih! İstanbul&apos;da romantik bir gezi için size özel butik otel önerileri ve Boğaz manzaralı restoran seçenekleri hazırlıyorum...
              </div>
              <div className="l-hero__chat-cards">
                <div className="l-hero__mini-card">
                  <div className="l-hero__mini-img" style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>
                    <Hotel size={18} strokeWidth={2} aria-hidden />
                  </div>
                  <div className="l-hero__mini-info">
                    <span className="l-hero__mini-name">Pera Palace Hotel</span>
                    <span className="l-hero__mini-price">₺4.200/gece</span>
                  </div>
                </div>
                <div className="l-hero__mini-card">
                  <div className="l-hero__mini-img" style={{ background: 'linear-gradient(135deg,#f093fb,#f5576c)' }}>
                    <UtensilsCrossed size={18} strokeWidth={2} aria-hidden />
                  </div>
                  <div className="l-hero__mini-info">
                    <span className="l-hero__mini-name">Mikla Restaurant</span>
                    <span className="l-hero__mini-price">₺1.800/kişi</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LandingHowItWorks />

      <LandingCapitalsWeather />

      {/* ── POPULAR TRIPS ── */}
      <section id="destinations" className="l-section l-trips">
        <div className="l-section__inner">
          <div className="l-section__header">
            <span className="l-section__badge">İlham Alın</span>
            <h2 className="l-section__title">Popüler Geziler</h2>
            <p className="l-section__sub">
              Örnek rotalarla ilham alın; kendi destinasyonunuzu sohbette veya hızlı planda oluşturun.
            </p>
          </div>
          <div className="l-trips__grid">
            {POPULAR_TRIPS.map(trip => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="l-section l-feat">
        <div className="l-section__inner">
          <div className="l-section__header">
            <span className="l-section__badge">Özellikler</span>
            <h2 className="l-section__title">Seyahat planlamayı kolaylaştıran her şey</h2>
            <p className="l-section__sub">
              Gelişmiş yapay zeka, gerçek zamanlı veriler ve kullanıcı dostu arayüz bir arada.
            </p>
          </div>
          <div className="l-feat__grid">
            {FEATURES.map((f) => {
              const FeatIcon = FEAT_ICON_MAP[f.icon];
              return (
                <div
                  key={f.title}
                  className={`l-feat__card${f.soon ? ' l-feat__card--soon' : ''}`}
                >
                  {f.soon ? <span className="l-feat__soon">Yakında</span> : null}
                  <div className="l-feat__icon" aria-hidden>
                    {FeatIcon ? <FeatIcon size={24} strokeWidth={1.65} /> : null}
                  </div>
                  <h3 className="l-feat__title">{f.title}</h3>
                  <p className="l-feat__desc">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section id="services" className="l-section l-svc">
        <div className="l-section__inner">
          <div className="l-section__header">
            <span className="l-section__badge">Hepsi Bir Arada</span>
            <h2 className="l-section__title">Tüm ihtiyaçlarınız tek platformda</h2>
          </div>
          <div className="l-svc__grid">
            {SERVICES.map(svc => {
              const Icon = SVC_ICON_MAP[svc.icon];
              const cardClass = `l-svc__card ${!svc.active ? 'l-svc__card--soon' : ''} ${svc.href && svc.active ? 'l-svc__card--link' : ''}`;
              const body = (
                <>
                  <div className="l-svc__icon" aria-hidden>
                    {Icon ? <Icon size={26} strokeWidth={1.65} /> : null}
                  </div>
                  <h3 className="l-svc__title">{svc.title}</h3>
                  <p className="l-svc__desc">{svc.desc}</p>
                  {!svc.active && <span className="l-svc__soon">Yakında</span>}
                </>
              );
              if (svc.href && svc.active) {
                return (
                  <Link key={svc.title} href={svc.href} className={cardClass}>
                    {body}
                  </Link>
                );
              }
              return (
                <div key={svc.title} className={cardClass}>
                  {body}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TRAVEL QUIZ ── */}
      <section id="quiz" className="l-section l-quiz">
        <div className="l-section__inner">
          <div className="l-section__header">
            <span className="l-section__badge">GEZGİN TİPİNİZ</span>
            <h2 className="l-section__title">Ne tür bir gezginsiniz?</h2>
            <p className="l-section__sub">
              Seyahat stilinize göre özel öneriler alın.
            </p>
          </div>
          <div className="l-quiz__grid">
            {QUIZ_TYPES.map(q => {
              const QuizIcon = QUIZ_ICON_MAP[q.icon];
              return (
              <button
                key={q.id}
                className={`l-quiz__card ${quizSelected === q.id ? 'l-quiz__card--active' : ''}`}
                onClick={() => setQuizSelected((prev) => (prev === q.id ? null : q.id))}
              >
                <span className="l-quiz__icon" aria-hidden>
                  {QuizIcon ? <QuizIcon size={24} strokeWidth={1.65} /> : null}
                </span>
                <strong className="l-quiz__title">{q.title}</strong>
                <span className="l-quiz__desc">{q.desc}</span>
                {quizSelected === q.id && (
                  <span className="l-quiz__check" aria-hidden>
                    <Check size={14} strokeWidth={3} />
                  </span>
                )}
              </button>
              );
            })}
          </div>
          {quizSelected && (
            <div className="l-quiz__result">
              <p className="l-quiz__result-text">
                Harika! <strong>{QUIZ_TYPES.find(q => q.id === quizSelected)?.title}</strong> tipine uygun
                kişiselleştirilmiş öneriler sizi bekliyor.
              </p>
              <Link href="/chat" className="l-hero__btn l-hero__btn--primary">
                <Sparkles size={18} strokeWidth={2} aria-hidden />
                Kişisel Planımı Oluştur
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── NEWSLETTER / CTA ── */}
      <section className="l-section l-cta-section">
        <div className="l-section__inner">
          <div className="l-cta__card">
            <h2 className="l-cta__title">Seyahat fırsatlarından haberdar olun</h2>
            <p className="l-cta__sub">
              Özel teklifler, yeni destinasyonlar ve AI ile seyahat ipuçları için bültenimize katılın.
            </p>
            <div className="l-cta__form">
              <input
                type="email"
                placeholder="E-posta adresiniz"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="l-cta__input"
              />
              <button className="l-cta__btn" onClick={() => { if (email.trim()) { setEmail(''); alert('Kaydınız alındı!'); } }}>
                Abone Ol
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="l-footer">
        <div className="l-footer__inner">
          <div className="l-footer__top">
            <div className="l-footer__brand">
              <div className="l-footer__logo-row">
                <span className="l-nav__mark l-nav__mark--logo">
                  <AtlasLogo height={24} />
                </span>
                <span className="l-footer__logo-text">Atlas</span>
              </div>
              <p className="l-footer__tagline">
                Yapay zeka destekli kişisel seyahat asistanınız — küresel planlama, net arayüz.
              </p>
            </div>

            <div className="l-footer__col">
              <h4 className="l-footer__col-title">Platform</h4>
              <Link href="/chat" className="l-footer__link">Seyahat Planlayıcı</Link>
              <a href="#features" className="l-footer__link">Özellikler</a>
              <a href="#destinations" className="l-footer__link">Destinasyonlar</a>
              <a href="#quiz" className="l-footer__link">Seyahat Testi</a>
            </div>

            <div className="l-footer__col">
              <h4 className="l-footer__col-title">Hizmetler</h4>
              <a href="#" className="l-footer__link">Otel Rezervasyonu</a>
              <a href="#" className="l-footer__link">Transfer Hizmeti</a>
              <a href="#" className="l-footer__link">Tur Organizasyonu</a>
              <a href="#" className="l-footer__link">Restoran Önerileri</a>
            </div>

            <div className="l-footer__col">
              <h4 className="l-footer__col-title">Şirket</h4>
              <a href="#" className="l-footer__link">Hakkımızda</a>
              <a href="#" className="l-footer__link">İletişim</a>
              <a href="#" className="l-footer__link">Blog</a>
              <a href="#" className="l-footer__link">Kariyer</a>
            </div>

            <div className="l-footer__col">
              <h4 className="l-footer__col-title">Yasal</h4>
              <a href="#" className="l-footer__link">Gizlilik Politikası</a>
              <a href="#" className="l-footer__link">Kullanım Koşulları</a>
              <a href="#" className="l-footer__link">KVKK</a>
              <a href="#" className="l-footer__link">Çerez Politikası</a>
            </div>
          </div>

          <div className="l-footer__bottom">
            <p className="l-footer__copy">© 2026 Atlas. Tüm hakları saklıdır.</p>
            <div className="l-footer__social">
              <a href="#" className="l-footer__social-link" aria-label="Twitter">
                <X size={18} strokeWidth={2} />
              </a>
              <a href="#" className="l-footer__social-link" aria-label="Instagram">
                <Camera size={18} strokeWidth={2} />
              </a>
              <a href="#" className="l-footer__social-link" aria-label="LinkedIn">
                <span style={{ fontSize: 13, fontWeight: 800, fontFamily: 'var(--font-sans)' }}>in</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
