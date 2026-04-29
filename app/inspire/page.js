'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Upload,
  MapPin,
  Plus,
  X,
  Check,
  FileText,
  Globe,
  CalendarDays,
  UtensilsCrossed,
  PenLine,
} from 'lucide-react';
import AppSidebar from '@/components/AppSidebar';
import { appendUserGuide } from '@/lib/exploreGuides';
import { defaultTripDestinationLabel, tripStoreDefaultImageQuery } from '@/lib/taRegion';

const DRAFTS_LS = 'inspire_drafts';
const PUBLISHED_LS = 'inspire_published';

const TYPE_CARD_ICONS = {
  route: CalendarDays,
  place: MapPin,
  food: UtensilsCrossed,
  blog: PenLine,
};

const TYPE_CARDS = [
  {
    id: 'route',
    title: 'Gezi Rotası',
    desc: 'Gün gün plan ve rota',
  },
  {
    id: 'place',
    title: 'Mekan Rehberi',
    desc: 'En iyi mekan listeleri',
  },
  {
    id: 'food',
    title: 'Yemek Rehberi',
    desc: 'Restoran ve lezzet rotası',
  },
  {
    id: 'blog',
    title: 'Blog Yazısı',
    desc: 'Seyahat hikayesi',
  },
];

const TYPE_LABELS = {
  route: 'Gezi Rotası',
  place: 'Mekan Rehberi',
  food: 'Yemek Rehberi',
  blog: 'Blog Yazısı',
};

const BADGE_BY_TYPE = {
  route: 'Rota',
  place: 'Mekan listesi',
  food: 'Lezzet rotası',
  blog: 'Blog',
};

function loadLs(key, fallback = []) {
  if (typeof window === 'undefined') return fallback;
  try {
    const s = localStorage.getItem(key);
    if (!s) return fallback;
    const p = JSON.parse(s);
    return Array.isArray(p) ? p : fallback;
  } catch {
    return fallback;
  }
}

function saveLs(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

function formatRelative(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  const now = Date.now();
  const diff = now - d.getTime();
  const day = 86400000;
  if (diff < day) return 'bugün';
  if (diff < 2 * day) return 'dün';
  if (diff < 7 * day) return `${Math.floor(diff / day)} gün önce`;
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

export default function InspirePage() {
  const [view, setView] = useState('select');
  const [contentType, setContentType] = useState(null);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [places, setPlaces] = useState([{ name: '', note: '' }]);
  const [coverImage, setCoverImage] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [published, setPublished] = useState([]);
  const [toast, setToast] = useState(null);
  const [editingDraftId, setEditingDraftId] = useState(null);
  const [editingPublishedId, setEditingPublishedId] = useState(null);
  const fileRef = useRef(null);
  const toastTimer = useRef(null);

  const refreshLists = useCallback(() => {
    setDrafts(loadLs(DRAFTS_LS));
    setPublished(loadLs(PUBLISHED_LS));
  }, []);

  useEffect(() => {
    refreshLists();
  }, [refreshLists]);

  function showToast(msg) {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3000);
  }

  function resetForm() {
    setTitle('');
    setLocation('');
    setDescription('');
    setPlaces([{ name: '', note: '' }]);
    setCoverImage(null);
    setContentType(null);
    setEditingDraftId(null);
    setEditingPublishedId(null);
  }

  function startCreate() {
    setView('create');
  }

  function goBackSelect() {
    setView('select');
    resetForm();
  }

  async function fetchCoverFromUnsplash() {
    const q = encodeURIComponent(
      `${title.trim() || location.trim() || tripStoreDefaultImageQuery('')}`
    );
    try {
      const res = await fetch(`/api/image?query=${q}&type=tour`);
      const data = await res.json();
      if (data?.url) setCoverImage(data.url);
    } catch {
      /* ignore */
    }
  }

  function onCoverFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setCoverImage(String(r.result || ''));
    r.readAsDataURL(f);
  }

  function addPlace() {
    setPlaces((p) => [...p, { name: '', note: '' }]);
  }

  function updatePlace(i, field, value) {
    setPlaces((p) =>
      p.map((row, j) => (j === i ? { ...row, [field]: value } : row))
    );
  }

  function removePlace(i) {
    setPlaces((p) => (p.length <= 1 ? p : p.filter((_, j) => j !== i)));
  }

  function saveDraft() {
    const now = Date.now();
    const payload = {
      id: editingDraftId || `d-${now}`,
      contentType: contentType || 'route',
      title,
      location,
      description,
      places,
      coverUrl: coverImage,
      updatedAt: now,
    };
    let next = loadLs(DRAFTS_LS);
    if (editingDraftId) {
      next = next.map((d) => (d.id === editingDraftId ? payload : d));
    } else {
      next = [payload, ...next];
    }
    saveLs(DRAFTS_LS, next);
    setDrafts(next);
    setEditingDraftId(payload.id);
    showToast('Taslak kaydedildi');
  }

  function publishGuide() {
    if (!title.trim()) {
      window.alert('Lütfen bir başlık girin.');
      return;
    }
    const now = Date.now();
    const id = editingPublishedId || `pub-${now}`;
    const locCore = `${title.trim()} ${location.trim()}`.trim();
    const imageQuery = locCore ? `${locCore} travel` : tripStoreDefaultImageQuery('');
    const pubItem = {
      id,
      contentType: contentType || 'route',
      title: title.trim(),
      location: location.trim() || defaultTripDestinationLabel() || '—',
      description: description.trim(),
      places,
      coverUrl: coverImage,
      publishedAt: now,
      likes: 0,
      views: 0,
    };

    let pubList = loadLs(PUBLISHED_LS).filter((x) => x.id !== id);
    pubList = [pubItem, ...pubList];
    saveLs(PUBLISHED_LS, pubList);
    setPublished(pubList);

    if (editingDraftId) {
      const dr = loadLs(DRAFTS_LS).filter((d) => d.id !== editingDraftId);
      saveLs(DRAFTS_LS, dr);
      setDrafts(dr);
    }

    if (!editingPublishedId) {
      appendUserGuide({
        id: `ug-${now}`,
        title: pubItem.title,
        location: pubItem.location,
        author: 'Sen',
        authorAvatar: 'S',
        badge: BADGE_BY_TYPE[pubItem.contentType] || 'Rehber',
        likes: 0,
        imageQuery,
        isOfficial: false,
        coverUrl:
          typeof coverImage === 'string' && coverImage.startsWith('http')
            ? coverImage
            : coverImage?.startsWith?.('data:')
              ? coverImage
              : undefined,
        description: pubItem.description,
        places,
        guideType: pubItem.contentType,
      });
    } else {
      try {
        window.dispatchEvent(new Event('userGuidesUpdated'));
      } catch {
        /* ignore */
      }
    }

    showToast('Rehberiniz yayınlandı!');
    resetForm();
    setView('select');
  }

  function loadDraft(d) {
    setContentType(d.contentType || 'route');
    setTitle(d.title || '');
    setLocation(d.location || '');
    setDescription(d.description || '');
    setPlaces(
      Array.isArray(d.places) && d.places.length
        ? d.places.map((p) => ({ name: p.name || '', note: p.note || '' }))
        : [{ name: '', note: '' }]
    );
    setCoverImage(d.coverUrl || null);
    setEditingDraftId(d.id);
    setEditingPublishedId(null);
    setView('create');
  }

  function loadPublished(p) {
    setContentType(p.contentType || 'route');
    setTitle(p.title || '');
    setLocation(p.location || '');
    setDescription(p.description || '');
    setPlaces(
      Array.isArray(p.places) && p.places.length
        ? p.places.map((x) => ({ name: x.name || '', note: x.note || '' }))
        : [{ name: '', note: '' }]
    );
    setCoverImage(p.coverUrl || null);
    setEditingPublishedId(p.id);
    setEditingDraftId(null);
    setView('create');
  }

  function deleteDraft(id) {
    if (!confirm('Bu taslağı silmek istediğinize emin misiniz?')) return;
    const next = loadLs(DRAFTS_LS).filter((d) => d.id !== id);
    saveLs(DRAFTS_LS, next);
    setDrafts(next);
    if (editingDraftId === id) {
      resetForm();
      setView('select');
    }
  }

  function sharePublished(p) {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/explore#${p.id}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    showToast('Bağlantı panoya kopyalandı');
  }

  const typeTitle = contentType ? TYPE_LABELS[contentType] || 'İçerik' : '';

  return (
    <div style={st.shell}>
      <style>{`
        @keyframes inspireToastIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .inspire-toast {
          animation: inspireToastIn 0.25s ease forwards;
        }
        .inspire-type-card:hover {
          border-color: #B8934A !important;
          background: rgba(184,147,74,.04) !important;
        }
      `}</style>
      <AppSidebar activeId="inspire" />

      <div style={st.mainWrap}>
        <header style={st.topHeader}>
          <div>
            <h1 className="ta-h1" style={st.h1}>
              İlham Ol
            </h1>
            <p style={st.sub}>Deneyimlerini paylaş, ilham ver</p>
          </div>
          <button type="button" style={st.draftsPill}>
            Taslaklar [{drafts.length}]
          </button>
        </header>

        <div style={st.columns}>
          {/* Sol: oluşturma */}
          <div style={st.colLeft}>
            {view === 'select' && (
              <>
                <h2 style={st.blockTitle}>Ne oluşturmak istiyorsun?</h2>
                <div style={st.grid2x2}>
                  {TYPE_CARDS.map((c) => {
                    const TypeCardIcon = TYPE_CARD_ICONS[c.id];
                    return (
                    <button
                      key={c.id}
                      type="button"
                      className="inspire-type-card"
                      style={{
                        ...st.typeCard,
                        ...(contentType === c.id
                          ? st.typeCardSelected
                          : {}),
                      }}
                      onClick={() => setContentType(c.id)}
                    >
                      <span style={{ display: 'flex', color: 'var(--ta-sea)' }} aria-hidden>
                        {TypeCardIcon ? <TypeCardIcon size={28} strokeWidth={1.65} /> : null}
                      </span>
                      <div style={st.typeCardTitle}>{c.title}</div>
                      <div style={st.typeCardDesc}>{c.desc}</div>
                    </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  style={{
                    ...st.btnStart,
                    ...(!contentType ? st.btnStartDisabled : {}),
                  }}
                  disabled={!contentType}
                  onClick={() => contentType && startCreate()}
                >
                  + Oluşturmaya Başla
                </button>
              </>
            )}

            {view === 'create' && (
              <>
                <div style={st.createBar}>
                  <button type="button" style={st.linkBtn} onClick={goBackSelect}>
                    <ArrowLeft size={18} strokeWidth={2} color="var(--ta-ink)" />
                    Geri
                  </button>
                  <span style={st.createTypeLabel}>{typeTitle}</span>
                  <button type="button" style={st.btnPublishTop} onClick={publishGuide}>
                    Yayınla →
                  </button>
                </div>

                <div style={st.sectionLabel}>
                  <Globe size={14} strokeWidth={2} color="var(--ta-ink-subtle)" /> Kapak
                </div>
                <button
                  type="button"
                  style={st.coverZone}
                  onClick={() => fileRef.current?.click()}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={onCoverFile}
                  />
                  {coverImage ? (
                    <img src={coverImage} alt="" style={st.coverPreview} />
                  ) : (
                    <>
                      <Upload size={40} strokeWidth={1.5} color="var(--ta-ink-subtle)" />
                      <span style={st.coverText}>Kapak fotoğrafı ekle</span>
                      <button
                        type="button"
                        style={st.unsplashLink}
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchCoverFromUnsplash();
                        }}
                      >
                        veya Unsplash&apos;ten ara
                      </button>
                    </>
                  )}
                </button>
                {coverImage && (
                  <button
                    type="button"
                    style={st.linkSmall}
                    onClick={fetchCoverFromUnsplash}
                  >
                    Unsplash&apos;ten başka görsel dene
                  </button>
                )}

                <div style={st.sectionRule}>── Başlık ──</div>
                <input
                  style={st.titleInput}
                  placeholder="Rehberinize bir başlık verin..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />

                <div style={st.sectionRule}>── Lokasyon ──</div>
                <div style={st.locBox}>
                  <MapPin size={18} strokeWidth={2} color="var(--ta-ink-muted)" />
                  <input
                    style={st.locInput}
                    placeholder="Şehir veya bölge..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                <div style={st.sectionRule}>── Mekanlar ──</div>
                {places.map((pl, i) => (
                  <div key={i} style={st.placeItem}>
                    <div style={st.placeHead}>
                      <span style={st.placeNum}>{i + 1}</span>
                      <button
                        type="button"
                        style={st.iconGhost}
                        onClick={() => removePlace(i)}
                        aria-label="Sil"
                      >
                        <X size={18} strokeWidth={2} color="var(--ta-ink-muted)" />
                      </button>
                    </div>
                    <input
                      style={st.placeNameInp}
                      placeholder="Mekan adı"
                      value={pl.name}
                      onChange={(e) => updatePlace(i, 'name', e.target.value)}
                    />
                    <textarea
                      style={st.placeNote}
                      placeholder="Not..."
                      value={pl.note}
                      onChange={(e) => updatePlace(i, 'note', e.target.value)}
                      rows={2}
                    />
                  </div>
                ))}
                <button type="button" style={st.btnAddPlace} onClick={addPlace}>
                  <Plus size={16} strokeWidth={2} color="#B8934A" />
                  Mekan Ekle
                </button>

                <div style={st.sectionRule}>── Açıklama ──</div>
                <textarea
                  style={st.descTa}
                  placeholder="Deneyimlerinizi, ipuçlarınızı paylaşın..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                />

                <div style={st.bottomBar}>
                  <button type="button" style={st.btnDraft} onClick={saveDraft}>
                    <FileText size={16} strokeWidth={2} color="var(--ta-ink-muted)" />
                    Taslak Kaydet
                  </button>
                  <button type="button" style={st.btnPublish} onClick={publishGuide}>
                    Yayınla →
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Sağ: taslaklar + yayınlar */}
          <aside style={st.colRight}>
            <div style={st.sideHead}>
              <span style={st.sideSectionTitle}>TASLAKLAR</span>
              <span style={st.badge}>{drafts.length}</span>
            </div>
            {drafts.length === 0 ? (
              <p style={st.empty}>Henüz taslak yok</p>
            ) : (
              drafts.map((d) => (
                <div key={d.id} style={st.sideCard}>
                  <div style={st.sideRow}>
                    <FileText size={16} strokeWidth={2} color="var(--ta-ink-muted)" />
                    <span style={st.sideTitle}>
                      {d.title?.trim() || 'Başlıksız taslak'}
                    </span>
                  </div>
                  <p style={st.sideMeta}>
                    Son düzenleme: {formatRelative(d.updatedAt)}
                  </p>
                  <div style={st.sideActions}>
                    <button
                      type="button"
                      style={st.sideBtn}
                      onClick={() => loadDraft(d)}
                    >
                      Düzenle
                    </button>
                    <button
                      type="button"
                      style={{ ...st.sideBtn, color: '#A84A4A' }}
                      onClick={() => deleteDraft(d.id)}
                    >
                      Sil
                    </button>
                  </div>
                </div>
              ))
            )}

            <div style={{ ...st.sideHead, marginTop: 24 }}>
              <span style={st.sideSectionTitle}>YAYINLANANLAR</span>
              <span style={st.badge}>{published.length}</span>
            </div>
            {published.length === 0 ? (
              <p style={st.empty}>Henüz yayın yok</p>
            ) : (
              published.map((p) => (
                <div key={p.id} style={st.sideCard}>
                  <div style={st.sideRow}>
                    <Check size={16} strokeWidth={2} color="#2f8f6b" />
                    <span style={st.sideTitle}>
                      {p.title?.trim() || 'Başlıksız'}
                    </span>
                  </div>
                  <p style={st.sideMeta}>
                    {p.likes ?? 0} beğeni · {p.views ?? 0} görüntülenme
                  </p>
                  <div style={st.sideActions}>
                    <button
                      type="button"
                      style={st.sideBtn}
                      onClick={() => loadPublished(p)}
                    >
                      Düzenle
                    </button>
                    <button
                      type="button"
                      style={st.sideBtn}
                      onClick={() => sharePublished(p)}
                    >
                      Paylaş
                    </button>
                  </div>
                </div>
              ))
            )}
          </aside>
        </div>
      </div>

      {toast && (
        <div className="inspire-toast" style={st.toast}>
          <Check size={16} strokeWidth={2.5} aria-hidden style={{ flexShrink: 0 }} />
          {toast}
        </div>
      )}
    </div>
  );
}

const st = {
  shell: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
    background: '#FAFAF8',
  },
  mainWrap: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  topHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    padding: '40px 40px 0',
    flexShrink: 0,
  },
  h1: {
    margin: 0,
  },
  sub: {
    margin: '8px 0 0',
    fontSize: 14,
    color: 'var(--ta-ink-muted)',
    fontFamily: 'var(--font-sans)',
  },
  draftsPill: {
    padding: '8px 16px',
    borderRadius: 999,
    border: '1px solid rgba(0,0,0,.15)',
    background: '#FFFFFF',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--ta-ink)',
    cursor: 'default',
    fontFamily: 'var(--font-sans)',
  },
  columns: {
    display: 'flex',
    gap: 32,
    padding: 40,
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  colLeft: {
    flex: 1,
    minWidth: 0,
    overflowY: 'auto',
    paddingRight: 8,
  },
  colRight: {
    width: 320,
    flexShrink: 0,
    overflowY: 'auto',
    borderLeft: '1px solid rgba(0,0,0,.06)',
    paddingLeft: 24,
    boxSizing: 'border-box',
  },
  blockTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--ta-ink)',
    margin: '0 0 20px',
    fontFamily: 'var(--font-sans)',
  },
  grid2x2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 14,
    marginBottom: 28,
  },
  typeCard: {
    textAlign: 'left',
    border: '1px solid rgba(0,0,0,.08)',
    borderRadius: 14,
    padding: 20,
    cursor: 'pointer',
    background: '#FFFFFF',
    transition: 'border-color .15s, background .15s',
    fontFamily: 'var(--font-sans)',
  },
  typeCardSelected: {
    border: '2px solid #B8934A',
    padding: 19,
  },
  typeCardTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--ta-ink)',
    marginTop: 10,
  },
  typeCardDesc: {
    fontSize: 12,
    color: 'var(--ta-ink-muted)',
    marginTop: 6,
    lineHeight: 1.45,
  },
  btnStart: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--ta-ink)',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 999,
    padding: '12px 28px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
  btnStartDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  createBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  linkBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--ta-ink)',
    fontFamily: 'var(--font-sans)',
  },
  createTypeLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--ta-ink)',
    fontFamily: 'var(--font-sans)',
  },
  btnPublishTop: {
    padding: '10px 20px',
    borderRadius: 999,
    border: '1px solid rgba(184,147,74,.4)',
    background: 'linear-gradient(180deg,#5f7a94,#3d5266)',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
  sectionLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '.1em',
    textTransform: 'uppercase',
    color: 'var(--ta-ink-subtle)',
    margin: '24px 0 12px',
    fontFamily: 'var(--font-sans)',
  },
  sectionRule: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '.1em',
    textTransform: 'uppercase',
    color: 'var(--ta-ink-subtle)',
    margin: '24px 0 12px',
    fontFamily: 'var(--font-sans)',
  },
  coverZone: {
    width: '100%',
    minHeight: 240,
    border: '2px dashed rgba(0,0,0,.12)',
    borderRadius: 16,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    cursor: 'pointer',
    background: '#FFFFFF',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: 'var(--font-sans)',
  },
  coverPreview: {
    width: '100%',
    height: 240,
    objectFit: 'cover',
    display: 'block',
  },
  coverText: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--ta-ink)',
  },
  unsplashLink: {
    border: 'none',
    background: 'none',
    fontSize: 13,
    color: '#B8934A',
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'underline',
    fontFamily: 'var(--font-sans)',
  },
  linkSmall: {
    marginTop: 8,
    border: 'none',
    background: 'none',
    fontSize: 12,
    color: '#B8934A',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
  titleInput: {
    width: '100%',
    boxSizing: 'border-box',
    fontSize: 24,
    fontWeight: 600,
    border: 'none',
    borderBottom: '1px solid rgba(0,0,0,.12)',
    padding: '12px 0',
    outline: 'none',
    background: 'transparent',
    fontFamily: 'var(--font-sans)',
    color: 'var(--ta-ink)',
  },
  locBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    border: '1px solid rgba(0,0,0,.08)',
    borderRadius: 10,
    padding: '10px 14px',
    background: '#FFFFFF',
  },
  locInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: 15,
    fontFamily: 'var(--font-sans)',
    color: 'var(--ta-ink)',
  },
  placeItem: {
    border: '1px solid rgba(0,0,0,.08)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    background: '#FFFFFF',
  },
  placeHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  placeNum: {
    fontSize: 12,
    fontWeight: 800,
    color: '#B8934A',
    fontFamily: 'var(--font-sans)',
  },
  iconGhost: {
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    padding: 4,
  },
  placeNameInp: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid rgba(0,0,0,.08)',
    marginBottom: 8,
    fontSize: 14,
    fontFamily: 'var(--font-sans)',
  },
  placeNote: {
    width: '100%',
    boxSizing: 'border-box',
    padding: 8,
    borderRadius: 8,
    border: '1px solid rgba(0,0,0,.06)',
    fontSize: 13,
    resize: 'vertical',
    fontFamily: 'var(--font-sans)',
  },
  btnAddPlace: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 16px',
    borderRadius: 10,
    border: '1px solid #B8934A',
    background: 'transparent',
    color: '#B8934A',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    marginBottom: 8,
    fontFamily: 'var(--font-sans)',
  },
  descTa: {
    width: '100%',
    boxSizing: 'border-box',
    minHeight: 120,
    padding: 12,
    borderRadius: 10,
    border: '1px solid rgba(0,0,0,.08)',
    fontSize: 14,
    lineHeight: 1.5,
    resize: 'vertical',
    fontFamily: 'var(--font-sans)',
  },
  bottomBar: {
    display: 'flex',
    gap: 12,
    marginTop: 28,
    marginBottom: 40,
    flexWrap: 'wrap',
  },
  btnDraft: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 22px',
    borderRadius: 999,
    border: '1px solid rgba(0,0,0,.15)',
    background: '#FFFFFF',
    color: 'var(--ta-ink-muted)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
  btnPublish: {
    padding: '12px 28px',
    borderRadius: 999,
    border: 'none',
    background: '#B8934A',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
  sideHead: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  sideSectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '.1em',
    textTransform: 'uppercase',
    color: 'var(--ta-ink-subtle)',
    fontFamily: 'var(--font-sans)',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 22,
    height: 22,
    padding: '0 6px',
    borderRadius: 999,
    background: 'rgba(0,0,0,.06)',
    fontSize: 11,
    fontWeight: 800,
    color: 'var(--ta-ink)',
    verticalAlign: 'middle',
    fontFamily: 'var(--font-sans)',
  },
  empty: {
    fontSize: 12,
    color: 'var(--ta-ink-subtle)',
    margin: '12px 0 8px',
    fontFamily: 'var(--font-sans)',
  },
  sideCard: {
    padding: '12px 0',
    borderBottom: '1px solid rgba(0,0,0,.06)',
  },
  sideRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
  },
  sideTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--ta-ink)',
    lineHeight: 1.35,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    fontFamily: 'var(--font-sans)',
  },
  sideMeta: {
    fontSize: 12,
    color: 'var(--ta-ink-muted)',
    margin: '6px 0 0 24px',
    fontFamily: 'var(--font-sans)',
  },
  sideActions: {
    display: 'flex',
    gap: 8,
    marginTop: 10,
    marginLeft: 24,
    flexWrap: 'wrap',
  },
  sideBtn: {
    border: 'none',
    background: 'none',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--ta-ink)',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontFamily: 'var(--font-sans)',
    padding: 0,
  },
  toast: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    zIndex: 2000,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'var(--ta-ink)',
    color: '#FFFFFF',
    borderRadius: 12,
    padding: '12px 20px',
    fontSize: 14,
    fontWeight: 600,
    fontFamily: 'var(--font-sans)',
    boxShadow: '0 8px 28px rgba(0,0,0,.18)',
  },
};
