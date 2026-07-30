'use client';
import React, { useState, useCallback, useEffect, useRef } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { Search, Pin, Trash2, LogOut, Plus, Settings } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Chat, chatService } from '@/services/chatService';
import { useIsMobile } from '@/hooks/useMediaQuery';
import SearchModal from '@/components/ui/SearchModal';

interface SidebarProps {
  chats:         Chat[];
  activeChat:    Chat | null;
  onSelectChat:  (chat: Chat) => void;
  onNewChat:     () => void;
  onDeleteChat:  (id: string) => void;
  onUpdateChats: (chats: Chat[]) => void;
  isLoading:     boolean;
  // Mobile drawer
  isOpen?:       boolean;
  onClose?:      () => void;
}

function groupChats(chats: Chat[]) {
  const pinned   = chats.filter(c => c.isPinned);
  const unpinned = chats.filter(c => !c.isPinned);
  const now      = new Date();
  const today: Chat[] = [], yesterday: Chat[] = [], older: Chat[] = [];
  unpinned.forEach(c => {
    const diff = (now.getTime() - new Date(c.updatedAt).getTime()) / 86400000;
    if (diff < 1)      today.push(c);
    else if (diff < 2) yesterday.push(c);
    else               older.push(c);
  });
  return { pinned, today, yesterday, older };
}

function formatAgo(ts: string) {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

// ── Rename-in-place chat item (with right-click context menu) ────────────────────
function ChatItem({ chat, active, isPinned, onSelect, onDelete, onPin, onRename, onMoveToFolder, folders }: {
  chat:           Chat;
  active:         boolean;
  isPinned:       boolean;
  onSelect:       () => void;
  onDelete:       () => void;
  onPin:          () => void;
  onRename:       (name: string) => void;
  onMoveToFolder: (folder: string | null) => void;
  folders:        string[];
}) {
  const [hovered,  setHovered]  = useState(false);
  const [editing,  setEditing]  = useState(false);
  const [draft,    setDraft]    = useState(chat.title || 'New Chat');
  const [ctxMenu,  setCtxMenu]  = useState<{ x: number; y: number } | null>(null);
  const [folderSub, setFolderSub] = useState(false);
  const [newFolder, setNewFolder] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

  // Close context menu on outside click
  useEffect(() => {
    if (!ctxMenu) return;
    const close = () => { setCtxMenu(null); setFolderSub(false); };
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, [ctxMenu]);

  const commitRename = () => {
    setEditing(false);
    const name = draft.trim() || chat.title;
    setDraft(name);
    if (name !== chat.title) onRename(name);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onClick={() => { if (!editing) onSelect(); }}
      onContextMenu={e => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY }); }}
      role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && !editing && onSelect()}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 10px', borderRadius: 9, cursor: editing ? 'default' : 'pointer',
        background: active  ? 'rgba(124,58,237,0.12)' : hovered ? 'var(--border)' : 'transparent',
        borderLeft: active  ? '2px solid #7c3aed' : '2px solid transparent',
        transition: 'all 0.15s', userSelect: 'none', marginBottom: 1, position: 'relative',
      }}
    >
      <span style={{ fontSize: 12, flexShrink: 0 }}>{isPinned ? '📌' : '💬'}</span>

      <div style={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); commitRename(); }
              if (e.key === 'Escape') { setEditing(false); setDraft(chat.title); }
            }}
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', background: 'var(--surface)', border: '1px solid rgba(124,58,237,0.5)',
              borderRadius: 5, padding: '2px 6px', color: 'var(--text)', fontSize: 13,
              outline: 'none', fontFamily: 'inherit',
            }}
          />
        ) : (
          <>
            <p style={{ color: active ? '#c4b5fd' : 'var(--muted)', fontSize: 13, fontWeight: active ? 500 : 400, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              onDoubleClick={e => { e.stopPropagation(); setEditing(true); setDraft(chat.title || 'New Chat'); }}
              title="Double-click to rename"
            >
              {chat.title || 'New Chat'}
            </p>
            <p style={{ color: 'var(--muted3, #3f3f46)', fontSize: 11, margin: 0 }}>{formatAgo(chat.updatedAt)}</p>
          </>
        )}
      </div>

      <AnimatePresence>
        {hovered && !editing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
            <button
              onClick={e => { e.stopPropagation(); onPin(); }}
              title={isPinned ? 'Unpin' : 'Pin'}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px 4px', borderRadius: 5, color: isPinned ? '#f59e0b' : 'var(--muted2)', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f59e0b')}
              onMouseLeave={e => (e.currentTarget.style.color = isPinned ? '#f59e0b' : 'var(--muted2)')}
            >
              <Pin size={12} fill={isPinned ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDelete(); }}
              title="Delete"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px 4px', borderRadius: 5, color: 'var(--muted2)', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted2)')}
            >
              <Trash2 size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>

    {/* ── Right-click context menu ── */}
    {ctxMenu && (
      <div
        onMouseDown={e => e.stopPropagation()}
        style={{ position: 'fixed', top: ctxMenu.y, left: ctxMenu.x, zIndex: 200, background: 'var(--bg2, #111113)', border: '1px solid var(--border)', borderRadius: 10, padding: '5px 0', minWidth: 170, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', fontSize: 13 }}
      >
        {[{ label: isPinned ? '📌 Unpin' : '📌 Pin',   action: () => { onPin(); setCtxMenu(null); } },
           { label: '✏️ Rename',                        action: () => { setEditing(true); setCtxMenu(null); } },
           { label: '🗑 Delete',                        action: () => { onDelete(); setCtxMenu(null); }, danger: true },
        ].map(item => (
          <button key={item.label} onClick={item.action}
            style={{ display: 'block', width: '100%', padding: '7px 14px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: (item as any).danger ? '#ef4444' : 'var(--muted)', fontFamily: 'inherit', fontSize: 13, transition: 'background 0.1s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--border)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >{item.label}</button>
        ))}

        {/* Folder submenu */}
        <div style={{ borderTop: '1px solid var(--border)', marginTop: 3 }}>
          <button onClick={() => setFolderSub(v => !v)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '7px 14px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: 'var(--muted)', fontFamily: 'inherit', fontSize: 13 }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--border)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <span>📁 Move to folder</span>
            <span style={{ fontSize: 10 }}>{folderSub ? '▲' : '▶'}</span>
          </button>

          {folderSub && (
            <div style={{ paddingLeft: 8, paddingBottom: 4 }}>
              {/* Remove from folder */}
              {chat.folder && (
                <button onClick={() => { onMoveToFolder(null); setCtxMenu(null); }}
                  style={{ display: 'block', width: '100%', padding: '5px 14px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: '#71717a', fontFamily: 'inherit', fontSize: 12 }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--border)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >✕ Remove from folder</button>
              )}
              {/* Existing folders */}
              {folders.filter(f => f !== chat.folder).map(f => (
                <button key={f} onClick={() => { onMoveToFolder(f); setCtxMenu(null); }}
                  style={{ display: 'block', width: '100%', padding: '5px 14px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: 'var(--muted)', fontFamily: 'inherit', fontSize: 12 }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--border)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >📁 {f}</button>
              ))}
              {/* New folder input */}
              <div style={{ display: 'flex', gap: 4, padding: '4px 8px' }}>
                <input
                  value={newFolder}
                  onChange={e => setNewFolder(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && newFolder.trim()) { onMoveToFolder(newFolder.trim()); setNewFolder(''); setCtxMenu(null); } }}
                  placeholder="New folder…"
                  autoFocus
                  style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 7px', color: 'var(--text)', fontSize: 12, outline: 'none', fontFamily: 'inherit' }}
                />
                <button onClick={() => { if (newFolder.trim()) { onMoveToFolder(newFolder.trim()); setNewFolder(''); setCtxMenu(null); } }}
                  style={{ background: 'rgba(124,58,237,0.2)', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#a855f7', fontSize: 12, fontFamily: 'inherit' }}>+</button>
              </div>
            </div>
          )}
        </div>
      </div>
    )}
  </>);
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p style={{ color: 'var(--muted3, #3f3f46)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '10px 10px 4px', margin: 0 }}>
      {label}
    </p>
  );
}

// ── Collapsible folder section ────────────────────────────────────────────────
function FolderSection({ label, chats, renderItem }: { label: string; chats: Chat[]; renderItem: (c: Chat) => React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ marginBottom: 2 }}>
      <button onClick={() => setOpen(v => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 10px 4px', color: 'var(--muted2)', fontFamily: 'inherit' }}
      >
        <span style={{ fontSize: 11, transition: 'transform 0.2s', display: 'inline-block', transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
        <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>📁 {label}</span>
        <span style={{ fontSize: 10, color: 'var(--muted3,#3f3f46)', marginLeft: 'auto' }}>{chats.length}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
            {chats.map(renderItem)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



// ── Main sidebar ──────────────────────────────────────────────────────────────
export default function Sidebar({ chats, activeChat, onSelectChat, onNewChat, onDeleteChat, onUpdateChats, isLoading, isOpen, onClose }: SidebarProps) {
  const { user, logout }    = useAuth();
  const { theme, toggle }   = useTheme();
  const isMobile            = useIsMobile();
  const [searchOpen, setSearchOpen] = useState(false);
  const { pinned, today, yesterday, older } = groupChats(chats);
  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'U';

  // All unique folder names across chats
  const allFolders = Array.from(new Set(chats.map(c => c.folder).filter(Boolean))) as string[];
  // Chats that are in a folder (not shown in date sections)
  const inFolder = (f: string) => chats.filter(c => c.folder === f);
  // Chats with no folder (used in date sections)
  const noFolder = chats.filter(c => !c.folder);
  const { pinned: pinnedNF, today: todayNF, yesterday: yesterdayNF, older: olderNF } = groupChats(noFolder);

  // Pin toggle
  const handlePin = useCallback(async (chat: Chat) => {
    try {
      const updated = await chatService.updateChat(chat._id, { isPinned: !chat.isPinned });
      onUpdateChats(chats.map(c => c._id === chat._id ? { ...c, isPinned: updated.isPinned } : c));
    } catch { /* silent */ }
  }, [chats, onUpdateChats]);

  // Rename
  const handleRename = useCallback(async (chat: Chat, newTitle: string) => {
    try {
      await chatService.updateChat(chat._id, { title: newTitle });
      onUpdateChats(chats.map(c => c._id === chat._id ? { ...c, title: newTitle } : c));
    } catch { /* silent */ }
  }, [chats, onUpdateChats]);

  // Move to folder
  const handleMoveToFolder = useCallback(async (chat: Chat, folder: string | null) => {
    try {
      await chatService.moveToFolder(chat._id, folder);
      onUpdateChats(chats.map(c => c._id === chat._id ? { ...c, folder } : c));
    } catch { /* silent */ }
  }, [chats, onUpdateChats]);

  // Ctrl+F shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); setSearchOpen(true); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Close drawer on chat select (mobile)
  const handleSelectChat = (chat: Chat) => {
    onSelectChat(chat);
    if (isMobile) onClose?.();
  };
  const handleNewChat = () => {
    onNewChat();
    if (isMobile) onClose?.();
  };

  const renderGroup = (group: Chat[], isPinned: boolean) =>
    group.map(c => (
      <ChatItem key={c._id} chat={c} active={activeChat?._id === c._id} isPinned={isPinned}
        onSelect={() => onSelectChat(c)}
        onDelete={() => onDeleteChat(c._id)}
        onPin={() => handlePin(c)}
        onRename={(name) => handleRename(c, name)}
        onMoveToFolder={(folder) => handleMoveToFolder(c, folder)}
        folders={allFolders}
      />
    ));

  return (
    <>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} chats={chats}
        onSelectChat={chat => { onSelectChat(chat); setSearchOpen(false); if (isMobile) onClose?.(); }} />

      {/* Mobile backdrop */}
      {isMobile && isOpen && (
        <div className="sidebar-overlay" style={{ display: 'block' }} onClick={onClose} />
      )}

      <div
        className={isMobile ? `sidebar-drawer${isOpen ? ' open' : ''}` : ''}
        style={{
          width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column',
          background: 'var(--bg2, #111113)', borderRight: '1px solid var(--border)', height: '100%',
        }}
      >

        {/* ── Header ── */}
        <div style={{ padding: '14px 12px 10px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#fff' }}>N</div>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>NOVA AI</span>
            </a>
            <button onClick={() => setSearchOpen(true)} title="Search (Ctrl+F)"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 8px', cursor: 'pointer', color: 'var(--muted2)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, transition: 'all 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--muted)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted2)')}
            >
              <Search size={13} />
              <span style={{ fontFamily: 'monospace', fontSize: 10 }}>⌃F</span>
            </button>
          </div>

          <button onClick={onNewChat} style={{
            width: '100%', padding: '9px 12px', fontSize: 13, borderRadius: 10,
            background: 'linear-gradient(135deg,#7c3aed,#a855f7)', border: 'none',
            color: '#fff', cursor: 'pointer', fontWeight: 600, display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'opacity 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <Plus size={15} /> New Chat
          </button>
        </div>

        {/* ── Chat list ── */}
        <div className="scrollbar-thin" style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
          {isLoading && (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--muted2)', fontSize: 13 }}>Loading chats…</div>
          )}
          {!isLoading && chats.length === 0 && (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--muted2)', fontSize: 13 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
              No chats yet.<br />Start a new conversation!
            </div>
          )}

          {/* ── Folder sections ── */}
          {allFolders.map(folder => (
            <FolderSection key={folder} label={folder} chats={inFolder(folder)}
              renderItem={c => (
                <ChatItem key={c._id} chat={c} active={activeChat?._id === c._id} isPinned={c.isPinned}
                  onSelect={() => onSelectChat(c)}
                  onDelete={() => onDeleteChat(c._id)}
                  onPin={() => handlePin(c)}
                  onRename={(name) => handleRename(c, name)}
                  onMoveToFolder={(f) => handleMoveToFolder(c, f)}
                  folders={allFolders}
                />
              )}
            />
          ))}

          {pinnedNF.length > 0 && (
            <>
              <SectionLabel label="📌 Pinned" />
              <AnimatePresence>{renderGroup(pinnedNF, true)}</AnimatePresence>
            </>
          )}
          {todayNF.length > 0 && (
            <>
              <SectionLabel label="Today" />
              <AnimatePresence>{renderGroup(todayNF, false)}</AnimatePresence>
            </>
          )}
          {yesterdayNF.length > 0 && (
            <>
              <SectionLabel label="Yesterday" />
              <AnimatePresence>{renderGroup(yesterdayNF, false)}</AnimatePresence>
            </>
          )}
          {olderNF.length > 0 && (
            <>
              <SectionLabel label="Earlier" />
              <AnimatePresence>{renderGroup(olderNF, false)}</AnimatePresence>
            </>
          )}
        </div>

        {/* ── User panel ── */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.username || 'User'}
            </p>
            <p style={{ color: 'var(--muted2)', fontSize: 11, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email || ''}
            </p>
          </div>

          {/* Theme toggle */}
          <button onClick={toggle} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            style={{ background: 'none', border: 'none', color: 'var(--muted2)', cursor: 'pointer', padding: 5, borderRadius: 7, transition: 'all 0.15s', fontSize: 15 }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          <button onClick={logout} title="Sign out"
            style={{ background: 'none', border: 'none', color: 'var(--muted2)', cursor: 'pointer', padding: 5, borderRadius: 7, transition: 'all 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted2)'; (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </>
  );
}
