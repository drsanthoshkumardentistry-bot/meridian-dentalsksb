/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bricolage Grotesque"', "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["Figtree", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"]
      },
      colors: {
        brand: { 50: "#eff6ff", 100: "#dbeafe", 500: "#2563eb", 600: "#1d4ed8", 700: "#1e40af", 900: "#1e3a8a" },
        aqua: { 50: "#e8fbfd", 100: "#c6f3f8", 300: "#5fd6e4", 400: "#2cc4d6", 500: "#0fb0c4", 600: "#0b93a6", 700: "#0b7585" },
        gold: { 50: "#fff8e6", 500: "#f5a524", 700: "#b45f06" },
        sky: { 50: "#f3f8ff", 100: "#e6f1ff", 200: "#cfe3ff" },
        ink: "#0b1b3a",
        enamel: "#f6f9ff",
        mist: "#e6eefc",
        rule: "#d5e0f5"
      }
    }
  },
  plugins: []
};
