import React, { useState, useEffect, useRef } from "react";
import {
  Activity, Users, Calendar, DollarSign, AlertTriangle, 
  Menu, X, Sparkles, Plus, CheckCircle, ChevronRight,
  TrendingUp, Layers, Eye, ShieldCheck, Zap, Stethoscope, BookOpen,
  Camera, Upload, Download, Trash2, Printer, Search, Phone, Clock,
  FileText, CheckSquare, RefreshCw, MessageSquare, AlertCircle,
  Package, ShoppingCart, HelpCircle, UserPlus, ArrowUpRight, Scale,
  Save, Filter, LogOut, Check, CreditCard, ChevronDown, Settings
} from "lucide-react";

import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  addDoc,
  deleteDoc,
  updateDoc
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";

// ==============================================================================
// CLINICAL TAXONOMY & CLASSIFICATION CONFIGURATIONS
// ==============================================================================

const MAXILLARY_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const MANDIBULAR_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const GV_BLACK_CLASSES = [
  { 
    id: "class1", 
    code: "C-I", 
    label: "Class I", 
    desc: "Pits & fissures (Occlusal surfaces of molars & premolars, facial/lingual pits)", 
    color: "bg-red-500", 
    text: "text-red-700", 
    border: "border-red-400", 
    defaultSurfaces: ["occlusal"] 
  },
  { 
    id: "class2", 
    code: "C-II", 
    label: "Class II", 
    desc: "Proximal surfaces of posteriors (MO, DO, MOD on molars & premolars)", 
    color: "bg-rose-600", 
    text: "text-rose-700", 
    border: "border-rose-400", 
    defaultSurfaces: ["occlusal", "mesial"] 
  },
  { 
    id: "class3", 
    code: "C-III", 
    label: "Class III", 
    desc: "Proximal surfaces of anterior teeth (Mesial/Distal not involving incisal edge)", 
    color: "bg-amber-500", 
    text: "text-amber-700", 
    border: "border-amber-400", 
    defaultSurfaces: ["mesial"] 
  },
  { 
    id: "class4", 
    code: "C-IV", 
    label: "Class IV", 
    desc: "Proximal surfaces of anterior teeth involving the incisal angle / edge", 
    color: "bg-orange-600", 
    text: "text-orange-700", 
    border: "border-orange-400", 
    defaultSurfaces: ["mesial", "vestibular"] 
  },
  { 
    id: "class5", 
    code: "C-V", 
    label: "Class V", 
    desc: "Gingival / cervical third of facial or lingual surfaces of any tooth", 
    color: "bg-pink-600", 
    text: "text-pink-700", 
    border: "border-pink-400", 
    defaultSurfaces: ["vestibular"] 
  },
  { 
    id: "class6", 
    code: "C-VI", 
    label: "Class VI", 
    desc: "Cusp tips of posterior teeth or incisal edges of anterior teeth", 
    color: "bg-purple-600", 
    text: "text-purple-700", 
    border: "border-purple-400", 
    defaultSurfaces: ["occlusal"] 
  }
];

const RESTORATIVE_MATERIALS = [
  { id: "healthy", label: "Sound / Enamel", color: "#F8FAFC", dot: "bg-slate-300" },
  { id: "composite", label: "Composite Hybrid / Microfill", color: "#3B82F6", dot: "bg-blue-500" },
  { id: "gic", label: "Glass Ionomer Cement (Type II)", color: "#10B981", dot: "bg-emerald-500" },
  { id: "amalgam", label: "Dental Silver Amalgam", color: "#64748B", dot: "bg-slate-600" },
  { id: "rct", label: "Obturated Root Canal (Gutta-Percha)", color: "#F59E0B", dot: "bg-amber-500" },
  { id: "crown", label: "Full Ceramic / Zirconia / PFM Crown", color: "#8B5CF6", dot: "bg-purple-500" },
  { id: "veneer", label: "Porcelain Laminate Veneer", color: "#06B6D4", dot: "bg-cyan-500" },
  { id: "impacted", label: "Impacted Tooth (Surgical Staging)", color: "#BE185D", dot: "bg-pink-700" },
  { id: "missing", label: "Extracted / Congenitally Missing", color: "#1E293B", dot: "bg-slate-900" }
];

const PHARMACOPEIA_DATABASE = [
  { id: "amox500", name: "Amoxicillin 500mg", type: "Antibiotic", dosage: "1 cap TDS x 5 days", timing: "After Food", instructions: "Complete full course without skipping" },
  { id: "aug625", name: "Amoxicillin + Clavulanic Acid 625mg", type: "Broad Spectrum Antibiotic", dosage: "1 tab BD x 5 days", timing: "After Food", instructions: "Consume with meals to avoid mild gastric distress" },
  { id: "flagyl400", name: "Metronidazole 400mg", type: "Antianaerobic", dosage: "1 tab TDS x 5 days", timing: "After Food", instructions: "Strict avoidance of alcohol during treatment and 48 hours post" },
  { id: "zerodolsp", name: "Aceclofenac 100mg + Paracetamol 325mg + Serratiopeptidase 15mg", type: "NSAID + Anti-edema", dosage: "1 tab BD x 3 days", timing: "After Food", instructions: "Always take after meals with plenty of water" },
  { id: "ketorold", name: "Ketorolac Tromethamine 10mg", type: "Potent Analgesic", dosage: "1 tab SOS / TDS", timing: "After Food", instructions: "Disperse tablet completely in 15ml water before ingestion" },
  { id: "pan40", name: "Pantoprazole 40mg", type: "Proton Pump Inhibitor", dosage: "1 tab OD x 5 days", timing: "Before Breakfast", instructions: "Take 30 minutes before first meal of the morning" },
  { id: "hexidine", name: "Chlorhexidine Gluconate 0.2% Rinse", type: "Antiseptic Mouthwash", dosage: "10ml rinse BD x 14 days", timing: "After Brushing", instructions: "Swish for 60 seconds. Refrain from eating or drinking for 30 minutes" },
  { id: "dologel", name: "Choline Salicylate + Lignocaine Topical Gel", type: "Mucosal Anesthetic", dosage: "Apply QID", timing: "Before Meals", instructions: "Apply gently over ulcerated / inflamed mucosal tissue" }
];

// ==============================================================================
// MAIN COMPONENT: MERIDIAN DENTAL APPLICATION ROOT
// ==============================================================================

export default function App() {
  // Configurable White-Label Clinic Profile
  const [clinicConfig, setClinicConfig] = useState({
    clinicId: "meridian_main_clinic",
    clinicName: "Meridian Dental",
    doctorName: "Dr. Clinician",
    qualification: "BDS, Dental Surgeon",
    phone: "910000000000",
    registrationRef: "STN-VERIFIED"
  });

  // Navigation & Operatory States
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeChair, setActiveChair] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState("Connected");

  // Real-Time Patient Management
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientPhone, setNewPatientPhone] = useState("");
  const [newPatientAge, setNewPatientAge] = useState("");
  const [newPatientGender, setNewPatientGender] = useState("Male");
  const [newPatientComplaint, setNewPatientComplaint] = useState("");

  // Odontogram & GV Black State
  const [selectedToolType, setSelectedToolType] = useState("gv");
  const [selectedGvClass, setSelectedGvClass] = useState("class1");
  const [selectedGeneralTool, setSelectedGeneralTool] = useState("composite");
  const [selectedTooth, setSelectedTooth] = useState(16);
  const [patientToothData, setPatientToothData] = useState({});

  // Calibrated OPG Radiograph Workstation
  const [opgImageUrl, setOpgImageUrl] = useState(null);
  const [measureMode, setMeasureMode] = useState(false);
  const [caliperPoints, setCaliperPoints] = useState([]);
  const [calibratedDistance, setCalibratedDistance] = useState(null);
  const [isUploadingRad, setIsUploadingRad] = useState(false);

  // Pharmacopeia Prescription State
  const [prescribedDrugs, setPrescribedDrugs] = useState([]);

  // Prosthetic Lab Work Orders
  const [labOrders, setLabOrders] = useState([]);
  const [showLabModal, setShowLabModal] = useState(false);
  const [labItemName, setLabItemName] = useState("");
  const [labToothNo, setLabToothNo] = useState("");
  const [labVendorName, setLabVendorName] = useState("");
  const [labCostEstimate, setLabCostEstimate] = useState("");

  // Clinic Consumables Inventory
  const [inventory, setInventory] = useState([]);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [invItemName, setInvItemName] = useState("");
  const [invCategory, setInvCategory] = useState("Restorative");
  const [invStockQty, setInvStockQty] = useState("");
  const [invMinQty, setInvMinQty] = useState("");
  const [invUnitMeasure, setInvUnitMeasure] = useState("Packs");

  const currentPatient = patients.find(p => p.id === selectedPatientId) || null;

  // ==============================================================================
  // REAL-TIME FIRESTORE EVENT LISTENERS
  // ==============================================================================

  useEffect(() => {
    try {
      const q = collection(db, "clinics", clinicConfig.clinicId, "patients");
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const livePatients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPatients(livePatients);
        if (livePatients.length > 0 && !selectedPatientId) {
          setSelectedPatientId(livePatients[0].id);
        }
      }, (err) => console.error("Firestore patients subscription failure:", err));
      return () => unsubscribe();
    } catch (e) {
      console.warn("Firestore not configured. Operating in local mode.", e);
    }
  }, [clinicConfig.clinicId]);

  useEffect(() => {
    if (!selectedPatientId) {
      setPatientToothData({});
      setPrescribedDrugs([]);
      return;
    }

    try {
      const chartRef = doc(db, "clinics", clinicConfig.clinicId, "patients", selectedPatientId, "ehr", "odontogram");
      const unsubChart = onSnapshot(chartRef, (snap) => {
        if (snap.exists()) {
          setPatientToothData(snap.data().teeth || {});
        } else {
          setPatientToothData({});
        }
      });

      const rxRef = collection(db, "clinics", clinicConfig.clinicId, "patients", selectedPatientId, "prescriptions");
      const unsubRx = onSnapshot(rxRef, (snap) => {
        setPrescribedDrugs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      return () => {
        unsubChart();
        unsubRx();
      };
    } catch (e) {
      console.warn("Sub-collection synchronization error:", e);
    }
  }, [selectedPatientId, clinicConfig.clinicId]);

  useEffect(() => {
    try {
      const invRef = collection(db, "clinics", clinicConfig.clinicId, "inventory");
      const unsubInv = onSnapshot(invRef, (snap) => {
        setInventory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      const labRef = collection(db, "clinics", clinicConfig.clinicId, "labOrders");
      const unsubLab = onSnapshot(labRef, (snap) => {
        setLabOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      return () => {
        unsubInv();
        unsubLab();
      };
    } catch (e) {
      console.warn("Inventory/Lab subscriptions error:", e);
    }
  }, [clinicConfig.clinicId]);

  // ==============================================================================
  // CLOUD ACTIONS & MUTATIONS
  // ==============================================================================

  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    if (!newPatientName.trim()) return;

    try {
      setIsSyncing(true);
      const docRef = await addDoc(collection(db, "clinics", clinicConfig.clinicId, "patients"), {
        name: newPatientName.trim(),
        phone: newPatientPhone.trim(),
        age: parseInt(newPatientAge) || 0,
        gender: newPatientGender,
        chiefComplaint: newPatientComplaint.trim(),
        assignedOperatory: activeChair,
        registeredAt: serverTimestamp()
      });
      setSelectedPatientId(docRef.id);
      setNewPatientName("");
      setNewPatientPhone("");
      setNewPatientAge("");
      setNewPatientComplaint("");
      setShowAddPatientModal(false);
      setSyncStatus("Patient Registered");
    } catch (err) {
      console.error("Patient registration failed:", err);
      alert("Unable to save patient to cloud database.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveOdontogram = async () => {
    if (!selectedPatientId) {
      alert("Please select or register a patient prior to saving charts.");
      return;
    }

    try {
      setIsSyncing(true);
      setSyncStatus("Saving Chart...");
      const chartRef = doc(db, "clinics", clinicConfig.clinicId, "patients", selectedPatientId, "ehr", "odontogram");
      await setDoc(chartRef, {
        teeth: patientToothData,
        lastOperator: clinicConfig.doctorName,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setSyncStatus("Chart Synchronized");
      alert(`Odontogram for tooth #${selectedTooth} and entire arch successfully recorded.`);
    } catch (err) {
      console.error("Failed to commit odontogram:", err);
      alert("Failed to write odontogram to cloud storage.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddMedication = async (drugPayload) => {
    if (!selectedPatientId) {
      alert("Select a registered patient to prescribe medication.");
      return;
    }

    try {
      await addDoc(collection(db, "clinics", clinicConfig.clinicId, "patients", selectedPatientId, "prescriptions"), {
        ...drugPayload,
        prescribedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Prescription dispatch error:", err);
    }
  };

  const handleUploadRadiograph = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedPatientId) return;

    try {
      setIsUploadingRad(true);
      const storagePath = `clinics/${clinicConfig.clinicId}/patients/${selectedPatientId}/radiographs/${Date.now()}_${file.name}`;
      const fileRef = ref(storage, storagePath);
      const uploadTask = await uploadBytesResumable(fileRef, file);
      const downloadUrl = await getDownloadURL(uploadTask.ref);
      setOpgImageUrl(downloadUrl);
    } catch (err) {
      console.error("Storage upload failed:", err);
      setOpgImageUrl(URL.createObjectURL(file));
    } finally {
      setIsUploadingRad(false);
    }
  };

  const handleAddInventory = async (e) => {
    e.preventDefault();
    if (!invItemName.trim()) return;

    try {
      await addDoc(collection(db, "clinics", clinicConfig.clinicId, "inventory"), {
        name: invItemName.trim(),
        category: invCategory,
        stock: parseInt(invStockQty) || 0,
        min: parseInt(invMinQty) || 0,
        unit: invUnitMeasure,
        createdAt: serverTimestamp()
      });
      setInvItemName("");
      setInvStockQty("");
      setInvMinQty("");
      setShowInventoryModal(false);
    } catch (err) {
      console.error("Inventory addition error:", err);
    }
  };

  const handleAddLabOrder = async (e) => {
    e.preventDefault();
    if (!labItemName.trim() || !selectedPatientId) return;

    try {
      await addDoc(collection(db, "clinics", clinicConfig.clinicId, "labOrders"), {
        item: labItemName.trim(),
        tooth: labToothNo.trim() || String(selectedTooth),
        labName: labVendorName.trim() || "Apex Dental Lab",
        cost: parseFloat(labCostEstimate) || 0,
        patientId: selectedPatientId,
        patientName: currentPatient?.name || "Patient",
        status: "CAD-CAM Fabrication",
        createdAt: serverTimestamp()
      });
      setLabItemName("");
      setLabToothNo("");
      setLabVendorName("");
      setLabCostEstimate("");
      setShowLabModal(false);
    } catch (err) {
      console.error("Lab order creation error:", err);
    }
  };

  const handleSendWhatsAppNotification = () => {
    if (!currentPatient || !currentPatient.phone) {
      alert("Active patient does not have a valid telephone number registered.");
      return;
    }
    const cleanPhone = currentPatient.phone.replace(/[^0-9]/g, "");
    const textMsg = encodeURIComponent(
      `Hello ${currentPatient.name},\nThis is ${clinicConfig.clinicName} regarding your clinical examination today. Your clinical records, tooth #${selectedTooth} annotations, and prescriptions have been updated by ${clinicConfig.doctorName}.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${textMsg}`, "_blank");
  };

  // ==============================================================================
  // ODONTOGRAM & GV BLACK INTERACTION LOGIC
  // ==============================================================================

  const applyGvClassToTooth = (toothNo, gvClassId) => {
    const config = GV_BLACK_CLASSES.find(g => g.id === gvClassId);
    if (!config) return;

    setPatientToothData(prev => {
      const current = prev[toothNo] || {};
      const newSurfaces = { ...(current.surfaces || {}) };
      config.defaultSurfaces.forEach(s => {
        newSurfaces[s] = "caries_gv";
      });
      return {
        ...prev,
        [toothNo]: {
          ...current,
          gvClass: gvClassId,
          surfaces: newSurfaces
        }
      };
    });
  };

  const handleToothOrSurfaceClick = (toothNo, surface) => {
    if (selectedToolType === "gv") {
      applyGvClassToTooth(toothNo, selectedGvClass);
      return;
    }

    if (selectedGeneralTool === "impacted") {
      setPatientToothData(prev => ({
        ...prev,
        [toothNo]: {
          ...(prev[toothNo] || {}),
          impacted: !prev[toothNo]?.impacted
        }
      }));
      return;
    }

    if (selectedGeneralTool === "missing") {
      setPatientToothData(prev => ({
        ...prev,
        [toothNo]: {
          ...(prev[toothNo] || {}),
          missing: !prev[toothNo]?.missing
        }
      }));
      return;
    }

    setPatientToothData(prev => ({
      ...prev,
      [toothNo]: {
        ...(prev[toothNo] || {}),
        surfaces: {
          ...(prev[toothNo]?.surfaces || {}),
          [surface]: selectedGeneralTool
        }
      }
    }));
  };

  const getSurfaceColor = (toothNo, surface) => {
    const tooth = patientToothData[toothNo];
    if (tooth?.impacted) return "#FCE7F3";
    if (tooth?.missing) return "#1E293B";

    const condition = tooth?.surfaces?.[surface];
    if (condition === "caries_gv") {
      const gv = GV_BLACK_CLASSES.find(g => g.id === tooth?.gvClass);
      return gv ? (gv.id === "class1" ? "#EF4444" : gv.id === "class2" ? "#E11D48" : gv.id === "class3" ? "#F59E0B" : gv.id === "class4" ? "#EA580C" : gv.id === "class5" ? "#DB2777" : "#9333EA") : "#EF4444";
    }

    const found = RESTORATIVE_MATERIALS.find(c => c.id === condition);
    return found ? found.color : "#F8FAFC";
  };

  const handleOpgCanvasClick = (e) => {
    if (!measureMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (caliperPoints.length >= 2) {
      setCaliperPoints([{ x, y }]);
      setCalibratedDistance(null);
    } else {
      const updatedPoints = [...caliperPoints, { x, y }];
      setCaliperPoints(updatedPoints);
      if (updatedPoints.length === 2) {
        const dx = updatedPoints[1].x - updatedPoints[0].x;
        const dy = updatedPoints[1].y - updatedPoints[0].y;
        const pixelDist = Math.sqrt(dx * dx + dy * dy);
        setCalibratedDistance((pixelDist / 10).toFixed(2));
      }
    }
  };

  // ==============================================================================
  // RENDER PIPELINE
  // ==============================================================================

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased flex flex-col selection:bg-teal-500 selection:text-slate-950">
      
      {/* APP HEADER */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-6 py-3.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition md:hidden"
          >
            <Menu size={20} />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-400 via-indigo-500 to-pink-500 flex items-center justify-center text-white font-extrabold shadow-lg shadow-teal-500/20 text-lg">
              {clinicConfig.clinicName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-teal-400 via-indigo-300 to-pink-400 bg-clip-text text-transparent">
                  {clinicConfig.clinicName}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30">
                  ENTERPRISE
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Practice EHR & Clinical Operatory Hub</p>
            </div>
          </div>
        </div>

        {/* Real-time Patient Selector */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select 
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="appearance-none bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 pr-9 text-xs text-white outline-none focus:border-teal-500 font-medium cursor-pointer shadow-inner"
            >
              {patients.length === 0 ? (
                <option value="">No patients registered</option>
              ) : (
                patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.age}y)</option>
                ))
              )}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <button 
            onClick={() => setShowAddPatientModal(true)}
            className="p-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 transition font-bold shadow-md shadow-teal-500/20"
            title="Register New Patient"
          >
            <UserPlus size={16} />
          </button>
        </div>

        {/* Practitioner Badge */}
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSendWhatsAppNotification}
            className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-md shadow-emerald-600/20"
          >
            <MessageSquare size={14} /> Send WhatsApp Alert
          </button>

          <div className="flex items-center gap-2 pl-3 pr-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-pink-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center">
              {clinicConfig.doctorName.charAt(4) || "D"}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-200 leading-none">{clinicConfig.doctorName}</p>
              <p className="text-[10px] text-teal-400 font-mono">{clinicConfig.qualification}</p>
            </div>
          </div>
        </div>
      </header>

      {/* APPLICATION BODY */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className={`w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between transition-all duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } absolute md:relative z-30 h-full`}>
          <div className="p-4 space-y-6">
            
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">Workspaces</p>
              <nav className="space-y-1">
                {[
                  { id: "dashboard", label: "Dashboard Overview", icon: Activity },
                  { id: "odontogram", label: "FDI Odontogram & GV", icon: Layers },
                  { id: "opg", label: "OPG Diagnostic Studio", icon: Camera },
                  { id: "rx", label: "Pharmacopeia Rx Sheet", icon: FileText },
                  { id: "lab", label: "Prosthetic Lab Pipeline", icon: Eye },
                  { id: "inventory", label: "Stock & Consumables", icon: Package }
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        activeTab === item.id 
                          ? "bg-gradient-to-r from-teal-500/20 to-indigo-500/20 text-teal-300 border border-teal-500/40 shadow-sm" 
                          : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                      }`}
                    >
                      <Icon size={16} />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Operatory Selector */}
            <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Operatory Chair</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map(chair => (
                  <button
                    key={chair}
                    onClick={() => setActiveChair(chair)}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      activeChair === chair
                        ? "bg-teal-500 text-slate-950 border-teal-400 shadow-md shadow-teal-500/20"
                        : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600"
                    }`}
                  >
                    CH-0{chair}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* White-Label System Settings Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/40">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <p className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-teal-400" /> Clinic OS Standard
              </p>
              <p className="text-[10px] text-slate-500 font-mono mt-1">Instance: {clinicConfig.clinicId}</p>
              <p className="text-[10px] text-slate-500 font-mono">License: {clinicConfig.registrationRef}</p>
            </div>
          </div>
        </aside>

        {/* WORKSPACE VIEWPORT */}
        <main className="flex-1 overflow-y-auto bg-slate-900 p-6 md:p-8 space-y-8">
          
          {/* Active Patient Indicator Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-500/10 text-teal-400 border border-teal-500/30">
                Operatory 0{activeChair} Active
              </span>
              <div>
                <h2 className="text-sm font-bold text-white">
                  {currentPatient ? (
                    <>Patient: {currentPatient.name} <span className="text-slate-400 font-normal">({currentPatient.age}y / Phone: {currentPatient.phone || "N/A"})</span></>
                  ) : (
                    <span className="text-amber-400">No Patient Selected (Click '+' above to register)</span>
                  )}
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  {currentPatient ? `Chief Complaint: ${currentPatient.chiefComplaint || "Routine Checkup"}` : "Awaiting patient queue assignment..."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-mono">{syncStatus}</span>
              <button 
                onClick={handleSaveOdontogram}
                disabled={isSyncing || !selectedPatientId}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 disabled:opacity-50 transition flex items-center gap-1.5 shadow-md shadow-teal-500/20"
              >
                <Save size={14} /> Save Active Chart
              </button>
            </div>
          </div>

          {/* TAB 1: DASHBOARD REAL METRICS & VELOCITY */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { title: "Live Registered Patients", value: patients.length, subtitle: "Synchronized in Firestore EHR", icon: Users, grad: "from-blue-500 to-cyan-400" },
                  { title: "Active Lab Orders", value: labOrders.length, subtitle: "In CAD/CAM Production Queue", icon: Calendar, grad: "from-purple-500 to-indigo-500" },
                  { title: "Critical Stock Alerts", value: inventory.filter(i => i.stock <= i.min).length, subtitle: "Below Safety Threshold", icon: AlertTriangle, grad: "from-amber-500 to-rose-400" },
                  { title: "Active Operatory", value: `CH-0${activeChair}`, subtitle: "Chair Online & Sterilized", icon: ShieldCheck, grad: "from-emerald-500 to-teal-400" }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-lg hover:border-slate-700 transition">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{item.title}</p>
                          <h3 className="text-3xl font-extrabold text-white mt-2">{item.value}</h3>
                          <p className="text-[11px] font-medium text-slate-500 mt-1">{item.subtitle}</p>
                        </div>
                        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${item.grad} flex items-center justify-center text-white shadow-md`}>
                          <Icon size={20} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { title: "FDI Odontogram & GV Staging", sub: "Interactive 5-surface anatomy & Black's Class I-VI", tab: "odontogram" },
                  { title: "OPG Radiograph Calibrator", sub: "Digital caliper for canal root length estimation", tab: "opg" },
                  { title: "Pharmacopeia Rx Engine", sub: "Standardized dental prescriptions with ABHA structure", tab: "rx" }
                ].map((btn, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveTab(btn.tab)}
                    className="p-6 rounded-3xl bg-slate-950 border border-slate-800 hover:border-teal-500/50 hover:bg-slate-900 transition text-left group flex flex-col justify-between shadow-xl"
                  >
                    <div>
                      <h4 className="text-base font-bold text-white group-hover:text-teal-300 transition">{btn.title}</h4>
                      <p className="text-xs text-slate-400 mt-1">{btn.sub}</p>
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-xs font-bold text-teal-400">
                      Open Module <ChevronRight size={14} className="group-hover:translate-x-1 transition" />
                    </div>
                  </button>
                ))}
              </div>

            </div>
          )}

          {/* TAB 2: FDI 5-SURFACE ODONTOGRAM WITH G.V. BLACK ENGINE */}
          {activeTab === "odontogram" && (
            <div className="p-7 rounded-3xl bg-slate-950 border border-slate-800 shadow-xl space-y-6">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <Layers size={20} className="text-teal-400" />
                    Interactive FDI 5-Surface Odontogram & G.V. Black Cavity Staging
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Select a tool, then click tooth surfaces: <strong>Occlusal</strong> (center), <strong>Vestibular/Buccal</strong> (top), <strong>Lingual/Palatal</strong> (bottom), <strong>Mesial</strong> (left), or <strong>Distal</strong> (right).
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Tooth:</span>
                  <span className="text-sm font-extrabold px-3 py-1 rounded-xl bg-teal-500 text-slate-950 shadow-md">
                    FDI #{selectedTooth}
                  </span>
                </div>
              </div>

              {/* Dual Mode Selector */}
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <button
                  onClick={() => setSelectedToolType("gv")}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
                    selectedToolType === "gv"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500"
                      : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200"
                  }`}
                >
                  <Stethoscope size={16} /> G.V. Black Cavity Classification (Class I - VI)
                </button>
                <button
                  onClick={() => setSelectedToolType("general")}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
                    selectedToolType === "general"
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500"
                      : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200"
                  }`}
                >
                  <BookOpen size={16} /> Restorative Materials & Surgical Impactions
                </button>
              </div>

              {/* Tool Palette */}
              {selectedToolType === "gv" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5 p-3.5 rounded-2xl bg-rose-950/20 border border-rose-900/40">
                  {GV_BLACK_CLASSES.map(cls => (
                    <button
                      key={cls.id}
                      onClick={() => {
                        setSelectedGvClass(cls.id);
                        if (selectedTooth) applyGvClassToTooth(selectedTooth, cls.id);
                      }}
                      className={`flex flex-col text-left p-2.5 rounded-xl transition ${
                        selectedGvClass === cls.id
                          ? "bg-rose-600 text-white shadow-lg border-2 border-rose-400 scale-[1.02]"
                          : "bg-slate-900/80 border border-slate-800 hover:bg-slate-800 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs">{cls.label}</span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/30 text-rose-200">{cls.code}</span>
                      </div>
                      <p className="text-[10px] opacity-80 mt-1 leading-snug line-clamp-2">{cls.desc}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2.5 p-3 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-xs font-extrabold uppercase text-slate-500 mr-2">Materials & Surgical:</span>
                  {RESTORATIVE_MATERIALS.map(tool => (
                    <button
                      key={tool.id}
                      onClick={() => setSelectedGeneralTool(tool.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        selectedGeneralTool === tool.id
                          ? "bg-teal-500 text-slate-950 shadow-md border-2 border-teal-300 scale-105"
                          : "bg-slate-800/80 text-slate-300 border border-slate-700 hover:bg-slate-700"
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${tool.dot}`} />
                      {tool.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Upper Maxillary Arch */}
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-teal-400 mb-2 block">
                  Maxillary Arch (Upper Dentition)
                </span>
                <div className="flex flex-wrap md:flex-nowrap justify-center gap-2 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 overflow-x-auto">
                  {MAXILLARY_TEETH.map(tooth => (
                    <ToothCard
                      key={tooth}
                      toothNo={tooth}
                      toothData={patientToothData[tooth]}
                      isSelected={selectedTooth === tooth}
                      onClick={() => {
                        setSelectedTooth(tooth);
                        if (selectedToolType === "gv") applyGvClassToTooth(tooth, selectedGvClass);
                        else if (selectedGeneralTool === "impacted" || selectedGeneralTool === "missing") handleToothOrSurfaceClick(tooth, null);
                      }}
                      onSurfaceClick={handleToothOrSurfaceClick}
                      getColor={getSurfaceColor}
                    />
                  ))}
                </div>
              </div>

              {/* Lower Mandibular Arch */}
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-400 mb-2 block">
                  Mandibular Arch (Lower Dentition)
                </span>
                <div className="flex flex-wrap md:flex-nowrap justify-center gap-2 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 overflow-x-auto">
                  {MANDIBULAR_TEETH.map(tooth => (
                    <ToothCard
                      key={tooth}
                      toothNo={tooth}
                      toothData={patientToothData[tooth]}
                      isSelected={selectedTooth === tooth}
                      onClick={() => {
                        setSelectedTooth(tooth);
                        if (selectedToolType === "gv") applyGvClassToTooth(tooth, selectedGvClass);
                        else if (selectedGeneralTool === "impacted" || selectedGeneralTool === "missing") handleToothOrSurfaceClick(tooth, null);
                      }}
                      onSurfaceClick={handleToothOrSurfaceClick}
                      getColor={getSurfaceColor}
                    />
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button 
                  onClick={() => setPatientToothData({})}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition"
                >
                  Clear Chart
                </button>
                <button 
                  onClick={handleSaveOdontogram}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md shadow-teal-500/20 transition flex items-center gap-1.5"
                >
                  <Save size={16} /> Save Chart to Patient Record
                </button>
              </div>

            </div>
          )}

          {/* TAB 3: OPG RADIOGRAPH & CANAL ROOT CALIPER */}
          {activeTab === "opg" && (
            <div className="p-7 rounded-3xl bg-slate-950 border border-slate-800 shadow-xl space-y-6">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <Camera size={20} className="text-teal-400" />
                    OPG Radiograph Diagnostic Workstation & Root Caliper
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Upload panoramic OPG or IOPA sensor images. Caliper calculates canal working lengths.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMeasureMode(!measureMode)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition ${
                      measureMode 
                        ? "bg-amber-500 text-slate-950 border-amber-400" 
                        : "bg-slate-800 text-slate-300 border-slate-700"
                    }`}
                  >
                    <Scale size={14} /> {measureMode ? "Caliper Active (Click 2 Points)" : "Activate Caliper Tool"}
                  </button>

                  <label className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-teal-500 text-slate-950 hover:bg-teal-400 cursor-pointer transition">
                    {isUploadingRad ? "Uploading..." : "Upload Scan"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleUploadRadiograph} />
                  </label>
                </div>
              </div>

              <div 
                onClick={handleOpgCanvasClick}
                className="relative h-96 w-full rounded-2xl bg-slate-900 border-2 border-dashed border-slate-800 flex items-center justify-center overflow-hidden cursor-crosshair select-none"
              >
                {opgImageUrl ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img src={opgImageUrl} alt="OPG Scan" className="max-h-full max-w-full object-contain filter contrast-125" />
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      {caliperPoints.map((pt, i) => (
                        <circle key={i} cx={pt.x} cy={pt.y} r="5" fill="#F59E0B" stroke="#000" strokeWidth="1.5" />
                      ))}
                      {caliperPoints.length === 2 && (
                        <line x1={caliperPoints[0].x} y1={caliperPoints[0].y} x2={caliperPoints[1].x} y2={caliperPoints[1].y} stroke="#F59E0B" strokeWidth="2.5" strokeDasharray="4" />
                      )}
                    </svg>
                  </div>
                ) : (
                  <div className="text-center p-6 text-slate-500">
                    <Upload size={36} className="mx-auto mb-2 text-slate-600" />
                    <p className="text-sm font-bold text-slate-400">No radiograph attached to this patient record</p>
                    <p className="text-xs mt-1">Upload an image file using the button above.</p>
                  </div>
                )}

                {calibratedDistance && (
                  <div className="absolute top-4 right-4 p-3 rounded-xl bg-slate-950/90 border border-amber-500/50 backdrop-blur-md shadow-xl text-right">
                    <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Measured Root Length</p>
                    <h4 className="text-2xl font-black text-white">{calibratedDistance} mm</h4>
                    <p className="text-[10px] text-slate-400">Calibrated Scale 1:1</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 4: PHARMACOPEIA RX SHEET */}
          {activeTab === "rx" && (
            <div className="p-7 rounded-3xl bg-slate-950 border border-slate-800 shadow-xl space-y-6">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <FileText size={20} className="text-teal-400" />
                    Indian Dental Pharmacopeia Prescription Generator
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Standardized formulary regimens with meal timing and patient counseling instructions.
                  </p>
                </div>

                <button 
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 shadow-md transition"
                >
                  <Printer size={15} /> Print Rx Sheet
                </button>
              </div>

              {/* Master Formularies */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {PHARMACOPEIA_DATABASE.map(med => (
                  <div key={med.id} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{med.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-400">{med.type}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-300 mt-2">{med.dosage}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{med.instructions}</p>
                    </div>
                    <button
                      onClick={() => handleAddMedication({
                        drug: med.name,
                        dosage: med.dosage,
                        timing: med.timing,
                        instructions: med.instructions
                      })}
                      className="mt-3 w-full py-1.5 rounded-lg text-xs font-bold bg-teal-500/10 text-teal-300 border border-teal-500/20 hover:bg-teal-500 hover:text-slate-950 transition"
                    >
                      + Add to Active Rx
                    </button>
                  </div>
                ))}
              </div>

              {/* Current Prescriptions Table */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-teal-400">Current Prescriptions</h4>
                {prescribedDrugs.length === 0 ? (
                  <p className="text-xs text-slate-500">No medications currently prescribed to this patient.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="pb-3 font-bold">Drug Formulation</th>
                          <th className="pb-3 font-bold">Dosage & Regimen</th>
                          <th className="pb-3 font-bold">Timing</th>
                          <th className="pb-3 font-bold">Instructions</th>
                          <th className="pb-3 font-bold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {prescribedDrugs.map((rx) => (
                          <tr key={rx.id} className="text-slate-200">
                            <td className="py-3 font-bold text-white">{rx.drug}</td>
                            <td className="py-3">{rx.dosage}</td>
                            <td className="py-3 font-semibold text-teal-400">{rx.timing}</td>
                            <td className="py-3 text-slate-400">{rx.instructions}</td>
                            <td className="py-3 text-right">
                              <button 
                                onClick={async () => {
                                  if (selectedPatientId && rx.id) {
                                    await deleteDoc(doc(db, "clinics", clinicConfig.clinicId, "patients", selectedPatientId, "prescriptions", rx.id));
                                  }
                                }}
                                className="text-rose-400 hover:text-rose-300"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 5: PROSTHETICS LAB PIPELINE */}
          {activeTab === "lab" && (
            <div className="p-7 rounded-3xl bg-slate-950 border border-slate-800 shadow-xl space-y-6">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <Eye size={20} className="text-teal-400" />
                    Prosthetics & CAD-CAM Dental Lab Work Pipeline
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage fabrication of zirconia crowns, fixed dental prostheses, and cobalt-chrome frameworks.
                  </p>
                </div>

                <button
                  onClick={() => setShowLabModal(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 transition flex items-center gap-1.5 shadow-md shadow-teal-500/20"
                >
                  <Plus size={16} /> New Lab Order
                </button>
              </div>

              {labOrders.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
                  <p className="text-sm font-bold text-slate-400">No active lab orders in queue.</p>
                  <p className="text-xs mt-1">Orders submitted from clinic operatory will display here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {labOrders.map(order => (
                    <div key={order.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-teal-400">{order.id}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {order.status || "In Fabrication"}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{order.item}</h4>
                        <p className="text-xs text-slate-400 mt-1">Tooth FDI: <strong>#{order.tooth}</strong> • Patient: {order.patientName}</p>
                      </div>
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                        <span>Lab: {order.labName}</span>
                        <span className="font-bold text-white">₹{order.cost}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* TAB 6: CLINIC CONSUMABLES INVENTORY */}
          {activeTab === "inventory" && (
            <div className="p-7 rounded-3xl bg-slate-950 border border-slate-800 shadow-xl space-y-6">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <Package size={20} className="text-teal-400" />
                    Consumables & Clinic Inventory Control
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Live tracking of bonding agents, impression materials, and clinical therapeutics.
                  </p>
                </div>

                <button
                  onClick={() => setShowInventoryModal(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 transition flex items-center gap-1.5 shadow-md shadow-teal-500/20"
                >
                  <Plus size={16} /> Add Consumable
                </button>
              </div>

              {inventory.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
                  <p className="text-sm font-bold text-slate-400">Inventory database is empty.</p>
                  <p className="text-xs mt-1">Add items using the button above to begin tracking stock.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="pb-3 font-bold">Consumable Item</th>
                        <th className="pb-3 font-bold">Category</th>
                        <th className="pb-3 font-bold">In Stock</th>
                        <th className="pb-3 font-bold">Threshold</th>
                        <th className="pb-3 font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {inventory.map((item) => (
                        <tr key={item.id} className="text-slate-200">
                          <td className="py-3 font-bold text-white">{item.name}</td>
                          <td className="py-3 text-slate-400">{item.category || "General"}</td>
                          <td className="py-3 font-extrabold text-teal-400">{item.stock} {item.unit}</td>
                          <td className="py-3 text-slate-500">{item.min} {item.unit}</td>
                          <td className="py-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              item.stock <= item.min
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            }`}>
                              {item.stock <= item.min ? "Low Stock" : "Optimal"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          )}

        </main>
      </div>

      {/* MODAL: REGISTER PATIENT */}
      {showAddPatientModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-white">Register New Patient</h3>
              <button onClick={() => setShowAddPatientModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleRegisterPatient} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400">Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="Patient Name" 
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-teal-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400">Age</label>
                  <input 
                    type="number" 
                    placeholder="Age" 
                    value={newPatientAge}
                    onChange={(e) => setNewPatientAge(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400">Phone (WhatsApp)</label>
                  <input 
                    type="text" 
                    placeholder="910000000000" 
                    value={newPatientPhone}
                    onChange={(e) => setNewPatientPhone(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-teal-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400">Chief Complaint</label>
                <textarea 
                  rows={3}
                  placeholder="Clinical symptoms, affected quadrant, pain history" 
                  value={newPatientComplaint}
                  onChange={(e) => setNewPatientComplaint(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-teal-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setShowAddPatientModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSyncing}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 transition"
                >
                  Save to Registry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW LAB ORDER */}
      {showLabModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-white">New Prosthetic Lab Order</h3>
              <button onClick={() => setShowLabModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddLabOrder} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400">Prosthesis Type</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Zirconia Crown, Cast Framework" 
                  value={labItemName}
                  onChange={(e) => setLabItemName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-teal-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400">Tooth Number (FDI)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 16, 26" 
                    value={labToothNo}
                    onChange={(e) => setLabToothNo(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400">Estimated Cost (₹)</label>
                  <input 
                    type="number" 
                    placeholder="Cost" 
                    value={labCostEstimate}
                    onChange={(e) => setLabCostEstimate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-teal-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400">Lab Partner Name</label>
                <input 
                  type="text" 
                  placeholder="Dental Lab / Milling Center" 
                  value={labVendorName}
                  onChange={(e) => setLabVendorName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-teal-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button type="button" onClick={() => setShowLabModal(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 transition">Create Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW INVENTORY ITEM */}
      {showInventoryModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-white">Add Consumable Item</h3>
              <button onClick={() => setShowInventoryModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddInventory} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400">Item Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Composite Shade A2, Etchant, Anesthetic" 
                  value={invItemName}
                  onChange={(e) => setInvItemName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-teal-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400">Current Stock</label>
                  <input 
                    type="number" 
                    placeholder="Quantity" 
                    value={invStockQty}
                    onChange={(e) => setInvStockQty(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400">Alert Min Level</label>
                  <input 
                    type="number" 
                    placeholder="Min Alert" 
                    value={invMinQty}
                    onChange={(e) => setInvMinQty(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-teal-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400">Unit of Measurement</label>
                <input 
                  type="text" 
                  placeholder="Syringes / Cartridges / Boxes" 
                  value={invUnitMeasure}
                  onChange={(e) => setInvUnitMeasure(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-teal-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button type="button" onClick={() => setShowInventoryModal(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 transition">Save Consumable</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// ==============================================================================
// 5-SURFACE ANATOMICAL TOOTH SVG RENDER ENGINE
// ==============================================================================

function ToothCard({ toothNo, toothData, isSelected, onClick, onSurfaceClick, getColor }) {
  const isImpacted = !!toothData?.impacted;
  const isMissing = !!toothData?.missing;
  const gvClass = toothData?.gvClass;
  const gvConfig = GV_BLACK_CLASSES.find(g => g.id === gvClass);

  return (
    <div
      onClick={onClick}
      className={`relative flex flex-col items-center p-2 rounded-2xl cursor-pointer transition-all duration-150 select-none ${
        isImpacted 
          ? "bg-pink-950/40 border-2 border-pink-500 shadow-md"
          : isMissing
          ? "bg-slate-950 border border-slate-800 opacity-40"
          : isSelected
          ? "bg-teal-500/10 border-2 border-teal-400 shadow-lg shadow-teal-500/20 scale-105"
          : "bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/60"
      }`}
    >
      {/* IMPACTED BADGE */}
      {isImpacted && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded bg-pink-600 text-[8px] font-black text-white uppercase shadow-sm">
          IMP
        </span>
      )}

      {/* G.V. BLACK CLASS BADGE */}
      {!isImpacted && gvConfig && (
        <span className={`absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded ${gvConfig.color} text-[8px] font-mono font-black text-white shadow-sm`}>
          {gvConfig.code}
        </span>
      )}

      <span className={`text-[11px] font-mono font-bold mb-1 ${
        isImpacted ? "text-pink-400" : gvConfig ? "text-rose-400 font-extrabold" : "text-slate-400"
      }`}>
        {toothNo}
      </span>

      <svg width="40" height="40" viewBox="0 0 100 100" className="rounded-lg shadow-inner">
        <defs>
          <pattern id={`stripe-${toothNo}`} width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#DB2777" strokeWidth="2.5" />
          </pattern>
        </defs>

        {/* Occlusal (Center) */}
        <polygon
          points="30,30 70,30 70,70 30,70"
          fill={isImpacted ? `url(#stripe-${toothNo})` : getColor(toothNo, "occlusal")}
          stroke="#475569"
          strokeWidth="1.5"
          onClick={(e) => { e.stopPropagation(); onSurfaceClick(toothNo, "occlusal"); }}
          className="hover:opacity-80 transition cursor-pointer"
        />
        {/* Vestibular / Buccal (Top) */}
        <polygon
          points="0,0 100,0 70,30 30,30"
          fill={isImpacted ? "#831843" : getColor(toothNo, "vestibular")}
          stroke="#475569"
          strokeWidth="1.5"
          onClick={(e) => { e.stopPropagation(); onSurfaceClick(toothNo, "vestibular"); }}
          className="hover:opacity-80 transition cursor-pointer"
        />
        {/* Lingual / Palatal (Bottom) */}
        <polygon
          points="30,70 70,70 100,100 0,100"
          fill={isImpacted ? "#831843" : getColor(toothNo, "lingual")}
          stroke="#475569"
          strokeWidth="1.5"
          onClick={(e) => { e.stopPropagation(); onSurfaceClick(toothNo, "lingual"); }}
          className="hover:opacity-80 transition cursor-pointer"
        />
        {/* Mesial (Left) */}
        <polygon
          points="0,0 30,30 30,70 0,100"
          fill={isImpacted ? "#831843" : getColor(toothNo, "mesial")}
          stroke="#475569"
          strokeWidth="1.5"
          onClick={(e) => { e.stopPropagation(); onSurfaceClick(toothNo, "mesial"); }}
          className="hover:opacity-80 transition cursor-pointer"
        />
        {/* Distal (Right) */}
        <polygon
          points="100,0 100,100 70,70 70,30"
          fill={isImpacted ? "#831843" : getColor(toothNo, "distal")}
          stroke="#475569"
          strokeWidth="1.5"
          onClick={(e) => { e.stopPropagation(); onSurfaceClick(toothNo, "distal"); }}
          className="hover:opacity-80 transition cursor-pointer"
        />
      </svg>
    </div>
  );
}