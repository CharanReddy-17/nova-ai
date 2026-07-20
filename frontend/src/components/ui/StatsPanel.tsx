'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BarChart2, MessageSquare, Zap, BookOpen, TrendingUp } from 'lucide-react';
import api from '@/services/api';

interface Stats {
  totalChats: number;
  totalMessages: number;
  totalUserMessages: number;
  totalAIMessages: number;
  totalWords: number;
  activity: { date: string; count: number }[];
  topics: { word: string; count: number }[];
  memberSince: string;
}

interface StatsPanelProps {
  open: boolean;
  onClose: () => void;
  username?: string;
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Icon size={15} style={{ color }} />
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#fafafa' }}>{value}</p>
    </div>
  );
}

export default function StatsPanel({ open, onClose, username }: StatsPanelProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api.get<Stats>('/stats')
      .then(r => setStats(r.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [open]);

  const maxActivity = stats ? Math.max(...stats.activity.map(d => d.count), 1) : 1;
  const maxTopic = stats?.topics[0]?.count || 1;

  function formatDay(dateStr: string) {
    const d = new Date(dateStr);
    return ['S','M','T','W','T','F','S'][d.getDay()];
  }

  function memberDays(since: string) {
    return Math.floor((Date.now() - new Date(since).getTime()) / 86400000);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, backdropFilter: 'blur(4px)' }}
          />

          {/* Panel — slides from right */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 32 }}
            style={{
              position: 'fixed', right: 0, top: 0, bottom: 0, width: 400,
              background: '#111113', borderLeft: '1px solid rgba(255,255,255,0.08)',
              zIndex: 201, display: 'flex', flexDirection: 'column',
              boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
              overflowY: 'auto',
            }}
          >
            {/* Header */}
            <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#fafafa' }}>📊 Your Stats</h2>
                <p style={{ margin: 0, fontSize: 12, color: '#52525b' }}>
                  {username && `@${username} · `}
                  {stats ? `Member for ${memberDays(stats.memberSince)} days` : 'Loading…'}
                </p>
              </div>
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: '#71717a' }}>
                <X size={16} />
              </button>
            </div>

            {loading && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#52525b', flexDirection: 'column', gap: 12 }}>
                <div style={{ width: 32, height: 32, border: '2px solid #27272a', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                <p style={{ fontSize: 13 }}>Crunching your data…</p>
              </div>
            )}

            {!loading && stats && (
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Stat cards 2x2 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <StatCard icon={MessageSquare} label="TOTAL CHATS" value={stats.totalChats} color="#7c3aed" />
                  <StatCard icon={Zap} label="MESSAGES SENT" value={stats.totalUserMessages} color="#06b6d4" />
                  <StatCard icon={BarChart2} label="AI RESPONSES" value={stats.totalAIMessages} color="#10b981" />
                  <StatCard icon={BookOpen} label="WORDS TYPED" value={stats.totalWords.toLocaleString()} color="#f59e0b" />
                </div>

                {/* Activity chart — 14 day bar chart */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <TrendingUp size={15} style={{ color: '#7c3aed' }} />
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '0.06em' }}>14-DAY ACTIVITY</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 72 }}>
                    {stats.activity.map((day, i) => {
                      const heightPct = (day.count / maxActivity) * 100;
                      const isToday = i === stats.activity.length - 1;
                      return (
                        <div key={day.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%' }}>
                          <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${Math.max(heightPct, day.count > 0 ? 8 : 2)}%` }}
                              transition={{ duration: 0.6, delay: i * 0.03 }}
                              style={{
                                width: '100%', borderRadius: '3px 3px 2px 2px',
                                background: isToday
                                  ? 'linear-gradient(to top, #7c3aed, #a855f7)'
                                  : day.count > 0
                                    ? 'rgba(124,58,237,0.5)'
                                    : 'rgba(255,255,255,0.06)',
                              }}
                              title={`${day.date}: ${day.count} messages`}
                            />
                          </div>
                          <span style={{ fontSize: 8, color: isToday ? '#a78bfa' : '#3f3f46' }}>{formatDay(day.date)}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p style={{ margin: '8px 0 0', fontSize: 11, color: '#3f3f46', textAlign: 'right' }}>
                    Total: {stats.activity.reduce((a, d) => a + d.count, 0)} messages in 14 days
                  </p>
                </div>

                {/* Top topics */}
                {stats.topics.length > 0 && (
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px' }}>
                    <p style={{ margin: '0 0 12px', fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '0.06em' }}>🏷 TOP TOPICS</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {stats.topics.slice(0, 10).map(({ word, count }, i) => (
                        <div key={word}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                            <span style={{ fontSize: 12, color: i < 3 ? '#c4b5fd' : '#71717a', fontWeight: i < 3 ? 600 : 400 }}>
                              {i < 3 ? ['🥇','🥈','🥉'][i] + ' ' : ''}{word}
                            </span>
                            <span style={{ fontSize: 11, color: '#3f3f46' }}>{count}×</span>
                          </div>
                          <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(count / maxTopic) * 100}%` }}
                              transition={{ duration: 0.5, delay: i * 0.05 }}
                              style={{ height: '100%', background: `hsl(${265 - i * 8}, 70%, ${65 - i * 2}%)`, borderRadius: 2 }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <p style={{ fontSize: 11, color: '#27272a', textAlign: 'center', marginTop: 4 }}>
                  Data updates after each conversation
                </p>
              </div>
            )}

            {!loading && !stats && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#52525b', flexDirection: 'column', gap: 8 }}>
                <p>Start chatting to see your stats!</p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
