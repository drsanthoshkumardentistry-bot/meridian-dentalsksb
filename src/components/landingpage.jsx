/* ==============================================================================
 * MERIDENT (POWERED BY MERIDIANDENTAL OS) - PROFESSIONAL LANDING PAGE
 * File: src/components/landingpage.jsx
 * ============================================================================== */

import React from "react";
import { 
  Activity, 
  ShieldCheck, 
  MessageCircle, 
  ArrowRight,
  Sun,
  DollarSign,
  Package,
  Briefcase,
  Lock,
  Cloud,
  CheckCircle2,
  TrendingUp,
  Users,
  BarChart3
} from "lucide-react";

export default function LandingPage({ onLoginClick }) {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      
      {/* 1. TOP HEADER NAVIGATION */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          <img 
            src="/logo.png" 
            alt="MeriDent Logo" 
            className="w-10 h-10 rounded-xl object-cover shadow-sm border border-slate-200" 
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div>
            <span className="text-base font-extrabold tracking-tight text-slate-900 block leading-none">
              MeriDent
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
              Powered by MeridianDental OS
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={onLoginClick}
            className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-xl transition border border-blue-200 cursor-pointer shadow-xs"
          >
            14-Day Free Trial
          </button>
          <button 
            onClick={onLoginClick}
            className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl shadow-md transition cursor-pointer"
          >
            Log In
          </button>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="px-6 pt-16 pb-16 max-w-4xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full shadow-inner">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
            Registered Clinical Healthcare Operating System
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight">
          A Chair-Side Native <br />
          <span className="text-blue-600">Operating System for</span> <br />
          Modern Dental Practices
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Unifying interactive 32-tooth FDI odontogram charting, OPG diagnostic studio, e-prescriptions, and operatory workflows in a lightning-fast browser platform.
        </p>

        <div className="pt-2">
          <button 
            onClick={onLoginClick}
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-extrabold px-8 py-4 rounded-2xl shadow-lg shadow-blue-600/20 transition transform active:scale-95 cursor-pointer"
          >
            <span>Launch Platform</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase pt-2">
          StartUpTN: STN99974 | MSME Micro: UDYAM-TN-04-0139569
        </p>
      </section>

      {/* 3. WORKFLOW FRICTION & SOLUTION BANNER */}
      <section className="px-6 max-w-5xl mx-auto mb-16">
        <div className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="space-y-4 max-w-lg z-10">
            <span className="text-xs font-extrabold uppercase tracking-widest bg-blue-800/60 px-3.5 py-1 rounded-full border border-blue-500/30 text-blue-200">
              Eliminate Paper Records
            </span>
            <h3 className="text-2xl font-black tracking-tight">Save 15 Minutes Per Patient</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Paper case files cause lost history and slow chair-side exams. MeriDent OS replaces fragmented silos with unified inventory tracking, lab coordination, and automated WhatsApp communication.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center z-10 min-w-[200px]">
            <Activity className="w-10 h-10 text-blue-400 mx-auto mb-2" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Performance</span>
            <p className="text-lg font-black mt-1 text-white">3x Faster Consultations</p>
          </div>
        </div>
      </section>

      {/* 4. CORE FEATURES & CLINICAL WORKSTATIONS */}
      <section className="px-6 max-w-6xl mx-auto pb-20 space-y-16">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Engineered for the Operatory Floor
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Built by clinicians and developers for absolute speed and accuracy.
          </p>
        </div>

        {/* Feature 1: Interactive Odontogram */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-md">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900">32-Tooth Interactive FDI Odontogram</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Single-click status palette to instantly chart caries, restorations, RCT, crowns, implants, fractures, and spacing with persistent cloud synchronization.
            </p>
            <ul className="text-xs text-slate-700 space-y-1.5 font-medium">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Simultaneous Maxillary & Mandibular arch tracking</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Pediatric Deciduous (20-tooth) and Adult (32-tooth) modes</li>
            </ul>
          </div>
          <div className="rounded-2xl overflow-hidden border border-slate-300 shadow-lg bg-white p-6 text-center space-y-3">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto">
              <Activity className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Digital FDI Odontogram Module</h4>
            <p className="text-xs text-slate-500">Instant visual charting for all clinical conditions.</p>
          </div>
        </div>

        {/* Feature 2: OPG Radiology Studio */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8">
          <div className="order-2 lg:order-1 rounded-2xl overflow-hidden border border-slate-300 shadow-lg bg-slate-900 p-6 text-center space-y-3">
            <div className="w-12 h-12 bg-blue-900 text-blue-300 rounded-xl flex items-center justify-center mx-auto">
              <Sun className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-sm">OPG Diagnostic Workstation Studio</h4>
            <p className="text-xs text-slate-400">Side-by-side panoramic radiograph inspection with negative inversion and calibration.</p>
          </div>
          <div className="order-1 lg:order-2 space-y-4">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-md">
              <Sun className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900">Radiology Integration & OPG Studio</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Review panoramic films side-by-side with structured diagnostic fields for trauma findings, impaction classifications, and bone height analysis.
            </p>
            <ul className="text-xs text-slate-700 space-y-1.5 font-medium">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Instant negative X-ray inversion filter</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Built-in millimeter measurement calipers</li>
            </ul>
          </div>
        </div>

        {/* Feature 3 Cards: Inventory, Invoicing & Roster */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Stock Maintenance</h4>
            <p className="text-xs text-slate-600">Real-time consumable thresholds for anesthetics, composites, and surgical sutures.</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Insurance & QR Billing</h4>
            <p className="text-xs text-slate-600">Pre-auth claims tracking with instant UPI QR patient checkout settlements.</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Employee Roster</h4>
            <p className="text-xs text-slate-600">Shift timings and operatory chair allocations for staff and clinical specialists.</p>
          </div>
        </div>
      </section>

      {/* 5. SECURITY & ARCHITECTURE INFRASTRUCTURE */}
      <section className="px-6 max-w-6xl mx-auto pb-20 space-y-12">
        <div className="text-center space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-blue-600">Bank-Grade Compliance</span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Secure Infrastructure & Data Protection
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">AES-256 Encryption</h4>
            <p className="text-xs text-slate-600">All patient data encrypted securely at rest and in transit.</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Cloud Infrastructure</h4>
            <p className="text-xs text-slate-600">Enterprise-grade cloud architecture with 99.9% uptime reliability.</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Automated Cloud Backups</h4>
            <p className="text-xs text-slate-600">Continuous daily backups ensuring zero data loss across practices.</p>
          </div>
        </div>
      </section>

      {/* 6. FOUNDER & CO-FOUNDER LEADERSHIP SECTION */}
      <section className="px-6 max-w-4xl mx-auto pb-20">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-lg space-y-8">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-blue-600">Leadership & Clinical Architecture</span>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Founder & Co-Founder</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Founder */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-2">
              <div className="w-12 h-12 bg-blue-600 text-white font-black rounded-xl flex items-center justify-center mx-auto mb-3 text-lg shadow-sm">
                SS
              </div>
              <h4 className="text-lg font-black tracking-tight text-slate-900">SANTHOSHKUMAR S</h4>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest">Founder & Managing Director</p>
              <p className="text-[11px] text-slate-600 pt-2 leading-relaxed">
                BDS Student, Sri Ramakrishna Dental College & Hospital, Coimbatore. Full-stack healthcare software architect.
              </p>
            </div>

            {/* Co-founder */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-2">
              <div className="w-12 h-12 bg-indigo-600 text-white font-black rounded-xl flex items-center justify-center mx-auto mb-3 text-lg shadow-sm">
                SG
              </div>
              <h4 className="text-lg font-black tracking-tight text-slate-900">SIVASABARI G</h4>
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest">Co-Founder & CEO</p>
              <p className="text-[11px] text-slate-600 pt-2 leading-relaxed">
                BDS Student, Dhanalakshmi Srinivasan Dental College & Hospital, Perambalur. Operatory field requirements & clinical trials lead.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FLOATING WHATSAPP WIDGET */}
      <div className="fixed bottom-6 right-6 z-50">
        <a 
          href="https://wa.me/919043205927" 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30 transition transform hover:scale-110 active:scale-95"
          aria-label="Chat on WhatsApp"
        >
          <MessageCircle className="w-7 h-7 fill-current" />
        </a>
      </div>

      {/* 8. FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6 text-center text-xs space-y-3 border-t border-slate-800">
        <p className="font-bold text-slate-200">MeriDent — Powered by MeridianDental OS</p>
        <p>StartUpTN Ref: STN99974 | MSME Micro: UDYAM-TN-04-0139569</p>
        <p className="text-slate-500 pt-4">© 2026 MeriDent (MeridianDental OS). All rights reserved.</p>
      </footer>

    </div>
  );
}