'use client';
import { useState, useRef, useEffect } from 'react';

interface MessageInputProps {
  onSend: (content: string) => void;
  isSending: boolean;
  placeholder?: string;
}

export default function MessageInput({ onSend, isSending, placeholder = 'Message NOVA AI…' }: MessageInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const MAX_HEIGHT = 200;

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, MAX_HEIGHT) + 'px';
  }, [value]);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || isSending) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const charCount = value.length;
  const isEmpty = !value.trim();

  return (
    <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', background: '#09090b' }}>
      {/* Input container */}
      <div style={{
        background: '#18181b',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: '12px 16px',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
        onFocus={() => {}} // Handled by textarea
      >
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isSending}
          rows={1}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            color: '#fafafa',
            fontSize: 14,
            fontFamily: 'Inter, sans-serif',
            lineHeight: 1.6,
            maxHeight: MAX_HEIGHT,
            overflowY: value.length > 200 ? 'auto' : 'hidden',
          }}
          onFocus={e => {
            const parent = e.currentTarget.closest('div') as HTMLDivElement;
            if (parent) { parent.style.borderColor = '#7c3aed'; parent.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)'; }
          }}
          onBlur={e => {
            const parent = e.currentTarget.closest('div') as HTMLDivElement;
            if (parent) { parent.style.borderColor = 'rgba(255,255,255,0.1)'; parent.style.boxShadow = 'none'; }
          }}
        />

        {/* Bottom row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontSize: 12, color: '#3f3f46' }}>
            NOVA AI · Powered by Groq{charCount > 500 ? ` · ${charCount}/4000` : ''}
          </span>
          <button
            onClick={submit}
            disabled={isEmpty || isSending}
            style={{
              width: 34, height: 34,
              background: isEmpty || isSending ? '#27272a' : 'linear-gradient(135deg,#7c3aed,#a855f7)',
              border: 'none',
              borderRadius: 10,
              cursor: isEmpty || isSending ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
              color: '#fff',
              fontSize: 16,
              boxShadow: isEmpty || isSending ? 'none' : '0 4px 12px rgba(124,58,237,0.4)',
            }}>
            {isSending ? <div className="spinner" style={{ width: 14, height: 14 }} /> : '↑'}
          </button>
        </div>
      </div>

      {/* Hint */}
      <p style={{ textAlign: 'center', fontSize: 11, color: '#3f3f46', marginTop: 8 }}>
        AI can make mistakes. Verify important information. · Enter to send, Shift+Enter for newline
      </p>
    </div>
  );
}
