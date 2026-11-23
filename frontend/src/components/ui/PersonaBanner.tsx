'use client';
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { PersonaItem } from './PersonaSelector';

interface PersonaBannerProps {
  persona: PersonaItem | undefined;
  trigger: number;
}

const PERSONA_DETAILS: Record<string, { headline: string; bullets: string[] }> = {
  default: {
    headline: 'Your all-purpose AI assistant',
    bullets: ['Coding & debugging', 'Writing & creativity', 'Research & analysis', 'Math & reasoning'],
  },
  scientist: {
    headline: 'Deep science expertise at your service',
    bullets: ['Physics & chemistry', 'Biology & genetics', 'Astronomy & space', 'Research & data'],
  },
  coder: {
    headline: 'Elite software engineering partner',
    bullets: ['Debugging & review', 'System design', 'Algorithms & DS', 'Clean production code'],
  },
  writer: {
    headline: 'Creative writing & storytelling master',
    bullets: ['Fiction & poetry', 'Essays & scripts', 'Editing & style', 'Copywriting'],
  },
  tutor: {
    headline: 'Patient, encouraging learning guide',
    bullets: ['Step-by-step breakdowns', 'Relatable analogies', 'Practice problems', 'All levels welcome'],
  },
};

export default function PersonaBanner({ persona, trigger }: PersonaBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (trigger === 0) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 2600);
    return () => clearTimeout(t);
  }, [trigger]);

  if (!persona) return null;
  const details = PERSONA_DETAILS[persona.id] || PERSONA_DETAILS.default;
  const IconComp = persona.icon || Sparkles;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed', top: 60, left: '50%', transform: 'translateX(-50%)',
            zIndex: 100, background: 'var(--surface)', border: '1px solid var(--border)',
            boxShadow: '0 12px 36px rgba(0,0,0,0.4)', borderRadius: 12,
            padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12,
          }}
        >
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: 'var(--surface2)',
            border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconComp size={16} style={{ color: persona.color }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
              Switched to {persona.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              {details.headline}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
