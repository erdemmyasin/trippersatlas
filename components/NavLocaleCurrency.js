'use client';

import { useLocaleCurrency } from '@/components/LocaleCurrencyContext';
import { ATLAS_CURRENCIES, ATLAS_LANGS } from '@/lib/atlasPrefs';

/**
 * Segment pill — dil (TR/EN) + para (EUR/TRY/USD).
 * Stil: globals.css `.l-prefs*`
 */
export default function NavLocaleCurrency({ className = '' }) {
  const { lang, currency, setLang, setCurrency } = useLocaleCurrency();

  return (
    <div className={`l-prefs ${className}`.trim()} role="group" aria-label="Dil ve para birimi">
      <div className="l-prefs__seg" role="tablist" aria-label="Dil">
        {ATLAS_LANGS.map((code) => (
          <button
            key={code}
            type="button"
            role="tab"
            aria-selected={lang === code}
            className={`l-prefs__pill ${lang === code ? 'l-prefs__pill--on' : ''}`}
            onClick={() => setLang(code)}
          >
            {code}
          </button>
        ))}
      </div>
      <div className="l-prefs__seg" role="tablist" aria-label="Para birimi">
        {ATLAS_CURRENCIES.map((code) => (
          <button
            key={code}
            type="button"
            role="tab"
            aria-selected={currency === code}
            className={`l-prefs__pill l-prefs__pill--cur ${currency === code ? 'l-prefs__pill--on' : ''}`}
            onClick={() => setCurrency(code)}
          >
            {code}
          </button>
        ))}
      </div>
    </div>
  );
}
