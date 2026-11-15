import { describe, it, expect, vi } from "vitest";
import { cleanupPatientRemote } from "../src/patientCleanup.js";

const deps = () => ({ delOpg: vi.fn(async () => {}), delPortal: vi.fn(async () => {}), list: vi.fn(async () => [{ id: "i1" }, { id: "i2" }]), removeImg: vi.fn(async () => {}) });

describe("deleting a patient removes everything stored for them", () => {
  it("removes the OPG picture, the published portal page and every gallery photo", async () => {
    const d = deps();
    const r = await cleanupPatientRemote({}, "c1", { id: "p1", hasOpg: true, portalToken: "tok" }, d);
    expect(d.delOpg).toHaveBeenCalledWith({}, "c1", "p1");
    expect(d.delPortal).toHaveBeenCalledWith({}, "tok");
    expect(d.removeImg).toHaveBeenCalledTimes(2);
    expect(r).toEqual({ opg: true, portal: true, images: 2 });
  });
  it("skips what the patient never had", async () => {
    const d = deps();
    d.list = vi.fn(async () => []);
    const r = await cleanupPatientRemote({}, "c1", { id: "p1" }, d);
    expect(d.delOpg).not.toHaveBeenCalled();
    expect(d.delPortal).not.toHaveBeenCalled();
    expect(r).toEqual({ opg: false, portal: false, images: 0 });
  });
  it("one failure does not stop the others", async () => {
    const d = deps();
    d.delOpg = vi.fn(async () => { throw new Error("x"); });
    d.removeImg = vi.fn(async (_db, _c, id) => { if (id === "i1") throw new Error("y"); });
    const r = await cleanupPatientRemote({}, "c1", { id: "p1", hasOpg: true, portalToken: "tok" }, d);
    expect(r).toEqual({ opg: false, portal: true, images: 1 });
  });
  it("does nothing offline or without a clinic", async () => {
    const d = deps();
    expect(await cleanupPatientRemote(null, "c1", { id: "p1", portalToken: "t" }, d)).toEqual({ opg: false, portal: false, images: 0 });
    expect(d.delPortal).not.toHaveBeenCalled();
  });
});
