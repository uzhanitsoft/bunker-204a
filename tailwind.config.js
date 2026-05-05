/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bunker: {
          bg: '#1A1A1A',
          card: '#2D2D2D',
          yellow: '#FFD700',
          red: '#E63946',
          green: '#2D9B6F',
          text: '#F5F5F5',
          muted: '#888888',
        },
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        body: ['"Manrope"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      animation: {
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'typewriter': 'typewriter 0.05s steps(1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shake': 'shake 0.5s ease-in-out',
      },
      keyframes: {
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 5px #FFD700, 0 0 10px #FFD700' },
          '50%': { boxShadow: '0 0 20px #FFD700, 0 0 40px #FFD700' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px #FFD700' },
          '100%': { boxShadow: '0 0 30px #FFD700, 0 0 60px #FFD70050' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
      },
    },
  },
  plugins: [],
};
