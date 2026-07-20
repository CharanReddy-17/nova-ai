'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Copy, Check, X, FileText, FileCode } from 'lucide-react';
import { Chat, Message } from '@/services/chatService';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  chat: Chat | null;
  messages: Message[];
}

export default function ExportModal({ open, onClose, chat, messages }: ExportModalProps) {
  const [copied, setCopied] = useState(false);

  if (!chat) return null;

  function toMarkdown() {
    const lines: string[] = [
      `# ${chat!.title}`,
      `*Exported from NOVA AI · ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}*`,
      '',
      '---',
      '',
    ];
    messages.forEach(m => {
      const role = m.role === 'user' ? '**You**' : '**NOVA AI**';
      const time = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      lines.push(`### ${role} · ${time}`);
      lines.push('');
      lines.push(m.content);
      lines.push('');
      lines.push('---');
      lines.push('');
    });
    lines.push('*Powered by NOVA AI — nova-ai-ruddy-mu.vercel.app*');
    return lines.join('\n');
  }

  function toText() {
    return messages.map(m => {
      const role = m.role === 'user' ? 'You' : 'NOVA AI';
      const time = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `[${time}] ${role}:\n${m.content}`;
    }).join('\n\n---\n\n');
  }

  function download(content: string, ext: string) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nova-ai-${(chat!.title || 'chat').replace(/[^a-z0-9]/gi, '-').toLowerCase()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(toMarkdown()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const msgCount = messages.length;
  const wordCount = messages.reduce((acc, m) => acc + m.content.split(' ').length, 0);
  const charCount = messages.reduce((acc, m) => acc + m.content.length, 0);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, backdropFilter: 'blur(4px)' }}
          />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{
              position: 'fixed', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%', maxWidth: 440, zIndex: 201,
              background: '#111113', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 18, overflow: 'hidden',
              boxShadow: '0 40px 80px rgba(0,0,0,0.8)',
            }}
          >
            {/* Header */}
            <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#fafafa' }}>Export Conversation</h3>
                <p style={{ margin: 0, fontSize: 12, color: '#52525b', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>
                  {chat.title}
                </p>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525b', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {[
                { label: 'Messages', value: msgCount },
                { label: 'Words', value: wordCount.toLocaleString() },
                { label: 'Characters', value: charCount.toLocaleString() },
              ].map((s, i) => (
                <div key={s.label} style={{
                  flex: 1, padding: '14px 16px', textAlign: 'center',
                  borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                }}>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#fafafa' }}>{s.value}</p>
                  <p style={{ margin: 0, fontSize: 11, color: '#52525b' }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Export options */}
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Markdown */}
              <button
                onClick={() => download(toMarkdown(), 'md')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                  background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)',
                  borderRadius: 12, cursor: 'pointer', color: '#fff', textAlign: 'left',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,58,237,0.15)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,58,237,0.08)'; }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileCode size={18} style={{ color: '#a78bfa' }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Markdown (.md)</p>
                  <p style={{ margin: 0, fontSize: 11, color: '#71717a' }}>Formatted with headers, bold, code blocks</p>
                </div>
                <Download size={15} style={{ marginLeft: 'auto', color: '#52525b', flexShrink: 0 }} />
              </button>

              {/* Plain text */}
              <button
                onClick={() => download(toText(), 'txt')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12, cursor: 'pointer', color: '#fff', textAlign: 'left',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)'; }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText size={18} style={{ color: '#71717a' }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Plain Text (.txt)</p>
                  <p style={{ margin: 0, fontSize: 11, color: '#71717a' }}>Simple, readable text format</p>
                </div>
                <Download size={15} style={{ marginLeft: 'auto', color: '#52525b', flexShrink: 0 }} />
              </button>

              {/* Copy to clipboard */}
              <button
                onClick={copyToClipboard}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '11px', background: 'transparent', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10, cursor: 'pointer', color: copied ? '#10b981' : '#71717a',
                  fontSize: 13, fontWeight: 500, transition: 'all 0.2s',
                }}
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? 'Copied to clipboard!' : 'Copy as Markdown'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
