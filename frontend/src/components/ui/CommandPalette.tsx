'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface CommandItem {
  id: string;
  icon: string;
  label: string;
  sub?: string;
  action: () => void;
  category: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onAskAI: (q: string) => void;
}

const SPACE_OBJECTS = [
  { id: 'earth',      icon: '🌍', label: 'Earth',       sub: 'Third planet from the Sun' },
  { id: 'mars',       icon: '♂',  label: 'Mars',        sub: 'The Red Planet' },
  { id: 'jupiter',    icon: '♃',  label: 'Jupiter',     sub: 'Largest planet · Great Red Spot' },
  { id: 'saturn',     icon: '♄',  label: 'Saturn',      sub: 'Ring system 282,000 km wide' },
  { id: 'black_hole', icon: '⚫', label: 'Black Hole',   sub: 'Gravitational singularity' },
  { id: 'nebula',     icon: '🌫', label: 'Nebula',       sub: 'Stellar nursery' },
  { id: 'galaxy',     icon: '🌌', label: 'Galaxy',       sub: 'Spiral galaxy simulation' },
  { id: 'sun',        icon: '☀️', label: 'Sun',          sub: 'Our star · G-type main sequence' },
  { id: 'supernova',  icon: '💥', label: 'Supernova',    sub: 'Stellar explosion simulation' },
  { id: 'pulsar',     icon: '💫', label: 'Pulsar',       sub: 'Rotating neutron star' },
  { id: 'comet',      icon: '☄️', label: 'Comet',        sub: 'Icy small solar system body' },
  { id: 'asteroid',   icon: '🪨', label: 'Asteroid',     sub: 'Minor rocky body' },
  { id: 'venus',      icon: '♀',  label: 'Venus',        sub: 'Hottest planet · 465°C surface' },
  { id: 'neptune',    icon: '♆',  label: 'Neptune',      sub: 'Ice giant · Strongest winds' },
  { id: 'uranus',     icon: '⛢',  label: 'Uranus',       sub: 'Ice giant · Rotates on its side' },
  { id: 'moon',       icon: '🌕', label: 'Moon',         sub: 'Earth\'s natural satellite' },
  { id: 'mercury',    icon: '☿',  label: 'Mercury',      sub: 'Closest to the Sun' },
  { id: 'pluto',      icon: '🔵', label: 'Pluto',        sub: 'Dwarf planet · Kuiper Belt' },
];

const AI_PROMPTS = [
  'What is a black hole?',
  'Tell me about Saturn\'s rings',
  'How do stars form?',
  'What are exoplanets?',
  'Explain dark matter',
  'How far is Alpha Centauri?',
  'What is the Event Horizon Telescope?',
  'Tell me about the James Webb Space Telescope',
  'How big is the Milky Way?',
  'What happens when two galaxies collide?',
];

export default function CommandPalette({ open, onClose, onAskAI }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const buildItems = useCallback((): CommandItem[] => {
    const q = query.toLowerCase().trim();
    const items: CommandItem[] = [];

    // Navigation
    const navItems: CommandItem[] = [
      { id:'nav-dash', icon:'🏠', label:'Dashboard · Chat', sub:'Main AI chat interface', category:'navigate', action:()=>{ router.push('/dashboard'); onClose(); } },
      { id:'nav-solar', icon:'🪐', label:'Solar System Explorer', sub:'Interactive orbital simulation', category:'navigate', action:()=>{ router.push('/dashboard/solar-system'); onClose(); } },
      { id:'nav-sim', icon:'⚡', label:'Gravity Sandbox', sub:'N-body physics simulator', category:'navigate', action:()=>{ router.push('/dashboard/simulate'); onClose(); } },
    ];

    // Space object viewers
    const objItems: CommandItem[] = SPACE_OBJECTS.map(o => ({
      id: o.id, icon: o.icon, label: `View ${o.label}`, sub: o.sub, category: 'object',
      action: () => { onAskAI(`Tell me about ${o.label} and show it in 3D`); onClose(); }
    }));

    // AI prompts
    const aiItems: CommandItem[] = AI_PROMPTS.map((p, i) => ({
      id: `ai-${i}`, icon: '🤖', label: p, category: 'ask',
      action: () => { onAskAI(p); onClose(); }
    }));

    const all = [...navItems, ...objItems, ...aiItems];

    if (!q) return all.slice(0, 10);
    return all.filter(item =>
      item.label.toLowerCase().includes(q) ||
      (item.sub || '').toLowerCase().includes(q) ||
      item.category.includes(q)
    ).slice(0, 12);
  }, [query, router, onClose, onAskAI]);

  const items = buildItems();

  useEffect(() => { if (open) { setQuery(''); setSelected(0); setTimeout(() => inputRef.current?.focus(), 50); } }, [open]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s+1, items.length-1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s-1, 0)); }
    if (e.key === 'Enter' && items[selected]) items[selected].action();
    if (e.key === 'Escape') onClose();
  };

  const categoryLabel: Record<string, string> = {
    navigate: 'Navigation',
    object: 'Space Objects',
    ask: 'Ask AI',
  };

  const groups: Record<string, CommandItem[]> = {};
  items.forEach(item => {
    if (!groups[item.category]) groups[item.category] = [];
    groups[item.category].push(item);
  });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="command-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="command-box"
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Search input */}
            <div style={{ borderBottom: '1px solid rgba(0,212,255,0.15)', padding: '14px 16px' }}
              className="flex items-center gap-3">
              <span style={{ fontSize: 18 }}>🔍</span>
              <input
                ref={inputRef}
                value={query}
                onChange={e => { setQuery(e.target.value); setSelected(0); }}
                onKeyDown={handleKey}
                placeholder="Search planets, ask AI, navigate..."
                style={{
                  background: 'transparent', border: 'none', outline: 'none',
                  color: 'white', fontSize: 15, flex: 1, fontFamily: 'Inter, sans-serif',
                }}
              />
              <span className="badge badge-cyan">Ctrl+K</span>
            </div>

            {/* Results */}
            <div style={{ maxHeight: 380, overflowY: 'auto', padding: '8px' }}>
              {Object.entries(groups).map(([cat, catItems]) => (
                <div key={cat} className="mb-2">
                  <div className="section-header px-2 py-1">{categoryLabel[cat] || cat}</div>
                  {catItems.map(item => {
                    const idx = items.indexOf(item);
                    return (
                      <button
                        key={item.id}
                        onClick={item.action}
                        onMouseEnter={() => setSelected(idx)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                          padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                          background: idx === selected ? 'rgba(0,212,255,0.1)' : 'transparent',
                          borderLeft: idx === selected ? '2px solid rgba(0,212,255,0.6)' : '2px solid transparent',
                          transition: 'all 0.12s', textAlign: 'left',
                        }}
                      >
                        <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: idx === selected ? '#00d4ff' : 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 500 }}>
                            {item.label}
                          </div>
                          {item.sub && (
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 1 }}>{item.sub}</div>
                          )}
                        </div>
                        {idx === selected && (
                          <span style={{ color: 'rgba(0,212,255,0.5)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>↵</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
              {items.length === 0 && (
                <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                  No results for "{query}"
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ borderTop: '1px solid rgba(0,212,255,0.1)', padding: '8px 16px', display: 'flex', gap: 16 }}>
              {[['↑↓', 'navigate'], ['↵', 'select'], ['Esc', 'close']].map(([key, label]) => (
                <span key={key} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono, monospace' }}>
                  <span style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 3, border: '1px solid rgba(255,255,255,0.12)' }}>{key}</span>
                  {label}
                </span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
