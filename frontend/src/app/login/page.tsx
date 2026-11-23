'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  User as UserIcon,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';

type Mode = 'login' | 'register' | 'forgot';

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, isLoading, login, register } = useAuth();

  const [mode, setMode] = useState<Mode>(params.get('mode') === 'register' ? 'register' : 'login');
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [shake, setShake]       = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) router.replace('/dashboard');
  }, [user, isLoading, router]);

  const showError = (msg: string) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (mode === 'register') {
      if (!name.trim()) return showError('Please enter your full name.');
      if (password.length < 6) return showError('Password must be at least 6 characters.');
      if (password !== confirm) return showError('Passwords do not match.');
    }

    if (mode === 'forgot') {
      if (!email.trim()) return showError('Please enter your account email.');
      if (password.length < 6) return showError('New password must be at least 6 characters.');
      if (password !== confirm) return showError('Passwords do not match.');
      setLoading(true);
      try {
        const { data } = await api.post('/auth/reset-password', { email: email.trim(), newPassword: password });
        if (data.token && data.user) {
          localStorage.setItem('cosmic_token', data.token);
          localStorage.setItem('cosmic_user', JSON.stringify(data.user));
          api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
          router.replace('/dashboard');
        } else {
          setSuccess('Password updated. You can now sign in.');
          setMode('login');
          setPassword('');
          setConfirm('');
        }
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
          || 'Failed to reset password. Please check your email.';
        showError(msg);
      } finally {
        setLoading(false);
      }
      return;
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
    setSuccess('');
    setName(''); setEmail(''); setPassword(''); setConfirm('');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: 'var(--bg)', color: 'var(--text)' }}>

      {/* ── Left Editorial Panel (Desktop only) ───────────────────────────── */}
      <div
        className="hidden md:flex"
        style={{
          flex: '1 1 50%',
          position: 'relative',
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          padding: '60px 50px',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand Header */}
        <div>
          <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: 'var(--primary)',
                color: '#111113',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 16,
              }}
            >
              N
            </div>
            <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)' }}>
              NOVA AI
            </span>
          </a>
        </div>

        {/* Editorial Value Proposition */}
        <div style={{ maxWidth: 460 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 99,
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              fontSize: 12,
              fontWeight: 500,
              color: 'var(--primary)',
              marginBottom: 20,
            }}
          >
            <Sparkles size={13} />
            <span>Built for deep focus & speed</span>
          </div>

          <h2 style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.025em', marginBottom: 14 }}>
            Clarity for your thoughts, code, and curiosity.
          </h2>
          <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 32 }}>
            A minimalist intelligence interface powered by state-of-the-art open models. Free from distractions, tuned for productive work.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: 'var(--text2)' }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <Zap size={14} />
              </div>
              <span>Sub-second streaming powered by Groq infrastructure</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: 'var(--text2)' }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <ShieldCheck size={14} />
              </div>
              <span>Private session storage with full export controls</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: 'var(--text2)' }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <KeyRound size={14} />
              </div>
              <span>Permanent free access — no credit card needed</span>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div style={{ fontSize: 12.5, color: 'var(--muted2)' }}>
          &copy; 2026 NOVA AI. Clean intelligence design.
        </div>
      </div>

      {/* ── Right Form Container ─────────────────────────────────────────── */}
      <div
        style={{
          flex: '1 1 50%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px 24px',
          overflowY: 'auto',
        }}
      >
        <div style={{ width: '100%', maxWidth: 380 }}>

          {/* Mobile Brand Mark */}
          <div className="flex md:hidden" style={{ justifyContent: 'center', marginBottom: 32 }}>
            <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'var(--primary)',
                  color: '#111113',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 15,
                }}
              >
                N
              </div>
              <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)' }}>
                NOVA AI
              </span>
            </a>
          </div>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 6 }}>
              {mode === 'login' ? 'Welcome back' : mode === 'register' ? 'Create an account' : 'Reset your password'}
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>
              {mode === 'login'
                ? 'Sign in to access your chats and personal library.'
                : mode === 'register'
                  ? 'Get started in seconds. No card required.'
                  : 'Enter your registered email and a new password.'}
            </p>
          </div>

          {/* Mode Switcher Tabs (when not in forgot mode) */}
          {mode !== 'forgot' ? (
            <div
              style={{
                display: 'flex',
                background: 'var(--surface2)',
                borderRadius: 8,
                padding: 3,
                marginBottom: 24,
                border: '1px solid var(--border)',
              }}
            >
              <button
                type="button"
                onClick={() => switchMode('login')}
                style={{
                  flex: 1,
                  padding: '7px 12px',
                  borderRadius: 6,
                  border: 'none',
                  background: mode === 'login' ? 'var(--surface)' : 'transparent',
                  color: mode === 'login' ? 'var(--text)' : 'var(--muted)',
                  fontWeight: mode === 'login' ? 600 : 500,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: mode === 'login' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                style={{
                  flex: 1,
                  padding: '7px 12px',
                  borderRadius: 6,
                  border: 'none',
                  background: mode === 'register' ? 'var(--surface)' : 'transparent',
                  color: mode === 'register' ? 'var(--text)' : 'var(--muted)',
                  fontWeight: mode === 'register' ? 600 : 500,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: mode === 'register' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                Register
              </button>
            </div>
          ) : (
            <div style={{ marginBottom: 20 }}>
              <button
                type="button"
                onClick={() => switchMode('login')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  fontSize: 13,
                  padding: 0,
                  marginBottom: 10,
                }}
              >
                <ArrowLeft size={14} /> Back to Sign in
              </button>
            </div>
          )}

          {/* Success banner */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.25)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  marginBottom: 18,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <CheckCircle2 size={16} color="#34d399" />
                <span style={{ color: '#34d399', fontSize: 13 }}>{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0, x: shake ? [-6, 6, -4, 4, 0] : 0 }}
                exit={{ opacity: 0 }}
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  marginBottom: 18,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <AlertCircle size={16} color="#f87171" />
                <span style={{ color: '#f87171', fontSize: 13 }}>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <InputField
                    icon={<UserIcon size={16} />}
                    type="text"
                    placeholder="Full name"
                    value={name}
                    onChange={setName}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <InputField
              icon={<Mail size={16} />}
              type="email"
              placeholder="Email address"
              value={email}
              onChange={setEmail}
            />

            <InputField
              icon={<Lock size={16} />}
              type={showPass ? 'text' : 'password'}
              placeholder={mode === 'forgot' ? 'New password (min 6 chars)' : 'Password'}
              value={password}
              onChange={setPassword}
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--muted)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 4,
                  }}
                  title={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
            />

            <AnimatePresence mode="wait">
              {(mode === 'register' || mode === 'forgot') && (
                <motion.div
                  key="conf"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <InputField
                    icon={<Lock size={16} />}
                    type={showConf ? 'text' : 'password'}
                    placeholder="Confirm password"
                    value={confirm}
                    onChange={setConfirm}
                    suffix={
                      <button
                        type="button"
                        onClick={() => setShowConf(v => !v)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--muted)',
                          display: 'flex',
                          alignItems: 'center',
                          padding: 4,
                        }}
                      >
                        {showConf ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    }
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {mode === 'login' && (
              <div style={{ textAlign: 'right', marginTop: -4 }}>
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--muted)',
                    fontSize: 12.5,
                    cursor: 'pointer',
                    textDecoration: 'none',
                    transition: 'color 0.15s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{
                width: '100%',
                padding: '11px',
                fontSize: 14,
                borderRadius: 8,
                marginTop: 6,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  <span>{mode === 'login' ? 'Signing in…' : mode === 'register' ? 'Creating account…' : 'Resetting…'}</span>
                </>
              ) : (
                <>
                  <span>
                    {mode === 'login'
                      ? 'Continue'
                      : mode === 'register'
                        ? 'Create account'
                        : 'Reset password'}
                  </span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Alternate switch text */}
          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--muted)' }}>
            {mode === 'login' ? (
              <span>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  style={{ background: 'none', border: 'none', color: 'var(--text)', fontWeight: 600, cursor: 'pointer' }}
                >
                  Sign up
                </button>
              </span>
            ) : mode === 'register' ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  style={{ background: 'none', border: 'none', color: 'var(--text)', fontWeight: 600, cursor: 'pointer' }}
                >
                  Sign in
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => switchMode('login')}
                style={{ background: 'none', border: 'none', color: 'var(--text)', fontWeight: 600, cursor: 'pointer' }}
              >
                Back to sign in
              </button>
            )}
          </div>

          <p style={{ textAlign: 'center', color: 'var(--muted3)', fontSize: 11.5, marginTop: 28, lineHeight: 1.5 }}>
            By continuing, you agree to NOVA AI&apos;s Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Reusable Input Field Component ─────────────────────────────────────────────
function InputField({
  icon,
  type,
  placeholder,
  value,
  onChange,
  suffix,
}: {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        background: 'var(--surface)',
        border: `1px solid ${focused ? 'var(--primary)' : 'var(--border)'}`,
        borderRadius: 8,
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        boxShadow: focused ? '0 0 0 2px rgba(229,169,90,0.15)' : 'none',
      }}
    >
      <div style={{ paddingLeft: 12, color: focused ? 'var(--primary)' : 'var(--muted)', display: 'flex', alignItems: 'center' }}>
        {icon}
      </div>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: 'var(--text)',
          fontSize: 13.5,
          padding: '11px 12px',
          fontFamily: 'inherit',
        }}
      />
      {suffix && <div style={{ paddingRight: 10, display: 'flex', alignItems: 'center' }}>{suffix}</div>}
    </div>
  );
}
