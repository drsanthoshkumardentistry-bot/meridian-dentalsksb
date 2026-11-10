Optional automated tests (20 checks: sign-in gate, email verification, idle sign-out, data entry).
1. Install once:  npm i -D vitest jsdom @testing-library/react @testing-library/dom @vitejs/plugin-react
2. Copy the three .test.jsx files into the project root (next to package.json).
3. Create vitest.config.js in the project root:
     import { defineConfig } from "vitest/config";
     import react from "@vitejs/plugin-react";
     export default defineConfig({ plugins: [react()], test: { environment: "jsdom", include: ["app.*.test.jsx"] } });
4. Run:  npx vitest run
