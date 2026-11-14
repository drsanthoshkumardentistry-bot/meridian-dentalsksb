import { describe, it, expect, vi } from "vitest";
const store = new Map();
vi.mock("firebase/firestore", () => ({
  doc: (_db, ...path) => ({ path: path.join("/") }),
  getDoc: async (r) => ({ exists: () => store.has(r.path), data: () => store.get(r.path) }),
  setDoc: async (r, d) => { store.set(r.path, d); },
  deleteDoc: async (r) => { store.delete(r.path); },
}));
import { getOpg, saveOpg, deleteOpg, legacyOpgPatients } from "../src/opgStore.js";

describe("OPG documents", () => {
  const img = "data:image/jpeg;base64," + "A".repeat(4000);
  it("saves the picture on its own and leaves only small fields for the patient record", async () => {
    const fields = await saveOpg({}, "clinic1", "P/1", img, new Date("2026-11-14T10:00:00Z"));
    expect(fields).toEqual({ hasOpg: true, opgBytes: Math.round(img.length * 0.75), opgImage: "" });
    expect(store.get("clinics/clinic1/opgScans/P_1")).toMatchObject({ patientId: "P/1", data: img, uploadedAt: "2026-11-14T10:00:00.000Z" });
    expect(await getOpg({}, "clinic1", "P/1")).toBe(img);
  });
  it("returns an empty string when there is none, and after a delete", async () => {
    expect(await getOpg({}, "clinic1", "nobody")).toBe("");
    await deleteOpg({}, "clinic1", "P/1");
    expect(await getOpg({}, "clinic1", "P/1")).toBe("");
  });
  it("finds the older patient records that still hold a picture", () => {
    expect(legacyOpgPatients([{ id: 1, opgImage: img }, { id: 2, opgImage: "" }, null, { id: 3 }, { id: 4, opgImage: 5 }]).map((p) => p.id)).toEqual([1]);
    expect(legacyOpgPatients(undefined)).toEqual([]);
  });
});
