'use client';

import {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from 'react';
import { Compass, MoreVertical } from 'lucide-react';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import QuickReplies from './QuickReplies';
import ListingCard from './ListingCard';
import InsightCard from './InsightCard';
import { callClaude } from '@/services/claude';
import { listingMapKey, listingMapDataAttr } from '@/lib/listingMapKey';
import { isTurkeyPrimaryMarket } from '@/lib/taRegion';
import { ta } from '@/lib/brandStyles';

const WELCOME = {
  role: 'assistant',
  content: 'Merhaba! Ben Atlas, seyahat asistanınız. Nereye, ne zaman ve nasıl bir seyahat planladığınızı anlatın.',
  listings: [],
  quickReplies: isTurkeyPrimaryMarket()
    ? ['İstanbul tatili', 'Bodrum yaz', 'Kapadokya turu', 'Bütçe belirle']
    : ['Weekend in Lisbon', 'Tokyo food trip', 'US national parks', 'Set budget'],
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

function ChatOverflowToolbar({ onShare, onCreateTrip, onArchive, onDelete }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(ev) {
      if (!wrapRef.current?.contains(ev.target)) setOpen(false);
    }
    function onKey(ev) {
      if (ev.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const item = (label, onClick, danger = false) => (
    <button
      key={label}
      type="button"
      role="menuitem"
      className="ta-chat-overflow-item"
      style={{
        ...ov.itemBtn,
        ...(danger ? ov.itemDanger : {}),
      }}
      onClick={() => {
        setOpen(false);
        onClick?.();
      }}
    >
      {label}
    </button>
  );

  return (
    <div ref={wrapRef} style={ov.wrap}>
      <button
        type="button"
        style={ov.trigger}
        aria-label="Sohbet seçenekleri"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <MoreVertical size={20} strokeWidth={2.2} color={ta.inkMuted} aria-hidden />
      </button>
      {open ? (
        <div role="menu" style={ov.menu}>
          {item('Sohbeti Paylaş', onShare)}
          {item('Sohbete Plan Oluştur', onCreateTrip)}
          {item('Sohbeti Arşivle', onArchive)}
          {item('Sohbeti Sil', onDelete, true)}
        </div>
      ) : null}
    </div>
  );
}

const ov = {
  wrap: { position: 'relative', flexShrink: 0, zIndex: 4 },
  trigger: {
    display: 'grid',
    placeItems: 'center',
    width: 36,
    height: 36,
    borderRadius: 10,
    border: `1px solid ${ta.border}`,
    background: ta.surface,
    cursor: 'pointer',
    padding: 0,
  },
  menu: {
    position: 'absolute',
    right: 0,
    top: 'calc(100% + 6px)',
    minWidth: 220,
    padding: 6,
    borderRadius: 12,
    border: `1px solid ${ta.border}`,
    background: ta.surface,
    boxShadow: '0 14px 44px rgba(15,23,32,.14)',
    display: 'grid',
    gap: 2,
  },
  itemBtn: {
    textAlign: 'left',
    width: '100%',
    border: 'none',
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 14,
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    color: ta.ink,
    background: 'transparent',
    cursor: 'pointer',
  },
  itemDanger: { color: ta.danger },
};

const ChatArea = forwardRef(function ChatArea(
  {
    onListingSelect,
    onListingDeselect,
    selectedListings = {},
    chatId,
    initialMessages,
    onMessagesChange,
    onAssistantResponse,
    listingHighlightFromMapKey = null,
    onListingHoverKey,
    submitButtonLabel = 'Gönder',
    submitIconOnly = false,
    /** API system prompt + istemci güvenliği (sohbet toplama aşaması) */
    planContextForApi = null,
    /** Boş başlangıç: varsayılan Atlas karşılama mesajını gösterme (gezi → sohbet bootstrap) */
    noWelcomeWhenEmpty = false,
    /** Boş ekranda merkezde gösterilecek hero (title/subtitle). messages.length===0 iken görünür. */
    emptyHero = null,
    /** /chat: sağ üst ⋮ menü (null ise gösterilmez) */
    chatOverflowActions = null,
    /** Composer içine Tarih/Kişi/Bütçe token bar'ını göster */
    showComposerTokens = false,
    /** Token filled state'i için merged trip meta */
    tripMetaForTokens = null,
    /** Bu chat bir gezi'ye bağlıysa banner için: { id, name } */
    boundTrip = null,
  },
  ref
) {
  const [messages, setMessages] = useState(() => {
    if (initialMessages?.length) return initialMessages;
    if (noWelcomeWhenEmpty) return [];
    return [WELCOME];
  });
  const [typing, setTyping]     = useState(false);
  const planCtxRef              = useRef({});
  planCtxRef.current            = planContextForApi ?? {};
  const feedRef                 = useRef(null);
  const bottomRef               = useRef(null);
  const prevChatId              = useRef(chatId);
  const messagesRef             = useRef(messages);
  const onAssistantResponseRef  = useRef(onAssistantResponse);
  messagesRef.current = messages;
  onAssistantResponseRef.current = onAssistantResponse;

  /* Reset messages when chatId changes */
  useEffect(() => {
    if (chatId !== prevChatId.current) {
      prevChatId.current = chatId;
      if (initialMessages?.length) setMessages(initialMessages);
      else if (noWelcomeWhenEmpty) setMessages([]);
      else setMessages([WELCOME]);
    }
  }, [chatId, initialMessages, noWelcomeWhenEmpty]);

  const onChangeRef = useRef(onMessagesChange);
  onChangeRef.current = onMessagesChange;

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

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

  const runAssistantTurn = useCallback(async (historyWithUser) => {
    setTyping(true);
    try {
      const apiMessages = historyWithUser
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, content: m.content }));

      let data = await callClaude(apiMessages, planCtxRef.current);
      if (planCtxRef.current?.chatFlowPhase === 'collect_meta' && data && typeof data === 'object') {
        data = {
          ...data,
          listings: [],
          proactive: [],
          localInsights: [],
          quickReplies: Array.isArray(data.quickReplies)
            ? data.quickReplies.slice(0, 4)
            : [],
        };
      }
      onAssistantResponseRef.current?.(data);
      setMessages((prev) => [...prev, buildMessage('assistant', data.message ?? '', data)]);
    } catch {
      setMessages((prev) => [
        ...prev,
        buildMessage('assistant', 'Bir sorun oluştu, lütfen tekrar deneyin.', {
          quickReplies: ['Tekrar dene'],
        }),
      ]);
    } finally {
      setTyping(false);
    }
  }, []);

  const handleSend = useCallback(
    async (rawText) => {
      const text = String(rawText ?? '').trim();
      if (!text) return;
      const userMsg = buildMessage('user', text);
      const base = messagesRef.current;
      const updated = [...base, userMsg];
      setMessages(updated);
      messagesRef.current = updated;
      await runAssistantTurn(updated);
    },
    [runAssistantTurn]
  );

  useImperativeHandle(
    ref,
    () => ({
      async sendQuickPlanMessage(text) {
        const userMsg = buildMessage('user', text);
        const base = messagesRef.current;
        const updated = [...base, userMsg];
        setMessages(updated);
        messagesRef.current = updated;
        await runAssistantTurn(updated);
      },
      /** Header “Atlas’a Sor”: yalnızca görünen istek metni; filtreler planContext ile gider */
      sendAtlasFilterPrompt(text) {
        return handleSend(text);
      },
      /** Gezi sayfasından gelen ilk kullanıcı turu (bootstrap blok + soru) */
      sendBootstrapUser(text) {
        return handleSend(text);
      },
      scrollToListingKey(listingKey) {
        if (!listingKey || typeof document === 'undefined') return;
        const feed = feedRef.current;
        if (!feed) return;
        const enc = encodeURIComponent(listingKey);
        const el = feed.querySelector(`[data-ta-listing="${enc}"]`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      },
    }),
    [runAssistantTurn, handleSend]
  );

  const lastMsg      = messages[messages.length - 1];
  const quickReplies = !typing && lastMsg?.role === 'assistant'
    ? (lastMsg.quickReplies ?? [])
    : [];

  return (
    <div style={s.shell}>
      <div className="ta-panel" style={s.panel}>
        {chatOverflowActions ? (
          <div style={s.chatTopBar}>
            <div style={{ flex: 1, minWidth: 0 }} />
            <ChatOverflowToolbar
              onShare={chatOverflowActions.onShare}
              onCreateTrip={chatOverflowActions.onCreateTrip}
              onArchive={chatOverflowActions.onArchive}
              onDelete={chatOverflowActions.onDelete}
            />
          </div>
        ) : null}

        {boundTrip?.id ? (
          <a href={`/trips/${encodeURIComponent(boundTrip.id)}`} style={s.boundTripBanner}>
            <span style={s.boundTripDot} aria-hidden>✦</span>
            <span style={s.boundTripText}>
              Bu sohbet <strong>{boundTrip.name || 'planınıza'}</strong> bağlı —
              seçimlerin doğrudan planına eklenir.
            </span>
            <span style={s.boundTripArrow} aria-hidden>›</span>
          </a>
        ) : null}

        <div style={s.feedWrap}>
          {emptyHero ? (
            <div
              style={{
                ...s.heroOverlay,
                opacity: messages.length === 0 && !typing ? 1 : 0,
                transform:
                  messages.length === 0 && !typing
                    ? 'translateY(0)'
                    : 'translateY(-8px)',
                visibility:
                  messages.length === 0 && !typing ? 'visible' : 'hidden',
              }}
              aria-hidden={messages.length > 0 || typing}
            >
              <div style={s.heroIcon} aria-hidden>
                <span style={s.heroIconCircle}>
                  <Compass size={26} strokeWidth={1.6} color="var(--ta-accent)" />
                </span>
              </div>
              {emptyHero.eyebrow ? (
                <div style={s.heroEyebrow}>{emptyHero.eyebrow}</div>
              ) : null}
              <h2 style={s.heroTitle}>{emptyHero.title}</h2>
              {emptyHero.subtitle ? (
                <p style={s.heroSubtitle}>{emptyHero.subtitle}</p>
              ) : null}
              {Array.isArray(emptyHero.prompts) && emptyHero.prompts.length > 0 ? (
                <div style={s.heroPromptRow}>
                  {emptyHero.prompts.map((p) => (
                    <button
                      key={p}
                      type="button"
                      style={s.heroPromptChip}
                      onClick={() => handleSend(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          <div ref={feedRef} style={s.feed}>
            {messages.map((msg, i) => (
              <MessageBubble
                key={i}
                msg={msg}
                onListingSelect={onListingSelect}
                onListingDeselect={onListingDeselect}
                selectedListings={selectedListings}
                listingHighlightFromMapKey={listingHighlightFromMapKey}
                onListingHoverKey={onListingHoverKey}
              />
            ))}
            {typing && <TypingIndicator />}

            {quickReplies.length > 0 && (
              <QuickReplies replies={quickReplies} onSelect={handleSend} />
            )}

            <div ref={bottomRef} style={{ height: 1 }} />
          </div>
          <div style={s.feedFade} aria-hidden />
        </div>

        <div style={s.composerStrip}>
          <ChatInput
            variant="dock"
            onSend={handleSend}
            disabled={typing}
            submitLabel={submitButtonLabel}
            submitIconOnly={submitIconOnly}
            showTokens={showComposerTokens}
            tripMeta={tripMetaForTokens}
          />
        </div>
      </div>
    </div>
  );
});

export default ChatArea;

function MessageBubble({
  msg,
  onListingSelect,
  onListingDeselect,
  selectedListings,
  listingHighlightFromMapKey,
  onListingHoverKey,
}) {
  const isUser   = msg.role === 'user';
  const listings = msg.listings      ?? [];
  const insights = msg.localInsights ?? [];

  return (
    <div style={s.msgGroup}>
      {isUser ? (
        <div style={s.userRow}>
          <div style={s.userCapsule}>{msg.content}</div>
        </div>
      ) : (
        <article style={s.atlasArticle}>
          <header style={s.atlasEyebrow}>
            <span style={s.atlasEyebrowMark} aria-hidden>✦</span>
            <span style={s.atlasEyebrowLabel}>Atlas</span>
          </header>
          <div style={s.atlasProse}>{msg.content}</div>
        </article>
      )}

      {/* Hotel kartları */}
      {!isUser && listings.length > 0 && (
        <div style={s.cardsRow}>
          {listings.map((listing, idx) => {
            const lk = listingMapKey(listing);
            return (
              <ListingCard
                key={idx}
                listing={listing}
                index={idx}
                listingDataAttr={listingMapDataAttr(listing)}
                listingHoverKey={lk}
                highlightFromMap={listingHighlightFromMapKey === lk}
                onMapHoverKey={onListingHoverKey}
                onPlanSelect={onListingSelect}
                onPlanRemove={onListingDeselect}
                isSelected={listing.name in selectedListings}
              />
            );
          })}
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
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
    overflow: 'hidden',
  },

  panel: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxSizing: 'border-box',
  },

  chatTopBar: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '10px 12px 0',
    gap: 8,
  },

  feedWrap: {
    position: 'relative',
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  heroOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-8) var(--space-6)',
    textAlign: 'center',
    pointerEvents: 'none',
    zIndex: 'var(--z-raised)',
    transition: 'opacity var(--duration-slow) var(--ease-out), transform var(--duration-slow) var(--ease-out), visibility var(--duration-slow) var(--ease-out)',
  },
  heroIcon: {
    marginBottom: 'var(--space-4)',
  },
  heroIconCircle: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: '#fff',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(31,77,92,0.18)',
    boxShadow: '0 10px 28px rgba(31,77,92,0.10), inset 0 0 0 4px rgba(31,77,92,0.04)',
  },
  heroEyebrow: {
    margin: '0 0 var(--space-3)',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--fw-bold)',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--ta-accent)',
  },
  heroTitle: {
    margin: '0 0 var(--space-3)',
    fontFamily: 'var(--font-serif)',
    fontWeight: 'var(--fw-bold)',
    fontSize: 'var(--text-4xl)',
    lineHeight: 'var(--text-4xl-lh)',
    letterSpacing: '-0.025em',
    color: 'var(--ta-ink)',
  },
  heroSubtitle: {
    margin: 0,
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-md)',
    lineHeight: 'var(--text-md-lh)',
    color: 'var(--ta-ink-muted)',
    maxWidth: 440,
  },
  heroPromptRow: {
    marginTop: 'var(--space-5)',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 'var(--space-2)',
    pointerEvents: 'auto',
  },
  heroPromptChip: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--fw-semibold)',
    color: 'var(--ta-ink)',
    background: '#fff',
    padding: 'var(--space-2) var(--space-4)',
    borderRadius: 'var(--radius-pill)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(31,77,92,0.18)',
    cursor: 'pointer',
    transition: 'background var(--duration-fast) var(--ease-out), border-color var(--duration-fast) var(--ease-out), transform var(--duration-fast) var(--ease-out)',
  },
  feedFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 40,
    pointerEvents: 'none',
    background:
      'linear-gradient(to top, color-mix(in srgb, var(--panel) 96%, var(--ta-muted-bg)), transparent)',
  },
  feed: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: 'var(--space-3) var(--space-4) var(--space-5)',
    display: 'grid',
    gap: 'var(--space-4)',
    alignContent: 'start',
  },

  composerStrip: {
    flexShrink: 0,
    borderTopWidth: 'var(--border-thin)',
    borderTopStyle: 'solid',
    borderTopColor: ta.border,
    padding: 'var(--space-3) var(--space-3) var(--space-3)',
    background: 'color-mix(in srgb, var(--ta-muted-bg) 22%, var(--panel))',
  },

  msgGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
  },

  /* ── Bağlı gezi banner (chat trip ile bağlıyken) ── */
  boundTripBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    margin: 'var(--space-2) var(--space-5) 0',
    padding: '8px var(--space-3)',
    borderRadius: 'var(--radius-pill)',
    background: 'rgba(31,77,92,0.06)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(31,77,92,0.22)',
    color: 'var(--ta-ink-muted)',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--fw-semibold)',
    textDecoration: 'none',
    flexShrink: 0,
    cursor: 'pointer',
    transition: 'background var(--duration-fast) var(--ease-out)',
  },
  boundTripDot: {
    fontSize: 11,
    lineHeight: 1,
  },
  boundTripText: {
    flex: 1,
    minWidth: 0,
    lineHeight: 1.4,
  },
  boundTripArrow: {
    fontSize: 16,
    fontWeight: 'var(--fw-bold)',
    opacity: 0.7,
  },

  /* ── Atlas mesaj (bubble-suz prose, editorial) ── */
  atlasArticle: {
    position: 'relative',
    paddingLeft: 'var(--space-5)',
    paddingTop: 2,
    paddingBottom: 2,
    borderLeftWidth: 2,
    borderLeftStyle: 'solid',
    borderLeftColor: 'var(--ta-accent)',
    maxWidth: '88%',
    alignSelf: 'flex-start',
  },
  atlasEyebrow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 'var(--space-2)',
    fontFamily: 'var(--font-sans)',
    fontSize: 10,
    fontWeight: 'var(--fw-bold)',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: 'var(--ta-accent)',
  },
  atlasEyebrowMark: {
    fontSize: 10,
    transform: 'translateY(-1px)',
  },
  atlasEyebrowLabel: {
    fontFamily: 'var(--font-serif)',
    fontStyle: 'italic',
    fontWeight: 'var(--fw-bold)',
    fontSize: 12,
    letterSpacing: '0.04em',
    textTransform: 'none',
    color: 'var(--ta-ink)',
  },
  atlasProse: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-md)',
    lineHeight: 1.65,
    color: 'var(--ta-ink)',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },

  /* ── Kullanıcı mesaj (sağa hizalı kapsül) ── */
  userRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignSelf: 'stretch',
  },
  userCapsule: {
    maxWidth: '72%',
    padding: 'var(--space-3) var(--space-4)',
    borderRadius: 'var(--radius-lg)',
    background: 'rgba(31,77,92,0.08)',
    color: 'var(--ta-ink)',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-md)',
    lineHeight: 1.55,
    wordBreak: 'break-word',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(31,77,92,0.14)',
  },

  /* AI row: avatar-left + bubble */
  rowAI: {
    display: 'flex',
    gap: 'var(--space-3)',
    alignItems: 'flex-start',
    maxWidth: '88%',
    alignSelf: 'flex-start',
  },
  /* User row: bubble + avatar-right, right-aligned */
  rowUser: {
    display: 'flex',
    gap: 'var(--space-3)',
    alignItems: 'flex-end',
    maxWidth: '72%',
    alignSelf: 'flex-end',
    marginLeft: 'auto',
  },

  /* Avatar styles */
  avatarAI: {
    width: '36px',
    height: '36px',
    borderRadius: 'var(--radius-sm)',
    flexShrink: 0,
    display: 'grid',
    placeItems: 'center',
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--fw-extrabold)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(0,0,0,.06)',
    background: 'linear-gradient(135deg,#0f1720,#1e3545 55%,#4a6278)',
    color: 'white',
    fontFamily: 'var(--font-sans)',
  },
  avatarUser: {
    width: 'var(--space-7)',
    height: 'var(--space-7)',
    borderRadius: 'var(--radius-sm)',
    flexShrink: 0,
    display: 'grid',
    placeItems: 'center',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--fw-extrabold)',
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(0,0,0,.06)',
    background: 'linear-gradient(135deg,#dce4ed,#5f7a94)',
    color: '#15232f',
    fontFamily: 'var(--font-sans)',
  },

  /* Bubble styles */
  bubble: {
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-3) var(--space-4)',
    lineHeight: 1.65,
    borderWidth: 'var(--border-thin)',
    borderStyle: 'solid',
    borderColor: 'rgba(0,0,0,.05)',
    boxShadow: '0 6px 18px rgba(0,0,0,.04)',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-md)',
    wordBreak: 'break-word',
    minWidth: 0,
  },
  bubbleAI: {
    background: 'rgba(255,255,255,.92)',
    color: 'var(--text1)',
    borderRadius: '4px 18px 18px 18px',
  },
  bubbleUser: {
    background: '#ffffff',
    color: '#15232f',
    borderColor: 'rgba(31,77,92,.22)',
    borderRadius: '18px 4px 18px 18px',
    boxShadow: '0 6px 18px rgba(31,77,92,.12)',
  },

  /* Hotel cards row */
  cardsRow: {
    display: 'grid',
    gridAutoFlow: 'column',
    gridAutoColumns: '248px',
    gap: 'var(--space-3)',
    overflowX: 'auto',
    paddingLeft: 'var(--space-5)',
    paddingBottom: 'var(--space-1)',
    scrollbarWidth: 'none',
  },

  /* Insights grid */
  insightsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
    gap: 'var(--space-3)',
    paddingLeft: 'var(--space-5)',
  },
};
