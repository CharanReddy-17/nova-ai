'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '@/services/chatService';

interface Props { message: Message; }

function CodeBlock({ children, className }: { children?: React.ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);
  const lang = className?.replace('language-', '') ?? 'code';
  const text = String(children).replace(/\n$/, '');
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  return (
    <div className="code-block" style={{ margin: '10px 0' }}>
      <div className="code-block-header">
        <span>{lang}</span>
        <button onClick={copy} style={{ background: 'none', border: 'none', color: copied ? '#22c55e' : '#71717a', cursor: 'pointer', fontSize: 11, padding: '2px 6px', borderRadius: 4, transition: 'color 0.2s' }}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre style={{ padding: 14, overflowX: 'auto', fontSize: 13, lineHeight: 1.6, color: '#e2e8f0', margin: 0 }}>
        <code>{text}</code>
      </pre>
    </div>
  );
}

function InlineCode({ children }: { children?: React.ReactNode }) {
  return (
    <code style={{ background: 'rgba(124,58,237,0.15)', color: '#c4b5fd', padding: '2px 6px', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875em' }}>
      {children}
    </code>
  );
}

function formatTime(ts: string) {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20, flexDirection: isUser ? 'row-reverse' : 'row' }}>

      {/* Avatar */}
      {!isUser && (
        <div className="avatar" style={{ width: 32, height: 32, fontSize: 13, flexShrink: 0 }}>N</div>
      )}
      {isUser && (
        <div className="avatar" style={{ width: 32, height: 32, fontSize: 13, flexShrink: 0, background: 'linear-gradient(135deg,#27272a,#3f3f46)' }}>U</div>
      )}

      {/* Bubble */}
      <div style={{ maxWidth: isUser ? '75%' : '85%', display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
        {isUser ? (
          <div className="chat-bubble-user">
            <p style={{ margin: 0, color: '#fff', fontSize: 14, lineHeight: 1.6 }}>{message.content}</p>
          </div>
        ) : (
          <div className="chat-bubble-ai">
            <div className="prose">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // @ts-ignore
                  code({ node, inline, className, children, ...props }) {
                    if (inline) return <InlineCode>{children}</InlineCode>;
                    return <CodeBlock className={className}>{children}</CodeBlock>;
                  },
                  a: ({ children, href }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#06b6d4' }}>{children}</a>
                  ),
                }}>
                {message.content}
              </ReactMarkdown>
            </div>

            {/* NASA images if any */}
            {message.nasaImages && message.nasaImages.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                {message.nasaImages.map((img, i) => (
                  <div key={i} style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.title} style={{ width: 120, height: 80, objectFit: 'cover', display: 'block' }} />
                    <p style={{ fontSize: 10, color: '#71717a', padding: '4px 6px', background: '#0a0a0f', margin: 0, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{img.title}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Timestamp */}
        <span style={{ fontSize: 11, color: '#3f3f46', marginTop: 4, paddingInline: 4 }}>
          {formatTime(message.timestamp)}
        </span>
      </div>
    </motion.div>
  );
}
