'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import APODWidget from '@/components/nasa/APODWidget';
import type { Message } from '@/services/chatService';

interface Suggestion { icon: string; text: string; }

interface ChatWindowProps {
  messages: Message[];
  onSend: (content: string) => void;
  isSending: boolean;
  activeChatId: string | null;
  onNewChat: () => void;
  sidebarOpen: boolean;
  rightPanelOpen: boolean;
  onToggleRightPanel: () => void;
  suggestions?: Suggestion[];
}

export default function ChatWindow({
  messages, onSend, isSending, activeChatId,
  onNewChat, rightPanelOpen, onToggleRightPanel,
  suggestions = [],
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showAPOD, setShowAPOD] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <div
        className="flex items-center justify-between px-4 flex-shrink-0"
        style={{ height: 44, borderBottom: '1px solid rgba(0,212,255,0.08)', background: 'rgba(2,2,9,0.8)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center gap-2">
          <div className="status-dot online" />
          <span className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {activeChatId ? 'SESSION ACTIVE' : 'STANDBY'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAPOD(v => !v)}
            className="btn-hud"
            title="NASA Picture of the Day"
          >
            🔭 APOD
          </button>
          <button
            onClick={onToggleRightPanel}
            className="btn-hud hidden lg:flex"
            title={rightPanelOpen ? 'Hide 3D' : 'Show 3D'}
          >
            {rightPanelOpen ? '⊡ HIDE 3D' : '⊞ SHOW 3D'}
          </button>
        </div>
      </div>

      {/* APOD panel */}
      <AnimatePresence>
        {showAPOD && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden flex-shrink-0 border-b border-white/5"
          >
            <APODWidget />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
        {messages.length === 0 && !isSending ? (
          <EmptyState onNewChat={onNewChat} onSend={onSend} suggestions={suggestions} />
        ) : (
          <>
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))}
            {isSending && <TypingIndicator />}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput onSend={onSend} isSending={isSending} activeChatId={activeChatId} onNewChat={onNewChat} />
    </div>
  );
}

function EmptyState({ onSend, suggestions }: { onNewChat: () => void; onSend: (s: string) => void; suggestions: {icon:string;text:string}[] }) {
  const chips = suggestions.length > 0 ? suggestions : [
    { icon:'🪐', text:"Tell me about Saturn's rings" },
    { icon:'🔭', text:'Latest James Webb discoveries' },
    { icon:'⚫', text:'What is a black hole?' },
    { icon:'🚀', text:'NASA Artemis mission status' },
    { icon:'⭐', text:'How do stars form?' },
    { icon:'🌌', text:'Show me the Milky Way' },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full py-8 gap-8 px-6">
      <div className="text-center">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          className="text-6xl mb-5 inline-block"
        >
          🌌
        </motion.div>
        <h2 className="text-3xl font-bold gradient-text mb-3 font-display">
          Ask the Universe
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, maxWidth: 380 }}>
          Ask about planets, stars, NASA missions, or let me show<br />you a 3D space simulation.
        </p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <span className="badge badge-cyan">AI POWERED</span>
          <span className="badge badge-green">3D LIVE</span>
          <span className="badge badge-purple">NASA DATA</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
        {chips.map((s, i) => (
          <motion.button
            key={s.text}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => onSend(s.text)}
            className="chip"
          >
            <span style={{ fontSize: 16 }}>{s.icon}</span>
            <span style={{ fontSize: 13 }}>{s.text}</span>
          </motion.button>
        ))}
      </div>

      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontFamily: 'JetBrains Mono, monospace' }}>
        Press <span style={{ color: 'rgba(0,212,255,0.6)' }}>Ctrl+K</span> for command palette
      </p>
    </div>
  );
}


function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-end gap-3 max-w-2xl"
    >
      <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm"
        style={{ background: 'linear-gradient(135deg, #4fc3f7, #7b1fa2)' }}>
        🤖
      </div>
      <div className="glass rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1.5 items-center h-5">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-cosmic-blue loading-dot" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
