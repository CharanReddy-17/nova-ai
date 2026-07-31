'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PersonaBannerProps {
  persona: {
    id:       string;
    name:     string;
    emoji:    string;
    tagline:  string;
    color:    string;
    gradient: string;
  } | undefined;
  trigger: number; // increment this to re-show the banner
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
    if (trigger === 0) return; // skip on initial mount
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 2600);
    return () => clearTimeout(t);
  }, [trigger]);

  if (!persona) return null;
  const details = PERSONA_DETAILS[persona.id] || PERSONA_DETAILS.default;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={() => setVisible(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)',
            cursor: 'pointer',
          }}
        >
          <motion.div
            initial={{ scale: 0.88, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: -12, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: '#0e0e11',
              border: `1px solid ${persona.color}44`,
              borderRadius: 24,
              padding: '36px 40px',
              maxWidth: 420,
              width: '90%',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: `0 0 80px ${persona.color}30, 0 40px 80px rgba(0,0,0,0.7)`,
            }}
          >
            {/* Glowing background orb */}
            <div style={{
              position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
              width: 240, height: 240,
              background: `radial-gradient(circle, ${persona.color}30 0%, transparent 70%)`,
              borderRadius: '50%',
              pointerEvents: 'none',
            }} />

            {/* Emoji circle */}
            <motion.div
              initial={{ scale: 0.5, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.08 }}
              style={{
                width: 72, height: 72, borderRadius: 20,
                background: `${persona.color}20`,
                border: `2px solid ${persona.color}60`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 34, margin: '0 auto 20px',
                boxShadow: `0 0 30px ${persona.color}40`,
              }}
            >
              {persona.emoji}
            </motion.div>

            {/* Name + headline */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
              <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: persona.color }}>
                Switching to
              </p>
              <h2 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 800, color: '#fafafa' }}>
                {persona.name}
              </h2>
              <p style={{ margin: '0 0 24px', fontSize: 14, color: '#71717a' }}>
                {details.headline}
              </p>
            </motion.div>

            {/* Bullet capabilities */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }}>
              {details.bullets.map((b, i) => (
                <motion.div key={b}
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25 + i * 0.07 }}
                  style={{
                    background: `${persona.color}12`,
                    border: `1px solid ${persona.color}25`,
                    borderRadius: 10, padding: '8px 10px',
                    fontSize: 12, color: '#a1a1aa', textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <span style={{ color: persona.color, fontSize: 14 }}>✦</span> {b}
                </motion.div>
              ))}
            </motion.div>

            {/* Progress bar */}
            <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.4, ease: 'linear' }}
                style={{ height: '100%', background: `linear-gradient(90deg, ${persona.color}, ${persona.color}88)`, borderRadius: 4 }}
              />
            </div>
            <p style={{ margin: '8px 0 0', fontSize: 11, color: '#3f3f46' }}>Click anywhere to dismiss</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
