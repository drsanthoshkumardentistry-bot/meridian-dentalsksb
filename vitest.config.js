import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  // Never load the developer's real .env (Firebase keys) into tests: they must run without keys.
  envDir: "./tests",
  test: { environment: "jsdom", include: ["tests/**/*.test.{js,jsx}"] },
});
