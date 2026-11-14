import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const script = html.match(/<script>\s*\(function \(\) \{[\s\S]*?<\/script>/)[0].replace(/<\/?script>/g, "");

function boot(opts = {}) {
  const { standalone = false, seen = false } = opts;
  document.documentElement.className = "";
  document.body.innerHTML = '<div id="boot"><div id="boot-note"></div></div><div id="root"></div>';
  window.matchMedia = () => ({ matches: standalone });
  sessionStorage.clear();
  localStorage.clear();
  if (opts.returning) localStorage.setItem("merident-boot-seen", "1");
  Object.defineProperty(window.navigator, "onLine", { value: opts.online !== false, configurable: true });
  if (seen) sessionStorage.setItem("merident-boot", "1");
  new Function(script)();
}

afterEach(() => { vi.useRealTimers(); });

describe("animated opening screen", () => {
  it("has the markup and honours reduced motion", () => {
    expect(html).toMatch(/id="boot"/);
    expect(html).toMatch(/prefers-reduced-motion:reduce/);
  });
  it("does not show on the website in a normal browser tab", () => {
    boot();
    expect(document.documentElement.className).not.toMatch(/is-app/);
  });
  it("shows inside the installed app, once per session", () => {
    boot({ standalone: true });
    expect(document.documentElement.className).toMatch(/is-app/);
    boot({ standalone: true, seen: true });
    expect(document.documentElement.className).not.toMatch(/is-app/);
  });
  it("stays at least ~1.7 s on the first open, leaves once the app has drawn, and is removed", () => {
    vi.useFakeTimers();
    boot({ standalone: true });
    document.getElementById("root").innerHTML = "<div>Dashboard</div>";
    vi.advanceTimersByTime(1000);
    expect(document.getElementById("boot").className).not.toMatch(/out/);
    vi.advanceTimersByTime(900);
    expect(document.getElementById("boot").className).toMatch(/out/);
    vi.advanceTimersByTime(700);
    expect(document.getElementById("boot")).toBeNull();
  });
  it("gives up waiting after 8 s even if the app never draws", () => {
    vi.useFakeTimers();
    boot({ standalone: true });
    vi.advanceTimersByTime(8300);
    expect(document.getElementById("boot").className).toMatch(/out/);
  });
  it("does not leave while the loading placeholder is still showing", () => {
    vi.useFakeTimers();
    boot({ standalone: true });
    document.getElementById("root").innerHTML = '<div data-loading="1">x</div>';
    vi.advanceTimersByTime(3000);
    expect(document.getElementById("boot").className).not.toMatch(/out/);
  });
  it("later opens skip the dancing molars and leave sooner", () => {
    vi.useFakeTimers();
    boot({ standalone: true, returning: true });
    expect(document.getElementById("boot").className).toMatch(/quick/);
    document.getElementById("root").innerHTML = "<div>Dashboard</div>";
    vi.advanceTimersByTime(1300);
    expect(document.getElementById("boot").className).toMatch(/out/);
  });
  it("says so when offline and when the connection is slow", () => {
    vi.useFakeTimers();
    boot({ standalone: true, online: false });
    expect(document.getElementById("boot-note").textContent).toMatch(/offline/i);
    boot({ standalone: true });
    vi.advanceTimersByTime(4300);
    expect(document.getElementById("boot-note").textContent).toMatch(/Slow connection/);
  });
});
