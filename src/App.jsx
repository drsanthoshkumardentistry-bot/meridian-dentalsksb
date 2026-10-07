import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  FileText,
  Home,
  Image as ImageIcon,
  IndianRupee,
  LogIn,
  LogOut,
  Menu,
  Package,
  Phone,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Stethoscope,
  Trash2,
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
import { deleteObject, getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

/* =========================================================
   HELPERS & CLINICAL SCHEMAS
========================================================= */

const makeId = (prefix = "id") =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

const todayString = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
};

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

// Uploads an image to Firebase Storage (private to the signed-in clinic) and returns its download URL.
async function uploadImage(file) {
  const uid = auth?.currentUser?.uid;
  if (!uid) throw new Error("You are not signed in.");
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file (JPG, PNG or WebP).");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Image is larger than 15 MB. Please compress it and try again.");
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storageRef = ref(getStorage(), `clinics/${uid}/images/${Date.now()}_${safeName}`);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return { url: await getDownloadURL(storageRef), path: storageRef.fullPath };
}

async function removeStoredImage(path) {
  if (!path) return;
  try {
    await deleteObject(ref(getStorage(), path));
  } catch (err) {
    // A missing object should not prevent the clinical record from being removed.
    if (err?.code !== "storage/object-not-found") console.warn("Image cleanup failed:", err);
  }
}

// Single source of truth for invoice maths (supports partial payments).
const invoiceTotals = (inv) => {
  const base = Number(inv.subtotal || 0) - Number(inv.discount || 0);
  const gst = (base * Number(inv.gstRate || 0)) / 100;
  const total = Math.max(base + gst, 0);
  const patientDue = Math.max(total - Number(inv.insuranceCoverage || 0), 0);
  const paid =
    inv.status === "Paid"
      ? patientDue
      : inv.status === "Partial"
      ? Math.min(Number(inv.amountPaid || 0), patientDue)
      : 0;
  return { base, gst, total, patientDue, paid, balance: Math.max(patientDue - paid, 0) };
};

const ADULT_TEETH_UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const ADULT_TEETH_LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const emptyPatient = {
  name: "",
  phone: "",
  email: "",
  dob: "",
  gender: "Not specified",
  bloodGroup: "",
  allergies: "",
  medicalHistory: "",
  emergencyContact: "",
  insuranceProvider: "",
  chiefComplaint: "",
  provisionalDiagnosis: "",
  opgUrl: "",
  opgStoragePath: "",
  opgDate: todayString(),
  dentalChart: {},
};

const emptyAppointment = {
  patientId: "",
  doctor: "",
  date: todayString(),
  time: "10:00",
  duration: "30",
  type: "Consultation",
  status: "Scheduled",
  notes: "",
};

const emptyInvoice = {
  patientId: "",
  description: "Dental consultation & treatment",
  subtotal: 0,
  discount: 0,
  gstRate: 0,
  insuranceCoverage: 0,
  amountPaid: 0,
  dueDate: todayString(),
  status: "Unpaid",
};

const emptyInventory = {
  item: "",
  category: "Dental Material",
  quantity: 0,
  unit: "pcs",
  reorderLevel: 5,
  supplier: "",
  batchNo: "",
  expiry: "",
};

const emptyStaff = {
  name: "",
  role: "Dentist",
  phone: "",
  email: "",
  registrationNo: "",
  department: "Clinical",
  status: "Active",
};

const emptyRadiology = {
  patientId: "",
  modality: "OPG (Orthopantomogram)",
  studyDate: todayString(),
  findings: "",
  impression: "",
  imageUrl: "",
  imageStoragePath: "",
  status: "Reported",
};

/* =========================================================
   UI COMPONENTS
========================================================= */

function Modal({ title, children, onClose, width = "max-w-2xl" }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className={`w-full ${width} max-h-[92vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100 flex flex-col`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
            <X size={19} />
          </button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

function Toast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div className="fixed right-5 top-5 z-[100] flex max-w-sm items-start gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-xl">
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
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    yellow: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-rose-50 text-rose-700 border-rose-200",
    blue: "bg-cyan-50 text-teal-700 border-cyan-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[tone] || styles.slate}`}>
      {children}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, subtitle }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className="rounded-xl bg-cyan-50 p-3 text-teal-700">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, text, onAction, actionLabel }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <ClipboardList className="mx-auto text-slate-300" size={42} />
      <h3 className="mt-3 text-base font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{text}</p>
      {onAction && actionLabel && (
        <button className={`${buttonPrimary} mt-5`} onClick={onAction}>
          <Plus size={16} /> {actionLabel}
        </button>
      )}
    </div>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50 transition";

const buttonPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition shadow-sm disabled:opacity-50 cursor-pointer";

const buttonSecondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer";

/* =========================================================
   DENTAL ODONTOGRAM / CHARTING COMPONENT
========================================================= */

function Odontogram({ dentalChart = {}, onToothUpdate }) {
  const toothConditions = [
    { label: "Healthy", tone: "bg-slate-100 text-slate-700 border-slate-200" },
    { label: "Caries", tone: "bg-amber-100 text-amber-800 border-amber-300" },
    { label: "Restored", tone: "bg-blue-100 text-blue-800 border-blue-300" },
    { label: "RCT Done", tone: "bg-purple-100 text-purple-800 border-purple-300" },
    { label: "Missing", tone: "bg-rose-100 text-rose-800 border-rose-300 line-through" },
  ];

  const cycleStatus = (toothNum) => {
    const current = dentalChart[toothNum] || "Healthy";
    const nextMap = {
      Healthy: "Caries",
      Caries: "Restored",
      Restored: "RCT Done",
      "RCT Done": "Missing",
      Missing: "Healthy",
    };
    onToothUpdate(toothNum, nextMap[current] || "Healthy");
  };

  const renderTooth = (num) => {
    const status = dentalChart[num] || "Healthy";
    const condition = toothConditions.find((c) => c.label === status) || toothConditions[0];
    return (
      <button
        key={num}
        type="button"
        onClick={() => cycleStatus(num)}
        title={`Tooth #${num}: ${status} (Click to toggle)`}
        className={`flex h-12 w-9 sm:w-10 flex-col items-center justify-center rounded-lg border text-xs font-bold transition hover:scale-105 ${condition.tone}`}
      >
        <span>{num}</span>
        <span className="text-[8px] font-normal leading-tight opacity-75">{status.slice(0, 3)}</span>
      </button>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-600">FDI Two-Digit Dental Chart</p>
        <div className="flex flex-wrap gap-2 text-[10px]">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-400" /> Healthy</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Caries</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" /> Restored</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-purple-500" /> RCT</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500" /> Missing</span>
        </div>
      </div>

      <div className="space-y-3 overflow-x-auto py-2">
        <div className="text-center text-[10px] font-semibold uppercase text-slate-400">Maxillary Arch (Upper)</div>
        <div className="flex justify-center gap-1 min-w-[550px]">
          {ADULT_TEETH_UPPER.map(renderTooth)}
        </div>

        <div className="my-2 border-t border-slate-200" />

        <div className="flex justify-center gap-1 min-w-[550px]">
          {ADULT_TEETH_LOWER.map(renderTooth)}
        </div>
        <div className="text-center text-[10px] font-semibold uppercase text-slate-400">Mandibular Arch (Lower)</div>
      </div>
    </div>
  );
}

/* =========================================================
   LOGIN SCREEN
========================================================= */

function LoginScreen({ onGoogle, loading }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-slate-100 p-5">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-md">
          <Stethoscope size={32} />
        </div>

        <h1 className="mt-5 text-2xl font-bold text-slate-900">Meridian Dental OS</h1>
        <p className="mt-2 text-sm text-slate-500">Cloud-Native Dental Practice & Clinical Records</p>

        <div className="mt-8">
          <button className={`${buttonPrimary} w-full py-3`} onClick={onGoogle} disabled={loading}>
            <LogIn size={18} />
            {loading ? "Authenticating..." : "Sign in with Google Practice Account"}
          </button>
        </div>

        <p className="mt-6 text-xs text-slate-400">
          Compliant, encrypted clinical workspace with multi-device real-time sync.
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   NAVIGATION & SHELL
========================================================= */

const navigation = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "appointments", label: "Appointments", icon: CalendarDays },
  { id: "patients", label: "Patients & Charting", icon: Users },
  { id: "radiology", label: "Radiology", icon: Activity },
  { id: "billing", label: "Billing & Invoices", icon: WalletCards },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "staff", label: "Staff & Doctors", icon: ShieldCheck },
  { id: "settings", label: "Practice Settings", icon: Settings },
];

function Sidebar({ activePage, setActivePage, open, setOpen, user, onLogout }) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-800 bg-slate-950 text-white transition-transform duration-200 ease-in-out lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
            <Stethoscope size={19} />
          </div>
          <div>
            <p className="font-bold text-white leading-tight">Meridian</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-400">Clinical Suite</p>
          </div>
        </div>

        <nav className="space-y-1 p-3">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActivePage(item.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition cursor-pointer ${
                  active ? "bg-teal-500/15 text-teal-300 font-semibold ring-1 ring-teal-400/20" : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={18} />
                {item.label}
                {active && <ChevronRight className="ml-auto" size={15} />}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-800 p-3 bg-slate-950">
          <div className="mb-3 rounded-xl bg-white/5 p-3 border border-white/10">
            <p className="truncate text-sm font-semibold text-white">{user?.displayName || "Practitioner"}</p>
            <p className="truncate text-xs text-slate-400">{user?.email}</p>
          </div>

          <button onClick={onLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer">
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

function Topbar({ activePage, setOpen, search, setSearch }) {
  const title = navigation.find((item) => item.id === activePage)?.label || "Dashboard";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl lg:px-6">
      <button className="rounded-lg p-2 hover:bg-slate-100 lg:hidden cursor-pointer" onClick={() => setOpen(true)}>
        <Menu size={20} />
      </button>

      <div className="min-w-0">
        <h1 className="truncate text-lg font-bold text-slate-900">{title}</h1>
      </div>

      <div className="ml-auto w-44 sm:w-72">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-teal-500 transition"
            placeholder="Search records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
    </header>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard({ patients, appointments, invoices, inventory, setActivePage }) {
  const todayAppointments = useMemo(
    () => appointments.filter((a) => a.date === todayString()),
    [appointments]
  );

  const revenue = useMemo(
    () => invoices.reduce((sum, i) => sum + invoiceTotals(i).paid, 0),
    [invoices]
  );

  const outstanding = useMemo(
    () => invoices.reduce((sum, i) => sum + invoiceTotals(i).balance, 0),
    [invoices]
  );

  const lowStock = useMemo(
    () => inventory.filter((item) => Number(item.quantity || 0) <= Number(item.reorderLevel || 0)),
    [inventory]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Clinical Overview</h2>
        <p className="mt-1 text-sm text-slate-500">Live practice metrics and chairside workflow status.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CalendarDays} label="Today's Appointments" value={todayAppointments.length} subtitle="Scheduled chair sessions" />
        <StatCard icon={Users} label="Total Registered Patients" value={patients.length} subtitle="Active clinical profiles" />
        <StatCard icon={CircleDollarSign} label="Collected Revenue" value={money(revenue)} subtitle="Fully settled invoices" />
        <StatCard icon={WalletCards} label="Outstanding Due" value={money(outstanding)} subtitle="Pending receivables" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900">Today's Schedule</h3>
              <p className="text-xs text-slate-500">Upcoming clinical appointments</p>
            </div>
            <button className="text-sm font-semibold text-teal-700 hover:text-teal-800 cursor-pointer" onClick={() => setActivePage("appointments")}>
              Full Calendar
            </button>
          </div>

          {todayAppointments.length === 0 ? (
            <EmptyState title="No appointments for today" text="Schedule clinical chair time from the Appointments tab." />
          ) : (
            <div className="space-y-2">
              {[...todayAppointments]
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((apt) => {
                  const pt = patients.find((p) => p.id === apt.patientId);
                  return (
                    <div key={apt.id} className="flex items-center gap-4 rounded-xl border border-slate-100 p-3 hover:bg-slate-50 transition">
                      <div className="w-16 text-center">
                        <p className="font-bold text-slate-900">{apt.time}</p>
                        <p className="text-[10px] text-slate-400">{apt.duration} min</p>
                      </div>
                      <div className="h-9 w-px bg-slate-200" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">{pt?.name || "Patient"}</p>
                        <p className="text-xs text-slate-500">{apt.type} • {apt.doctor || "General Chair"}</p>
                      </div>
                      <Badge tone={apt.status === "Confirmed" ? "green" : apt.status === "Checked-in" ? "purple" : "blue"}>
                        {apt.status}
                      </Badge>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h3 className="font-bold text-slate-900">Clinical Alerts</h3>
          <p className="mt-1 text-xs text-slate-500">Inventory and accounts requiring attention.</p>

          <div className="mt-5 space-y-3">
            <button onClick={() => setActivePage("inventory")} className="flex w-full items-center gap-3 rounded-xl bg-amber-50 p-3 text-left transition hover:bg-amber-100 cursor-pointer border border-amber-200">
              <AlertTriangle className="text-amber-600 shrink-0" size={20} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">Low Stock Supplies</p>
                <p className="text-xs text-slate-600">{lowStock.length} materials at reorder threshold</p>
              </div>
              <ChevronRight size={17} className="text-amber-600" />
            </button>

            <button onClick={() => setActivePage("billing")} className="flex w-full items-center gap-3 rounded-xl bg-rose-50 p-3 text-left transition hover:bg-rose-100 cursor-pointer border border-rose-200">
              <WalletCards className="text-rose-600 shrink-0" size={20} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">Receivables Due</p>
                <p className="text-xs text-slate-600">{money(outstanding)} pending settlement</p>
              </div>
              <ChevronRight size={17} className="text-rose-600" />
            </button>

            <button onClick={() => setActivePage("patients")} className="flex w-full items-center gap-3 rounded-xl bg-cyan-50 p-3 text-left transition hover:bg-teal-100 cursor-pointer border border-cyan-200">
              <Users className="text-teal-600 shrink-0" size={20} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">Patient Database</p>
                <p className="text-xs text-slate-600">{patients.length} registered profiles</p>
              </div>
              <ChevronRight size={17} className="text-teal-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PATIENTS MODULE & ODONTOGRAM WITH OPG INSERTION
========================================================= */

function PatientModal({ patient, onClose, onSave }) {
  const [form, setForm] = useState(patient || emptyPatient);
  const [tab, setTab] = useState("clinical");
  const [uploading, setUploading] = useState(false);
  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert("Patient name is required.");
    onSave({ ...form, id: form.id || makeId("patient") });
  };

  const handleToothUpdate = (toothNum, status) => {
    setForm((prev) => ({
      ...prev,
      dentalChart: {
        ...(prev.dentalChart || {}),
        [toothNum]: status,
      },
    }));
  };

  const handleOpgFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const previousPath = form.opgStoragePath;
      const uploaded = await uploadImage(file);
      if (previousPath) await removeStoredImage(previousPath);
      update("opgUrl", uploaded.url);
      update("opgStoragePath", uploaded.path);
    } catch (err) {
      alert(err.message || "Upload failed. Check your connection and Storage rules.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal title={patient?.id ? `Clinical Record: ${patient.name}` : "Register New Patient"} onClose={onClose} width="max-w-4xl">
      <div className="mb-5 flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setTab("clinical")}
          className={`border-b-2 px-4 py-2 text-sm font-semibold cursor-pointer ${tab === "clinical" ? "border-teal-600 text-teal-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          Diagnosis & FDI Charting
        </button>
        <button
          type="button"
          onClick={() => setTab("opg")}
          className={`border-b-2 px-4 py-2 text-sm font-semibold cursor-pointer ${tab === "opg" ? "border-teal-600 text-teal-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          Insert Panoramic OPG
        </button>
        <button
          type="button"
          onClick={() => setTab("general")}
          className={`border-b-2 px-4 py-2 text-sm font-semibold cursor-pointer ${tab === "general" ? "border-teal-600 text-teal-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          Demographics & Medical
        </button>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {tab === "clinical" && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Chief Complaint">
                <textarea
                  className={inputClass}
                  rows="2"
                  value={form.chiefComplaint}
                  onChange={(e) => update("chiefComplaint", e.target.value)}
                  placeholder="e.g. Pain in lower right back tooth region for 3 days..."
                />
              </Field>
              <Field label="Provisional Diagnosis">
                <textarea
                  className={inputClass}
                  rows="2"
                  value={form.provisionalDiagnosis}
                  onChange={(e) => update("provisionalDiagnosis", e.target.value)}
                  placeholder="e.g. Irreversible pulpitis i.r.t 46, Deep dentinal caries..."
                />
              </Field>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">FDI Two-Digit Interactive Odontogram</span>
                <span className="text-xs text-slate-400">Click individual teeth to record findings</span>
              </div>
              <Odontogram dentalChart={form.dentalChart || {}} onToothUpdate={handleToothUpdate} />
            </div>
          </div>
        )}

        {tab === "opg" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 text-teal-700">
                <ImageIcon size={28} />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h4 className="text-sm font-bold text-slate-900">Insert Panoramic Radiograph (OPG)</h4>
                <p className="text-xs text-slate-500">Upload a JPEG or PNG (up to 15 MB). Images are stored privately in your clinic cloud storage.</p>
              </div>
              <div>
                <label className={`${buttonPrimary} cursor-pointer`}>
                  <Plus size={16} /> {uploading ? "Uploading..." : "Choose OPG File"}
                  <input type="file" accept="image/*" className="hidden" onChange={handleOpgFile} disabled={uploading} />
                </label>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Or Enter Direct OPG Image Link">
                <input
                  className={inputClass}
                  value={form.opgUrl}
                  onChange={(e) => update("opgUrl", e.target.value)}
                  placeholder="https://cloud-storage.com/opg.jpg"
                />
              </Field>
              <Field label="Study / Exposure Date">
                <input
                  type="date"
                  className={inputClass}
                  value={form.opgDate}
                  onChange={(e) => update("opgDate", e.target.value)}
                />
              </Field>
            </div>

            {form.opgUrl ? (
              <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-black p-2 flex justify-center">
                <img
                  src={form.opgUrl}
                  alt="OPG Panoramic"
                  className="max-h-72 object-contain rounded-lg"
                />
                <button
                  type="button"
                  title="Remove OPG"
                  onClick={async () => {
                    await removeStoredImage(form.opgStoragePath);
                    update("opgUrl", "");
                    update("opgStoragePath", "");
                  }}
                  className="absolute right-4 top-4 rounded-xl bg-rose-600/90 p-2.5 text-white shadow-lg hover:bg-rose-700"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-xs text-slate-400">
                No OPG attached for this patient profile yet.
              </div>
            )}
          </div>
        )}

        {tab === "general" && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full Name">
                <input className={inputClass} value={form.name} onChange={(e) => update("name", e.target.value)} required />
              </Field>
              <Field label="Phone Number">
                <input className={inputClass} value={form.phone} onChange={(e) => update("phone", e.target.value)} required />
              </Field>
              <Field label="Email Address">
                <input type="email" className={inputClass} value={form.email} onChange={(e) => update("email", e.target.value)} />
              </Field>
              <Field label="Date of Birth">
                <input type="date" className={inputClass} value={form.dob} onChange={(e) => update("dob", e.target.value)} />
              </Field>
              <Field label="Gender">
                <select className={inputClass} value={form.gender} onChange={(e) => update("gender", e.target.value)}>
                  <option>Not specified</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </Field>
              <Field label="Blood Group">
                <select className={inputClass} value={form.bloodGroup} onChange={(e) => update("bloodGroup", e.target.value)}>
                  <option value="">Unknown</option>
                  <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
                  <option>AB+</option><option>AB-</option><option>O+</option><option>O-</option>
                </select>
              </Field>
              <Field label="Emergency Contact">
                <input className={inputClass} value={form.emergencyContact} onChange={(e) => update("emergencyContact", e.target.value)} />
              </Field>
              <Field label="Insurance Provider">
                <input className={inputClass} value={form.insuranceProvider} onChange={(e) => update("insuranceProvider", e.target.value)} placeholder="Self-Pay or Provider Name" />
              </Field>
            </div>

            <Field label="Allergies (Safety Alert)">
              <textarea className={inputClass} rows="2" value={form.allergies} onChange={(e) => update("allergies", e.target.value)} placeholder="e.g. Penicillin, Latex, Local Anesthetics" />
            </Field>
            <Field label="Systemic Medical History">
              <textarea className={inputClass} rows="2" value={form.medicalHistory} onChange={(e) => update("medicalHistory", e.target.value)} placeholder="e.g. Hypertension, Type 2 Diabetes, Cardiac conditions, Anticoagulant therapy" />
            </Field>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button type="button" className={buttonSecondary} onClick={onClose}>Cancel</button>
          <button type="submit" className={buttonPrimary} disabled={uploading}><CheckCircle2 size={17} />Save Clinical Record</button>
        </div>
      </form>
    </Modal>
  );
}

function PatientsPage({ patients, search, onAdd, onEdit, onDelete }) {
  const [selectedOpg, setSelectedOpg] = useState(null);

  const filtered = useMemo(() => {
    const q = (search || "").toLowerCase();
    return patients.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.phone?.toLowerCase().includes(q) ||
        p.chiefComplaint?.toLowerCase().includes(q) ||
        p.provisionalDiagnosis?.toLowerCase().includes(q)
    );
  }, [patients, search]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Patient Directory & Clinical Diagnosis</h2>
          <p className="text-sm text-slate-500">Chief complaint, provisional diagnosis, FDI charting, and panoramic OPGs.</p>
        </div>
        <button className={buttonPrimary} onClick={onAdd}><Plus size={18} />New Patient</button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">Patient</th>
                <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">Chief Complaint</th>
                <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">Diagnosis</th>
                <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">OPG</th>
                <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">Allergies</th>
                <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((pt) => (
                <tr key={pt.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-100 font-bold text-teal-700">
                        {pt.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{pt.name}</p>
                        <p className="text-[11px] text-slate-400">{pt.phone || "No phone"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-700 max-w-xs">
                    {pt.chiefComplaint ? (
                      <p className="line-clamp-2">{pt.chiefComplaint}</p>
                    ) : (
                      <span className="text-slate-400">None recorded</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs font-medium text-slate-800 max-w-xs">
                    {pt.provisionalDiagnosis ? (
                      <span className="inline-flex rounded-md bg-cyan-50 px-2 py-1 text-cyan-800 border border-cyan-200">
                        {pt.provisionalDiagnosis}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {pt.opgUrl ? (
                      <button
                        onClick={() => setSelectedOpg(pt.opgUrl)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-100 cursor-pointer"
                      >
                        <ImageIcon size={14} /> View OPG
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">No OPG</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs">
                    {pt.allergies ? (
                      <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-2 py-0.5 font-medium text-rose-700">
                        <AlertTriangle size={12} /> {pt.allergies}
                      </span>
                    ) : (
                      <span className="text-slate-400">None reported</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-teal-700 hover:bg-cyan-50 cursor-pointer" onClick={() => onEdit(pt)}>
                        Chart / Edit
                      </button>
                      <button className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 cursor-pointer" onClick={() => onDelete(pt)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-10">
                    <EmptyState title="No registered patients" text="Add your first patient to record chief complaints, diagnosis, and OPG scans." onAction={onAdd} actionLabel="Add Patient" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOpg && (
        <Modal title="Patient Panoramic Radiograph (OPG)" onClose={() => setSelectedOpg(null)} width="max-w-4xl">
          <div className="flex justify-center bg-black rounded-xl p-2">
            <img src={selectedOpg} alt="Panoramic OPG" className="max-h-[75vh] object-contain rounded-lg" />
          </div>
        </Modal>
      )}
    </div>
  );
}

/* =========================================================
   APPOINTMENTS MODULE
========================================================= */

function AppointmentModal({ appointment, patients, staff, onClose, onSave }) {
  const [form, setForm] = useState(appointment || emptyAppointment);
  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.patientId) return alert("Select a patient.");
    if (!form.doctor.trim()) return alert("Practitioner name is required.");
    onSave({ ...form, id: form.id || makeId("appointment") });
  };

  return (
    <Modal title={appointment?.id ? "Edit Scheduled Appointment" : "Book Clinical Chair Time"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Patient">
            <select className={inputClass} value={form.patientId} onChange={(e) => update("patientId", e.target.value)} required>
              <option value="">Select registered patient</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>
              ))}
            </select>
          </Field>
          <Field label="Treating Doctor">
            <input className={inputClass} list="doctor-list" value={form.doctor} onChange={(e) => update("doctor", e.target.value)} placeholder="Dr. Name" required />
            <datalist id="doctor-list">
              {(staff || []).map((m) => (
                <option key={m.id} value={m.name} />
              ))}
            </datalist>
          </Field>
          <Field label="Date">
            <input type="date" className={inputClass} value={form.date} onChange={(e) => update("date", e.target.value)} required />
          </Field>
          <Field label="Time">
            <input type="time" className={inputClass} value={form.time} onChange={(e) => update("time", e.target.value)} required />
          </Field>
          <Field label="Duration">
            <select className={inputClass} value={form.duration} onChange={(e) => update("duration", e.target.value)}>
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
              <option value="90">90 minutes</option>
            </select>
          </Field>
          <Field label="Procedure / Visit Type">
            <select className={inputClass} value={form.type} onChange={(e) => update("type", e.target.value)}>
              <option>Consultation</option>
              <option>Scaling & Polishing</option>
              <option>Composite Restoration</option>
              <option>Root Canal Treatment</option>
              <option>Extraction / Exodontia</option>
              <option>Crown & Bridge Preparation</option>
              <option>Orthodontic Adjustment</option>
              <option>Emergency Dental Relief</option>
            </select>
          </Field>
          <Field label="Status">
            <select className={inputClass} value={form.status} onChange={(e) => update("status", e.target.value)}>
              <option>Scheduled</option>
              <option>Confirmed</option>
              <option>Checked-in</option>
              <option>Completed</option>
              <option>Cancelled</option>
            </select>
          </Field>
        </div>

        <Field label="Clinical Notes / Procedure Plan">
          <textarea className={inputClass} rows="3" value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="e.g. Tooth 26 restoration, review healing of 36 extraction site..." />
        </Field>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button type="button" className={buttonSecondary} onClick={onClose}>Cancel</button>
          <button type="submit" className={buttonPrimary}><CalendarDays size={17} />Save Appointment</button>
        </div>
      </form>
    </Modal>
  );
}

function AppointmentsPage({ appointments, patients, search, onAdd, onEdit, onDelete }) {
  const sorted = useMemo(() => {
    const q = (search || "").toLowerCase();
    return [...appointments]
      .filter((a) => {
        const pt = patients.find((p) => p.id === a.patientId);
        return (
          a.doctor?.toLowerCase().includes(q) ||
          a.type?.toLowerCase().includes(q) ||
          pt?.name?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  }, [appointments, patients, search]);

  const patientName = (id) => patients.find((p) => p.id === id)?.name || "Unknown patient";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Clinical Calendar & Chair Booking</h2>
          <p className="text-sm text-slate-500">Real-time schedule for clinical chairs and operatories.</p>
        </div>
        <button className={buttonPrimary} onClick={onAdd}><Plus size={18} />New Appointment</button>
      </div>

      <div className="space-y-3">
        {sorted.map((apt) => (
          <div key={apt.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex items-center gap-3 md:w-44">
                <div className="rounded-xl bg-cyan-50 p-3 text-teal-700"><Clock3 size={20} /></div>
                <div>
                  <p className="font-bold text-slate-900">{apt.time}</p>
                  <p className="text-xs text-slate-500">{apt.date}</p>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">{patientName(apt.patientId)}</p>
                <p className="text-sm text-slate-600">{apt.type} • {apt.doctor}</p>
                {apt.notes && <p className="mt-1 text-xs text-slate-400 truncate">{apt.notes}</p>}
              </div>

              <div className="flex items-center gap-2">
                <Badge tone={apt.status === "Completed" ? "green" : apt.status === "Cancelled" ? "red" : apt.status === "Checked-in" ? "purple" : "blue"}>
                  {apt.status}
                </Badge>
                <button className="rounded-lg px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-cyan-50 cursor-pointer" onClick={() => onEdit(apt)}>Edit</button>
                <button className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 cursor-pointer" onClick={() => onDelete(apt)}><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
        {sorted.length === 0 && (
          <EmptyState title="No scheduled appointments" text="Schedule clinical chair time for your patients." onAction={onAdd} actionLabel="Schedule Appointment" />
        )}
      </div>
    </div>
  );
}

/* =========================================================
   BILLING, INVOICING & PRINTABLE RECEIPT
========================================================= */

function PrintableReceipt({ invoice, patient, settings, onClose }) {
  const base = Number(invoice.subtotal || 0) - Number(invoice.discount || 0);
  const gst = (base * Number(invoice.gstRate || 0)) / 100;
  const total = Math.max(base + gst, 0);
  const patientDue = Math.max(total - Number(invoice.insuranceCoverage || 0), 0);

  return (
    <Modal title="Clinical Tax Invoice & Receipt" onClose={onClose} width="max-w-xl">
      <div className="space-y-6 p-2 text-slate-800" id="printable-receipt">
        <div className="flex justify-between border-b pb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{settings.clinicName || "Dental Clinic"}</h3>
            <p className="text-xs text-slate-500">{settings.address || "Clinic Address"}</p>
            <p className="text-xs text-slate-500">Phone: {settings.phone || "—"} | Reg: {settings.registrationNo || "—"}</p>
            {settings.gstin && <p className="text-xs text-slate-500">GSTIN: {settings.gstin}</p>}
          </div>
          <div className="text-right">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Tax Invoice</span>
            <p className="text-sm font-semibold mt-1">{invoice.id}</p>
            <p className="text-xs text-slate-500">Date: {invoice.dueDate}</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase text-slate-400">Billed Patient</p>
          <p className="text-base font-bold text-slate-800">{patient?.name || "Patient"}</p>
          <p className="text-xs text-slate-500">Phone: {patient?.phone || "—"}</p>
        </div>

        <table className="w-full text-left text-sm border-t border-b py-2">
          <thead>
            <tr className="text-xs font-bold uppercase text-slate-500 border-b">
              <th className="py-2">Description</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2.5 font-medium">{invoice.description}</td>
              <td className="py-2.5 text-right font-semibold">{money(invoice.subtotal)}</td>
            </tr>
            {Number(invoice.discount || 0) > 0 && (
              <tr className="text-emerald-700 text-xs">
                <td className="py-1">Special Discount</td>
                <td className="py-1 text-right">- {money(invoice.discount)}</td>
              </tr>
            )}
            {Number(invoice.gstRate || 0) > 0 && (
              <tr className="text-xs text-slate-500">
                <td className="py-1">GST ({invoice.gstRate}%)</td>
                <td className="py-1 text-right">{money(gst)}</td>
              </tr>
            )}
            {Number(invoice.insuranceCoverage || 0) > 0 && (
              <tr className="text-xs text-teal-700">
                <td className="py-1">Insurance / Shield Coverage</td>
                <td className="py-1 text-right">- {money(invoice.insuranceCoverage)}</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border">
          <span className="font-bold text-slate-900">Total Patient Due</span>
          <span className="text-xl font-bold text-teal-700">{money(patientDue)}</span>
        </div>

        {invoice.status === "Partial" && (
          <div className="rounded-xl border p-3 text-sm">
            <div className="flex justify-between"><span>Amount Received</span><span>{money(invoiceTotals(invoice).paid)}</span></div>
            <div className="mt-1 flex justify-between font-semibold text-amber-700"><span>Balance Due</span><span>{money(invoiceTotals(invoice).balance)}</span></div>
          </div>
        )}
        {invoice.status === "Paid" && (
          <p className="text-center text-sm font-bold uppercase tracking-wider text-emerald-700">Paid in full</p>
        )}

        {settings.upiId && (
          <div className="text-xs text-center border-t pt-3 text-slate-500">
            UPI ID: <span className="font-semibold text-slate-800">{settings.upiId}</span>
          </div>
        )}

        <div className="no-print flex justify-end gap-3 pt-3">
          <button type="button" className={buttonSecondary} onClick={onClose}>Close</button>
          <button type="button" className={buttonPrimary} onClick={() => window.print()}>
            <Printer size={16} /> Print Receipt
          </button>
        </div>
      </div>
    </Modal>
  );
}

function InvoiceModal({ invoice, patients, onClose, onSave }) {
  const [form, setForm] = useState(invoice || emptyInvoice);
  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const base = Number(form.subtotal || 0) - Number(form.discount || 0);
  const gst = (base * Number(form.gstRate || 0)) / 100;
  const total = Math.max(base + gst, 0);
  const patientDue = Math.max(total - Number(form.insuranceCoverage || 0), 0);

  const submit = (e) => {
    e.preventDefault();
    if (!form.patientId) return alert("Select a patient.");
    if (
      form.status === "Partial" &&
      !(Number(form.amountPaid) > 0 && Number(form.amountPaid) < patientDue)
    ) {
      return alert("For a partial payment, enter an amount received that is more than 0 and less than the patient due.");
    }
    onSave({
      ...form,
      id: form.id || makeId("inv"),
      subtotal: Number(form.subtotal || 0),
      discount: Number(form.discount || 0),
      gstRate: Number(form.gstRate || 0),
      insuranceCoverage: Number(form.insuranceCoverage || 0),
      amountPaid: form.status === "Partial" ? Number(form.amountPaid || 0) : 0,
    });
  };

  return (
    <Modal title={invoice?.id ? "Edit Tax Invoice" : "Generate Dental Invoice"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Patient">
            <select className={inputClass} value={form.patientId} onChange={(e) => update("patientId", e.target.value)} required>
              <option value="">Select patient</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Treatment / Procedure Description">
            <input className={inputClass} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Procedures performed" required />
          </Field>
          <Field label="Subtotal (₹)">
            <input type="number" min="0" className={inputClass} value={form.subtotal} onChange={(e) => update("subtotal", e.target.value)} required />
          </Field>
          <Field label="Discount (₹)">
            <input type="number" min="0" className={inputClass} value={form.discount} onChange={(e) => update("discount", e.target.value)} />
          </Field>
          <Field label="GST (%)">
            <input type="number" min="0" className={inputClass} value={form.gstRate} onChange={(e) => update("gstRate", e.target.value)} />
          </Field>
          <Field label="Insurance Coverage (₹)">
            <input type="number" min="0" className={inputClass} value={form.insuranceCoverage} onChange={(e) => update("insuranceCoverage", e.target.value)} />
          </Field>
          <Field label="Invoice Date">
            <input type="date" className={inputClass} value={form.dueDate} onChange={(e) => update("dueDate", e.target.value)} />
          </Field>
          <Field label="Settlement Status">
            <select className={inputClass} value={form.status} onChange={(e) => update("status", e.target.value)}>
              <option>Unpaid</option>
              <option>Partial</option>
              <option>Paid</option>
            </select>
          </Field>
        </div>

        {form.status === "Partial" && (
          <Field label="Amount Received So Far (₹)">
            <input type="number" min="0" className={inputClass} value={form.amountPaid} onChange={(e) => update("amountPaid", e.target.value)} />
          </Field>
        )}

        <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Taxable Subtotal</span>
            <span>{money(base)}</span>
          </div>
          <div className="mt-1 flex justify-between text-sm">
            <span className="text-slate-500">GST Applied</span>
            <span>{money(gst)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
            <span>Total Value</span>
            <span>{money(total)}</span>
          </div>
          <div className="mt-1 flex justify-between text-sm font-semibold text-teal-700">
            <span>Net Patient Due</span>
            <span>{money(patientDue)}</span>
          </div>
          {form.status === "Partial" && (
            <div className="mt-1 flex justify-between text-sm font-semibold text-amber-700">
              <span>Balance After Payment</span>
              <span>{money(Math.max(patientDue - Number(form.amountPaid || 0), 0))}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button type="button" className={buttonSecondary} onClick={onClose}>Cancel</button>
          <button type="submit" className={buttonPrimary}><IndianRupee size={17} />Save Invoice</button>
        </div>
      </form>
    </Modal>
  );
}

function BillingPage({ invoices, patients, settings, onAdd, onEdit, onDelete }) {
  const [printInvoice, setPrintInvoice] = useState(null);
  const patientName = (id) => patients.find((p) => p.id === id)?.name || "Unknown";

  const totalCollected = useMemo(
    () => invoices.reduce((sum, i) => sum + invoiceTotals(i).paid, 0),
    [invoices]
  );

  const totalOutstanding = useMemo(
    () => invoices.reduce((sum, i) => sum + invoiceTotals(i).balance, 0),
    [invoices]
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Billing, Invoicing & Receipts</h2>
          <p className="text-sm text-slate-500">GST billing, claims, and patient collection ledgers.</p>
        </div>
        <button className={buttonPrimary} onClick={onAdd}><Plus size={18} />New Invoice</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard icon={CircleDollarSign} label="Settled Revenue" value={money(totalCollected)} />
        <StatCard icon={WalletCards} label="Outstanding Due" value={money(totalOutstanding)} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">Invoice ID</th>
                <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">Patient</th>
                <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">Description</th>
                <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">Total</th>
                <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">Status</th>
                <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const base = Number(inv.subtotal || 0) - Number(inv.discount || 0);
                const total = base + (base * Number(inv.gstRate || 0)) / 100;
                return (
                  <tr key={inv.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition">
                    <td className="px-5 py-4 text-sm font-semibold">{inv.id}</td>
                    <td className="px-5 py-4 text-sm">{patientName(inv.patientId)}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{inv.description}</td>
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      {money(total)}
                      {inv.status === "Partial" && (
                        <span className="block text-[11px] font-normal text-amber-700">Balance {money(invoiceTotals(inv).balance)}</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={inv.status === "Paid" ? "green" : inv.status === "Partial" ? "yellow" : "red"}>
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 cursor-pointer" title="Print Tax Invoice" onClick={() => setPrintInvoice(inv)}>
                          <Printer size={16} />
                        </button>
                        <button className="text-xs font-semibold text-teal-700 hover:text-teal-800 cursor-pointer" onClick={() => onEdit(inv)}>Edit</button>
                        <button className="text-rose-500 hover:text-rose-700 cursor-pointer" onClick={() => onDelete(inv)}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-10">
                    <EmptyState title="No invoices created" text="Issue GST invoices for consultations and chairside dental treatments." onAction={onAdd} actionLabel="Create Invoice" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {printInvoice && (
        <PrintableReceipt
          invoice={printInvoice}
          patient={patients.find((p) => p.id === printInvoice.patientId)}
          settings={settings}
          onClose={() => setPrintInvoice(null)}
        />
      )}
    </div>
  );
}

/* =========================================================
   INVENTORY MODULE
========================================================= */

function InventoryModal({ item, onClose, onSave }) {
  const [form, setForm] = useState(item || emptyInventory);
  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.item.trim()) return alert("Item name is required.");
    onSave({
      ...form,
      id: form.id || makeId("inv_item"),
      quantity: Number(form.quantity || 0),
      reorderLevel: Number(form.reorderLevel || 0),
    });
  };

  return (
    <Modal title={item?.id ? "Edit Stock Item" : "Add Clinical Material"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Item Name">
            <input className={inputClass} value={form.item} onChange={(e) => update("item", e.target.value)} required />
          </Field>
          <Field label="Category">
            <select className={inputClass} value={form.category} onChange={(e) => update("category", e.target.value)}>
              <option>Dental Material</option>
              <option>Medication</option>
              <option>Endodontic Files</option>
              <option>Impression Materials</option>
              <option>Consumables & PPE</option>
              <option>Surgical Equipment</option>
            </select>
          </Field>
          <Field label="Quantity in Stock">
            <input type="number" min="0" className={inputClass} value={form.quantity} onChange={(e) => update("quantity", e.target.value)} required />
          </Field>
          <Field label="Packaging Unit">
            <input className={inputClass} value={form.unit} onChange={(e) => update("unit", e.target.value)} placeholder="pcs, boxes, cartridges" />
          </Field>
          <Field label="Reorder Threshold">
            <input type="number" min="0" className={inputClass} value={form.reorderLevel} onChange={(e) => update("reorderLevel", e.target.value)} />
          </Field>
          <Field label="Supplier Name">
            <input className={inputClass} value={form.supplier} onChange={(e) => update("supplier", e.target.value)} />
          </Field>
          <Field label="Batch Number">
            <input className={inputClass} value={form.batchNo} onChange={(e) => update("batchNo", e.target.value)} />
          </Field>
          <Field label="Expiry Date">
            <input type="date" className={inputClass} value={form.expiry} onChange={(e) => update("expiry", e.target.value)} />
          </Field>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button type="button" className={buttonSecondary} onClick={onClose}>Cancel</button>
          <button type="submit" className={buttonPrimary}><Package size={17} />Save Material</button>
        </div>
      </form>
    </Modal>
  );
}

function InventoryPage({ inventory, search, onAdd, onEdit, onDelete }) {
  const filtered = useMemo(() => {
    const q = (search || "").toLowerCase();
    return inventory.filter(
      (i) =>
        i.item?.toLowerCase().includes(q) ||
        i.category?.toLowerCase().includes(q) ||
        i.supplier?.toLowerCase().includes(q)
    );
  }, [inventory, search]);

  const lowStock = useMemo(
    () => filtered.filter((i) => Number(i.quantity) <= Number(i.reorderLevel)),
    [filtered]
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Clinical Inventory & Supplies</h2>
          <p className="text-sm text-slate-500">Track composites, burs, anesthetics, and clinical disposables.</p>
        </div>
        <button className={buttonPrimary} onClick={onAdd}><Plus size={18} />Add Material</button>
      </div>

      {lowStock.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 text-amber-600 shrink-0" size={20} />
          <div>
            <p className="font-semibold text-amber-900">Stock Reorder Alert</p>
            <p className="text-sm text-amber-800">{lowStock.length} dental supplies have fallen below their safe threshold.</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => {
          const low = Number(item.quantity) <= Number(item.reorderLevel);
          return (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900">{item.item}</p>
                  <p className="text-xs text-slate-500">{item.category}</p>
                </div>
                <Badge tone={low ? "red" : "green"}>{low ? "Reorder" : "In Stock"}</Badge>
              </div>

              <div className="mt-5 flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-slate-900">{item.quantity}</p>
                  <p className="text-xs text-slate-500">{item.unit}</p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p>Reorder at: {item.reorderLevel}</p>
                  <p className="truncate max-w-[120px]">{item.supplier || "Vendor unassigned"}</p>
                </div>
              </div>

              <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                <button className="flex-1 rounded-lg bg-slate-50 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer" onClick={() => onEdit(item)}>
                  Edit
                </button>
                <button className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 cursor-pointer" onClick={() => onDelete(item)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <EmptyState title="No inventory items" text="Log dental supplies to prevent stockouts during procedures." onAction={onAdd} actionLabel="Add Stock Item" />
      )}
    </div>
  );
}

/* =========================================================
   STAFF MODULE
========================================================= */

function StaffModal({ staff, onClose, onSave }) {
  const [form, setForm] = useState(staff || emptyStaff);
  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert("Staff member name is required.");
    onSave({ ...form, id: form.id || makeId("staff") });
  };

  return (
    <Modal title={staff?.id ? "Edit Team Member" : "Add Dental Doctor / Staff"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full Name">
            <input className={inputClass} value={form.name} onChange={(e) => update("name", e.target.value)} required />
          </Field>
          <Field label="Clinical Role">
            <select className={inputClass} value={form.role} onChange={(e) => update("role", e.target.value)}>
              <option>Dentist</option>
              <option>Endodontist Specialist</option>
              <option>Orthodontist Specialist</option>
              <option>Oral & Maxillofacial Surgeon</option>
              <option>Periodontist Specialist</option>
              <option>Dental Hygienist</option>
              <option>Dental Chair Assistant</option>
              <option>Front Desk Executive</option>
            </select>
          </Field>
          <Field label="Phone">
            <input className={inputClass} value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </Field>
          <Field label="Email">
            <input type="email" className={inputClass} value={form.email} onChange={(e) => update("email", e.target.value)} />
          </Field>
          <Field label="Dental Council Reg No">
            <input className={inputClass} value={form.registrationNo} onChange={(e) => update("registrationNo", e.target.value)} placeholder="State Dental Council Reg No" />
          </Field>
          <Field label="Department">
            <select className={inputClass} value={form.department} onChange={(e) => update("department", e.target.value)}>
              <option>Clinical</option>
              <option>Diagnostics</option>
              <option>Front Office</option>
              <option>Sterilization & Ops</option>
            </select>
          </Field>
          <Field label="Status">
            <select className={inputClass} value={form.status} onChange={(e) => update("status", e.target.value)}>
              <option>Active</option>
              <option>On Leave</option>
              <option>Inactive</option>
            </select>
          </Field>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button type="button" className={buttonSecondary} onClick={onClose}>Cancel</button>
          <button type="submit" className={buttonPrimary}><ShieldCheck size={17} />Save Staff Member</button>
        </div>
      </form>
    </Modal>
  );
}

function StaffPage({ staff, onAdd, onEdit, onDelete }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Clinic Team & Practitioners</h2>
          <p className="text-sm text-slate-500">Doctors, visiting specialists, hygienists, and chair assistants.</p>
        </div>
        <button className={buttonPrimary} onClick={onAdd}><Plus size={18} />Add Staff</button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {staff.map((member) => (
          <div key={member.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-100 font-bold text-teal-700">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{member.name}</p>
                  <p className="text-xs text-slate-500">{member.role}</p>
                </div>
              </div>
              <Badge tone={member.status === "Active" ? "green" : "yellow"}>{member.status}</Badge>
            </div>

            <div className="mt-5 space-y-1.5 text-sm text-slate-600">
              <p className="flex items-center gap-2"><Phone size={14} className="text-slate-400" />{member.phone || "—"}</p>
              <p className="text-xs text-slate-500">{member.email || "No email"}</p>
              <p className="text-xs text-slate-500">Dept: {member.department}</p>
              {member.registrationNo && <p className="text-xs text-cyan-800 font-semibold">Reg: {member.registrationNo}</p>}
            </div>

            <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
              <button className="flex-1 rounded-lg bg-slate-50 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer" onClick={() => onEdit(member)}>
                Edit
              </button>
              <button className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 cursor-pointer" onClick={() => onDelete(member)}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {staff.length === 0 && (
        <EmptyState title="No practitioners listed" text="Register clinic doctors and support personnel." onAction={onAdd} actionLabel="Add Staff" />
      )}
    </div>
  );
}

/* =========================================================
   RADIOLOGY MODULE
========================================================= */

function RadiologyModal({ study, patients, onClose, onSave }) {
  const [form, setForm] = useState(study || emptyRadiology);
  const [uploading, setUploading] = useState(false);
  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.patientId) return alert("Select a patient.");
    onSave({ ...form, id: form.id || makeId("rad") });
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const previousPath = form.imageStoragePath;
      const uploaded = await uploadImage(file);
      if (previousPath) await removeStoredImage(previousPath);
      update("imageUrl", uploaded.url);
      update("imageStoragePath", uploaded.path);
    } catch (err) {
      alert(err.message || "Upload failed. Check your connection and Storage rules.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal title={study?.id ? "Edit Radiology Study" : "New Radiology Study"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Patient">
            <select className={inputClass} value={form.patientId} onChange={(e) => update("patientId", e.target.value)} required>
              <option value="">Select patient</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Imaging Modality">
            <select className={inputClass} value={form.modality} onChange={(e) => update("modality", e.target.value)}>
              <option>OPG (Orthopantomogram)</option>
              <option>IOPA (Intraoral Periapical)</option>
              <option>Bitewing Radiograph</option>
              <option>CBCT (Cone Beam CT)</option>
              <option>Lateral Cephalogram</option>
              <option>Intraoral Camera Image</option>
            </select>
          </Field>
          <Field label="Study Date">
            <input type="date" className={inputClass} value={form.studyDate} onChange={(e) => update("studyDate", e.target.value)} required />
          </Field>
          <Field label="Report Status">
            <select className={inputClass} value={form.status} onChange={(e) => update("status", e.target.value)}>
              <option>Draft</option>
              <option>Reported</option>
              <option>Reviewed</option>
            </select>
          </Field>
        </div>

        <Field label="Radiological Findings">
          <textarea className={inputClass} rows="3" value={form.findings} onChange={(e) => update("findings", e.target.value)} placeholder="Periapical radiolucency, alveolar crestal bone loss, impacted teeth, TMJ condyle morphology..." />
        </Field>

        <Field label="Impression / Radiographic Diagnosis">
          <textarea className={inputClass} rows="2" value={form.impression} onChange={(e) => update("impression", e.target.value)} placeholder="e.g. Bilateral horizontally impacted third molars, chronic apical periodontitis..." />
        </Field>

        <div className="space-y-3">
          <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Radiograph / OPG image</span>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input className={inputClass} value={form.imageUrl} onChange={(e) => { update("imageUrl", e.target.value); update("imageStoragePath", ""); }} placeholder="Paste image URL or upload a scan" />
            <label className={`${buttonSecondary} shrink-0 cursor-pointer`}>
              <ImageIcon size={16} /> {uploading ? "Uploading..." : "Upload scan"}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
          </div>
          {form.imageUrl && (
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 p-2">
              <img src={form.imageUrl} alt="Radiograph preview" className="mx-auto max-h-64 rounded-xl object-contain" />
              <button type="button" title="Remove scan" onClick={async () => { await removeStoredImage(form.imageStoragePath); update("imageUrl", ""); update("imageStoragePath", ""); }} className="absolute right-4 top-4 rounded-xl bg-rose-600 p-2 text-white shadow-lg hover:bg-rose-700">
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button type="button" className={buttonSecondary} onClick={onClose}>Cancel</button>
          <button type="submit" className={buttonPrimary} disabled={uploading}><FileText size={17} />{study?.id ? "Save changes" : "Save radiograph"}</button>
        </div>
      </form>
    </Modal>
  );
}

function RadiologyPage({ radiology, patients, onAdd, onEdit, onDelete }) {
  const patientName = (id) => patients.find((p) => p.id === id)?.name || "Unknown patient";
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Radiology & Clinical Imaging</h2>
          <p className="text-sm text-slate-500">IOPA, OPG, CBCT scans and diagnostic reports.</p>
        </div>
        <button className={buttonPrimary} onClick={onAdd}><Plus size={18} />New Study</button>
      </div>

      <div className="space-y-3">
        {radiology.map((study) => (
          <div key={study.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex flex-col gap-4 md:flex-row md:items-start">
              <div className="rounded-xl bg-purple-50 p-3 text-purple-700 shrink-0">
                <Activity size={22} />
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-slate-900">{patientName(study.patientId)}</h3>
                  <Badge tone="purple">{study.modality}</Badge>
                  <Badge tone="green">{study.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-400">Date: {study.studyDate}</p>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Findings</p>
                    <p className="mt-1 text-sm text-slate-700">{study.findings || "No findings recorded."}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Impression</p>
                    <p className="mt-1 text-sm text-slate-700">{study.impression || "No impression entered."}</p>
                  </div>
                </div>

                {study.imageUrl && (
                  <div className="mt-3">
                    <button
                      onClick={() => setSelectedImage(study.imageUrl)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 cursor-pointer"
                    >
                      <ImageIcon size={14} /> Open Full View Scan →
                    </button>
                  </div>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <button type="button" title="Edit study" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-teal-700 cursor-pointer" onClick={() => onEdit(study)}>
                  <FileText size={17} />
                </button>
                <button type="button" title="Delete study" className="rounded-xl p-2 text-rose-500 hover:bg-rose-50 cursor-pointer" onClick={() => onDelete(study)}>
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {radiology.length === 0 && (
          <EmptyState title="No radiology records" text="Archive dental radiographs and diagnosis summaries." onAction={onAdd} actionLabel="New Study" />
        )}
      </div>

      {selectedImage && (
        <Modal title="Radiological Examination View" onClose={() => setSelectedImage(null)} width="max-w-4xl">
          <div className="flex justify-center bg-black rounded-xl p-2">
            <img src={selectedImage} alt="Radiological Examination" className="max-h-[75vh] object-contain rounded-lg" />
          </div>
        </Modal>
      )}
    </div>
  );
}

/* =========================================================
   SETTINGS MODULE
========================================================= */

function SettingsPage({ settings, onSave }) {
  const [form, setForm] = useState(settings);
  useEffect(() => setForm(settings), [settings]);
  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Practice Settings & Prescriptions</h2>
        <p className="text-sm text-slate-500">Configure clinic letterhead, consultation fees, and billing identifiers.</p>
      </div>

      <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Clinic / Practice Name">
            <input className={inputClass} value={form.clinicName || ""} onChange={(e) => update("clinicName", e.target.value)} required />
          </Field>
          <Field label="Clinical Registration No">
            <input className={inputClass} value={form.registrationNo || ""} onChange={(e) => update("registrationNo", e.target.value)} />
          </Field>
          <Field label="GSTIN / Tax ID">
            <input className={inputClass} value={form.gstin || ""} onChange={(e) => update("gstin", e.target.value)} />
          </Field>
          <Field label="Official Phone">
            <input className={inputClass} value={form.phone || ""} onChange={(e) => update("phone", e.target.value)} />
          </Field>
          <Field label="Official Email">
            <input type="email" className={inputClass} value={form.email || ""} onChange={(e) => update("email", e.target.value)} />
          </Field>
          <Field label="UPI VPA for Instant Payments">
            <input className={inputClass} value={form.upiId || ""} onChange={(e) => update("upiId", e.target.value)} placeholder="clinic@upi" />
          </Field>
          <Field label="Default Consultation Charge (₹)">
            <input type="number" min="0" className={inputClass} value={form.consultationFee || 0} onChange={(e) => update("consultationFee", e.target.value)} />
          </Field>
          <Field label="Currency">
            <select className={inputClass} value={form.currency || "INR"} onChange={(e) => update("currency", e.target.value)}>
              <option>INR</option>
              <option>USD</option>
              <option>EUR</option>
            </select>
          </Field>
        </div>

        <Field label="Clinic Address (Printed on Receipts)">
          <textarea className={inputClass} rows="3" value={form.address || ""} onChange={(e) => update("address", e.target.value)} />
        </Field>

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button type="submit" className={buttonPrimary}><CheckCircle2 size={17} />Save Practice Settings</button>
        </div>
      </form>
    </div>
  );
}

/* =========================================================
   ERROR BOUNDARY
========================================================= */

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
          <div className="max-w-lg rounded-2xl border border-rose-200 bg-white p-6 shadow-lg">
            <AlertTriangle className="text-rose-600" size={30} />
            <h1 className="mt-4 text-xl font-bold text-slate-900">Application Interrupted</h1>
            <p className="mt-2 text-sm text-slate-600">Please refresh the browser. Verify your network connection and Firestore security rules.</p>
            <pre className="mt-4 overflow-auto rounded-xl bg-slate-100 p-3 text-xs text-rose-700">{this.state.error?.message}</pre>
            <button className={`${buttonPrimary} mt-4`} onClick={() => window.location.reload()}>
              <RefreshCw size={16} /> Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* =========================================================
   MAIN CORE APPLICATION
========================================================= */

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
  const [inventory, setInventory] = useState([]);
  const [staff, setStaff] = useState([]);
  const [radiology, setRadiology] = useState([]);

  const [settings, setSettings] = useState({
    clinicName: "Meridian Dental Practice",
    registrationNo: "",
    gstin: "",
    phone: "",
    email: "",
    address: "",
    upiId: "",
    consultationFee: 500,
    currency: "INR",
  });

  const [patientModal, setPatientModal] = useState(null);
  const [appointmentModal, setAppointmentModal] = useState(null);
  const [invoiceModal, setInvoiceModal] = useState(null);
  const [inventoryModal, setInventoryModal] = useState(null);
  const [staffModal, setStaffModal] = useState(null);
  const [radiologyModal, setRadiologyModal] = useState(null);

  useEffect(() => {
    if (!firebaseConfigured || !auth) {
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return;

    const clinicId = user.uid;

    const subscriptions = [
      { name: "patients", setter: setPatients },
      { name: "appointments", setter: setAppointments },
      { name: "invoices", setter: setInvoices },
      { name: "inventory", setter: setInventory },
      { name: "staff", setter: setStaff },
      { name: "radiology", setter: setRadiology },
    ];

    const unsubs = subscriptions.map(({ name, setter }) =>
      onSnapshot(
        collection(db, "clinics", clinicId, name),
        (snapshot) => {
          setter(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        },
        (error) => console.error(`${name} sync error:`, error)
      )
    );

    const unsubSettings = onSnapshot(
      doc(db, "clinics", clinicId, "settings", "practice"),
      (snapshot) => {
        if (snapshot.exists()) {
          setSettings((prev) => ({ ...prev, ...snapshot.data() }));
        }
      },
      (error) => console.error("Settings sync error:", error)
    );

    return () => {
      unsubs.forEach((unsub) => unsub());
      unsubSettings();
    };
  }, [user]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  async function saveRecord(collectionName, item, message) {
    if (!user || !db) return;
    try {
      // Settings live at clinics/{uid}/settings/practice; other records use their own id.
      await setDoc(
        doc(db, "clinics", user.uid, collectionName, item.id),
        { ...item, updatedAt: serverTimestamp() },
        { merge: true }
      );
      setToast(message);
    } catch (err) {
      console.error(`Failed to save to ${collectionName}:`, err);
      alert("Failed to save to database. Check your connection and try again.");
    }
  }

  async function deleteRecord(collectionName, id, message, item = null) {
    if (!user || !db) return;
    if (!window.confirm("Permanently delete this record? This cannot be undone.")) return;
    try {
      if (item?.opgStoragePath) await removeStoredImage(item.opgStoragePath);
      if (item?.imageStoragePath) await removeStoredImage(item.imageStoragePath);
      await deleteDoc(doc(db, "clinics", user.uid, collectionName, id));
      setToast(message);
    } catch (err) {
      console.error(`Failed to delete from ${collectionName}:`, err);
      alert(err?.message || "Deletion failed. Please try again.");
    }
  }

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

  if (!firebaseConfigured || !auth || !db) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-2xl border border-amber-200 bg-white p-6 shadow-lg">
          <AlertTriangle className="text-amber-600" size={30} />
          <h1 className="mt-4 text-xl font-bold text-slate-900">Firebase is not configured</h1>
          <p className="mt-2 text-sm text-slate-600">
            Add your Firebase keys (VITE_FIREBASE_* variables) in your .env file locally and in your Vercel project settings, then redeploy.
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginScreen
        onGoogle={async () => {
          try {
            await loginWithGoogle();
          } catch (err) {
            alert(err.message || "Google authentication failed.");
          }
        }}
        loading={authLoading}
      />
    );
  }

  return (
    <ErrorBoundary>
      <style>{`@media print { body * { visibility: hidden; } #printable-receipt, #printable-receipt * { visibility: visible; } #printable-receipt { position: fixed; left: 0; top: 0; width: 100%; background: #fff; padding: 24px; } .no-print { display: none !important; } }`}</style>
      <div className="min-h-screen bg-[#f5f7f8]">
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
          open={sidebarOpen}
          setOpen={setSidebarOpen}
          user={user}
          onLogout={logoutUser}
        />

        <div className="lg:pl-64">
          <Topbar activePage={activePage} setOpen={setSidebarOpen} search={search} setSearch={setSearch} />

          <main className="p-4 lg:p-6">
            {activePage === "dashboard" && (
              <Dashboard
                patients={patients}
                appointments={appointments}
                invoices={invoices}
                inventory={inventory}
                setActivePage={setActivePage}
              />
            )}

            {activePage === "patients" && (
              <PatientsPage
                patients={patients}
                search={search}
                onAdd={() => setPatientModal({ ...emptyPatient })}
                onEdit={(pt) => setPatientModal(pt)}
                onDelete={(pt) => deleteRecord("patients", pt.id, "Patient record removed.", pt)}
              />
            )}

            {activePage === "appointments" && (
              <AppointmentsPage
                appointments={appointments}
                patients={patients}
                search={search}
                onAdd={() =>
                  setAppointmentModal({
                    ...emptyAppointment,
                    doctor: staff.find((s) => s.role?.includes("Dentist"))?.name || "",
                  })
                }
                onEdit={(apt) => setAppointmentModal(apt)}
                onDelete={(apt) => deleteRecord("appointments", apt.id, "Appointment cancelled.")}
              />
            )}

            {activePage === "billing" && (
              <BillingPage
                invoices={invoices}
                patients={patients}
                settings={settings}
                onAdd={() =>
                  setInvoiceModal({
                    ...emptyInvoice,
                    subtotal: Number(settings.consultationFee || 500),
                  })
                }
                onEdit={(inv) => setInvoiceModal(inv)}
                onDelete={(inv) => deleteRecord("invoices", inv.id, "Invoice removed.")}
              />
            )}

            {activePage === "inventory" && (
              <InventoryPage
                inventory={inventory}
                search={search}
                onAdd={() => setInventoryModal({ ...emptyInventory })}
                onEdit={(item) => setInventoryModal(item)}
                onDelete={(item) => deleteRecord("inventory", item.id, "Stock item deleted.")}
              />
            )}

            {activePage === "staff" && (
              <StaffPage
                staff={staff}
                onAdd={() => setStaffModal({ ...emptyStaff })}
                onEdit={(member) => setStaffModal(member)}
                onDelete={(member) => deleteRecord("staff", member.id, "Staff profile removed.")}
              />
            )}

            {activePage === "radiology" && (
              <RadiologyPage
                radiology={radiology}
                patients={patients}
                onAdd={() => setRadiologyModal({ ...emptyRadiology })}
                onEdit={(rad) => setRadiologyModal(rad)}
                onDelete={(rad) => deleteRecord("radiology", rad.id, "Radiology study removed.", rad)}
              />
            )}

            {activePage === "settings" && (
              <SettingsPage
                settings={settings}
                onSave={async (newSettings) => {
                  setSettings(newSettings);
                  await saveRecord("settings", { ...newSettings, id: "practice" }, "Practice profile saved.");
                }}
              />
            )}
          </main>
        </div>

        <Toast toast={toast} onClose={() => setToast("")} />

        {patientModal && (
          <PatientModal
            patient={patientModal.id ? patientModal : null}
            onClose={() => setPatientModal(null)}
            onSave={async (pt) => {
              await saveRecord("patients", pt, "Patient saved.");
              setPatientModal(null);
            }}
          />
        )}

        {appointmentModal && (
          <AppointmentModal
            appointment={appointmentModal.id ? appointmentModal : null}
            patients={patients}
            staff={staff}
            onClose={() => setAppointmentModal(null)}
            onSave={async (apt) => {
              await saveRecord("appointments", apt, "Appointment scheduled.");
              setAppointmentModal(null);
            }}
          />
        )}

        {invoiceModal && (
          <InvoiceModal
            invoice={invoiceModal.id ? invoiceModal : null}
            patients={patients}
            onClose={() => setInvoiceModal(null)}
            onSave={async (inv) => {
              await saveRecord("invoices", inv, "Invoice issued.");
              setInvoiceModal(null);
            }}
          />
        )}

        {inventoryModal && (
          <InventoryModal
            item={inventoryModal.id ? inventoryModal : null}
            onClose={() => setInventoryModal(null)}
            onSave={async (item) => {
              await saveRecord("inventory", item, "Inventory updated.");
              setInventoryModal(null);
            }}
          />
        )}

        {staffModal && (
          <StaffModal
            staff={staffModal.id ? staffModal : null}
            onClose={() => setStaffModal(null)}
            onSave={async (member) => {
              await saveRecord("staff", member, "Staff saved.");
              setStaffModal(null);
            }}
          />
        )}

        {radiologyModal && (
          <RadiologyModal
            study={radiologyModal.id ? radiologyModal : null}
            patients={patients}
            onClose={() => setRadiologyModal(null)}
            onSave={async (study) => {
              await saveRecord("radiology", study, "Radiology report archived.");
              setRadiologyModal(null);
            }}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;

