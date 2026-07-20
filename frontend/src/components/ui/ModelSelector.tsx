'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Zap, Brain, Code2, Sparkles } from 'lucide-react';

export const MODELS = [
  {
    id: 'llama-3.3-70b-versatile',
    name: 'LLaMA 3.3 70B',
    badge: 'BEST',
    badgeColor: '#7c3aed',
    desc: 'Most intelligent · Best for complex tasks',
    icon: Brain,
    speed: 4,       // out of 5
    smarts: 5,
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'LLaMA 3.1 8B',
    badge: 'FAST',
    badgeColor: '#06b6d4',
    desc: 'Blazing fast · Great for quick questions',
    icon: Zap,
    speed: 5,
    smarts: 3,
  },
  {
    id: 'mixtral-8x7b-32768',
    name: 'Mixtral 8x7B',
    badge: 'CODE',
    badgeColor: '#10b981',
    desc: 'Expert at code · Long context window',
    icon: Code2,
    speed: 4,
    smarts: 4,
  },
  {
    id: 'gemma2-9b-it',
    name: 'Gemma 2 9B',
    badge: 'NEW',
    badgeColor: '#f59e0b',
    desc: 'Google\'s model · Creative & concise',
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
          style={{ background: i < filled ? 'rgba(124,58,237,0.9)' : 'rgba(255,255,255,0.12)' }}
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
          gap: 6,
          padding: '5px 10px 5px 8px',
          background: open ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${open ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 10,
          cursor: 'pointer',
          transition: 'all 0.15s',
          color: '#fff',
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            padding: '1px 5px',
            borderRadius: 4,
            background: current.badgeColor,
            color: '#fff',
            letterSpacing: '0.05em',
          }}
        >
          {current.badge}
        </span>
        <span style={{ fontSize: 12, fontWeight: 500 }}>{current.name}</span>
        <ChevronDown
          size={13}
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s',
            opacity: 0.5,
          }}
        />
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
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              minWidth: 260,
              background: '#111113',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 14,
              padding: 6,
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            }}
          >
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', padding: '4px 8px 6px', letterSpacing: '0.08em', fontWeight: 600 }}>
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
                    borderRadius: 10,
                    border: 'none',
                    cursor: 'pointer',
                    background: isActive ? 'rgba(124,58,237,0.15)' : 'transparent',
                    color: '#fff',
                    textAlign: 'left',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                >
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: isActive ? `${model.badgeColor}22` : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${isActive ? model.badgeColor + '44' : 'rgba(255,255,255,0.06)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={15} style={{ color: isActive ? model.badgeColor : 'rgba(255,255,255,0.4)' }} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{model.name}</span>
                      <span style={{
                        fontSize: 8,
                        fontWeight: 700,
                        padding: '1px 4px',
                        borderRadius: 3,
                        background: model.badgeColor,
                        color: '#fff',
                        letterSpacing: '0.05em',
                      }}>
                        {model.badge}
                      </span>
                    </div>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: 0 }}>{model.desc}</p>
                    <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>SPEED</span>
                        <Dots count={5} filled={model.speed} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>SMARTS</span>
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

            <div style={{ margin: '6px 8px 4px', padding: '6px 0 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', margin: 0 }}>
                ✦ All models free · Powered by Groq infrastructure
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
