import { describe, it, expect, vi } from "vitest";
import { startSentry, scrubEvent } from "../src/sentry.js";

describe("startSentry", () => {
  it("does nothing without a key and never loads the SDK", async () => {
    const load = vi.fn();
    for (const k of [undefined, "", "  ", null]) expect(await startSentry(k, load)).toBe(false);
    expect(load).not.toHaveBeenCalled();
  });
  it("starts privately with a key", async () => {
    const init = vi.fn();
    expect(await startSentry(" https://k@o.ingest.sentry.io/1 ", async () => ({ init }))).toBe(true);
    const o = init.mock.calls[0][0];
    expect(o.dsn).toBe("https://k@o.ingest.sentry.io/1");
    expect(o.sendDefaultPii).toBe(false);
    expect(o.tracesSampleRate).toBe(0);
    expect(o.maxBreadcrumbs).toBe(0);
    expect(o.integrations([{ name: "Breadcrumbs" }, { name: "GlobalHandlers" }]).map((i) => i.name)).toEqual(["GlobalHandlers"]);
  });
  it("survives a failed load or init", async () => {
    expect(await startSentry("k", async () => { throw new Error("blocked"); })).toBe(false);
    expect(await startSentry("k", async () => ({ init() { throw new Error("x"); } }))).toBe(false);
  });
});
describe("scrubEvent", () => {
  it("removes personal data and extras", () => {
    const e = scrubEvent({
      message: "fail asha@example.com 9043205927", user: { email: "a@b.com" }, breadcrumbs: [1], extra: { x: 1 }, contexts: { y: 1 },
      request: { url: "https://x.test/app?plan=SECRET", cookies: "c" },
      exception: { values: [{ type: "Error", value: "bad for dr@x.com id 123456789" }] },
    });
    const s = JSON.stringify(e);
    expect(s).not.toMatch(/asha@|9043205927|SECRET|dr@x|123456789|cookies/);
    expect(e.user).toBeUndefined();
    expect(e.breadcrumbs).toBeUndefined();
  });
  it("drops non-events", () => { expect(scrubEvent(null)).toBeNull(); });
});
