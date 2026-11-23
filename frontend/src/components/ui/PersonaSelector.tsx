'use client';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles, FlaskConical, Code2, PenLine, GraduationCap, LucideIcon } from 'lucide-react';

export interface PersonaItem {
  id: string;
  name: string;
  icon: LucideIcon;
  tagline: string;
  color: string;
}

export const PERSONAS: PersonaItem[] = [
  {
    id: 'default',
    name: 'NOVA AI',
    icon: Sparkles,
    tagline: 'General assistant',
    color: '#E5A95A',
  },
  {
    id: 'scientist',
    name: 'Scientist',
    icon: FlaskConical,
    tagline: 'Science & research expert',
    color: '#38bdf8',
  },
  {
    id: 'coder',
    name: 'Coder',
    icon: Code2,
    tagline: 'Programming & systems expert',
    color: '#34d399',
  },
  {
    id: 'writer',
    name: 'Writer',
    icon: PenLine,
    tagline: 'Creative writing & editor',
    color: '#fbbf24',
  },
  {
    id: 'tutor',
    name: 'Tutor',
    icon: GraduationCap,
    tagline: 'Patient educational mentor',
    color: '#f472b6',
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
  const CurrentIcon = current.icon;

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
          padding: '6px 10px',
          background: open ? 'var(--surface2)' : 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 8, cursor: 'pointer', color: 'var(--text)',
          transition: 'all 0.15s',
        }}
      >
        <CurrentIcon size={14} style={{ color: current.color }} />
        <span style={{ fontSize: 13, fontWeight: 500 }}>{current.name}</span>
        <ChevronDown size={13} style={{ color: 'var(--muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0,
              minWidth: 220, background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12, padding: 6,
              boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
            }}
          >
            <p style={{ fontSize: 10, color: 'var(--muted)', padding: '4px 8px 6px', letterSpacing: '0.08em', fontWeight: 600 }}>
              SELECT PERSONA
            </p>
            {PERSONAS.map(p => {
              const active = p.id === selectedPersona;
              const IconComp = p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => { onSelect(p.id); setOpen(false); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 8, border: 'none',
                    cursor: 'pointer', textAlign: 'left', color: 'var(--text)',
                    background: active ? 'var(--surface2)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface2)'; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 7, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                  }}>
                    <IconComp size={14} style={{ color: p.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: active ? 600 : 400, color: active ? 'var(--text)' : 'var(--muted)' }}>{p.name}</p>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)' }}>{p.tagline}</p>
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
