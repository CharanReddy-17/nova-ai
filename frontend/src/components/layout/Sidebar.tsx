'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Chat } from '@/services/chatService';

interface SidebarProps {
  chats: Chat[];
  activeChat: Chat | null;
  onSelectChat: (chat: Chat) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  isLoading: boolean;
}

function groupChats(chats: Chat[]) {
  const now = new Date();
  const today: Chat[] = [];
  const yesterday: Chat[] = [];
  const older: Chat[] = [];

  chats.forEach(c => {
    const d = new Date(c.updatedAt);
    const diff = (now.getTime() - d.getTime()) / 86400000;
    if (diff < 1) today.push(c);
    else if (diff < 2) yesterday.push(c);
    else older.push(c);
  });

  return { today, yesterday, older };
}

function formatAgo(ts: string) {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

function ChatItem({ chat, active, onSelect, onDelete }: {
  chat: Chat; active: boolean;
  onSelect: () => void; onDelete: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      className={`sidebar-item ${active ? 'active' : ''}`}
      onClick={onSelect}
      style={{ position: 'relative', padding: '9px 12px', userSelect: 'none' }}
      role="button" tabIndex={0}>
      <span style={{ fontSize: 14, flexShrink: 0 }}>💬</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: active ? '#c4b5fd' : '#a1a1aa', fontSize: 13, fontWeight: active ? 500 : 400, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {chat.title || 'New Chat'}
        </p>
        <p style={{ color: '#3f3f46', fontSize: 11, margin: 0 }}>{formatAgo(chat.updatedAt)}</p>
      </div>
      {/* Delete button */}
      <button
        onClick={e => { e.stopPropagation(); onDelete(); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525b', fontSize: 14, padding: '2px 4px', borderRadius: 4, opacity: 0, transition: 'opacity 0.15s', flexShrink: 0 }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#ef4444'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '0'; e.currentTarget.style.color = '#52525b'; }}
        title="Delete chat">
        🗑
      </button>
    </motion.div>
  );
}

export default function Sidebar({ chats, activeChat, onSelectChat, onNewChat, onDeleteChat, isLoading }: SidebarProps) {
  const { user, logout } = useAuth();
  const { today, yesterday, older } = groupChats(chats);

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'U';

  return (
    <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#111113', borderRight: '1px solid rgba(255,255,255,0.06)', height: '100%' }}>

      {/* Logo */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <a href="/" className="nova-logo" style={{ textDecoration: 'none', fontSize: 15, marginBottom: 12, display: 'flex' }}>
          <div className="nova-logo-icon" style={{ width: 28, height: 28, fontSize: 13, borderRadius: 8 }}>N</div>
          <span>NOVA AI</span>
        </a>
        {/* New Chat button */}
        <button onClick={onNewChat} className="btn-primary" style={{ width: '100%', padding: '9px 12px', fontSize: 13, borderRadius: 10, justifyContent: 'center' }}>
          + New Chat
        </button>
      </div>

      {/* Chat list */}
      <div className="scrollbar-thin" style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {isLoading && (
          <div style={{ textAlign: 'center', padding: 24, color: '#3f3f46', fontSize: 13 }}>Loading chats…</div>
        )}
        {!isLoading && chats.length === 0 && (
          <div style={{ textAlign: 'center', padding: 24, color: '#3f3f46', fontSize: 13 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
            No chats yet.<br />Start a new conversation!
          </div>
        )}

        {today.length > 0 && (
          <>
            <p style={{ color: '#3f3f46', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 12px 4px' }}>Today</p>
            <AnimatePresence>
              {today.map(c => <ChatItem key={c._id} chat={c} active={activeChat?._id === c._id} onSelect={() => onSelectChat(c)} onDelete={() => onDeleteChat(c._id)} />)}
            </AnimatePresence>
          </>
        )}
        {yesterday.length > 0 && (
          <>
            <p style={{ color: '#3f3f46', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 12px 4px' }}>Yesterday</p>
            <AnimatePresence>
              {yesterday.map(c => <ChatItem key={c._id} chat={c} active={activeChat?._id === c._id} onSelect={() => onSelectChat(c)} onDelete={() => onDeleteChat(c._id)} />)}
            </AnimatePresence>
          </>
        )}
        {older.length > 0 && (
          <>
            <p style={{ color: '#3f3f46', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 12px 4px' }}>Earlier</p>
            <AnimatePresence>
              {older.map(c => <ChatItem key={c._id} chat={c} active={activeChat?._id === c._id} onSelect={() => onSelectChat(c)} onDelete={() => onDeleteChat(c._id)} />)}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* User panel */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
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
          style={{ background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', fontSize: 16, padding: '4px', borderRadius: 6, transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
          onMouseLeave={e => (e.currentTarget.style.color = '#52525b')}>
          ⎋
        </button>
      </div>
    </div>
  );
}
