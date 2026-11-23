'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Copy, Check, RefreshCw, User, Pencil, X, ThumbsUp, ThumbsDown,
  Download, ZoomIn, Volume2, VolumeX, Sparkles, Image as ImageIcon,
  AlertCircle, Play, Loader2
} from 'lucide-react';
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
function CopyBtn({ text, size = 13 }: { text: string; size?: number }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);
  return (
    <button onClick={copy} title="Copy" style={{
      background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
      color: copied ? '#10b981' : 'var(--muted)', transition: 'color 0.15s',
      display: 'flex', alignItems: 'center', borderRadius: 4,
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
    console.log   = (...a) => { logs.push(a.map(String).join(' ')); };
    console.warn  = (...a) => { logs.push('[warn] ' + a.map(String).join(' ')); };
    console.error = (...a) => { logs.push('[error] ' + a.map(String).join(' ')); };
    let result: string;
    try {
      const fn = new Function(children);
      const val = fn();
      if (val !== undefined) logs.push('-> ' + JSON.stringify(val, null, 2));
      result = logs.length ? logs.join('\n') : '(no output)';
      setRunError(false);
    } catch (e: any) {
      result = 'Error: ' + (e?.message || String(e));
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
    <div style={{ position: 'relative', margin: '12px 0', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', background: '#121214' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 14px', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'monospace', letterSpacing: '0.04em' }}>{language || 'code'}</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {canRun && (
            <button onClick={run} disabled={running}
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 6, cursor: 'pointer', color: '#10b981', fontSize: 11, fontFamily: 'inherit', padding: '2px 8px', transition: 'all 0.15s', fontWeight: 600 }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(16,185,129,0.2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(16,185,129,0.1)')}
            >
              <Play size={10} fill="currentColor" /> {running ? 'Running…' : 'Run'}
            </button>
          )}
          <button onClick={copy} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#10b981' : 'var(--muted)', fontSize: 11, fontFamily: 'inherit', padding: '2px 6px', transition: 'color 0.15s' }}>
            {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
      <SyntaxHighlighter
        language={language || 'text'} style={oneDark}
        customStyle={{ margin: 0, padding: '14px 16px', fontSize: 13, background: '#101012', borderRadius: 0, fontFamily: 'JetBrains Mono, monospace' }}
        showLineNumbers={children.split('\n').length > 5}
        lineNumberStyle={{ color: '#4b4b52', fontSize: 11 }}
      >
        {children}
      </SyntaxHighlighter>

      {output !== null && (
        <div style={{ background: runError ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.05)', borderTop: `1px solid ${runError ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.15)'}`, padding: '10px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: runError ? '#ef4444' : '#10b981', fontWeight: 600, fontFamily: 'monospace' }}>
              {runError ? 'Execution Error' : 'Output'}
            </span>
            <button onClick={() => setOutput(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 11, fontFamily: 'inherit' }}>clear</button>
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
        style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--accent)', borderRadius: 12, padding: '12px 14px', color: 'var(--text)', fontSize: 14, lineHeight: 1.6, resize: 'none', outline: 'none', fontFamily: 'inherit', minHeight: 48, boxSizing: 'border-box' }}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
          <X size={13} /> Cancel
        </button>
        <button onClick={() => { if (value.trim()) onSave(value.trim()); }} disabled={!value.trim()}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', background: 'var(--accent)', border: 'none', borderRadius: 8, color: '#0F0F10', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
          Send
        </button>
      </div>
      <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, textAlign: 'right' }}>Enter to send · Esc to cancel</p>
    </div>
  );
}

// ── Generated image bubble ────────────────────────────────────────────────────
function ImageBubble({ imageUrl: initialUrl, prompt: initialPrompt }: { imageUrl: string; prompt: string }) {
  const [blobUrl,     setBlobUrl]    = useState<string | null>(null);
  const [prompt,      setPrompt]     = useState(initialPrompt);
  const [rawUrl,      setRawUrl]     = useState(initialUrl);
  const [status,      setStatus]     = useState<'loading' | 'done' | 'error'>('loading');
  const [lightbox,    setLightbox]   = useState(false);
  const [editPrompt,  setEditPrompt] = useState(false);
  const [editVal,     setEditVal]    = useState(initialPrompt);
  const [elapsed,     setElapsed]    = useState(0);
  const controllerRef = useRef<AbortController | null>(null);

  const fetchImage = useCallback(async (url: string) => {
    controllerRef.current?.abort();
    const ctrl = new AbortController();
    controllerRef.current = ctrl;

    setStatus('loading');
    setBlobUrl(null);
    setElapsed(0);

    const tick = setInterval(() => setElapsed(s => s + 1), 1000);

    try {
      const res = await fetch(url, { signal: ctrl.signal });
      clearInterval(tick);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.startsWith('image/')) throw new Error('Not an image');
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      setBlobUrl(objectUrl);
      setStatus('done');
    } catch (e: any) {
      clearInterval(tick);
      if (e?.name === 'AbortError') return;
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    fetchImage(rawUrl);
    return () => { controllerRef.current?.abort(); };
  }, [rawUrl, fetchImage]);

  useEffect(() => {
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); };
  }, [blobUrl]);

  const reroll = useCallback((newPrompt?: string) => {
    const p = newPrompt ?? prompt;
    const encoded = encodeURIComponent(p);
    setPrompt(p);
    setEditPrompt(false);
    setRawUrl(`https://image.pollinations.ai/prompt/${encoded}?width=1024&height=768&nologo=true&seed=${Math.floor(Math.random() * 2147483647)}`);
  }, [prompt]);

  return (
    <>
      <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', maxWidth: 420, border: '1px solid var(--border)', background: 'var(--surface)' }}>
        {status === 'loading' && (
          <div style={{ width: '100%', aspectRatio: '4/3', background: 'var(--surface2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <Loader2 size={24} className="animate-spin text-amber-400" />
            <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: 500 }}>Generating image…</span>
            <span style={{ color: 'var(--muted)', fontSize: 12 }}>{elapsed}s · may take up to 30s</span>
          </div>
        )}

        {status === 'done' && blobUrl && (
          <img src={blobUrl} alt={prompt}
            style={{ display: 'block', width: '100%', cursor: 'zoom-in' }}
            onClick={() => setLightbox(true)}
          />
        )}

        {status === 'error' && (
          <div style={{ padding: 28, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
            <AlertCircle size={28} style={{ color: '#ef4444', margin: '0 auto 8px' }} />
            Generation failed or timed out.
            <button onClick={() => fetchImage(rawUrl)}
              style={{ display: 'block', margin: '10px auto 0', background: 'rgba(229,169,90,0.15)', border: '1px solid rgba(229,169,90,0.3)', borderRadius: 8, padding: '5px 14px', color: 'var(--accent)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}
            >Retry</button>
          </div>
        )}

        {status === 'done' && blobUrl && (
          <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
            <button onClick={() => setLightbox(true)} title="View full size"
              style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}>
              <ZoomIn size={14} />
            </button>
            <a href={blobUrl} download={`nova-${Date.now()}.jpg`} title="Download"
              style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <Download size={14} />
            </a>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, maxWidth: 420, flexWrap: 'wrap' }}>
        <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          &ldquo;{prompt}&rdquo;
        </p>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button onClick={() => reroll()} title="Generate variation" disabled={status === 'loading'}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(229,169,90,0.1)', border: '1px solid rgba(229,169,90,0.25)', borderRadius: 7, padding: '3px 8px', cursor: status === 'loading' ? 'not-allowed' : 'pointer', color: 'var(--accent)', fontSize: 11, fontFamily: 'inherit', opacity: status === 'loading' ? 0.5 : 1, transition: 'all 0.15s' }}
          >
            <RefreshCw size={11} /> Variation
          </button>
          <button onClick={() => { setEditVal(prompt); setEditPrompt(v => !v); }} title="Edit prompt"
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 7, padding: '3px 8px', cursor: 'pointer', color: 'var(--muted)', fontSize: 11, fontFamily: 'inherit', transition: 'all 0.15s' }}
          >
            <Pencil size={11} /> Edit
          </button>
        </div>
      </div>

      {editPrompt && (
        <div style={{ marginTop: 6, maxWidth: 420, display: 'flex', gap: 6 }}>
          <input value={editVal} onChange={e => setEditVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && editVal.trim()) reroll(editVal.trim()); if (e.key === 'Escape') setEditPrompt(false); }}
            autoFocus placeholder="New prompt…"
            style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--accent)', borderRadius: 8, padding: '6px 10px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
          />
          <button onClick={() => { if (editVal.trim()) reroll(editVal.trim()); }}
            style={{ background: 'var(--accent)', border: 'none', borderRadius: 8, padding: '6px 14px', color: '#0F0F10', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
            Go
          </button>
        </div>
      )}

      {lightbox && blobUrl && (
        <div onClick={() => setLightbox(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', padding: 24 }}>
          <img src={blobUrl} alt={prompt} style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }} onClick={e => e.stopPropagation()} />
          <button onClick={() => setLightbox(false)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', color: '#fff', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
      )}
    </>
  );
}

// ── Main bubble ───────────────────────────────────────────────────────────────
export default function MessageBubble({ message, isLast, isLastAI, onRegenerate, onEdit, onReact, reaction }: Props) {
  const isUser    = message.role === 'user';
  const isImage   = !!message.imageUrl && !isUser;
  const hasUserAttachment = isUser && !!message.imageUrl;
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
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang.startsWith('en') && v.localService);
    if (preferred) utterance.voice = preferred;
    utterance.onend   = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [speaking, message.content]);

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
      style={{ display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}
    >
      {/* Avatar */}
      {!isUser ? (
        <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginTop: 4, background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
          <Sparkles size={14} />
        </div>
      ) : (
        <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginTop: 4, background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <User size={14} style={{ color: 'var(--muted)' }} />
        </div>
      )}

      <div className={isUser ? 'msg-user' : 'msg-ai'} style={{ maxWidth: isUser ? '75%' : '88%', display: 'flex', flexDirection: 'column', gap: 4, alignItems: isUser ? 'flex-end' : 'flex-start' }}>

        {/* Image message */}
        {isImage ? (
          <ImageBubble imageUrl={message.imageUrl!} prompt={message.content} />
        ) : isUser && editing ? (
          <div style={{ width: '100%', minWidth: 260 }}>
            <EditBox initial={message.content} onSave={handleSave} onCancel={() => setEditing(false)} />
          </div>
        ) : (
          /* Normal bubble */
          <div style={{
            padding: isUser ? '10px 16px' : '8px 2px',
            borderRadius: isUser ? 16 : 0,
            background: isUser ? 'var(--surface2)' : 'transparent',
            border: isUser ? '1px solid var(--border)' : 'none',
            color: 'var(--text)',
            fontSize: 14.5, lineHeight: 1.7, wordBreak: 'break-word',
          }}>
            {/* User-attached image */}
            {hasUserAttachment && (
              <div style={{ marginBottom: message.content && message.content !== 'Image attached' ? 8 : 0, borderRadius: 10, overflow: 'hidden', maxWidth: 260, border: '1px solid var(--border)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={message.imageUrl} alt="Attached" style={{ display: 'block', width: '100%' }} />
              </div>
            )}
            {isUser ? (
              <span style={{ whiteSpace: 'pre-wrap' }}>
                {message.content === 'Image attached' && hasUserAttachment ? '' : message.content}
              </span>
            ) : (
              /* AI markdown with streaming cursor */
              <div className={`nova-markdown${message.isStreaming ? ' streaming-cursor' : ''}`} style={{ fontSize: 14.5, color: 'var(--text)' }}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      const lang  = match ? match[1] : '';
                      const code  = String(children).replace(/\n$/, '');
                      return !inline
                        ? <CodeBlock language={lang}>{code}</CodeBlock>
                        : <code style={{ background: 'rgba(229,169,90,0.12)', padding: '2px 6px', borderRadius: 5, fontSize: 13, fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent)' }} {...props}>{children}</code>;
                    },
                    a({ href, children }) {
                      return <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline', textUnderlineOffset: 3 }}>{children}</a>;
                    },
                    table({ children }) {
                      return <div style={{ overflowX: 'auto', margin: '12px 0' }}><table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>{children}</table></div>;
                    },
                    th({ children }) {
                      return <th style={{ border: '1px solid var(--border)', padding: '8px 12px', background: 'var(--surface)', textAlign: 'left', fontWeight: 600, color: 'var(--text)' }}>{children}</th>;
                    },
                    td({ children }) {
                      return <td style={{ border: '1px solid var(--border)', padding: '8px 12px', color: 'var(--muted)' }}>{children}</td>;
                    },
                    blockquote({ children }) {
                      return <blockquote style={{ borderLeft: '3px solid var(--accent)', margin: '12px 0', paddingLeft: 14, color: 'var(--muted)', fontStyle: 'italic' }}>{children}</blockquote>;
                    },
                    hr() {
                      return <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0' }} />;
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
            animate={{ opacity: hovered ? 1 : 0.4 }}
            transition={{ duration: 0.15 }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 2, paddingRight: 2, marginTop: 2 }}
          >
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>{time}</span>
            <CopyBtn text={message.content} size={12} />

            {/* TTS — AI messages only, not streaming */}
            {!isUser && !message.isStreaming && 'speechSynthesis' in (typeof window !== 'undefined' ? window : {}) && (
              <button
                onClick={speak}
                title={speaking ? 'Stop reading' : 'Read aloud'}
                style={{
                  display: 'flex', alignItems: 'center', gap: 3,
                  background: speaking ? 'rgba(229,169,90,0.15)' : 'none',
                  border: speaking ? '1px solid rgba(229,169,90,0.3)' : '1px solid transparent',
                  borderRadius: 6, cursor: 'pointer', padding: '2px 5px',
                  color: speaking ? 'var(--accent)' : 'var(--muted)', transition: 'all 0.15s', fontSize: 11,
                }}
              >
                {speaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
              </button>
            )}

            {/* Edit (user only) */}
            {isUser && onEdit && (
              <button onClick={() => setEditing(true)} title="Edit"
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 11, padding: '2px 4px', transition: 'color 0.15s', fontFamily: 'inherit' }}
              >
                <Pencil size={11} /> Edit
              </button>
            )}

            {/* Regenerate (last AI) */}
            {isLastAI && onRegenerate && !message.isStreaming && (
              <button onClick={onRegenerate} title="Regenerate"
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 11, padding: '2px 4px', transition: 'color 0.15s', fontFamily: 'inherit' }}
              >
                <RefreshCw size={11} /> Regenerate
              </button>
            )}

            {/* Reactions (AI only, not streaming) */}
            {!isUser && onReact && !message.isStreaming && (
              <div style={{ display: 'flex', gap: 3, marginLeft: 4 }}>
                {(['up', 'down'] as const).map(dir => (
                  <button key={dir}
                    onClick={() => onReact(dir)}
                    title={dir === 'up' ? 'Good response' : 'Poor response'}
                    style={{
                      display: 'flex', alignItems: 'center', background: reaction === dir ? (dir === 'up' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)') : 'none',
                      border: reaction === dir ? `1px solid ${dir === 'up' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.25)'}` : '1px solid transparent',
                      borderRadius: 6, cursor: 'pointer', padding: '2px 5px', transition: 'all 0.15s',
                      color: reaction === dir ? (dir === 'up' ? '#10b981' : '#ef4444') : 'var(--muted)',
                    }}
                  >
                    {dir === 'up'
                      ? <ThumbsUp  size={11} fill={reaction === 'up'   ? 'currentColor' : 'none'} />
                      : <ThumbsDown size={11} fill={reaction === 'down' ? 'currentColor' : 'none'} />}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
