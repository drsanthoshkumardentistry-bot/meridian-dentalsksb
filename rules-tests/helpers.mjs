import fs from "node:fs";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";

export const PROJECT = "demo-merident";

/** Starts a test environment against the emulator with the real firestore.rules. */
export const setup = () =>
  initializeTestEnvironment({
    projectId: PROJECT,
    firestore: { rules: fs.readFileSync(new URL("../firestore.rules", import.meta.url), "utf8") },
  });

/** A signed-in browser with a verified email. */
export const as = (env, uid, claims = {}) =>
  env.authenticatedContext(uid, { email: `${uid}@example.com`, email_verified: true, ...claims }).firestore();

export const anon = (env) => env.unauthenticatedContext().firestore();

/** Write fixtures with the rules switched off. */
export const seed = (env, fn) => env.withSecurityRulesDisabled((ctx) => fn(ctx.firestore()));
