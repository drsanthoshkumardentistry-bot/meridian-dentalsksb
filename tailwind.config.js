/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bricolage Grotesque"', "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["Figtree", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"]
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,.04), 0 1px 1px rgba(15,23,42,.03)",
        lift: "0 8px 24px -8px rgba(15,23,42,.12)"
      },
      colors: {
        brand: { 50: "#eff6ff", 100: "#dbeafe", 500: "#2563eb", 600: "#1d4ed8", 700: "#1e40af", 900: "#1e3a8a" },
        aqua: { 50: "#f0f9ff", 100: "#e0f2fe", 300: "#7dd3fc", 400: "#38bdf8", 500: "#0ea5e9", 600: "#0284c7", 700: "#0369a1" },
        gold: { 50: "#fff8e6", 500: "#f5a524", 700: "#9a5200" },
        sky: { 50: "#f3f8ff", 100: "#e6f1ff", 200: "#cfe3ff" },
        ink: "#0f172a",
        enamel: "#f8fafc",
        mist: "#eaf0fa",
        rule: "#e2e8f0"
      }
    }
  },
  plugins: []
};
