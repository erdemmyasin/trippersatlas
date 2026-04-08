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
      {/* Chat panel */}
      <div className="ta-panel" style={s.chatPanel}>
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

          {/* Quick replies — mesajların içinde, en altta */}
          {quickReplies.length > 0 && (
            <QuickReplies replies={quickReplies} onSelect={handleSend} />
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input — panel dışında */}
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
      <div style={{
        ...s.row,
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        flexDirection: isUser ? 'row-reverse' : 'row',
      }}>
        <div style={{ ...(isUser ? s.avatarUser : s.avatarAI) }}>
          {isUser ? 'S' : 'A'}
        </div>

        <div style={{
          ...s.bubble,
          ...(isUser ? s.bubbleUser : s.bubbleAI),
        }}>
          {msg.content}
        </div>
      </div>

      {/* Hotel kartları */}
      {!isUser && listings.length > 0 && (
        <div style={s.cardsRow}>
          {listings.map((listing, idx) => (
            <ListingCard
              key={idx}
              listing={listing}
              index={idx}
              onPlanSelect={onListingSelect}
              isSelected={!!selectedListings[listing.name]}
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
  row: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
    maxWidth: '92%',
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
    width: '36px',
    height: '36px',
    borderRadius: '12px',
    flexShrink: 0,
    display: 'grid',
    placeItems: 'center',
    fontSize: '13px',
    fontWeight: 800,
    border: '1px solid rgba(0,0,0,.06)',
    background: 'linear-gradient(135deg,#f0d3a1,#c79a46)',
    color: 'white',
    fontFamily: 'var(--font-sans)',
  },

  /* Bubble styles */
  bubble: {
    borderRadius: '22px',
    padding: '14px 16px',
    lineHeight: 1.7,
    border: '1px solid rgba(0,0,0,.05)',
    boxShadow: '0 12px 24px rgba(0,0,0,.04)',
    fontFamily: 'var(--font-sans)',
    fontSize: '14px',
    wordBreak: 'break-word',
  },
  bubbleAI: {
    background: 'rgba(255,255,255,.92)',
    color: 'var(--text1)',
  },
  bubbleUser: {
    background: 'linear-gradient(180deg,#f1d59c,#e4c17b)',
    color: '#3b301f',
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
