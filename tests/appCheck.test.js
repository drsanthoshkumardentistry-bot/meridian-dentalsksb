import { describe, it, expect, vi } from "vitest";
import { startAppCheck } from "../src/appCheck";

const mk = (throws) => {
  const init = vi.fn(() => { if (throws) throw new Error("x"); });
  class P { constructor(k) { this.k = k; } }
  return { init, deps: { initializeAppCheck: init, ReCaptchaV3Provider: P } };
};
describe("startAppCheck", () => {
  it("does nothing without a key", () => {
    const { init, deps } = mk();
    for (const k of [undefined, "", "   ", null, 5]) expect(startAppCheck({}, k, deps)).toBe(false);
    expect(init).not.toHaveBeenCalled();
  });
  it("does nothing without an app", () => {
    const { init, deps } = mk();
    expect(startAppCheck(null, "key", deps)).toBe(false);
    expect(init).not.toHaveBeenCalled();
  });
  it("starts with the key and refreshes tokens", () => {
    const { init, deps } = mk();
    expect(startAppCheck({ a: 1 }, " abc ", deps)).toBe(true);
    const [, opts] = init.mock.calls[0];
    expect(opts.provider.k).toBe("abc");
    expect(opts.isTokenAutoRefreshEnabled).toBe(true);
  });
  it("never throws if Firebase refuses", () => {
    const { deps } = mk(true);
    expect(startAppCheck({}, "abc", deps)).toBe(false);
  });
});
