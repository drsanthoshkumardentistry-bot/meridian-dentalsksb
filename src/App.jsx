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
  IndianRupee,
  LogIn,
  LogOut,
  Menu,
  Package,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Stethoscope,
  Trash2,
  UserRound,
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
   HELPERS
========================================================= */

const makeId = (prefix = "id") =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const todayString = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 10);
};

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;

const emptyPatient = {
  name: "",
  phone: "",
  email: "",
  dob: "",
  gender: "Not specified",
  bloodGroup: "",
  allergies: "",
  medicalHistory: "",
  medications: "",
  emergencyContact: "",
  insuranceProvider: "",
  insurancePolicy: "",
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
  description: "Dental consultation",
  subtotal: "0",
  discount: "0",
  gstRate: "0",
  insuranceCoverage: "0",
  dueDate: todayString(),
  status: "Unpaid",
};

const emptyInventory = {
  item: "",
  category: "Dental Material",
  quantity: "0",
  unit: "pcs",
  reorderLevel: "5",
  supplier: "",
  batchNo: "",
  expiry: "",
};

const emptyStaff = {
  name: "",
  role: "Doctor",
  phone: "",
  email: "",
  registrationNo: "",
  department: "Clinical",
  status: "Active",
};

const emptyRadiology = {
  patientId: "",
  modality: "IOPA",
  studyDate: todayString(),
  findings: "",
  impression: "",
  imageUrl: "",
  status: "Reported",
};

const demoPatients = [
  {
    id: "p001",
    name: "Arun Kumar",
    phone: "9876543210",
    email: "arun@example.com",
    dob: "1988-05-14",
    gender: "Male",
    bloodGroup: "B+",
    allergies: "None known",
    medicalHistory: "No significant history",
    medications: "",
    emergencyContact: "9876500000",
    insuranceProvider: "Star Health",
    insurancePolicy: "SH-10021",
  },
  {
    id: "p002",
    name: "Priya S",
    phone: "9840012345",
    email: "priya@example.com",
    dob: "1992-11-20",
    gender: "Female",
    bloodGroup: "O+",
    allergies: "Penicillin",
    medicalHistory: "Hypothyroidism",
    medications: "Thyroxine",
    emergencyContact: "9840098765",
    insuranceProvider: "",
    insurancePolicy: "",
  },
  {
    id: "p003",
    name: "Rahul Menon",
    phone: "9789011223",
    email: "rahul@example.com",
    dob: "1979-03-02",
    gender: "Male",
    bloodGroup: "A+",
    allergies: "",
    medicalHistory: "Hypertension",
    medications: "Amlodipine",
    emergencyContact: "9789011000",
    insuranceProvider: "HDFC ERGO",
    insurancePolicy: "HE-88331",
  },
];

const demoAppointments = [
  {
    id: "a001",
    patientId: "p001",
    doctor: "Dr. Santhosh Kumar",
    date: todayString(),
    time: "09:30",
    duration: "30",
    type: "Consultation",
    status: "Confirmed",
    notes: "Routine examination",
  },
  {
    id: "a002",
    patientId: "p002",
    doctor: "Dr. Santhosh Kumar",
    date: todayString(),
    time: "10:30",
    duration: "45",
    type: "RCT",
    status: "Scheduled",
    notes: "Continue treatment",
  },
  {
    id: "a003",
    patientId: "p003",
    doctor: "Dr. Priya",
    date: todayString(),
    time: "12:00",
    duration: "30",
    type: "Cleaning",
    status: "Scheduled",
    notes: "",
  },
];

const demoInvoices = [
  {
    id: "i001",
    patientId: "p001",
    description: "Consultation + IOPA",
    subtotal: 1200,
    discount: 0,
    gstRate: 0,
    insuranceCoverage: 0,
    dueDate: todayString(),
    status: "Paid",
  },
  {
    id: "i002",
    patientId: "p002",
    description: "Root Canal Treatment",
    subtotal: 8500,
    discount: 500,
    gstRate: 0,
    insuranceCoverage: 2000,
    dueDate: todayString(),
    status: "Unpaid",
  },
  {
    id: "i003",
    patientId: "p003",
    description: "Scaling",
    subtotal: 1800,
    discount: 0,
    gstRate: 0,
    insuranceCoverage: 0,
    dueDate: todayString(),
    status: "Partial",
  },
];

const demoInventory = [
  {
    id: "inv001",
    item: "Lidocaine 2%",
    category: "Medication",
    quantity: 18,
    unit: "cartridges",
    reorderLevel: 10,
    supplier: "Dental Supplier",
    batchNo: "LD2401",
    expiry: "2027-05-31",
  },
  {
    id: "inv002",
    item: "Composite Resin A2",
    category: "Dental Material",
    quantity: 4,
    unit: "syringes",
    reorderLevel: 5,
    supplier: "3M",
    batchNo: "CR883",
    expiry: "2027-01-31",
  },
  {
    id: "inv003",
    item: "Gloves",
    category: "Consumable",
    quantity: 12,
    unit: "boxes",
    reorderLevel: 5,
    supplier: "MedSupply",
    batchNo: "GL990",
    expiry: "2029-01-01",
  },
];

const demoStaff = [
  {
    id: "s001",
    name: "Dr. Santhosh Kumar",
    role: "Doctor",
    phone: "9876543210",
    email: "doctor@clinic.com",
    registrationNo: "DENT-12345",
    department: "Clinical",
    status: "Active",
  },
  {
    id: "s002",
    name: "Priya",
    role: "Reception",
    phone: "9840011111",
    email: "reception@clinic.com",
    registrationNo: "",
    department: "Front Office",
    status: "Active",
  },
  {
    id: "s003",
    name: "Karthik",
    role: "Dental Assistant",
    phone: "9789000000",
    email: "assistant@clinic.com",
    registrationNo: "",
    department: "Clinical",
    status: "Active",
  },
];

const demoRadiology = [
  {
    id: "r001",
    patientId: "p001",
    modality: "IOPA",
    studyDate: todayString(),
    findings: "Periapical radiolucency noted.",
    impression: "Recommend clinical correlation.",
    imageUrl: "",
    status: "Reported",
  },
];

/* =========================================================
   UI COMPONENTS
========================================================= */

function Modal({ title, children, onClose, width = "max-w-2xl" }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div
        className={`w-full ${width} max-h-[92vh] overflow-hidden rounded-2xl bg-white shadow-2xl`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={19} />
          </button>
        </div>

        <div className="max-h-[calc(92vh-70px)] overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </div>
  );
}

function Toast({ toast, onClose }) {
  if (!toast) return null;

  return (
    <div className="fixed right-5 top-5 z-[100] flex max-w-sm items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xl">
      <CheckCircle2 className="mt-0.5 text-emerald-600" size={19} />
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-900">{toast}</p>
      </div>
      <button onClick={onClose}>
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
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        styles[tone] || styles.slate
      }`}
    >
      {children}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, subtitle }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
          )}
        </div>

        <div className="rounded-xl bg-cyan-50 p-3 text-cyan-700">
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <ClipboardList className="mx-auto text-slate-300" size={38} />
      <h3 className="mt-3 font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{text}</p>
    </div>
  );
}

/* =========================================================
   FORM FIELD
========================================================= */

function Field({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100";

const buttonPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700";

const buttonSecondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50";

/* =========================================================
   LOGIN
========================================================= */

function LoginScreen({ onDemo, onGoogle }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-slate-100 p-5">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-600 text-white">
          <Stethoscope size={31} />
        </div>

        <h1 className="mt-5 text-center text-2xl font-bold text-slate-900">
          Meridian Dental OS
        </h1>

        <p className="mt-2 text-center text-sm text-slate-500">
          Dental practice management and clinical workspace
        </p>

        <div className="mt-8 space-y-3">
          {firebaseConfigured && (
            <button
              className={`${buttonPrimary} w-full`}
              onClick={onGoogle}
            >
              <LogIn size={18} />
              Sign in with Google
            </button>
          )}

          <button
            className={`${buttonSecondary} w-full`}
            onClick={onDemo}
          >
            <Activity size={18} />
            Open Demo Workspace
          </button>
        </div>

        {!firebaseConfigured && (
          <div className="mt-5 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
            Firebase is not configured yet. Demo Workspace is available now.
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   SIDEBAR
========================================================= */

const navigation = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "appointments", label: "Appointments", icon: CalendarDays },
  { id: "patients", label: "Patients", icon: Users },
  { id: "radiology", label: "Radiology", icon: Activity },
  { id: "billing", label: "Billing & Insurance", icon: WalletCards },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "staff", label: "Staff & Roles", icon: ShieldCheck },
  { id: "settings", label: "Practice Settings", icon: Settings },
];

function Sidebar({
  activePage,
  setActivePage,
  open,
  setOpen,
  user,
  onLogout,
}) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-600 text-white">
            <Stethoscope size={19} />
          </div>
          <div>
            <p className="font-bold text-slate-900">Meridian</p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
              Dental OS
            </p>
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
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                  active
                    ? "bg-cyan-50 text-cyan-700"
                    : "text-slate-600 hover:bg-slate-50"
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
          <div className="mb-3 rounded-xl bg-slate-50 p-3">
            <p className="truncate text-sm font-semibold text-slate-800">
              {user?.displayName || "Demo User"}
            </p>
            <p className="truncate text-xs text-slate-500">
              {user?.email || "demo@meridian.local"}
            </p>
          </div>

          <button
            onClick={onLogout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

/* =========================================================
   TOPBAR
========================================================= */

function Topbar({ activePage, setOpen, search, setSearch }) {
  const title =
    navigation.find((item) => item.id === activePage)?.label || "Dashboard";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:px-6">
      <button
        className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
        onClick={() => setOpen(true)}
      >
        <Menu size={20} />
      </button>

      <div className="min-w-0">
        <h1 className="truncate text-lg font-bold text-slate-900">{title}</h1>
      </div>

      <div className="ml-auto hidden w-72 md:block">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={17}
          />
          <input
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-cyan-500"
            placeholder="Search patients..."
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

function Dashboard({
  patients,
  appointments,
  invoices,
  inventory,
  setActivePage,
}) {
  const todayAppointments = appointments.filter(
    (a) => a.date === todayString()
  );

  const revenue = invoices
    .filter((i) => i.status === "Paid")
    .reduce((sum, i) => {
      const total =
        Number(i.subtotal || 0) -
        Number(i.discount || 0) +
        ((Number(i.subtotal || 0) - Number(i.discount || 0)) *
          Number(i.gstRate || 0)) /
          100;

      return sum + Math.max(total - Number(i.insuranceCoverage || 0), 0);
    }, 0);

  const outstanding = invoices
    .filter((i) => i.status !== "Paid")
    .reduce((sum, i) => {
      const base =
        Number(i.subtotal || 0) -
        Number(i.discount || 0);

      const total = base + (base * Number(i.gstRate || 0)) / 100;

      return (
        sum +
        Math.max(total - Number(i.insuranceCoverage || 0), 0)
      );
    }, 0);

  const lowStock = inventory.filter(
    (item) =>
      Number(item.quantity || 0) <= Number(item.reorderLevel || 0)
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Good morning 👋
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Here is today's practice overview.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={CalendarDays}
          label="Today's appointments"
          value={todayAppointments.length}
          subtitle="Scheduled for today"
        />
        <StatCard
          icon={Users}
          label="Total patients"
          value={patients.length}
          subtitle="Active patient records"
        />
        <StatCard
          icon={CircleDollarSign}
          label="Collected revenue"
          value={money(revenue)}
          subtitle="Paid invoices"
        />
        <StatCard
          icon={WalletCards}
          label="Outstanding"
          value={money(outstanding)}
          subtitle="Patient / insurance due"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900">
                Today's appointments
              </h3>
              <p className="text-xs text-slate-500">
                Your upcoming clinical schedule
              </p>
            </div>

            <button
              className="text-sm font-semibold text-cyan-700"
              onClick={() => setActivePage("appointments")}
            >
              View all
            </button>
          </div>

          {todayAppointments.length === 0 ? (
            <EmptyState
              title="No appointments"
              text="There are no appointments scheduled today."
            />
          ) : (
            <div className="space-y-2">
              {todayAppointments
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((appointment) => {
                  const patient = patients.find(
                    (p) => p.id === appointment.patientId
                  );

                  return (
                    <div
                      key={appointment.id}
                      className="flex items-center gap-4 rounded-xl border border-slate-100 p-3"
                    >
                      <div className="w-16 text-center">
                        <p className="font-bold text-slate-900">
                          {appointment.time}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {appointment.duration} min
                        </p>
                      </div>

                      <div className="h-9 w-px bg-slate-200" />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {patient?.name || "Unknown patient"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {appointment.type} · {appointment.doctor}
                        </p>
                      </div>

                      <Badge
                        tone={
                          appointment.status === "Confirmed"
                            ? "green"
                            : "blue"
                        }
                      >
                        {appointment.status}
                      </Badge>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-slate-900">Attention required</h3>
          <p className="mt-1 text-xs text-slate-500">
            Items that may need action.
          </p>

          <div className="mt-5 space-y-3">
            <button
              onClick={() => setActivePage("inventory")}
              className="flex w-full items-center gap-3 rounded-xl bg-amber-50 p-3 text-left"
            >
              <AlertTriangle className="text-amber-600" size={20} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">
                  Low stock
                </p>
                <p className="text-xs text-slate-500">
                  {lowStock.length} items need review
                </p>
              </div>
              <ChevronRight size={17} />
            </button>

            <button
              onClick={() => setActivePage("billing")}
              className="flex w-full items-center gap-3 rounded-xl bg-red-50 p-3 text-left"
            >
              <WalletCards className="text-red-600" size={20} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">
                  Outstanding billing
                </p>
                <p className="text-xs text-slate-500">
                  {money(outstanding)} pending
                </p>
              </div>
              <ChevronRight size={17} />
            </button>

            <button
              onClick={() => setActivePage("patients")}
              className="flex w-full items-center gap-3 rounded-xl bg-cyan-50 p-3 text-left"
            >
              <Users className="text-cyan-600" size={20} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">
                  Patient records
                </p>
                <p className="text-xs text-slate-500">
                  {patients.length} patients
                </p>
              </div>
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PATIENT MODAL
========================================================= */

function PatientModal({ patient, onClose, onSave }) {
  const [form, setForm] = useState(patient || emptyPatient);

  const update = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Patient name is required.");
      return;
    }

    onSave({
      ...form,
      id: form.id || makeId("patient"),
    });
  };

  return (
    <Modal
      title={patient ? "Edit Patient" : "New Patient"}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              required
            />
          </Field>

          <Field label="Phone">
            <input
              className={inputClass}
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </Field>

          <Field label="Email">
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </Field>

          <Field label="Date of birth">
            <input
              type="date"
              className={inputClass}
              value={form.dob}
              onChange={(e) => update("dob", e.target.value)}
            />
          </Field>

          <Field label="Gender">
            <select
              className={inputClass}
              value={form.gender}
              onChange={(e) => update("gender", e.target.value)}
            >
              <option>Not specified</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </Field>

          <Field label="Blood group">
            <select
              className={inputClass}
              value={form.bloodGroup}
              onChange={(e) => update("bloodGroup", e.target.value)}
            >
              <option value="">Unknown</option>
              <option>A+</option>
              <option>A-</option>
              <option>B+</option>
              <option>B-</option>
              <option>AB+</option>
              <option>AB-</option>
              <option>O+</option>
              <option>O-</option>
            </select>
          </Field>

          <Field label="Emergency contact">
            <input
              className={inputClass}
              value={form.emergencyContact}
              onChange={(e) =>
                update("emergencyContact", e.target.value)
              }
            />
          </Field>

          <Field label="Insurance provider">
            <input
              className={inputClass}
              value={form.insuranceProvider}
              onChange={(e) =>
                update("insuranceProvider", e.target.value)
              }
            />
          </Field>

          <Field label="Insurance policy">
            <input
              className={inputClass}
              value={form.insurancePolicy}
              onChange={(e) =>
                update("insurancePolicy", e.target.value)
              }
            />
          </Field>
        </div>

        <Field label="Allergies">
          <textarea
            className={inputClass}
            rows="2"
            value={form.allergies}
            onChange={(e) => update("allergies", e.target.value)}
          />
        </Field>

        <Field label="Medical history">
          <textarea
            className={inputClass}
            rows="3"
            value={form.medicalHistory}
            onChange={(e) =>
              update("medicalHistory", e.target.value)
            }
          />
        </Field>

        <Field label="Current medications">
          <textarea
            className={inputClass}
            rows="2"
            value={form.medications}
            onChange={(e) => update("medications", e.target.value)}
          />
        </Field>

        <div className="flex justify-end gap-3">
          <button type="button" className={buttonSecondary} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={buttonPrimary}>
            <CheckCircle2 size={17} />
            Save Patient
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* =========================================================
   PATIENTS
========================================================= */

function PatientsPage({
  patients,
  search,
  onAdd,
  onEdit,
  onDelete,
}) {
  const filtered = patients.filter((patient) => {
    const q = search.toLowerCase();

    return (
      patient.name?.toLowerCase().includes(q) ||
      patient.phone?.toLowerCase().includes(q) ||
      patient.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Patient Registry
          </h2>
          <p className="text-sm text-slate-500">
            Manage demographics and clinical information.
          </p>
        </div>

        <button className={buttonPrimary} onClick={onAdd}>
          <Plus size={18} />
          New Patient
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">
                  Patient
                </th>
                <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">
                  Contact
                </th>
                <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">
                  Gender
                </th>
                <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">
                  Blood
                </th>
                <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">
                  Insurance
                </th>
                <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((patient) => (
                <tr
                  key={patient.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-100 font-bold text-cyan-700">
                        {patient.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">
                          {patient.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {patient.id}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <p className="text-sm text-slate-700">
                      {patient.phone || "—"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {patient.email || "—"}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {patient.gender}
                  </td>

                  <td className="px-5 py-4">
                    <Badge tone="blue">
                      {patient.bloodGroup || "Unknown"}
                    </Badge>
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {patient.insuranceProvider || "Self pay"}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-50"
                        onClick={() => onEdit(patient)}
                      >
                        Edit
                      </button>

                      <button
                        className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                        onClick={() => onDelete(patient)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-10">
                    <EmptyState
                      title="No patients found"
                      text="Try another search or create a new patient."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   APPOINTMENT MODAL
========================================================= */

function AppointmentModal({
  appointment,
  patients,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(
    appointment || emptyAppointment
  );

  const update = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = (e) => {
    e.preventDefault();

    if (!form.patientId) {
      alert("Please select a patient.");
      return;
    }

    if (!form.doctor.trim()) {
      alert("Doctor name is required.");
      return;
    }

    onSave({
      ...form,
      id: form.id || makeId("appointment"),
    });
  };

  return (
    <Modal
      title={appointment ? "Edit Appointment" : "New Appointment"}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Patient">
            <select
              className={inputClass}
              value={form.patientId}
              onChange={(e) =>
                update("patientId", e.target.value)
              }
              required
            >
              <option value="">Select patient</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Doctor">
            <input
              className={inputClass}
              value={form.doctor}
              onChange={(e) => update("doctor", e.target.value)}
              placeholder="Dr. Santhosh Kumar"
              required
            />
          </Field>

          <Field label="Date">
            <input
              type="date"
              className={inputClass}
              value={form.date}
              onChange={(e) => update("date", e.target.value)}
            />
          </Field>

          <Field label="Time">
            <input
              type="time"
              className={inputClass}
              value={form.time}
              onChange={(e) => update("time", e.target.value)}
            />
          </Field>

          <Field label="Duration">
            <select
              className={inputClass}
              value={form.duration}
              onChange={(e) =>
                update("duration", e.target.value)
              }
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
              <option value="90">90 minutes</option>
            </select>
          </Field>

          <Field label="Appointment type">
            <select
              className={inputClass}
              value={form.type}
              onChange={(e) => update("type", e.target.value)}
            >
              <option>Consultation</option>
              <option>Cleaning</option>
              <option>Filling</option>
              <option>RCT</option>
              <option>Extraction</option>
              <option>Crown</option>
              <option>Follow-up</option>
              <option>Emergency</option>
            </select>
          </Field>

          <Field label="Status">
            <select
              className={inputClass}
              value={form.status}
              onChange={(e) => update("status", e.target.value)}
            >
              <option>Scheduled</option>
              <option>Confirmed</option>
              <option>Checked-in</option>
              <option>Completed</option>
              <option>Cancelled</option>
              <option>No-show</option>
            </select>
          </Field>
        </div>

        <Field label="Notes">
          <textarea
            className={inputClass}
            rows="3"
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
          />
        </Field>

        <div className="flex justify-end gap-3">
          <button type="button" className={buttonSecondary} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={buttonPrimary}>
            <CalendarDays size={17} />
            Save Appointment
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* =========================================================
   APPOINTMENTS
========================================================= */

function AppointmentsPage({
  appointments,
  patients,
  onAdd,
  onEdit,
  onDelete,
}) {
  const sorted = [...appointments].sort((a, b) => {
    return `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`);
  });

  const patientName = (id) =>
    patients.find((p) => p.id === id)?.name || "Unknown patient";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Appointment Calendar
          </h2>
          <p className="text-sm text-slate-500">
            Manage your daily clinical schedule.
          </p>
        </div>

        <button className={buttonPrimary} onClick={onAdd}>
          <Plus size={18} />
          New Appointment
        </button>
      </div>

      <div className="space-y-3">
        {sorted.map((appointment) => (
          <div
            key={appointment.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex items-center gap-3 md:w-40">
                <div className="rounded-xl bg-cyan-50 p-3 text-cyan-700">
                  <Clock3 size={20} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">
                    {appointment.time}
                  </p>
                  <p className="text-xs text-slate-500">
                    {appointment.date}
                  </p>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">
                  {patientName(appointment.patientId)}
                </p>
                <p className="text-sm text-slate-500">
                  {appointment.type} · {appointment.doctor}
                </p>
                {appointment.notes && (
                  <p className="mt-1 text-xs text-slate-400">
                    {appointment.notes}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  tone={
                    appointment.status === "Completed"
                      ? "green"
                      : appointment.status === "Cancelled"
                      ? "red"
                      : "blue"
                  }
                >
                  {appointment.status}
                </Badge>

                <button
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-50"
                  onClick={() => onEdit(appointment)}
                >
                  Edit
                </button>

                <button
                  className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                  onClick={() => onDelete(appointment)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {sorted.length === 0 && (
          <EmptyState
            title="No appointments"
            text="Create your first appointment."
          />
        )}
      </div>
    </div>
  );
}

/* =========================================================
   BILLING MODAL
========================================================= */

function InvoiceModal({
  invoice,
  patients,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(invoice || emptyInvoice);

  const update = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const base =
    Number(form.subtotal || 0) - Number(form.discount || 0);

  const gst = (base * Number(form.gstRate || 0)) / 100;

  const total = Math.max(base + gst, 0);

  const patientDue = Math.max(
    total - Number(form.insuranceCoverage || 0),
    0
  );

  const submit = (e) => {
    e.preventDefault();

    if (!form.patientId) {
      alert("Select a patient.");
      return;
    }

    onSave({
      ...form,
      id: form.id || makeId("invoice"),
      subtotal: Number(form.subtotal || 0),
      discount: Number(form.discount || 0),
      gstRate: Number(form.gstRate || 0),
      insuranceCoverage: Number(form.insuranceCoverage || 0),
    });
  };

  return (
    <Modal
      title={invoice ? "Edit Invoice" : "New Invoice"}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Patient">
            <select
              className={inputClass}
              value={form.patientId}
              onChange={(e) =>
                update("patientId", e.target.value)
              }
              required
            >
              <option value="">Select patient</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Description">
            <input
              className={inputClass}
              value={form.description}
              onChange={(e) =>
                update("description", e.target.value)
              }
            />
          </Field>

          <Field label="Subtotal">
            <input
              type="number"
              min="0"
              className={inputClass}
              value={form.subtotal}
              onChange={(e) => update("subtotal", e.target.value)}
            />
          </Field>

          <Field label="Discount">
            <input
              type="number"
              min="0"
              className={inputClass}
              value={form.discount}
              onChange={(e) => update("discount", e.target.value)}
            />
          </Field>

          <Field label="GST %">
            <input
              type="number"
              min="0"
              className={inputClass}
              value={form.gstRate}
              onChange={(e) => update("gstRate", e.target.value)}
            />
          </Field>

          <Field label="Insurance coverage">
            <input
              type="number"
              min="0"
              className={inputClass}
              value={form.insuranceCoverage}
              onChange={(e) =>
                update("insuranceCoverage", e.target.value)
              }
            />
          </Field>

          <Field label="Due date">
            <input
              type="date"
              className={inputClass}
              value={form.dueDate}
              onChange={(e) =>
                update("dueDate", e.target.value)
              }
            />
          </Field>

          <Field label="Status">
            <select
              className={inputClass}
              value={form.status}
              onChange={(e) => update("status", e.target.value)}
            >
              <option>Unpaid</option>
              <option>Partial</option>
              <option>Paid</option>
            </select>
          </Field>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Taxable amount</span>
            <span>{money(base)}</span>
          </div>

          <div className="mt-2 flex justify-between text-sm">
            <span className="text-slate-500">GST</span>
            <span>{money(gst)}</span>
          </div>

          <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 font-bold">
            <span>Total</span>
            <span>{money(total)}</span>
          </div>

          <div className="mt-2 flex justify-between text-sm font-semibold text-cyan-700">
            <span>Patient due</span>
            <span>{money(patientDue)}</span>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" className={buttonSecondary} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={buttonPrimary}>
            <IndianRupee size={17} />
            Save Invoice
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* =========================================================
   BILLING
========================================================= */

function BillingPage({
  invoices,
  patients,
  onAdd,
  onEdit,
  onDelete,
}) {
  const patientName = (id) =>
    patients.find((p) => p.id === id)?.name || "Unknown";

  const totalCollected = invoices
    .filter((i) => i.status === "Paid")
    .reduce((sum, i) => {
      const base =
        Number(i.subtotal || 0) - Number(i.discount || 0);
      const total = base + (base * Number(i.gstRate || 0)) / 100;
      return sum + Math.max(total - Number(i.insuranceCoverage || 0), 0);
    }, 0);

  const totalOutstanding = invoices
    .filter((i) => i.status !== "Paid")
    .reduce((sum, i) => {
      const base =
        Number(i.subtotal || 0) - Number(i.discount || 0);
      const total = base + (base * Number(i.gstRate || 0)) / 100;
      return sum + Math.max(total - Number(i.insuranceCoverage || 0), 0);
    }, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Billing & Insurance
          </h2>
          <p className="text-sm text-slate-500">
            Invoices, collections and insurance coverage.
          </p>
        </div>

        <button className={buttonPrimary} onClick={onAdd}>
          <Plus size={18} />
          New Invoice
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          icon={CircleDollarSign}
          label="Collected"
          value={money(totalCollected)}
        />
        <StatCard
          icon={WalletCards}
          label="Outstanding"
          value={money(totalOutstanding)}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">
                  Invoice
                </th>
                <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">
                  Patient
                </th>
                <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">
                  Description
                </th>
                <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">
                  Amount
                </th>
                <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">
                  Status
                </th>
                <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {invoices.map((invoice) => {
                const base =
                  Number(invoice.subtotal || 0) -
                  Number(invoice.discount || 0);

                const total =
                  base +
                  (base * Number(invoice.gstRate || 0)) / 100;

                return (
                  <tr
                    key={invoice.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-5 py-4 text-sm font-semibold">
                      {invoice.id}
                    </td>
                    <td className="px-5 py-4 text-sm">
                      {patientName(invoice.patientId)}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {invoice.description}
                    </td>
                    <td className="px-5 py-4 font-semibold">
                      {money(total)}
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        tone={
                          invoice.status === "Paid"
                            ? "green"
                            : invoice.status === "Partial"
                            ? "yellow"
                            : "red"
                        }
                      >
                        {invoice.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          className="text-xs font-semibold text-cyan-700"
                          onClick={() => onEdit(invoice)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-red-500"
                          onClick={() => onDelete(invoice)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   INVENTORY MODAL
========================================================= */

function InventoryModal({
  item,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(item || emptyInventory);

  const update = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = (e) => {
    e.preventDefault();

    if (!form.item.trim()) {
      alert("Item name is required.");
      return;
    }

    onSave({
      ...form,
      id: form.id || makeId("inventory"),
      quantity: Number(form.quantity || 0),
      reorderLevel: Number(form.reorderLevel || 0),
    });
  };

  return (
    <Modal title={item ? "Edit Stock Item" : "Add Stock Item"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Item">
            <input
              className={inputClass}
              value={form.item}
              onChange={(e) => update("item", e.target.value)}
              required
            />
          </Field>

          <Field label="Category">
            <select
              className={inputClass}
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
            >
              <option>Dental Material</option>
              <option>Medication</option>
              <option>Consumable</option>
              <option>Equipment</option>
              <option>Laboratory</option>
            </select>
          </Field>

          <Field label="Quantity">
            <input
              type="number"
              min="0"
              className={inputClass}
              value={form.quantity}
              onChange={(e) => update("quantity", e.target.value)}
            />
          </Field>

          <Field label="Unit">
            <input
              className={inputClass}
              value={form.unit}
              onChange={(e) => update("unit", e.target.value)}
            />
          </Field>

          <Field label="Reorder level">
            <input
              type="number"
              min="0"
              className={inputClass}
              value={form.reorderLevel}
              onChange={(e) =>
                update("reorderLevel", e.target.value)
              }
            />
          </Field>

          <Field label="Supplier">
            <input
              className={inputClass}
              value={form.supplier}
              onChange={(e) => update("supplier", e.target.value)}
            />
          </Field>

          <Field label="Batch number">
            <input
              className={inputClass}
              value={form.batchNo}
              onChange={(e) => update("batchNo", e.target.value)}
            />
          </Field>

          <Field label="Expiry">
            <input
              type="date"
              className={inputClass}
              value={form.expiry}
              onChange={(e) => update("expiry", e.target.value)}
            />
          </Field>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" className={buttonSecondary} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={buttonPrimary}>
            <Package size={17} />
            Save Stock
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* =========================================================
   INVENTORY
========================================================= */

function InventoryPage({
  inventory,
  onAdd,
  onEdit,
  onDelete,
}) {
  const lowStock = inventory.filter(
    (i) => Number(i.quantity) <= Number(i.reorderLevel)
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Inventory
          </h2>
          <p className="text-sm text-slate-500">
            Track dental materials, medications and supplies.
          </p>
        </div>

        <button className={buttonPrimary} onClick={onAdd}>
          <Plus size={18} />
          Add Stock
        </button>
      </div>

      {lowStock.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 text-amber-600" size={20} />
          <div>
            <p className="font-semibold text-amber-900">
              Low stock alert
            </p>
            <p className="text-sm text-amber-800">
              {lowStock.length} item(s) are at or below reorder level.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {inventory.map((item) => {
          const low =
            Number(item.quantity) <= Number(item.reorderLevel);

          return (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900">
                    {item.item}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.category}
                  </p>
                </div>

                <Badge tone={low ? "red" : "green"}>
                  {low ? "Reorder" : "In stock"}
                </Badge>
              </div>

              <div className="mt-5 flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-slate-900">
                    {item.quantity}
                  </p>
                  <p className="text-xs text-slate-500">{item.unit}</p>
                </div>

                <div className="text-right text-xs text-slate-500">
                  <p>Reorder at {item.reorderLevel}</p>
                  <p>{item.supplier || "No supplier"}</p>
                </div>
              </div>

              <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                <button
                  className="flex-1 rounded-lg bg-slate-50 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  onClick={() => onEdit(item)}
                >
                  Edit
                </button>

                <button
                  className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                  onClick={() => onDelete(item)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================
   STAFF MODAL
========================================================= */

function StaffModal({ staff, onClose, onSave }) {
  const [form, setForm] = useState(staff || emptyStaff);

  const update = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Staff name is required.");
      return;
    }

    onSave({
      ...form,
      id: form.id || makeId("staff"),
    });
  };

  return (
    <Modal title={staff ? "Edit Staff" : "Add Staff"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              required
            />
          </Field>

          <Field label="Role">
            <select
              className={inputClass}
              value={form.role}
              onChange={(e) => update("role", e.target.value)}
            >
              <option>Doctor</option>
              <option>Dentist</option>
              <option>Dental Assistant</option>
              <option>Reception</option>
              <option>Billing</option>
              <option>Radiology</option>
              <option>Inventory</option>
              <option>Admin</option>
            </select>
          </Field>

          <Field label="Phone">
            <input
              className={inputClass}
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </Field>

          <Field label="Email">
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </Field>

          <Field label="Registration number">
            <input
              className={inputClass}
              value={form.registrationNo}
              onChange={(e) =>
                update("registrationNo", e.target.value)
              }
            />
          </Field>

          <Field label="Department">
            <select
              className={inputClass}
              value={form.department}
              onChange={(e) =>
                update("department", e.target.value)
              }
            >
              <option>Clinical</option>
              <option>Front Office</option>
              <option>Administration</option>
              <option>Diagnostics</option>
            </select>
          </Field>

          <Field label="Status">
            <select
              className={inputClass}
              value={form.status}
              onChange={(e) => update("status", e.target.value)}
            >
              <option>Active</option>
              <option>Inactive</option>
              <option>On leave</option>
            </select>
          </Field>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" className={buttonSecondary} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={buttonPrimary}>
            <ShieldCheck size={17} />
            Save Staff
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* =========================================================
   STAFF
========================================================= */

function StaffPage({ staff, onAdd, onEdit, onDelete }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Staff & Roles
          </h2>
          <p className="text-sm text-slate-500">
            Manage clinic team members.
          </p>
        </div>

        <button className={buttonPrimary} onClick={onAdd}>
          <Plus size={18} />
          Add Staff
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {staff.map((member) => (
          <div
            key={member.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-100 font-bold text-cyan-700">
                  {member.name.charAt(0).toUpperCase()}
                </div>

                <div>
                  <p className="font-bold text-slate-900">
                    {member.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {member.role}
                  </p>
                </div>
              </div>

              <Badge
                tone={member.status === "Active" ? "green" : "yellow"}
              >
                {member.status}
              </Badge>
            </div>

            <div className="mt-5 space-y-2 text-sm text-slate-600">
              <p className="flex items-center gap-2">
                <Phone size={15} />
                {member.phone || "—"}
              </p>
              <p>{member.email || "—"}</p>
              <p>{member.department}</p>
              {member.registrationNo && (
                <p className="text-xs">
                  Reg: {member.registrationNo}
                </p>
              )}
            </div>

            <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
              <button
                className="flex-1 rounded-lg bg-slate-50 py-2 text-xs font-semibold"
                onClick={() => onEdit(member)}
              >
                Edit
              </button>
              <button
                className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                onClick={() => onDelete(member)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   RADIOLOGY
========================================================= */

function RadiologyPage({
  radiology,
  patients,
  onAdd,
  onDelete,
}) {
  const patientName = (id) =>
    patients.find((p) => p.id === id)?.name || "Unknown patient";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Radiology
          </h2>
          <p className="text-sm text-slate-500">
            Store imaging studies and reports.
          </p>
        </div>

        <button className={buttonPrimary} onClick={onAdd}>
          <Plus size={18} />
          New Study
        </button>
      </div>

      <div className="space-y-3">
        {radiology.map((study) => (
          <div
            key={study.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start">
              <div className="rounded-xl bg-purple-50 p-3 text-purple-700">
                <Activity size={22} />
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-slate-900">
                    {patientName(study.patientId)}
                  </h3>
                  <Badge tone="purple">{study.modality}</Badge>
                  <Badge tone="green">{study.status}</Badge>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  Study date: {study.studyDate}
                </p>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-bold uppercase text-slate-400">
                      Findings
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {study.findings || "No findings entered."}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-bold uppercase text-slate-400">
                      Impression
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {study.impression || "No impression entered."}
                    </p>
                  </div>
                </div>
              </div>

              <button
                className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                onClick={() => onDelete(study)}
              >
                <Trash2 size={17} />
              </button>
            </div>
          </div>
        ))}

        {radiology.length === 0 && (
          <EmptyState
            title="No radiology studies"
            text="Create a study to begin."
          />
        )}
      </div>
    </div>
  );
}

/* =========================================================
   RADIOLOGY MODAL
========================================================= */

function RadiologyModal({
  study,
  patients,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(study || emptyRadiology);

  const update = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = (e) => {
    e.preventDefault();

    if (!form.patientId) {
      alert("Select a patient.");
      return;
    }

    onSave({
      ...form,
      id: form.id || makeId("radiology"),
    });
  };

  return (
    <Modal title="Radiology Study" onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Patient">
            <select
              className={inputClass}
              value={form.patientId}
              onChange={(e) =>
                update("patientId", e.target.value)
              }
              required
            >
              <option value="">Select patient</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Modality">
            <select
              className={inputClass}
              value={form.modality}
              onChange={(e) =>
                update("modality", e.target.value)
              }
            >
              <option>IOPA</option>
              <option>OPG</option>
              <option>CBCT</option>
              <option>Cephalogram</option>
              <option>Intraoral Scan</option>
              <option>Other</option>
            </select>
          </Field>

          <Field label="Study date">
            <input
              type="date"
              className={inputClass}
              value={form.studyDate}
              onChange={(e) =>
                update("studyDate", e.target.value)
              }
            />
          </Field>

          <Field label="Status">
            <select
              className={inputClass}
              value={form.status}
              onChange={(e) =>
                update("status", e.target.value)
              }
            >
              <option>Draft</option>
              <option>Reported</option>
              <option>Reviewed</option>
            </select>
          </Field>
        </div>

        <Field label="Findings">
          <textarea
            className={inputClass}
            rows="4"
            value={form.findings}
            onChange={(e) => update("findings", e.target.value)}
          />
        </Field>

        <Field label="Impression">
          <textarea
            className={inputClass}
            rows="3"
            value={form.impression}
            onChange={(e) => update("impression", e.target.value)}
          />
        </Field>

        <Field label="Image URL">
          <input
            className={inputClass}
            value={form.imageUrl}
            onChange={(e) => update("imageUrl", e.target.value)}
            placeholder="Optional"
          />
        </Field>

        <div className="flex justify-end gap-3">
          <button type="button" className={buttonSecondary} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={buttonPrimary}>
            <FileText size={17} />
            Save Study
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* =========================================================
   SETTINGS
========================================================= */

function SettingsPage({ settings, onSave }) {
  const [form, setForm] = useState(settings);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const update = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">
          Practice Settings
        </h2>
        <p className="text-sm text-slate-500">
          Configure your clinic profile and payment details.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Clinic name">
            <input
              className={inputClass}
              value={form.clinicName}
              onChange={(e) =>
                update("clinicName", e.target.value)
              }
            />
          </Field>

          <Field label="Registration number">
            <input
              className={inputClass}
              value={form.registrationNo}
              onChange={(e) =>
                update("registrationNo", e.target.value)
              }
            />
          </Field>

          <Field label="GSTIN">
            <input
              className={inputClass}
              value={form.gstin}
              onChange={(e) => update("gstin", e.target.value)}
            />
          </Field>

          <Field label="Phone">
            <input
              className={inputClass}
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </Field>

          <Field label="Email">
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </Field>

          <Field label="UPI ID">
            <input
              className={inputClass}
              value={form.upiId}
              onChange={(e) => update("upiId", e.target.value)}
              placeholder="clinic@upi"
            />
          </Field>

          <Field label="Consultation fee">
            <input
              type="number"
              className={inputClass}
              value={form.consultationFee}
              onChange={(e) =>
                update("consultationFee", e.target.value)
              }
            />
          </Field>

          <Field label="Currency">
            <select
              className={inputClass}
              value={form.currency}
              onChange={(e) =>
                update("currency", e.target.value)
              }
            >
              <option>INR</option>
              <option>USD</option>
              <option>EUR</option>
            </select>
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Clinic address">
            <textarea
              className={inputClass}
              rows="3"
              value={form.address}
              onChange={(e) =>
                update("address", e.target.value)
              }
            />
          </Field>
        </div>

        <div className="mt-5 flex justify-end">
          <button type="submit" className={buttonPrimary}>
            <CheckCircle2 size={17} />
            Save Settings
          </button>
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

    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
          <div className="max-w-lg rounded-2xl border border-red-200 bg-white p-6 shadow-lg">
            <AlertTriangle className="text-red-600" size={30} />
            <h1 className="mt-4 text-xl font-bold text-slate-900">
              Meridian Dental OS encountered an error
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Reload the application. If the problem continues, check
              the browser console.
            </p>

            <pre className="mt-4 overflow-auto rounded-xl bg-slate-100 p-3 text-xs text-red-700">
              {this.state.error?.message}
            </pre>

            <button
              className={`${buttonPrimary} mt-4`}
              onClick={() => window.location.reload()}
            >
              <RefreshCw size={16} />
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/* =========================================================
   MAIN APP
========================================================= */

function App() {
  const [user, setUser] = useState(null);
  const [demoMode, setDemoMode] = useState(!firebaseConfigured);
  const [authLoading, setAuthLoading] = useState(firebaseConfigured);

  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  const [patients, setPatients] = useState(demoPatients);
  const [appointments, setAppointments] =
    useState(demoAppointments);
  const [invoices, setInvoices] = useState(demoInvoices);
  const [inventory, setInventory] = useState(demoInventory);
  const [staff, setStaff] = useState(demoStaff);
  const [radiology, setRadiology] = useState(demoRadiology);

  const [settings, setSettings] = useState({
    clinicName: "Meridian Dental Clinic",
    registrationNo: "",
    gstin: "",
    phone: "",
    email: "",
    address: "",
    upiId: "",
    consultationFee: "500",
    currency: "INR",
  });

  const [patientModal, setPatientModal] = useState(null);
  const [appointmentModal, setAppointmentModal] = useState(null);
  const [invoiceModal, setInvoiceModal] = useState(null);
  const [inventoryModal, setInventoryModal] = useState(null);
  const [staffModal, setStaffModal] = useState(null);
  const [radiologyModal, setRadiologyModal] = useState(null);

  /* -------------------------------------------------------
     AUTH
  ------------------------------------------------------- */

  useEffect(() => {
    if (!firebaseConfigured) {
      setAuthLoading(false);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setDemoMode(false);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /* -------------------------------------------------------
     FIRESTORE REALTIME DATA
  ------------------------------------------------------- */

  useEffect(() => {
    if (!firebaseConfigured || !user || demoMode) return undefined;

    const clinicId = user.uid;

    const subscriptions = [
      ["patients", setPatients],
      ["appointments", setAppointments],
      ["invoices", setInvoices],
      ["inventory", setInventory],
      ["staff", setStaff],
      ["radiology", setRadiology],
    ];

    const unsubscribers = subscriptions.map(
      ([collectionName, setter]) =>
        onSnapshot(
          collection(db, "clinics", clinicId, collectionName),
          (snapshot) => {
            setter(
              snapshot.docs.map((item) => ({
                id: item.id,
                ...item.data(),
              }))
            );
          },
          (error) => {
            console.error(
              `${collectionName} listener error`,
              error
            );
          }
        )
    );

    const settingsUnsubscribe = onSnapshot(
      doc(db, "clinics", clinicId, "settings", "practice"),
      (snapshot) => {
        if (snapshot.exists()) {
          setSettings((prev) => ({
            ...prev,
            ...snapshot.data(),
          }));
        }
      },
      (error) => {
        console.error("Settings listener error", error);
      }
    );

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      settingsUnsubscribe();
    };
  }, [user, demoMode]);

  /* -------------------------------------------------------
     TOAST
  ------------------------------------------------------- */

  useEffect(() => {
    if (!toast) return undefined;

    const timer = setTimeout(() => {
      setToast("");
    }, 2500);

    return () => clearTimeout(timer);
  }, [toast]);

  const cloudEnabled =
    firebaseConfigured && !!user && !demoMode;

  /* -------------------------------------------------------
     FIRESTORE SAVE
  ------------------------------------------------------- */

  async function saveToCloud(collectionName, item) {
    if (!cloudEnabled) return;

    await setDoc(
      doc(
        db,
        "clinics",
        user.uid,
        collectionName,
        item.id
      ),
      {
        ...item,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  async function removeFromCloud(collectionName, id) {
    if (!cloudEnabled) return;

    await deleteDoc(
      doc(
        db,
        "clinics",
        user.uid,
        collectionName,
        id
      )
    );
  }

  /* -------------------------------------------------------
     GENERIC SAVE
  ------------------------------------------------------- */

  async function handleSave(
    collectionName,
    item,
    setter,
    message
  ) {
    try {
      setter((prev) => {
        const exists = prev.some((x) => x.id === item.id);

        return exists
          ? prev.map((x) => (x.id === item.id ? item : x))
          : [item, ...prev];
      });

      await saveToCloud(collectionName, item);

      setToast(message);
    } catch (error) {
      console.error(error);
      setToast(
        "Saved locally, but cloud sync failed. Check Firebase."
      );
    }
  }

  async function handleDelete(
    collectionName,
    id,
    setter,
    message
  ) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this record?"
    );

    if (!confirmed) return;

    try {
      setter((prev) => prev.filter((item) => item.id !== id));

      await removeFromCloud(collectionName, id);

      setToast(message);
    } catch (error) {
      console.error(error);
      setToast("Delete failed.");
    }
  }

  /* -------------------------------------------------------
     PATIENT SAVE
  ------------------------------------------------------- */

  async function savePatient(patient) {
    await handleSave(
      "patients",
      patient,
      setPatients,
      "Patient saved successfully."
    );

    setPatientModal(null);
  }

  /* -------------------------------------------------------
     APPOINTMENT SAVE
  ------------------------------------------------------- */

  async function saveAppointment(appointment) {
    const collision = appointments.some((existing) => {
      if (existing.id === appointment.id) return false;

      return (
        existing.doctor.trim().toLowerCase() ===
          appointment.doctor.trim().toLowerCase() &&
        existing.date === appointment.date &&
        existing.time === appointment.time &&
        existing.status !== "Cancelled"
      );
    });

    if (collision) {
      alert(
        "This doctor already has an appointment at that date and time."
      );
      return;
    }

    await handleSave(
      "appointments",
      appointment,
      setAppointments,
      "Appointment saved successfully."
    );

    setAppointmentModal(null);
  }

  /* -------------------------------------------------------
     INVOICE SAVE
  ------------------------------------------------------- */

  async function saveInvoice(invoice) {
    await handleSave(
      "invoices",
      invoice,
      setInvoices,
      "Invoice saved successfully."
    );

    setInvoiceModal(null);
  }

  /* -------------------------------------------------------
     INVENTORY SAVE
  ------------------------------------------------------- */

  async function saveInventory(item) {
    await handleSave(
      "inventory",
      item,
      setInventory,
      "Inventory updated successfully."
    );

    setInventoryModal(null);
  }

  /* -------------------------------------------------------
     STAFF SAVE
  ------------------------------------------------------- */

  async function saveStaffMember(member) {
    await handleSave(
      "staff",
      member,
      setStaff,
      "Staff record saved successfully."
    );

    setStaffModal(null);
  }

  /* -------------------------------------------------------
     RADIOLOGY SAVE
  ------------------------------------------------------- */

  async function saveRadiologyStudy(study) {
    await handleSave(
      "radiology",
      study,
      setRadiology,
      "Radiology study saved successfully."
    );

    setRadiologyModal(null);
  }

  /* -------------------------------------------------------
     SETTINGS SAVE
  ------------------------------------------------------- */

  async function saveSettings(nextSettings) {
    setSettings(nextSettings);

    if (cloudEnabled) {
      try {
        await setDoc(
          doc(
            db,
            "clinics",
            user.uid,
            "settings",
            "practice"
          ),
          {
            ...nextSettings,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (error) {
        console.error(error);
      }
    }

    setToast("Practice settings saved.");
  }

  /* -------------------------------------------------------
     LOGOUT
  ------------------------------------------------------- */

  async function logout() {
    if (demoMode) {
      setUser(null);
      setDemoMode(true);
      return;
    }

    try {
      await logoutUser();
    } catch (error) {
      console.error(error);
    }
  }

  async function googleLogin() {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error(error);
      alert(
        error?.message ||
          "Google sign-in failed. Check Firebase configuration."
      );
    }
  }

  /* -------------------------------------------------------
     LOADING
  ------------------------------------------------------- */

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-600" />
          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading Meridian Dental OS...
          </p>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------
     LOGIN
  ------------------------------------------------------- */

  if (!user && !demoMode) {
    return (
      <LoginScreen
        onDemo={() => {
          setDemoMode(true);
          setUser({
            uid: "demo-user",
            displayName: "Demo Administrator",
            email: "demo@meridian.local",
          });
        }}
        onGoogle={googleLogin}
      />
    );
  }

  /* -------------------------------------------------------
     PAGE
  ------------------------------------------------------- */

  let page = null;

  if (activePage === "dashboard") {
    page = (
      <Dashboard
        patients={patients}
        appointments={appointments}
        invoices={invoices}
        inventory={inventory}
        setActivePage={setActivePage}
      />
    );
  }

  if (activePage === "patients") {
    page = (
      <PatientsPage
        patients={patients}
        search={search}
        onAdd={() => setPatientModal({ ...emptyPatient })}
        onEdit={(patient) => setPatientModal(patient)}
        onDelete={(patient) =>
          handleDelete(
            "patients",
            patient.id,
            setPatients,
            "Patient deleted."
          )
        }
      />
    );
  }

  if (activePage === "appointments") {
    page = (
      <AppointmentsPage
        appointments={appointments}
        patients={patients}
        onAdd={() =>
          setAppointmentModal({
            ...emptyAppointment,
            doctor: staff.find(
              (member) =>
                member.role === "Doctor" ||
                member.role === "Dentist"
            )?.name || "",
          })
        }
        onEdit={(appointment) =>
          setAppointmentModal(appointment)
        }
        onDelete={(appointment) =>
          handleDelete(
            "appointments",
            appointment.id,
            setAppointments,
            "Appointment deleted."
          )
        }
      />
    );
  }

  if (activePage === "billing") {
    page = (
      <BillingPage
        invoices={invoices}
        patients={patients}
        onAdd={() =>
          setInvoiceModal({
            ...emptyInvoice,
            subtotal: settings.consultationFee || "500",
          })
        }
        onEdit={(invoice) => setInvoiceModal(invoice)}
        onDelete={(invoice) =>
          handleDelete(
            "invoices",
            invoice.id,
            setInvoices,
            "Invoice deleted."
          )
        }
      />
    );
  }

  if (activePage === "inventory") {
    page = (
      <InventoryPage
        inventory={inventory}
        onAdd={() => setInventoryModal({ ...emptyInventory })}
        onEdit={(item) => setInventoryModal(item)}
        onDelete={(item) =>
          handleDelete(
            "inventory",
            item.id,
            setInventory,
            "Inventory item deleted."
          )
        }
      />
    );
  }

  if (activePage === "staff") {
    page = (
      <StaffPage
        staff={staff}
        onAdd={() => setStaffModal({ ...emptyStaff })}
        onEdit={(member) => setStaffModal(member)}
        onDelete={(member) =>
          handleDelete(
            "staff",
            member.id,
            setStaff,
            "Staff member deleted."
          )
        }
      />
    );
  }

  if (activePage === "radiology") {
    page = (
      <RadiologyPage
        radiology={radiology}
        patients={patients}
        onAdd={() => setRadiologyModal({ ...emptyRadiology })}
        onDelete={(study) =>
          handleDelete(
            "radiology",
            study.id,
            setRadiology,
            "Radiology study deleted."
          )
        }
      />
    );
  }

  if (activePage === "settings") {
    page = (
      <SettingsPage
        settings={settings}
        onSave={saveSettings}
      />
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50">
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
          open={sidebarOpen}
          setOpen={setSidebarOpen}
          user={user}
          onLogout={logout}
        />

        <div className="lg:pl-64">
          <Topbar
            activePage={activePage}
            setOpen={setSidebarOpen}
            search={search}
            setSearch={setSearch}
          />

          <main className="p-4 lg:p-6">{page}</main>
        </div>

        {demoMode && (
          <div className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800 shadow-lg">
            Demo Workspace · Data is stored locally in this session
          </div>
        )}

        <Toast
          toast={toast}
          onClose={() => setToast("")}
        />

        {patientModal && (
          <PatientModal
            patient={patientModal.id ? patientModal : null}
            onClose={() => setPatientModal(null)}
            onSave={savePatient}
          />
        )}

        {appointmentModal && (
          <AppointmentModal
            appointment={
              appointmentModal.id
                ? appointmentModal
                : null
            }
            patients={patients}
            onClose={() => setAppointmentModal(null)}
            onSave={saveAppointment}
          />
        )}

        {invoiceModal && (
          <InvoiceModal
            invoice={
              invoiceModal.id
                ? invoiceModal
                : null
            }
            patients={patients}
            onClose={() => setInvoiceModal(null)}
            onSave={saveInvoice}
          />
        )}

        {inventoryModal && (
          <InventoryModal
            item={
              inventoryModal.id
                ? inventoryModal
                : null
            }
            onClose={() => setInventoryModal(null)}
            onSave={saveInventory}
          />
        )}

        {staffModal && (
          <StaffModal
            staff={
              staffModal.id
                ? staffModal
                : null
            }
            onClose={() => setStaffModal(null)}
            onSave={saveStaffMember}
          />
        )}

        {radiologyModal && (
          <RadiologyModal
            study={
              radiologyModal.id
                ? radiologyModal
                : null
            }
            patients={patients}
            onClose={() => setRadiologyModal(null)}
            onSave={saveRadiologyStudy}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;