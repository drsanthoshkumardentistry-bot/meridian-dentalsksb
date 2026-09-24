import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  ShieldCheck, 
  Eye, 
  BarChart2, 
  Edit3, 
  HeartPulse, 
  Image as ImageIcon, 
  Calendar, 
  ExternalLink,
  Lock,
  UserCheck,
  MessageCircle,
  AlertTriangle
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
  deleteDoc, 
  doc, 
  serverTimestamp,
  query
} from 'firebase/firestore';

// --- CURRENCY & DATE UTILITIES ---
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

const sanitizePhoneForWhatsApp = (rawPhone) => {
  let cleaned = (rawPhone || '').replace(/\D/g, '');
  if (cleaned.length === 10) cleaned = '91' + cleaned;
  return cleaned;
};

const sendAppointmentWhatsApp = (appointment, patientPhone = '') => {
  const phone = sanitizePhoneForWhatsApp(patientPhone);
  const message = encodeURIComponent(
    `Hello *${appointment.patient}*,\n\n` +
    `Your dental appointment at *Meridian Dental* is confirmed.\n\n` +
    `📅 *Date:* ${appointment.date}\n` +
    `⏰ *Time:* ${appointment.time}\n` +
    `🩺 *Procedure:* ${appointment.procedure}\n` +
    `👨‍⚕️ *Doctor:* ${appointment.doctor}\n\n` +
    `📍 *Location:* Sri Ramakrishna Dental College & Hospital, Coimbatore\n` +
    `If you need to reschedule, please reply directly to this message.\n\n` +
    `_Meridian Dental Healthcare Team_`
  );

  const url = phone ? `https://wa.me/${phone}?text=${message}` : `https://wa.me/?text=${message}`;
  window.open(url, '_blank');
};

const sendInvoiceWhatsApp = (invoice, patientPhone = '') => {
  const phone = sanitizePhoneForWhatsApp(patientPhone);
  const lineItemsList = invoice.items
    ?.map(item => `• ${item.name} (${item.qty}x) - ₹${item.rate * item.qty}`)
    .join('\n') || 'Dental Services';

  const message = encodeURIComponent(
    `Hello *${invoice.patient}*,\n\n` +
    `Here is your invoice summary from *Meridian Dental*:\n\n` +
    `📄 *Invoice No:* ${invoice.customNo || invoice.id}\n` +
    `📅 *Date:* ${invoice.date}\n` +
    `💳 *Status:* ${invoice.status}\n\n` +
    `*Procedures / Treatments:*\n${lineItemsList}\n\n` +
    `💰 *Subtotal:* ₹${invoice.subtotal}\n` +
    `🏷️ *Discount:* ₹${invoice.discount || 0}\n` +
    `💵 *Total Payable:* ₹${invoice.total}\n` +
    `🗓️ *Due Date:* ${invoice.dueDate}\n\n` +
    `Thank you for trusting Meridian Dental with your care.\n\n` +
    `_Meridian Dental Clinical Team_`
  );

  const url = phone ? `https://wa.me/${phone}?text=${message}` : `https://wa.me/?text=${message}`;
  window.open(url, '_blank');
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Navigation
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Primary Clinical Collections (Zero Demo Dummy Records)
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);

  // Date Navigator
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Modals
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [selectedPatientForDetails, setSelectedPatientForDetails] = useState(null);

  // Authentication State Observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Multi-Tenant Isolation per Google UID
  useEffect(() => {
    if (!currentUser || !db) {
      setPatients([]);
      setAppointments([]);
      setInvoices([]);
      return;
    }

    const uid = currentUser.uid;
    const cacheKey = `md_prod_cache_${uid}`;

    const local = localStorage.getItem(cacheKey);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (parsed.patients) setPatients(parsed.patients);
        if (parsed.appointments) setAppointments(parsed.appointments);
        if (parsed.invoices) setInvoices(parsed.invoices);
      } catch (e) {
        console.warn('Cache parse notice:', e);
      }
    }

    const unsubP = onSnapshot(collection(db, 'clinics', uid, 'patients'), (snap) => {
      setPatients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn('Patients sync offline:', err.message));

    const unsubA = onSnapshot(collection(db, 'clinics', uid, 'appointments'), (snap) => {
      setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn('Appts sync offline:', err.message));

    const unsubI = onSnapshot(collection(db, 'clinics', uid, 'invoices'), (snap) => {
      setInvoices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn('Invoices sync offline:', err.message));

    return () => {
      unsubP();
      unsubA();
      unsubI();
    };
  }, [currentUser]);

  // Save isolated tenant cache
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`md_prod_cache_${currentUser.uid}`, JSON.stringify({
        patients,
        appointments,
        invoices
      }));
    }
  }, [currentUser, patients, appointments, invoices]);

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      await loginWithGoogle();
    } catch (err) {
      console.error("Login failed:", err);
      if (err.code === 'auth/unauthorized-domain') {
        alert('Domain Not Authorized: Add this exact address in Firebase Console -> Authentication -> Settings -> Authorized Domains.');
      } else {
        alert('Sign-In Error: ' + err.message);
      }
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

  const filteredAppointments = useMemo(() => {
    if (!searchQuery.trim()) return dailyAppointments;
    const q = searchQuery.toLowerCase();
    return dailyAppointments.filter(a => 
      a.patient?.toLowerCase().includes(q) || 
      a.procedure?.toLowerCase().includes(q) ||
      a.doctor?.toLowerCase().includes(q)
    );
  }, [dailyAppointments, searchQuery]);

  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const q = searchQuery.toLowerCase();
    return patients.filter(p => 
      p.name?.toLowerCase().includes(q) || 
      p.phone?.includes(q) ||
      p.customId?.toLowerCase().includes(q)
    );
  }, [patients, searchQuery]);

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
        console.warn('Status updated locally');
      }
    }
  };

  const handleDeletePatient = async (patientId, patientName) => {
    if (!window.confirm(`Delete patient record for "${patientName}"? This cannot be undone.`)) return;
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

  const handleDeleteAppointment = async (apptId) => {
    if (!window.confirm('Delete this appointment?')) return;
    setAppointments(prev => prev.filter(a => a.id !== apptId));
    if (currentUser && db) {
      try {
        await deleteDoc(doc(db, 'clinics', currentUser.uid, 'appointments', apptId));
      } catch (err) {
        console.warn('Appt removed');
      }
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-300 font-sans p-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wide">Securing Meridian Dental Workspace...</p>
      </div>
    );
  }

  // -----------------------------------------------------------
  // STRICT GOOGLE AUTH GATEWAY
  // -----------------------------------------------------------
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex flex-col justify-center items-center p-4 font-sans selection:bg-blue-600">
        <div className="w-full max-w-sm bg-[#1e293b] border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-tr from-blue-600 to-indigo-500 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30">
            <Lock className="w-8 h-8 text-white" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-black tracking-tight text-white">Meridian Dental</h1>
            <p className="text-xs text-slate-400 font-medium">Cloud Practice Management OS</p>
          </div>

          <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/50 text-left space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
              <ShieldCheck className="w-4 h-4 text-blue-400" /> Clinic Security Shield
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Patient health records, OPG radiographs, and billing data are isolated per clinic account. Please sign in with your Google credentials.
            </p>
          </div>

          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm py-3.5 px-4 rounded-2xl transition duration-200 shadow-md flex items-center justify-center gap-3 cursor-pointer active:scale-98 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
    <div className="min-h-screen bg-[#f4f6f8] text-slate-800 flex flex-col font-sans pb-20 sm:pb-6 antialiased selection:bg-blue-600 selection:text-white">
      {/* Navbar */}
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
        
        <div className="relative w-44 sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search records, OPG, phone..."
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
            className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
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
                  <p className="text-[11px] text-blue-400 font-medium">Cloud Clinic OS</p>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="mt-6 space-y-1.5">
                {[
                  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
                  { id: 'appointments', name: 'Appointments', icon: CalendarIcon },
                  { id: 'patients', name: 'Patients & OPGs', icon: Users },
                  { id: 'billing', name: 'Billing & Invoices', icon: Receipt },
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
              <div className="truncate max-w-[150px]">
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

      {/* Main Body */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {activeTab === 'dashboard' && (
          <DashboardView stats={stats} weeklyData={weeklyChartData} onSwitchTab={setActiveTab} />
        )}
        
        {activeTab === 'appointments' && (
          <AppointmentsView 
            appointments={filteredAppointments}
            patients={patients}
            selectedDate={selectedDate}
            onPrev={() => handleDateShift(-1)}
            onNext={() => handleDateShift(1)}
            onToday={() => setSelectedDate(new Date())}
            onToggleStatus={cycleAppointmentStatus}
            onDeleteAppointment={handleDeleteAppointment}
            onOpenModal={() => setShowAppointmentModal(true)}
          />
        )}

        {activeTab === 'patients' && (
          <PatientsView 
            patients={filteredPatients}
            onOpenModal={() => setShowPatientModal(true)}
            onSelectPatient={(p) => setSelectedPatientForDetails(p)}
            onDeletePatient={handleDeletePatient}
          />
        )}

        {activeTab === 'billing' && (
          <BillingView 
            invoices={invoices} 
            patients={patients}
            onOpenModal={() => setShowInvoiceModal(true)} 
          />
        )}

        {activeTab === 'profile' && (
          <FounderProfileView onSwitchTab={setActiveTab} onLogout={handleLogout} />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 flex justify-around items-center py-2 z-40 sm:hidden shadow-lg">
        <button 
          onClick={() => setActiveTab('dashboard')} 
          className={`flex flex-col items-center text-[10px] font-semibold ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-500'}`}
        >
          <LayoutDashboard className="w-4 h-4" /> Dashboard
        </button>
        <button 
          onClick={() => setActiveTab('appointments')} 
          className={`flex flex-col items-center text-[10px] font-semibold ${activeTab === 'appointments' ? 'text-blue-600' : 'text-slate-500'}`}
        >
          <CalendarIcon className="w-4 h-4" /> Schedule
        </button>
        <button 
          onClick={() => setActiveTab('patients')} 
          className={`flex flex-col items-center text-[10px] font-semibold ${activeTab === 'patients' ? 'text-blue-600' : 'text-slate-500'}`}
        >
          <Users className="w-4 h-4" /> Patients
        </button>
        <button 
          onClick={() => setActiveTab('billing')} 
          className={`flex flex-col items-center text-[10px] font-semibold ${activeTab === 'billing' ? 'text-blue-600' : 'text-slate-500'}`}
        >
          <Receipt className="w-4 h-4" /> Billing
        </button>
        <button 
          onClick={() => setActiveTab('profile')} 
          className={`flex flex-col items-center text-[10px] font-semibold ${activeTab === 'profile' ? 'text-blue-600' : 'text-slate-500'}`}
        >
          <UserCheck className="w-4 h-4" /> Profile
        </button>
      </nav>

      {/* Patient Detail Modal */}
      {selectedPatientForDetails && (
        <PatientDetailsModal 
          patient={selectedPatientForDetails}
          currentUser={currentUser}
          onClose={() => setSelectedPatientForDetails(null)}
          onDeletePatient={handleDeletePatient}
          onAddOpgScan={async (scan) => {
            const updatedScans = [...(selectedPatientForDetails.opgScans || []), scan];
            const updatedPatient = { ...selectedPatientForDetails, opgScans: updatedScans };
            
            setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
            setSelectedPatientForDetails(updatedPatient);

            if (currentUser && db) {
              try {
                await updateDoc(doc(db, 'clinics', currentUser.uid, 'patients', updatedPatient.id), {
                  opgScans: updatedScans
                });
              } catch (e) {
                console.warn('OPG updated locally');
              }
            }
          }}
        />
      )}

      {/* Action Modals */}
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
// 1. DASHBOARD
// -------------------------------------------------------------
function DashboardView({ stats, weeklyData, onSwitchTab }) {
  const revenueTrendData = [
    { period: 'Past 30d', revenue: Math.max(0, stats.collectedToday * 0.4) },
    { period: 'Past 15d', revenue: Math.max(0, stats.collectedToday * 0.7) },
    { period: 'Today', revenue: stats.collectedToday },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Clinical Overview</h2>
        <button 
          onClick={() => onSwitchTab('appointments')}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
        >
          View Today's Diary &rsaquo;
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Registered Patients</p>
            <p className="text-2xl font-bold text-slate-900">{stats.totalPatients}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Today's Appointments</p>
            <p className="text-2xl font-bold text-slate-900">{stats.todayCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Collected (Paid)</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats.collectedToday)}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Outstanding Balances</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats.outstanding)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Weekly Clinical Load</h3>
        <div className="h-48 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={26} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Revenue Collections</h3>
        <div className="h-48 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueTrendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip formatter={(value) => [formatCurrency(value), 'Collections']} />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                strokeWidth={2.5} 
                dot={{ r: 4, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 2. APPOINTMENTS
// -------------------------------------------------------------
function AppointmentsView({ 
  appointments, 
  patients,
  selectedDate, 
  onPrev, 
  onNext, 
  onToday, 
  onToggleStatus, 
  onDeleteAppointment,
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

      <div className="space-y-3">
        {appointments.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-400 text-xs space-y-2">
            <Calendar className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
            <p className="font-semibold text-slate-600">No appointments scheduled for this date</p>
            <p className="text-[11px]">Click "+ New appointment" to book a patient consultation or procedure.</p>
          </div>
        ) : (
          appointments.map((appt) => {
            const statusStyle = 
              appt.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              appt.status === 'in_progress' ? 'bg-amber-50 text-amber-700 border-amber-200' :
              'bg-slate-100 text-slate-600 border-slate-200';

            const matchedPatient = patients.find(p => p.name?.toLowerCase() === appt.patient?.toLowerCase());

            return (
              <div key={appt.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-900">{appt.time}</p>
                      <span className="text-[10px] text-slate-400 font-medium">({appt.duration || '30 min'})</span>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-800 mt-0.5">{appt.patient}</h4>
                    <p className="text-xs text-slate-400">{appt.procedure} • {appt.doctor}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => sendAppointmentWhatsApp(appt, matchedPatient?.phone || '')}
                    className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition border border-emerald-200 cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                    title="Send WhatsApp Confirmation"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </button>
                  <button 
                    onClick={() => onToggleStatus(appt.id, appt.status)}
                    title="Click to advance status"
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border cursor-pointer capitalize transition active:scale-95 ${statusStyle}`}
                  >
                    {appt.status?.replace('_', ' ') || 'scheduled'}
                  </button>
                  <button 
                    onClick={() => onDeleteAppointment(appt.id)}
                    className="p-1 text-slate-300 hover:text-red-500 rounded transition cursor-pointer"
                    title="Delete appointment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
// 3. PATIENTS DIRECTORY
// -------------------------------------------------------------
function PatientsView({ patients, onOpenModal, onSelectPatient, onDeletePatient }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Patients Directory</h2>
          <p className="text-xs text-slate-400">Electronic Dental Records & Radiographs</p>
        </div>
        <button 
          onClick={onOpenModal}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add Patient
        </button>
      </div>

      <div className="space-y-3">
        {patients.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center text-slate-400 text-xs space-y-3">
            <Users className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
            <p className="font-bold text-slate-700 text-sm">No Patients Registered Yet</p>
            <p className="text-slate-400 max-w-xs mx-auto">
              Your database is clean. Click "+ Add Patient" to record your first clinical entry.
            </p>
          </div>
        ) : (
          patients.map((p) => {
            const hasAllergies = p.medicalHistory?.allergies && !p.medicalHistory.allergies.includes('NKDA');
            const opgCount = p.opgScans?.length || 0;

            return (
              <div 
                key={p.id} 
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between transition hover:border-blue-400 group"
              >
                <div 
                  onClick={() => onSelectPatient(p)}
                  className="space-y-1 flex-1 cursor-pointer pr-3"
                >
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">{p.name}</h4>
                    {hasAllergies && (
                      <span className="text-[10px] bg-red-50 text-red-700 font-semibold px-2 py-0.5 rounded-md border border-red-100">
                        Allergy Alert
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{p.customId || p.id} • {p.phone}</p>
                  <p className="text-[11px] text-slate-600">
                    <span className="font-semibold text-slate-700">Medical:</span> {p.medicalHistory?.conditions || 'No systemic conditions reported'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div onClick={() => onSelectPatient(p)} className="text-right cursor-pointer">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                      <ImageIcon className="w-3 h-3" /> {opgCount} OPG{opgCount !== 1 ? 's' : ''}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Open Record &rsaquo;</p>
                  </div>
                  <button 
                    onClick={() => onDeletePatient(p.id, p.name)}
                    className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                    title="Delete Patient Record"
                  >
                    <Trash2 className="w-4 h-4" />
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
// 4. PATIENT MEDICAL & OPG MODAL
// -------------------------------------------------------------
function PatientDetailsModal({ patient, currentUser, onClose, onAddOpgScan, onDeletePatient }) {
  const [scanTitle, setScanTitle] = useState('');
  const [scanUrl, setScanUrl] = useState('');

  const handleAddScan = (e) => {
    e.preventDefault();
    if (!scanTitle) return;
    onAddOpgScan({
      id: `scan-${Date.now()}`,
      title: scanTitle,
      date: new Date().toLocaleDateString('en-IN'),
      url: scanUrl.trim() || 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80'
    });
    setScanTitle('');
    setScanUrl('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-lg p-6 border border-slate-200 shadow-2xl space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">{patient.name}</h3>
            <p className="text-xs text-slate-400">{patient.customId} • {patient.phone}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <HeartPulse className="w-4 h-4 text-red-500" /> Medical History & Systemic Status
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Systemic Conditions</span>
              <p className="font-semibold text-slate-800 mt-0.5">{patient.medicalHistory?.conditions || 'None'}</p>
            </div>
            <div className="bg-red-50/50 p-3 rounded-xl border border-red-100">
              <span className="text-[10px] text-red-500 font-bold uppercase block">Drug Allergies</span>
              <p className="font-semibold text-red-800 mt-0.5">{patient.medicalHistory?.allergies || 'NKDA'}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Bleeding Disorders</span>
              <p className="font-semibold text-slate-800 mt-0.5">{patient.medicalHistory?.bleedingDisorders || 'None'}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Routine Medications</span>
              <p className="font-semibold text-slate-800 mt-0.5">{patient.medicalHistory?.medications || 'None'}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-blue-600" /> OPG Radiographs Archive
            </h4>
            <span className="text-xs text-slate-400 font-medium">({patient.opgScans?.length || 0} scans)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {patient.opgScans && patient.opgScans.length > 0 ? (
              patient.opgScans.map((scan) => (
                <div key={scan.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-slate-900 group">
                  <div className="h-28 overflow-hidden relative">
                    <img 
                      src={scan.url} 
                      alt={scan.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300 opacity-90 hover:opacity-100"
                    />
                  </div>
                  <div className="p-2.5 bg-white flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-800 truncate max-w-[130px]">{scan.title}</p>
                      <p className="text-[10px] text-slate-400">{scan.date}</p>
                    </div>
                    <a 
                      href={scan.url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-blue-600 hover:underline text-[11px] font-semibold flex items-center gap-1"
                    >
                      Inspect <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-6 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                No OPG scans currently attached to this chart.
              </div>
            )}
          </div>

          <form onSubmit={handleAddScan} className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <p className="font-bold text-slate-700">Attach Panoramic OPG / Radiograph</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input 
                type="text" 
                required
                placeholder="Scan Label (e.g. Pre-RCT Mandibular OPG)"
                value={scanTitle}
                onChange={(e) => setScanTitle(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2 text-slate-800 focus:outline-blue-600"
              />
              <input 
                type="text" 
                placeholder="Direct Scan URL (Optional link)"
                value={scanUrl}
                onChange={(e) => setScanUrl(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2 text-slate-800 focus:outline-blue-600"
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-xl transition cursor-pointer"
            >
              Upload & Record Scan
            </button>
          </form>
        </div>

        <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
          <button 
            type="button" 
            onClick={() => onDeletePatient(patient.id, patient.name)}
            className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete Patient Chart
          </button>
          <button 
            type="button" 
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 5. BILLING & INVOICES
// -------------------------------------------------------------
function BillingView({ invoices, patients, onOpenModal }) {
  const outstandingSum = invoices
    .filter(i => i.status === 'Unpaid')
    .reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);

  const unpaidCount = invoices.filter(i => i.status === 'Unpaid').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Billing & Ledger</h2>
          <p className="text-xs text-slate-400">Treatment Invoicing and Receipts</p>
        </div>
        <button 
          onClick={onOpenModal}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> New Invoice
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-blue-900 text-sm font-medium">
        <span className="font-bold">{formatCurrency(outstandingSum)}</span> outstanding receivables across {unpaidCount} invoice(s)
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-100 text-slate-500 font-semibold bg-slate-50/50">
            <tr>
              <th className="py-3.5 px-4">Invoice #</th>
              <th className="py-3.5 px-4">Patient</th>
              <th className="py-3.5 px-4">Date</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Total</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400">
                  No invoices generated yet. Click "+ New Invoice" to bill a procedure.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => {
                const matchedPatient = patients.find(p => p.name?.toLowerCase() === inv.patient?.toLowerCase());

                return (
                  <tr key={inv.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4 font-semibold text-blue-600">{inv.customNo || inv.id}</td>
                    <td className="py-3.5 px-4 text-slate-800 font-medium">{inv.patient}</td>
                    <td className="py-3.5 px-4 text-slate-500">{inv.date}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-900">{formatCurrency(inv.total)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => sendInvoiceWhatsApp(inv, matchedPatient?.phone || '')}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-[11px] transition cursor-pointer shadow-xs inline-flex items-center gap-1"
                      >
                        <MessageCircle className="w-3 h-3" /> Send Bill
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 6. FOUNDER PROFILE
// -------------------------------------------------------------
function FounderProfileView({ onSwitchTab, onLogout }) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
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

        <div className="px-5 pb-6 relative pt-0">
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

            <p className="text-xs text-blue-600 font-semibold mt-2">
              500+ connections
            </p>

            <div className="flex items-center gap-2 mt-4">
              <button 
                onClick={() => onSwitchTab('appointments')}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 rounded-full transition shadow-xs cursor-pointer text-center"
              >
                Open to Diary
              </button>
              <button 
                onClick={() => onSwitchTab('patients')}
                className="flex-1 border border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold text-xs py-2 rounded-full transition cursor-pointer text-center"
              >
                View Patients & OPG
              </button>
              <button 
                onClick={onLogout}
                className="px-3 py-2 border border-slate-300 rounded-full text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer"
              >
                Sign Out
              </button>
            </div>

            <button 
              onClick={() => onSwitchTab('dashboard')}
              className="w-full mt-2 border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs py-2 rounded-full transition cursor-pointer"
            >
              Go to Clinical Dashboard
            </button>
          </div>
        </div>
      </div>

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
// 7. MODALS
// -------------------------------------------------------------
function NewPatientModal({ uid, onSuccess, onClose }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [conditions, setConditions] = useState('');
  const [allergies, setAllergies] = useState('NKDA');
  const [bleedingDisorders, setBleedingDisorders] = useState('None');
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
      registeredDate: new Date().toLocaleDateString('en-IN'),
      medicalHistory: {
        conditions: conditions.trim() || 'None reported',
        allergies: allergies.trim() || 'NKDA',
        bleedingDisorders: bleedingDisorders.trim() || 'None',
        medications: 'None'
      },
      opgScans: []
    };

    onSuccess(newPatient);

    if (uid && db) {
      try {
        await addDoc(collection(db, 'clinics', uid, 'patients'), {
          ...newPatient,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.warn('Cached locally');
      }
    }

    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-slate-200 shadow-2xl space-y-4 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-base">Register Clinical Patient</h3>
          <button onClick={onClose} className="cursor-pointer"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Patient Name *</label>
            <input 
              type="text" 
              required
              placeholder="e.g. Anandha Krishnan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-blue-600"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Mobile Contact (+91) *</label>
            <input 
              type="text" 
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-blue-600"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="font-bold text-slate-800 block">Systemic Medical Screening</span>
            <div>
              <label className="block text-slate-600 mb-1">Systemic Illnesses (Diabetes, HTN, Cardiac)</label>
              <input 
                type="text" 
                placeholder="e.g. Type 2 Diabetes, Hypertension"
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2 text-slate-800 focus:outline-blue-600"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Drug Allergies (Penicillin, Amox, NSAIDs)</label>
              <input 
                type="text" 
                placeholder="e.g. Penicillin (Severe) or NKDA"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2 text-slate-800 focus:outline-blue-600"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Bleeding Disorders / Anticoagulants</label>
              <input 
                type="text" 
                placeholder="e.g. None or On Aspirin 75mg"
                value={bleedingDisorders}
                onChange={(e) => setBleedingDisorders(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2 text-slate-800 focus:outline-blue-600"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={saving}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-xs mt-2 cursor-pointer"
          >
            {saving ? "Registering..." : "Create Patient Record"}
          </button>
        </form>
      </div>
    </div>
  );
}

function NewAppointmentModal({ uid, currentDateKey, patients, onSuccess, onClose }) {
  const [patient, setPatient] = useState(patients[0]?.name || '');
  const [customPatient, setCustomPatient] = useState('');
  const [time, setTime] = useState('11:00 AM - 11:45 AM');
  const [duration, setDuration] = useState('45 min');
  const [procedure, setProcedure] = useState('Root Canal Treatment (RCT)');
  const [doctor, setDoctor] = useState('Dr. Sarah Jenkins');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalPatient = (patient || customPatient).trim();
    if (!finalPatient) {
      alert('Please enter or select a patient');
      return;
    }
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
        console.warn('Appt saved locally');
      }
    }

    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 border border-slate-200 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-base">Schedule Appointment</h3>
          <button onClick={onClose} className="cursor-pointer"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Patient Name *</label>
            {patients.length > 0 ? (
              <select 
                value={patient}
                onChange={(e) => setPatient(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-800 bg-white focus:outline-blue-600"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.name}>{p.name} ({p.customId || p.id})</option>
                ))}
              </select>
            ) : (
              <input 
                type="text" 
                required
                placeholder="Enter Patient Full Name"
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
            <label className="block font-semibold text-slate-700 mb-1">Dental Procedure</label>
            <input 
              type="text" 
              value={procedure}
              onChange={(e) => setProcedure(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-blue-600"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Attending Clinician</label>
            <select 
              value={doctor}
              onChange={(e) => setDoctor(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-800 bg-white focus:outline-blue-600"
            >
              <option>Dr. SanthoshKumar S</option>
              <option>Dr. Sarah Jenkins</option>
              <option>Dr. Arthur Meridian</option>
            </select>
          </div>
          <button 
            type="submit" 
            disabled={saving}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-xs mt-2 cursor-pointer"
          >
            {saving ? "Confirming..." : "Confirm Booking"}
          </button>
        </form>
      </div>
    </div>
  );
}

function CreateInvoiceModal({ uid, patients, onSuccess, onClose }) {
  const [selectedPatient, setSelectedPatient] = useState(patients[0]?.name || '');
  const [customPatient, setCustomPatient] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return formatDateKey(d);
  });
  
  const [items, setItems] = useState([
    { id: 1, name: 'Dental Consultation & Diagnosis', qty: 1, rate: 500 }
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
    const finalPatient = (selectedPatient || customPatient).trim();
    if (!finalPatient) {
      alert('Please specify a patient name for the invoice');
      return;
    }
    setSaving(true);

    const newInvoice = {
      id: `INV-${Date.now()}`,
      customNo: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 900) + 100}`,
      patient: finalPatient,
      date: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
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
        console.warn('Invoice saved locally');
      }
    }

    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-slate-200 shadow-2xl space-y-4 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-lg">Generate Clinic Invoice</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Bill To Patient *</label>
            {patients.length > 0 ? (
              <select 
                value={selectedPatient} 
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-800 bg-white focus:outline-blue-600"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.name}>{p.name} ({p.customId || p.id})</option>
                ))}
              </select>
            ) : (
              <input 
                type="text" 
                required
                placeholder="Enter Patient Full Name"
                value={customPatient}
                onChange={(e) => setCustomPatient(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-blue-600"
              />
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Due Date</label>
            <input 
              type="date" 
              value={dueDate} 
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-blue-600"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Treatment Line Items</span>
              <button 
                type="button" 
                onClick={handleAddItem}
                className="border border-slate-200 hover:bg-slate-50 px-2.5 py-1 rounded-lg font-medium text-slate-600 flex items-center gap-1 cursor-pointer"
              >
                + Add Line
              </button>
            </div>

            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                <input 
                  type="text" 
                  placeholder="Procedure / Supply"
                  value={item.name}
                  onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                  className="col-span-5 border border-slate-200 rounded-xl p-2 text-slate-800 focus:outline-blue-600"
                />
                <input 
                  type="number" 
                  min="1"
                  placeholder="Qty"
                  value={item.qty}
                  onChange={(e) => updateItem(item.id, 'qty', parseInt(e.target.value) || 1)}
                  className="col-span-3 border border-slate-200 rounded-xl p-2 text-slate-800 focus:outline-blue-600"
                />
                <input 
                  type="number" 
                  min="0"
                  placeholder="Rate (₹)"
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
              <span className="text-slate-600">Tax / GST (₹):</span>
              <input 
                type="number" 
                value={tax} 
                onChange={(e) => setTax(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-24 text-right border border-slate-200 rounded-lg p-1 bg-white"
              />
            </div>
            <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-2 text-sm">
              <span>Total Payable</span>
              <span className="text-blue-600">{formatCurrency(total)}</span>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={saving}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-xs cursor-pointer"
          >
            {saving ? "Generating..." : "Generate & Post Invoice"}
          </button>
        </form>
      </div>
    </div>
  );
}