'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

const FEATURES = [
  { icon: '⚡', title: 'Lightning Fast', desc: 'Responses in under 1 second, powered by Groq infrastructure — the fastest AI API on earth.' },
  { icon: '🧠', title: 'Truly Intelligent', desc: 'LLaMA 3.3 70B understands context, writes code, explains complex topics and reasons step-by-step.' },
  { icon: '🔒', title: 'Private & Secure', desc: 'Your conversations are stored securely in your account. Never used for training. Always yours.' },
];

const STEPS = [
  { n: '01', title: 'Create your free account', desc: 'Sign up in seconds — no credit card required.' },
  { n: '02', title: 'Type your first message', desc: 'Ask anything. Code, math, science, writing — anything.' },
  { n: '03', title: 'Get instant answers', desc: 'Watch NOVA AI respond with clarity and depth.' },
];

const FAKE_CHAT = [
  { role: 'user', text: 'What is a black hole?' },
  { role: 'ai', text: 'A black hole is a region of spacetime where gravity is so strong that nothing — not even light — can escape once it crosses the event horizon…' },
];

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [showTyping, setShowTyping] = useState(true);

  useEffect(() => {
    if (!isLoading && user) router.replace('/dashboard');
  }, [user, isLoading, router]);

  // Navbar shadow on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Animated particle canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.2 + 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.5 + 0.1,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(167,139,250,${p.opacity})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  // Typing blink for fake chat
  useEffect(() => {
    const t = setInterval(() => setShowTyping(v => !v), 600);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ background: '#09090b', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Particle bg */}
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />

      {/* Gradient orbs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', top: '40%', left: '50%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)', borderRadius: '50%', transform: 'translate(-50%,-50%)' }} />
      </div>

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px', height: 64,
        background: scrolled ? 'rgba(9,9,11,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
        transition: 'all 0.3s ease',
      }}>
        <a href="/" className="nova-logo" style={{ textDecoration: 'none' }}>
          <div className="nova-logo-icon">N</div>
          <span>NOVA AI</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn-ghost" onClick={() => router.push('/login')} style={{ fontSize: 14 }}>Sign In</button>
          <button className="btn-primary" onClick={() => router.push('/login?mode=register')} style={{ fontSize: 14 }}>Get Started Free →</button>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 80px', flexDirection: 'column', textAlign: 'center' }}>

        {/* Badge */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="badge badge-purple" style={{ marginBottom: 28, fontSize: 12 }}>
            ✦ Powered by LLaMA 3.3 70B · 100% Free
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }}>
          <h1 style={{ fontSize: 'clamp(48px, 8vw, 88px)', fontWeight: 900, lineHeight: 1.05, marginBottom: 24, letterSpacing: '-2px' }}>
            <span className="gradient-text">Chat Smarter.</span>
            <br />
            <span style={{ color: '#fafafa' }}>Think Deeper.</span>
          </h1>
        </motion.div>

        {/* Subtext */}
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          style={{ fontSize: 18, color: '#a1a1aa', maxWidth: 520, lineHeight: 1.7, marginBottom: 40 }}>
          NOVA AI combines cutting-edge artificial intelligence with beautiful design.
          Ask anything, explore everything — completely free.
        </motion.p>

        {/* CTA buttons */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16 }}>
          <button className="btn-primary" onClick={() => router.push('/login?mode=register')}
            style={{ fontSize: 16, padding: '14px 32px', borderRadius: 12 }}>
            🚀 Start for Free
          </button>
          <button className="btn-secondary" onClick={() => router.push('/login')}
            style={{ fontSize: 16, padding: '14px 32px', borderRadius: 12 }}>
            Sign In
          </button>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
          style={{ fontSize: 13, color: '#52525b' }}>
          No credit card required · Instant access · Free forever
        </motion.p>

        {/* Floating chat preview card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: [0, -10, 0] }}
          transition={{ opacity: { delay: 0.8, duration: 0.6 }, y: { delay: 0.8, duration: 3, repeat: Infinity, ease: 'easeInOut' } }}
          style={{
            marginTop: 64,
            background: 'rgba(24,24,27,0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20,
            padding: 20,
            width: '100%',
            maxWidth: 420,
            boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 40px rgba(124,58,237,0.15)',
          }}>
          {/* Fake chat */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* User message */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div className="chat-bubble-user" style={{ fontSize: 14, maxWidth: '80%' }}>
                What is a black hole? 🌌
              </div>
            </div>
            {/* AI message */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div className="avatar" style={{ width: 28, height: 28, fontSize: 12 }}>N</div>
              <div className="chat-bubble-ai" style={{ fontSize: 13, maxWidth: '85%' }}>
                A black hole is a region of spacetime where gravity is so intense that nothing — not even light — can escape once past the event horizon...
                {showTyping && <span style={{ color: '#a855f7', marginLeft: 2 }}>|</span>}
              </div>
            </div>
          </div>
          {/* Bottom bar */}
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#52525b' }}>
              Message NOVA AI...
            </div>
            <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>↑</div>
          </div>
        </motion.div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '100px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 60 }}>
          <div className="badge badge-cyan" style={{ marginBottom: 16 }}>FEATURES</div>
          <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, color: '#fafafa', marginBottom: 12 }}>
            Everything you need in one place
          </h2>
          <p style={{ color: '#71717a', fontSize: 16, maxWidth: 440, margin: '0 auto' }}>
            Designed for thinkers, creators, and problem-solvers.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {FEATURES.map((f, i) => (
            <motion.div key={f.title}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.12 }}
              className="glass card-hover"
              style={{ padding: 28 }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ color: '#fafafa', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ color: '#71717a', fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px', maxWidth: 900, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 'clamp(26px,3.5vw,40px)', fontWeight: 800, color: '#fafafa', marginBottom: 12 }}>
            Up and running in 30 seconds
          </h2>
          <p style={{ color: '#71717a', fontSize: 15 }}>No setup. No tutorials. Just open and chat.</p>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {STEPS.map((s, i) => (
            <motion.div key={s.n}
              initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.15 }}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 24, padding: '24px 28px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#7c3aed', fontFamily: 'JetBrains Mono, monospace', minWidth: 28 }}>{s.n}</div>
              <div>
                <h3 style={{ color: '#fafafa', fontWeight: 700, fontSize: 17, marginBottom: 4 }}>{s.title}</h3>
                <p style={{ color: '#71717a', fontSize: 14 }}>{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', padding: '56px 32px', background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(236,72,153,0.08))', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 24, boxShadow: '0 0 60px rgba(124,58,237,0.1)' }}>
          <h2 style={{ fontSize: 'clamp(24px,4vw,40px)', fontWeight: 800, color: '#fafafa', marginBottom: 16 }}>
            Ready to think differently?
          </h2>
          <p style={{ color: '#a1a1aa', marginBottom: 32, fontSize: 16 }}>
            Join and start your first conversation — it takes 10 seconds.
          </p>
          <button className="btn-primary" onClick={() => router.push('/login?mode=register')}
            style={{ fontSize: 16, padding: '14px 36px', borderRadius: 12 }}>
            Get Started — It&apos;s Free ✦
          </button>
        </motion.div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.05)', padding: '32px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div className="nova-logo" style={{ fontSize: 14 }}>
          <div className="nova-logo-icon" style={{ width: 26, height: 26, fontSize: 12, borderRadius: 7 }}>N</div>
          <span>NOVA AI</span>
        </div>
        <p style={{ color: '#52525b', fontSize: 13 }}>© 2025 NOVA AI · Built with ❤️ using MERN Stack</p>
        <div style={{ display: 'flex', gap: 20 }}>
          {['Privacy', 'Terms', 'GitHub'].map(l => (
            <a key={l} href="#" style={{ color: '#52525b', fontSize: 13, textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#a1a1aa')}
              onMouseLeave={e => (e.currentTarget.style.color = '#52525b')}>{l}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}
