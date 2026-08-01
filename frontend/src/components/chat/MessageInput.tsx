'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Paperclip, X, Image as ImageIcon } from 'lucide-react';
import api from '@/services/api';

const VoiceInput = dynamic(() => import('@/components/ui/VoiceInput'), { ssr: false });

interface AttachedFile {
  file:      File;
  preview:   string;   // local blob URL for preview
  uploading: boolean;
  url?:      string;   // final URL after upload
  error?:    string;
}

interface MessageInputProps {
  onSend:      (content: string, attachedImageUrl?: string) => void;
  isSending:   boolean;
  placeholder?: string;
}

export default function MessageInput({ onSend, isSending, placeholder = 'Message NOVA AI…' }: MessageInputProps) {
  const [value,    setValue]    = useState('');
  const [attached, setAttached] = useState<AttachedFile | null>(null);
  const textareaRef  = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_HEIGHT = 200;

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, MAX_HEIGHT) + 'px';
  }, [value]);

  // Cleanup blob URL on unmount / change
  useEffect(() => {
    return () => { if (attached?.preview) URL.revokeObjectURL(attached.preview); };
  }, [attached?.preview]);

  // ── File pick ────────────────────────────────────────────────────────────────
  const handleFilePick = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!e.target) return;
    (e.target as HTMLInputElement).value = '';          // allow re-pick same file
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setAttached({ file, preview, uploading: true });

    try {
      const form = new FormData();
      form.append('image', file);
      const res = await api.post<{ url: string }>('/uploads', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAttached(prev => prev ? { ...prev, uploading: false, url: res.data.url } : null);
    } catch (err: any) {
      setAttached(prev => prev
        ? { ...prev, uploading: false, error: err?.response?.data?.message || 'Upload failed' }
        : null);
    }
  }, []);

  // ── Paste image ──────────────────────────────────────────────────────────────
  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const item = Array.from(e.clipboardData.items).find(i => i.type.startsWith('image/'));
    if (!item) return;
    const file = item.getAsFile();
    if (!file) return;
    const synth = { target: { files: [file], value: '' } } as any;
    handleFilePick(synth);
  }, [handleFilePick]);

  // ── Drag-and-drop ────────────────────────────────────────────────────────────
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const synth = { target: { files: [file], value: '' } } as any;
    handleFilePick(synth);
  }, [handleFilePick]);

  // ── Submit ───────────────────────────────────────────────────────────────────
  const submit = useCallback(() => {
    const trimmed = value.trim();
    if ((!trimmed && !attached?.url) || isSending) return;
    if (attached?.uploading) return;                   // wait for upload
    onSend(trimmed || '📎 Image attached', attached?.url);
    setValue('');
    setAttached(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    textareaRef.current?.focus();
  }, [value, isSending, attached, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  const handleVoiceTranscript = useCallback((text: string) => {
    setValue(prev => { const sep = prev.trim() ? ' ' : ''; return prev + sep + text; });
    textareaRef.current?.focus();
  }, []);

  const charCount = value.length;
  const isEmpty   = !value.trim() && !attached?.url;
  const canSend   = !isEmpty && !isSending && !attached?.uploading;

  return (
    <div
      style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', background: '#09090b' }}
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: 'none' }}
        onChange={handleFilePick}
      />

      {/* ── Attached image preview ───────────────────────────────────────────── */}
      {attached && (
        <div style={{
          marginBottom: 10, padding: '10px 12px',
          background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)',
          borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          {/* Thumbnail */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={attached.preview}
              alt="attachment"
              style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8, display: 'block' }}
            />
            {attached.uploading && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)',
                borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#a855f7', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#fafafa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {attached.file.name}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: attached.error ? '#ef4444' : attached.uploading ? '#a855f7' : '#10b981' }}>
              {attached.error
                ? `❌ ${attached.error}`
                : attached.uploading
                  ? 'Uploading…'
                  : '✓ Ready to send'}
            </p>
          </div>

          {/* Remove */}
          <button
            onClick={() => { URL.revokeObjectURL(attached.preview); setAttached(null); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525b', padding: 4, flexShrink: 0 }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ── Input box ────────────────────────────────────────────────────────── */}
      <div
        id="message-input-box"
        style={{
          background: '#18181b', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16, padding: '12px 16px',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={attached ? 'Add a message (optional)…' : placeholder}
          disabled={isSending}
          rows={1}
          style={{
            width: '100%', background: 'transparent', border: 'none', outline: 'none',
            resize: 'none', color: '#fafafa', fontSize: 14,
            fontFamily: 'var(--font-inter), Inter, sans-serif',
            lineHeight: 1.6, maxHeight: MAX_HEIGHT,
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

        {/* Bottom row: attach · info · voice · send */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* 📎 Attach image */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isSending || !!attached}
              title="Attach image (JPG, PNG, WebP)"
              style={{
                background: 'none', border: 'none', cursor: isSending || !!attached ? 'not-allowed' : 'pointer',
                padding: '4px 6px', borderRadius: 7, color: attached ? '#7c3aed' : '#52525b',
                display: 'flex', alignItems: 'center', transition: 'color 0.15s',
              }}
              onMouseEnter={e => { if (!isSending && !attached) (e.currentTarget as HTMLButtonElement).style.color = '#a855f7'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = attached ? '#7c3aed' : '#52525b'; }}
            >
              {attached ? <ImageIcon size={16} /> : <Paperclip size={16} />}
            </button>

            <span style={{ fontSize: 11, color: '#3f3f46' }}>
              NOVA AI · Groq{charCount > 500 ? ` · ${charCount}/4000` : ''}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <VoiceInput onTranscript={handleVoiceTranscript} disabled={isSending} />

            {/* Send */}
            <button
              onClick={submit}
              disabled={!canSend}
              title="Send message (Enter)"
              style={{
                width: 36, height: 36,
                background: !canSend ? '#27272a' : 'linear-gradient(135deg,#7c3aed,#a855f7)',
                border: 'none', borderRadius: 10,
                cursor: !canSend ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
                color: !canSend ? '#52525b' : '#fff',
                fontSize: 18,
                boxShadow: !canSend ? 'none' : '0 4px 14px rgba(124,58,237,0.4)',
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
        <span style={{ color: 'rgba(124,58,237,0.6)' }}>Enter</span> send ·{' '}
        <span style={{ color: 'rgba(124,58,237,0.6)' }}>Shift+Enter</span> newline ·{' '}
        <span style={{ color: 'rgba(124,58,237,0.6)' }}>📎</span> attach image ·{' '}
        <span style={{ color: 'rgba(124,58,237,0.6)' }}>🎤</span> voice
      </p>
    </div>
  );
}
