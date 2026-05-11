'use client';

import { useEffect, useState } from 'react';
import { X, Globe } from 'lucide-react';
import { createCollection, COLLECTION_NAME_MAX } from '@/lib/savedCollections';

/**
 * Resim 1 — Yeni koleksiyon oluşturma modal'ı.
 * Name input (50 char limit), Public/Private toggle, Create butonu.
 *
 * @param {boolean} open
 * @param {() => void} onClose
 * @param {(c: Collection) => void} onCreated  Yeni oluşturulan koleksiyon ile geri dönüş.
 */
export default function CreateCollectionModal({ open, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    if (!open) {
      setName('');
      setIsPrivate(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const trimmed = name.trim();
  const canCreate = trimmed.length > 0 && trimmed.length <= COLLECTION_NAME_MAX;

  function handleCreate() {
    if (!canCreate) return;
    const c = createCollection({ name: trimmed, isPublic: !isPrivate });
    if (c) onCreated?.(c);
    onClose?.();
  }

  return (
    <div
      style={s.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-coll-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div style={s.card} onClick={(e) => e.stopPropagation()}>
        <button type="button" style={s.closeBtn} onClick={onClose} aria-label="Kapat">
          <X size={18} strokeWidth={2} color="var(--ta-ink)" />
        </button>
        <h2 id="create-coll-title" style={s.title}>Koleksiyon oluştur</h2>
        <hr style={s.divider} />

        <label style={s.label}>İsim</label>
        <input
          type="text"
          value={name}
          maxLength={COLLECTION_NAME_MAX}
          onChange={(e) => setName(e.target.value)}
          placeholder="Yeni koleksiyonum"
          style={s.input}
          autoFocus
        />
        <div style={s.counter}>{name.length}/{COLLECTION_NAME_MAX} karakter</div>

        <hr style={s.divider} />

        <div style={s.privacyRow}>
          <Globe size={18} strokeWidth={2} color="var(--ta-ink-muted)" aria-hidden />
          <div style={s.privacyText}>
            <div style={s.privacyTitle}>{isPrivate ? 'Özel koleksiyon' : 'Açık koleksiyon'}</div>
            <div style={s.privacyDesc}>
              {isPrivate
                ? 'Sadece sen görebilirsin.'
                : 'Bu koleksiyon ve notları herkes tarafından görülebilir.'}
            </div>
          </div>
        </div>

        <button
          type="button"
          style={s.toggleRow}
          onClick={() => setIsPrivate((v) => !v)}
          aria-pressed={isPrivate}
        >
          <span style={{ ...s.toggleSwitch, ...(isPrivate ? s.toggleSwitchOn : {}) }}>
            <span style={{ ...s.toggleKnob, ...(isPrivate ? s.toggleKnobOn : {}) }} />
          </span>
          <span style={s.toggleLabel}>Özel yap</span>
        </button>

        <div style={s.footer}>
          <button
            type="button"
            style={{ ...s.createBtn, ...(canCreate ? {} : s.createBtnDisabled) }}
            disabled={!canCreate}
            onClick={handleCreate}
          >
            Oluştur
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,23,32,.45)',
    zIndex: 'var(--z-modal)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-4)',
    boxSizing: 'border-box',
  },
  card: {
    position: 'relative',
    width: 'min(560px, 100%)',
    maxHeight: 'min(92vh, 720px)',
    overflow: 'auto',
    background: '#fff',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-6)',
    boxShadow: '0 24px 80px rgba(0,0,0,.22)',
    fontFamily: 'var(--font-sans)',
    boxSizing: 'border-box',
  },
  closeBtn: {
    position: 'absolute',
    top: 'var(--space-4)',
    left: 'var(--space-4)',
    width: 36,
    height: 36,
    borderRadius: '50%',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(0,0,0,.10)',
    background: 'rgba(0,0,0,.04)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    margin: '0 0 var(--space-4)',
    paddingLeft: 56,
    paddingRight: 'var(--space-6)',
    fontSize: 'var(--text-xl)',
    fontWeight: 'var(--fw-bold)',
    color: 'var(--ta-ink)',
    textAlign: 'center',
    letterSpacing: '-0.01em',
  },
  divider: {
    border: 'none',
    borderTopWidth: 'var(--border-thin)',
    borderTopStyle: 'solid',
    borderTopColor: 'rgba(0,0,0,.08)',
    margin: 'var(--space-3) 0',
  },
  label: {
    display: 'block',
    marginBottom: 'var(--space-2)',
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--fw-bold)',
    color: 'var(--ta-ink)',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: 'var(--space-3) var(--space-4)',
    borderRadius: 'var(--radius-pill)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(0,0,0,.18)',
    background: '#fff',
    fontSize: 'var(--text-md)',
    fontFamily: 'var(--font-sans)',
    color: 'var(--ta-ink)',
    outline: 'none',
  },
  counter: {
    marginTop: 'var(--space-1)',
    textAlign: 'right',
    fontSize: 'var(--text-sm)',
    color: 'var(--ta-ink-subtle)',
  },
  privacyRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 'var(--space-3)',
    marginBottom: 'var(--space-3)',
  },
  privacyText: { flex: 1, minWidth: 0 },
  privacyTitle: {
    fontSize: 'var(--text-md)',
    fontWeight: 'var(--fw-semibold)',
    color: 'var(--ta-ink)',
  },
  privacyDesc: {
    marginTop: 'var(--space-px)',
    fontSize: 'var(--text-sm)',
    color: 'var(--ta-ink-muted)',
    lineHeight: 1.5,
  },
  toggleRow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    border: 'none',
    background: 'transparent',
    padding: 0,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
  toggleSwitch: {
    position: 'relative',
    width: 38,
    height: 22,
    borderRadius: 'var(--radius-pill)',
    background: 'rgba(0,0,0,.18)',
    transition: 'background var(--duration-fast) var(--ease-out)',
    flexShrink: 0,
  },
  toggleSwitchOn: {
    background: 'var(--ta-ink)',
  },
  toggleKnob: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 18,
    height: 18,
    borderRadius: '50%',
    background: '#fff',
    boxShadow: '0 1px 3px rgba(0,0,0,.2)',
    transition: 'transform var(--duration-fast) var(--ease-out)',
  },
  toggleKnobOn: {
    transform: 'translateX(16px)',
  },
  toggleLabel: {
    fontSize: 'var(--text-md)',
    fontWeight: 'var(--fw-medium)',
    color: 'var(--ta-ink)',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 'var(--space-6)',
  },
  createBtn: {
    padding: 'var(--space-3) var(--space-7)',
    borderRadius: 'var(--radius-pill)',
    border: 'none',
    background: 'var(--ta-ink)',
    color: '#fff',
    fontSize: 'var(--text-md)',
    fontWeight: 'var(--fw-bold)',
    fontFamily: 'var(--font-sans)',
    cursor: 'pointer',
    transition: 'opacity var(--duration-fast) var(--ease-out)',
  },
  createBtnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
};
