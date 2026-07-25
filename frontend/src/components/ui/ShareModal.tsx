'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Link, Globe, Lock, X, ExternalLink } from 'lucide-react';
import { chatService } from '@/services/chatService';

interface Props {
  open:      boolean;
  onClose:   () => void;
  chatId:    string;
  chatTitle: string;
  isPublic:  boolean;
  shareId:   string | null;
  onShareChange: (isPublic: boolean, shareId: string | null) => void;
}

export default function ShareModal({ open, onClose, chatId, chatTitle, isPublic, shareId, onShareChange }: Props) {
  const [loading, setLoading]   = useState(false);
  const [copied,  setCopied]    = useState(false);
  const [error,   setError]     = useState('');

  const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://nova-ai-ruddy-mu.vercel.app';
  const shareUrl    = shareId ? `${frontendUrl}/share/${shareId}` : '';

  const handleEnable = async () => {
    setLoading(true); setError('');
    try {
      const { shareId: id } = await chatService.shareChat(chatId);
      onShareChange(true, id);
    } catch { setError('Failed to create share link. Please try again.'); }
    finally   { setLoading(false); }
  };

  const handleDisable = async () => {
    setLoading(true); setError('');
    try {
      await chatService.unshareChat(chatId);
      onShareChange(false, null);
    } catch { setError('Failed to remove share link.'); }
    finally  { setLoading(false); }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="share-overlay"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={e => e.stopPropagation()}
            style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 460, boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(168,85,247,0.15))', border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Link size={18} style={{ color: '#a855f7' }} />
                </div>
                <div>
                  <h2 style={{ color: '#fafafa', fontSize: 16, fontWeight: 700, margin: 0 }}>Share Conversation</h2>
                  <p style={{ color: '#52525b', fontSize: 12, margin: '2px 0 0' }}>Anyone with the link can view</p>
                </div>
              </div>
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#71717a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>

            {/* Chat title preview */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '10px 14px', marginBottom: 20 }}>
              <p style={{ fontSize: 11, color: '#52525b', marginBottom: 2 }}>Conversation</p>
              <p style={{ fontSize: 14, color: '#e4e4e7', fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chatTitle || 'Untitled Chat'}</p>
            </div>

            {/* Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: isPublic ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isPublic ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 12, marginBottom: 16, transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {isPublic
                  ? <Globe size={18} style={{ color: '#a855f7' }} />
                  : <Lock  size={18} style={{ color: '#52525b' }} />}
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: isPublic ? '#e4e4e7' : '#71717a', margin: 0 }}>
                    {isPublic ? 'Public link enabled' : 'Private — only you can see this'}
                  </p>
                  <p style={{ fontSize: 12, color: '#52525b', margin: '2px 0 0' }}>
                    {isPublic ? 'Anyone with the link can read this conversation' : 'Enable sharing to create a public link'}
                  </p>
                </div>
              </div>

              {/* Toggle switch */}
              <button
                onClick={isPublic ? handleDisable : handleEnable}
                disabled={loading}
                style={{
                  width: 44, height: 24, borderRadius: 12, border: 'none', cursor: loading ? 'default' : 'pointer',
                  background: isPublic ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : 'rgba(255,255,255,0.1)',
                  position: 'relative', transition: 'all 0.2s', flexShrink: 0, opacity: loading ? 0.6 : 1,
                }}
              >
                <span style={{
                  position: 'absolute', top: 3, left: isPublic ? 23 : 3,
                  width: 18, height: 18, borderRadius: '50%', background: '#fff',
                  transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                }} />
              </button>
            </div>

            {/* Link box — shown when public */}
            <AnimatePresence>
              {isPublic && shareUrl && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px', overflow: 'hidden' }}>
                      <p style={{ fontSize: 12, color: '#71717a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'JetBrains Mono, monospace' }}>
                        {shareUrl}
                      </p>
                    </div>
                    <button
                      onClick={copyLink}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(124,58,237,0.15)', border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'rgba(124,58,237,0.3)'}`, borderRadius: 10, cursor: 'pointer', color: copied ? '#10b981' : '#a855f7', fontSize: 13, fontWeight: 600, transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>

                  <a href={shareUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#71717a', textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#a78bfa')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#71717a')}
                  >
                    <ExternalLink size={12} /> Open in new tab
                  </a>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            {error && (
              <p style={{ fontSize: 12, color: '#ef4444', marginTop: 12, padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </p>
            )}

            {/* Footer note */}
            <p style={{ fontSize: 11, color: '#3f3f46', marginTop: 16, lineHeight: 1.5 }}>
              🔒 The public link shows a read-only view. Viewers cannot reply or see your account.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
