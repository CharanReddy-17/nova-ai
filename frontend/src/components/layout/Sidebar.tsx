'use client';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Pin, Trash2, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Chat, chatService } from '@/services/chatService';
import SearchModal from '@/components/ui/SearchModal';

interface SidebarProps {
  chats: Chat[];
  activeChat: Chat | null;
  onSelectChat: (chat: Chat) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onUpdateChats: (chats: Chat[]) => void;
  isLoading: boolean;
}

function groupChats(chats: Chat[]) {
  const pinned = chats.filter(c => c.isPinned);
  const unpinned = chats.filter(c => !c.isPinned);
  const now = new Date();
  const today: Chat[] = [], yesterday: Chat[] = [], older: Chat[] = [];
  unpinned.forEach(c => {
    const diff = (now.getTime() - new Date(c.updatedAt).getTime()) / 86400000;
    if (diff < 1) today.push(c);
    else if (diff < 2) yesterday.push(c);
    else older.push(c);
  });
  return { pinned, today, yesterday, older };
}

function formatAgo(ts: string) {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

function ChatItem({ chat, active, isPinned, onSelect, onDelete, onPin }: {
  chat: Chat; active: boolean; isPinned: boolean;
  onSelect: () => void; onDelete: () => void; onPin: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onClick={onSelect}
      role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onSelect()}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 10px', borderRadius: 9, cursor: 'pointer',
        background: active ? 'rgba(124,58,237,0.12)' : hovered ? 'rgba(255,255,255,0.03)' : 'transparent',
        borderLeft: active ? '2px solid #7c3aed' : '2px solid transparent',
        transition: 'all 0.15s', userSelect: 'none', marginBottom: 1,
      }}
    >
      <span style={{ fontSize: 13, flexShrink: 0 }}>
        {isPinned ? '📌' : '💬'}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: active ? '#c4b5fd' : '#a1a1aa', fontSize: 13, fontWeight: active ? 500 : 400, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {chat.title || 'New Chat'}
        </p>
        <p style={{ color: '#3f3f46', fontSize: 11, margin: 0 }}>{formatAgo(chat.updatedAt)}</p>
      </div>

      {/* Action buttons on hover */}
      <AnimatePresence>
        {hovered && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
            <button
              onClick={e => { e.stopPropagation(); onPin(); }}
              title={isPinned ? 'Unpin' : 'Pin'}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px 4px', borderRadius: 5, color: isPinned ? '#f59e0b' : '#52525b', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f59e0b')}
              onMouseLeave={e => (e.currentTarget.style.color = isPinned ? '#f59e0b' : '#52525b')}
            >
              <Pin size={12} fill={isPinned ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDelete(); }}
              title="Delete"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px 4px', borderRadius: 5, color: '#52525b', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
              onMouseLeave={e => (e.currentTarget.style.color = '#52525b')}
            >
              <Trash2 size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p style={{ color: '#3f3f46', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 10px 4px', margin: 0 }}>
      {label}
    </p>
  );
}

export default function Sidebar({ chats, activeChat, onSelectChat, onNewChat, onDeleteChat, onUpdateChats, isLoading }: SidebarProps) {
  const { user, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const { pinned, today, yesterday, older } = groupChats(chats);
  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'U';

  const handlePin = useCallback(async (chat: Chat) => {
    try {
      const updated = await chatService.updateChat(chat._id, { isPinned: !chat.isPinned });
      onUpdateChats(chats.map(c => c._id === chat._id ? { ...c, isPinned: updated.isPinned } : c));
    } catch { /* silent */ }
  }, [chats, onUpdateChats]);

  // Ctrl+F shortcut
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); setSearchOpen(true); }
  }, []);

  // Register global shortcut
  if (typeof window !== 'undefined') {
    // Use effect-like approach inside render — safe in client components
  }

  return (
    <>
      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        chats={chats}
        onSelectChat={chat => { onSelectChat(chat); setSearchOpen(false); }}
      />

      <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#111113', borderRight: '1px solid rgba(255,255,255,0.06)', height: '100%' }}>

        {/* Logo + actions */}
        <div style={{ padding: '16px 12px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <a href="/" className="nova-logo" style={{ textDecoration: 'none', fontSize: 15 }}>
              <div className="nova-logo-icon" style={{ width: 26, height: 26, fontSize: 12, borderRadius: 7 }}>N</div>
              <span>NOVA AI</span>
            </a>
            {/* Search button */}
            <button
              onClick={() => setSearchOpen(true)}
              title="Search chats (Ctrl+F)"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: '#52525b', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#a1a1aa'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.12)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#52525b'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
            >
              <Search size={13} />
              <span style={{ fontFamily: 'monospace' }}>⌃F</span>
            </button>
          </div>
          <button onClick={onNewChat} className="btn-primary" style={{ width: '100%', padding: '9px 12px', fontSize: 13, borderRadius: 10, justifyContent: 'center' }}>
            + New Chat
          </button>
        </div>

        {/* Chat list */}
        <div className="scrollbar-thin" style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
          {isLoading && (
            <div style={{ textAlign: 'center', padding: 24, color: '#3f3f46', fontSize: 13 }}>Loading chats…</div>
          )}
          {!isLoading && chats.length === 0 && (
            <div style={{ textAlign: 'center', padding: 24, color: '#3f3f46', fontSize: 13 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
              No chats yet.<br />Start a new conversation!
            </div>
          )}

          {/* Pinned */}
          {pinned.length > 0 && (
            <>
              <SectionLabel label="📌 Pinned" />
              <AnimatePresence>
                {pinned.map(c => (
                  <ChatItem key={c._id} chat={c} active={activeChat?._id === c._id} isPinned={true}
                    onSelect={() => onSelectChat(c)} onDelete={() => onDeleteChat(c._id)} onPin={() => handlePin(c)} />
                ))}
              </AnimatePresence>
            </>
          )}

          {/* Today */}
          {today.length > 0 && (
            <>
              <SectionLabel label="Today" />
              <AnimatePresence>
                {today.map(c => (
                  <ChatItem key={c._id} chat={c} active={activeChat?._id === c._id} isPinned={false}
                    onSelect={() => onSelectChat(c)} onDelete={() => onDeleteChat(c._id)} onPin={() => handlePin(c)} />
                ))}
              </AnimatePresence>
            </>
          )}

          {/* Yesterday */}
          {yesterday.length > 0 && (
            <>
              <SectionLabel label="Yesterday" />
              <AnimatePresence>
                {yesterday.map(c => (
                  <ChatItem key={c._id} chat={c} active={activeChat?._id === c._id} isPinned={false}
                    onSelect={() => onSelectChat(c)} onDelete={() => onDeleteChat(c._id)} onPin={() => handlePin(c)} />
                ))}
              </AnimatePresence>
            </>
          )}

          {/* Older */}
          {older.length > 0 && (
            <>
              <SectionLabel label="Earlier" />
              <AnimatePresence>
                {older.map(c => (
                  <ChatItem key={c._id} chat={c} active={activeChat?._id === c._id} isPinned={false}
                    onSelect={() => onSelectChat(c)} onDelete={() => onDeleteChat(c._id)} onPin={() => handlePin(c)} />
                ))}
              </AnimatePresence>
            </>
          )}
        </div>

        {/* User panel */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="avatar" style={{ width: 34, height: 34, fontSize: 13, flexShrink: 0 }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: '#fafafa', fontSize: 13, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.username || 'User'}
            </p>
            <p style={{ color: '#52525b', fontSize: 11, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email || ''}
            </p>
          </div>
          <button onClick={logout} title="Sign out"
            style={{ background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', padding: 6, borderRadius: 7, transition: 'all 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#52525b'; (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}>
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </>
  );
}
