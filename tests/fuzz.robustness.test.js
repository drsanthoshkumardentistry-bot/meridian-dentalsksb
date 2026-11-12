import { describe, it, expect } from "vitest";
import * as pd from "../src/patientDates.js";
import * as bm from "../src/bulkMessage.js";
import * as rf from "../src/referrals.js";
import * as bl from "../src/billing.js";
import * as rm from "../src/reminders.js";
import * as dc from "../src/dayClose.js";
import * as md from "../src/medicines.js";

let seed = 12345; // fixed so a failure repeats; change to explore
const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
const junk = () => pick([undefined, null, "", "  ", "abc", "<script>", "12/13/2026", "31/02/2026", "2026-02-30", 0, -1, NaN, 1e12, {}, [], [null], true, "९८७६५४३२१०", "9876543210", "+91 98765 43210", "0000000000", "x".repeat(500)]);
const patient = () => ({ id: pick(["1", 2, "p3", undefined]), name: junk(), phone: junk(), registeredDate: junk(), visits: pick([undefined, [], [junk()], [{ date: junk() }]]), consent: pick([undefined, null, {}, { whatsapp: false }]), referrals: pick([undefined, [junk()], [{ status: junk(), urgency: junk() }]]) });
const appt = () => ({ patientId: junk(), date: junk(), status: junk() });
const inv = () => ({ patientId: junk(), id: junk(), date: junk(), total: junk(), paid: junk(), items: pick([undefined, [junk()], [{ name: junk(), qty: junk(), price: junk() }]]), payments: pick([undefined, [junk()], [{ date: junk(), amount: junk(), mode: junk() }]]) });
const many = (f) => Array.from({ length: Math.floor(rnd() * 8) }, f);

describe(`fuzz seed ${seed}`, () => {
  it("runs 3000 random rounds without throwing", () => {
    const fails = [];
    for (let i = 0; i < 3000; i++) {
      const P = many(patient), A = many(appt), I = many(inv);
      const calls = {
        patientsInRange: () => pd.patientsInRange(P, { appointments: A, invoices: I }, { mode: pick(["seen", "booked", "registered", junk()]), from: junk(), to: junk() }),
        rangeText: () => pd.rangeText(junk(), junk()),
        presetRange: () => pd.presetRange(pick(["today", "week", "month", "tomorrow", junk()])),
        groupRecipients: () => bm.groupRecipients(pick(["shown", "recall", "balance", "all", junk()]), { patients: P, shown: P, appointments: A, invoices: I }),
        fillMessage: () => bm.fillMessage(junk(), { patient: junk(), clinicName: junk() }),
        cleanReferral: () => rf.cleanReferral({ treatment: junk(), department: pick(["OMFS", "", junk()]), outside: junk(), urgency: junk(), note: junk(), toothRegion: junk() }, { id: "x", today: "d" }),
        openReferrals: () => rf.openReferrals(P),
        slip: () => rf.referralSlipHtml({ treatment: junk(), department: junk(), status: junk() }, patient(), {}),
        invoiceHtml: () => bl.buildInvoiceHtml(bl.normalizeInvoice(inv()), {}, { receipt: rnd() > 0.5 }),
        dueRecalls: () => rm.dueRecalls(P, A, I),
        duePay: () => rm.duePaymentReminders(I, P),
        dueAppt: () => rm.dueAppointmentReminders(A, new Date(), P),
        dayClose: () => dc.dayClose({ invoices: I, appointments: A, patients: P }),
        medicine: () => md.cleanMedicine({ name: junk(), frequency: junk(), duration: junk(), dosage: junk() }),
      };
      for (const [n, f] of Object.entries(calls)) { try { f(); } catch (e) { fails.push(`${n}: ${e.message}`); } }
    }
    const uniq = [...new Set(fails)];
    
    expect(uniq).toEqual([]);
  });
});
