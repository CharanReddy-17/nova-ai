'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';

const FEATURES = [
  { icon: '🤖', title: 'AI-Powered Chat', desc: 'GPT-4 powered astronomy assistant trained on NASA data and astrophysics knowledge.' },
  { icon: '🪐', title: '3D Space Simulation', desc: 'Interactive React Three Fiber scenes of all 8 planets, black holes, nebulae, and galaxies.' },
  { icon: '🛰️', title: 'NASA Integration', desc: 'Real-time NASA APOD, Image Library, Mars rover photos, and exoplanet data.' },
  { icon: '🎙️', title: 'Voice Assistant', desc: 'Jarvis-style voice input and text-to-speech responses in multiple languages.' },
  { icon: '🌐', title: 'Multi-Language', desc: 'Full support for English, Hindi, Telugu, Spanish, and more.' },
  { icon: '📷', title: 'Image Analysis', desc: 'Upload astronomy photos for AI-powered object identification and analysis.' },
];

const TECH = [
  { label: 'Frontend', value: 'Next.js 14 · React · TypeScript · Tailwind CSS' },
  { label: '3D Engine', value: 'Three.js · React Three Fiber · Drei' },
  { label: 'Animation', value: 'Framer Motion · CSS Animations' },
  { label: 'AI', value: 'OpenAI GPT-4o · Vision API' },
  { label: 'Backend', value: 'Node.js · Express · MongoDB Atlas' },
  { label: 'Storage', value: 'Cloudinary · JWT Auth · bcrypt' },
  { label: 'APIs', value: 'NASA APOD · NASA Image Library · Exoplanet Archive' },
  { label: 'Deployment', value: 'Vercel · Render · MongoDB Atlas' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-space-950 text-white overflow-y-auto">
      {/* Navigation back */}
      <nav className="sticky top-0 z-50 glass px-6 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/dashboard" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
          ← Back to Dashboard
        </Link>
        <span className="text-sm gradient-text font-bold">Cosmic Explorer AI</span>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden px-6 py-24 text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cosmic-purple opacity-5 rounded-full blur-3xl" />
          <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-cosmic-blue opacity-5 rounded-full blur-3xl" />
        </div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div className="text-7xl mb-6">🌌</div>
          <h1 className="text-5xl md:text-6xl font-black gradient-text mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Cosmic Explorer AI
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            An advanced astronomy learning platform combining{' '}
            <span className="neon-blue font-semibold">Artificial Intelligence</span>,{' '}
            <span className="neon-purple font-semibold">NASA space data</span>,{' '}
            <span className="neon-cyan font-semibold">3D visualization</span>, and{' '}
            <span className="text-cosmic-gold font-semibold">Space education</span>.
          </p>
        </motion.div>
      </div>

      {/* Mission */}
      <div className="max-w-4xl mx-auto px-6 pb-20">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-3xl p-8 mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span>🎯</span> Our Mission
          </h2>
          <p className="text-gray-300 leading-relaxed text-lg">
            Cosmic Explorer AI democratizes astronomy education by combining cutting-edge AI with
            real NASA data and stunning 3D visualizations. Whether you're a student, enthusiast, or
            professional astronomer, we bring the universe to your fingertips — in your language,
            with your voice, at any time.
          </p>
        </motion.section>

        {/* Features grid */}
        <h2 className="text-2xl font-bold text-white mb-6 text-center">✨ Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass rounded-2xl p-6 hover:bg-white/5 transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Technology */}
        <h2 className="text-2xl font-bold text-white mb-6 text-center">⚙️ Technology Stack</h2>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="glass rounded-3xl overflow-hidden mb-16"
        >
          {TECH.map((t, i) => (
            <div key={t.label}
              className="flex items-start gap-4 px-6 py-4 hover:bg-white/3 transition"
              style={{ borderBottom: i < TECH.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
            >
              <span className="text-cosmic-blue font-mono text-sm min-w-[100px]">{t.label}</span>
              <span className="text-gray-300 text-sm">{t.value}</span>
            </div>
          ))}
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {[
            { value: '30+', label: 'Space Objects' },
            { value: '8', label: 'Planets in 3D' },
            { value: '∞', label: 'Questions Answered' },
            { value: '5+', label: 'Languages' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-6 text-center"
            >
              <div className="text-4xl font-black gradient-text mb-1">{s.value}</div>
              <div className="text-xs text-gray-400 font-medium">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/dashboard">
            <button
              className="btn-primary px-10 py-4 text-base rounded-2xl"
              style={{ background: 'linear-gradient(135deg, #4fc3f7, #7b1fa2)', boxShadow: '0 0 40px rgba(79,195,247,0.3)' }}
            >
              🚀 Start Exploring the Universe
            </button>
          </Link>
          <p className="text-xs text-gray-600 mt-4">
            Powered by NASA Open APIs · OpenAI · MongoDB Atlas · Cloudinary
          </p>
        </div>
      </div>
    </div>
  );
}
