import React, { useState } from 'react';

// Native SVG Icons (Zero external build dependencies)
const IconCalendar = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);

const IconClock = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconUser = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconPhone = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const IconCheckCircle = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const IconQrCode = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

const IconExternalLink = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </svg>
);

const IconShieldCheck = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('appointments');

  // Appointment Form & Queue State
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [treatmentType, setTreatmentType] = useState('Consultation & Diagnostic Exam');
  const [bookingSuccess, setBookingSuccess] = useState(null);

  const [appointmentsList, setAppointmentsList] = useState([
    {
      id: 'APT-1042',
      name: 'Vigneshwaran M',
      phone: '+91 98421 11029',
      date: 'Today',
      time: '11:30 AM',
      treatment: 'Composite / GIC Restoration',
      status: 'Confirmed'
    },
    {
      id: 'APT-1043',
      name: 'Ananya S',
      phone: '+91 97904 88321',
      date: 'Today',
      time: '02:00 PM',
      treatment: 'Endodontic Treatment (Root Canal)',
      status: 'In Operatory'
    }
  ]);

  // Billing State
  const [billAmount, setBillAmount] = useState('500');
  const [copiedUPI, setCopiedUPI] = useState(false);
  const upiId = "santhoshkumar758210@oksbi";
  const payeeName = "SanthoshKumar";

  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${billAmount}&cu=INR`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUrl)}&margin=10`;

  // FDI Odontogram Interactive State (32 Adult Teeth)
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
    const current = teethStatus[toothNum] || 'Healthy';
    const nextIdx = (statusCycle.indexOf(current) + 1) % statusCycle.length;
    setTeethStatus(prev => ({ ...prev, [toothNum]: statusCycle[nextIdx] }));
  };

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
      status: 'Confirmed'
    };

    setBookingSuccess(newAppointment);
    setAppointmentsList(prev => [newAppointment, ...prev]);
    setPatientName('');
    setPatientPhone('');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUPI(true);
    setTimeout(() => setCopiedUPI(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-100 overflow-x-hidden">
      
      {/* Official Header with Dark Squircle MD Brand Icon */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 sm:px-6 shadow-sm">
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
                  Meridian Dental
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  StartupTN STN99974
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 mt-1 leading-none">
                Dental Clinic Management System
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs sm:text-sm font-medium self-stretch sm:self-auto justify-between sm:justify-start">
            <button
              type="button"
              onClick={() => setActiveTab('appointments')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md transition-all text-center ${
                activeTab === 'appointments' ? 'bg-white text-blue-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Appointments
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('charting')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md transition-all text-center ${
                activeTab === 'charting' ? 'bg-white text-blue-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              FDI Odontogram
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('billing')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md transition-all text-center ${
                activeTab === 'billing' ? 'bg-white text-blue-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chairside UPI
            </button>
          </div>
        </div>
      </header>

      {/* Main Operatory View */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* TAB 1: APPOINTMENTS */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <IconCalendar className="w-5 h-5 text-blue-600" />
                    Book Operatory Appointment
                  </h2>
                  <p className="text-xs text-slate-500">Register new patient consultations and operatory slots</p>
                </div>
              </div>

              <form onSubmit={handleBookAppointment} className="p-5 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <IconCheckCircle className="w-4 h-4" />
                    <span>Confirm Appointment</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Instant Confirmation Card */}
            {bookingSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-600 text-white rounded-lg">
                      <IconCheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-emerald-900">Appointment Confirmed</h3>
                      <p className="text-xs text-emerald-700">Token ID: <span className="font-mono font-bold">{bookingSuccess.id}</span></p>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium bg-emerald-200/60 text-emerald-800 px-2.5 py-0.5 rounded-full">
                    Active Operatory
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

            {/* Operatory Patient Queue */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Operatory Queue ({appointmentsList.length})
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {appointmentsList.map((apt) => (
                  <div key={apt.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-800">{apt.name}</span>
                        <span className="text-[11px] font-mono text-slate-400">({apt.id})</span>
                      </div>
                      <p className="text-xs text-slate-500">{apt.treatment} • {apt.phone}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">{apt.date} @ {apt.time}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        apt.status === 'In Operatory' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-blue-100 text-blue-700'