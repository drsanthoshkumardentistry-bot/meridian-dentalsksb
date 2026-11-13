/* ==============================================================================
 * MERIDENT OS - DATA PORTABILITY (pure functions, no React)
 * Download everything, move a patient to another clinic, bring records in from another system.
 *  - Backup file (JSON): complete and re-importable into any MeriDent clinic. Optionally password-protected.
 *  - Spreadsheets (CSV): readable in Excel or Google Sheets, for the clinic or its accountant.
 *  - Patient list import (CSV): the first step when moving from paper, Excel or other software.
 * ============================================================================== */

import { MAIN_ID, MAX_BRANCHES, branchesOf, recordsOfPatient } from "./branches.js";
import { normalizeInvoice, balancePaise } from "./billing.js";
import { toCsv } from "./reports.js";
import { whatsappNumber } from "./reminders.js";

export const BACKUP_FORMAT = "merident-backup";
export const ENCRYPTED_FORMAT = "merident-backup-encrypted";
export const BACKUP_VERSION = 1;
export const MAX_RECORDS = 20000;
export const MIN_PASSWORD = 8;
const KDF_ITERATIONS = 250000;
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/; // used as Firestore document ids, so no slashes

const plain = (v) => v && typeof v === "object" && !Array.isArray(v);
// Keys that JSON can carry but that break string conversion or the prototype chain when a record is later read.
const UNSAFE_KEYS = ["toString", "valueOf", "__proto__"];
const hasUnsafeKey = (v, depth = 0) => {
  if (!v || typeof v !== "object" || depth > 8) return false;
  if (Array.isArray(v)) return v.some((x) => hasUnsafeKey(x, depth + 1));
  return Object.keys(v).some((k) => UNSAFE_KEYS.includes(k) || hasUnsafeKey(v[k], depth + 1));
};
const COLLECTIONS = ["patients", "appointments", "invoices", "inventory", "employees"];

/* ------------------------------- Building a backup ------------------------------- */

const counts = (data) => Object.fromEntries(COLLECTIONS.filter((k) => Array.isArray(data[k])).map((k) => [k, data[k].length]));

/** Everything the clinic holds. `profile` brings the branch list along so records land in the right branch. */
export const buildBackup = ({ patients = [], appointments = [], invoices = [], inventory = [], employees = [], profile = {} } = {}, now = new Date()) => {
  const data = { patients, appointments, invoices, inventory, employees, branches: branchesOf(profile) };
  if (Array.isArray(profile.expenses) && profile.expenses.length) data.expenses = profile.expenses;
  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, kind: "clinic", exportedAt: now.toISOString(), source: { clinic: String(profile.name || "") }, counts: counts(data), data };
};

/** One patient with their appointments and invoices, ready to open in another clinic's MeriDent. */
export const buildPatientBackup = (patientId, all = {}, profile = {}, now = new Date()) => {
  const patient = (all.patients || []).find((p) => p.id === patientId);
  if (!patient) return null;
  const rec = recordsOfPatient(patient, all);
  const branches = branchesOf(profile).filter((b) => (patient.branchId || MAIN_ID) === b.id);
  const data = { patients: [patient], appointments: rec.appointments, invoices: rec.invoices, branches };
  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, kind: "patient", exportedAt: now.toISOString(), source: { clinic: String(profile.name || "") }, counts: counts(data), data };
};

export const backupFileName = (backup, now = new Date()) => {
  const day = now.toISOString().slice(0, 10);
  if (backup.kind === "patient") {
    const name = String(backup.data.patients[0]?.name || "patient").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30) || "patient";
    return `merident-patient-${name}-${day}.json`;
  }
  return `merident-backup-${day}.json`;
};

/* ------------------------------- Password protection ------------------------------- */

const b64 = (bytes) => { let s = ""; new Uint8Array(bytes).forEach((b) => (s += String.fromCharCode(b))); return btoa(s); };
const unb64 = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0));

const deriveKey = async (password, salt, iterations, subtle) => {
  const base = await subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return subtle.deriveKey({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
};

export const validatePassword = (pw) => (String(pw || "").length < MIN_PASSWORD ? `Use at least ${MIN_PASSWORD} characters` : "");

/** AES-256-GCM with a key derived from the password (PBKDF2, 250,000 rounds). The password is never stored. */
export const encryptBackup = async (backup, password, cryptoLike = globalThis.crypto) => {
  const err = validatePassword(password);
  if (err) throw new Error(err);
  const salt = cryptoLike.getRandomValues(new Uint8Array(16));
  const iv = cryptoLike.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, KDF_ITERATIONS, cryptoLike.subtle);
  const cipher = await cryptoLike.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(backup)));
  return { format: ENCRYPTED_FORMAT, version: BACKUP_VERSION, kdf: "PBKDF2-SHA256", iterations: KDF_ITERATIONS, salt: b64(salt), iv: b64(iv), data: b64(cipher) };
};

export const decryptBackup = async (envelope, password, cryptoLike = globalThis.crypto) => {
  try {
    const key = await deriveKey(password, unb64(envelope.salt), Number(envelope.iterations) || KDF_ITERATIONS, cryptoLike.subtle);
    const plainBytes = await cryptoLike.subtle.decrypt({ name: "AES-GCM", iv: unb64(envelope.iv) }, key, unb64(envelope.data));
    return { ok: true, backup: JSON.parse(new TextDecoder().decode(plainBytes)) };
  } catch {
    return { ok: false, error: "That password does not open this file" };
  }
};

/* ------------------------------- Reading a backup ------------------------------- */

/** Parse the text of a chosen file. Tells the caller when a password is needed. */
export const parseBackupText = (text) => {
  let obj;
  try { obj = JSON.parse(String(text || "").replace(/^﻿/, "")); } catch { return { ok: false, error: "This file is not a MeriDent backup" }; }
  if (plain(obj) && obj.format === ENCRYPTED_FORMAT) return { ok: true, encrypted: true, envelope: obj };
  return { ok: true, encrypted: false, backup: obj };
};

/** Checks the structure so a wrong or damaged file cannot put bad records into the clinic. */
export const validateBackup = (b) => {
  if (!plain(b) || b.format !== BACKUP_FORMAT) return { ok: false, error: "This file is not a MeriDent backup" };
  if (!Number.isInteger(b.version) || b.version > BACKUP_VERSION) return { ok: false, error: "This backup was made by a newer version of MeriDent. Update the app and try again" };
  if (!plain(b.data)) return { ok: false, error: "The backup has no data" };
  let total = 0;
  for (const key of COLLECTIONS) {
    const list = b.data[key];
    if (list === undefined) continue;
    if (!Array.isArray(list)) return { ok: false, error: `The ${key} in this backup are damaged` };
    total += list.length;
    const seen = new Set();
    for (const rec of list) {
      if (!plain(rec) || typeof rec.id !== "string" || !ID_RE.test(rec.id)) return { ok: false, error: `A record in ${key} has no valid id. The file may be damaged` };
      if (hasUnsafeKey(rec)) return { ok: false, error: `A record in ${key} has unreadable fields. The file may be damaged` };
      if (seen.has(rec.id)) return { ok: false, error: `The backup lists the same ${key.replace(/s$/, "")} twice` };
      seen.add(rec.id);
    }
  }
  if (total > MAX_RECORDS) return { ok: false, error: `This backup has more than ${MAX_RECORDS.toLocaleString("en-IN")} records. Contact us to move it in` };
  if ((b.data.patients || []).some((p) => typeof p.name !== "string" || !p.name.trim())) return { ok: false, error: "A patient in this backup has no name. The file may be damaged" };
  if (b.data.expenses !== undefined) {
    if (!Array.isArray(b.data.expenses) || b.data.expenses.length > 5000) return { ok: false, error: "The expenses in this backup are damaged" };
    if (b.data.expenses.some((e) => !plain(e) || typeof e.id !== "string" || !ID_RE.test(e.id) || !Number.isFinite(e.amountP) || hasUnsafeKey(e))) return { ok: false, error: "An expense in this backup is damaged. The file may be damaged" };
  }
  if (b.data.branches !== undefined && !Array.isArray(b.data.branches)) return { ok: false, error: "The branch list in this backup is damaged" };
  return { ok: true };
};

/* ------------------------------- Merging into the clinic ------------------------------- */

const label = { patients: "patients", appointments: "appointments", invoices: "invoices", inventory: "stock items", employees: "staff" };

/**
 * What an import would do, and the merged lists. Records already in the clinic (same id) are kept as they are,
 * so importing the same file twice changes nothing. Branches the clinic lacks are added; if there is no room
 * (10 branches) those records go to the main branch.
 */
export const mergeBackup = (current = {}, backup, { includeStaff = false } = {}) => {
  const src = backup.data;
  const curBranches = branchesOf(current.profile);
  const known = new Set(curBranches.map((b) => b.id));
  const addBranches = [];
  for (const b of Array.isArray(src.branches) ? src.branches : []) {
    if (!plain(b) || !ID_RE.test(String(b.id)) || !String(b.name || "").trim() || known.has(b.id)) continue;
    if (curBranches.length + addBranches.length >= MAX_BRANCHES) continue;
    addBranches.push({ id: b.id, name: String(b.name).trim().slice(0, 40) });
    known.add(b.id);
  }
  const place = (rec) => (rec.branchId && !known.has(rec.branchId) ? { ...rec, branchId: MAIN_ID } : rec);

  const merged = {};
  const report = {};
  for (const key of COLLECTIONS) {
    if ((key === "employees") && !includeStaff) { merged[key] = current[key] || []; continue; }
    const incoming = Array.isArray(src[key]) ? src[key] : [];
    const have = new Set((current[key] || []).map((r) => r.id));
    const fresh = incoming.filter((r) => !have.has(r.id)).map(key === "inventory" || key === "employees" ? (r) => r : place);
    merged[key] = [...fresh, ...(current[key] || [])];
    report[key] = { added: fresh.length, skipped: incoming.length - fresh.length };
  }
  // Appointments and invoices whose patient is not here yet still import; they link by patientId once the patient exists.
  const summary = Object.entries(report).filter(([, r]) => r.added || r.skipped).map(([k, r]) => `${r.added} ${label[k]} added${r.skipped ? `, ${r.skipped} already here` : ""}`);
  // Expenses already here (same id) stay as they are, so importing twice changes nothing.
  const haveExp = new Set((current.profile?.expenses || []).map((e) => e && e.id));
  const freshExp = (Array.isArray(src.expenses) ? src.expenses : []).filter((e) => !haveExp.has(e.id));
  if (freshExp.length) summary.push(`${freshExp.length} expenses added`);
  const expenses = freshExp.length ? [...freshExp, ...(current.profile?.expenses || [])].slice(0, 5000) : null;
  return { merged, report, addBranches, expenses, summary, nothingNew: Object.values(report).every((r) => r.added === 0) && addBranches.length === 0 && freshExp.length === 0 };
};

/* ------------------------------- Spreadsheets ------------------------------- */

const yn = (v) => (v ? "Yes" : "No");
const teethCharted = (p) => Object.keys(p.toothConditions || {}).length;

export const patientsCsv = (patients = []) =>
  toCsv([
    ["Patient ID", "Name", "Phone", "Age", "Gender", "Email", "Address", "Registered", "Medical alert", "Allergies", "Teeth charted", "Treatment plans", "Prescriptions", "Visit notes", "Signed consents", "WhatsApp allowed", "Branch"],
    ...patients.map((p) => [p.id, p.name, p.phone, p.age, p.gender, p.email, p.address, p.registeredDate, p.medicalAlert, p.allergies, teethCharted(p), (p.plans || []).length, (p.prescriptions || []).length, (p.visits || []).length, (p.consents || []).length, yn(!p.consent || p.consent.whatsapp !== false), p.branchId || MAIN_ID]),
  ]);

export const appointmentsCsv = (appointments = []) =>
  toCsv([
    ["Appointment ID", "Date", "Time", "Patient", "Phone", "Doctor", "Chair", "Procedure", "Status", "Branch"],
    ...appointments.map((a) => [a.id, a.date, a.time, a.patientName, a.phone, a.doctor, a.chair, a.procedure, a.status, a.branchId || MAIN_ID]),
  ]);

export const invoicesDetailCsv = (invoices = []) =>
  toCsv([
    ["Invoice", "Date", "Patient", "Total (Rs)", "Paid (Rs)", "Balance (Rs)", "Items", "Branch"],
    ...invoices.map(normalizeInvoice).map((i) => {
      const paid = (i.payments || []).reduce((s, p) => s + (p.amountP || 0), 0);
      return [i.id, i.date, i.patient, (i.totalP / 100).toFixed(2), (paid / 100).toFixed(2), (balancePaise(i) / 100).toFixed(2), (i.items || []).map((x) => x.description).filter(Boolean).join("; "), i.branchId || MAIN_ID];
    }),
  ]);

/* ------------------------------- Patient list import (CSV) ------------------------------- */

/** Reads CSV or tab/semicolon separated text, with quoted cells, doubled quotes and line breaks inside quotes. */
export const parseCsv = (text) => {
  const src = String(text || "").replace(/^﻿/, "");
  const first = src.split(/\r?\n/, 1)[0] || "";
  const delim = [",", ";", "\t"].map((d) => [d, first.split(d).length]).sort((a, b) => b[1] - a[1])[0][0];
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') quoted = false; else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && src[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => String(c).trim() !== ""));
};

const HEADERS = {
  name: ["name", "patient name", "patient", "full name"],
  phone: ["phone", "mobile", "mobile number", "mobile no", "contact", "contact number", "phone number", "whatsapp"],
  age: ["age"],
  gender: ["gender", "sex"],
  email: ["email", "email id", "e-mail"],
  address: ["address", "city", "location"],
  medicalAlert: ["medical alert", "alert", "medical history", "conditions", "medical conditions"],
  allergies: ["allergies", "allergy"],
};
const norm = (h) => String(h || "").trim().toLowerCase().replace(/[_.]+/g, " ").replace(/\s+/g, " ");

export const mapHeaders = (header = []) => {
  const map = {};
  header.forEach((h, i) => {
    const n = norm(h);
    for (const [field, names] of Object.entries(HEADERS)) if (map[field] === undefined && names.includes(n)) map[field] = i;
  });
  return map;
};

const cleanPhone = (v) => {
  const d = String(v || "").replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) return d.slice(2);
  if (d.length === 11 && d.startsWith("0")) return d.slice(1);
  return d;
};
const GENDERS = { m: "Male", male: "Male", f: "Female", female: "Female", o: "Other", other: "Other" };

/**
 * Turns CSV rows into patients. Rows without a name are skipped; a phone that is not a 10-digit mobile is left blank
 * and reported. A person already in the clinic (same name and phone) is skipped, so importing twice is safe.
 */
export const patientsFromCsv = (text, existing = [], makeId, now = new Date()) => {
  const rows = parseCsv(text);
  if (rows.length < 2) return { ok: false, error: "The file needs a header row and at least one patient" };
  const map = mapHeaders(rows[0]);
  if (map.name === undefined) return { ok: false, error: "No Name column found. Add a column headed Name (and Phone, Age, Gender if you have them)" };
  if (rows.length - 1 > 5000) return { ok: false, error: "Import at most 5,000 patients at a time" };
  const key = (name, phone) => `${String(name).trim().toLowerCase()}|${phone}`;
  const seen = new Set(existing.map((p) => key(p.name, cleanPhone(p.phone))));
  const patients = [];
  const problems = [];
  let skipped = 0;
  rows.slice(1).forEach((r, i) => {
    const line = i + 2;
    const get = (f) => (map[f] === undefined ? "" : String(r[map[f]] ?? "").trim());
    const name = get("name").slice(0, 80);
    if (!name) { problems.push(`Row ${line}: no name, skipped`); return; }
    const rawPhone = get("phone");
    let phone = cleanPhone(rawPhone);
    if (rawPhone && !whatsappNumber(phone)) { problems.push(`Row ${line} (${name}): phone "${rawPhone}" is not a 10-digit mobile, left blank`); phone = ""; }
    if (seen.has(key(name, phone))) { skipped += 1; return; }
    seen.add(key(name, phone));
    const age = get("age");
    const ageNum = /^\d{1,3}$/.test(age) && Number(age) <= 120 ? String(Number(age)) : "";
    if (age && !ageNum) problems.push(`Row ${line} (${name}): age "${age}" ignored`);
    patients.push({
      id: makeId(),
      name,
      phone,
      age: ageNum,
      gender: GENDERS[get("gender").toLowerCase()] || "",
      email: get("email").slice(0, 100),
      address: get("address").slice(0, 200),
      medicalAlert: get("medicalAlert").slice(0, 200),
      allergies: get("allergies").slice(0, 200),
      consent: { treatment: false, whatsapp: false, recordedAt: now.toISOString() },
      systemic: {}, habits: {},
      registeredDate: now.toLocaleDateString("en-IN"),
      toothConditions: {}, opgImage: null,
      diagnosis: { trauma: "No acute trauma recorded.", impaction: "None charted.", boneDeformations: "Normal bone crest height.", diagnosisNotes: "No diagnostic notes entered." },
      prescriptions: [], referrals: [],
    });
  });
  return { ok: true, patients, skipped, problems, columns: Object.keys(map) };
};
