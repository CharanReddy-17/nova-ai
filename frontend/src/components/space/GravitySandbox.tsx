'use client';

import React, {
  useRef,
  useEffect,
  useCallback,
  useState,
} from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GravitySandboxProps {
  width?: number;
  height?: number;
}

type BodyType = 'Star' | 'Planet' | 'Moon' | 'Asteroid' | 'BlackHole';

interface Vec2 { x: number; y: number; }

interface Body {
  id: number;
  type: BodyType;
  pos: Vec2;
  vel: Vec2;
  mass: number;
  radius: number;
  color: string;
  glowColor?: string;
  trail: Vec2[];
  absorbed: boolean;
}

// ─── Body Presets ─────────────────────────────────────────────────────────────

interface BodyPreset {
  label: string;
  emoji: string;
  type: BodyType;
  mass: number;
  radius: number;
  color: string;
  glowColor?: string;
}

const BODY_PRESETS: BodyPreset[] = [
  { label: 'Star',       emoji: '⭐', type: 'Star',      mass: 5000,  radius: 18, color: '#ffdd44', glowColor: '#ff9900' },
  { label: 'Planet',     emoji: '🪐', type: 'Planet',    mass: 200,   radius: 9,  color: '#44aaff', glowColor: '#2266cc' },
  { label: 'Moon',       emoji: '🌕', type: 'Moon',      mass: 20,    radius: 5,  color: '#ccccaa', glowColor: '#888877' },
  { label: 'Asteroid',   emoji: '🪨', type: 'Asteroid',  mass: 5,     radius: 3,  color: '#9b7d52', glowColor: undefined },
  { label: 'Black Hole', emoji: '🕳',  type: 'BlackHole', mass: 50000, radius: 14, color: '#111111', glowColor: '#8800ff' },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const G_BASE = 0.5;
const TRAIL_LENGTH = 200;
const SOFTENING = 10; // softening factor to prevent singularities
const MAX_BODIES = 80;

let nextId = 1;

// ─── Physics ──────────────────────────────────────────────────────────────────

function createBody(type: BodyType, pos: Vec2): Body {
  const preset = BODY_PRESETS.find(p => p.type === type) ?? BODY_PRESETS[1];
  return {
    id: nextId++,
    type,
    pos: { ...pos },
    vel: { x: (Math.random() - 0.5) * 0.8, y: (Math.random() - 0.5) * 0.8 },
    mass: preset.mass * (0.85 + Math.random() * 0.3),
    radius: preset.radius * (0.85 + Math.random() * 0.3),
    color: preset.color,
    glowColor: preset.glowColor,
    trail: [],
    absorbed: false,
  };
}

function stepPhysics(bodies: Body[], G: number, dt: number): Body[] {
  const alive = bodies.filter(b => !b.absorbed);

  // Compute accelerations
  const acc: Vec2[] = alive.map(() => ({ x: 0, y: 0 }));

  for (let i = 0; i < alive.length; i++) {
    for (let j = i + 1; j < alive.length; j++) {
      const dx = alive[j].pos.x - alive[i].pos.x;
      const dy = alive[j].pos.y - alive[i].pos.y;
      const distSq = dx * dx + dy * dy + SOFTENING * SOFTENING;
      const dist = Math.sqrt(distSq);
      const force = (G * alive[i].mass * alive[j].mass) / distSq;
      const fx = (force * dx) / dist;
      const fy = (force * dy) / dist;

      acc[i].x += fx / alive[i].mass;
      acc[i].y += fy / alive[i].mass;
      acc[j].x -= fx / alive[j].mass;
      acc[j].y -= fy / alive[j].mass;
    }
  }

  // Update velocities & positions, record trails
  for (let i = 0; i < alive.length; i++) {
    alive[i].vel.x += acc[i].x * dt;
    alive[i].vel.y += acc[i].y * dt;
    alive[i].pos.x += alive[i].vel.x * dt;
    alive[i].pos.y += alive[i].vel.y * dt;

    // Record trail
    alive[i].trail.push({ ...alive[i].pos });
    if (alive[i].trail.length > TRAIL_LENGTH) {
      alive[i].trail.shift();
    }
  }

  // Collision detection & merge
  const toAbsorb = new Set<number>();
  for (let i = 0; i < alive.length; i++) {
    if (toAbsorb.has(alive[i].id)) continue;
    for (let j = i + 1; j < alive.length; j++) {
      if (toAbsorb.has(alive[j].id)) continue;
      const dx = alive[j].pos.x - alive[i].pos.x;
      const dy = alive[j].pos.y - alive[i].pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < alive[i].radius + alive[j].radius) {
        // Merge smaller into larger
        const [big, small] =
          alive[i].mass >= alive[j].mass
            ? [alive[i], alive[j]]
            : [alive[j], alive[i]];

        // Conservation of momentum
        big.vel.x = (big.mass * big.vel.x + small.mass * small.vel.x) / (big.mass + small.mass);
        big.vel.y = (big.mass * big.vel.y + small.mass * small.vel.y) / (big.mass + small.mass);
        big.mass += small.mass;
        big.radius = Math.min(big.radius + small.radius * 0.25, 40);

        toAbsorb.add(small.id);
      }
    }
  }

  return alive.map(b => ({ ...b, absorbed: toAbsorb.has(b.id) }));
}

// ─── Rendering ────────────────────────────────────────────────────────────────

function renderFrame(
  ctx: CanvasRenderingContext2D,
  bodies: Body[],
  width: number,
  height: number,
  hoveredBodyId: number | null
) {
  // Clear
  ctx.clearRect(0, 0, width, height);

  const alive = bodies.filter(b => !b.absorbed);

  // ── Draw trails ────────────────────────────────────────────────────────────
  for (const body of alive) {
    if (body.trail.length < 2) continue;
    for (let t = 1; t < body.trail.length; t++) {
      const alpha = (t / body.trail.length) * 0.55;
      ctx.beginPath();
      ctx.moveTo(body.trail[t - 1].x, body.trail[t - 1].y);
      ctx.lineTo(body.trail[t].x, body.trail[t].y);
      ctx.strokeStyle =
        body.glowColor
          ? `${body.glowColor}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`
          : `rgba(200,200,200,${alpha * 0.5})`;
      ctx.lineWidth = Math.max(0.5, body.radius * 0.15 * (t / body.trail.length));
      ctx.stroke();
    }
  }

  // ── Draw bodies ────────────────────────────────────────────────────────────
  for (const body of alive) {
    const { pos, radius, color, glowColor, type } = body;
    const isHovered = body.id === hoveredBodyId;

    ctx.save();

    // Glow halo
    if (glowColor || isHovered) {
      const glowRadius = radius * (type === 'BlackHole' ? 3.5 : isHovered ? 2.5 : 2.0);
      const grd = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, glowRadius);
      grd.addColorStop(0, glowColor ?? '#ffffff');
      grd.addColorStop(0.4, `${glowColor ?? '#ffffff'}88`);
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    }

    // Black Hole event horizon ring
    if (type === 'BlackHole') {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius * 1.6, 0, Math.PI * 2);
      ctx.strokeStyle = '#aa00ff';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#8800ff';
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Body fill
    const bodyGrad = ctx.createRadialGradient(
      pos.x - radius * 0.3, pos.y - radius * 0.3, radius * 0.1,
      pos.x, pos.y, radius
    );

    if (type === 'BlackHole') {
      bodyGrad.addColorStop(0, '#220033');
      bodyGrad.addColorStop(0.7, '#110022');
      bodyGrad.addColorStop(1, '#000000');
    } else if (type === 'Star') {
      bodyGrad.addColorStop(0, '#fff8e0');
      bodyGrad.addColorStop(0.4, color);
      bodyGrad.addColorStop(1, '#cc6600');
    } else {
      bodyGrad.addColorStop(0, lightenHex(color, 50));
      bodyGrad.addColorStop(0.7, color);
      bodyGrad.addColorStop(1, darkenHex(color, 40));
    }

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // Highlight shine
    if (type !== 'BlackHole') {
      const shine = ctx.createRadialGradient(
        pos.x - radius * 0.35, pos.y - radius * 0.35, 0,
        pos.x - radius * 0.35, pos.y - radius * 0.35, radius * 0.6
      );
      shine.addColorStop(0, 'rgba(255,255,255,0.35)');
      shine.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = shine;
      ctx.fill();
    }

    // Hover ring
    if (isHovered) {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius + 4, 0, Math.PI * 2);
      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ─── Color helpers ────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const n = parseInt(clean, 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function lightenHex(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgb(${Math.min(r + amount, 255)},${Math.min(g + amount, 255)},${Math.min(b + amount, 255)})`;
}

function darkenHex(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgb(${Math.max(r - amount, 0)},${Math.max(g - amount, 0)},${Math.max(b - amount, 0)})`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GravitySandbox({ width, height }: GravitySandboxProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const containerRef = useRef<HTMLDivElement>(null!);
  const bodiesRef = useRef<Body[]>([]);
  const animRef = useRef<number>(0);
  const pausedRef = useRef(false);
  const GRef = useRef(G_BASE);
  const hoveredIdRef = useRef<number | null>(null);

  const [selectedType, setSelectedType] = useState<BodyType>('Planet');
  const [paused, setPaused] = useState(false);
  const [gStrength, setGStrength] = useState(G_BASE);
  const [bodyCount, setBodyCount] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ w: width ?? 800, h: height ?? 600 });

  // Keep refs synced
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { GRef.current = gStrength; }, [gStrength]);

  // Resize observer
  useEffect(() => {
    if (width && height) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        setCanvasSize({ w: Math.floor(w), h: Math.floor(h) });
      }
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [width, height]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    let last = performance.now();

    const loop = (now: number) => {
      const dtRaw = Math.min((now - last) / 1000, 0.04); // cap at 40ms
      last = now;

      if (!pausedRef.current && bodiesRef.current.length > 0) {
        bodiesRef.current = stepPhysics(bodiesRef.current, GRef.current, dtRaw * 60);
        bodiesRef.current = bodiesRef.current.filter(b => !b.absorbed);
        setBodyCount(bodiesRef.current.length);
      }

      renderFrame(ctx, bodiesRef.current, canvas.width, canvas.height, hoveredIdRef.current);
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // Canvas click → spawn
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (bodiesRef.current.filter(b => !b.absorbed).length >= MAX_BODIES) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const body = createBody(selectedType, { x, y });
      bodiesRef.current = [...bodiesRef.current, body];
      setBodyCount(bodiesRef.current.length);
    },
    [selectedType]
  );

  // Hover detection
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    let found: number | null = null;
    for (const b of bodiesRef.current) {
      if (b.absorbed) continue;
      const dx = b.pos.x - mx;
      const dy = b.pos.y - my;
      if (Math.sqrt(dx * dx + dy * dy) <= b.radius + 6) {
        found = b.id;
        break;
      }
    }
    hoveredIdRef.current = found;
    canvasRef.current.style.cursor = found !== null ? 'pointer' : 'crosshair';
  }, []);

  const handleClear = useCallback(() => {
    bodiesRef.current = [];
    setBodyCount(0);
  }, []);

  const selectedPreset = BODY_PRESETS.find(p => p.type === selectedType)!;

  return (
    <div
      ref={containerRef}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : '100%',
        position: 'relative',
        background: '#020209',
        overflow: 'hidden',
        borderRadius: '12px',
      }}
    >
      {/* ── Canvas ─────────────────────────────────────────────────────────── */}
      <canvas
        ref={canvasRef}
        width={canvasSize.w}
        height={canvasSize.h}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        style={{
          display: 'block',
          position: 'absolute',
          inset: 0,
          cursor: 'crosshair',
        }}
      />

      {/* ── Background star field (CSS) ───────────────────────────────────── */}
      <div
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `
            radial-gradient(1px 1px at 10% 15%, rgba(255,255,255,0.6) 0%, transparent 100%),
            radial-gradient(1px 1px at 30% 40%, rgba(255,255,255,0.4) 0%, transparent 100%),
            radial-gradient(1px 1px at 55% 20%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1px 1px at 75% 60%, rgba(255,255,255,0.3) 0%, transparent 100%),
            radial-gradient(1px 1px at 90% 10%, rgba(255,255,255,0.6) 0%, transparent 100%),
            radial-gradient(1px 1px at 20% 80%, rgba(255,255,255,0.4) 0%, transparent 100%),
            radial-gradient(1px 1px at 45% 70%, rgba(255,255,255,0.3) 0%, transparent 100%),
            radial-gradient(1px 1px at 85% 85%, rgba(255,255,255,0.5) 0%, transparent 100%)
          `,
        }}
      />

      {/* ── Controls bar ─────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute', bottom: '12px', left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
          background: 'rgba(2, 10, 30, 0.88)',
          backdropFilter: 'blur(14px)',
          border: '1px solid rgba(0,212,255,0.2)',
          borderRadius: '14px',
          padding: '10px 16px',
          zIndex: 10,
          maxWidth: 'calc(100% - 32px)',
        }}
      >
        {/* Body type selector */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {BODY_PRESETS.map(preset => {
            const isSelected = preset.type === selectedType;
            return (
              <button
                key={preset.type}
                onClick={() => setSelectedType(preset.type)}
                title={preset.label}
                style={{
                  padding: '5px 10px', borderRadius: '8px',
                  background: isSelected ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.05)',
                  border: isSelected ? '1px solid rgba(0,212,255,0.6)' : '1px solid rgba(255,255,255,0.1)',
                  color: isSelected ? '#00d4ff' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer', fontSize: '13px',
                  display: 'flex', alignItems: 'center', gap: '5px',
                  transition: 'all 0.15s ease',
                  fontWeight: isSelected ? 700 : 400,
                }}
              >
                <span style={{ fontSize: '16px' }}>{preset.emoji}</span>
                <span style={{ display: 'none' }}>{preset.label}</span>
              </button>
            );
          })}
        </div>

        {/* Separator */}
        <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.1)' }} />

        {/* G slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em' }}>G</span>
          <input
            type="range"
            min={0.1}
            max={3.0}
            step={0.05}
            value={gStrength}
            onChange={e => setGStrength(parseFloat(e.target.value))}
            style={{
              width: '80px', accentColor: '#00d4ff',
              cursor: 'pointer',
            }}
          />
          <span style={{ fontSize: '11px', color: '#00d4ff', minWidth: '28px' }}>
            {gStrength.toFixed(1)}×
          </span>
        </div>

        {/* Separator */}
        <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.1)' }} />

        {/* Pause / Clear */}
        <button
          onClick={() => setPaused(p => !p)}
          style={{
            padding: '5px 12px', borderRadius: '8px',
            background: paused ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.05)',
            border: paused ? '1px solid rgba(0,212,255,0.6)' : '1px solid rgba(255,255,255,0.1)',
            color: paused ? '#00d4ff' : 'rgba(255,255,255,0.55)',
            cursor: 'pointer', fontSize: '13px', fontWeight: 600,
            transition: 'all 0.15s ease',
          }}
        >
          {paused ? '▶ Resume' : '⏸ Pause'}
        </button>

        <button
          onClick={handleClear}
          style={{
            padding: '5px 12px', borderRadius: '8px',
            background: 'rgba(255,80,80,0.1)',
            border: '1px solid rgba(255,80,80,0.3)',
            color: 'rgba(255,150,150,0.8)',
            cursor: 'pointer', fontSize: '13px', fontWeight: 600,
            transition: 'all 0.15s ease',
          }}
        >
          🗑 Clear
        </button>

        {/* Body count */}
        <div style={{
          marginLeft: '4px', fontSize: '11px', color: 'rgba(255,255,255,0.35)',
          minWidth: '52px',
        }}>
          {bodyCount}/{MAX_BODIES} bodies
        </div>
      </div>

      {/* ── Spawn indicator ───────────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute', top: '12px', left: '12px',
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'rgba(2,10,30,0.7)',
          border: '1px solid rgba(0,212,255,0.15)',
          borderRadius: '10px',
          padding: '7px 12px',
          fontSize: '12px',
          color: '#aaccee',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        <span style={{ fontSize: '16px' }}>{selectedPreset.emoji}</span>
        <span>Click to spawn <strong style={{ color: '#00d4ff' }}>{selectedPreset.label}</strong></span>
      </div>

      {/* ── Status (paused overlay) ───────────────────────────────────────── */}
      {paused && (
        <div
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            fontSize: '13px', fontWeight: 700, color: '#00d4ff',
            background: 'rgba(0,0,20,0.6)',
            border: '1px solid rgba(0,212,255,0.3)',
            borderRadius: '12px',
            padding: '12px 24px',
            pointerEvents: 'none',
            letterSpacing: '0.12em',
          }}
        >
          ⏸ SIMULATION PAUSED
        </div>
      )}

      {/* ── Max bodies warning ────────────────────────────────────────────── */}
      {bodyCount >= MAX_BODIES && (
        <div
          style={{
            position: 'absolute', top: '12px', right: '12px',
            fontSize: '11px', color: 'rgba(255,150,100,0.8)',
            background: 'rgba(2,10,30,0.7)',
            border: '1px solid rgba(255,100,50,0.3)',
            borderRadius: '8px',
            padding: '6px 12px',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          ⚠ Max bodies reached ({MAX_BODIES})
        </div>
      )}
    </div>
  );
}
