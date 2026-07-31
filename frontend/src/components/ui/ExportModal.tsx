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
  const [copied,    setCopied]    = useState(false);
  const [pdfBusy,   setPdfBusy]  = useState(false);

  const title = chatTitle || 'Chat';
  const date  = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  // ── Formatters ────────────────────────────────────────────────────────────────
  function toMarkdown() {
    const lines = [
      `# ${title}`,
      `*Exported from NOVA AI · ${date}*`,
      '',
      '---',
      '',
    ];
    messages.forEach(m => {
      const role = m.role === 'user' ? '**You**' : '**NOVA AI**';
      const time = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      lines.push(`### ${role} · ${time}`, '', m.imageUrl ? `![Generated Image](${m.imageUrl})` : m.content, '', '---', '');
    });
    lines.push('*Powered by NOVA AI — nova-ai-ruddy-mu.vercel.app*');
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
      const isUser = m.role === 'user';
      const time   = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const content = m.imageUrl
        ? `<img src="${m.imageUrl}" style="max-width:100%;border-radius:8px;margin-top:8px;" />`
        : m.content.replace(/\n/g, '<br>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`(.+?)`/g, '<code style="background:#f3f4f6;padding:1px 4px;border-radius:3px;font-family:monospace;">$1</code>');
      return `
        <div style="margin-bottom:24px;display:flex;flex-direction:column;align-items:${isUser ? 'flex-end' : 'flex-start'};">
          <div style="font-size:11px;color:#9ca3af;margin-bottom:4px;">${isUser ? 'You' : 'NOVA AI'} · ${time}</div>
          <div style="max-width:80%;padding:12px 16px;border-radius:12px;font-size:14px;line-height:1.6;
            background:${isUser ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : '#f3f4f6'};
            color:${isUser ? '#fff' : '#111'};">
            ${content}
          </div>
        </div>`;
    }).join('');

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, system-ui, sans-serif; background:#fff; color:#111; max-width:760px; margin:0 auto; padding:40px 24px; }
  h1 { font-size:24px; font-weight:700; margin-bottom:4px; }
  .meta { color:#9ca3af; font-size:13px; margin-bottom:32px; }
  hr { border:none; border-top:1px solid #e5e7eb; margin:24px 0; }
  .footer { text-align:center; color:#9ca3af; font-size:12px; margin-top:40px; }
</style></head><body>
<h1>${title}</h1>
<p class="meta">Exported from NOVA AI · ${date}</p>
<hr>
${rows}
<hr>
<p class="footer">Powered by NOVA AI — nova-ai-ruddy-mu.vercel.app</p>
</body></html>`;
  }

  // ── Download helpers ──────────────────────────────────────────────────────────
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
    const html   = toHTML();
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:800px;height:1px;';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument!;
    doc.open(); doc.write(html); doc.close();
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

  // ── Stats ─────────────────────────────────────────────────────────────────────
  const msgCount  = messages.length;
  const wordCount = messages.reduce((acc, m) => acc + m.content.split(' ').length, 0);
  const charCount = messages.reduce((acc, m) => acc + m.content.length, 0);

  const OPTIONS = [
    {
      icon:    <FileCode size={18} style={{ color: '#a78bfa' }} />,
      iconBg:  'rgba(124,58,237,0.2)',
      bg:      'rgba(124,58,237,0.08)',
      border:  'rgba(124,58,237,0.2)',
      hoverBg: 'rgba(124,58,237,0.15)',
      label:   'Markdown (.md)',
      sub:     'Formatted with headers, bold, code blocks',
      action:  () => download(toMarkdown(), 'md', 'text/markdown'),
    },
    {
      icon:    <FileText size={18} style={{ color: '#71717a' }} />,
      iconBg:  'rgba(255,255,255,0.06)',
      bg:      'rgba(255,255,255,0.03)',
      border:  'rgba(255,255,255,0.08)',
      hoverBg: 'rgba(255,255,255,0.07)',
      label:   'Plain Text (.txt)',
      sub:     'Simple readable text format',
      action:  () => download(toText(), 'txt'),
    },
    {
      icon:    <Printer size={18} style={{ color: '#34d399' }} />,
      iconBg:  'rgba(16,185,129,0.15)',
      bg:      'rgba(16,185,129,0.05)',
      border:  'rgba(16,185,129,0.2)',
      hoverBg: 'rgba(16,185,129,0.1)',
      label:   pdfBusy ? 'Preparing PDF…' : 'Print / Save as PDF',
      sub:     'Opens browser print dialog — save as PDF',
      action:  exportPDF,
    },
    {
      icon:    <Download size={18} style={{ color: '#38bdf8' }} />,
      iconBg:  'rgba(6,182,212,0.15)',
      bg:      'rgba(6,182,212,0.05)',
      border:  'rgba(6,182,212,0.2)',
      hoverBg: 'rgba(6,182,212,0.1)',
      label:   'HTML File (.html)',
      sub:     'Beautiful styled webpage you can open anywhere',
      action:  () => download(toHTML(), 'html', 'text/html'),
    },
  ];

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
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            style={{
              position: 'fixed',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'calc(100% - 32px)', maxWidth: 460,
              maxHeight: '90vh',
              overflowY: 'auto',
              zIndex: 201,
              background: '#111113',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20,
              boxShadow: '0 40px 80px rgba(0,0,0,0.8)',
            }}
          >
            {/* Header */}
            <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#fafafa' }}>Export Conversation</h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#52525b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 320 }}>{title}</p>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525b', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {[{ label: 'Messages', value: msgCount }, { label: 'Words', value: wordCount.toLocaleString() }, { label: 'Chars', value: charCount.toLocaleString() }].map((s, i) => (
                <div key={s.label} style={{ flex: 1, padding: '12px 16px', textAlign: 'center', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#fafafa' }}>{s.value}</p>
                  <p style={{ margin: 0, fontSize: 10, color: '#52525b' }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Export buttons */}
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {OPTIONS.map(opt => (
                <button key={opt.label} onClick={opt.action} disabled={pdfBusy}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: opt.bg, border: `1px solid ${opt.border}`, borderRadius: 12, cursor: pdfBusy ? 'not-allowed' : 'pointer', color: '#fff', textAlign: 'left', transition: 'all 0.15s', opacity: pdfBusy && opt.label !== (pdfBusy ? 'Preparing PDF…' : 'Print / Save as PDF') ? 0.6 : 1 }}
                  onMouseEnter={e => { if (!pdfBusy) (e.currentTarget as HTMLButtonElement).style.background = opt.hoverBg; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = opt.bg; }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: opt.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {opt.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{opt.label}</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#71717a' }}>{opt.sub}</p>
                  </div>
                  <Download size={14} style={{ color: '#52525b', flexShrink: 0 }} />
                </button>
              ))}

              {/* Copy */}
              <button onClick={copyToClipboard}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, cursor: 'pointer', color: copied ? '#10b981' : '#71717a', fontSize: 13, fontWeight: 500, transition: 'all 0.2s' }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied to clipboard!' : 'Copy as Markdown'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
