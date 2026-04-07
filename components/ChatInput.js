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
    <div style={s.wrap}>
      <div style={s.box}>
        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Seyahatinizi anlatın..."
          disabled={disabled}
          rows={1}
          style={{
            ...s.input,
            opacity: disabled ? 0.5 : 1,
          }}
        />
        <button
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          style={{
            ...s.send,
            opacity: !value.trim() || disabled ? 0.4 : 1,
            cursor: !value.trim() || disabled ? 'default' : 'pointer',
          }}
          aria-label="Gönder"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

const s = {
  wrap: {
    padding: '12px 16px 16px',
    background: 'var(--surface2)',
    borderTop: '1px solid var(--border)',
    flexShrink: 0,
  },
  box: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '10px',
    background: 'var(--surface)',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--r-lg)',
    padding: '10px 10px 10px 16px',
    boxShadow: 'var(--shadow-sm)',
    transition: 'border-color 150ms ease',
  },
  input: {
    flex: 1,
    border: 'none',
    outline: 'none',
    resize: 'none',
    background: 'transparent',
    fontFamily: 'var(--font-sans)',
    fontSize: '14px',
    color: 'var(--text1)',
    lineHeight: '1.5',
    maxHeight: '120px',
    overflow: 'auto',
  },
  send: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'var(--gold)',
    border: 'none',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'opacity 150ms ease, transform 100ms ease',
  },
};
