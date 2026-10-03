import React, { useState, useEffect, useMemo } from 'react';
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
  ExternalLink, 
  Lock, 
  UserCheck, 
  QrCode, 
  Sun, 
  Package, 
  Briefcase, 
  CheckCircle2, 
  Stethoscope, 
  ShieldAlert,
  Calendar
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';

import { auth, loginWithGoogle, logoutUser, db, getRedirectResult } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(val || 0);
};

const formatDateKey = (dateObj) => {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getDisplayDate = (dateObj) => {
  return dateObj.toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// 32 Adult FDI Dental Charting Definitions
const FDI_TEETH = {
  upper: [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
  lower: [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]
};

const TOOTH_CONDITIONS = {
  healthy: { label: 'Healthy', short: 'HLT', bg: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
  caries: { label: 'Caries', short: 'CAR', bg: 'bg-red-50 text-red-700 border-red-300' },
  restored: { label: 'Restored', short: 'RES', bg: 'bg-blue-50 text-blue-700 border-blue-300' },
  rct: { label: 'RCT Done', short: 'RCT', bg: 'bg-purple-50 text-purple-700 border-purple-300' },
  crown: { label: 'Crown', short: 'CRN', bg: 'bg-amber-50 text-amber-700 border-amber-300' },
  bridging: { label: 'Bridging (Under Crown)', short: 'BRG', bg: 'bg-indigo-50 text-indigo-700 border-indigo-300' },
  implanted: { label: 'Implanted', short: 'IMP', bg: 'bg-teal-50 text-teal-700 border-teal-300' },
  fractured: { label: 'Fractured (Trauma)', short: 'FRC', bg: 'bg-rose-100 text-rose-800 border-rose-400 font-bold' },
  spacing: { label: 'Spacing', short: 'SPC', bg: 'bg-cyan-50 text-cyan-700 border-cyan-300' },
  attrited: { label: 'Attrited', short: 'ATT', bg: 'bg-orange-50 text-orange-700 border-orange-300' },
  malaligned: { label: 'Malaligned (Under Ortho)', short: 'MAL', bg: 'bg-violet-50 text-violet-700 border-violet-300' },
  paramolar: { label: 'Paramolar', short: 'PRM', bg: 'bg-pink-50 text-pink-700 border-pink-300' },
  scaling: { label: 'Scaling (Calculus / Plaque)', short: 'SCL', bg: 'bg-yellow-50 text-yellow-800 border-yellow-300' },
  deformities: { label: 'Deformities', short: 'DEF', bg: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-300' },
  bone_deformation: { label: 'Bone Deformations', short: 'BNE', bg: 'bg-stone-100 text-stone-700 border-stone-400' },
  missing: { label: 'Missing / Extracted', short: 'MIS', bg: 'bg-slate-200 text-slate-600 border-slate-400' }
};

const DEFAULT_INVENTORY = [
  { id: 'STK-01', name: 'Composite Resin Syringes', category: 'Restorative', qty: 24, min: 10, unit: 'Syringes', status: 'In Stock' },
  { id: 'STK-02', name: 'Local Anesthesia Cartridges 2%', category: 'Surgical', qty: 6, min: 15, unit: 'Boxes', status: 'Low Stock' },
  { id: 'STK-03', name: 'Suture Kits 3-0', category: 'Surgical', qty: 18, min: 8, unit: 'Packs', status: 'In Stock' },
  { id: 'STK-04', name: 'Alginate Impression Material', category: 'Materials', qty: 12, min: 5, unit: 'Tins', status: 'In Stock' },
  { id: 'STK-05', name: 'Amoxicillin 500mg', category: 'Medications', qty: 85, min: 30, unit: 'Strips', status: 'In Stock' },
  { id: 'STK-06', name: 'Paracetamol 650mg', category: 'Medications', qty: 110, min: 40, unit: 'Strips', status: 'In Stock' }
];

const DEFAULT_STAFF = [
  { id: 'EMP-01', name: 'Clinical Specialist A', role: 'Radiology & Diagnosis Lead', phone: '+91 98401 00001', shift: 'Morning (09:00 - 14:00)', status: 'Active' },
  { id: 'EMP-02', name: 'Clinical Specialist B', role: 'Restorative & Surgical Lead', phone: '+91 98401 00002', shift: 'Evening (14:00 - 20:00)', status: 'Active' },
  { id: 'EMP-03', name: 'Operatory Coordinator', role: 'Inventory & Staff Supervisor', phone: '+91 98401 00003', shift: 'Full Day (09:00 - 18:00)', status: 'Active' },
  { id: 'EMP-04', name: 'Chairside Assistant', role: 'Operatory Sterilization', phone: '+91 98401 00004', shift: 'Full Day', status: 'Active' }
];

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [patients, setPatients] = useState([
    {
      id: 'PAT-101',
      customId: 'PAT-8492',
      name: 'Anandha Krishnan',
      phone: '+91 98765 43210',
      registeredDate: '02/10/2026',
      medicalHistory: {
        conditions: 'Type 2 Diabetes, Mild Hypertension',
        allergies: 'Penicillin (Severe Rash)'
      },
      radiologyReport: {
        traumaFindings: 'Enamel-dentin fracture involving 21 with pulp exposure.',
        impactionClass: '38: Horizontal Impaction (Class II Position B).',
        diagnosisNotes: 'Symptomatic irreversible pulpitis 21 secondary to trauma.',
        boneStatus: 'Localized vertical bone deformation in 46.'
      },
      opgScans: [
        {
          id: 'scan-1',
          title: 'Full Arch Digital OPG - Baseline',
          date: '02/10/2026',
          url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=80'
        }
      ],
      odontogram: {
        21: 'fractured',
        38: 'paramolar',
        46: 'rct',
        47: 'crown',
        36: 'bridging',
        16: 'implanted',
        31: 'scaling',
        11: 'spacing'
      },
      prescriptions: [
        { id: 'rx-1', medicine: 'Amoxicillin 500mg', dosage: '1 cap', frequency: '1-0-1', duration: '5 days', notes: 'After food' }
      ]
    }
  ]);

  const [appointments, setAppointments] = useState([
    {
      id: 'APT-1',
      date: formatDateKey(new Date()),
      time: '10:00 AM - 10:45 AM',
      duration: '45 min',
      patient: 'Anandha Krishnan',
      procedure: 'Trauma Evaluation & Root Canal',
      doctor: 'Attending Clinician',
      status: 'scheduled'
    }
  ]);

  const [invoices, setInvoices] = useState([
    {
      id: 'INV-101',
      customNo: 'INV-2026-892',
      patient: 'Anandha Krishnan',
      date: '02 Oct 2026',
      dueDate: '09 Oct 2026',
      insurance: {
        provider: 'National Health TPA',
        policyNo: 'NH-POL-98234',
        claimId: 'CLM-2026-4412',
        coverageAmt: 4500,
        claimStatus: 'Pre-Auth Approved'
      },
      items: [
        { id: 1, name: 'OPG Radiograph & Diagnostic Assessment', qty: 1, rate: 1500 },
        { id: 2, name: 'Emergency Trauma Procedure 21', qty: 1, rate: 4000 }
      ],
      total: 5500,
      status: 'Unpaid'
    }
  ]);

  const [inventory, setInventory] = useState(DEFAULT_INVENTORY);
  const [staffList, setStaffList] = useState(DEFAULT_STAFF);

  const [selectedDate, setSelectedDate] = useState(new Date());

  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [selectedPatientForDetails, setSelectedPatientForDetails] = useState(null);
  const [selectedInvoiceForUPI, setSelectedInvoiceForUPI] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (typeof getRedirectResult === 'function') {
      getRedirectResult(auth)
        .then((result) => {
          if (result?.user && isMounted) {
            setCurrentUser(result.user);
            setAuthLoading(false);
          }
        })
        .catch((err) => console.warn("Redirect check:", err.message));
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (isMounted) {
        setCurrentUser(user);
        setAuthLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!currentUser || !db) return;
    const uid = currentUser.uid;

    const unsubP = onSnapshot(collection(db, 'clinics', uid, 'patients'), (snap) => {
      if (!snap.empty) setPatients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn('Patients sync offline:', err.message));

    const unsubA = onSnapshot(collection(db, 'clinics', uid, 'appointments'), (snap) => {
      if (!snap.empty) setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn('Appts sync offline:', err.message));

    const unsubI = onSnapshot(collection(db, 'clinics', uid, 'invoices'), (snap) => {
      if (!snap.empty) setInvoices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn('Invoices sync offline:', err.message));

    return () => {
      unsubP();
      unsubA();
      unsubI();
    };
  }, [currentUser]);

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      await loginWithGoogle();
    } catch (err) {
      alert('Sign-In Notice: ' + err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setActiveTab('dashboard');
  };

  const handleDateShift = (days) => {
    setSelectedDate(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() + days);
      return next;
    });
  };

  const formattedSelectedDate = useMemo(() => formatDateKey(selectedDate), [selectedDate]);

  const dailyAppointments = useMemo(() => {
    return appointments.filter(a => a.date === formattedSelectedDate);
  }, [appointments, formattedSelectedDate]);

  const stats = useMemo(() => {
    const todayKey = formatDateKey(new Date());
    const totalPatients = patients.length;
    const todayCount = appointments.filter(a => a.date === todayKey).length;
    const collectedToday = invoices
      .filter(i => i.status === 'Paid')
      .reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    const lowStockCount = inventory.filter(i => i.qty <= i.min).length;

    return { totalPatients, todayCount, collectedToday, lowStockCount };
  }, [patients, appointments, invoices, inventory]);

  const weeklyChartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const map = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    appointments.forEach((appt) => {
      if (appt.date) {
        const d = new Date(appt.date);
        const dayName = days[d.getDay()];
        if (map[dayName] !== undefined) map[dayName] += 1;
      }
    });
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
      day,
      count: map[day]
    }));
  }, [appointments]);

  const cycleAppointmentStatus = async (id, currentStatus) => {
    const cycle = { scheduled: 'in_progress', in_progress: 'completed', completed: 'scheduled' };
    const nextStatus = cycle[currentStatus] || 'scheduled';
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: nextStatus } : a));

    if (currentUser && db) {
      try {
        await updateDoc(doc(db, 'clinics', currentUser.uid, 'appointments', id), {
          status: nextStatus
        });
      } catch (e) {
        console.warn('Status cached locally');
      }
    }
  };

  const handleUpdatePatientRecord = async (updatedPatient) => {
    setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
    setSelectedPatientForDetails(updatedPatient);

    if (currentUser && db) {
      try {
        await updateDoc(doc(db, 'clinics', currentUser.uid, 'patients', updatedPatient.id), {
          medicalHistory: updatedPatient.medicalHistory || {},
          radiologyReport: updatedPatient.radiologyReport || {},
          opgScans: updatedPatient.opgScans || [],
          odontogram: updatedPatient.odontogram || {},
          prescriptions: updatedPatient.prescriptions || []
        });
      } catch (e) {
        console.warn('Patient cached locally');
      }
    }
  };

  const handleDeletePatient = async (patientId, patientName) => {
    if (!window.confirm(`Delete chart for "${patientName}"?`)) return;
    setPatients(prev => prev.filter(p => p.id !== patientId));
    if (selectedPatientForDetails?.id === patientId) setSelectedPatientForDetails(null);

    if (currentUser && db) {
      try {
        await deleteDoc(doc(db, 'clinics', currentUser.uid, 'patients', patientId));
      } catch (err) {
        console.warn('Delete cached locally');
      }
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-300 font-sans p-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wide">Securing Operatory Platform...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex flex-col justify-center items-center p-4 font-sans selection:bg-blue-600">
        <div className="w-full max-w-sm sm:max-w-md bg-[#1e293b] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Meridian Dental</h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">Practice Operations & Clinical OS</p>
          </div>
          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm py-3.5 px-4 rounded-2xl transition duration-200 shadow-md flex items-center justify-center gap-3 cursor-pointer active:scale-98 disabled:opacity-50"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            {isLoggingIn ? "Authenticating..." : "Sign In with Google"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-slate-800 flex flex-col font-sans pb-24 sm:pb-8 antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Bar */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 focus:outline-none cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-black text-base sm:text-lg text-slate-900 tracking-tight">Meridian Dental</span>
        </div>
        
        <div className="relative w-40 sm:w-64 md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search records, teeth, bills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 pl-8 pr-3 py-1.5 rounded-xl text-xs focus:outline-blue-600 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 cursor-pointer"
          >
            <img 
              src={currentUser.photoURL || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&auto=format&fit=crop&q=80"} 
              alt="Profile" 
              className="w-8 h-8 rounded-full object-cover border border-slate-200"
            />
          </button>
          <button 
            onClick={handleLogout}
            className="hidden sm:flex p-2 text-slate-400 hover:text-red-500 rounded-lg transition cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-[#121927] text-slate-300 flex flex-col justify-between p-4 shadow-2xl z-10">
            <div>
              <div className="flex items-center justify-between pb-6 pt-2 px-2 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">Meridian Dental</h3>
                  <p className="text-[11px] text-blue-400 font-medium">Practice Management OS</p>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="mt-5 space-y-1.5">
                {[
                  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
                  { id: 'appointments', name: 'Appointments Diary', icon: CalendarIcon },
                  { id: 'patients', name: 'Patients & Odontogram', icon: Users },
                  { id: 'radiology', name: 'OPG & Diagnosis Studio', icon: Sun },
                  { id: 'billing', name: 'Dental Insurance & Invoices', icon: Receipt },
                  { id: 'inventory', name: 'Stock Maintenance', icon: Package },
                  { id: 'staff', name: 'Employee Roles & Roster', icon: Briefcase },
                  { id: 'profile', name: 'Practice Profile', icon: UserCheck },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer ${
                        isActive 
                          ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30' 
                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-800 px-2 flex items-center justify-between">
              <div className="truncate max-w-[170px]">
                <p className="text-xs font-semibold text-white truncate">{currentUser.displayName || 'Doctor'}</p>
                <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
              </div>
              <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-400 cursor-pointer">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main View Shell */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        {activeTab === 'dashboard' && (
          <DashboardView stats={stats} weeklyData={weeklyChartData} onSwitchTab={setActiveTab} />
        )}
        
        {activeTab === 'appointments' && (
          <AppointmentsView 
            appointments={dailyAppointments}
            selectedDate={selectedDate}
            onPrev={() => handleDateShift(-1)}
            onNext={() => handleDateShift(1)}
            onToday={() => setSelectedDate(new Date())}
            onToggleStatus={cycleAppointmentStatus}
            onOpenModal={() => setShowAppointmentModal(true)}
          />
        )}

        {activeTab === 'patients' && (
          <PatientsView 
            patients={patients}
            onOpenModal={() => setShowPatientModal(true)}
            onSelectPatient={(p) => setSelectedPatientForDetails(p)}
            onDeletePatient={handleDeletePatient}
          />
        )}

        {activeTab === 'radiology' && (
          <RadiologyDiagnosisView 
            patients={patients}
            onUpdatePatient={handleUpdatePatientRecord}
          />
        )}

        {activeTab === 'billing' && (
          <BillingView 
            invoices={invoices} 
            onOpenModal={() => setShowInvoiceModal(true)}
            onOpenUPI={(inv) => setSelectedInvoiceForUPI(inv)}
          />
        )}

        {activeTab === 'inventory' && (
          <StockInventoryView 
            inventory={inventory} 
            setInventory={setInventory} 
            onOpenModal={() => setShowAddStockModal(true)} 
          />
        )}

        {activeTab === 'staff' && (
          <StaffRolesView staffList={staffList} />
        )}

        {activeTab === 'profile' && (
          <FounderProfileView onSwitchTab={setActiveTab} onLogout={handleLogout} />
        )}
      </main>

      {/* Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 flex justify-around items-center py-2 z-40 sm:hidden shadow-lg">
        <button 
          onClick={() => setActiveTab('dashboard')} 
          className={`flex flex-col items-center gap-0.5 text-[9px] font-semibold ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-500'}`}
        >
          <LayoutDashboard className="w-4 h-4" /> Home
        </button>
        <button 
          onClick={() => setActiveTab('appointments')} 
          className={`flex flex-col items-center gap-0.5 text-[9px] font-semibold ${activeTab === 'appointments' ? 'text-blue-600' : 'text-slate-500'}`}
        >
          <CalendarIcon className="w-4 h-4" /> Diary
        </button>
        <button 
          onClick={() => setActiveTab('patients')} 
          className={`flex flex-col items-center gap-0.5 text-[9px] font-semibold ${activeTab === 'patients' ? 'text-blue-600' : 'text-slate-500'}`}
        >
          <Users className="w-4 h-4" /> Chart
        </button>
        <button 
          onClick={() => setActiveTab('radiology')} 
          className={`flex flex-col items-center gap-0.5 text-[9px] font-semibold ${activeTab === 'radiology' ? 'text-blue-600' : 'text-slate-500'}`}
        >
          <Sun className="w-4 h-4" /> OPG
        </button>
        <button 
          onClick={() => setActiveTab('billing')} 
          className={`flex flex-col items-center gap-0.5 text-[9px] font-semibold ${activeTab === 'billing' ? 'text-blue-600' : 'text-slate-500'}`}
        >
          <Receipt className="w-4 h-4" /> Bills
        </button>
      </nav>

      {/* MODALS */}
      {selectedPatientForDetails && (
        <PatientDetailsModal 
          patient={selectedPatientForDetails}
          onClose={() => setSelectedPatientForDetails(null)}
          onDeletePatient={handleDeletePatient}
          onUpdateRecord={handleUpdatePatientRecord}
        />
      )}

      {selectedInvoiceForUPI && (
        <UPIPaymentModal 
          invoice={selectedInvoiceForUPI}
          onClose={() => setSelectedInvoiceForUPI(null)}
        />
      )}

      {showAppointmentModal && (
        <NewAppointmentModal 
          currentDateKey={formattedSelectedDate}
          patients={patients}
          onSuccess={(appt) => setAppointments(prev => [appt, ...prev])}
          onClose={() => setShowAppointmentModal(false)}
        />
      )}

      {showPatientModal && (
        <NewPatientModal 
          onSuccess={(pat) => setPatients(prev => [pat, ...prev])}
          onClose={() => setShowPatientModal(false)}
        />
      )}

      {showInvoiceModal && (
        <CreateInsuranceInvoiceModal 
          patients={patients}
          onSuccess={(inv) => setInvoices(prev => [inv, ...prev])}
          onClose={() => setShowInvoiceModal(false)}
        />
      )}

      {showAddStockModal && (
        <AddStockItemModal 
          onAdd={(item) => setInventory(prev => [item, ...prev])}
          onClose={() => setShowAddStockModal(false)}
        />
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 1. DASHBOARD OVERVIEW
// -------------------------------------------------------------
function DashboardView({ stats, weeklyData, onSwitchTab }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Clinical Overview</h2>
          <p className="text-xs text-slate-400">Meridian Dental Clinical Workspace</p>
        </div>
        <button 
          onClick={() => onSwitchTab('appointments')}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
        >
          View Today's Diary &rsaquo;
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Patients</p>
            <p className="text-2xl font-bold text-slate-900">{stats.totalPatients}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Visits Today</p>
            <p className="text-2xl font-bold text-slate-900">{stats.todayCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Collected</p>
            <p className="text-lg sm:text-xl font-bold text-slate-900">{formatCurrency(stats.collectedToday)}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${stats.lowStockCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Low Stock Alerts</p>
            <p className="text-2xl font-bold text-slate-900">{stats.lowStockCount}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Weekly Patient Load</h3>
          <div className="h-48 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Operatory Quick Links</h3>
          <div className="space-y-2 text-xs">
            <button 
              onClick={() => onSwitchTab('radiology')}
              className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-white flex items-center justify-between transition cursor-pointer text-left"
            >
              <div>
                <p className="font-bold text-slate-900">OPG & Diagnosis Studio</p>
                <p className="text-[10px] text-slate-500">Trauma & Impaction Review</p>
              </div>
              <Sun className="w-4 h-4 text-blue-600" />
            </button>

            <button 
              onClick={() => onSwitchTab('inventory')}
              className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-white flex items-center justify-between transition cursor-pointer text-left"
            >
              <div>
                <p className="font-bold text-slate-900">Stock Maintenance</p>
                <p className="text-[10px] text-slate-500">Inventory & Consumables</p>
              </div>
              <Package className="w-4 h-4 text-emerald-600" />
            </button>

            <button 
              onClick={() => onSwitchTab('billing')}
              className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-white flex items-center justify-between transition cursor-pointer text-left"
            >
              <div>
                <p className="font-bold text-slate-900">Dental Insurance Invoices</p>
                <p className="text-[10px] text-slate-500">Claims & QR Billing</p>
              </div>
              <Receipt className="w-4 h-4 text-purple-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 2. APPOINTMENTS DIARY
// -------------------------------------------------------------
function AppointmentsView({ 
  appointments, 
  selectedDate, 
  onPrev, 
  onNext, 
  onToday, 
  onToggleStatus, 
  onOpenModal 
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Appointments Diary</h2>
        <button 
          onClick={onOpenModal}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Book Slot
        </button>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs text-center space-y-2.5">
        <div className="inline-flex items-center border border-slate-200 rounded-xl overflow-hidden text-xs">
          <button onClick={onPrev} className="px-3 py-1.5 hover:bg-slate-50 text-slate-600 border-r border-slate-200 cursor-pointer">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button onClick={onToday} className="px-4 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
            Today
          </button>
          <button onClick={onNext} className="px-3 py-1.5 hover:bg-slate-50 text-slate-600 border-l border-slate-200 cursor-pointer">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-sm font-bold text-slate-800 flex items-center justify-center gap-2">
          <CalendarIcon className="w-4 h-4 text-blue-600" /> {getDisplayDate(selectedDate)}
        </p>
      </div>

      <div className="space-y-3">
        {appointments.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-400 text-xs space-y-2">
            <Calendar className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
            <p className="font-semibold text-slate-600">No consultations scheduled for this date</p>
          </div>
        ) : (
          appointments.map((appt) => {
            const statusStyle = 
              appt.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              appt.status === 'in_progress' ? 'bg-amber-50 text-amber-700 border-amber-200' :
              'bg-slate-100 text-slate-600 border-slate-200';

            return (
              <div key={appt.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-900">{appt.time}</p>
                      <span className="text-[10px] text-slate-400">({appt.duration})</span>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-800 mt-0.5">{appt.patient}</h4>
                    <p className="text-xs text-slate-400">{appt.procedure}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <button 
                    onClick={() => onToggleStatus(appt.id, appt.status)}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border cursor-pointer capitalize transition active:scale-95 ${statusStyle}`}
                  >
                    {appt.status?.replace('_', ' ') || 'scheduled'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 3. PATIENTS & ODONTOGRAM DIRECTORY
// -------------------------------------------------------------
function PatientsView({ patients, onOpenModal, onSelectPatient, onDeletePatient }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Patient Records</h2>
          <p className="text-xs text-slate-400">FDI 32-Tooth Odontogram, Trauma, Rx & History</p>
        </div>
        <button 
          onClick={onOpenModal}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add Patient
        </button>
      </div>

      <div className="space-y-3">
        {patients.map((p) => {
          const toothCount = Object.keys(p.odontogram || {}).length;
          const hasTrauma = Object.values(p.odontogram || {}).includes('fractured');

          return (
            <div 
              key={p.id} 
              className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between transition hover:border-blue-400 group cursor-pointer"
              onClick={() => onSelectPatient(p)}
            >
              <div className="space-y-1 flex-1 pr-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">{p.name}</h4>
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-md">
                    {p.customId}
                  </span>
                  {hasTrauma && (
                    <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-md border border-rose-200">
                      Trauma Case
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">{p.phone} • Registered: {p.registeredDate}</p>
                <p className="text-[11px] text-slate-600">
                  <span className="font-semibold text-slate-700">Conditions:</span> {p.medicalHistory?.conditions || 'None reported'}
                </p>
              </div>

              <div className="text-right flex items-center gap-3">
                <div>
                  <span className="inline-block text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                    {toothCount} Teeth Charted
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">Open FDI Odontogram &rsaquo;</p>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePatient(p.id, p.name);
                  }}
                  className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 4. DEDICATED DIAGNOSIS & OPG WORKSTATION
// -------------------------------------------------------------
function RadiologyDiagnosisView({ patients, onUpdatePatient }) {
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');
  const [invertLight, setInvertLight] = useState(false);

  const currentPatient = patients.find(p => p.id === selectedPatientId) || patients[0];

  const [traumaNotes, setTraumaNotes] = useState(currentPatient?.radiologyReport?.traumaFindings || '');
  const [impactionNotes, setImpactionNotes] = useState(currentPatient?.radiologyReport?.impactionClass || '');
  const [diagnosisNotes, setDiagnosisNotes] = useState(currentPatient?.radiologyReport?.diagnosisNotes || '');
  const [boneNotes, setBoneNotes] = useState(currentPatient?.radiologyReport?.boneStatus || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (currentPatient) {
      setTraumaNotes(currentPatient.radiologyReport?.traumaFindings || '');
      setImpactionNotes(currentPatient.radiologyReport?.impactionClass || '');
      setDiagnosisNotes(currentPatient.radiologyReport?.diagnosisNotes || '');
      setBoneNotes(currentPatient.radiologyReport?.boneStatus || '');
    }
  }, [currentPatient]);

  const handleSaveReport = () => {
    if (!currentPatient) return;
    const updated = {
      ...currentPatient,
      radiologyReport: {
        opgDate: new Date().toLocaleDateString('en-IN'),
        traumaFindings: traumaNotes,
        impactionClass: impactionNotes,
        diagnosisNotes: diagnosisNotes,
        boneStatus: boneNotes
      }
    };
    onUpdatePatient(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const currentScan = currentPatient?.opgScans?.[0] || {
    url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=80',
    title: 'Baseline Panoramic OPG'
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            OPG & Diagnosis Studio
          </h2>
          <p className="text-xs text-slate-400">Side-by-Side Panoramic Radiograph & Clinical Findings Workstation</p>
        </div>

        <div className="w-full sm:w-64">
          <select 
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="w-full bg-white border border-slate-200 text-xs font-semibold rounded-xl p-2 focus:outline-blue-600"
          >
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.customId})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Pane: Lightbox */}
        <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-white">
            <div>
              <p className="text-xs font-bold">{currentScan.title}</p>
              <p className="text-[10px] text-slate-400">Patient: {currentPatient?.name}</p>
            </div>
            <button 
              onClick={() => setInvertLight(!invertLight)}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                invertLight ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              <Sun className="w-3.5 h-3.5" /> {invertLight ? 'Normal Light' : 'Invert Negative (X-Ray)'}
            </button>
          </div>

          <div className="h-64 sm:h-80 w-full overflow-hidden rounded-xl bg-black flex items-center justify-center border border-slate-800">
            <img 
              src={currentScan.url} 
              alt="OPG Radiograph" 
              style={{ filter: invertLight ? 'invert(1) contrast(1.5)' : 'contrast(1.1)' }}
              className="w-full h-full object-contain transition-all duration-300"
            />
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>High-Contrast Diagnostic View</span>
            <a href={currentScan.url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
              Full Resolution <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Right Pane: Diagnosis Formulation */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-blue-600" /> Diagnostic Entry Pane
            </h3>
            {savedSuccess && (
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Report Saved!
              </span>
            )}
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> Trauma Findings
              </label>
              <input 
                type="text" 
                placeholder="Crown fracture, luxation, alveolar ridge integrity..."
                value={traumaNotes}
                onChange={(e) => setTraumaNotes(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-blue-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Impaction Classification
              </label>
              <input 
                type="text" 
                placeholder="Angulation, depth, position relative to ramus..."
                value={impactionNotes}
                onChange={(e) => setImpactionNotes(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-blue-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Bone Deformations & Height
              </label>
              <input 
                type="text" 
                placeholder="Horizontal bone loss, angular crest defects, furcation..."
                value={boneNotes}
                onChange={(e) => setBoneNotes(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-blue-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Diagnosis & Treatment Plan (Type Next to OPG)
              </label>
              <textarea 
                rows={3}
                placeholder="Type formal clinical diagnosis and operative procedures here..."
                value={diagnosisNotes}
                onChange={(e) => setDiagnosisNotes(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-blue-600"
              />
            </div>

            <button 
              onClick={handleSaveReport}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Save Diagnostic Findings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 5. PATIENT DETAILS MODAL (16-STATUS DENTAL ODONTOGRAM)
// -------------------------------------------------------------
function PatientDetailsModal({ patient, onClose, onDeletePatient, onUpdateRecord }) {
  const [tab, setTab] = useState('chart');
  const [activeBrush, setActiveBrush] = useState('fractured');

  const applyToothStatus = (toothNum, status) => {
    const updated = { ...(patient.odontogram || {}) };
    if (status === 'healthy') {
      delete updated[toothNum];
    } else {
      updated[toothNum] = status;
    }
    onUpdateRecord({ ...patient, odontogram: updated });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-3xl p-5 sm:p-6 border border-slate-200 shadow-2xl space-y-4 my-6 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-lg">{patient.name}</h3>
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-semibold">{patient.customId}</span>
            </div>
            <p className="text-xs text-slate-400">{patient.phone}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'chart', label: '32-Tooth Odontogram' },
            { id: 'diagnosis', label: 'Diagnosis & Trauma' },
            { id: 'rx', label: 'Prescriptions' },
            { id: 'medical', label: 'Medical History' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                tab === t.id ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'chart' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase text-slate-700">
                  Clinical Odontogram Palette (Select Status, Then Tap Tooth)
                </h4>
                <span className="text-[10px] text-slate-400">Adult Upper & Lower FDI</span>
              </div>

              {/* Condition Brush Palette */}
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
                {Object.entries(TOOTH_CONDITIONS).map(([key, item]) => {
                  const isSelected = activeBrush === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveBrush(key)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-semibold border text-left truncate transition cursor-pointer ${item.bg} ${
                        isSelected ? 'ring-2 ring-blue-600 font-bold scale-102' : 'opacity-85 hover:opacity-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Upper Teeth Arch */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">Upper Arch (Maxillary)</span>
              <div className="grid grid-cols-8 sm:grid-cols-16 gap-1 text-center">
                {FDI_TEETH.upper.map(t => {
                  const status = patient.odontogram?.[t] || 'healthy';
                  const cond = TOOTH_CONDITIONS[status] || TOOTH_CONDITIONS.healthy;
                  return (
                    <button
                      key={t}
                      onClick={() => applyToothStatus(t, activeBrush)}
                      className={`p-1 rounded-xl border flex flex-col items-center justify-center transition active:scale-90 cursor-pointer shadow-2xs ${cond.bg}`}
                      title={`Tooth ${t}: ${cond.label}`}
                    >
                      <span className="text-[11px] font-bold">{t}</span>
                      <span className="text-[8px] truncate max-w-full font-semibold">{cond.short}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lower Teeth Arch */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">Lower Arch (Mandibular)</span>
              <div className="grid grid-cols-8 sm:grid-cols-16 gap-1 text-center">
                {FDI_TEETH.lower.map(t => {
                  const status = patient.odontogram?.[t] || 'healthy';
                  const cond = TOOTH_CONDITIONS[status] || TOOTH_CONDITIONS.healthy;
                  return (
                    <button
                      key={t}
                      onClick={() => applyToothStatus(t, activeBrush)}
                      className={`p-1 rounded-xl border flex flex-col items-center justify-center transition active:scale-90 cursor-pointer shadow-2xs ${cond.bg}`}
                      title={`Tooth ${t}: ${cond.label}`}
                    >
                      <span className="text-[11px] font-bold">{t}</span>
                      <span className="text-[8px] truncate max-w-full font-semibold">{cond.short}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chart Summary */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-700 block mb-1">Active Odontogram Findings:</span>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(patient.odontogram || {}).length === 0 ? (
                  <span className="text-slate-400 text-[11px]">All teeth charted healthy.</span>
                ) : (
                  Object.entries(patient.odontogram).map(([t, stat]) => (
                    <span key={t} className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${TOOTH_CONDITIONS[stat]?.bg || 'bg-slate-100'}`}>
                      Tooth {t}: {TOOTH_CONDITIONS[stat]?.label}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'diagnosis' && (
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider">Radiology & Diagnostic Record</h4>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div>
                <span className="font-bold text-rose-700">Trauma Evaluation:</span>
                <p className="text-slate-700 mt-0.5">{patient.radiologyReport?.traumaFindings || 'No acute trauma recorded.'}</p>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="font-bold text-indigo-700">Impaction Status:</span>
                <p className="text-slate-700 mt-0.5">{patient.radiologyReport?.impactionClass || 'None charted.'}</p>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-700">Bone Deformations:</span>
                <p className="text-slate-700 mt-0.5">{patient.radiologyReport?.boneStatus || 'Normal bone crest height.'}</p>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-700">Diagnosis Notes:</span>
                <p className="text-slate-700 mt-0.5">{patient.radiologyReport?.diagnosisNotes || 'No notes entered.'}</p>
              </div>
            </div>
          </div>
        )}

        {tab === 'rx' && (
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider">Prescriptions</h4>
            <div className="space-y-2">
              {patient.prescriptions?.map(rx => (
                <div key={rx.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                  <div>
                    <h5 className="font-bold text-slate-900">{rx.medicine} ({rx.dosage})</h5>
                    <p className="text-slate-500">{rx.frequency} • {rx.duration} • {rx.notes}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'medical' && (
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider">Systemic Screening</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-500 uppercase text-[10px]">Conditions</span>
                <p className="font-semibold text-slate-800">{patient.medicalHistory?.conditions || 'None'}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-xl border border-red-200">
                <span className="font-bold text-red-500 uppercase text-[10px]">Allergies</span>
                <p className="font-semibold text-red-800">{patient.medicalHistory?.allergies || 'NKDA'}</p>
              </div>
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
          <button 
            onClick={() => onDeletePatient(patient.id, patient.name)}
            className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete Chart
          </button>
          <button 
            onClick={onClose}
            className="text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 6. DENTAL INSURANCE & BILLING INVOICES
// -------------------------------------------------------------
function BillingView({ invoices, onOpenModal, onOpenUPI }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Dental Insurance & Invoices</h2>
          <p className="text-xs text-slate-400">Pre-Auth Claims, Co-pay & Instant UPI Billing</p>
        </div>
        <button 
          onClick={onOpenModal}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> New Insurance Invoice
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[650px]">
          <thead className="border-b border-slate-100 text-slate-500 font-semibold bg-slate-50/50">
            <tr>
              <th className="py-3 px-4">Invoice / Claim ID</th>
              <th className="py-3 px-4">Patient</th>
              <th className="py-3 px-4">Insurance Provider</th>
              <th className="py-3 px-4">Claim Status</th>
              <th className="py-3 px-4 text-right">Total (₹)</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50/60">
                <td className="py-3 px-4">
                  <p className="font-bold text-blue-600">{inv.customNo || inv.id}</p>
                  <p className="text-[10px] text-slate-400">Claim: {inv.insurance?.claimId || 'Direct Pay'}</p>
                </td>
                <td className="py-3 px-4 font-semibold text-slate-800">{inv.patient}</td>
                <td className="py-3 px-4 text-slate-600">{inv.insurance?.provider || 'Self-Paid'}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    inv.insurance?.claimStatus === 'Pre-Auth Approved' ? 'bg-indigo-50 text-indigo-700' :
                    inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {inv.insurance?.claimStatus || inv.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-bold text-slate-900">{formatCurrency(inv.total)}</td>
                <td className="py-3 px-4 text-right">
                  <button 
                    onClick={() => onOpenUPI(inv)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-[11px] cursor-pointer inline-flex items-center gap-1"
                  >
                    <QrCode className="w-3 h-3" /> UPI QR
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 7. STOCK MAINTENANCE & CONSUMABLES INVENTORY
// -------------------------------------------------------------
function StockInventoryView({ inventory, setInventory, onOpenModal }) {
  const handleAdjustStock = (id, delta) => {
    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.qty + delta);
        return {
          ...item,
          qty: newQty,
          status: newQty <= item.min ? 'Low Stock' : 'In Stock'
        };
      }
      return item;
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Stock Maintenance</h2>
          <p className="text-xs text-slate-400">Operatory Consumables, Materials & Medications</p>
        </div>
        <button 
          onClick={onOpenModal}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add Stock Item
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[600px]">
          <thead className="border-b border-slate-100 text-slate-500 font-semibold bg-slate-50/50">
            <tr>
              <th className="py-3 px-4">Item Name</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4 text-center">Quantity on Hand</th>
              <th className="py-3 px-4">Min. Threshold</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Quick Adjust</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {inventory.map(item => {
              const isLow = item.qty <= item.min;
              return (
                <tr key={item.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-bold text-slate-900">{item.name}</td>
                  <td className="py-3 px-4 text-slate-600">{item.category}</td>
                  <td className="py-3 px-4 text-center font-bold text-sm text-slate-800">
                    {item.qty} <span className="text-[10px] text-slate-400 font-normal">{item.unit}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{item.min} {item.unit}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isLow ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-1">
                    <button 
                      onClick={() => handleAdjustStock(item.id, -1)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-bold"
                    >
                      -1
                    </button>
                    <button 
                      onClick={() => handleAdjustStock(item.id, 5)}
                      className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded font-bold"
                    >
                      +5
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 8. EMPLOYEE ROLES & STAFF MANAGEMENT
// -------------------------------------------------------------
function StaffRolesView({ staffList }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Employee Roles & Roster</h2>
        <p className="text-xs text-slate-400">Operatory Staff Allocation & Duty Timings</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
        {staffList.map(emp => (
          <div key={emp.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">{emp.id}</span>
              <span className="text-[10px] text-emerald-700 font-bold">{emp.status}</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900">{emp.name}</h4>
            <p className="text-xs text-slate-500 font-semibold">{emp.role}</p>
            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
              <p><span className="font-bold">Shift:</span> {emp.shift}</p>
              <p><span className="font-bold">Contact:</span> {emp.phone}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 9. PRACTICE PROFILE
// -------------------------------------------------------------
function FounderProfileView({ onSwitchTab, onLogout }) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="h-36 bg-gradient-to-r from-[#0d2a4a] via-[#1a4a75] to-[#2563eb] p-4 flex flex-col justify-center text-white">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-200">MERIDIAN DENTAL CLINICAL OS</h4>
          <h2 className="text-xl sm:text-2xl font-black mt-0.5">PRACTICE OPERATIONS</h2>
          <p className="text-[11px] text-blue-100 mt-1">Multi-Operatory Practice Management & Diagnosis Platform</p>
        </div>

        <div className="px-5 pb-6 pt-0">
          <div className="flex justify-between items-end -mt-12 mb-3">
            <img 
              src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80" 
              alt="Profile" 
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md bg-white"
            />
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Meridian Dental Healthcare</h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">Coimbatore, Tamil Nadu, India</p>

            <div className="flex items-center gap-2 mt-4">
              <button 
                onClick={() => onSwitchTab('radiology')}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 rounded-full cursor-pointer text-center"
              >
                Open Diagnosis Studio
              </button>
              <button 
                onClick={onLogout}
                className="px-4 py-2 border border-slate-300 rounded-full text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 10. MODAL: DENTAL INSURANCE INVOICE
// -------------------------------------------------------------
function CreateInsuranceInvoiceModal({ patients, onSuccess, onClose }) {
  const [patient, setPatient] = useState(patients[0]?.name || '');
  const [provider, setProvider] = useState('Star Health Dental Care');
  const [policyNo, setPolicyNo] = useState('POL-');
  const [claimId, setClaimId] = useState(`CLM-${Date.now().toString().slice(-6)}`);
  const [procedureName, setProcedureName] = useState('Trauma Rehabilitation & Restoration');
  const [amount, setAmount] = useState(5500);

  const handleSubmit = (e) => {
    e.preventDefault();
    const inv = {
      id: `INV-${Date.now()}`,
      customNo: `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      patient,
      date: new Date().toLocaleDateString('en-IN'),
      dueDate: new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-IN'),
      insurance: {
        provider,
        policyNo,
        claimId,
        claimStatus: 'Pre-Auth Approved',
        coverageAmt: Number(amount)
      },
      items: [{ id: 1, name: procedureName, qty: 1, rate: Number(amount) }],
      total: Number(amount),
      status: 'Unpaid'
    };
    onSuccess(inv);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-6 border border-slate-200 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-base">New Dental Insurance Invoice</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Patient</label>
            <select 
              value={patient} 
              onChange={(e) => setPatient(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-800 bg-white"
            >
              {patients.map(p => (
                <option key={p.id} value={p.name}>{p.name} ({p.customId})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Insurance Provider</label>
            <input 
              type="text" 
              value={provider} 
              onChange={(e) => setProvider(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Policy Number</label>
              <input 
                type="text" 
                value={policyNo} 
                onChange={(e) => setPolicyNo(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Claim ID</label>
              <input 
                type="text" 
                value={claimId} 
                onChange={(e) => setClaimId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Procedure</label>
            <input 
              type="text" 
              value={procedureName} 
              onChange={(e) => setProcedureName(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Amount (₹)</label>
            <input 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5"
            />
          </div>
          <button 
            type="submit" 
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-xs mt-2 cursor-pointer"
          >
            Create Insurance Invoice
          </button>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 11. MODAL: REGISTER PATIENT
// -------------------------------------------------------------
function NewPatientModal({ onSuccess, onClose }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [conditions, setConditions] = useState('');
  const [allergies, setAllergies] = useState('NKDA');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSuccess({
      id: `PAT-${Date.now()}`,
      customId: `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
      name: name.trim(),
      phone: phone.trim(),
      registeredDate: new Date().toLocaleDateString('en-IN'),
      medicalHistory: {
        conditions: conditions.trim() || 'None reported',
        allergies: allergies.trim() || 'NKDA'
      },
      radiologyReport: {},
      opgScans: [],
      odontogram: {},
      prescriptions: []
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-6 border border-slate-200 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-base">Register Patient Record</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
            <input 
              type="text" 
              required
              placeholder="e.g. Ramesh Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-blue-600"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Phone Number (+91)</label>
            <input 
              type="text" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-blue-600"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Medical Conditions</label>
            <input 
              type="text" 
              placeholder="e.g. Diabetes, Hypertension"
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-blue-600"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Drug Allergies</label>
            <input 
              type="text" 
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-blue-600"
            />
          </div>
          <button 
            type="submit" 
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-xs mt-2 cursor-pointer"
          >
            Create Patient Chart
          </button>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 12. MODAL: ADD STOCK ITEM
// -------------------------------------------------------------
function AddStockItemModal({ onAdd, onClose }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Restorative');
  const [qty, setQty] = useState(10);
  const [min, setMin] = useState(5);
  const [unit, setUnit] = useState('Boxes');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAdd({
      id: `STK-${Date.now().toString().slice(-4)}`,
      name,
      category,
      qty: Number(qty),
      min: Number(min),
      unit,
      status: Number(qty) <= Number(min) ? 'Low Stock' : 'In Stock'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-5 sm:p-6 border border-slate-200 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-base">Add Stock Item</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Item Description</label>
            <input 
              type="text" 
              required
              placeholder="e.g. Eugenol Liquid 15ml"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Category</label>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5 bg-white"
            >
              <option>Restorative</option>
              <option>Surgical</option>
              <option>Materials</option>
              <option>Medications</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Quantity</label>
              <input 
                type="number" 
                value={qty} 
                onChange={(e) => setQty(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Min Threshold</label>
              <input 
                type="number" 
                value={min} 
                onChange={(e) => setMin(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5"
              />
            </div>
          </div>
          <button 
            type="submit" 
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-xs mt-2 cursor-pointer"
          >
            Save Stock
          </button>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 13. MODAL: APPOINTMENT BOOKING
// -------------------------------------------------------------
function NewAppointmentModal({ currentDateKey, patients, onSuccess, onClose }) {
  const [patient, setPatient] = useState(patients[0]?.name || '');
  const [time, setTime] = useState('11:00 AM - 11:45 AM');
  const [duration, setDuration] = useState('45 min');
  const [procedure, setProcedure] = useState('Crown Preparation');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSuccess({
      id: `APT-${Date.now()}`,
      date: currentDateKey,
      time,
      duration,
      patient,
      procedure,
      status: 'scheduled'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-5 sm:p-6 border border-slate-200 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-base">Schedule Consultation</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Patient</label>
            <select 
              value={patient} 
              onChange={(e) => setPatient(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5 bg-white"
            >
              {patients.map(p => (
                <option key={p.id} value={p.name}>{p.name} ({p.customId})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Time Slot</label>
            <input 
              type="text" 
              value={time} 
              onChange={(e) => setTime(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Procedure</label>
            <input 
              type="text" 
              value={procedure} 
              onChange={(e) => setProcedure(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5"
            />
          </div>
          <button 
            type="submit" 
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-xs mt-2 cursor-pointer"
          >
            Confirm Slot
          </button>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 14. MODAL: UPI PAYMENT QR
// -------------------------------------------------------------
function UPIPaymentModal({ invoice, onClose }) {
  const upiId = "meridiandental@upi";
  const upiUrl = `upi://pay?pa=${upiId}&pn=Meridian%20Dental&am=${invoice.total}&cu=INR&tn=Invoice%20${invoice.customNo || invoice.id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUrl)}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 border border-slate-200 shadow-2xl text-center space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <h3 className="font-bold text-slate-900 text-sm">Instant UPI Payment QR</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-slate-400" /></button>
        </div>

        <div>
          <p className="text-xs text-slate-400">Scan via GPay / PhonePe / Paytm</p>
          <h2 className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(invoice.total)}</h2>
          <p className="text-[11px] text-blue-600 font-semibold">{invoice.patient} • {invoice.customNo || invoice.id}</p>
        </div>

        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-inner">
          <img src={qrCodeUrl} alt="UPI QR Code" className="w-44 h-44 mx-auto rounded-lg" />
        </div>

        <p className="text-[10px] text-slate-400 font-medium">VPA: {upiId}</p>

        <button 
          onClick={onClose}
          className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
}