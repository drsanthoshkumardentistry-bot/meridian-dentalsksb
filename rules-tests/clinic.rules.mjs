import { describe, it, beforeAll, afterAll, beforeEach } from "vitest";
import { assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, addDoc, collection, query, where } from "firebase/firestore";
import { setup, as, anon, seed } from "./helpers.mjs";

let env;
beforeAll(async () => { env = await setup(); });
afterAll(async () => { await env.cleanup(); });

const OWNER = "owner1";
const staff = (email, role, over = {}) => ({
  email, clinicId: OWNER, clinicName: "Smile Clinic", role, branchIds: [], status: "active", active: true,
  invitedBy: "owner@example.com", invitedAt: 1, ...over,
});
const asEmail = (uid) => as(env, uid, { email: `${uid}@example.com` });

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env, async (db) => {
    await setDoc(doc(db, "clinicStaff", "mgr@example.com"), staff("mgr@example.com", "manager"));
    await setDoc(doc(db, "clinicStaff", "doc@example.com"), staff("doc@example.com", "dentist"));
    await setDoc(doc(db, "clinicStaff", "rec@example.com"), staff("rec@example.com", "receptionist"));
    await setDoc(doc(db, "clinicStaff", "new@example.com"), staff("new@example.com", "dentist", { status: "invited" }));
    for (const c of ["patients", "invoices", "inventory", "employees", "appointments", "queue", "store"]) {
      await setDoc(doc(db, "clinics", OWNER, c, "d1"), { name: "x" });
    }
  });
});

const read = (db, c) => getDoc(doc(db, "clinics", OWNER, c, "d1"));
const write = (db, c) => setDoc(doc(db, "clinics", OWNER, c, "d1"), { name: "y" });

describe("clinic owner", () => {
  it("owns their data; other accounts and signed-out users cannot touch it", async () => {
    await assertSucceeds(read(as(env, OWNER), "patients"));
    await assertSucceeds(write(as(env, OWNER), "patients"));
    await assertFails(read(as(env, "intruder"), "patients"));
    await assertFails(read(anon(env), "patients"));
    await assertFails(read(as(env, OWNER, { email_verified: false }), "patients"));
  });
});

describe("team roles", () => {
  it("manager reaches everything", async () => {
    const db = asEmail("mgr");
    for (const c of ["patients", "appointments", "queue", "invoices", "inventory", "employees", "store"]) {
      await assertSucceeds(read(db, c));
      await assertSucceeds(write(db, c));
    }
  });
  it("dentist: patients, appointments and queue yes; billing read only; no staff data or inventory writes", async () => {
    const db = asEmail("doc");
    await assertSucceeds(write(db, "patients"));
    await assertSucceeds(write(db, "appointments"));
    await assertSucceeds(write(db, "queue"));
    await assertSucceeds(read(db, "invoices"));
    await assertFails(write(db, "invoices"));
    await assertFails(read(db, "employees"));
    await assertFails(write(db, "inventory"));
    await assertFails(write(db, "store"));
  });
  it("receptionist: patients, diary and billing; no employees or inventory writes", async () => {
    const db = asEmail("rec");
    await assertSucceeds(write(db, "patients"));
    await assertSucceeds(write(db, "invoices"));
    await assertSucceeds(read(db, "inventory"));
    await assertFails(write(db, "inventory"));
    await assertFails(read(db, "employees"));
  });
  it("an invitation that has not been accepted gives no access", async () => {
    await assertFails(read(asEmail("new"), "patients"));
  });
  it("a suspended member (active false) has no access", async () => {
    await seed(env, (db) => updateDoc(doc(db, "clinicStaff", "doc@example.com"), { active: false }));
    await assertFails(read(asEmail("doc"), "patients"));
  });
  it("members cannot reach another clinic", async () => {
    await assertFails(getDoc(doc(asEmail("doc"), "clinics", "other-clinic", "patients", "d1")));
  });
});

describe("invitations", () => {
  const invite = (over = {}) => ({
    email: "fresh@example.com", clinicId: OWNER, clinicName: "Smile Clinic", role: "dentist", branchIds: [],
    status: "invited", active: true, invitedBy: "owner@example.com", invitedAt: 1, ...over,
  });
  it("only the clinic owner can invite, and only as manager, dentist or receptionist", async () => {
    await assertSucceeds(setDoc(doc(as(env, OWNER), "clinicStaff", "fresh@example.com"), invite()));
    await assertFails(setDoc(doc(as(env, "intruder"), "clinicStaff", "fresh@example.com"), invite()));
    await assertFails(setDoc(doc(as(env, OWNER), "clinicStaff", "fresh@example.com"), invite({ role: "owner" })));
    await assertFails(setDoc(doc(as(env, OWNER), "clinicStaff", "fresh@example.com"), invite({ status: "active" })));
    await assertFails(setDoc(doc(as(env, OWNER), "clinicStaff", "other@example.com"), invite()));
  });
  it("the invited person can read and accept their invitation, but not change the role", async () => {
    const db = asEmail("new");
    await assertSucceeds(getDoc(doc(db, "clinicStaff", "new@example.com")));
    await assertFails(updateDoc(doc(db, "clinicStaff", "new@example.com"), { role: "manager" }));
    await assertSucceeds(updateDoc(doc(db, "clinicStaff", "new@example.com"), { status: "active" }));
    await assertSucceeds(read(db, "patients"));
  });
  it("someone else cannot accept it", async () => {
    await assertFails(updateDoc(doc(asEmail("doc"), "clinicStaff", "new@example.com"), { status: "active" }));
  });
  it("the owner can change a role and remove a member; a member can leave", async () => {
    await assertSucceeds(updateDoc(doc(as(env, OWNER), "clinicStaff", "doc@example.com"), { role: "receptionist" }));
    await assertFails(updateDoc(doc(as(env, OWNER), "clinicStaff", "doc@example.com"), { clinicId: "elsewhere" }));
    await assertSucceeds(deleteDoc(doc(as(env, OWNER), "clinicStaff", "rec@example.com")));
    await assertSucceeds(deleteDoc(doc(asEmail("doc"), "clinicStaff", "doc@example.com")));
  });
  it("the owner can list their team; others cannot list it", async () => {
    await assertSucceeds(getDocs(query(collection(as(env, OWNER), "clinicStaff"), where("clinicId", "==", OWNER))));
    await assertFails(getDocs(query(collection(asEmail("doc"), "clinicStaff"), where("clinicId", "==", OWNER))));
  });
});

describe("activity log", () => {
  const entry = (uid, over = {}) => ({ id: "e1", at: 1, actorUid: uid, actorEmail: `${uid}@example.com`, actorRole: "dentist", action: "patient.add", subject: "Asha", detail: "", ...over });
  it("members log under their own identity; only the owner and managers read it", async () => {
    await assertSucceeds(setDoc(doc(asEmail("doc"), "clinics", OWNER, "audit", "e1"), entry("doc")));
    await assertFails(setDoc(doc(asEmail("doc"), "clinics", OWNER, "audit", "e2"), entry("mgr")));
    await assertFails(getDoc(doc(asEmail("doc"), "clinics", OWNER, "audit", "e1")));
    await assertSucceeds(getDoc(doc(asEmail("mgr"), "clinics", OWNER, "audit", "e1")));
    await assertSucceeds(getDoc(doc(as(env, OWNER), "clinics", OWNER, "audit", "e1")));
  });
  it("members cannot edit or delete entries", async () => {
    await seed(env, (db) => setDoc(doc(db, "clinics", OWNER, "audit", "e9"), entry("doc", { id: "e9" })));
    await assertFails(updateDoc(doc(asEmail("doc"), "clinics", OWNER, "audit", "e9"), { subject: "changed" }));
    await assertFails(deleteDoc(doc(asEmail("mgr"), "clinics", OWNER, "audit", "e9")));
  });
});

describe("treatment estimate links", () => {
  const share = (over = {}) => ({ clinicId: OWNER, decision: "pending", expiresAt: new Date(Date.now() + 86400000), ...over });
  it("anyone with the link can read it, nobody can list, only the clinic creates", async () => {
    await assertSucceeds(setDoc(doc(as(env, OWNER), "planShares", "tok1"), share()));
    await assertSucceeds(getDoc(doc(anon(env), "planShares", "tok1")));
    await assertFails(getDocs(collection(anon(env), "planShares")));
    await assertFails(setDoc(doc(as(env, "intruder"), "planShares", "tok2"), share()));
  });
  it("a patient can answer once and change nothing else", async () => {
    await seed(env, (db) => setDoc(doc(db, "planShares", "tok1"), share()));
    const ref = doc(anon(env), "planShares", "tok1");
    await assertFails(updateDoc(ref, { decision: "approved", clinicId: "hijack", decidedName: "A" }));
    await assertFails(updateDoc(ref, { decision: "maybe", decidedName: "A" }));
    await assertSucceeds(updateDoc(ref, { decision: "approved", decidedName: "Asha", decidedAt: 1 }));
    await assertFails(updateDoc(ref, { decision: "declined", decidedName: "Asha", decidedAt: 2 }));
  });
  it("an expired link cannot be answered", async () => {
    await seed(env, (db) => setDoc(doc(db, "planShares", "old"), share({ expiresAt: new Date(Date.now() - 1000) })));
    await assertFails(updateDoc(doc(anon(env), "planShares", "old"), { decision: "approved", decidedName: "A", decidedAt: 1 }));
  });
});

describe("online booking", () => {
  const req = (over = {}) => ({ clinicId: OWNER, name: "Asha", phone: "9876543210", date: "2026-12-01", slot: "Morning", service: "Check-up", note: "", status: "new", createdAt: 1, ...over });
  it("the booking page is public by id but cannot be listed, and only the clinic writes it", async () => {
    await assertSucceeds(setDoc(doc(as(env, OWNER), "bookingPages", OWNER), { enabled: true }));
    await assertSucceeds(getDoc(doc(anon(env), "bookingPages", OWNER)));
    await assertFails(getDocs(collection(anon(env), "bookingPages")));
    await assertFails(setDoc(doc(asEmail("rec"), "bookingPages", OWNER), { enabled: true }));
    await assertSucceeds(setDoc(doc(asEmail("mgr"), "bookingPages", OWNER), { enabled: true }));
  });
  it("anyone can send a valid request while booking is on, and not when it is off", async () => {
    await seed(env, (db) => setDoc(doc(db, "bookingPages", OWNER), { enabled: true }));
    await assertSucceeds(addDoc(collection(anon(env), "bookingRequests"), req()));
    await seed(env, (db) => setDoc(doc(db, "bookingPages", OWNER), { enabled: false }));
    await assertFails(addDoc(collection(anon(env), "bookingRequests"), req()));
  });
  it("rejects malformed requests", async () => {
    await seed(env, (db) => setDoc(doc(db, "bookingPages", OWNER), { enabled: true }));
    const db = anon(env);
    await assertFails(addDoc(collection(db, "bookingRequests"), req({ phone: "123" })));
    await assertFails(addDoc(collection(db, "bookingRequests"), req({ slot: "Midnight" })));
    await assertFails(addDoc(collection(db, "bookingRequests"), req({ status: "confirmed" })));
    await assertFails(addDoc(collection(db, "bookingRequests"), req({ extra: 1 })));
    await assertFails(addDoc(collection(db, "bookingRequests"), req({ note: "x".repeat(301) })));
  });
  it("only the clinic team reads and answers requests", async () => {
    await seed(env, (db) => setDoc(doc(db, "bookingRequests", "r1"), req()));
    await assertFails(getDoc(doc(anon(env), "bookingRequests", "r1")));
    await assertFails(getDoc(doc(asEmail("doc"), "bookingRequests", "r1")));
    await assertSucceeds(getDoc(doc(asEmail("rec"), "bookingRequests", "r1")));
    await assertSucceeds(updateDoc(doc(as(env, OWNER), "bookingRequests", "r1"), { status: "confirmed", handledAt: 1 }));
    await assertFails(updateDoc(doc(as(env, OWNER), "bookingRequests", "r1"), { name: "Changed" }));
  });
});

describe("closed access list", () => {
  const GMAIL = "owner@gmail.com";
  const asGmail = (uid, email) => env.authenticatedContext(uid, { email, email_verified: true }).firestore();
  const clinicDoc = (db, uid) => doc(db, "clinics", uid, "patients", "p1");

  it("stays open until the switch is turned on", async () => {
    await assertSucceeds(setDoc(clinicDoc(asGmail("u1", "anyone@gmail.com"), "u1"), { name: "A" }));
  });
  it("with the switch on, only approved addresses reach their clinic", async () => {
    await seed(env, async (db) => {
      await setDoc(doc(db, "config", "access"), { restrict: true });
      await setDoc(doc(db, "allowedEmails", GMAIL), { ok: true });
    });
    await assertSucceeds(setDoc(clinicDoc(asGmail("u1", "Owner@Gmail.com"), "u1"), { name: "A" }));
    await assertFails(setDoc(clinicDoc(asGmail("u2", "stranger@gmail.com"), "u2"), { name: "B" }));
    await assertFails(getDoc(clinicDoc(asGmail("u2", "stranger@gmail.com"), "u2")));
  });
  it("a refused address can still read the switch and its own entry, but not change or list them", async () => {
    await seed(env, async (db) => { await setDoc(doc(db, "config", "access"), { restrict: true }); });
    const stranger = asGmail("u2", "stranger@gmail.com");
    await assertSucceeds(getDoc(doc(stranger, "config", "access")));
    await assertSucceeds(getDoc(doc(stranger, "allowedEmails", "stranger@gmail.com")));
    await assertFails(getDoc(doc(stranger, "allowedEmails", "someone-else@gmail.com")));
    await assertFails(setDoc(doc(stranger, "allowedEmails", "stranger@gmail.com"), { ok: true }));
    await assertFails(setDoc(doc(stranger, "config", "access"), { restrict: false }));
    await assertFails(getDocs(collection(stranger, "allowedEmails")));
  });
  it("an approved team member still needs the address on the list", async () => {
    await seed(env, async (db) => {
      await setDoc(doc(db, "clinicStaff", "doc@gmail.com"), { email: "doc@gmail.com", clinicId: "clinicA", clinicName: "A", role: "dentist", branchIds: [], status: "active", active: true });
      await setDoc(doc(db, "config", "access"), { restrict: true });
    });
    const d = asGmail("d1", "doc@gmail.com");
    await assertFails(getDoc(doc(d, "clinics", "clinicA", "patients", "p1")));
    await seed(env, (db) => setDoc(doc(db, "allowedEmails", "doc@gmail.com"), { ok: true }));
    await assertSucceeds(getDoc(doc(d, "clinics", "clinicA", "patients", "p1")));
  });
});

describe("patient portal pages", () => {
  const page = (over = {}) => ({
    clinicId: OWNER, clinicName: "Smile", clinicPhone: "9000000000", upiId: "", patientFirstName: "Asha",
    upcoming: [], bills: [], plans: [], advice: "Rinse with warm salt water", nextVisitOn: "", outstandingP: 0,
    updatedAt: "2026-11-12T00:00:00Z", expiresAt: new Date(Date.now() + 86400000), ...over,
  });
  it("anyone with the link can read one page; nobody can list", async () => {
    await assertSucceeds(setDoc(doc(as(env, OWNER), "portalPages", "tok1"), page()));
    await assertSucceeds(getDoc(doc(anon(env), "portalPages", "tok1")));
    await assertFails(getDocs(collection(anon(env), "portalPages")));
  });
  it("the owner, a manager and a receptionist can publish; a dentist and strangers cannot", async () => {
    await assertSucceeds(setDoc(doc(asEmail("mgr"), "portalPages", "t2"), page()));
    await assertSucceeds(setDoc(doc(asEmail("rec"), "portalPages", "t3"), page()));
    await assertFails(setDoc(doc(asEmail("doc"), "portalPages", "t4"), page()));
    await assertFails(setDoc(doc(as(env, "intruder"), "portalPages", "t5"), page()));
    await assertFails(setDoc(doc(anon(env), "portalPages", "t6"), page()));
  });
  it("rejects extra fields, oversize lists and a page for someone else's clinic", async () => {
    await assertFails(setDoc(doc(as(env, OWNER), "portalPages", "x1"), page({ phone: "9876543210" })));
    await assertFails(setDoc(doc(as(env, OWNER), "portalPages", "x2"), page({ bills: Array.from({ length: 13 }, () => ({})) })));
    await assertFails(setDoc(doc(as(env, OWNER), "portalPages", "x3"), page({ advice: "a".repeat(501) })));
    await assertFails(setDoc(doc(as(env, "intruder"), "portalPages", "x4"), page({ clinicId: OWNER })));
  });
  it("only the clinic changes or deletes it, and cannot hand it to another clinic", async () => {
    await seed(env, (db) => setDoc(doc(db, "portalPages", "tok1"), page()));
    await assertFails(updateDoc(doc(anon(env), "portalPages", "tok1"), { advice: "hacked" }));
    await assertFails(deleteDoc(doc(anon(env), "portalPages", "tok1")));
    await assertFails(setDoc(doc(as(env, "intruder"), "portalPages", "tok1"), page({ clinicId: "intruder" })));
    await assertSucceeds(setDoc(doc(as(env, OWNER), "portalPages", "tok1"), page({ advice: "new" })));
    await assertSucceeds(deleteDoc(doc(asEmail("mgr"), "portalPages", "tok1")));
  });
});

describe("patient photos and X-rays", () => {
  const img = (over = {}) => ({ id: "i1", patientId: "P1", kind: "Before", caption: "", tooth: "", takenOn: "2026-11-12", data: "data:image/jpeg;base64,AAAA", createdAt: "x", by: "Dr", ...over });
  const at = (who) => doc(who, "clinics", OWNER, "patientImages", "i1");
  it("the owner, managers and dentists can add and read; receptionists and strangers cannot", async () => {
    await assertSucceeds(setDoc(at(as(env, OWNER)), img()));
    await assertSucceeds(getDoc(at(as(env, OWNER))));
    await assertSucceeds(setDoc(at(asEmail("mgr")), img()));
    await assertSucceeds(getDoc(at(asEmail("doc"))));
    await assertFails(getDoc(at(asEmail("rec"))));
    await assertFails(setDoc(at(asEmail("rec")), img()));
    await assertFails(getDoc(at(as(env, "intruder"))));
  });
  it("team members cannot store anything but a small JPEG", async () => {
    await assertFails(setDoc(at(asEmail("doc")), img({ data: "data:image/png;base64,AAAA" })));
    await assertFails(setDoc(at(asEmail("doc")), img({ data: "data:image/jpeg;base64," + "A".repeat(200001) })));
    await assertFails(setDoc(at(asEmail("doc")), img({ extra: "x" })));
  });
  it("a dentist can delete a picture", async () => {
    await seed(env, (db) => setDoc(doc(db, "clinics", OWNER, "patientImages", "i1"), img()));
    await assertSucceeds(deleteDoc(at(asEmail("doc"))));
  });
});
