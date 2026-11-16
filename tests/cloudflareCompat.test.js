import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

const root = process.cwd();
const apiFiles = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? apiFiles(join(dir, e.name)) : e.name.endsWith(".js") ? [join(dir, e.name)] : []));

describe("the server routes can run on Cloudflare Pages", () => {
  it("do not use Node crypto functions that Cloudflare does not implement", () => {
    const banned = /\b(createSign|createVerify|createPrivateKey|createPublicKey|generateKeyPair(Sync)?|publicEncrypt|privateDecrypt)\s*\(/;
    for (const f of apiFiles(resolve(root, "api"))) expect(readFileSync(f, "utf8"), f).not.toMatch(banned);
  });
  it("every api route has a matching Cloudflare function", () => {
    const routes = readdirSync(resolve(root, "api")).filter((n) => n.endsWith(".js"));
    for (const r of routes) expect(existsSync(resolve(root, "functions/api", r)), r).toBe(true);
  });
  it("the Pages config turns on Node compatibility and points at the build folder", () => {
    const t = readFileSync(resolve(root, "wrangler.toml"), "utf8");
    expect(t).toMatch(/nodejs_compat/);
    expect(t).toMatch(/pages_build_output_dir\s*=\s*"dist"/);
  });
  it("the security headers file matches vercel.json", () => {
    const v = JSON.parse(readFileSync(resolve(root, "vercel.json"), "utf8"));
    const h = readFileSync(resolve(root, "public/_headers"), "utf8");
    const all = v.headers.find((x) => x.source === "/(.*)").headers;
    for (const { key, value } of all) expect(h, key).toContain(`${key}: ${value}`);
  });
});
