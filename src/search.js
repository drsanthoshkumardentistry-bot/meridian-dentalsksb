const norm = (v) => String(v ?? "").toLowerCase().trim();
const digits = (v) => String(v ?? "").replace(/\D/g, "");

/** Score a field against the query: 3 starts with, 2 word starts with, 1 contains, 0 no match. */
const score = (field, q) => {
  const f = norm(field);
  if (!f) return 0;
  if (f.startsWith(q)) return 3;
  if (f.split(/[\s/-]+/).some((w) => w.startsWith(q))) return 2;
  return f.includes(q) ? 1 : 0;
};

const best = (fields, q) => Math.max(0, ...fields.map((f) => score(f, q)));

/**
 * One search box for patients, appointments and invoices. Phone numbers match on digits only
 * (so "98765" finds "+91 98765 43210"). Returns { patients, appointments, invoices, total }.
 */
export const globalSearch = ({ patients = [], appointments = [], invoices = [] }, query, limit = 5) => {
  const q = norm(query);
  const qd = digits(query);
  const out = { patients: [], appointments: [], invoices: [], total: 0 };
  if (q.length < 2) return out;
  const qNational = qd.length > 5 && qd.startsWith("91") ? qd.slice(2) : qd; // "+91 90000" finds 90000...
  const phoneHit = (phone) => qd.length >= 3 && (digits(phone).includes(qd) || digits(phone).includes(qNational));

  // A damaged or empty record in the saved data must never break the search box.
  const rank = (items, fn) =>
    (Array.isArray(items) ? items : [])
      .filter((x) => x && typeof x === "object")
      .map((item) => ({ item, s: fn(item) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, limit)
      .map((x) => x.item);

  out.patients = rank(patients, (p) => Math.max(best([p.name, p.id, p.email], q), phoneHit(p.phone) ? 2 : 0));
  out.appointments = rank(appointments, (a) => Math.max(best([a.patientName, a.procedure, a.doctor, a.date], q), phoneHit(a.phone) ? 2 : 0));
  out.invoices = rank(invoices, (i) => best([i.id, i.patient, i.treatment], q));
  out.total = out.patients.length + out.appointments.length + out.invoices.length;
  return out;
};
