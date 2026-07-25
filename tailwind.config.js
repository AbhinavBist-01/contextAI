/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/app/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          dark: '#030303',
          surface: '#0a0a0c',
          card: '#121215',
          border: '#27272a',
        },
        brand: {
          white: '#ffffff',
          silver: '#e4e4e7',
          muted: '#a1a1aa',
          dim: '#71717a',
          dark: '#18181b',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 3s infinite ease-in-out',
        'beam': 'beam 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.05)' },
        },
        beam: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}
