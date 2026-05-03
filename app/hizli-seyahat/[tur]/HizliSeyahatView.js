'use client';

import Link from 'next/link';
import AtlasLogo from '@/components/AtlasLogo';
import LandingCapitalsWeather from '@/components/LandingCapitalsWeather';
import NavLocaleCurrency from '@/components/NavLocaleCurrency';

import '../../landing-hero.css';
import '../../landing-nav.css';

/** @param {{ tur: 'is' | 'saglik' | 'turizm' }} props */
export default function HizliSeyahatView({ tur }) {
  return (
    <div className="landing">
      <nav className="l-nav l-nav--solid">
        <div className="l-nav__inner">
          <Link href="/" className="l-nav__brand">
            <span className="l-nav__mark l-nav__mark--logo">
              <AtlasLogo height={34} color="#07090d" />
            </span>
            <span className="l-nav__logo">Atlas</span>
          </Link>

          <div className="l-nav__links">
            <Link href="/hizli-seyahat/is" className="l-nav__link">
              İş
            </Link>
            <Link href="/hizli-seyahat/saglik" className="l-nav__link">
              Sağlık
            </Link>
            <Link href="/hizli-seyahat/turizm" className="l-nav__link">
              Turizm
            </Link>
          </div>

          <div className="l-nav__actions">
            <NavLocaleCurrency />
            <Link href="/auth/giris" className="l-nav__login">
              Giriş Yap
            </Link>
            <Link href="/chat" className="l-nav__login l-nav__login--atlas">
              Atlas&apos;a Sor
            </Link>
          </div>
        </div>
      </nav>

      <LandingCapitalsWeather travelSlug={tur} />
    </div>
  );
}
