'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Sparkles, Zap, Brain, ShieldCheck, ArrowRight,
  Code2, Check, User
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const FEATURES = [
  {
    icon: Zap,
    title: 'Instant Groq Execution',
    desc: 'Sub-second streaming latency powered by dedicated Groq LPU inference. Fast, responsive, seamless.',
  },
  {
    icon: Brain,
    title: 'High-Capacity Reasoning',
    desc: 'Deep reasoning, precision code generation, and nuanced writing across multiple specialized personas.',
  },
  {
    icon: ShieldCheck,
    title: 'Private & Distraction-Free',
    desc: 'Zero clutter, clean typography, secure encrypted sessions, and full ownership of your data.',
  },
];

const STEPS = [
  { n: '01', title: 'Create your account', desc: 'Sign up in seconds — no payment details or setup required.' },
  { n: '02', title: 'Choose model or persona', desc: 'Select from high-speed models, or specialized roles like Coder and Scientist.' },
  { n: '03', title: 'Chat, code, and create', desc: 'Experience instant answers, inline code running, and cinematic image generation.' },
];

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isLoading && user) router.replace('/dashboard');
  }, [user, isLoading, router]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ background: '#0F0F10', minHeight: '100vh', color: '#F4F4F5', overflowX: 'hidden' }}>
      {/* Ambient background glows */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-15%', left: '50%', transform: 'translateX(-50%)', width: 700, height: 500, background: 'radial-gradient(circle, rgba(229,169,90,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', height: 60,
        background: scrolled ? 'rgba(15,15,16,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        transition: 'all 0.25s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'var(--surface2, #1C1C1F)', border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E5A95A',
          }}>
            <Sparkles size={15} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.02em', color: '#F4F4F5' }}>NOVA AI</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => router.push('/login')}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#A1A1AA', fontSize: 13.5, fontWeight: 500, padding: '8px 14px',
              borderRadius: 8, transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F4F4F5')}
            onMouseLeave={e => (e.currentTarget.style.color = '#A1A1AA')}
          >
            Sign in
          </button>
          <button
            onClick={() => router.push('/login?mode=register')}
            style={{
              background: '#E5A95A', color: '#0F0F10', border: 'none',
              cursor: 'pointer', fontSize: 13.5, fontWeight: 600, padding: '8px 16px',
              borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <span>Get Started</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      {/* ── Hero Section ───────────────────────────────────────────────────── */}
      <section style={{
        position: 'relative', zIndex: 1, minHeight: '90vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', textAlign: 'center', padding: '120px 24px 60px',
      }}>
        {/* Subtle badge */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '5px 12px', borderRadius: 20,
            background: 'rgba(229,169,90,0.1)', border: '1px solid rgba(229,169,90,0.25)',
            fontSize: 12, fontWeight: 500, color: '#E5A95A', marginBottom: 28,
          }}>
            <Sparkles size={12} />
            <span>Powered by Groq High-Speed LPU Inference</span>
          </div>
        </motion.div>

        {/* Main Headline */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
          <h1 style={{
            fontSize: 'clamp(38px, 6vw, 68px)', fontWeight: 700,
            lineHeight: 1.1, letterSpacing: '-0.03em', maxWidth: 780,
            margin: '0 auto 20px', color: '#F4F4F5',
          }}>
            Intelligent conversations, designed for focus.
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          style={{ fontSize: 16, color: '#A1A1AA', maxWidth: 520, lineHeight: 1.6, margin: '0 auto 36px' }}>
          A distraction-free AI workspace engineered with executive minimalism, instantaneous inference, and deep reasoning capabilities.
        </motion.p>

        {/* CTA group */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 48 }}>
          <button
            onClick={() => router.push('/login?mode=register')}
            style={{
              background: '#E5A95A', color: '#0F0F10', border: 'none',
              cursor: 'pointer', fontSize: 14.5, fontWeight: 600, padding: '12px 24px',
              borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 4px 16px rgba(229,169,90,0.2)',
            }}
          >
            <span>Start Exploring</span>
            <ArrowRight size={16} />
          </button>
          <button
            onClick={() => router.push('/login')}
            style={{
              background: 'rgba(255,255,255,0.04)', color: '#F4F4F5',
              border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
              fontSize: 14.5, fontWeight: 500, padding: '12px 24px', borderRadius: 10,
            }}
          >
            Sign In
          </button>
        </motion.div>

        {/* Sleek App Preview Window */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.7 }}
          style={{
            width: '100%', maxWidth: 680,
            background: '#141416', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 18, overflow: 'hidden', textAlign: 'left',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          }}
        >
          {/* Window header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: '#18181B',
          }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444', opacity: 0.8 }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B', opacity: 0.8 }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981', opacity: 0.8 }} />
            </div>
            <div style={{ fontSize: 11, color: '#71717A', fontWeight: 500 }}>
              NOVA AI · High-Speed Inference
            </div>
            <div style={{ width: 30 }} />
          </div>

          {/* Conversation preview */}
          <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* User message */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <div style={{
                background: '#242428', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14, padding: '10px 16px', fontSize: 13.5, color: '#F4F4F5', maxWidth: '80%',
              }}>
                Can you explain the mechanics of quantum entanglement in simple terms?
              </div>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#242428', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={14} style={{ color: '#A1A1AA' }} />
              </div>
            </div>

            {/* AI message */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#242428', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E5A95A' }}>
                <Sparkles size={14} />
              </div>
              <div style={{ fontSize: 13.5, lineHeight: 1.6, color: '#D4D4D8', maxWidth: '88%' }}>
                Quantum entanglement occurs when two particles become deeply interconnected such that measuring the quantum state of one immediately dictates the state of the other — no matter how far apart they are in space.
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Features Grid ──────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', maxWidth: 1040, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 54 }}>
          <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 12 }}>
            Engineered for clarity and speed
          </h2>
          <p style={{ color: '#71717A', fontSize: 14.5 }}>
            Everything you need for an executive research and development workflow.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={{
                  background: '#141416', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 14, padding: '24px 22px',
                }}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: 'rgba(229,169,90,0.1)', border: '1px solid rgba(229,169,90,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#E5A95A', marginBottom: 16,
                }}>
                  <Icon size={18} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#F4F4F5', marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 13.5, color: '#71717A', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Steps ──────────────────────────────────────────────────────────── */}
      <section style={{ padding: '60px 24px 100px', maxWidth: 840, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 20,
                padding: '20px 24px', background: '#141416',
                border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: '#E5A95A', fontFamily: 'monospace', minWidth: 28, marginTop: 2 }}>
                {s.n}
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#F4F4F5', margin: '0 0 4px' }}>{s.title}</h3>
                <p style={{ fontSize: 13.5, color: '#71717A', margin: 0, lineHeight: 1.5 }}>{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '28px 32px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#71717A' }}>
          <Sparkles size={14} style={{ color: '#E5A95A' }} />
          <span>NOVA AI — Minimalist Intelligence</span>
        </div>
        <p style={{ color: '#52525B', fontSize: 12, margin: 0 }}>
          Designed with simplicity and precision
        </p>
      </footer>
    </div>
  );
}
