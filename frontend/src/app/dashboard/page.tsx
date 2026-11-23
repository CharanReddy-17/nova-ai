'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Sparkles, Code2, PenLine, Compass, Atom, GraduationCap,
  BarChart2, Keyboard, Share2, Download, Wand2, Terminal,
  BookOpen, Lightbulb, Menu, Search, LucideIcon
} from 'lucide-react';
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

// ── Suggestion chips per persona (Clean Lucide vector icons) ─────────────────
interface SuggestionItem {
  icon: LucideIcon;
  title: string;
  text: string;
}

const SUGGESTIONS: Record<string, SuggestionItem[]> = {
  default: [
    { icon: Code2, title: 'Code logic', text: 'Write a Python function to reverse a linked list' },
    { icon: PenLine, title: 'Creative writing', text: 'Write a short story about an autonomous AI agent' },
    { icon: Compass, title: 'System architecture', text: 'Explain the technical difference between TCP and UDP' },
    { icon: Lightbulb, title: 'Architecture review', text: 'What are the pros and cons of microservices?' },
  ],
  scientist: [
    { icon: Atom, title: 'Quantum physics', text: 'Explain quantum entanglement simply' },
    { icon: Lightbulb, title: 'Biotechnology', text: 'How does CRISPR gene editing work?' },
    { icon: Compass, title: 'Climate science', text: 'What causes the greenhouse effect?' },
    { icon: Search, title: 'Astrophysics', text: 'How are black holes detected across galaxies?' },
  ],
  coder: [
    { icon: Terminal, title: 'Debugging', text: 'How do I debug a memory leak in Node.js?' },
    { icon: Code2, title: 'Algorithms', text: 'Explain Big O notation with practical examples' },
    { icon: Compass, title: 'API design', text: 'What is the architectural difference between REST and GraphQL?' },
    { icon: Lightbulb, title: 'Security', text: 'How do I implement JWT authentication securely?' },
  ],
  writer: [
    { icon: BookOpen, title: 'Novel hook', text: 'Help me write an opening paragraph for a thriller novel' },
    { icon: PenLine, title: 'Screenplay', text: 'Write a dialogue between two strangers on a late-night train' },
    { icon: Lightbulb, title: 'Content strategy', text: 'Give me 5 creative blog post ideas about engineering productivity' },
    { icon: Sparkles, title: 'Editorial Polish', text: 'Rewrite this sentence to be more engaging: "The meeting went well."' },
  ],
  tutor: [
    { icon: GraduationCap, title: 'Mathematics', text: 'Explain calculus derivatives to a high school student' },
    { icon: BookOpen, title: 'Linguistics', text: 'What is the grammatical difference between affect and effect?' },
    { icon: Compass, title: 'World history', text: 'Teach me about the primary root causes of World War 1' },
    { icon: Lightbulb, title: 'Economics', text: 'How does compound interest work? Give clear numerical examples' },
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
    setBannerTrigger(t => t + 1);
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

  // ── Core send logic ──────────────────────────────────────────
  const sendMessage = useCallback(async (content: string, attachedImageUrl?: string) => {
    if (!content.trim() && !attachedImageUrl) return;
    if (isSending) return;

    // ── /imagine command & natural image prompts ──────────────────────────────
    const imagineMatch = content.match(/^\/(?:imagine|image|draw|img)\s+(.+)/i)
      || content.match(/^(?:please\s+)?(?:generate|create|draw)\s+(?:an?\s+)?image\s+(?:of|showing|depicting)\s+(.+)/i);
    if (imagineMatch) {
      const prompt = imagineMatch[1].trim();
      const encoded = encodeURIComponent(prompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=768&nologo=true&seed=${Math.floor(Math.random() * 2147483647)}`;

      const userMsg: Message  = { role: 'user',      content: `/imagine ${prompt}`, timestamp: new Date().toISOString() };
      const imageMsg: Message = { role: 'assistant', content: prompt, imageUrl,    timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, userMsg, imageMsg]);

      if (document.hidden) {
        document.title = `Image generated — NOVA AI`;
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

    const optimistic: Message = {
      role: 'user',
      content,
      imageUrl: attachedImageUrl,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    setIsSending(true);
    setIsTyping(true);

    let streamedContent = '';
    const streamingMsg: Message = { role: 'assistant', content: '', isStreaming: true, timestamp: new Date().toISOString() };
    const chatId = chat._id;

    try {
      const aiContent = attachedImageUrl
        ? `${content ? content + '\n\n' : ''}[User shared an image: ${attachedImageUrl}]`
        : content;
      await chatService.streamMessage(chatId, aiContent, {
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
          setMessages(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === 'assistant') updated[updated.length - 1] = { ...last, isStreaming: false };
            return updated;
          });
          if (document.hidden) {
            document.title = `New reply — NOVA AI`;
          }
          setChats(prev => prev.map(c =>
            c._id === chatId ? { ...c, title: title || c.title, updatedAt: new Date().toISOString() } : c
          ));
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
          setMessages(prev => [...prev, { role: 'assistant', content: 'Connection interrupted. Please try again.', timestamp: new Date().toISOString() }]);
        },
      }, selectedModel, selectedPersona);
    } catch (err: any) {
      if (err?.message?.includes('limit') || err?.status === 429) {
        setUpgradeOpen(true);
        setMessages(prev => prev.filter(m => !(m.role === 'assistant' && m.content === '')));
      } else {
        try {
          const { message } = await chatService.sendMessage(chatId, content, selectedModel, selectedPersona);
          setMessages(prev => {
            const updated = prev.filter(m => !(m.role === 'assistant' && m.content === ''));
            return [...updated, { ...message, isStreaming: false }];
          });
        } catch {
          setMessages(prev => [...prev, { role: 'assistant', content: 'AI service temporarily unavailable. Please try again.', isStreaming: false, timestamp: new Date().toISOString() }]);
        }
      }
    } finally {
      setIsSending(false);
      setIsTyping(false);
    }
  }, [activeChat, isSending, selectedModel, selectedPersona]);

  const regenerate = useCallback(async () => {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUser || !activeChat) return;
    setMessages(prev => {
      const idx = [...prev].reverse().findIndex(m => m.role === 'assistant');
      if (idx === -1) return prev;
      const arr = [...prev];
      arr.splice(prev.length - 1 - idx, 1);
      return arr;
    });
    await sendMessage(lastUser.content);
  }, [messages, activeChat, sendMessage]);

  const editMessage = useCallback(async (messageIndex: number, newContent: string) => {
    if (!activeChat || isSending) return;
    setMessages(prev => prev.slice(0, messageIndex));
    await sendMessage(newContent);
  }, [activeChat, isSending, sendMessage]);

  useEffect(() => {
    const handleFocus = () => { document.title = 'NOVA AI — Chat Smarter. Think Deeper.'; };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'n') { e.preventDefault(); createNewChat(); }
      if ((e.ctrlKey || e.metaKey) && e.key === '/') { e.preventDefault(); setShortcutsOpen(s => !s); }
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

  if (isLoading) {
    return (
      <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, margin: '0 auto 16px', background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
            <Sparkles size={22} />
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>Initializing NOVA AI…</p>
        </div>
      </div>
    );
  }

  const activeSuggestions = SUGGESTIONS[selectedPersona] || SUGGESTIONS.default;
  const activePersona     = PERSONAS.find(p => p.id === selectedPersona);
  const lastAIIndex       = messages.reduce((acc, m, i) => m.role === 'assistant' ? i : acc, -1);
  const PersonaIcon       = activePersona?.icon || Sparkles;

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: 'var(--bg)' }}>
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
          padding: '0 18px', height: 54, flexShrink: 0,
          borderBottom: '1px solid var(--border)', background: 'var(--bg)',
        }}>
          {/* Left: Mobile hamburger + Active chat title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <button
              className="mobile-only"
              onClick={() => setSidebarOpen(s => !s)}
              aria-label="Open menu"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '6px', borderRadius: 8 }}
            >
              <Menu size={18} />
            </button>

            <span className="topbar-title" style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 320 }}>
              {activeChat?.title || 'New Conversation'}
            </span>
          </div>

          {/* Right: Actions */}
          <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="desktop-only"><PersonaSelector selectedPersona={selectedPersona} onSelect={handlePersonaSelect} /></span>
            <span className="desktop-only"><ModelSelector   selectedModel={selectedModel}     onSelect={handleModelSelect} /></span>

            {/* Stats */}
            <button onClick={() => setStatsOpen(true)} title="Activity Statistics" className="hide-xs"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 9px', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <BarChart2 size={15} />
            </button>

            {/* Shortcuts */}
            <button onClick={() => setShortcutsOpen(true)} title="Shortcuts (Ctrl+/)" className="hide-xs"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 9px', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Keyboard size={15} />
            </button>

            {/* Share */}
            {activeChat && messages.length > 0 && (
              <button onClick={() => setShareOpen(true)} title="Share link"
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: isChatPublic ? 'rgba(229,169,90,0.15)' : 'var(--surface)', border: `1px solid ${isChatPublic ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 8, padding: '6px 10px', color: isChatPublic ? 'var(--accent)' : 'var(--text)', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                <Share2 size={13} />
                <span>{isChatPublic ? 'Shared' : 'Share'}</span>
              </button>
            )}

            {/* Export */}
            {activeChat && messages.length > 0 && (
              <button onClick={() => setExportOpen(true)} title="Export transcript"
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', color: 'var(--muted)', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                <Download size={13} />
                <span>Export</span>
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="messages-area scrollbar-thin" style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 8px' }}>
          <div style={{ maxWidth: 780, margin: '0 auto' }}>

            {/* Empty state — Modern Claude / Gemini / ChatGPT style */}
            {messages.length === 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center', paddingTop: 64, paddingBottom: 32 }}>

                {/* Hero icon */}
                <div style={{
                  width: 52, height: 52, borderRadius: 16, margin: '0 auto 20px',
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                }}>
                  <PersonaIcon size={24} style={{ color: activePersona?.color || 'var(--accent)' }} />
                </div>

                <h1 style={{ color: 'var(--text)', fontSize: 'clamp(24px, 3.5vw, 32px)', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>
                  {selectedPersona === 'default' ? 'Where would you like to begin?' : `${activePersona?.name} is ready`}
                </h1>
                <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 36, maxWidth: 440, margin: '0 auto 36px' }}>
                  {activePersona?.tagline || 'Ask a question, analyze code, or create imagery with natural precision.'}
                </p>

                {/* Suggestion cards grid */}
                <div className="suggestion-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 640, margin: '0 auto', textAlign: 'left' }}>
                  {activeSuggestions.map(s => {
                    const SuggestionIcon = s.icon;
                    return (
                      <button key={s.text} onClick={() => sendMessage(s.text)}
                        style={{
                          background: 'var(--surface)', border: '1px solid var(--border)',
                          borderRadius: 14, padding: '14px 16px', cursor: 'pointer', textAlign: 'left',
                          transition: 'all 0.15s ease', display: 'flex', flexDirection: 'column', gap: 6,
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)';
                          (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface2)';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                          (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface)';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <SuggestionIcon size={15} style={{ color: 'var(--accent)' }} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{s.title}</span>
                        </div>
                        <span style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.45 }}>{s.text}</span>
                      </button>
                    );
                  })}

                  {/* /imagine chip */}
                  <button onClick={() => sendMessage('/imagine a minimalist architectural house in misty mountains, architectural photography')}
                    style={{
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 14, padding: '14px 16px', cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.15s ease', display: 'flex', flexDirection: 'column', gap: 6,
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)';
                      (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface2)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                      (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Wand2 size={15} style={{ color: 'var(--accent)' }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>Image Generation</span>
                    </div>
                    <span style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.45 }}>
                      Type <code style={{ color: 'var(--accent)', background: 'var(--surface2)', padding: '1px 5px', borderRadius: 4, fontSize: 12 }}>/imagine</code> to generate cinematic artwork
                    </span>
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

        {/* Floating Input area */}
        <div className="input-bar" style={{ padding: '4px 20px 16px', flexShrink: 0 }}>
          <div style={{ maxWidth: 780, margin: '0 auto' }}>
            <MessageInput onSend={(content, imgUrl) => sendMessage(content, imgUrl)} isSending={isSending} placeholder={`Message ${activePersona?.name || 'NOVA AI'}…`} />
            <p style={{ textAlign: 'center', marginTop: 6, fontSize: 11, color: 'var(--muted)' }}>
              NOVA AI can make mistakes. Verify critical facts and code.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
