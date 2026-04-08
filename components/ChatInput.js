'use client';

import { useState } from 'react';

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState('');

  function handleSend() {
    const text = value.trim();
    if (!text || disabled) return;
    onSend?.(text);
    setValue('');
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div style={s.inputWrap}>
      <div style={s.inputShell}>
        {/* Mikrofon ikonu */}
        <button style={s.iconBtn} tabIndex={-1} type="button" aria-label="Ses">
          🎙
        </button>

        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Seyahatinizi anlatın..."
          disabled={disabled}
          rows={1}
          style={{ ...s.input, opacity: disabled ? 0.5 : 1 }}
        />

        <button
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          style={{
            ...s.sendBtn,
            opacity: !value.trim() || disabled ? 0.45 : 1,
            cursor: !value.trim() || disabled ? 'default' : 'pointer',
          }}
        >
          Gönder
        </button>
      </div>

      <p style={s.hint}>
        Doğal dille yazabilirsin. Sadece otel, sadece transfer veya tam paket planlama da mümkün.
      </p>
    </div>
  );
}

const s = {
  inputWrap: {
    background: 'rgba(255,255,255,.78)',
    border: '1px solid rgba(255,255,255,.55)',
    borderRadius: '28px',
    boxShadow: '0 18px 40px rgba(35,28,18,0.08)',
    padding: '12px',
    flexShrink: 0,
  },
  inputShell: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minHeight: '54px',
    border: '1px solid rgba(0,0,0,.06)',
    borderRadius: '22px',
    background: 'white',
    padding: '10px 12px',
  },
  iconBtn: {
    width: '42px',
    height: '42px',
    borderRadius: '14px',
    border: '1px solid var(--line)',
    background: 'rgba(20,20,20,.03)',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#4f473d',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    border: 'none',
    outline: 'none',
    resize: 'none',
    background: 'transparent',
    fontFamily: 'var(--font-sans)',
    fontSize: '15px',
    color: 'var(--text1)',
    lineHeight: '1.5',
    maxHeight: '120px',
    overflow: 'auto',
  },
  sendBtn: {
    height: '42px',
    borderRadius: '12px',
    background: 'linear-gradient(180deg,#d3ab5f,#c08d36)',
    color: 'white',
    border: '1px solid rgba(167,125,50,.28)',
    boxShadow: '0 8px 16px rgba(199,154,70,.24)',
    padding: '0 18px',
    fontWeight: 700,
    fontSize: '14px',
    fontFamily: 'var(--font-sans)',
    flexShrink: 0,
    transition: 'opacity 0.15s',
    whiteSpace: 'nowrap',
  },
  hint: {
    padding: '8px 6px 2px 6px',
    color: 'var(--muted)',
    fontFamily: 'var(--font-sans)',
    fontSize: '12px',
    lineHeight: 1.4,
  },
};
