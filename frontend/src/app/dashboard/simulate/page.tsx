'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// ─── Dynamic import (no SSR) ──────────────────────────────────────────────────

const GravitySandbox = dynamic(
  () => import('@/components/space/GravitySandbox'),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ background: '#020209' }}
      >
        <div className="text-center">
          <div style={{ fontSize: '48px', marginBottom: '12px', animation: 'spin 2s linear infinite' }}>🕳</div>
          <p style={{ color: '#00d4ff', fontSize: '13px' }}>Initialising gravity engine...</p>
        </div>
      </div>
    ),
  }
);

// ─── Tab types ────────────────────────────────────────────────────────────────

type Tab = 'gravity' | 'collisions';

// ─── Glass style ──────────────────────────────────────────────────────────────

const glass: React.CSSProperties = {
  background: 'rgba(2, 10, 30, 0.80)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(0, 212, 255, 0.15)',
  borderRadius: '12px',
};

// ─── Body type reference data ─────────────────────────────────────────────────

const BODY_GUIDE = [
  { emoji: '⭐', name: 'Star',       desc: 'Massive, bright — anchors orbits',     mass: '5000' },
  { emoji: '🪐', name: 'Planet',     desc: 'Medium mass — orbits stars',           mass: '200' },
  { emoji: '🌕', name: 'Moon',       desc: 'Small — captured by planets',          mass: '20' },
  { emoji: '🪨', name: 'Asteroid',   desc: 'Tiny, fast — forms belts',             mass: '5' },
  { emoji: '🕳',  name: 'Black Hole', desc: 'Extreme gravity — consumes all',      mass: '50000' },
];

// ─── Page Component ───────────────────────────────────────────────────────────

export default function SimulatePage() {
  const [activeTab, setActiveTab] = useState<Tab>('gravity');

  return (
    <div
      style={{
        width: '100%',
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: '#020209',
        overflow: 'hidden',
        fontFamily: "'Inter', system-ui, sans-serif",
        position: 'relative',
      }}
    >
      {/* ── Keyframes ────────────────────────────────────────────────────── */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer {
          0%,100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .tab-btn:hover { background: rgba(0,212,255,0.1) !important; }
        .guide-row:hover { background: rgba(0,212,255,0.06) !important; }
        .guide-row { transition: background 0.15s; }
      `}</style>

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px',
          background: 'rgba(2,10,30,0.9)',
          borderBottom: '1px solid rgba(0,212,255,0.12)',
          flexShrink: 0,
          zIndex: 20,
        }}
      >
        {/* Left: Back + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link
            href="/dashboard"
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              color: '#00d4ff', textDecoration: 'none',
              fontSize: '13px', fontWeight: 500,
              padding: '5px 10px',
              borderRadius: '8px',
              border: '1px solid rgba(0,212,255,0.2)',
              background: 'rgba(0,212,255,0.05)',
              transition: 'all 0.2s',
            }}
          >
            ← Dashboard
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🌌</span>
            <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '15px', letterSpacing: '0.05em' }}>
              GRAVITY SIMULATOR
            </span>
          </div>
        </div>

        {/* Right: Tab switcher */}
        <div
          style={{
            display: 'flex', gap: '6px',
            background: 'rgba(0,0,20,0.5)',
            borderRadius: '10px',
            padding: '4px',
            border: '1px solid rgba(0,212,255,0.1)',
          }}
        >
          {([
            { key: 'gravity',    label: '⚛ Gravity Sandbox' },
            { key: 'collisions', label: '💥 Coming Soon: Collisions' },
          ] as { key: Tab; label: string }[]).map(tab => (
            <button
              key={tab.key}
              className="tab-btn"
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '6px 14px',
                borderRadius: '7px',
                background: activeTab === tab.key ? 'rgba(0,212,255,0.2)' : 'transparent',
                border: activeTab === tab.key ? '1px solid rgba(0,212,255,0.5)' : '1px solid transparent',
                color: activeTab === tab.key ? '#00d4ff' : 'rgba(255,255,255,0.45)',
                fontSize: '12px', fontWeight: activeTab === tab.key ? 700 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* ── Left info panel ─────────────────────────────────────────────── */}
        <div
          style={{
            width: '240px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            padding: '14px',
            borderRight: '1px solid rgba(0,212,255,0.08)',
            overflowY: 'auto',
            background: 'rgba(2,6,20,0.6)',
          }}
        >
          {/* Instructions */}
          <div style={{ ...glass, padding: '14px' }}>
            <div style={{ color: 'rgba(0,212,255,0.7)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '10px' }}>
              Instructions
            </div>
            {[
              { icon: '👆', text: 'Click canvas to spawn a body' },
              { icon: '🪐', text: 'Bodies attract each other via gravity' },
              { icon: '🌀', text: 'Watch orbits form naturally' },
              { icon: '💥', text: 'Bodies merge on collision' },
              { icon: '⚡', text: 'Adjust G to change gravity strength' },
              { icon: '⏸', text: 'Pause to plan your system' },
              { icon: '🗑', text: 'Clear to start fresh' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '7px' }}>
                <span style={{ fontSize: '14px', flexShrink: 0 }}>{item.icon}</span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.5' }}>{item.text}</span>
              </div>
            ))}
          </div>

          {/* Body guide */}
          <div style={{ ...glass, padding: '14px' }}>
            <div style={{ color: 'rgba(0,212,255,0.7)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '10px' }}>
              Body Types
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {BODY_GUIDE.map(b => (
                <div
                  key={b.name}
                  className="guide-row"
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '8px',
                    padding: '6px 8px', borderRadius: '8px',
                    background: 'transparent',
                  }}
                >
                  <span style={{ fontSize: '18px', flexShrink: 0 }}>{b.emoji}</span>
                  <div>
                    <div style={{ color: '#e0f0ff', fontSize: '11px', fontWeight: 600 }}>{b.name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', lineHeight: 1.4 }}>{b.desc}</div>
                    <div style={{ color: 'rgba(0,212,255,0.5)', fontSize: '9px', marginTop: '2px' }}>mass ≈ {b.mass}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div style={{ ...glass, padding: '14px' }}>
            <div style={{ color: 'rgba(0,212,255,0.7)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '10px' }}>
              Pro Tips
            </div>
            {[
              'Place a Star first, then add Planets around it to form a solar system.',
              'Two Stars of equal mass orbit each other — try a binary system!',
              'Black Holes absorb everything — place carefully.',
              'Lower G creates looser, slower orbits.',
              'Add Moons near Planets for natural capture.',
            ].map((tip, i) => (
              <div key={i} style={{ fontSize: '10px', color: 'rgba(255,255,255,0.42)', lineHeight: '1.6', marginBottom: '6px', paddingLeft: '8px', borderLeft: '2px solid rgba(0,212,255,0.2)' }}>
                {tip}
              </div>
            ))}
          </div>
        </div>

        {/* ── Sandbox / Coming Soon ────────────────────────────────────────── */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

          {activeTab === 'gravity' && (
            <div style={{ width: '100%', height: '100%', animation: 'fadeIn 0.3s ease' }}>
              <GravitySandbox />
            </div>
          )}

          {activeTab === 'collisions' && (
            <div
              style={{
                width: '100%', height: '100%',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                animation: 'fadeIn 0.3s ease',
                background: '#020209',
              }}
            >
              <div style={{ textAlign: 'center', maxWidth: '400px' }}>
                <div style={{ fontSize: '72px', marginBottom: '20px', animation: 'shimmer 2s ease-in-out infinite' }}>
                  💥
                </div>
                <h2 style={{ color: '#00d4ff', fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>
                  Collision Physics
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', lineHeight: '1.7', marginBottom: '24px' }}>
                  A realistic rigid-body collision simulator is coming soon. 
                  It will feature elastic & inelastic collisions, fragmentation events, 
                  and crater formation modelling.
                </p>
                <div
                  style={{
                    ...glass,
                    display: 'inline-flex', alignItems: 'center', gap: '10px',
                    padding: '10px 20px',
                    color: 'rgba(0,212,255,0.7)', fontSize: '12px', fontWeight: 600,
                  }}
                >
                  <span style={{ animation: 'spin 3s linear infinite', display: 'inline-block' }}>⚙</span>
                  Under development
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom status bar ─────────────────────────────────────────────── */}
      <div
        style={{
          height: '28px',
          borderTop: '1px solid rgba(0,212,255,0.08)',
          background: 'rgba(2,6,20,0.8)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: '16px',
          flexShrink: 0,
        }}
      >
        <span style={{ color: 'rgba(0,212,255,0.5)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          N-Body Gravity Simulation
        </span>
        <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '10px' }}>
          F = G·m₁·m₂ / r²
        </span>
        <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.15)', fontSize: '10px' }}>
          Cosmic Explorer v1.0
        </span>
      </div>
    </div>
  );
}
