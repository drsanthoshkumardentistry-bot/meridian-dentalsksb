export default {
  configFile: false,
  logLevel: "error",
  build: { ssr: true, target: "node20", minify: false, rollupOptions: { input: "scripts/fuzzLib.js", output: { format: "es", entryFileNames: "lib.mjs" } } },
};
