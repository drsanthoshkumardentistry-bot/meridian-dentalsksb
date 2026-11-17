import { describe, it, beforeAll, afterAll, beforeEach } from "vitest";
import { assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { setup, as, anon, seed } from "./helpers.mjs";

// The SaaS guarantee: no account of clinic A can read, write or delete anything inside clinic B,
// whatever the role, and signed-out or unverified users reach nothing.
let env;
beforeAll(async () => { env = await setup(); });
afterAll(async () => { await env.cleanup(); });

const A = "ownerA";
const B = "ownerB";
const PARTS = ["patients", "appointments", "queue", "invoices", "inventory", "patientImages", "opgScans", "leads", "memberships", "employees", "store", "audit", "someFutureCollection"];
const ROLES = ["manager", "dentist", "receptionist"];
const staff = (email, role, clinicId) => ({
  email, clinicId, clinicName: "C", role, branchIds: [], status: "active", active: true, invitedBy: "o@example.com", invitedAt: 1,
});
const asEmail = (uid) => as(env, uid, { email: `${uid}@example.com` });

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env, async (db) => {
    for (const r of ROLES) {
      await setDoc(doc(db, "clinicStaff", `${r}a@example.com`), staff(`${r}a@example.com`, r, A));
      await setDoc(doc(db, "clinicStaff", `${r}b@example.com`), staff(`${r}b@example.com`, r, B));
    }
    for (const p of PARTS) await setDoc(doc(db, "clinics", B, p, "d1"), { name: "secret" });
  });
});

const ref = (db, p) => doc(db, "clinics", B, p, "d1");

describe("clinic isolation", () => {
  for (const p of PARTS) {
    it(`${p}: clinic A's owner and every A role are locked out of clinic B`, async () => {
      const users = [as(env, A), ...ROLES.map((r) => asEmail(`${r}a`))];
      for (const db of users) {
        await assertFails(getDoc(ref(db, p)));
        await assertFails(setDoc(ref(db, p), { name: "hijack" }));
        await assertFails(deleteDoc(ref(db, p)));
        await assertFails(setDoc(doc(db, "clinics", B, p, "new1"), { name: "plant" }));
      }
    });
    it(`${p}: signed-out and unverified users reach nothing`, async () => {
      await assertFails(getDoc(ref(anon(env), p)));
      await assertFails(setDoc(ref(anon(env), p), { name: "x" }));
      await assertFails(getDoc(ref(as(env, B, { email_verified: false }), p)));
      await assertFails(setDoc(ref(as(env, B, { email_verified: false }), p), { name: "x" }));
    });
  }
  it("clinic B's own owner still reaches everything (the lock is not just broken)", async () => {
    for (const p of PARTS) {
      await assertSucceeds(getDoc(ref(as(env, B), p)));
      await assertSucceeds(setDoc(ref(as(env, B), p), { name: "ok" }));
    }
  });
  it("a team member cannot move themselves into another clinic", async () => {
    const db = asEmail("dentista");
    await assertFails(setDoc(doc(db, "clinicStaff", "dentista@example.com"), staff("dentista@example.com", "manager", B)));
    await assertFails(setDoc(doc(db, "clinicStaff", "evil@example.com"), staff("evil@example.com", "manager", B)));
  });
});

// rateLimits holds the server's shared daily counters (written only with the service account, which skips these rules).
// No browser, signed in or not, may read or change them.
describe("server-only counters", () => {
  it("rateLimits is closed to every browser", async () => {
    await seed(env, (db) => setDoc(doc(db, "rateLimits", "ai_2026-11-17"), { n: 1 }));
    for (const db of [as(env, A), anon(env)]) {
      await assertFails(getDoc(doc(db, "rateLimits", "ai_2026-11-17")));
      await assertFails(setDoc(doc(db, "rateLimits", "ai_2026-11-17"), { n: 0 }));
      await assertFails(deleteDoc(doc(db, "rateLimits", "ai_2026-11-17")));
    }
  });
  // Founder dashboard data. A clinic must not be able to mark itself paid, approve its own request, or read others' usage.
  it("plans, planRequests and presence are closed to every browser", async () => {
    for (const [col, id] of [["plans", A], ["planRequests", A], ["presence", A]]) {
      await seed(env, (db) => setDoc(doc(db, col, id), { x: 1 }));
      for (const db of [as(env, A), as(env, B), anon(env)]) {
        await assertFails(getDoc(doc(db, col, id)));
        await assertFails(setDoc(doc(db, col, id), { plan: "pro", paidUntil: 9999999999999, status: "approved" }));
        await assertFails(deleteDoc(doc(db, col, id)));
      }
    }
  });
});
