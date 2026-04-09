'use client';

import { useState, useRef, useEffect } from 'react';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import QuickReplies from './QuickReplies';
import ListingCard from './ListingCard';
import InsightCard from './InsightCard';
import { callClaude } from '@/services/claude';

const WELCOME = {
  role: 'assistant',
  content: 'Merhaba! Ben TripperAtlas, seyahat asistanınız. Nereye, ne zaman ve nasıl bir seyahat planladığınızı anlatın.',
  listings: [],
  quickReplies: ['İstanbul tatili', 'Bodrum yaz', 'Kapadokya turu', 'Bütçe belirle'],
  proactive: [],
  localInsights: [],
};

function buildMessage(role, content, data = {}) {
  return {
    role,
    content,
    listings:      data.listings      ?? [],
    quickReplies:  data.quickReplies  ?? [],
    proactive:     data.proactive     ?? [],
    localInsights: data.localInsights ?? [],
  };
}

export default function ChatArea({
  onListingSelect,
  onListingDeselect,
  selectedListings = {},
  chatId,
  initialMessages,
  onMessagesChange,
  onAssistantResponse,
}) {
  const [messages, setMessages] = useState(() =>
    initialMessages?.length ? initialMessages : [WELCOME]
  );
  const [typing, setTyping]     = useState(false);
  const [planContext]           = useState({});
  const feedRef                 = useRef(null);
  const bottomRef               = useRef(null);
  const prevChatId              = useRef(chatId);

  /* Reset messages when chatId changes */
  useEffect(() => {
    if (chatId !== prevChatId.current) {
      prevChatId.current = chatId;
      setMessages(initialMessages?.length ? initialMessages : [WELCOME]);
    }
  }, [chatId, initialMessages]);

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
    requestAnimationFrame(() => {
      feed.scrollTop = feed.scrollHeight;
    });
  }, [messages, typing]);

  async function handleSend(text) {
    const userMsg = buildMessage('user', text);
    const updated = [...messages, userMsg];
    setMessages(updated);
    setTyping(true);

    try {
      const apiMessages = updated
        .filter(m => m.role === 'user' || m.role === 'assistant')
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
    ? (lastMsg.quickReplies ?? [])
    : [];

  return (
    <div style={s.shell}>
      {/* Chat panel */}
      <div className="ta-panel" style={s.chatPanel}>
        <div ref={feedRef} style={s.feed}>
          {messages.map((msg, i) => (
            <MessageBubble
              key={i}
              msg={msg}
              onListingSelect={onListingSelect}
              onListingDeselect={onListingDeselect}
              selectedListings={selectedListings}
            />
          ))}
          {typing && <TypingIndicator />}

          {quickReplies.length > 0 && (
            <QuickReplies replies={quickReplies} onSelect={handleSend} />
          )}

          <div ref={bottomRef} style={{ height: 1 }} />
        </div>
      </div>

      {/* Input — panel dışında */}
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
      {/* Baloncuk */}
      {isUser ? (
        /* Kullanıcı: avatar sağda, balon sola doğru büyüyemez */
        <div style={s.rowUser}>
          <div style={{
            ...s.bubble,
            ...s.bubbleUser,
          }}>
            {msg.content}
          </div>
          <div style={s.avatarUser}>S</div>
        </div>
      ) : (
        /* AI: avatar solda */
        <div style={s.rowAI}>
          <div style={s.avatarAI}>A</div>
          <div style={{
            ...s.bubble,
            ...s.bubbleAI,
          }}>
            {msg.content}
          </div>
        </div>
      )}

      {/* Hotel kartları */}
      {!isUser && listings.length > 0 && (
        <div style={s.cardsRow}>
          {listings.map((listing, idx) => (
            <ListingCard
              key={idx}
              listing={listing}
              index={idx}
              onPlanSelect={onListingSelect}
              onPlanRemove={onListingDeselect}
              isSelected={listing.name in selectedListings}
            />
          ))}
        </div>
      )}

      {/* İçgörüler */}
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
  shell: {
    display: 'grid',
    gridTemplateRows: '1fr auto',
    gap: '14px',
    height: '100%',
    minHeight: 0,
    overflow: 'hidden',
  },

  /* Scrollable chat panel */
  chatPanel: {
    minHeight: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  feed: {
    flex: 1,
    overflowY: 'auto',
    padding: '14px 10px 10px',
    display: 'grid',
    gap: '14px',
    alignContent: 'start',
  },

  msgGroup: {
    display: 'grid',
    gap: '12px',
  },

  /* AI row: avatar-left + bubble */
  rowAI: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
    maxWidth: '88%',
    alignSelf: 'flex-start',
  },
  /* User row: bubble + avatar-right, right-aligned */
  rowUser: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-end',
    maxWidth: '72%',
    alignSelf: 'flex-end',
    marginLeft: 'auto',
  },

  /* Avatar styles */
  avatarAI: {
    width: '36px',
    height: '36px',
    borderRadius: '12px',
    flexShrink: 0,
    display: 'grid',
    placeItems: 'center',
    fontSize: '13px',
    fontWeight: 800,
    border: '1px solid rgba(0,0,0,.06)',
    background: 'linear-gradient(135deg,#1b1714,#4a3824 55%,#c79a46)',
    color: 'white',
    fontFamily: 'var(--font-sans)',
  },
  avatarUser: {
    width: '32px',
    height: '32px',
    borderRadius: '10px',
    flexShrink: 0,
    display: 'grid',
    placeItems: 'center',
    fontSize: '12px',
    fontWeight: 800,
    border: '1px solid rgba(0,0,0,.06)',
    background: 'linear-gradient(135deg,#f0d3a1,#c79a46)',
    color: 'white',
    fontFamily: 'var(--font-sans)',
  },

  /* Bubble styles */
  bubble: {
    borderRadius: '18px',
    padding: '11px 15px',
    lineHeight: 1.65,
    border: '1px solid rgba(0,0,0,.05)',
    boxShadow: '0 6px 18px rgba(0,0,0,.04)',
    fontFamily: 'var(--font-sans)',
    fontSize: '14px',
    wordBreak: 'break-word',
    minWidth: 0,
  },
  bubbleAI: {
    background: 'rgba(255,255,255,.92)',
    color: 'var(--text1)',
    borderRadius: '4px 18px 18px 18px',
  },
  bubbleUser: {
    background: 'linear-gradient(160deg,#f1d59c,#e2b96a)',
    color: '#3b2a10',
    border: '1px solid rgba(199,154,70,.22)',
    borderRadius: '18px 4px 18px 18px',
    boxShadow: '0 6px 18px rgba(199,154,70,.15)',
  },

  /* Hotel cards row */
  cardsRow: {
    display: 'grid',
    gridAutoFlow: 'column',
    gridAutoColumns: '248px',
    gap: '14px',
    overflowX: 'auto',
    paddingLeft: '46px',
    paddingBottom: '4px',
    scrollbarWidth: 'none',
  },

  /* Insights grid */
  insightsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
    gap: '12px',
    paddingLeft: '46px',
  },
};
