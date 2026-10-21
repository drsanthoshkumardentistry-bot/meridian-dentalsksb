/* ==============================================================================
 * MERIDENT OS - ADVANCED CLINICAL PRODUCTION SUITE & LANDING
 * File: src/App.jsx
 * ============================================================================== */

import React, { useState, useEffect, useRef } from "react";
import {
  Menu,
  X,
  Search,
  Plus,
  Trash2,
  Share2,
  Upload,
  Calendar,
  Users,
  Sun,
  DollarSign,
  Package,
  Briefcase,
  UserCheck,
  Send,
  CheckCircle2,
  ShieldCheck,
  QrCode,
  Ruler,
  User,
  LogOut,
  Activity,
  ArrowRight,
  MessageCircle,
  TrendingUp,
  BarChart3,
  Lock,
  Cloud,
  FileText,
  AlertTriangle,
  Clock
} from "lucide-react";

import * as FirebaseModule from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore";
import LandingPage from "./components/landingpage";

const auth = FirebaseModule.auth;
const db = FirebaseModule.db;
const firebaseConfigured = Boolean(auth && FirebaseModule.firebaseConfigured !== false);
const loginWithGoogle = FirebaseModule.loginWithGoogle || (async () => {});
const logoutUser = FirebaseModule.logoutUser || (async () => {});

// --- DENTITION SCHEMAS (FDI TWO-DIGIT SYSTEM) ---
const PERMANENT_UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const PERMANENT_LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
const DECIDUOUS_UPPER = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
const DECIDUOUS_LOWER = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];

const CLINICAL_PALETTE = [
  { id: "HLT", label: "Healthy", border: "border-emerald-300", bg: "bg-emerald-50/60", text: "text-emerald-700" },
  { id: "CAR", label: "Caries", border: "border-rose-200", bg: "bg-rose-50/60", text: "text-rose-600" },
  { id: "RES", label: "Restored", border: "border-sky-200", bg: "bg-sky-50/60", text: "text-sky-600" },
  { id: "RCT", label: "RCT Done", border: "border-purple-200", bg: "bg-purple-50/60", text: "text-purple-600" },
  { id: "CRW", label: "Crown", border: "border-amber-200", bg: "bg-amber-50/60", text: "text-amber-600" },
  { id: "IMP", label: "Implanted", border: "border-teal-200", bg: "bg-teal-50/60", text: "text-teal-600" },
  { id: "FRC", label: "Fractured (Trauma)", border: "border-rose-400 ring-2 ring-rose-200", bg: "bg-rose-50", text: "text-rose-700" },
  { id: "MIS", label: "Missing / Extracted", border: "border-slate-300", bg: "bg-slate-100", text: "text-slate-600" },
];

const PRESET_MEDICATIONS = [
  { name: "Zerodol-SP", generic: "Aceclofenac 100mg + Paracetamol 325mg", frequency: "1-0-1", duration: "3 Days", timing: "After Food" },
  { name: "Moxikind-CV 625", generic: "Amoxicillin 500mg + Clavulanic Acid 125mg", frequency: "1-0-1", duration: "5 Days", timing: "After Food" },
  { name: "Ketorol-DT", generic: "Ketorolac Tromethamine 10mg", frequency: "SOS", duration: "2 Days", timing: "Dissolve in half cup water" },
  { name: "Rexidin 0.2%", generic: "Chlorhexidine Mouthwash 0.2% w/v", frequency: "1-0-1", duration: "7 Days", timing: "10ml rinse after brushing" },
];

export default function App() {
  const CLINIC_ID = "meridian_main_clinic";

  const [viewMode, setViewMode] = useState("landing");
  const [authUser, setAuthUser] = useState(null);
  const [isApproved, setIsApproved] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);

  const checkUserApproval = async (user) => {
    if (!db) return true;
    try {
      const userRef = doc(db, "clinics", CLINIC_ID, "authorized_users", user.email);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: user.email,
          name: user.displayName || "Staff/Doctor",
          approved: false,
          createdAt: serverTimestamp()
        });
        return false;
      }
      return userSnap.data().approved === true;
    } catch (err) {
      console.warn("Approval check error:", err);
      return false;
    }
  };

  useEffect(() => {
    if (!firebaseConfigured || !auth) {
      setAuthLoading(false);
      return undefined;
    }
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (user) {
          setAuthUser(user);
          const approvedStatus = await checkUserApproval(user);
          setIsApproved(approvedStatus);
          if (approvedStatus) {
            setViewMode("dashboard");
          }
        } else {
          setAuthUser(null);
          setIsApproved(false);
        }
        setAuthLoading(false);
        setAuthError("");
      },
      (error) => {
        console.error("Auth error:", error);
        setAuthError("Could not verify login session.");
        setAuthLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  const handleGoogleLogin = async () => {
    setAuthError("");
    setLoginBusy(true);
    try {
      const user = await loginWithGoogle();
      const approvedStatus = await checkUserApproval(user);
      setIsApproved(approvedStatus);
      if (approvedStatus) {
        setViewMode("dashboard");
      }
    } catch (error) {
      setAuthError(error?.message || "Google sign-in failed.");
    } finally {
      setLoginBusy(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setAuthUser(null);
      setIsApproved(false);
      setViewMode("landing");
    } catch (error) {
      console.error(error);
    }
  };

  const [activeNav, setActiveNav] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState(null);

  // --- PERSISTENT DATA STORES ---
  const [patients, setPatients] = useState(() => {
    try {
      const stored = localStorage.getItem("meridian_patients");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [appointments, setAppointments] = useState(() => {
    try {
      const stored = localStorage.getItem("meridian_appointments");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [invoices, setInvoices] = useState(() => {
    try {
      const stored = localStorage.getItem("meridian_invoices");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [inventory, setInventory] = useState(() => {
    try {
      const stored = localStorage.getItem("meridian_inventory");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [practiceProfile, setPracticeProfile] = useState(() => {
    try {
      const stored = localStorage.getItem("meridian_profile");
      return stored ? JSON.parse(stored) : {
        name: "MeriDent Clinic",
        tagline: "Advanced Dental Care & Implant Center",
        regNumber: "UDYAM-TN-04-0139569",
        drName: "Dr. Santhoshkumar S / Dr. Sivasabari G",
        qualification: "BDS, Dental Surgery",
        phone: "9043205927",
        email: "dr.santhoshkumardentistry@gmail.com",
        upiId: "meridianclinic@upi",
        address: "Coimbatore, Tamil Nadu, India"
      };
    } catch {
      return {
        name: "MeriDent Clinic",
        tagline: "Advanced Dental Care & Implant Center",
        regNumber: "UDYAM-TN-04-0139569",
        drName: "Dr. Santhoshkumar S / Dr. Sivasabari G",
        qualification: "BDS, Dental Surgery",
        phone: "9043205927",
        email: "dr.santhoshkumardentistry@gmail.com",
        upiId: "meridianclinic@upi",
        address: "Coimbatore, Tamil Nadu, India"
      };
    }
  });

  useEffect(() => {
    localStorage.setItem("meridian_patients", JSON.stringify(patients));
  }, [patients]);
  useEffect(() => {
    localStorage.setItem("meridian_appointments", JSON.stringify(appointments));
  }, [appointments]);
  useEffect(() => {
    localStorage.setItem("meridian_invoices", JSON.stringify(invoices));
  }, [invoices]);
  useEffect(() => {
    localStorage.setItem("meridian_inventory", JSON.stringify(inventory));
  }, [inventory]);
  useEffect(() => {
    localStorage.setItem("meridian_profile", JSON.stringify(practiceProfile));
  }, [practiceProfile]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState("Dental Chart & Treatment Plans");

  const [newPatientForm, setNewPatientForm] = useState({
    name: "",
    phone: "",
    age: "",
    gender: "Male",
    area: "",
    bloodGroup: "O+",
    email: "",
    address: "",
    conditions: "None reported",
    allergies: "NKDA",
    medicalAlert: "",
    recallStatus: true
  });

  const [isDeciduousOverride, setIsDeciduousOverride] = useState(null);
  const [activePaletteStatus, setActivePaletteStatus] = useState("FRC");

  const [treatmentPlans, setTreatmentPlans] = useState([]);
  const [newPlanForm, setNewPlanForm] = useState({
    tooth: "18",
    name: "CROWN LENGTHENING",
    diagnosis: "Reversible pulpitis",
    price: "1500"
  });

  const [rgvReports, setRgvReports] = useState([]);
  const [newRgvNote, setNewRgvNote] = useState("");

  const [isAddApptOpen, setIsAddApptOpen] = useState(false);
  const [newApptForm, setNewApptForm] = useState({
    mobile: "",
    patientName: "",
    age: "",
    doctor: "Dr. Santhoshkumar S",
    date: new Date().toISOString().split("T")[0],
    time: "10:00 AM",
    amPm: "AM",
    duration: "15 Mins",
    chair: "Chair 1 (Main Operatory)",
    complaint: ""
  });
  const [apptMobileDropdownOpen, setApptMobileDropdownOpen] = useState(false);

  const activePatient = patients.find((p) => p.id === selectedPatientId) || null;

  const isDeciduousMode = () => {
    if (isDeciduousOverride !== null) return isDeciduousOverride;
    const ageNum = parseInt(activePatient?.age, 10);
    if (!isNaN(ageNum) && ageNum < 12) return true;
    return false;
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    if (!newPatientForm.name.trim() || !newPatientForm.phone.trim()) {
      showToast("Please provide Patient Name and Phone Number");
      return;
    }
    const created = {
      id: "P-" + Date.now().toString().slice(-5),
      ...newPatientForm,
      registeredDate: new Date().toLocaleDateString("en-IN"),
      toothConditions: {},
      prescriptions: [],
      referrals: [],
    };

    setPatients([created, ...patients]);
    setNewPatientForm({
      name: "",
      phone: "",
      age: "",
      gender: "Male",
      area: "",
      bloodGroup: "O+",
      email: "",
      address: "",
      conditions: "None reported",
      allergies: "NKDA",
      medicalAlert: "",
      recallStatus: true
    });
    setIsAddPatientOpen(false);
    setSelectedPatientId(created.id);
    setIsDeciduousOverride(null);
    setIsChartModalOpen(true);
    showToast(`Patient ${created.name} registered successfully`);
  };

  const handleToothTap = (toothNumber) => {
    if (!activePatient) return;
    const currentConditions = { ...(activePatient.toothConditions || {}) };
    if (currentConditions[toothNumber] === activePaletteStatus) {
      delete currentConditions[toothNumber];
    } else {
      currentConditions[toothNumber] = activePaletteStatus;
    }
    setPatients((prev) =>
      prev.map((p) => (p.id === activePatient.id ? { ...p, toothConditions: currentConditions } : p))
    );
  };

  const addTreatmentPlan = (e) => {
    e.preventDefault();
    const tp = {
      id: "TP-" + Date.now().toString().slice(-4),
      tooth: newPlanForm.tooth,
      stage: "Treatment Plans",
      name: newPlanForm.name,
      diagnosis: newPlanForm.diagnosis,
      price: newPlanForm.price,
      qty: 1,
      doctor: "Dr. Santhoshkumar S",
      date: new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })
    };
    setTreatmentPlans([tp, ...treatmentPlans]);
    showToast("Treatment plan added successfully");
  };

  const movePlanStage = (id, nextStage) => {
    setTreatmentPlans(prev => prev.map(item => item.id === id ? { ...item, stage: nextStage } : item));
    showToast(`Moved treatment to ${nextStage}`);
  };

  const deletePlan = (id) => {
    setTreatmentPlans(prev => prev.filter(item => item.id !== id));
    showToast("Treatment plan removed");
  };

  const handleCreateAppointment = (e) => {
    e.preventDefault();
    if (!newApptForm.patientName.trim() || !newApptForm.mobile.trim()) {
      showToast("Patient Name and Mobile Number are required");
      return;
    }
    const appt = {
      id: "APT-" + Date.now().toString().slice(-4),
      patientName: newApptForm.patientName,
      phone: newApptForm.mobile,
      age: newApptForm.age,
      date: newApptForm.date,
      time: `${newApptForm.time} ${newApptForm.amPm}`,
      chair: newApptForm.chair,
      procedure: newApptForm.complaint || "Routine Consultation",
      status: "Confirmed",
      recallStatus: true
    };
    setAppointments([appt, ...appointments]);
    setIsAddApptOpen(false);
    setNewApptForm({ mobile: "", patientName: "", age: "", doctor: "Dr. Santhoshkumar S", date: new Date().toISOString().split("T")[0], time: "10:00 AM", amPm: "AM", duration: "15 Mins", chair: "Chair 1 (Main Operatory)", complaint: "" });
    showToast(`Appointment booked for ${appt.patientName}`);
  };

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone.includes(searchQuery)
  );

  const todayKey = new Date().toLocaleDateString("en-IN");
  const todayAppointments = appointments.filter((a) => a.date === todayKey).length;
  const lowStockCount = inventory.filter((item) => item.status === "Low Stock" || Number(item.quantity) <= Number(item.minThreshold)).length;
  const totalBilledRevenue = invoices.reduce((sum, inv) => sum + Number(inv.rawAmount || 0), 0);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0b1329] flex items-center justify-center p-6 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-cyan-300/30 border-t-cyan-300" />
          <p className="text-sm text-slate-300">Checking your MeriDent OS session…</p>
        </div>
      </div>
    );
  }

  // --- PENDING APPROVAL GATE SCREEN ---
  if (authUser && !isApproved) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-950 to-indigo-950/60" />
        <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 font-bold">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">Authorization Gate</span>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">Approval Pending</h1>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Your Google account (<strong className="text-white">{authUser.email}</strong>) has been registered. Access to the MeriDent OS clinical suite requires approval from the platform administrator.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-3 text-xs font-semibold text-white transition hover:bg-slate-700 cursor-pointer"
          >
            <LogOut className="h-4 w-4" /> Sign Out / Switch Account
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: PROFESSIONAL LANDING PAGE
  // =========================================================================
  if (viewMode === "landing" || !authUser) {
    return (
      <div>
        <LandingPage 
          onLoginClick={authUser && isApproved ? () => setViewMode("dashboard") : handleGoogleLogin} 
        />
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: FULL CLINICAL DASHBOARD SUITE
  // =========================================================================
  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800 font-sans overflow-hidden">
      
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#0b1329] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 text-xs border border-slate-700 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* --- SIDEBAR --- */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0b1329] text-white flex flex-col justify-between transition-transform duration-300 md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          <div className="p-5 flex items-center justify-between border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-8 h-8 rounded-lg object-cover" 
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div>
                <div className="text-base font-bold text-white tracking-wide">
                  MeriDent
                </div>
                <div className="text-[11px] text-slate-400 font-normal">
                  Practice Management OS
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("landing")}
                title="Back to Landing Page"
                className="text-xs text-blue-400 hover:text-white px-2 py-1 rounded bg-slate-800 cursor-pointer"
              >
                Home
              </button>
              <button
                onClick={() => setSidebarOpen(false)}
                className="md:hidden text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <nav className="p-3 space-y-1">
            {[
              { label: "Dashboard", icon: <Menu className="w-4 h-4" /> },
              { label: "Appointments Diary", icon: <Calendar className="w-4 h-4" /> },
              { label: "Patients & Odontogram", icon: <Users className="w-4 h-4" /> },
              { label: "OPG & Diagnosis Studio", icon: <Sun className="w-4 h-4" /> },
              { label: "Dental Insurance & Invoices", icon: <DollarSign className="w-4 h-4" /> },
              { label: "Stock Maintenance", icon: <Package className="w-4 h-4" /> },
              { label: "Employee Roles & Roster", icon: <Briefcase className="w-4 h-4" /> },
              { label: "Practice Profile", icon: <UserCheck className="w-4 h-4" /> },
            ].map((item) => {
              const isActive = activeNav === item.label;
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    setActiveNav(item.label);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#1d4ed8] text-white shadow-sm"
                      : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800/80">
          <div className="flex items-center gap-3 min-w-0">
            {authUser?.photoURL ? (
              <img src={authUser.photoURL} alt="Avatar" className="h-9 w-9 rounded-full border border-slate-600 object-cover" />
            ) : (
              <div className="h-9 w-9 shrink-0 rounded-full bg-cyan-400/15 text-cyan-300 flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-white">{authUser?.displayName || "Dr. Santhoshkumar S"}</div>
              <div className="truncate text-[11px] text-slate-400">{authUser?.email}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-rose-500/10 hover:text-rose-200 cursor-pointer"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* --- WORKSPACE --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-slate-600 hover:text-slate-900"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2.5">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-7 h-7 rounded-lg object-cover" 
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div className="text-lg font-bold text-slate-900">MeriDent</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block w-72 md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search records, teeth, bills..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <button 
              onClick={() => setIsAddApptOpen(true)}
              className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Appointment
            </button>
            <button 
              onClick={() => setViewMode("landing")}
              className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-300 cursor-pointer"
            >
              View Landing Page
            </button>
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
              S
            </div>
          </div>
        </header>

        <main className="p-6 md:p-8 max-w-7xl mx-auto w-full">
          
          {/* TAB 1: PATIENTS & ODONTOGRAM */}
          {activeNav === "Patients & Odontogram" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Patient Records</h1>
                  <p className="text-xs text-slate-500">U-Shaped Arch Odontogram, Staged Treatment Plans & RGV Reports</p>
                </div>
                <button
                  onClick={() => setIsAddPatientOpen(true)}
                  className="px-4 py-2 bg-[#1d4ed8] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Patient
                </button>
              </div>

              {filteredPatients.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">No Patient Records Yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Click "Add Patient" to register a clinical case sheet with comprehensive biodata and U-shaped dental charting.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPatients.map((p) => {
                    const chartedCount = Object.keys(p.toothConditions || {}).length;
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedPatientId(p.id);
                          setIsDeciduousOverride(null);
                          setIsChartModalOpen(true);
                        }}
                        className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between cursor-pointer hover:border-blue-300 transition-all"
                      >
                        <div>
                          <div className="text-base font-bold text-slate-900 flex items-center gap-2">
                            {p.name}
                            <span className="text-xs font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                              Age: {p.age || "N/A"} Yrs
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">({p.gender} | Blood: {p.bloodGroup || "O+"})</span>
                            {p.medicalAlert && (
                              <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200">
                                ALERT: {p.medicalAlert}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            {p.phone} • Email: {p.email || "N/A"} • Area: {p.area || "Coimbatore"}
                          </div>
                        </div>

                        <div className="text-right flex items-center gap-4">
                          <div>
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                              {chartedCount} Teeth Charted
                            </span>
                            <div className="text-[11px] text-slate-400 mt-1">Open Casesheet →</div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Remove record for ${p.name}?`)) {
                                setPatients(patients.filter((x) => x.id !== p.id));
                                showToast(`Removed ${p.name}`);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: APPOINTMENTS DIARY */}
          {activeNav === "Appointments Diary" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Appointments Diary</h1>
                  <p className="text-xs text-slate-500">Chair-side scheduling & consultation calendar</p>
                </div>
                <button
                  onClick={() => setIsAddApptOpen(true)}
                  className="px-4 py-2 bg-[#1d4ed8] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add New Appointment
                </button>
              </div>

              {appointments.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
                  <Calendar className="w-10 h-10 text-blue-600 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-800">No Appointments Scheduled</h3>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">Patient / Mobile</th>
                        <th className="p-3.5">Date & Time</th>
                        <th className="p-3.5">Doctor</th>
                        <th className="p-3.5">Patient Complaint</th>
                        <th className="p-3.5 text-center">Re-Call Status</th>
                        <th className="p-3.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {appointments.map((appt) => (
                        <tr key={appt.id} className="hover:bg-slate-50/60">
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900">{appt.patientName}</div>
                            <div className="text-[10px] text-slate-400">{appt.phone}</div>
                          </td>
                          <td className="p-3.5 font-medium">{appt.date} at <strong>{appt.time}</strong></td>
                          <td className="p-3.5 text-slate-600">{appt.chair}</td>
                          <td className="p-3.5 font-semibold text-blue-700">{appt.procedure}</td>
                          <td className="p-3.5 text-center">
                            <input 
                              type="checkbox" 
                              defaultChecked={appt.recallStatus} 
                              className="rounded text-blue-600 cursor-pointer" 
                            />
                          </td>
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => setAppointments(appointments.filter((x) => x.id !== appt.id))}
                              className="p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 8: DASHBOARD OVERVIEW */}
          {activeNav === "Dashboard" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">Clinical Overview</h1>
                  <p className="text-xs text-slate-500 mt-1">MeriDent Dental Clinical Workspace</p>
                </div>
                <button onClick={() => setActiveNav("Appointments Diary")} className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer">
                  View Today's Diary ›
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                  { title: "Patients", value: patients.length, icon: <Users className="w-5 h-5" />, tone: "bg-blue-50 text-blue-600" },
                  { title: "Visits Today", value: todayAppointments, icon: <Calendar className="w-5 h-5" />, tone: "bg-indigo-50 text-indigo-600" },
                  { title: "Collected", value: `₹${totalBilledRevenue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`, icon: <DollarSign className="w-5 h-5" />, tone: "bg-emerald-50 text-emerald-600" },
                  { title: "Low Stock Alerts", value: lowStockCount, icon: <Package className="w-5 h-5" />, tone: "bg-amber-50 text-amber-600" },
                ].map((card) => (
                  <div key={card.title} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-slate-500">{card.title}</div>
                      <div className="text-2xl font-bold text-slate-900 mt-1">{card.value}</div>
                    </div>
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.tone}`}>{card.icon}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ======================================================== */}
      {/* PATIENT CASESHEET MODAL (WITH U-SHAPED ARCH ODONTOGRAM)  */}
      {/* ======================================================== */}
      {isChartModalOpen && activePatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl p-6 md:p-7 relative max-h-[94vh] flex flex-col justify-between overflow-y-auto">
            
            <div>
              <div className="flex items-start justify-between pb-3 border-b border-slate-100 mb-4">
                <div>
                  <div className="text-xl font-bold text-slate-900 flex items-center gap-3">
                    {activePatient.name}
                    <span className="text-xs font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                      Age: {activePatient.age || "N/A"} Yrs ({activePatient.gender || "Female"} | Blood: {activePatient.bloodGroup || "O+"})
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{activePatient.phone} • Email: {activePatient.email || "N/A"} • Area: {activePatient.area || "Coimbatore"}</div>
                </div>

                <button onClick={() => setIsChartModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {[
                  "Dental Chart & Treatment Plans",
                  "RGV Reports & Notes",
                  "Systemic & Medical History"
                ].map((tab) => {
                  const isActive = activeModalTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveModalTab(tab)}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                        isActive ? "bg-[#1d4ed8] text-white shadow-sm font-semibold" : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>

              {/* TAB 1: DENTAL CHART & TREATMENT PLANS (U-Shaped Arch Odontogram + 3 Stage Columns) */}
              {activeModalTab === "Dental Chart & Treatment Plans" && (
                <div className="space-y-6">
                  
                  {/* U-SHAPED ARCH ODONTOGRAM CONTAINER (Matching 77388.jpg) */}
                  <div className="bg-gradient-to-b from-slate-950 via-[#0b1329] to-slate-950 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                        U-Shaped Arch Odontogram (FDI 32 / 20 Mapping)
                      </span>
                      <button
                        onClick={() => setIsDeciduousOverride(isDeciduousOverride === null ? !isDeciduousMode() : !isDeciduousOverride)}
                        className="px-3 py-1 rounded-md text-[11px] font-bold bg-blue-900/60 text-cyan-300 border border-blue-700/50 cursor-pointer"
                      >
                        {isDeciduousMode() ? "Switch to Adult (32)" : "Switch to Deciduous (20)"}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-1.5 pt-2">
                      {CLINICAL_PALETTE.map((item) => {
                        const isSelected = activePaletteStatus === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setActivePaletteStatus(item.id)}
                            className={`px-2 py-1.5 rounded-lg text-[11px] text-left truncate font-medium border transition-all cursor-pointer ${item.border} ${item.bg} ${item.text} ${
                              isSelected ? "ring-2 ring-cyan-400 font-bold scale-[1.02]" : "hover:opacity-90"
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Maxillary Upper U-Arch */}
                    <div className="pt-3">
                      <div className="text-[10px] font-bold tracking-widest text-cyan-300 uppercase text-center mb-2">MAXILLARY UPPER ARCH</div>
                      <div className="max-w-xl mx-auto px-6 py-4 rounded-t-[6rem] border-t-2 border-x-2 border-cyan-500/40 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center gap-1.5 sm:gap-2 flex-wrap">
                        {(isDeciduousMode() ? DECIDUOUS_UPPER : PERMANENT_UPPER).map((num, idx, arr) => {
                          const code = activePatient.toothConditions?.[num];
                          const found = CLINICAL_PALETTE.find((p) => p.id === code);
                          const mid = arr.length / 2;
                          const offsetClass = Math.abs(idx - mid + 0.5) > 4 ? "translate-y-3" : Math.abs(idx - mid + 0.5) > 2 ? "translate-y-1.5" : "translate-y-0";
                          return (
                            <button
                              key={num}
                              onClick={() => handleToothTap(num)}
                              className={`w-9 h-11 sm:w-10 sm:h-12 rounded-xl border flex flex-col items-center justify-center transition-all bg-white shadow-sm transform ${offsetClass} hover:scale-110 hover:z-10 cursor-pointer ${
                                found ? `${found.border}${found.bg}` : "border-emerald-400 text-emerald-800"
                              }`}
                            >
                              <span className="text-[11px] sm:text-xs font-black text-slate-900">{num}</span>
                              <span className={`text-[8px] sm:text-[9px] font-bold ${found ? found.text : "text-emerald-700"}`}>
                                {code || "HLT"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Occlusal Plane Divider */}
                    <div className="relative flex items-center justify-center my-1">
                      <div className="w-2/3 h-[1px] bg-cyan-500/30"></div>
                      <span className="absolute px-3 bg-[#0b1329] text-[9px] font-mono tracking-widest text-slate-400 uppercase">
                        MIDLINE
                      </span>
                    </div>

                    {/* Mandibular Lower U-Arch */}
                    <div className="pb-2">
                      <div className="max-w-xl mx-auto px-6 py-4 rounded-b-[6rem] border-b-2 border-x-2 border-cyan-500/40 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center gap-1.5 sm:gap-2 flex-wrap">
                        {(isDeciduousMode() ? DECIDUOUS_LOWER : PERMANENT_LOWER).map((num, idx, arr) => {
                          const code = activePatient.toothConditions?.[num];
                          const found = CLINICAL_PALETTE.find((p) => p.id === code);
                          const mid = arr.length / 2;
                          const offsetClass = Math.abs(idx - mid + 0.5) > 4 ? "-translate-y-3" : Math.abs(idx - mid + 0.5) > 2 ? "-translate-y-1.5" : "translate-y-0";
                          return (
                            <button
                              key={num}
                              onClick={() => handleToothTap(num)}
                              className={`w-9 h-11 sm:w-10 sm:h-12 rounded-xl border flex flex-col items-center justify-center transition-all bg-white shadow-sm transform ${offsetClass} hover:scale-110 hover:z-10 cursor-pointer ${
                                found ? `${found.border}${found.bg}` : "border-emerald-400 text-emerald-800"
                              }`}
                            >
                              <span className="text-[11px] sm:text-xs font-black text-slate-900">{num}</span>
                              <span className={`text-[8px] sm:text-[9px] font-bold ${found ? found.text : "text-emerald-700"}`}>
                                {code || "HLT"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="text-[10px] font-bold tracking-widest text-cyan-300 uppercase text-center mt-3">MANDIBULAR LOWER ARCH</div>
                    </div>
                  </div>

                  {/* Add Staged Treatment Plan Form */}
                  <form onSubmit={addTreatmentPlan} className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-end gap-3 text-xs shadow-xs">
                    <div>
                      <label className="font-bold text-slate-600 block mb-1">Tooth #</label>
                      <input
                        type="text"
                        value={newPlanForm.tooth}
                        onChange={(e) => setNewPlanForm({...newPlanForm, tooth: e.target.value})}
                        className="w-16 px-3 py-1.5 bg-slate-50 border rounded-lg font-bold"
                      />
                    </div>
                    <div className="flex-1 min-w-[180px]">
                      <label className="font-bold text-slate-600 block mb-1">Treatment Name</label>
                      <input
                        type="text"
                        value={newPlanForm.name}
                        onChange={(e) => setNewPlanForm({...newPlanForm, name: e.target.value})}
                        className="w-full px-3 py-1.5 bg-slate-50 border rounded-lg font-bold"
                      />
                    </div>
                    <div className="w-40">
                      <label className="font-bold text-slate-600 block mb-1">Diagnosis Suggestion</label>
                      <input
                        type="text"
                        value={newPlanForm.diagnosis}
                        onChange={(e) => setNewPlanForm({...newPlanForm, diagnosis: e.target.value})}
                        className="w-full px-3 py-1.5 bg-slate-50 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-600 block mb-1">Price (₹)</label>
                      <input
                        type="number"
                        value={newPlanForm.price}
                        onChange={(e) => setNewPlanForm({...newPlanForm, price: e.target.value})}
                        className="w-24 px-3 py-1.5 bg-slate-50 border rounded-lg font-bold"
                      />
                    </div>
                    <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 cursor-pointer">
                      + Add Treatment Plan
                    </button>
                  </form>

                  {/* 3 Columns: Treatment Plans | In Progress | Completed */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* Column 1: Treatment Plans */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">Treatment Plans</span>
                        <span className="text-xs font-bold text-slate-500">{treatmentPlans.filter(x => x.stage === "Treatment Plans").length}</span>
                      </div>
                      <div className="space-y-3">
                        {treatmentPlans.filter(x => x.stage === "Treatment Plans").map(tp => (
                          <div key={tp.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2 text-xs">
                            <div className="flex justify-between text-[11px] text-slate-400">
                              <span>{tp.date}</span>
                              <span className="font-mono font-bold text-blue-600">Tooth #{tp.tooth}</span>
                            </div>
                            <div className="font-bold text-slate-900">{tp.name}</div>
                            <div className="text-slate-500">Diagnosis: <strong className="text-slate-700">{tp.diagnosis}</strong></div>
                            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                              <span className="font-black text-slate-900">₹{tp.price}</span>
                              <span className="text-slate-600">Dr. {tp.doctor}</span>
                            </div>
                            <div className="pt-2 flex gap-2">
                              <button onClick={() => movePlanStage(tp.id, "In Progress")} className="flex-1 py-1 bg-blue-50 text-blue-700 font-bold rounded hover:bg-blue-100 cursor-pointer">Move to In Progress →</button>
                              <button onClick={() => deletePlan(tp.id)} className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"><Trash2 className="w-4 h-4"/></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Column 2: In Progress */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">In Progress</span>
                        <span className="text-xs font-bold text-slate-500">{treatmentPlans.filter(x => x.stage === "In Progress").length}</span>
                      </div>
                      <div className="space-y-3">
                        {treatmentPlans.filter(x => x.stage === "In Progress").map(tp => (
                          <div key={tp.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2 text-xs">
                            <div className="flex justify-between text-[11px] text-slate-400">
                              <span>{tp.date}</span>
                              <span className="font-mono font-bold text-blue-600">Tooth #{tp.tooth}</span>
                            </div>
                            <div className="font-bold text-slate-900">{tp.name}</div>
                            <div className="text-slate-500">Diagnosis: <strong className="text-slate-700">{tp.diagnosis}</strong></div>
                            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                              <span className="font-black text-slate-900">₹{tp.price}</span>
                              <span className="text-slate-600">Dr. {tp.doctor}</span>
                            </div>
                            <div className="pt-2 flex gap-2">
                              <button onClick={() => movePlanStage(tp.id, "Completed")} className="flex-1 py-1 bg-emerald-600 text-white font-bold rounded hover:bg-emerald-700 cursor-pointer">Mark as Completed ✓</button>
                              <button onClick={() => deletePlan(tp.id)} className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"><Trash2 className="w-4 h-4"/></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Column 3: Completed */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">Completed</span>
                        <span className="text-xs font-bold text-slate-500">{treatmentPlans.filter(x => x.stage === "Completed").length}</span>
                      </div>
                      <div className="space-y-3">
                        {treatmentPlans.filter(x => x.stage === "Completed").map(tp => (
                          <div key={tp.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2 text-xs opacity-90">
                            <div className="flex justify-between text-[11px] text-slate-400">
                              <span>{tp.date}</span>
                              <span className="font-mono font-bold text-emerald-600">Tooth #{tp.tooth}</span>
                            </div>
                            <div className="font-bold text-slate-900">{tp.name}</div>
                            <div className="text-slate-500">Diagnosis: <strong className="text-slate-700">{tp.diagnosis}</strong></div>
                            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                              <span className="font-black text-slate-900">₹{tp.price}</span>
                              <span className="text-emerald-700 font-bold">Completed</span>
                            </div>
                            <div className="pt-2">
                              <button onClick={() => deletePlan(tp.id)} className="w-full py-1 bg-rose-50 text-rose-600 font-bold rounded hover:bg-rose-100 cursor-pointer">Delete Treatment Record</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 2: RGV REPORTS & NOTES */}
              {activeModalTab === "RGV Reports & Notes" && (
                <div className="space-y-4 text-xs">
                  <h3 className="font-bold text-slate-900 uppercase">RGV Radiograph Reports & Clinical Notes</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {rgvReports.map((r) => (
                      <div key={r.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-center">
                        <div className="h-28 bg-slate-900 rounded-lg flex items-center justify-center text-cyan-400 font-mono text-xs">
                          [ X-Ray Film ]
                        </div>
                        <div className="font-bold text-slate-900">{r.title}</div>
                        <div className="text-[10px] text-slate-500">{r.note}</div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 flex gap-2">
                    <input
                      type="text"
                      placeholder="Add diagnostic RGV note..."
                      value={newRgvNote}
                      onChange={(e) => setNewRgvNote(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg"
                    />
                    <button
                      onClick={() => {
                        if(!newRgvNote.trim()) return;
                        setRgvReports([...rgvReports, { id: Date.now(), title: "Uploaded Scan", note: newRgvNote, date: "Today" }]);
                        setNewRgvNote("");
                        showToast("RGV Note saved");
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold cursor-pointer"
                    >
                      Save Note
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: SYSTEMIC & MEDICAL HISTORY */}
              {activeModalTab === "Systemic & Medical History" && (
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-600" />
                      <div>
                        <div className="font-bold text-rose-900">Systemic Alert: Diabetic & Hypertensive Screening</div>
                        <div className="text-[11px] text-rose-700">Enables automated warning flags before surgical extractions or local anesthesia.</div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {["Diabetic", "Cardiac Disease", "Asthma", "Thyroid", "Bleeding Diathesis", "Epilepsy"].map(cond => (
                      <label key={cond} className="p-3 rounded-xl border bg-slate-50 flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded text-blue-600" />
                        <span className="font-semibold text-slate-700">{cond}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

            </div>

            <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete chart for ${activePatient.name}?`)) {
                    setPatients(patients.filter((p) => p.id !== activePatient.id));
                    setIsChartModalOpen(false);
                    showToast("Patient chart deleted");
                  }
                }}
                className="text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Chart
              </button>

              <button
                type="button"
                onClick={() => setIsChartModalOpen(false)}
                className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
              >
                Close Window
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- ADD PATIENT MODAL (WITH COMPLETE BIODATA) --- */}
      {isAddPatientOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <form
            onSubmit={handleCreatePatient}
            className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4 shadow-xl text-xs max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Add New Patient (Biodata & Medical History)</h3>
              <button type="button" onClick={() => setIsAddPatientOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={newPatientForm.name}
                onChange={(e) => setNewPatientForm({ ...newPatientForm, name: e.target.value })}
                placeholder="e.g. Harshad M"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Age (Years) *</label>
                <input
                  type="number"
                  required
                  value={newPatientForm.age}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, age: e.target.value })}
                  placeholder="e.g. 35"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Gender</label>
                <select
                  value={newPatientForm.gender}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, gender: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none bg-white"
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Pediatric</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">WhatsApp Phone *</label>
                <input
                  type="tel"
                  required
                  value={newPatientForm.phone}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, phone: e.target.value })}
                  placeholder="9995960143"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Blood Group</label>
                <select
                  value={newPatientForm.bloodGroup}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, bloodGroup: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none bg-white"
                >
                  <option>O+</option>
                  <option>O-</option>
                  <option>A+</option>
                  <option>A-</option>
                  <option>B+</option>
                  <option>B-</option>
                  <option>AB+</option>
                  <option>AB-</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Email Address</label>
                <input
                  type="email"
                  value={newPatientForm.email}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, email: e.target.value })}
                  placeholder="patient@gmail.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Area / Locality</label>
                <input
                  type="text"
                  value={newPatientForm.area}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, area: e.target.value })}
                  placeholder="e.g. Kozhikode / Coimbatore"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Residential Address</label>
              <input
                type="text"
                value={newPatientForm.address}
                onChange={(e) => setNewPatientForm({ ...newPatientForm, address: e.target.value })}
                placeholder="Door No, Street Name, City"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-rose-600 mb-1">Medical Alert (e.g. Diabetic)</label>
              <input
                type="text"
                value={newPatientForm.medicalAlert}
                onChange={(e) => setNewPatientForm({ ...newPatientForm, medicalAlert: e.target.value })}
                placeholder="e.g. Diabetic / Hypertensive / Allergic to Penicillin"
                className="w-full px-3 py-2 border border-rose-200 bg-rose-50/40 rounded-lg text-rose-800 font-medium focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button type="button" onClick={() => setIsAddPatientOpen(false)} className="px-3 py-1.5 rounded-lg border text-slate-600 cursor-pointer">Cancel</button>
              <button type="submit" className="px-4 py-1.5 rounded-lg bg-[#1d4ed8] text-white font-semibold cursor-pointer">Register & Open Casesheet</button>
            </div>
          </form>
        </div>
      )}

      {/* --- ADD APPOINTMENT MODAL --- */}
      {isAddApptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <form
            onSubmit={handleCreateAppointment}
            className="bg-white rounded-3xl border border-slate-200 w-full max-w-lg p-6 space-y-4 shadow-2xl text-xs"
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add New Appointment</h3>
              <button type="button" onClick={() => setIsAddApptOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={newApptForm.mobile}
                  onChange={(e) => setNewApptForm({ ...newApptForm, mobile: e.target.value })}
                  placeholder="Enter mobile number"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Patient Name *</label>
                <input
                  type="text"
                  required
                  value={newApptForm.patientName}
                  onChange={(e) => setNewApptForm({ ...newApptForm, patientName: e.target.value })}
                  placeholder="Enter patient name"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Age</label>
                <input
                  type="number"
                  value={newApptForm.age}
                  onChange={(e) => setNewApptForm({ ...newApptForm, age: e.target.value })}
                  placeholder="Enter patient age"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Doctor</label>
                <select
                  value={newApptForm.doctor}
                  onChange={(e) => setNewApptForm({ ...newApptForm, doctor: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-800 bg-white focus:outline-none"
                >
                  <option>Dr. Santhoshkumar S</option>
                  <option>Dr. Sivasabari G</option>
                  <option>Dr. Arjun</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Date & Time Slot</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={newApptForm.date}
                    onChange={(e) => setNewApptForm({ ...newApptForm, date: e.target.value })}
                    className="flex-1 px-3 py-2.5 border border-slate-300 rounded-xl text-slate-800 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={newApptForm.time}
                    onChange={(e) => setNewApptForm({ ...newApptForm, time: e.target.value })}
                    className="w-24 px-3 py-2.5 border border-slate-300 rounded-xl text-slate-800 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Duration</label>
                <select
                  value={newApptForm.duration}
                  onChange={(e) => setNewApptForm({ ...newApptForm, duration: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-800 bg-white focus:outline-none"
                >
                  <option>15 mins</option>
                  <option>30 mins</option>
                  <option>45 mins</option>
                  <option>60 mins</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Patient Complaint / Procedure</label>
              <input
                type="text"
                value={newApptForm.complaint}
                onChange={(e) => setNewApptForm({ ...newApptForm, complaint: e.target.value })}
                placeholder="Search & Select or type complaint..."
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-800 focus:outline-none"
              />
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddApptOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-bold shadow-md cursor-pointer"
              >
                Save Appointment
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}