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
        card: "0 1px 2px rgba(15,23,42,.05), 0 6px 18px -10px rgba(15,23,42,.18)",
        lift: "0 8px 24px -8px rgba(15,23,42,.12)"
      },
      colors: {
        // Navy brand palette: replaces the old bright and pale blues everywhere (classes named blue, brand, sky and aqua).
        brand: { 50: "#f1f4f9", 100: "#e3e9f2", 500: "#1e2b4a", 600: "#0f172a", 700: "#0b1224", 900: "#080d1a" },
        aqua: { 50: "#f3f6fb", 100: "#e6ecf5", 300: "#9fb0cc", 400: "#6b80a3", 500: "#33446a", 600: "#1e2b4a", 700: "#17233f" },
        blue: { 50: "#f1f4f9", 100: "#e3e9f2", 200: "#c8d3e4", 300: "#9fb0cc", 400: "#6b80a3", 500: "#1e2b4a", 600: "#17233f", 700: "#0f172a", 800: "#0b1224", 900: "#080d1a", 950: "#050810" },
        gold: { 50: "#fff8e6", 500: "#f5a524", 700: "#9a5200" },
        sky: { 50: "#f3f6fb", 100: "#e6ecf5", 200: "#cfd9e8", 300: "#a3b4cf", 400: "#6f84a8", 500: "#3d5078", 600: "#2a3b5e", 700: "#1e2b4a", 800: "#141f38", 900: "#0c1428" },
        ink: "#0f172a",
        enamel: "#f8fafc",
        mist: "#e9eef6",
        rule: "#dfe5ef",
        navy: { 700: "#14295c", 800: "#0f2046", 900: "#0a1733", 950: "#070f24" }
      }
    }
  },
  plugins: []
};
