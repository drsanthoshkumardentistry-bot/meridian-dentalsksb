import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({ store: null, writes: [] }));
vi.mock("../api/_lib/fsLite.js", () => ({
  getDoc: async () => h.store,
  putDoc: async ({ data }) => { h.writes.push(data); h.store = data; },
}));
import { getFeatures, setFeature, featureOn, resetFeatureCache, allOn } from "../api/_lib/featuresCore.js";

const sa = { project_id: "p" };
beforeEach(() => { h.store = null; h.writes = []; resetFeatureCache(); });

describe("feature switches", () => {
  it("are all on with no service account, no document or a read error", async () => {
    expect(await getFeatures({ sa: null })).toEqual(allOn());
    expect(await getFeatures({ sa, fresh: true })).toEqual(allOn());
  });
  it("turn one feature off and back on, leaving the other alone", async () => {
    expect(await setFeature({ sa, key: "ai", on: false })).toEqual({ ai: false, whatsapp: true });
    expect(await featureOn({ sa }, "ai")).toBe(false);
    expect(await featureOn({ sa }, "whatsapp")).toBe(true);
    expect(await setFeature({ sa, key: "ai", on: true })).toEqual({ ai: true, whatsapp: true });
  });
  it("rejects an unknown feature", async () => {
    await expect(setFeature({ sa, key: "billing", on: false })).rejects.toThrow("key");
    expect(h.writes).toEqual([]);
  });
});
