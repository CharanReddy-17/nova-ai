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
          950: '#0F0F10',
          900: '#161618',
          800: '#1C1C1F',
          700: '#242428',
        },
        cosmic: {
          cream:  '#F4F4F5',
          amber:  '#F5BE75',
          orange: '#E5A95A',
          brown:  '#0F0F10',
          gold:   '#F5BE75',
          warm:   '#F4F4F5',
          rust:   '#E5A95A',
          dark:   '#0F0F10',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'cosmic-gradient': 'linear-gradient(135deg, #2A1A0E 0%, #3d2512 50%, #4f3018 100%)',
        'neon-amber': 'linear-gradient(90deg, #F4AE52, #D4621A)',
        'neon-orange': 'linear-gradient(90deg, #D4621A, #F4AE52)',
        'card-glass': 'linear-gradient(135deg, rgba(254,243,226,0.07) 0%, rgba(254,243,226,0.03) 100%)',
      },
      boxShadow: {
        'neon-amber':  '0 0 20px rgba(244,174,82,0.4), 0 0 40px rgba(244,174,82,0.2)',
        'neon-orange': '0 0 20px rgba(212,98,26,0.4)',
        'glass': '0 8px 32px rgba(42,26,14,0.6), inset 0 1px 0 rgba(254,243,226,0.08)',
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
          '0%': { boxShadow: '0 0 5px rgba(244,174,82,0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(244,174,82,0.8), 0 0 40px rgba(244,174,82,0.4)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
