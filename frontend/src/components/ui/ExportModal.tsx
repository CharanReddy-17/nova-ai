'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, X } from 'lucide-react';
import { Message } from '@/services/chatService';

interface ExportModalProps {
  open:       boolean;
  onClose:    () => void;
  messages:   Message[];
  chatTitle?: string;
}

export default function ExportModal({ open, onClose, messages, chatTitle }: ExportModalProps) {
  const [copied,  setCopied]  = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  const title = chatTitle || 'Chat';
  const date  = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  /* ── Formatters ──────────────────────────────────────────────────────────── */
  function toMarkdown() {
    const lines = [`# ${title}`, `*Exported from NOVA AI · ${date}*`, '', '---', ''];
    messages.forEach(m => {
      const role = m.role === 'user' ? '**You**' : '**NOVA AI**';
      const time = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      lines.push(`### ${role} · ${time}`, '', m.imageUrl ? `![Image](${m.imageUrl})` : m.content, '', '---', '');
    });
    lines.push('*Powered by NOVA AI*');
    return lines.join('\n');
  }

  function toText() {
    return messages.map(m => {
      const role = m.role === 'user' ? 'You' : 'NOVA AI';
      const time = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `[${time}] ${role}:\n${m.imageUrl ? '[Generated Image]' : m.content}`;
    }).join('\n\n---\n\n');
  }

  function toHTML() {
    const rows = messages.map(m => {
      const isUser  = m.role === 'user';
      const time    = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const content = m.imageUrl
        ? `<img src="${m.imageUrl}" style="max-width:100%;border-radius:8px;" />`
        : m.content.replace(/\n/g, '<br>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`(.+?)`/g, '<code>$1</code>');
      return `<div style="margin-bottom:20px;display:flex;flex-direction:column;align-items:${isUser ? 'flex-end' : 'flex-start'};"><div style="font-size:11px;color:#9ca3af;margin-bottom:4px;">${isUser ? 'You' : 'NOVA AI'} · ${time}</div><div style="max-width:80%;padding:10px 14px;border-radius:12px;font-size:14px;line-height:1.6;background:${isUser ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : '#f3f4f6'};color:${isUser ? '#fff' : '#111'};">${content}</div></div>`;
    }).join('');
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>*{box-sizing:border-box}body{font-family:-apple-system,sans-serif;max-width:700px;margin:0 auto;padding:32px 20px}h1{font-size:22px;font-weight:700}code{background:#f3f4f6;padding:1px 4px;border-radius:3px;font-family:monospace;font-size:.9em}.meta{color:#9ca3af;font-size:12px;margin-bottom:28px}hr{border:none;border-top:1px solid #e5e7eb;margin:20px 0}.footer{text-align:center;color:#9ca3af;font-size:12px;margin-top:32px}</style></head><body><h1>${title}</h1><p class="meta">Exported from NOVA AI · ${date}</p><hr>${rows}<hr><p class="footer">Powered by NOVA AI</p></body></html>`;
  }

  function download(content: string, ext: string, mime = 'text/plain;charset=utf-8') {
    const blob = new Blob([content], { type: mime });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `nova-${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  }

  function exportPDF() {
    setPdfBusy(true);
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:800px;height:1px;';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument!;
    doc.open(); doc.write(toHTML()); doc.close();
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      document.body.removeChild(iframe);
      setPdfBusy(false);
      onClose();
    }, 800);
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(toMarkdown()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const msgCount  = messages.length;
  const wordCount = messages.reduce((acc, m) => acc + m.content.split(/\s+/).length, 0);

  const OPTIONS = [
    { icon: '📝', color: '#a78bfa', bg: 'rgba(124,58,237,0.12)', border: 'rgba(124,58,237,0.3)',  label: 'Markdown',   ext: 'md',   action: () => download(toMarkdown(), 'md', 'text/markdown') },
    { icon: '📄', color: '#a1a1aa', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.12)', label: 'Plain Text', ext: 'txt',  action: () => download(toText(), 'txt') },
    { icon: '🖨️', color: '#34d399', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.28)', label: pdfBusy ? 'Preparing…' : 'Print / PDF', ext: 'pdf', action: exportPDF },
    { icon: '🌐', color: '#38bdf8', bg: 'rgba(6,182,212,0.1)',   border: 'rgba(6,182,212,0.28)',  label: 'HTML File',  ext: 'html', action: () => download(toHTML(), 'html', 'text/html') },
  ];

  return (
    <AnimatePresence>
      {open && (
        /* ── Full-screen flex wrapper — the ONLY reliable way to center ── */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            /* Flex-center the card — works at every zoom & screen size */
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',                        /* breathing room from edges */
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(6px)',
          }}
        >
          {/* ── Modal card ───────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 12 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{ opacity: 0, scale: 0.93, y: 12 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            onClick={e => e.stopPropagation()}   /* don't close when clicking card */
            style={{
              width: '100%', maxWidth: 420,
              /* Never taller than the viewport minus the 32px padding on each side */
              maxHeight: 'calc(100vh - 32px)',
              overflowY: 'auto',
              background: '#111113',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 18,
              boxShadow: '0 32px 64px rgba(0,0,0,0.8)',
            }}
          >
            {/* Header — sticky so close button is always reachable */}
            <div style={{
              position: 'sticky', top: 0, zIndex: 1,
              background: '#111113',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fafafa' }}>Export Conversation</p>
                <p style={{ margin: 0, fontSize: 11, color: '#52525b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>{title}</p>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525b', padding: 4, flexShrink: 0, lineHeight: 0 }}>
                <X size={16} />
              </button>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 22, fontWeight: 700, color: '#fafafa' }}>{msgCount}</span>
                <span style={{ fontSize: 11, color: '#52525b' }}>Messages</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 22, fontWeight: 700, color: '#fafafa' }}>{wordCount.toLocaleString()}</span>
                <span style={{ fontSize: 11, color: '#52525b' }}>Words</span>
              </div>
            </div>

            {/* 2 × 2 export grid */}
            <div style={{ padding: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {OPTIONS.map(opt => (
                <button
                  key={opt.label}
                  onClick={opt.action}
                  disabled={pdfBusy}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4,
                    padding: '14px', background: opt.bg, border: `1px solid ${opt.border}`,
                    borderRadius: 12, cursor: pdfBusy ? 'not-allowed' : 'pointer',
                    color: '#fff', textAlign: 'left', transition: 'filter 0.15s',
                  }}
                  onMouseEnter={e => { if (!pdfBusy) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.35)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = 'none'; }}
                >
                  <span style={{ fontSize: 22, lineHeight: 1 }}>{opt.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: opt.color, marginTop: 4 }}>{opt.label}</span>
                  <span style={{ fontSize: 10, color: '#3f3f46' }}>.{opt.ext}</span>
                </button>
              ))}
            </div>

            {/* Copy button */}
            <div style={{ padding: '0 12px 12px' }}>
              <button
                onClick={copyToClipboard}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  padding: '9px', background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10,
                  cursor: 'pointer', color: copied ? '#10b981' : '#71717a',
                  fontSize: 12, fontWeight: 500, transition: 'color 0.2s',
                }}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copied to clipboard!' : 'Copy as Markdown'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
