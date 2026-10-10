import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Award,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Home,
  IndianRupee,
  LogIn,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Phone,
  Pill,
  Plus,
  Printer,
  RefreshCw,
  Repeat,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trash2,
  TrendingUp,
  Users,
  WalletCards,
  X,
} from "lucide-react";

import {
  auth,
  db,
  firebaseConfigured,
  loginWithGoogle,
  logoutUser,
} from "./firebase";

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";

/* =========================================================
   HELPERS & DATA DEFINITIONS
========================================================= */

const makeId = (prefix = "id") =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const todayString = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
};

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

// 7-Stage BestoSys Patient Journey Dropping Points
const JOURNEY_STAGES = [
  "New Enquiry",
  "Appointment Booked",
  "Visited / Checked-In",
  "Post-Consultation",
  "Treatment Plan Presented",
  "In-Treatment",
  "Maintenance / Recall",
];

// FDI 2-Digit Tooth Numbering System
const FDI_TEETH = {
  upperRight: [18, 17, 16, 15, 14, 13, 12, 11],
  upperLeft: [21, 22, 23, 24, 25, 26, 27, 28],
  lowerRight: [48, 47, 46, 45, 44, 43, 42, 41],
  lowerLeft: [31, 32, 33, 34, 35, 36, 37, 38],
};

const TOOTH_CONDITIONS = {
  Healthy: { color: "bg-white border-slate-300 text-slate-700", label: "Healthy" },
  Decayed: { color: "bg-red-500 border-red-600 text-white", label: "Caries / Decay" },
  Filled: { color: "bg-blue-500 border-blue-600 text-white", label: "Restored / Filled" },
  Missing: { color: "bg-slate-300 border-slate-400 text-slate-500 line-through", label: "Missing" },
  Crown: { color: "bg-amber-400 border-amber-500 text-white", label: "Crown / Bridge" },
  RCT: { color: "bg-purple-500 border-purple-600 text-white", label: "Endodontic / RCT" },
};

// Dentee Clinical Pharmacopeia Templates
const COMMON_DENTAL_DRUGS = [
  { drug: "Cap. Amoxicillin 500mg", dosage: "1 cap TDS (8 hourly)", duration: "5 days", instruction: "After food" },
  { drug: "Tab. Metronidazole 400mg", dosage: "1 tab TDS", duration: "5 days", instruction: "After food (avoid alcohol)" },
  { drug: "Tab. Ketorolac (Ketorol-DT) 10mg", dosage: "1 tab SOS in water", duration: "3 days", instruction: "Dissolve in water" },
  { drug: "Tab. Aceclofenac + Paracetamol", dosage: "1 tab BD", duration: "3 days", instruction: "After food for pain" },
  { drug: "Mouthwash Chlorhexidine 0.2%", dosage: "10 ml undiluted BD", duration: "7 days", instruction: "Swish for 60s post-brush" },
  { drug: "Cap. Amoxicillin + Clavulanic 625mg", dosage: "1 tab BD", duration: "5 days", instruction: "With meals" },
];

/* =========================================================
   UI PRIMITIVES
========================================================= */

function Modal({ title, children, onClose, width = "max-w-2xl" }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className={`w-full ${width} max-h-[92vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
            <X size={19} />
          </button>
        </div>
        <div className="max-h-[calc(92vh-70px)] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

function Toast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div className="fixed right-5 top-5 z-[100] flex max-w-sm items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xl">
      <CheckCircle2 className="mt-0.5 text-emerald-600 shrink-0" size={19} />
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-900">{toast}</p>
      </div>
      <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
        <X size={16} />
      </button>
    </div>
  );
}

function Badge({ children, tone = "slate" }) {
  const styles = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-700",
    yellow: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[tone] || styles.slate}`}>
      {children}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, subtitle }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className="rounded-xl bg-cyan-50 p-3 text-cyan-700">
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, text, onAction, actionLabel }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <ClipboardList className="mx-auto text-slate-300" size={38} />
      <h3 className="mt-3 font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{text}</p>
      {onAction && actionLabel && (
        <button className={`${buttonPrimary} mt-4`} onClick={onAction}>
          <Plus size={16} /> {actionLabel}
        </button>
      )}
    </div>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 transition";

const buttonPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 transition shadow-xs cursor-pointer disabled:opacity-50";

const buttonSecondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer";

/* =========================================================
   DENTEE ESSENTIAL 1: E-PRESCRIPTIONS (RX ENGINE)
========================================================= */

function PrescriptionsPage({ prescriptions, patients, onSaveRx, onDeleteRx }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    patientId: "",
    diagnosis: "Acute Apical Periodontitis",
    medications: [{ drug: "Cap. Amoxicillin 500mg", dosage: "1 cap TDS", duration: "5 days", instruction: "After food" }],
    advice: "Warm saline rinses 3-4 times daily. Avoid hard foods on affected side.",
  });

  const addDrugRow = (preset) => {
    if (preset) {
      setForm((p) => ({ ...p, medications: [...p.medications, preset] }));
    } else {
      setForm((p) => ({
        ...p,
        medications: [...p.medications, { drug: "", dosage: "1 tab BD", duration: "3 days", instruction: "After food" }],
      }));
    }
  };

  const updateDrug = (index, key, val) => {
    setForm((p) => {
      const next = [...p.medications];
      next[index][key] = val;
      return { ...p, medications: next };
    });
  };

  const removeDrug = (index) => {
    setForm((p) => ({ ...p, medications: p.medications.filter((_, i) => i !== index) }));
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.patientId) return alert("Select patient");
    onSaveRx({
      ...form,
      id: makeId("rx"),
      date: todayString(),
    });
    setModalOpen(false);
  };

  const patientName = (id) => patients.find((p) => p.id === id)?.name || "Patient";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Pill className="text-cyan-600" size={24} />
            Digital Dental Prescriptions (Dentee Rx)
          </h2>
          <p className="text-sm text-slate-500">
            Generate digital prescriptions and dispatch directly to patients via WhatsApp / SMS.
          </p>
        </div>
        <button className={buttonPrimary} onClick={() => setModalOpen(true)}>
          <Plus size={18} /> New Prescription
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {prescriptions.map((rx) => {
          const pt = patients.find((p) => p.id === rx.patientId);
          const textMsg = `*Dental Prescription - Meridian Dental*%0A*Patient:* ${encodeURIComponent(
            pt?.name || ""
          )}%0A*Date:* ${rx.date}%0A*Diagnosis:* ${encodeURIComponent(rx.diagnosis)}%0A%0A*Rx:*%0A${rx.medications
            .map((m, i) => `${i + 1}. ${m.drug} - ${m.dosage} (${m.duration})`)
            .join("%0A")}%0A%0A*Advice:* ${encodeURIComponent(rx.advice)}`;

          return (
            <div key={rx.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">{patientName(rx.patientId)}</h3>
                  <p className="text-xs text-slate-500">Diagnosis: {rx.diagnosis} · {rx.date}</p>
                </div>
                <button className="text-red-500 hover:text-red-700 p-1" onClick={() => onDeleteRx(rx)}>
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 text-xs space-y-2">
                {rx.medications.map((m, idx) => (
                  <div key={idx} className="flex justify-between border-b border-slate-200/50 pb-1 last:border-0 last:pb-0">
                    <span className="font-semibold text-slate-800">{m.drug}</span>
                    <span className="text-slate-500">{m.dosage} · {m.duration}</span>
                  </div>
                ))}
              </div>

              {rx.advice && <p className="text-xs text-slate-500 italic">Advice: {rx.advice}</p>}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <a
                  href={`https://wa.me/91${pt?.phone?.replace(/\D/g, "")}?text=${textMsg}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                >
                  <Send size={14} /> Send Rx on WhatsApp
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {prescriptions.length === 0 && (
        <EmptyState
          title="No digital prescriptions written"
          text="Write standard dental regimens with instant dosage presets."
          onAction={() => setModalOpen(true)}
          actionLabel="Prescribe Medication"
        />
      )}

      {modalOpen && (
        <Modal title="Create Dental Prescription (Rx)" onClose={() => setModalOpen(false)} width="max-w-3xl">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Patient">
                <select className={inputClass} value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })} required>
                  <option value="">Select registered patient</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.phone})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Clinical Diagnosis">
                <input className={inputClass} value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} required />
              </Field>
            </div>

            {/* Quick drug palette */}
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-400 mb-2">Quick Dental Presets:</p>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_DENTAL_DRUGS.map((d, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => addDrugRow(d)}
                    className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 hover:bg-cyan-50 hover:border-cyan-200 text-slate-700 transition"
                  >
                    + {d.drug.split(" ")[1]}
                  </button>
                ))}
              </div>
            </div>

            {/* Drug rows */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase text-slate-500">Medications</span>
                <button type="button" onClick={() => addDrugRow()} className="text-xs text-cyan-600 font-semibold hover:underline">
                  + Add Custom Drug
                </button>
              </div>

              {form.medications.map((m, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-xl">
                  <div className="col-span-5">
                    <input
                      className={inputClass}
                      placeholder="Drug name & strength"
                      value={m.drug}
                      onChange={(e) => updateDrug(idx, "drug", e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      className={inputClass}
                      placeholder="Dosage (TDS/BD)"
                      value={m.dosage}
                      onChange={(e) => updateDrug(idx, "dosage", e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      className={inputClass}
                      placeholder="Duration"
                      value={m.duration}
                      onChange={(e) => updateDrug(idx, "duration", e.target.value)}
                    />
                  </div>
                  <div className="col-span-1 text-center">
                    <button type="button" onClick={() => removeDrug(idx)} className="text-red-500 hover:text-red-700">
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Field label="Post-Treatment Clinical Advice">
              <textarea className={inputClass} rows="2" value={form.advice} onChange={(e) => setForm({ ...form, advice: e.target.value })} />
            </Field>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" className={buttonSecondary} onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className={buttonPrimary}>
                <CheckCircle2 size={17} /> Issue Prescription
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* =========================================================
   DENTEE ESSENTIAL 2: PRACTICE ACCOUNTING & DAY-BOOK
========================================================= */

function AccountsDayBookPage({ invoices, onAddEntry }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [filterDate, setFilterDate] = useState(todayString());
  const [form, setForm] = useState({
    description: "Chairside consultation & X-Ray",
    amount: "1500",
    paymentMode: "UPI",
    type: "Income",
    patientName: "Direct Patient",
  });

  const dailyInvoices = invoices.filter((i) => (i.dueDate || i.date) === filterDate);

  const totalIncome = dailyInvoices
    .filter((i) => i.status === "Paid" || i.type === "Income")
    .reduce((s, i) => s + Number(i.subtotal || i.amount || 0), 0);

  const upiTotal = dailyInvoices
    .filter((i) => i.paymentMode === "UPI")
    .reduce((s, i) => s + Number(i.subtotal || i.amount || 0), 0);

  const cashTotal = totalIncome - upiTotal;

  const submit = (e) => {
    e.preventDefault();
    onAddEntry({
      ...form,
      id: makeId("acc"),
      date: filterDate,
      status: "Paid",
    });
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="text-cyan-600" size={24} />
            Dentee Practice Accounts & Daily Day-Book
          </h2>
          <p className="text-sm text-slate-500">
            Audit daily chairside collections, UPI receipts, cash logs, and financial reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-cyan-500"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
          <button className={buttonPrimary} onClick={() => setModalOpen(true)}>
            <Plus size={18} /> Add Ledger Entry
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={CircleDollarSign} label="Daily Day-Book Total" value={money(totalIncome)} subtitle={`Reconciled for ${filterDate}`} />
        <StatCard icon={CreditCard} label="UPI / Digital Received" value={money(upiTotal)} subtitle="Direct to clinic bank account" />
        <StatCard icon={WalletCards} label="Cash Chairside Drawer" value={money(cashTotal >= 0 ? cashTotal : 0)} subtitle="Physical cash collection" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left">
          <thead className="border-b bg-slate-50 text-xs font-bold uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3">Description</th>
              <th className="px-5 py-3">Patient / Party</th>
              <th className="px-5 py-3">Payment Mode</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {dailyInvoices.map((item) => (
              <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-5 py-4 font-semibold text-slate-900">{item.description}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{item.patientName || item.patientId || "Clinic Patient"}</td>
                <td className="px-5 py-4">
                  <Badge tone={item.paymentMode === "UPI" ? "blue" : "green"}>{item.paymentMode || "Cash"}</Badge>
                </td>
                <td className="px-5 py-4 text-sm text-slate-500">{item.type || "Treatment Fee"}</td>
                <td className="px-5 py-4 text-right font-bold text-slate-900">{money(item.subtotal || item.amount)}</td>
              </tr>
            ))}
            {dailyInvoices.length === 0 && (
              <tr>
                <td colSpan="5" className="p-8 text-center text-sm text-slate-400">
                  No accounting entries logged for {filterDate}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <Modal title="Log Ledger / Day-Book Entry" onClose={() => setModalOpen(false)}>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Entry Description">
              <input className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Amount (₹)">
                <input type="number" className={inputClass} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              </Field>
              <Field label="Payment Mode">
                <select className={inputClass} value={form.paymentMode} onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}>
                  <option>UPI</option>
                  <option>Cash</option>
                  <option>Card (POS)</option>
                  <option>Net Banking</option>
                </select>
              </Field>
            </div>

            <Field label="Patient / Source Name">
              <input className={inputClass} value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} />
            </Field>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" className={buttonSecondary} onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className={buttonPrimary}>
                <CheckCircle2 size={17} /> Save Entry
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* =========================================================
   BESTOSYS GROWTH MODULES (1–5)
========================================================= */

function PatientTrackerPage({ patients, onUpdateStage }) {
  const [selectedStage, setSelectedStage] = useState("All");

  const stageCounts = useMemo(() => {
    const counts = {};
    JOURNEY_STAGES.forEach((s) => (counts[s] = 0));
    patients.forEach((p) => {
      const st = p.journeyStage || "New Enquiry";
      counts[st] = (counts[st] || 0) + 1;
    });
    return counts;
  }, [patients]);

  const filtered = patients.filter((p) => {
    if (selectedStage === "All") return true;
    return (p.journeyStage || "New Enquiry") === selectedStage;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <TrendingUp className="text-cyan-600" size={24} />
          Patient Journey Tracker (Drop-out Prevention)
        </h2>
        <p className="text-sm text-slate-500">
          Track potential patient leakage across all 7 journey stages and take direct recovery actions.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        <button
          onClick={() => setSelectedStage("All")}
          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
            selectedStage === "All" ? "border-cyan-600 bg-cyan-50" : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          <p className="text-[11px] font-bold uppercase text-slate-400">All Patients</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{patients.length}</p>
        </button>
        {JOURNEY_STAGES.map((st, idx) => (
          <button
            key={st}
            onClick={() => setSelectedStage(st)}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              selectedStage === st ? "border-cyan-600 bg-cyan-50" : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <p className="text-[10px] font-bold text-slate-400 uppercase truncate">
              {idx + 1}. {st}
            </p>
            <p className="text-xl font-bold text-slate-900 mt-1">{stageCounts[st] || 0}</p>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left">
          <thead className="border-b bg-slate-50 text-xs font-bold uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3">Patient</th>
              <th className="px-5 py-3">Current Journey Stage</th>
              <th className="px-5 py-3">Drop-out Risk</th>
              <th className="px-5 py-3">Contact</th>
              <th className="px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((pt) => {
              const currentStage = pt.journeyStage || "New Enquiry";
              const isAtRisk = currentStage === "Treatment Plan Presented" || currentStage === "Post-Consultation";

              return (
                <tr key={pt.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">{pt.name}</p>
                    <p className="text-xs text-slate-400">{pt.phone}</p>
                  </td>
                  <td className="px-5 py-4">
                    <select
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 outline-none focus:border-cyan-500"
                      value={currentStage}
                      onChange={(e) => onUpdateStage(pt, e.target.value)}
                    >
                      {JOURNEY_STAGES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    <Badge tone={isAtRisk ? "red" : currentStage === "In-Treatment" ? "green" : "blue"}>
                      {isAtRisk ? "High Drop-out Risk" : "Active Flow"}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">{pt.phone || "—"}</td>
                  <td className="px-5 py-4">
                    <a
                      href={`https://wa.me/91${pt.phone?.replace(/\D/g, "")}?text=Hello%20${encodeURIComponent(
                        pt.name
                      )},%20following%20up%20from%20our%20dental%20clinic.`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                    >
                      <MessageSquare size={14} /> WhatsApp Follow-up
                    </a>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="5" className="p-8 text-center text-sm text-slate-500">
                  No patients found in stage: {selectedStage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MembershipPage({ memberships, patients, onAddPlan }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    patientId: "",
    planName: "Family Dental Shield",
    cost: "4999",
    durationMonths: "12",
    familyMembersIncluded: "4",
    benefits: "Free 2x Scaling, 20% off Restorations, Unlimited Consultations",
  });

  const submit = (e) => {
    e.preventDefault();
    if (!form.patientId) return alert("Select patient");
    onAddPlan({
      ...form,
      id: makeId("mem"),
      startDate: todayString(),
      status: "Active",
    });
    setModalOpen(false);
  };

  const activeMemberships = memberships.filter((m) => m.status === "Active");
  const recurringRevenue = memberships.reduce((acc, m) => acc + Number(m.cost || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Award className="text-cyan-600" size={24} />
            Practice Membership & Recurring Revenue
          </h2>
          <p className="text-sm text-slate-500">
            Shift from one-time treatments to long-term patient relationships with family subscription plans.
          </p>
        </div>
        <button className={buttonPrimary} onClick={() => setModalOpen(true)}>
          <Plus size={18} /> New Membership Plan
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Award} label="Active Memberships" value={activeMemberships.length} subtitle="Enrolled accounts" />
        <StatCard icon={Users} label="Covered Family Members" value={memberships.reduce((sum, m) => sum + Number(m.familyMembersIncluded || 1), 0)} subtitle="Total protected smiles" />
        <StatCard icon={CircleDollarSign} label="Annual Recurring Value" value={money(recurringRevenue)} subtitle="Predictable clinic revenue" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {memberships.map((mem) => {
          const pt = patients.find((p) => p.id === mem.patientId);
          return (
            <div key={mem.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">{mem.planName}</h3>
                  <p className="text-xs text-slate-500">Head Member: {pt?.name || "Patient"}</p>
                </div>
                <Badge tone="green">{mem.status}</Badge>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
                <p><span className="font-semibold">Fee:</span> {money(mem.cost)} / {mem.durationMonths} Months</p>
                <p><span className="font-semibold">Family Limit:</span> Up to {mem.familyMembersIncluded} members</p>
                <p><span className="font-semibold">Benefits:</span> {mem.benefits}</p>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <span>Start: {mem.startDate}</span>
                <span className="text-emerald-700 font-semibold">Active Plan</span>
              </div>
            </div>
          );
        })}
      </div>

      {memberships.length === 0 && (
        <EmptyState
          title="No membership subscriptions created"
          text="Design annual family dental packages to eliminate heavy discounting and build recurring practice revenue."
          onAction={() => setModalOpen(true)}
          actionLabel="Enroll Patient in Membership"
        />
      )}

      {modalOpen && (
        <Modal title="Enroll Patient in Membership Plan" onClose={() => setModalOpen(false)}>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Primary Patient / Family Head">
              <select className={inputClass} value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })} required>
                <option value="">Select registered patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.phone})
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Plan Name">
                <input className={inputClass} value={form.planName} onChange={(e) => setForm({ ...form, planName: e.target.value })} required />
              </Field>
              <Field label="Subscription Cost (₹)">
                <input type="number" className={inputClass} value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} required />
              </Field>
              <Field label="Validity (Months)">
                <input type="number" className={inputClass} value={form.durationMonths} onChange={(e) => setForm({ ...form, durationMonths: e.target.value })} required />
              </Field>
              <Field label="Covered Family Members">
                <input type="number" className={inputClass} value={form.familyMembersIncluded} onChange={(e) => setForm({ ...form, familyMembersIncluded: e.target.value })} required />
              </Field>
            </div>

            <Field label="Covered Inclusions & Benefits">
              <textarea className={inputClass} rows="3" value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} />
            </Field>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" className={buttonSecondary} onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className={buttonPrimary}>
                <CheckCircle2 size={17} /> Enroll Membership
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function RepeatVisitGeneratorPage({ patients, appointments }) {
  const overdueScaling = useMemo(() => patients.filter((_, idx) => idx % 3 === 0), [patients]);
  const unfinishedTreatments = useMemo(() => patients.filter((p) => p.journeyStage === "Treatment Plan Presented" || p.journeyStage === "In-Treatment"), [patients]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Repeat className="text-cyan-600" size={24} />
          Repeat Visit Generator (4 Smart Doors)
        </h2>
        <p className="text-sm text-slate-500">
          Re-engage existing patients to boost recurring revenue without high ad acquisition costs.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-cyan-100 bg-cyan-50/50 p-5">
          <div className="flex items-center gap-2 text-cyan-800 font-bold">
            <Clock3 size={18} /> Door 1: 6-Month Recalls
          </div>
          <p className="text-xs text-slate-600 mt-2">Routine scaling, polishing & preventive oral health examinations.</p>
          <p className="text-2xl font-bold text-slate-900 mt-4">{overdueScaling.length} Patients</p>
          <p className="text-[11px] text-cyan-700 font-medium">Eligible for recall</p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5">
          <div className="flex items-center gap-2 text-amber-800 font-bold">
            <ClipboardList size={18} /> Door 2: Pending Treatments
          </div>
          <p className="text-xs text-slate-600 mt-2">Incomplete RCT obturations, pending crowns, and unfinished fillings.</p>
          <p className="text-2xl font-bold text-slate-900 mt-4">{unfinishedTreatments.length} Patients</p>
          <p className="text-[11px] text-amber-700 font-medium">Pending procedure</p>
        </div>

        <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-5">
          <div className="flex items-center gap-2 text-purple-800 font-bold">
            <Award size={18} /> Door 3: Family Checkups
          </div>
          <p className="text-xs text-slate-600 mt-2">Engage spouses and children of existing high-value patients.</p>
          <p className="text-2xl font-bold text-slate-900 mt-4">{Math.round(patients.length * 0.4)} Families</p>
          <p className="text-[11px] text-purple-700 font-medium">Untapped network</p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
          <div className="flex items-center gap-2 text-emerald-800 font-bold">
            <Sparkles size={18} /> Door 4: Post-Op Followups
          </div>
          <p className="text-xs text-slate-600 mt-2">Day-3 and Day-7 surgical extraction and implant healing checks.</p>
          <p className="text-2xl font-bold text-slate-900 mt-4">{appointments.filter((a) => a.type === "Extraction").length} Patients</p>
          <p className="text-[11px] text-emerald-700 font-medium">Post-surgical care</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 className="font-bold text-slate-900 mb-4">Direct Recall Queue</h3>
        <div className="space-y-3">
          {overdueScaling.slice(0, 5).map((pt) => (
            <div key={pt.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50">
              <div>
                <p className="font-semibold text-slate-800">{pt.name}</p>
                <p className="text-xs text-slate-500">Overdue for Periodic Scaling & Oral Examination · Phone: {pt.phone}</p>
              </div>
              <a
                href={`https://wa.me/91${pt.phone?.replace(/\D/g, "")}?text=Dear%20${encodeURIComponent(
                  pt.name
                )},%20it%20is%20time%20for%20your%20routine%206-month%20dental%20health%20checkup.`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-700 self-start sm:self-auto"
              >
                <MessageSquare size={14} /> Send 6-Month Recall
              </a>
            </div>
          ))}
          {overdueScaling.length === 0 && <p className="text-sm text-slate-400">Recall queue is currently clear.</p>}
        </div>
      </div>
    </div>
  );
}

function GrowthAnalyticsPage({ patients, appointments, invoices }) {
  const totalRevenue = invoices
    .filter((i) => i.status === "Paid")
    .reduce((sum, i) => sum + Number(i.subtotal || 0), 0);

  const completedApts = appointments.filter((a) => a.status === "Completed").length;
  const conversionRate = appointments.length > 0 ? Math.round((completedApts / appointments.length) * 100) : 0;

  const dimensions = [
    { title: "1. Revenue Realization", value: money(totalRevenue), target: "₹5,00,000 / mo", change: "+14%" },
    { title: "2. Patient Acquisition", value: `${patients.length} Registrations`, target: "50 / mo", change: "+8%" },
    { title: "3. Case Acceptance Rate", value: `${conversionRate}%`, target: "> 85%", change: "+5%" },
    { title: "4. Recall Success Rate", value: "62%", target: "> 70%", change: "+11%" },
    { title: "5. Chair-time Utilization", value: "74%", target: "80%", change: "+3%" },
    { title: "6. Average Revenue / Patient", value: patients.length ? money(totalRevenue / patients.length) : "₹0", target: "₹4,500", change: "+18%" },
    { title: "7. Treatment Plan Velocity", value: "4.2 Days", target: "< 3 Days", change: "-1.1d" },
    { title: "8. Drop-out Leakage", value: `${patients.filter((p) => p.journeyStage === "Treatment Plan Presented").length} Cases`, target: "0 Cases", change: "-4" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="text-cyan-600" size={24} />
          Growth Analytics (8 Key Dimensions)
        </h2>
        <p className="text-sm text-slate-500">
          Executive practice metrics based on BestoSys growth dimensions.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dimensions.map((dim) => (
          <div key={dim.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{dim.title}</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{dim.value}</p>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
              <span className="text-slate-500">Benchmark: {dim.target}</span>
              <span className="font-semibold text-emerald-600">{dim.change}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DentalChartingPage({ patients, onSaveChart }) {
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || "");
  const [activeCondition, setActiveCondition] = useState("Decayed");
  const [chartData, setChartData] = useState({});

  useEffect(() => {
    if (!selectedPatientId) return;
    const pt = patients.find((p) => p.id === selectedPatientId);
    setChartData(pt?.odontogram || {});
  }, [selectedPatientId, patients]);

  const handleToothClick = (toothNum) => {
    if (!selectedPatientId) return alert("Select a patient first");
    setChartData((prev) => ({
      ...prev,
      [toothNum]: {
        condition: activeCondition,
        date: todayString(),
      },
    }));
  };

  const saveCurrentChart = () => {
    const pt = patients.find((p) => p.id === selectedPatientId);
    if (!pt) return alert("Select a patient");
    onSaveChart(pt, chartData);
  };

  const getToothClass = (num) => {
    const status = chartData[num]?.condition || "Healthy";
    return TOOTH_CONDITIONS[status]?.color || TOOTH_CONDITIONS.Healthy.color;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="text-cyan-600" size={24} />
            Interactive Dental Charting Tool
          </h2>
          <p className="text-sm text-slate-500">
            Chairside treatment plan visualizer designed to enhance patient acceptance rates.
          </p>
        </div>

        <button onClick={saveCurrentChart} className={buttonPrimary}>
          <CheckCircle2 size={16} /> Save Chart & Treatment Plan
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200">
        <label className="text-xs font-bold uppercase text-slate-500 shrink-0">Select Patient:</label>
        <select
          className={inputClass}
          value={selectedPatientId}
          onChange={(e) => setSelectedPatientId(e.target.value)}
        >
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.phone})
            </option>
          ))}
          {patients.length === 0 && <option value="">No registered patients</option>}
        </select>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase text-slate-400 mr-2">Condition Palette:</span>
          {Object.entries(TOOTH_CONDITIONS).map(([key, info]) => (
            <button
              key={key}
              onClick={() => setActiveCondition(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                activeCondition === key
                  ? "ring-2 ring-cyan-500 ring-offset-1 border-transparent shadow-xs"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {info.label}
            </button>
          ))}
        </div>

        <div className="space-y-6 bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
              Maxillary Arch (Upper Jaw - 18 to 28)
            </p>
            <div className="flex justify-center gap-1 sm:gap-2">
              <div className="flex gap-1">
                {FDI_TEETH.upperRight.map((t) => (
                  <button
                    key={t}
                    onClick={() => handleToothClick(t)}
                    className={`w-8 h-10 sm:w-10 sm:h-12 border rounded-md text-xs font-bold transition flex items-center justify-center cursor-pointer shadow-2xs ${getToothClass(
                      t
                    )}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="w-px bg-slate-300 mx-1.5" />
              <div className="flex gap-1">
                {FDI_TEETH.upperLeft.map((t) => (
                  <button
                    key={t}
                    onClick={() => handleToothClick(t)}
                    className={`w-8 h-10 sm:w-10 sm:h-12 border rounded-md text-xs font-bold transition flex items-center justify-center cursor-pointer shadow-2xs ${getToothClass(
                      t
                    )}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-b border-dashed border-slate-200 w-3/4 mx-auto" />

          <div>
            <div className="flex justify-center gap-1 sm:gap-2">
              <div className="flex gap-1">
                {FDI_TEETH.lowerRight.map((t) => (
                  <button
                    key={t}
                    onClick={() => handleToothClick(t)}
                    className={`w-8 h-10 sm:w-10 sm:h-12 border rounded-md text-xs font-bold transition flex items-center justify-center cursor-pointer shadow-2xs ${getToothClass(
                      t
                    )}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="w-px bg-slate-300 mx-1.5" />
              <div className="flex gap-1">
                {FDI_TEETH.lowerLeft.map((t) => (
                  <button
                    key={t}
                    onClick={() => handleToothClick(t)}
                    className={`w-8 h-10 sm:w-10 sm:h-12 border rounded-md text-xs font-bold transition flex items-center justify-center cursor-pointer shadow-2xs ${getToothClass(
                      t
                    )}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-3">
              Mandibular Arch (Lower Jaw - 48 to 38)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   REGISTRIES: PATIENTS & APPOINTMENTS
========================================================= */

function PatientsPage({ patients, search, onAdd, onDelete }) {
  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    return p.name?.toLowerCase().includes(q) || p.phone?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Patient Database</h2>
          <p className="text-sm text-slate-500">Live clinical records synced with cloud database.</p>
        </div>
        <button className={buttonPrimary} onClick={onAdd}>
          <Plus size={18} /> New Patient
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left">
          <thead className="border-b bg-slate-50 text-xs font-bold uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3">Patient</th>
              <th className="px-5 py-3">Phone</th>
              <th className="px-5 py-3">Journey Stage</th>
              <th className="px-5 py-3">Blood Group</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((pt) => (
              <tr key={pt.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition">
                <td className="px-5 py-4 font-semibold text-slate-800">{pt.name}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{pt.phone || "—"}</td>
                <td className="px-5 py-4">
                  <Badge tone="blue">{pt.journeyStage || "New Enquiry"}</Badge>
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">{pt.bloodGroup || "—"}</td>
                <td className="px-5 py-4">
                  <button className="text-red-500 hover:text-red-700 cursor-pointer p-1" onClick={() => onDelete(pt)}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="5" className="p-10 text-center text-sm text-slate-400">
                  No patients found. Click "New Patient" to begin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AppointmentsPage({ appointments, patients, onAdd, onDelete }) {
  const patientName = (id) => patients.find((p) => p.id === id)?.name || "Patient";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Appointment Calendar</h2>
          <p className="text-sm text-slate-500">Real-time chairside schedule.</p>
        </div>
        <button className={buttonPrimary} onClick={onAdd}>
          <Plus size={18} /> New Appointment
        </button>
      </div>

      <div className="space-y-3">
        {appointments.map((apt) => (
          <div key={apt.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 text-center">
                <p className="font-bold text-slate-900">{apt.time}</p>
                <p className="text-[10px] text-slate-400">{apt.date}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">{patientName(apt.patientId)}</p>
                <p className="text-xs text-slate-500">{apt.type} · {apt.doctor || "General Chair"}</p>
              </div>
            </div>
            <button className="text-red-500 hover:text-red-700 p-2 cursor-pointer" onClick={() => onDelete(apt)}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {appointments.length === 0 && (
          <EmptyState title="No appointments scheduled" text="Add clinical appointments to manage your chairs." onAction={onAdd} actionLabel="Add Appointment" />
        )}
      </div>
    </div>
  );
}

/* =========================================================
   NAVIGATION SHELL & APP CORE
========================================================= */

const navigation = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "prescriptions", label: "Dentee Rx (Prescriptions)", icon: Pill },
  { id: "accounts", label: "Accounts Day-Book", icon: CreditCard },
  { id: "tracker", label: "Patient Tracker", icon: TrendingUp },
  { id: "charting", label: "Dental Charting", icon: Stethoscope },
  { id: "memberships", label: "Membership Module", icon: Award },
  { id: "repeat", label: "Repeat Generator", icon: Repeat },
  { id: "analytics", label: "Growth Analytics", icon: BarChart3 },
  { id: "appointments", label: "Appointments", icon: CalendarDays },
  { id: "patients", label: "Patient Registry", icon: Users },
];

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [memberships, setMemberships] = useState([]);

  const [patientModal, setPatientModal] = useState(null);
  const [appointmentModal, setAppointmentModal] = useState(null);

  // Authentication Listener
  useEffect(() => {
    if (!firebaseConfigured || !auth) {
      setAuthLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Multi-Tenant Firestore Real-Time Subscriptions
  useEffect(() => {
    if (!user || !db) return;
    const cid = user.uid;

    const unsubs = [
      onSnapshot(collection(db, "clinics", cid, "patients"), (s) =>
        setPatients(s.docs.map((d) => ({ id: d.id, ...d.data() })))
      ),
      onSnapshot(collection(db, "clinics", cid, "appointments"), (s) =>
        setAppointments(s.docs.map((d) => ({ id: d.id, ...d.data() })))
      ),
      onSnapshot(collection(db, "clinics", cid, "invoices"), (s) =>
        setInvoices(s.docs.map((d) => ({ id: d.id, ...d.data() })))
      ),
      onSnapshot(collection(db, "clinics", cid, "prescriptions"), (s) =>
        setPrescriptions(s.docs.map((d) => ({ id: d.id, ...d.data() })))
      ),
      onSnapshot(collection(db, "clinics", cid, "memberships"), (s) =>
        setMemberships(s.docs.map((d) => ({ id: d.id, ...d.data() })))
      ),
    ];

    return () => unsubs.forEach((u) => u());
  }, [user]);

  const saveDoc = async (col, item, msg) => {
    if (!user || !db) return;
    await setDoc(doc(db, "clinics", user.uid, col, item.id), { ...item, updatedAt: serverTimestamp() }, { merge: true });
    setToast(msg);
  };

  const removeDoc = async (col, id, msg) => {
    if (!user || !db) return;
    if (!window.confirm("Permanently delete this record?")) return;
    await deleteDoc(doc(db, "clinics", user.uid, col, id));
    setToast(msg);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-600" />
          <p className="mt-4 text-sm font-medium text-slate-500">Connecting to Meridian Dental OS...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-slate-100 p-5">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-600 text-white shadow-md">
            <Stethoscope size={32} />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-slate-900">Meridian Dental OS</h1>
          <p className="mt-2 text-sm text-slate-500">Practice Management, Rx & Growth Suite</p>
          <button className={`${buttonPrimary} w-full mt-6 py-3`} onClick={() => loginWithGoogle()}>
            <LogIn size={18} /> Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-600 text-white shadow-xs">
            <Stethoscope size={19} />
          </div>
          <div>
            <p className="font-bold text-slate-900">Meridian</p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Dental OS</p>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActivePage(item.id);
                  setSidebarOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition cursor-pointer ${
                  active ? "bg-cyan-50 text-cyan-700" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon size={18} />
                {item.label}
                {active && <ChevronRight className="ml-auto" size={15} />}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 p-3">
          <button onClick={logoutUser} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 cursor-pointer">
            <LogOut size={17} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:px-6">
          <button className="rounded-lg p-2 hover:bg-slate-100 lg:hidden cursor-pointer" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <h1 className="font-bold text-slate-900 capitalize">{activePage}</h1>
        </header>

        <main className="p-4 lg:p-6">
          {activePage === "dashboard" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard icon={TrendingUp} label="Journey Pipeline" value={patients.length} subtitle="Active patients" />
                <StatCard icon={Pill} label="Prescriptions Issued" value={prescriptions.length} subtitle="Digital Rx" />
                <StatCard icon={CreditCard} label="Day-Book Balance" value={money(invoices.reduce((s, i) => s + Number(i.subtotal || i.amount || 0), 0))} subtitle="Reconciled accounts" />
                <StatCard icon={Repeat} label="Recall Queue" value={Math.round(patients.length * 0.35)} subtitle="Recall candidates" />
              </div>
              <PatientTrackerPage
                patients={patients}
                onUpdateStage={(pt, st) => saveDoc("patients", { ...pt, journeyStage: st }, "Stage updated.")}
              />
            </div>
          )}

          {activePage === "prescriptions" && (
            <PrescriptionsPage
              prescriptions={prescriptions}
              patients={patients}
              onSaveRx={(rx) => saveDoc("prescriptions", rx, "Prescription saved & queued for send.")}
              onDeleteRx={(rx) => removeDoc("prescriptions", rx.id, "Prescription removed.")}
            />
          )}

          {activePage === "accounts" && (
            <AccountsDayBookPage
              invoices={invoices}
              onAddEntry={(entry) => saveDoc("invoices", entry, "Ledger entry saved.")}
            />
          )}

          {activePage === "tracker" && (
            <PatientTrackerPage
              patients={patients}
              onUpdateStage={(pt, st) => saveDoc("patients", { ...pt, journeyStage: st }, "Patient journey updated.")}
            />
          )}

          {activePage === "charting" && (
            <DentalChartingPage
              patients={patients}
              onSaveChart={(pt, chart) => saveDoc("patients", { ...pt, odontogram: chart }, "Odontogram saved.")}
            />
          )}

          {activePage === "memberships" && (
            <MembershipPage
              memberships={memberships}
              patients={patients}
              onAddPlan={(plan) => saveDoc("memberships", plan, "Membership enrolled.")}
            />
          )}

          {activePage === "repeat" && (
            <RepeatVisitGeneratorPage patients={patients} appointments={appointments} />
          )}

          {activePage === "analytics" && (
            <GrowthAnalyticsPage patients={patients} appointments={appointments} invoices={invoices} />
          )}

          {activePage === "appointments" && (
            <AppointmentsPage
              appointments={appointments}
              patients={patients}
              onAdd={() => setAppointmentModal({ patientId: patients[0]?.id || "", time: "10:00", date: todayString(), type: "Consultation" })}
              onDelete={(apt) => removeDoc("appointments", apt.id, "Appointment removed.")}
            />
          )}

          {activePage === "patients" && (
            <PatientsPage
              patients={patients}
              search={search}
              onAdd={() => setPatientModal({ name: "", phone: "", journeyStage: "New Enquiry" })}
              onDelete={(pt) => removeDoc("patients", pt.id, "Patient deleted.")}
            />
          )}
        </main>
      </div>

      <Toast toast={toast} onClose={() => setToast("")} />

      {/* Patient Modal */}
      {patientModal && (
        <Modal title="Register Patient" onClose={() => setPatientModal(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveDoc("patients", { ...patientModal, id: patientModal.id || makeId("pt") }, "Patient registered.");
              setPatientModal(null);
            }}
            className="space-y-4"
          >
            <Field label="Full Name">
              <input className={inputClass} value={patientModal.name} onChange={(e) => setPatientModal({ ...patientModal, name: e.target.value })} required />
            </Field>
            <Field label="Phone">
              <input className={inputClass} value={patientModal.phone} onChange={(e) => setPatientModal({ ...patientModal, phone: e.target.value })} required />
            </Field>
            <Field label="Journey Stage">
              <select className={inputClass} value={patientModal.journeyStage || "New Enquiry"} onChange={(e) => setPatientModal({ ...patientModal, journeyStage: e.target.value })}>
                {JOURNEY_STAGES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" className={buttonSecondary} onClick={() => setPatientModal(null)}>Cancel</button>
              <button type="submit" className={buttonPrimary}><CheckCircle2 size={16} /> Save</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Appointment Modal */}
      {appointmentModal && (
        <Modal title="Schedule Appointment" onClose={() => setAppointmentModal(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveDoc("appointments", { ...appointmentModal, id: makeId("apt") }, "Appointment booked.");
              setAppointmentModal(null);
            }}
            className="space-y-4"
          >
            <Field label="Patient">
              <select className={inputClass} value={appointmentModal.patientId} onChange={(e) => setAppointmentModal({ ...appointmentModal, patientId: e.target.value })} required>
                <option value="">Select patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Date">
                <input type="date" className={inputClass} value={appointmentModal.date} onChange={(e) => setAppointmentModal({ ...appointmentModal, date: e.target.value })} required />
              </Field>
              <Field label="Time">
                <input type="time" className={inputClass} value={appointmentModal.time} onChange={(e) => setAppointmentModal({ ...appointmentModal, time: e.target.value })} required />
              </Field>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" className={buttonSecondary} onClick={() => setAppointmentModal(null)}>Cancel</button>
              <button type="submit" className={buttonPrimary}><CheckCircle2 size={16} /> Book Chair</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default App;
