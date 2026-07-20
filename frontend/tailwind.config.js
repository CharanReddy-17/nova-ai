/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        space: {
          950: '#020209',
          900: '#06060f',
          800: '#0a0a1a',
          700: '#0f0f28',
        },
        cosmic: {
          blue:   '#4fc3f7',
          purple: '#7b1fa2',
          violet: '#9c27b0',
          pink:   '#e91e63',
          cyan:   '#00d4ff',
          gold:   '#ffd700',
          green:  '#00ff88',
          amber:  '#ffaa00',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'cosmic-gradient': 'linear-gradient(135deg, #020209 0%, #050514 50%, #0a0a23 100%)',
        'neon-blue': 'linear-gradient(90deg, #4fc3f7, #00e5ff)',
        'neon-purple': 'linear-gradient(90deg, #7b1fa2, #e91e63)',
        'card-glass': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      },
      boxShadow: {
        'neon-blue': '0 0 20px rgba(79,195,247,0.4), 0 0 40px rgba(79,195,247,0.2)',
        'neon-purple': '0 0 20px rgba(123,31,162,0.4)',
        'glass': '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin 20s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(79,195,247,0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(79,195,247,0.8), 0 0 40px rgba(79,195,247,0.4)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
