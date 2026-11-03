/** @type {import('tailwindcss').Config} */
const scale = (name) =>
  Object.fromEntries([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((s) => [s, `rgb(var(--${name}-${s}) / <alpha-value>)`]));

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Fredoka', 'system-ui', 'sans-serif'],
        cursive: ['"Dancing Script"', 'cursive'],
      },
      colors: {
        brand: scale('brand'),
        accent: scale('accent'),
        ink: '#2b2350',
      },
      boxShadow: {
        soft: '0 2px 0 rgba(43,35,80,.06), 0 8px 24px rgba(43,35,80,.08)',
        lift: '0 12px 32px rgba(43,35,80,.16)',
        chunky: '0 6px 0 rgba(0,0,0,.14)',
        'chunky-sm': '0 4px 0 rgba(0,0,0,.14)',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'none' } },
        'scale-in': { from: { opacity: 0, transform: 'scale(.9)' }, to: { opacity: 1, transform: 'none' } },
        pop: { '0%': { transform: 'scale(.5)', opacity: 0 }, '70%': { transform: 'scale(1.12)' }, '100%': { transform: 'none', opacity: 1 } },
        float: { '50%': { transform: 'translateY(-10px)' } },
        wiggle: { '0%,100%': { transform: 'rotate(0)' }, '25%': { transform: 'rotate(-8deg)' }, '75%': { transform: 'rotate(8deg)' } },
        shake: { '0%,100%': { transform: 'none' }, '20%,60%': { transform: 'translateX(-8px)' }, '40%,80%': { transform: 'translateX(8px)' } },
        'spin-slow': { to: { transform: 'rotate(360deg)' } },
        bob: { '0%,100%': { transform: 'translateY(0) rotate(-3deg)' }, '50%': { transform: 'translateY(-6px) rotate(3deg)' } },
      },
      animation: {
        'fade-in': 'fade-in .3s ease-out both',
        'scale-in': 'scale-in .25s ease-out both',
        pop: 'pop .5s cubic-bezier(.2,.8,.2,1) both',
        float: 'float 4s ease-in-out infinite',
        wiggle: 'wiggle .5s ease-in-out',
        shake: 'shake .4s ease-in-out',
        'spin-slow': 'spin-slow 18s linear infinite',
        bob: 'bob 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
