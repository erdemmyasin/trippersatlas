'use client';

import { useState, useRef, useEffect } from 'react';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import QuickReplies from './QuickReplies';
import ListingCard from './ListingCard';
import InsightCard from './InsightCard';
import { callClaude } from '@/services/claude';

const HISTORY_WINDOW = 10;

function buildWelcome(planContext = {}, hasHistory = false) {
  const dest = planContext.destination?.trim();

  if (hasHistory) {
    if (dest) {
      return {
        role: 'assistant', _uiOnly: true,
        content: `${dest} planınıza hoş geldiniz. Kaldığınız yerden devam edelim mi?`,
        listings: [], quickReplies: ['Devam et', 'Otel önerileri', 'Aktiviteler', 'Yeni plan başlat'],
        proactive: [], localInsights: [],
      };
    }
    return {
      role: 'assistant', _uiOnly: true,
      content: 'Seyahat planınıza devam ediyoruz. Ne eklemek istersiniz?',
      listings: [], quickReplies: ['Otel ara', 'Aktivite öner', 'Transfer', 'Yeni seyahat'],
      proactive: [], localInsights: [],
    };
  }

  return {
    role: 'assistant', _uiOnly: true,
    content: 'Hayalinizdeki Türkiye tatilini birlikte tasarlayalım. Hangi şehir ya da bölge aklınızda?',
    listings: [], quickReplies: ['İstanbul', 'Kapadokya', 'Ege kıyıları', 'Sürpriz yap'],
    proactive: [], localInsights: [],
  };
}

function buildMessage(role, content, data = {}) {
  return {
    role, content,
    listings:      data.listings      ?? [],
    quickReplies:  data.quickReplies  ?? [],
    proactive:     data.proactive     ?? [],
    localInsights: data.localInsights ?? [],
  };
}

export default function ChatArea({
  onListingSelect, onListingDeselect,
  selectedListings = {}, planContext = {},
  chatId, initialMessages, onMessagesChange, onAssistantResponse,
}) {
  const hasHistory = Boolean(initialMessages?.length > 1);

  const [messages, setMessages] = useState(() =>
    initialMessages?.length ? initialMessages : [buildWelcome(planContext, false)]
  );
  const [typing, setTyping] = useState(false);
  const feedRef    = useRef(null);
  const prevChatId = useRef(chatId);

  useEffect(() => {
    if (chatId !== prevChatId.current) {
      prevChatId.current = chatId;
      setMessages(initialMessages?.length ? initialMessages : [buildWelcome(planContext, false)]);
    }
  }, [chatId, initialMessages, planContext]);

  const onChangeRef = useRef(onMessagesChange);
  onChangeRef.current = onMessagesChange;
  const prevMsgLen = useRef(messages.length);
  useEffect(() => {
    if (messages.length !== prevMsgLen.current) {
      prevMsgLen.current = messages.length;
      onChangeRef.current?.(messages);
    }
  }, [messages]);

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;
    requestAnimationFrame(() => { feed.scrollTop = feed.scrollHeight; });
  }, [messages, typing]);

  async function handleSend(text) {
    const userMsg = buildMessage('user', text);
    const updated = [...messages, userMsg];
    setMessages(updated);
    setTyping(true);

    try {
      const apiMessages = updated
        .filter(m => !m._uiOnly && (m.role === 'user' || m.role === 'assistant'))
        .slice(-HISTORY_WINDOW)
        .map(m => ({ role: m.role, content: m.content }));

      const data = await callClaude(apiMessages, planContext);
      onAssistantResponse?.(data);
      setMessages(prev => [...prev, buildMessage('assistant', data.message ?? '', data)]);
    } catch {
      setMessages(prev => [
        ...prev,
        buildMessage('assistant', 'Bir sorun oluştu, lütfen tekrar deneyin.', {
          quickReplies: ['Tekrar dene'],
        }),
      ]);
    } finally {
      setTyping(false);
    }
  }

  const lastMsg      = messages[messages.length - 1];
  const quickReplies = !typing && lastMsg?.role === 'assistant'
    ? (lastMsg.quickReplies ?? []) : [];

  return (
    <div style={s.shell}>
      {/* ── Scrollable feed ── */}
      <div ref={feedRef} style={s.feed}>
        {messages.map((msg, i) => (
          <MessageBubble
            key={i} msg={msg}
            onListingSelect={onListingSelect}
            onListingDeselect={onListingDeselect}
            selectedListings={selectedListings}
          />
        ))}
        {typing && <TypingIndicator />}
        {quickReplies.length > 0 && (
          <QuickReplies replies={quickReplies} onSelect={handleSend} />
        )}
        {/* Scroll anchor */}
        <div style={{ height: 8 }} />
      </div>

      {/* ── Fixed bottom input ── */}
      <ChatInput onSend={handleSend} disabled={typing} />
    </div>
  );
}

function MessageBubble({ msg, onListingSelect, onListingDeselect, selectedListings }) {
  const isUser   = msg.role === 'user';
  const listings = msg.listings      ?? [];
  const insights = msg.localInsights ?? [];

  return (
    <div style={s.msgGroup}>
      {isUser ? (
        <div style={s.rowUser}>
          <div style={{ ...s.bubble, ...s.bubbleUser }}>{msg.content}</div>
          <div style={s.avatarUser}>S</div>
        </div>
      ) : (
        <div style={s.rowAI}>
          <div style={s.avatarAI}>A</div>
          <div style={{ ...s.bubble, ...s.bubbleAI }}>{msg.content}</div>
        </div>
      )}

      {!isUser && listings.length > 0 && (
        <div style={s.cardsRow}>
          {listings.map((listing, idx) => (
            <ListingCard
              key={idx} listing={listing} index={idx}
              onPlanSelect={onListingSelect} onPlanRemove={onListingDeselect}
              isSelected={listing.name in selectedListings}
            />
          ))}
        </div>
      )}

      {!isUser && insights.length > 0 && (
        <div style={s.insightsGrid}>
          {insights.map((insight, idx) => (
            <InsightCard key={idx} insight={insight} />
          ))}
        </div>
      )}
    </div>
  );
}

const s = {
  /* Outer shell: flex column, fills the center column entirely */
  shell: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    height: '100%',
    overflow: 'hidden',
    background: 'transparent',
  },

  /* Scrollable message area — grows to fill available space */
  feed: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '24px 20px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(0,0,0,.10) transparent',
  },

  msgGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },

  rowAI: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
    maxWidth: '86%',
    alignSelf: 'flex-start',
  },
  rowUser: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-end',
    maxWidth: '70%',
    alignSelf: 'flex-end',
    marginLeft: 'auto',
  },

  avatarAI: {
    width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
    display: 'grid', placeItems: 'center',
    fontSize: '13px', fontWeight: 800, letterSpacing: '-0.02em',
    background: 'linear-gradient(135deg,#1b1714,#4a3824 55%,#c79a46)',
    color: 'white', fontFamily: 'var(--font-sans)',
    boxShadow: '0 2px 8px rgba(0,0,0,.18)',
  },
  avatarUser: {
    width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0,
    display: 'grid', placeItems: 'center',
    fontSize: '11px', fontWeight: 800,
    background: 'linear-gradient(135deg,#f0d3a1,#c79a46)',
    color: 'white', fontFamily: 'var(--font-sans)',
    boxShadow: '0 2px 6px rgba(199,154,70,.25)',
  },

  bubble: {
    borderRadius: '18px',
    padding: '12px 16px',
    lineHeight: 1.65,
    fontFamily: 'var(--font-sans)',
    fontSize: '14px',
    wordBreak: 'break-word',
    minWidth: 0,
  },
  bubbleAI: {
    background: 'rgba(255,255,255,.94)',
    color: 'var(--text1)',
    borderRadius: '4px 18px 18px 18px',
    border: '1px solid rgba(0,0,0,.06)',
    boxShadow: '0 2px 12px rgba(0,0,0,.05)',
  },
  bubbleUser: {
    background: 'linear-gradient(160deg,#f1d59c,#e2b96a)',
    color: '#3b2a10',
    borderRadius: '18px 4px 18px 18px',
    border: '1px solid rgba(199,154,70,.22)',
    boxShadow: '0 4px 14px rgba(199,154,70,.18)',
  },

  cardsRow: {
    display: 'grid',
    gridAutoFlow: 'column',
    gridAutoColumns: '248px',
    gap: '12px',
    overflowX: 'auto',
    paddingLeft: '44px',
    paddingBottom: '4px',
    scrollbarWidth: 'none',
  },
  insightsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
    gap: '10px',
    paddingLeft: '44px',
  },
};
