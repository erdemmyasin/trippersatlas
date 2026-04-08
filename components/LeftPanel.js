'use client';

import { useState } from 'react';

const MODULES = [
  {
    id: 'purpose',
    label: 'Amaç / Plan türü',
    desc: 'Kısa kültürel kaçamak olarak netleşti.',
    defaultActive: true,
    defaultLocked: true,
    tags: ['Şehir keşfi', 'Yürünebilir plan'],
    hasAdd: false,
  },
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
    tags: ['Cruise', 'Restoran', 'Sigorta'],
    hasAdd: true,
  },
];

const ADD_MODULES = ['+ Ulaşım', '+ Transfer', '+ Cruise', '+ Restoran', '+ Sigorta'];

export default function LeftPanel({ completedModules = new Set() }) {
  const [savedOpen, setSavedOpen] = useState(true);

  return (
    <div style={s.panel}>
      {/* ── Modüller ── */}
      <div style={s.section}>
        <div style={s.sectionTitle}>
          <span>Seyahat modülleri</span>
          <span style={s.planTag}>Esnek plan</span>
        </div>
        <div style={s.moduleList}>
          {MODULES.map(mod => (
            <ModuleBlock key={mod.id} mod={mod} isDone={completedModules.has(mod.id)} />
          ))}
        </div>
      </div>

      {/* ── Kaydedilenler ── */}
      <div style={s.section}>
        <div style={s.sectionTitle}><span>Kaydedilenler</span></div>
        <div style={{ ...s.accordion, ...(savedOpen ? s.accordionOpen : {}) }}>
          <button style={s.accordionToggle} onClick={() => setSavedOpen(o => !o)}>
            <div>
              <strong style={s.accTitle}>Kaydedilen lokasyon, otel ve servisler</strong>
              <span style={s.accSub}>
                Beğendiğin öğeleri burada tut, istersen sonradan tura ekle veya yeni tur başlat.
              </span>
            </div>
            <span style={{
              ...s.accIcon,
              transform: savedOpen ? 'rotate(180deg)' : 'rotate(0)',
            }}>⌄</span>
          </button>

          {savedOpen && (
            <div style={s.accordionBody}>
              <p style={s.emptyNote}>
                Henüz kaydedilen öğe yok. Kart üzerindeki 🔖 ikonuna tıklayarak otel ve servisleri buraya ekleyebilirsin.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Yeni bileşen ── */}
      <div style={s.section}>
        <div style={s.sectionTitle}><span>Yeni bileşen ekle</span></div>
        <div style={s.tagsRow}>
          {ADD_MODULES.map(label => (
            <span key={label} style={s.tagAdd}>{label}</span>
          ))}
        </div>
      </div>

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
  panel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },

  section: { marginTop: '18px' },

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
};
