'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Check, Crown, Lock } from 'lucide-react';
import api from '@/services/api';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  messagesUsed?: number;
}

const FREE_FEATURES = [
  '50 messages per day',
  '4 AI models',
  '5 personas',
  'Chat history (7 days)',
  'Export as Markdown / Text',
];

const PRO_FEATURES = [
  { text: 'Unlimited messages', highlight: true },
  { text: 'All 4 AI models + priority speed', highlight: true },
  { text: 'All 5 personas', highlight: false },
  { text: 'Unlimited chat history forever', highlight: true },
  { text: 'Voice input & export', highlight: false },
  { text: 'Priority support', highlight: false },
];

export default function UpgradeModal({ open, onClose, messagesUsed = 50 }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpgrade = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post<{ url: string }>('/payments/create-checkout');
      window.location.href = data.url;
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Payment system unavailable.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200, backdropFilter: 'blur(6px)' }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            style={{
              position: 'fixed', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%', maxWidth: 480, zIndex: 201,
              background: '#0e0e10',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20, overflow: 'hidden',
              boxShadow: '0 40px 80px rgba(0,0,0,0.9)',
            }}
          >
            {/* Top glow bar */}
            <div style={{ height: 3, background: 'linear-gradient(90deg, #7c3aed, #a855f7, #ec4899)' }} />

            {/* Header */}
            <div style={{ padding: '24px 24px 0', position: 'relative' }}>
              <button onClick={onClose} style={{ position: 'absolute', right: 18, top: 18, background: 'none', border: 'none', cursor: 'pointer', color: '#52525b', padding: 4 }}>
                <X size={18} />
              </button>

              {/* Limit badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ padding: '4px 10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Lock size={11} style={{ color: '#ef4444' }} />
                  <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>
                    {messagesUsed >= 50 ? 'Daily limit reached' : `${messagesUsed}/50 messages used today`}
                  </span>
                </div>
              </div>

              <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: '#fafafa' }}>
                Unlock <span style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>NOVA Pro</span>
              </h2>
              <p style={{ margin: '0 0 24px', fontSize: 14, color: '#71717a', lineHeight: 1.5 }}>
                Get unlimited messages, all models, and priority speed — for less than a coffee per month.
              </p>
            </div>

            {/* Plan comparison */}
            <div style={{ padding: '0 24px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* Free */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16 }}>
                <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: '#71717a', letterSpacing: '0.06em' }}>FREE</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {FREE_FEATURES.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                      <Check size={13} style={{ color: '#52525b', marginTop: 1, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: '#71717a' }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pro */}
              <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 14, padding: 16, position: 'relative' }}>
                <div style={{ position: 'absolute', top: -10, right: 12, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', borderRadius: 10, padding: '2px 8px', fontSize: 9, fontWeight: 700, color: '#fff', letterSpacing: '0.05em' }}>
                  UPGRADE
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <Crown size={13} style={{ color: '#f59e0b' }} />
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#c4b5fd', letterSpacing: '0.06em' }}>PRO</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {PRO_FEATURES.map(f => (
                    <div key={f.text} style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                      <Check size={13} style={{ color: f.highlight ? '#a78bfa' : '#71717a', marginTop: 1, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: f.highlight ? '#e2e8f0' : '#71717a', fontWeight: f.highlight ? 500 : 400 }}>{f.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Price + CTA */}
            <div style={{ padding: '0 24px 24px' }}>
              <div style={{ textAlign: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 32, fontWeight: 800, color: '#fafafa' }}>$5</span>
                <span style={{ fontSize: 14, color: '#52525b' }}>/month</span>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#52525b' }}>Cancel anytime · No contracts</p>
              </div>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#ef4444' }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleUpgrade}
                disabled={loading}
                style={{
                  width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                  background: loading ? '#27272a' : 'linear-gradient(135deg, #7c3aed, #a855f7)',
                  color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: loading ? 'none' : '0 8px 24px rgba(124,58,237,0.4)',
                  transition: 'all 0.2s',
                }}
              >
                {loading ? (
                  <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Redirecting to Stripe…</>
                ) : (
                  <><Zap size={16} /> Upgrade to Pro — $5/mo</>
                )}
              </button>

              <p style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: '#3f3f46' }}>
                🔒 Secure checkout via Stripe · 30-day money-back guarantee
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
