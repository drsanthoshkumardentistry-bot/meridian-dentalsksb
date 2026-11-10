import { defineConfig } from "vitest/config";

// Security-rule tests. They need the Firestore emulator, so they are not part of `npm test`.
// Run with: npm run test:rules
export default defineConfig({
  test: {
    environment: "node",
    include: ["rules-tests/**/*.rules.mjs"],
    testTimeout: 30000,
    hookTimeout: 60000,
    fileParallelism: false,
  },
});
