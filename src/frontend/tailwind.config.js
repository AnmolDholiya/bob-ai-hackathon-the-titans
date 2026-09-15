/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cyan:  { DEFAULT: '#06d6c7', 400: '#22d3ee', 500: '#06d6c7', 600: '#0891b2' },
        glass: { DEFAULT: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.12)', dark: 'rgba(0,15,40,0.55)' },
        navy:  { 900: '#020d1e', 800: '#041428', 700: '#071e38', 600: '#0a2744' },
      },
      backdropBlur: { xs: '4px', glass: '16px' },
      fontFamily: { sans: ['"Inter"', 'system-ui', 'sans-serif'] },
      keyframes: {
        'fade-in':    { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        'pulse-dot':  { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } },
        'route-draw': { '0%': { strokeDashoffset: '300' }, '100%': { strokeDashoffset: '0' } },
      },
      animation: {
        'fade-in':    'fade-in 0.35s ease both',
        'pulse-dot':  'pulse-dot 2s ease-in-out infinite',
        'route-draw': 'route-draw 2.5s ease forwards',
      },
    },
  },
  plugins: [],
}
