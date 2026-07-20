'use client';

import React, { useRef, useMemo, useCallback, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  Stars,
  Billboard,
  Text,
} from '@react-three/drei';
import * as THREE from 'three';



// ─── Types ────────────────────────────────────────────────────────────────────

export interface SolarSystemProps {
  timeScale: number;
  onSelectPlanet: (name: string, info: string) => void;
  focusPlanet?: string;
}

interface PlanetData {
  name: string;
  radius: number;       // visual radius
  orbitRadius: number;  // AU-scaled distance from Sun
  period: number;       // Earth-years
  color: string;
  emissive?: string;
  info: string;
  drawTexture: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  tilt?: number;        // axial tilt in radians
  hasRings?: boolean;
  hasMoon?: boolean;
}

// ─── Procedural Texture Helper ────────────────────────────────────────────────

function makeTexture(
  w: number,
  drawFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = Math.floor(w / 2);
  const ctx = canvas.getContext('2d')!;
  drawFn(ctx, w, Math.floor(w / 2));
  return new THREE.CanvasTexture(canvas);
}

// ─── Planet Definitions ───────────────────────────────────────────────────────

const PLANETS: PlanetData[] = [
  {
    name: 'Mercury',
    radius: 0.25,
    orbitRadius: 4,
    period: 0.24,
    color: '#b5b5b5',
    info: 'Closest to Sun · No atmosphere · Surface reaches 430°C',
    drawTexture: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#c8c8c8');
      grad.addColorStop(0.4, '#909090');
      grad.addColorStop(1, '#6e6e6e');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      // craters
      for (let i = 0; i < 40; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const r = Math.random() * 8 + 2;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(80,80,80,${Math.random() * 0.4 + 0.1})`;
        ctx.fill();
      }
    },
  },
  {
    name: 'Venus',
    radius: 0.45,
    orbitRadius: 7,
    period: 0.62,
    color: '#e8c97b',
    info: 'Hottest planet · 465°C · Retrograde rotation',
    drawTexture: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#f5dda0');
      grad.addColorStop(0.3, '#e8b860');
      grad.addColorStop(0.7, '#d4963a');
      grad.addColorStop(1, '#c87820');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      // swirling clouds
      for (let i = 0; i < 12; i++) {
        const y = (i / 12) * h;
        ctx.beginPath();
        ctx.moveTo(0, y + Math.random() * 20 - 10);
        for (let x = 0; x <= w; x += 20) {
          ctx.lineTo(x, y + Math.sin(x * 0.05 + i) * 15);
        }
        ctx.strokeStyle = `rgba(255,220,150,0.25)`;
        ctx.lineWidth = 6;
        ctx.stroke();
      }
    },
  },
  {
    name: 'Earth',
    radius: 0.5,
    orbitRadius: 10,
    period: 1.0,
    color: '#2e86ab',
    info: 'Only known life · 1 Moon · 71% ocean coverage',
    hasMoon: true,
    drawTexture: (ctx, w, h) => {
      // Ocean base
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#1a5f8a');
      grad.addColorStop(0.5, '#2e86ab');
      grad.addColorStop(1, '#1a4f7a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      // Landmasses
      const landColors = ['#4a8b3a', '#3d7a2e', '#5a9a48', '#2e5e22'];
      const landPatches = [
        { x: 0.2, y: 0.3, rx: 0.12, ry: 0.18 },
        { x: 0.55, y: 0.35, rx: 0.14, ry: 0.16 },
        { x: 0.75, y: 0.45, rx: 0.10, ry: 0.20 },
        { x: 0.35, y: 0.65, rx: 0.09, ry: 0.12 },
        { x: 0.1, y: 0.6, rx: 0.07, ry: 0.10 },
        { x: 0.85, y: 0.25, rx: 0.08, ry: 0.09 },
      ];
      landPatches.forEach((p, i) => {
        ctx.beginPath();
        ctx.ellipse(p.x * w, p.y * h, p.rx * w, p.ry * h, Math.random() * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = landColors[i % landColors.length];
        ctx.fill();
      });
      // Polar caps
      ctx.fillStyle = '#e8f4ff';
      ctx.fillRect(0, 0, w, h * 0.06);
      ctx.fillRect(0, h * 0.94, w, h * 0.06);
      // Cloud wisps
      for (let i = 0; i < 8; i++) {
        const y = Math.random() * h;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 15) {
          ctx.lineTo(x, y + Math.sin(x * 0.04 + i * 2) * 8);
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.22)';
        ctx.lineWidth = 5;
        ctx.stroke();
      }
    },
  },
  {
    name: 'Mars',
    radius: 0.35,
    orbitRadius: 14,
    period: 1.88,
    color: '#c1440e',
    info: '2 moons Phobos & Deimos · Largest volcano Olympus Mons',
    drawTexture: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#d4622a');
      grad.addColorStop(0.5, '#c1440e');
      grad.addColorStop(1, '#8b2500');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      // Surface details
      for (let i = 0; i < 25; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const r = Math.random() * 15 + 3;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${Math.random() > 0.5 ? '180,80,20' : '100,30,0'},0.3)`;
        ctx.fill();
      }
      // Polar caps
      ctx.fillStyle = 'rgba(240,240,255,0.7)';
      ctx.fillRect(0, 0, w, h * 0.05);
      ctx.fillRect(0, h * 0.95, w, h * 0.05);
      // Valles Marineris hint
      ctx.beginPath();
      ctx.moveTo(w * 0.3, h * 0.5);
      ctx.lineTo(w * 0.7, h * 0.48);
      ctx.strokeStyle = 'rgba(80,20,0,0.5)';
      ctx.lineWidth = 3;
      ctx.stroke();
    },
  },
  {
    name: 'Jupiter',
    radius: 1.4,
    orbitRadius: 22,
    period: 11.86,
    color: '#c88b3a',
    info: '95 moons · Great Red Spot storm · Largest planet',
    drawTexture: (ctx, w, h) => {
      // Banded atmosphere
      const bands = [
        '#e8d5b0', '#c8a060', '#e0c890', '#b87830',
        '#d4b870', '#c89050', '#e8c880', '#a86820',
        '#d8b860', '#c07830', '#e0c080',
      ];
      const bh = h / bands.length;
      bands.forEach((color, i) => {
        ctx.fillStyle = color;
        ctx.fillRect(0, i * bh, w, bh + 1);
      });
      // Wavy band edges
      for (let i = 0; i < bands.length; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * bh);
        for (let x = 0; x <= w; x += 10) {
          ctx.lineTo(x, i * bh + Math.sin(x * 0.03 + i * 1.5) * 4);
        }
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      // Great Red Spot
      const gx = w * 0.65, gy = h * 0.58;
      const gGrad = ctx.createRadialGradient(gx, gy, 0, gx, gy, w * 0.08);
      gGrad.addColorStop(0, '#cc3300');
      gGrad.addColorStop(0.5, '#aa2200');
      gGrad.addColorStop(1, 'rgba(180,80,0,0)');
      ctx.beginPath();
      ctx.ellipse(gx, gy, w * 0.09, h * 0.07, 0, 0, Math.PI * 2);
      ctx.fillStyle = gGrad;
      ctx.fill();
    },
  },
  {
    name: 'Saturn',
    radius: 1.2,
    orbitRadius: 32,
    period: 29.46,
    color: '#e8d5a0',
    tilt: 0.47,
    hasRings: true,
    info: 'Lowest density · Ring system 282,000 km wide · 146 moons',
    drawTexture: (ctx, w, h) => {
      const bands = [
        '#f0e0b0', '#e0c88a', '#f0d890', '#d8b870',
        '#e8d090', '#d0b060', '#e8d8a0',
      ];
      const bh = h / bands.length;
      bands.forEach((color, i) => {
        ctx.fillStyle = color;
        ctx.fillRect(0, i * bh, w, bh + 1);
      });
      // Subtle wavy bands
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        const y = (i / 8) * h;
        for (let x = 0; x <= w; x += 10) {
          ctx.lineTo(x, y + Math.sin(x * 0.025 + i) * 3);
        }
        ctx.strokeStyle = 'rgba(150,100,20,0.15)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    },
  },
  {
    name: 'Uranus',
    radius: 0.9,
    orbitRadius: 44,
    period: 84,
    color: '#7de8e8',
    tilt: 1.71, // nearly on its side
    info: 'Rotates on side · Ice giant · 27 moons',
    drawTexture: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#a0f0f0');
      grad.addColorStop(0.4, '#60d8d8');
      grad.addColorStop(0.8, '#40b8c0');
      grad.addColorStop(1, '#2090a0');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      // Subtle banding
      for (let i = 0; i < 6; i++) {
        const y = (i / 6) * h;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 10) {
          ctx.lineTo(x, y + Math.sin(x * 0.02 + i) * 5);
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    },
  },
  {
    name: 'Neptune',
    radius: 0.85,
    orbitRadius: 56,
    period: 165,
    color: '#3f54ba',
    info: 'Strongest winds 2100 km/h · Farthest planet · 16 moons',
    drawTexture: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#5070d0');
      grad.addColorStop(0.4, '#3550b0');
      grad.addColorStop(0.8, '#203898');
      grad.addColorStop(1, '#102080');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      // Storm spot
      const sx = w * 0.4, sy = h * 0.45;
      const sGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, w * 0.07);
      sGrad.addColorStop(0, 'rgba(80,120,220,0.8)');
      sGrad.addColorStop(1, 'rgba(80,120,220,0)');
      ctx.beginPath();
      ctx.ellipse(sx, sy, w * 0.07, h * 0.06, 0, 0, Math.PI * 2);
      ctx.fillStyle = sGrad;
      ctx.fill();
      // Wind streaks
      for (let i = 0; i < 8; i++) {
        const y = (i / 8) * h + 10;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 10) {
          ctx.lineTo(x, y + Math.sin(x * 0.035 + i * 0.8) * 8);
        }
        ctx.strokeStyle = 'rgba(150,180,255,0.15)';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    },
  },
  {
    name: 'Pluto',
    radius: 0.18,
    orbitRadius: 65,
    period: 248,
    color: '#c8a878',
    info: 'Dwarf planet · Heart-shaped nitrogen ice plain',
    drawTexture: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#d8b888');
      grad.addColorStop(0.5, '#b89060');
      grad.addColorStop(1, '#987040');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      // Heart-shaped bright region
      const hx = w * 0.5, hy = h * 0.55;
      const hGrad = ctx.createRadialGradient(hx, hy, 0, hx, hy, w * 0.25);
      hGrad.addColorStop(0, 'rgba(255,240,220,0.85)');
      hGrad.addColorStop(1, 'rgba(255,240,220,0)');
      ctx.beginPath();
      ctx.ellipse(hx, hy, w * 0.22, h * 0.2, 0, 0, Math.PI * 2);
      ctx.fillStyle = hGrad;
      ctx.fill();
    },
  },
];

// ─── Sun Texture ──────────────────────────────────────────────────────────────

function makeSunTexture(): THREE.CanvasTexture {
  return makeTexture(512, (ctx, w, h) => {
    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    grad.addColorStop(0, '#fff8e0');
    grad.addColorStop(0.3, '#ffdd44');
    grad.addColorStop(0.7, '#ff9900');
    grad.addColorStop(1, '#cc4400');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    // Solar granules
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = Math.random() * 12 + 4;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,${180 + Math.random() * 75 | 0},0,${Math.random() * 0.2})`;
      ctx.fill();
    }
  });
}

// ─── Moon Texture ─────────────────────────────────────────────────────────────

function makeMoonTexture(): THREE.CanvasTexture {
  return makeTexture(256, (ctx, w, h) => {
    ctx.fillStyle = '#aaaaaa';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = Math.random() * 6 + 1;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(80,80,80,${Math.random() * 0.35 + 0.05})`;
      ctx.fill();
    }
  });
}

// ─── Orbit Path ───────────────────────────────────────────────────────────────

function OrbitPath({ radius }: { radius: number }) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }
    return pts;
  }, [radius]);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(points);
    return g;
  }, [points]);

  return (
    <line geometry={geometry}>
      <lineBasicMaterial color="#334466" transparent opacity={0.35} linewidth={1} />
    </line>
  );
}

// ─── Saturn Rings ─────────────────────────────────────────────────────────────

function SaturnRings() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    // Rings from inner to outer
    const rings = [
      { start: 0.0, end: 0.25, color: 'rgba(200,180,120,0.3)' },
      { start: 0.28, end: 0.55, color: 'rgba(220,200,150,0.7)' },
      { start: 0.58, end: 0.75, color: 'rgba(210,190,140,0.5)' },
      { start: 0.77, end: 0.88, color: 'rgba(200,175,120,0.6)' },
      { start: 0.9, end: 1.0,  color: 'rgba(190,170,110,0.2)' },
    ];
    rings.forEach(r => {
      const grad = ctx.createLinearGradient(r.start * 512, 0, r.end * 512, 0);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.2, r.color);
      grad.addColorStop(0.8, r.color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(r.start * 512, 0, (r.end - r.start) * 512, 64);
    });
    return new THREE.CanvasTexture(canvas);
  }, []);

  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[1.6, 3.0, 128]} />
      <meshBasicMaterial
        map={texture}
        side={THREE.DoubleSide}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
}

// ─── Moon Component ───────────────────────────────────────────────────────────

function Moon({ moonTexture }: { moonTexture: THREE.CanvasTexture }) {
  const moonRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const angle = t * 1.2; // moon orbital speed
    moonRef.current.position.x = Math.cos(angle) * 1.1;
    moonRef.current.position.z = Math.sin(angle) * 1.1;
    moonRef.current.rotation.y += 0.01;
  });

  return (
    <mesh ref={moonRef}>
      <sphereGeometry args={[0.13, 16, 16]} />
      <meshStandardMaterial map={moonTexture} roughness={0.95} metalness={0.0} />
    </mesh>
  );
}

// ─── Planet Component ─────────────────────────────────────────────────────────

interface PlanetMeshProps {
  data: PlanetData;
  timeScale: number;
  onSelect: (name: string, info: string) => void;
  isFocused: boolean;
  moonTexture: THREE.CanvasTexture;
}

function PlanetMesh({ data, timeScale, onSelect, isFocused, moonTexture }: PlanetMeshProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  const texture = useMemo(
    () => makeTexture(512, data.drawTexture),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.name]
  );

  const angularVelocity = useMemo(
    () => (2 * Math.PI) / (data.period * 365.25 * 24 * 3600),
    [data.period]
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const scaledT = t * timeScale;
    const angle = scaledT * angularVelocity;

    groupRef.current.position.x = Math.cos(angle) * data.orbitRadius;
    groupRef.current.position.z = Math.sin(angle) * data.orbitRadius;

    // Self-rotation
    meshRef.current.rotation.y += 0.005 * timeScale;
  });

  const handleClick = useCallback(
    (e: any) => {
      e.stopPropagation();
      onSelect(data.name, data.info);
    },
    [data.name, data.info, onSelect]
  );

  const glowColor = isFocused ? '#00d4ff' : hovered ? '#aaddff' : '#ffffff';

  return (
    <>
      <OrbitPath radius={data.orbitRadius} />
      <group ref={groupRef}>
        {/* Axial tilt wrapper */}
        <group rotation={[data.tilt ?? 0, 0, 0]}>
          <mesh
            ref={meshRef}
            onClick={handleClick}
            onPointerOver={e => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
          >
            <sphereGeometry args={[data.radius, 64, 32]} />
            <meshStandardMaterial
              map={texture}
              roughness={0.75}
              metalness={0.05}
              emissive={new THREE.Color(isFocused ? '#003355' : '#000000')}
              emissiveIntensity={isFocused ? 0.4 : 0}
            />
          </mesh>

          {/* Selection / hover glow */}
          {(hovered || isFocused) && (
            <mesh scale={[1.12, 1.12, 1.12]}>
              <sphereGeometry args={[data.radius, 32, 16]} />
              <meshBasicMaterial
                color={glowColor}
                transparent
                opacity={0.12}
                side={THREE.FrontSide}
              />
            </mesh>
          )}

          {data.hasRings && <SaturnRings />}
          {data.hasMoon && <Moon moonTexture={moonTexture} />}
        </group>

        {/* Floating label */}
        <Billboard follow lockX={false} lockY={false} lockZ={false}>
          <Text
            fontSize={0.45}
            color={isFocused ? '#00d4ff' : '#aaccee'}
            anchorX="center"
            anchorY="bottom"
            position={[0, data.radius + 0.5, 0]}
            outlineColor="#000033"
            outlineWidth={0.04}
          >
            {data.name}
          </Text>
        </Billboard>
      </group>
    </>
  );
}

// ─── Sun Component ────────────────────────────────────────────────────────────

function Sun({ onSelect }: { onSelect: (name: string, info: string) => void }) {
  const coronaRef1 = useRef<THREE.Mesh>(null!);
  const coronaRef2 = useRef<THREE.Mesh>(null!);
  const sunRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  const sunTexture = useMemo(() => makeSunTexture(), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    coronaRef1.current.scale.setScalar(1 + Math.sin(t * 0.8) * 0.03);
    coronaRef2.current.scale.setScalar(1 + Math.sin(t * 0.5 + 1) * 0.05);
    sunRef.current.rotation.y += 0.001;
  });

  return (
    <group>
      {/* Core */}
      <mesh
        ref={sunRef}
        onClick={() => onSelect('Sun', 'Our star · Surface temp 5,500°C · Core temp 15,000,000°C')}
        onPointerOver={e => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        <sphereGeometry args={[2.2, 64, 32]} />
        <meshStandardMaterial
          map={sunTexture}
          emissiveMap={sunTexture}
          emissive={new THREE.Color('#ff9900')}
          emissiveIntensity={1.8}
          roughness={1.0}
          metalness={0.0}
        />
      </mesh>

      {/* Corona layer 1 */}
      <mesh ref={coronaRef1}>
        <sphereGeometry args={[2.5, 32, 16]} />
        <meshBasicMaterial color="#ff6600" transparent opacity={0.06} side={THREE.BackSide} />
      </mesh>

      {/* Corona layer 2 */}
      <mesh ref={coronaRef2}>
        <sphereGeometry args={[3.2, 32, 16]} />
        <meshBasicMaterial color="#ff4400" transparent opacity={0.03} side={THREE.BackSide} />
      </mesh>

      {/* Point light — illuminates planets */}
      <pointLight color="#fff5e0" intensity={3.5} distance={200} decay={2} />
      <pointLight color="#ff9900" intensity={1.5} distance={80} decay={2} />
    </group>
  );
}

// ─── Asteroid Belt ────────────────────────────────────────────────────────────

function AsteroidBelt() {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const COUNT = 600;

  const { positions, rotations, scales } = useMemo(() => {
    const pos: THREE.Vector3[] = [];
    const rot: THREE.Euler[] = [];
    const sca: number[] = [];
    for (let i = 0; i < COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 17 + Math.random() * 3.5;
      const y = (Math.random() - 0.5) * 0.6;
      pos.push(new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r));
      rot.push(new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI));
      sca.push(0.02 + Math.random() * 0.07);
    }
    return { positions: pos, rotations: rot, scales: sca };
  }, []);

  useEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < COUNT; i++) {
      dummy.position.copy(positions[i]);
      dummy.rotation.copy(rotations[i]);
      dummy.scale.setScalar(scales[i]);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [positions, rotations, scales]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#808070" roughness={0.9} metalness={0.1} />
    </instancedMesh>
  );
}

// ─── Camera Auto-Orbit ────────────────────────────────────────────────────────

function AutoOrbit({ focusPlanet }: { focusPlanet?: string }) {
  const { camera } = useThree();

  useEffect(() => {
    // Set a nice initial angle
    camera.position.set(30, 22, 50);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  useFrame(({ clock }) => {
    // Gentle auto-orbit — only when not dragging (OrbitControls overrides)
    const t = clock.getElapsedTime() * 0.02;
    if (!focusPlanet) {
      camera.position.x = Math.cos(t) * 70;
      camera.position.z = Math.sin(t) * 70;
      camera.position.y = 25;
      camera.lookAt(0, 0, 0);
    }
  });

  return null;
}

// ─── Ambient Environment ──────────────────────────────────────────────────────

function SpaceEnvironment() {
  return (
    <>
      <ambientLight intensity={0.05} color="#112244" />
      <Stars radius={300} depth={60} count={8000} factor={4} saturation={0.6} fade speed={1} />
    </>
  );
}

// ─── Main Scene ───────────────────────────────────────────────────────────────

function SolarSystemScene({ timeScale, onSelectPlanet, focusPlanet }: SolarSystemProps) {
  const moonTexture = useMemo(() => makeMoonTexture(), []);

  return (
    <>
      <SpaceEnvironment />
      <AutoOrbit focusPlanet={focusPlanet} />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={150}
        dampingFactor={0.08}
        enableDamping
      />
      <Sun onSelect={onSelectPlanet} />
      <AsteroidBelt />
      {PLANETS.map(planet => (
        <PlanetMesh
          key={planet.name}
          data={planet}
          timeScale={timeScale}
          onSelect={onSelectPlanet}
          isFocused={focusPlanet === planet.name}
          moonTexture={moonTexture}
        />
      ))}
    </>
  );
}

// ─── Exported Component ───────────────────────────────────────────────────────

export default function SolarSystem({ timeScale, onSelectPlanet, focusPlanet }: SolarSystemProps) {
  return (
    <Canvas
      camera={{ position: [30, 22, 50], fov: 60, near: 0.1, far: 2000 }}
      style={{ background: '#020209' }}
      gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      dpr={[1, 2]}
    >
      <SolarSystemScene
        timeScale={timeScale}
        onSelectPlanet={onSelectPlanet}
        focusPlanet={focusPlanet}
      />
    </Canvas>
  );
}

export { PLANETS };
