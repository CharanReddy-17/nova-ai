'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, ExternalLink } from 'lucide-react';

interface Message {
  role:      'user' | 'assistant';
  content:   string;
  timestamp: string;
}

interface SharedChat {
  title:     string;
  messages:  Message[];
  createdAt: string;
  shareId:   string;
}

function CodeBlock({ language, children }: { language: string; children: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ position: 'relative', margin: '10px 0', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: '#1a1a2e', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ fontSize: 11, color: '#71717a', fontFamily: 'monospace' }}>{language || 'code'}</span>
        <button onClick={async () => { await navigator.clipboard.writeText(children); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#10b981' : '#71717a', fontSize: 11, fontFamily: 'inherit', padding: '2px 6px' }}>
          {copied ? <Check size={11} /> : <Copy size={11} />} {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter language={language || 'text'} style={oneDark}
        customStyle={{ margin: 0, padding: '14px 16px', fontSize: 13, background: '#0d0d14', borderRadius: 0, fontFamily: 'JetBrains Mono, monospace' }}
        showLineNumbers={children.split('\n').length > 5}
        lineNumberStyle={{ color: '#3f3f46', fontSize: 11 }}>
        {children}
      </SyntaxHighlighter>
    </div>
  );
}

export default function SharedConversationPage() {
  const params = useParams();
  const shareId = params?.shareId as string;

  const [chat,    setChat]    = useState<SharedChat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!shareId) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    fetch(`${apiUrl}/api/share/${shareId}`)
      .then(r => { if (!r.ok) throw new Error('not_found'); return r.json(); })
      .then(data => setChat(data))
      .catch(err => setError(err.message === 'not_found'
        ? 'This conversation has been removed or the link is no longer active.'
        : 'Failed to load conversation. Please try again.'
      ))
      .finally(() => setLoading(false));
  }, [shareId]);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 auto 16px', animation: 'pulse 2s ease-in-out infinite' }}>N</div>
          <p style={{ color: '#52525b', fontSize: 14 }}>Loading conversation…</p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error || !chat) {
    return (
      <div style={{ minHeight: '100vh', background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h1 style={{ color: '#fafafa', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Link not available</h1>
          <p style={{ color: '#71717a', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>{error}</p>
          <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            Try NOVA AI free →
          </a>
        </div>
      </div>
    );
  }

  const msgCount  = chat.messages.filter(m => m.role === 'user').length;
  const createdAt = new Date(chat.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // ── Conversation ─────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background: #09090b; color: #fafafa; -webkit-font-smoothing: antialiased; }
        .nova-md p { margin: 6px 0; }
        .nova-md ul, .nova-md ol { padding-left: 20px; margin: 8px 0; }
        .nova-md li { margin: 4px 0; }
        .nova-md h1,.nova-md h2,.nova-md h3 { margin: 14px 0 6px; font-weight: 700; }
        @keyframes fadeUp { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: translateY(0); } }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#09090b' }}>

        {/* ── Top banner ── */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.015)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 10 }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#fff' }}>N</div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fafafa' }}>NOVA AI</span>
          </a>
          <a href="/" target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', borderRadius: 9, color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            Try NOVA AI free <ExternalLink size={13} />
          </a>
        </div>

        {/* ── Conversation container ── */}
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 20px 80px' }}>

          {/* Title & meta */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: '#7c3aed', textTransform: 'uppercase' }}>Shared Conversation</span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fafafa', marginBottom: 10, lineHeight: 1.25 }}>{chat.title}</h1>
            <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#52525b' }}>
              <span>📅 {createdAt}</span>
              <span>💬 {msgCount} {msgCount === 1 ? 'message' : 'messages'}</span>
              <span>🤖 Powered by NOVA AI</span>
            </div>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginTop: 24 }} />
          </motion.div>

          {/* Messages */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {chat.messages.map((msg, i) => {
              const isUser = msg.role === 'user';
              const time   = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.5) }}
                  style={{ display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row', alignItems: 'flex-start', gap: 10 }}
                >
                  {/* Avatar */}
                  {!isUser && (
                    <div style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, marginTop: 2, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff' }}>N</div>
                  )}
                  {isUser && (
                    <div style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, marginTop: 2, background: '#27272a', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#71717a', fontWeight: 700 }}>U</div>
                  )}

                  <div style={{ maxWidth: isUser ? '72%' : '85%', display: 'flex', flexDirection: 'column', gap: 4, alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      padding: isUser ? '10px 14px' : '12px 16px',
                      borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: isUser ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : '#18181b',
                      border: isUser ? 'none' : '1px solid rgba(255,255,255,0.07)',
                      color: isUser ? '#fff' : '#e4e4e7',
                      fontSize: 14, lineHeight: 1.65, wordBreak: 'break-word',
                    }}>
                      {isUser ? (
                        <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                      ) : (
                        <div className="nova-md">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                            code({ node, inline, className, children, ...props }: any) {
                              const match = /language-(\w+)/.exec(className || '');
                              const lang  = match ? match[1] : '';
                              const code  = String(children).replace(/\n$/, '');
                              return !inline
                                ? <CodeBlock language={lang}>{code}</CodeBlock>
                                : <code style={{ background: 'rgba(124,58,237,0.15)', padding: '2px 6px', borderRadius: 5, fontSize: 13, fontFamily: 'JetBrains Mono, monospace', color: '#c4b5fd' }} {...props}>{children}</code>;
                            },
                            a({ href, children }) { return <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#06b6d4', textDecoration: 'underline' }}>{children}</a>; },
                            blockquote({ children }) { return <blockquote style={{ borderLeft: '3px solid #7c3aed', margin: '8px 0', paddingLeft: 12, color: '#a1a1aa', fontStyle: 'italic' }}>{children}</blockquote>; },
                          }}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: '#3f3f46', paddingLeft: 2, paddingRight: 2 }}>{time}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* CTA footer */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            style={{ marginTop: 60, padding: 28, background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 18, textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#fff', margin: '0 auto 14px' }}>N</div>
            <h2 style={{ color: '#fafafa', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Want to chat like this?</h2>
            <p style={{ color: '#71717a', fontSize: 14, marginBottom: 20 }}>NOVA AI is free — powered by LLaMA 3.3 70B via Groq. No credit card needed.</p>
            <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 28px', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
              Start for free →
            </a>
          </motion.div>
        </div>
      </div>
    </>
  );
}
