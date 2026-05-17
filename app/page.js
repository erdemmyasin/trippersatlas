'use client';

import './landing-hero.css';
import './landing-nav.css';
import './landing-trips-bg.css';
import './landing-quiz-bg.css';
import './landing-card-photos.css';
import './landing-feat-bg.css';
import './landing-cta-bg.css';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bot,
  Bus,
  CarFront,
  Check,
  ChevronDown,
  Gem,
  Globe,
  Heart,
  Hotel,
  Camera,
  Landmark,
  Map,
  MapPinned,
  Menu,
  Mouse,
  Mountain,
  Palmtree,
  Plane,
  Send,
  Shield,
  Sparkles,
  Ticket,
  Star,
  UtensilsCrossed,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import AtlasLogo from '@/components/AtlasLogo';
import LandingCapitalsWeather from '@/components/LandingCapitalsWeather';
import LandingHowItWorks from '@/components/LandingHowItWorks';
import NavLocaleCurrency from '@/components/NavLocaleCurrency';
import Image from 'next/image';

/** LCP görsel — public altında tek kaynak */
const HERO_MAP_SRC = '/images/yatay-harita.png';

const SVC_ICON_MAP = {
  hotel: Hotel,
  tours: MapPinned,
  bus: Bus,
  carRental: CarFront,
  flights: Plane,
  activities: Ticket,
};

/* ═══════════════════════════════════════════════════════════
   Atlas — Landing Page
   Atlas — küresel AI seyahat planlama (Türkiye ağırlığı isteğe bağlı .env ile)
   ═══════════════════════════════════════════════════════════ */

/** Unsplash görselleri — https://unsplash.com/license (ücretsiz kullanım) */
const UNSPLASH = (id, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80&ixlib=rb-4.1.0`;

/** Popüler Geziler — kart başına sabit güncel kapak (API aramasına bağlı kalmaz) */
const POPULAR_TRIPS = [
  {
    id: 'istanbul-culture',
    region: 'MARMARA',
    regionColor: '#E91E63',
    title: 'Romantizm, Kültür, Lezzet: İstanbul Keşfi',
    days: 5,
    locations: 4,
    query: 'Istanbul Bosphorus sunset mosque',
    coverImage: UNSPLASH('photo-1524231757912-21f4fe3a7200'),
  },
  {
    id: 'cappadocia-balloon',
    region: 'İÇ ANADOLU',
    regionColor: '#9C27B0',
    title: 'Peri Bacaları ve Balon Turu: Kapadokya Masalı',
    days: 3,
    locations: 2,
    query: 'Cappadocia balloon sunrise',
    coverImage: UNSPLASH('photo-1506905925346-21bda4d32df4'),
  },
  {
    id: 'bodrum-aegean',
    region: 'EGE',
    regionColor: '#2196F3',
    title: 'Ege Rüyası: Bodrum Mavi Yolculuk ve Plaj',
    days: 7,
    locations: 3,
    query: 'Bodrum castle marina boats',
    coverImage: UNSPLASH('photo-1533105079780-92b9be482077'),
  },
  {
    id: 'antalya-riviera',
    region: 'AKDENİZ',
    regionColor: '#FF5722',
    title: 'Turkuaz Kıyılar ve Antik Kentler: Antalya',
    days: 5,
    locations: 4,
    query: 'Antalya Turkey old town beach',
    coverImage: UNSPLASH('photo-1559827260-dc66d52bef19'),
  },
  {
    id: 'trabzon-green',
    region: 'KARADENİZ',
    regionColor: '#4CAF50',
    title: 'Yeşilin Elli Tonu: Trabzon ve Uzungöl Kaçamağı',
    days: 4,
    locations: 3,
    query: 'Uzungol lake green mountain',
    coverImage: UNSPLASH('photo-1501785888041-af3ef285b470'),
  },
  {
    id: 'izmir-efes',
    region: 'EGE',
    regionColor: '#2196F3',
    title: 'Antik Efes\'ten Alaçatı\'ya: İzmir Rotası',
    days: 4,
    locations: 3,
    query: 'Alacati Turkey colorful street',
    coverImage: UNSPLASH('photo-1516483638261-f4dbaf036963'),
  },
  {
    id: 'mardin-mezopotamya',
    region: 'GÜNEYDOĞU',
    regionColor: '#FF9800',
    title: 'Mezopotamya\'nın Kapısı: Mardin Taş Evler',
    days: 3,
    locations: 2,
    query: 'Mardin Turkey old city stone',
    coverImage: UNSPLASH('photo-1565008576549-57569a49371d'),
  },
  {
    id: 'pamukkale-thermal',
    region: 'EGE',
    regionColor: '#00BCD4',
    title: 'Beyaz Cennet: Pamukkale ve Antik Hierapolis',
    days: 2,
    locations: 2,
    query: 'Pamukkale travertine white pool',
    coverImage: UNSPLASH('photo-1625246333195-78d9c38ad449'),
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

/** Sıra: üst satır Turlar–Oteller–Uçuşlar; alt satır Otobüsler–Araç Kiralama–Aktiviteler */
const SERVICES = [
  {
    icon: 'tours',
    title: 'Turlar',
    desc: 'Rehberli ve özel tur deneyimleri',
    active: true,
    href: '/turlar',
    bgImage: UNSPLASH('photo-1663530286715-47697d344cdb'),
  },
  {
    icon: 'hotel',
    title: 'Oteller',
    desc: 'En iyi fiyatlarla otel rezervasyonu',
    active: true,
    href: '/stay',
    bgImage: UNSPLASH('photo-1618773928121-c32242e63f39'),
  },
  {
    icon: 'flights',
    title: 'Uçuşlar',
    desc: 'Uçak bileti karşılaştırması',
    active: true,
    href: '/flights',
    bgImage: UNSPLASH('photo-1436491865332-7a61a109cc05'),
  },
  {
    icon: 'bus',
    title: 'Otobüsler',
    desc: 'Şehirler arası ve bölgesel otobüs seferleri',
    active: true,
    href: '/bus',
    bgImage: UNSPLASH('photo-1544620347-c4fd4a3d5957'),
  },
  {
    icon: 'carRental',
    title: 'Araç Kiralama',
    desc: 'Günlük ve dönemlik araç kiralama seçenekleri',
    active: true,
    href: '/cars',
    bgImage: UNSPLASH('photo-1492144534655-ae79c964c9d7'),
  },
  {
    icon: 'activities',
    title: 'Aktiviteler',
    desc: 'Turlar, deneyimler ve yapılacaklar',
    active: true,
    href: '/aktiviteler',
    bgImage: UNSPLASH('photo-1774429307421-a236d39a145a'),
  },
];

const QUIZ_TYPES = [
  {
    id: 'explorer',
    icon: 'explorer',
    title: 'Kaşif',
    desc: 'Bilinmeyen yerleri keşfetmeyi seversin',
    bgImage: UNSPLASH('photo-1488646953014-85cb44e25828'),
  },
  {
    id: 'relaxer',
    icon: 'relaxer',
    title: 'Dinlenme Sever',
    desc: 'Huzur ve konfor önceliğin',
    bgImage: UNSPLASH('photo-1507525428034-b723cf961d3e'),
  },
  {
    id: 'foodie',
    icon: 'foodie',
    title: 'Gurme',
    desc: 'Yerel lezzetler seni heyecanlandırır',
    bgImage: UNSPLASH('photo-1517248135467-4c7edcad34c4'),
  },
  {
    id: 'culture',
    icon: 'culture',
    title: 'Kültür Tutkunu',
    desc: 'Tarih ve sanat peşinde koşarsın',
    bgImage: UNSPLASH('photo-1575223970966-76ae61ee7838'),
  },
  {
    id: 'adventure',
    icon: 'adventure',
    title: 'Maceraperest',
    desc: 'Adrenalin ve doğa sporları favorin',
    bgImage: UNSPLASH('photo-1501555088652-021faa106b9b'),
  },
  {
    id: 'luxury',
    icon: 'luxury',
    title: 'Lüks Gezgin',
    desc: 'Premium deneyimler ararsın',
    bgImage: UNSPLASH('photo-1582719508461-905c673771fd'),
  },
];

const HERO_STATS = [
  { Icon: Globe, num: '10.000+', label: 'Oluşturulan Rota' },
  { Icon: Star, num: '150+', label: 'Ülke Keşfedildi' },
  { Icon: Users, num: '50K+', label: 'Mutlu Gezgin' },
  { Icon: Shield, num: '%100', label: 'Güvenli Planlama' },
];

const HERO_CHIPS = [
  { Icon: Palmtree, text: 'Kalabalıktan uzak sahil öner', prompt: 'Kalabalıktan uzak sakin bir sahil destinasyonu öner.' },
  { Icon: Heart, text: 'Sevgilimle romantik rota', prompt: 'İki kişilik romantik bir seyahat rotası planla.' },
  { Icon: Landmark, text: 'Ucuz Avrupa turu', prompt: 'Bütçe dostu bir Avrupa turu için rota öner.' },
];

/* ── Trip card: sabit coverImage varsa doğrudan; yoksa /api/image ile arama ── */
function TripCard({ trip }) {
  const [imgSrc, setImgSrc] = useState(trip.coverImage ?? null);
  const [imgState, setImgState] = useState('loading');

  useEffect(() => {
    if (trip.coverImage) {
      setImgSrc(trip.coverImage);
      return;
    }
    let cancelled = false;
    fetch(`/api/image?query=${encodeURIComponent(trip.query)}&type=tour`)
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
  }, [trip.query, trip.coverImage]);

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
  const router = useRouter();
  const landingRef = useRef(null);
  const navSolidRef = useRef(false);
  const [navSolid, setNavSolid] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [quizSelected, setQuizSelected] = useState(null);
  const [email, setEmail] = useState('');
  const [heroPrompt, setHeroPrompt] = useState('');
  const [heroMapVisible, setHeroMapVisible] = useState(false);
  const [heroFocus, setHeroFocus] = useState(false);

  /* Typewriter placeholder — HERO_CHIPS metinlerini sırayla harf-harf yazar,
   * bekler, siler, sonrakine geçer. Kullanıcı yazıyor veya focus iken durur. */
  const [twIdx, setTwIdx] = useState(0);
  const [twChars, setTwChars] = useState(0);
  const [twPhase, setTwPhase] = useState('typing'); // typing | holding | erasing
  const typewriterActive = !heroFocus && heroPrompt.length === 0;

  useEffect(() => {
    if (!typewriterActive) return undefined;
    const target = HERO_CHIPS[twIdx].text;
    let delay;
    if (twPhase === 'typing') delay = 60;
    else if (twPhase === 'holding') delay = 1800;
    else delay = 28;
    const t = setTimeout(() => {
      if (twPhase === 'typing') {
        const next = twChars + 1;
        setTwChars(next);
        if (next >= target.length) setTwPhase('holding');
      } else if (twPhase === 'holding') {
        setTwPhase('erasing');
      } else {
        const next = twChars - 1;
        setTwChars(next);
        if (next <= 0) {
          setTwIdx((i) => (i + 1) % HERO_CHIPS.length);
          setTwPhase('typing');
        }
      }
    }, delay);
    return () => clearTimeout(t);
  }, [twPhase, twChars, twIdx, typewriterActive]);

  const typewriterPlaceholder = typewriterActive
    ? HERO_CHIPS[twIdx].text.slice(0, twChars) + (twPhase !== 'erasing' ? '▏' : '')
    : 'Hayalindeki seyahati yaz…';

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

  const goChatFromHero = useCallback(
    (optionalPrompt) => {
      const raw = typeof optionalPrompt === 'string' ? optionalPrompt : heroPrompt;
      const t = raw.trim();
      if (typeof window !== 'undefined') {
        try {
          if (t) sessionStorage.setItem('ta_hero_prompt', t);
          else sessionStorage.removeItem('ta_hero_prompt');
        } catch (_) {
          /* ignore */
        }
      }
      router.push('/chat');
    },
    [heroPrompt, router],
  );

  return (
    <div className="landing" ref={landingRef}>
      {/* ── NAVBAR ── */}
      <nav className={`l-nav ${navSolid ? 'l-nav--solid' : ''}`}>
        <div className="l-nav__inner">
          <Link href="/" className="l-nav__brand" onClick={onBrandClick}>
            <span className="l-nav__mark l-nav__mark--logo">
              <AtlasLogo height={34} color="#07090d" />
            </span>
            <span className="l-nav__logo">Atlas</span>
          </Link>

          <div className="l-nav__links">
            <a href="#how-it-works" className="l-nav__link">Nasıl Çalışır ?</a>
            <a href="#weather" className="l-nav__link">Hızlı Seyahat</a>
            <a href="#services" className="l-nav__link">Tek Platform</a>
            <a href="#destinations" className="l-nav__link">Popüler Geziler</a>
          </div>

          <div className="l-nav__actions">
            <NavLocaleCurrency />
            <Link href="/auth/giris" className="l-nav__login">
              Giriş Yap
            </Link>
            <Link href="/chat" className="l-nav__login l-nav__login--atlas">
              Atlas'a Sor
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
            <Link
              href="/chat"
              className="l-nav__login l-nav__login--atlas l-nav__login--mobile-bar"
              onClick={() => setMobileMenu(false)}
            >
              Atlas'a Sor
            </Link>
            <a href="#how-it-works" className="l-nav__mobile-link" onClick={() => setMobileMenu(false)}>Nasıl Çalışır ?</a>
            <a href="#weather" className="l-nav__mobile-link" onClick={() => setMobileMenu(false)}>Hızlı Seyahat</a>
            <a href="#services" className="l-nav__mobile-link" onClick={() => setMobileMenu(false)}>Tek Platform</a>
            <a href="#destinations" className="l-nav__mobile-link" onClick={() => setMobileMenu(false)}>Popüler Geziler</a>
          </div>
        )}
      </nav>

        {/* ── HERO ── */}
        <section className="l-hero" aria-labelledby="hero-heading">
          <div className="l-hero__bg" aria-hidden>
            <Image
              className={`l-hero__bg-map${heroMapVisible ? ' l-hero__bg-map--ready' : ''}`}
              src={HERO_MAP_SRC}
              alt=""
              fill
              priority
              sizes="100vw"
              draggable={false}
              onLoadingComplete={() => setHeroMapVisible(true)}
            />
          </div>

          <div className="l-hero__inner">
            <div className="l-hero__masthead">
              <div className="l-hero__badge l-hero__badge--premium">
                Dijital Atlas
              </div>

              <h1 id="hero-heading" className="l-hero__display">
                <span className="l-hero__display-line">Seyahati</span>
                <span className="l-hero__display-line l-hero__display-line--amber">yeniden keşfedin.</span>
              </h1>

              <p className="l-hero__lead">
                Atlas ile hayal ettiğin yolculuğu yaz, biz senin için en iyi rotayı oluşturalım.
              </p>
            </div>

            <form
              className="l-hero__search"
              onSubmit={(e) => {
                e.preventDefault();
                goChatFromHero(heroPrompt);
              }}
            >
              <div className="l-hero__search-row">
                <input
                  id="hero-trip-prompt"
                  className="l-hero__search-input"
                  type="text"
                  name="trip"
                  placeholder={typewriterPlaceholder}
                  value={heroPrompt}
                  onChange={(e) => setHeroPrompt(e.target.value)}
                  onFocus={() => setHeroFocus(true)}
                  onBlur={() => setHeroFocus(false)}
                  autoComplete="off"
                  aria-label="Hayalindeki seyahati yazın"
                />
                <button type="submit" className="l-hero__send" aria-label="Sohbete gönder">
                  <Send size={20} strokeWidth={2} aria-hidden />
                </button>
              </div>
              <div className="l-hero__chips" role="list">
                {HERO_CHIPS.map((c) => {
                  const Ci = c.Icon;
                  return (
                    <button
                      key={c.text}
                      type="button"
                      className="l-hero__chip"
                      role="listitem"
                      onClick={() => goChatFromHero(c.prompt)}
                    >
                      <Ci size={17} strokeWidth={2} className="l-hero__chip-icon" aria-hidden />
                      <span>{c.text}</span>
                    </button>
                  );
                })}
              </div>
            </form>

            <div className="l-hero__stat-strip">
              {HERO_STATS.map((s) => {
                const Si = s.Icon;
                return (
                  <div key={s.label} className="l-hero__stat-strip-cell">
                    <Si className="l-hero__stat-strip-ico" size={22} strokeWidth={2} aria-hidden />
                    <div className="l-hero__stat-strip-text">
                      <span className="l-hero__stat-strip-num">{s.num}</span>
                      <span className="l-hero__stat-strip-label">{s.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <a className="l-hero__scroll-down" href="#destinations">
            <Mouse size={26} strokeWidth={1.5} aria-hidden />
            <span>Keşfetmeye başla</span>
            <ChevronDown className="l-hero__scroll-chevron" size={20} strokeWidth={2} aria-hidden />
          </a>
        </section>

      <LandingHowItWorks />

      <LandingCapitalsWeather />

      {/* ── SERVICES (Popüler Geziler öncesi) ── */}
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
              const cardStyle = { '--ta-card-bg': `url("${svc.bgImage}")` };
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
                  <Link key={svc.title} href={svc.href} className={cardClass} style={cardStyle}>
                    {body}
                  </Link>
                );
              }
              return (
                <div key={svc.title} className={cardClass} style={cardStyle}>
                  {body}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── POPULAR TRIPS ── */}
      <section id="destinations" className="l-section l-trips">
        <div className="l-section__inner">
          <div className="l-section__header">
            <span className="l-section__badge">İlham Alın</span>
            <h2 className="l-section__title">Popüler Geziler</h2>
            <p className="l-section__sub">Örnek rotalardan ilham alın; kendi rotanızı sohbette veya hızlı planda oluşturun.</p>
          </div>
          <div className="l-trips__grid">
            {POPULAR_TRIPS.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
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
                type="button"
                className={`l-quiz__card ${quizSelected === q.id ? 'l-quiz__card--active' : ''}`}
                style={{ '--ta-card-bg': `url("${q.bgImage}")` }}
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

      {/* ── NEWSLETTER / CTA ── */}
      <section id="cta-newsletter" className="l-section l-cta-section">
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
