import React, { useState, useMemo } from 'react';

// ==========================================
// NATIVE SVG ICONS (Hardcoded bounds prevent scaling issues)
// ==========================================
const IconCalendar = ({ className = "w-5 h-5" }) => (
  <svg width="20" height="20" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);

const IconClock = ({ className = "w-4 h-4" }) => (
  <svg width="16" height="16" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconUser = ({ className = "w-4 h-4" }) => (
  <svg width="16" height="16" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconPhone = ({ className = "w-4 h-4" }) => (
  <svg width="16" height="16" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const IconCheckCircle = ({ className = "w-4 h-4" }) => (
  <svg width="16" height="16" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const IconQrCode = ({ className = "w-6 h-6" }) => (
  <svg width="24" height="24" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="5" height="5" x="3" y="3" rx="1" />
    <rect width="5" height="5" x="16" y="3" rx="1" />
    <rect width="5" height="5" x="3" y="16" rx="1" />
    <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
    <path d="M21 21v.01" />
    <path d="M12 7v3a2 2 0 0 1-2 2H7" />
    <path d="M3 12h.01" />
    <path d="M12 3h.01" />
    <path d="M12 16v.01" />
    <path d="M16 12h1" />
    <path d="M21 12v.01" />
    <path d="M12 21v-1" />
  </svg>
);

const IconCopy = ({ className = "w-3.5 h-3.5" }) => (
  <svg width="14" height="14" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

const IconExternalLink = ({ className = "w-4 h-4" }) => (
  <svg width="16" height="16" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </svg>
);

const IconShieldCheck = ({ className = "w-4 h-4" }) => (
  <svg width="16" height="16" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const IconSearch = ({ className = "w-4 h-4" }) => (
  <svg width="16" height="16" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconActivity = ({ className = "w-4 h-4" }) => (
  <svg width="16" height="16" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('appointments');

  // ==========================================
  // APPOINTMENT SCHEDULING & OPERATORY QUEUE
  // ==========================================
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [treatmentType, setTreatmentType] = useState('Consultation & Diagnostic Exam');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [appointmentsList, setAppointmentsList] = useState([
    {
      id: 'APT-1041',
      name: 'Dr. Vigneshwaran M',
      phone: '+91 98421 11029',
      date: 'Today',
      time: '10:00 AM',
      treatment: 'Composite / GIC Restoration',
      status: 'Completed',
      notes: 'Class II restoration completed on 46.'
    },
    {
      id: 'APT-1042',
      name: 'Ananya S',
      phone: '+91 97904 88321',
      date: 'Today',
      time: '11:30 AM',
      treatment: 'Endodontic Treatment (Root Canal)',
      status: 'In Operatory',
      notes: 'Working length determination for 23.'
    },
    {
      id: 'APT-1043',
      name: 'Karthik Raja',
      phone: '+91 94432 55670',
      date: 'Today',
      time: '02:00 PM',
      treatment: 'Ultrasonic Scaling & Polishing',
      status: 'Waiting',
      notes: 'Generalized marginal gingivitis.'
    },
    {
      id: 'APT-1044',
      name: 'Priyanka Dharshini',
      phone: '+91 98650 33419',
      date: 'Tomorrow',
      time: '04:30 PM',
      treatment: 'Exodontia / Extraction',
      status: 'Scheduled',
      notes: 'Impacted 38 evaluation with OPG.'
    }
  ]);

  const handleBookAppointment = (e) => {
    e.preventDefault();
    if (!patientName.trim() || !patientPhone.trim()) {
      alert("Please provide the patient name and contact number.");
      return;
    }

    const generatedToken = `APT-${Math.floor(1000 + Math.random() * 9000)}`;
    const newAppointment = {
      id: generatedToken,
      name: patientName.trim(),
      phone: patientPhone.trim(),
      date: appointmentDate || 'Today',
      time: appointmentTime || '10:00 AM',
      treatment: treatmentType,
      status: 'Waiting',
      notes: clinicalNotes.trim() || 'Scheduled via operatory desk.'
    };

    setBookingSuccess(newAppointment);
    setAppointmentsList(prev => [newAppointment, ...prev]);
    setPatientName('');
    setPatientPhone('');
    setClinicalNotes('');
  };

  const updateAppointmentStatus = (id, newStatus) => {
    setAppointmentsList(prev =>
      prev.map(apt => apt.id === id ? { ...apt, status: newStatus } : apt)
    );
  };

  const filteredAppointments = useMemo(() => {
    return appointmentsList.filter(apt => {
      const matchesSearch = apt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            apt.phone.includes(searchQuery) ||
                            apt.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = statusFilter === 'ALL' || apt.status === statusFilter;
      return matchesSearch && matchesFilter;
    });
  }, [appointmentsList, searchQuery, statusFilter]);

  // ==========================================
  // FDI ODONTOGRAM INTERACTIVE STATE (32 Adult Teeth)
  // ==========================================
  const defaultTeethState = {
    18: 'Healthy', 17: 'Healthy', 16: 'Healthy', 15: 'Healthy',
    14: 'Healthy', 13: 'Healthy', 12: 'Caries', 11: 'Healthy',
    21: 'Healthy', 22: 'Caries', 23: 'RCT Done', 24: 'Caries',
    25: 'Healthy', 26: 'Healthy', 27: 'Healthy', 28: 'Healthy',
    48: 'Healthy', 47: 'Healthy', 46: 'Healthy', 45: 'Healthy',
    44: 'RCT Done', 43: 'Healthy', 42: 'Healthy', 41: 'Healthy',
    31: 'Restored', 32: 'Healthy', 33: 'Healthy', 34: 'Healthy',
    35: 'Healthy', 36: 'Healthy', 37: 'RCT Done', 38: 'Healthy'
  };

  const [teethStatus, setTeethStatus] = useState(defaultTeethState);
  const [selectedTooth, setSelectedTooth] = useState(12);

  const statusColors = {
    'Healthy': 'bg-emerald-50 text-emerald-700 border-emerald-300',
    'Caries': 'bg-rose-50 text-rose-700 border-rose-300',
    'Restored': 'bg-sky-50 text-sky-700 border-sky-300',
    'RCT Done': 'bg-purple-50 text-purple-700 border-purple-300',
    'Crown': 'bg-amber-50 text-amber-700 border-amber-300',
    'Missing': 'bg-slate-100 text-slate-400 border-slate-300'
  };

  const statusCycle = ['Healthy', 'Caries', 'Restored', 'RCT Done', 'Crown', 'Missing'];

  const cycleToothStatus = (toothNum) => {
    setSelectedTooth(toothNum);
    const current = teethStatus[toothNum] || 'Healthy';
    const nextIdx = (statusCycle.indexOf(current) + 1) % statusCycle.length;
    setTeethStatus(prev => ({ ...prev, [toothNum]: statusCycle[nextIdx] }));
  };

  const setToothSpecificStatus = (status) => {
    if (!selectedTooth) return;
    setTeethStatus(prev => ({ ...prev, [selectedTooth]: status }));
  };

  const resetOdontogram = () => {
    if (confirm("Reset all 32 teeth to Healthy baseline?")) {
      const resetState = {};
      Object.keys(defaultTeethState).forEach(k => { resetState[k] = 'Healthy'; });
      setTeethStatus(resetState);
    }
  };

  // ==========================================
  // CHAIRSIDE DYNAMIC UPI BILLING
  // ==========================================
  const [billAmount, setBillAmount] = useState('500');
  const [billInvoiceNo, setBillInvoiceNo] = useState('INV-2026-089');
  const [copiedUPI, setCopiedUPI] = useState(false);
  const upiId = "santhoshkumar758210@oksbi";
  const payeeName = "SanthoshKumar";

  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${billAmount}&cu=INR&tn=${encodeURIComponent(billInvoiceNo)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(upiUrl)}&margin=10`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUPI(true);
    setTimeout(() => setCopiedUPI(false), 2000);
  };

  const presetAmounts = ['200', '500', '1000', '1500', '2500', '5000'];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-100 overflow-x-hidden">
      
      {/* ==========================================
          HEADER: OFFICIAL BRAND IDENTITY & OPERATORY BADGES
          ========================================== */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 sm:px-6 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-[#1e1c2e] flex items-center justify-center shadow-sm shrink-0">
              <span className="text-white font-extrabold text-base sm:text-lg tracking-tight font-sans">
                MD
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-[#0f172a] leading-none">
                  Meridian Dental OS
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  StartupTN STN99974
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 mt-1 leading-none">
                Cloud Operatory Suite • FDI Bilateral Charting • Chairside UPI
              </p>
            </div>
          </div>

          {/* Navigation Bar */}
          <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs sm:text-sm font-medium self-stretch sm:self-auto justify-between sm:justify-start">
            <button
              type="button"
              onClick={() => setActiveTab('appointments')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md transition-all text-center cursor-pointer ${
                activeTab === 'appointments' ? 'bg-white text-blue-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Appointments & Queue
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('charting')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md transition-all text-center cursor-pointer ${
                activeTab === 'charting' ? 'bg-white text-blue-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              FDI Odontogram
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('billing')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md transition-all text-center cursor-pointer ${
                activeTab === 'billing' ? 'bg-white text-blue-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chairside UPI
            </button>
          </nav>
        </div>
      </header>

      {/* ==========================================
          MAIN OPERATORY WORKSPACE
          ========================================== */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* ==========================================
            TAB 1: APPOINTMENTS & REAL-TIME QUEUE
            ========================================== */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            
            {/* Appointment Booking Panel */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <IconCalendar className="w-5 h-5 text-blue-600" />
                    Book Operatory Appointment
                  </h2>
                  <p className="text-xs text-slate-500">Register new patient consultations and assign operatory slots</p>
                </div>
              </div>

              <form onSubmit={handleBookAppointment} className="p-5 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Patient Full Name *</label>
                    <div className="relative">
                      <div className="absolute left-3 top-3 text-slate-400">
                        <IconUser className="w-4 h-4" />
                      </div>
                      <input 
                        type="text"
                        required
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder="e.g., Rajesh Kumar"
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp / Contact Number *</label>
                    <div className="relative">
                      <div className="absolute left-3 top-3 text-slate-400">
                        <IconPhone className="w-4 h-4" />
                      </div>
                      <input 
                        type="tel"
                        required
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Appointment Date</label>
                    <div className="relative">
                      <div className="absolute left-3 top-3 text-slate-400">
                        <IconCalendar className="w-4 h-4" />
                      </div>
                      <input 
                        type="date"
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Operatory Slot Time</label>
                    <div className="relative">
                      <div className="absolute left-3 top-3 text-slate-400">
                        <IconClock className="w-4 h-4" />
                      </div>
                      <input 
                        type="time"
                        value={appointmentTime}
                        onChange={(e) => setAppointmentTime(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Procedure</label>
                    <select 
                      value={treatmentType}
                      onChange={(e) => setTreatmentType(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option>Consultation & Diagnostic Exam</option>
                      <option>Ultrasonic Scaling & Polishing</option>
                      <option>Composite / GIC Restoration</option>
                      <option>Endodontic Treatment (Root Canal)</option>
                      <option>Crown / Fixed Partial Denture Prep</option>
                      <option>Exodontia / Extraction</option>
                      <option>Orthodontic Evaluation & Debonding</option>
                      <option>Periodontal Flap Surgery</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Notes / Chief Complaint</label>
                    <input 
                      type="text"
                      value={clinicalNotes}
                      onChange={(e) => setClinicalNotes(e.target.value)}
                      placeholder="e.g., Sensitive to cold liquids in 16 quadrant"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-lg shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <IconCheckCircle className="w-4 h-4" />
                    <span>Confirm & Enqueue Patient</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Instant Confirmation Card */}
            {bookingSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-600 text-white rounded-lg">
                      <IconCheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-emerald-900">Appointment Registered</h3>
                      <p className="text-xs text-emerald-700">Token ID: <span className="font-mono font-bold">{bookingSuccess.id}</span></p>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium bg-emerald-200/60 text-emerald-800 px-2.5 py-0.5 rounded-full">
                    Active Operatory Queue
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-emerald-200/70 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-emerald-700 font-medium">Patient:</span>
                    <p className="font-semibold text-emerald-950">{bookingSuccess.name}</p>
                  </div>
                  <div>
                    <span className="text-emerald-700 font-medium">Contact:</span>
                    <p className="font-semibold text-emerald-950">{bookingSuccess.phone}</p>
                  </div>
                  <div>
                    <span className="text-emerald-700 font-medium">Schedule:</span>
                    <p className="font-semibold text-emerald-950">{bookingSuccess.date} @ {bookingSuccess.time}</p>
                  </div>
                  <div>
                    <span className="text-emerald-700 font-medium">Procedure:</span>
                    <p className="font-semibold text-emerald-950 truncate">{bookingSuccess.treatment}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Operatory Queue Management */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <IconActivity className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-800">
                    Operatory Patient Queue ({filteredAppointments.length})
                  </h3>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="relative">
                    <div className="absolute left-2.5 top-2.5 text-slate-400">
                      <IconSearch className="w-3.5 h-3.5" />
                    </div>
                    <input 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search patient, phone, token..."
                      className="w-full sm:w-64 pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    {['ALL', 'Waiting', 'In Operatory', 'Completed'].map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setStatusFilter(filter)}
                        className={`px-2 py-1 text-[11px] font-semibold rounded-md border cursor-pointer transition-all ${
                          statusFilter === filter 
                            ? 'bg-blue-600 text-white border-blue-600' 
                            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {filteredAppointments.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No matching appointments found in the operatory queue.
                  </div>
                ) : (
                  filteredAppointments.map((apt) => (
                    <div key={apt.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-800">{apt.name}</span>
                          <span className="text-[11px] font-mono text-slate-400">({apt.id})</span>
                          <span className="text-[11px] text-slate-500">• {apt.phone}</span>
                        </div>
                        <p className="text-xs font-medium text-slate-600">
                          {apt.treatment}
                        </p>
                        {apt.notes && (
                          <p className="text-[11px] text-slate-400 italic">
                            "{apt.notes}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                        <span className="text-xs font-semibold text-slate-600">{apt.date} @ {apt.time}</span>
                        
                        {/* Status Cycling Dropdown */}
                        <select 
                          value={apt.status}
                          onChange={(e) => updateAppointmentStatus(apt.id, e.target.value)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-full border cursor-pointer ${
                            apt.status === 'In Operatory'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : apt.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <option value="Waiting">Waiting</option>
                          <option value="In Operatory">In Operatory</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 2: FDI ADULT ODONTOGRAM & CLINICAL CHARTING
            ========================================== */}
        {activeTab === 'charting' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-800">
                    Bilateral FDI Adult Odontogram (32 Teeth)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Tap any tooth number to cycle through diagnostics or use the quick status bar below
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={resetOdontogram}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Reset Baseline
                  </button>
                </div>
              </div>

              {/* Status Legend */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
                <span className="text-slate-400 mr-2 text-[11px] uppercase tracking-wider font-bold">Diagnostic Status:</span>
                {statusCycle.map((st) => (
                  <span key={st} className={`px-2.5 py-1 rounded-md border text-[11px] font-bold ${statusColors[st]}`}>
                    {st}
                  </span>
                ))}
              </div>

              {/* Upper Arch (Maxillary) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                    Upper Arch (Maxillary Quadrants 1 & 2)
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">18 to 28</span>
                </div>
                <div className="overflow-x-auto pb-2">
                  <div className="flex gap-1.5 min-w-[640px] justify-between">
                    {[18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28].map((tooth) => (
                      <button
                        key={tooth}
                        type="button"
                        onClick={() => cycleToothStatus(tooth)}
                        className={`flex-1 py-3 px-1 rounded-lg border text-center transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95 ${
                          selectedTooth === tooth ? 'ring-2 ring-blue-500 ring-offset-1 ' : ''
                        } ${statusColors[teethStatus[tooth]]}`}
                      >
                        <span className="block text-xs font-black">{tooth}</span>
                        <span className="block text-[9px] font-bold truncate mt-0.5">{teethStatus[tooth].substring(0, 3)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Lower Arch (Mandibular) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                    Lower Arch (Mandibular Quadrants 4 & 3)
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">48 to 38</span>
                </div>
                <div className="overflow-x-auto pb-2">
                  <div className="flex gap-1.5 min-w-[640px] justify-between">
                    {[48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38].map((tooth) => (
                      <button
                        key={tooth}
                        type="button"
                        onClick={() => cycleToothStatus(tooth)}
                        className={`flex-1 py-3 px-1 rounded-lg border text-center transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95 ${
                          selectedTooth === tooth ? 'ring-2 ring-blue-500 ring-offset-1 ' : ''
                        } ${statusColors[teethStatus[tooth]]}`}
                      >
                        <span className="block text-xs font-black">{tooth}</span>
                        <span className="block text-[9px] font-bold truncate mt-0.5">{teethStatus[tooth].substring(0, 3)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Selected Tooth Diagnostic Controller */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-slate-500">Active Selected Tooth:</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-lg font-black text-slate-900 font-mono">#{selectedTooth}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${statusColors[teethStatus[selectedTooth]]}`}>
                      {teethStatus[selectedTooth]}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {statusCycle.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setToothSpecificStatus(st)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        teethStatus[selectedTooth] === st 
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      Set {st}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==========================================
            TAB 3: CHAIRSIDE DYNAMIC UPI BILLING
            ========================================== */}
        {activeTab === 'billing' && (
          <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            
            <div className="text-center space-y-1">
              <div className="inline-flex p-3 rounded-full bg-blue-50 text-blue-600 mb-1">
                <IconQrCode className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Chairside Instant UPI Settlement</h2>
              <p className="text-xs text-slate-500">Scan with GPay, PhonePe, Paytm, BHIM or any UPI-enabled app</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Operatory Invoice Ref</label>
                  <input 
                    type="text"
                    value={billInvoiceNo}
                    onChange={(e) => setBillInvoiceNo(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold text-slate-800 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payable Amount (INR) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-bold text-sm">₹</span>
                    <input 
                      type="number"
                      value={billAmount}
                      onChange={(e) => setBillAmount(e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 text-base font-bold text-slate-900 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-400 mr-1">Quick Select:</span>
                {presetAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setBillAmount(amt)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md border cursor-pointer transition-all ${
                      billAmount === amt 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Generated UPI QR Code Preview */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col items-center justify-center">
              <div className="bg-white p-3 rounded-xl shadow-xs border border-slate-200">
                <img 
                  src={qrCodeUrl}
                  alt="Dynamic Chairside UPI QR Code" 
                  className="w-60 h-60 object-contain rounded-lg"
                />
              </div>

              <div className="mt-4 text-center space-y-1">
                <p className="text-sm font-bold text-slate-800">{payeeName}</p>
                <div className="flex items-center justify-center gap-1.5">
                  <span className="font-mono text-xs text-slate-500">{upiId}</span>
                  <button 
                    type="button"
                    onClick={copyToClipboard}
                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title="Copy UPI ID"
                  >
                    {copiedUPI ? <span className="text-emerald-600"><IconCheckCircle className="w-3.5 h-3.5" /></span> : <IconCopy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Ref: {billInvoiceNo} • INR {billAmount}.00</p>
              </div>
            </div>

            {/* Direct App Launch Button for Mobile Web */}
            <a 
              href={upiUrl}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <IconExternalLink className="w-4 h-4" />
              <span>Launch Installed UPI App</span>
            </a>
          </div>
        )}

      </main>

      {/* ==========================================
          GLOBAL FOOTER: CLINICAL CREDENTIALS
          ========================================== */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 px-4 text-center">
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
          <IconShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Meridian Dental OS • Recognized by StartupTN (STN99974) • Operatory v1.0.0</span>
        </div>
      </footer>
    </div>
  );
}