import React, { useEffect, useMemo, useState } from "react";
import {
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Users,
  LayoutDashboard,
  Receipt,
  LogOut,
  Plus,
  Trash2,
  IndianRupee,
  Search,
  ShieldCheck,
  Eye,
  BarChart2,
  Lock,
  UserCheck,
  QrCode,
  Package,
  Briefcase,
  CheckCircle2,
  Stethoscope,
  ShieldAlert,
  Building,
  Save,
  Check,
  Phone,
  FileText,
  AlertCircle,
  Settings,
  Activity,
  CreditCard,
  UserPlus,
  ClipboardList,
  RefreshCw,
  Edit3,
  ChevronDown,
  XCircle,
  Wallet,
  Database,
  Menu as MenuIcon,
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import {
  auth,
  loginWithGoogle,
  logoutUser,
  db,
} from "./firebase";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

/* =========================================================
   HELPERS
========================================================= */

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const todayKey = () => {
  const d = new Date();

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${y}-${m}-${day}`;
};

const formatDateKey = (date) => {
  const d = new Date(date);

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${y}-${m}-${day}`;
};

const displayDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const displayDateTime = (value) => {
  if (!value) return "-";

  try {
    const date =
      value?.toDate instanceof Function
        ? value.toDate()
        : new Date(value);

    return date.toLocaleString("en-IN");
  } catch {
    return "-";
  }
};

const generateUPIUrl = ({
  upiId,
  clinicName,
  amount,
  invoiceId,
}) => {
  if (!upiId) return "";

  const params = new URLSearchParams({
    pa: upiId,
    pn: clinicName || "Dental Clinic",
    am: Number(amount || 0).toFixed(2),
    cu: "INR",
    tn: invoiceId
      ? `Invoice ${invoiceId}`
      : "Dental consultation",
  });

  return `upi://pay?${params.toString()}`;
};

const createId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;

/* =========================================================
   DENTAL CHART
========================================================= */

const FDI_TEETH = {
  upper: [
    18, 17, 16, 15, 14, 13, 12, 11,
    21, 22, 23, 24, 25, 26, 27, 28,
  ],
  lower: [
    48, 47, 46, 45, 44, 43, 42, 41,
    31, 32, 33, 34, 35, 36, 37, 38,
  ],
};

const TOOTH_CONDITIONS = {
  healthy: {
    label: "Healthy",
    short: "HLT",
    color: "bg-emerald-50 text-emerald-700 border-emerald-300",
  },
  caries: {
    label: "Caries",
    short: "CAR",
    color: "bg-red-50 text-red-700 border-red-300",
  },
  restored: {
    label: "Restored",
    short: "RES",
    color: "bg-blue-50 text-blue-700 border-blue-300",
  },
  rct: {
    label: "RCT",
    short: "RCT",
    color: "bg-purple-50 text-purple-700 border-purple-300",
  },
  crown: {
    label: "Crown",
    short: "CRN",
    color: "bg-amber-50 text-amber-700 border-amber-300",
  },
  bridging: {
    label: "Bridge",
    short: "BRG",
    color: "bg-indigo-50 text-indigo-700 border-indigo-300",
  },
  implanted: {
    label: "Implant",
    short: "IMP",
    color: "bg-teal-50 text-teal-700 border-teal-300",
  },
  fractured: {
    label: "Fractured",
    short: "FRC",
    color: "bg-rose-100 text-rose-800 border-rose-400",
  },
  spacing: {
    label: "Spacing",
    short: "SPC",
    color: "bg-cyan-50 text-cyan-700 border-cyan-300",
  },
  attrited: {
    label: "Attrition",
    short: "ATT",
    color: "bg-orange-50 text-orange-700 border-orange-300",
  },
  malaligned: {
    label: "Malaligned",
    short: "MAL",
    color: "bg-violet-50 text-violet-700 border-violet-300",
  },
  scaling: {
    label: "Scaling",
    short: "SCL",
    color: "bg-yellow-50 text-yellow-800 border-yellow-300",
  },
  bone_deformation: {
    label: "Bone Defect",
    short: "BNE",
    color: "bg-stone-100 text-stone-700 border-stone-400",
  },
  missing: {
    label: "Missing",
    short: "MIS",
    color: "bg-slate-200 text-slate-600 border-slate-400",
  },
};

/* =========================================================
   SHARED UI
========================================================= */

function Button({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  className = "",
  type = "button",
}) {
  const styles = {
    primary:
      "bg-blue-600 hover:bg-blue-700 text-white",
    secondary:
      "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200",
    danger:
      "bg-red-600 hover:bg-red-700 text-white",
    success:
      "bg-emerald-600 hover:bg-emerald-700 text-white",
    dark:
      "bg-slate-900 hover:bg-slate-800 text-white",
    ghost:
      "bg-transparent hover:bg-slate-100 text-slate-600",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  disabled = false,
}) {
  return (
    <label className="block space-y-1.5">
      {label && (
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </span>
      )}

      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-100"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
  required = false,
}) {
  return (
    <label className="block space-y-1.5">
      {label && (
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </span>
      )}

      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
      >
        {children}
      </select>
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}) {
  return (
    <label className="block space-y-1.5">
      {label && (
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
          {label}
        </span>
      )}

      <textarea
        rows={rows}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
      />
    </label>
  );
}

function Badge({ children, color = "slate" }) {
  const colors = {
    slate: "bg-slate-100 text-slate-700",
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
    purple: "bg-purple-50 text-purple-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${colors[color]}`}
    >
      {children}
    </span>
  );
}

function Modal({
  title,
  children,
  onClose,
  width = "max-w-2xl",
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div
        className={`w-full ${width} max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <h2 className="text-lg font-black text-slate-900">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon = Database,
  title,
  description,
  action,
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
      <div className="mb-4 rounded-2xl bg-slate-100 p-4">
        <Icon className="h-7 w-7 text-slate-400" />
      </div>

      <h3 className="font-bold text-slate-800">{title}</h3>

      <p className="mt-1 max-w-md text-sm text-slate-500">
        {description}
      </p>

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* =========================================================
   LOGIN
========================================================= */

function LoginScreen({
  loading,
  onLogin,
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-xl shadow-blue-600/20">
            <Stethoscope className="h-8 w-8" />
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-black">
              Dental Practice OS
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Secure multi-tenant dental practice management,
              clinical charting, billing and operations.
            </p>
          </div>

          <button
            onClick={onLogin}
            disabled={loading}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-5 py-3.5 font-bold text-slate-900 transition hover:bg-slate-100 disabled:opacity-50"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
            >
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>

            {loading
              ? "Authenticating..."
              : "Sign in with Google"}
          </button>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4" />
            <span>Protected clinic workspace</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SIDEBAR
========================================================= */

function Sidebar({
  activeTab,
  setActiveTab,
  open,
  setOpen,
  clinicProfile,
  user,
  onLogout,
}) {
  const items = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "appointments",
      label: "Appointments",
      icon: CalendarIcon,
    },
    {
      id: "patients",
      label: "Patients",
      icon: Users,
    },
    {
      id: "radiology",
      label: "Clinical & Radiology",
      icon: Activity,
    },
    {
      id: "billing",
      label: "Billing & Claims",
      icon: Receipt,
    },
    {
      id: "inventory",
      label: "Stock Inventory",
      icon: Package,
    },
    {
      id: "staff",
      label: "Staff & Roles",
      icon: Briefcase,
    },
    {
      id: "settings",
      label: "Practice Settings",
      icon: Settings,
    },
  ];

  const navigate = (id) => {
    setActiveTab(id);
    setOpen(false);
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Stethoscope className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-black text-slate-900">
                Dental OS
              </p>

              <p className="text-[10px] font-semibold text-slate-400">
                Practice Platform
              </p>
            </div>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-slate-100 p-4">
          <div className="rounded-2xl bg-slate-50 p-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                <Building className="h-5 w-5 text-blue-600" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-800">
                  {clinicProfile.clinicName ||
                    "Your Dental Clinic"}
                </p>

                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {clinicProfile.tagline ||
                    "Practice Workspace"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                  active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-slate-200">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserCheck className="h-5 w-5 text-slate-500" />
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-slate-800">
                {user?.displayName || "Clinic User"}
              </p>

              <p className="truncate text-[10px] text-slate-400">
                {user?.email || ""}
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

/* =========================================================
   TOP BAR
========================================================= */

function TopBar({
  onMenu,
  title,
  search,
  setSearch,
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:px-6">
      <button
        onClick={onMenu}
        className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="hidden text-lg font-black text-slate-900 sm:block">
        {title}
      </h1>

      <div className="ml-auto flex items-center gap-2">
        {search !== undefined && setSearch && (
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-56 rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>
        )}
      </div>
    </header>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

function DashboardView({
  patients,
  appointments,
  invoices,
  inventory,
  setActiveTab,
  setShowAppointmentModal,
  setShowPatientModal,
  clinicProfile,
}) {
  const today = todayKey();

  const todayAppointments = appointments
    .filter((a) => a.date === today)
    .sort((a, b) =>
      String(a.time).localeCompare(String(b.time))
    );

  const paidRevenue = invoices
    .filter((i) => i.status === "Paid")
    .reduce(
      (sum, invoice) =>
        sum + Number(invoice.total || 0),
      0
    );

  const outstanding = invoices
    .filter((i) => i.status !== "Paid")
    .reduce(
      (sum, invoice) =>
        sum + Number(invoice.total || 0),
      0
    );

  const lowStock = inventory.filter(
    (item) =>
      Number(item.qty || 0) <= Number(item.min || 0)
  );

  const chartData = useMemo(() => {
    const map = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);

      const key = formatDateKey(d);

      map[key] = {
        date: key,
        count: 0,
      };
    }

    appointments.forEach((appointment) => {
      if (map[appointment.date]) {
        map[appointment.date].count++;
      }
    });

    return Object.values(map).map((item) => ({
      ...item,
      label: new Date(
        `${item.date}T00:00:00`
      ).toLocaleDateString("en-IN", {
        weekday: "short",
      }),
    }));
  }, [appointments]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white shadow-xl shadow-blue-900/10">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold text-blue-100">
              {displayDate(new Date())}
            </p>

            <h2 className="mt-1 text-2xl font-black">
              {clinicProfile.clinicName ||
                "Your Dental Practice"}
            </h2>

            <p className="mt-1 text-sm text-blue-100">
              Practice operations overview
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setShowPatientModal(true)}
              className="bg-white text-blue-700 hover:bg-blue-50"
            >
              <UserPlus className="h-4 w-4" />
              New Patient
            </Button>

            <Button
              onClick={() => setShowAppointmentModal(true)}
              className="bg-blue-500 text-white hover:bg-blue-400"
            >
              <Plus className="h-4 w-4" />
              Appointment
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Patients"
          value={patients.length}
          icon={Users}
          color="blue"
        />

        <StatCard
          title="Today's Appointments"
          value={todayAppointments.length}
          icon={CalendarIcon}
          color="purple"
        />

        <StatCard
          title="Collected"
          value={formatCurrency(paidRevenue)}
          icon={IndianRupee}
          color="green"
        />

        <StatCard
          title="Outstanding"
          value={formatCurrency(outstanding)}
          icon={Wallet}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 xl:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-900">
                Appointment Activity
              </h3>

              <p className="text-xs text-slate-500">
                Last seven days
              </p>
            </div>

            <BarChart2 className="h-5 w-5 text-blue-500" />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />

                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                />

                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                />

                <Tooltip />

                <Bar
                  dataKey="count"
                  fill="#2563eb"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-900">
                Today's Schedule
              </h3>

              <p className="text-xs text-slate-500">
                {todayAppointments.length} appointments
              </p>
            </div>

            <Clock className="h-5 w-5 text-blue-500" />
          </div>

          {todayAppointments.length === 0 ? (
            <div className="py-12 text-center">
              <CalendarIcon className="mx-auto h-8 w-8 text-slate-300" />

              <p className="mt-3 text-sm font-semibold text-slate-500">
                No appointments today
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppointments.slice(0, 5).map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {appointment.patientName ||
                          appointment.patient ||
                          "Patient"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {appointment.procedure ||
                          "Consultation"}
                      </p>
                    </div>

                    <Badge
                      color={
                        appointment.status === "completed"
                          ? "green"
                          : appointment.status ===
                            "in_progress"
                          ? "blue"
                          : "amber"
                      }
                    >
                      {appointment.status || "scheduled"}
                    </Badge>
                  </div>

                  <p className="mt-2 text-xs font-semibold text-blue-600">
                    {appointment.time || "-"}
                  </p>
                </div>
              ))}
            </div>
          )}

          {todayAppointments.length > 5 && (
            <button
              onClick={() => setActiveTab("appointments")}
              className="mt-4 w-full text-xs font-bold text-blue-600"
            >
              View all appointments
            </button>
          )}
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-600" />

            <div>
              <h3 className="font-black text-amber-900">
                Inventory Replenishment Required
              </h3>

              <p className="mt-1 text-sm text-amber-800">
                {lowStock.length} inventory item
                {lowStock.length !== 1 ? "s are" : " is"} at
                or below minimum stock level.
              </p>

              <button
                onClick={() => setActiveTab("inventory")}
                className="mt-3 text-xs font-black text-amber-900 underline"
              >
                Open inventory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${colors[color]}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <Activity className="h-4 w-4 text-slate-200" />
      </div>

      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">
        {title}
      </p>

      <p className="mt-1 text-2xl font-black text-slate-900">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   APPOINTMENTS
========================================================= */

function AppointmentsView({
  appointments,
  patients,
  selectedDate,
  setSelectedDate,
  onAdd,
  onStatusChange,
  onDelete,
}) {
  const dateKey = formatDateKey(selectedDate);

  const filtered = appointments
    .filter((a) => a.date === dateKey)
    .sort((a, b) =>
      String(a.time).localeCompare(String(b.time))
    );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            Appointments
          </h2>

          <p className="text-sm text-slate-500">
            Manage your clinical schedule
          </p>
        </div>

        <Button onClick={onAdd}>
          <Plus className="h-4 w-4" />
          New Appointment
        </Button>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3">
        <button
          onClick={() =>
            setSelectedDate((d) => {
              const next = new Date(d);
              next.setDate(next.getDate() - 1);
              return next;
            })
          }
          className="rounded-xl p-2 hover:bg-slate-100"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="text-center">
          <p className="text-sm font-black text-slate-900">
            {displayDate(selectedDate)}
          </p>

          <p className="text-xs text-slate-500">
            {filtered.length} appointment
            {filtered.length !== 1 ? "s" : ""}
          </p>
        </div>

        <button
          onClick={() =>
            setSelectedDate((d) => {
              const next = new Date(d);
              next.setDate(next.getDate() + 1);
              return next;
            })
          }
          className="rounded-xl p-2 hover:bg-slate-100"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={CalendarIcon}
          title="No appointments"
          description="There are no appointments scheduled for this date."
          action={
            <Button onClick={onAdd}>
              <Plus className="h-4 w-4" />
              Schedule appointment
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((appointment) => (
            <div
              key={appointment.id}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Clock className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black text-slate-900">
                      {appointment.patientName ||
                        appointment.patient}
                    </h3>

                    <Badge
                      color={
                        appointment.status === "completed"
                          ? "green"
                          : appointment.status ===
                            "in_progress"
                          ? "blue"
                          : "amber"
                      }
                    >
                      {appointment.status || "scheduled"}
                    </Badge>
                  </div>

                  <p className="mt-1 text-sm text-slate-600">
                    {appointment.procedure ||
                      "Dental consultation"}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                    <span>{appointment.time}</span>
                    <span>{appointment.doctor || "Clinician"}</span>
                    {appointment.duration && (
                      <span>{appointment.duration}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={() =>
                      onStatusChange(
                        appointment.id,
                        appointment.status
                      )
                    }
                  >
                    <RefreshCw className="h-4 w-4" />
                    Status
                  </Button>

                  <Button
                    variant="danger"
                    onClick={() =>
                      onDelete(appointment.id)
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   PATIENTS
========================================================= */

function PatientsView({
  patients,
  search,
  setSearch,
  onAdd,
  onOpen,
  onDelete,
}) {
  const filtered = patients.filter((patient) => {
    const q = search.toLowerCase();

    return (
      String(patient.name || "")
        .toLowerCase()
        .includes(q) ||
      String(patient.phone || "")
        .toLowerCase()
        .includes(q) ||
      String(patient.customId || "")
        .toLowerCase()
        .includes(q)
    );
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            Patient Registry
          </h2>

          <p className="text-sm text-slate-500">
            Secure clinical patient records
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative sm:hidden">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patients"
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <Button onClick={onAdd}>
            <UserPlus className="h-4 w-4" />
            New Patient
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={
            patients.length === 0
              ? "No patients yet"
              : "No patients found"
          }
          description={
            patients.length === 0
              ? "Create your first patient record to start using the clinical workspace."
              : "Try a different patient name, ID or phone number."
          }
          action={
            patients.length === 0 && (
              <Button onClick={onAdd}>
                <Plus className="h-4 w-4" />
                Create patient
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {filtered.map((patient) => (
            <div
              key={patient.id}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 font-black text-blue-600">
                  {String(patient.name || "?")
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-black text-slate-900">
                        {patient.name}
                      </h3>

                      <p className="mt-0.5 text-xs text-slate-400">
                        {patient.customId ||
                          patient.id}
                      </p>
                    </div>

                    <button
                      onClick={() => onOpen(patient)}
                      className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="h-4 w-4 text-slate-400" />
                      {patient.phone || "-"}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <CalendarIcon className="h-4 w-4 text-slate-400" />
                      {patient.registeredDate ||
                        displayDate(patient.createdAt)}
                    </div>
                  </div>

                  {patient.medicalHistory?.allergies && (
                    <div className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-700">
                      <span className="font-black">
                        Allergy:
                      </span>{" "}
                      {patient.medicalHistory.allergies}
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => onOpen(patient)}
                    >
                      <Eye className="h-4 w-4" />
                      Clinical Chart
                    </Button>

                    <Button
                      variant="danger"
                      onClick={() =>
                        onDelete(patient.id, patient.name)
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   PATIENT MODAL
========================================================= */

function PatientModal({
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    bloodGroup: "",
    occupation: "",
    address: "",
    emergencyContact: "",
    emergencyPhone: "",
    allergies: "",
    medicalConditions: "",
    medications: "",
    notes: "",
  });

  const [saving, setSaving] = useState(false);

  const update = (key, value) =>
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

  const submit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Patient name is required.");
      return;
    }

    setSaving(true);

    try {
      await onSave({
        customId: createId("PAT"),
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        bloodGroup: form.bloodGroup,
        occupation: form.occupation,
        address: form.address,
        emergencyContact: form.emergencyContact,
        emergencyPhone: form.emergencyPhone,
        registeredDate: new Date().toLocaleDateString(
          "en-IN"
        ),
        medicalHistory: {
          allergies: form.allergies,
          conditions: form.medicalConditions,
          medications: form.medications,
          notes: form.notes,
        },
        radiologyReport: {},
        opgScans: [],
        odontogram: {},
        prescriptions: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Create Patient Record"
      onClose={onClose}
      width="max-w-3xl"
    >
      <form onSubmit={submit} className="space-y-6">
        <div>
          <h3 className="mb-3 text-sm font-black text-slate-900">
            Patient Identity
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Full Name"
              required
              value={form.name}
              onChange={(v) => update("name", v)}
            />

            <Input
              label="Phone"
              value={form.phone}
              onChange={(v) => update("phone", v)}
            />

            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => update("email", v)}
            />

            <Input
              label="Date of Birth"
              type="date"
              value={form.dateOfBirth}
              onChange={(v) =>
                update("dateOfBirth", v)
              }
            />

            <Select
              label="Gender"
              value={form.gender}
              onChange={(v) => update("gender", v)}
            >
              <option value="">Select</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
              <option>Prefer not to say</option>
            </Select>

            <Input
              label="Blood Group"
              value={form.bloodGroup}
              onChange={(v) =>
                update("bloodGroup", v)
              }
            />

            <Input
              label="Occupation"
              value={form.occupation}
              onChange={(v) =>
                update("occupation", v)
              }
            />

            <Input
              label="Emergency Contact"
              value={form.emergencyContact}
              onChange={(v) =>
                update("emergencyContact", v)
              }
            />

            <Input
              label="Emergency Phone"
              value={form.emergencyPhone}
              onChange={(v) =>
                update("emergencyPhone", v)
              }
            />
          </div>

          <div className="mt-4">
            <Textarea
              label="Address"
              value={form.address}
              onChange={(v) => update("address", v)}
            />
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-black text-slate-900">
            Medical Information
          </h3>

          <div className="space-y-4">
            <Textarea
              label="Allergies"
              value={form.allergies}
              onChange={(v) => update("allergies", v)}
              placeholder="Drug / food / material allergies"
            />

            <Textarea
              label="Medical Conditions"
              value={form.medicalConditions}
              onChange={(v) =>
                update("medicalConditions", v)
              }
              placeholder="Diabetes, hypertension, cardiac history..."
            />

            <Textarea
              label="Current Medications"
              value={form.medications}
              onChange={(v) =>
                update("medications", v)
              }
            />

            <Textarea
              label="Clinical Notes"
              value={form.notes}
              onChange={(v) => update("notes", v)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Creating..." : "Create Patient"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* =========================================================
   PATIENT DETAILS
========================================================= */

function PatientDetailsModal({
  patient,
  onClose,
  onSave,
}) {
  const [data, setData] = useState(
    JSON.parse(JSON.stringify(patient))
  );

  const [saving, setSaving] = useState(false);
  const [selectedCondition, setSelectedCondition] =
    useState("healthy");

  const update = (path, value) => {
    setData((prev) => ({
      ...prev,
      [path]: value,
    }));
  };

  const setTooth = (tooth, condition) => {
    setData((prev) => ({
      ...prev,
      odontogram: {
        ...(prev.odontogram || {}),
        [tooth]: condition,
      },
    }));
  };

  const clearTooth = (tooth) => {
    setData((prev) => {
      const odontogram = {
        ...(prev.odontogram || {}),
      };

      delete odontogram[tooth];

      return {
        ...prev,
        odontogram,
      };
    });
  };

  const save = async () => {
    setSaving(true);

    try {
      await onSave({
        ...data,
        updatedAt: serverTimestamp(),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`Clinical Chart — ${patient.name}`}
      onClose={onClose}
      width="max-w-6xl"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div className="rounded-2xl bg-blue-50 p-4">
            <p className="text-xs font-bold uppercase text-blue-500">
              Patient ID
            </p>

            <p className="mt-1 font-black text-blue-900">
              {patient.customId || patient.id}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase text-slate-400">
              Phone
            </p>

            <p className="mt-1 font-black text-slate-800">
              {patient.phone || "-"}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase text-slate-400">
              DOB
            </p>

            <p className="mt-1 font-black text-slate-800">
              {patient.dateOfBirth || "-"}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase text-slate-400">
              Blood Group
            </p>

            <p className="mt-1 font-black text-slate-800">
              {patient.bloodGroup || "-"}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-5">
          <div className="mb-4">
            <h3 className="font-black text-slate-900">
              Medical History
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Textarea
              label="Allergies"
              value={
                data.medicalHistory?.allergies || ""
              }
              onChange={(value) =>
                setData((prev) => ({
                  ...prev,
                  medicalHistory: {
                    ...(prev.medicalHistory || {}),
                    allergies: value,
                  },
                }))
              }
            />

            <Textarea
              label="Medical Conditions"
              value={
                data.medicalHistory?.conditions || ""
              }
              onChange={(value) =>
                setData((prev) => ({
                  ...prev,
                  medicalHistory: {
                    ...(prev.medicalHistory || {}),
                    conditions: value,
                  },
                }))
              }
            />

            <Textarea
              label="Medications"
              value={
                data.medicalHistory?.medications || ""
              }
              onChange={(value) =>
                setData((prev) => ({
                  ...prev,
                  medicalHistory: {
                    ...(prev.medicalHistory || {}),
                    medications: value,
                  },
                }))
              }
            />

            <Textarea
              label="Clinical Notes"
              value={
                data.medicalHistory?.notes || ""
              }
              onChange={(value) =>
                setData((prev) => ({
                  ...prev,
                  medicalHistory: {
                    ...(prev.medicalHistory || {}),
                    notes: value,
                  },
                }))
              }
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-5">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="font-black text-slate-900">
                FDI Odontogram
              </h3>

              <p className="text-xs text-slate-500">
                Select a condition and click a tooth to chart it.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {Object.entries(TOOTH_CONDITIONS).map(
                ([key, condition]) => (
                  <button
                    key={key}
                    onClick={() =>
                      setSelectedCondition(key)
                    }
                    className={`rounded-lg border px-2 py-1 text-[10px] font-bold ${
                      selectedCondition === key
                        ? "ring-2 ring-blue-500 ring-offset-1"
                        : ""
                    } ${condition.color}`}
                  >
                    {condition.short}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="space-y-5">
            <ToothRow
              teeth={FDI_TEETH.upper}
              odontogram={data.odontogram || {}}
              selectedCondition={selectedCondition}
              onSet={setTooth}
              onClear={clearTooth}
            />

            <div className="border-t border-dashed border-slate-200" />

            <ToothRow
              teeth={FDI_TEETH.lower}
              odontogram={data.odontogram || {}}
              selectedCondition={selectedCondition}
              onSet={setTooth}
              onClear={clearTooth}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-5">
          <h3 className="mb-4 font-black text-slate-900">
            Clinical / Radiology Notes
          </h3>

          <div className="space-y-4">
            <Textarea
              label="Diagnosis"
              value={
                data.radiologyReport?.diagnosisNotes ||
                ""
              }
              onChange={(value) =>
                setData((prev) => ({
                  ...prev,
                  radiologyReport: {
                    ...(prev.radiologyReport || {}),
                    diagnosisNotes: value,
                  },
                }))
              }
            />

            <Textarea
              label="Radiographic Findings"
              value={
                data.radiologyReport?.traumaFindings ||
                ""
              }
              onChange={(value) =>
                setData((prev) => ({
                  ...prev,
                  radiologyReport: {
                    ...(prev.radiologyReport || {}),
                    traumaFindings: value,
                  },
                }))
              }
            />

            <Textarea
              label="Bone / Periodontal Findings"
              value={
                data.radiologyReport?.boneStatus ||
                ""
              }
              onChange={(value) =>
                setData((prev) => ({
                  ...prev,
                  radiologyReport: {
                    ...(prev.radiologyReport || {}),
                    boneStatus: value,
                  },
                }))
              }
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Close
          </Button>

          <Button
            onClick={save}
            disabled={saving}
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Clinical Chart"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ToothRow({
  teeth,
  odontogram,
  selectedCondition,
  onSet,
  onClear,
}) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-8 lg:grid-cols-16">
      {teeth.map((tooth) => {
        const conditionKey =
          odontogram[tooth] || "healthy";

        const condition =
          TOOTH_CONDITIONS[conditionKey] ||
          TOOTH_CONDITIONS.healthy;

        return (
          <button
            key={tooth}
            onClick={() =>
              onSet(tooth, selectedCondition)
            }
            onContextMenu={(e) => {
              e.preventDefault();
              onClear(tooth);
            }}
            title={`${tooth}: ${condition.label}. Right-click to clear.`}
            className={`relative min-h-16 rounded-xl border p-2 transition hover:-translate-y-0.5 hover:shadow-sm ${condition.color}`}
          >
            <span className="block text-xs font-black">
              {tooth}
            </span>

            <span className="mt-1 block text-[9px] font-bold">
              {condition.short}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* =========================================================
   APPOINTMENT MODAL
========================================================= */

function AppointmentModal({
  patients,
  staff,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    patientId: "",
    date: todayKey(),
    time: "09:00 AM",
    duration: "30 min",
    procedure: "Consultation",
    doctor: "",
    notes: "",
  });

  const [saving, setSaving] = useState(false);

  const update = (key, value) =>
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

  const submit = async (e) => {
    e.preventDefault();

    if (!form.patientId) {
      alert("Select a patient.");
      return;
    }

    setSaving(true);

    try {
      const patient = patients.find(
        (p) => p.id === form.patientId
      );

      await onSave({
        patientId: patient.id,
        patientName: patient.name,
        date: form.date,
        time: form.time,
        duration: form.duration,
        procedure: form.procedure,
        doctor: form.doctor,
        notes: form.notes,
        status: "scheduled",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="New Appointment"
      onClose={onClose}
      width="max-w-2xl"
    >
      <form onSubmit={submit} className="space-y-5">
        {patients.length === 0 ? (
          <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
            Create a patient before scheduling an appointment.
          </div>
        ) : (
          <>
            <Select
              label="Patient"
              required
              value={form.patientId}
              onChange={(v) =>
                update("patientId", v)
              }
            >
              <option value="">Select patient</option>

              {patients.map((patient) => (
                <option
                  key={patient.id}
                  value={patient.id}
                >
                  {patient.name} —{" "}
                  {patient.customId || patient.id}
                </option>
              ))}
            </Select>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Date"
                type="date"
                required
                value={form.date}
                onChange={(v) =>
                  update("date", v)
                }
              />

              <Input
                label="Time"
                type="time"
                value={form.time}
                onChange={(v) => update("time", v)}
              />

              <Select
                label="Duration"
                value={form.duration}
                onChange={(v) =>
                  update("duration", v)
                }
              >
                <option>15 min</option>
                <option>30 min</option>
                <option>45 min</option>
                <option>60 min</option>
                <option>90 min</option>
                <option>120 min</option>
              </Select>

              <Select
                label="Clinician"
                value={form.doctor}
                onChange={(v) =>
                  update("doctor", v)
                }
              >
                <option value="">Select clinician</option>

                {staff
                  .filter(
                    (person) =>
                      person.status !== "Inactive"
                  )
                  .map((person) => (
                    <option
                      key={person.id}
                      value={person.name}
                    >
                      {person.name}
                    </option>
                  ))}
              </Select>
            </div>

            <Input
              label="Procedure / Appointment Type"
              value={form.procedure}
              onChange={(v) =>
                update("procedure", v)
              }
            />

            <Textarea
              label="Notes"
              value={form.notes}
              onChange={(v) => update("notes", v)}
            />
          </>
        )}

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={saving || patients.length === 0}
          >
            <CalendarIcon className="h-4 w-4" />
            {saving ? "Scheduling..." : "Schedule"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* =========================================================
   BILLING
========================================================= */

function BillingView({
  invoices,
  patients,
  clinicProfile,
  onCreate,
  onPayment,
  onDelete,
}) {
  const [filter, setFilter] = useState("all");

  const filtered = invoices.filter((invoice) => {
    if (filter === "all") return true;

    return String(invoice.status).toLowerCase() === filter;
  });

  const outstanding = invoices
    .filter((i) => i.status !== "Paid")
    .reduce(
      (sum, i) => sum + Number(i.total || 0),
      0
    );

  const collected = invoices
    .filter((i) => i.status === "Paid")
    .reduce(
      (sum, i) => sum + Number(i.total || 0),
      0
    );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            Billing & Claims
          </h2>

          <p className="text-sm text-slate-500">
            Invoices, payments and insurance workflows
          </p>
        </div>

        <Button onClick={onCreate}>
          <Plus className="h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          title="Collected"
          value={formatCurrency(collected)}
          icon={CheckCircle2}
          color="green"
        />

        <StatCard
          title="Outstanding"
          value={formatCurrency(outstanding)}
          icon={Receipt}
          color="amber"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {["all", "unpaid", "paid"].map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={`rounded-xl px-4 py-2 text-sm font-bold capitalize ${
              filter === item
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No invoices"
          description="Create your first invoice when a billable service is ready."
          action={
            <Button onClick={onCreate}>
              <Plus className="h-4 w-4" />
              Create invoice
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((invoice) => {
            const insurance =
              invoice.insurance || null;

            return (
              <div
                key={invoice.id}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Receipt className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-slate-900">
                        {invoice.customNo ||
                          invoice.id}
                      </h3>

                      <Badge
                        color={
                          invoice.status === "Paid"
                            ? "green"
                            : "amber"
                        }
                      >
                        {invoice.status || "Unpaid"}
                      </Badge>

                      {insurance && (
                        <Badge color="purple">
                          <ShieldCheck className="mr-1 h-3 w-3" />
                          {insurance.claimStatus ||
                            "Insurance"}
                        </Badge>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-slate-600">
                      {invoice.patientName ||
                        invoice.patient ||
                        "Patient"}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                      <span>
                        {invoice.date || "-"}
                      </span>

                      {invoice.dueDate && (
                        <span>
                          Due {invoice.dueDate}
                        </span>
                      )}

                      {insurance?.provider && (
                        <span>
                          {insurance.provider}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-left lg:text-right">
                    <p className="text-xl font-black text-slate-900">
                      {formatCurrency(invoice.total)}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2 lg:justify-end">
                      {invoice.status !== "Paid" && (
                        <Button
                          variant="success"
                          onClick={() =>
                            onPayment(invoice)
                          }
                        >
                          <QrCode className="h-4 w-4" />
                          UPI
                        </Button>
                      )}

                      <Button
                        variant="danger"
                        onClick={() =>
                          onDelete(invoice.id)
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {Array.isArray(invoice.items) &&
                  invoice.items.length > 0 && (
                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <div className="space-y-2">
                        {invoice.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between text-xs"
                          >
                            <span className="text-slate-600">
                              {item.name} × {item.qty}
                            </span>

                            <span className="font-bold text-slate-800">
                              {formatCurrency(
                                Number(item.qty) *
                                  Number(item.rate)
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   INVOICE MODAL
========================================================= */

function InvoiceModal({
  patients,
  onClose,
  onSave,
}) {
  const [patientId, setPatientId] = useState("");
  const [items, setItems] = useState([
    {
      id: createId("ITEM"),
      name: "",
      qty: 1,
      rate: 0,
    },
  ]);

  const [insuranceEnabled, setInsuranceEnabled] =
    useState(false);

  const [insurance, setInsurance] = useState({
    provider: "",
    policyNo: "",
    claimId: "",
    coverageAmt: 0,
    claimStatus: "Pending",
  });

  const [saving, setSaving] = useState(false);

  const patient = patients.find(
    (p) => p.id === patientId
  );

  const total = items.reduce(
    (sum, item) =>
      sum +
      Number(item.qty || 0) *
        Number(item.rate || 0),
    0
  );

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: createId("ITEM"),
        name: "",
        qty: 1,
        rate: 0,
      },
    ]);
  };

  const removeItem = (id) => {
    setItems((prev) =>
      prev.length === 1
        ? prev
        : prev.filter((item) => item.id !== id)
    );
  };

  const updateItem = (id, key, value) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [key]: value,
            }
          : item
      )
    );
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!patient) {
      alert("Select a patient.");
      return;
    }

    if (total <= 0) {
      alert("Invoice total must be greater than zero.");
      return;
    }

    setSaving(true);

    try {
      await onSave({
        customNo: `INV-${new Date().getFullYear()}-${Date.now()
          .toString()
          .slice(-6)}`,
        patientId: patient.id,
        patientName: patient.name,
        date: new Date().toLocaleDateString(
          "en-IN"
        ),
        dueDate: new Date(
          Date.now() + 7 * 86400000
        ).toLocaleDateString("en-IN"),
        items: items.map((item) => ({
          ...item,
          qty: Number(item.qty),
          rate: Number(item.rate),
        })),
        total,
        status: "Unpaid",
        insurance: insuranceEnabled
          ? {
              ...insurance,
              coverageAmt: Number(
                insurance.coverageAmt || 0
              ),
            }
          : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Create Invoice"
      onClose={onClose}
      width="max-w-3xl"
    >
      <form onSubmit={submit} className="space-y-6">
        <Select
          label="Patient"
          required
          value={patientId}
          onChange={setPatientId}
        >
          <option value="">Select patient</option>

          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.customId || p.id}
            </option>
          ))}
        </Select>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-black text-slate-900">
              Billable Items
            </h3>

            <Button
              variant="secondary"
              onClick={addItem}
            >
              <Plus className="h-4 w-4" />
              Add item
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-2"
              >
                <div className="col-span-12 sm:col-span-6">
                  <Input
                    label="Description"
                    value={item.name}
                    onChange={(v) =>
                      updateItem(
                        item.id,
                        "name",
                        v
                      )
                    }
                  />
                </div>

                <div className="col-span-5 sm:col-span-2">
                  <Input
                    label="Qty"
                    type="number"
                    value={item.qty}
                    onChange={(v) =>
                      updateItem(
                        item.id,
                        "qty",
                        v
                      )
                    }
                  />
                </div>

                <div className="col-span-5 sm:col-span-3">
                  <Input
                    label="Rate"
                    type="number"
                    value={item.rate}
                    onChange={(v) =>
                      updateItem(
                        item.id,
                        "rate",
                        v
                      )
                    }
                  />
                </div>

                <div className="col-span-2 flex items-end">
                  <button
                    type="button"
                    onClick={() =>
                      removeItem(item.id)
                    }
                    className="mb-0.5 rounded-xl p-2.5 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900 p-5 text-white">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-300">
              Invoice Total
            </span>

            <span className="text-2xl font-black">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-5">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={insuranceEnabled}
              onChange={(e) =>
                setInsuranceEnabled(
                  e.target.checked
                )
              }
              className="h-4 w-4 rounded border-slate-300 text-blue-600"
            />

            <span className="font-bold text-slate-800">
              Insurance / TPA claim
            </span>
          </label>

          {insuranceEnabled && (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Provider"
                value={insurance.provider}
                onChange={(v) =>
                  setInsurance((p) => ({
                    ...p,
                    provider: v,
                  }))
                }
              />

              <Input
                label="Policy Number"
                value={insurance.policyNo}
                onChange={(v) =>
                  setInsurance((p) => ({
                    ...p,
                    policyNo: v,
                  }))
                }
              />

              <Input
                label="Claim ID"
                value={insurance.claimId}
                onChange={(v) =>
                  setInsurance((p) => ({
                    ...p,
                    claimId: v,
                  }))
                }
              />

              <Input
                label="Coverage Amount"
                type="number"
                value={insurance.coverageAmt}
                onChange={(v) =>
                  setInsurance((p) => ({
                    ...p,
                    coverageAmt: v,
                  }))
                }
              />

              <Select
                label="Claim Status"
                value={insurance.claimStatus}
                onChange={(v) =>
                  setInsurance((p) => ({
                    ...p,
                    claimStatus: v,
                  }))
                }
              >
                <option>Pending</option>
                <option>Pre-Auth Requested</option>
                <option>Pre-Auth Approved</option>
                <option>Claim Submitted</option>
                <option>Claim Approved</option>
                <option>Claim Rejected</option>
              </Select>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button type="submit" disabled={saving}>
            <Receipt className="h-4 w-4" />
            {saving
              ? "Creating..."
              : "Create Invoice"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* =========================================================
   UPI MODAL
========================================================= */

function UPIPaymentModal({
  invoice,
  clinicProfile,
  onClose,
  onMarkPaid,
}) {
  const upiUrl = generateUPIUrl({
    upiId: clinicProfile.upiId,
    clinicName: clinicProfile.clinicName,
    amount: invoice.total,
    invoiceId:
      invoice.customNo || invoice.id,
  });

  const [processing, setProcessing] =
    useState(false);

  const markPaid = async () => {
    setProcessing(true);

    try {
      await onMarkPaid(invoice.id);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Modal
      title="UPI Payment"
      onClose={onClose}
      width="max-w-md"
    >
      <div className="text-center">
        <div className="rounded-2xl bg-slate-50 p-6">
          <QrCode className="mx-auto h-28 w-28 text-slate-300" />

          <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">
            Payment amount
          </p>

          <p className="mt-1 text-3xl font-black text-slate-900">
            {formatCurrency(invoice.total)}
          </p>
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 p-4 text-left">
          <p className="text-xs font-bold uppercase text-slate-400">
            UPI ID
          </p>

          <p className="mt-1 break-all font-bold text-slate-800">
            {clinicProfile.upiId || "Not configured"}
          </p>
        </div>

        {!clinicProfile.upiId && (
          <div className="mt-4 rounded-xl bg-amber-50 p-3 text-left text-xs text-amber-800">
            Configure your UPI settlement ID in Practice
            Settings before accepting UPI payments.
          </div>
        )}

        {upiUrl && (
          <a
            href={upiUrl}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700"
          >
            <CreditCard className="h-4 w-4" />
            Open UPI Payment App
          </a>
        )}

        <Button
          className="mt-3 w-full"
          variant="success"
          onClick={markPaid}
          disabled={processing}
        >
          <CheckCircle2 className="h-4 w-4" />
          {processing
            ? "Updating..."
            : "Mark Invoice Paid"}
        </Button>

        <p className="mt-4 text-[11px] leading-5 text-slate-400">
          Payment status should only be marked paid after
          the clinic has independently confirmed receipt.
        </p>
      </div>
    </Modal>
  );
}

/* =========================================================
   INVENTORY
========================================================= */

function InventoryView({
  inventory,
  onAdd,
  onUpdate,
  onDelete,
}) {
  const lowStock = inventory.filter(
    (item) =>
      Number(item.qty || 0) <=
      Number(item.min || 0)
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            Stock Inventory
          </h2>

          <p className="text-sm text-slate-500">
            Materials, medications and consumables
          </p>
        </div>

        <Button onClick={onAdd}>
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      {lowStock.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600" />

            <div>
              <p className="font-bold text-amber-900">
                {lowStock.length} item
                {lowStock.length !== 1
                  ? "s"
                  : ""} require replenishment
              </p>

              <p className="mt-1 text-xs text-amber-800">
                Items at or below minimum stock level are
                highlighted below.
              </p>
            </div>
          </div>
        </div>
      )}

      {inventory.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Inventory is empty"
          description="Add consumables, medications and clinical materials to begin tracking stock."
          action={
            <Button onClick={onAdd}>
              <Plus className="h-4 w-4" />
              Add inventory
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-[11px] font-black uppercase text-slate-400">
                    Item
                  </th>

                  <th className="px-5 py-3 text-left text-[11px] font-black uppercase text-slate-400">
                    Category
                  </th>

                  <th className="px-5 py-3 text-left text-[11px] font-black uppercase text-slate-400">
                    Quantity
                  </th>

                  <th className="px-5 py-3 text-left text-[11px] font-black uppercase text-slate-400">
                    Minimum
                  </th>

                  <th className="px-5 py-3 text-left text-[11px] font-black uppercase text-slate-400">
                    Status
                  </th>

                  <th className="px-5 py-3 text-right text-[11px] font-black uppercase text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {inventory.map((item) => {
                  const low =
                    Number(item.qty || 0) <=
                    Number(item.min || 0);

                  return (
                    <tr key={item.id}>
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-800">
                          {item.name}
                        </p>

                        <p className="text-xs text-slate-400">
                          {item.id}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {item.category || "-"}
                      </td>

                      <td className="px-5 py-4 text-sm font-black text-slate-800">
                        {item.qty}{" "}
                        <span className="font-normal text-slate-400">
                          {item.unit}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {item.min}
                      </td>

                      <td className="px-5 py-4">
                        <Badge color={low ? "red" : "green"}>
                          {low
                            ? "Replenish"
                            : "In Stock"}
                        </Badge>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="secondary"
                            onClick={() =>
                              onUpdate(item)
                            }
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="danger"
                            onClick={() =>
                              onDelete(item.id)
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   STOCK MODAL
========================================================= */

function StockModal({
  item,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    name: item?.name || "",
    category: item?.category || "",
    qty: item?.qty ?? 0,
    min: item?.min ?? 0,
    unit: item?.unit || "Units",
    supplier: item?.supplier || "",
    notes: item?.notes || "",
  });

  const [saving, setSaving] = useState(false);

  const update = (key, value) =>
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

  const submit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Item name is required.");
      return;
    }

    setSaving(true);

    try {
      await onSave({
        ...form,
        qty: Number(form.qty || 0),
        min: Number(form.min || 0),
        id: item?.id || createId("STK"),
        createdAt:
          item?.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={item ? "Edit Stock Item" : "Add Stock Item"}
      onClose={onClose}
      width="max-w-xl"
    >
      <form onSubmit={submit} className="space-y-5">
        <Input
          label="Item Name"
          required
          value={form.name}
          onChange={(v) => update("name", v)}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Category"
            value={form.category}
            onChange={(v) =>
              update("category", v)
            }
          />

          <Input
            label="Unit"
            value={form.unit}
            onChange={(v) => update("unit", v)}
          />

          <Input
            label="Current Quantity"
            type="number"
            value={form.qty}
            onChange={(v) => update("qty", v)}
          />

          <Input
            label="Minimum Quantity"
            type="number"
            value={form.min}
            onChange={(v) => update("min", v)}
          />

          <Input
            label="Supplier"
            value={form.supplier}
            onChange={(v) =>
              update("supplier", v)
            }
          />
        </div>

        <Textarea
          label="Notes"
          value={form.notes}
          onChange={(v) => update("notes", v)}
        />

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Item"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* =========================================================
   STAFF
========================================================= */

function StaffView({
  staff,
  onAdd,
  onDelete,
  onToggle,
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            Staff & Roles
          </h2>

          <p className="text-sm text-slate-500">
            Manage clinical and operational team records
          </p>
        </div>

        <Button onClick={onAdd}>
          <Plus className="h-4 w-4" />
          Add Staff
        </Button>
      </div>

      {staff.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No staff records"
          description="Add your clinicians and practice staff."
          action={
            <Button onClick={onAdd}>
              <Plus className="h-4 w-4" />
              Add staff
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {staff.map((person) => (
            <div
              key={person.id}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                  <UserCheck className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-black text-slate-900">
                        {person.name}
                      </h3>

                      <p className="mt-0.5 text-sm text-blue-600">
                        {person.role || "Staff"}
                      </p>
                    </div>

                    <Badge
                      color={
                        person.status === "Inactive"
                          ? "red"
                          : "green"
                      }
                    >
                      {person.status || "Active"}
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-slate-500">
                    {person.phone && (
                      <div className="flex gap-2">
                        <Phone className="h-4 w-4" />
                        {person.phone}
                      </div>
                    )}

                    {person.shift && (
                      <div className="flex gap-2">
                        <Clock className="h-4 w-4" />
                        {person.shift}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() =>
                        onToggle(person)
                      }
                    >
                      {person.status === "Inactive"
                        ? "Activate"
                        : "Deactivate"}
                    </Button>

                    <Button
                      variant="danger"
                      onClick={() =>
                        onDelete(person.id)
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   STAFF MODAL
========================================================= */

function StaffModal({
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    name: "",
    role: "",
    phone: "",
    email: "",
    shift: "",
    status: "Active",
  });

  const [saving, setSaving] = useState(false);

  const update = (key, value) =>
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

  const submit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Staff name is required.");
      return;
    }

    setSaving(true);

    try {
      await onSave({
        ...form,
        id: createId("EMP"),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Add Staff Member"
      onClose={onClose}
      width="max-w-xl"
    >
      <form onSubmit={submit} className="space-y-5">
        <Input
          label="Full Name"
          required
          value={form.name}
          onChange={(v) => update("name", v)}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Role"
            value={form.role}
            onChange={(v) => update("role", v)}
          />

          <Input
            label="Phone"
            value={form.phone}
            onChange={(v) =>
              update("phone", v)
            }
          />

          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(v) =>
              update("email", v)
            }
          />

          <Input
            label="Shift"
            placeholder="09:00 AM - 06:00 PM"
            value={form.shift}
            onChange={(v) =>
              update("shift", v)
            }
          />
        </div>

        <Select
          label="Status"
          value={form.status}
          onChange={(v) =>
            update("status", v)
          }
        >
          <option>Active</option>
          <option>Inactive</option>
        </Select>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Add Staff"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* =========================================================
   CLINICAL / RADIOLOGY
========================================================= */

function RadiologyDiagnosisView({
  patients,
  onOpenPatient,
}) {
  const [search, setSearch] = useState("");

  const filtered = patients.filter((patient) =>
    String(patient.name || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-xl font-black text-slate-900">
          Clinical & Radiology
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Review clinical notes, odontograms and radiology
          findings.
        </p>

        <div className="relative mt-5">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient"
            className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No clinical records"
          description="Patients with clinical charts will appear here."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((patient) => {
            const teeth = Object.keys(
              patient.odontogram || {}
            ).length;

            const report =
              patient.radiologyReport || {};

            return (
              <div
                key={patient.id}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-slate-900">
                      {patient.name}
                    </h3>

                    <p className="text-xs text-slate-400">
                      {patient.customId ||
                        patient.id}
                    </p>
                  </div>

                  <Button
                    variant="secondary"
                    onClick={() =>
                      onOpenPatient(patient)
                    }
                  >
                    <Edit3 className="h-4 w-4" />
                    Open chart
                  </Button>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[10px] font-bold uppercase text-slate-400">
                      Teeth charted
                    </p>

                    <p className="mt-1 text-xl font-black text-slate-800">
                      {teeth}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[10px] font-bold uppercase text-slate-400">
                      OPG / scans
                    </p>

                    <p className="mt-1 text-xl font-black text-slate-800">
                      {patient.opgScans?.length ||
                        0}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-slate-100 p-3">
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    Diagnosis
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    {report.diagnosisNotes ||
                      "No diagnosis recorded."}
                  </p>
                </div>

                <div className="mt-3 rounded-xl border border-slate-100 p-3">
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    Radiographic Findings
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    {report.traumaFindings ||
                      "No radiology findings recorded."}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   SETTINGS
========================================================= */

function PracticeSettingsView({
  profile,
  onSave,
}) {
  const [form, setForm] = useState(profile || {});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(profile || {});
  }, [profile]);

  const update = (key, value) =>
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

  const submit = async (e) => {
    e.preventDefault();

    setSaving(true);

    try {
      await onSave({
        ...form,
        consultationFee: Number(
          form.consultationFee || 0
        ),
        updatedAt: serverTimestamp(),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-xl font-black text-slate-900">
          Practice Settings
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Configure the clinic profile, regulatory information,
          commercial settings and UPI settlement details.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5"
      >
        <section>
          <h3 className="mb-4 flex items-center gap-2 font-black text-slate-900">
            <Building className="h-5 w-5 text-blue-600" />
            Practice Identity
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Clinic Name"
              value={form.clinicName}
              onChange={(v) =>
                update("clinicName", v)
              }
            />

            <Input
              label="Tagline"
              value={form.tagline}
              onChange={(v) =>
                update("tagline", v)
              }
            />

            <Input
              label="Contact Email"
              type="email"
              value={form.contactEmail}
              onChange={(v) =>
                update("contactEmail", v)
              }
            />

            <Input
              label="Contact Phone"
              value={form.contactPhone}
              onChange={(v) =>
                update("contactPhone", v)
              }
            />
          </div>

          <div className="mt-4">
            <Textarea
              label="Clinic Address"
              value={form.address}
              onChange={(v) =>
                update("address", v)
              }
              rows={3}
            />
          </div>
        </section>

        <section className="border-t border-slate-100 pt-6">
          <h3 className="mb-4 flex items-center gap-2 font-black text-slate-900">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            Regulatory Information
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Dental License / Registration No."
              value={form.licenseNo}
              onChange={(v) =>
                update("licenseNo", v)
              }
            />

            <Input
              label="GSTIN"
              value={form.gstin}
              onChange={(v) =>
                update("gstin", v)
              }
            />
          </div>
        </section>

        <section className="border-t border-slate-100 pt-6">
          <h3 className="mb-4 flex items-center gap-2 font-black text-slate-900">
            <IndianRupee className="h-5 w-5 text-blue-600" />
            Commercial Settings
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Default Consultation Fee"
              type="number"
              value={form.consultationFee}
              onChange={(v) =>
                update("consultationFee", v)
              }
            />

            <Input
              label="Operating Hours"
              value={form.operatingHours}
              onChange={(v) =>
                update("operatingHours", v)
              }
            />
          </div>
        </section>

        <section className="border-t border-slate-100 pt-6">
          <h3 className="mb-4 flex items-center gap-2 font-black text-slate-900">
            <QrCode className="h-5 w-5 text-blue-600" />
            UPI Settlement
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="UPI ID"
              placeholder="clinic@upi"
              value={form.upiId}
              onChange={(v) =>
                update("upiId", v)
              }
            />
          </div>

          <div className="mt-3 rounded-xl bg-blue-50 p-3 text-xs text-blue-800">
            Use a business UPI ID owned by the clinic. Payment
            settlement and verification remain the
            responsibility of the clinic.
          </div>
        </section>

        <div className="flex justify-end border-t border-slate-100 pt-5">
          <Button
            type="submit"
            disabled={saving}
          >
            <Save className="h-4 w-4" />
            {saving
              ? "Saving..."
              : "Save Practice Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}

/* =========================================================
   MAIN APP
========================================================= */

export default function App() {
  const [currentUser, setCurrentUser] =
    useState(null);

  const [authLoading, setAuthLoading] =
    useState(true);

  const [loginLoading, setLoginLoading] =
    useState(false);

  const [activeTab, setActiveTab] =
    useState("dashboard");

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] =
    useState([]);
  const [invoices, setInvoices] = useState([]);
  const [inventory, setInventory] =
    useState([]);
  const [staffList, setStaffList] =
    useState([]);

  const [clinicProfile, setClinicProfile] =
    useState({
      clinicName: "",
      tagline: "",
      licenseNo: "",
      gstin: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
      upiId: "",
      consultationFee: 0,
      operatingHours: "",
    });

  const [selectedDate, setSelectedDate] =
    useState(new Date());

  const [
    selectedPatient,
    setSelectedPatient,
  ] = useState(null);

  const [selectedInvoice, setSelectedInvoice] =
    useState(null);

  const [selectedStockItem, setSelectedStockItem] =
    useState(null);

  const [showPatientModal, setShowPatientModal] =
    useState(false);

  const [
    showAppointmentModal,
    setShowAppointmentModal,
  ] = useState(false);

  const [showInvoiceModal, setShowInvoiceModal] =
    useState(false);

  const [showUPIModal, setShowUPIModal] =
    useState(false);

  const [showStockModal, setShowStockModal] =
    useState(false);

  const [showStaffModal, setShowStaffModal] =
    useState(false);

  /* =====================================================
     AUTH
  ===================================================== */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setCurrentUser(user);
        setAuthLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  /* =====================================================
     FIRESTORE REAL-TIME DATA
  ===================================================== */

  useEffect(() => {
    if (!currentUser) return;

    const clinicId = currentUser.uid;

    const unsubs = [];

    const patientRef = collection(
      db,
      "clinics",
      clinicId,
      "patients"
    );

    const appointmentRef = collection(
      db,
      "clinics",
      clinicId,
      "appointments"
    );

    const invoiceRef = collection(
      db,
      "clinics",
      clinicId,
      "invoices"
    );

    const inventoryRef = collection(
      db,
      "clinics",
      clinicId,
      "inventory"
    );

    const staffRef = collection(
      db,
      "clinics",
      clinicId,
      "staff"
    );

    unsubs.push(
      onSnapshot(
        patientRef,
        (snapshot) => {
          setPatients(
            snapshot.docs.map((item) => ({
              id: item.id,
              ...item.data(),
            }))
          );
        },
        (error) => {
          console.error(
            "Patient listener:",
            error
          );
        }
      )
    );

    unsubs.push(
      onSnapshot(
        appointmentRef,
        (snapshot) => {
          setAppointments(
            snapshot.docs.map((item) => ({
              id: item.id,
              ...item.data(),
            }))
          );
        },
        (error) => {
          console.error(
            "Appointment listener:",
            error
          );
        }
      )
    );

    unsubs.push(
      onSnapshot(
        invoiceRef,
        (snapshot) => {
          setInvoices(
            snapshot.docs.map((item) => ({
              id: item.id,
              ...item.data(),
            }))
          );
        },
        (error) => {
          console.error(
            "Invoice listener:",
            error
          );
        }
      )
    );

    unsubs.push(
      onSnapshot(
        inventoryRef,
        (snapshot) => {
          setInventory(
            snapshot.docs.map((item) => ({
              id: item.id,
              ...item.data(),
            }))
          );
        },
        (error) => {
          console.error(
            "Inventory listener:",
            error
          );
        }
      )
    );

    unsubs.push(
      onSnapshot(
        staffRef,
        (snapshot) => {
          setStaffList(
            snapshot.docs.map((item) => ({
              id: item.id,
              ...item.data(),
            }))
          );
        },
        (error) => {
          console.error(
            "Staff listener:",
            error
          );
        }
      )
    );

    const profileRef = doc(
      db,
      "clinics",
      clinicId,
      "settings",
      "profile"
    );

    unsubs.push(
      onSnapshot(
        profileRef,
        (snapshot) => {
          if (snapshot.exists()) {
            setClinicProfile(snapshot.data());
          }
        },
        (error) => {
          console.error(
            "Profile listener:",
            error
          );
        }
      )
    );

    return () => {
      unsubs.forEach((unsubscribe) =>
        unsubscribe()
      );
    };
  }, [currentUser]);

  /* =====================================================
     LOGIN
  ===================================================== */

  const handleLogin = async () => {
    try {
      setLoginLoading(true);

      await loginWithGoogle();
    } catch (error) {
      console.error(error);

      alert(
        error?.message ||
          "Unable to sign in. Check Firebase Authentication and popup settings."
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setActiveTab("dashboard");
    } catch (error) {
      console.error(error);
    }
  };

  /* =====================================================
     PATIENTS
  ===================================================== */

  const createPatient = async (patient) => {
    if (!currentUser) return;

    try {
      const ref = await addDoc(
        collection(
          db,
          "clinics",
          currentUser.uid,
          "patients"
        ),
        patient
      );

      setShowPatientModal(false);

      setActiveTab("patients");

      return ref;
    } catch (error) {
      console.error(error);
      alert(
        "Unable to create patient. Please check your Firebase permissions."
      );
    }
  };

  const updatePatient = async (patient) => {
    if (!currentUser) return;

    try {
      const { id, ...data } = patient;

      await updateDoc(
        doc(
          db,
          "clinics",
          currentUser.uid,
          "patients",
          id
        ),
        data
      );

      setSelectedPatient(patient);
    } catch (error) {
      console.error(error);

      alert(
        "Unable to save patient record."
      );
    }
  };

  const deletePatient = async (
    patientId,
    patientName
  ) => {
    if (
      !window.confirm(
        `Delete the complete clinical record for "${patientName}"? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await deleteDoc(
        doc(
          db,
          "clinics",
          currentUser.uid,
          "patients",
          patientId
        )
      );

      if (
        selectedPatient?.id === patientId
      ) {
        setSelectedPatient(null);
      }
    } catch (error) {
      console.error(error);
      alert("Unable to delete patient.");
    }
  };

  /* =====================================================
     APPOINTMENTS
  ===================================================== */

  const createAppointment = async (
    appointment
  ) => {
    if (!currentUser) return;

    try {
      await addDoc(
        collection(
          db,
          "clinics",
          currentUser.uid,
          "appointments"
        ),
        appointment
      );

      setShowAppointmentModal(false);
    } catch (error) {
      console.error(error);
      alert("Unable to create appointment.");
    }
  };

  const updateAppointmentStatus = async (
    id,
    status
  ) => {
    const cycle = {
      scheduled: "in_progress",
      in_progress: "completed",
      completed: "scheduled",
    };

    const next =
      cycle[status] || "scheduled";

    try {
      await updateDoc(
        doc(
          db,
          "clinics",
          currentUser.uid,
          "appointments",
          id
        ),
        {
          status: next,
          updatedAt: serverTimestamp(),
        }
      );
    } catch (error) {
      console.error(error);
      alert(
        "Unable to update appointment."
      );
    }
  };

  const deleteAppointment = async (id) => {
    if (
      !window.confirm(
        "Delete this appointment?"
      )
    ) {
      return;
    }

    try {
      await deleteDoc(
        doc(
          db,
          "clinics",
          currentUser.uid,
          "appointments",
          id
        )
      );
    } catch (error) {
      console.error(error);
      alert(
        "Unable to delete appointment."
      );
    }
  };

  /* =====================================================
     INVOICES
  ===================================================== */

  const createInvoice = async (invoice) => {
    if (!currentUser) return;

    try {
      await addDoc(
        collection(
          db,
          "clinics",
          currentUser.uid,
          "invoices"
        ),
        invoice
      );

      setShowInvoiceModal(false);
    } catch (error) {
      console.error(error);
      alert("Unable to create invoice.");
    }
  };

  const markInvoicePaid = async (id) => {
    try {
      await updateDoc(
        doc(
          db,
          "clinics",
          currentUser.uid,
          "invoices",
          id
        ),
        {
          status: "Paid",
          paidAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );

      setShowUPIModal(false);
      setSelectedInvoice(null);
    } catch (error) {
      console.error(error);
      alert(
        "Unable to update payment status."
      );
    }
  };

  const deleteInvoice = async (id) => {
    if (
      !window.confirm(
        "Delete this invoice?"
      )
    ) {
      return;
    }

    try {
      await deleteDoc(
        doc(
          db,
          "clinics",
          currentUser.uid,
          "invoices",
          id
        )
      );
    } catch (error) {
      console.error(error);
      alert("Unable to delete invoice.");
    }
  };

  /* =====================================================
     INVENTORY
  ===================================================== */

  const saveInventoryItem = async (item) => {
    if (!currentUser) return;

    try {
      const { id, ...data } = item;

      await setDoc(
        doc(
          db,
          "clinics",
          currentUser.uid,
          "inventory",
          id
        ),
        data,
        {
          merge: true,
        }
      );

      setShowStockModal(false);
      setSelectedStockItem(null);
    } catch (error) {
      console.error(error);
      alert(
        "Unable to save inventory item."
      );
    }
  };

  const deleteInventoryItem = async (id) => {
    if (
      !window.confirm(
        "Delete this inventory item?"
      )
    ) {
      return;
    }

    try {
      await deleteDoc(
        doc(
          db,
          "clinics",
          currentUser.uid,
          "inventory",
          id
        )
      );
    } catch (error) {
      console.error(error);
      alert(
        "Unable to delete inventory item."
      );
    }
  };

  /* =====================================================
     STAFF
  ===================================================== */

  const createStaff = async (staff) => {
    if (!currentUser) return;

    try {
      const { id, ...data } = staff;

      await setDoc(
        doc(
          db,
          "clinics",
          currentUser.uid,
          "staff",
          id
        ),
        data
      );

      setShowStaffModal(false);
    } catch (error) {
      console.error(error);
      alert("Unable to add staff member.");
    }
  };

  const toggleStaff = async (person) => {
    try {
      await updateDoc(
        doc(
          db,
          "clinics",
          currentUser.uid,
          "staff",
          person.id
        ),
        {
          status:
            person.status === "Inactive"
              ? "Active"
              : "Inactive",
          updatedAt: serverTimestamp(),
        }
      );
    } catch (error) {
      console.error(error);
      alert(
        "Unable to update staff status."
      );
    }
  };

  const deleteStaff = async (id) => {
    if (
      !window.confirm(
        "Delete this staff record?"
      )
    ) {
      return;
    }

    try {
      await deleteDoc(
        doc(
          db,
          "clinics",
          currentUser.uid,
          "staff",
          id
        )
      );
    } catch (error) {
      console.error(error);
      alert("Unable to delete staff.");
    }
  };

  /* =====================================================
     PROFILE
  ===================================================== */

  const saveClinicProfile = async (
    profile
  ) => {
    if (!currentUser) return;

    try {
      await setDoc(
        doc(
          db,
          "clinics",
          currentUser.uid,
          "settings",
          "profile"
        ),
        profile,
        {
          merge: true,
        }
      );

      alert("Practice settings saved.");
    } catch (error) {
      console.error(error);
      alert(
        "Unable to save practice settings."
      );
    }
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />

          <p className="text-sm font-bold">
            Securing clinic workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginScreen
        loading={loginLoading}
        onLogin={handleLogin}
      />
    );
  }

  /* =====================================================
     PAGE TITLE
  ===================================================== */

  const pageTitles = {
    dashboard: "Dashboard",
    appointments: "Appointments",
    patients: "Patients",
    radiology: "Clinical & Radiology",
    billing: "Billing & Claims",
    inventory: "Stock Inventory",
    staff: "Staff & Roles",
    settings: "Practice Settings",
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        clinicProfile={clinicProfile}
        user={currentUser}
        onLogout={handleLogout}
      />

      <div className="lg:pl-72">
        <TopBar
          onMenu={() => setSidebarOpen(true)}
          title={pageTitles[activeTab]}
          search={
            activeTab === "patients"
              ? searchQuery
              : undefined
          }
          setSearch={
            activeTab === "patients"
              ? setSearchQuery
              : undefined
          }
        />

        <main className="mx-auto max-w-[1600px] p-4 lg:p-6">
          {activeTab === "dashboard" && (
            <DashboardView
              patients={patients}
              appointments={appointments}
              invoices={invoices}
              inventory={inventory}
              clinicProfile={clinicProfile}
              setActiveTab={setActiveTab}
              setShowAppointmentModal={
                setShowAppointmentModal
              }
              setShowPatientModal={
                setShowPatientModal
              }
            />
          )}

          {activeTab === "appointments" && (
            <AppointmentsView
              appointments={appointments}
              patients={patients}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              onAdd={() =>
                setShowAppointmentModal(true)
              }
              onStatusChange={
                updateAppointmentStatus
              }
              onDelete={deleteAppointment}
            />
          )}

          {activeTab === "patients" && (
            <PatientsView
              patients={patients}
              search={searchQuery}
              setSearch={setSearchQuery}
              onAdd={() =>
                setShowPatientModal(true)
              }
              onOpen={(patient) =>
                setSelectedPatient(patient)
              }
              onDelete={deletePatient}
            />
          )}

          {activeTab === "radiology" && (
            <RadiologyDiagnosisView
              patients={patients}
              onOpenPatient={(patient) =>
                setSelectedPatient(patient)
              }
            />
          )}

          {activeTab === "billing" && (
            <BillingView
              invoices={invoices}
              patients={patients}
              clinicProfile={clinicProfile}
              onCreate={() =>
                setShowInvoiceModal(true)
              }
              onPayment={(invoice) => {
                setSelectedInvoice(invoice);
                setShowUPIModal(true);
              }}
              onDelete={deleteInvoice}
            />
          )}

          {activeTab === "inventory" && (
            <InventoryView
              inventory={inventory}
              onAdd={() => {
                setSelectedStockItem(null);
                setShowStockModal(true);
              }}
              onUpdate={(item) => {
                setSelectedStockItem(item);
                setShowStockModal(true);
              }}
              onDelete={deleteInventoryItem}
            />
          )}

          {activeTab === "staff" && (
            <StaffView
              staff={staffList}
              onAdd={() =>
                setShowStaffModal(true)
              }
              onDelete={deleteStaff}
              onToggle={toggleStaff}
            />
          )}

          {activeTab === "settings" && (
            <PracticeSettingsView
              profile={clinicProfile}
              onSave={saveClinicProfile}
            />
          )}
        </main>
      </div>

      {/* =================================================
          MODALS
      ================================================= */}

      {showPatientModal && (
        <PatientModal
          onClose={() =>
            setShowPatientModal(false)
          }
          onSave={createPatient}
        />
      )}

      {showAppointmentModal && (
        <AppointmentModal
          patients={patients}
          staff={staffList}
          onClose={() =>
            setShowAppointmentModal(false)
          }
          onSave={createAppointment}
        />
      )}

      {selectedPatient && (
        <PatientDetailsModal
          patient={selectedPatient}
          onClose={() =>
            setSelectedPatient(null)
          }
          onSave={updatePatient}
        />
      )}

      {showInvoiceModal && (
        <InvoiceModal
          patients={patients}
          onClose={() =>
            setShowInvoiceModal(false)
          }
          onSave={createInvoice}
        />
      )}

      {showUPIModal && selectedInvoice && (
        <UPIPaymentModal
          invoice={selectedInvoice}
          clinicProfile={clinicProfile}
          onClose={() => {
            setShowUPIModal(false);
            setSelectedInvoice(null);
          }}
          onMarkPaid={markInvoicePaid}
        />
      )}

      {showStockModal && (
        <StockModal
          item={selectedStockItem}
          onClose={() => {
            setShowStockModal(false);
            setSelectedStockItem(null);
          }}
          onSave={saveInventoryItem}
        />
      )}

      {showStaffModal && (
        <StaffModal
          onClose={() =>
            setShowStaffModal(false)
          }
          onSave={createStaff}
        />
      )}
    </div>
  );
}          </button>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'appointments', label: 'Appointments', icon: CalendarIcon },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'radiology', label: 'Radiology & Diagnosis', icon: Eye },
    { id: 'billing', label: 'Billing & Insurance', icon: Receipt },
    { id: 'inventory', label: 'Stock Inventory', icon: Package },
    { id: 'staff', label: 'Staff & Roles', icon: Briefcase },
    { id: 'settings', label: 'Practice Settings', icon: Building }
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 text-white transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="h-full flex flex-col">
          <div className="h-20 px-5 flex items-center justify-between border-b border-slate-800">
            <div>
              <div className="font-black text-lg tracking-tight">
                Meridian Dental
              </div>
              <div className="text-[10px] uppercase tracking-widest text-blue-400 font-bold">
                Clinical OS
              </div>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-4 py-5 border-b border-slate-800">
            <div className="text-xs text-slate-500 uppercase tracking-wider font-bold">
              Practice
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-200 truncate">
              {clinicProfile.clinicName}
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                    active
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3 px-3 py-3">
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold">
                  {currentUser?.displayName?.charAt(0) || 'D'}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold truncate">
                  {currentUser?.displayName || 'Clinic Administrator'}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {currentUser?.email || 'Authenticated user'}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-950/40 transition"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        />
      )}

      <main className="lg:ml-72 min-h-screen">
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur border-b border-slate-200 flex items-center px-4 sm:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 mr-3 rounded-lg hover:bg-slate-100"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1">
            <div className="font-bold text-slate-900">
              {navItems.find((item) => item.id === activeTab)?.label}
            </div>
            <div className="hidden sm:block text-xs text-slate-500">
              {clinicProfile.clinicName}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Secure Workspace
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          {activeTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              appointments={appointments}
              patients={patients}
              invoices={invoices}
              inventory={inventory}
              weeklyChartData={weeklyChartData}
              onNavigate={setActiveTab}
              onNewAppointment={() => setShowAppointmentModal(true)}
              onNewPatient={() => setShowPatientModal(true)}
              onSelectPatient={setSelectedPatientForDetails}
            />
          )}

          {activeTab === 'appointments' && (
            <AppointmentsView
              appointments={appointments}
              selectedDate={selectedDate}
              onDateShift={handleDateShift}
              onNewAppointment={() => setShowAppointmentModal(true)}
              onCycleStatus={cycleAppointmentStatus}
            />
          )}

          {activeTab === 'patients' && (
            <PatientsView
              patients={patients}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onNewPatient={() => setShowPatientModal(true)}
              onViewPatient={setSelectedPatientForDetails}
              onDeletePatient={handleDeletePatient}
            />
          )}

          {activeTab === 'radiology' && (
            <RadiologyDiagnosisView
              patients={patients}
              onViewPatient={setSelectedPatientForDetails}
            />
          )}

          {activeTab === 'billing' && (
            <BillingView
              invoices={invoices}
              onCreateInvoice={() => setShowInvoiceModal(true)}
              onCollectPayment={setSelectedInvoiceForUPI}
            />
          )}

          {activeTab === 'inventory' && (
            <StockInventoryView
              inventory={inventory}
              setInventory={setInventory}
              onAddStock={() => setShowAddStockModal(true)}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'staff' && (
            <StaffRolesView
              staffList={staffList}
              setStaffList={setStaffList}
            />
          )}

          {activeTab === 'settings' && (
            <PracticeSettingsView
              clinicProfile={clinicProfile}
              onSave={handleSaveClinicProfile}
            />
          )}
        </div>
      </main>

      {showAppointmentModal && (
        <NewAppointmentModal
          patients={patients}
          onClose={() => setShowAppointmentModal(false)}
          currentUser={currentUser}
          onCreated={(appointment) => {
            setAppointments((prev) => [appointment, ...prev]);
            setShowAppointmentModal(false);
          }}
        />
      )}

      {showPatientModal && (
        <NewPatientModal
          onClose={() => setShowPatientModal(false)}
          currentUser={currentUser}
          onCreated={(patient) => {
            setPatients((prev) => [patient, ...prev]);
            setShowPatientModal(false);
          }}
        />
      )}

      {showInvoiceModal && (
        <CreateInsuranceInvoiceModal
          patients={patients}
          clinicProfile={clinicProfile}
          currentUser={currentUser}
          onClose={() => setShowInvoiceModal(false)}
          onCreated={(invoice) => {
            setInvoices((prev) => [invoice, ...prev]);
            setShowInvoiceModal(false);
          }}
        />
      )}

      {selectedInvoiceForUPI && (
        <UPIPaymentModal
          invoice={selectedInvoiceForUPI}
          clinicProfile={clinicProfile}
          currentUser={currentUser}
          onClose={() => setSelectedInvoiceForUPI(null)}
          onPaid={(invoiceId) => {
            setInvoices((prev) =>
              prev.map((invoice) =>
                invoice.id === invoiceId
                  ? {
                      ...invoice,
                      status: 'Paid',
                      paidAt: new Date().toISOString()
                    }
                  : invoice
              )
            );

            setSelectedInvoiceForUPI(null);
          }}
        />
      )}

      {showAddStockModal && (
        <AddStockItemModal
          currentUser={currentUser}
          onClose={() => setShowAddStockModal(false)}
          onCreated={(item) => {
            setInventory((prev) => [item, ...prev]);
            setShowAddStockModal(false);
          }}
        />
      )}

      {selectedPatientForDetails && (
        <PatientDetailsModal
          patient={selectedPatientForDetails}
          onClose={() => setSelectedPatientForDetails(null)}
          onUpdate={handleUpdatePatientRecord}
        />
      )}
    </div>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

function DashboardView({
  stats,
  appointments,
  patients,
  invoices,
  inventory,
  weeklyChartData,
  onNavigate,
  onNewAppointment,
  onNewPatient,
  onSelectPatient
}) {
  const todayKey = formatDateKey(new Date());

  const todayAppointments = appointments.filter(
    (appointment) => appointment.date === todayKey
  );

  const outstanding = invoices
    .filter((invoice) => invoice.status !== 'Paid')
    .reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);

  const lowStock = inventory.filter((item) => item.qty <= item.min);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Practice Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Operational and clinical activity for today.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={onNewPatient}
            className="inline-flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50"
          >
            <Plus className="w-4 h-4" />
            New Patient
          </button>

          <button
            onClick={onNewAppointment}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700"
          >
            <CalendarIcon className="w-4 h-4" />
            Appointment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Patients"
          value={stats.totalPatients}
          icon={Users}
          color="blue"
        />

        <StatCard
          label="Today's Appointments"
          value={stats.todayCount}
          icon={CalendarIcon}
          color="violet"
        />

        <StatCard
          label="Collected"
          value={formatCurrency(stats.collectedToday)}
          icon={IndianRupee}
          color="emerald"
        />

        <StatCard
          label="Low Stock Items"
          value={stats.lowStockCount}
          icon={Package}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-black text-lg">Appointment Activity</h2>
              <p className="text-xs text-slate-500">
                Appointments recorded by weekday
              </p>
            </div>

            <BarChart2 className="w-5 h-5 text-blue-600" />
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar
                  dataKey="count"
                  fill="#2563eb"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="font-black">Financial Snapshot</h2>
                <p className="text-xs text-slate-500">Current receivables</p>
              </div>
              <Receipt className="w-5 h-5 text-emerald-600" />
            </div>

            <div className="text-2xl font-black">
              {formatCurrency(outstanding)}
            </div>

            <button
              onClick={() => onNavigate('billing')}
              className="mt-4 text-sm text-blue-600 font-bold hover:underline"
            >
              Open Billing →
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="font-black">Inventory Alerts</h2>
                <p className="text-xs text-slate-500">
                  Items requiring attention
                </p>
              </div>
              <ShieldAlert className="w-5 h-5 text-amber-600" />
            </div>

            {lowStock.length === 0 ? (
              <div className="text-sm text-emerald-600 font-semibold">
                Inventory levels are healthy.
              </div>
            ) : (
              <div className="space-y-2">
                {lowStock.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center bg-amber-50 border border-amber-100 rounded-lg p-3"
                  >
                    <span className="text-sm font-semibold truncate">
                      {item.name}
                    </span>
                    <span className="text-xs font-bold text-amber-700 ml-2">
                      {item.qty} left
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => onNavigate('inventory')}
              className="mt-4 text-sm text-blue-600 font-bold hover:underline"
            >
              Manage Inventory →
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="font-black text-lg">Today's Appointments</h2>
            <p className="text-xs text-slate-500">
              {todayAppointments.length} scheduled
            </p>
          </div>

          <button
            onClick={() => onNavigate('appointments')}
            className="text-sm font-bold text-blue-600"
          >
            View all
          </button>
        </div>

        {todayAppointments.length === 0 ? (
          <EmptyState
            icon={CalendarIcon}
            title="No appointments today"
            text="Create an appointment to populate today's schedule."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {todayAppointments.slice(0, 8).map((appointment) => (
              <div
                key={appointment.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="w-28 shrink-0">
                  <div className="font-bold text-sm">
                    {appointment.time}
                  </div>
                  <div className="text-xs text-slate-500">
                    {appointment.duration || '—'}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="font-bold">{appointment.patient}</div>
                  <div className="text-xs text-slate-500">
                    {appointment.procedure}
                  </div>
                </div>

                <StatusBadge status={appointment.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="p-5 border-b border-slate-200">
          <h2 className="font-black text-lg">Recent Patients</h2>
        </div>

        {patients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No patients"
            text="Create your first patient record."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {patients.slice(0, 5).map((patient) => (
              <button
                key={patient.id}
                onClick={() => onSelectPatient(patient)}
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-slate-50"
              >
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-black">
                  {patient.name?.charAt(0)?.toUpperCase() || 'P'}
                </div>

                <div className="flex-1">
                  <div className="font-bold">{patient.name}</div>
                  <div className="text-xs text-slate-500">
                    {patient.phone || 'No phone number'}
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    violet: 'bg-violet-50 text-violet-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600'
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {label}
          </div>
          <div className="mt-2 text-2xl font-black">{value}</div>
        </div>

        <div className={`p-3 rounded-xl ${colors[color] || colors.blue}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, text }) {
  return (
    <div className="p-10 text-center">
      <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center">
        <Icon className="w-6 h-6 text-slate-400" />
      </div>
      <div className="mt-3 font-bold">{title}</div>
      <div className="text-sm text-slate-500 mt-1">{text}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
    in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Unpaid: 'bg-red-50 text-red-700 border-red-200',
    'Pre-Auth Approved':
      'bg-violet-50 text-violet-700 border-violet-200'
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-bold ${
        styles[status] || 'bg-slate-50 text-slate-600 border-slate-200'
      }`}
    >
      {String(status || 'Unknown').replace('_', ' ')}
    </span>
  );
}

/* =========================================================
   APPOINTMENTS
========================================================= */

function AppointmentsView({
  appointments,
  selectedDate,
  onDateShift,
  onNewAppointment,
  onCycleStatus
}) {
  const dateKey = formatDateKey(selectedDate);

  const filtered = appointments.filter(
    (appointment) => appointment.date === dateKey
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">Appointments</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage daily clinical scheduling.
          </p>
        </div>

        <button
          onClick={onNewAppointment}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm"
        >
          <Plus className="w-4 h-4" />
          New Appointment
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => onDateShift(-1)}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <div className="font-black text-lg">
              {getDisplayDate(selectedDate)}
            </div>
            <div className="text-xs text-slate-500">
              {filtered.length} appointments
            </div>
          </div>

          <button
            onClick={() => onDateShift(1)}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={CalendarIcon}
            title="No appointments"
            text="There are no appointments scheduled for this date."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered
              .sort((a, b) => String(a.time).localeCompare(String(b.time)))
              .map((appointment) => (
                <div
                  key={appointment.id}
                  className="p-5 flex flex-col lg:flex-row lg:items-center gap-4"
                >
                  <div className="lg:w-36">
                    <div className="font-black text-blue-700">
                      {appointment.time}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {appointment.duration || 'Duration not specified'}
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="font-black">
                      {appointment.patient}
                    </div>
                    <div className="text-sm text-slate-600 mt-1">
                      {appointment.procedure}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {appointment.doctor || 'Doctor not assigned'}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={appointment.status} />

                    <button
                      onClick={() =>
                        onCycleStatus(
                          appointment.id,
                          appointment.status
                        )
                      }
                      className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold hover:bg-slate-50"
                    >
                      Update Status
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   PATIENTS
========================================================= */

function PatientsView({
  patients,
  searchQuery,
  setSearchQuery,
  onNewPatient,
  onViewPatient,
  onDeletePatient
}) {
  const filtered = patients.filter((patient) => {
    const query = searchQuery.toLowerCase();

    return (
      patient.name?.toLowerCase().includes(query) ||
      patient.phone?.toLowerCase().includes(query) ||
      patient.customId?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">Patients</h1>
          <p className="text-sm text-slate-500 mt-1">
            Secure patient registry and clinical records.
          </p>
        </div>

        <button
          onClick={onNewPatient}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm"
        >
          <Plus className="w-4 h-4" />
          New Patient
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search by patient name, phone or patient ID..."
          className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No matching patients"
            text="Try a different search or create a new patient."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((patient) => (
              <div
                key={patient.id}
                className="p-5 flex flex-col md:flex-row md:items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-black shrink-0">
                  {patient.name?.charAt(0)?.toUpperCase() || 'P'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-black">{patient.name}</div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                    <span>{patient.customId || patient.id}</span>
                    <span>{patient.phone || 'No phone'}</span>
                    <span>
                      Registered: {patient.registeredDate || '—'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onViewPatient(patient)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold"
                  >
                    <Eye className="w-4 h-4" />
                    Clinical Chart
                  </button>

                  <button
                    onClick={() =>
                      onDeletePatient(patient.id, patient.name)
                    }
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-xs font-bold"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   RADIOLOGY / DIAGNOSIS
========================================================= */

function RadiologyDiagnosisView({ patients, onViewPatient }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">
          Radiology & Diagnosis
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          OPG records, diagnostic notes and clinical findings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {patients.map((patient) => {
          const report = patient.radiologyReport || {};
          const scans = patient.opgScans || [];

          return (
            <div
              key={patient.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-black">{patient.name}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {patient.customId || patient.id}
                  </div>
                </div>

                <button
                  onClick={() => onViewPatient(patient)}
                  className="text-blue-600 text-xs font-bold"
                >
                  Open Chart
                </button>
              </div>

              <div className="mt-5 space-y-3">
                <FindingRow
                  label="Trauma Findings"
                  value={report.traumaFindings}
                />

                <FindingRow
                  label="Impaction"
                  value={report.impactionClass}
                />

                <FindingRow
                  label="Diagnosis"
                  value={report.diagnosisNotes}
                />

                <FindingRow
                  label="Bone Status"
                  value={report.boneStatus}
                />
              </div>

              {scans.length > 0 && (
                <div className="mt-5">
                  <div className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-2">
                    OPG Scans
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {scans.slice(0, 2).map((scan) => (
                      <a
                        key={scan.id}
                        href={scan.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-xl overflow-hidden border border-slate-200"
                      >
                        <img
                          src={scan.url}
                          alt={scan.title}
                          className="w-full h-28 object-cover"
                        />
                        <div className="p-2 text-xs font-semibold truncate">
                          {scan.title}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {patients.length === 0 && (
        <EmptyState
          icon={Eye}
          title="No clinical records"
          text="Patient diagnostic records will appear here."
        />
      )}
    </div>
  );
}

function FindingRow({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3">
      <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
        {label}
      </div>
      <div className="text-sm font-medium mt-1 text-slate-700">
        {value || 'No record entered'}
      </div>
    </div>
  );
}

/* =========================================================
   BILLING
========================================================= */

function BillingView({
  invoices,
  onCreateInvoice,
  onCollectPayment
}) {
  const totalOutstanding = invoices
    .filter((invoice) => invoice.status !== 'Paid')
    .reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);

  const totalPaid = invoices
    .filter((invoice) => invoice.status === 'Paid')
    .reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">
            Billing & Insurance
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Invoices, insurance claims and digital collection.
          </p>
        </div>

        <button
          onClick={onCreateInvoice}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm"
        >
          <Plus className="w-4 h-4" />
          Create Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          label="Outstanding"
          value={formatCurrency(totalOutstanding)}
          icon={Receipt}
          color="amber"
        />

        <StatCard
          label="Collected"
          value={formatCurrency(totalPaid)}
          icon={IndianRupee}
          color="emerald"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {invoices.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No invoices"
            text="Create an invoice to begin billing."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {invoices.map((invoice) => {
              const insurance = invoice.insurance;

              return (
                <div
                  key={invoice.id}
                  className="p-5 flex flex-col xl:flex-row xl:items-center gap-4"
                >
                  <div className="xl:w-44">
                    <div className="font-black">
                      {invoice.customNo || invoice.id}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {invoice.date}
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="font-bold">{invoice.patient}</div>

                    <div className="text-xs text-slate-500 mt-1">
                      {invoice.items?.length || 0} line item(s)
                    </div>

                    {insurance && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-violet-50 text-violet-700 text-[10px] font-bold">
                          <ShieldCheck className="w-3 h-3" />
                          {insurance.provider}
                        </span>

                        <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                          Claim: {insurance.claimStatus}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="xl:text-right">
                    <div className="font-black text-lg">
                      {formatCurrency(invoice.total)}
                    </div>
                    <div className="mt-1">
                      <StatusBadge status={invoice.status} />
                    </div>
                  </div>

                  {invoice.status !== 'Paid' && (
                    <button
                      onClick={() => onCollectPayment(invoice)}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                    >
                      <QrCode className="w-4 h-4" />
                      Collect UPI
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   INVENTORY
========================================================= */

function StockInventoryView({
  inventory,
  setInventory,
  onAddStock,
  currentUser
}) {
  const updateQuantity = async (item, delta) => {
    const nextQty = Math.max(0, Number(item.qty || 0) + delta);

    const updated = {
      ...item,
      qty: nextQty,
      status: nextQty <= item.min ? 'Low Stock' : 'In Stock'
    };

    setInventory((prev) =>
      prev.map((row) => row.id === item.id ? updated : row)
    );

    if (currentUser) {
      try {
        await updateDoc(
          doc(db, 'clinics', currentUser.uid, 'inventory', item.id),
          {
            qty: nextQty,
            status: updated.status
          }
        );
      } catch (error) {
        console.warn('Inventory update cached locally');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">Stock Inventory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Consumables, materials and medication stock control.
          </p>
        </div>

        <button
          onClick={onAddStock}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Stock Item
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {inventory.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No inventory items"
            text="Add your first inventory item."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {inventory.map((item) => {
              const low = Number(item.qty) <= Number(item.min);

              return (
                <div
                  key={item.id}
                  className="p-5 flex flex-col md:flex-row md:items-center gap-4"
                >
                  <div className="flex-1">
                    <div className="font-black">{item.name}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {item.category} • {item.id}
                    </div>
                  </div>

                  <div className="text-sm">
                    <div className="font-bold">
                      {item.qty} {item.unit}
                    </div>
                    <div className="text-xs text-slate-500">
                      Minimum: {item.min}
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      low
                        ? 'bg-red-50 text-red-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {low ? 'REPLENISH' : 'IN STOCK'}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item, -1)}
                      className="w-9 h-9 rounded-lg border border-slate-200 font-bold hover:bg-slate-50"
                    >
                      −
                    </button>

                    <button
                      onClick={() => updateQuantity(item, 1)}
                      className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 font-bold hover:bg-blue-100"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   STAFF
========================================================= */

function StaffRolesView({ staffList, setStaffList }) {
  const toggleStaff = (id) => {
    setStaffList((prev) =>
      prev.map((staff) =>
        staff.id === id
          ? {
              ...staff,
              status:
                staff.status === 'Active'
                  ? 'Inactive'
                  : 'Active'
            }
          : staff
      )
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Staff & Roles</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage clinical and operational personnel.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {staffList.map((staff) => (
          <div
            key={staff.id}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <Stethoscope className="w-6 h-6" />
              </div>

              <div className="flex-1">
                <div className="font-black">{staff.name}</div>
                <div className="text-sm text-blue-700 font-semibold mt-1">
                  {staff.role}
                </div>

                <div className="mt-3 space-y-1 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" />
                    {staff.phone}
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    {staff.shift}
                  </div>
                </div>
              </div>

              <button
                onClick={() => toggleStaff(staff.id)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  staff.status === 'Active'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {staff.status}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   PRACTICE SETTINGS
========================================================= */

function PracticeSettingsView({ clinicProfile, onSave }) {
  const [form, setForm] = useState(clinicProfile);

  useEffect(() => {
    setForm(clinicProfile);
  }, [clinicProfile]);

  const update = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const save = () => {
    onSave({
      ...form,
      consultationFee: Number(form.consultationFee || 0)
    });
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-black">
          Practice Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure your clinic identity, registration and payment
          settlement information.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black">Clinic Profile</h2>
            <p className="text-xs text-slate-500">
              Business identity and contact information
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Clinic Name"
            value={form.clinicName}
            onChange={(value) => update('clinicName', value)}
          />

          <FormField
            label="Tagline"
            value={form.tagline}
            onChange={(value) => update('tagline', value)}
          />

          <FormField
            label="Dental License / Registration No."
            value={form.licenseNo}
            onChange={(value) => update('licenseNo', value)}
          />

          <FormField
            label="GSTIN"
            value={form.gstin}
            onChange={(value) => update('gstin', value)}
          />

          <FormField
            label="Contact Email"
            value={form.contactEmail}
            onChange={(value) => update('contactEmail', value)}
          />

          <FormField
            label="Contact Phone"
            value={form.contactPhone}
            onChange={(value) => update('contactPhone', value)}
          />

          <div className="md:col-span-2">
            <FormField
              label="Clinic Address"
              value={form.address}
              onChange={(value) => update('address', value)}
              textarea
            />
          </div>

          <FormField
            label="UPI Settlement ID"
            value={form.upiId}
            onChange={(value) => update('upiId', value)}
          />

          <FormField
            label="Consultation Fee (INR)"
            type="number"
            value={form.consultationFee}
            onChange={(value) => update('consultationFee', value)}
          />

          <div className="md:col-span-2">
            <FormField
              label="Operating Hours"
              value={form.operatingHours}
              onChange={(value) => update('operatingHours', value)}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={save}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl font-bold text-sm"
          >
            <Save className="w-4 h-4" />
            Save Practice Profile
          </button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <div className="font-bold text-amber-900">
              Production configuration
            </div>
            <p className="text-sm text-amber-800 mt-1">
              Before commercial deployment, verify your Firebase
              security rules, authentication configuration, GST
              registration details, UPI settlement account and
              applicable healthcare/privacy requirements.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  type = 'text',
  textarea = false
}) {
  return (
    <label className="block">
      <span className="block text-xs font-bold text-slate-600 mb-1.5">
        {label}
      </span>

      {textarea ? (
        <textarea
          value={value || ''}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      ) : (
        <input
          type={type}
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value)}
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}
    </label>
  );
}

/* =========================================================
   NEW PATIENT MODAL
========================================================= */

function NewPatientModal({ onClose, onCreated, currentUser }) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    allergies: '',
    conditions: ''
  });

  const [saving, setSaving] = useState(false);

  const update = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const save = async () => {
    if (!form.name.trim()) {
      alert('Patient name is required.');
      return;
    }

    setSaving(true);

    const patient = {
      customId: `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      dateOfBirth: form.dateOfBirth,
      gender: form.gender,
      bloodGroup: form.bloodGroup,
      registeredDate: new Date().toLocaleDateString('en-IN'),
      medicalHistory: {
        conditions: form.conditions,
        allergies: form.allergies
      },
      radiologyReport: {},
      opgScans: [],
      odontogram: {},
      prescriptions: [],
      createdAt: new Date().toISOString()
    };

    try {
      if (currentUser) {
        const ref = await addDoc(
          collection(db, 'clinics', currentUser.uid, 'patients'),
          patient
        );

        patient.id = ref.id;
      } else {
        patient.id = `PAT-${Date.now()}`;
      }

      onCreated(patient);
    } catch (error) {
      console.error(error);
      patient.id = `PAT-${Date.now()}`;
      onCreated(patient);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Create Patient Record" onClose={onClose}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Patient Name *"
          value={form.name}
          onChange={(value) => update('name', value)}
        />

        <FormField
          label="Phone"
          value={form.phone}
          onChange={(value) => update('phone', value)}
        />

        <FormField
          label="Email"
          value={form.email}
          onChange={(value) => update('email', value)}
        />

        <FormField
          label="Date of Birth"
          type="date"
          value={form.dateOfBirth}
          onChange={(value) => update('dateOfBirth', value)}
        />

        <FormField
          label="Gender"
          value={form.gender}
          onChange={(value) => update('gender', value)}
        />

        <FormField
          label="Blood Group"
          value={form.bloodGroup}
          onChange={(value) => update('bloodGroup', value)}
        />

        <FormField
          label="Known Allergies"
          value={form.allergies}
          onChange={(value) => update('allergies', value)}
        />

        <FormField
          label="Medical Conditions"
          value={form.conditions}
          onChange={(value) => update('conditions', value)}
        />
      </div>

      <ModalActions
        onClose={onClose}
        onSave={save}
        saving={saving}
        saveText="Create Patient"
      />
    </Modal>
  );
}

/* =========================================================
   NEW APPOINTMENT MODAL
========================================================= */

function NewAppointmentModal({
  patients,
  onClose,
  currentUser,
  onCreated
}) {
  const [form, setForm] = useState({
    patientId: patients[0]?.id || '',
    date: formatDateKey(new Date()),
    time: '09:00 AM',
    duration: '30 min',
    procedure: '',
    doctor: ''
  });

  const [saving, setSaving] = useState(false);

  const selectedPatient = patients.find(
    (patient) => patient.id === form.patientId
  );

  const update = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const save = async () => {
    if (!selectedPatient) {
      alert('Please select a patient.');
      return;
    }

    if (!form.procedure.trim()) {
      alert('Procedure is required.');
      return;
    }

    setSaving(true);

    const appointment = {
      date: form.date,
      time: form.time,
      duration: form.duration,
      patient: selectedPatient.name,
      patientId: selectedPatient.id,
      procedure: form.procedure.trim(),
      doctor: form.doctor.trim(),
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };

    try {
      if (currentUser) {
        const ref = await addDoc(
          collection(
            db,
            'clinics',
            currentUser.uid,
            'appointments'
          ),
          appointment
        );

        appointment.id = ref.id;
      } else {
        appointment.id = `APT-${Date.now()}`;
      }

      onCreated(appointment);
    } catch (error) {
      console.error(error);
      appointment.id = `APT-${Date.now()}`;
      onCreated(appointment);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="New Appointment" onClose={onClose}>
      <div className="space-y-4">
        <label className="block">
          <span className="block text-xs font-bold text-slate-600 mb-1.5">
            Patient *
          </span>

          <select
            value={form.patientId}
            onChange={(event) =>
              update('patientId', event.target.value)
            }
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
          >
            <option value="">Select patient</option>

            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.name} — {patient.customId || patient.id}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Date"
            type="date"
            value={form.date}
            onChange={(value) => update('date', value)}
          />

          <FormField
            label="Time"
            value={form.time}
            onChange={(value) => update('time', value)}
          />

          <FormField
            label="Duration"
            value={form.duration}
            onChange={(value) => update('duration', value)}
          />

          <FormField
            label="Doctor"
            value={form.doctor}
            onChange={(value) => update('doctor', value)}
          />
        </div>

        <FormField
          label="Procedure / Reason *"
          value={form.procedure}
          onChange={(value) => update('procedure', value)}
          textarea
        />
      </div>

      <ModalActions
        onClose={onClose}
        onSave={save}
        saving={saving}
        saveText="Create Appointment"
      />
    </Modal>
  );
}

/* =========================================================
   INVOICE MODAL
========================================================= */

function CreateInsuranceInvoiceModal({
  patients,
  currentUser,
  onClose,
  onCreated,
  clinicProfile
}) {
  const [form, setForm] = useState({
    patientId: patients[0]?.id || '',
    itemName: 'Dental Consultation',
    rate: clinicProfile.consultationFee || 500,
    quantity: 1,
    insuranceProvider: '',
    policyNo: '',
    coverageAmt: 0,
    claimStatus: 'Not Submitted'
  });

  const [saving, setSaving] = useState(false);

  const selectedPatient = patients.find(
    (patient) => patient.id === form.patientId
  );

  const total =
    Number(form.rate || 0) * Number(form.quantity || 0);

  const update = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const save = async () => {
    if (!selectedPatient) {
      alert('Select a patient.');
      return;
    }

    if (!form.itemName.trim()) {
      alert('Invoice item is required.');
      return;
    }

    setSaving(true);

    const invoice = {
      customNo: `INV-${new Date().getFullYear()}-${Math.floor(
        100000 + Math.random() * 900000
      )}`,
      patient: selectedPatient.name,
      patientId: selectedPatient.id,
      date: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      dueDate: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      items: [
        {
          id: 1,
          name: form.itemName.trim(),
          qty: Number(form.quantity),
          rate: Number(form.rate)
        }
      ],
      insurance: form.insuranceProvider
        ? {
            provider: form.insuranceProvider,
            policyNo: form.policyNo,
            claimId: `CLM-${Date.now()}`,
            coverageAmt: Number(form.coverageAmt || 0),
            claimStatus: form.claimStatus
          }
        : null,
      total,
      status: 'Unpaid',
      createdAt: new Date().toISOString()
    };

    try {
      if (currentUser) {
        const ref = await addDoc(
          collection(
            db,
            'clinics',
            currentUser.uid,
            'invoices'
          ),
          invoice
        );

        invoice.id = ref.id;
      } else {
        invoice.id = `INV-${Date.now()}`;
      }

      onCreated(invoice);
    } catch (error) {
      console.error(error);
      invoice.id = `INV-${Date.now()}`;
      onCreated(invoice);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Create Invoice" onClose={onClose}>
      <div className="space-y-4">
        <label className="block">
          <span className="block text-xs font-bold text-slate-600 mb-1.5">
            Patient *
          </span>

          <select
            value={form.patientId}
            onChange={(event) =>
              update('patientId', event.target.value)
            }
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
          >
            <option value="">Select patient</option>

            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.name}
              </option>
            ))}
          </select>
        </label>

        <FormField
          label="Invoice Item *"
          value={form.itemName}
          onChange={(value) => update('itemName', value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Rate"
            type="number"
            value={form.rate}
            onChange={(value) => update('rate', value)}
          />

          <FormField
            label="Quantity"
            type="number"
            value={form.quantity}
            onChange={(value) => update('quantity', value)}
          />
        </div>

        <div className="border-t border-slate-200 pt-4">
          <div className="font-black mb-3">
            Insurance / TPA
          </div>

          <div className="space-y-4">
            <FormField
              label="Insurance Provider"
              value={form.insuranceProvider}
              onChange={(value) =>
                update('insuranceProvider', value)
              }
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Policy Number"
                value={form.policyNo}
                onChange={(value) =>
                  update('policyNo', value)
                }
              />

              <FormField
                label="Coverage Amount"
                type="number"
                value={form.coverageAmt}
                onChange={(value) =>
                  update('coverageAmt', value)
                }
              />
            </div>

            <label className="block">
              <span className="block text-xs font-bold text-slate-600 mb-1.5">
                Claim Status
              </span>

              <select
                value={form.claimStatus}
                onChange={(event) =>
                  update('claimStatus', event.target.value)
                }
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
              >
                <option>Not Submitted</option>
                <option>Pre-Auth Requested</option>
                <option>Pre-Auth Approved</option>
                <option>Claim Submitted</option>
                <option>Claim Approved</option>
                <option>Claim Rejected</option>
              </select>
            </label>
          </div>
        </div>

        <div className="bg-slate-950 text-white rounded-xl p-4 flex justify-between items-center">
          <span className="text-sm font-semibold">
            Invoice Total
          </span>
          <span className="text-xl font-black">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      <ModalActions
        onClose={onClose}
        onSave={save}
        saving={saving}
        saveText="Create Invoice"
      />
    </Modal>
  );
}

/* =========================================================
   UPI PAYMENT
========================================================= */

function UPIPaymentModal({
  invoice,
  clinicProfile,
  currentUser,
  onClose,
  onPaid
}) {
  const [processing, setProcessing] = useState(false);

  const upiUrl =
    `upi://pay?pa=${encodeURIComponent(
      clinicProfile.upiId || ''
    )}` +
    `&pn=${encodeURIComponent(
      clinicProfile.clinicName || 'Dental Clinic'
    )}` +
    `&am=${encodeURIComponent(invoice.total || 0)}` +
    `&cu=INR` +
    `&tn=${encodeURIComponent(
      invoice.customNo || invoice.id
    )}`;

  const markPaid = async () => {
    setProcessing(true);

    try {
      if (currentUser) {
        await updateDoc(
          doc(
            db,
            'clinics',
            currentUser.uid,
            'invoices',
            invoice.id
          ),
          {
            status: 'Paid',
            paidAt: new Date().toISOString(),
            paymentMethod: 'UPI'
          }
        );
      }

      onPaid(invoice.id);
    } catch (error) {
      console.error(error);
      onPaid(invoice.id);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Modal title="UPI Payment Collection" onClose={onClose}>
      <div className="text-center">
        <div className="mx-auto w-20 h-20 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <QrCode className="w-10 h-10" />
        </div>

        <div className="mt-5 text-sm text-slate-500">
          Amount payable
        </div>

        <div className="text-3xl font-black mt-1">
          {formatCurrency(invoice.total)}
        </div>

        <div className="mt-5 bg-slate-50 rounded-xl p-4 text-left">
          <div className="text-xs text-slate-500">
            UPI ID
          </div>

          <div className="font-bold mt-1">
            {clinicProfile.upiId || 'Not configured'}
          </div>

          <div className="text-xs text-slate-500 mt-3">
            Payment reference
          </div>

          <div className="font-bold mt-1">
            {invoice.customNo || invoice.id}
          </div>
        </div>

        <a
          href={upiUrl}
          className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl font-bold"
        >
          <QrCode className="w-5 h-5" />
          Open UPI Payment
        </a>

        <button
          onClick={markPaid}
          disabled={processing}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl font-bold disabled:opacity-50"
        >
          <CheckCircle2 className="w-5 h-5" />
          {processing ? 'Saving...' : 'Mark Payment Received'}
        </button>

        <p className="text-[11px] text-slate-400 mt-4">
          Only mark the invoice as paid after your practice has
          verified receipt of funds.
        </p>
      </div>
    </Modal>
  );
}

/* =========================================================
   ADD STOCK
========================================================= */

function AddStockItemModal({
  currentUser,
  onClose,
  onCreated
}) {
  const [form, setForm] = useState({
    name: '',
    category: '',
    qty: 0,
    min: 0,
    unit: 'Units'
  });

  const [saving, setSaving] = useState(false);

  const update = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const save = async () => {
    if (!form.name.trim()) {
      alert('Item name is required.');
      return;
    }

    setSaving(true);

    const item = {
      name: form.name.trim(),
      category: form.category.trim(),
      qty: Number(form.qty || 0),
      min: Number(form.min || 0),
      unit: form.unit,
      status:
        Number(form.qty || 0) <= Number(form.min || 0)
          ? 'Low Stock'
          : 'In Stock',
      createdAt: new Date().toISOString()
    };

    try {
      if (currentUser) {
        const ref = await addDoc(
          collection(
            db,
            'clinics',
            currentUser.uid,
            'inventory'
          ),
          item
        );

        item.id = ref.id;
      } else {
        item.id = `STK-${Date.now()}`;
      }

      onCreated(item);
    } catch (error) {
      console.error(error);
      item.id = `STK-${Date.now()}`;
      onCreated(item);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Add Inventory Item" onClose={onClose}>
      <div className="space-y-4">
        <FormField
          label="Item Name *"
          value={form.name}
          onChange={(value) => update('name', value)}
        />

        <FormField
          label="Category"
          value={form.category}
          onChange={(value) => update('category', value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Current Quantity"
            type="number"
            value={form.qty}
            onChange={(value) => update('qty', value)}
          />

          <FormField
            label="Minimum Quantity"
            type="number"
            value={form.min}
            onChange={(value) => update('min', value)}
          />
        </div>

        <FormField
          label="Unit"
          value={form.unit}
          onChange={(value) => update('unit', value)}
        />
      </div>

      <ModalActions
        onClose={onClose}
        onSave={save}
        saving={saving}
        saveText="Add Item"
      />
    </Modal>
  );
}

/* =========================================================
   PATIENT DETAILS
========================================================= */

function PatientDetailsModal({
  patient,
  onClose,
  onUpdate
}) {
  const [record, setRecord] = useState(patient);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRecord(patient);
  }, [patient]);

  const updateMedical = (key, value) => {
    setRecord((prev) => ({
      ...prev,
      medicalHistory: {
        ...(prev.medicalHistory || {}),
        [key]: value
      }
    }));
  };

  const updateRadiology = (key, value) => {
    setRecord((prev) => ({
      ...prev,
      radiologyReport: {
        ...(prev.radiologyReport || {}),
        [key]: value
      }
    }));
  };

  const updateTooth = (tooth, condition) => {
    setRecord((prev) => ({
      ...prev,
      odontogram: {
        ...(prev.odontogram || {}),
        [tooth]: condition
      }
    }));
  };

  const save = async () => {
    setSaving(true);

    try {
      await onUpdate(record);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`Clinical Chart — ${patient.name}`}
      onClose={onClose}
      wide
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoCard
            label="Patient ID"
            value={patient.customId || patient.id}
          />

          <InfoCard
            label="Phone"
            value={patient.phone || 'Not provided'}
          />

          <InfoCard
            label="Registered"
            value={patient.registeredDate || '—'}
          />
        </div>

        <section>
          <SectionTitle
            icon={FileText}
            title="Medical History"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <FormField
              label="Medical Conditions"
              value={
                record.medicalHistory?.conditions || ''
              }
              onChange={(value) =>
                updateMedical('conditions', value)
              }
              textarea
            />

            <FormField
              label="Allergies"
              value={
                record.medicalHistory?.allergies || ''
              }
              onChange={(value) =>
                updateMedical('allergies', value)
              }
              textarea
            />
          </div>
        </section>

        <section>
          <SectionTitle
            icon={Eye}
            title="Radiology & Diagnosis"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <FormField
              label="Trauma Findings"
              value={
                record.radiologyReport?.traumaFindings || ''
              }
              onChange={(value) =>
                updateRadiology('traumaFindings', value)
              }
              textarea
            />

            <FormField
              label="Impaction Classification"
              value={
                record.radiologyReport?.impactionClass || ''
              }
              onChange={(value) =>
                updateRadiology('impactionClass', value)
              }
              textarea
            />

            <FormField
              label="Diagnosis Notes"
              value={
                record.radiologyReport?.diagnosisNotes || ''
              }
              onChange={(value) =>
                updateRadiology('diagnosisNotes', value)
              }
              textarea
            />

            <FormField
              label="Bone Status"
              value={
                record.radiologyReport?.boneStatus || ''
              }
              onChange={(value) =>
                updateRadiology('boneStatus', value)
              }
              textarea
            />
          </div>
        </section>

        <section>
          <SectionTitle
            icon={Stethoscope}
            title="FDI Odontogram"
          />

          <div className="mt-4">
            <Odontogram
              odontogram={record.odontogram || {}}
              onChange={updateTooth}
            />
          </div>
        </section>

        <section>
          <SectionTitle
            icon={FileText}
            title="Prescriptions"
          />

          <PrescriptionEditor
            prescriptions={record.prescriptions || []}
            onChange={(prescriptions) =>
              setRecord((prev) => ({
                ...prev,
                prescriptions
              }))
            }
          />
        </section>
      </div>

      <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
        <button
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold"
        >
          Close
        </button>

        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Clinical Record'}
        </button>
      </div>
    </Modal>
  );
}

/* =========================================================
   ODONTOGRAM
========================================================= */

function Odontogram({ odontogram, onChange }) {
  const [selectedCondition, setSelectedCondition] =
    useState('healthy');

  const renderTooth = (tooth) => {
    const condition = odontogram[tooth] || 'healthy';
    const config =
      TOOTH_CONDITIONS[condition] ||
      TOOTH_CONDITIONS.healthy;

    return (
      <button
        key={tooth}
        onClick={() => onChange(tooth, selectedCondition)}
        title={`FDI ${tooth}: ${config.label}`}
        className={`min-w-[42px] h-12 px-1 rounded-lg border text-[10px] font-black transition hover:scale-105 ${config.bg}`}
      >
        <div>{tooth}</div>
        <div className="text-[8px] opacity-70">
          {config.short}
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {Object.entries(TOOTH_CONDITIONS).map(
          ([key, config]) => (
            <button
              key={key}
              onClick={() => setSelectedCondition(key)}
              className={`px-2 py-1.5 rounded-lg border text-[10px] font-bold ${config.bg} ${
                selectedCondition === key
                  ? 'ring-2 ring-blue-500 ring-offset-1'
                  : ''
              }`}
            >
              {config.label}
            </button>
          )
        )}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 overflow-x-auto">
        <div className="text-xs font-bold text-slate-500 mb-2">
          Upper Arch
        </div>

        <div className="flex gap-1 min-w-max">
          {FDI_TEETH.upper.map(renderTooth)}
        </div>

        <div className="h-5" />

        <div className="text-xs font-bold text-slate-500 mb-2">
          Lower Arch
        </div>

        <div className="flex gap-1 min-w-max">
          {FDI_TEETH.lower.map(renderTooth)}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PRESCRIPTION EDITOR
========================================================= */

function PrescriptionEditor({ prescriptions, onChange }) {
  const add = () => {
    onChange([
      ...prescriptions,
      {
        id: `rx-${Date.now()}`,
        medicine: '',
        dosage: '',
        frequency: '',
        duration: '',
        notes: ''
      }
    ]);
  };

  const update = (id, key, value) => {
    onChange(
      prescriptions.map((rx) =>
        rx.id === id
          ? {
              ...rx,
              [key]: value
            }
          : rx
      )
    );
  };

  const remove = (id) => {
    onChange(
      prescriptions.filter((rx) => rx.id !== id)
    );
  };

  return (
    <div className="mt-4 space-y-3">
      {prescriptions.map((rx) => (
        <div
          key={rx.id}
          className="border border-slate-200 rounded-xl p-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <FormField
              label="Medicine"
              value={rx.medicine}
              onChange={(value) =>
                update(rx.id, 'medicine', value)
              }
            />

            <FormField
              label="Dosage"
              value={rx.dosage}
              onChange={(value) =>
                update(rx.id, 'dosage', value)
              }
            />

            <FormField
              label="Frequency"
              value={rx.frequency}
              onChange={(value) =>
                update(rx.id, 'frequency', value)
              }
            />

            <FormField
              label="Duration"
              value={rx.duration}
              onChange={(value) =>
                update(rx.id, 'duration', value)
              }
            />

            <div className="flex items-end">
              <button
                onClick={() => remove(rx.id)}
                className="w-full px-3 py-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-bold"
              >
                Remove
              </button>
            </div>
          </div>

          <div className="mt-3">
            <FormField
              label="Notes"
              value={rx.notes}
              onChange={(value) =>
                update(rx.id, 'notes', value)
              }
            />
          </div>
        </div>
      ))}

      <button
        onClick={add}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 text-blue-700 text-sm font-bold"
      >
        <Plus className="w-4 h-4" />
        Add Prescription
      </button>
    </div>
  );
}

/* =========================================================
   GENERIC MODAL COMPONENTS
========================================================= */

function Modal({
  title,
  onClose,
  children,
  wide = false
}) {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div
        className={`w-full ${
          wide ? 'max-w-6xl' : 'max-w-2xl'
        } max-h-[94vh] overflow-hidden bg-white rounded-2xl shadow-2xl`}
      >
        <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-black text-lg">{title}</h2>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[calc(94vh-4rem)]">
          {children}
        </div>
      </div>
    </div>
  );
}

function ModalActions({
  onClose,
  onSave,
  saving,
  saveText
}) {
  return (
    <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
      <button
        onClick={onClose}
        disabled={saving}
        className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold"
      >
        Cancel
      </button>

      <button
        onClick={onSave}
        disabled={saving}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold disabled:opacity-50"
      >
        {saving ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Check className="w-4 h-4" />
            {saveText}
          </>
        )}
      </button>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3">
      <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
        {label}
      </div>
      <div className="text-sm font-bold mt-1 truncate">
        {value}
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2">
      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
        <Icon className="w-4 h-4" />
      </div>
      <h3 className="font-black">{title}</h3>
    </div>
  );
}// ===============================
// APPEND TO src/App.jsx
// ===============================

// ---------- Reusable UI ----------

function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h2 className="text-xl font-black text-slate-900">{title}</h2>
        {subtitle && (
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ icon: Icon = FileText, title, message, action }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-slate-400" />
      </div>
      <h3 className="font-bold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
        {message}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    scheduled: "bg-blue-50 text-blue-700 border-blue-200",
    in_progress: "bg-amber-50 text-amber-700 border-amber-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Unpaid: "bg-red-50 text-red-700 border-red-200",
    "Partially Paid": "bg-amber-50 text-amber-700 border-amber-200",
    Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Inactive: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-bold ${
        styles[status] || "bg-slate-100 text-slate-600 border-slate-200"
      }`}
    >
      {String(status || "Unknown").replace("_", " ")}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, color = "blue", subtext }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p className="text-2xl font-black text-slate-900 mt-2">{value}</p>
          {subtext && (
            <p className="text-xs text-slate-400 mt-1">{subtext}</p>
          )}
        </div>

        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center ${
            colors[color] || colors.blue
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

// ---------- Dashboard ----------

function DashboardView({
  stats,
  appointments,
  weeklyChartData,
  onOpenAppointment,
  onCycleStatus,
}) {
  const today = formatDateKey(new Date());

  const todayAppointments = appointments.filter(
    (item) => item.date === today
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Practice Dashboard"
        subtitle="Real-time overview of your dental practice."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Registered Patients"
          value={stats.totalPatients}
          color="blue"
        />

        <StatCard
          icon={CalendarIcon}
          label="Today's Appointments"
          value={stats.todayCount}
          color="purple"
        />

        <StatCard
          icon={IndianRupee}
          label="Paid Invoices"
          value={formatCurrency(stats.collectedToday)}
          color="emerald"
        />

        <StatCard
          icon={Package}
          label="Low Stock Items"
          value={stats.lowStockCount}
          color={stats.lowStockCount > 0 ? "red" : "emerald"}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-black text-slate-900">
                Appointment Activity
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Appointment volume by weekday
              </p>
            </div>
            <BarChart2 className="w-5 h-5 text-slate-400" />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar
                  dataKey="count"
                  fill="#2563eb"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-black text-slate-900">
                Today's Schedule
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {getDisplayDate(new Date())}
              </p>
            </div>

            <button
              onClick={onOpenAppointment}
              className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {todayAppointments.length === 0 ? (
            <EmptyState
              icon={CalendarIcon}
              title="No appointments"
              message="There are no appointments scheduled for today."
            />
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {todayAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="border border-slate-200 rounded-xl p-3"
                >
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-bold text-sm text-slate-900">
                        {appointment.patient}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {appointment.time}
                      </p>
                      <p className="text-xs text-slate-500">
                        {appointment.procedure}
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        onCycleStatus(
                          appointment.id,
                          appointment.status
                        )
                      }
                    >
                      <StatusBadge status={appointment.status} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Appointments ----------

function AppointmentsView({
  appointments,
  selectedDate,
  onDateShift,
  onNewAppointment,
  onCycleStatus,
}) {
  const dateKey = formatDateKey(selectedDate);

  const dayAppointments = appointments.filter(
    (appointment) => appointment.date === dateKey
  );

  return (
    <div>
      <SectionHeader
        title="Appointments"
        subtitle="Manage clinical appointments and chair schedules."
        action={
          <button
            onClick={onNewAppointment}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            New Appointment
          </button>
        }
      />

      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-5">
        <div className="flex items-center justify-between">
          <button
            onClick={() => onDateShift(-1)}
            className="w-10 h-10 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <p className="text-xs uppercase tracking-wider font-bold text-slate-400">
              Selected Date
            </p>
            <p className="font-black text-slate-900 mt-1">
              {getDisplayDate(selectedDate)}
            </p>
          </div>

          <button
            onClick={() => onDateShift(1)}
            className="w-10 h-10 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {dayAppointments.length === 0 ? (
        <EmptyState
          icon={CalendarIcon}
          title="No appointments"
          message="No appointments exist for the selected date."
          action={
            <button
              onClick={onNewAppointment}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold"
            >
              Create Appointment
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {dayAppointments
            .sort((a, b) => String(a.time).localeCompare(String(b.time)))
            .map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white border border-slate-200 rounded-2xl p-5"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>

                    <div>
                      <h3 className="font-black text-slate-900">
                        {appointment.patient}
                      </h3>

                      <p className="text-sm text-slate-600 mt-1">
                        {appointment.procedure}
                      </p>

                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                        <span>{appointment.time}</span>
                        <span>{appointment.doctor}</span>
                        {appointment.duration && (
                          <span>{appointment.duration}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      onCycleStatus(
                        appointment.id,
                        appointment.status
                      )
                    }
                    className="self-start lg:self-center"
                  >
                    <StatusBadge status={appointment.status} />
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// ---------- Patients ----------

function PatientsView({
  patients,
  searchQuery,
  setSearchQuery,
  onNewPatient,
  onSelectPatient,
  onDeletePatient,
}) {
  const filtered = patients.filter((patient) => {
    const query = searchQuery.toLowerCase();

    return (
      String(patient.name || "").toLowerCase().includes(query) ||
      String(patient.phone || "").toLowerCase().includes(query) ||
      String(patient.customId || "").toLowerCase().includes(query)
    );
  });

  return (
    <div>
      <SectionHeader
        title="Patients"
        subtitle="Secure clinical patient registry."
        action={
          <button
            onClick={onNewPatient}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold"
          >
            <Plus className="w-4 h-4" />
            New Patient
          </button>
        }
      />

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search patient name, phone or patient ID..."
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-blue-500"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No patients found"
          message={
            patients.length === 0
              ? "Your patient registry is empty."
              : "No patients match your search."
          }
          action={
            patients.length === 0 && (
              <button
                onClick={onNewPatient}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold"
              >
                Register Patient
              </button>
            )
          }
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-4 text-xs uppercase tracking-wider text-slate-500">
                    Patient
                  </th>
                  <th className="px-5 py-4 text-xs uppercase tracking-wider text-slate-500">
                    Contact
                  </th>
                  <th className="px-5 py-4 text-xs uppercase tracking-wider text-slate-500">
                    Patient ID
                  </th>
                  <th className="px-5 py-4 text-xs uppercase tracking-wider text-slate-500">
                    Registered
                  </th>
                  <th className="px-5 py-4" />
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filtered.map((patient) => (
                  <tr
                    key={patient.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <button
                        onClick={() => onSelectPatient(patient)}
                        className="text-left"
                      >
                        <p className="font-bold text-slate-900">
                          {patient.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {patient.medicalHistory?.conditions ||
                            "No medical history recorded"}
                        </p>
                      </button>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {patient.phone || "—"}
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded-lg">
                        {patient.customId || patient.id}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {patient.registeredDate || "—"}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => onSelectPatient(patient)}
                          className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() =>
                            onDeletePatient(
                              patient.id,
                              patient.name
                            )
                          }
                          className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Billing ----------

function BillingView({
  invoices,
  onNewInvoice,
  onOpenUPI,
}) {
  const totals = useMemo(() => {
    return invoices.reduce(
      (acc, invoice) => {
        const total = Number(invoice.total) || 0;

        acc.total += total;

        if (invoice.status === "Paid") {
          acc.paid += total;
        }

        if (invoice.status !== "Paid") {
          acc.outstanding += total;
        }

        return acc;
      },
      { total: 0, paid: 0, outstanding: 0 }
    );
  }, [invoices]);

  return (
    <div>
      <SectionHeader
        title="Billing & Invoices"
        subtitle="Manage patient billing, insurance claims and payments."
        action={
          <button
            onClick={onNewInvoice}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold"
          >
            <Plus className="w-4 h-4" />
            Create Invoice
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={Receipt}
          label="Invoice Value"
          value={formatCurrency(totals.total)}
          color="blue"
        />
        <StatCard
          icon={CheckCircle2}
          label="Collected"
          value={formatCurrency(totals.paid)}
          color="emerald"
        />
        <StatCard
          icon={AlertCircle}
          label="Outstanding"
          value={formatCurrency(totals.outstanding)}
          color="red"
        />
      </div>

      {invoices.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No invoices"
          message="Create your first patient invoice to begin billing."
          action={
            <button
              onClick={onNewInvoice}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold"
            >
              Create Invoice
            </button>
          }
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-4 text-xs uppercase text-slate-500">
                    Invoice
                  </th>
                  <th className="px-5 py-4 text-xs uppercase text-slate-500">
                    Patient
                  </th>
                  <th className="px-5 py-4 text-xs uppercase text-slate-500">
                    Insurance
                  </th>
                  <th className="px-5 py-4 text-xs uppercase text-slate-500">
                    Amount
                  </th>
                  <th className="px-5 py-4 text-xs uppercase text-slate-500">
                    Status
                  </th>
                  <th className="px-5 py-4" />
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900">
                        {invoice.customNo || invoice.id}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {invoice.date || "—"}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold">
                      {invoice.patient}
                    </td>

                    <td className="px-5 py-4">
                      {invoice.insurance ? (
                        <div>
                          <p className="text-xs font-bold text-slate-700">
                            {invoice.insurance.provider}
                          </p>
                          <p className="text-xs text-emerald-600 mt-1">
                            {invoice.insurance.claimStatus}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Self Pay
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 font-black">
                      {formatCurrency(invoice.total)}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={invoice.status} />
                    </td>

                    <td className="px-5 py-4">
                      {invoice.status !== "Paid" && (
                        <button
                          onClick={() => onOpenUPI(invoice)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold"
                        >
                          <QrCode className="w-4 h-4" />
                          UPI
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Inventory ----------

function StockInventoryView({
  inventory,
  onAddStock,
}) {
  return (
    <div>
      <SectionHeader
        title="Stock & Inventory"
        subtitle="Monitor consumables, medicines and replenishment levels."
        action={
          <button
            onClick={onAddStock}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold"
          >
            <Plus className="w-4 h-4" />
            Add Stock Item
          </button>
        }
      />

      {inventory.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Inventory is empty"
          message="Add consumables, materials or medications to your inventory."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {inventory.map((item) => {
            const low = Number(item.qty) <= Number(item.min);

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-2xl p-5"
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-900">
                      {item.name}
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      {item.category}
                    </p>
                  </div>

                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-lg ${
                      low
                        ? "bg-red-50 text-red-600"
                        : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    {low ? "Reorder" : "Healthy"}
                  </span>
                </div>

                <div className="mt-6 flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-black text-slate-900">
                      {item.qty}
                    </p>
                    <p className="text-xs text-slate-400">
                      {item.unit}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-slate-400">
                      Minimum
                    </p>
                    <p className="font-bold text-slate-700">
                      {item.min}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------- Staff ----------

function StaffRolesView({ staffList }) {
  return (
    <div>
      <SectionHeader
        title="Staff & Roles"
        subtitle="Practice workforce and operational access."
      />

      {staffList.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No staff members"
          message="No clinical or operational staff have been added."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {staffList.map((staff) => (
            <div
              key={staff.id}
              className="bg-white border border-slate-200 rounded-2xl p-5"
            >
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2 items-center">
                    <h3 className="font-black text-slate-900">
                      {staff.name}
                    </h3>

                    <StatusBadge status={staff.status} />
                  </div>

                  <p className="text-sm text-blue-600 font-semibold mt-1">
                    {staff.role}
                  </p>

                  <div className="mt-3 space-y-1 text-xs text-slate-500">
                    {staff.phone && <p>{staff.phone}</p>}
                    {staff.shift && <p>{staff.shift}</p>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Practice Settings ----------

function PracticeSettingsView({
  profile,
  onSave,
}) {
  const [form, setForm] = useState(profile || {});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(profile || {});
  }, [profile]);

  const update = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();

    setSaving(true);

    try {
      await onSave({
        ...form,
        consultationFee: Number(form.consultationFee || 0),
      });
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    ["clinicName", "Clinic Name"],
    ["tagline", "Tagline"],
    ["licenseNo", "Dental License / Registration No."],
    ["gstin", "GSTIN"],
    ["contactEmail", "Contact Email"],
    ["contactPhone", "Contact Phone"],
    ["upiId", "UPI Settlement ID"],
    ["operatingHours", "Operating Hours"],
  ];

  return (
    <div>
      <SectionHeader
        title="Practice Settings"
        subtitle="Manage clinic identity, regulatory details and payment configuration."
      />

      <form
        onSubmit={submit}
        className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {fields.map(([key, label]) => (
            <label key={key} className="block">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                {label}
              </span>

              <input
                value={form[key] || ""}
                onChange={(e) => update(key, e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </label>
          ))}

          <label className="block">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Consultation Fee
            </span>

            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

              <input
                type="number"
                min="0"
                value={form.consultationFee ?? ""}
                onChange={(e) =>
                  update("consultationFee", e.target.value)
                }
                className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </label>
        </div>

        <label className="block">
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Clinic Address
          </span>

          <textarea
            rows={4}
            value={form.address || ""}
            onChange={(e) => update("address", e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 resize-none"
          />
        </label>

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Practice Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------- Radiology / Diagnosis ----------

function RadiologyDiagnosisView({
  patients,
  onSelectPatient,
}) {
  return (
    <div>
      <SectionHeader
        title="Radiology & Diagnosis"
        subtitle="Review patient diagnostic records and odontogram findings."
      />

      {patients.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No clinical records"
          message="Register a patient before entering diagnostic information."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {patients.map((patient) => (
            <button
              key={patient.id}
              onClick={() => onSelectPatient(patient)}
              className="text-left bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-300 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-black text-slate-900">
                    {patient.name}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1">
                    {patient.customId || patient.id}
                  </p>
                </div>

                <Eye className="w-5 h-5 text-slate-400" />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] uppercase font-bold text-slate-400">
                    Diagnosis
                  </p>
                  <p className="text-xs font-semibold text-slate-700 mt-1 line-clamp-3">
                    {patient.radiologyReport?.diagnosisNotes ||
                      "No diagnosis entered"}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] uppercase font-bold text-slate-400">
                    OPG
                  </p>
                  <p className="text-xs font-semibold text-slate-700 mt-1">
                    {patient.opgScans?.length || 0} scan(s)
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Modal ----------

function Modal({ open, title, children, onClose, size = "max-w-lg" }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className={`w-full ${size} max-h-[92vh] overflow-y-auto bg-white rounded-2xl shadow-2xl`}
      >
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between">
          <h2 className="font-black text-slate-900">{title}</h2>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ---------- New Patient Modal ----------

function NewPatientModal({
  open,
  onClose,
  onCreate,
}) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    gender: "",
    dob: "",
    conditions: "",
    allergies: "",
  });

  const update = (key, value) =>
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

  const submit = (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Patient name is required.");
      return;
    }

    onCreate(form);

    setForm({
      name: "",
      phone: "",
      email: "",
      gender: "",
      dob: "",
      conditions: "",
      allergies: "",
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Register New Patient"
    >
      <form onSubmit={submit} className="space-y-4">
        <input
          required
          placeholder="Patient full name *"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm"
          />

          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm"
          />

          <input
            type="date"
            value={form.dob}
            onChange={(e) => update("dob", e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm"
          />

          <select
            value={form.gender}
            onChange={(e) => update("gender", e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white"
          >
            <option value="">Gender</option>
            <option>Female</option>
            <option>Male</option>
            <option>Other</option>
            <option>Prefer not to say</option>
          </select>
        </div>

        <textarea
          placeholder="Medical conditions"
          rows={3}
          value={form.conditions}
          onChange={(e) => update("conditions", e.target.value)}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none"
        />

        <textarea
          placeholder="Allergies"
          rows={3}
          value={form.allergies}
          onChange={(e) => update("allergies", e.target.value)}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none"
        />

        <button className="w-full bg-blue-600 text-white rounded-xl py-3 font-bold">
          Register Patient
        </button>
      </form>
    </Modal>
  );
}

// ---------- New Appointment Modal ----------

function NewAppointmentModal({
  open,
  onClose,
  patients,
  onCreate,
}) {
  const [form, setForm] = useState({
    patientId: "",
    date: formatDateKey(new Date()),
    time: "",
    duration: "30 min",
    procedure: "",
    doctor: "",
  });

  const update = (key, value) =>
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

  const submit = (e) => {
    e.preventDefault();

    const patient = patients.find(
      (p) => p.id === form.patientId
    );

    if (!patient) {
      alert("Select a patient.");
      return;
    }

    if (!form.time || !form.procedure) {
      alert("Time and procedure are required.");
      return;
    }

    onCreate({
      ...form,
      patient: patient.name,
      status: "scheduled",
    });

    setForm({
      patientId: "",
      date: formatDateKey(new Date()),
      time: "",
      duration: "30 min",
      procedure: "",
      doctor: "",
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Appointment"
    >
      <form onSubmit={submit} className="space-y-4">
        <select
          required
          value={form.patientId}
          onChange={(e) =>
            update("patientId", e.target.value)
          }
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white"
        >
          <option value="">Select patient *</option>

          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.name}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            required
            type="date"
            value={form.date}
            onChange={(e) => update("date", e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-3 text-sm"
          />

          <input
            required
            type="time"
            value={form.time}
            onChange={(e) => update("time", e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-3 text-sm"
          />
        </div>

        <select
          value={form.duration}
          onChange={(e) =>
            update("duration", e.target.value)
          }
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white"
        >
          <option>15 min</option>
          <option>30 min</option>
          <option>45 min</option>
          <option>60 min</option>
          <option>90 min</option>
          <option>120 min</option>
        </select>

        <input
          required
          placeholder="Procedure / reason *"
          value={form.procedure}
          onChange={(e) =>
            update("procedure", e.target.value)
          }
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm"
        />

        <input
          placeholder="Doctor"
          value={form.doctor}
          onChange={(e) => update("doctor", e.target.value)}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm"
        />

        <button className="w-full bg-blue-600 text-white rounded-xl py-3 font-bold">
          Create Appointment
        </button>
      </form>
    </Modal>
  );
}

// ---------- Add Stock Modal ----------

function AddStockItemModal({
  open,
  onClose,
  onCreate,
}) {
  const [form, setForm] = useState({
    name: "",
    category: "",
    qty: "",
    min: "",
    unit: "",
  });

  const update = (key, value) =>
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

  const submit = (e) => {
    e.preventDefault();

    if (!form.name || !form.qty || !form.min) {
      alert("Name, quantity and minimum level are required.");
      return;
    }

    onCreate({
      ...form,
      qty: Number(form.qty),
      min: Number(form.min),
      status:
        Number(form.qty) <= Number(form.min)
          ? "Low Stock"
          : "In Stock",
    });

    setForm({
      name: "",
      category: "",
      qty: "",
      min: "",
      unit: "",
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Inventory Item"
    >
      <form onSubmit={submit} className="space-y-4">
        <input
          required
          placeholder="Item name *"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm"
        />

        <input
          placeholder="Category"
          value={form.category}
          onChange={(e) => update("category", e.target.value)}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm"
        />

        <div className="grid grid-cols-2 gap-3">
          <input
            required
            type="number"
            min="0"
            placeholder="Quantity"
            value={form.qty}
            onChange={(e) => update("qty", e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-3 text-sm"
          />

          <input
            required
            type="number"
            min="0"
            placeholder="Minimum"
            value={form.min}
            onChange={(e) => update("min", e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-3 text-sm"
          />
        </div>

        <input
          placeholder="Unit e.g. Boxes, Packs"
          value={form.unit}
          onChange={(e) => update("unit", e.target.value)}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm"
        />

        <button className="w-full bg-blue-600 text-white rounded-xl py-3 font-bold">
          Add Item
        </button>
      </form>
    </Modal>
  );
}

// ---------- Invoice Modal ----------

function CreateInsuranceInvoiceModal({
  open,
  onClose,
  patients,
  onCreate,
}) {
  const [form, setForm] = useState({
    patientId: "",
    itemName: "",
    amount: "",
    insuranceProvider: "",
    policyNo: "",
    coverageAmt: "",
  });

  const update = (key, value) =>
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

  const submit = (e) => {
    e.preventDefault();

    const patient = patients.find(
      (p) => p.id === form.patientId
    );

    if (!patient) {
      alert("Select a patient.");
      return;
    }

    const total = Number(form.amount || 0);

    if (!form.itemName || total <= 0) {
      alert("Enter invoice item and valid amount.");
      return;
    }

    onCreate({
      patient: patient.name,
      items: [
        {
          id: Date.now(),
          name: form.itemName,
          qty: 1,
          rate: total,
        },
      ],
      total,
      status: "Unpaid",
      insurance: form.insuranceProvider
        ? {
            provider: form.insuranceProvider,
            policyNo: form.policyNo,
            coverageAmt: Number(form.coverageAmt || 0),
            claimStatus: "Pre-Authorization Required",
          }
        : null,
    });

    setForm({
      patientId: "",
      itemName: "",
      amount: "",
      insuranceProvider: "",
      policyNo: "",
      coverageAmt: "",
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Invoice"
    >
      <form onSubmit={submit} className="space-y-4">
        <select
          required
          value={form.patientId}
          onChange={(e) =>
            update("patientId", e.target.value)
          }
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white"
        >
          <option value="">Select patient *</option>
          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.name}
            </option>
          ))}
        </select>

        <input
          required
          placeholder="Treatment / service"
          value={form.itemName}
          onChange={(e) =>
            update("itemName", e.target.value)
          }
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm"
        />

        <input
          required
          type="number"
          min="0"
          placeholder="Amount"
          value={form.amount}
          onChange={(e) => update("amount", e.target.value)}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm"
        />

        <div className="border-t border-slate-100 pt-4">
          <p className="text-sm font-black text-slate-800 mb-3">
            Insurance — optional
          </p>

          <div className="space-y-3">
            <input
              placeholder="Insurance provider"
              value={form.insuranceProvider}
              onChange={(e) =>
                update(
                  "insuranceProvider",
                  e.target.value
                )
              }
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm"
            />

            <input
              placeholder="Policy number"
              value={form.policyNo}
              onChange={(e) =>
                update("policyNo", e.target.value)
              }
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm"
            />

            <input
              type="number"
              min="0"
              placeholder="Expected coverage amount"
              value={form.coverageAmt}
              onChange={(e) =>
                update("coverageAmt", e.target.value)
              }
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm"
            />
          </div>
        </div>

        <button className="w-full bg-blue-600 text-white rounded-xl py-3 font-bold">
          Create Invoice
        </button>
      </form>
    </Modal>
  );
}

// ---------- UPI Modal ----------

function UPIPaymentModal({
  open,
  onClose,
  invoice,
  clinicProfile,
}) {
  if (!invoice) return null;

  const amount = Number(invoice.total || 0);

  const upiUrl =
    `upi://pay?pa=${encodeURIComponent(
      clinicProfile?.upiId || ""
    )}` +
    `&pn=${encodeURIComponent(
      clinicProfile?.clinicName || "Dental Clinic"
    )}` +
    `&am=${encodeURIComponent(amount)}` +
    `&cu=INR` +
    `&tn=${encodeURIComponent(
      invoice.customNo || invoice.id
    )}`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="UPI Payment"
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <QrCode className="w-8 h-8 text-emerald-600" />
        </div>

        <h3 className="font-black text-slate-900">
          {clinicProfile?.clinicName || "Dental Clinic"}
        </h3>

        <p className="text-sm text-slate-500 mt-1">
          {invoice.patient}
        </p>

        <p className="text-3xl font-black text-slate-900 mt-5">
          {formatCurrency(amount)}
        </p>

        <div className="bg-slate-50 rounded-xl p-4 mt-5 text-left">
          <p className="text-xs text-slate-400 uppercase font-bold">
            UPI ID
          </p>
          <p className="font-mono text-sm font-bold mt-1">
            {clinicProfile?.upiId || "Not configured"}
          </p>
        </div>

        {clinicProfile?.upiId && (
          <a
            href={upiUrl}
            className="block mt-5 w-full bg-emerald-600 text-white rounded-xl py-3 font-bold"
          >
            Open UPI Payment
          </a>
        )}

        <p className="text-xs text-slate-400 mt-4">
          Configure your clinic UPI ID in Practice Settings before
          accepting digital payments.
        </p>
      </div>
    </Modal>
  );
}

// ---------- Patient Details ----------

function PatientDetailsModal({
  patient,
  open,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(patient || {});

  useEffect(() => {
    setForm(patient || {});
  }, [patient]);

  if (!patient) return null;

  const updateHistory = (key, value) => {
    setForm((prev) => ({
      ...prev,
      medicalHistory: {
        ...(prev.medicalHistory || {}),
        [key]: value,
      },
    }));
  };

  const updateRadiology = (key, value) => {
    setForm((prev) => ({
      ...prev,
      radiologyReport: {
        ...(prev.radiologyReport || {}),
        [key]: value,
      },
    }));
  };

  const updateTooth = (tooth, condition) => {
    setForm((prev) => ({
      ...prev,
      odontogram: {
        ...(prev.odontogram || {}),
        [tooth]: condition,
      },
    }));
  };

  const submit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Clinical Chart — ${patient.name}`}
      size="max-w-5xl"
    >
      <form onSubmit={submit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-slate-50 rounded-2xl p-4">
            <p className="text-xs uppercase font-bold text-slate-400">
              Patient
            </p>
            <p className="font-black text-slate-900 mt-1">
              {patient.name}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {patient.phone || "No phone"}
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4">
            <p className="text-xs uppercase font-bold text-slate-400">
              Patient ID
            </p>
            <p className="font-mono font-bold text-slate-900 mt-1">
              {patient.customId || patient.id}
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4">
            <p className="text-xs uppercase font-bold text-slate-400">
              Registered
            </p>
            <p className="font-bold text-slate-900 mt-1">
              {patient.registeredDate || "—"}
            </p>
          </div>
        </div>

        <div>
          <h3 className="font-black text-slate-900 mb-3">
            Medical History
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <textarea
              rows={4}
              placeholder="Medical conditions"
              value={
                form.medicalHistory?.conditions || ""
              }
              onChange={(e) =>
                updateHistory(
                  "conditions",
                  e.target.value
                )
              }
              className="border border-slate-200 rounded-xl p-4 text-sm resize-none"
            />

            <textarea
              rows={4}
              placeholder="Allergies"
              value={
                form.medicalHistory?.allergies || ""
              }
              onChange={(e) =>
                updateHistory(
                  "allergies",
                  e.target.value
                )
              }
              className="border border-slate-200 rounded-xl p-4 text-sm resize-none"
            />
          </div>
        </div>

        <div>
          <h3 className="font-black text-slate-900 mb-3">
            Radiology & Diagnosis
          </h3>

          <div className="space-y-3">
            <textarea
              rows={3}
              placeholder="Diagnosis notes"
              value={
                form.radiologyReport?.diagnosisNotes || ""
              }
              onChange={(e) =>
                updateRadiology(
                  "diagnosisNotes",
                  e.target.value
                )
              }
              className="w-full border border-slate-200 rounded-xl p-4 text-sm resize-none"
            />

            <textarea
              rows={3}
              placeholder="Trauma findings"
              value={
                form.radiologyReport?.traumaFindings || ""
              }
              onChange={(e) =>
                updateRadiology(
                  "traumaFindings",
                  e.target.value
                )
              }
              className="w-full border border-slate-200 rounded-xl p-4 text-sm resize-none"
            />

            <textarea
              rows={3}
              placeholder="Bone status"
              value={
                form.radiologyReport?.boneStatus || ""
              }
              onChange={(e) =>
                updateRadiology(
                  "boneStatus",
                  e.target.value
                )
              }
              className="w-full border border-slate-200 rounded-xl p-4 text-sm resize-none"
            />
          </div>
        </div>

        <div>
          <h3 className="font-black text-slate-900 mb-3">
            FDI Odontogram
          </h3>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-400 mb-2">
                Upper
              </p>

              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {FDI_TEETH.upper.map((tooth) => (
                  <ToothButton
                    key={tooth}
                    tooth={tooth}
                    value={form.odontogram?.[tooth] || "healthy"}
                    onChange={updateTooth}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-400 mb-2">
                Lower
              </p>

              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {FDI_TEETH.lower.map((tooth) => (
                  <ToothButton
                    key={tooth}
                    tooth={tooth}
                    value={form.odontogram?.[tooth] || "healthy"}
                    onChange={updateTooth}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button className="inline-flex items-center gap-2 bg-blue-600 text-white rounded-xl px-5 py-3 font-bold">
            <Save className="w-4 h-4" />
            Save Clinical Record
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ToothButton({
  tooth,
  value,
  onChange,
}) {
  const conditions = Object.keys(TOOTH_CONDITIONS);
  const current = TOOTH_CONDITIONS[value] || TOOTH_CONDITIONS.healthy;

  const cycle = () => {
    const index = conditions.indexOf(value);
    const next =
      conditions[(index + 1) % conditions.length];

    onChange(tooth, next);
  };

  return (
    <button
      type="button"
      onClick={cycle}
      title={`${tooth}: ${current.label}`}
      className={`min-h-16 rounded-xl border p-2 transition hover:scale-[1.02] ${current.bg}`}
    >
      <span className="block text-xs font-black">{tooth}</span>
      <span className="block text-[9px] mt-1 font-bold">
        {current.short}
      </span>
    </button>
  );
}// ─────────────────────────────────────────────────────────────────────────────
// CONTINUATION OF src/App.jsx
// Paste this after the existing code in your App.jsx
// ─────────────────────────────────────────────────────────────────────────────

  // ───────────────────────────────────────────────────────────────────────────
  // FIRESTORE HELPERS
  // ───────────────────────────────────────────────────────────────────────────

  const clinicCollection = (name) => {
    if (!currentUser) return null;
    return collection(db, 'clinics', currentUser.uid, name);
  };

  const addFirestoreDocument = async (collectionName, data) => {
    if (!currentUser) return null;

    try {
      const ref = await addDoc(clinicCollection(collectionName), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return ref.id;
    } catch (error) {
      console.error(`Failed to create ${collectionName}:`, error);
      throw error;
    }
  };

  const updateFirestoreDocument = async (collectionName, id, data) => {
    if (!currentUser) return;

    await updateDoc(
      doc(db, 'clinics', currentUser.uid, collectionName, id),
      {
        ...data,
        updatedAt: serverTimestamp()
      }
    );
  };

  // ───────────────────────────────────────────────────────────────────────────
  // APPOINTMENTS
  // ───────────────────────────────────────────────────────────────────────────

  const handleCreateAppointment = async (appointment) => {
    const localAppointment = {
      ...appointment,
      id: appointment.id || `APT-${Date.now()}`
    };

    setAppointments(prev => [...prev, localAppointment]);

    if (currentUser) {
      try {
        const firestoreId = await addFirestoreDocument(
          'appointments',
          localAppointment
        );

        setAppointments(prev =>
          prev.map(item =>
            item.id === localAppointment.id
              ? { ...item, id: firestoreId }
              : item
          )
        );
      } catch (error) {
        console.error(error);
      }
    }

    setShowAppointmentModal(false);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // PATIENTS
  // ───────────────────────────────────────────────────────────────────────────

  const handleCreatePatient = async (patient) => {
    const localPatient = {
      ...patient,
      id: patient.id || `PAT-${Date.now()}`
    };

    setPatients(prev => [...prev, localPatient]);

    if (currentUser) {
      try {
        const firestoreId = await addFirestoreDocument(
          'patients',
          localPatient
        );

        setPatients(prev =>
          prev.map(item =>
            item.id === localPatient.id
              ? { ...item, id: firestoreId }
              : item
          )
        );
      } catch (error) {
        console.error(error);
      }
    }

    setShowPatientModal(false);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // INVOICES
  // ───────────────────────────────────────────────────────────────────────────

  const handleCreateInvoice = async (invoice) => {
    const localInvoice = {
      ...invoice,
      id: invoice.id || `INV-${Date.now()}`
    };

    setInvoices(prev => [...prev, localInvoice]);

    if (currentUser) {
      try {
        const firestoreId = await addFirestoreDocument(
          'invoices',
          localInvoice
        );

        setInvoices(prev =>
          prev.map(item =>
            item.id === localInvoice.id
              ? { ...item, id: firestoreId }
              : item
          )
        );
      } catch (error) {
        console.error(error);
      }
    }

    setShowInvoiceModal(false);
  };

  const markInvoicePaid = async (invoice) => {
    const updated = {
      ...invoice,
      status: 'Paid',
      paidAt: new Date().toISOString()
    };

    setInvoices(prev =>
      prev.map(item =>
        item.id === invoice.id ? updated : item
      )
    );

    if (currentUser) {
      try {
        await updateFirestoreDocument(
          'invoices',
          invoice.id,
          {
            status: 'Paid',
            paidAt: new Date().toISOString()
          }
        );
      } catch (error) {
        console.error(error);
      }
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // INVENTORY
  // ───────────────────────────────────────────────────────────────────────────

  const handleAddStock = async (item) => {
    const newItem = {
      ...item,
      id: item.id || `STK-${Date.now()}`,
      status: Number(item.qty) <= Number(item.min)
        ? 'Low Stock'
        : 'In Stock'
    };

    setInventory(prev => [...prev, newItem]);

    if (currentUser) {
      try {
        const firestoreId = await addFirestoreDocument(
          'inventory',
          newItem
        );

        setInventory(prev =>
          prev.map(item =>
            item.id === newItem.id
              ? { ...item, id: firestoreId }
              : item
          )
        );
      } catch (error) {
        console.error(error);
      }
    }

    setShowAddStockModal(false);
  };

  const updateStockQuantity = async (item, amount) => {
    const newQty = Math.max(0, Number(item.qty) + Number(amount));

    const updated = {
      ...item,
      qty: newQty,
      status: newQty <= Number(item.min)
        ? 'Low Stock'
        : 'In Stock'
    };

    setInventory(prev =>
      prev.map(stock =>
        stock.id === item.id ? updated : stock
      )
    );

    if (currentUser) {
      try {
        await updateFirestoreDocument(
          'inventory',
          item.id,
          {
            qty: newQty,
            status: updated.status
          }
        );
      } catch (error) {
        console.error(error);
      }
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // NAVIGATION
  // ───────────────────────────────────────────────────────────────────────────

  const navigation = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: CalendarIcon
    },
    {
      id: 'patients',
      label: 'Patients',
      icon: Users
    },
    {
      id: 'radiology',
      label: 'Radiology & Diagnosis',
      icon: Stethoscope
    },
    {
      id: 'billing',
      label: 'Billing & Insurance',
      icon: Receipt
    },
    {
      id: 'inventory',
      label: 'Stock Inventory',
      icon: Package
    },
    {
      id: 'staff',
      label: 'Staff & Roles',
      icon: Briefcase
    },
    {
      id: 'settings',
      label: 'Practice Settings',
      icon: Building
    }
  ];

  // ───────────────────────────────────────────────────────────────────────────
  // DASHBOARD
  // ───────────────────────────────────────────────────────────────────────────

  const DashboardView = () => {
    const upcoming = [...appointments]
      .filter(a => a.date >= formatDateKey(new Date()))
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
      .slice(0, 6);

    return (
      <div className="space-y-6">

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500 font-medium">
              Clinical workspace
            </p>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Practice Dashboard
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              {clinicProfile.clinicName}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowPatientModal(true)}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              New Patient
            </button>

            <button
              onClick={() => setShowAppointmentModal(true)}
              className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50"
            >
              <CalendarIcon className="w-4 h-4" />
              Appointment
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

          <StatCard
            title="Registered Patients"
            value={stats.totalPatients}
            icon={Users}
            color="blue"
          />

          <StatCard
            title="Today's Appointments"
            value={stats.todayCount}
            icon={CalendarIcon}
            color="indigo"
          />

          <StatCard
            title="Collected Revenue"
            value={formatCurrency(stats.collectedToday)}
            icon={IndianRupee}
            color="emerald"
          />

          <StatCard
            title="Low Stock Items"
            value={stats.lowStockCount}
            icon={Package}
            color="amber"
          />

        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-5">

            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-black text-slate-900">
                  Appointment Activity
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Appointments recorded in the system
                </p>
              </div>

              <BarChart2 className="w-5 h-5 text-slate-400" />
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />

                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                  />

                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                  />

                  <Tooltip />

                  <Bar
                    dataKey="count"
                    fill="#2563eb"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5">

            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-black text-slate-900">
                  Upcoming
                </h2>

                <p className="text-xs text-slate-500">
                  Next scheduled visits
                </p>
              </div>

              <Clock className="w-5 h-5 text-slate-400" />
            </div>

            <div className="space-y-3">

              {upcoming.length === 0 ? (
                <EmptyState
                  icon={CalendarIcon}
                  text="No upcoming appointments"
                />
              ) : (
                upcoming.map(appt => (
                  <div
                    key={appt.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-100"
                  >

                    <div className="flex justify-between gap-3">

                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-900 truncate">
                          {appt.patient}
                        </p>

                        <p className="text-xs text-slate-500 mt-1">
                          {appt.procedure}
                        </p>
                      </div>

                      <span className="text-xs font-bold text-blue-600 whitespace-nowrap">
                        {appt.time}
                      </span>

                    </div>

                    <p className="text-xs text-slate-400 mt-2">
                      {appt.date}
                    </p>

                  </div>
                ))
              )}

            </div>
          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <div className="bg-white border border-slate-200 rounded-2xl p-5">

            <h2 className="font-black text-slate-900 mb-4">
              Operational Alerts
            </h2>

            <div className="space-y-3">

              {inventory
                .filter(item => item.qty <= item.min)
                .slice(0, 5)
                .map(item => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl"
                  >
                    <ShieldAlert className="w-5 h-5 text-amber-600" />

                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">
                        {item.name}
                      </p>

                      <p className="text-xs text-amber-700">
                        {item.qty} {item.unit} remaining
                      </p>
                    </div>
                  </div>
                ))}

              {inventory.filter(item => item.qty <= item.min).length === 0 && (
                <EmptyState
                  icon={CheckCircle2}
                  text="No inventory alerts"
                />
              )}

            </div>

          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5">

            <h2 className="font-black text-slate-900 mb-4">
              Insurance Claims
            </h2>

            <div className="space-y-3">

              {invoices
                .filter(invoice => invoice.insurance)
                .map(invoice => (
                  <div
                    key={invoice.id}
                    className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl"
                  >

                    <ShieldCheck className="w-5 h-5 text-emerald-600" />

                    <div className="flex-1">
                      <p className="text-sm font-bold">
                        {invoice.patient}
                      </p>

                      <p className="text-xs text-slate-500">
                        {invoice.insurance.provider}
                      </p>
                    </div>

                    <span className="text-xs font-bold text-emerald-700">
                      {invoice.insurance.claimStatus}
                    </span>

                  </div>
                ))}

              {invoices.filter(invoice => invoice.insurance).length === 0 && (
                <EmptyState
                  icon={ShieldCheck}
                  text="No active insurance claims"
                />
              )}

            </div>

          </div>

        </div>

      </div>
    );
  };

  // ───────────────────────────────────────────────────────────────────────────
  // APPOINTMENTS VIEW
  // ───────────────────────────────────────────────────────────────────────────

  const AppointmentsView = () => {

    const filteredAppointments = dailyAppointments.filter(appt =>
      `${appt.patient} ${appt.procedure} ${appt.doctor}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );

    return (
      <div className="space-y-6">

        <PageHeader
          title="Appointments"
          subtitle="Manage your clinical schedule"
          action={
            <button
              onClick={() => setShowAppointmentModal(true)}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Appointment
            </button>
          }
        />

        <div className="bg-white border border-slate-200 rounded-2xl p-4">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

            <div className="flex items-center gap-2">

              <button
                onClick={() => handleDateShift(-1)}
                className="p-2 border rounded-lg hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="min-w-[220px] text-center">
                <p className="font-black text-slate-900">
                  {getDisplayDate(selectedDate)}
                </p>
              </div>

              <button
                onClick={() => handleDateShift(1)}
                className="p-2 border rounded-lg hover:bg-slate-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setSelectedDate(new Date())}
                className="px-3 py-2 text-xs font-bold text-blue-600"
              >
                Today
              </button>

            </div>

            <div className="relative w-full lg:w-72">

              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search appointments..."
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />

            </div>

          </div>

        </div>

        <div className="space-y-3">

          {filteredAppointments.length === 0 ? (
            <EmptyPanel
              icon={CalendarIcon}
              title="No appointments"
              description="There are no appointments matching this date or search."
            />
          ) : (

            filteredAppointments.map(appt => (

              <div
                key={appt.id}
                className="bg-white border border-slate-200 rounded-2xl p-5"
              >

                <div className="flex flex-col lg:flex-row lg:items-center gap-4">

                  <div className="lg:w-40">
                    <p className="font-black text-blue-600">
                      {appt.time}
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      {appt.duration}
                    </p>
                  </div>

                  <div className="flex-1">

                    <p className="font-black text-slate-900">
                      {appt.patient}
                    </p>

                    <p className="text-sm text-slate-600 mt-1">
                      {appt.procedure}
                    </p>

                    <p className="text-xs text-slate-400 mt-2">
                      {appt.doctor}
                    </p>

                  </div>

                  <div className="flex items-center gap-2">

                    <StatusBadge status={appt.status} />

                    <button
                      onClick={() =>
                        cycleAppointmentStatus(appt.id, appt.status)
                      }
                      className="px-3 py-2 border rounded-lg text-xs font-bold hover:bg-slate-50"
                    >
                      Update Status
                    </button>

                  </div>

                </div>

              </div>

            ))
          )}

        </div>

      </div>
    );
  };

  // ───────────────────────────────────────────────────────────────────────────
  // PATIENTS VIEW
  // ───────────────────────────────────────────────────────────────────────────

  const PatientsView = () => {

    const filteredPatients = patients.filter(patient =>
      `${patient.name} ${patient.phone} ${patient.customId}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );

    return (
      <div className="space-y-6">

        <PageHeader
          title="Patients"
          subtitle="Clinical records and patient management"
          action={
            <button
              onClick={() => setShowPatientModal(true)}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Register Patient
            </button>
          }
        />

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">

          <div className="p-4 border-b border-slate-100">

            <div className="relative max-w-md">

              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search patients..."
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm"
              />

            </div>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead className="bg-slate-50 border-b border-slate-200">

                <tr>
                  <th className="px-5 py-3 text-xs font-black text-slate-500">
                    Patient
                  </th>

                  <th className="px-5 py-3 text-xs font-black text-slate-500">
                    Patient ID
                  </th>

                  <th className="px-5 py-3 text-xs font-black text-slate-500">
                    Phone
                  </th>

                  <th className="px-5 py-3 text-xs font-black text-slate-500">
                    Registered
                  </th>

                  <th className="px-5 py-3 text-xs font-black text-slate-500">
                    Action
                  </th>
                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {filteredPatients.map(patient => (

                  <tr
                    key={patient.id}
                    className="hover:bg-slate-50"
                  >

                    <td className="px-5 py-4">

                      <p className="font-bold text-slate-900">
                        {patient.name}
                      </p>

                      <p className="text-xs text-slate-400">
                        Clinical chart
                      </p>

                    </td>

                    <td className="px-5 py-4 text-sm font-mono text-slate-600">
                      {patient.customId || patient.id}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {patient.phone}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {patient.registeredDate}
                    </td>

                    <td className="px-5 py-4">

                      <button
                        onClick={() => setSelectedPatientForDetails(patient)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Open Chart
                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

          {filteredPatients.length === 0 && (
            <div className="p-10">
              <EmptyPanel
                icon={Users}
                title="No patients found"
                description="Register your first patient to create a clinical chart."
              />
            </div>
          )}

        </div>

      </div>
    );
  };

  // ───────────────────────────────────────────────────────────────────────────
  // RADIOLOGY / DIAGNOSIS
  // ───────────────────────────────────────────────────────────────────────────

  const RadiologyDiagnosisView = () => {

    const [selectedPatientId, setSelectedPatientId] = useState(
      patients[0]?.id || ''
    );

    const patient = patients.find(
      p => p.id === selectedPatientId
    );

    return (
      <div className="space-y-6">

        <PageHeader
          title="Radiology & Diagnosis"
          subtitle="Clinical imaging, diagnosis and odontogram"
        />

        <div className="bg-white border border-slate-200 rounded-2xl p-5">

          <label className="block text-xs font-black text-slate-500 mb-2">
            Select Patient
          </label>

          <select
            value={selectedPatientId}
            onChange={e => setSelectedPatientId(e.target.value)}
            className="w-full md:w-96 border border-slate-200 rounded-xl px-3 py-3 text-sm"
          >

            <option value="">
              Select patient
            </option>

            {patients.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}

          </select>

        </div>

        {!patient ? (
          <EmptyPanel
            icon={Stethoscope}
            title="Select a patient"
            description="Choose a patient to access clinical diagnosis and dental charting."
          />
        ) : (

          <div className="space-y-6">

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              <div className="bg-white border border-slate-200 rounded-2xl p-5">

                <h2 className="font-black text-slate-900 mb-4">
                  Diagnostic Findings
                </h2>

                <div className="space-y-4">

                  <InfoBox
                    label="Trauma Findings"
                    value={patient.radiologyReport?.traumaFindings}
                  />

                  <InfoBox
                    label="Impaction"
                    value={patient.radiologyReport?.impactionClass}
                  />

                  <InfoBox
                    label="Diagnosis"
                    value={patient.radiologyReport?.diagnosisNotes}
                  />

                  <InfoBox
                    label="Bone Status"
                    value={patient.radiologyReport?.boneStatus}
                  />

                </div>

              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5">

                <h2 className="font-black text-slate-900 mb-4">
                  OPG / Radiology
                </h2>

                {patient.opgScans?.length ? (

                  <div className="space-y-3">

                    {patient.opgScans.map(scan => (

                      <div
                        key={scan.id}
                        className="border border-slate-200 rounded-xl overflow-hidden"
                      >

                        <img
                          src={scan.url}
                          alt={scan.title}
                          className="w-full h-56 object-cover"
                        />

                        <div className="p-3">
                          <p className="font-bold text-sm">
                            {scan.title}
                          </p>

                          <p className="text-xs text-slate-400 mt-1">
                            {scan.date}
                          </p>
                        </div>

                      </div>

                    ))}

                  </div>

                ) : (
                  <EmptyState
                    icon={FileText}
                    text="No radiology studies"
                  />
                )}

              </div>

            </div>

            <Odontogram
              patient={patient}
              onUpdate={handleUpdatePatientRecord}
            />

          </div>

        )}

      </div>
    );
  };

  // ───────────────────────────────────────────────────────────────────────────
  // BILLING
  // ───────────────────────────────────────────────────────────────────────────

  const BillingView = () => {

    const totalOutstanding = invoices
      .filter(i => i.status !== 'Paid')
      .reduce((sum, i) => sum + Number(i.total || 0), 0);

    const insuranceExposure = invoices
      .filter(i => i.insurance)
      .reduce(
        (sum, i) =>
          sum + Number(i.insurance?.coverageAmt || 0),
        0
      );

    return (
      <div className="space-y-6">

        <PageHeader
          title="Billing & Insurance"
          subtitle="Invoices, payments and active claims"
          action={
            <button
              onClick={() => setShowInvoiceModal(true)}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Invoice
            </button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <StatCard
            title="Outstanding"
            value={formatCurrency(totalOutstanding)}
            icon={IndianRupee}
            color="amber"
          />

          <StatCard
            title="Insurance Exposure"
            value={formatCurrency(insuranceExposure)}
            icon={ShieldCheck}
            color="indigo"
          />

          <StatCard
            title="Invoices"
            value={invoices.length}
            icon={Receipt}
            color="blue"
          />

        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-slate-50 border-b border-slate-200">

                <tr>
                  <th className="px-5 py-3 text-xs font-black text-slate-500 text-left">
                    Invoice
                  </th>

                  <th className="px-5 py-3 text-xs font-black text-slate-500 text-left">
                    Patient
                  </th>

                  <th className="px-5 py-3 text-xs font-black text-slate-500 text-left">
                    Amount
                  </th>

                  <th className="px-5 py-3 text-xs font-black text-slate-500 text-left">
                    Insurance
                  </th>

                  <th className="px-5 py-3 text-xs font-black text-slate-500 text-left">
                    Status
                  </th>

                  <th className="px-5 py-3 text-xs font-black text-slate-500 text-left">
                    Action
                  </th>
                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {invoices.map(invoice => (

                  <tr key={invoice.id}>

                    <td className="px-5 py-4">
                      <p className="font-bold text-sm">
                        {invoice.customNo || invoice.id}
                      </p>

                      <p className="text-xs text-slate-400">
                        {invoice.date}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm">
                      {invoice.patient}
                    </td>

                    <td className="px-5 py-4 font-black">
                      {formatCurrency(invoice.total)}
                    </td>

                    <td className="px-5 py-4">

                      {invoice.insurance ? (
                        <div>
                          <p className="text-xs font-bold">
                            {invoice.insurance.provider}
                          </p>

                          <p className="text-xs text-emerald-600">
                            {formatCurrency(
                              invoice.insurance.coverageAmt
                            )}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Self Pay
                        </span>
                      )}

                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={invoice.status} />
                    </td>

                    <td className="px-5 py-4">

                      <div className="flex gap-2">

                        {invoice.status !== 'Paid' && (
                          <button
                            onClick={() => setSelectedInvoiceForUPI(invoice)}
                            className="px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold"
                          >
                            UPI
                          </button>
                        )}

                        {invoice.status !== 'Paid' && (
                          <button
                            onClick={() => markInvoicePaid(invoice)}
                            className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold"
                          >
                            Mark Paid
                          </button>
                        )}

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

      </div>
    );
  };

  // ───────────────────────────────────────────────────────────────────────────
  // INVENTORY VIEW
  // ───────────────────────────────────────────────────────────────────────────

  const StockInventoryView = () => {

    const filteredInventory = inventory.filter(item =>
      `${item.name} ${item.category} ${item.id}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );

    return (
      <div className="space-y-6">

        <PageHeader
          title="Stock Inventory"
          subtitle="Clinical consumables and medication inventory"
          action={
            <button
              onClick={() => setShowAddStockModal(true)}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Stock Item
            </button>
          }
        />

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">

          <div className="p-4 border-b border-slate-100">

            <div className="relative max-w-md">

              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search inventory..."
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm"
              />

            </div>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-slate-50 border-b">

                <tr>

                  <th className="px-5 py-3 text-xs font-black text-slate-500 text-left">
                    Item
                  </th>

                  <th className="px-5 py-3 text-xs font-black text-slate-500 text-left">
                    Category
                  </th>

                  <th className="px-5 py-3 text-xs font-black text-slate-500 text-left">
                    Quantity
                  </th>

                  <th className="px-5 py-3 text-xs font-black text-slate-500 text-left">
                    Minimum
                  </th>

                  <th className="px-5 py-3 text-xs font-black text-slate-500 text-left">
                    Status
                  </th>

                  <th className="px-5 py-3 text-xs font-black text-slate-500 text-left">
                    Update
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {filteredInventory.map(item => (

                  <tr key={item.id}>

                    <td className="px-5 py-4">

                      <p className="font-bold text-sm">
                        {item.name}
                      </p>

                      <p className="text-xs text-slate-400">
                        {item.id}
                      </p>

                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {item.category}
                    </td>

                    <td className="px-5 py-4 font-black">
                      {item.qty} {item.unit}
                    </td>

                    <td className="px-5 py-4 text-sm">
                      {item.min}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={item.status} />
                    </td>

                    <td className="px-5 py-4">

                      <div className="flex items-center gap-1">

                        <button
                          onClick={() =>
                            updateStockQuantity(item, -1)
                          }
                          className="w-8 h-8 rounded-lg border font-bold"
                        >
                          −
                        </button>

                        <button
                          onClick={() =>
                            updateStockQuantity(item, 1)
                          }
                          className="w-8 h-8 rounded-lg border font-bold"
                        >
                          +
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

      </div>
    );
  };

  // ───────────────────────────────────────────────────────────────────────────
  // STAFF VIEW
  // ───────────────────────────────────────────────────────────────────────────

  const StaffRolesView = () => {

    return (
      <div className="space-y-6">

        <PageHeader
          title="Staff & Roles"
          subtitle="Practice workforce and operational access"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

          {staffList.map(staff => (

            <div
              key={staff.id}
              className="bg-white border border-slate-200 rounded-2xl p-5"
            >

              <div className="flex items-start gap-4">

                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UserCheck className="w-6 h-6" />
                </div>

                <div className="flex-1 min-w-0">

                  <h3 className="font-black text-slate-900">
                    {staff.name}
                  </h3>

                  <p className="text-sm text-blue-600 font-semibold mt-1">
                    {staff.role}
                  </p>

                  <p className="text-xs text-slate-500 mt-3">
                    {staff.phone}
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    {staff.shift}
                  </p>

                </div>

              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">

                <span className="text-xs font-bold text-emerald-600">
                  {staff.status}
                </span>

                <span className="text-xs text-slate-400">
                  {staff.id}
                </span>

              </div>

            </div>

          ))}

        </div>

      </div>
    );
  };

  // ───────────────────────────────────────────────────────────────────────────
  // PRACTICE SETTINGS
  // ───────────────────────────────────────────────────────────────────────────

  const PracticeSettingsView = () => {

    const [form, setForm] = useState(clinicProfile);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
      setForm(clinicProfile);
    }, [clinicProfile]);

    const update = (field, value) => {
      setForm(prev => ({
        ...prev,
        [field]: value
      }));
    };

    const save = async () => {
      setSaving(true);

      try {
        await handleSaveClinicProfile(form);
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="space-y-6">

        <PageHeader
          title="Practice Settings"
          subtitle="Clinic profile, registration and settlement configuration"
        />

        <div className="bg-white border border-slate-200 rounded-2xl p-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <FormField
              label="Clinic Name"
              value={form.clinicName}
              onChange={v => update('clinicName', v)}
            />

            <FormField
              label="Tagline"
              value={form.tagline}
              onChange={v => update('tagline', v)}
            />

            <FormField
              label="Dental License / Registration No."
              value={form.licenseNo}
              onChange={v => update('licenseNo', v)}
            />

            <FormField
              label="GSTIN"
              value={form.gstin}
              onChange={v => update('gstin', v)}
            />

            <FormField
              label="Contact Email"
              type="email"
              value={form.contactEmail}
              onChange={v => update('contactEmail', v)}
            />

            <FormField
              label="Contact Phone"
              value={form.contactPhone}
              onChange={v => update('contactPhone', v)}
            />

            <FormField
              label="UPI ID"
              value={form.upiId}
              onChange={v => update('upiId', v)}
            />

            <FormField
              label="Consultation Fee"
              type="number"
              value={form.consultationFee}
              onChange={v => update('consultationFee', Number(v))}
            />

            <div className="md:col-span-2">

              <label className="block text-xs font-black text-slate-500 mb-2">
                Clinic Address
              </label>

              <textarea
                value={form.address || ''}
                onChange={e => update('address', e.target.value)}
                rows={3}
                className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />

            </div>

            <div className="md:col-span-2">

              <label className="block text-xs font-black text-slate-500 mb-2">
                Operating Hours
              </label>

              <input
                value={form.operatingHours || ''}
                onChange={e =>
                  update('operatingHours', e.target.value)
                }
                className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm"
              />

            </div>

          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 flex justify-end">

            <button
              onClick={save}
              disabled={saving}
              className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Practice Profile'}
            </button>

          </div>

        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">

          <div className="flex gap-3">

            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />

            <div>

              <h3 className="font-black text-blue-900">
                Tenant isolation
              </h3>

              <p className="text-sm text-blue-800 mt-1">
                Practice data is scoped to the authenticated clinic workspace.
                Firestore security rules must enforce the same tenant boundary
                before production deployment.
              </p>

            </div>

          </div>

        </div>

      </div>
    );
  };

  // ───────────────────────────────────────────────────────────────────────────
  // MAIN CONTENT
  // ───────────────────────────────────────────────────────────────────────────

  const renderActiveView = () => {

    switch (activeTab) {

      case 'dashboard':
        return <DashboardView />;

      case 'appointments':
        return <AppointmentsView />;

      case 'patients':
        return <PatientsView />;

      case 'radiology':
        return <RadiologyDiagnosisView />;

      case 'billing':
        return <BillingView />;

      case 'inventory':
        return <StockInventoryView />;

      case 'staff':
        return <StaffRolesView />;

      case 'settings':
        return <PracticeSettingsView />;

      default:
        return <DashboardView />;
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // APPLICATION SHELL
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans">

      {/* Mobile Overlay */}

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}

      <aside
        className={`
          fixed
          z-40
          top-0
          left-0
          bottom-0
          w-72
          bg-[#0f172a]
          text-white
          transition-transform
          duration-300
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >

        <div className="h-full flex flex-col">

          <div className="p-5 border-b border-slate-800">

            <div className="flex items-center gap-3">

              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center">
                <Stethoscope className="w-6 h-6" />
              </div>

              <div className="min-w-0">

                <h1 className="font-black truncate">
                  Meridian Dental
                </h1>

                <p className="text-[10px] uppercase tracking-widest text-slate-400">
                  Clinical OS
                </p>

              </div>

              <button
                onClick={() => setSidebarOpen(false)}
                className="ml-auto lg:hidden text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>

            </div>

          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">

            {navigation.map(item => {

              const Icon = item.icon;
              const active = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                    setSearchQuery('');
                  }}
                  className={`
                    w-full
                    flex
                    items-center
                    gap-3
                    px-3
                    py-3
                    rounded-xl
                    text-sm
                    font-semibold
                    transition
                    ${
                      active
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }
                  `}
                >

                  <Icon className="w-5 h-5 shrink-0" />

                  <span>{item.label}</span>

                </button>
              );
            })}

          </nav>

          <div className="p-4 border-t border-slate-800">

            <div className="bg-slate-800/60 rounded-xl p-3 mb-3">

              <p className="text-xs font-bold text-white truncate">
                {currentUser?.displayName || 'Authenticated Clinician'}
              </p>

              <p className="text-[11px] text-slate-400 truncate mt-1">
                {currentUser?.email || ''}
              </p>

            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-slate-300 hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>

          </div>

        </div>

      </aside>

      {/* Main */}

      <div className="lg:pl-72 min-h-screen">

        {/* Top Bar */}

        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200">

          <div className="h-16 px-4 sm:px-6 flex items-center justify-between">

            <div className="flex items-center gap-3">

              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="hidden sm:block">

                <p className="text-xs text-slate-400">
                  Practice
                </p>

                <p className="text-sm font-black text-slate-800">
                  {clinicProfile.clinicName}
                </p>

              </div>

            </div>

            <div className="flex items-center gap-3">

              <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">

                <span className="w-2 h-2 rounded-full bg-emerald-500" />

                Secure Workspace

              </div>

              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm">

                {(
                  currentUser?.displayName ||
                  currentUser?.email ||
                  'C'
                )
                  .charAt(0)
                  .toUpperCase()}

              </div>

            </div>

          </div>

        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">

          {renderActiveView()}

        </main>

      </div>

      {/* Modals */}

      {showAppointmentModal && (
        <NewAppointmentModal
          patients={patients}
          staff={staffList}
          selectedDate={formattedSelectedDate}
          consultationFee={clinicProfile.consultationFee}
          onClose={() => setShowAppointmentModal(false)}
          onSave={handleCreateAppointment}
        />
      )}

      {showPatientModal && (
        <NewPatientModal
          onClose={() => setShowPatientModal(false)}
          onSave={handleCreatePatient}
        />
      )}

      {showInvoiceModal && (
        <CreateInsuranceInvoiceModal
          patients={patients}
          onClose={() => setShowInvoiceModal(false)}
          onSave={handleCreateInvoice}
        />
      )}

      {showAddStockModal && (
        <AddStockItemModal
          onClose={() => setShowAddStockModal(false)}
          onSave={handleAddStock}
        />
      )}

      {selectedPatientForDetails && (
        <PatientDetailsModal
          patient={selectedPatientForDetails}
          onClose={() => setSelectedPatientForDetails(null)}
          onSave={handleUpdatePatientRecord}
          onDelete={handleDeletePatient}
        />
      )}

      {selectedInvoiceForUPI && (
        <UPIPaymentModal
          invoice={selectedInvoiceForUPI}
          clinicProfile={clinicProfile}
          onClose={() => setSelectedInvoiceForUPI(null)}
          onPaid={() => {
            markInvoicePaid(selectedInvoiceForUPI);
            setSelectedInvoiceForUPI(null);
          }}
        />
      )}

    </div>
  );
}


// ═════════════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═════════════════════════════════════════════════════════════════════════════

function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          {title}
        </h1>

        {subtitle && (
          <p className="text-sm text-slate-500 mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {action}

    </div>
  );
}


function StatCard({ title, value, icon: Icon, color = 'blue' }) {

  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600'
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-xs font-bold text-slate-500">
            {title}
          </p>

          <p className="text-2xl font-black text-slate-900 mt-2">
            {value}
          </p>

        </div>

        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}
        >
          <Icon className="w-5 h-5" />
        </div>

      </div>

    </div>
  );
}


function StatusBadge({ status }) {

  const styles = {
    scheduled: 'bg-blue-50 text-blue-700',
    in_progress: 'bg-amber-50 text-amber-700',
    completed: 'bg-emerald-50 text-emerald-700',
    Paid: 'bg-emerald-50 text-emerald-700',
    Unpaid: 'bg-red-50 text-red-700',
    'Low Stock': 'bg-amber-50 text-amber-700',
    'In Stock': 'bg-emerald-50 text-emerald-700'
  };

  return (
    <span
      className={`
        inline-flex
        items-center
        px-2.5
        py-1
        rounded-full
        text-[11px]
        font-black
        ${styles[status] || 'bg-slate-100 text-slate-600'}
      `}
    >
      {String(status || '').replace('_', ' ')}
    </span>
  );
}


function EmptyState({ icon: Icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">

      <Icon className="w-8 h-8 text-slate-300 mb-2" />

      <p className="text-sm text-slate-400">
        {text}
      </p>

    </div>
  );
}


function EmptyPanel({ icon: Icon, title, description }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">

      <div className="w-12 h-12 rounded-xl bg-slate-100 mx-auto flex items-center justify-center">

        <Icon className="w-6 h-6 text-slate-400" />

      </div>

      <h3 className="font-black text-slate-800 mt-4">
        {title}
      </h3>

      <p className="text-sm text-slate-500 mt-1">
        {description}
      </p>

    </div>
  );
}


function InfoBox({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-xl p-4">

      <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="text-sm text-slate-700 mt-2 leading-relaxed">
        {value || 'No information recorded'}
      </p>

    </div>
  );
}


function FormField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder
}) {
  return (
    <div>

      <label className="block text-xs font-black text-slate-500 mb-2">
        {label}
      </label>

      <input
        type={type}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
      />

    </div>
  );
}


// ═════════════════════════════════════════════════════════════════════════════
// NEW APPOINTMENT MODAL
// ═════════════════════════════════════════════════════════════════════════════

function NewAppointmentModal({
  patients,
  staff,
  selectedDate,
  onClose,
  onSave
}) {

  const [form, setForm] = useState({
    date: selectedDate,
    time: '09:00 AM - 09:30 AM',
    duration: '30 min',
    patient: patients[0]?.name || '',
    procedure: '',
    doctor: staff.find(s =>
      s.role?.toLowerCase().includes('surgeon')
    )?.name || staff[0]?.name || ''
  });

  const submit = e => {
    e.preventDefault();

    if (!form.patient || !form.procedure || !form.doctor) {
      alert('Please complete all required fields.');
      return;
    }

    onSave({
      ...form,
      status: 'scheduled'
    });
  };

  return (
    <ModalShell
      title="New Appointment"
      subtitle="Create a clinical appointment"
      onClose={onClose}
    >

      <form onSubmit={submit} className="space-y-4">

        <FormField
          label="Date"
          type="date"
          value={form.date}
          onChange={v =>
            setForm({ ...form, date: v })
          }
        />

        <div className="grid grid-cols-2 gap-3">

          <FormField
            label="Time"
            value={form.time}
            onChange={v =>
              setForm({ ...form, time: v })
            }
          />

          <FormField
            label="Duration"
            value={form.duration}
            onChange={v =>
              setForm({ ...form, duration: v })
            }
          />

        </div>

        <SelectField
          label="Patient"
          value={form.patient}
          onChange={v =>
            setForm({ ...form, patient: v })
          }
          options={patients.map(p => p.name)}
        />

        <FormField
          label="Procedure"
          placeholder="e.g. Root Canal Treatment"
          value={form.procedure}
          onChange={v =>
            setForm({ ...form, procedure: v })
          }
        />

        <SelectField
          label="Doctor"
          value={form.doctor}
          onChange={v =>
            setForm({ ...form, doctor: v })
          }
          options={staff.map(s => s.name)}
        />

        <ModalActions
          onClose={onClose}
          submitLabel="Create Appointment"
        />

      </form>

    </ModalShell>
  );
}


// ═════════════════════════════════════════════════════════════════════════════
// NEW PATIENT MODAL
// ═════════════════════════════════════════════════════════════════════════════

function NewPatientModal({ onClose, onSave }) {

  const [form, setForm] = useState({
    name: '',
    customId: `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
    phone: '',
    registeredDate: new Date().toLocaleDateString('en-IN'),
    medicalHistory: {
      conditions: '',
      allergies: ''
    },
    radiologyReport: {
      traumaFindings: '',
      impactionClass: '',
      diagnosisNotes: '',
      boneStatus: ''
    },
    opgScans: [],
    odontogram: {},
    prescriptions: []
  });

  const submit = e => {
    e.preventDefault();

    if (!form.name.trim() || !form.phone.trim()) {
      alert('Patient name and phone number are required.');
      return;
    }

    onSave(form);
  };

  return (
    <ModalShell
      title="Register New Patient"
      subtitle="Create a new clinical record"
      onClose={onClose}
      wide
    >

      <form onSubmit={submit} className="space-y-5">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <FormField
            label="Patient Name *"
            value={form.name}
            onChange={v =>
              setForm({ ...form, name: v })
            }
          />

          <FormField
            label="Patient ID"
            value={form.customId}
            onChange={v =>
              setForm({ ...form, customId: v })
            }
          />

          <FormField
            label="Phone *"
            value={form.phone}
            onChange={v =>
              setForm({ ...form, phone: v })
            }
          />

        </div>

        <div className="border-t pt-5">

          <h3 className="font-black text-slate-800 mb-4">
            Medical History
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <FormField
              label="Medical Conditions"
              value={form.medicalHistory.conditions}
              onChange={v =>
                setForm({
                  ...form,
                  medicalHistory: {
                    ...form.medicalHistory,
                    conditions: v
                  }
                })
              }
            />

            <FormField
              label="Allergies"
              value={form.medicalHistory.allergies}
              onChange={v =>
                setForm({
                  ...form,
                  medicalHistory: {
                    ...form.medicalHistory,
                    allergies: v
                  }
                })
              }
            />

          </div>

        </div>

        <ModalActions
          onClose={onClose}
          submitLabel="Register Patient"
        />

      </form>

    </ModalShell>
  );
}


// ═════════════════════════════════════════════════════════════════════════════
// CREATE INVOICE MODAL
// ═════════════════════════════════════════════════════════════════════════════

function CreateInsuranceInvoiceModal({
  patients,
  onClose,
  onSave
}) {

  const [form, setForm] = useState({
    patient: patients[0]?.name || '',
    itemName: '',
    amount: '',
    insuranceProvider: '',
    policyNo: '',
    coverageAmt: ''
  });

  const submit = e => {
    e.preventDefault();

    const amount = Number(form.amount);

    if (!form.patient || !form.itemName || !amount) {
      alert('Patient, service and amount are required.');
      return;
    }

    const invoice = {
      customNo: `INV-${new Date().getFullYear()}-${Date.now()
        .toString()
        .slice(-5)}`,
      patient: form.patient,
      date: new Date().toLocaleDateString('en-IN'),
      dueDate: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toLocaleDateString('en-IN'),
      items: [
        {
          id: 1,
          name: form.itemName,
          qty: 1,
          rate: amount
        }
      ],
      total: amount,
      status: 'Unpaid',
      insurance: form.insuranceProvider
        ? {
            provider: form.insuranceProvider,
            policyNo: form.policyNo,
            claimId: `CLM-${Date.now()}`,
            coverageAmt: Number(form.coverageAmt) || 0,
            claimStatus: 'Pre-Auth Pending'
          }
        : null
    };

    onSave(invoice);
  };

  return (
    <ModalShell
      title="Create Invoice"
      subtitle="Generate patient or insurance invoice"
      onClose={onClose}
    >

      <form onSubmit={submit} className="space-y-4">

        <SelectField
          label="Patient"
          value={form.patient}
          onChange={v =>
            setForm({ ...form, patient: v })
          }
          options={patients.map(p => p.name)}
        />

        <FormField
          label="Service / Procedure"
          value={form.itemName}
          onChange={v =>
            setForm({ ...form, itemName: v })
          }
        />

        <FormField
          label="Invoice Amount"
          type="number"
          value={form.amount}
          onChange={v =>
            setForm({ ...form, amount: v })
          }
        />

        <div className="border-t pt-4">

          <p className="text-xs font-black uppercase tracking-wide text-slate-400 mb-3">
            Insurance — Optional
          </p>

          <div className="space-y-3">

            <FormField
              label="Insurance Provider"
              value={form.insuranceProvider}
              onChange={v =>
                setForm({
                  ...form,
                  insuranceProvider: v
                })
              }
            />

            <FormField
              label="Policy Number"
              value={form.policyNo}
              onChange={v =>
                setForm({
                  ...form,
                  policyNo: v
                })
              }
            />

            <FormField
              label="Expected Coverage"
              type="number"
              value={form.coverageAmt}
              onChange={v =>
                setForm({
                  ...form,
                  coverageAmt: v
                })
              }
            />

          </div>

        </div>

        <ModalActions
          onClose={onClose}
          submitLabel="Create Invoice"
        />

      </form>

    </ModalShell>
  );
}


// ═════════════════════════════════════════════════════════════════════════════
// ADD STOCK MODAL
// ═════════════════════════════════════════════════════════════════════════════

function AddStockItemModal({ onClose, onSave }) {

  const [form, setForm] = useState({
    name: '',
    category: 'Materials',
    qty: '',
    min: '',
    unit: 'Units'
  });

  const submit = e => {
    e.preventDefault();

    if (!form.name || form.qty === '' || form.min === '') {
      alert('Item name, quantity and minimum level are required.');
      return;
    }

    onSave({
      ...form,
      qty: Number(form.qty),
      min: Number(form.min)
    });
  };

  return (
    <ModalShell
      title="Add Stock Item"
      subtitle="Create an inventory record"
      onClose={onClose}
    >

      <form onSubmit={submit} className="space-y-4">

        <FormField
          label="Item Name"
          value={form.name}
          onChange={v =>
            setForm({ ...form, name: v })
          }
        />

        <SelectField
          label="Category"
          value={form.category}
          onChange={v =>
            setForm({ ...form, category: v })
          }
          options={[
            'Restorative',
            'Surgical',
            'Materials',
            'Medications',
            'Prosthodontics',
            'Orthodontics',
            'Other'
          ]}
        />

        <div className="grid grid-cols-3 gap-3">

          <FormField
            label="Quantity"
            type="number"
            value={form.qty}
            onChange={v =>
              setForm({ ...form, qty: v })
            }
          />

          <FormField
            label="Minimum"
            type="number"
            value={form.min}
            onChange={v =>
              setForm({ ...form, min: v })
            }
          />

          <FormField
            label="Unit"
            value={form.unit}
            onChange={v =>
              setForm({ ...form, unit: v })
            }
          />

        </div>

        <ModalActions
          onClose={onClose}
          submitLabel="Add Inventory Item"
        />

      </form>

    </ModalShell>
  );
}


// ═════════════════════════════════════════════════════════════════════════════
// PATIENT DETAILS MODAL
// ═════════════════════════════════════════════════════════════════════════════

function PatientDetailsModal({
  patient,
  onClose,
  onSave,
  onDelete
}) {

  const [form, setForm] = useState(patient);

  const updateHistory = (field, value) => {
    setForm(prev => ({
      ...prev,
      medicalHistory: {
        ...(prev.medicalHistory || {}),
        [field]: value
      }
    }));
  };

  const updateDiagnosis = (field, value) => {
    setForm(prev => ({
      ...prev,
      radiologyReport: {
        ...(prev.radiologyReport || {}),
        [field]: value
      }
    }));
  };

  return (
    <ModalShell
      title={patient.name}
      subtitle={`${patient.customId || patient.id} • Clinical Chart`}
      onClose={onClose}
      wide
    >

      <div className="space-y-6">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <InfoBox
            label="Phone"
            value={patient.phone}
          />

          <InfoBox
            label="Registered"
            value={patient.registeredDate}
          />

          <InfoBox
            label="Patient ID"
            value={patient.customId || patient.id}
          />

        </div>

        <div>

          <h3 className="font-black mb-3">
            Medical History
          </h3>

          <div className="grid md:grid-cols-2 gap-4">

            <FormField
              label="Conditions"
              value={
                form.medicalHistory?.conditions || ''
              }
              onChange={v =>
                updateHistory('conditions', v)
              }
            />

            <FormField
              label="Allergies"
              value={
                form.medicalHistory?.allergies || ''
              }
              onChange={v =>
                updateHistory('allergies', v)
              }
            />

          </div>

        </div>

        <div>

          <h3 className="font-black mb-3">
            Diagnosis
          </h3>

          <div className="space-y-3">

            <FormField
              label="Diagnosis Notes"
              value={
                form.radiologyReport?.diagnosisNotes || ''
              }
              onChange={v =>
                updateDiagnosis('diagnosisNotes', v)
              }
            />

            <FormField
              label="Trauma Findings"
              value={
                form.radiologyReport?.traumaFindings || ''
              }
              onChange={v =>
                updateDiagnosis('traumaFindings', v)
              }
            />

            <FormField
              label="Bone Status"
              value={
                form.radiologyReport?.boneStatus || ''
              }
              onChange={v =>
                updateDiagnosis('boneStatus', v)
              }
            />

          </div>

        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-3 pt-5 border-t">

          <button
            type="button"
            onClick={() =>
              onDelete(patient.id, patient.name)
            }
            className="px-4 py-3 rounded-xl bg-red-50 text-red-700 font-bold text-sm flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Clinical Chart
          </button>

          <div className="flex gap-2">

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-xl border font-bold text-sm"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => onSave(form)}
              className="px-4 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Clinical Record
            </button>

          </div>

        </div>

      </div>

    </ModalShell>
  );
}


// ═════════════════════════════════════════════════════════════════════════════
// UPI PAYMENT MODAL
// ═════════════════════════════════════════════════════════════════════════════

function UPIPaymentModal({
  invoice,
  clinicProfile,
  onClose,
  onPaid
}) {

  const amount = Number(invoice.total || 0);
  const upiId = clinicProfile.upiId || '';

  const upiPayload =
    `upi://pay?pa=${encodeURIComponent(upiId)}` +
    `&pn=${encodeURIComponent(clinicProfile.clinicName || '')}` +
    `&am=${encodeURIComponent(amount.toFixed(2))}` +
    `&cu=INR` +
    `&tn=${encodeURIComponent(
      invoice.customNo || invoice.id
    )}`;

  const qrUrl =
    `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      upiPayload
    )}`;

  return (
    <ModalShell
      title="UPI Payment"
      subtitle={`Invoice ${invoice.customNo || invoice.id}`}
      onClose={onClose}
    >

      <div className="text-center">

        <div className="inline-flex p-4 bg-white border border-slate-200 rounded-2xl">

          <img
            src={qrUrl}
            alt="UPI payment QR"
            className="w-56 h-56"
          />

        </div>

        <p className="text-3xl font-black mt-5">
          {formatCurrency(amount)}
        </p>

        <p className="text-sm text-slate-500 mt-1">
          Scan with a UPI application
        </p>

        <div className="mt-5 p-3 bg-slate-50 rounded-xl text-left">

          <p className="text-[11px] font-black uppercase text-slate-400">
            UPI ID
          </p>

          <p className="font-bold text-sm mt-1">
            {upiId || 'Not configured'}
          </p>

        </div>

        <div className="flex gap-2 mt-5">

          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border rounded-xl font-bold text-sm"
          >
            Close
          </button>

          <button
            onClick={onPaid}
            className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Confirm Payment
          </button>

        </div>

      </div>

    </ModalShell>
  );
}


// ═════════════════════════════════════════════════════════════════════════════
// ODONTOGRAM
// ═════════════════════════════════════════════════════════════════════════════

function Odontogram({ patient, onUpdate }) {

  const [condition, setCondition] = useState('healthy');

  const currentChart = patient.odontogram || {};

  const updateTooth = tooth => {

    const nextChart = {
      ...currentChart,
      [tooth]: condition
    };

    onUpdate({
      ...patient,
      odontogram: nextChart
    });
  };

  const renderTooth = tooth => {

    const current = currentChart[tooth] || 'healthy';
    const data = TOOTH_CONDITIONS[current];

    return (
      <button
        key={tooth}
        onClick={() => updateTooth(tooth)}
        title={`${tooth}: ${data.label}`}
        className={`
          min-w-[44px]
          h-14
          rounded-lg
          border-2
          flex
          flex-col
          items-center
          justify-center
          transition
          hover:scale-105
          ${data.bg}
        `}
      >

        <span className="text-[11px] font-black">
          {tooth}
        </span>

        <span className="text-[8px] font-bold mt-1">
          {data.short}
        </span>

      </button>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

        <div>

          <h2 className="font-black text-slate-900">
            FDI Odontogram
          </h2>

          <p className="text-xs text-slate-500 mt-1">
            Select a clinical status and click a tooth to update the chart.
          </p>

        </div>

        <select
          value={condition}
          onChange={e => setCondition(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold"
        >

          {Object.entries(TOOTH_CONDITIONS).map(
            ([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            )
          )}

        </select>

      </div>

      <div className="mt-6 overflow-x-auto pb-3">

        <div className="min-w-[850px] space-y-3">

          <div className="flex gap-2 justify-center">
            {FDI_TEETH.upper.map(renderTooth)}
          </div>

          <div className="border-t border-dashed border-slate-200" />

          <div className="flex gap-2 justify-center">
            {FDI_TEETH.lower.map(renderTooth)}
          </div>

        </div>

      </div>

      <div className="mt-5 flex flex-wrap gap-2">

        {Object.entries(TOOTH_CONDITIONS)
          .slice(0, 8)
          .map(([key, value]) => (

            <button
              key={key}
              onClick={() => setCondition(key)}
              className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-bold ${value.bg}`}
            >
              {value.label}
            </button>

          ))}

      </div>

    </div>
  );
}


// ═════════════════════════════════════════════════════════════════════════════
// MODAL SHELL
// ═════════════════════════════════════════════════════════════════════════════

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  wide = false
}) {

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className={`
          relative
          w-full
          ${wide ? 'max-w-4xl' : 'max-w-xl'}
          max-h-[92vh]
          overflow-y-auto
          bg-white
          rounded-2xl
          shadow-2xl
        `}
      >

        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-start justify-between z-10">

          <div>

            <h2 className="font-black text-lg text-slate-900">
              {title}
            </h2>

            {subtitle && (
              <p className="text-xs text-slate-500 mt-1">
                {subtitle}
              </p>
            )}

          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>

        </div>

        <div className="p-5">
          {children}
        </div>

      </div>

    </div>
  );
}


// ═════════════════════════════════════════════════════════════════════════════
// MODAL ACTIONS
// ═════════════════════════════════════════════════════════════════════════════

function ModalActions({
  onClose,
  submitLabel
}) {

  return (
    <div className="flex justify-end gap-2 pt-5 border-t">

      <button
        type="button"
        onClick={onClose}
        className="px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold"
      >
        Cancel
      </button>

      <button
        type="submit"
        className="px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold"
      >
        {submitLabel}
      </button>

    </div>
  );
}


// ═════════════════════════════════════════════════════════════════════════════
// SELECT FIELD
// ═════════════════════════════════════════════════════════════════════════════

function SelectField({
  label,
  value,
  onChange,
  options
}) {

  return (
    <div>

      <label className="block text-xs font-black text-slate-500 mb-2">
        {label}
      </label>

      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
      >

        <option value="">
          Select...
        </option>

        {options.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}

      </select>

    </div>
  );
}// ==============================
// CONTINUATION OF src/App.jsx
// ==============================

          </button>

          <div className="pt-2 border-t border-slate-700/50">
            <p className="text-[11px] text-slate-500">
              Authorized clinical personnel only
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40
          w-64 bg-slate-950 text-white
          transform transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
          flex flex-col
        `}
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="font-black text-lg tracking-tight">
              Meridian Dental
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest">
              Clinical OS
            </div>
          </div>

          <button
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-3 py-4 flex-1 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 px-3 mb-2">
            Workspace
          </div>

          <SidebarButton
            icon={<LayoutDashboard size={18} />}
            label="Dashboard"
            active={activeTab === "dashboard"}
            onClick={() => {
              setActiveTab("dashboard");
              setSidebarOpen(false);
            }}
          />

          <SidebarButton
            icon={<CalendarIcon size={18} />}
            label="Appointments"
            active={activeTab === "appointments"}
            onClick={() => {
              setActiveTab("appointments");
              setSidebarOpen(false);
            }}
          />

          <SidebarButton
            icon={<Users size={18} />}
            label="Patients"
            active={activeTab === "patients"}
            onClick={() => {
              setActiveTab("patients");
              setSidebarOpen(false);
            }}
          />

          <SidebarButton
            icon={<Stethoscope size={18} />}
            label="Clinical & Radiology"
            active={activeTab === "clinical"}
            onClick={() => {
              setActiveTab("clinical");
              setSidebarOpen(false);
            }}
          />

          <SidebarButton
            icon={<Receipt size={18} />}
            label="Billing & Insurance"
            active={activeTab === "billing"}
            onClick={() => {
              setActiveTab("billing");
              setSidebarOpen(false);
            }}
          />

          <div className="text-[10px] uppercase tracking-widest text-slate-500 px-3 mb-2 mt-6">
            Operations
          </div>

          <SidebarButton
            icon={<Package size={18} />}
            label="Inventory"
            active={activeTab === "inventory"}
            onClick={() => {
              setActiveTab("inventory");
              setSidebarOpen(false);
            }}
            badge={stats.lowStockCount > 0 ? stats.lowStockCount : null}
          />

          <SidebarButton
            icon={<Briefcase size={18} />}
            label="Staff & Roles"
            active={activeTab === "staff"}
            onClick={() => {
              setActiveTab("staff");
              setSidebarOpen(false);
            }}
          />

          <SidebarButton
            icon={<Building size={18} />}
            label="Practice Settings"
            active={activeTab === "settings"}
            onClick={() => {
              setActiveTab("settings");
              setSidebarOpen(false);
            }}
          />
        </div>

        <div className="p-3 border-t border-slate-800">
          <div className="bg-slate-900 rounded-xl p-3 mb-2">
            <div className="text-xs font-bold truncate">
              {currentUser.displayName || "Clinical User"}
            </div>
            <div className="text-[10px] text-slate-500 truncate">
              {currentUser.email || ""}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut size={17} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="lg:ml-64 min-h-screen">

        {/* HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 flex items-center px-4 sm:px-6 gap-4">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={21} />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-sm sm:text-base truncate">
              {getPageTitle(activeTab)}
            </h1>
            <p className="hidden sm:block text-[11px] text-slate-500">
              {clinicProfile.clinicName}
            </p>
          </div>

          <div className="relative hidden md:block w-56 lg:w-72">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patients..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 border border-transparent focus:bg-white focus:border-blue-300 focus:outline-none text-sm"
            />
          </div>

          <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
            {(currentUser.displayName || "U")
              .charAt(0)
              .toUpperCase()}
          </div>
        </header>

        {/* CONTENT */}
        <main className="p-4 sm:p-6 max-w-[1600px] mx-auto">

          {activeTab === "dashboard" && (
            <DashboardView
              stats={stats}
              appointments={appointments}
              invoices={invoices}
              inventory={inventory}
              weeklyChartData={weeklyChartData}
              onAppointment={() => setShowAppointmentModal(true)}
              onPatient={() => setShowPatientModal(true)}
              onBilling={() => setShowInvoiceModal(true)}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === "appointments" && (
            <AppointmentsView
              appointments={appointments}
              selectedDate={selectedDate}
              dailyAppointments={dailyAppointments}
              onDateShift={handleDateShift}
              onAdd={() => setShowAppointmentModal(true)}
              onStatusChange={cycleAppointmentStatus}
            />
          )}

          {activeTab === "patients" && (
            <PatientsView
              patients={patients}
              searchQuery={searchQuery}
              onAdd={() => setShowPatientModal(true)}
              onOpen={(patient) => setSelectedPatientForDetails(patient)}
              onDelete={handleDeletePatient}
            />
          )}

          {activeTab === "clinical" && (
            <RadiologyDiagnosisView
              patients={patients}
              onOpenPatient={(patient) => setSelectedPatientForDetails(patient)}
            />
          )}

          {activeTab === "billing" && (
            <BillingView
              invoices={invoices}
              onCreate={() => setShowInvoiceModal(true)}
              onUPI={(invoice) => setSelectedInvoiceForUPI(invoice)}
            />
          )}

          {activeTab === "inventory" && (
            <StockInventoryView
              inventory={inventory}
              setInventory={setInventory}
              onAdd={() => setShowAddStockModal(true)}
              currentUser={currentUser}
            />
          )}

          {activeTab === "staff" && (
            <StaffRolesView
              staffList={staffList}
              setStaffList={setStaffList}
            />
          )}

          {activeTab === "settings" && (
            <PracticeSettingsView
              profile={clinicProfile}
              onSave={handleSaveClinicProfile}
            />
          )}

        </main>
      </div>

      {/* MODALS */}

      {showAppointmentModal && (
        <NewAppointmentModal
          patients={patients}
          staffList={staffList}
          currentUser={currentUser}
          onClose={() => setShowAppointmentModal(false)}
          onCreate={(appointment) => {
            setAppointments(prev => [appointment, ...prev]);
            setShowAppointmentModal(false);
          }}
        />
      )}

      {showPatientModal && (
        <NewPatientModal
          currentUser={currentUser}
          onClose={() => setShowPatientModal(false)}
          onCreate={(patient) => {
            setPatients(prev => [patient, ...prev]);
            setShowPatientModal(false);
          }}
        />
      )}

      {showInvoiceModal && (
        <CreateInsuranceInvoiceModal
          patients={patients}
          onClose={() => setShowInvoiceModal(false)}
          onCreate={(invoice) => {
            setInvoices(prev => [invoice, ...prev]);
            setShowInvoiceModal(false);
          }}
        />
      )}

      {selectedInvoiceForUPI && (
        <UPIPaymentModal
          invoice={selectedInvoiceForUPI}
          profile={clinicProfile}
          onClose={() => setSelectedInvoiceForUPI(null)}
          onPaid={(invoiceId) => {
            setInvoices(prev =>
              prev.map(invoice =>
                invoice.id === invoiceId
                  ? {
                      ...invoice,
                      status: "Paid",
                      paidAt: new Date().toISOString()
                    }
                  : invoice
              )
            );
            setSelectedInvoiceForUPI(null);
          }}
          currentUser={currentUser}
        />
      )}

      {showAddStockModal && (
        <AddStockItemModal
          onClose={() => setShowAddStockModal(false)}
          onCreate={(item) => {
            setInventory(prev => [item, ...prev]);
            setShowAddStockModal(false);
          }}
        />
      )}

      {selectedPatientForDetails && (
        <PatientDetailsModal
          patient={selectedPatientForDetails}
          onClose={() => setSelectedPatientForDetails(null)}
          onSave={handleUpdatePatientRecord}
          onDelete={handleDeletePatient}
        />
      )}

    </div>
  );
}


/* =========================================================
   GENERIC COMPONENTS
========================================================= */

function SidebarButton({
  icon,
  label,
  active,
  onClick,
  badge
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1
        text-sm transition
        ${
          active
            ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
            : "text-slate-400 hover:text-white hover:bg-slate-900"
        }
      `}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>

      {badge && (
        <span className="min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
          {badge}
        </span>
      )}
    </button>
  );
}

function getPageTitle(tab) {
  const titles = {
    dashboard: "Clinical Dashboard",
    appointments: "Appointments",
    patients: "Patient Registry",
    clinical: "Clinical & Radiology",
    billing: "Billing & Insurance",
    inventory: "Stock Inventory",
    staff: "Staff & Roles",
    settings: "Practice Settings"
  };

  return titles[tab] || "Dental OS";
}

function StatCard({
  label,
  value,
  icon,
  color = "blue",
  subtitle
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600"
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">
            {label}
          </p>

          <div className="text-2xl font-black mt-2">
            {value}
          </div>

          {subtitle && (
            <div className="text-[11px] text-slate-400 mt-1">
              {subtitle}
            </div>
          )}
        </div>

        <div className={`p-3 rounded-xl ${colors[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  action
}) {
  return (
    <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center">
      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
        {icon}
      </div>

      <h3 className="font-bold mt-4">
        {title}
      </h3>

      <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
        {description}
      </p>

      {action && (
        <div className="mt-5">
          {action}
        </div>
      )}
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  icon,
  type = "button",
  disabled = false
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {icon}
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  onClick,
  icon,
  type = "button"
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold"
    >
      {icon}
      {children}
    </button>
  );
}

function ModalShell({
  title,
  subtitle,
  children,
  onClose,
  width = "max-w-2xl"
}) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div
        className={`w-full ${width} bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-h-[92vh] overflow-hidden flex flex-col`}
      >
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="font-black text-lg">
              {title}
            </h2>

            {subtitle && (
              <p className="text-xs text-slate-500 mt-1">
                {subtitle}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"
          >
            <X size={19} />
          </button>
        </div>

        <div className="overflow-y-auto p-5 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}


/* =========================================================
   DASHBOARD
========================================================= */

function DashboardView({
  stats,
  appointments,
  invoices,
  inventory,
  weeklyChartData,
  onAppointment,
  onPatient,
  onBilling,
  onNavigate
}) {
  const todayKey = formatDateKey(new Date());

  const todayAppointments = appointments
    .filter(a => a.date === todayKey)
    .slice(0, 5);

  const outstanding = invoices
    .filter(i => i.status !== "Paid")
    .reduce((sum, i) => sum + Number(i.total || 0), 0);

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black">
            Good day, Clinical Team
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            {getDisplayDate(new Date())}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <PrimaryButton
            icon={<Plus size={16} />}
            onClick={onAppointment}
          >
            Appointment
          </PrimaryButton>

          <SecondaryButton
            icon={<Users size={16} />}
            onClick={onPatient}
          >
            Patient
          </SecondaryButton>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Patients"
          value={stats.totalPatients}
          icon={<Users size={20} />}
          color="blue"
          subtitle="Registered charts"
        />

        <StatCard
          label="Today"
          value={stats.todayCount}
          icon={<CalendarIcon size={20} />}
          color="purple"
          subtitle="Appointments"
        />

        <StatCard
          label="Collected"
          value={formatCurrency(stats.collectedToday)}
          icon={<IndianRupee size={20} />}
          color="emerald"
          subtitle="Paid invoices"
        />

        <StatCard
          label="Low Stock"
          value={stats.lowStockCount}
          icon={<Package size={20} />}
          color={stats.lowStockCount ? "red" : "emerald"}
          subtitle="Replenishment alerts"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold">
                Appointment Activity
              </h3>

              <p className="text-xs text-slate-500 mt-1">
                Current appointment distribution
              </p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />

                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                />

                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                />

                <Tooltip />

                <Bar
                  dataKey="count"
                  fill="#2563eb"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold">
                Financial Snapshot
              </h3>

              <p className="text-xs text-slate-500 mt-1">
                Current receivables
              </p>
            </div>

            <Receipt size={19} className="text-blue-600" />
          </div>

          <div className="mt-7">
            <p className="text-xs uppercase tracking-wide text-slate-400 font-bold">
              Outstanding
            </p>

            <p className="text-3xl font-black mt-1">
              {formatCurrency(outstanding)}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 rounded-xl p-3">
              <p className="text-[10px] text-emerald-600 font-bold uppercase">
                Paid
              </p>

              <p className="font-black text-emerald-700 mt-1">
                {invoices.filter(i => i.status === "Paid").length}
              </p>
            </div>

            <div className="bg-amber-50 rounded-xl p-3">
              <p className="text-[10px] text-amber-600 font-bold uppercase">
                Pending
              </p>

              <p className="font-black text-amber-700 mt-1">
                {invoices.filter(i => i.status !== "Paid").length}
              </p>
            </div>
          </div>

          <button
            onClick={onBilling}
            className="w-full mt-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold"
          >
            Open Billing
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold">
                Today's Appointments
              </h3>
              <p className="text-xs text-slate-500">
                Clinical schedule
              </p>
            </div>

            <button
              onClick={() => onNavigate("appointments")}
              className="text-xs font-bold text-blue-600"
            >
              View all
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {todayAppointments.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={<CalendarIcon size={22} />}
                  title="No appointments today"
                  description="The clinical schedule is currently clear."
                />
              </div>
            ) : (
              todayAppointments.map(appointment => (
                <AppointmentRow
                  key={appointment.id}
                  appointment={appointment}
                />
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="p-5 border-b border-slate-200">
            <h3 className="font-bold">
              Inventory Alerts
            </h3>

            <p className="text-xs text-slate-500">
              Items requiring attention
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {inventory.filter(i => i.qty <= i.min).length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="mx-auto text-emerald-500" />
                <p className="font-bold mt-2">
                  Inventory healthy
                </p>
              </div>
            ) : (
              inventory
                .filter(i => i.qty <= i.min)
                .slice(0, 5)
                .map(item => (
                  <div
                    key={item.id}
                    className="p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-bold">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        Minimum {item.min} {item.unit}
                      </p>
                    </div>

                    <span className="text-xs font-black text-red-600 bg-red-50 px-2.5 py-1.5 rounded-lg">
                      {item.qty} left
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}


/* =========================================================
   APPOINTMENTS
========================================================= */

function AppointmentsView({
  appointments,
  selectedDate,
  dailyAppointments,
  onDateShift,
  onAdd,
  onStatusChange
}) {
  return (
    <div className="space-y-5">

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-black">
            Appointment Calendar
          </h2>
          <p className="text-sm text-slate-500">
            Manage the clinical schedule.
          </p>
        </div>

        <PrimaryButton
          icon={<Plus size={16} />}
          onClick={onAdd}
        >
          New Appointment
        </PrimaryButton>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <button
          onClick={() => onDateShift(-1)}
          className="p-2 rounded-xl hover:bg-slate-100"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">
            Selected Date
          </p>

          <p className="font-black mt-1">
            {getDisplayDate(selectedDate)}
          </p>
        </div>

        <button
          onClick={() => onDateShift(1)}
          className="p-2 rounded-xl hover:bg-slate-100"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {dailyAppointments.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon size={22} />}
          title="No appointments"
          description="There are no appointments scheduled for this date."
          action={
            <PrimaryButton
              icon={<Plus size={16} />}
              onClick={onAdd}
            >
              Schedule Appointment
            </PrimaryButton>
          }
        />
      ) : (
        <div className="grid gap-3">
          {dailyAppointments
            .sort((a, b) => String(a.time).localeCompare(String(b.time)))
            .map(appointment => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onStatusChange={onStatusChange}
              />
            ))}
        </div>
      )}
    </div>
  );
}

function AppointmentRow({ appointment }) {
  return (
    <div className="p-4 flex gap-4 items-center">
      <div className="w-16 text-center shrink-0">
        <div className="text-xs font-black text-blue-600">
          {appointment.time?.split(" - ")[0] || "--"}
        </div>
      </div>

      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
        <UserCheck size={17} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-bold text-sm truncate">
          {appointment.patient}
        </p>
        <p className="text-xs text-slate-500 truncate">
          {appointment.procedure}
        </p>
      </div>

      <StatusBadge status={appointment.status} />
    </div>
  );
}

function AppointmentCard({
  appointment,
  onStatusChange
}) {
  const statusColors = {
    scheduled: "border-blue-200 bg-blue-50/40",
    in_progress: "border-amber-200 bg-amber-50/40",
    completed: "border-emerald-200 bg-emerald-50/40"
  };

  return (
    <div
      className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-sm ${
        statusColors[appointment.status] || ""
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center gap-4">

        <div className="md:w-32 shrink-0">
          <div className="flex items-center gap-2 text-sm font-black">
            <Clock size={16} className="text-blue-600" />
            {appointment.time}
          </div>

          <p className="text-xs text-slate-500 mt-1">
            {appointment.duration}
          </p>
        </div>

        <div className="flex-1">
          <p className="font-black">
            {appointment.patient}
          </p>

          <p className="text-sm text-slate-600 mt-0.5">
            {appointment.procedure}
          </p>

          <p className="text-xs text-slate-500 mt-2">
            {appointment.doctor}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={appointment.status} />

          <button
            onClick={() =>
              onStatusChange(
                appointment.id,
                appointment.status
              )
            }
            className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
          >
            {appointment.status === "scheduled"
              ? "Start"
              : appointment.status === "in_progress"
              ? "Complete"
              : "Reopen"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    scheduled: {
      label: "Scheduled",
      cls: "bg-blue-50 text-blue-700 border-blue-200"
    },
    in_progress: {
      label: "In Progress",
      cls: "bg-amber-50 text-amber-700 border-amber-200"
    },
    completed: {
      label: "Completed",
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200"
    },
    Paid: {
      label: "Paid",
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200"
    },
    Unpaid: {
      label: "Unpaid",
      cls: "bg-red-50 text-red-700 border-red-200"
    },
    "Pre-Auth Approved": {
      label: "Pre-Auth Approved",
      cls: "bg-purple-50 text-purple-700 border-purple-200"
    }
  };

  const item = config[status] || {
    label: status || "Unknown",
    cls: "bg-slate-50 text-slate-600 border-slate-200"
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wide ${item.cls}`}
    >
      {item.label}
    </span>
  );
}


/* =========================================================
   PATIENTS
========================================================= */

function PatientsView({
  patients,
  searchQuery,
  onAdd,
  onOpen,
  onDelete
}) {
  const filtered = patients.filter(patient => {
    const q = searchQuery.trim().toLowerCase();

    if (!q) return true;

    return [
      patient.name,
      patient.customId,
      patient.phone,
      patient.id
    ]
      .filter(Boolean)
      .some(value =>
        String(value).toLowerCase().includes(q)
      );
  });

  return (
    <div className="space-y-5">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">
            Patient Registry
          </h2>
          <p className="text-sm text-slate-500">
            Secure clinical patient records.
          </p>
        </div>

        <PrimaryButton
          icon={<Plus size={16} />}
          onClick={onAdd}
        >
          Register Patient
        </PrimaryButton>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users size={22} />}
          title="No patients found"
          description="No patient records match your current search."
          action={
            <PrimaryButton
              icon={<Plus size={16} />}
              onClick={onAdd}
            >
              Register Patient
            </PrimaryButton>
          }
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs uppercase text-slate-500">
                    Patient
                  </th>
                  <th className="text-left px-5 py-3 text-xs uppercase text-slate-500">
                    Contact
                  </th>
                  <th className="text-left px-5 py-3 text-xs uppercase text-slate-500">
                    Registered
                  </th>
                  <th className="text-left px-5 py-3 text-xs uppercase text-slate-500">
                    Clinical Status
                  </th>
                  <th className="text-right px-5 py-3 text-xs uppercase text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filtered.map(patient => (
                  <tr key={patient.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                          {patient.name?.charAt(0)?.toUpperCase() || "P"}
                        </div>

                        <div>
                          <p className="font-bold">
                            {patient.name}
                          </p>

                          <p className="text-[11px] text-slate-500">
                            {patient.customId || patient.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {patient.phone || "—"}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {patient.registeredDate || "—"}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {patient.odontogram &&
                        Object.keys(patient.odontogram).length > 0 ? (
                          <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-lg text-[10px] font-bold">
                            {Object.keys(patient.odontogram).length} tooth findings
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold">
                            No findings
                          </span>
                        )}

                        {patient.medicalHistory?.allergies && (
                          <span className="px-2 py-1 bg-red-50 text-red-700 rounded-lg text-[10px] font-bold">
                            Allergy noted
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => onOpen(patient)}
                          className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"
                          title="Open chart"
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          onClick={() =>
                            onDelete(patient.id, patient.name)
                          }
                          className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                          title="Delete patient"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


/* =========================================================
   CLINICAL / RADIOLOGY
========================================================= */

function RadiologyDiagnosisView({
  patients,
  onOpenPatient
}) {
  const patientsWithClinicalData = patients.filter(
    patient =>
      patient.radiologyReport ||
      patient.odontogram ||
      patient.opgScans
  );

  return (
    <div className="space-y-5">

      <div>
        <h2 className="text-xl font-black">
          Clinical & Radiology
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          Radiology reports, diagnosis records and FDI odontogram.
        </p>
      </div>

      {patientsWithClinicalData.length === 0 ? (
        <EmptyState
          icon={<Stethoscope size={22} />}
          title="No clinical records"
          description="Clinical records will appear here after patients are registered and examined."
        />
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {patientsWithClinicalData.map(patient => (
            <ClinicalPatientCard
              key={patient.id}
              patient={patient}
              onOpen={() => onOpenPatient(patient)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ClinicalPatientCard({
  patient,
  onOpen
}) {
  const findings = Object.entries(
    patient.odontogram || {}
  );

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black">
            {patient.name}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            {patient.customId || patient.id}
          </p>
        </div>

        <button
          onClick={onOpen}
          className="p-2 rounded-lg bg-blue-50 text-blue-600"
        >
          <Eye size={17} />
        </button>
      </div>

      <div className="mt-5">
        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
          Diagnosis
        </p>

        <p className="text-sm text-slate-700 mt-2 line-clamp-3">
          {patient.radiologyReport?.diagnosisNotes ||
            "No diagnosis notes recorded."}
        </p>
      </div>

      <div className="mt-5">
        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
          OPG / Radiology
        </p>

        <p className="text-sm mt-2">
          {patient.opgScans?.length || 0} scan(s)
        </p>
      </div>

      <div className="mt-5">
        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
          Odontogram Findings
        </p>

        <div className="flex flex-wrap gap-1.5 mt-2">
          {findings.length === 0 ? (
            <span className="text-xs text-slate-400">
              No findings
            </span>
          ) : (
            findings.slice(0, 8).map(([tooth, condition]) => (
              <span
                key={tooth}
                className={`px-2 py-1 rounded-md border text-[10px] font-bold ${
                  TOOTH_CONDITIONS[condition]?.bg ||
                  "bg-slate-50 text-slate-600 border-slate-200"
                }`}
              >
                {tooth}: {TOOTH_CONDITIONS[condition]?.short || condition}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}


/* =========================================================
   BILLING
========================================================= */

function BillingView({
  invoices,
  onCreate,
  onUPI
}) {
  const paid = invoices.filter(i => i.status === "Paid");
  const unpaid = invoices.filter(i => i.status !== "Paid");

  const totalOutstanding = unpaid.reduce(
    (sum, invoice) => sum + Number(invoice.total || 0),
    0
  );

  const totalBilled = invoices.reduce(
    (sum, invoice) => sum + Number(invoice.total || 0),
    0
  );

  return (
    <div className="space-y-5">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">
            Billing & Insurance
          </h2>

          <p className="text-sm text-slate-500">
            Invoices, claims and digital payment collection.
          </p>
        </div>

        <PrimaryButton
          icon={<Plus size={16} />}
          onClick={onCreate}
        >
          Create Invoice
        </PrimaryButton>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Billed"
          value={formatCurrency(totalBilled)}
          icon={<Receipt size={19} />}
          color="blue"
        />

        <StatCard
          label="Outstanding"
          value={formatCurrency(totalOutstanding)}
          icon={<AlertCircle size={19} />}
          color="amber"
        />

        <StatCard
          label="Paid"
          value={paid.length}
          icon={<CheckCircle2 size={19} />}
          color="emerald"
        />

        <StatCard
          label="Invoices"
          value={invoices.length}
          icon={<FileText size={19} />}
          color="purple"
        />
      </div>

      {invoices.length === 0 ? (
        <EmptyState
          icon={<Receipt size={22} />}
          title="No invoices"
          description="Create your first patient invoice to begin billing."
          action={
            <PrimaryButton
              icon={<Plus size={16} />}
              onClick={onCreate}
            >
              Create Invoice
            </PrimaryButton>
          }
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase">
                    Invoice
                  </th>
                  <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase">
                    Patient
                  </th>
                  <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase">
                    Insurance
                  </th>
                  <th className="text-right px-5 py-3 text-xs text-slate-500 uppercase">
                    Amount
                  </th>
                  <th className="text-center px-5 py-3 text-xs text-slate-500 uppercase">
                    Status
                  </th>
                  <th className="text-right px-5 py-3 text-xs text-slate-500 uppercase">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {invoices.map(invoice => (
                  <tr key={invoice.id}>
                    <td className="px-5 py-4">
                      <p className="font-bold">
                        {invoice.customNo || invoice.id}
                      </p>

                      <p className="text-[11px] text-slate-500">
                        {invoice.date}
                      </p>
                    </td>

                    <td className="px-5 py-4 font-medium">
                      {invoice.patient}
                    </td>

                    <td className="px-5 py-4">
                      {invoice.insurance ? (
                        <div>
                          <p className="text-xs font-bold">
                            {invoice.insurance.provider}
                          </p>

                          {invoice.insurance.claimStatus && (
                            <span className="text-[10px] text-purple-700">
                              {invoice.insurance.claimStatus}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Self-pay
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right font-black">
                      {formatCurrency(invoice.total)}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <StatusBadge status={invoice.status} />
                    </td>

                    <td className="px-5 py-4">
                      {invoice.status !== "Paid" && (
                        <button
                          onClick={() => onUPI(invoice)}
                          className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                        >
                          <QrCode size={14} />
                          UPI
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


/* =========================================================
   INVENTORY
========================================================= */

function StockInventoryView({
  inventory,
  setInventory,
  onAdd,
  currentUser
}) {
  const updateQuantity = async (item, delta) => {
    const nextQty = Math.max(
      0,
      Number(item.qty || 0) + delta
    );

    setInventory(prev =>
      prev.map(existing =>
        existing.id === item.id
          ? {
              ...existing,
              qty: nextQty,
              status:
                nextQty <= existing.min
                  ? "Low Stock"
                  : "In Stock"
            }
          : existing
      )
    );

    if (currentUser && db && !String(item.id).startsWith("STK-")) {
      try {
        await updateDoc(
          doc(
            db,
            "clinics",
            currentUser.uid,
            "inventory",
            item.id
          ),
          {
            qty: nextQty,
            status:
              nextQty <= item.min
                ? "Low Stock"
                : "In Stock"
          }
        );
      } catch {
        // Offline/local fallback
      }
    }
  };

  return (
    <div className="space-y-5">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">
            Stock Inventory
          </h2>

          <p className="text-sm text-slate-500">
            Consumables, medications and clinical materials.
          </p>
        </div>

        <PrimaryButton
          icon={<Plus size={16} />}
          onClick={onAdd}
        >
          Add Stock Item
        </PrimaryButton>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <StatCard
          label="Total SKUs"
          value={inventory.length}
          icon={<Package size={19} />}
          color="blue"
        />

        <StatCard
          label="Low Stock"
          value={inventory.filter(i => i.qty <= i.min).length}
          icon={<AlertCircle size={19} />}
          color="red"
        />

        <StatCard
          label="Healthy"
          value={inventory.filter(i => i.qty > i.min).length}
          icon={<CheckCircle2 size={19} />}
          color="emerald"
        />
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {inventory.map(item => {
          const low = item.qty <= item.min;

          return (
            <div
              key={item.id}
              className={`bg-white border rounded-2xl p-5 shadow-sm ${
                low
                  ? "border-red-200"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold">
                    {item.name}
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    {item.category}
                  </p>
                </div>

                <span
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                    low
                      ? "bg-red-50 text-red-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {low ? "LOW" : "OK"}
                </span>
              </div>

              <div className="mt-6 flex items-end justify-between">
                <div>
                  <p className="text-3xl font-black">
                    {item.qty}
                  </p>

                  <p className="text-xs text-slate-500">
                    {item.unit}
                  </p>
                </div>

                <div className="text-right text-xs text-slate-500">
                  Minimum
                  <br />
                  <strong className="text-slate-700">
                    {item.min}
                  </strong>
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={() =>
                    updateQuantity(item, -1)
                  }
                  className="flex-1 py-2 rounded-xl border border-slate-200 font-bold hover:bg-slate-50"
                >
                  −
                </button>

                <button
                  onClick={() =>
                    updateQuantity(item, 1)
                  }
                  className="flex-1 py-2 rounded-xl bg-blue-600 text-white font-bold"
                >
                  +
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
   STAFF
========================================================= */

function StaffRolesView({
  staffList,
  setStaffList
}) {
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    role: "",
    phone: "",
    shift: ""
  });

  const addStaff = () => {
    if (!form.name.trim() || !form.role.trim()) {
      alert("Name and role are required.");
      return;
    }

    const staff = {
      id: `EMP-${Date.now()}`,
      name: form.name.trim(),
      role: form.role.trim(),
      phone: form.phone.trim(),
      shift: form.shift.trim(),
      status: "Active"
    };

    setStaffList(prev => [staff, ...prev]);

    setForm({
      name: "",
      role: "",
      phone: "",
      shift: ""
    });

    setShowForm(false);
  };

  const toggleStaff = id => {
    setStaffList(prev =>
      prev.map(member =>
        member.id === id
          ? {
              ...member,
              status:
                member.status === "Active"
                  ? "Inactive"
                  : "Active"
            }
          : member
      )
    );
  };

  return (
    <div className="space-y-5">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">
            Staff & Roles
          </h2>

          <p className="text-sm text-slate-500">
            Practice team and operational assignments.
          </p>
        </div>

        <PrimaryButton
          icon={<Plus size={16} />}
          onClick={() => setShowForm(true)}
        >
          Add Staff
        </PrimaryButton>
      </div>

      {showForm && (
        <div className="bg-white border border-blue-200 rounded-2xl p-5">
          <h3 className="font-bold mb-4">
            Add Team Member
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={form.name}
              onChange={value =>
                setForm({ ...form, name: value })
              }
            />

            <Input
              label="Role"
              value={form.role}
              onChange={value =>
                setForm({ ...form, role: value })
              }
            />

            <Input
              label="Phone"
              value={form.phone}
              onChange={value =>
                setForm({ ...form, phone: value })
              }
            />

            <Input
              label="Shift"
              value={form.shift}
              onChange={value =>
                setForm({ ...form, shift: value })
              }
            />
          </div>

          <div className="flex justify-end gap-2 mt-5">
            <SecondaryButton
              onClick={() => setShowForm(false)}
            >
              Cancel
            </SecondaryButton>

            <PrimaryButton onClick={addStaff}>
              Save Staff
            </PrimaryButton>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {staffList.map(member => (
          <div
            key={member.id}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
                {member.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1">
                <p className="font-black">
                  {member.name}
                </p>

                <p className="text-xs text-blue-600 font-bold mt-1">
                  {member.role}
                </p>
              </div>

              <span
                className={`w-2.5 h-2.5 rounded-full mt-1.5 ${
                  member.status === "Active"
                    ? "bg-emerald-500"
                    : "bg-slate-300"
                }`}
              />
            </div>

            <div className="mt-5 space-y-2 text-xs text-slate-500">
              <p>
                <Phone size={13} className="inline mr-2" />
                {member.phone || "Not provided"}
              </p>

              <p>
                <Clock size={13} className="inline mr-2" />
                {member.shift || "Shift not assigned"}
              </p>
            </div>

            <button
              onClick={() => toggleStaff(member.id)}
              className="w-full mt-5 py-2 rounded-xl border border-slate-200 text-xs font-bold hover:bg-slate-50"
            >
              {member.status === "Active"
                ? "Deactivate"
                : "Activate"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}


/* =========================================================
   PRACTICE SETTINGS
========================================================= */

function PracticeSettingsView({
  profile,
  onSave
}) {
  const [form, setForm] = useState(profile);

  useEffect(() => {
    setForm(profile);
  }, [profile]);

  const update = (field, value) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-5">

      <div>
        <h2 className="text-xl font-black">
          Practice Settings
        </h2>

        <p className="text-sm text-slate-500">
          Configure your clinic identity, compliance and settlement settings.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6">

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building size={19} />
          </div>

          <div>
            <h3 className="font-bold">
              Clinic Profile
            </h3>

            <p className="text-xs text-slate-500">
              Information shown on clinical and billing documents.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">

          <Input
            label="Clinic Name"
            value={form.clinicName || ""}
            onChange={value =>
              update("clinicName", value)
            }
          />

          <Input
            label="Tagline"
            value={form.tagline || ""}
            onChange={value =>
              update("tagline", value)
            }
          />

          <Input
            label="Dental License / Registration Number"
            value={form.licenseNo || ""}
            onChange={value =>
              update("licenseNo", value)
            }
          />

          <Input
            label="GSTIN"
            value={form.gstin || ""}
            onChange={value =>
              update("gstin", value)
            }
          />

          <Input
            label="Contact Email"
            type="email"
            value={form.contactEmail || ""}
            onChange={value =>
              update("contactEmail", value)
            }
          />

          <Input
            label="Contact Phone"
            value={form.contactPhone || ""}
            onChange={value =>
              update("contactPhone", value)
            }
          />

          <div className="md:col-span-2">
            <Input
              label="Clinic Address"
              value={form.address || ""}
              onChange={value =>
                update("address", value)
              }
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6">

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <QrCode size={19} />
          </div>

          <div>
            <h3 className="font-bold">
              Payment & Settlement
            </h3>

            <p className="text-xs text-slate-500">
              UPI settlement information.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">

          <Input
            label="UPI ID"
            value={form.upiId || ""}
            onChange={value =>
              update("upiId", value)
            }
          />

          <Input
            label="Consultation Fee"
            type="number"
            value={form.consultationFee ?? ""}
            onChange={value =>
              update(
                "consultationFee",
                Number(value)
              )
            }
          />

          <div className="md:col-span-2">
            <Input
              label="Operating Hours"
              value={form.operatingHours || ""}
              onChange={value =>
                update("operatingHours", value)
              }
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <PrimaryButton
          icon={<Save size={16} />}
          onClick={() => onSave(form)}
        >
          Save Practice Settings
        </PrimaryButton>
      </div>
    </div>
  );
}


/* =========================================================
   INPUT
========================================================= */

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder = ""
}) {
  return (
    <label className="block">
      <span className="block text-xs font-bold text-slate-600 mb-1.5">
        {label}
      </span>

      <input
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 4
}) {
  return (
    <label className="block">
      <span className="block text-xs font-bold text-slate-600 mb-1.5">
        {label}
      </span>

      <textarea
        rows={rows}
        value={value ?? ""}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-y"
      />
    </label>
  );
}


/* =========================================================
   NEW PATIENT MODAL
========================================================= */

function NewPatientModal({
  currentUser,
  onClose,
  onCreate
}) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    conditions: "",
    allergies: ""
  });

  const [saving, setSaving] = useState(false);

  const submit = async e => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Patient name is required.");
      return;
    }

    const patient = {
      id: `PAT-${Date.now()}`,
      customId: `PAT-${Math.floor(
        1000 + Math.random() * 9000
      )}`,
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      registeredDate: new Date().toLocaleDateString("en-IN"),
      medicalHistory: {
        conditions: form.conditions.trim(),
        allergies: form.allergies.trim()
      },
      radiologyReport: {},
      opgScans: [],
      odontogram: {},
      prescriptions: [],
      createdAt: new Date().toISOString()
    };

    setSaving(true);

    if (currentUser && db) {
      try {
        const ref = await addDoc(
          collection(
            db,
            "clinics",
            currentUser.uid,
            "patients"
          ),
          {
            ...patient,
            createdAt: serverTimestamp()
          }
        );

        patient.id = ref.id;
      } catch (error) {
        console.warn(
          "Cloud save failed; keeping local record.",
          error
        );
      }
    }

    onCreate(patient);
    setSaving(false);
  };

  return (
    <ModalShell
      title="Register Patient"
      subtitle="Create a new secure clinical chart."
      onClose={onClose}
    >
      <form
        onSubmit={submit}
        className="space-y-5"
      >

        <div className="grid md:grid-cols-2 gap-4">
          <Input
            label="Patient Full Name *"
            value={form.name}
            onChange={value =>
              setForm({ ...form, name: value })
            }
          />

          <Input
            label="Phone Number"
            value={form.phone}
            onChange={value =>
              setForm({ ...form, phone: value })
            }
          />

          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={value =>
              setForm({ ...form, email: value })
            }
          />
        </div>

        <TextArea
          label="Medical Conditions"
          value={form.conditions}
          onChange={value =>
            setForm({
              ...form,
              conditions: value
            })
          }
        />

        <TextArea
          label="Allergies"
          value={form.allergies}
          onChange={value =>
            setForm({
              ...form,
              allergies: value
            })
          }
        />

        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>
            Cancel
          </SecondaryButton>

          <PrimaryButton
            type="submit"
            disabled={saving}
          >
            {saving ? "Creating..." : "Create Patient"}
          </PrimaryButton>
        </div>
      </form>
    </ModalShell>
  );
}


/* =========================================================
   NEW APPOINTMENT MODAL
========================================================= */

function NewAppointmentModal({
  patients,
  staffList,
  currentUser,
  onClose,
  onCreate
}) {
  const [form, setForm] = useState({
    date: formatDateKey(new Date()),
    time: "10:00 AM - 10:45 AM",
    duration: "45 min",
    patient: patients[0]?.name || "",
    procedure: "",
    doctor:
      staffList.find(
        staff =>
          staff.role?.toLowerCase().includes("doctor") ||
          staff.role?.toLowerCase().includes("surgeon")
      )?.name || ""
  });

  const [saving, setSaving] = useState(false);

  const submit = async e => {
    e.preventDefault();

    if (!form.patient || !form.procedure) {
      alert("Patient and procedure are required.");
      return;
    }

    const appointment = {
      id: `APT-${Date.now()}`,
      ...form,
      status: "scheduled",
      createdAt: new Date().toISOString()
    };

    setSaving(true);

    if (currentUser && db) {
      try {
        const ref = await addDoc(
          collection(
            db,
            "clinics",
            currentUser.uid,
            "appointments"
          ),
          {
            ...appointment,
            createdAt: serverTimestamp()
          }
        );

        appointment.id = ref.id;
      } catch (error) {
        console.warn(
          "Appointment cloud save failed.",
          error
        );
      }
    }

    onCreate(appointment);
    setSaving(false);
  };

  return (
    <ModalShell
      title="New Appointment"
      subtitle="Schedule a clinical encounter."
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-5">

        <div className="grid md:grid-cols-2 gap-4">

          <Input
            label="Date *"
            type="date"
            value={form.date}
            onChange={value =>
              setForm({ ...form, date: value })
            }
          />

          <Input
            label="Time"
            value={form.time}
            onChange={value =>
              setForm({ ...form, time: value })
            }
          />

          <Input
            label="Duration"
            value={form.duration}
            onChange={value =>
              setForm({
                ...form,
                duration: value
              })
            }
          />

          <label className="block">
            <span className="block text-xs font-bold text-slate-600 mb-1.5">
              Patient *
            </span>

            <select
              value={form.patient}
              onChange={e =>
                setForm({
                  ...form,
                  patient: e.target.value
                })
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none"
            >
              <option value="">
                Select patient
              </option>

              {patients.map(patient => (
                <option
                  key={patient.id}
                  value={patient.name}
                >
                  {patient.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block md:col-span-2">
            <span className="block text-xs font-bold text-slate-600 mb-1.5">
              Doctor
            </span>

            <select
              value={form.doctor}
              onChange={e =>
                setForm({
                  ...form,
                  doctor: e.target.value
                })
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none"
            >
              <option value="">
                Select clinician
              </option>

              {staffList.map(staff => (
                <option
                  key={staff.id}
                  value={staff.name}
                >
                  {staff.name} — {staff.role}
                </option>
              ))}
            </select>
          </label>

          <div className="md:col-span-2">
            <Input
              label="Procedure / Reason *"
              value={form.procedure}
              onChange={value =>
                setForm({
                  ...form,
                  procedure: value
                })
              }
              placeholder="e.g. Root canal consultation"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>
            Cancel
          </SecondaryButton>

          <PrimaryButton
            type="submit"
            disabled={saving}
          >
            {saving ? "Saving..." : "Schedule Appointment"}
          </PrimaryButton>
        </div>
      </form>
    </ModalShell>
  );
}


/* =========================================================
   CREATE INVOICE MODAL
========================================================= */

function CreateInsuranceInvoiceModal({
  patients,
  onClose,
  onCreate
}) {
  const [form, setForm] = useState({
    patient: patients[0]?.name || "",
    itemName: "",
    quantity: 1,
    rate: "",
    insuranceProvider: "",
    policyNo: "",
    claimId: "",
    coverageAmt: ""
  });

  const total =
    Number(form.quantity || 0) *
    Number(form.rate || 0);

  const submit = e => {
    e.preventDefault();

    if (
      !form.patient ||
      !form.itemName ||
      !Number(form.rate)
    ) {
      alert("Patient, service and amount are required.");
      return;
    }

    const invoice = {
      id: `INV-${Date.now()}`,
      customNo: `INV-${new Date().getFullYear()}-${Math.floor(
        100 + Math.random() * 900
      )}`,
      patient: form.patient,
      date: new Date().toLocaleDateString("en-IN"),
      dueDate: new Date(
        Date.now() + 7 * 86400000
      ).toLocaleDateString("en-IN"),
      insurance: form.insuranceProvider
        ? {
            provider: form.insuranceProvider,
            policyNo: form.policyNo,
            claimId: form.claimId,
            coverageAmt: Number(
              form.coverageAmt || 0
            ),
            claimStatus: form.claimId
              ? "Pre-Authorization Pending"
              : "Not Submitted"
          }
        : null,
      items: [
        {
          id: 1,
          name: form.itemName,
          qty: Number(form.quantity),
          rate: Number(form.rate)
        }
      ],
      total,
      status: "Unpaid",
      createdAt: new Date().toISOString()
    };

    onCreate(invoice);
  };

  return (
    <ModalShell
      title="Create Invoice"
      subtitle="Generate a patient billing record."
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-5">

        <label className="block">
          <span className="block text-xs font-bold text-slate-600 mb-1.5">
            Patient *
          </span>

          <select
            value={form.patient}
            onChange={e =>
              setForm({
                ...form,
                patient: e.target.value
              })
            }
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm"
          >
            <option value="">
              Select patient
            </option>

            {patients.map(patient => (
              <option
                key={patient.id}
                value={patient.name}
              >
                {patient.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            <Input
              label="Service / Procedure *"
              value={form.itemName}
              onChange={value =>
                setForm({
                  ...form,
                  itemName: value
                })
              }
            />
          </div>

          <Input
            label="Quantity"
            type="number"
            value={form.quantity}
            onChange={value =>
              setForm({
                ...form,
                quantity: value
              })
            }
          />

          <Input
            label="Rate (INR) *"
            type="number"
            value={form.rate}
            onChange={value =>
              setForm({
                ...form,
                rate: value
              })
            }
          />

          <div className="bg-slate-50 rounded-xl px-4 py-3">
            <p className="text-xs text-slate-500">
              Invoice Total
            </p>

            <p className="text-xl font-black mt-1">
              {formatCurrency(total)}
            </p>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-5">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck
              size={18}
              className="text-purple-600"
            />

            <h3 className="font-bold">
              Insurance / TPA
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-4">

            <Input
              label="Insurance Provider"
              value={form.insuranceProvider}
              onChange={value =>
                setForm({
                  ...form,
                  insuranceProvider: value
                })
              }
            />

            <Input
              label="Policy Number"
              value={form.policyNo}
              onChange={value =>
                setForm({
                  ...form,
                  policyNo: value
                })
              }
            />

            <Input
              label="Claim ID"
              value={form.claimId}
              onChange={value =>
                setForm({
                  ...form,
                  claimId: value
                })
              }
            />

            <Input
              label="Coverage Amount"
              type="number"
              value={form.coverageAmt}
              onChange={value =>
                setForm({
                  ...form,
                  coverageAmt: value
                })
              }
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>
            Cancel
          </SecondaryButton>

          <PrimaryButton type="submit">
            Create Invoice
          </PrimaryButton>
        </div>
      </form>
    </ModalShell>
  );
}


/* =========================================================
   UPI PAYMENT
========================================================= */

function UPIPaymentModal({
  invoice,
  profile,
  onClose,
  onPaid,
  currentUser
}) {
  const amount = Number(invoice.total || 0);

  const upiPayload = `upi://pay?pa=${encodeURIComponent(
    profile.upiId || ""
  )}&pn=${encodeURIComponent(
    profile.clinicName || "Dental Clinic"
  )}&am=${encodeURIComponent(
    amount
  )}&cu=INR&tn=${encodeURIComponent(
    invoice.customNo || invoice.id
  )}`;

  const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(
    upiPayload
  )}&size=280`;

  const markPaid = async () => {
    if (
      currentUser &&
      db &&
      !String(invoice.id).startsWith("INV-")
    ) {
      try {
        await updateDoc(
          doc(
            db,
            "clinics",
            currentUser.uid,
            "invoices",
            invoice.id
          ),
          {
            status: "Paid",
            paidAt: serverTimestamp()
          }
        );
      } catch {
        // local state will still update
      }
    }

    onPaid(invoice.id);
  };

  return (
    <ModalShell
      title="UPI Payment"
      subtitle={`Collect ${formatCurrency(amount)} from ${invoice.patient}`}
      onClose={onClose}
      width="max-w-md"
    >
      <div className="text-center">

        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold">
          <QrCode size={14} />
          UPI Collection
        </div>

        <p className="text-3xl font-black mt-5">
          {formatCurrency(amount)}
        </p>

        <p className="text-sm text-slate-500 mt-1">
          {profile.upiId || "UPI ID not configured"}
        </p>

        <div className="mt-6 flex justify-center">
          {profile.upiId ? (
            <img
              src={qrUrl}
              alt="UPI payment QR"
              className="w-56 h-56 rounded-2xl border border-slate-200"
            />
          ) : (
            <div className="w-56 h-56 rounded-2xl bg-slate-100 flex items-center justify-center text-sm text-slate-500 p-5">
              Configure a clinic UPI ID in Practice Settings before collecting payments.
            </div>
          )}
        </div>

        <div className="bg-slate-50 rounded-xl p-4 mt-5 text-left">
          <p className="text-xs text-slate-500">
            Invoice
          </p>

          <p className="font-bold mt-1">
            {invoice.customNo || invoice.id}
          </p>

          <p className="text-xs text-slate-500 mt-3">
            Patient
          </p>

          <p className="font-bold mt-1">
            {invoice.patient}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-5">
          <SecondaryButton onClick={onClose}>
            Close
          </SecondaryButton>

          <button
            onClick={markPaid}
            disabled={!profile.upiId}
            className="rounded-xl bg-emerald-600 text-white font-bold text-sm disabled:opacity-40"
          >
            Mark Paid
          </button>
        </div>
      </div>
    </ModalShell>
  );
}


/* =========================================================
   ADD STOCK
========================================================= */

function AddStockItemModal({
  onClose,
  onCreate
}) {
  const [form, setForm] = useState({
    name: "",
    category: "",
    qty: "",
    min: "",
    unit: ""
  });

  const submit = e => {
    e.preventDefault();

    if (!form.name || !form.qty || !form.unit) {
      alert("Name, quantity and unit are required.");
      return;
    }

    const qty = Number(form.qty);
    const min = Number(form.min || 0);

    onCreate({
      id: `STK-${Date.now()}`,
      name: form.name.trim(),
      category: form.category.trim() || "General",
      qty,
      min,
      unit: form.unit.trim(),
      status: qty <= min ? "Low Stock" : "In Stock"
    });
  };

  return (
    <ModalShell
      title="Add Stock Item"
      subtitle="Create an inventory SKU."
      onClose={onClose}
      width="max-w-xl"
    >
      <form onSubmit={submit} className="space-y-5">

        <div className="grid md:grid-cols-2 gap-4">
          <Input
            label="Item Name *"
            value={form.name}
            onChange={value =>
              setForm({
                ...form,
                name: value
              })
            }
          />

          <Input
            label="Category"
            value={form.category}
            onChange={value =>
              setForm({
                ...form,
                category: value
              })
            }
          />

          <Input
            label="Quantity *"
            type="number"
            value={form.qty}
            onChange={value =>
              setForm({
                ...form,
                qty: value
              })
            }
          />

          <Input
            label="Minimum Stock"
            type="number"
            value={form.min}
            onChange={value =>
              setForm({
                ...form,
                min: value
              })
            }
          />

          <Input
            label="Unit *"
            value={form.unit}
            onChange={value =>
              setForm({
                ...form,
                unit: value
              })
            }
          />
        </div>

        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>
            Cancel
          </SecondaryButton>

          <PrimaryButton type="submit">
            Add Item
          </PrimaryButton>
        </div>
      </form>
    </ModalShell>
  );
}


/* =========================================================
   PATIENT DETAILS
========================================================= */

function PatientDetailsModal({
  patient,
  onClose,
  onSave,
  onDelete
}) {
  const [form, setForm] = useState({
    ...patient,
    medicalHistory: {
      ...(patient.medicalHistory || {})
    },
    radiologyReport: {
      ...(patient.radiologyReport || {})
    },
    odontogram: {
      ...(patient.odontogram || {})
    },
    prescriptions: [
      ...(patient.prescriptions || [])
    ]
  });

  const [activeSection, setActiveSection] =
    useState("overview");

  const updateMedical = (field, value) => {
    setForm(prev => ({
      ...prev,
      medicalHistory: {
        ...prev.medicalHistory,
        [field]: value
      }
    }));
  };

  const updateRadiology = (field, value) => {
    setForm(prev => ({
      ...prev,
      radiologyReport: {
        ...prev.radiologyReport,
        [field]: value
      }
    }));
  };

  const updateTooth = (tooth, condition) => {
    setForm(prev => ({
      ...prev,
      odontogram: {
        ...prev.odontogram,
        [tooth]: condition
      }
    }));
  };

  const clearTooth = tooth => {
    setForm(prev => {
      const odontogram = {
        ...(prev.odontogram || {})
      };

      delete odontogram[tooth];

      return {
        ...prev,
        odontogram
      };
    });
  };

  const addPrescription = () => {
    setForm(prev => ({
      ...prev,
      prescriptions: [
        ...(prev.prescriptions || []),
        {
          id: `rx-${Date.now()}`,
          medicine: "",
          dosage: "",
          frequency: "",
          duration: "",
          notes: ""
        }
      ]
    }));
  };

  const updatePrescription = (
    id,
    field,
    value
  ) => {
    setForm(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.map(rx =>
        rx.id === id
          ? {
              ...rx,
              [field]: value
            }
          : rx
      )
    }));
  };

  const removePrescription = id => {
    setForm(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.filter(
        rx => rx.id !== id
      )
    }));
  };

  const tabs = [
    ["overview", "Overview"],
    ["odontogram", "Odontogram"],
    ["radiology", "Radiology"],
    ["prescriptions", "Prescriptions"]
  ];

  return (
    <ModalShell
      title={patient.name}
      subtitle={`${patient.customId || patient.id} · Clinical Chart`}
      onClose={onClose}
      width="max-w-5xl"
    >
      <div className="space-y-5">

        <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              onClick={() =>
                setActiveSection(key)
              }
              className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 ${
                activeSection === key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeSection === "overview" && (
          <div className="space-y-5">

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                  Contact
                </p>

                <p className="font-bold mt-2">
                  {patient.phone || "Not provided"}
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  {patient.email || "No email"}
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                  Registration
                </p>

                <p className="font-bold mt-2">
                  {patient.registeredDate || "—"}
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">

              <TextArea
                label="Medical Conditions"
                value={
                  form.medicalHistory?.conditions || ""
                }
                onChange={value =>
                  updateMedical(
                    "conditions",
                    value
                  )
                }
              />

              <TextArea
                label="Allergies"
                value={
                  form.medicalHistory?.allergies || ""
                }
                onChange={value =>
                  updateMedical(
                    "allergies",
                    value
                  )
                }
              />

            </div>

            {form.medicalHistory?.allergies && (
              <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                <ShieldAlert
                  size={19}
                  className="shrink-0"
                />

                <div>
                  <p className="font-bold text-sm">
                    Allergy Alert
                  </p>

                  <p className="text-xs mt-1">
                    {form.medicalHistory.allergies}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === "odontogram" && (
          <OdontogramEditor
            odontogram={form.odontogram || {}}
            onUpdate={updateTooth}
            onClear={clearTooth}
          />
        )}

        {activeSection === "radiology" && (
          <div className="space-y-5">

            <TextArea
              label="Trauma Findings"
              value={
                form.radiologyReport?.traumaFindings ||
                ""
              }
              onChange={value =>
                updateRadiology(
                  "traumaFindings",
                  value
                )
              }
            />

            <TextArea
              label="Impaction Classification"
              value={
                form.radiologyReport?.impactionClass ||
                ""
              }
              onChange={value =>
                updateRadiology(
                  "impactionClass",
                  value
                )
              }
            />

            <TextArea
              label="Diagnosis Notes"
              value={
                form.radiologyReport?.diagnosisNotes ||
                ""
              }
              onChange={value =>
                updateRadiology(
                  "diagnosisNotes",
                  value
                )
              }
            />

            <TextArea
              label="Bone Status"
              value={
                form.radiologyReport?.boneStatus ||
                ""
              }
              onChange={value =>
                updateRadiology(
                  "boneStatus",
                  value
                )
              }
            />

            <div>
              <p className="text-xs font-bold text-slate-600 mb-3">
                OPG Scans
              </p>

              {form.opgScans?.length ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {form.opgScans.map(scan => (
                    <div
                      key={scan.id}
                      className="border border-slate-200 rounded-xl overflow-hidden"
                    >
                      {scan.url && (
                        <img
                          src={scan.url}
                          alt={scan.title}
                          className="w-full h-40 object-cover"
                        />
                      )}

                      <div className="p-3">
                        <p className="font-bold text-sm">
                          {scan.title}
                        </p>

                        <p className="text-xs text-slate-500 mt-1">
                          {scan.date}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  No radiology scans attached.
                </p>
              )}
            </div>
          </div>
        )}

        {activeSection === "prescriptions" && (
          <div className="space-y-4">

            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold">
                  Prescriptions
                </h3>

                <p className="text-xs text-slate-500">
                  Medication instructions recorded in this chart.
                </p>
              </div>

              <SecondaryButton
                icon={<Plus size={15} />}
                onClick={addPrescription}
              >
                Add Medicine
              </SecondaryButton>
            </div>

            {(form.prescriptions || []).length === 0 ? (
              <EmptyState
                icon={<FileText size={20} />}
                title="No prescriptions"
                description="No medication records have been added."
              />
            ) : (
              form.prescriptions.map(rx => (
                <div
                  key={rx.id}
                  className="border border-slate-200 rounded-2xl p-4"
                >
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">

                    <Input
                      label="Medicine"
                      value={rx.medicine}
                      onChange={value =>
                        updatePrescription(
                          rx.id,
                          "medicine",
                          value
                        )
                      }
                    />

                    <Input
                      label="Dosage"
                      value={rx.dosage}
                      onChange={value =>
                        updatePrescription(
                          rx.id,
                          "dosage",
                          value
                        )
                      }
                    />

                    <Input
                      label="Frequency"
                      value={rx.frequency}
                      onChange={value =>
                        updatePrescription(
                          rx.id,
                          "frequency",
                          value
                        )
                      }
                    />

                    <Input
                      label="Duration"
                      value={rx.duration}
                      onChange={value =>
                        updatePrescription(
                          rx.id,
                          "duration",
                          value
                        )
                      }
                    />
                  </div>

                  <div className="flex gap-2 mt-3">
                    <div className="flex-1">
                      <Input
                        label="Notes"
                        value={rx.notes}
                        onChange={value =>
                          updatePrescription(
                            rx.id,
                            "notes",
                            value
                          )
                        }
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        removePrescription(rx.id)
                      }
                      className="self-end p-2.5 rounded-xl text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className="border-t border-slate-200 pt-5 flex flex-col sm:flex-row justify-between gap-3">
          <button
            onClick={() =>
              onDelete(patient.id, patient.name)
            }
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-bold hover:bg-red-50"
          >
            <Trash2 size={15} />
            Delete Patient
          </button>

          <div className="flex gap-2 justify-end">
            <SecondaryButton onClick={onClose}>
              Close
            </SecondaryButton>

            <PrimaryButton
              icon={<Save size={15} />}
              onClick={() => onSave(form)}
            >
              Save Clinical Record
            </PrimaryButton>
          </div>
        </div>

      </div>
    </ModalShell>
  );
}


/* =========================================================
   FDI ODONTOGRAM
========================================================= */

function OdontogramEditor({
  odontogram,
  onUpdate,
  onClear
}) {
  const [selectedTooth, setSelectedTooth] =
    useState(null);

  const conditionKeys =
    Object.keys(TOOTH_CONDITIONS);

  const renderTooth = tooth => {
    const condition = odontogram[tooth];
    const data = condition
      ? TOOTH_CONDITIONS[condition]
      : TOOTH_CONDITIONS.healthy;

    return (
      <button
        key={tooth}
        onClick={() => setSelectedTooth(tooth)}
        className={`min-w-11 h-12 px-1 rounded-xl border flex flex-col items-center justify-center transition ${
          condition
            ? data.bg
            : "bg-white border-slate-200 hover:border-blue-400"
        }`}
      >
        <span className="text-[10px] font-black">
          {tooth}
        </span>

        <span className="text-[8px] font-bold mt-0.5">
          {condition
            ? data.short
            : "HLT"}
        </span>
      </button>
    );
  };

  return (
    <div className="space-y-5">

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold">
              FDI Adult Odontogram
            </h3>

            <p className="text-xs text-slate-500 mt-1">
              Select a tooth to assign a clinical condition.
            </p>
          </div>

          <div className="text-xs text-slate-500">
            {Object.keys(odontogram).length} findings
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <div className="min-w-[850px]">

            <div className="flex gap-1 justify-center">
              {FDI_TEETH.upper.map(renderTooth)}
            </div>

            <div className="h-4" />

            <div className="border-t border-dashed border-slate-300" />

            <div className="h-4" />

            <div className="flex gap-1 justify-center">
              {FDI_TEETH.lower.map(renderTooth)}
            </div>

          </div>
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-slate-600 mb-3">
          Condition Legend
        </p>

        <div className="flex flex-wrap gap-2">
          {conditionKeys.map(key => (
            <span
              key={key}
              className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-bold ${TOOTH_CONDITIONS[key].bg}`}
            >
              {TOOTH_CONDITIONS[key].short} —{" "}
              {TOOTH_CONDITIONS[key].label}
            </span>
          ))}
        </div>
      </div>

      {selectedTooth && (
        <div className="bg-white border-2 border-blue-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-slate-500">
                Selected tooth
              </p>

              <p className="text-xl font-black">
                FDI {selectedTooth}
              </p>
            </div>

            <button
              onClick={() => {
                onClear(selectedTooth);
                setSelectedTooth(null);
              }}
              className="text-xs font-bold text-red-600"
            >
              Clear Finding
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {conditionKeys.map(key => (
              <button
                key={key}
                onClick={() => {
                  onUpdate(
                    selectedTooth,
                    key
                  );
                  setSelectedTooth(null);
                }}
                className={`px-3 py-2.5 rounded-xl border text-left ${TOOTH_CONDITIONS[key].bg}`}
              >
                <div className="text-[10px] font-black">
                  {TOOTH_CONDITIONS[key].short}
                </div>

                <div className="text-xs font-bold mt-1">
                  {TOOTH_CONDITIONS[key].label}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}// ==============================
// APPOINTMENTS VIEW
// ==============================

function AppointmentsView({
  appointments,
  patients,
  selectedDate,
  onDateChange,
  onAddAppointment,
  onCycleStatus,
}) {
  const dateKey = formatDateKey(selectedDate);

  const dailyAppointments = appointments
    .filter((appointment) => appointment.date === dateKey)
    .sort((a, b) => (a.time || "").localeCompare(b.time || ""));

  const statusStyles = {
    scheduled:
      "bg-blue-50 text-blue-700 border-blue-200",
    in_progress:
      "bg-amber-50 text-amber-700 border-amber-200",
    completed:
      "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled:
      "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">
            Appointments
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage your clinical schedule and patient appointments.
          </p>
        </div>

        <button
          onClick={onAddAppointment}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-bold text-sm shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Appointment
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <button
            onClick={() => onDateChange(-1)}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Schedule
            </p>
            <p className="font-black text-slate-900">
              {getDisplayDate(selectedDate)}
            </p>
          </div>

          <button
            onClick={() => onDateChange(1)}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {dailyAppointments.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800">
              No appointments
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              There are no appointments scheduled for this date.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {dailyAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="p-5 hover:bg-slate-50 transition"
              >
                <div className="flex flex-col xl:flex-row xl:items-center gap-5">
                  <div className="xl:w-36 shrink-0">
                    <div className="flex items-center gap-2 text-slate-900 font-black">
                      <Clock className="w-4 h-4 text-blue-600" />
                      {appointment.time || "Time not set"}
                    </div>
                    {appointment.duration && (
                      <p className="text-xs text-slate-400 mt-1 ml-6">
                        {appointment.duration}
                      </p>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-slate-900">
                        {appointment.patient || "Unnamed Patient"}
                      </h3>

                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-black uppercase border ${
                          statusStyles[appointment.status] ||
                          statusStyles.scheduled
                        }`}
                      >
                        {(appointment.status || "scheduled").replace(
                          "_",
                          " "
                        )}
                      </span>
                    </div>

                    <p className="text-sm text-slate-600 mt-1">
                      {appointment.procedure || "Consultation"}
                    </p>

                    {appointment.doctor && (
                      <p className="text-xs text-slate-400 mt-2">
                        Clinician: {appointment.doctor}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() =>
                      onCycleStatus(
                        appointment.id,
                        appointment.status || "scheduled"
                      )
                    }
                    className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700"
                  >
                    Update Status
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


// ==============================
// PATIENTS VIEW
// ==============================

function PatientsView({
  patients,
  searchQuery,
  onSearchChange,
  onNewPatient,
  onOpenPatient,
  onDeletePatient,
}) {
  const filteredPatients = patients.filter((patient) => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return true;

    return (
      patient.name?.toLowerCase().includes(query) ||
      patient.phone?.toLowerCase().includes(query) ||
      patient.customId?.toLowerCase().includes(query) ||
      patient.id?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">
            Patients
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Secure clinical records and patient management.
          </p>
        </div>

        <button
          onClick={onNewPatient}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-bold text-sm"
        >
          <Plus className="w-4 h-4" />
          Register Patient
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

        <input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search patient name, phone or patient ID..."
          className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {filteredPatients.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800">
              No patients found
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Register a patient to create their clinical record.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-4 text-xs font-black uppercase text-slate-400">
                    Patient
                  </th>
                  <th className="text-left px-5 py-4 text-xs font-black uppercase text-slate-400">
                    Patient ID
                  </th>
                  <th className="text-left px-5 py-4 text-xs font-black uppercase text-slate-400">
                    Contact
                  </th>
                  <th className="text-left px-5 py-4 text-xs font-black uppercase text-slate-400">
                    Registered
                  </th>
                  <th className="text-right px-5 py-4 text-xs font-black uppercase text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredPatients.map((patient) => (
                  <tr
                    key={patient.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-black">
                          {patient.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase() || "P"}
                        </div>

                        <div>
                          <p className="font-bold text-slate-900">
                            {patient.name || "Unnamed Patient"}
                          </p>
                          <p className="text-xs text-slate-400">
                            {patient.medicalHistory?.conditions ||
                              "No medical conditions recorded"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm font-mono text-slate-600">
                      {patient.customId || patient.id}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <Phone className="w-4 h-4 text-slate-400" />
                        {patient.phone || "Not provided"}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {patient.registeredDate || "—"}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => onOpenPatient(patient)}
                          className="p-2 rounded-lg text-blue-600 hover:bg-blue-50"
                          title="Open clinical chart"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() =>
                            onDeletePatient(
                              patient.id,
                              patient.name
                            )
                          }
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                          title="Delete patient"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


// ==============================
// RADIOLOGY / DIAGNOSIS VIEW
// ==============================

function RadiologyDiagnosisView({
  patients,
  onOpenPatient,
}) {
  const patientsWithDiagnostics = patients.filter(
    (patient) =>
      patient.radiologyReport ||
      patient.odontogram ||
      patient.opgScans
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900">
          Radiology & Diagnosis
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          Clinical imaging, diagnostic notes and odontogram records.
        </p>
      </div>

      {patientsWithDiagnostics.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <Stethoscope className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800">
            No diagnostic records
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Diagnostic information will appear here after patient records
            are created.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {patientsWithDiagnostics.map((patient) => {
            const report = patient.radiologyReport || {};

            return (
              <div
                key={patient.id}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
              >
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-slate-900">
                      {patient.name}
                    </h3>

                    <p className="text-xs text-slate-400 mt-1">
                      {patient.customId || patient.id}
                    </p>
                  </div>

                  <button
                    onClick={() => onOpenPatient(patient)}
                    className="px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold"
                  >
                    Open Chart
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-xs uppercase font-black text-slate-400 mb-1">
                      Trauma Findings
                    </p>
                    <p className="text-sm text-slate-700">
                      {report.traumaFindings || "Not recorded"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase font-black text-slate-400 mb-1">
                      Impaction
                    </p>
                    <p className="text-sm text-slate-700">
                      {report.impactionClass || "Not recorded"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase font-black text-slate-400 mb-1">
                      Diagnosis
                    </p>
                    <p className="text-sm text-slate-700">
                      {report.diagnosisNotes || "Not recorded"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase font-black text-slate-400 mb-1">
                      Bone Status
                    </p>
                    <p className="text-sm text-slate-700">
                      {report.boneStatus || "Not recorded"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase font-black text-slate-400 mb-2">
                      OPG Scans
                    </p>

                    {patient.opgScans?.length ? (
                      <div className="space-y-2">
                        {patient.opgScans.map((scan) => (
                          <div
                            key={scan.id}
                            className="border border-slate-200 rounded-xl p-3 flex items-center gap-3"
                          >
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-slate-500" />
                            </div>

                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate">
                                {scan.title || "Radiology Scan"}
                              </p>
                              <p className="text-xs text-slate-400">
                                {scan.date || "Date unavailable"}
                              </p>
                            </div>

                            {scan.url && (
                              <a
                                href={scan.url}
                                target="_blank"
                                rel="noreferrer"
                                className="ml-auto text-xs font-bold text-blue-600"
                              >
                                View
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">
                        No scans uploaded.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


// ==============================
// BILLING VIEW
// ==============================

function BillingView({
  invoices,
  onCreateInvoice,
  onOpenUPI,
}) {
  const totalBilled = invoices.reduce(
    (sum, invoice) => sum + Number(invoice.total || 0),
    0
  );

  const totalPaid = invoices
    .filter((invoice) => invoice.status === "Paid")
    .reduce(
      (sum, invoice) => sum + Number(invoice.total || 0),
      0
    );

  const outstanding = totalBilled - totalPaid;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">
            Billing & Insurance
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Invoices, collections, claims and digital payments.
          </p>
        </div>

        <button
          onClick={onCreateInvoice}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-bold text-sm"
        >
          <Plus className="w-4 h-4" />
          Create Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          label="Total Billed"
          value={formatCurrency(totalBilled)}
          icon={<Receipt className="w-5 h-5" />}
          color="blue"
        />

        <MetricCard
          label="Collected"
          value={formatCurrency(totalPaid)}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="emerald"
        />

        <MetricCard
          label="Outstanding"
          value={formatCurrency(outstanding)}
          icon={<AlertCircle className="w-5 h-5" />}
          color="amber"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {invoices.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800">
              No invoices
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Create your first invoice to begin billing.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-4 text-xs font-black uppercase text-slate-400">
                    Invoice
                  </th>
                  <th className="text-left px-5 py-4 text-xs font-black uppercase text-slate-400">
                    Patient
                  </th>
                  <th className="text-left px-5 py-4 text-xs font-black uppercase text-slate-400">
                    Insurance
                  </th>
                  <th className="text-right px-5 py-4 text-xs font-black uppercase text-slate-400">
                    Amount
                  </th>
                  <th className="text-center px-5 py-4 text-xs font-black uppercase text-slate-400">
                    Status
                  </th>
                  <th className="text-right px-5 py-4 text-xs font-black uppercase text-slate-400">
                    Payment
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900">
                        {invoice.customNo || invoice.id}
                      </p>
                      <p className="text-xs text-slate-400">
                        {invoice.date || "—"}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm font-medium text-slate-700">
                      {invoice.patient || "—"}
                    </td>

                    <td className="px-5 py-4">
                      {invoice.insurance ? (
                        <div>
                          <p className="text-sm font-bold text-slate-700">
                            {invoice.insurance.provider}
                          </p>

                          <span className="inline-flex mt-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black">
                            {invoice.insurance.claimStatus ||
                              "Claim Pending"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Self Pay
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right font-black text-slate-900">
                      {formatCurrency(invoice.total)}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`px-2.5 py-1.5 rounded-full text-[10px] font-black uppercase ${
                          invoice.status === "Paid"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {invoice.status || "Unpaid"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      {invoice.status !== "Paid" && (
                        <button
                          onClick={() => onOpenUPI(invoice)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100"
                        >
                          <QrCode className="w-4 h-4" />
                          UPI
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


// ==============================
// INVENTORY VIEW
// ==============================

function StockInventoryView({
  inventory,
  onAddStock,
}) {
  const lowStock = inventory.filter(
    (item) => Number(item.qty || 0) <= Number(item.min || 0)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">
            Stock & Inventory
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Track dental materials, consumables and medications.
          </p>
        </div>

        <button
          onClick={onAddStock}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-bold text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Stock Item
        </button>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />

          <div>
            <p className="font-bold text-amber-900">
              Replenishment required
            </p>

            <p className="text-sm text-amber-800 mt-1">
              {lowStock.length} inventory item
              {lowStock.length > 1 ? "s are" : " is"} below the
              configured minimum quantity.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {inventory.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800">
              Inventory is empty
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Add your first inventory item.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-4 text-xs font-black uppercase text-slate-400">
                    Item
                  </th>
                  <th className="text-left px-5 py-4 text-xs font-black uppercase text-slate-400">
                    Category
                  </th>
                  <th className="text-right px-5 py-4 text-xs font-black uppercase text-slate-400">
                    Quantity
                  </th>
                  <th className="text-right px-5 py-4 text-xs font-black uppercase text-slate-400">
                    Minimum
                  </th>
                  <th className="text-center px-5 py-4 text-xs font-black uppercase text-slate-400">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {inventory.map((item) => {
                  const isLow =
                    Number(item.qty || 0) <=
                    Number(item.min || 0);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900">
                          {item.name}
                        </p>

                        <p className="text-xs text-slate-400">
                          {item.id}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {item.category || "General"}
                      </td>

                      <td className="px-5 py-4 text-right font-black text-slate-900">
                        {item.qty}{" "}
                        <span className="text-xs font-normal text-slate-400">
                          {item.unit}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right text-sm text-slate-600">
                        {item.min}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`px-2.5 py-1.5 rounded-full text-[10px] font-black uppercase ${
                            isLow
                              ? "bg-red-50 text-red-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {isLow ? "Low Stock" : "In Stock"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


// ==============================
// STAFF & ROLES VIEW
// ==============================

function StaffRolesView({
  staffList,
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900">
          Staff & Roles
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          Manage your clinic workforce and operational roles.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {staffList.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800">
              No staff records
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Staff accounts can be added after authentication and
              role configuration is implemented.
            </p>
          </div>
        ) : (
          staffList.map((staff) => (
            <div
              key={staff.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <UserCheck className="w-6 h-6" />
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                    staff.status === "Active"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {staff.status || "Active"}
                </span>
              </div>

              <div className="mt-4">
                <h3 className="font-black text-slate-900">
                  {staff.name}
                </h3>

                <p className="text-sm text-blue-600 font-semibold mt-1">
                  {staff.role}
                </p>

                <div className="mt-4 space-y-2 text-xs text-slate-500">
                  <p>
                    <span className="font-bold">Phone:</span>{" "}
                    {staff.phone || "Not provided"}
                  </p>

                  <p>
                    <span className="font-bold">Shift:</span>{" "}
                    {staff.shift || "Not configured"}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


// ==============================
// PRACTICE SETTINGS
// ==============================

function PracticeSettingsView({
  profile,
  onSave,
}) {
  const [form, setForm] = useState(profile || {});

  useEffect(() => {
    setForm(profile || {});
  }, [profile]);

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const submit = (event) => {
    event.preventDefault();
    onSave({
      ...form,
      consultationFee: Number(form.consultationFee || 0),
    });
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-black text-slate-900">
          Practice Settings
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          Configure the clinic identity, compliance details and
          settlement settings.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Building className="w-5 h-5" />
          </div>

          <div>
            <h3 className="font-black text-slate-900">
              Clinic Profile
            </h3>
            <p className="text-xs text-slate-400">
              Information displayed on your practice workspace.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField
            label="Clinic Name"
            value={form.clinicName}
            onChange={(value) =>
              updateField("clinicName", value)
            }
            required
          />

          <FormField
            label="Tagline"
            value={form.tagline}
            onChange={(value) =>
              updateField("tagline", value)
            }
          />

          <FormField
            label="Dental License / Registration Number"
            value={form.licenseNo}
            onChange={(value) =>
              updateField("licenseNo", value)
            }
          />

          <FormField
            label="GSTIN"
            value={form.gstin}
            onChange={(value) =>
              updateField("gstin", value)
            }
          />

          <FormField
            label="Contact Email"
            type="email"
            value={form.contactEmail}
            onChange={(value) =>
              updateField("contactEmail", value)
            }
          />

          <FormField
            label="Contact Phone"
            value={form.contactPhone}
            onChange={(value) =>
              updateField("contactPhone", value)
            }
          />

          <div className="md:col-span-2">
            <FormField
              label="Clinic Address"
              value={form.address}
              onChange={(value) =>
                updateField("address", value)
              }
              textarea
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <IndianRupee className="w-5 h-5" />
          </div>

          <div>
            <h3 className="font-black text-slate-900">
              Commercial Configuration
            </h3>

            <p className="text-xs text-slate-400">
              Configure consultation and payment settlement details.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <FormField
            label="Consultation Fee"
            type="number"
            value={form.consultationFee}
            onChange={(value) =>
              updateField("consultationFee", value)
            }
          />

          <FormField
            label="UPI ID"
            value={form.upiId}
            onChange={(value) =>
              updateField("upiId", value)
            }
          />

          <FormField
            label="Operating Hours"
            value={form.operatingHours}
            onChange={(value) =>
              updateField("operatingHours", value)
            }
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold"
        >
          <Save className="w-4 h-4" />
          Save Practice Settings
        </button>
      </div>
    </form>
  );
}


// ==============================
// DASHBOARD VIEW
// ==============================

function DashboardView({
  stats,
  appointments,
  invoices,
  weeklyChartData,
  onNavigate,
}) {
  const todayKey = formatDateKey(new Date());

  const todayAppointments = appointments
    .filter((appointment) => appointment.date === todayKey)
    .slice(0, 6);

  const recentInvoices = [...invoices]
    .slice(-5)
    .reverse();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900">
          Practice Dashboard
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          Operational overview for your dental practice.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Total Patients"
          value={stats.totalPatients}
          icon={<Users className="w-5 h-5" />}
          color="blue"
        />

        <MetricCard
          label="Today's Appointments"
          value={stats.todayCount}
          icon={<CalendarIcon className="w-5 h-5" />}
          color="indigo"
        />

        <MetricCard
          label="Collected"
          value={formatCurrency(stats.collectedToday)}
          icon={<IndianRupee className="w-5 h-5" />}
          color="emerald"
        />

        <MetricCard
          label="Low Stock"
          value={stats.lowStockCount}
          icon={<Package className="w-5 h-5" />}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-black text-slate-900">
                Appointment Activity
              </h3>

              <p className="text-xs text-slate-400 mt-1">
                Appointments recorded by weekday.
              </p>
            </div>

            <BarChart2 className="w-5 h-5 text-slate-400" />
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />

                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />

                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />

                <Tooltip />

                <Bar
                  dataKey="count"
                  fill="#2563eb"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-black text-slate-900">
                Today's Schedule
              </h3>

              <p className="text-xs text-slate-400 mt-1">
                {todayAppointments.length} appointment
                {todayAppointments.length === 1 ? "" : "s"}
              </p>
            </div>

            <button
              onClick={() => onNavigate("appointments")}
              className="text-xs font-bold text-blue-600"
            >
              View All
            </button>
          </div>

          {todayAppointments.length === 0 ? (
            <div className="py-10 text-center">
              <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">
                No appointments today.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="border border-slate-100 rounded-xl p-3"
                >
                  <div className="flex justify-between gap-3">
                    <p className="font-bold text-sm text-slate-800">
                      {appointment.patient}
                    </p>

                    <span className="text-[10px] font-black text-blue-600">
                      {appointment.time}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-1">
                    {appointment.procedure || "Consultation"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-black text-slate-900">
              Recent Billing
            </h3>

            <p className="text-xs text-slate-400 mt-1">
              Latest invoices and collection status.
            </p>
          </div>

          <button
            onClick={() => onNavigate("billing")}
            className="text-xs font-bold text-blue-600"
          >
            Billing
          </button>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">
            No billing records available.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="p-4 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="font-bold text-sm text-slate-800">
                    {invoice.patient || "Patient"}
                  </p>

                  <p className="text-xs text-slate-400 mt-1">
                    {invoice.customNo || invoice.id}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-black text-sm text-slate-900">
                    {formatCurrency(invoice.total)}
                  </p>

                  <span
                    className={`text-[10px] font-black uppercase ${
                      invoice.status === "Paid"
                        ? "text-emerald-600"
                        : "text-amber-600"
                    }`}
                  >
                    {invoice.status || "Unpaid"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


// ==============================
// REUSABLE METRIC CARD
// ==============================

function MetricCard({
  label,
  value,
  icon,
  color = "blue",
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">
            {label}
          </p>

          <p className="text-2xl font-black text-slate-900 mt-2">
            {value}
          </p>
        </div>

        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            colors[color] || colors.blue
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}


// ==============================
// FORM FIELD
// ==============================

function FormField({
  label,
  value,
  onChange,
  type = "text",
  textarea = false,
  required = false,
  placeholder = "",
}) {
  const common =
    "w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

  return (
    <label className="block">
      <span className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
        {label}
        {required && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </span>

      {textarea ? (
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          rows={4}
          className={common}
        />
      ) : (
        <input
          type={type}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={common}
        />
      )}
    </label>
  );
}