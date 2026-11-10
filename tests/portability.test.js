import { describe, it, expect } from "vitest";
import {
  buildBackup, buildPatientBackup, backupFileName, encryptBackup, decryptBackup, validatePassword, parseBackupText, validateBackup, mergeBackup,
  patientsCsv, appointmentsCsv, invoicesDetailCsv, parseCsv, mapHeaders, patientsFromCsv, BACKUP_FORMAT, MAX_RECORDS,
} from "../src/portability.js";

const now = new Date("2026-11-11T08:00:00Z");
const patients = [
  { id: "P-1", name: "Asha Devi", phone: "9876543210", age: "34", toothConditions: { 16: ["CAR"] }, plans: [{ id: "PL1" }], consents: [{ id: "C1" }], branchId: "br2" },
  { id: "P-2", name: "Ravi Kumar", phone: "9123456780", consent: { whatsapp: false } },
];
const appointments = [{ id: "A-1", patientId: "P-1", patientName: "Asha Devi", date: "2026-11-05", time: "10:00", status: "Completed", branchId: "br2" }, { id: "A-2", patientId: "P-2", patientName: "Ravi Kumar", date: "2026-11-06" }];
const invoices = [{ id: "I-1", patientId: "P-1", patient: "Asha Devi", date: "05/11/2026", totalP: 500000, payments: [{ date: "05/11/2026", mode: "Cash", amountP: 200000 }], items: [{ description: "Root canal" }], branchId: "br2" }];
const profile = { name: "Smile Care", branches: [{ id: "main", name: "Main branch" }, { id: "br2", name: "Peelamedu" }] };
const all = { patients, appointments, invoices, inventory: [{ id: "S-1", name: "Gloves" }], employees: [{ id: "E-1", name: "Priya" }], profile };

describe("backups", () => {
  it("includes everything with counts and the branch list", () => {
    const b = buildBackup(all, now);
    expect(b).toMatchObject({ format: BACKUP_FORMAT, version: 1, kind: "clinic", exportedAt: now.toISOString(), source: { clinic: "Smile Care" } });
    expect(b.counts).toEqual({ patients: 2, appointments: 2, invoices: 1, inventory: 1, employees: 1 });
    expect(b.data.branches.map((x) => x.id)).toEqual(["main", "br2"]);
    expect(validateBackup(b)).toEqual({ ok: true });
  });
  it("exports one patient with only their appointments and invoices and their branch", () => {
    const b = buildPatientBackup("P-1", all, profile, now);
    expect(b.kind).toBe("patient");
    expect(b.data.patients.map((p) => p.id)).toEqual(["P-1"]);
    expect(b.data.appointments.map((a) => a.id)).toEqual(["A-1"]);
    expect(b.data.invoices.map((i) => i.id)).toEqual(["I-1"]);
    expect(b.data.branches).toEqual([{ id: "br2", name: "Peelamedu" }]);
    expect(buildPatientBackup("nope", all, profile)).toBeNull();
  });
  it("names files by date and patient", () => {
    expect(backupFileName(buildBackup(all, now), now)).toBe("merident-backup-2026-11-11.json");
    expect(backupFileName(buildPatientBackup("P-1", all, profile, now), now)).toBe("merident-patient-asha-devi-2026-11-11.json");
  });
  it("survives being written to a file and read back", () => {
    const text = JSON.stringify(buildBackup(all, now));
    const r = parseBackupText(text);
    expect(r).toMatchObject({ ok: true, encrypted: false });
    expect(r.backup.data.patients[0].consents).toEqual([{ id: "C1" }]);
  });
});

describe("password protection", () => {
  it("round-trips with the right password and refuses the wrong one", async () => {
    const b = buildBackup(all, now);
    const env = await encryptBackup(b, "correct horse");
    expect(env.format).toBe("merident-backup-encrypted");
    expect(JSON.stringify(env)).not.toContain("Asha");
    expect(parseBackupText(JSON.stringify(env))).toMatchObject({ ok: true, encrypted: true });
    expect((await decryptBackup(env, "correct horse")).backup).toEqual(b);
    expect(await decryptBackup(env, "wrong password")).toEqual({ ok: false, error: "That password does not open this file" });
  });
  it("uses a fresh salt each time and a minimum length", async () => {
    const b = buildBackup({}, now);
    const a = await encryptBackup(b, "password1"), c = await encryptBackup(b, "password1");
    expect(a.salt).not.toBe(c.salt);
    expect(a.data).not.toBe(c.data);
    expect(validatePassword("short")).toMatch(/at least 8/);
    expect(validatePassword("longenough")).toBe("");
    await expect(encryptBackup(b, "short")).rejects.toThrow(/at least 8/);
  });
  it("detects a tampered file", async () => {
    const env = await encryptBackup(buildBackup(all, now), "password1");
    const bad = { ...env, data: env.data.slice(0, -4) + "AAAA" };
    expect((await decryptBackup(bad, "password1")).ok).toBe(false);
  });
});

describe("validateBackup", () => {
  const ok = () => buildBackup(all, now);
  it.each([
    [null, /not a MeriDent backup/], [{}, /not a MeriDent backup/], [{ format: "other", version: 1, data: {} }, /not a MeriDent backup/],
    [{ format: BACKUP_FORMAT, version: 99, data: {} }, /newer version/], [{ format: BACKUP_FORMAT, version: 1 }, /no data/],
  ])("rejects %j", (b, msg) => expect(validateBackup(b).error).toMatch(msg));
  it("rejects bad collections, ids, duplicates and nameless patients", () => {
    const withData = (d) => ({ ...ok(), data: { ...ok().data, ...d } });
    expect(validateBackup(withData({ patients: "x" })).error).toMatch(/damaged/);
    expect(validateBackup(withData({ patients: [{ id: "a/b", name: "X" }] })).error).toMatch(/valid id/);
    expect(validateBackup(withData({ patients: [{ id: "..", name: "X" }] })).error).toMatch(/valid id/);
    expect(validateBackup(withData({ patients: [{ id: "P1", name: "X" }, { id: "P1", name: "Y" }] })).error).toMatch(/twice/);
    expect(validateBackup(withData({ patients: [{ id: "P1", name: " " }] })).error).toMatch(/no name/);
    expect(validateBackup(withData({ branches: "x" })).error).toMatch(/branch list/);
  });
  it("rejects files with far too many records", () => {
    const many = Array.from({ length: MAX_RECORDS + 1 }, (_, i) => ({ id: `A${i}` }));
    expect(validateBackup({ ...ok(), data: { appointments: many } }).error).toMatch(/more than/);
  });
  it("tells a text file that is not JSON", () => expect(parseBackupText("hello")).toEqual({ ok: false, error: "This file is not a MeriDent backup" }));
});

describe("mergeBackup", () => {
  const target = { patients: [], appointments: [], invoices: [], inventory: [], employees: [], profile: { branches: [{ id: "main", name: "Main branch" }] } };
  it("adds everything into an empty clinic and brings missing branches", () => {
    const m = mergeBackup(target, buildBackup(all, now));
    expect(m.merged.patients).toHaveLength(2);
    expect(m.merged.appointments).toHaveLength(2);
    expect(m.addBranches).toEqual([{ id: "br2", name: "Peelamedu" }]);
    expect(m.merged.patients.find((p) => p.id === "P-1").branchId).toBe("br2");
    expect(m.report.patients).toEqual({ added: 2, skipped: 0 });
    expect(m.summary.join(" ")).toContain("2 patients added");
  });
  it("leaves staff alone unless asked", () => {
    expect(mergeBackup(target, buildBackup(all, now)).merged.employees).toEqual([]);
    expect(mergeBackup(target, buildBackup(all, now), { includeStaff: true }).merged.employees).toHaveLength(1);
  });
  it("keeps records already here and changes nothing when imported twice", () => {
    const first = mergeBackup(target, buildBackup(all, now));
    const again = mergeBackup({ ...first.merged, profile: { branches: [...target.profile.branches, ...first.addBranches] } }, buildBackup(all, now));
    expect(again.nothingNew).toBe(true);
    expect(again.report.patients).toEqual({ added: 0, skipped: 2 });
    expect(again.merged.patients).toHaveLength(2);
  });
  it("never overwrites an existing record with the same id", () => {
    const here = { ...target, patients: [{ id: "P-1", name: "Changed Locally" }] };
    const m = mergeBackup(here, buildBackup(all, now));
    expect(m.merged.patients.find((p) => p.id === "P-1").name).toBe("Changed Locally");
    expect(m.report.patients).toEqual({ added: 1, skipped: 1 });
  });
  it("sends records to the main branch when there is no room for their branch", () => {
    const full = { ...target, profile: { branches: Array.from({ length: 10 }, (_, i) => ({ id: i ? `x${i}` : "main", name: `B${i}` })) } };
    const m = mergeBackup(full, buildBackup(all, now));
    expect(m.addBranches).toEqual([]);
    expect(m.merged.patients.find((p) => p.id === "P-1").branchId).toBe("main");
  });
});

describe("spreadsheets", () => {
  it("lists patients with counts and WhatsApp permission", () => {
    const lines = patientsCsv(patients).trim().split("\r\n");
    expect(lines[0]).toContain("Patient ID,Name,Phone");
    expect(lines[1]).toContain("P-1,Asha Devi,9876543210,34");
    expect(lines[1]).toContain(",1,1,0,0,1,Yes,br2");
    expect(lines[2]).toContain(",No,main");
  });
  it("protects against spreadsheet formulas in names", () => {
    expect(patientsCsv([{ id: "P9", name: "=HYPERLINK(\"x\")" }]).split("\r\n")[1]).toContain("'=HYPERLINK");
  });
  it("lists appointments and invoices with money in rupees", () => {
    expect(appointmentsCsv(appointments).split("\r\n")[1]).toContain("A-1,2026-11-05,10:00,Asha Devi");
    expect(invoicesDetailCsv(invoices).split("\r\n")[1]).toContain("I-1,05/11/2026,Asha Devi,5000.00,2000.00,3000.00,Root canal,br2");
  });
});

describe("parseCsv and headers", () => {
  it("handles quotes, commas, doubled quotes and line breaks in cells, BOM and CRLF", () => {
    expect(parseCsv('﻿Name,Note\r\n"Rao, K","said ""hi""\nthere"\r\nAsha,ok\r\n')).toEqual([["Name", "Note"], ["Rao, K", 'said "hi"\nthere'], ["Asha", "ok"]]);
  });
  it("detects semicolons and tabs", () => {
    expect(parseCsv("a;b\n1;2")).toEqual([["a", "b"], ["1", "2"]]);
    expect(parseCsv("a\tb\n1\t2")).toEqual([["a", "b"], ["1", "2"]]);
  });
  it("ignores blank lines", () => expect(parseCsv("a,b\n\n1,2\n,\n")).toEqual([["a", "b"], ["1", "2"]]));
  it("recognises common column names", () => {
    expect(mapHeaders(["Patient Name", "Mobile No", "SEX", "E-mail", "Medical_History", "Age"])).toEqual({ name: 0, phone: 1, gender: 2, email: 3, medicalAlert: 4, age: 5 });
  });
});

describe("patientsFromCsv", () => {
  let n = 0;
  const id = () => `P-new${++n}`;
  const text = "Name,Mobile,Age,Gender,Email\nAsha Devi,+91 98765 43210,34,f,asha@x.com\nRavi,12345,abc,M,\n,9999999999,20,F,\nMeena,9123456781,200,other,";
  it("imports valid rows, cleans phones, and reports what it fixed", () => {
    const r = patientsFromCsv(text, [], id, now);
    expect(r.ok).toBe(true);
    expect(r.patients.map((p) => [p.name, p.phone, p.age, p.gender])).toEqual([["Asha Devi", "9876543210", "34", "Female"], ["Ravi", "", "", "Male"], ["Meena", "9123456781", "", "Other"]]);
    expect(r.problems.join("|")).toMatch(/phone "12345"/);
    expect(r.problems.join("|")).toMatch(/age "abc"/);
    expect(r.problems.join("|")).toMatch(/Row 4: no name/);
    expect(r.problems.join("|")).toMatch(/age "200"/);
  });
  it("makes complete patient records that never allow WhatsApp until the patient agrees", () => {
    const p = patientsFromCsv(text, [], id, now).patients[0];
    expect(p.consent).toMatchObject({ treatment: false, whatsapp: false });
    expect(p).toMatchObject({ toothConditions: {}, prescriptions: [], referrals: [], systemic: {}, habits: {} });
    expect(p.diagnosis.trauma).toBeTruthy();
  });
  it("skips people already in the clinic and repeats within the file", () => {
    const r = patientsFromCsv("Name,Phone\nAsha Devi,9876543210\nasha devi,98765 43210\nNew One,9111111111\nNew One,9111111111", patients, id, now);
    expect(r.patients.map((p) => p.name)).toEqual(["New One"]);
    expect(r.skipped).toBe(3);
  });
  it("explains a missing Name column or an empty file", () => {
    expect(patientsFromCsv("Phone,Age\n9876543210,30", [], id).error).toMatch(/No Name column/);
    expect(patientsFromCsv("Name\n", [], id).error).toMatch(/header row and at least one/);
  });
  it("limits the size of one import", () => {
    const big = "Name\n" + Array.from({ length: 5001 }, (_, i) => `P${i}`).join("\n");
    expect(patientsFromCsv(big, [], id).error).toMatch(/at most 5,000/);
  });
});
