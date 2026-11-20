import { describe, it, expect, beforeEach } from "vitest";
import { postResend, sendMail, DEFAULT_FROM, FALLBACK_FROM } from "../api/_lib/mailCore.js";

const rec = (statuses) => { const calls = []; const fn = async (_u, o) => { calls.push(JSON.parse(o.body)); const ok = statuses.shift(); return { ok }; }; return { fn, calls }; };

describe("mailCore", () => {
  beforeEach(() => { process.env.RESEND_API_KEY = "re_test"; delete process.env.MAIL_FROM; });
  it("sends from the verified domain by default", async () => {
    const { fn, calls } = rec([true]);
    expect((await postResend({ to: "a@b.com", subject: "s", text: "t", fetchFn: fn })).ok).toBe(true);
    expect(calls.length).toBe(1); expect(calls[0].from).toBe(DEFAULT_FROM); expect(DEFAULT_FROM).toContain("@meridiandentalos.com");
  });
  it("retries once from the shared test address when the sender is refused", async () => {
    const { fn, calls } = rec([false, true]);
    expect((await postResend({ to: "a@b.com", subject: "s", text: "t", fetchFn: fn })).ok).toBe(true);
    expect(calls.map((c) => c.from)).toEqual([DEFAULT_FROM, FALLBACK_FROM]);
  });
  it("honours MAIL_FROM and includes html only when given", async () => {
    process.env.MAIL_FROM = "X <x@meridiandentalos.com>";
    const { fn, calls } = rec([true]);
    await postResend({ to: "a@b.com", subject: "s", text: "t", html: "<b>t</b>", fetchFn: fn });
    expect(calls[0].from).toBe("X <x@meridiandentalos.com>"); expect(calls[0].html).toBe("<b>t</b>");
  });
  it("does nothing without a key or recipient", async () => {
    delete process.env.RESEND_API_KEY;
    expect(await sendMail({ to: "a@b.com", subject: "s", text: "t", fetchFn: async () => ({ ok: true }) })).toBe(false);
  });
});
