'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Zap, Brain, Code2, Sparkles } from 'lucide-react';

export const MODELS = [
  {
    id: 'llama-3.3-70b-versatile',
    name: 'LLaMA 3.3 70B',
    badge: 'BEST',
    badgeColor: '#E5A95A',
    desc: 'Most intelligent · Deep reasoning',
    icon: Brain,
    speed: 4,
    smarts: 5,
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'LLaMA 3.1 8B',
    badge: 'FAST',
    badgeColor: '#38bdf8',
    desc: 'Instant latency · Quick tasks',
    icon: Zap,
    speed: 5,
    smarts: 3,
  },
  {
    id: 'mixtral-8x7b-32768',
    name: 'Mixtral 8x7B',
    badge: 'CODE',
    badgeColor: '#34d399',
    desc: 'Code synthesis & long context',
    icon: Code2,
    speed: 4,
    smarts: 4,
  },
  {
    id: 'gemma2-9b-it',
    name: 'Gemma 2 9B',
    badge: 'CREATIVE',
    badgeColor: '#fbbf24',
    desc: 'Concise & creative writing',
    icon: Sparkles,
    speed: 5,
    smarts: 3,
  },
];

interface ModelSelectorProps {
  selectedModel: string;
  onSelect: (modelId: string) => void;
}

export default function ModelSelector({ selectedModel, onSelect }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = MODELS.find(m => m.id === selectedModel) || MODELS[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const Dots = ({ count, filled }: { count: number; filled: number }) => (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: i < filled ? 'var(--accent)' : 'var(--border)' }}
        />
      ))}
    </div>
  );

  return (
    <div ref={ref} style={{ position: 'relative', zIndex: 50 }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '6px 10px',
          background: open ? 'var(--surface2)' : 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          cursor: 'pointer',
          transition: 'all 0.15s',
          color: 'var(--text)',
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            padding: '1px 5px',
            borderRadius: 4,
            background: 'var(--surface2)',
            color: current.badgeColor,
            border: `1px solid ${current.badgeColor}44`,
            letterSpacing: '0.05em',
          }}
        >
          {current.badge}
        </span>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{current.name}</span>
        <ChevronDown
          size={13}
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s',
            color: 'var(--muted)',
          }}
        />
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
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              minWidth: 260,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 6,
              boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
            }}
          >
            <p style={{ fontSize: 10, color: 'var(--muted)', padding: '4px 8px 6px', letterSpacing: '0.08em', fontWeight: 600 }}>
              SELECT MODEL
            </p>
            {MODELS.map(model => {
              const Icon = model.icon;
              const isActive = model.id === selectedModel;
              return (
                <button
                  key={model.id}
                  onClick={() => { onSelect(model.id); setOpen(false); }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    background: isActive ? 'var(--surface2)' : 'transparent',
                    color: 'var(--text)',
                    textAlign: 'left',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface2)'; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                >
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={15} style={{ color: model.badgeColor }} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{model.name}</span>
                      <span style={{
                        fontSize: 9,
                        fontWeight: 700,
                        padding: '1px 4px',
                        borderRadius: 3,
                        background: 'var(--surface2)',
                        color: model.badgeColor,
                        border: `1px solid ${model.badgeColor}44`,
                        letterSpacing: '0.05em',
                      }}>
                        {model.badge}
                      </span>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>{model.desc}</p>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 9, color: 'var(--muted)' }}>SPEED</span>
                        <Dots count={5} filled={model.speed} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 9, color: 'var(--muted)' }}>SMARTS</span>
                        <Dots count={5} filled={model.smarts} />
                      </div>
                    </div>
                  </div>

                  {isActive && (
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: model.badgeColor, flexShrink: 0 }} />
                  )}
                </button>
              );
            })}

            <div style={{ margin: '6px 8px 4px', padding: '6px 0 0', borderTop: '1px solid var(--border)' }}>
              <p style={{ fontSize: 10, color: 'var(--muted)', margin: 0 }}>
                Powered by Groq ultra-low latency infrastructure
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
