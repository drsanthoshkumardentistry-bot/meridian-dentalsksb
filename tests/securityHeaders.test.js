import { describe, it, expect } from "vitest";
import fs from "node:fs";
import crypto from "node:crypto";

const read = (f) => fs.readFileSync(new URL("../" + f, import.meta.url), "utf8");
const cspOf = () => JSON.parse(read("vercel.json")).headers.flatMap((h) => h.headers).find((x) => x.key === "Content-Security-Policy").value;

describe("Content-Security-Policy", () => {
  const html = read("index.html");
  const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  it("allows exactly the inline script that index.html has (hash is current)", () => {
    expect(inline.length).toBe(1);
    const hash = "sha256-" + crypto.createHash("sha256").update(inline[0]).digest("base64");
    expect(cspOf()).toContain(`'${hash}'`);
  });
  it("has script-src without unsafe-inline or unsafe-eval", () => {
    const script = cspOf().split(";").map((x) => x.trim()).find((x) => x.startsWith("script-src"));
    expect(script).toBeTruthy();
    expect(script).not.toMatch(/unsafe-/);
    expect(script).toContain("'self'");
  });
  it("vercel.json and public/_headers carry the same policy", () => {
    expect(read("public/_headers")).toContain(cspOf());
  });
  it("index.html has no other executable inline script or inline event handler", () => {
    expect(html).not.toMatch(/\son(click|load|error)=/i);
    expect(html.match(/<script(?![^>]*src=)(?![^>]*type="application\/ld\+json")[^>]*>/g) || []).toHaveLength(1);
  });
});

describe("offline page", () => {
  it("ships offline.html and a service worker that only handles navigations", () => {
    expect(read("public/offline.html")).toContain("You are offline");
    const sw = read("public/sw.js");
    expect(sw).toContain('e.request.mode !== "navigate"');
    expect(sw).toContain("/offline.html");
  });
  it("registers only in production web", async () => {
    const { registerOfflinePage } = await import("../src/offlinePage.js");
    const reg = []; const nav = { serviceWorker: { register: (u) => { reg.push(u); return Promise.resolve(); } } };
    const win = { listeners: {}, addEventListener(e, f) { this.listeners[e] = f; } };
    expect(registerOfflinePage(nav, false, win)).toBe(false);
    expect(registerOfflinePage({}, true, win)).toBe(false);
    expect(registerOfflinePage(nav, true, { ...win, Capacitor: { isNativePlatform: () => true }, addEventListener() {} })).toBe(false);
    expect(registerOfflinePage(nav, true, win)).toBe(true);
    win.listeners.load();
    expect(reg).toEqual(["/sw.js"]);
  });
});
