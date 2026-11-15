import { describe, it, expect } from "vitest";
import { hasSavedSession } from "../src/savedSession.js";

const store = (o = {}) => { const k = Object.keys(o); return { length: k.length, key: (i) => k[i] }; };
const none = store();

describe("hasSavedSession", () => {
  it("says no only when every check clearly finds nothing", async () => {
    expect(await hasSavedSession({ read: async () => [], session: none, local: none })).toBe(false);
    expect(await hasSavedSession({ read: async () => ["something-else"], session: none, local: none })).toBe(false);
  });
  it("says yes when Firebase has a saved user", async () => {
    expect(await hasSavedSession({ read: async () => ["firebase:authUser:key:[DEFAULT]"], session: none, local: none })).toBe(true);
    expect(await hasSavedSession({ read: async () => [], session: none, local: store({ "firebase:authUser:x": 1 }) })).toBe(true);
  });
  it("says yes while a Google redirect sign-in is finishing", async () => {
    expect(await hasSavedSession({ read: async () => [], session: store({ "firebase:pendingRedirect:abc": "1" }), local: none })).toBe(true);
  });
  it("says yes when it cannot tell", async () => {
    expect(await hasSavedSession({ read: async () => null, session: none, local: none })).toBe(true);
    expect(await hasSavedSession({ read: async () => { throw new Error("x"); }, session: none, local: none })).toBe(true);
  });
});
