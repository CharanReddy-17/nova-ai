'use client';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Pin,
  Trash2,
  LogOut,
  Plus,
  MessageSquare,
  Folder,
  ChevronRight,
  Sun,
  Moon,
  Edit3,
  FolderPlus,
  X,
} from 'lucide-react';
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
  if (diff < 3600)  return Math.floor(diff / 60) + 'm';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h';
  return Math.floor(diff / 86400) + 'd';
}

// ── Chat Item ────────────────────────────────────────────────────────────────
function ChatItem({
  chat,
  active,
  isPinned,
  onSelect,
  onDelete,
  onPin,
  onRename,
  onMoveToFolder,
  folders,
}: {
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
  const [hovered,   setHovered]   = useState(false);
  const [editing,   setEditing]   = useState(false);
  const [draft,     setDraft]     = useState(chat.title || 'New Chat');
  const [ctxMenu,   setCtxMenu]   = useState<{ x: number; y: number } | null>(null);
  const [folderSub, setFolderSub] = useState(false);
  const [newFolder, setNewFolder] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

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
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => { if (!editing) onSelect(); }}
        onContextMenu={e => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY }); }}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && !editing && onSelect()}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          padding: '7px 10px',
          borderRadius: 8,
          cursor: editing ? 'default' : 'pointer',
          background: active ? 'var(--surface2)' : hovered ? 'rgba(255,255,255,0.03)' : 'transparent',
          border: active ? '1px solid var(--border)' : '1px solid transparent',
          transition: 'all 0.12s ease',
          userSelect: 'none',
          marginBottom: 2,
          position: 'relative',
        }}
      >
        <div style={{ flexShrink: 0, color: isPinned ? 'var(--primary)' : 'var(--muted2)', display: 'flex', alignItems: 'center' }}>
          {isPinned ? <Pin size={13} fill="currentColor" /> : <MessageSquare size={13} />}
        </div>

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
                width: '100%',
                background: 'var(--surface)',
                border: '1px solid var(--primary)',
                borderRadius: 4,
                padding: '2px 6px',
                color: 'var(--text)',
                fontSize: 13,
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          ) : (
            <p
              style={{
                color: active ? 'var(--text)' : 'var(--muted)',
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              onDoubleClick={e => { e.stopPropagation(); setEditing(true); setDraft(chat.title || 'New Chat'); }}
              title={chat.title || 'New Chat'}
            >
              {chat.title || 'New Chat'}
            </p>
          )}
        </div>

        {/* Hover action shortcuts */}
        <AnimatePresence>
          {hovered && !editing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', gap: 2, flexShrink: 0 }}
            >
              <button
                type="button"
                onClick={e => { e.stopPropagation(); onPin(); }}
                title={isPinned ? 'Unpin' : 'Pin'}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '3px 4px',
                  borderRadius: 4,
                  color: isPinned ? 'var(--primary)' : 'var(--muted2)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Pin size={12} fill={isPinned ? 'currentColor' : 'none'} />
              </button>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); onDelete(); }}
                title="Delete chat"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '3px 4px',
                  borderRadius: 4,
                  color: 'var(--muted2)',
                  display: 'flex',
                  alignItems: 'center',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted2)')}
              >
                <Trash2 size={12} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Context Menu ── */}
      {ctxMenu && (
        <div
          onMouseDown={e => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: ctxMenu.y,
            left: ctxMenu.x,
            zIndex: 200,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '4px 0',
            minWidth: 160,
            boxShadow: 'var(--shadow-lg)',
            fontSize: 12.5,
          }}
        >
          <button
            type="button"
            onClick={() => { onPin(); setCtxMenu(null); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '7px 12px',
              background: 'none',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              color: 'var(--text)',
              fontSize: 12.5,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <Pin size={13} /> {isPinned ? 'Unpin' : 'Pin'}
          </button>

          <button
            type="button"
            onClick={() => { setEditing(true); setCtxMenu(null); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '7px 12px',
              background: 'none',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              color: 'var(--text)',
              fontSize: 12.5,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <Edit3 size={13} /> Rename
          </button>

          <div style={{ height: 1, background: 'var(--border)', margin: '3px 0' }} />

          {/* Folder Submenu */}
          <button
            type="button"
            onClick={() => setFolderSub(v => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '7px 12px',
              background: 'none',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              color: 'var(--text)',
              fontSize: 12.5,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FolderPlus size={13} /> Move to folder
            </span>
            <ChevronRight size={12} style={{ transform: folderSub ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
          </button>

          {folderSub && (
            <div style={{ paddingLeft: 8, paddingBottom: 4 }}>
              {chat.folder && (
                <button
                  type="button"
                  onClick={() => { onMoveToFolder(null); setCtxMenu(null); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    width: '100%',
                    padding: '5px 12px',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: 'var(--muted)',
                    fontSize: 12,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <X size={11} /> Remove from folder
                </button>
              )}
              {folders.filter(f => f !== chat.folder).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => { onMoveToFolder(f); setCtxMenu(null); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    width: '100%',
                    padding: '5px 12px',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: 'var(--text)',
                    fontSize: 12,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <Folder size={11} /> {f}
                </button>
              ))}
              <div style={{ display: 'flex', gap: 4, padding: '4px 8px' }}>
                <input
                  value={newFolder}
                  onChange={e => setNewFolder(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newFolder.trim()) {
                      onMoveToFolder(newFolder.trim());
                      setNewFolder('');
                      setCtxMenu(null);
                    }
                  }}
                  placeholder="New folder…"
                  autoFocus
                  style={{
                    flex: 1,
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: 4,
                    padding: '3px 6px',
                    color: 'var(--text)',
                    fontSize: 11.5,
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          )}

          <div style={{ height: 1, background: 'var(--border)', margin: '3px 0' }} />

          <button
            type="button"
            onClick={() => { onDelete(); setCtxMenu(null); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '7px 12px',
              background: 'none',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              color: '#ef4444',
              fontSize: 12.5,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      )}
    </>
  );
}

function SectionLabel({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        color: 'var(--muted2)',
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        padding: '10px 10px 4px',
      }}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}

// ── Collapsible Folder Section ─────────────────────────────────────────────────
function FolderSection({
  label,
  chats,
  renderItem,
}: {
  label: string;
  chats: Chat[];
  renderItem: (c: Chat) => React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div style={{ marginBottom: 4 }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          width: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '6px 10px 4px',
          color: 'var(--muted)',
          fontSize: 11.5,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        <ChevronRight
          size={11}
          style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }}
        />
        <Folder size={12} color="var(--primary)" />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        <span style={{ fontSize: 10, color: 'var(--muted2)', marginLeft: 'auto' }}>{chats.length}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', paddingLeft: 6 }}
          >
            {chats.map(renderItem)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Sidebar ───────────────────────────────────────────────────────────────
export default function Sidebar({
  chats,
  activeChat,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onUpdateChats,
  isLoading,
  isOpen,
  onClose,
}: SidebarProps) {
  const { user, logout }  = useAuth();
  const { theme, toggle } = useTheme();
  const isMobile          = useIsMobile();
  const [searchOpen, setSearchOpen] = useState(false);

  const allFolders = Array.from(new Set(chats.map(c => c.folder).filter(Boolean))) as string[];
  const inFolder   = (f: string) => chats.filter(c => c.folder === f);
  const noFolder   = chats.filter(c => !c.folder);
  const { pinned: pinnedNF, today: todayNF, yesterday: yesterdayNF, older: olderNF } = groupChats(noFolder);
  const initials   = user?.username ? user.username.slice(0, 2).toUpperCase() : 'U';

  const handlePin = useCallback(async (chat: Chat) => {
    try {
      const updated = await chatService.updateChat(chat._id, { isPinned: !chat.isPinned });
      onUpdateChats(chats.map(c => c._id === chat._id ? { ...c, isPinned: updated.isPinned } : c));
    } catch { /* silent */ }
  }, [chats, onUpdateChats]);

  const handleRename = useCallback(async (chat: Chat, newTitle: string) => {
    try {
      await chatService.updateChat(chat._id, { title: newTitle });
      onUpdateChats(chats.map(c => c._id === chat._id ? { ...c, title: newTitle } : c));
    } catch { /* silent */ }
  }, [chats, onUpdateChats]);

  const handleMoveToFolder = useCallback(async (chat: Chat, folder: string | null) => {
    try {
      await chatService.moveToFolder(chat._id, folder);
      onUpdateChats(chats.map(c => c._id === chat._id ? { ...c, folder } : c));
    } catch { /* silent */ }
  }, [chats, onUpdateChats]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const renderGroup = (group: Chat[], isPinned: boolean) =>
    group.map(c => (
      <ChatItem
        key={c._id}
        chat={c}
        active={activeChat?._id === c._id}
        isPinned={isPinned}
        onSelect={() => {
          onSelectChat(c);
          if (isMobile) onClose?.();
        }}
        onDelete={() => onDeleteChat(c._id)}
        onPin={() => handlePin(c)}
        onRename={name => handleRename(c, name)}
        onMoveToFolder={folder => handleMoveToFolder(c, folder)}
        folders={allFolders}
      />
    ));

  return (
    <>
      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        chats={chats}
        onSelectChat={chat => {
          onSelectChat(chat);
          setSearchOpen(false);
          if (isMobile) onClose?.();
        }}
      />

      {isMobile && isOpen && (
        <div className="sidebar-overlay" style={{ display: 'block' }} onClick={onClose} />
      )}

      <aside
        className={isMobile ? `sidebar-drawer${isOpen ? ' open' : ''}` : ''}
        style={{
          width: 260,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          height: '100%',
        }}
      >
        {/* ── Top Header Actions ── */}
        <div style={{ padding: '12px 10px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  background: 'var(--primary)',
                  color: '#111113',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                N
              </div>
              <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                Nova
              </span>
            </a>

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              title="Search conversations (Ctrl+K)"
              style={{
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '4px 7px',
                cursor: 'pointer',
                color: 'var(--muted)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
              }}
            >
              <Search size={12} />
              <span style={{ fontFamily: 'monospace', fontSize: 10 }}>⌘K</span>
            </button>
          </div>

          {/* New Chat Button */}
          <button
            type="button"
            onClick={() => {
              onNewChat();
              if (isMobile) onClose?.();
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: 13,
              borderRadius: 8,
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              cursor: 'pointer',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--border2)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.background = 'var(--surface2)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Plus size={14} color="var(--primary)" />
              <span>New chat</span>
            </div>
            <span style={{ fontSize: 10, color: 'var(--muted2)', fontFamily: 'monospace' }}>Alt+N</span>
          </button>
        </div>

        {/* ── Conversation List ── */}
        <div className="scrollbar-thin" style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
          {isLoading && (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--muted2)', fontSize: 12.5 }}>
              Loading chats…
            </div>
          )}

          {!isLoading && chats.length === 0 && (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--muted2)', fontSize: 12.5 }}>
              <MessageSquare size={20} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              No conversations yet.<br />Ask anything to start.
            </div>
          )}

          {/* Folders */}
          {allFolders.map(folder => (
            <FolderSection
              key={folder}
              label={folder}
              chats={inFolder(folder)}
              renderItem={c => (
                <ChatItem
                  key={c._id}
                  chat={c}
                  active={activeChat?._id === c._id}
                  isPinned={c.isPinned}
                  onSelect={() => {
                    onSelectChat(c);
                    if (isMobile) onClose?.();
                  }}
                  onDelete={() => onDeleteChat(c._id)}
                  onPin={() => handlePin(c)}
                  onRename={name => handleRename(c, name)}
                  onMoveToFolder={f => handleMoveToFolder(c, f)}
                  folders={allFolders}
                />
              )}
            />
          ))}

          {pinnedNF.length > 0 && (
            <>
              <SectionLabel label="Pinned" icon={<Pin size={11} />} />
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
              <SectionLabel label="Previous" />
              <AnimatePresence>{renderGroup(olderNF, false)}</AnimatePresence>
            </>
          )}
        </div>

        {/* ── User Footer Profile ── */}
        <div
          style={{
            padding: '10px 12px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 9,
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text)',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                color: 'var(--text)',
                fontSize: 12.5,
                fontWeight: 600,
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.username || 'Account'}
            </p>
            <p
              style={{
                color: 'var(--muted2)',
                fontSize: 11,
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.email || ''}
            </p>
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggle}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              cursor: 'pointer',
              padding: 5,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={logout}
            title="Sign out"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              cursor: 'pointer',
              padding: 5,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>
    </>
  );
}
