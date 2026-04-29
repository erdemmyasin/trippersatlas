'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { X, Wifi, Coffee, CircleParking, CreditCard, Undo2 } from 'lucide-react';
import { RangeDual } from '@/components/SearchScreenPrimitives';

const STAR_OPTS = [1, 2, 3, 4, 5];
const TYPE_OPTS = ['Otel', 'Apart', 'Villa', 'Hostel', 'Pansiyon'];
const FEAT_OPTS = ['Havuz', 'Spa', 'Ücretsiz WiFi', 'Otopark', 'Kahvaltı dahil'];

const MODAL_SUB = {
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--ta-ink)',
  margin: '0 0 8px',
  fontFamily: 'var(--font-sans)',
};

const NAV = [
  { id: 'price', label: 'Fiyat' },
  { id: 'free', label: 'Ücretsiz / Esnek' },
  { id: 'amenities', label: 'Olanaklar' },
  { id: 'stars', label: 'Yıldız' },
  { id: 'reviews', label: 'Yorumlar' },
  { id: 'type', label: 'Tesis türü' },
  { id: 'location', label: 'Konum' },
  { id: 'neighborhoods', label: 'Semtler' },
];

function buildHistogram(prices, bucketCount = 14) {
  if (!prices.length) return { ratios: [], min: 0, max: 1 };
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min >= max) return { ratios: Array(bucketCount).fill(0.2), min, max };
  const step = (max - min) / bucketCount;
  const counts = Array(bucketCount).fill(0);
  for (const p of prices) {
    const i = Math.min(bucketCount - 1, Math.floor((p - min) / step));
    counts[i]++;
  }
  const top = Math.max(...counts, 1);
  return { ratios: counts.map((c) => c / top), min, max };
}

function Histogram({ prices, lo, hi, minP, maxP }) {
  const { ratios } = buildHistogram(prices);
  return (
    <div style={{ marginTop: 10 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 3,
          height: 56,
          padding: '0 2px',
        }}
      >
        {ratios.map((r, i) => {
          const bucketLo = minP + ((maxP - minP) * i) / ratios.length;
          const bucketHi = minP + ((maxP - minP) * (i + 1)) / ratios.length;
          const active = bucketHi >= lo && bucketLo <= hi;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                borderRadius: 3,
                height: `${18 + r * 100}%`,
                minHeight: 8,
                background: active ? 'var(--ta-accent)' : 'rgba(0,0,0,.1)',
                opacity: active ? 1 : 0.45,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function Section({ id, title, children }) {
  return (
    <section id={`stay-f-${id}`} style={{ scrollMarginTop: 16, marginBottom: 28 }}>
      <h3
        style={{
          fontSize: 15,
          fontWeight: 800,
          color: 'var(--ta-ink)',
          margin: '0 0 12px',
          fontFamily: 'var(--font-sans)',
        }}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}

export function StayFiltersModal({
  open,
  onClose,
  draft,
  setDraft,
  onApply,
  defaultDraft,
  raw,
  bounds,
  layout = 'dialog',
}) {
  const [activeNav, setActiveNav] = useState('price');
  const panelRef = useRef(null);

  const scrollToId = useCallback((id) => {
    const el = document.getElementById(`stay-f-${id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveNav(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    const root = panelRef.current;
    if (!root) return;
    const sections = NAV.map((n) => document.getElementById(`stay-f-${n.id}`)).filter(Boolean);
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) {
          const id = visible[0].target.id.replace('stay-f-', '');
          setActiveNav(id);
        }
      },
      { root, rootMargin: '-20% 0px -55% 0px', threshold: [0, 0.2, 0.5] }
    );
    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, [open]);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const prices = raw.map((h) => h.priceNight);
  const minP = bounds.price[0];
  const maxP = Math.max(bounds.price[1], bounds.price[0] + 1);
  const districts = [...new Set(raw.map((h) => h.district))].sort();

  const setNeighborhood = (d, v) => {
    setDraft((prev) => ({
      ...prev,
      neighborhoods: { ...prev.neighborhoods, [d]: v },
    }));
  };

  const resetDraft = () => setDraft(defaultDraft());

  const full = layout === 'fullscreen';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: full ? '#fff' : 'rgba(26,25,22,.45)',
        display: 'flex',
        alignItems: full ? 'stretch' : 'center',
        justifyContent: full ? 'stretch' : 'center',
        padding: full ? 0 : 16,
        fontFamily: 'var(--font-sans)',
      }}
      role="presentation"
      onClick={full ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal
        aria-labelledby="stay-filters-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: full ? '100%' : 'min(960px, 100%)',
          height: full ? '100%' : 'min(640px, 88vh)',
          maxHeight: full ? '100%' : undefined,
          background: '#fff',
          borderRadius: full ? 0 : 14,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: full ? 'none' : '0 24px 80px rgba(0,0,0,.2)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid rgba(0,0,0,.08)',
          }}
        >
          <h2 id="stay-filters-title" style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--ta-ink)' }}>
            Tüm filtreler
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            style={{
              border: 'none',
              background: 'var(--ta-muted-bg)',
              borderRadius: 10,
              padding: 8,
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          <nav
            style={{
              width: 200,
              flexShrink: 0,
              borderRight: '1px solid rgba(0,0,0,.08)',
              overflowY: 'auto',
              background: '#FAFAF8',
            }}
          >
            {NAV.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => scrollToId(n.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 16px',
                  border: 'none',
                  background: activeNav === n.id ? 'rgba(74,98,120,.14)' : 'transparent',
                  fontWeight: activeNav === n.id ? 700 : 500,
                  fontSize: 13,
                  color: 'var(--ta-ink)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  borderLeft: activeNav === n.id ? '3px solid var(--ta-accent)' : '3px solid transparent',
                }}
              >
                {n.label}
              </button>
            ))}
          </nav>

          <div ref={panelRef} style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>
            <Section id="price" title="Fiyat">
              <p style={MODAL_SUB}>Hesaplama türü</p>
              <p style={{ fontSize: 12, color: 'var(--ta-ink-muted)', fontWeight: 500, margin: '-4px 0 8px' }}>
                Demo: gece başı fiyat üzerinden
              </p>
              <select
                style={{
                  width: '100%',
                  maxWidth: 420,
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid rgba(0,0,0,.12)',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  marginBottom: 8,
                }}
                defaultValue="total"
              >
                <option value="total">Konaklama toplamı — tüm vergiler ve ek ücretler dahil (yakında)</option>
              </select>
              <p style={{ ...MODAL_SUB, marginTop: 16 }}>Dağılım ve fiyat aralığı</p>
              <Histogram prices={prices} lo={draft.priceRange[0]} hi={draft.priceRange[1]} minP={minP} maxP={maxP} />
              <RangeDual
                min={minP}
                max={maxP}
                value={draft.priceRange}
                onChange={(v) => setDraft((p) => ({ ...p, priceRange: v }))}
                format={(x) => `₺${Math.round(x).toLocaleString('tr-TR')}`}
              />
              <p style={{ ...MODAL_SUB, marginTop: 16 }}>Görünürlük</p>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={draft.includeUnknownPrice}
                  onChange={(e) => setDraft((p) => ({ ...p, includeUnknownPrice: e.target.checked }))}
                />
                Fiyatı bilinmeyen tesisleri de göster
              </label>
            </Section>

            <Section id="free" title="Ücretsiz / Esnek">
              <p style={MODAL_SUB}>Hızlı seçim</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[
                  { key: 'wifi', label: 'Ücretsiz internet', feat: 'Ücretsiz WiFi', Icon: Wifi },
                  { key: 'breakfast', label: 'Ücretsiz kahvaltı', feat: 'Kahvaltı dahil', Icon: Coffee },
                  { key: 'parking', label: 'Ücretsiz otopark', feat: 'Otopark', Icon: CircleParking },
                  { key: 'payLater', label: 'Daha sonra öde', field: 'payLaterOnly', Icon: CreditCard },
                  { key: 'cancel', label: 'Ücretsiz iptal', field: 'freeCancelOnly', Icon: Undo2 },
                ].map((chip) => {
                  const ChipIcon = chip.Icon;
                  let active = false;
                  if (chip.feat) active = !!draft.feats[chip.feat];
                  else if (chip.field === 'payLaterOnly') active = draft.payLaterOnly;
                  else if (chip.field === 'freeCancelOnly') active = draft.freeCancelOnly;
                  return (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={() => {
                        if (chip.feat) {
                          setDraft((p) => ({
                            ...p,
                            feats: { ...p.feats, [chip.feat]: !p.feats[chip.feat] },
                          }));
                        } else if (chip.field === 'payLaterOnly') {
                          setDraft((p) => ({ ...p, payLaterOnly: !p.payLaterOnly }));
                        } else if (chip.field === 'freeCancelOnly') {
                          setDraft((p) => ({ ...p, freeCancelOnly: !p.freeCancelOnly }));
                        }
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '10px 14px',
                        borderRadius: 999,
                        border: active ? '2px solid var(--ta-accent)' : '1px solid rgba(0,0,0,.12)',
                        background: active ? 'rgba(74,98,120,.12)' : '#fff',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        color: 'var(--ta-ink)',
                      }}
                    >
                      <span aria-hidden>
                        {ChipIcon ? <ChipIcon size={14} strokeWidth={2} color="var(--ta-accent-deep)" /> : null}
                      </span>
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </Section>

            <Section id="amenities" title="Olanaklar">
              <p style={MODAL_SUB}>İstediğiniz özellikler</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {FEAT_OPTS.map((f) => (
                  <label key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={!!draft.feats[f]}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, feats: { ...p.feats, [f]: e.target.checked } }))
                      }
                    />
                    {f}
                  </label>
                ))}
              </div>
            </Section>

            <Section id="stars" title="Yıldız sayısı">
              <p style={MODAL_SUB}>Gösterilecek yıldız seviyeleri</p>
              {STAR_OPTS.map((s) => (
                <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 6, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={!!draft.stars[s]}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, stars: { ...p.stars, [s]: e.target.checked } }))
                    }
                  />
                  {s} yıldız
                </label>
              ))}
            </Section>

            <Section id="reviews" title="Konuk puanı">
              <p style={MODAL_SUB}>Minimum konuk puanı</p>
              {[
                { id: 'all', label: 'Tümü' },
                { id: '9', label: '9+ Mükemmel' },
                { id: '8', label: '8+ Çok iyi' },
                { id: '7', label: '7+ İyi' },
              ].map((o) => (
                <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 6, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="stay-draft-score"
                    checked={draft.scoreMin === o.id}
                    onChange={() => setDraft((p) => ({ ...p, scoreMin: o.id }))}
                  />
                  {o.label}
                </label>
              ))}
            </Section>

            <Section id="type" title="Tesis türü">
              <p style={MODAL_SUB}>Tesis kategorileri</p>
              {TYPE_OPTS.map((t) => (
                <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 6, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={!!draft.types[t]}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, types: { ...p.types, [t]: e.target.checked } }))
                    }
                  />
                  {t}
                </label>
              ))}
            </Section>

            <Section id="location" title="Konum — şehir merkezine uzaklık">
              <p style={MODAL_SUB}>Merkeze uzaklık (km)</p>
              <RangeDual
                min={bounds.dist[0]}
                max={Math.max(bounds.dist[1], bounds.dist[0] + 0.1)}
                value={draft.distRange}
                onChange={(v) => setDraft((p) => ({ ...p, distRange: v }))}
                format={(v) => `${v.toFixed(1)} km`}
              />
            </Section>

            <Section id="neighborhoods" title="Semtler">
              <p style={MODAL_SUB}>Listede gösterilecek semtler</p>
              {districts.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--ta-ink-muted)' }}>Önce arama yapın.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {districts.map((d) => (
                    <label key={d} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={draft.neighborhoods[d] !== false}
                        onChange={(e) => setNeighborhood(d, e.target.checked)}
                      />
                      {d}
                    </label>
                  ))}
                </div>
              )}
            </Section>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            padding: '14px 18px',
            borderTop: '1px solid rgba(0,0,0,.08)',
            background: '#FAFAF8',
          }}
        >
          <button
            type="button"
            onClick={resetDraft}
            style={{
              padding: '12px 20px',
              borderRadius: 10,
              border: '1px solid rgba(0,0,0,.15)',
              background: '#fff',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Sıfırla
          </button>
          <button
            type="button"
            onClick={onApply}
            style={{
              padding: '12px 24px',
              borderRadius: 10,
              border: 'none',
              background: 'var(--ta-accent)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 2px 8px rgba(74,98,120,.35)',
            }}
          >
            Uygula
          </button>
        </div>
      </div>
    </div>
  );
}
