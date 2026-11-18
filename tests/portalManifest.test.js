import { describe, it, expect } from "vitest";
import { onRequest, manifestFor } from "../functions/portal-manifest.js";

const get = (q) => onRequest({ request: new Request("https://x.test/portal-manifest" + q) });
describe("portal manifest", () => {
  it("returns an installable manifest for a valid link", async () => {
    const r = get("?t=abcd1234efgh");
    expect(r.status).toBe(200);
    expect(r.headers.get("Content-Type")).toBe("application/manifest+json");
    const m = await r.json();
    expect(m.start_url).toBe("/?portal=abcd1234efgh");
    expect(m.display).toBe("standalone");
    expect(m.icons.length).toBeGreaterThanOrEqual(2);
  });
  it("refuses a missing or odd token", () => {
    for (const q of ["", "?t=", "?t=short", "?t=" + "a".repeat(200), "?t=ab<script>cdef", "?t=../../etc/passwd"]) expect(get(q).status).toBe(404);
  });
  it("encodes the token in the start url", () => {
    expect(manifestFor("a-b_c1234567").start_url).toBe("/?portal=a-b_c1234567");
  });
});
