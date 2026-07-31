'use client';

/** Placeholder – Three.js SolarSystem was removed. This page is kept for future re-implementation. */
export default function SolarSystem(_props: { timeScale?: number; onSelectPlanet?: (name: string, info: string) => void; focusPlanet?: string }) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020209', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 56 }}>🌌</div>
      <p style={{ color: '#00d4ff', fontWeight: 700, fontSize: 18 }}>Solar System Explorer</p>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', maxWidth: 320 }}>
        The 3D solar system viewer is temporarily offline.<br />It will return in a future update.
      </p>
    </div>
  );
}
