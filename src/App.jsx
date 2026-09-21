import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  Users, 
  Receipt, 
  Activity, 
  Upload, 
  Search, 
  Bell, 
  IndianRupee, 
  FileText, 
  UserPlus, 
  ArrowLeft, 
  Phone, 
  Mail, 
  Calendar 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const revenueData = [
  { month: 'Jan', revenue: 240000 },
  { month: 'Feb', revenue: 310000 },
  { month: 'Mar', revenue: 295000 },
  { month: 'Apr', revenue: 420000 },
  { month: 'May', revenue: 480000 },
  { month: 'Jun', revenue: 560000 },
];

const mockPatients = [
  { id: 'MRD-8921', name: 'Rajesh Kumar', age: 34, gender: 'Male', phone: '+91 98765 43210', email: 'rajesh.kumar@gmail.com', lastVisit: '2026-09-15' },
  { id: 'MRD-8922', name: 'Priya Sharma', age: 29, gender: 'Female', phone: '+91 98412 87654', email: 'priya.sharma@yahoo.co.in', lastVisit: '2026-09-18' },
  { id: 'MRD-8923', name: 'Anitha Ramesh', age: 42, gender: 'Female', phone: '+91 97103 54321', email: 'anitha.ramesh@outlook.com', lastVisit: '2026-09-20' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPatient, setSelectedPatient] = useState(null);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0">
        <div>
          {/* Clinic Logo Header */}
          <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              M
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-slate-900 leading-none">Meridian Dental</h1>
              <span className="text-[11px] text-teal-600 font-semibold tracking-wide uppercase">Clinic SaaS • India</span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1.5">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
              { id: 'appointments', name: 'Appointments', icon: CalendarCheck },
              { id: 'patients', name: 'Patients & Records', icon: Users },
              { id: 'billing', name: 'Billing & Revenue', icon: Receipt },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id && !selectedPatient;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setSelectedPatient(null); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-teal-50 text-teal-700 font-semibold' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Doctor Account Info Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs">
            DR
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-slate-900 truncate">Dr. S. K. Raman</p>
            <p className="text-xs text-slate-400 truncate">doctor@meridiandental.in</p>
          </div>
        </div>
      </aside>

      {/* Main Screen Content */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search patient, phone, bill..." 
              className="w-full bg-slate-50 border border-slate-200 pl-9 pr-4 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
              <Bell className="w-5 h-5" />
              <span className="w-2 h-2 bg-red-500 rounded-full absolute top-1.5 right-1.5"></span>
            </button>
          </div>
        </header>

        {/* Dynamic Views */}
        <div className="p-8 space-y-6">
          {selectedPatient ? (
            <PatientDetailView patient={selectedPatient} onBack={() => setSelectedPatient(null)} />
          ) : (
            <>
              {activeTab === 'dashboard' && <DashboardView />}
              {activeTab === 'appointments' && <AppointmentsView />}
              {activeTab === 'patients' && <PatientsView onSelectPatient={setSelectedPatient} />}
              {activeTab === 'billing' && <BillingView />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// 1. Dashboard View
function DashboardView() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Meridian Dental Clinic Dashboard</h2>
        <p className="text-sm text-slate-500">Live operational overview, OPG records & financial performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Patients', value: '1,420', change: '+12%', icon: Users },
          { label: 'Appointments Today', value: '28', change: '+4%', icon: CalendarCheck },
          { label: 'OPG Scans Completed', value: '384', change: '+9%', icon: Activity },
          { label: 'Monthly Revenue', value: '₹5,60,000', change: '+18%', icon: IndianRupee },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">{kpi.label}</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{kpi.value}</h3>
                <span className="text-xs font-semibold text-emerald-600">{kpi.change} from last month</span>
              </div>
              <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-slate-900">Revenue Growth (₹ INR)</h3>
          <p className="text-xs text-slate-500">Monthly gross clinic revenue collection</p>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `₹${val / 1000}k`} />
              <Tooltip formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// 2. Appointments View
function AppointmentsView() {
  const appointments = [
    { id: 'APT-101', patient: 'Priya Sharma', time: '10:00 AM', dentist: 'Dr. Raman', procedure: 'Root Canal Treatment (RCT)', status: 'In-Progress' },
    { id: 'APT-102', patient: 'Rajesh Kumar', time: '11:30 AM', dentist: 'Dr. Raman', procedure: 'Full Mouth OPG X-Ray', status: 'Confirmed' },
    { id: 'APT-103', patient: 'Anitha Ramesh', time: '04:15 PM', dentist: 'Dr. Lakshmi', procedure: 'Teeth Scaling & Polishing', status: 'Pending' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">Appointments Schedule</h2>
        <button className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm">
          + Book Appointment
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs">
            <tr>
              <th className="py-3.5 px-4">Patient</th>
              <th className="py-3.5 px-4">Time</th>
              <th className="py-3.5 px-4">Doctor</th>
              <th className="py-3.5 px-4">Procedure</th>
              <th className="py-3.5 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {appointments.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/60">
                <td className="py-3.5 px-4 font-medium text-slate-800">{row.patient}</td>
                <td className="py-3.5 px-4 text-slate-600">{row.time}</td>
                <td className="py-3.5 px-4 text-slate-600">{row.dentist}</td>
                <td className="py-3.5 px-4 text-slate-600">{row.procedure}</td>
                <td className="py-3.5 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    row.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700' :
                    row.status === 'In-Progress' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 3. Patients Database View
function PatientsView({ onSelectPatient }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Patients Directory</h2>
          <p className="text-sm text-slate-500">Click any patient to open individual record, OPG scans, and dental charting</p>
        </div>
        <button className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm">
          <UserPlus className="w-4 h-4" /> Add Patient
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs">
            <tr>
              <th className="py-3.5 px-4">Patient ID</th>
              <th className="py-3.5 px-4">Patient Name</th>
              <th className="py-3.5 px-4">Age / Gender</th>
              <th className="py-3.5 px-4">Mobile (+91)</th>
              <th className="py-3.5 px-4">Last Visit</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mockPatients.map((patient) => (
              <tr key={patient.id} className="hover:bg-slate-50/60 cursor-pointer" onClick={() => onSelectPatient(patient)}>
                <td className="py-3.5 px-4 font-mono text-xs text-teal-600 font-semibold">{patient.id}</td>
                <td className="py-3.5 px-4 font-medium text-slate-900">{patient.name}</td>
                <td className="py-3.5 px-4 text-slate-600">{patient.age} yrs / {patient.gender}</td>
                <td className="py-3.5 px-4 text-slate-600">{patient.phone}</td>
                <td className="py-3.5 px-4 text-slate-600">{patient.lastVisit}</td>
                <td className="py-3.5 px-4 text-right">
                  <button className="text-teal-600 hover:text-teal-800 text-xs font-semibold px-2.5 py-1 bg-teal-50 rounded">
                    Open File &rarr;
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

// 4. Patient Detail View (with FDA/FDI & Universal Tooth Numbering Toggle)
function PatientDetailView({ patient, onBack }) {
  const [numberingSystem, setNumberingSystem] = useState('FDI');

  // FDI (FDA) System
  const fdiUpperRight = [18, 17, 16, 15, 14, 13, 12, 11];
  const fdiUpperLeft = [21, 22, 23, 24, 25, 26, 27, 28];
  const fdiLowerLeft = [38, 37, 36, 35, 34, 33, 32, 31];
  const fdiLowerRight = [41, 42, 43, 44, 45, 46, 47, 48];

  // Universal System
  const universalUpperRight = [1, 2, 3, 4, 5, 6, 7, 8];
  const universalUpperLeft = [9, 10, 11, 12, 13, 14, 15, 16];
  const universalLowerLeft = [17, 18, 19, 20, 21, 22, 23, 24];
  const universalLowerRight = [25, 26, 27, 28, 29, 30, 31, 32];

  const upperRight = numberingSystem === 'FDI' ? fdiUpperRight : universalUpperRight;
  const upperLeft = numberingSystem === 'FDI' ? fdiUpperLeft : universalUpperLeft;
  const lowerLeft = numberingSystem === 'FDI' ? fdiLowerLeft : universalLowerLeft;
  const lowerRight = numberingSystem === 'FDI' ? fdiLowerRight : universalLowerRight;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Patient List
        </button>
        <span className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-xs font-semibold">
          Patient File: {patient.id}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Patient Profile */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="text-center pb-4 border-b border-slate-100">
            <div className="w-16 h-16 bg-teal-100 text-teal-700 font-bold rounded-full flex items-center justify-center text-xl mx-auto mb-3">
              {patient.name.split(' ').map(n => n[0]).join('')}
            </div>
            <h3 className="text-lg font-bold text-slate-900">{patient.name}</h3>
            <p className="text-xs text-slate-500">{patient.age} years old • {patient.gender}</p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-slate-600">
              <Phone className="w-4 h-4 text-slate-400" />
              <span className="font-mono">{patient.phone}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{patient.email}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Last Visit: {patient.lastVisit}</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase">Medical Alerts</p>
            <p className="text-xs text-slate-700 font-medium">No allergies reported. Slight tartar deposition in lower anteriors.</p>
          </div>
        </div>

        {/* Right 2 Columns: Tooth Chart & OPG */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Dental Charting System</h3>
                <p className="text-xs text-slate-500">Toggle tooth numbering convention</p>
              </div>
              {/* Toggle Switch */}
              <div className="bg-slate-100 p-1 rounded-lg flex items-center">
                <button 
                  onClick={() => setNumberingSystem('FDI')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${numberingSystem === 'FDI' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600'}`}
                >
                  FDI (FDA) System
                </button>
                <button 
                  onClick={() => setNumberingSystem('Universal')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${numberingSystem === 'Universal' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600'}`}
                >
                  Universal System
                </button>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-6 text-center">
              <div>
                <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-3">Upper Arch (Maxillary)</p>
                <div className="flex justify-center gap-1 sm:gap-2 flex-wrap">
                  {upperRight.concat(upperLeft).map((num, i) => (
                    <div key={i} className="w-9 h-10 bg-white border border-slate-200 rounded flex flex-col items-center justify-center shadow-sm hover:border-teal-500 cursor-pointer">
                      <span className="text-[10px] font-bold text-teal-600">{num}</span>
                      <div className="w-2 h-2 rounded-full bg-emerald-400 mt-0.5"></div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-3">Lower Arch (Mandibular)</p>
                <div className="flex justify-center gap-1 sm:gap-2 flex-wrap">
                  {lowerRight.concat(lowerLeft).map((num, i) => (
                    <div key={i} className="w-9 h-10 bg-white border border-slate-200 rounded flex flex-col items-center justify-center shadow-sm hover:border-teal-500 cursor-pointer">
                      <span className="text-[10px] font-bold text-teal-600">{num}</span>
                      <div className="w-2 h-2 rounded-full bg-amber-400 mt-0.5"></div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-slate-400 italic">Green = Healthy • Amber = Cavity / Treatment Needed</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-base">Orthopantomogram (OPG Scan)</h3>
              <label className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm">
                <Upload className="w-3.5 h-3.5" /> Upload OPG X-Ray
                <input type="file" className="hidden" accept="image/*" />
              </label>
            </div>
            <div className="w-full h-48 bg-slate-950 rounded-lg flex items-center justify-center border border-slate-800 text-slate-500">
              <div className="text-center">
                <Activity className="w-8 h-8 mx-auto mb-1 opacity-50" />
                <p className="text-xs tracking-wider">PANORAMIC X-RAY PREVIEW ARCHIVE</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 5. Billing View
function BillingView() {
  const invoices = [
    { id: 'INV-001', patient: 'Priya Sharma', service: 'Root Canal + Crown', amount: '₹8,500', status: 'Paid' },
    { id: 'INV-002', patient: 'Rajesh Kumar', service: 'Full Panoramic OPG Scan', amount: '₹1,500', status: 'Unpaid' },
    { id: 'INV-003', patient: 'Anitha Ramesh', service: 'Deep Teeth Scaling', amount: '₹1,800', status: 'Paid' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">Billing & GST Invoices</h2>
        <button className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-sm">
          <FileText className="w-4 h-4" /> Create Bill
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs">
            <tr>
              <th className="py-3.5 px-4">Bill No</th>
              <th className="py-3.5 px-4">Patient Name</th>
              <th className="py-3.5 px-4">Dental Procedure</th>
              <th className="py-3.5 px-4">Amount (INR)</th>
              <th className="py-3.5 px-4">Payment Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50/60">
                <td className="py-3.5 px-4 font-medium text-slate-800">{inv.id}</td>
                <td className="py-3.5 px-4 text-slate-600">{inv.patient}</td>
                <td className="py-3.5 px-4 text-slate-600">{inv.service}</td>
                <td className="py-3.5 px-4 font-semibold text-slate-900">{inv.amount}</td>
                <td className="py-3.5 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {inv.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}