// Records can arrive damaged: from an old import, a hand-edited backup or a sync from another device.
// These make sure the fields screens call string/array methods on really are strings/arrays, so one bad record
// can never take the whole app down. A record that is already fine is returned as the same object (no copying).
const isObj = (x) => x && typeof x === "object" && !Array.isArray(x);
const str = (v) => (typeof v === "string" ? v : Array.isArray(v) ? v.filter((x) => typeof x === "string" || typeof x === "number").join(", ") : v == null || typeof v === "object" ? "" : String(v));
const arr = (v) => (Array.isArray(v) ? v.filter((x) => x != null) : []);
const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : Number.isFinite(Number(v)) && v !== "" && v != null && typeof v !== "object" ? Number(v) : 0);

const fix = (rec, strings, arrays, numbers = [], required = []) => {
  let out = rec;
  const set = (k, v) => { if (out === rec) out = { ...rec }; out[k] = v; };
  for (const k of strings) if (k in rec && typeof rec[k] !== "string") set(k, str(rec[k]));
  for (const k of arrays) if (k in rec && (!Array.isArray(rec[k]) || rec[k].some((x) => x == null))) set(k, arr(rec[k]));
  for (const k of required) if (typeof (out === rec ? rec[k] : out[k]) !== "string") set(k, "");
  for (const k of numbers) if (k in rec && typeof rec[k] !== "number") set(k, num(rec[k]));
  return out;
};

const mapList = (list, fn) => {
  if (!Array.isArray(list)) return [];
  let changed = false;
  const out = [];
  for (const r of list) {
    if (!isObj(r)) { changed = true; continue; }
    const f = fn(r);
    if (f !== r) changed = true;
    out.push(f);
  }
  return changed ? out : list;
};

export const safePatients = (list) => mapList(list, (p) => {
  return fix(p, ["id", "name", "phone", "age", "gender", "email", "address", "allergies", "conditions", "medicalAlert", "chiefComplaint"], ["visits", "plans", "prescriptions", "referrals", "labels", "cadCases"], [], ["id", "name"]);
});
export const safeAppointments = (list) => mapList(list, (a) => fix(a, ["id", "patientId", "patientName", "phone", "date", "time", "doctor", "procedure", "status"], [], [], ["id", "date", "time"]));
export const safeInvoices = (list) => mapList(list, (v) => fix(v, ["id", "patientId", "patient", "treatment", "date"], ["payments", "items"], ["subtotalP", "taxP", "cgstP", "sgstP", "totalP"], ["id", "date"]));
