import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  // Never load the developer's real .env (Firebase keys) into tests: they must run without keys.
  envDir: "./tests",
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.{js,jsx}"],
    // Only used by `npm run test:coverage`. The floor sits just under today's numbers, so coverage can only go up.
    coverage: {
      provider: "v8",
      include: ["src/**", "api/**"],
      reporter: ["text-summary", "json-summary"],
      thresholds: { lines: 88, statements: 88, functions: 68, branches: 80 },
    },
  },
});
