'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { chatService, Chat, Message } from '@/services/chatService';
import Sidebar from '@/components/layout/Sidebar';
import MessageBubble from '@/components/chat/MessageBubble';
import MessageInput from '@/components/chat/MessageInput';
import TypingIndicator from '@/components/chat/TypingIndicator';

const SpaceCanvas = dynamic(() => import('@/components/space/SpaceCanvas'), { ssr: false });

const SUGGESTIONS = [
  { icon: '🌌', text: 'Explain how black holes form' },
  { icon: '🚀', text: 'How does a rocket reach orbit?' },
  { icon: '💻', text: 'Write a Python function to sort a list' },
  { icon: '🧠', text: 'What is quantum entanglement?' },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [chats, setChats]             = useState<Chat[]>([]);
  const [activeChat, setActiveChat]   = useState<Chat | null>(null);
  const [messages, setMessages]       = useState<Message[]>([]);
  const [isSending, setIsSending]     = useState(false);
  const [isTyping, setIsTyping]       = useState(false);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [rightOpen, setRightOpen]     = useState(false);
  const [spaceObject, setSpaceObject] = useState('earth');

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

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const loadChat = useCallback(async (chat: Chat) => {
    setActiveChat(chat);
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
      setMessages([]);
    } catch {}
  }, []);

  const deleteChat = useCallback(async (id: string) => {
    try {
      await chatService.deleteChat(id);
      setChats(prev => prev.filter(c => c._id !== id));
      if (activeChat?._id === id) {
        setActiveChat(null);
        setMessages([]);
      }
    } catch {}
  }, [activeChat]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isSending) return;

    // Need an active chat — create one if none
    let chat = activeChat;
    if (!chat) {
      try {
        chat = await chatService.createChat('New Chat');
        setChats(prev => [chat!, ...prev]);
        setActiveChat(chat);
      } catch { return; }
    }

    // Optimistic user message
    const optimistic: Message = { role: 'user', content, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, optimistic]);
    setIsSending(true);
    setIsTyping(true);

    try {
      const { message, spaceKeyword } = await chatService.sendMessage(chat._id, content);
      setMessages(prev => [...prev, message]);
      if (spaceKeyword) setSpaceObject(spaceKeyword);

      // Update chat title in sidebar
      setChats(prev => prev.map(c =>
        c._id === chat!._id
          ? { ...c, title: c.title === 'New Chat' ? content.slice(0, 45) + (content.length > 45 ? '…' : '') : c.title, updatedAt: new Date().toISOString() }
          : c
      ));
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Sorry, I had trouble responding. Please try again.', timestamp: new Date().toISOString() }]);
    } finally {
      setIsSending(false);
      setIsTyping(false);
    }
  }, [activeChat, isSending]);

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

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: '#09090b' }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <Sidebar
        chats={chats}
        activeChat={activeChat}
        onSelectChat={loadChat}
        onNewChat={createNewChat}
        onDeleteChat={deleteChat}
        isLoading={chatsLoading}
      />

      {/* ── Center — Chat ────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Top bar */}
        <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: '#fafafa', fontWeight: 600, fontSize: 14 }}>
              {activeChat?.title || 'New Chat'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="badge badge-purple" style={{ fontSize: 11 }}>LLaMA 3.3 70B</span>
            <button onClick={() => setRightOpen(v => !v)}
              style={{ background: rightOpen ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)', border: `1px solid ${rightOpen ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 8, padding: '6px 12px', color: rightOpen ? '#c4b5fd' : '#71717a', cursor: 'pointer', fontSize: 12, fontWeight: 500, transition: 'all 0.2s' }}>
              🌌 3D
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="scrollbar-thin" style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 8px' }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>

            {/* Empty state */}
            {messages.length === 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center', paddingTop: 48 }}>
                <div className="nova-logo-icon" style={{ width: 52, height: 52, fontSize: 24, borderRadius: 16, margin: '0 auto 16px' }}>N</div>
                <h2 style={{ color: '#fafafa', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                  What can I help you with?
                </h2>
                <p style={{ color: '#71717a', fontSize: 14, marginBottom: 32 }}>
                  Ask anything — I&apos;m powered by LLaMA 3.3 70B via Groq.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxWidth: 480, margin: '0 auto', textAlign: 'left' }}>
                  {SUGGESTIONS.map(s => (
                    <button key={s.text} className="chip" onClick={() => sendMessage(s.text)}>
                      <span style={{ fontSize: 18 }}>{s.icon}</span>
                      <span style={{ fontSize: 13 }}>{s.text}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Message list */}
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <MessageBubble key={i} message={m} />
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            <AnimatePresence>
              {isTyping && <TypingIndicator />}
            </AnimatePresence>

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input */}
        <div style={{ maxWidth: 760 + 40, width: '100%', margin: '0 auto', flexShrink: 0 }}>
          <MessageInput onSend={sendMessage} isSending={isSending} />
        </div>
      </div>

      {/* ── Right panel — 3D Space ────────────────────────────────────────── */}
      <AnimatePresence>
        {rightOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 360, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ flexShrink: 0, borderLeft: '1px solid rgba(255,255,255,0.06)', background: '#09090b', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#a1a1aa', fontSize: 13, fontWeight: 600 }}>🌌 3D Viewer</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => router.push('/dashboard/solar-system')}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '4px 10px', color: '#71717a', fontSize: 11, cursor: 'pointer' }}>
                  Solar System ↗
                </button>
                <button onClick={() => setRightOpen(false)} style={{ background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
              </div>
            </div>
            {/* 3D Canvas */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <SpaceCanvas activeObject={spaceObject} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
