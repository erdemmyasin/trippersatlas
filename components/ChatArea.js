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
  content: 'Merhaba! Ben TripperAtlas, seyahat concierge\'iniz. Nereye, ne zaman ve nasıl bir seyahat planladığınızı anlatın.',
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

export default function ChatArea({ onListingSelect, selectedListings = {} }) {
  const [messages, setMessages] = useState([WELCOME]);
  const [typing, setTyping]     = useState(false);
  const [planContext]           = useState({});
  const bottomRef               = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      <div style={s.feed}>
        {messages.map((msg, i) => (
          <MessageBubble
            key={i}
            msg={msg}
            onListingSelect={onListingSelect}
            selectedListings={selectedListings}
          />
        ))}
        {typing && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {quickReplies.length > 0 && (
        <div style={s.quickWrap}>
          <QuickReplies replies={quickReplies} onSelect={handleSend} />
        </div>
      )}

      <ChatInput onSend={handleSend} disabled={typing} />
    </div>
  );
}

function MessageBubble({ msg, onListingSelect, selectedListings }) {
  const isUser   = msg.role === 'user';
  const listings = msg.listings      ?? [];
  const insights = msg.localInsights ?? [];

  return (
    <div style={s.msgGroup}>
      {/* Baloncuk */}
      <div style={{ ...s.row, justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
        {!isUser && <div style={s.avatarAI}>A</div>}

        <div style={{
          ...s.bubble,
          background:   isUser ? 'var(--gold)'    : 'var(--surface)',
          color:        isUser ? '#fff'            : 'var(--text1)',
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          border:       isUser ? 'none'            : '1px solid var(--border)',
          marginLeft:   isUser ? '40px'            : '0',
          marginRight:  isUser ? '0'               : '40px',
        }}>
          {msg.content}
        </div>

        {isUser && <div style={s.avatarUser}>S</div>}
      </div>

      {/* Hotel kartları — 3'lü yatay grid */}
      {!isUser && listings.length > 0 && (
        <div style={s.cardsOuter}>
          <div style={{
            ...s.cardsGrid,
            flexWrap: listings.length === 1 ? 'wrap' : 'nowrap',
          }}>
            {listings.map((listing, idx) => (
              <ListingCard
                key={idx}
                listing={listing}
                index={idx}
                compact={false}
                onPlanSelect={onListingSelect}
                isSelected={!!selectedListings[listing.name]}
              />
            ))}
          </div>
        </div>
      )}

      {/* Yerel içgörü kartları */}
      {!isUser && insights.length > 0 && (
        <div style={s.insightsOuter}>
          <div style={s.insightsRow}>
            {insights.map((insight, idx) => (
              <InsightCard key={idx} insight={insight} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  shell: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--surface2)',
    overflow: 'hidden',
    minWidth: 0,
  },
  feed: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 16px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  msgGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  row: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
  },
  bubble: {
    maxWidth: '75%',
    padding: '11px 15px',
    fontFamily: 'var(--font-sans)',
    fontSize: '14px',
    lineHeight: '1.55',
    boxShadow: 'var(--shadow-sm)',
    wordBreak: 'break-word',
  },
  cardsOuter: {
    paddingLeft: '36px',
    overflowX: 'auto',
    scrollbarWidth: 'none',
  },
  cardsGrid: {
    display: 'flex',
    gap: '10px',
    paddingBottom: '4px',
    width: 'fit-content',
    maxWidth: '100%',
  },
  insightsOuter: { paddingLeft: '36px' },
  insightsRow: { display: 'flex', gap: '10px' },
  avatarAI: {
    width: '28px', height: '28px', borderRadius: '50%',
    background: 'var(--gold-soft)', border: '1.5px solid var(--gold)',
    color: 'var(--gold)', fontSize: '11px', fontWeight: 700,
    fontFamily: 'var(--font-serif)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarUser: {
    width: '28px', height: '28px', borderRadius: '50%',
    background: 'var(--surface)', border: '1.5px solid var(--border)',
    color: 'var(--text2)', fontSize: '11px', fontWeight: 600,
    fontFamily: 'var(--font-sans)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  quickWrap: { padding: '0 16px' },
};
