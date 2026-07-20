'use client';

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// ─── Dynamic import (no SSR for WebGL) ───────────────────────────────────────

const SolarSystem = dynamic(() => import('@/components/space/SolarSystem'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center" style={{ background: '#020209' }}>
      <div className="text-center">
        <div className="text-5xl mb-4" style={{ animation: 'spin 3s linear infinite' }}>☀️</div>
        <p className="text-sm" style={{ color: '#00d4ff' }}>Initialising Solar System...</p>
        <div className="mt-3 flex gap-1 justify-center">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                background: '#00d4ff',
                animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  ),
});

// ─── Planet data ──────────────────────────────────────────────────────────────

const PLANET_LIST = [
  { name: 'Mercury', emoji: '🪨', info: 'Closest to Sun · No atmosphere · Surface reaches 430°C',  color: '#b5b5b5' },
  { name: 'Venus',   emoji: '🌡️', info: 'Hottest planet · 465°C · Retrograde rotation',            color: '#e8c97b' },
  { name: 'Earth',   emoji: '🌍', info: 'Only known life · 1 Moon · 71% ocean coverage',            color: '#2e86ab' },
  { name: 'Mars',    emoji: '🔴', info: '2 moons Phobos & Deimos · Largest volcano Olympus Mons',   color: '#c1440e' },
  { name: 'Jupiter', emoji: '🪐', info: '95 moons · Great Red Spot storm · Largest planet',         color: '#c88b3a' },
  { name: 'Saturn',  emoji: '💫', info: 'Lowest density · Ring system 282,000 km wide · 146 moons', color: '#e8d5a0' },
  { name: 'Uranus',  emoji: '🧊', info: 'Rotates on side · Ice giant · 27 moons',                   color: '#7de8e8' },
  { name: 'Neptune', emoji: '🌊', info: 'Strongest winds 2100 km/h · Farthest planet · 16 moons',  color: '#3f54ba' },
  { name: 'Pluto',   emoji: '❄️', info: 'Dwarf planet · Heart-shaped nitrogen ice plain',            color: '#c8a878' },
];

type TimeScale = 1 | 10 | 100 | 1000;

const TIME_BUTTONS: { label: string; icon: string; value: TimeScale | 0 }[] = [
  { label: 'Pause', icon: '⏸', value: 0 },
  { label: '1×',    icon: '▶',  value: 1 },
  { label: '10×',   icon: '⚡', value: 10 },
  { label: '100×',  icon: '🚀', value: 100 },
  { label: '1000×', icon: '☄',  value: 1000 },
];

// ─── Glass panel style ────────────────────────────────────────────────────────

const glass: React.CSSProperties = {
  background: 'rgba(2, 10, 30, 0.75)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(0, 212, 255, 0.15)',
  borderRadius: '12px',
};

// ─── Page Component ───────────────────────────────────────────────────────────

export default function SolarSystemPage() {
  const [timeScale, setTimeScale] = useState<number>(10);
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const [selectedInfo, setSelectedInfo] = useState<string>('');
  const [focusPlanet, setFocusPlanet] = useState<string | undefined>(undefined);

  const handleSelectPlanet = useCallback((name: string, info: string) => {
    setSelectedPlanet(name);
    setSelectedInfo(info);
    setFocusPlanet(name);
  }, []);

  const handleListClick = useCallback((planet: typeof PLANET_LIST[number]) => {
    setSelectedPlanet(planet.name);
    setSelectedInfo(planet.info);
    setFocusPlanet(planet.name);
  }, []);

  const currentPlanetData = PLANET_LIST.find(p => p.name === selectedPlanet);

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: '100dvh', background: '#020209', fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* ── Inline keyframes ─────────────────────────────────────────────── */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes glowPulse { 0%,100% { box-shadow: 0 0 10px rgba(0,212,255,0.3); } 50% { box-shadow: 0 0 25px rgba(0,212,255,0.7); } }
        .planet-item:hover { background: rgba(0,212,255,0.1) !important; transform: translateX(4px); }
        .planet-item { transition: all 0.2s ease; }
        .time-btn:hover { background: rgba(0,212,255,0.2) !important; }
        .time-btn { transition: all 0.2s ease; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,212,255,0.3); border-radius: 2px; }
      `}</style>

      {/* ── 3D Canvas (full viewport) ─────────────────────────────────────── */}
      <div className="absolute inset-0">
        <SolarSystem
          timeScale={timeScale}
          onSelectPlanet={handleSelectPlanet}
          focusPlanet={focusPlanet}
        />
      </div>

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3"
        style={{ ...glass, borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm font-medium transition-colors"
            style={{ color: '#00d4ff', textDecoration: 'none' }}
          >
            <span style={{ fontSize: '18px' }}>←</span>
            Dashboard
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
          <span style={{ color: '#ffffff', fontWeight: 700, letterSpacing: '0.05em', fontSize: '15px' }}>
            ☀ SOLAR SYSTEM EXPLORER
          </span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
          Click any body to inspect · Drag to orbit · Scroll to zoom
        </div>
      </div>

      {/* ── Left: Planet list ─────────────────────────────────────────────── */}
      <div
        className="absolute flex flex-col gap-1 overflow-y-auto"
        style={{
          ...glass,
          top: '64px',
          left: '16px',
          width: '200px',
          maxHeight: 'calc(100dvh - 140px)',
          padding: '12px 8px',
        }}
      >
        <p style={{ color: 'rgba(0,212,255,0.7)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '4px', paddingLeft: '8px' }}>
          Bodies
        </p>

        {/* Sun */}
        <button
          className="planet-item"
          onClick={() => handleSelectPlanet('Sun', 'Our star · Surface temp 5,500°C · Core temp 15,000,000°C')}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px 10px', borderRadius: '8px', width: '100%', textAlign: 'left',
            background: selectedPlanet === 'Sun' ? 'rgba(0,212,255,0.15)' : 'transparent',
            border: selectedPlanet === 'Sun' ? '1px solid rgba(0,212,255,0.5)' : '1px solid transparent',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '16px' }}>☀️</span>
          <span style={{ color: selectedPlanet === 'Sun' ? '#00d4ff' : '#cccccc', fontSize: '13px', fontWeight: 500 }}>
            Sun
          </span>
          {selectedPlanet === 'Sun' && <span style={{ marginLeft: 'auto', color: '#00d4ff', fontSize: '10px' }}>●</span>}
        </button>

        {PLANET_LIST.map(planet => (
          <button
            key={planet.name}
            className="planet-item"
            onClick={() => handleListClick(planet)}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '8px 10px', borderRadius: '8px', width: '100%', textAlign: 'left',
              background: selectedPlanet === planet.name ? 'rgba(0,212,255,0.15)' : 'transparent',
              border: selectedPlanet === planet.name ? '1px solid rgba(0,212,255,0.5)' : '1px solid transparent',
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: planet.color,
                boxShadow: selectedPlanet === planet.name ? `0 0 6px ${planet.color}` : 'none',
                flexShrink: 0,
              }}
            />
            <span style={{ color: selectedPlanet === planet.name ? '#00d4ff' : '#cccccc', fontSize: '13px', fontWeight: 500 }}>
              {planet.name}
            </span>
            {planet.name === 'Pluto' && (
              <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', marginLeft: 'auto' }}>dwarf</span>
            )}
            {selectedPlanet === planet.name && planet.name !== 'Pluto' && (
              <span style={{ marginLeft: 'auto', color: '#00d4ff', fontSize: '10px' }}>●</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Top-right: Planet info panel ──────────────────────────────────── */}
      {selectedPlanet && (
        <div
          className="absolute"
          style={{
            ...glass,
            top: '64px',
            right: '16px',
            width: '280px',
            padding: '20px',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {currentPlanetData && (
                <span
                  style={{
                    width: '14px', height: '14px', borderRadius: '50%',
                    background: currentPlanetData.color,
                    boxShadow: `0 0 10px ${currentPlanetData.color}`,
                    display: 'inline-block',
                  }}
                />
              )}
              <h2 style={{ color: '#00d4ff', fontSize: '18px', fontWeight: 700, margin: 0 }}>
                {selectedPlanet}
              </h2>
            </div>
            <button
              onClick={() => { setSelectedPlanet(null); setFocusPlanet(undefined); }}
              style={{ color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
            >
              ✕
            </button>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'rgba(0,212,255,0.2)', marginBottom: '14px' }} />

          {/* Info */}
          <p style={{ color: '#aaccee', fontSize: '13px', lineHeight: '1.7', margin: 0 }}>
            {selectedInfo}
          </p>

          {/* Quick facts */}
          {currentPlanetData && (
            <div className="mt-4 flex flex-col gap-2">
              <div style={{ fontSize: '10px', color: 'rgba(0,212,255,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>
                Orbital Data
              </div>
              {(() => {
                const p = PLANET_LIST.findIndex(x => x.name === selectedPlanet);
                const periods: Record<string, string> = {
                  Mercury: '88 days', Venus: '225 days', Earth: '365 days',
                  Mars: '687 days', Jupiter: '11.9 yrs', Saturn: '29.5 yrs',
                  Uranus: '84 yrs', Neptune: '165 yrs', Pluto: '248 yrs',
                };
                const distances: Record<string, string> = {
                  Mercury: '0.39 AU', Venus: '0.72 AU', Earth: '1.0 AU',
                  Mars: '1.52 AU', Jupiter: '5.2 AU', Saturn: '9.58 AU',
                  Uranus: '19.2 AU', Neptune: '30.1 AU', Pluto: '39.5 AU',
                };
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {periods[selectedPlanet] && (
                      <div style={{ background: 'rgba(0,212,255,0.07)', borderRadius: '8px', padding: '8px 10px' }}>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>Orbital period</div>
                        <div style={{ color: '#e0f0ff', fontSize: '12px', fontWeight: 600 }}>{periods[selectedPlanet]}</div>
                      </div>
                    )}
                    {distances[selectedPlanet] && (
                      <div style={{ background: 'rgba(0,212,255,0.07)', borderRadius: '8px', padding: '8px 10px' }}>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>Distance</div>
                        <div style={{ color: '#e0f0ff', fontSize: '12px', fontWeight: 600 }}>{distances[selectedPlanet]}</div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Glow accent bottom */}
          <div style={{
            marginTop: '16px', height: '2px', borderRadius: '1px',
            background: `linear-gradient(90deg, transparent, ${currentPlanetData?.color ?? '#00d4ff'}, transparent)`,
          }} />
        </div>
      )}

      {/* ── Bottom: Time controls ─────────────────────────────────────────── */}
      <div
        className="absolute bottom-4 left-1/2 flex items-center gap-2"
        style={{ transform: 'translateX(-50%)', ...glass, padding: '10px 16px' }}
      >
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginRight: '4px', letterSpacing: '0.08em' }}>
          TIME SPEED
        </span>
        {TIME_BUTTONS.map(btn => {
          const isActive = btn.value === timeScale;
          return (
            <button
              key={btn.label}
              className="time-btn"
              onClick={() => setTimeScale(btn.value)}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '6px 12px', borderRadius: '8px',
                background: isActive ? 'rgba(0,212,255,0.25)' : 'transparent',
                border: isActive ? '1px solid rgba(0,212,255,0.6)' : '1px solid rgba(255,255,255,0.1)',
                color: isActive ? '#00d4ff' : 'rgba(255,255,255,0.55)',
                fontSize: '12px', fontWeight: isActive ? 700 : 400,
                cursor: 'pointer',
                boxShadow: isActive ? '0 0 12px rgba(0,212,255,0.3)' : 'none',
              }}
            >
              <span style={{ fontSize: '14px' }}>{btn.icon}</span>
              <span>{btn.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Bottom-right hint ──────────────────────────────────────────────── */}
      <div
        className="absolute bottom-4 right-4"
        style={{ color: 'rgba(255,255,255,0.22)', fontSize: '11px', textAlign: 'right', lineHeight: '1.5' }}
      >
        <div>Orbits scaled for visibility</div>
        <div>Sizes not to scale</div>
      </div>
    </div>
  );
}
