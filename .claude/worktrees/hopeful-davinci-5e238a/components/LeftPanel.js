'use client';

import { useEffect, useState } from 'react';

const MODULES = [
  {
    id: 'lodging',
    label: 'Konaklama',
    desc: 'Butik otel ve nehir kıyısı seçenekleri öne çıktı.',
    defaultActive: true,
    defaultLocked: false,
    tags: ['Butik otel', 'Merkezde'],
    hasAdd: true,
  },
  {
    id: 'transfer',
    label: 'Transfer',
    desc: 'Havalimanı karşılama ve dönüş transferi değerlendiriliyor.',
    defaultActive: true,
    defaultLocked: false,
    tags: ['Karşılama', 'Özel araç'],
    hasAdd: true,
  },
  {
    id: 'transport',
    label: 'Ulaşım',
    desc: 'Henüz kullanıcı tarafından istenmedi. Gerekirse sonradan eklenebilir.',
    defaultActive: false,
    defaultLocked: false,
    tags: ['Uçuş', 'Tren', 'Araç kiralama'],
    hasAdd: false,
  },
  {
    id: 'activities',
    label: 'Aktiviteler',
    desc: 'Müze, kale ve yerel yemek durağı içeren rota oluşturuldu.',
    defaultActive: true,
    defaultLocked: false,
    tags: ['Müze', 'Kale', 'Yerel lezzet'],
    hasAdd: false,
  },
  {
    id: 'extras',
    label: 'Ekstra servisler',
    desc: 'İstenirse cruise, restoran rezervasyonu veya özel deneyim eklenebilir.',
    defaultActive: false,
    defaultLocked: false,
    tags: ['Gemi turu', 'Restoran', 'Sigorta'],
    hasAdd: true,
  },
];

const BUDGET_CATS = [
  { key: 'accommodation', label: 'Konaklama', icon: '🏨' },
  { key: 'transport',     label: 'Transfer',  icon: '🚗' },
  { key: 'activities',    label: 'Aktivite',  icon: '🎡' },
  { key: 'extras',        label: 'Diğer',     icon: '✨' },
];

export default function LeftPanel({
  planName = 'Yeni Seyahat Planı',
  onPlanNameChange,
  completedModules = new Set(),
  budget = {},
  selectedListings = {},
  onDeselect,
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
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        className="left-panel"
        style={{
          flex: 1,
          overflowY: 'auto',
          scrollbarWidth: 'none',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >

      {/* ── Plan adı (düzenlenebilir) ── */}
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
            <span style={s.nameStar}>✦</span>
            <span style={s.nameText}>{planName}</span>
            <span style={s.namePencil}>✎</span>
          </button>
        )}
      </div>

      {/* ── Modül Tab Grid ── */}
      <div style={s.modSection}>
        <div style={s.sectionTitle}>
          <span>Seyahat modülleri</span>
          <span style={s.planTag}>Esnek plan</span>
        </div>

        {/* Text-only module tabs */}
        <div style={s.tabGrid}>
          {MODULES.map(mod => {
            const isDone  = completedModules.has(mod.id);
            const isActive = activeModule === mod.id;
            return (
              <div key={mod.id} style={s.tabBlock}>
                <button
                  style={{
                    ...s.tabItem,
                    ...(isActive  ? s.tabItemActive  : {}),
                    ...(isDone    ? s.tabItemDone    : {}),
                    ...(!mod.defaultActive && !isDone ? s.tabItemPassive : {}),
                  }}
                  onClick={() => setActiveModule(id => id === mod.id ? null : mod.id)}
                >
                  <span style={s.tabLabel}>{mod.label.split(' /')[0]}</span>
                  {isDone && <span style={s.tabTick}>✓</span>}
                </button>

                {/* Her modülün kendi altında açılan detay paneli */}
                {isActive && (
                  <div style={s.expandPanel}>
                    <p style={s.expandDesc}>{mod.desc}</p>
                    <div style={s.tagsRow}>
                      {mod.tags.map(t => <span key={t} style={s.tag}>{t}</span>)}
                      {mod.hasAdd && <span style={s.tagAdd}>+ ekle</span>}
                    </div>
                    {isDone && (
                      <span style={s.expandDone}>✓ Tamamlandı</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Bütçe ── */}
      <BudgetSection budget={budget} />

      {/* ── Seyahat Planı (seçilen öğeler) ── */}
      <PlanSection selectedListings={selectedListings} onDeselect={onDeselect} />

      {/* ── Akıllı öneri ── */}
      <div style={s.section}>
        <div style={s.sectionTitle}><span>Akıllı öneri</span></div>
        <div style={s.adviceCard}>
          <p style={s.adviceText}>
            Konaklama ve aktiviteler netleşmeye yaklaştı. İstersen bir sonraki adımda yalnızca transfer kısmını tamamlayıp planı sabitleyebiliriz.
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}

/* ── Bütçe bölümü ── */
function BudgetSection({ budget }) {
  const values = BUDGET_CATS.map(c => budget[c.key] ?? 0);
  const total  = values.reduce((a, b) => a + b, 0);

  return (
    <div style={s.section}>
      <div style={s.sectionTitle}>
        <span>Bütçe özeti</span>
        {total > 0 && (
          <span style={s.budgetTotalBadge}>
            ₺{total.toLocaleString('tr-TR')}
          </span>
        )}
      </div>

      <div style={s.budgetCard}>
        {total === 0 ? (
          <p style={s.emptyNote}>Henüz seçilen öğe yok. Bir listing seçilince bütçe burada görünür.</p>
        ) : (
          <>
            <div style={s.budgetTotalRow}>
              <span style={s.budgetTotalLabel}>Toplam</span>
              <span style={s.budgetTotalAmt}>₺{total.toLocaleString('tr-TR')}</span>
            </div>
            {BUDGET_CATS.map((cat, i) => {
              const val = values[i];
              if (!val) return null;
              const pct = Math.round((val / total) * 100);
              return (
                <div key={cat.key} style={s.budgetRow}>
                  <span style={s.budgetCatIcon}>{cat.icon}</span>
                  <span style={s.budgetCatLabel}>{cat.label}</span>
                  <span style={s.budgetCatAmt}>₺{val.toLocaleString('tr-TR')}</span>
                  <div style={s.miniBar}>
                    <div style={{ ...s.miniBarFill, width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

/* ── Seyahat Planı bölümü ── */
function PlanSection({ selectedListings, onDeselect }) {
  const items = Object.values(selectedListings);

  return (
    <div style={s.section}>
      <div style={s.sectionTitle}>
        <span>Seyahat planı</span>
        {items.length > 0 && (
          <span style={s.planCountBadge}>{items.length} öğe</span>
        )}
      </div>

      <div style={s.planCard}>
        {items.length === 0 ? (
          <p style={s.emptyNote}>Chat'ten bir seçenek seçince buraya eklenir.</p>
        ) : (
          <div style={s.planList}>
            {items.map((listing, i) => (
              <div key={listing.name ?? i} style={s.planItem}>
                <span style={s.planItemIcon}>
                  {PLAN_ICONS[listing.type] ?? '📌'}
                </span>
                <div style={s.planItemInfo}>
                  <span style={s.planItemName}>{listing.name}</span>
                  {listing.location && (
                    <span style={s.planItemLoc}>📍 {listing.location}</span>
                  )}
                </div>
                {listing.price != null && (
                  <span style={s.planItemPrice}>
                    ₺{Number(listing.price).toLocaleString('tr-TR')}
                  </span>
                )}
                <button
                  style={s.planRemoveBtn}
                  onClick={() => onDeselect?.(listing)}
                  title="Plandam kaldır"
                >✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const PLAN_ICONS = {
  hotel: '🏨', villa: '🏡', transfer: '🚗', tour: '🎡',
  restaurant: '🍽️', boat: '⛵', clinic: '🏥', car: '🚙',
};

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
            {isDone ? '✓ ' : ''}{mod.label}
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
            style={{ ...s.tinyBtn, ...(locked ? s.tinyBtnGold : {}) }}
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
  /* ── Plan adı ── */
  planNameRow: {
    marginBottom: '14px',
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
    fontSize: '14px',
    color: 'var(--gold)',
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
    fontSize: '13px',
    color: 'var(--text3)',
    opacity: 0.6,
    flexShrink: 0,
  },
  nameInput: {
    fontFamily: 'var(--font-serif)',
    fontWeight: 700,
    fontSize: '15px',
    color: 'var(--text1)',
    background: 'rgba(199,154,70,.07)',
    border: '1px solid rgba(199,154,70,.30)',
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
    background: 'rgba(199,154,70,.10)',
    border: '1px solid rgba(199,154,70,.36)',
  },
  tabItemDone: {
    background: 'rgba(47,143,107,.08)',
    border: '1px solid rgba(47,143,107,.28)',
  },
  tabItemPassive: {
    opacity: 0.55,
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
    fontSize: '12px',
    fontWeight: 800,
    color: 'var(--green)',
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
    color: 'var(--gold-deep)',
    background: 'var(--gold-soft)',
    border: '1px solid rgba(199,154,70,.24)',
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
    border: '1px solid rgba(199,154,70,.4)',
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
    color: '#433a30',
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },
  tinyBtnGold: {
    background: 'rgba(199,154,70,.12)',
    border: '1px solid rgba(199,154,70,.24)',
    color: 'var(--gold-deep)',
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
    color: '#4a4137',
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
    color: '#564c42',
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
    color: '#51493f',
    lineHeight: 1.5,
  },

  /* Budget section */
  budgetTotalBadge: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--gold-deep)',
    background: 'var(--gold-soft)',
    border: '1px solid rgba(199,154,70,.2)',
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
  budgetCatIcon: { fontSize: '14px' },
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
    background: 'linear-gradient(90deg,#d3ab5f,#c08d36)',
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
    gridTemplateColumns: '1fr auto auto',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 10px',
    border: '1px solid rgba(0,0,0,.06)',
    borderRadius: '12px',
    background: 'rgba(255,255,255,.92)',
    transition: 'background .12s',
  },
  planItemIcon: { display: 'none' },
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
    color: 'var(--gold-deep)',
    flexShrink: 0,
  },
  planRemoveBtn: {
    width: '22px', height: '22px',
    borderRadius: '50%',
    border: '1px solid rgba(0,0,0,.08)',
    background: 'rgba(0,0,0,.03)',
    cursor: 'pointer',
    fontSize: '10px',
    color: 'var(--muted)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    transition: 'background .12s, color .12s',
  },
};
