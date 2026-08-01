'use client';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  open: boolean;
  onClose: () => void;
}

const shortcuts = [
  { keys: ['Alt', 'N'],    label: 'New chat' },
  { keys: ['Ctrl', 'K'],   label: 'Command palette / search chats' },
  { keys: ['Ctrl', '/'],   label: 'Show keyboard shortcuts' },
  { keys: ['Enter'],       label: 'Send message' },
  { keys: ['Shift', '↵'],  label: 'New line in message' },
  { keys: ['Esc'],         label: 'Close modals / cancel edit' },
];

export default function ShortcutsModal({ open, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="shortcuts-overlay"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={e => e.stopPropagation()}
            style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24, width: 380, boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ color: '#fafafa', fontSize: 15, fontWeight: 700, margin: 0 }}>Keyboard Shortcuts</h2>
                <p style={{ color: '#52525b', fontSize: 12, margin: '2px 0 0' }}>Speed up your workflow</p>
              </div>
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: '#71717a', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ×
              </button>
            </div>

            {/* Shortcut rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {shortcuts.map(({ keys, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontSize: 13, color: '#a1a1aa' }}>{label}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {keys.map((k, i) => (
                      <span key={i} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#1c1c1f', border: '1px solid rgba(255,255,255,0.1)', borderBottom: '2px solid rgba(255,255,255,0.18)', borderRadius: 6, padding: '2px 8px', fontSize: 11, color: '#a1a1aa', fontFamily: 'JetBrains Mono, monospace', minWidth: 28 }}>
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
              <span style={{ fontSize: 11, color: '#3f3f46' }}>Press <kbd style={{ background: '#1c1c1f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '1px 5px', fontSize: 11, color: '#71717a' }}>Ctrl /</kbd> anytime to open this</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
