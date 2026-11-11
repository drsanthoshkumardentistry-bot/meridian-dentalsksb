/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        clinic: {
          50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa',
          500: '#2f7fe0', 600: '#1d64c8', 700: '#1a4fa0', 800: '#1b4281', 900: '#1b3868', 950: '#0f2140',
        },
      },
      boxShadow: { card: '0 1px 2px rgba(15,23,42,.04), 0 4px 16px -6px rgba(15,23,42,.08)' },
      keyframes: { fadeIn: { from: { opacity: 0, transform: 'translateY(4px)' }, to: { opacity: 1, transform: 'none' } } },
      animation: { 'fade-in': 'fadeIn .25s ease-out' },
    },
  },
  plugins: [],
}
