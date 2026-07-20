'use client';
import { Suspense, useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';


// ── Procedural texture generator ──────────────────────────────────────────────
function makeCanvasTexture(
  width: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = width / 2;
  const ctx = canvas.getContext('2d')!;
  draw(ctx, canvas.width, canvas.height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// pseudo-noise helper
function noise(x: number, y: number, seed = 0) {
  const s = Math.sin(x * 127.1 + y * 311.7 + seed) * 43758.5453;
  return s - Math.floor(s);
}
function smoothNoise(x: number, y: number, seed = 0, octaves = 4) {
  let v = 0, amp = 0.5, freq = 1;
  for (let i = 0; i < octaves; i++) {
    v += noise(x * freq, y * freq, seed) * amp;
    amp *= 0.5; freq *= 2.1;
  }
  return v;
}

// ── Earth texture ─────────────────────────────────────────────────────────────
function makeEarthTexture() {
  return makeCanvasTexture(1024, (ctx, w, h) => {
    for (let px = 0; px < w; px++) {
      for (let py = 0; py < h; py++) {
        const u = px / w, v = py / h;
        const n = smoothNoise(u * 4, v * 4, 42, 6);
        const lat = Math.abs(v - 0.5) * 2;
        let r, g, b;
        if (lat > 0.88) { r = 240; g = 245; b = 255; } // ice caps
        else if (n > 0.55) {
          // land
          const lv = n * 1.4;
          if (lat > 0.75) { r = 180 + lv * 20; g = 200 + lv * 20; b = 160; }
          else if (n > 0.7) { r = 140; g = 120; b = 90; } // mountains
          else { r = 60 + lv * 80; g = 120 + lv * 40; b = 50; }
        } else {
          // ocean — depth gradient
          const d = n / 0.55;
          r = 10 + d * 30; g = 50 + d * 80; b = 130 + d * 80;
        }
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(px, py, 1, 1);
      }
    }
    // Polar ice overlay
    const iceN = ctx.createLinearGradient(0, 0, 0, h);
    iceN.addColorStop(0, 'rgba(230,240,255,0.95)');
    iceN.addColorStop(0.07, 'rgba(230,240,255,0.4)');
    iceN.addColorStop(0.12, 'rgba(0,0,0,0)');
    ctx.fillStyle = iceN; ctx.fillRect(0, 0, w, h);
    const iceS = ctx.createLinearGradient(0, h, 0, 0);
    iceS.addColorStop(0, 'rgba(230,240,255,0.95)');
    iceS.addColorStop(0.07, 'rgba(230,240,255,0.4)');
    iceS.addColorStop(0.12, 'rgba(0,0,0,0)');
    ctx.fillStyle = iceS; ctx.fillRect(0, 0, w, h);
  });
}

function makeCloudTexture() {
  return makeCanvasTexture(512, (ctx, w, h) => {
    ctx.fillStyle = 'black'; ctx.fillRect(0, 0, w, h);
    for (let px = 0; px < w; px++) {
      for (let py = 0; py < h; py++) {
        const n = smoothNoise(px / w * 6, py / h * 6, 77, 5);
        const alpha = n > 0.52 ? Math.min(1, (n - 0.52) * 5) : 0;
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fillRect(px, py, 1, 1);
      }
    }
  });
}

function makeMarsTexture() {
  return makeCanvasTexture(1024, (ctx, w, h) => {
    for (let px = 0; px < w; px++) {
      for (let py = 0; py < h; py++) {
        const u = px / w, v = py / h;
        const n = smoothNoise(u * 5, v * 5, 13, 6);
        const n2 = smoothNoise(u * 12, v * 12, 99, 3);
        const base = 0.6 + n * 0.4;
        const r = Math.min(255, Math.floor(180 * base + n2 * 30));
        const g = Math.floor(80 * base + n2 * 10);
        const b = Math.floor(50 * base);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(px, py, 1, 1);
      }
    }
    // Polar caps
    const grad = ctx.createLinearGradient(0, 0, 0, h * 0.08);
    grad.addColorStop(0, 'rgba(255,245,245,0.9)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
  });
}

function makeJupiterTexture() {
  return makeCanvasTexture(1024, (ctx, w, h) => {
    const bands = [
      '#c88b3a','#e8c880','#b87030','#d4a860','#8b5020',
      '#e0b870','#c07040','#ddb060','#a06030','#e8c880',
    ];
    for (let py = 0; py < h; py++) {
      const band = bands[Math.floor((py / h) * bands.length)];
      const n = smoothNoise(py / h * 20, 0, 55, 2) * 0.15;
      for (let px = 0; px < w; px++) {
        const turbulence = smoothNoise(px / w * 8, py / h * 3, 33, 4) * 0.12;
        ctx.fillStyle = band;
        ctx.globalAlpha = 0.85 + n + turbulence;
        ctx.fillRect(px, py, 1, 1);
      }
    }
    ctx.globalAlpha = 1;
    // Great Red Spot
    ctx.save();
    ctx.translate(w * 0.3, h * 0.62);
    const grs = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.06);
    grs.addColorStop(0, 'rgba(160,50,30,0.9)');
    grs.addColorStop(0.5, 'rgba(200,80,40,0.6)');
    grs.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grs;
    ctx.scale(2, 1); ctx.beginPath(); ctx.arc(0, 0, w * 0.06, 0, Math.PI * 2);
    ctx.fill(); ctx.restore();
  });
}

function makeSaturnTexture() {
  return makeCanvasTexture(1024, (ctx, w, h) => {
    for (let py = 0; py < h; py++) {
      const t = py / h;
      const n = smoothNoise(t * 15, 0, 66, 3) * 0.1;
      const r = Math.floor(220 + n * 30);
      const g = Math.floor(195 + n * 20);
      const b = Math.floor(130 + n * 10);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(0, py, w, 1);
    }
  });
}

function makeIceGiantTexture(baseColor: [number, number, number]) {
  return makeCanvasTexture(512, (ctx, w, h) => {
    for (let px = 0; px < w; px++) {
      for (let py = 0; py < h; py++) {
        const n = smoothNoise(px / w * 4, py / h * 4, baseColor[0], 4);
        const [br, bg, bb] = baseColor;
        const v = 0.7 + n * 0.3;
        ctx.fillStyle = `rgb(${Math.floor(br * v)},${Math.floor(bg * v)},${Math.floor(bb * v)})`;
        ctx.fillRect(px, py, 1, 1);
      }
    }
  });
}

function makeMoonTexture() {
  return makeCanvasTexture(512, (ctx, w, h) => {
    for (let px = 0; px < w; px++) {
      for (let py = 0; py < h; py++) {
        const n = smoothNoise(px / w * 6, py / h * 6, 11, 5);
        const v = Math.floor(140 + n * 70);
        ctx.fillStyle = `rgb(${v},${v - 5},${v - 10})`;
        ctx.fillRect(px, py, 1, 1);
      }
    }
    // Craters
    for (let i = 0; i < 20; i++) {
      const cx = Math.random() * w, cy = Math.random() * h;
      const r = 5 + Math.random() * 25;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, 'rgba(80,80,80,0.5)');
      g.addColorStop(0.7, 'rgba(100,100,100,0.2)');
      g.addColorStop(1, 'rgba(180,180,180,0.3)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    }
  });
}

function makeSunTexture() {
  return makeCanvasTexture(512, (ctx, w, h) => {
    for (let px = 0; px < w; px++) {
      for (let py = 0; py < h; py++) {
        const n = smoothNoise(px / w * 8, py / h * 8, 99, 5);
        const n2 = smoothNoise(px / w * 20, py / h * 20, 33, 3);
        const v = 0.6 + n * 0.3 + n2 * 0.1;
        const r = Math.min(255, Math.floor(255 * v));
        const g = Math.floor(180 * v * 0.8);
        const b = 0;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(px, py, 1, 1);
      }
    }
  });
}

// ── Atmosphere glow ───────────────────────────────────────────────────────────
function Atmosphere({ size, color, opacity = 0.2 }: { size: number; color: string; opacity?: number }) {
  return (
    <mesh>
      <sphereGeometry args={[size * 1.07, 64, 64]} />
      <meshStandardMaterial color={color} transparent opacity={opacity}
        side={THREE.BackSide} depthWrite={false} />
    </mesh>
  );
}

// ── Earth ─────────────────────────────────────────────────────────────────────
function Earth() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const cloudRef = useRef<THREE.Mesh>(null!);
  const earthTex = useMemo(() => makeEarthTexture(), []);
  const cloudTex = useMemo(() => makeCloudTexture(), []);

  useFrame(({ clock }) => {
    if (meshRef.current) meshRef.current.rotation.y = clock.getElapsedTime() * 0.1;
    if (cloudRef.current) cloudRef.current.rotation.y = clock.getElapsedTime() * 0.13;
  });
  return (
    <group>
      <mesh ref={meshRef} castShadow>
        <sphereGeometry args={[2, 128, 128]} />
        <meshPhongMaterial map={earthTex} specular={new THREE.Color(0x334466)} shininess={20} />
      </mesh>
      <mesh ref={cloudRef}>
        <sphereGeometry args={[2.04, 64, 64]} />
        <meshStandardMaterial map={cloudTex} transparent opacity={0.4} depthWrite={false}
          alphaMap={cloudTex} />
      </mesh>
      <Atmosphere size={2} color="#4488ff" opacity={0.18} />
      <Billboard follow position={[0, 3.2, 0]}>
        <Text fontSize={0.3} color="#4fc3f7" anchorX="center">🌍 Earth</Text>
      </Billboard>
    </group>
  );
}

// ── Generic textured planet ───────────────────────────────────────────────────
interface TPlanetProps {
  texture: THREE.CanvasTexture; size: number; speed: number; label: string;
  atmosphere?: string; atmoOpacity?: number;
  rings?: boolean; ringColor?: string; ringInner?: number; ringOuter?: number;
  emissive?: string; emissiveIntensity?: number; emoji?: string;
}
function TPlanet({ texture, size, speed, label, atmosphere, atmoOpacity = 0.18,
  rings, ringColor = '#c8a96e', ringInner = 1.4, ringOuter = 2.5,
  emissive, emissiveIntensity = 0.05, emoji = '' }: TPlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (meshRef.current) meshRef.current.rotation.y = clock.getElapsedTime() * speed;
    if (ringRef.current) ringRef.current.rotation.z = clock.getElapsedTime() * 0.02;
  });
  return (
    <group>
      <mesh ref={meshRef} castShadow>
        <sphereGeometry args={[size, 128, 128]} />
        <meshPhongMaterial map={texture}
          emissive={emissive ? new THREE.Color(emissive) : undefined}
          emissiveIntensity={emissiveIntensity} shininess={8} />
      </mesh>
      {atmosphere && <Atmosphere size={size} color={atmosphere} opacity={atmoOpacity} />}
      {rings && (
        <mesh ref={ringRef} rotation={[Math.PI / 2.5, 0.1, 0]}>
          <ringGeometry args={[size * ringInner, size * ringOuter, 256]} />
          <meshStandardMaterial color={ringColor} side={THREE.DoubleSide}
            transparent opacity={0.78} roughness={0.95} />
        </mesh>
      )}
      <Billboard follow position={[0, size + 1.0, 0]}>
        <Text fontSize={0.28} color="#4fc3f7" anchorX="center">{emoji} {label}</Text>
      </Billboard>
    </group>
  );
}

// ── Sun ───────────────────────────────────────────────────────────────────────
function Sun() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const c1 = useRef<THREE.Mesh>(null!), c2 = useRef<THREE.Mesh>(null!);
  const tex = useMemo(() => makeSunTexture(), []);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) meshRef.current.rotation.y = t * 0.04;
    [c1, c2].forEach((r, i) => {
      if (r.current) { const s = 1 + Math.sin(t * (0.6 + i * 0.3)) * 0.03; r.current.scale.setScalar(s); }
    });
  });
  return (
    <group>
      <mesh ref={meshRef}><sphereGeometry args={[3.5, 128, 128]} />
        <meshStandardMaterial map={tex} emissive="#ff6600" emissiveIntensity={0.9} roughness={0.5} />
      </mesh>
      <mesh ref={c1}><sphereGeometry args={[3.85, 32, 32]} />
        <meshBasicMaterial color="#ff8800" transparent opacity={0.12} side={THREE.BackSide} />
      </mesh>
      <mesh ref={c2}><sphereGeometry args={[4.6, 32, 32]} />
        <meshBasicMaterial color="#ff5500" transparent opacity={0.05} side={THREE.BackSide} />
      </mesh>
      <pointLight color="#fff5d0" intensity={5} distance={100} decay={1.2} />
      <Billboard follow position={[0, 5.2, 0]}>
        <Text fontSize={0.38} color="#ffcc00" anchorX="center">☀ Sun</Text>
      </Billboard>
    </group>
  );
}

// ── Black Hole ────────────────────────────────────────────────────────────────
function BlackHole() {
  const d1 = useRef<THREE.Mesh>(null!), d2 = useRef<THREE.Mesh>(null!);
  const glow = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (d1.current) d1.current.rotation.z = t * 0.55;
    if (d2.current) d2.current.rotation.z = -t * 0.22;
    if (glow.current) { const s = 1 + Math.sin(t * 1.8) * 0.05; glow.current.scale.setScalar(s); }
  });
  return (
    <group>
      <mesh><sphereGeometry args={[1.6, 64, 64]} /><meshBasicMaterial color="#000000" /></mesh>
      <mesh ref={glow}><sphereGeometry args={[1.78, 64, 64]} />
        <meshBasicMaterial color="#ff5500" transparent opacity={0.22} side={THREE.BackSide} />
      </mesh>
      <mesh ref={d1} rotation={[Math.PI / 10, 0, 0]}>
        <ringGeometry args={[1.85, 4.2, 256]} />
        <meshStandardMaterial color="#ff3300" emissive="#ff2200" emissiveIntensity={2.5}
          side={THREE.DoubleSide} transparent opacity={0.95} />
      </mesh>
      <mesh ref={d2} rotation={[Math.PI / 10, 0.3, 0]}>
        <ringGeometry args={[4.2, 8.0, 256]} />
        <meshStandardMaterial color="#ff8800" emissive="#ff6600" emissiveIntensity={0.9}
          side={THREE.DoubleSide} transparent opacity={0.55} />
      </mesh>
      <mesh rotation={[Math.PI / 10, 0, 0]}>
        <ringGeometry args={[8.0, 11, 128]} />
        <meshStandardMaterial color="#cc3300" side={THREE.DoubleSide} transparent opacity={0.12} />
      </mesh>
      <pointLight color="#ff4400" intensity={4} distance={35} decay={1.8} />
      <Billboard follow position={[0, 3.8, 0]}>
        <Text fontSize={0.32} color="#ff8c00" anchorX="center">⚫ Black Hole</Text>
      </Billboard>
    </group>
  );
}

// ── Nebula ────────────────────────────────────────────────────────────────────
function Nebula() {
  const ref = useRef<THREE.Points>(null!);
  const { positions, colors } = useMemo(() => {
    const count = 10000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [[1,.2,.5],[.2,.5,1],[.9,.2,1],[.1,.9,.7],[1,.7,.1],[.4,.8,1]];
    for (let i = 0; i < count; i++) {
      const r = Math.pow(Math.random(), 0.35) * 11;
      const t = Math.random() * Math.PI * 2, p = Math.random() * Math.PI;
      positions[i*3] = r*Math.sin(p)*Math.cos(t);
      positions[i*3+1] = r*Math.sin(p)*Math.sin(t)*0.38;
      positions[i*3+2] = r*Math.cos(p);
      const c = palette[Math.floor(Math.random()*palette.length)];
      colors[i*3]=c[0]; colors[i*3+1]=c[1]; colors[i*3+2]=c[2];
    }
    return { positions, colors };
  }, []);
  useFrame(({ clock }) => { if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.018; });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.065} vertexColors transparent opacity={0.9} sizeAttenuation />
    </points>
  );
}

// ── Galaxy ────────────────────────────────────────────────────────────────────
function Galaxy() {
  const ref = useRef<THREE.Group>(null!);
  const { positions, colors } = useMemo(() => {
    const count = 15000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const arm = Math.floor(Math.random() * 4);
      const r = 0.2 + Math.random() * 10;
      const angle = (arm / 4) * Math.PI * 2 + r * 1.6;
      const spread = Math.max(0.04, (1 - r / 10)) * 0.55;
      positions[i*3] = r*Math.cos(angle)+(Math.random()-.5)*spread;
      positions[i*3+1] = (Math.random()-.5)*0.22;
      positions[i*3+2] = r*Math.sin(angle)+(Math.random()-.5)*spread;
      const t = r / 10;
      colors[i*3]=0.5+t*.5; colors[i*3+1]=0.3+t*.4; colors[i*3+2]=0.9-t*.3;
    }
    return { positions, colors };
  }, []);
  useFrame(({ clock }) => { if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.035; });
  return (
    <group ref={ref}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.042} vertexColors transparent opacity={0.95} sizeAttenuation />
      </points>
      <mesh><sphereGeometry args={[0.55, 32, 32]} />
        <meshBasicMaterial color="#ffe8a0" transparent opacity={0.95} />
      </mesh>
      <mesh><sphereGeometry args={[1.4, 32, 32]} />
        <meshBasicMaterial color="#ffcc60" transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>
      <pointLight color="#ffe8a0" intensity={2.5} distance={22} />
    </group>
  );
}

// ── Supernova explosion ───────────────────────────────────────────────────────
function Supernova() {
  const ref = useRef<THREE.Points>(null!);
  const coreRef = useRef<THREE.Mesh>(null!);
  const { positions, colors, speeds } = useMemo(() => {
    const count = 12000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const palette = [[1,.3,.05],[1,.6,.1],[1,.9,.4],[.8,.2,1],[.4,.6,1]];
    for (let i = 0; i < count; i++) {
      const r = 0.1 + Math.random() * 0.5;
      const t = Math.random()*Math.PI*2, p = Math.random()*Math.PI;
      positions[i*3]=r*Math.sin(p)*Math.cos(t);
      positions[i*3+1]=r*Math.sin(p)*Math.sin(t);
      positions[i*3+2]=r*Math.cos(p);
      speeds[i] = 0.4 + Math.random() * 1.2;
      const c = palette[Math.floor(Math.random()*palette.length)];
      colors[i*3]=c[0]; colors[i*3+1]=c[1]; colors[i*3+2]=c[2];
    }
    return { positions, colors, speeds };
  }, []);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const geo = ref.current?.geometry;
    if (!geo) return;
    const pos = geo.attributes.position.array as Float32Array;
    for (let i = 0; i < pos.length / 3; i++) {
      const phase = (t * speeds[i]) % 8;
      const r = phase < 4 ? phase * 1.5 : (8 - phase) * 1.5;
      const ox = pos[i*3], oy = pos[i*3+1], oz = pos[i*3+2];
      const len = Math.sqrt(ox*ox+oy*oy+oz*oz) || 1;
      pos[i*3] = (ox/len)*r; pos[i*3+1] = (oy/len)*r; pos[i*3+2] = (oz/len)*r;
    }
    geo.attributes.position.needsUpdate = true;
    if (coreRef.current) { const s = 0.4+Math.sin(t*3)*0.15; coreRef.current.scale.setScalar(s); }
  });
  return (
    <group>
      <points ref={ref}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.08} vertexColors transparent opacity={0.9} sizeAttenuation />
      </points>
      <mesh ref={coreRef}><sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh><sphereGeometry args={[0.9, 32, 32]} />
        <meshBasicMaterial color="#ffcc44" transparent opacity={0.15} side={THREE.BackSide} />
      </mesh>
      <pointLight color="#ff8800" intensity={5} distance={40} decay={1.5} />
      <Billboard follow position={[0, 4, 0]}>
        <Text fontSize={0.32} color="#ff8800" anchorX="center">💥 Supernova</Text>
      </Billboard>
    </group>
  );
}

// ── Pulsar / Neutron Star ─────────────────────────────────────────────────────
function Pulsar() {
  const starRef = useRef<THREE.Mesh>(null!);
  const jet1Ref = useRef<THREE.Mesh>(null!);
  const jet2Ref = useRef<THREE.Mesh>(null!);
  const diskRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (starRef.current) starRef.current.rotation.y = t * 8;
    if (diskRef.current) diskRef.current.rotation.z = t * 0.3;
    const pulse = Math.abs(Math.sin(t * 6));
    if (jet1Ref.current) jet1Ref.current.scale.y = 0.5 + pulse * 2.5;
    if (jet2Ref.current) jet2Ref.current.scale.y = 0.5 + pulse * 2.5;
    const opacity = 0.3 + pulse * 0.6;
    if (jet1Ref.current) (jet1Ref.current.material as THREE.MeshBasicMaterial).opacity = opacity;
    if (jet2Ref.current) (jet2Ref.current.material as THREE.MeshBasicMaterial).opacity = opacity;
  });
  return (
    <group>
      <mesh ref={starRef}><sphereGeometry args={[0.8, 64, 64]} />
        <meshStandardMaterial color="#88ccff" emissive="#4499ff" emissiveIntensity={1.5} />
      </mesh>
      <mesh><sphereGeometry args={[1.0, 32, 32]} />
        <meshBasicMaterial color="#4488ff" transparent opacity={0.12} side={THREE.BackSide} />
      </mesh>
      {/* Magnetic jets */}
      <mesh ref={jet1Ref} position={[0, 3, 0]}>
        <cylinderGeometry args={[0.08, 0.3, 6, 16]} />
        <meshBasicMaterial color="#00ccff" transparent opacity={0.7} />
      </mesh>
      <mesh ref={jet2Ref} position={[0, -3, 0]}>
        <cylinderGeometry args={[0.3, 0.08, 6, 16]} />
        <meshBasicMaterial color="#00ccff" transparent opacity={0.7} />
      </mesh>
      {/* Accretion disk */}
      <mesh ref={diskRef} rotation={[Math.PI/2, 0, 0]}>
        <ringGeometry args={[1.2, 3.5, 128]} />
        <meshStandardMaterial color="#4499ff" emissive="#2266cc" emissiveIntensity={0.8}
          side={THREE.DoubleSide} transparent opacity={0.65} />
      </mesh>
      <pointLight color="#4499ff" intensity={3} distance={25} />
      <Billboard follow position={[0, 3.8, 0]}>
        <Text fontSize={0.3} color="#88ccff" anchorX="center">⭐ Pulsar</Text>
      </Billboard>
    </group>
  );
}

// ── Comet with tail ───────────────────────────────────────────────────────────
function Comet() {
  const groupRef = useRef<THREE.Group>(null!);
  const tailRef = useRef<THREE.Points>(null!);
  const { positions, colors } = useMemo(() => {
    const count = 5000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const t = Math.random();
      const spread = t * 2.5;
      positions[i*3] = -t * 9 + (Math.random()-0.5) * spread;
      positions[i*3+1] = (Math.random()-0.5) * spread * 0.5;
      positions[i*3+2] = (Math.random()-0.5) * spread;
      colors[i*3] = 0.6+t*0.4; colors[i*3+1] = 0.7+t*0.3; colors[i*3+2] = 1;
    }
    return { positions, colors };
  }, []);
  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime() * 0.3;
      groupRef.current.rotation.y = t;
      groupRef.current.rotation.z = Math.sin(t * 0.5) * 0.3;
    }
  });
  return (
    <group ref={groupRef}>
      {/* Nucleus */}
      <mesh><sphereGeometry args={[0.7, 32, 32]} />
        <meshStandardMaterial color="#c8b8a0" roughness={0.95} metalness={0.05} />
      </mesh>
      {/* Coma glow */}
      <mesh><sphereGeometry args={[1.2, 32, 32]} />
        <meshBasicMaterial color="#aaddff" transparent opacity={0.12} side={THREE.BackSide} />
      </mesh>
      {/* Tail particles */}
      <points ref={tailRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.055} vertexColors transparent opacity={0.75} sizeAttenuation />
      </points>
      <Billboard follow position={[0, 2, 0]}>
        <Text fontSize={0.3} color="#aaddff" anchorX="center">☄ Comet</Text>
      </Billboard>
    </group>
  );
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
function Asteroid() {
  const ref = useRef<THREE.Mesh>(null!);
  const tex = useMemo(() => makeMoonTexture(), []);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ref.current) { ref.current.rotation.x = t * 0.2; ref.current.rotation.y = t * 0.35; }
  });
  // Irregular shape via random vertex displacement
  const geo = useMemo(() => {
    const g = new THREE.SphereGeometry(2, 32, 32);
    const pos = g.attributes.position.array as Float32Array;
    for (let i = 0; i < pos.length; i += 3) {
      const noise = 0.75 + smoothNoise(pos[i]*0.5, pos[i+1]*0.5, 55, 4) * 0.5;
      pos[i] *= noise; pos[i+1] *= noise; pos[i+2] *= noise;
    }
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <group>
      <mesh ref={ref} geometry={geo} castShadow>
        <meshPhongMaterial map={tex} shininess={3} />
      </mesh>
      <Billboard follow position={[0, 3.5, 0]}>
        <Text fontSize={0.3} color="#aaaaaa" anchorX="center">🪨 Asteroid</Text>
      </Billboard>
    </group>
  );
}

// ── Generic Star (non-sun) ────────────────────────────────────────────────────
function Star({ color = '#ffffff', emissive = '#ffcc44', label = 'Star' }: { color?: string; emissive?: string; label?: string }) {
  const ref = useRef<THREE.Mesh>(null!);
  const c1 = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ref.current) ref.current.rotation.y = t * 0.06;
    if (c1.current) { const s = 1+Math.sin(t*1.2)*0.04; c1.current.scale.setScalar(s); }
  });
  return (
    <group>
      <mesh ref={ref}><sphereGeometry args={[2.5, 64, 64]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.8} roughness={0.5} />
      </mesh>
      <mesh ref={c1}><sphereGeometry args={[2.85, 32, 32]} />
        <meshBasicMaterial color={emissive} transparent opacity={0.1} side={THREE.BackSide} />
      </mesh>
      <mesh><sphereGeometry args={[3.6, 32, 32]} />
        <meshBasicMaterial color={emissive} transparent opacity={0.04} side={THREE.BackSide} />
      </mesh>
      <pointLight color={color} intensity={4} distance={80} decay={1.2} />
      <Billboard follow position={[0, 4, 0]}>
        <Text fontSize={0.32} color="#ffee88" anchorX="center">⭐ {label}</Text>
      </Billboard>
    </group>
  );
}

// ── Scene switcher ─────────────────────────────────────────────────────────────
function SceneContent({ activeObject }: { activeObject: string }) {
  const key = activeObject?.toLowerCase().replace(/\s+/g, '_') || 'earth';
  const marsTex   = useMemo(() => makeMarsTexture(), []);
  const jupTex    = useMemo(() => makeJupiterTexture(), []);
  const satTex    = useMemo(() => makeSaturnTexture(), []);
  const uranusTex = useMemo(() => makeIceGiantTexture([79, 208, 231]), []);
  const nepTex    = useMemo(() => makeIceGiantTexture([63, 84, 186]), []);
  const moonTex   = useMemo(() => makeMoonTexture(), []);
  const mercTex   = useMemo(() => makeMoonTexture(), []);
  const venusTex  = useMemo(() => makeCanvasTexture(512, (ctx,w,h) => {
    for (let x=0;x<w;x++) for(let y=0;y<h;y++) {
      const n = smoothNoise(x/w*5,y/h*5,77,5);
      const v = 0.65+n*0.35;
      ctx.fillStyle=`rgb(${Math.floor(220*v)},${Math.floor(180*v)},${Math.floor(80*v)})`;
      ctx.fillRect(x,y,1,1);
    }
  }), []);

  if (key.includes('black_hole') || key==='black hole') return <BlackHole />;
  if (key.includes('supernova')) return <Supernova />;
  if (key.includes('pulsar') || key.includes('neutron')) return <Pulsar />;
  if (key.includes('nebula')) return <Nebula />;
  if (key.includes('galaxy')||key.includes('milky')||key.includes('andromeda')) return <Galaxy />;
  if (key.includes('comet')) return <Comet />;
  if (key.includes('asteroid')) return <Asteroid />;
  if (key==='sun') return <Sun />;
  if (key==='earth') return <Earth />;
  if (key==='mars') return <TPlanet texture={marsTex} size={1.5} speed={0.14} label="Mars" emoji="♂" atmosphere="#cc4400" atmoOpacity={0.12} />;
  if (key==='jupiter') return <TPlanet texture={jupTex} size={3.0} speed={0.22} label="Jupiter" emoji="♃" atmosphere="#c8a060" atmoOpacity={0.1} />;
  if (key==='saturn'||key.includes('ring')) return <TPlanet texture={satTex} size={2.4} speed={0.18} label="Saturn" emoji="♄" rings ringColor="#d4b880" ringInner={1.38} ringOuter={2.55} atmosphere="#e4d080" atmoOpacity={0.12} />;
  if (key==='uranus') return <TPlanet texture={uranusTex} size={2.0} speed={0.1} label="Uranus" emoji="⛢" rings ringColor="#a0e8f8" ringInner={1.5} ringOuter={2.2} atmosphere="#4fd0e7" atmoOpacity={0.2} />;
  if (key==='neptune') return <TPlanet texture={nepTex} size={1.9} speed={0.12} label="Neptune" emoji="♆" atmosphere="#4b70dd" atmoOpacity={0.22} />;
  if (key==='moon'||key==='europa'||key==='ganymede'||key==='titan'||key==='io') return <TPlanet texture={moonTex} size={1.2} speed={0.06} label={key.charAt(0).toUpperCase()+key.slice(1)} emoji="🌕" />;
  if (key==='mercury') return <TPlanet texture={mercTex} size={1.0} speed={0.2} label="Mercury" emoji="☿" />;
  if (key==='venus') return <TPlanet texture={venusTex} size={1.9} speed={0.08} label="Venus" emoji="♀" atmosphere="#e8a020" atmoOpacity={0.25} emissive="#8b6914" emissiveIntensity={0.06} />;
  if (key==='pluto'||key.includes('dwarf')) return <TPlanet texture={moonTex} size={0.8} speed={0.05} label="Pluto" emoji="🔵" />;
  if (key.includes('quasar')) return <Star color="#aa88ff" emissive="#7733ff" label="Quasar" />;
  if (key.includes('star')||key.includes('exoplanet')||key.includes('solar_system')) return <Star />;
  return <Earth />;
}

// ── Auto camera ────────────────────────────────────────────────────────────────
function AutoCamera() {
  const { camera } = useThree();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    camera.position.x = Math.sin(t * 0.09) * 9;
    camera.position.z = Math.cos(t * 0.09) * 9;
    camera.position.y = 2.5 + Math.sin(t * 0.055) * 2;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

// ── Info labels ────────────────────────────────────────────────────────────────
const INFO: Record<string, string> = {
  earth:'Diameter: 12,742 km · 1 Moon · Only known life in the universe',
  mars:'Diameter: 6,779 km · 2 moons · Iron oxide red surface',
  jupiter:'Largest planet · 95 moons · Great Red Spot storm for 350+ years',
  saturn:'Lowest density of all planets · Ring system spans 282,000 km',
  uranus:'Ice giant · Rotates on its side · 27 known moons',
  neptune:'Strongest winds (2,100 km/h) · 2.8 billion km from Sun',
  moon:'Distance: 384,400 km · 27.3-day orbit · Tidal locking',
  sun:'Core temp: 15,000,000°C · 1.989×10³⁰ kg mass',
  black_hole:'Gravity so strong even light cannot escape · Singularity at center',
  nebula:'Stellar nurseries — birthplace of new stars',
  galaxy:'Contains 100–400 billion stars · 100,000 light years across',
  venus:'Hottest planet (465°C) · Thick CO₂ atmosphere · Retrograde rotation',
  mercury:'Closest to Sun · Extreme temperature swings · No atmosphere',
};

// ── Main export ────────────────────────────────────────────────────────────────
export default function SpaceCanvas({ activeObject }: { activeObject: string }) {
  const [userControl, setUserControl] = useState(false);
  const key = activeObject?.toLowerCase().replace(/\s+/g, '_') || 'earth';
  const info = INFO[key] || INFO[activeObject?.toLowerCase()] || 'Interactive 3D space simulation';

  return (
    <div className="relative w-full h-full select-none" style={{ background: '#020209' }}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 px-4 pt-4 pb-2"
        style={{ background: 'linear-gradient(to bottom,rgba(2,2,9,.95),transparent)' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cosmic-blue animate-pulse" />
          <span className="text-xs font-medium text-cosmic-blue uppercase tracking-widest">3D Simulation</span>
        </div>
        <p className="text-[10px] text-gray-500 mt-0.5 truncate">{info}</p>
      </div>

      <Canvas
        camera={{ position: [0, 2.5, 9], fov: 55 }}
        gl={{ antialias: true, alpha: false,
          toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
        shadows
        style={{ background: '#020209' }}
        onPointerDown={() => setUserControl(true)}
        onPointerUp={() => setTimeout(() => setUserControl(false), 4000)}
      >
        <Stars radius={160} depth={90} count={9000} factor={5} saturation={0.25} fade speed={0.25} />
        <ambientLight intensity={0.12} />
        <directionalLight position={[10,8,6]} intensity={2.0} color="#fff8e8" castShadow
          shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
        <pointLight position={[-8,-5,-8]} intensity={0.25} color="#4fc3f7" />

        <Suspense fallback={null}>
          <SceneContent activeObject={activeObject} />
        </Suspense>

        {userControl
          ? <OrbitControls enablePan={false} minDistance={4} maxDistance={32}
              enableDamping dampingFactor={0.07} />
          : <AutoCamera />}
      </Canvas>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pt-2 pb-4"
        style={{ background: 'linear-gradient(to top,rgba(2,2,9,.95),transparent)' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Currently viewing</p>
            <p className="text-sm font-semibold text-white capitalize">🌌 {activeObject || 'Space'}</p>
          </div>
          <div className="text-[10px] text-gray-600 text-right">
            <div>Drag to rotate</div><div>Scroll to zoom</div>
          </div>
        </div>
      </div>
    </div>
  );
}
