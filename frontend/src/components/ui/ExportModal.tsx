'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Copy, Check, X, FileText, FileCode, Printer } from 'lucide-react';
import { Message } from '@/services/chatService';

interface ExportModalProps {
  open:      boolean;
  onClose:   () => void;
  messages:  Message[];
  chatTitle?: string;
}

export default function ExportModal({ open, onClose, messages, chatTitle }: ExportModalProps) {
  const [copied,  setCopied]  = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  const title = chatTitle || 'Chat';
  const date  = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  function toMarkdown() {
    const lines = [`# ${title}`, `*Exported from NOVA AI · ${date}*`, '', '---', ''];
    messages.forEach(m => {
      const role = m.role === 'user' ? '**You**' : '**NOVA AI**';
      const time = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      lines.push(`### ${role} · ${time}`, '', m.imageUrl ? `![Generated Image](${m.imageUrl})` : m.content, '', '---', '');
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
        : m.content.replace(/\n/g, '<br>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`(.+?)`/g, '<code style="background:#f3f4f6;padding:1px 4px;border-radius:3px;font-family:monospace;font-size:0.9em;">$1</code>');
      return `<div style="margin-bottom:20px;display:flex;flex-direction:column;align-items:${isUser ? 'flex-end' : 'flex-start'};"><div style="font-size:11px;color:#9ca3af;margin-bottom:4px;">${isUser ? 'You' : 'NOVA AI'} · ${time}</div><div style="max-width:80%;padding:10px 14px;border-radius:12px;font-size:14px;line-height:1.6;background:${isUser ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : '#f3f4f6'};color:${isUser ? '#fff' : '#111'};">${content}</div></div>`;
    }).join('');
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>*{box-sizing:border-box}body{font-family:-apple-system,system-ui,sans-serif;background:#fff;color:#111;max-width:700px;margin:0 auto;padding:32px 20px}h1{font-size:22px;font-weight:700;margin-bottom:4px}.meta{color:#9ca3af;font-size:12px;margin-bottom:28px}hr{border:none;border-top:1px solid #e5e7eb;margin:20px 0}.footer{text-align:center;color:#9ca3af;font-size:12px;margin-top:32px}</style></head><body><h1>${title}</h1><p class="meta">Exported from NOVA AI · ${date}</p><hr>${rows}<hr><p class="footer">Powered by NOVA AI</p></body></html>`;
  }

  function download(content: string, ext: string, mime = 'text/plain;charset=utf-8') {
    const blob = new Blob([content], { type: mime });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
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
  const wordCount = messages.reduce((acc, m) => acc + m.content.split(' ').length, 0);

  // 2×2 grid of export options — compact!
  const OPTIONS = [
    { icon: '📝', color: '#a78bfa', bg: 'rgba(124,58,237,0.12)', border: 'rgba(124,58,237,0.25)', label: 'Markdown', ext: 'md', action: () => download(toMarkdown(), 'md', 'text/markdown') },
    { icon: '📄', color: '#71717a', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)',  label: 'Plain Text', ext: 'txt', action: () => download(toText(), 'txt') },
    { icon: '🖨️', color: '#34d399', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.25)', label: pdfBusy ? 'Preparing…' : 'Print / PDF', ext: 'pdf', action: exportPDF },
    { icon: '🌐', color: '#38bdf8', bg: 'rgba(6,182,212,0.08)',   border: 'rgba(6,182,212,0.25)',  label: 'HTML File', ext: 'html', action: () => download(toHTML(), 'html', 'text/html') },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 200, backdropFilter: 'blur(6px)' }}
          />

          {/* Modal — always fits on screen */}
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            style={{
              position: 'fixed',
              /* Sit 10% from top, never overflow bottom */
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(440px, calc(100vw - 32px))',
              /* Hard cap so it never clips */
              maxHeight: 'min(520px, calc(100vh - 48px))',
              overflowY: 'auto',
              zIndex: 201,
              background: '#111113',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 18,
              boxShadow: '0 32px 64px rgba(0,0,0,0.8)',
            }}
          >
            {/* ── Header ─────────────────────────────────────── */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#111113', zIndex: 1 }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fafafa' }}>Export Conversation</p>
                <p style={{ margin: 0, fontSize: 11, color: '#52525b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>{title}</p>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525b', padding: '4px', flexShrink: 0 }}>
                <X size={16} />
              </button>
            </div>

            {/* ── Stats (compact single row) ──────────────────── */}
            <div style={{ display: 'flex', gap: 0, padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {[{ label: 'Messages', value: msgCount }, { label: 'Words', value: wordCount.toLocaleString() }].map((s, i) => (
                <div key={s.label} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, paddingRight: i === 0 ? 16 : 0, borderRight: i === 0 ? '1px solid rgba(255,255,255,0.06)' : 'none', marginRight: i === 0 ? 16 : 0 }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#fafafa' }}>{s.value}</span>
                  <span style={{ fontSize: 11, color: '#52525b' }}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* ── 2×2 Export grid ─────────────────────────────── */}
            <div style={{ padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {OPTIONS.map(opt => (
                <button key={opt.label} onClick={opt.action} disabled={pdfBusy}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4,
                    padding: '12px 14px',
                    background: opt.bg, border: `1px solid ${opt.border}`, borderRadius: 12,
                    cursor: pdfBusy ? 'not-allowed' : 'pointer', color: '#fff', textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!pdfBusy) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.3)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = 'none'; }}
                >
                  <span style={{ fontSize: 20 }}>{opt.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: opt.color }}>{opt.label}</span>
                  <span style={{ fontSize: 10, color: '#52525b' }}>.{opt.ext}</span>
                </button>
              ))}
            </div>

            {/* ── Copy as Markdown ───────────────────────────── */}
            <div style={{ padding: '0 14px 14px' }}>
              <button onClick={copyToClipboard}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '9px', background: 'transparent', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, cursor: 'pointer', color: copied ? '#10b981' : '#71717a', fontSize: 12, fontWeight: 500, transition: 'all 0.2s' }}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copied!' : 'Copy as Markdown'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
