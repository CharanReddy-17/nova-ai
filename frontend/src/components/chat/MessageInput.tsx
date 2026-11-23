'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Paperclip, X, Image as ImageIcon, ArrowUp, Loader2, Sparkles } from 'lucide-react';
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
  const [isFocused, setIsFocused] = useState(false);
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
    (e.target as HTMLInputElement).value = '';
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
    if (attached?.uploading) return;
    onSend(trimmed || 'Image attached', attached?.url);
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
      style={{ padding: '8px 0', background: 'transparent' }}
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
          marginBottom: 10, padding: '10px 14px',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 14, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          {/* Thumbnail */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={attached.preview}
              alt="attachment"
              style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, display: 'block', border: '1px solid var(--border)' }}
            />
            {attached.uploading && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)',
                borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Loader2 size={16} className="animate-spin text-amber-400" />
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {attached.file.name}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: attached.error ? '#ef4444' : attached.uploading ? 'var(--accent)' : '#10b981' }}>
              {attached.error
                ? attached.error
                : attached.uploading
                  ? 'Uploading image…'
                  : 'Ready to send'}
            </p>
          </div>

          {/* Remove */}
          <button
            onClick={() => { URL.revokeObjectURL(attached.preview); setAttached(null); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 6, borderRadius: 6, display: 'flex' }}
            title="Remove attachment"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Input container ──────────────────────────────────────────────────── */}
      <div
        id="message-input-box"
        style={{
          background: 'var(--surface)',
          border: `1px solid ${isFocused ? 'var(--accent)' : 'var(--border)'}`,
          boxShadow: isFocused ? '0 0 0 2px rgba(229,169,90,0.18)' : '0 2px 8px rgba(0,0,0,0.2)',
          borderRadius: 20,
          padding: '12px 16px 10px',
          transition: 'all 0.2s ease',
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={attached ? 'Add a message or instruction…' : placeholder}
          disabled={isSending}
          rows={1}
          style={{
            width: '100%', background: 'transparent', border: 'none', outline: 'none',
            resize: 'none', color: 'var(--text)', fontSize: 14,
            fontFamily: 'inherit', lineHeight: 1.6, maxHeight: MAX_HEIGHT,
            overflowY: value.length > 200 ? 'auto' : 'hidden',
          }}
        />

        {/* Bottom row: attach · model info · voice · send */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Attach image button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSending || !!attached}
              title="Attach image (JPG, PNG, WebP)"
              style={{
                background: attached ? 'rgba(229,169,90,0.15)' : 'transparent',
                border: 'none',
                cursor: isSending || !!attached ? 'not-allowed' : 'pointer',
                padding: '6px', borderRadius: 8,
                color: attached ? 'var(--accent)' : 'var(--muted)',
                display: 'flex', alignItems: 'center', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!isSending && !attached) (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = attached ? 'var(--accent)' : 'var(--muted)'; }}
            >
              {attached ? <ImageIcon size={18} /> : <Paperclip size={18} />}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>
              <Sparkles size={12} style={{ color: 'var(--accent)' }} />
              <span>NOVA AI</span>
              {charCount > 500 && <span>· {charCount}/4000</span>}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <VoiceInput onTranscript={handleVoiceTranscript} disabled={isSending} />

            {/* Send button */}
            <button
              onClick={submit}
              disabled={!canSend}
              title="Send message (Enter)"
              style={{
                width: 34, height: 34,
                background: !canSend ? 'var(--surface2)' : 'var(--accent)',
                border: 'none', borderRadius: 12,
                cursor: !canSend ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease',
                color: !canSend ? 'var(--muted)' : '#0F0F10',
                boxShadow: !canSend ? 'none' : '0 2px 10px rgba(229,169,90,0.3)',
              }}
            >
              {isSending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ArrowUp size={18} strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Helpful shortcuts info */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
        <span><strong style={{ color: 'var(--text2)', fontWeight: 600 }}>Enter</strong> to send</span>
        <span>•</span>
        <span><strong style={{ color: 'var(--text2)', fontWeight: 600 }}>Shift+Enter</strong> newline</span>
        <span>•</span>
        <span><strong style={{ color: 'var(--accent)', fontWeight: 600 }}>/imagine</strong> for image</span>
      </div>
    </div>
  );
}
