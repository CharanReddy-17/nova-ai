'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, isLoading, login, register } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [mode, setMode] = useState<Mode>(params.get('mode') === 'register' ? 'register' : 'login');
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [shake, setShake]       = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) router.replace('/dashboard');
  }, [user, isLoading, router]);

  // Animated canvas (left panel)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      o: Math.random() * 0.6 + 0.1,
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
        ctx.fillStyle = `rgba(167,139,250,${p.o})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  const showError = (msg: string) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'register') {
      if (!name.trim()) return showError('Please enter your name.');
      if (password.length < 6) return showError('Password must be at least 6 characters.');
      if (password !== confirm) return showError('Passwords do not match.');
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name.trim(), email, password);
      }
      router.replace('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        || (mode === 'login' ? 'Invalid email or password.' : 'Registration failed. Please try again.');
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError('');
    setName(''); setEmail(''); setPassword(''); setConfirm('');
  };

  return (
    <div style={{ display: 'flex', height: '100dvh', background: '#09090b', overflow: 'hidden' }}>

      {/* ── Left panel (decorative) ─────────────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative', display: 'none', background: 'linear-gradient(160deg, #13001f 0%, #09090b 60%)' }}
        className="md-show">
        <style>{`.md-show { display: none; } @media(min-width:768px){ .md-show { display: block !important; } }`}</style>
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
        {/* Glow orbs */}
        <div style={{ position: 'absolute', top: '20%', left: '20%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '20%', width: 200, height: 200, background: 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)', borderRadius: '50%' }} />

        <div style={{ position: 'relative', zIndex: 2, padding: '40px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {/* Logo */}
          <a href="/" className="nova-logo" style={{ textDecoration: 'none' }}>
            <div className="nova-logo-icon">N</div>
            <span>NOVA AI</span>
          </a>

          {/* Quote */}
          <div style={{ padding: '32px 0' }}>
            <blockquote style={{ fontSize: 22, fontWeight: 600, color: '#e4e4e7', lineHeight: 1.5, marginBottom: 20, fontStyle: 'italic' }}>
              &ldquo;The universe is not only stranger than we imagine, it is stranger than we can imagine.&rdquo;
            </blockquote>
            <p style={{ color: '#71717a', fontSize: 14 }}>— Arthur Eddington</p>
          </div>

          {/* Badges */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['Free forever', 'Powered by Groq', 'MERN Stack'].map(b => (
              <span key={b} className="badge badge-purple" style={{ fontSize: 11 }}>{b}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel (form) ──────────────────────────────────────────── */}
      <div style={{ width: '100%', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 32px', overflowY: 'auto' }}>

        {/* Mobile logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }} className="mobile-only">
          <style>{`.mobile-only { display: flex; } @media(min-width:768px){ .mobile-only { display: none !important; } }`}</style>
          <a href="/" className="nova-logo" style={{ textDecoration: 'none' }}>
            <div className="nova-logo-icon">N</div>
            <span>NOVA AI</span>
          </a>
        </div>

        {/* Heading */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fafafa', marginBottom: 6 }}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p style={{ color: '#71717a', fontSize: 14 }}>
            {mode === 'login' ? 'Sign in to continue to NOVA AI.' : 'Join NOVA AI — it\'s completely free.'}
          </p>
        </div>

        {/* Mode switcher */}
        <div style={{ display: 'flex', background: '#18181b', borderRadius: 10, padding: 4, marginBottom: 28, border: '1px solid rgba(255,255,255,0.06)' }}>
          {(['login', 'register'] as Mode[]).map(m => (
            <button key={m} onClick={() => switchMode(m)}
              style={{
                flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none',
                background: mode === m ? '#27272a' : 'transparent',
                color: mode === m ? '#fafafa' : '#71717a',
                fontWeight: mode === m ? 600 : 400,
                fontSize: 14, cursor: 'pointer', transition: 'all 0.2s',
              }}>
              {m === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0, x: shake ? [-8, 8, -5, 5, 0] : 0 }} exit={{ opacity: 0 }}
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>⚠️</span>
              <span style={{ color: '#fca5a5', fontSize: 13 }}>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <AnimatePresence mode="wait">
            {mode === 'register' && (
              <motion.div key="name" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <InputField icon="👤" type="text" placeholder="Full name" value={name} onChange={setName} />
              </motion.div>
            )}
          </AnimatePresence>

          <InputField icon="✉️" type="email" placeholder="Email address" value={email} onChange={setEmail} />
          <InputField icon="🔒" type={showPass ? 'text' : 'password'} placeholder="Password" value={password} onChange={setPassword}
            suffix={<button type="button" onClick={() => setShowPass(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717a', fontSize: 13, padding: '0 4px' }}>{showPass ? 'Hide' : 'Show'}</button>} />

          <AnimatePresence mode="wait">
            {mode === 'register' && (
              <motion.div key="conf" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <InputField icon="🔒" type={showConf ? 'text' : 'password'} placeholder="Confirm password" value={confirm} onChange={setConfirm}
                  suffix={<button type="button" onClick={() => setShowConf(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717a', fontSize: 13, padding: '0 4px' }}>{showConf ? 'Hide' : 'Show'}</button>} />
              </motion.div>
            )}
          </AnimatePresence>

          {mode === 'login' && (
            <div style={{ textAlign: 'right', marginTop: -8 }}>
              <a href="#" style={{ color: '#a855f7', fontSize: 13 }}>Forgot password?</a>
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}
            style={{ width: '100%', padding: '13px', fontSize: 15, borderRadius: 10, marginTop: 4, justifyContent: 'center' }}>
            {loading
              ? <><div className="spinner" style={{ width: 16, height: 16 }} /> {mode === 'login' ? 'Signing in…' : 'Creating account…'}</>
              : mode === 'login' ? '→ Sign In' : '✦ Create Account'}
          </button>
        </form>

        {/* Switch link */}
        <p style={{ textAlign: 'center', color: '#71717a', fontSize: 13, marginTop: 24 }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
            style={{ background: 'none', border: 'none', color: '#a855f7', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
            {mode === 'login' ? 'Sign up free' : 'Sign in'}
          </button>
        </p>

        <p style={{ textAlign: 'center', color: '#3f3f46', fontSize: 12, marginTop: 32 }}>
          By continuing, you agree to NOVA AI&apos;s Terms of Service.
        </p>
      </div>
    </div>
  );
}

// ── Reusable input field ───────────────────────────────────────────────────────
function InputField({ icon, type, placeholder, value, onChange, suffix }: {
  icon: string; type: string; placeholder: string; value: string;
  onChange: (v: string) => void; suffix?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', background: '#18181b', border: `1px solid ${focused ? '#7c3aed' : 'rgba(255,255,255,0.08)'}`, borderRadius: 10, transition: 'border-color 0.2s, box-shadow 0.2s', boxShadow: focused ? '0 0 0 3px rgba(124,58,237,0.12)' : 'none' }}>
      <span style={{ padding: '0 0 0 14px', fontSize: 15, flexShrink: 0 }}>{icon}</span>
      <input type={type} placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        required
        style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fafafa', fontSize: 14, padding: '13px 14px', fontFamily: 'Inter, sans-serif' }} />
      {suffix && <div style={{ paddingRight: 12, flexShrink: 0 }}>{suffix}</div>}
    </div>
  );
}
