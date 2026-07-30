'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, RefreshCw, User, Pencil, X, ThumbsUp, ThumbsDown, Download, ZoomIn, Volume2, VolumeX } from 'lucide-react';
import { Message } from '@/services/chatService';

interface Props {
  message:       Message;
  isLast:        boolean;
  isLastAI:      boolean;
  onRegenerate?: () => void;
  onEdit?:       (newContent: string) => void;
  onReact?:      (reaction: 'up' | 'down') => void;
  reaction?:     'up' | 'down' | null;
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

// ── Code block (with optional JS runner) ────────────────────────────────────
const RUNNABLE_LANGS = new Set(['javascript', 'js', 'typescript', 'ts']);

function CodeBlock({ language, children }: { language: string; children: string }) {
  const [copied,    setCopied]    = useState(false);
  const [output,    setOutput]    = useState<string | null>(null);
  const [running,   setRunning]   = useState(false);
  const [runError,  setRunError]  = useState(false);
  const canRun = RUNNABLE_LANGS.has((language || '').toLowerCase());

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [children]);

  const run = useCallback(() => {
    setRunning(true);
    setOutput(null);
    setRunError(false);
    const logs: string[] = [];
    const origLog   = console.log;
    const origWarn  = console.warn;
    const origError = console.error;
    // Capture console output
    console.log   = (...a) => { logs.push(a.map(String).join(' ')); };
    console.warn  = (...a) => { logs.push('⚠️ ' + a.map(String).join(' ')); };
    console.error = (...a) => { logs.push('❌ ' + a.map(String).join(' ')); };
    let result: string;
    try {
      // Wrap in IIFE so return works, 3-second timeout via sync execution
      const fn = new Function(children);
      const val = fn();
      if (val !== undefined) logs.push('→ ' + JSON.stringify(val, null, 2));
      result = logs.length ? logs.join('\n') : '(no output)';
      setRunError(false);
    } catch (e: any) {
      result = '❌ ' + (e?.message || String(e));
      setRunError(true);
    } finally {
      console.log   = origLog;
      console.warn  = origWarn;
      console.error = origError;
      setOutput(result!);
      setRunning(false);
    }
  }, [children]);

  return (
    <div style={{ position: 'relative', margin: '10px 0', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: '#1a1a2e', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ fontSize: 11, color: '#71717a', fontFamily: 'monospace', letterSpacing: '0.04em' }}>{language || 'code'}</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {/* Run button — JS/TS only */}
          {canRun && (
            <button onClick={run} disabled={running}
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 6, cursor: 'pointer', color: '#10b981', fontSize: 11, fontFamily: 'inherit', padding: '2px 8px', transition: 'all 0.15s', fontWeight: 600 }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(16,185,129,0.2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(16,185,129,0.1)')}
            >
              ▶ {running ? 'Running…' : 'Run'}
            </button>
          )}
          <button onClick={copy} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#10b981' : '#71717a', fontSize: 11, fontFamily: 'inherit', padding: '2px 6px', transition: 'color 0.15s' }}>
            {copied ? <Check size={11} /> : <Copy size={11} />} {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      <SyntaxHighlighter
        language={language || 'text'} style={oneDark}
        customStyle={{ margin: 0, padding: '14px 16px', fontSize: 13, background: '#0d0d14', borderRadius: 0, fontFamily: 'JetBrains Mono, monospace' }}
        showLineNumbers={children.split('\n').length > 5}
        lineNumberStyle={{ color: '#3f3f46', fontSize: 11 }}
      >
        {children}
      </SyntaxHighlighter>

      {/* Output panel */}
      {output !== null && (
        <div style={{ background: runError ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.05)', borderTop: `1px solid ${runError ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.15)'}`, padding: '10px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: runError ? '#ef4444' : '#10b981', fontWeight: 600, fontFamily: 'monospace' }}>
              {runError ? '❌ Error' : '▶ Output'}
            </span>
            <button onClick={() => setOutput(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525b', fontSize: 11, fontFamily: 'inherit' }}>clear</button>
          </div>
          <pre style={{ margin: 0, fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: runError ? '#fca5a5' : '#d4d4d8', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {output}
          </pre>
        </div>
      )}
    </div>
  );
}


// ── Inline edit ───────────────────────────────────────────────────────────────
function EditBox({ initial, onSave, onCancel }: { initial: string; onSave: (v: string) => void; onCancel: () => void }) {
  const [value, setValue] = useState(initial);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
      ref.current.selectionStart = ref.current.value.length;
      ref.current.style.height   = 'auto';
      ref.current.style.height   = ref.current.scrollHeight + 'px';
    }
  }, []);

  return (
    <div style={{ width: '100%' }}>
      <textarea
        ref={ref}
        value={value}
        onChange={e => { setValue(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (value.trim()) onSave(value.trim()); }
          if (e.key === 'Escape') onCancel();
        }}
        style={{ width: '100%', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.4)', borderRadius: 12, padding: '10px 14px', color: '#fafafa', fontSize: 14, lineHeight: 1.6, resize: 'none', outline: 'none', fontFamily: 'inherit', minHeight: 44, boxSizing: 'border-box', overflow: 'hidden' }}
      />
      <div style={{ display: 'flex', gap: 6, marginTop: 6, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#71717a', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
          <X size={12} /> Cancel
        </button>
        <button onClick={() => { if (value.trim()) onSave(value.trim()); }} disabled={!value.trim()}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 14px', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
          Send ↵
        </button>
      </div>
      <p style={{ fontSize: 11, color: '#52525b', marginTop: 4, textAlign: 'right' }}>Enter to send · Esc to cancel</p>
    </div>
  );
}

// ── Generated image bubble ────────────────────────────────────────────────────
function ImageBubble({ imageUrl: initialUrl, prompt: initialPrompt }: { imageUrl: string; prompt: string }) {
  const [url,         setUrl]       = useState(initialUrl);
  const [prompt,      setPrompt]    = useState(initialPrompt);
  const [loaded,      setLoaded]    = useState(false);
  const [errored,     setErrored]   = useState(false);
  const [lightbox,    setLightbox]  = useState(false);
  const [editPrompt,  setEditPrompt] = useState(false);
  const [editVal,     setEditVal]   = useState(initialPrompt);

  const reroll = useCallback((newPrompt?: string) => {
    const p = newPrompt ?? prompt;
    const encoded = encodeURIComponent(p);
    setLoaded(false);
    setErrored(false);
    setPrompt(p);
    setUrl(`https://image.pollinations.ai/prompt/${encoded}?width=1024&height=768&nologo=true&seed=${Math.floor(Math.random() * 2147483647)}`);
    setEditPrompt(false);
  }, [prompt]);

  return (
    <>
      <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', maxWidth: 420, border: '1px solid rgba(255,255,255,0.08)', background: '#111' }}>
        {/* Loading shimmer */}
        {!loaded && !errored && (
          <div style={{ width: '100%', aspectRatio: '4/3', background: 'linear-gradient(90deg, #1a1a2e 25%, #26263e 50%, #1a1a2e 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#52525b', fontSize: 13 }}>🎨 Generating…</span>
          </div>
        )}

        {!errored && (
          <img src={url} alt={prompt}
            onLoad={() => setLoaded(true)}
            onError={() => setErrored(true)}
            style={{ display: loaded ? 'block' : 'none', width: '100%', cursor: 'zoom-in' }}
            onClick={() => setLightbox(true)}
          />
        )}

        {errored && (
          <div style={{ padding: 24, textAlign: 'center', color: '#71717a', fontSize: 13 }}>
            ⚠️ Generation failed.
            <button onClick={() => reroll()} style={{ display: 'block', margin: '8px auto 0', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 8, padding: '4px 12px', color: '#a855f7', cursor: 'pointer', fontSize: 12 }}>Retry</button>
          </div>
        )}

        {/* Overlay action buttons */}
        {loaded && (
          <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
            <button onClick={() => setLightbox(true)} title="View full size"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '5px 8px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}>
              <ZoomIn size={13} />
            </button>
            <a href={url} download={`nova-${Date.now()}.jpg`} target="_blank" rel="noopener noreferrer" title="Download"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '5px 8px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <Download size={13} />
            </a>
          </div>
        )}
      </div>

      {/* Caption + variation controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5, maxWidth: 420, flexWrap: 'wrap' }}>
        <p style={{ fontSize: 11, color: '#52525b', fontStyle: 'italic', margin: 0, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          🎨 "{prompt}"
        </p>
        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
          {/* Re-roll same prompt */}
          <button onClick={() => reroll()} title="Generate a new variation"
            style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 7, padding: '3px 8px', cursor: 'pointer', color: '#a855f7', fontSize: 11, fontFamily: 'inherit', transition: 'all 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.1)')}
          >
            🔄 Variation
          </button>
          {/* Edit prompt */}
          <button onClick={() => { setEditVal(prompt); setEditPrompt(v => !v); }} title="Edit prompt"
            style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '3px 8px', cursor: 'pointer', color: '#71717a', fontSize: 11, fontFamily: 'inherit', transition: 'all 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#a1a1aa')}
            onMouseLeave={e => (e.currentTarget.style.color = '#71717a')}
          >
            ✏️ Edit prompt
          </button>
        </div>
      </div>

      {/* Edit prompt input */}
      {editPrompt && (
        <div style={{ marginTop: 6, maxWidth: 420, display: 'flex', gap: 6 }}>
          <input
            value={editVal}
            onChange={e => setEditVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && editVal.trim()) reroll(editVal.trim()); if (e.key === 'Escape') setEditPrompt(false); }}
            autoFocus
            placeholder="New prompt…"
            style={{ flex: 1, background: '#18181b', border: '1px solid rgba(124,58,237,0.4)', borderRadius: 8, padding: '6px 10px', color: '#fafafa', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
          />
          <button onClick={() => { if (editVal.trim()) reroll(editVal.trim()); }}
            style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', border: 'none', borderRadius: 8, padding: '6px 14px', color: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
            Go
          </button>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', padding: 24 }}>
          <img src={url} alt={prompt} style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }} onClick={e => e.stopPropagation()} />
          <button onClick={() => setLightbox(false)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', color: '#fff', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
      )}
    </>
  );
}

// ── Main bubble ───────────────────────────────────────────────────────────────
export default function MessageBubble({ message, isLast, isLastAI, onRegenerate, onEdit, onReact, reaction }: Props) {
  const isUser    = message.role === 'user';
  const isImage   = !!message.imageUrl;
  const [editing,   setEditing]   = useState(false);
  const [hovered,   setHovered]   = useState(false);
  const [speaking,  setSpeaking]  = useState(false);
  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // ─ TTS ───────────────────────────────────────────────────────────────
  const speak = useCallback(() => {
    if (!('speechSynthesis' in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    // Strip markdown syntax for cleaner speech
    const plainText = message.content
      .replace(/```[\s\S]*?```/g, 'code block.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();
    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.rate  = 1.05;
    utterance.pitch = 1;
    // Prefer a natural-sounding English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang.startsWith('en') && v.localService);
    if (preferred) utterance.voice = preferred;
    utterance.onend   = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [speaking, message.content]);

  // Stop speech when component unmounts
  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

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
        <div style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, marginTop: 2, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff' }}>
          N
        </div>
      )}

      <div className={isUser ? 'msg-user' : 'msg-ai'} style={{ maxWidth: isUser ? '72%' : '85%', display: 'flex', flexDirection: 'column', gap: 4, alignItems: isUser ? 'flex-end' : 'flex-start' }}>

        {/* Image message */}
        {isImage ? (
          <ImageBubble imageUrl={message.imageUrl!} prompt={message.content} />
        ) : isUser && editing ? (
          /* Edit mode */
          <div style={{ width: '100%', minWidth: 260 }}>
            <EditBox initial={message.content} onSave={handleSave} onCancel={() => setEditing(false)} />
          </div>
        ) : (
          /* Normal bubble */
          <div style={{
            padding: isUser ? '10px 14px' : '12px 16px',
            borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            background: isUser ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : 'var(--surface, #18181b)',
            border: isUser ? 'none' : '1px solid var(--border, rgba(255,255,255,0.07))',
            color: isUser ? '#fff' : 'var(--text2, #e4e4e7)',
            fontSize: 14, lineHeight: 1.65, wordBreak: 'break-word',
          }}>
            {isUser ? (
              <span style={{ whiteSpace: 'pre-wrap' }}>{message.content}</span>
            ) : (
              /* AI markdown with streaming cursor */
              <div className={`nova-markdown${message.isStreaming ? ' streaming-cursor' : ''}`} style={{ fontSize: 14 }}>
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
        {!editing && !isImage && (
          <motion.div
            initial={false}
            animate={{ opacity: hovered ? 1 : 0.45 }}
            transition={{ duration: 0.15 }}
            style={{ display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 2, paddingRight: 2 }}
          >
            <span style={{ fontSize: 11, color: '#52525b' }}>{time}</span>
            <CopyBtn text={message.content} size={12} />

            {/* TTS — AI messages only, not streaming */}
            {!isUser && !message.isStreaming && 'speechSynthesis' in (typeof window !== 'undefined' ? window : {}) && (
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={speak}
                title={speaking ? 'Stop reading' : 'Read aloud'}
                style={{
                  display: 'flex', alignItems: 'center', gap: 3,
                  background: speaking ? 'rgba(124,58,237,0.12)' : 'none',
                  border: speaking ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent',
                  borderRadius: 6, cursor: 'pointer', padding: '2px 5px',
                  color: speaking ? '#a855f7' : '#71717a', transition: 'all 0.15s', fontSize: 11,
                }}
                onMouseEnter={e => { if (!speaking) e.currentTarget.style.color = '#a855f7'; }}
                onMouseLeave={e => { if (!speaking) e.currentTarget.style.color = '#71717a'; }}
              >
                {speaking ? <VolumeX size={11} /> : <Volume2 size={11} />}
              </motion.button>
            )}

            {/* Edit (user only) */}
            {isUser && onEdit && (
              <button onClick={() => setEditing(true)} title="Edit"
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#71717a', fontSize: 11, padding: '2px 4px', transition: 'color 0.15s', fontFamily: 'inherit' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#a78bfa')}
                onMouseLeave={e => (e.currentTarget.style.color = '#71717a')}
              >
                <Pencil size={11} /> Edit
              </button>
            )}

            {/* Regenerate (last AI) */}
            {isLastAI && onRegenerate && !message.isStreaming && (
              <button onClick={onRegenerate} title="Regenerate"
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#71717a', fontSize: 11, padding: '2px 4px', transition: 'color 0.15s', fontFamily: 'inherit' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#a78bfa')}
                onMouseLeave={e => (e.currentTarget.style.color = '#71717a')}
              >
                <RefreshCw size={11} /> Regenerate
              </button>
            )}

            {/* Reactions (AI only, not streaming) */}
            {!isUser && onReact && !message.isStreaming && (
              <div style={{ display: 'flex', gap: 2, marginLeft: 4 }}>
                {(['up', 'down'] as const).map(dir => (
                  <motion.button key={dir} whileTap={{ scale: 0.8 }}
                    onClick={() => onReact(dir)}
                    title={dir === 'up' ? 'Good response' : 'Poor response'}
                    style={{
                      display: 'flex', alignItems: 'center', background: reaction === dir ? (dir === 'up' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)') : 'none',
                      border: reaction === dir ? `1px solid ${dir === 'up' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.25)'}` : '1px solid transparent',
                      borderRadius: 6, cursor: 'pointer', padding: '2px 5px', transition: 'all 0.15s',
                      color: reaction === dir ? (dir === 'up' ? '#10b981' : '#ef4444') : '#71717a',
                    }}
                    onMouseEnter={e => { if (reaction !== dir) e.currentTarget.style.color = dir === 'up' ? '#10b981' : '#ef4444'; }}
                    onMouseLeave={e => { if (reaction !== dir) e.currentTarget.style.color = '#71717a'; }}
                  >
                    {dir === 'up'
                      ? <ThumbsUp  size={11} fill={reaction === 'up'   ? 'currentColor' : 'none'} />
                      : <ThumbsDown size={11} fill={reaction === 'down' ? 'currentColor' : 'none'} />}
                  </motion.button>
                ))}
              </div>
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
