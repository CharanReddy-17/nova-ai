'use client';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
      {/* Avatar */}
      <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginTop: 4, background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
        <Sparkles size={14} />
      </div>
      {/* Dots */}
      <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 16, padding: '10px 16px', display: 'flex', gap: 6, alignItems: 'center' }}>
        <div className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
        <div className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
        <div className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
      </div>
    </motion.div>
  );
}
