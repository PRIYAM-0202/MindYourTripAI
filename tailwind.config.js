/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#05070f',
          900: '#080b18',
          800: '#0c1124',
          700: '#121933',
          600: '#1a2347',
          500: '#25315c',
          400: '#384576',
        },
        navy: {
          900: '#0a1430',
          800: '#0f1d45',
          700: '#16285c',
          600: '#1f3578',
          500: '#2a47a0',
        },
        ai: {
          50: '#ecf3ff',
          100: '#d6e6ff',
          200: '#aecfff',
          300: '#7fb0ff',
          400: '#4f8dff',
          500: '#2b6bff',
          600: '#1a52e6',
          700: '#173fbf',
          800: '#173799',
          900: '#17347a',
        },
        glow: {
          blue: '#3b82f6',
          cyan: '#22d3ee',
          teal: '#2dd4bf',
          emerald: '#34d399',
          amber: '#fbbf24',
          rose: '#fb7185',
          red: '#f87171',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'grid-glow':
          'linear-gradient(to right, rgba(59,130,246,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(59,130,246,0.06) 1px, transparent 1px)',
        'radial-glow':
          'radial-gradient(ellipse at top, rgba(43,107,255,0.18), transparent 60%)',
        'hero-aurora':
          'radial-gradient(ellipse 80% 60% at 20% 10%, rgba(43,107,255,0.25), transparent 60%), radial-gradient(ellipse 70% 50% at 80% 20%, rgba(34,211,238,0.18), transparent 60%), radial-gradient(ellipse 60% 50% at 50% 90%, rgba(45,212,191,0.12), transparent 60%)',
      },
      boxShadow: {
        glow: '0 0 20px rgba(43,107,255,0.35)',
        'glow-lg': '0 0 40px rgba(43,107,255,0.45)',
        'glow-cyan': '0 0 24px rgba(34,211,238,0.35)',
        'glow-soft': '0 0 30px rgba(43,107,255,0.18)',
        glass: '0 8px 32px rgba(0,0,0,0.37)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 20px rgba(43,107,255,0.08)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 10s ease-in-out infinite',
        'fly': 'fly 24s linear infinite',
        'fly-reverse': 'fly-reverse 30s linear infinite',
        'drift': 'drift 40s linear infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'spin-slow': 'spin 24s linear infinite',
        'spin-reverse': 'spin-reverse 32s linear infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'fade-up': 'fade-up 0.5s ease-out both',
        'fade-in': 'fade-in 0.4s ease-out both',
        'scale-in': 'scale-in 0.3s cubic-bezier(0.16,1,0.3,1) both',
        'slide-in-right': 'slide-in-right 0.35s cubic-bezier(0.16,1,0.3,1) both',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.16,1,0.3,1) both',
        'bounce-in': 'bounce-in 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'gradient-pan': 'gradient-pan 8s ease infinite',
        'typing-dot': 'typing-dot 1.4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0) translateX(0)' },
          '50%': { transform: 'translateY(-18px) translateX(8px)' },
        },
        fly: {
          '0%': { transform: 'translateX(-10vw) translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateX(50vw) translateY(-30px) rotate(2deg)' },
          '100%': { transform: 'translateX(110vw) translateY(0) rotate(0deg)' },
        },
        'fly-reverse': {
          '0%': { transform: 'translateX(110vw) translateY(0) rotate(180deg)' },
          '50%': { transform: 'translateX(50vw) translateY(20px) rotate(182deg)' },
          '100%': { transform: 'translateX(-10vw) translateY(0) rotate(180deg)' },
        },
        drift: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'pulse-glow': {
          '0%,100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.06)' },
        },
        'spin-reverse': {
          '0%': { transform: 'rotate(360deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'bounce-in': {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '60%': { opacity: '1', transform: 'scale(1.04)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'gradient-pan': {
          '0%,100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'typing-dot': {
          '0%,60%,100%': { transform: 'translateY(0)', opacity: '0.4' },
          '30%': { transform: 'translateY(-6px)', opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
