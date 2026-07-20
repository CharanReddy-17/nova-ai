'use client';
import { motion } from 'framer-motion';

export default function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
      {/* Avatar */}
      <div className="avatar" style={{ width: 32, height: 32, fontSize: 13, flexShrink: 0 }}>N</div>
      {/* Dots */}
      <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px 18px 18px 4px', padding: '14px 18px', display: 'flex', gap: 5, alignItems: 'center' }}>
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </motion.div>
  );
}
