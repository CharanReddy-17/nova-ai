'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import VoiceInput to avoid SSR issues with Web Speech API
const VoiceInput = dynamic(() => import('@/components/ui/VoiceInput'), { ssr: false });

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

  const submit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isSending) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    textareaRef.current?.focus();
  }, [value, isSending, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  // Voice transcript — append to current text
  const handleVoiceTranscript = useCallback((text: string) => {
    setValue(prev => {
      const sep = prev.trim() ? ' ' : '';
      return prev + sep + text;
    });
    textareaRef.current?.focus();
  }, []);

  const charCount = value.length;
  const isEmpty = !value.trim();

  return (
    <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', background: '#09090b' }}>
      {/* Input container */}
      <div
        id="message-input-box"
        style={{
          background: '#18181b',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16,
          padding: '12px 16px',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
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
            fontFamily: 'var(--font-inter), Inter, sans-serif',
            lineHeight: 1.6,
            maxHeight: MAX_HEIGHT,
            overflowY: value.length > 200 ? 'auto' : 'hidden',
          }}
          onFocus={() => {
            const box = document.getElementById('message-input-box');
            if (box) { box.style.borderColor = '#7c3aed'; box.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)'; }
          }}
          onBlur={() => {
            const box = document.getElementById('message-input-box');
            if (box) { box.style.borderColor = 'rgba(255,255,255,0.1)'; box.style.boxShadow = 'none'; }
          }}
        />

        {/* Bottom row: info · voice · send */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontSize: 11, color: '#3f3f46' }}>
            NOVA AI · Groq{charCount > 500 ? ` · ${charCount}/4000` : ''}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* 🎤 Voice input */}
            <VoiceInput onTranscript={handleVoiceTranscript} disabled={isSending} />

            {/* ↑ Send button */}
            <button
              onClick={submit}
              disabled={isEmpty || isSending}
              title="Send message (Enter)"
              style={{
                width: 36, height: 36,
                background: isEmpty || isSending
                  ? '#27272a'
                  : 'linear-gradient(135deg,#7c3aed,#a855f7)',
                border: 'none',
                borderRadius: 10,
                cursor: isEmpty || isSending ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
                color: isEmpty || isSending ? '#52525b' : '#fff',
                fontSize: 18,
                boxShadow: isEmpty || isSending ? 'none' : '0 4px 14px rgba(124,58,237,0.4)',
              }}
            >
              {isSending
                ? <div style={{ width: 14, height: 14, border: '2px solid #52525b', borderTopColor: '#a855f7', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                : '↑'}
            </button>
          </div>
        </div>
      </div>

      {/* Hint */}
      <p style={{ textAlign: 'center', fontSize: 10, color: '#3f3f46', marginTop: 6 }}>
        Press <span style={{ color: 'rgba(124,58,237,0.6)' }}>Enter</span> to send · <span style={{ color: 'rgba(124,58,237,0.6)' }}>Shift+Enter</span> for newline · <span style={{ color: 'rgba(124,58,237,0.6)' }}>🎤</span> for voice
      </p>
    </div>
  );
}
