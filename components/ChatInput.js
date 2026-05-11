'use client';

import { useState } from 'react';
import { Mic, Send } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { ta } from '@/lib/brandStyles';

export default function ChatInput({
  onSend,
  disabled,
  submitLabel = 'Gönder',
  /** Sohbet çubuğu: metin yerine yalnızca gönder ikonu */
  submitIconOnly = false,
  /** Alt ipucu satırını gizle (gezi hub tek satır) */
  showHint = true,
  placeholder = 'Seyahatinizi anlatın...',
  /**
   * card — bağımsız yüzen composer (ör. gezi hub)
   * dock — ta-panel içi, ince çerçeve (ana sohbet)
   */
  variant = 'card',
}) {
  const [value, setValue] = useState('');
  const [fieldFocus, setFieldFocus] = useState(false);
  const docked = variant === 'dock';

  function handleSend() {
    const text = value.trim();
    if (!text || disabled) return;
    onSend?.(text);
    trackEvent('chat.send', { length: text.length });
    setValue('');
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const wrap = docked ? s.inputWrapDock : s.inputWrap;
  const shell = {
    ...s.inputShell,
    ...(fieldFocus && !disabled ? s.inputShellFocus : {}),
    ...(docked ? s.inputShellDock : {}),
  };

  return (
    <div style={wrap}>
      <div style={shell}>
        <button
          style={{ ...s.iconBtn, ...(docked ? s.iconBtnDock : {}) }}
          tabIndex={-1}
          type="button"
          aria-label="Ses"
        >
          <Mic size={18} strokeWidth={2} color={ta.inkMuted} aria-hidden />
        </button>

        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => setFieldFocus(true)}
          onBlur={() => setFieldFocus(false)}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          style={{ ...s.input, opacity: disabled ? 0.5 : 1 }}
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          aria-label={submitIconOnly ? 'Gönder' : submitLabel}
          title={submitIconOnly ? 'Gönder' : submitLabel}
          style={{
            ...s.sendBtn,
            ...(submitIconOnly ? s.sendBtnIcon : {}),
            opacity: !value.trim() || disabled ? 0.45 : 1,
            cursor: !value.trim() || disabled ? 'not-allowed' : 'pointer',
          }}
        >
          {submitIconOnly ? (
            <Send size={18} strokeWidth={2.2} color="currentColor" aria-hidden />
          ) : (
            submitLabel
          )}
        </button>
      </div>

      {showHint ? (
        <p style={{ ...s.hint, ...(docked ? s.hintDock : {}) }}>
          Doğal dille yazabilirsin. Sadece otel, sadece transfer veya tam paket planlama da mümkün.
        </p>
      ) : null}
    </div>
  );
}

const s = {
  inputWrap: {
    background: 'rgba(255,255,255,.78)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(255,255,255,.55)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: '0 18px 40px rgba(35,28,18,0.08)',
    padding: 'var(--space-3)',
    flexShrink: 0,
  },
  inputWrapDock: {
    background: 'transparent',
    border: 'none',
    borderRadius: 0,
    boxShadow: 'none',
    padding: 0,
    flexShrink: 0,
  },
  inputShell: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 'var(--space-3)',
    minHeight: '52px',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: ta.border,
    borderRadius: 'var(--radius-lg)',
    background: 'var(--ta-elevated)',
    padding: 'var(--space-2) var(--space-3)',
    transition: 'border-color var(--duration-base) var(--ease-out), box-shadow var(--duration-base) var(--ease-out)',
  },
  inputShellDock: {
    background: 'color-mix(in srgb, var(--ta-elevated) 94%, var(--ta-muted-bg))',
  },
  inputShellFocus: {
    borderColor: 'color-mix(in srgb, var(--ta-accent) 42%, var(--ta-border))',
    boxShadow: `0 0 0 3px ${ta.accentSoft}`,
  },
  iconBtn: {
    width: 'var(--space-8)',
    height: 'var(--space-8)',
    borderRadius: 'var(--radius-sm)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: ta.border,
    background: ta.mutedBg,
    fontSize: 'var(--text-xl)',
    cursor: 'pointer',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnDock: {
    marginBottom: '1px',
  },
  input: {
    flex: 1,
    border: 'none',
    outline: 'none',
    resize: 'none',
    background: 'transparent',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-lg)',
    lineHeight: 'var(--text-lg-lh)',
    color: ta.ink,
    maxHeight: '132px',
    overflow: 'auto',
    padding: 'var(--space-1) var(--space-1)',
    minHeight: 'var(--space-6)',
  },
  sendBtn: {
    height: 'var(--space-8)',
    borderRadius: 'var(--radius-sm)',
    background: `linear-gradient(180deg, ${ta.accentBright}, ${ta.accentDeep})`,
    color: 'white',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: ta.border,
    boxShadow: '0 6px 14px color-mix(in srgb, var(--ta-accent) 32%, transparent)',
    padding: '0 var(--space-4)',
    fontWeight: 'var(--fw-bold)',
    fontSize: 'var(--text-base)',
    fontFamily: 'var(--font-sans)',
    flexShrink: 0,
    transition: 'opacity var(--duration-fast) var(--ease-out), transform var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out)',
    whiteSpace: 'nowrap',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnIcon: {
    width: 'var(--space-8)',
    padding: 0,
    minWidth: 'var(--space-8)',
  },
  hint: {
    padding: 'var(--space-2) var(--space-2) var(--space-px) var(--space-2)',
    color: ta.inkMuted,
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-xs)',
    lineHeight: 'var(--text-xs-lh)',
  },
  hintDock: {
    padding: 'var(--space-2) var(--space-px) 0 var(--space-px)',
    textAlign: 'center',
  },
};
