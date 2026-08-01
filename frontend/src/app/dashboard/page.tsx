'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { chatService, Chat, Message } from '@/services/chatService';
import { useIsMobile } from '@/hooks/useMediaQuery';
import Sidebar from '@/components/layout/Sidebar';
import MessageBubble from '@/components/chat/MessageBubble';
import MessageInput from '@/components/chat/MessageInput';
import TypingIndicator from '@/components/chat/TypingIndicator';
import ModelSelector, { MODELS } from '@/components/ui/ModelSelector';
import ExportModal from '@/components/ui/ExportModal';
import PersonaSelector, { PERSONAS } from '@/components/ui/PersonaSelector';
import PersonaBanner from '@/components/ui/PersonaBanner';
import StatsPanel from '@/components/ui/StatsPanel';
import UpgradeModal from '@/components/ui/UpgradeModal';
import ShortcutsModal from '@/components/ui/ShortcutsModal';
import ShareModal from '@/components/ui/ShareModal';
import { useTheme } from '@/context/ThemeContext';

// ── Suggestion chips per persona ─────────────────────────────────────────────
const SUGGESTIONS: Record<string, { icon: string; text: string }[]> = {
  default: [
    { icon: '💻', text: 'Write a Python function to reverse a linked list' },
    { icon: '✍️', text: 'Write a short story about an AI that falls in love' },
    { icon: '🧠', text: 'Explain the difference between TCP and UDP' },
    { icon: '📊', text: 'What are the pros and cons of microservices?' },
  ],
  scientist: [
    { icon: '⚛️', text: 'Explain quantum entanglement simply' },
    { icon: '🧬', text: 'How does CRISPR gene editing work?' },
    { icon: '🌡️', text: 'What causes the greenhouse effect?' },
    { icon: '🔭', text: 'How are black holes detected?' },
  ],
  coder: [
    { icon: '🐛', text: 'How do I debug a memory leak in Node.js?' },
    { icon: '⚡', text: 'Explain Big O notation with examples' },
    { icon: '🏗️', text: 'What is the difference between REST and GraphQL?' },
    { icon: '🔒', text: 'How do I implement JWT authentication securely?' },
  ],
  writer: [
    { icon: '📖', text: 'Help me write an opening paragraph for a thriller novel' },
    { icon: '🎭', text: 'Write a dialogue between two strangers on a train' },
    { icon: '📝', text: 'Give me 5 creative blog post ideas about productivity' },
    { icon: '✨', text: 'Rewrite this sentence to be more engaging: "The meeting went well."' },
  ],
  tutor: [
    { icon: '📐', text: 'Explain calculus derivatives to a high school student' },
    { icon: '🔤', text: 'What is the difference between affect and effect?' },
    { icon: '🗺️', text: 'Teach me about the causes of World War 1' },
    { icon: '🧮', text: 'How does compound interest work? Give me examples' },
  ],
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [chats, setChats]               = useState<Chat[]>([]);
  const [activeChat, setActiveChat]     = useState<Chat | null>(null);
  const [messages, setMessages]         = useState<Message[]>([]);
  const [isSending, setIsSending]       = useState(false);
  const [isTyping, setIsTyping]         = useState(false);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [exportOpen, setExportOpen]       = useState(false);
  const [statsOpen, setStatsOpen]         = useState(false);
  const [upgradeOpen, setUpgradeOpen]     = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [shareOpen, setShareOpen]         = useState(false);
  const [shareId, setShareId]             = useState<string | null>(null);
  const [isChatPublic, setIsChatPublic]   = useState(false);
  const [dailyUsed, setDailyUsed]         = useState(0);
  // reactions: messageIndex -> 'up'|'down'
  const [reactions, setReactions]         = useState<Record<number, 'up' | 'down'>>({});
  const { theme, toggle: toggleTheme }    = useTheme();
  const isMobile                          = useIsMobile();
  const [sidebarOpen, setSidebarOpen]     = useState(false);

  const [selectedPersona, setSelectedPersona] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('nova_persona') || 'default' : 'default'
  );
  const [selectedModel, setSelectedModel] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('nova_model') || MODELS[0].id : MODELS[0].id
  );
  const [bannerTrigger, setBannerTrigger] = useState(0);

  const handlePersonaSelect = (id: string) => {
    setSelectedPersona(id);
    localStorage.setItem('nova_persona', id);
    setBannerTrigger(t => t + 1); // show the banner
  };
  const handleModelSelect = (id: string) => {
    setSelectedModel(id);
    localStorage.setItem('nova_model', id);
  };

  const bottomRef = useRef<HTMLDivElement>(null);

  // Auth guard
  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading, router]);

  // Load chats on mount
  useEffect(() => {
    if (!user) return;
    chatService.getChats()
      .then(setChats)
      .catch(() => {})
      .finally(() => setChatsLoading(false));
  }, [user]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Clear reactions when chat changes
  const loadChat = useCallback(async (chat: Chat) => {
    setActiveChat(chat);
    setReactions({});
    setShareId(chat.shareId ?? null);
    setIsChatPublic(chat.isPublic ?? false);
    try {
      const full = await chatService.getChat(chat._id);
      setMessages(full.messages);
    } catch {
      setMessages([]);
    }
  }, []);

  const createNewChat = useCallback(async () => {
    try {
      const chat = await chatService.createChat('New Chat');
      setChats(prev => [chat, ...prev]);
      setActiveChat(chat);
      setShareId(null);
      setIsChatPublic(false);
      setReactions({});
      setMessages([]);
    } catch {}
  }, []);

  const deleteChat = useCallback(async (id: string) => {
    try {
      await chatService.deleteChat(id);
      setChats(prev => prev.filter(c => c._id !== id));
      if (activeChat?._id === id) { setActiveChat(null); setMessages([]); }
    } catch {}
  }, [activeChat]);

  // ── Core send logic ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isSending) return;

    // ── /imagine command ───────────────────────────────────────────────────────
    const imagineMatch = content.match(/^\/imagine\s+(.+)/i);
    if (imagineMatch) {
      const prompt = imagineMatch[1].trim();
      const encoded = encodeURIComponent(prompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=768&nologo=true&seed=${Math.floor(Math.random() * 2147483647)}`;

      const userMsg: Message  = { role: 'user',      content: `/imagine ${prompt}`, timestamp: new Date().toISOString() };
      const imageMsg: Message = { role: 'assistant', content: prompt, imageUrl,    timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, userMsg, imageMsg]);

      // Tab notification
      if (document.hidden) {
        document.title = `🎨 Image ready — NOVA AI`;
      }
      return;
    }

    let chat = activeChat;
    if (!chat) {
      try {
        chat = await chatService.createChat('New Chat');
        setChats(prev => [chat!, ...prev]);
        setActiveChat(chat);
      } catch { return; }
    }

    const optimistic: Message = { role: 'user', content, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, optimistic]);
    setIsSending(true);
    setIsTyping(true);

    let streamedContent = '';
    const streamingMsg: Message = { role: 'assistant', content: '', isStreaming: true, timestamp: new Date().toISOString() };
    const chatId = chat._id;

    try {
      await chatService.streamMessage(chatId, content, {
        onChunk: (chunk) => {
          streamedContent += chunk;
          setIsTyping(false);
          setMessages(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === 'assistant') {
              updated[updated.length - 1] = { ...last, content: streamedContent, isStreaming: true };
            } else {
              updated.push({ ...streamingMsg, content: streamedContent, isStreaming: true });
            }
            return updated;
          });
        },
        onDone: ({ title, isFirstMessage }) => {
          // Mark streaming done (removes cursor)
          setMessages(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === 'assistant') updated[updated.length - 1] = { ...last, isStreaming: false };
            return updated;
          });
          // Tab notification when page is hidden
          if (document.hidden) {
            document.title = `💬 New reply — NOVA AI`;
          }
          // Update sidebar title
          setChats(prev => prev.map(c =>
            c._id === chatId ? { ...c, title: title || c.title, updatedAt: new Date().toISOString() } : c
          ));
          // Auto-generate AI title after first exchange
          if (isFirstMessage) {
            chatService.generateTitle(chatId).then(aiTitle => {
              if (aiTitle) setChats(prev => prev.map(c => c._id === chatId ? { ...c, title: aiTitle } : c));
            }).catch(() => {});
          }
        },
        onError: (error) => {
          setIsTyping(false);
          setMessages(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === 'assistant') updated[updated.length - 1] = { ...last, isStreaming: false };
            return updated;
          });
          if (error?.includes('limit') || error?.includes('429')) {
            setUpgradeOpen(true);
            setMessages(prev => prev.filter(m => !(m.role === 'assistant' && m.content === '')));
            return;
          }
          setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Connection interrupted. Please try again.', timestamp: new Date().toISOString() }]);
        },
      }, selectedModel, selectedPersona);
    } catch (err: any) {
      if (err?.message?.includes('limit') || err?.status === 429) {
        setUpgradeOpen(true);
        setMessages(prev => prev.filter(m => !(m.role === 'assistant' && m.content === '')));
      } else {
        // Fallback non-streaming
        try {
          const { message } = await chatService.sendMessage(chatId, content, selectedModel, selectedPersona);
          setMessages(prev => {
            const updated = prev.filter(m => !(m.role === 'assistant' && m.content === ''));
            return [...updated, { ...message, isStreaming: false }];
          });
        } catch {
          setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ AI is temporarily unavailable. Please try again.', isStreaming: false, timestamp: new Date().toISOString() }]);
        }
      }
    } finally {
      setIsSending(false);
      setIsTyping(false);
    }
  }, [activeChat, isSending, selectedModel, selectedPersona]);

  // ── Regenerate last AI response ─────────────────────────────────────────────
  const regenerate = useCallback(async () => {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUser || !activeChat) return;
    // Remove last AI message and re-send last user message
    setMessages(prev => {
      const idx = [...prev].reverse().findIndex(m => m.role === 'assistant');
      if (idx === -1) return prev;
      const arr = [...prev];
      arr.splice(prev.length - 1 - idx, 1);
      return arr;
    });
    await sendMessage(lastUser.content);
  }, [messages, activeChat, sendMessage]);

  // ── Edit a user message ─────────────────────────────────────────────────────
  const editMessage = useCallback(async (messageIndex: number, newContent: string) => {
    if (!activeChat || isSending) return;
    // Keep messages up to (not including) the edited one, then re-send
    setMessages(prev => prev.slice(0, messageIndex));
    await sendMessage(newContent);
  }, [activeChat, isSending, sendMessage]);

  // ── Tab title notification — reset on focus ─────────────────────────────────
  useEffect(() => {
    const handleFocus = () => { document.title = 'NOVA AI — Chat Smarter. Think Deeper.'; };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // ── Keyboard shortcuts ──────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Alt+N = new chat (Ctrl+N is owned by Chrome, can't be overridden)
      if (e.altKey && e.key === 'n') { e.preventDefault(); createNewChat(); }
      // Ctrl+/ = shortcuts panel
      if ((e.ctrlKey || e.metaKey) && e.key === '/') { e.preventDefault(); setShortcutsOpen(s => !s); }
      // Escape = close whatever modal is open
      if (e.key === 'Escape') {
        setShortcutsOpen(false);
        setExportOpen(false);
        setStatsOpen(false);
        setShareOpen(false);
        setUpgradeOpen(false);
      }
    };
    document.addEventListener('keydown', handler, { capture: true });
    return () => document.removeEventListener('keydown', handler, { capture: true });
  }, [createNewChat]);

  // ── Loading state ───────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090b' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="nova-logo-icon" style={{ width: 48, height: 48, fontSize: 22, borderRadius: 14, margin: '0 auto 16px', animation: 'pulseGlow 2s ease-in-out infinite' }}>N</div>
          <p style={{ color: '#52525b', fontSize: 13 }}>Loading NOVA AI…</p>
        </div>
      </div>
    );
  }

  const activeSuggestions = SUGGESTIONS[selectedPersona] || SUGGESTIONS.default;
  const activePersona     = PERSONAS.find(p => p.id === selectedPersona);
  const lastAIIndex       = messages.reduce((acc, m, i) => m.role === 'assistant' ? i : acc, -1);

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: '#09090b' }}>

      <PersonaBanner persona={activePersona} trigger={bannerTrigger} />
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} messagesUsed={dailyUsed} />
      <StatsPanel   open={statsOpen}   onClose={() => setStatsOpen(false)}   username={user?.username} />
      <ExportModal  open={exportOpen}  onClose={() => setExportOpen(false)}  messages={messages} chatTitle={activeChat?.title} />
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      {activeChat && (
        <ShareModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          chatId={activeChat._id}
          chatTitle={activeChat.title}
          isPublic={isChatPublic}
          shareId={shareId}
          onShareChange={(pub, id) => { setIsChatPublic(pub); setShareId(id); }}
        />
      )}

      {/* ── LEFT SIDEBAR ────────────────────────────────────────────────────── */}
      {/* On desktop: static. On mobile: hidden until hamburger is tapped (handled inside Sidebar) */}
      {!isMobile && (
        <Sidebar
          chats={chats}
          activeChat={activeChat}
          onSelectChat={loadChat}
          onNewChat={createNewChat}
          onDeleteChat={deleteChat}
          onUpdateChats={setChats}
          isLoading={chatsLoading}
        />
      )}
      {/* Mobile drawer version */}
      {isMobile && (
        <Sidebar
          chats={chats}
          activeChat={activeChat}
          onSelectChat={loadChat}
          onNewChat={createNewChat}
          onDeleteChat={deleteChat}
          onUpdateChats={setChats}
          isLoading={chatsLoading}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      {/* ── CENTER PANEL ────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', height: 52, flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'var(--bg)',
        }}>
          {/* Hamburger — mobile only */}
          <button
            className="mobile-only"
            onClick={() => setSidebarOpen(s => !s)}
            aria-label="Open menu"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted2)', padding: '6px 8px', borderRadius: 8, marginRight: 4 }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="2" y1="4" x2="16" y2="4"/><line x1="2" y1="9" x2="16" y2="9"/><line x1="2" y1="14" x2="16" y2="14"/>
            </svg>
          </button>

          <span className="topbar-title" style={{ fontSize: 14, fontWeight: 600, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>
            {activeChat?.title || 'New Chat'}
          </span>

          <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="desktop-only"><PersonaSelector selectedPersona={selectedPersona} onSelect={handlePersonaSelect} /></span>
            <span className="desktop-only"><ModelSelector   selectedModel={selectedModel}     onSelect={handleModelSelect} /></span>

            {/* Stats */}
            <button onClick={() => setStatsOpen(true)} title="Your stats" className="hide-xs"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', color: '#71717a', cursor: 'pointer', fontSize: 14 }}>
              📊
            </button>

            {/* Shortcuts hint */}
            <button onClick={() => setShortcutsOpen(true)} title="Keyboard shortcuts (Ctrl+/)" className="hide-xs"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', color: '#71717a', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
              ⌨️
            </button>

            {/* Share */}
            {activeChat && messages.length > 0 && (
              <button onClick={() => setShareOpen(true)} title="Share conversation"
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: isChatPublic ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isChatPublic ? 'rgba(124,58,237,0.35)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 8, padding: '6px 10px', color: isChatPublic ? '#a855f7' : '#71717a', cursor: 'pointer', fontSize: 12, fontWeight: 500, transition: 'all 0.15s' }}>
                🔗 {isChatPublic ? 'Shared' : 'Share'}
              </button>
            )}

            {/* Export */}
            {activeChat && messages.length > 0 && (
              <button onClick={() => setExportOpen(true)} title="Export"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', color: '#71717a', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                ⬇ Export
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="messages-area scrollbar-thin" style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 8px' }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>

            {/* Empty state */}
            {messages.length === 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center', paddingTop: 56 }}>
                <div style={{
                  width: 56, height: 56, fontSize: 28, borderRadius: 18, margin: '0 auto 16px',
                  background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {activePersona?.emoji || '🤖'}
                </div>
                <h2 style={{ color: '#fafafa', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                  {selectedPersona === 'default' ? 'How can I help?' : `${activePersona?.name} is ready`}
                </h2>
                <p style={{ color: '#52525b', fontSize: 14, marginBottom: 32 }}>
                  {activePersona?.tagline || 'Ask me anything'} · <kbd style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '1px 5px', fontSize: 11, color: '#71717a' }}>Alt+N</kbd> new chat
                </p>
                <div className="suggestion-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxWidth: 520, margin: '0 auto', textAlign: 'left' }}>
                  {activeSuggestions.map(s => (
                    <button key={s.text} onClick={() => sendMessage(s.text)}
                      style={{
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 12, padding: '12px 14px', cursor: 'pointer', textAlign: 'left',
                        transition: 'all 0.15s', display: 'flex', alignItems: 'flex-start', gap: 10,
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,58,237,0.08)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(124,58,237,0.25)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
                    >
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{s.icon}</span>
                      <span style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.4 }}>{s.text}</span>
                    </button>
                  ))}

                  {/* /imagine chip */}
                  <button onClick={() => sendMessage('/imagine a futuristic city at sunset, digital art')}
                    style={{
                      background: 'rgba(236,72,153,0.06)', border: '1px solid rgba(236,72,153,0.2)',
                      borderRadius: 12, padding: '12px 14px', cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.15s', display: 'flex', alignItems: 'flex-start', gap: 10,
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(236,72,153,0.12)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(236,72,153,0.35)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(236,72,153,0.06)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(236,72,153,0.2)'; }}
                  >
                    <span style={{ fontSize: 18, flexShrink: 0 }}>🎨</span>
                    <span style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.4 }}><code style={{ color: '#f9a8d4', fontSize: 12 }}>/imagine</code> Generate an image with AI</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Messages */}
            <AnimatePresence>
              {messages.map((msg, i) => (
                <MessageBubble
                  key={i}
                  message={msg}
                  isLast={i === messages.length - 1}
                  isLastAI={i === lastAIIndex}
                  onRegenerate={i === lastAIIndex && !isSending ? regenerate : undefined}
                  onEdit={msg.role === 'user' && !isSending ? (newContent) => editMessage(i, newContent) : undefined}
                  onReact={msg.role === 'assistant' ? (r) => setReactions(prev => ({ ...prev, [i]: prev[i] === r ? undefined as any : r })) : undefined}
                  reaction={reactions[i] ?? null}
                />
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            {isTyping && <TypingIndicator />}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input */}
        <div className="input-bar" style={{ padding: '8px 20px 16px', flexShrink: 0 }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <MessageInput onSend={sendMessage} isSending={isSending} placeholder={`Message ${activePersona?.name || 'NOVA AI'}… or /imagine a prompt`} />
            <p style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: '#3f3f46' }}>
              NOVA AI can make mistakes. Verify important info. Try <code style={{ color: '#f9a8d4', background: 'rgba(236,72,153,0.1)', padding: '0 4px', borderRadius: 4, fontSize: 11 }}>/imagine a sunset</code> to generate images.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
