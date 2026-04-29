'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

/* ═══════════════════════════════════════════════════════════
   TripperAtlas — Landing Page
   Türkiye odaklı AI seyahat planlama platformu
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

const STEPS = [
  { num: '01', icon: '💬', title: 'Seyahatinizi anlatın', desc: 'Yapay zeka asistanımıza nereye gitmek istediğinizi, bütçenizi ve tercihlerinizi doğal dille anlatın.' },
  { num: '02', icon: '✨', title: 'Kişisel öneriler alın', desc: 'Fotoğraflar, haritalar ve gerçek kullanıcı yorumlarıyla desteklenen kişiselleştirilmiş öneriler keşfedin.' },
  { num: '03', icon: '🗺️', title: 'Planınızı tamamlayın', desc: 'Otel, transfer, aktivite — hepsini tek panelden yönetin, gerçek fiyatlarla rezerve edin.' },
];

const FEATURES = [
  { icon: '🤖', title: 'Yapay Zeka Destekli Planlama', desc: 'Gelişmiş yapay zeka ile saniyeler içinde kişiselleştirilmiş seyahat planları oluşturun.' },
  { icon: '🗺️', title: 'İnteraktif Haritalar', desc: 'Rotanızı harita üzerinde görün, noktalar arası mesafeleri ve süreleri anlık hesaplayın.' },
  { icon: '💰', title: 'Gerçek Zamanlı Fiyatlar', desc: 'Oteller, transferler ve turlar için canlı fiyat karşılaştırması yapın.' },
  { icon: '📸', title: 'Fotoğraf ve Yorumlar', desc: 'Her destinasyon için yüksek kaliteli görseller ve gerçek gezgin yorumları görün.' },
  { icon: '🌍', title: 'Çoklu Dil Desteği', desc: 'Türkçe, İngilizce, Almanca ve 9 farklı dilde hizmet alın.' },
  { icon: '📊', title: 'Akıllı Bütçe Takibi', desc: 'Harcamalarınızı kategorilere göre takip edin, bütçenizi aşmayın.' },
];

const SERVICES = [
  { icon: '🏨', title: 'Oteller', desc: 'En iyi fiyatlarla otel rezervasyonu', active: true },
  { icon: '🚗', title: 'Transfer', desc: 'Havalimanı karşılama ve özel araç', active: true },
  { icon: '🎡', title: 'Turlar', desc: 'Rehberli ve özel tur deneyimleri', active: true },
  { icon: '🍽️', title: 'Restoranlar', desc: 'Yerel lezzetler ve fine dining', active: true },
  { icon: '✈️', title: 'Uçuşlar', desc: 'Uçak bileti karşılaştırması', active: false },
  { icon: '⛵', title: 'Tekne Turları', desc: 'Mavi tur ve günlük tekne gezileri', active: true },
];

const QUIZ_TYPES = [
  { id: 'explorer',   icon: '🧭', title: 'Kaşif',         desc: 'Bilinmeyen yerleri keşfetmeyi seversin' },
  { id: 'relaxer',    icon: '🏖️', title: 'Dinlenme Sever', desc: 'Huzur ve konfor önceliğin' },
  { id: 'foodie',     icon: '🍴', title: 'Gurme',          desc: 'Yerel lezzetler seni heyecanlandırır' },
  { id: 'culture',    icon: '🏛️', title: 'Kültür Tutkunu', desc: 'Tarih ve sanat peşinde koşarsın' },
  { id: 'adventure',  icon: '🏔️', title: 'Maceraperest',   desc: 'Adrenalin ve doğa sporları favorin' },
  { id: 'luxury',     icon: '💎', title: 'Lüks Gezgin',    desc: 'Premium deneyimler ararsın' },
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
            <span>🗺️</span>
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

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [quizSelected, setQuizSelected] = useState(null);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navSolid = scrollY > 60;

  return (
    <div className="landing">
      {/* ── NAVBAR ── */}
      <nav className={`l-nav ${navSolid ? 'l-nav--solid' : ''}`}>
        <div className="l-nav__inner">
          <Link href="/" className="l-nav__brand">
            <span className="l-nav__mark">
              <span className="l-nav__diamond" />
            </span>
            <span className="l-nav__logo">TripperAtlas</span>
          </Link>

          <div className="l-nav__links">
            <a href="#how" className="l-nav__link">Nasıl Çalışır</a>
            <a href="#destinations" className="l-nav__link">Destinasyonlar</a>
            <a href="#features" className="l-nav__link">Özellikler</a>
            <a href="#quiz" className="l-nav__link">Seyahat Testi</a>
            <Link href="/explore" className="l-nav__link">Keşfet</Link>
          </div>

          <div className="l-nav__actions">
            <button className="l-nav__login">Giriş Yap</button>
            <Link href="/chat" className="l-nav__cta">
              <span className="l-nav__cta-star">✦</span>
              Planlamaya Başla
            </Link>
          </div>

          <button
            className="l-nav__hamburger"
            onClick={() => setMobileMenu(v => !v)}
            aria-label="Menü"
          >
            {mobileMenu ? '✕' : '☰'}
          </button>
        </div>

        {mobileMenu && (
          <div className="l-nav__mobile">
            <a href="#how" className="l-nav__mobile-link" onClick={() => setMobileMenu(false)}>Nasıl Çalışır</a>
            <a href="#destinations" className="l-nav__mobile-link" onClick={() => setMobileMenu(false)}>Destinasyonlar</a>
            <a href="#features" className="l-nav__mobile-link" onClick={() => setMobileMenu(false)}>Özellikler</a>
            <a href="#quiz" className="l-nav__mobile-link" onClick={() => setMobileMenu(false)}>Seyahat Testi</a>
            <Link href="/chat" className="l-nav__cta l-nav__cta--full" onClick={() => setMobileMenu(false)}>
              Planlamaya Başla
            </Link>
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
          <h1 className="l-hero__title">
            Seyahati <br />
            <span className="l-hero__title--accent">yeniden keşfet.</span>
          </h1>
          <p className="l-hero__sub">
            TripperAtlas, kişisel AI seyahat asistanınız. Türkiye&apos;nin en güzel
            destinasyonlarını keşfedin, planları özelleştirin ve kolayca
            rezervasyon yapın.
          </p>
          <div className="l-hero__actions">
            <Link href="/chat" className="l-hero__btn l-hero__btn--primary">
              <span>✦</span> Planlamaya Başla
            </Link>
            <a href="#how" className="l-hero__btn l-hero__btn--secondary">
              Nasıl çalışır?
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
                <div className="l-hero__chat-name">TripperAtlas</div>
                <div className="l-hero__chat-status">Çevrimiçi</div>
              </div>
            </div>
            <div className="l-hero__chat-body">
              <div className="l-hero__chat-msg l-hero__chat-msg--ai">
                Merhaba! Ben TripperAtlas. Hayalinizdeki Türkiye seyahatini planlamaya hazır mısınız?
              </div>
              <div className="l-hero__chat-msg l-hero__chat-msg--user">
                İstanbul&apos;da 3 günlük romantik bir kaçamak istiyorum
              </div>
              <div className="l-hero__chat-msg l-hero__chat-msg--ai">
                Harika bir tercih! İstanbul&apos;da romantik bir gezi için size özel butik otel önerileri ve Boğaz manzaralı restoran seçenekleri hazırlıyorum...
              </div>
              <div className="l-hero__chat-cards">
                <div className="l-hero__mini-card">
                  <div className="l-hero__mini-img" style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>🏨</div>
                  <div className="l-hero__mini-info">
                    <span className="l-hero__mini-name">Pera Palace Hotel</span>
                    <span className="l-hero__mini-price">₺4.200/gece</span>
                  </div>
                </div>
                <div className="l-hero__mini-card">
                  <div className="l-hero__mini-img" style={{ background: 'linear-gradient(135deg,#f093fb,#f5576c)' }}>🍽️</div>
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

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="l-section l-how">
        <div className="l-section__inner">
          <div className="l-section__header">
            <span className="l-section__badge">Nasıl Çalışır</span>
            <h2 className="l-section__title">Üç adımda hayalinizdeki tatil</h2>
            <p className="l-section__sub">
              Karmaşık planlamaya son. Sadece ne istediğinizi söyleyin, gerisini biz halledelim.
            </p>
          </div>
          <div className="l-how__grid">
            {STEPS.map((step, i) => (
              <div key={step.num} className="l-how__card">
                <div className="l-how__num">{step.num}</div>
                <div className="l-how__icon">{step.icon}</div>
                <h3 className="l-how__title">{step.title}</h3>
                <p className="l-how__desc">{step.desc}</p>
                {i < STEPS.length - 1 && <div className="l-how__arrow">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── POPULAR TRIPS ── */}
      <section id="destinations" className="l-section l-trips">
        <div className="l-section__inner">
          <div className="l-section__header">
            <span className="l-section__badge">İlham Alın</span>
            <h2 className="l-section__title">Popüler Geziler</h2>
            <p className="l-section__sub">
              Türkiye&apos;nin en çok tercih edilen rotalarını keşfedin ve hemen planlamaya başlayın.
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
            {FEATURES.map(f => (
              <div key={f.title} className="l-feat__card">
                <div className="l-feat__icon">{f.icon}</div>
                <h3 className="l-feat__title">{f.title}</h3>
                <p className="l-feat__desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className="l-section l-svc">
        <div className="l-section__inner">
          <div className="l-section__header">
            <span className="l-section__badge">Hepsi Bir Arada</span>
            <h2 className="l-section__title">Tüm ihtiyaçlarınız tek platformda</h2>
          </div>
          <div className="l-svc__grid">
            {SERVICES.map(svc => (
              <div key={svc.title} className={`l-svc__card ${!svc.active ? 'l-svc__card--soon' : ''}`}>
                <div className="l-svc__icon">{svc.icon}</div>
                <h3 className="l-svc__title">{svc.title}</h3>
                <p className="l-svc__desc">{svc.desc}</p>
                {!svc.active && <span className="l-svc__soon">Yakında</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRAVEL QUIZ ── */}
      <section id="quiz" className="l-section l-quiz">
        <div className="l-section__inner">
          <div className="l-section__header">
            <span className="l-section__badge">Kendinizi Keşfedin</span>
            <h2 className="l-section__title">Ne tür bir gezginsiniz?</h2>
            <p className="l-section__sub">
              Seyahat stilinizi öğrenin, size özel öneriler alın.
            </p>
          </div>
          <div className="l-quiz__grid">
            {QUIZ_TYPES.map(q => (
              <button
                key={q.id}
                className={`l-quiz__card ${quizSelected === q.id ? 'l-quiz__card--active' : ''}`}
                onClick={() => setQuizSelected(q.id)}
              >
                <span className="l-quiz__icon">{q.icon}</span>
                <strong className="l-quiz__title">{q.title}</strong>
                <span className="l-quiz__desc">{q.desc}</span>
                {quizSelected === q.id && <span className="l-quiz__check">✓</span>}
              </button>
            ))}
          </div>
          {quizSelected && (
            <div className="l-quiz__result">
              <p className="l-quiz__result-text">
                Harika! <strong>{QUIZ_TYPES.find(q => q.id === quizSelected)?.title}</strong> tipine uygun
                kişiselleştirilmiş öneriler sizi bekliyor.
              </p>
              <Link href="/chat" className="l-hero__btn l-hero__btn--primary">
                <span>✦</span> Kişisel Planımı Oluştur
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
                <span className="l-nav__mark"><span className="l-nav__diamond" /></span>
                <span className="l-footer__logo-text">TripperAtlas</span>
              </div>
              <p className="l-footer__tagline">
                Yapay zeka destekli kişisel seyahat asistanınız. Türkiye&apos;yi keşfetmenin en akıllı yolu.
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
            <p className="l-footer__copy">© 2026 TripperAtlas. Tüm hakları saklıdır.</p>
            <div className="l-footer__social">
              <a href="#" className="l-footer__social-link" aria-label="Twitter">𝕏</a>
              <a href="#" className="l-footer__social-link" aria-label="Instagram">📷</a>
              <a href="#" className="l-footer__social-link" aria-label="LinkedIn">in</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
