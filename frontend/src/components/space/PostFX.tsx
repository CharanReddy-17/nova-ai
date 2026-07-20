'use client';
import { Bloom, EffectComposer, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Vector2 } from 'three';

interface PostFXProps {
  bloomIntensity?: number;
  quality?: 'low' | 'medium' | 'high';
}

export default function PostFX({ bloomIntensity = 1.2, quality = 'medium' }: PostFXProps) {
  const mipmapBlur = quality !== 'low';
  const levels     = quality === 'high' ? 9 : quality === 'medium' ? 7 : 5;
  const luminance  = quality === 'low' ? 0.85 : 0.72;

  return (
    <EffectComposer multisampling={quality === 'high' ? 8 : quality === 'medium' ? 4 : 0}>
      {/* Bloom — makes stars, suns, accretion disks glow */}
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={luminance}
        luminanceSmoothing={0.9}
        mipmapBlur={mipmapBlur}
        levels={levels}
      />

      {/* Very subtle chromatic aberration — lens-like feel */}
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={new Vector2(0.0008, 0.0008)}
        radialModulation={false}
        modulationOffset={0}
      />

      {/* Dark vignette edges — cinematic */}
      <Vignette
        offset={0.35}
        darkness={0.6}
        eskil={false}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}
