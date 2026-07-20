'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export const PERSONAS = [
  {
    id: 'default',
    name: 'NOVA AI',
    emoji: '🤖',
    tagline: 'General assistant',
    color: '#7c3aed',
    gradient: 'linear-gradient(135deg, #7c3aed, #a855f7)',
  },
  {
    id: 'scientist',
    name: 'Scientist',
    emoji: '🔬',
    tagline: 'Science & research expert',
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #0e7490, #06b6d4)',
  },
  {
    id: 'coder',
    name: 'Coder',
    emoji: '💻',
    tagline: 'Programming & code expert',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #059669, #10b981)',
  },
  {
    id: 'writer',
    name: 'Writer',
    emoji: '✍️',
    tagline: 'Creative writing & editing',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #d97706, #fbbf24)',
  },
  {
    id: 'tutor',
    name: 'Tutor',
    emoji: '👨‍🏫',
    tagline: 'Patient educational mentor',
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #db2777, #f472b6)',
  },
];

interface PersonaSelectorProps {
  selectedPersona: string;
  onSelect: (id: string) => void;
}

export default function PersonaSelector({ selectedPersona, onSelect }: PersonaSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = PERSONAS.find(p => p.id === selectedPersona) || PERSONAS[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', zIndex: 50 }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '5px 10px 5px 7px',
          background: open ? `${current.color}22` : 'rgba(255,255,255,0.05)',
          border: `1px solid ${open ? current.color + '55' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 10, cursor: 'pointer', color: '#fff',
          transition: 'all 0.15s',
        }}
      >
        <span style={{ fontSize: 16, lineHeight: 1 }}>{current.emoji}</span>
        <span style={{ fontSize: 12, fontWeight: 500 }}>{current.name}</span>
        <ChevronDown size={12} style={{ opacity: 0.4, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0,
              minWidth: 230, background: '#111113',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 14, padding: 6,
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            }}
          >
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', padding: '4px 8px 6px', letterSpacing: '0.08em', fontWeight: 600 }}>
              CHOOSE PERSONA
            </p>
            {PERSONAS.map(p => {
              const active = p.id === selectedPersona;
              return (
                <button
                  key={p.id}
                  onClick={() => { onSelect(p.id); setOpen(false); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 10px', borderRadius: 10, border: 'none',
                    cursor: 'pointer', textAlign: 'left', color: '#fff',
                    background: active ? `${p.color}20` : 'transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                >
                  {/* Emoji circle */}
                  <div style={{
                    width: 34, height: 34, borderRadius: 9, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    background: active ? `${p.color}30` : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${active ? p.color + '50' : 'rgba(255,255,255,0.06)'}`,
                    fontSize: 17,
                  }}>
                    {p.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: active ? 600 : 400, color: active ? '#fafafa' : '#a1a1aa' }}>{p.name}</p>
                    <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{p.tagline}</p>
                  </div>
                  {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.color, flexShrink: 0 }} />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
