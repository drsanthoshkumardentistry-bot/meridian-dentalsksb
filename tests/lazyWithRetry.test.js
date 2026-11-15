import { describe, it, expect, vi } from "vitest";
import { loadWithRetry } from "../src/lazyWithRetry.js";

const store = () => { const m = {}; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = v; } }; };
const pendingForever = async (p) => { const r = await Promise.race([p.then(() => "settled", () => "rejected"), new Promise((res) => setTimeout(() => res("pending"), 30))]); return r; };

describe("loadWithRetry", () => {
  it("returns a screen that loaded fine and does not reload", async () => {
    const reload = vi.fn(); const mod = { default: () => null };
    expect(await loadWithRetry(async () => mod, { reload, storage: store() })).toBe(mod);
    expect(reload).not.toHaveBeenCalled();
  });
  it("reloads once when the screen comes back empty (the iPhone crash) and waits on the loading screen", async () => {
    const reload = vi.fn();
    expect(await pendingForever(loadWithRetry(async () => undefined, { reload, storage: store() }))).toBe("pending");
    expect(reload).toHaveBeenCalledTimes(1);
  });
  it("reloads once when the file fails to download", async () => {
    const reload = vi.fn();
    expect(await pendingForever(loadWithRetry(async () => { throw new Error("Failed to fetch dynamically imported module"); }, { reload, storage: store() }))).toBe("pending");
    expect(reload).toHaveBeenCalledTimes(1);
  });
  it("does not loop: a second failure within a minute shows the error", async () => {
    const reload = vi.fn(); const storage = store(); let t = 1000000; const now = () => t;
    await pendingForever(loadWithRetry(async () => undefined, { reload, storage, now }));
    t += 5000;
    await expect(loadWithRetry(async () => undefined, { reload, storage, now })).rejects.toThrow(/loaded empty/);
    expect(reload).toHaveBeenCalledTimes(1);
  });
  it("may reload again after a minute has passed", async () => {
    const reload = vi.fn(); const storage = store(); let t = 1000000; const now = () => t;
    await pendingForever(loadWithRetry(async () => undefined, { reload, storage, now }));
    t += 61000;
    await pendingForever(loadWithRetry(async () => undefined, { reload, storage, now }));
    expect(reload).toHaveBeenCalledTimes(2);
  });
  it("still works when browser storage is blocked", async () => {
    const reload = vi.fn(); const storage = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
    expect(await pendingForever(loadWithRetry(async () => undefined, { reload, storage }))).toBe("pending");
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
