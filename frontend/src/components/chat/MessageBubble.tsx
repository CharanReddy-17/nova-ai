'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, RefreshCw, User, Pencil, X } from 'lucide-react';
import { Message } from '@/services/chatService';

interface Props {
  message:       Message;
  isLast:        boolean;
  isLastAI:      boolean;
  onRegenerate?: () => void;
  onEdit?:       (newContent: string) => void;
}

// ── Copy button ───────────────────────────────────────────────────────────────
function CopyBtn({ text, size = 14 }: { text: string; size?: number }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);
  return (
    <button onClick={copy} title="Copy" style={{
      background: 'none', border: 'none', cursor: 'pointer', padding: 4,
      color: copied ? '#10b981' : '#71717a', transition: 'color 0.15s',
      display: 'flex', alignItems: 'center',
    }}>
      {copied ? <Check size={size} /> : <Copy size={size} />}
    </button>
  );
}

// ── Code block ────────────────────────────────────────────────────────────────
function CodeBlock({ language, children }: { language: string; children: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [children]);

  return (
    <div style={{ position: 'relative', margin: '10px 0', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: '#1a1a2e', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ fontSize: 11, color: '#71717a', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em' }}>
          {language || 'code'}
        </span>
        <button onClick={copy} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#10b981' : '#71717a', fontSize: 11, fontFamily: 'inherit', transition: 'color 0.15s', padding: '2px 6px' }}>
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneDark}
        customStyle={{ margin: 0, padding: '14px 16px', fontSize: 13, background: '#0d0d14', borderRadius: 0, fontFamily: 'JetBrains Mono, monospace' }}
        showLineNumbers={children.split('\n').length > 5}
        lineNumberStyle={{ color: '#3f3f46', fontSize: 11, minWidth: 32 }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
}

// ── Inline edit textarea ──────────────────────────────────────────────────────
function EditBox({ initial, onSave, onCancel }: { initial: string; onSave: (v: string) => void; onCancel: () => void }) {
  const [value, setValue] = useState(initial);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
      ref.current.selectionStart = ref.current.value.length;
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
    }
  }, []);

  return (
    <div style={{ width: '100%' }}>
      <textarea
        ref={ref}
        value={value}
        onChange={e => {
          setValue(e.target.value);
          e.target.style.height = 'auto';
          e.target.style.height = e.target.scrollHeight + 'px';
        }}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (value.trim()) onSave(value.trim()); }
          if (e.key === 'Escape') onCancel();
        }}
        style={{
          width: '100%', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.4)',
          borderRadius: 12, padding: '10px 14px', color: '#fafafa', fontSize: 14, lineHeight: 1.6,
          resize: 'none', outline: 'none', fontFamily: 'inherit', minHeight: 44,
          boxSizing: 'border-box', overflow: 'hidden',
        }}
      />
      <div style={{ display: 'flex', gap: 6, marginTop: 6, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#71717a', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
          <X size={12} /> Cancel
        </button>
        <button
          onClick={() => { if (value.trim()) onSave(value.trim()); }}
          disabled={!value.trim()}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 14px', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
        >
          Send ↵
        </button>
      </div>
      <p style={{ fontSize: 11, color: '#52525b', marginTop: 4, textAlign: 'right' }}>Enter to send · Esc to cancel</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MessageBubble({ message, isLast, isLastAI, onRegenerate, onEdit }: Props) {
  const isUser = message.role === 'user';
  const [editing, setEditing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleSave = (newContent: string) => {
    setEditing(false);
    if (newContent !== message.content) onEdit?.(newContent);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row', alignItems: 'flex-start', gap: 10, marginBottom: 4 }}
    >
      {/* NOVA avatar */}
      {!isUser && (
        <div style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, marginTop: 2, background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff' }}>
          N
        </div>
      )}

      <div style={{ maxWidth: isUser ? '72%' : '85%', display: 'flex', flexDirection: 'column', gap: 4, alignItems: isUser ? 'flex-end' : 'flex-start' }}>

        {/* Bubble / edit mode */}
        {isUser && editing ? (
          <div style={{ width: '100%', minWidth: 260 }}>
            <EditBox initial={message.content} onSave={handleSave} onCancel={() => setEditing(false)} />
          </div>
        ) : (
          <div style={{
            padding: isUser ? '10px 14px' : '12px 16px',
            borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            background: isUser ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : '#18181b',
            border: isUser ? 'none' : '1px solid rgba(255,255,255,0.07)',
            color: isUser ? '#fff' : '#e4e4e7',
            fontSize: 14, lineHeight: 1.65, wordBreak: 'break-word', position: 'relative',
          }}>
            {isUser ? (
              <span style={{ whiteSpace: 'pre-wrap' }}>{message.content}</span>
            ) : (
              <div className="nova-markdown" style={{ fontSize: 14 }}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      const lang  = match ? match[1] : '';
                      const code  = String(children).replace(/\n$/, '');
                      return !inline
                        ? <CodeBlock language={lang}>{code}</CodeBlock>
                        : <code style={{ background: 'rgba(124,58,237,0.15)', padding: '2px 6px', borderRadius: 5, fontSize: 13, fontFamily: 'JetBrains Mono, monospace', color: '#c4b5fd' }} {...props}>{children}</code>;
                    },
                    a({ href, children }) {
                      return <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#06b6d4', textDecoration: 'underline', textUnderlineOffset: 3 }}>{children}</a>;
                    },
                    table({ children }) {
                      return <div style={{ overflowX: 'auto', marginTop: 8 }}><table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>{children}</table></div>;
                    },
                    th({ children }) {
                      return <th style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', background: 'rgba(124,58,237,0.15)', textAlign: 'left', fontWeight: 600 }}>{children}</th>;
                    },
                    td({ children }) {
                      return <td style={{ border: '1px solid rgba(255,255,255,0.07)', padding: '6px 10px' }}>{children}</td>;
                    },
                    blockquote({ children }) {
                      return <blockquote style={{ borderLeft: '3px solid #7c3aed', margin: '8px 0', paddingLeft: 12, color: '#a1a1aa', fontStyle: 'italic' }}>{children}</blockquote>;
                    },
                    hr() {
                      return <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '12px 0' }} />;
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* Meta row */}
        {!editing && (
          <motion.div
            initial={false}
            animate={{ opacity: hovered ? 1 : 0.45 }}
            transition={{ duration: 0.15 }}
            style={{ display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 2, paddingRight: 2 }}
          >
            <span style={{ fontSize: 11, color: '#52525b' }}>{time}</span>

            <CopyBtn text={message.content} size={12} />

            {/* Edit — only user messages */}
            {isUser && onEdit && (
              <button
                onClick={() => setEditing(true)}
                title="Edit message"
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#71717a', fontSize: 11, padding: '2px 4px', transition: 'color 0.15s', fontFamily: 'inherit' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#a78bfa')}
                onMouseLeave={e => (e.currentTarget.style.color = '#71717a')}
              >
                <Pencil size={11} /> Edit
              </button>
            )}

            {/* Regenerate — last AI message */}
            {isLastAI && onRegenerate && (
              <button
                onClick={onRegenerate}
                title="Regenerate response"
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#71717a', fontSize: 11, padding: '2px 4px', transition: 'color 0.15s', fontFamily: 'inherit' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#a78bfa')}
                onMouseLeave={e => (e.currentTarget.style.color = '#71717a')}
              >
                <RefreshCw size={11} /> Regenerate
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, marginTop: 2, background: '#27272a', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <User size={15} style={{ color: '#71717a' }} />
        </div>
      )}
    </motion.div>
  );
}
