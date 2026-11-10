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
        card: "0 1px 2px rgba(15,28,51,.04), 0 1px 1px rgba(15,28,51,.03)",
        lift: "0 8px 24px -8px rgba(15,28,51,.12)"
      },
      colors: {
        brand: { 50: "#eff6ff", 100: "#dbeafe", 500: "#2563eb", 600: "#1d4ed8", 700: "#1e40af", 900: "#1e3a8a" },
        aqua: { 50: "#e8fbfd", 100: "#c6f3f8", 300: "#5fd6e4", 400: "#2cc4d6", 500: "#0fb0c4", 600: "#0b93a6", 700: "#0b7585" },
        gold: { 50: "#fff8e6", 500: "#f5a524", 700: "#b45f06" },
        sky: { 50: "#f3f8ff", 100: "#e6f1ff", 200: "#cfe3ff" },
        ink: "#0f1c33",
        enamel: "#f7f9fc",
        mist: "#eaf0fa",
        rule: "#e2e8f2"
      }
    }
  },
  plugins: []
};
