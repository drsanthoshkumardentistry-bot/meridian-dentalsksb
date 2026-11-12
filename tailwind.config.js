/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        clinic: {
          // "Clinical Trust & Clarity" – primary Deep Medical Blue (#1D4ED8 at 600)
          50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa',
          500: '#2563eb', 600: '#1d4ed8', 700: '#1e40af', 800: '#1e3a8a', 900: '#1e3a8a', 950: '#172554',
        },
        // Secondary accent = Tailwind sky (sky-500 #0EA5E9): badges, progress, highlight pills
      },
      boxShadow: { card: '0 1px 2px rgba(15,23,42,.04), 0 4px 16px -6px rgba(15,23,42,.08)' },
      keyframes: { fadeIn: { from: { opacity: 0, transform: 'translateY(4px)' }, to: { opacity: 1, transform: 'none' } } },
      animation: { 'fade-in': 'fadeIn .25s ease-out' },
    },
  },
  plugins: [],
}
