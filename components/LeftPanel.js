'use client';

import { useEffect, useState } from 'react';
import { Check, MapPin, Pencil, Sparkles, X } from 'lucide-react';
import { BudgetCategoryGlyph, ListingTypeGlyph } from '@/components/AtlasGlyph';

/**
 * Atlas servisler — hızlı plan menüsündeki kategorilerle eşleşir.
 * "Tur" ayrı bir servis değil; tur seçilince arka planda Konaklama + Uçuş
 * (ve içeriği varsa Araç Kiralama) otomatik aktif olur.
 */
const SERVICES = [
  { id: 'lodging',  label: 'Konaklama',     listingTypes: ['hotel', 'villa', 'clinic'] },
  { id: 'flight',   label: 'Uçuş',          listingTypes: ['flight'] },
  { id: 'bus',      label: 'Otobüs',        listingTypes: ['bus'] },
  { id: 'car',      label: 'Araç kiralama', listingTypes: ['car'] },
  { id: 'transfer', label: 'Transfer',      listingTypes: ['transfer'] },
  { id: 'activity', label: 'Aktivite',      listingTypes: ['tour', 'boat', 'activity'] },
  { id: 'extras',   label: 'Ekstra',        listingTypes: ['restaurant', 'extra'] },
];

const BUDGET_CATS = [
  { key: 'accommodation', label: 'Konaklama' },
  { key: 'transport', label: 'Ulaşım' },
  { key: 'activities', label: 'Aktivite' },
  { key: 'extras', label: 'Diğer' },
];

export default function LeftPanel({
  planName = 'Yeni Seyahat Planı',
  onPlanNameChange,
  completedModules = new Set(),
  bookedServices = new Set(),
  onBookService,
  onUnbookService,
  budget = {},
  selectedListings = {},
  onDeselect,
  /** Header pill ile tekrar etmesin; isim üstteki menüden düzenlenir */
  hidePlanTitle = false,
  /** Header açılır menü içi: dış sarmalayıcı scroll kullanır */
  embedded = false,
  /** Gezi planı: "Esnek plan" vb.; null / boş: rozet gösterilmez (/chat dropdown) */
  planBadgeLabel = 'Esnek plan',
  /** /chat header dropdown: akıllı öneri harita altında; burada gösterme */
  hideSmartSuggestion = false,
  /** Seyahat modülleri bölümünün altına özel CTA (ör. Sohbete Başla) */
  bottomSlot = null,
}) {
  const [activeModule,  setActiveModule]  = useState(null);
  const [editingName,   setEditingName]   = useState(false);
  const [nameValue,     setNameValue]     = useState(planName);

  /* planName prop değişince sync et */
  useEffect(() => {
    if (!editingName) setNameValue(planName);
  }, [planName, editingName]);

  function commitName() {
    const trimmed = nameValue.trim() || 'Yeni Seyahat Planı';
    setNameValue(trimmed);
    onPlanNameChange?.(trimmed);
    setEditingName(false);
  }

  return (
    <div
      style={{
        height: embedded ? 'auto' : '100%',
        overflow: embedded ? 'visible' : 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        className="left-panel"
        style={{
          flex: embedded ? 'none' : 1,
          overflowY: embedded ? 'visible' : 'auto',
          scrollbarWidth: embedded ? undefined : 'none',
          minHeight: embedded ? 0 : 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >

      {!hidePlanTitle ? (
      <div style={s.planNameRow}>
        {editingName ? (
          <input
            autoFocus
            style={s.nameInput}
            value={nameValue}
            onChange={e => setNameValue(e.target.value)}
            onBlur={commitName}
            onKeyDown={e => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') { setNameValue(planName); setEditingName(false); } }}
            maxLength={48}
          />
        ) : (
          <button style={s.nameDisplay} onClick={() => setEditingName(true)} title="Planı yeniden adlandır">
            <span style={s.nameStar} aria-hidden>
              <Sparkles size={12} strokeWidth={2} color="var(--ta-accent)" />
            </span>
            <span style={s.nameText}>{planName}</span>
            <span style={s.namePencil} aria-hidden>
              <Pencil size={12} strokeWidth={2} color="var(--ta-ink-muted)" />
            </span>
          </button>
        )}
      </div>
      ) : null}

      {/* ── Editorial künye ── */}
      <div style={s.editorialEyebrow}>
        <span style={s.eyebrowDot} aria-hidden>✦</span>
        {bookedServices.size > 0
          ? `ISSUE 01 · ${bookedServices.size} REZERVE`
          : completedModules.size > 0
            ? `TASLAK · ${completedModules.size} SERVİS`
            : 'TASLAK · ATLAS EDITION'}
      </div>

      {/* ── Servisler ── */}
      <section style={s.editorialSection}>
        <header style={s.editorialHead}>
          <h3 style={s.editorialTitle}>Servisler</h3>
          <span style={s.editorialMeta}>
            {bookedServices.size > 0
              ? `${bookedServices.size} ✓ · ${completedModules.size} / ${SERVICES.length}`
              : `${completedModules.size} / ${SERVICES.length}`}
          </span>
        </header>
        <div style={s.hairline} aria-hidden />

        <div style={s.moduleRowList}>
          {SERVICES.map((svc) => {
            const isPicked = completedModules.has(svc.id);
            const isBooked = bookedServices.has(svc.id);
            const svcCount = Object.values(selectedListings).filter((l) => {
              const t = String(l?.type || '').toLowerCase();
              return svc.listingTypes.includes(t);
            }).length;
            return (
              <div key={svc.id} style={s.moduleRowItem}>
                <span
                  style={{
                    ...s.statusRing,
                    ...(isBooked ? s.statusRingBooked : isPicked ? s.statusRingDone : {}),
                  }}
                  aria-hidden
                >
                  {isBooked ? (
                    <Check size={11} strokeWidth={3} color="#fff" />
                  ) : isPicked ? (
                    <Check size={11} strokeWidth={3} color="#fff" />
                  ) : null}
                </span>
                <span style={s.moduleRowLabel}>{svc.label}</span>
                {isBooked ? (
                  <>
                    <span style={s.moduleRowBookedTag}>Rezerve</span>
                    <button
                      type="button"
                      style={s.moduleRowAction}
                      onClick={() => onUnbookService?.(svc.id)}
                      aria-label={`${svc.label} rezervasyonunu geri al`}
                    >
                      Geri al
                    </button>
                  </>
                ) : isPicked ? (
                  <>
                    <span style={s.moduleRowMetaDone}>{svcCount || 1} öğe</span>
                    <button
                      type="button"
                      style={s.moduleRowActionPrimary}
                      onClick={() => onBookService?.(svc.id)}
                      aria-label={`${svc.label} için rezervasyon işaretle`}
                    >
                      Rezerve ettim
                    </button>
                  </>
                ) : (
                  <span style={s.moduleRowMeta}>—</span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Bütçe ── */}
      <BudgetSection budget={budget} selectedListings={selectedListings} />

      {/* ── Seyahat Planı ── */}
      <PlanSection selectedListings={selectedListings} onDeselect={onDeselect} />

      {/* ── Akıllı öneri (/chat’te harita altında) ── */}
      {!hideSmartSuggestion ? (
        <div style={s.section}>
          <div style={s.sectionTitle}><span>Akıllı öneri</span></div>
          <div style={s.adviceCard}>
            <p style={s.adviceText}>
              Konaklama ve aktiviteler netleşmeye yaklaştı. İstersen bir sonraki adımda yalnızca transfer kısmını tamamlayıp planı sabitleyebiliriz.
            </p>
          </div>
        </div>
      ) : null}
      {bottomSlot ? <div style={s.bottomSlotWrap}>{bottomSlot}</div> : null}
      </div>
    </div>
  );
}

/* ── Bütçe bölümü (Cinematic Editorial) ── */
function BudgetSection({ budget, selectedListings = {} }) {
  const values = BUDGET_CATS.map(c => budget[c.key] ?? 0);
  const total  = values.reduce((a, b) => a + b, 0);
  const filledCats = BUDGET_CATS.filter((_, i) => values[i] > 0);
  const itemCount = Object.keys(selectedListings).length;

  return (
    <section style={s.editorialSection}>
      <header style={s.editorialHead}>
        <h3 style={s.editorialTitle}>Bütçe</h3>
        {total > 0 ? (
          <span style={s.editorialMeta}>{filledCats.length} kategori</span>
        ) : null}
      </header>
      <div style={s.hairline} aria-hidden />

      <div style={s.budgetTotalBig}>
        {total === 0 ? (
          <>
            <span style={s.budgetCurrency}>₺</span>
            <span style={s.budgetDash}>—</span>
          </>
        ) : (
          <>
            <span style={s.budgetCurrency}>₺</span>
            <span style={s.budgetAmount}>{total.toLocaleString('tr-TR')}</span>
          </>
        )}
      </div>

      <p style={s.budgetSubtitle}>
        {total === 0
          ? 'Sohbette bir öneri seçince burada birikir.'
          : `${itemCount} öğe seçildi · ${filledCats.length} modülde`}
      </p>

      {total > 0 ? (
        <>
          <div style={s.budgetBreakdownLabel}>Kategori Dağılımı</div>
          <div style={s.budgetBreakdownList}>
            {BUDGET_CATS.map((cat, i) => {
              const val = values[i];
              if (!val) return null;
              const pct = Math.round((val / total) * 100);
              const itemsInCat = Object.values(selectedListings).filter((l) => {
                const t = String(l?.type || '').toLowerCase();
                if (cat.key === 'accommodation') return ['hotel', 'villa', 'clinic'].includes(t);
                if (cat.key === 'transport') return ['transfer', 'car', 'flight', 'bus'].includes(t);
                if (cat.key === 'activities') return ['tour', 'boat', 'activity'].includes(t);
                if (cat.key === 'extras') return ['restaurant', 'extra'].includes(t);
                return false;
              }).length;
              return (
                <div key={cat.key} style={s.budgetCatRow}>
                  <span style={s.budgetCatBullet} aria-hidden>✦</span>
                  <div style={s.budgetCatMain}>
                    <span style={s.budgetCatName}>{cat.label}</span>
                    {itemsInCat > 0 ? (
                      <span style={s.budgetCatHint}>{itemsInCat} öğe</span>
                    ) : null}
                  </div>
                  <span style={s.budgetCatPct}>%{pct}</span>
                  <span style={s.budgetCatAmt}>₺{val.toLocaleString('tr-TR')}</span>
                </div>
              );
            })}
          </div>
        </>
      ) : null}
    </section>
  );
}

/* ── Seyahat Planı bölümü (Cinematic Editorial) ── */
function PlanSection({ selectedListings, onDeselect }) {
  const items = Object.values(selectedListings);

  return (
    <section style={s.editorialSection}>
      <header style={s.editorialHead}>
        <h3 style={s.editorialTitle}>Seyahat Planı</h3>
        {items.length > 0 ? (
          <span style={s.editorialMeta}>{items.length} öğe</span>
        ) : null}
      </header>
      <div style={s.hairline} aria-hidden />

      {items.length === 0 ? (
        <p style={s.proseEmpty}>
          Sohbette bir öneri seçince buraya günlük günlük işlenir. Atlas plan
          taslağını bu bölümde sayfa sayfa kuracak.
        </p>
      ) : (
        <div style={s.planListEd}>
          {items.map((listing, i) => (
            <div key={listing.name ?? i} style={s.planItemEd}>
              <span style={s.planItemIconEd} aria-hidden>
                <ListingTypeGlyph type={listing.type} size={14} />
              </span>
              <div style={s.planItemInfoEd}>
                <span style={s.planItemNameEd}>{listing.name}</span>
                {listing.location ? (
                  <span style={s.planItemLocEd}>
                    <MapPin size={10} strokeWidth={2} aria-hidden />
                    {listing.location}
                  </span>
                ) : null}
              </div>
              {listing.price != null ? (
                <span style={s.planItemPriceEd}>
                  ₺{Number(listing.price).toLocaleString('tr-TR')}
                </span>
              ) : null}
              <button
                type="button"
                style={s.planRemoveBtnEd}
                onClick={() => onDeselect?.(listing)}
                aria-label="Kaldır"
              >
                <X size={12} strokeWidth={2.2} aria-hidden />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ModuleBlock({ mod, isDone }) {
  const [active, setActive]   = useState(mod.defaultActive);
  const [locked, setLocked]   = useState(mod.defaultLocked || isDone);

  const isEffectivelyDone = isDone || locked;

  return (
    <div style={{
      ...s.module,
      ...(active ? s.moduleActive : {}),
      ...(isEffectivelyDone ? s.moduleLocked : {}),
    }}>
      <div style={s.moduleRow}>
        <div style={s.moduleMain}>
          <div style={{
            ...s.moduleName,
            color: isDone ? 'var(--green)' : active ? 'var(--text1)' : 'var(--muted)',
          }}>
            {isDone ? <Check size={12} strokeWidth={2.5} aria-hidden /> : null}
            {mod.label}
          </div>
          <div style={s.moduleDesc}>{mod.desc}</div>
        </div>

        <div style={s.moduleActions}>
          {/* Toggle Açık/Pasif */}
          <button
            style={s.tinyBtn}
            onClick={() => setActive(a => !a)}
          >
            {active ? 'Açık' : 'Pasif'}
          </button>

          {/* Lock/Unlock */}
          <button
            style={{ ...s.tinyBtn, ...(locked ? s.tinyBtnAccent : {}) }}
            onClick={() => setLocked(l => !l)}
          >
            {locked ? 'Kilitli' : 'Kilitle'}
          </button>
        </div>
      </div>

      <div style={s.tagsRow}>
        {mod.tags.map(t => <span key={t} style={s.tag}>{t}</span>)}
        {mod.hasAdd && <span style={s.tagAdd}>+ alt başlık ekle</span>}
      </div>
    </div>
  );
}

const s = {
  /* ──────────────────────────────────────────
     Cinematic Editorial — bölüm bloklarının
     ortak gramer kuralları
     ────────────────────────────────────────── */
  editorialEyebrow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    margin: '0 0 var(--space-4)',
    fontFamily: 'var(--font-sans)',
    fontSize: 10,
    fontWeight: 'var(--fw-bold)',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: 'var(--ta-ink-muted)',
  },
  eyebrowDot: {
    fontSize: 9,
    color: 'var(--ta-accent)',
    transform: 'translateY(-1px)',
  },
  editorialSection: {
    margin: '0 0 var(--space-5)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
  },
  editorialHead: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 'var(--space-3)',
  },
  editorialTitle: {
    margin: 0,
    fontFamily: 'var(--font-serif)',
    fontWeight: 'var(--fw-bold)',
    fontSize: 'var(--text-md)',
    lineHeight: 1,
    letterSpacing: '0.04em',
    color: 'var(--ta-ink)',
  },
  editorialMeta: {
    fontFamily: 'var(--font-sans)',
    fontSize: 10,
    fontWeight: 'var(--fw-semibold)',
    letterSpacing: '0.10em',
    textTransform: 'uppercase',
    color: 'var(--ta-ink-muted)',
    fontVariantNumeric: 'tabular-nums',
  },
  hairline: {
    height: 1,
    background: 'linear-gradient(90deg, rgba(31,77,92,0.30) 0%, rgba(31,77,92,0.05) 100%)',
    margin: '0 0 var(--space-2)',
  },

  /* ── Modül satırları ── */
  moduleRowList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  },
  moduleRowItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: '6px 0',
  },
  statusRing: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(31,77,92,0.32)',
    background: 'transparent',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'background var(--duration-base) var(--ease-out), border-color var(--duration-base) var(--ease-out)',
  },
  statusRingDone: {
    background: 'var(--ta-accent)',
    borderColor: 'var(--ta-accent)',
  },
  statusRingBooked: {
    /* Rezerve durumu picked'den ayrılsın diye koyu ink ton */
    background: 'var(--ta-ink)',
    borderColor: 'var(--ta-ink)',
    boxShadow: '0 0 0 3px rgba(15,23,32,0.14)',
  },
  moduleRowLabel: {
    flex: 1,
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--fw-semibold)',
    color: 'var(--ta-ink)',
  },
  moduleRowMeta: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    color: 'var(--ta-ink-subtle)',
    fontVariantNumeric: 'tabular-nums',
  },
  moduleRowMetaDone: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    color: 'var(--ta-accent)',
    fontWeight: 'var(--fw-bold)',
    fontVariantNumeric: 'tabular-nums',
  },
  moduleRowBookedTag: {
    fontFamily: 'var(--font-sans)',
    fontSize: 10,
    fontWeight: 'var(--fw-bold)',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--ta-ink)',
    padding: '2px 8px',
    borderRadius: 'var(--radius-pill)',
    background: 'rgba(15,23,32,0.06)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(15,23,32,0.18)',
  },
  moduleRowAction: {
    fontFamily: 'var(--font-sans)',
    fontSize: 10,
    fontWeight: 'var(--fw-semibold)',
    letterSpacing: '0.04em',
    color: 'var(--ta-ink-subtle)',
    background: 'transparent',
    border: 'none',
    padding: '2px 4px',
    cursor: 'pointer',
    marginLeft: 4,
  },
  moduleRowActionPrimary: {
    fontFamily: 'var(--font-sans)',
    fontSize: 10,
    fontWeight: 'var(--fw-bold)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'var(--ta-accent)',
    background: 'transparent',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(31,77,92,0.32)',
    padding: '3px 8px',
    borderRadius: 'var(--radius-pill)',
    cursor: 'pointer',
    marginLeft: 6,
    whiteSpace: 'nowrap',
    transition: 'background var(--duration-fast) var(--ease-out)',
  },

  /* ── Bütçe büyük rakam ── */
  budgetTotalBig: {
    display: 'inline-flex',
    alignItems: 'baseline',
    gap: 6,
    fontFamily: 'var(--font-serif)',
    fontWeight: 'var(--fw-bold)',
    color: 'var(--ta-ink)',
    letterSpacing: '-0.02em',
  },
  budgetCurrency: {
    fontSize: 'var(--text-xl)',
    color: 'var(--ta-ink-muted)',
    fontWeight: 'var(--fw-medium)',
  },
  budgetAmount: {
    fontSize: 32,
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
  },
  budgetDash: {
    fontSize: 32,
    lineHeight: 1,
    color: 'var(--ta-ink-subtle)',
  },
  budgetSubtitle: {
    margin: 0,
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    color: 'var(--ta-ink-muted)',
    lineHeight: 1.45,
  },
  budgetBreakdownLabel: {
    marginTop: 'var(--space-3)',
    marginBottom: 2,
    fontFamily: 'var(--font-sans)',
    fontSize: 10,
    fontWeight: 'var(--fw-bold)',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--ta-ink-muted)',
  },
  budgetBreakdownList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
  },
  budgetCatRow: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto auto',
    alignItems: 'baseline',
    columnGap: 'var(--space-2)',
    paddingTop: 'var(--space-2)',
    paddingBottom: 'var(--space-2)',
    borderTopWidth: 'var(--border-thin)',
    borderTopStyle: 'solid',
    borderTopColor: 'rgba(31,77,92,0.14)',
  },
  budgetCatBullet: {
    color: 'var(--ta-accent)',
    fontSize: 11,
    lineHeight: 1,
    transform: 'translateY(1px)',
  },
  budgetCatMain: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    minWidth: 0,
  },
  budgetCatName: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--fw-semibold)',
    color: 'var(--ta-ink)',
  },
  budgetCatHint: {
    fontFamily: 'var(--font-sans)',
    fontSize: 10,
    color: 'var(--ta-ink-muted)',
    letterSpacing: '0.04em',
  },
  budgetCatPct: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--fw-semibold)',
    color: 'var(--ta-ink-muted)',
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '0.02em',
  },
  budgetCatAmt: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--fw-bold)',
    color: 'var(--ta-ink)',
    fontVariantNumeric: 'tabular-nums',
  },

  /* ── Plan prose + satır ── */
  proseEmpty: {
    margin: 0,
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    color: 'var(--ta-ink-muted)',
    lineHeight: 1.55,
    maxWidth: '36ch',
  },
  planListEd: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  },
  planItemEd: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-2) 0',
    borderTopWidth: 'var(--border-thin)',
    borderTopStyle: 'solid',
    borderTopColor: 'rgba(31,77,92,0.08)',
  },
  planItemIconEd: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 22,
    height: 22,
    borderRadius: 'var(--radius-xs)',
    background: 'rgba(31,77,92,0.06)',
    color: 'var(--ta-accent)',
    flexShrink: 0,
  },
  planItemInfoEd: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
  planItemNameEd: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--fw-semibold)',
    color: 'var(--ta-ink)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  planItemLocEd: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    fontFamily: 'var(--font-sans)',
    fontSize: 11,
    color: 'var(--ta-ink-muted)',
  },
  planItemPriceEd: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--fw-bold)',
    color: 'var(--ta-ink)',
    fontVariantNumeric: 'tabular-nums',
    flexShrink: 0,
  },
  planRemoveBtnEd: {
    width: 22,
    height: 22,
    border: 'none',
    borderRadius: '50%',
    background: 'transparent',
    color: 'var(--ta-ink-subtle)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  /* ── Plan adı ── */
  planNameRow: {
    marginBottom: '14px',
  },
  bottomSlotWrap: {
    marginTop: 12,
    paddingTop: 12,
    borderTop: '1px solid rgba(0,0,0,.06)',
    flexShrink: 0,
  },
  nameDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'transparent',
    border: 'none',
    padding: '6px 0',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
  },
  nameStar: {
    display: 'inline-flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  nameText: {
    fontFamily: 'var(--font-serif)',
    fontWeight: 700,
    fontSize: '15px',
    color: 'var(--text1)',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  namePencil: {
    display: 'inline-flex',
    alignItems: 'center',
    opacity: 0.6,
    flexShrink: 0,
  },
  nameInput: {
    fontFamily: 'var(--font-serif)',
    fontWeight: 700,
    fontSize: '15px',
    color: 'var(--text1)',
    background: 'rgba(31,77,92,.07)',
    border: '1px solid rgba(31,77,92,.30)',
    borderRadius: '10px',
    padding: '6px 10px',
    width: '100%',
    outline: 'none',
    boxSizing: 'border-box',
  },

  modSection: {
    marginTop: '4px',
    marginBottom: '4px',
  },

  section: { marginTop: '18px' },

  /* ── Tab grid ── */
  tabGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '7px',
    marginTop: '12px',
    marginBottom: '4px',
  },
  tabItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    padding: '11px 14px',
    border: '1px solid rgba(0,0,0,.07)',
    borderRadius: '12px',
    background: 'rgba(255,255,255,.65)',
    cursor: 'pointer',
    transition: 'background .15s, border-color .15s',
    minWidth: 0,
    textAlign: 'left',
  },
  tabItemActive: {
    background: 'rgba(0,0,0,.04)',
    border: '1px solid rgba(0,0,0,.07)',
  },
  tabItemDone: {
    background: 'rgba(47,143,107,.08)',
    border: '1px solid rgba(47,143,107,.28)',
  },
  tabBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  tabLabel: {
    fontFamily: 'var(--font-serif)',
    fontSize: '14px',
    fontWeight: 700,
    letterSpacing: '0.01em',
    color: 'var(--text1)',
    textAlign: 'left',
    lineHeight: 1.2,
    flex: 1,
  },
  tabTick: {
    display: 'inline-flex',
    alignItems: 'center',
    flexShrink: 0,
  },

  /* Expanded detail */
  expandPanel: {
    margin: '8px 0 4px',
    padding: '12px 14px',
    borderRadius: '16px',
    background: 'rgba(255,255,255,.72)',
    border: '1px solid rgba(0,0,0,.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  expandDesc: {
    fontFamily: 'var(--font-sans)',
    fontSize: '12px',
    color: 'var(--muted)',
    lineHeight: 1.5,
  },
  expandDone: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontFamily: 'var(--font-sans)',
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--green)',
    background: 'rgba(47,143,107,.08)',
    border: '1px solid rgba(47,143,107,.18)',
    borderRadius: '999px',
    padding: '3px 10px',
    alignSelf: 'flex-start',
  },

  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
    fontSize: '12px',
    color: 'var(--muted)',
    textTransform: 'uppercase',
    letterSpacing: '.08em',
    fontWeight: 700,
    fontFamily: 'var(--font-sans)',
  },
  planTag: {
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--ta-accent-deep)',
    background: 'var(--ta-accent-soft)',
    border: '1px solid rgba(31,77,92,.24)',
    borderRadius: '999px',
    padding: '2px 9px',
    textTransform: 'none',
    letterSpacing: 0,
  },

  /* Module list */
  moduleList: {
    display: 'grid',
    gap: '10px',
  },
  module: {
    border: '1px solid var(--line)',
    background: 'rgba(255,255,255,.64)',
    borderRadius: '18px',
    padding: '12px',
    transition: '.2s ease',
  },
  moduleActive: {
    border: '1px solid rgba(31,77,92,.4)',
    background: 'linear-gradient(180deg,rgba(255,255,255,.95),rgba(248,241,228,.92))',
  },
  moduleLocked: {
    boxShadow: 'inset 0 0 0 1px rgba(47,143,107,.25)',
  },
  moduleRow: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
  },
  moduleMain: { flex: 1, minWidth: 0 },
  moduleName: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontWeight: 700,
    fontSize: '14px',
    fontFamily: 'var(--font-sans)',
    lineHeight: 1.3,
    marginBottom: '3px',
  },
  moduleDesc: {
    fontSize: '12px',
    color: 'var(--muted)',
    lineHeight: 1.45,
    fontFamily: 'var(--font-sans)',
  },
  moduleActions: {
    display: 'flex',
    gap: '5px',
    flexShrink: 0,
  },
  tinyBtn: {
    border: '1px solid var(--line)',
    background: 'white',
    borderRadius: '10px',
    padding: '5px 8px',
    fontSize: '11px',
    cursor: 'pointer',
    color: 'var(--ta-ink-2)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },
  tinyBtnAccent: {
    background: 'rgba(31,77,92,.12)',
    border: '1px solid rgba(31,77,92,.24)',
    color: 'var(--ta-accent-deep)',
    fontWeight: 700,
  },

  /* Tags */
  tagsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '7px',
    marginTop: '10px',
  },
  tag: {
    padding: '5px 9px',
    borderRadius: '999px',
    fontSize: '12px',
    background: 'rgba(20,20,20,.04)',
    border: '1px solid rgba(0,0,0,.05)',
    color: 'var(--ta-ink-muted)',
    fontFamily: 'var(--font-sans)',
  },
  tagAdd: {
    padding: '5px 9px',
    borderRadius: '999px',
    fontSize: '12px',
    background: 'rgba(47,143,107,.08)',
    border: '1px solid rgba(47,143,107,.16)',
    color: 'var(--green)',
    cursor: 'pointer',
    fontWeight: 700,
    fontFamily: 'var(--font-sans)',
  },

  /* Accordion */
  accordion: {
    border: '1px solid var(--line)',
    background: 'rgba(255,255,255,.68)',
    borderRadius: '18px',
    overflow: 'hidden',
  },
  accordionOpen: {},
  accordionToggle: {
    width: '100%',
    border: 0,
    background: 'transparent',
    padding: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    cursor: 'pointer',
    textAlign: 'left',
  },
  accTitle: {
    fontFamily: 'var(--font-sans)',
    fontSize: '13px',
    fontWeight: 700,
    display: 'block',
    color: 'var(--text1)',
  },
  accSub: {
    display: 'block',
    fontSize: '11px',
    color: 'var(--muted)',
    marginTop: '3px',
    lineHeight: 1.45,
    fontFamily: 'var(--font-sans)',
  },
  accIcon: {
    width: '26px',
    height: '26px',
    borderRadius: '999px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(0,0,0,.06)',
    background: 'rgba(20,20,20,.04)',
    color: 'var(--ta-ink-muted)',
    transition: 'transform .2s ease',
    flexShrink: 0,
    fontSize: '16px',
  },
  accordionBody: {
    padding: '0 14px 14px',
    borderTop: '1px solid rgba(0,0,0,.05)',
  },
  emptyNote: {
    fontFamily: 'var(--font-sans)',
    fontSize: '12px',
    color: 'var(--muted)',
    lineHeight: 1.5,
    paddingTop: '12px',
  },

  /* Advice */
  adviceCard: {
    border: '1px solid var(--line)',
    background: 'rgba(255,255,255,.68)',
    borderRadius: '18px',
    padding: '14px',
  },
  adviceText: {
    fontFamily: 'var(--font-sans)',
    fontSize: '13px',
    color: 'var(--ta-ink-muted)',
    lineHeight: 1.5,
  },

  /* Budget section */
  budgetTotalBadge: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--ta-accent-deep)',
    background: 'var(--ta-accent-soft)',
    border: '1px solid rgba(31,77,92,.2)',
    borderRadius: '999px',
    padding: '2px 8px',
    letterSpacing: 0,
    textTransform: 'none',
  },
  budgetCard: {
    border: '1px solid rgba(0,0,0,.06)',
    background: 'rgba(255,255,255,.80)',
    borderRadius: '18px',
    padding: '14px',
  },
  budgetTotalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    paddingBottom: '10px',
    borderBottom: '1px solid rgba(0,0,0,.06)',
  },
  budgetTotalLabel: {
    fontFamily: 'var(--font-sans)',
    fontWeight: 700,
    fontSize: '13px',
    color: 'var(--text2)',
  },
  budgetTotalAmt: {
    fontFamily: 'var(--font-serif)',
    fontWeight: 700,
    fontSize: '22px',
    letterSpacing: '-0.03em',
    color: 'var(--text1)',
  },
  budgetRow: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto',
    gap: '6px',
    alignItems: 'center',
    marginBottom: '8px',
  },
  budgetCatIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    flexShrink: 0,
  },
  budgetCatLabel: {
    fontFamily: 'var(--font-sans)',
    fontSize: '12px',
    color: 'var(--text2)',
  },
  budgetCatAmt: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text1)',
    textAlign: 'right',
  },
  miniBar: {
    gridColumn: '1 / -1',
    height: '4px',
    background: 'rgba(0,0,0,.06)',
    borderRadius: '999px',
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, var(--ta-accent-bright), var(--ta-accent-deep))',
    borderRadius: '999px',
    transition: 'width .4s ease',
  },

  /* Plan section */
  planCountBadge: {
    fontFamily: 'var(--font-sans)',
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--green)',
    background: 'var(--success-soft)',
    border: '1px solid rgba(47,143,107,.18)',
    borderRadius: '999px',
    padding: '2px 8px',
    textTransform: 'none',
    letterSpacing: 0,
  },
  planCard: {
    border: '1px solid rgba(0,0,0,.06)',
    background: 'rgba(255,255,255,.80)',
    borderRadius: '18px',
    padding: '8px',
    maxHeight: '260px',
    overflow: 'auto',
  },
  planList: { display: 'flex', flexDirection: 'column', gap: '7px' },
  planItem: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto auto',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 10px',
    border: '1px solid rgba(0,0,0,.06)',
    borderRadius: '12px',
    background: 'rgba(255,255,255,.92)',
    transition: 'background .12s',
  },
  planItemIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '26px',
    flexShrink: 0,
  },
  planItemInfo: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
  },
  planItemName: {
    fontFamily: 'var(--font-sans)',
    fontWeight: 700,
    fontSize: '12px',
    color: 'var(--text1)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  planItemLoc: {
    fontFamily: 'var(--font-sans)',
    fontSize: '11px',
    color: 'var(--muted)',
  },
  planItemPrice: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--ta-accent-deep)',
    flexShrink: 0,
  },
  planRemoveBtn: {
    width: '22px', height: '22px',
    borderRadius: '50%',
    border: '1px solid rgba(0,0,0,.08)',
    background: 'rgba(0,0,0,.03)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    color: 'var(--muted)',
    flexShrink: 0,
    transition: 'background .12s, color .12s',
  },
};
