// Runs the real app in a browser with a fake Firebase (signed in as a test dentist, data kept in localStorage).
// Start: npx vite --config harness.vite.config.mjs   then: node e2e/signed-in/screens.cjs (also patients, billing, appointments, monkey)
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
const root = path.dirname(fileURLToPath(import.meta.url));
const mock = (f) => path.join(root, "e2e", "mocks", f);
export default {
  root,
  plugins: [react(), {
    // Real Firebase leaves a saved user in the browser; the landing page uses that to skip loading the app. The fake one must too.
    name: "harness-saved-session",
    transformIndexHtml: () => [{ tag: "script", injectTo: "head-prepend", children: 'try{if(!localStorage.getItem("__noauth"))localStorage.setItem("firebase:authUser:harness:[DEFAULT]","{}")}catch(e){}' }],
  }],
  resolve: { alias: [
    { find: /^firebase\/auth$/, replacement: mock("mockauth.js") },
    { find: /^firebase\/firestore$/, replacement: mock("mockfs.js") },
    { find: /^.*\/firebase(\.js)?$/, replacement: mock("mockfb.js") },
  ] },
  server: { port: 5199, fs: { strict: false } },
};
