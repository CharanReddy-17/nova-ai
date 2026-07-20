'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, MessageSquare } from 'lucide-react';
import { Chat } from '@/services/chatService';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  chats: Chat[];
  onSelectChat: (chat: Chat) => void;
}

function highlight(text: string, query: string) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'rgba(124,58,237,0.35)', color: '#c4b5fd', borderRadius: 3, padding: '0 2px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function SearchModal({ open, onClose, chats, onSelectChat }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim()
    ? chats.filter(c => c.title.toLowerCase().includes(query.toLowerCase()))
    : chats.slice(0, 8); // Show recent 8 when no query

  useEffect(() => { if (open) { setQuery(''); setCursor(0); setTimeout(() => inputRef.current?.focus(), 80); } }, [open]);
  useEffect(() => { setCursor(0); }, [query]);

  // Keyboard navigation
  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(p => Math.min(p + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setCursor(p => Math.max(p - 1, 0)); }
    if (e.key === 'Enter' && filtered[cursor]) { onSelectChat(filtered[cursor]); onClose(); }
    if (e.key === 'Escape') onClose();
  }, [filtered, cursor, onSelectChat, onClose]);

  // Global Ctrl+F shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); if (!open) onClose(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  function formatTime(ts: string) {
    const d = new Date(ts);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 86400000;
    if (diff < 1) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 7) return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, backdropFilter: 'blur(4px)' }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{
              position: 'fixed', top: '15%', left: '50%', transform: 'translateX(-50%)',
              width: '100%', maxWidth: 560, zIndex: 201,
              background: '#111113', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 18, overflow: 'hidden',
              boxShadow: '0 40px 80px rgba(0,0,0,0.8)',
            }}
          >
            {/* Search input */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <Search size={18} style={{ color: '#52525b', flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Search conversations…"
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: '#fafafa', fontSize: 15, fontFamily: 'inherit',
                }}
              />
              {query && (
                <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525b', padding: 2 }}>
                  <X size={15} />
                </button>
              )}
              <kbd style={{ fontSize: 10, padding: '2px 6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, color: '#52525b' }}>ESC</kbd>
            </div>

            {/* Results */}
            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              {!query && (
                <p style={{ fontSize: 10, color: '#3f3f46', padding: '10px 16px 4px', letterSpacing: '0.08em', fontWeight: 600 }}>RECENT CHATS</p>
              )}
              {filtered.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: '#52525b' }}>
                  <MessageSquare size={28} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                  <p style={{ fontSize: 14 }}>No results for "{query}"</p>
                </div>
              ) : (
                filtered.map((chat, i) => (
                  <motion.button
                    key={chat._id}
                    onClick={() => { onSelectChat(chat); onClose(); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '11px 16px', border: 'none', cursor: 'pointer', textAlign: 'left',
                      background: i === cursor ? 'rgba(124,58,237,0.12)' : 'transparent',
                      borderLeft: `2px solid ${i === cursor ? '#7c3aed' : 'transparent'}`,
                      transition: 'background 0.1s',
                      color: '#fff',
                    }}
                    onMouseEnter={() => setCursor(i)}
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: 9,
                      background: i === cursor ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <MessageSquare size={15} style={{ color: i === cursor ? '#a78bfa' : '#52525b' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: i === cursor ? '#fafafa' : '#a1a1aa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {highlight(chat.title || 'New Chat', query)}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: '#3f3f46' }}>
                        {chat.messages?.length || 0} messages
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#3f3f46', flexShrink: 0 }}>
                      <Clock size={11} />
                      <span style={{ fontSize: 11 }}>{formatTime(chat.updatedAt)}</span>
                    </div>
                  </motion.button>
                ))
              )}
            </div>

            {/* Footer hints */}
            <div style={{ padding: '8px 16px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: 16, alignItems: 'center' }}>
              {[['↑↓', 'Navigate'], ['↵', 'Open'], ['ESC', 'Close']].map(([key, label]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <kbd style={{ fontSize: 10, padding: '1px 5px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: '#71717a' }}>{key}</kbd>
                  <span style={{ fontSize: 11, color: '#3f3f46' }}>{label}</span>
                </div>
              ))}
              <span style={{ marginLeft: 'auto', fontSize: 11, color: '#3f3f46' }}>
                {filtered.length} result{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
