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
  TrendingUp, 
  Search, 
  UserCheck, 
  ShieldCheck, 
  Eye, 
  BarChart2, 
  ExternalLink,
  MoreHorizontal,
  Edit3,
  CheckCircle,
  Briefcase
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  CartesianGrid 
} from 'recharts';

import { auth, loginWithGoogle, logoutUser, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  updateDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';

// --- JAVASCRIPT HELPERS ---
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
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

const DEFAULT_PATIENTS = [
  { id: 'PAT-1001', customId: 'PAT-1001', name: 'Sophia Reynolds', phone: '+91 98451 22341', registeredDate: '10/09/2026' },
  { id: 'PAT-1002', customId: 'PAT-1002', name: 'Marcus Vance', phone: '+91 98765 43210', registeredDate: '12/09/2026' },
  { id: 'PAT-1003', customId: 'PAT-1003', name: 'Aria Sharma', phone: '+91 97112 34567', registeredDate: '13/09/2026' },
];

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Primary Collections with Persistent Local Storage Fallback
  const [patients, setPatients] = useState(() => {
    const saved = localStorage.getItem('md_patients');
    return saved ? JSON.parse(saved) : DEFAULT_PATIENTS;
  });

  const [appointments, setAppointments] = useState(() => {
    const today = formatDateKey(new Date());
    const saved = localStorage.getItem('md_appointments');
    return saved ? JSON.parse(saved) : [
      { id: 'APT-1', date: today, time: '9:00 AM - 10:00 AM', duration: '60 min', patient: 'Sophia Reynolds', procedure: 'Root Canal', doctor: 'Dr. Sarah Jenkins', status: 'completed' },
      { id: 'APT-2', date: today, time: '10:30 AM - 11:15 AM', duration: '45 min', patient: 'Marcus Vance', procedure: 'Whitening', doctor: 'Dr. Arthur Meridian', status: 'completed' },
      { id: 'APT-3', date: today, time: '11:45 AM - 12:15 PM', duration: '30 min', patient: 'Aria Sharma', procedure: 'Orthodontics', doctor: 'Dr. Sarah Jenkins', status: 'in_progress' },
      { id: 'APT-4', date: today, time: '2:00 PM - 3:00 PM', duration: '60 min', patient: 'David Miller', procedure: 'Crown', doctor: 'Dr. Arthur Meridian', status: 'scheduled' },
    ];
  });

  const [invoices, setInvoices] = useState(() => {
    const saved = localStorage.getItem('md_invoices');
    return saved ? JSON.parse(saved) : [
      { id: 'INV-2026-001', customNo: 'INV-2025-001', patient: 'Sophia Reynolds', date: 'Sep 10, 2025', dueDate: 'Sep 20, 2025', total: 12980, status: 'Paid' },
      { id: 'INV-2026-002', customNo: 'INV-2025-002', patient: 'Marcus Vance', date: 'Sep 12, 2025', dueDate: 'Sep 22, 2025', total: 10620, status: 'Unpaid' },
    ];
  });

  // Calendar Navigator Date
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Modals
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('md_patients', JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem('md_appointments', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('md_invoices', JSON.stringify(invoices));
  }, [invoices]);

  // Firebase Auth Listener
  useEffect(() => {
    try {
      const unsub = onAuthStateChanged(auth, (user) => {
        if (user) {
          setCurrentUser(user);
        }
      });
      return () => unsub();
    } catch (e) {
      console.warn("Firebase Auth initializing in offline fallback mode");
    }
  }, []);

  // Firebase Realtime Sync (if authenticated)
  useEffect(() => {
    if (!currentUser || !db) return;
    const uid = currentUser.uid;

    try {
      const unsubP = onSnapshot(collection(db, 'clinics', uid, 'patients'), (snap) => {
        if (!snap.empty) setPatients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      const unsubA = onSnapshot(collection(db, 'clinics', uid, 'appointments'), (snap) => {
        if (!snap.empty) setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      const unsubI = onSnapshot(collection(db, 'clinics', uid, 'invoices'), (snap) => {
        if (!snap.empty) setInvoices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => { unsubP(); unsubA(); unsubI(); };
    } catch (err) {
      console.warn('Realtime cloud subscription fallback to local cache:', err);
    }
  }, [currentUser]);

  // Calendar shifts
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

  // Live filtered records
  const filteredAppointments = useMemo(() => {
    if (!searchQuery.trim()) return dailyAppointments;
    const q = searchQuery.toLowerCase();
    return dailyAppointments.filter(a => 
      a.patient?.toLowerCase().includes(q) || 
      a.procedure?.toLowerCase().includes(q)
    );
  }, [dailyAppointments, searchQuery]);

  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const q = searchQuery.toLowerCase();
    return patients.filter(p => 
      p.name?.toLowerCase().includes(q) || 
      p.phone?.includes(q)
    );
  }, [patients, searchQuery]);

  // Dynamic Metrics
  const stats = useMemo(() => {
    const todayKey = formatDateKey(new Date());
    const totalPatients = patients.length;
    const todayCount = appointments.filter(a => a.date === todayKey).length;
    const collectedToday = invoices
      .filter(i => i.status === 'Paid')
      .reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    const outstanding = invoices
      .filter(i => i.status === 'Unpaid')
      .reduce((sum, item) => sum + (Number(item.total) || 0), 0);

    return { totalPatients, todayCount, collectedToday, outstanding };
  }, [patients, appointments, invoices]);

  // Cycle status
  const cycleAppointmentStatus = async (id, currentStatus) => {
    const cycle = {
      scheduled: 'in_progress',
      in_progress: 'completed',
      completed: 'scheduled'
    };
    const nextStatus = cycle[currentStatus] || 'scheduled';

    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: nextStatus } : a));

    if (currentUser && db) {
      try {
        await updateDoc(doc(db, 'clinics', currentUser.uid, 'appointments', id), {
          status: nextStatus
        });
      } catch (e) {
        console.warn('Updated locally (Cloud sync skipped)');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-800 flex flex-col font-sans antialiased">
      {/* Top Navbar */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 focus:outline-none cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-base text-slate-900 tracking-tight hidden sm:inline">Meridian Dental</span>
        </div>
        
        {/* Dynamic Search */}
        <div className="relative w-44 sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 pl-8 pr-3 py-1.5 rounded-xl text-xs focus:outline-blue-600 focus:bg-white transition"
          />
        </div>

        {/* User Identity / Tab Toggle */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'profile' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-slate-100 text-slate-700'
            }`}
          >
            <img 
              src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&auto=format&fit=crop&q=80" 
              alt="Profile" 
              className="w-6 h-6 rounded-full object-cover border border-slate-200"
            />
            <span className="hidden md:inline">SanthoshKumar S</span>
          </button>
        </div>
      </header>

      {/* Drawer Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-64 max-w-[80vw] bg-[#121927] text-slate-300 flex flex-col justify-between p-4 shadow-2xl z-10">
            <div>
              <div className="flex items-center justify-between pb-6 pt-2 px-2 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Meridian Dental</h3>
                  <p className="text-[11px] text-blue-400 font-medium">SaaS Cloud Workspace</p>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="mt-6 space-y-1.5">
                {[
                  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
                  { id: 'appointments', name: 'Appointments', icon: CalendarIcon },
                  { id: 'patients', name: 'Patients', icon: Users },
                  { id: 'billing', name: 'Billing', icon: Receipt },
                  { id: 'profile', name: 'Founder Profile', icon: UserCheck },
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
                      className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition cursor-pointer ${
                        isActive 
                          ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30' 
                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-800 px-2 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-white">SanthoshKumar S</p>
                <p className="text-[10px] text-slate-400">Sri Ramakrishna Dental</p>
              </div>
              <button 
                onClick={() => {
                  if (currentUser) logoutUser();
                  setSidebarOpen(false);
                }}
                className="p-2 text-slate-400 hover:text-red-400 rounded-lg transition cursor-pointer"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Body */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {activeTab === 'dashboard' && <DashboardView stats={stats} />}
        {activeTab === 'appointments' && (
          <AppointmentsView 
            appointments={filteredAppointments}
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
            patients={filteredPatients}
            onOpenModal={() => setShowPatientModal(true)}
          />
        )}
        {activeTab === 'billing' && (
          <BillingView 
            invoices={invoices}
            onOpenModal={() => setShowInvoiceModal(true)}
          />
        )}
        {activeTab === 'profile' && <FounderProfileView onSwitchTab={setActiveTab} />}
      </main>

      {/* Interactive Modals */}
      {showAppointmentModal && (
        <NewAppointmentModal 
          uid={currentUser?.uid}
          currentDateKey={formattedSelectedDate}
          patients={patients}
          onSuccess={(appt) => setAppointments(prev => [appt, ...prev])}
          onClose={() => setShowAppointmentModal(false)}
        />
      )}

      {showPatientModal && (
        <NewPatientModal 
          uid={currentUser?.uid}
          onSuccess={(pat) => setPatients(prev => [pat, ...prev])}
          onClose={() => setShowPatientModal(false)}
        />
      )}

      {showInvoiceModal && (
        <CreateInvoiceModal 
          uid={currentUser?.uid}
          patients={patients}
          onSuccess={(inv) => setInvoices(prev => [inv, ...prev])}
          onClose={() => setShowInvoiceModal(false)}
        />
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 1. FOUNDER LINKEDIN-STYLE PROFILE VIEW (Exact match to uploaded UI)
// -------------------------------------------------------------
function FounderProfileView({ onSwitchTab }) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        {/* Banner Graphic */}
        <div className="relative h-36 sm:h-44 bg-linear-to-r from-[#0d2a4a] via-[#1a4a75] to-[#2563eb] overflow-hidden p-4 flex flex-col justify-center text-white">
          <div className="relative z-10 max-w-[85%]">
            <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-blue-200">
              INNOVATION AT THE INTERSECTION OF
            </h4>
            <h2 className="text-lg sm:text-2xl font-black tracking-tight leading-tight mt-0.5">
              DENTAL SURGERY & HEALTHTECH
            </h2>
            <p className="text-[10px] sm:text-xs text-blue-100 font-medium mt-1">
              Clinical Strategy | Healthcare Operations | Cloud SaaS
            </p>
          </div>
          <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white cursor-pointer backdrop-blur-xs">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Profile Card Header */}
        <div className="px-5 pb-6 relative pt-0">
          {/* Avatar */}
          <div className="flex justify-between items-end -mt-14 mb-3">
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80" 
                alt="SanthoshKumar S" 
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white shadow-md bg-white"
              />
            </div>
            <button className="p-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 cursor-pointer">
              <Edit3 className="w-4 h-4" />
            </button>
          </div>

          {/* Info Details */}
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">SanthoshKumar S</h1>
              <ShieldCheck className="w-4 h-4 text-slate-500 fill-slate-100" />
              <span className="text-xs text-slate-400 font-medium">He/Him</span>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 font-normal leading-snug mt-1.5">
              BDS Student at Sri Ramakrishna Dental College | Exploring the Intersection of Dental Surgery & Technology
            </p>

            <p className="text-xs text-slate-500 mt-2 font-medium">
              Sri Ramakrishna Dental College and Hospital
            </p>
            <p className="text-xs text-slate-400">
              Coimbatore, Tamil Nadu, India
            </p>

            <p className="text-xs text-blue-600 font-semibold mt-2 cursor-pointer hover:underline">
              500+ connections
            </p>

            {/* LinkedIn Action Buttons */}
            <div className="flex items-center gap-2 mt-4">
              <button 
                onClick={() => onSwitchTab('dashboard')}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 rounded-full transition shadow-xs cursor-pointer text-center"
              >
                Open to
              </button>
              <button 
                onClick={() => onSwitchTab('appointments')}
                className="flex-1 border border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold text-xs py-2 rounded-full transition cursor-pointer text-center"
              >
                Add section
              </button>
              <button className="w-9 h-9 border border-slate-300 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-50 cursor-pointer">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            <button className="w-full mt-2 border border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold text-xs py-2 rounded-full transition cursor-pointer">
              Enhance profile
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Analytics</h3>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
            <Eye className="w-3.5 h-3.5" /> Private to you
          </p>
        </div>

        <div className="space-y-3.5 divide-y divide-slate-100">
          <div className="pt-2 flex items-start gap-3">
            <Users className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-slate-900">373 profile views</p>
              <p className="text-xs text-slate-400">Discover who's viewed your profile.</p>
            </div>
          </div>

          <div className="pt-3.5 flex items-start gap-3">
            <BarChart2 className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-slate-900">473 post impressions</p>
              <p className="text-xs text-slate-400">Check out who's engaging with your posts. Past 7 days</p>
            </div>
          </div>

          <div className="pt-3.5 flex items-start gap-3">
            <Search className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-slate-900">44 search appearances</p>
              <p className="text-xs text-slate-400">See how often you appear in search results.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 2. DASHBOARD VIEW (With Recharts Analytics)
// -------------------------------------------------------------
function DashboardView({ stats }) {
  const weeklyData = [
    { day: 'Mon', count: 4 },
    { day: 'Tue', count: 7 },
    { day: 'Wed', count: 5 },
    { day: 'Thu', count: 8 },
    { day: 'Fri', count: 6 },
    { day: 'Sat', count: 9 },
    { day: 'Sun', count: 2 },
  ];

  const revenueData = [
    { week: 'Week 1', revenue: 13000 },
    { week: 'Week 2', revenue: 23500 },
    { week: 'Week 3', revenue: 18000 },
    { week: 'Week 4', revenue: 27000 },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h2>

      {/* 4 Metric Cards */}
      <div className="space-y-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Patients</p>
            <p className="text-2xl font-bold text-slate-900">{stats.totalPatients || 1248}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Today's Appointments</p>
            <p className="text-2xl font-bold text-slate-900">{stats.todayCount || 14}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Collected Today</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats.collectedToday || 48500)}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Outstanding</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats.outstanding || 18200)}</p>
          </div>
        </div>
      </div>

      {/* Weekly Appointments Chart */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Weekly Appointments</h3>
        <div className="h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={26} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Revenue Trend</h3>
        <div className="h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${v/1000}k`} tickLine={false} axisLine={false} />
              <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3b82f6" 
                strokeWidth={2.5} 
                dot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 3. APPOINTMENTS VIEW
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
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Appointments</h2>
        <button 
          onClick={onOpenModal}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> New appointment
        </button>
      </div>

      {/* Day Navigator */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs text-center space-y-3">
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

      {/* Appointment Cards */}
      <div className="space-y-3">
        {appointments.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-400 text-xs">
            No appointments scheduled for this day. Click "+ New appointment" above.
          </div>
        ) : (
          appointments.map((appt) => {
            const statusStyle = 
              appt.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              appt.status === 'in_progress' ? 'bg-amber-50 text-amber-700 border-amber-200' :
              'bg-slate-100 text-slate-600 border-slate-200';

            return (
              <div key={appt.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-900">{appt.time}</p>
                      <span className="text-[10px] text-slate-400 font-medium">({appt.duration || '45 min'})</span>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-800 mt-0.5">{appt.patient}</h4>
                    <p className="text-xs text-slate-400">{appt.procedure} • {appt.doctor}</p>
                  </div>
                </div>
                <button 
                  onClick={() => onToggleStatus(appt.id, appt.status)}
                  title="Click to advance status"
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border cursor-pointer capitalize transition active:scale-95 ${statusStyle}`}
                >
                  {appt.status?.replace('_', ' ') || 'scheduled'}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 4. PATIENTS DIRECTORY
// -------------------------------------------------------------
function PatientsView({ patients, onOpenModal }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Patients Directory</h2>
        <button 
          onClick={onOpenModal}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add Patient
        </button>
      </div>

      <div className="space-y-3">
        {patients.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-400 text-xs">
            No patients registered yet. Click "+ Add Patient" above.
          </div>
        ) : (
          patients.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">{p.name}</h4>
                <p className="text-xs text-slate-400">{p.customId || p.id} • {p.phone}</p>
              </div>
              <span className="text-xs font-medium text-slate-500">Registered: {p.registeredDate || 'Recent'}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 5. BILLING & INVOICES VIEW
// -------------------------------------------------------------
function BillingView({ invoices, onOpenModal }) {
  const outstandingSum = invoices
    .filter(i => i.status === 'Unpaid')
    .reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);

  const unpaidCount = invoices.filter(i => i.status === 'Unpaid').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Billing</h2>
        <button 
          onClick={onOpenModal}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> New Invoice
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-blue-900 text-sm font-medium">
        <span className="font-bold">{formatCurrency(outstandingSum || 5620)}</span> outstanding across {unpaidCount || 1} invoice(s)
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-100 text-slate-500 font-semibold bg-slate-50/50">
            <tr>
              <th className="py-3.5 px-4">Invoice #</th>
              <th className="py-3.5 px-4">Patient</th>
              <th className="py-3.5 px-4">Date</th>
              <th className="py-3.5 px-4">Due Date</th>
              <th className="py-3.5 px-4 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50/60">
                <td className="py-3.5 px-4 font-semibold text-blue-600">{inv.customNo || inv.id}</td>
                <td className="py-3.5 px-4 text-slate-800 font-medium">{inv.patient}</td>
                <td className="py-3.5 px-4 text-slate-500">{inv.date}</td>
                <td className="py-3.5 px-4 text-slate-500">{inv.dueDate}</td>
                <td className="py-3.5 px-4 text-right font-semibold text-slate-900">{formatCurrency(inv.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 6. MODALS (Add Patient, Book Appointment, Create Invoice)
// -------------------------------------------------------------
function NewPatientModal({ uid, onSuccess, onClose }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);

    const newPatient = {
      id: `PAT-${Date.now()}`,
      customId: `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
      name: name.trim(),
      phone: phone.trim(),
      registeredDate: new Date().toLocaleDateString('en-IN')
    };

    onSuccess(newPatient);

    if (uid && db) {
      try {
        await addDoc(collection(db, 'clinics', uid, 'patients'), {
          ...newPatient,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.warn('Saved locally');
      }
    }

    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 border border-slate-200 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-base">Add New Patient</h3>
          <button onClick={onClose} className="cursor-pointer"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
            <input 
              type="text" 
              required
              placeholder="e.g. Priya Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-blue-600"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Mobile (+91)</label>
            <input 
              type="text" 
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-blue-600"
            />
          </div>
          <button 
            type="submit" 
            disabled={saving}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-xs mt-2 cursor-pointer"
          >
            {saving ? "Saving..." : "Save Patient"}
          </button>
        </form>
      </div>
    </div>
  );
}

function NewAppointmentModal({ uid, currentDateKey, patients, onSuccess, onClose }) {
  const [patient, setPatient] = useState(patients[0]?.name || '');
  const [customPatient, setCustomPatient] = useState('');
  const [time, setTime] = useState('11:45 AM - 12:15 PM');
  const [duration, setDuration] = useState('30 min');
  const [procedure, setProcedure] = useState('Root Canal');
  const [doctor, setDoctor] = useState('Dr. Sarah Jenkins');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalPatient = (patient || customPatient).trim();
    if (!finalPatient) return;
    setSaving(true);

    const newAppt = {
      id: `APT-${Date.now()}`,
      date: currentDateKey,
      time,
      duration,
      patient: finalPatient,
      procedure,
      doctor,
      status: 'scheduled'
    };

    onSuccess(newAppt);

    if (uid && db) {
      try {
        await addDoc(collection(db, 'clinics', uid, 'appointments'), {
          ...newAppt,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.warn('Saved locally');
      }
    }

    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 border border-slate-200 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-base">Book Appointment</h3>
          <button onClick={onClose} className="cursor-pointer"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Patient</label>
            {patients.length > 0 ? (
              <select 
                value={patient}
                onChange={(e) => setPatient(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-800 bg-white focus:outline-blue-600"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            ) : (
              <input 
                type="text" 
                required
                placeholder="Enter patient name"
                value={customPatient}
                onChange={(e) => setCustomPatient(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-blue-600"
              />
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Time Slot</label>
              <input 
                type="text" 
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-blue-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Duration</label>
              <input 
                type="text" 
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-blue-600"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Procedure</label>
            <input 
              type="text" 
              value={procedure}
              onChange={(e) => setProcedure(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-blue-600"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Attending Doctor</label>
            <select 
              value={doctor}
              onChange={(e) => setDoctor(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-800 bg-white focus:outline-blue-600"
            >
              <option>Dr. Sarah Jenkins</option>
              <option>Dr. Arthur Meridian</option>
            </select>
          </div>
          <button 
            type="submit" 
            disabled={saving}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-xs mt-2 cursor-pointer"
          >
            {saving ? "Scheduling..." : "Confirm Appointment"}
          </button>
        </form>
      </div>
    </div>
  );
}

function CreateInvoiceModal({ uid, patients, onSuccess, onClose }) {
  const [selectedPatient, setSelectedPatient] = useState(patients[0]?.name || 'Sophia Reynolds');
  const [dueDate, setDueDate] = useState('28/09/2026');
  const [note, setNote] = useState('');
  
  const [items, setItems] = useState([
    { id: 1, name: 'Root Canal Therapy', qty: 12, rate: 5000 },
    { id: 2, name: 'Post Consultation', qty: 1, rate: 0 }
  ]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [saving, setSaving] = useState(false);

  const handleAddItem = () => {
    setItems(prev => [...prev, { id: Date.now(), name: '', qty: 1, rate: 0 }]);
  };

  const handleRemoveItem = (id) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(i => i.id !== id));
    }
  };

  const updateItem = (id, field, val) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: val } : item));
  };

  const subtotal = useMemo(() => {
    return items.reduce((acc, curr) => acc + (Number(curr.qty) || 0) * (Number(curr.rate) || 0), 0);
  }, [items]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - (Number(discount) || 0) + (Number(tax) || 0));
  }, [subtotal, discount, tax]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const newInvoice = {
      id: `INV-${Date.now()}`,
      customNo: `INV-2025-00${Math.floor(Math.random() * 90) + 10}`,
      patient: selectedPatient,
      date: 'Sep 22, 2026',
      dueDate: dueDate,
      items,
      subtotal,
      discount: Number(discount) || 0,
      tax: Number(tax) || 0,
      total,
      status: 'Unpaid'
    };

    onSuccess(newInvoice);

    if (uid && db) {
      try {
        await addDoc(collection(db, 'clinics', uid, 'invoices'), {
          ...newInvoice,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.warn('Saved locally');
      }
    }

    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-slate-200 shadow-2xl space-y-4 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-lg">Create New Invoice</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Select Patient <span className="text-red-500">*</span>
            </label>
            <select 
              value={selectedPatient} 
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-800 bg-white focus:outline-blue-600"
            >
              {patients.map(p => (
                <option key={p.id} value={p.name}>{p.name} ({p.customId || p.id}) - {p.phone}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Due Date <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              value={dueDate} 
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-blue-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Invoice Note</label>
            <input 
              type="text" 
              placeholder="e.g. Treatment follow-up invoice"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-blue-600"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Treatment / Service Line Items</span>
              <button 
                type="button" 
                onClick={handleAddItem}
                className="border border-slate-200 hover:bg-slate-50 px-2.5 py-1 rounded-lg font-medium text-slate-600 flex items-center gap-1 cursor-pointer"
              >
                + Add Item
              </button>
            </div>

            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                <input 
                  type="text" 
                  placeholder="Item"
                  value={item.name}
                  onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                  className="col-span-5 border border-slate-200 rounded-xl p-2 text-slate-800 focus:outline-blue-600"
                />
                <input 
                  type="number" 
                  value={item.qty}
                  onChange={(e) => updateItem(item.id, 'qty', parseInt(e.target.value) || 0)}
                  className="col-span-3 border border-slate-200 rounded-xl p-2 text-slate-800 focus:outline-blue-600"
                />
                <input 
                  type="number" 
                  value={item.rate}
                  onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                  className="col-span-3 border border-slate-200 rounded-xl p-2 text-slate-800 focus:outline-blue-600"
                />
                <button 
                  type="button" 
                  onClick={() => handleRemoveItem(item.id)}
                  className="col-span-1 text-slate-400 hover:text-red-500 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Pricing calculations */}
          <div className="bg-slate-50 rounded-2xl p-3.5 space-y-2 border border-slate-200">
            <div className="flex justify-between font-medium text-slate-600">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Discount (₹):</span>
              <input 
                type="number" 
                value={discount} 
                onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-24 text-right border border-slate-200 rounded-lg p-1 bg-white"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Tax (₹):</span>
              <input 
                type="number" 
                value={tax} 
                onChange={(e) => setTax(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-24 text-right border border-slate-200 rounded-lg p-1 bg-white"
              />
            </div>
            <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-2 text-sm">
              <span>Total Invoice</span>
              <span className="text-blue-600">{formatCurrency(total)}</span>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={saving}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-xs cursor-pointer"
          >
            {saving ? "Generating..." : "Create Invoice"}
          </button>
        </form>
      </div>
    </div>
  );
}