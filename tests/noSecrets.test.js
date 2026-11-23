import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";

// Fails the build if a private key, token or service account is ever committed.
// (Firebase web API keys start with "AIza" and are public by design, so they are not matched here.)
const PATTERNS = [
  /-----BEGIN (RSA |EC |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/,
  /\bghp_[A-Za-z0-9]{30,}\b/, /\bgithub_pat_[A-Za-z0-9_]{40,}\b/,
  /\bsk-ant-[A-Za-z0-9_-]{20,}\b/, /\bsk-[A-Za-z0-9]{32,}\b/,
  /\bxox[abp]-[A-Za-z0-9-]{10,}\b/, /\bAKIA[0-9A-Z]{16}\b/,
  /"private_key_id"\s*:\s*"[0-9a-f]{20,}"/,
];

describe("no secrets in the repository", () => {
  const files = execSync("git ls-files", { encoding: "utf8" }).split("\n").filter((f) => f && !/(package-lock\.json|\.(png|jpe?g|ico|webp|pdf|apk|jar|woff2?|dcm)|tests\/fixtures\/)/i.test(f));
  it("scans every tracked text file", async () => {
    const { readFileSync } = await import("node:fs");
    const hits = [];
    for (const f of files) {
      if (f === "tests/noSecrets.test.js") continue;
      let text; try { text = readFileSync(f, "utf8"); } catch { continue; }
      for (const re of PATTERNS) if (re.test(text)) hits.push(`${f}: ${re}`);
    }
    expect(hits).toEqual([]);
  });
  it("no .env or service-account file is tracked besides the public production one", () => {
    const bad = files.filter((f) => /(^|\/)\.env(\.|$)/.test(f) && f !== ".env.production");
    const sa = files.filter((f) => /service[-_ ]?account.*\.json$/i.test(f));
    expect([...bad, ...sa]).toEqual([]);
  });
});
