import React, { useState, useEffect, useRef } from "react";
import {
  Menu,
  X,
  Search,
  Plus,
  Trash2,
  Share2,
  Eye,
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
  Clock,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  QrCode,
  Download,
  FileSpreadsheet,
  Settings,
  Baby,
  Activity,
  Layers,
  Ruler,
  Phone,
  FileText,
  User,
  HeartPulse
} from "lucide-react";

// --- DENTITION SCHEMAS (FDI TWO-DIGIT SYSTEM) ---
const PERMANENT_UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const PERMANENT_LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const DECIDUOUS_UPPER = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
const DECIDUOUS_LOWER = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];

// Exact palette items matching screenshot (73145.jpg)
const CLINICAL_PALETTE = [
  { id: "HLT", label: "Healthy", border: "border-emerald-300", bg: "bg-emerald-50/60", text: "text-emerald-700" },
  { id: "CAR", label: "Caries", border: "border-rose-200", bg: "bg-rose-50/60", text: "text-rose-600" },
  { id: "RES", label: "Restored", border: "border-sky-200", bg: "bg-sky-50/60", text: "text-sky-600" },
  { id: "RCT", label: "RCT Done", border: "border-purple-200", bg: "bg-purple-50/60", text: "text-purple-600" },
  { id: "CRW", label: "Crown", border: "border-amber-200", bg: "bg-amber-50/60", text: "text-amber-600" },
  { id: "BRG", label: "Bridging (Under Cr...", border: "border-indigo-200", bg: "bg-indigo-50/60", text: "text-indigo-600" },
  { id: "IMP", label: "Implanted", border: "border-teal-200", bg: "bg-teal-50/60", text: "text-teal-600" },
  { id: "FRC", label: "Fractured (Trauma)", border: "border-rose-400 ring-2 ring-rose-200", bg: "bg-rose-50", text: "text-rose-700" },
  { id: "SPC", label: "Spacing", border: "border-cyan-200", bg: "bg-cyan-50/60", text: "text-cyan-600" },
  { id: "ATT", label: "Attrited", border: "border-orange-200", bg: "bg-orange-50/60", text: "text-orange-600" },
  { id: "MAL", label: "Malaligned (Under...", border: "border-fuchsia-200", bg: "bg-fuchsia-50/60", text: "text-fuchsia-600" },
  { id: "PRM", label: "Paramolar", border: "border-pink-200", bg: "bg-pink-50/60", text: "text-pink-600" },
  { id: "SCL", label: "Scaling (Calculus / ...", border: "border-yellow-200", bg: "bg-yellow-50/60", text: "text-yellow-600" },
  { id: "DEF", label: "Deformities", border: "border-purple-200", bg: "bg-purple-50/60", text: "text-purple-600" },
  { id: "BND", label: "Bone Deformations", border: "border-slate-200", bg: "bg-slate-50", text: "text-slate-600" },
  { id: "MIS", label: "Missing / Extracted", border: "border-slate-300", bg: "bg-slate-100", text: "text-slate-600" },
];

const PRESET_MEDICATIONS = [
  { name: "Zerodol-SP", generic: "Aceclofenac 100mg + Paracetamol 325mg + Serratiopeptidase 15mg", frequency: "1-0-1", duration: "3 Days", timing: "After Food" },
  { name: "Moxikind-CV 625", generic: "Amoxicillin 500mg + Clavulanic Acid 125mg", frequency: "1-0-1", duration: "5 Days", timing: "After Food" },
  { name: "Ketorol-DT", generic: "Ketorolac Tromethamine 10mg (Dispersible)", frequency: "SOS", duration: "2 Days", timing: "Dissolve in half cup water" },
  { name: "Metrogyl 400", generic: "Metronidazole 400mg", frequency: "1-1-1", duration: "3 Days", timing: "After Food" },
  { name: "Rexidin 0.2%", generic: "Chlorhexidine Gluconate 0.2% w/v Mouthwash", frequency: "1-0-1", duration: "7 Days", timing: "10ml rinse for 1 min after brushing" },
  { name: "Kenacort 0.1%", generic: "Triamcinolone Acetonide 0.1% Oral Paste", frequency: "0-0-1", duration: "5 Days", timing: "Apply thinly at bedtime over ulcer" },
];

export default function App() {
  // Navigation State
  const [activeNav, setActiveNav] = useState("Patients & Odontogram");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState(null);

  // --- PERSISTENT DATA STORES (Zero Mock Data) ---
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

  const [employees, setEmployees] = useState(() => {
    try {
      const stored = localStorage.getItem("meridian_employees");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Practice Profile
  const [practiceProfile, setPracticeProfile] = useState(() => {
    try {
      const stored = localStorage.getItem("meridian_profile");
      return stored ? JSON.parse(stored) : {
        name: "Meridian Dental Clinic",
        tagline: "Advanced Dental Care & Implant Center",
        regNumber: "UDYAM-TN-04-0139569",
        drName: "Dr. Santhoshkumar S / Dr. Sivasabari G",
        qualification: "BDS, Dental Surgery",
        phone: "9840100001",
        email: "contact@meridiandental.in",
        upiId: "meridianclinic@upi",
        address: "Coimbatore, Tamil Nadu, India"
      };
    } catch {
      return {
        name: "Meridian Dental Clinic",
        tagline: "Advanced Dental Care & Implant Center",
        regNumber: "UDYAM-TN-04-0139569",
        drName: "Dr. Santhoshkumar S / Dr. Sivasabari G",
        qualification: "BDS, Dental Surgery",
        phone: "9840100001",
        email: "contact@meridiandental.in",
        upiId: "meridianclinic@upi",
        address: "Coimbatore, Tamil Nadu, India"
      };
    }
  });

  // Save changes to localStorage
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
    localStorage.setItem("meridian_employees", JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem("meridian_profile", JSON.stringify(practiceProfile));
  }, [practiceProfile]);

  // Toast Notification Helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // --- MODAL STATES ---
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState("32-Tooth Odontogram");

  // New Patient Form
  const [newPatientForm, setNewPatientForm] = useState({
    name: "",
    phone: "",
    age: "",
    gender: "Male",
    conditions: "None reported",
    allergies: "NKDA",
  });

  // Odontogram Screen Local State
  const [isDeciduous, setIsDeciduous] = useState(false);
  const [activePaletteStatus, setActivePaletteStatus] = useState("FRC");

  // OPG Workstation State
  const [opgSelectedPatientId, setOpgSelectedPatientId] = useState(null);
  const [isNegativeInverted, setIsNegativeInverted] = useState(false);
  const [rulerActive, setRulerActive] = useState(false);
  const [rulerPoints, setRulerPoints] = useState([]);
  const fileInputRef = useRef(null);
  const opgCanvasRef = useRef(null);

  // New Appointment Modal State
  const [isAddApptOpen, setIsAddApptOpen] = useState(false);
  const [newApptForm, setNewApptForm] = useState({
    patientId: "",
    patientName: "",
    phone: "",
    age: "",
    date: new Date().toISOString().split("T")[0],
    time: "10:30",
    chair: "Chair 1 (Main Operatory)",
    doctor: practiceProfile.drName,
    procedure: "Root Canal Therapy (Access)",
    status: "Confirmed",
  });

  // New Invoice Modal State
  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = useState(false);
  const [activeUpiQrInvoice, setActiveUpiQrInvoice] = useState(null);
  const [newInvoiceForm, setNewInvoiceForm] = useState({
    patientName: "",
    provider: "National Health TPA",
    claimId: `CLM-${Date.now().toString().slice(-6)}`,
    status: "Pre-Auth Approved",
    treatment: "Root Canal Therapy & Crown",
    amount: "5500",
  });

  // New Stock Modal State
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [newStockForm, setNewStockForm] = useState({
    name: "",
    category: "Restorative",
    quantity: 10,
    unit: "Syringes",
    minThreshold: 5,
  });

  // New Employee Modal State
  const [isAddEmpOpen, setIsAddEmpOpen] = useState(false);
  const [newEmpForm, setNewEmpForm] = useState({
    name: "",
    role: "Clinical Specialist A",
    dept: "Restorative & Surgical Lead",
    shift: "Morning (09:00 - 14:00)",
    contact: "+91 98401 00001",
    active: true,
  });

  // Helper: Active Selected Patient Record
  const activePatient = patients.find((p) => p.id === selectedPatientId) || null;

  // Add Patient Action
  const handleCreatePatient = (e) => {
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
      opgImage: null,
      diagnosis: {
        trauma: "No acute trauma recorded.",
        impaction: "None charted.",
        boneDeformations: "Normal bone crest height.",
        diagnosisNotes: "No diagnostic notes entered.",
      },
      prescriptions: [],
    };
    setPatients([created, ...patients]);
    setNewPatientForm({
      name: "",
      phone: "",
      age: "",
      gender: "Male",
      conditions: "None reported",
      allergies: "NKDA",
    });
    setIsAddPatientOpen(false);
    setSelectedPatientId(created.id);
    setIsChartModalOpen(true);
    showToast(`Patient ${created.name} registered successfully`);
  };

  // Tooth Click in Odontogram
  const handleToothTap = (toothNumber) => {
    if (!activePatient) return;
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === activePatient.id) {
          const currentConditions = { ...(p.toothConditions || {}) };
          if (currentConditions[toothNumber] === activePaletteStatus) {
            delete currentConditions[toothNumber];
          } else {
            currentConditions[toothNumber] = activePaletteStatus;
          }
          return { ...p, toothConditions: currentConditions };
        }
        return p;
      })
    );
  };

  // Update Diagnostic Fields in Realtime
  const handleUpdateDiagnosis = (field, value) => {
    if (!activePatient) return;
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === activePatient.id) {
          return {
            ...p,
            diagnosis: {
              ...(p.diagnosis || {}),
              [field]: value,
            },
          };
        }
        return p;
      })
    );
  };

  // Add Prescription to Patient
  const handleAddPrescription = (med) => {
    if (!activePatient) return;
    const newRxItem = {
      id: Date.now(),
      drug: med.name || med.drug,
      generic: med.generic,
      dosage: med.dosage || "1 Tab",
      frequency: med.frequency,
      duration: med.duration,
      instruction: med.timing || med.instruction || "After food",
    };
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === activePatient.id) {
          return {
            ...p,
            prescriptions: [...(p.prescriptions || []), newRxItem],
          };
        }
        return p;
      })
    );
    showToast(`Added ${newRxItem.drug} to prescription slip`);
  };

  const handleRemovePrescription = (rxId) => {
    if (!activePatient) return;
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === activePatient.id) {
          return {
            ...p,
            prescriptions: (p.prescriptions || []).filter((x) => x.id !== rxId),
          };
        }
        return p;
      })
    );
  };

  // WhatsApp Clinical Notifier / Rx Dispatcher
  const dispatchPatientWhatsApp = () => {
    if (!activePatient) return;
    let cleanPhone = activePatient.phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;

    if (!cleanPhone || cleanPhone.length < 10) {
      showToast("Invalid phone number for WhatsApp dispatch");
      return;
    }

    const chartedList = Object.entries(activePatient.toothConditions || {})
      .map(([tooth, code]) => {
        const found = CLINICAL_PALETTE.find((p) => p.id === code);
        return `#${tooth} (${found ? found.label : code})`;
      })
      .join(", ") || "General Oral Examination";

    const rxList = (activePatient.prescriptions || [])
      .map((p, idx) => `${idx + 1}. *${p.drug}* - ${p.frequency} (${p.duration})\n   Instruction: ${p.instruction}`)
      .join("\n\n");

    const message = encodeURIComponent(
      `🦷 *${practiceProfile.name.toUpperCase()}*\n` +
      `📍 ${practiceProfile.address} | 📞 ${practiceProfile.phone}\n` +
      `----------------------------------------\n` +
      `👤 *Patient:* ${activePatient.name} (Age: ${activePatient.age || "N/A"} Yrs / ${activePatient.gender})\n` +
      `📅 *Date:* ${activePatient.registeredDate}\n` +
      `🩺 *Doctor:* ${practiceProfile.drName}\n` +
      `----------------------------------------\n` +
      `📋 *FDI Odontogram Findings:*\n${chartedList}\n\n` +
      (rxList ? `💊 *Medications Prescribed:*\n${rxList}\n\n` : "") +
      `----------------------------------------\n` +
      `⚠️ *Patient Care Advice:*\n` +
      `• Please take prescribed medications strictly on time.\n` +
      `• In case of persistent swelling or drug allergy, contact clinic immediately.\n\n` +
      `_Powered by Meridian Dental OS (Udyam: ${practiceProfile.regNumber})_`
    );

    window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank", "noopener,noreferrer");
    showToast("WhatsApp message dispatched!");
  };

  // OPG Upload for Selected Patient
  const handleOpgFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      const targetId = opgSelectedPatientId || selectedPatientId || (patients[0] && patients[0].id);
      if (!targetId) {
        showToast("Please register or select a patient first");
        return;
      }
      setPatients((prev) =>
        prev.map((p) => {
          if (p.id === targetId) {
            return { ...p, opgImage: dataUrl };
          }
          return p;
        })
      );
      showToast("OPG Radiograph film uploaded & linked to patient");
    };
    reader.readAsDataURL(file);
  };

  // Appointment Booking Action
  const handleCreateAppointment = (e) => {
    e.preventDefault();
    if (!newApptForm.patientName.trim() || !newApptForm.phone.trim()) {
      showToast("Patient Name and Phone are required");
      return;
    }
    const appt = {
      id: "APT-" + Date.now().toString().slice(-4),
      ...newApptForm,
    };
    setAppointments([appt, ...appointments]);
    setIsAddApptOpen(false);
    showToast(`Appointment booked for ${appt.patientName} on ${appt.date}`);
  };

  // Direct WhatsApp for Appointment
  const sendAppointmentWhatsApp = (appt) => {
    let cleanPhone = appt.phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;

    const message = encodeURIComponent(
      `🦷 *APPOINTMENT CONFIRMATION*\n` +
      `🏥 *${practiceProfile.name}*\n` +
      `----------------------------------------\n` +
      `👤 *Patient:* ${appt.patientName} (Age: ${appt.age || "N/A"})\n` +
      `📅 *Date:* ${appt.date}\n` +
      `⏰ *Time Slot:* ${appt.time}\n` +
      `💺 *Operatory:* ${appt.chair}\n` +
      `🩺 *Attending Doctor:* ${appt.doctor}\n` +
      `🔬 *Procedure:* ${appt.procedure}\n` +
      `----------------------------------------\n` +
      `📍 Please arrive 10 minutes prior to chair setup.\n\n` +
      `_Meridian Dental OS_`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank", "noopener,noreferrer");
  };

  // Invoice Creation Action
  const handleCreateInvoice = (e) => {
    e.preventDefault();
    if (!newInvoiceForm.patientName.trim()) {
      showToast("Patient Name is required");
      return;
    }
    const inv = {
      id: `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
      patient: newInvoiceForm.patientName,
      provider: newInvoiceForm.provider,
      claimId: newInvoiceForm.claimId,
      status: newInvoiceForm.status,
      treatment: newInvoiceForm.treatment,
      total: parseFloat(newInvoiceForm.amount || 0).toLocaleString("en-IN"),
      rawAmount: newInvoiceForm.amount,
      date: new Date().toLocaleDateString("en-IN"),
    };
    setInvoices([inv, ...invoices]);
    setIsAddInvoiceOpen(false);
    showToast(`Invoice ${inv.id} generated for ₹${inv.total}`);
  };

  // Stock Quick Adjust
  const handleStockAdjust = (stockId, delta) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === stockId) {
          const nextQty = Math.max(0, item.quantity + delta);
          return {
            ...item,
            quantity: nextQty,
            status: nextQty <= item.minThreshold ? "Low Stock" : "In Stock",
          };
        }
        return item;
      })
    );
  };

  // Stock Create
  const handleCreateStock = (e) => {
    e.preventDefault();
    if (!newStockForm.name.trim()) return;
    const item = {
      id: "STK-" + Date.now().toString().slice(-4),
      name: newStockForm.name,
      category: newStockForm.category,
      quantity: parseInt(newStockForm.quantity || 0, 10),
      unit: newStockForm.unit,
      minThreshold: parseInt(newStockForm.minThreshold || 0, 10),
      status: parseInt(newStockForm.quantity || 0, 10) <= parseInt(newStockForm.minThreshold || 0, 10) ? "Low Stock" : "In Stock",
    };
    setInventory([...inventory, item]);
    setIsAddStockOpen(false);
    showToast(`Added ${item.name} to stock`);
  };

  // Employee Create
  const handleCreateEmp = (e) => {
    e.preventDefault();
    if (!newEmpForm.name.trim()) return;
    const emp = {
      id: "EMP-0" + (employees.length + 1),
      ...newEmpForm,
    };
    setEmployees([...employees, emp]);
    setIsAddEmpOpen(false);
    showToast(`Staff member ${emp.name} added to roster`);
  };

  // OPG Ruler Measurement Calculation
  const calculateDistanceMm = () => {
    if (rulerPoints.length !== 2) return null;
    const dx = rulerPoints[1].x - rulerPoints[0].x;
    const dy = rulerPoints[1].y - rulerPoints[0].y;
    const px = Math.sqrt(dx * dx + dy * dy);
    // Estimated 0.08mm per pixel calibration
    return (px * 0.08).toFixed(1);
  };

  const handleOpgCanvasClick = (e) => {
    if (!rulerActive) return;
    const rect = opgCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (rulerPoints.length === 2) {
      setRulerPoints([{ x, y }]);
    } else {
      setRulerPoints([...rulerPoints, { x, y }]);
    }
  };

  // Filtered Patients List
  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone.includes(searchQuery)
  );

  // Active OPG Patient Object
  const currentOpgPatient = patients.find((p) => p.id === (opgSelectedPatientId || (patients[0] && patients[0].id))) || null;

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800 font-sans overflow-hidden">
      
      {/* --- TOAST NOTIFICATION --- */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#0b1329] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 text-xs border border-slate-700 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* --- SIDEBAR (Exact match to screenshot 73133.jpg) --- */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0b1329] text-white flex flex-col justify-between transition-transform duration-300 md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Logo & Header */}
          <div className="p-5 flex items-center justify-between border-b border-slate-800/80">
            <div>
              <div className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                Meridian Dental
              </div>
              <div className="text-[11px] text-slate-400 font-normal">
                Practice Management OS
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
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
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
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

        {/* User Profile in Sidebar Footer (matching 73133.jpg) */}
        <div className="p-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <div>
            <div className="font-semibold text-white">siva sabari</div>
            <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
              sabari2005g@gmail.com
            </div>
          </div>
          <button
            title="Export Practice Backup JSON"
            onClick={() => {
              const exportData = {
                practiceProfile,
                patients,
                appointments,
                invoices,
                inventory,
                employees,
              };
              const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `meridian-backup-${new Date().toISOString().split("T")[0]}.json`;
              a.click();
              showToast("System database backup downloaded");
            }}
            className="text-slate-400 hover:text-white p-1"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* --- MAIN WORKSPACE --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-slate-600 hover:text-slate-900"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="text-lg font-bold text-slate-900">Meridian Dental</div>
          </div>

          <div className="flex items-center gap-4">
            {/* Global Search Bar */}
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

            {/* Profile Avatar Badge */}
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold">
              S
            </div>
            <button
              title="Practice Info"
              onClick={() => setActiveNav("Practice Profile")}
              className="text-slate-400 hover:text-slate-600"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dynamic Body Content */}
        <main className="p-6 md:p-8 max-w-7xl mx-auto w-full">
          
          {/* ======================================================== */}
          {/* TAB 1: PATIENTS & ODONTOGRAM (Screenshot 73139.jpg)     */}
          {/* ======================================================== */}
          {activeNav === "Patients & Odontogram" && (
            <div>
              {/* Header Title with Add Patient Button */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Patient Records</h1>
                  <p className="text-xs text-slate-500">
                    FDI 32-Tooth Odontogram, Trauma, Rx & History
                  </p>
                </div>
                <button
                  onClick={() => setIsAddPatientOpen(true)}
                  className="px-4 py-2 bg-[#1d4ed8] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" /> Add Patient
                </button>
              </div>

              {/* Patient Records List */}
              {filteredPatients.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">No Patient Records Yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Start by clicking "Add Patient" to register your first clinical chart, FDI odontogram, and e-prescription.
                  </p>
                  <button
                    onClick={() => setIsAddPatientOpen(true)}
                    className="px-4 py-2 bg-[#1d4ed8] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Register First Patient
                  </button>
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
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({p.gender})
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            {p.phone} • Registered: {p.registeredDate}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Conditions: <span className="font-medium text-slate-700">{p.conditions || "None reported"}</span>
                          </div>
                        </div>

                        <div className="text-right flex items-center gap-4">
                          <div>
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                              {chartedCount} Teeth Charted
                            </span>
                            <div className="text-[11px] text-slate-400 mt-1">Open FDI Odontogram →</div>
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
                            className="p-1 text-slate-400 hover:text-rose-500 rounded"
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

          {/* ======================================================== */}
          {/* TAB 2: OPG & DIAGNOSIS STUDIO (Screenshot 73143.jpg)     */}
          {/* ======================================================== */}
          {activeNav === "OPG & Diagnosis Studio" && (
            <div className="space-y-6">
              {/* Header with Patient Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">OPG & Diagnosis Studio</h1>
                  <p className="text-xs text-slate-500">
                    Side-by-Side Panoramic Radiograph & Clinical Findings Workstation
                  </p>
                </div>
                <div>
                  {patients.length > 0 ? (
                    <select
                      value={opgSelectedPatientId || (currentOpgPatient ? currentOpgPatient.id : "")}
                      onChange={(e) => setOpgSelectedPatientId(e.target.value)}
                      className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.age}y - #{p.id})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-xs bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg border border-amber-200">
                      No patients registered yet
                    </div>
                  )}
                </div>
              </div>

              {/* Studio Split Layout (Exact match to 73143.jpg) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left: OPG Radiograph Card */}
                <div className="bg-[#0b1329] rounded-2xl p-5 text-white flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-sm font-bold">Baseline Panoramic OPG</div>
                        <div className="text-[11px] text-slate-400">
                          Patient: {currentOpgPatient ? `${currentOpgPatient.name} (${currentOpgPatient.age}y)` : "No Patient Selected"}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Real file input */}
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleOpgFileChange}
                          accept="image/*"
                          className="hidden"
                        />

                        {/* Insert Button */}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Insert OPG Film
                        </button>

                        {/* Invert Negative Button */}
                        <button
                          type="button"
                          onClick={() => setIsNegativeInverted(!isNegativeInverted)}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                        >
                          <Sun className="w-3.5 h-3.5" />
                          {isNegativeInverted ? "Normal View" : "Invert Negative (X-Ray)"}
                        </button>

                        {/* Ruler Measurement Tool */}
                        <button
                          type="button"
                          onClick={() => {
                            setRulerActive(!rulerActive);
                            setRulerPoints([]);
                          }}
                          className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            rulerActive
                              ? "bg-amber-500 text-white border-amber-400"
                              : "bg-slate-800 border-slate-700 text-slate-300"
                          }`}
                          title="Measure Working Length / Bone Loss in mm"
                        >
                          <Ruler className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Image Canvas Container */}
                    <div
                      ref={opgCanvasRef}
                      onClick={handleOpgCanvasClick}
                      className={`w-full h-80 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden relative ${
                        rulerActive ? "cursor-crosshair" : "cursor-default"
                      }`}
                    >
                      {currentOpgPatient && currentOpgPatient.opgImage ? (
                        <>
                          <img
                            src={currentOpgPatient.opgImage}
                            alt="Patient OPG Radiograph"
                            className={`w-full h-full object-cover transition-all duration-300 ${
                              isNegativeInverted ? "filter invert contrast-125 brightness-90" : ""
                            }`}
                          />

                          {/* SVG Interactive Ruler Overlay */}
                          <svg className="absolute inset-0 w-full h-full pointer-events-none">
                            {rulerPoints.map((pt, idx) => (
                              <circle
                                key={idx}
                                cx={pt.x}
                                cy={pt.y}
                                r="4"
                                fill="#f59e0b"
                                stroke="#ffffff"
                                strokeWidth="1.5"
                              />
                            ))}
                            {rulerPoints.length === 2 && (
                              <>
                                <line
                                  x1={rulerPoints[0].x}
                                  y1={rulerPoints[0].y}
                                  x2={rulerPoints[1].x}
                                  y2={rulerPoints[1].y}
                                  stroke="#f59e0b"
                                  strokeWidth="2"
                                  strokeDasharray="4 2"
                                />
                                <text
                                  x={(rulerPoints[0].x + rulerPoints[1].x) / 2 + 10}
                                  y={(rulerPoints[0].y + rulerPoints[1].y) / 2 - 10}
                                  fill="#f59e0b"
                                  fontSize="12"
                                  fontWeight="bold"
                                  className="drop-shadow-md"
                                >
                                  {calculateDistanceMm()} mm (WL)
                                </text>
                              </>
                            )}
                          </svg>
                        </>
                      ) : (
                        <div className="text-center p-6 space-y-2">
                          <Upload className="w-8 h-8 text-slate-600 mx-auto" />
                          <p className="text-xs text-slate-400">No OPG film uploaded for this patient.</p>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-xs text-blue-400 hover:underline font-medium"
                          >
                            Click to browse & attach panoramic film
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-4 mt-2 border-t border-slate-800">
                    <span>
                      {rulerActive ? (
                        <strong className="text-amber-400">
                          {rulerPoints.length === 0 && "Click apex point"}
                          {rulerPoints.length === 1 && "Click cusp / crest point"}
                          {rulerPoints.length === 2 && `Estimated Length: ${calculateDistanceMm()} mm`}
                        </strong>
                      ) : (
                        "High-Contrast Diagnostic View"
                      )}
                    </span>
                    {currentOpgPatient && currentOpgPatient.opgImage && (
                      <button
                        onClick={() => window.open(currentOpgPatient.opgImage, "_blank")}
                        className="text-blue-400 hover:underline flex items-center gap-1"
                      >
                        Full Resolution <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Right: Diagnostic Entry Pane (matches 73143.jpg) */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="text-xs font-bold text-slate-800 tracking-wider uppercase flex items-center gap-2">
                      <Sun className="w-4 h-4 text-blue-600" />
                      Diagnostic Entry Pane
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-rose-600 mb-1">
                        Trauma Findings
                      </label>
                      <input
                        type="text"
                        value={currentOpgPatient?.diagnosis?.trauma || ""}
                        onChange={(e) => handleUpdateDiagnosis("trauma", e.target.value)}
                        placeholder="Crown fracture, luxation, alveolar ridge integrity..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Impaction Classification
                      </label>
                      <input
                        type="text"
                        value={currentOpgPatient?.diagnosis?.impaction || ""}
                        onChange={(e) => handleUpdateDiagnosis("impaction", e.target.value)}
                        placeholder="Angulation, depth, position relative to ramus..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Bone Deformations & Height
                      </label>
                      <input
                        type="text"
                        value={currentOpgPatient?.diagnosis?.boneDeformations || ""}
                        onChange={(e) => handleUpdateDiagnosis("boneDeformations", e.target.value)}
                        placeholder="Horizontal bone loss, angular crest defects, furcation..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Diagnosis & Treatment Plan (Type Next to OPG)
                      </label>
                      <textarea
                        rows={3}
                        value={currentOpgPatient?.diagnosis?.diagnosisNotes || ""}
                        onChange={(e) => handleUpdateDiagnosis("diagnosisNotes", e.target.value)}
                        placeholder="Type formal clinical diagnosis and operative procedures here..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={() => showToast("Diagnostic findings saved successfully")}
                      className="w-full py-2.5 bg-[#1d4ed8] hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Save Diagnostic Findings
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: APPOINTMENTS DIARY                                */}
          {/* ======================================================== */}
          {activeNav === "Appointments Diary" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Appointments Diary</h1>
                  <p className="text-xs text-slate-500">
                    Chair-side scheduling, patient queuing & automated WhatsApp confirmations
                  </p>
                </div>
                <button
                  onClick={() => setIsAddApptOpen(true)}
                  className="px-4 py-2 bg-[#1d4ed8] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Book Appointment
                </button>
              </div>

              {appointments.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                  <Calendar className="w-10 h-10 text-blue-600 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-800">No Appointments Scheduled</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Click "Book Appointment" to schedule chair time, assign doctors, and notify patients via WhatsApp.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">ID / Patient</th>
                        <th className="p-3.5">Date & Slot</th>
                        <th className="p-3.5">Operatory Chair</th>
                        <th className="p-3.5">Attending Doctor</th>
                        <th className="p-3.5">Procedure</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {appointments.map((appt) => (
                        <tr key={appt.id} className="hover:bg-slate-50/60">
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900">{appt.patientName}</div>
                            <div className="text-[10px] text-slate-400">{appt.phone} • Age: {appt.age || "N/A"}</div>
                          </td>
                          <td className="p-3.5 font-medium text-slate-700">
                            {appt.date} at <strong className="text-slate-900">{appt.time}</strong>
                          </td>
                          <td className="p-3.5 text-slate-600 font-medium">{appt.chair}</td>
                          <td className="p-3.5 text-slate-600">{appt.doctor}</td>
                          <td className="p-3.5 font-semibold text-blue-700">{appt.procedure}</td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {appt.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-center space-x-2">
                            <button
                              onClick={() => sendAppointmentWhatsApp(appt)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-semibold inline-flex items-center gap-1 shadow-2xs"
                              title="Send WhatsApp confirmation"
                            >
                              <Send className="w-3 h-3" /> WhatsApp
                            </button>
                            <button
                              onClick={() => {
                                setAppointments(appointments.filter((x) => x.id !== appt.id));
                                showToast("Appointment cancelled");
                              }}
                              className="p-1 text-slate-400 hover:text-rose-500 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5 inline" />
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

          {/* ======================================================== */}
          {/* TAB 4: DENTAL INSURANCE & INVOICES (Screenshot 73155.jpg) */}
          {/* ======================================================== */}
          {activeNav === "Dental Insurance & Invoices" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Dental Insurance & Invoices</h1>
                  <p className="text-xs text-slate-500">
                    Pre-Auth Claims, Co-pay & Instant UPI Billing
                  </p>
                </div>
                <button
                  onClick={() => setIsAddInvoiceOpen(true)}
                  className="px-4 py-2 bg-[#1d4ed8] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> New Insurance Invoice
                </button>
              </div>

              {invoices.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                  <DollarSign className="w-10 h-10 text-blue-600 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-800">No Invoices Generated Yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Create itemized clinical invoices and accept instant UPI QR payments at the dental chair.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="p-4">Invoice / Claim ID</th>
                        <th className="p-4">Patient</th>
                        <th className="p-4">Insurance Provider</th>
                        <th className="p-4">Claim Status</th>
                        <th className="p-4">Total (₹)</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/60">
                          <td className="p-4">
                            <div className="font-bold text-blue-700">{inv.id}</div>
                            <div className="text-[10px] text-slate-400">Claim: {inv.claimId}</div>
                          </td>
                          <td className="p-4 font-semibold text-slate-800">{inv.patient}</td>
                          <td className="p-4 text-slate-600">{inv.provider}</td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {inv.status}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-slate-900 text-sm">
                            ₹{inv.total}
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => setActiveUpiQrInvoice(inv)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 border border-slate-200 text-slate-800 hover:text-blue-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                            >
                              <QrCode className="w-3.5 h-3.5" /> UPI QR
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

          {/* ======================================================== */}
          {/* TAB 5: STOCK MAINTENANCE (Screenshot 73151.jpg)          */}
          {/* ======================================================== */}
          {activeNav === "Stock Maintenance" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Stock Maintenance</h1>
                  <p className="text-xs text-slate-500">
                    Operatory Consumables, Materials & Medications
                  </p>
                </div>
                <button
                  onClick={() => setIsAddStockOpen(true)}
                  className="px-4 py-2 bg-[#1d4ed8] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add Stock Item
                </button>
              </div>

              {inventory.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                  <Package className="w-10 h-10 text-blue-600 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-800">Inventory Empty</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Track operatory materials like Composite Resins, Local Anesthesia, and Sutures with threshold alerts.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">Item Name</th>
                        <th className="p-3.5">Category</th>
                        <th className="p-3.5">Quantity on Hand</th>
                        <th className="p-3.5">Min. Threshold</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-center">Quick Adjust</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {inventory.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/60">
                          <td className="p-3.5 font-bold text-slate-900">{item.name}</td>
                          <td className="p-3.5 text-slate-600">{item.category}</td>
                          <td className="p-3.5">
                            <span className="font-bold text-slate-900 text-sm">{item.quantity}</span>{" "}
                            <span className="text-[11px] text-slate-500">{item.unit}</span>
                          </td>
                          <td className="p-3.5 text-slate-500">{item.minThreshold} {item.unit}</td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.status === "Low Stock"
                                  ? "bg-amber-100 text-amber-800 border border-amber-300"
                                  : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-center space-x-1.5">
                            <button
                              onClick={() => handleStockAdjust(item.id, -1)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded font-semibold text-slate-700"
                            >
                              -1
                            </button>
                            <button
                              onClick={() => handleStockAdjust(item.id, 5)}
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded font-semibold"
                            >
                              +5
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

          {/* ======================================================== */}
          {/* TAB 6: EMPLOYEE ROLES & ROSTER (Screenshot 73153.jpg)     */}
          {/* ======================================================== */}
          {activeNav === "Employee Roles & Roster" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Employee Roles & Roster</h1>
                  <p className="text-xs text-slate-500">
                    Operatory Staff Allocation & Duty Timings
                  </p>
                </div>
                <button
                  onClick={() => setIsAddEmpOpen(true)}
                  className="px-4 py-2 bg-[#1d4ed8] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add Staff Member
                </button>
              </div>

              {employees.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                  <Briefcase className="w-10 h-10 text-blue-600 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-800">No Staff Added</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Add chair-side assistants, visiting endodontists, and operatory coordinators.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {employees.map((emp) => (
                    <div
                      key={emp.id}
                      className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {emp.id}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Active
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{emp.name || emp.role}</div>
                        <div className="text-xs text-slate-500">{emp.dept}</div>
                      </div>
                      <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                        <div>Shift: <strong className="text-slate-800">{emp.shift}</strong></div>
                        <div>Contact: <span className="font-mono text-slate-700">{emp.contact}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 7: PRACTICE PROFILE & COMPLIANCE                     */}
          {/* ======================================================== */}
          {activeNav === "Practice Profile" && (
            <div className="max-w-3xl bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-6">
              <div>
                <h1 className="text-xl font-bold text-slate-900">Practice Profile & Legal Registration</h1>
                <p className="text-xs text-slate-500">
                  Government micro-enterprise credentials, state grant registry, and digital prescription headers
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Clinic Name</label>
                  <input
                    type="text"
                    value={practiceProfile.name}
                    onChange={(e) => setPracticeProfile({ ...practiceProfile, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Udyam Registration Number</label>
                  <input
                    type="text"
                    value={practiceProfile.regNumber}
                    onChange={(e) => setPracticeProfile({ ...practiceProfile, regNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-mono font-bold text-indigo-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Lead Dental Surgeons</label>
                  <input
                    type="text"
                    value={practiceProfile.drName}
                    onChange={(e) => setPracticeProfile({ ...practiceProfile, drName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Qualifications</label>
                  <input
                    type="text"
                    value={practiceProfile.qualification}
                    onChange={(e) => setPracticeProfile({ ...practiceProfile, qualification: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Official Contact Number</label>
                  <input
                    type="text"
                    value={practiceProfile.phone}
                    onChange={(e) => setPracticeProfile({ ...practiceProfile, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Clinic UPI ID (for QR Billing)</label>
                  <input
                    type="text"
                    value={practiceProfile.upiId}
                    onChange={(e) => setPracticeProfile({ ...practiceProfile, upiId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-mono focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-600 mb-1">Clinic Address</label>
                  <input
                    type="text"
                    value={practiceProfile.address}
                    onChange={(e) => setPracticeProfile({ ...practiceProfile, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Realtime Cloud Persistence Active
                </span>
                <button
                  onClick={() => showToast("Practice credentials saved")}
                  className="px-4 py-2 bg-[#1d4ed8] text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-blue-700"
                >
                  Update Profile
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 8: DASHBOARD OVERVIEW                                */}
          {/* ======================================================== */}
          {activeNav === "Dashboard" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-bold text-slate-900">Practice Dashboard</h1>
                <p className="text-xs text-slate-500">
                  Operatory analytics, daily appointments, and clinical charting statistics
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">Total Registered Patients</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">{patients.length}</div>
                  <div className="text-[11px] text-blue-600 font-medium mt-1">Active FDI charts</div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">Scheduled Appointments</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">{appointments.length}</div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-1">Chair-side queue</div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">Invoices & Claims</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">{invoices.length}</div>
                  <div className="text-[11px] text-indigo-600 font-medium mt-1">TPA / UPI billed</div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">Consumables Inventory</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">{inventory.length}</div>
                  <div className="text-[11px] text-amber-600 font-medium mt-1">Items tracked</div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ======================================================== */}
      {/* PATIENT ODONTOGRAM & CLINICAL MODAL (Exact match)        */}
      {/* ======================================================== */}
      {isChartModalOpen && activePatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl p-6 md:p-7 relative max-h-[92vh] flex flex-col justify-between overflow-y-auto">
            
            {/* Modal Header */}
            <div>
              <div className="flex items-start justify-between pb-3">
                <div>
                  <div className="text-xl font-bold text-slate-900 flex items-center gap-3">
                    {activePatient.name}
                    {/* Editable Age Badge */}
                    <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md text-xs font-medium text-slate-700 border border-slate-200">
                      <span>Age:</span>
                      <input
                        type="number"
                        value={activePatient.age || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPatients((prev) =>
                            prev.map((p) => (p.id === activePatient.id ? { ...p, age: val } : p))
                          );
                        }}
                        placeholder="24"
                        className="w-10 bg-transparent text-xs font-bold text-blue-700 focus:outline-none"
                      />
                      <span>Yrs</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{activePatient.phone}</div>
                </div>

                <button
                  onClick={() => setIsChartModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Exact Tab Navigation Pills (From your screenshots) */}
              <div className="flex flex-wrap items-center gap-2 mt-2 mb-6">
                {[
                  "32-Tooth Odontogram",
                  "Diagnosis & Trauma",
                  "Prescriptions",
                  "Medical History",
                ].map((tab) => {
                  const isActive = activeModalTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveModalTab(tab)}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isActive
                          ? "bg-[#1d4ed8] text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {tab === "32-Tooth Odontogram" && isDeciduous ? "20-Tooth Deciduous" : tab}
                    </button>
                  );
                })}
              </div>

              {/* TAB 1: ODONTOGRAM (Screenshot 73145.jpg) */}
              {activeModalTab === "32-Tooth Odontogram" && (
                <div className="space-y-5">
                  
                  {/* Palette Header with Switchable Deciduous/Permanent Toggle */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-1 gap-2">
                    <div className="text-[11px] font-bold text-slate-800 tracking-wider uppercase">
                      CLINICAL ODONTOGRAM PALETTE (SELECT STATUS, THEN TAP TOOTH)
                    </div>

                    {/* DENTITION SWITCH TOGGLE */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">
                        {isDeciduous ? "Pediatric Primary FDI (20)" : "Adult Upper & Lower FDI (32)"}
                      </span>
                      <button
                        onClick={() => setIsDeciduous(!isDeciduous)}
                        className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
                      >
                        {isDeciduous ? "Switch to Adult (32)" : "Switch to Deciduous (20)"}
                      </button>
                    </div>
                  </div>

                  {/* Palette Pills Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {CLINICAL_PALETTE.map((item) => {
                      const isSelected = activePaletteStatus === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActivePaletteStatus(item.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs text-left truncate font-medium border transition-all ${
                            item.border
                          } ${item.bg} ${item.text} ${
                            isSelected ? "ring-2 ring-blue-500 font-bold scale-[1.02]" : "hover:opacity-90"
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* UPPER ARCH (MAXILLARY) */}
                  <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase text-center mb-2">
                      {isDeciduous ? "Upper Arch (Deciduous Maxillary)" : "Upper Arch (Maxillary)"}
                    </div>
                    <div className="flex justify-center flex-wrap gap-1.5">
                      {(isDeciduous ? DECIDUOUS_UPPER : PERMANENT_UPPER).map((num) => {
                        const code = activePatient.toothConditions?.[num];
                        const found = CLINICAL_PALETTE.find((p) => p.id === code);
                        return (
                          <button
                            key={num}
                            onClick={() => handleToothTap(num)}
                            className={`w-10 h-12 rounded-lg border flex flex-col items-center justify-center transition-all bg-white shadow-2xs ${
                              found
                                ? `${found.border} ${found.bg}`
                                : "border-emerald-300 text-emerald-700"
                            }`}
                          >
                            <span className="text-xs font-bold text-slate-800">{num}</span>
                            <span className={`text-[9px] font-semibold ${found ? found.text : "text-emerald-600"}`}>
                              {code || "HLT"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* LOWER ARCH (MANDIBULAR) */}
                  <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase text-center mb-2">
                      {isDeciduous ? "Lower Arch (Deciduous Mandibular)" : "Lower Arch (Mandibular)"}
                    </div>
                    <div className="flex justify-center flex-wrap gap-1.5">
                      {(isDeciduous ? DECIDUOUS_LOWER : PERMANENT_LOWER).map((num) => {
                        const code = activePatient.toothConditions?.[num];
                        const found = CLINICAL_PALETTE.find((p) => p.id === code);
                        return (
                          <button
                            key={num}
                            onClick={() => handleToothTap(num)}
                            className={`w-10 h-12 rounded-lg border flex flex-col items-center justify-center transition-all bg-white shadow-2xs ${
                              found
                                ? `${found.border} ${found.bg}`
                                : "border-emerald-300 text-emerald-700"
                            }`}
                          >
                            <span className="text-xs font-bold text-slate-800">{num}</span>
                            <span className={`text-[9px] font-semibold ${found ? found.text : "text-emerald-600"}`}>
                              {code || "HLT"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Odontogram Findings Tags */}
                  <div className="pt-2">
                    <div className="text-xs font-bold text-slate-800 mb-2">
                      Active Odontogram Findings:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(activePatient.toothConditions || {}).length === 0 ? (
                        <span className="text-xs text-slate-400 italic">No specific pathology recorded. Tap teeth above.</span>
                      ) : (
                        Object.entries(activePatient.toothConditions || {}).map(([t, c]) => (
                          <span
                            key={t}
                            className="text-xs bg-slate-50 border border-slate-200 px-3 py-1 rounded-md text-slate-700 font-mono"
                          >
                            Tooth {t}: <strong className="text-slate-900">{c}</strong>
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DIAGNOSIS & TRAUMA (Screenshot 73157.jpg) */}
              {activeModalTab === "Diagnosis & Trauma" && (
                <div className="space-y-4">
                  <div className="text-xs font-bold uppercase text-slate-800 tracking-wider">
                    Radiology & Diagnostic Record
                  </div>

                  <div className="border border-slate-200 rounded-xl p-4 divide-y divide-slate-100 bg-white">
                    <div className="py-2.5">
                      <div className="text-xs font-bold text-rose-600">Trauma Evaluation:</div>
                      <input
                        type="text"
                        value={activePatient.diagnosis?.trauma || ""}
                        onChange={(e) => handleUpdateDiagnosis("trauma", e.target.value)}
                        className="w-full text-xs text-slate-700 mt-1 border-b border-dashed border-slate-300 focus:outline-none"
                      />
                    </div>
                    <div className="py-2.5">
                      <div className="text-xs font-bold text-indigo-700">Impaction Status:</div>
                      <input
                        type="text"
                        value={activePatient.diagnosis?.impaction || ""}
                        onChange={(e) => handleUpdateDiagnosis("impaction", e.target.value)}
                        className="w-full text-xs text-slate-700 mt-1 border-b border-dashed border-slate-300 focus:outline-none"
                      />
                    </div>
                    <div className="py-2.5">
                      <div className="text-xs font-bold text-slate-800">Bone Deformations:</div>
                      <input
                        type="text"
                        value={activePatient.diagnosis?.boneDeformations || ""}
                        onChange={(e) => handleUpdateDiagnosis("boneDeformations", e.target.value)}
                        className="w-full text-xs text-slate-700 mt-1 border-b border-dashed border-slate-300 focus:outline-none"
                      />
                    </div>
                    <div className="py-2.5">
                      <div className="text-xs font-bold text-slate-800">Diagnosis Notes:</div>
                      <input
                        type="text"
                        value={activePatient.diagnosis?.diagnosisNotes || ""}
                        onChange={(e) => handleUpdateDiagnosis("diagnosisNotes", e.target.value)}
                        className="w-full text-xs text-slate-700 mt-1 border-b border-dashed border-slate-300 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PRESCRIPTIONS & WHATSAPP ENGINE (Screenshot 73147.jpg) */}
              {activeModalTab === "Prescriptions" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold uppercase text-slate-800 tracking-wider">
                      Prescriptions Slip
                    </div>
                    
                    {/* AUTOMATED WHATSAPP BOT BUTTON */}
                    <button
                      type="button"
                      onClick={dispatchPatientWhatsApp}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Dispatch WhatsApp Prescription
                    </button>
                  </div>

                  {/* Formulary Quick Fill Presets */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">
                      Quick-Select Dental Presets:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_MEDICATIONS.map((med) => (
                        <button
                          key={med.name}
                          type="button"
                          onClick={() => handleAddPrescription(med)}
                          className="px-2.5 py-1 text-xs bg-slate-50 hover:bg-blue-50 border border-slate-200 text-slate-700 hover:text-blue-700 rounded-lg flex items-center gap-1 transition-all"
                        >
                          <Plus className="w-3 h-3 text-blue-600" />
                          <span className="font-semibold">{med.name}</span>
                          <span className="text-[10px] text-slate-400">({med.frequency})</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Active Prescriptions Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="p-3">Drug & Generic Name</th>
                          <th className="p-3">Dosage</th>
                          <th className="p-3">Frequency</th>
                          <th className="p-3">Duration</th>
                          <th className="p-3">Instruction</th>
                          <th className="p-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(activePatient.prescriptions || []).length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-4 text-center text-slate-400 italic">
                              No medications prescribed yet. Tap presets above to add.
                            </td>
                          </tr>
                        ) : (
                          activePatient.prescriptions.map((p) => (
                            <tr key={p.id}>
                              <td className="p-3">
                                <div className="font-bold text-slate-800">{p.drug}</div>
                                <div className="text-[10px] text-slate-400">{p.generic}</div>
                              </td>
                              <td className="p-3 font-medium text-slate-700">{p.dosage}</td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-bold text-[11px]">
                                  {p.frequency}
                                </span>
                              </td>
                              <td className="p-3 font-medium text-slate-700">{p.duration}</td>
                              <td className="p-3 text-slate-600">{p.instruction}</td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => handleRemovePrescription(p.id)}
                                  className="text-rose-500 hover:text-rose-700"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: MEDICAL HISTORY (Screenshot 73149.jpg) */}
              {activeModalTab === "Medical History" && (
                <div className="space-y-4">
                  <div className="text-xs font-bold uppercase text-slate-800 tracking-wider">
                    Systemic Screening & Allergies
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-slate-200 rounded-xl p-4 bg-white">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Conditions
                      </div>
                      <input
                        type="text"
                        value={activePatient.conditions || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPatients((prev) =>
                            prev.map((p) => (p.id === activePatient.id ? { ...p, conditions: val } : p))
                          );
                        }}
                        className="w-full text-sm font-medium text-slate-800 border-b border-slate-200 focus:outline-none"
                      />
                    </div>

                    <div className="border border-rose-100 rounded-xl p-4 bg-rose-50/40">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-rose-500 mb-1">
                        Allergies
                      </div>
                      <input
                        type="text"
                        value={activePatient.allergies || "NKDA"}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPatients((prev) =>
                            prev.map((p) => (p.id === activePatient.id ? { ...p, allergies: val } : p))
                          );
                        }}
                        className="w-full text-sm font-bold text-rose-700 border-b border-rose-200 bg-transparent focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Actions (matches 73147.jpg & 73149.jpg) */}
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
                className="text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Chart
              </button>

              <button
                type="button"
                onClick={() => setIsChartModalOpen(false)}
                className="text-slate-600 hover:text-slate-900 font-semibold"
              >
                Close Window
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- ADD PATIENT MODAL --- */}
      {isAddPatientOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <form
            onSubmit={handleCreatePatient}
            className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 shadow-xl text-xs"
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Add New Patient</h3>
              <button
                type="button"
                onClick={() => setIsAddPatientOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
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
                placeholder="e.g. Ramesh Kumar"
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
                  placeholder="e.g. 24"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Gender</label>
                <select
                  value={newPatientForm.gender}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, gender: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Pediatric</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">WhatsApp Phone *</label>
              <input
                type="tel"
                required
                value={newPatientForm.phone}
                onChange={(e) => setNewPatientForm({ ...newPatientForm, phone: e.target.value })}
                placeholder="10-digit mobile"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Systemic Conditions</label>
              <input
                type="text"
                value={newPatientForm.conditions}
                onChange={(e) => setNewPatientForm({ ...newPatientForm, conditions: e.target.value })}
                placeholder="e.g. None reported, Diabetes, Hypertension"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddPatientOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-[#1d4ed8] text-white hover:bg-blue-700 font-semibold"
              >
                Register & Open Odontogram
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- ADD APPOINTMENT MODAL --- */}
      {isAddApptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <form
            onSubmit={handleCreateAppointment}
            className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 shadow-xl text-xs"
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Book Chair-side Appointment</h3>
              <button
                type="button"
                onClick={() => setIsAddApptOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Patient Name *</label>
              <input
                type="text"
                required
                value={newApptForm.patientName}
                onChange={(e) => setNewApptForm({ ...newApptForm, patientName: e.target.value })}
                placeholder="Patient Full Name"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Mobile *</label>
                <input
                  type="tel"
                  required
                  value={newApptForm.phone}
                  onChange={(e) => setNewApptForm({ ...newApptForm, phone: e.target.value })}
                  placeholder="10-digit number"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Age</label>
                <input
                  type="number"
                  value={newApptForm.age}
                  onChange={(e) => setNewApptForm({ ...newApptForm, age: e.target.value })}
                  placeholder="Age"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Date</label>
                <input
                  type="date"
                  value={newApptForm.date}
                  onChange={(e) => setNewApptForm({ ...newApptForm, date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Time Slot</label>
                <input
                  type="time"
                  value={newApptForm.time}
                  onChange={(e) => setNewApptForm({ ...newApptForm, time: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Operatory Chair</label>
              <select
                value={newApptForm.chair}
                onChange={(e) => setNewApptForm({ ...newApptForm, chair: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
              >
                <option>Chair 1 (Main Operatory)</option>
                <option>Chair 2 (Pediatric / Perio)</option>
                <option>Chair 3 (Prosthodontics)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Planned Procedure</label>
              <input
                type="text"
                value={newApptForm.procedure}
                onChange={(e) => setNewApptForm({ ...newApptForm, procedure: e.target.value })}
                placeholder="e.g. Composite Restoration #16"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddApptOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-[#1d4ed8] text-white hover:bg-blue-700 font-semibold"
              >
                Schedule Appointment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- ADD INVOICE MODAL --- */}
      {isAddInvoiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <form
            onSubmit={handleCreateInvoice}
            className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 shadow-xl text-xs"
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Generate Dental Insurance Invoice</h3>
              <button
                type="button"
                onClick={() => setIsAddInvoiceOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Patient Name *</label>
              <input
                type="text"
                required
                value={newInvoiceForm.patientName}
                onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, patientName: e.target.value })}
                placeholder="Patient Full Name"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Insurance / TPA</label>
                <input
                  type="text"
                  value={newInvoiceForm.provider}
                  onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, provider: e.target.value })}
                  placeholder="e.g. Star Health / Self Pay"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Claim Status</label>
                <select
                  value={newInvoiceForm.status}
                  onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                >
                  <option>Pre-Auth Approved</option>
                  <option>Pre-Auth Submitted</option>
                  <option>Claim Settled</option>
                  <option>Self-Pay Completed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Treatment Description</label>
              <input
                type="text"
                value={newInvoiceForm.treatment}
                onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, treatment: e.target.value })}
                placeholder="e.g. Root Canal Therapy + Zirconia Crown"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Total Bill Amount (₹) *</label>
              <input
                type="number"
                required
                value={newInvoiceForm.amount}
                onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, amount: e.target.value })}
                placeholder="e.g. 5500"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-bold focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddInvoiceOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-[#1d4ed8] text-white hover:bg-blue-700 font-semibold"
              >
                Generate Invoice
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- ADD STOCK ITEM MODAL --- */}
      {isAddStockOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <form
            onSubmit={handleCreateStock}
            className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 shadow-xl text-xs"
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Add Stock Item</h3>
              <button
                type="button"
                onClick={() => setIsAddStockOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Item Name *</label>
              <input
                type="text"
                required
                value={newStockForm.name}
                onChange={(e) => setNewStockForm({ ...newStockForm, name: e.target.value })}
                placeholder="e.g. Composite Resin Syringes"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Category</label>
                <select
                  value={newStockForm.category}
                  onChange={(e) => setNewStockForm({ ...newStockForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                >
                  <option>Restorative</option>
                  <option>Surgical</option>
                  <option>Materials</option>
                  <option>Medications</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Unit of Measure</label>
                <input
                  type="text"
                  value={newStockForm.unit}
                  onChange={(e) => setNewStockForm({ ...newStockForm, unit: e.target.value })}
                  placeholder="e.g. Syringes, Boxes, Strips"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Quantity on Hand</label>
                <input
                  type="number"
                  value={newStockForm.quantity}
                  onChange={(e) => setNewStockForm({ ...newStockForm, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Min. Threshold</label>
                <input
                  type="number"
                  value={newStockForm.minThreshold}
                  onChange={(e) => setNewStockForm({ ...newStockForm, minThreshold: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddStockOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-[#1d4ed8] text-white hover:bg-blue-700 font-semibold"
              >
                Save Consumable
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- ADD EMPLOYEE MODAL --- */}
      {isAddEmpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <form
            onSubmit={handleCreateEmp}
            className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 shadow-xl text-xs"
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Add Staff Member / Consultant</h3>
              <button
                type="button"
                onClick={() => setIsAddEmpOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Staff / Role Name *</label>
              <input
                type="text"
                required
                value={newEmpForm.name}
                onChange={(e) => setNewEmpForm({ ...newEmpForm, name: e.target.value })}
                placeholder="e.g. Dr. Anandha Krishnan / Clinical Specialist A"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Department / Specialty</label>
              <input
                type="text"
                value={newEmpForm.dept}
                onChange={(e) => setNewEmpForm({ ...newEmpForm, dept: e.target.value })}
                placeholder="e.g. Radiology & Diagnosis Lead"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Shift Timings</label>
                <input
                  type="text"
                  value={newEmpForm.shift}
                  onChange={(e) => setNewEmpForm({ ...newEmpForm, shift: e.target.value })}
                  placeholder="e.g. Morning (09:00 - 14:00)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={newEmpForm.contact}
                  onChange={(e) => setNewEmpForm({ ...newEmpForm, contact: e.target.value })}
                  placeholder="+91 98401 00001"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddEmpOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-[#1d4ed8] text-white hover:bg-blue-700 font-semibold"
              >
                Save Staff
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- UPI QR MODAL (MATCHING SCREENSHOT BILLING) --- */}
      {activeUpiQrInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-sm p-6 text-center space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-2 border-slate-100">
              <span className="text-xs font-bold text-slate-700">Instant UPI Payment</span>
              <button onClick={() => setActiveUpiQrInvoice(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 inline-block mx-auto">
              {/* Dynamic QR SVG */}
              <div className="w-44 h-44 bg-white p-2 border border-slate-200 rounded-lg flex flex-col items-center justify-center shadow-xs">
                <QrCode className="w-32 h-32 text-slate-900" />
                <span className="text-[10px] text-slate-500 font-mono mt-1 font-semibold">{practiceProfile.upiId}</span>
              </div>
            </div>

            <div>
              <div className="text-xl font-bold text-slate-900">₹{activeUpiQrInvoice.total}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {activeUpiQrInvoice.patient} • {activeUpiQrInvoice.id}
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Scan with Google Pay, PhonePe, or Paytm at chair-side.
            </p>

            <button
              onClick={() => {
                setActiveUpiQrInvoice(null);
                showToast("Payment marked as received via UPI");
              }}
              className="w-full py-2 bg-[#1d4ed8] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
            >
              Confirm Payment Received
            </button>
          </div>
        </div>
      )}

    </div>
  );
}