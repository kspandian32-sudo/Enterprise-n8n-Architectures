/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
        body: ['Inter', 'sans-serif'],
      },
      colors: {
        void: '#07070F',
        ink: '#0D0D1A',
        layer: {
          perception: '#1D9E75',
          core: '#7F77DD',
          memory: '#378ADD',
          execution: '#BA7517',
          extensions: '#D85A30',
        },
      },
      animation: {
        'drift-slow': 'drift 18s ease-in-out infinite alternate',
        'drift-medium': 'drift 12s ease-in-out infinite alternate-reverse',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'scan': 'scan 4s linear infinite',
        'fade-up': 'fade-up 0.8s ease-out forwards',
        'fade-up-delay-1': 'fade-up 0.8s ease-out 0.15s forwards',
        'fade-up-delay-2': 'fade-up 0.8s ease-out 0.3s forwards',
        'fade-up-delay-3': 'fade-up 0.8s ease-out 0.45s forwards',
      },
      keyframes: {
        drift: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '100%': { transform: 'translate(60px, 40px) scale(1.1)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(500%)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
