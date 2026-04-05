/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#000000',
        surface: {
          DEFAULT: 'rgba(12, 10, 22, 0.75)',
          1: 'rgba(255, 255, 255, 0.04)',
          2: 'rgba(255, 255, 255, 0.07)',
          3: 'rgba(255, 255, 255, 0.1)',
        },
        border: 'rgba(255, 255, 255, 0.08)',
        muted: '#8B92A8',
        accent: {
          DEFAULT: '#22D3EE',
          dim: 'rgba(34, 211, 238, 0.12)',
          glow: 'rgba(34, 211, 238, 0.35)',
        },
        neon: {
          cyan: '#22D3EE',
          violet: '#A78BFA',
          fuchsia: '#E879F9',
          lime: '#A3E635',
          rose: '#FB7185',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
      },
      backgroundSize: {
        '300': '300% 300%',
        '200': '200% 100%',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        glow: 'glow-pulse 2s ease-in-out infinite alternate',
        'gradient-flow': 'gradient-flow 5s linear infinite',
        shimmer: 'shimmer 3.5s ease-in-out infinite',
        'border-spin': 'border-spin 8s linear infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%': { boxShadow: '0 0 20px rgba(167,139,250,0.15), 0 0 60px rgba(34,211,238,0.08)' },
          '100%': { boxShadow: '0 0 36px rgba(232,121,249,0.2), 0 0 90px rgba(34,211,238,0.12)' },
        },
        'gradient-flow': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        shimmer: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'border-spin': {
          to: { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}
