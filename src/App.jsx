/* ==============================================================================
 * MERIDIAN DENTAL OS - PRODUCTION BUILD (SYNTAX VERIFIED)
 * File: src/App.jsx
 * ============================================================================== */

import React, { useState, useEffect } from "react";
import {
  Menu, X, Search, Plus, Trash2, Calendar, Users, Sun,
  DollarSign, Package, CheckCircle2, Activity, UserCheck
} from "lucide-react";

import * as FirebaseModule from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection, doc, setDoc, onSnapshot, serverTimestamp, addDoc
} from "firebase/firestore";

const auth = FirebaseModule.auth;
const db = FirebaseModule.db;
const firebaseConfigured = Boolean(auth && FirebaseModule.firebaseConfigured !== false);
const loginWithGoogle = FirebaseModule.loginWithGoogle || (async () => {});
const logoutUser = FirebaseModule.logoutUser || (async () => {});

const PERMANENT_UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const PERMANENT_LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const CLINICAL_PALETTE = [
  { id: "HLT", label: "Healthy", border: "border-emerald-300", bg: "bg-emerald-50", text: "text-emerald-700" },
  { id: "CAR", label: "Caries", border: "border-rose-200", bg: "bg-rose-50", text: "text-rose-600" },
  { id: "RES", label: "Restored", border: "border-sky-200", bg: "bg-sky-50", text: "text-sky-600" },
  { id: "RCT", label: "RCT Done", border: "border-purple-200", bg: "bg-purple-50", text: "text-purple-600" },
  { id: "CRW", label: "Crown", border: "border-amber-200", bg: "bg-amber-50", text: "text-amber-600" },
  { id: "FRC", label: "Fractured", border: "border-rose-400", bg: "bg-rose-50", text: "text-rose-700" }
];

export default function App() {
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [toastMessage, setToastMessage] = useState(null);

  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [inventory, setInventory] = useState([]);

  const tenantId = authUser ? authUser.uid : null;

  useEffect(() => {
    if (!firebaseConfigured || !auth) {
      setAuthLoading(false);
      return;
    }
    return onAuthStateChanged(auth, (user) => {
      setAuthUser(user || null);
      setAuthLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!tenantId || !db) return;
    const unsubP = onSnapshot(collection(db, "clinics", tenantId, "patients"), s => setPatients(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubA = onSnapshot(collection(db, "clinics", tenantId, "appointments"), s => setAppointments(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubInv = onSnapshot(collection(db, "clinics", tenantId, "inventory"), s => setInventory(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubP(); unsubA(); unsubInv(); };
  }, [tenantId]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [newPatientForm, setNewPatientForm] = useState({ name: "", phone: "", age: "" });
  const [activePaletteStatus, setActivePaletteStatus] = useState("CAR");

  const activePatient = patients.find(p => p.id === selectedPatientId) || null;

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    if (!newPatientForm.name || !tenantId || !db) return;
    const ref = await addDoc(collection(db, "clinics", tenantId, "patients"), {
      ...newPatientForm, registeredDate: new Date().toLocaleDateString("en-IN"), toothConditions: {}
    });
    setSelectedPatientId(ref.id);
    setIsAddPatientOpen(false);
    setIsChartModalOpen(true);
    showToast("Patient registered");
  };

  const handleToothTap = async (toothNo) => {
    if (!activePatient || !tenantId || !db) return;
    const current = { ...(activePatient.toothConditions || {}) };
    if (current[toothNo] === activePaletteStatus) delete current[toothNo];
    else current[toothNo] = activePaletteStatus;
    await setDoc(doc(db, "clinics", tenantId, "patients", activePatient.id), { toothConditions: current }, { merge: true });
  };

  if (authLoading) return <div className="h-screen bg-[#0b1329] text-white flex items-center justify-center">Loading...</div>;

  if (!authUser) {
    return (
      <div className="h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <h1 className="text-2xl font-bold">Meridian Dental OS</h1>
          <button onClick={() => loginWithGoogle()} className="w-full py-3.5 bg-white text-slate-900 font-bold rounded-xl text-xs">Sign in with Google</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800 overflow-hidden font-sans">
      {toastMessage && <div className="fixed bottom-5 right-5 z-50 bg-[#0b1329] text-white px-4 py-2 rounded-xl text-xs shadow-xl">{toastMessage}</div>}

      <aside className="w-64 bg-[#0b1329] text-white flex flex-col justify-between hidden md:flex">
        <div className="p-5 font-bold border-b border-slate-800">Meridian Dental OS</div>
        <nav className="p-3 space-y-1 flex-1">
          {["Dashboard", "Patients & Odontogram"].map(item => (
            <button key={item} onClick={() => setActiveNav(item)} className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium ${activeNav === item ? "bg-blue-600 text-white" : "text-slate-300"}`}>{item}</button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800"><button onClick={() => logoutUser()} className="w-full py-2 bg-rose-500/10 text-rose-300 rounded-lg text-xs font-bold">Sign Out</button></div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
          <div className="font-bold text-slate-900">Workspace: {activeNav}</div>
          <div className="text-xs font-bold text-slate-600">{authUser.displayName}</div>
        </header>

        <main className="p-6 md:p-8 max-w-7xl mx-auto w-full">
          {activeNav === "Dashboard" && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Clinical Overview</h1>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border">Patients: {patients.length}</div>
                <div className="bg-white p-5 rounded-2xl border">Appointments: {appointments.length}</div>
                <div className="bg-white p-5 rounded-2xl border">Inventory: {inventory.length}</div>
              </div>
            </div>
          )}

          {activeNav === "Patients & Odontogram" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-bold">Patient Records</h1>
                <button onClick={() => setIsAddPatientOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">+ Register Patient</button>
              </div>
              <div className="space-y-3">
                {patients.map(p => (
                  <div key={p.id} onClick={() => { setSelectedPatientId(p.id); setIsChartModalOpen(true); }} className="bg-white p-4 rounded-xl border flex justify-between items-center cursor-pointer">
                    <div className="font-bold text-sm">{p.name} ({p.age}y)</div>
                    <span className="text-xs text-blue-600 font-bold">Open Odontogram →</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {isChartModalOpen && activePatient && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-3xl w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold">{activePatient.name} • Odontogram</h3>
              <button onClick={() => setIsChartModalOpen(false)}><X className="w-5 h-5"/></button>
            </div>
            <div className="flex gap-2">
              {CLINICAL_PALETTE.map(c => (
                <button key={c.id} onClick={() => setActivePaletteStatus(c.id)} className={`px-3 py-1 rounded border text-xs font-bold ${c.bg} ${c.text}`}>{c.label}</button>
              ))}
            </div>
            <div className="flex justify-center gap-1.5 flex-wrap">
              {PERMANENT_UPPER.map(num => {
                const val = activePatient.toothConditions?.[num];
                return (
                  <button key={num} onClick={() => handleToothTap(num)} className="w-10 h-12 rounded border flex flex-col items-center justify-center text-xs font-bold bg-slate-50">
                    <span>{num}</span>
                    <span className="text-[9px] text-blue-600">{val || "HLT"}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {isAddPatientOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form onSubmit={handleCreatePatient} className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 text-xs">
            <h3 className="font-bold text-sm">Register Patient</h3>
            <input required type="text" placeholder="Full Name" value={newPatientForm.name} onChange={e => setNewPatientForm({...newPatientForm, name: e.target.value})} className="w-full p-2 border rounded" />
            <input required type="tel" placeholder="Phone" value={newPatientForm.phone} onChange={e => setNewPatientForm({...newPatientForm, phone: e.target.value})} className="w-full p-2 border rounded" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsAddPatientOpen(false)} className="px-3 py-1 border rounded">Cancel</button>
              <button type="submit" className="px-4 py-1 bg-blue-600 text-white rounded font-bold">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}