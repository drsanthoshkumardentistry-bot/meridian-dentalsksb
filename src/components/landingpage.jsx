/* ==============================================================================
 * MERIDIAN DENTAL OS - PROFESSIONAL LANDING PAGE (BLUE THEME)
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
  Play
} from "lucide-react";

export default function LandingPage({ onLoginClick }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 text-white font-sans antialiased selection:bg-blue-600 selection:text-white">
      
      {/* 1. TOP HEADER NAVIGATION */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-blue-900/40 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          <img 
            src="/logo.png" 
            alt="MeridianDental Logo" 
            className="w-10 h-10 rounded-xl object-cover shadow-md border border-blue-500/30" 
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div>
            <span className="text-base font-extrabold tracking-tight text-white block leading-none">
              MeridianDental
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
              Dental OS
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={onLoginClick}
            className="text-xs font-bold text-cyan-300 bg-blue-950/60 hover:bg-blue-900/80 px-4 py-2.5 rounded-xl transition border border-blue-700/50 cursor-pointer shadow-sm"
          >
            14-Day Free Trial
          </button>
          <button 
            onClick={onLoginClick}
            className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 transition cursor-pointer"
          >
            Log In
          </button>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="px-6 pt-20 pb-16 max-w-4xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center space-x-2 bg-blue-900/40 border border-blue-700/50 px-4 py-1.5 rounded-full shadow-inner">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
            Registered Clinical Healthcare Operating System[span_0](start_span)[span_0](end_span)
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
          India's Smartest & Fastest <br />
          <span className="text-cyan-400">OS for Dental Clinics</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Unifying interactive 32-tooth FDI odontogram charting[span_1](start_span)[span_1](end_span), OPG diagnostic studio[span_2](start_span)[span_2](end_span), e-prescriptions[span_3](start_span)[span_3](end_span), and operatory workflows in a lightning-fast browser platform[span_4](start_span)[span_4](end_span).
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={onLoginClick}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-extrabold px-8 py-4 rounded-2xl shadow-xl shadow-cyan-500/20 transition transform active:scale-95 cursor-pointer"
          >
            <span>Launch Platform</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase pt-3">
          StartUpTN: STN99974 | MSME Micro: UDYAM-TN-04-0139569[span_5](start_span)[span_5](end_span)
        </p>
      </section>

      {/* 3. PLATFORM WALKTHROUGH VIDEO SECTION */}
      <section className="px-6 max-w-5xl mx-auto mb-20">
        <div className="bg-slate-900/80 border border-blue-900/50 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
              <span className="text-xs font-mono text-slate-400 ml-2">meridian-dentalsksb.vercel.app</span>
            </div>
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-800/40">
              Interactive Workflow Tour[span_6](start_span)[span_6](end_span)
            </span>
          </div>

          <div className="rounded-2xl overflow-hidden border border-blue-900/60 shadow-xl bg-slate-950 relative aspect-video flex items-center justify-center group">
            {/* If you host the video file in public, use <video src="/walkthrough.mp4" controls autoPlay loop muted className="w-full h-full object-cover" /> */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 bg-cyan-500 text-slate-950 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/30 mb-3 group-hover:scale-110 transition cursor-pointer">
                <Play className="w-7 h-7 fill-current ml-1" />
              </div>
              <h4 className="text-base font-bold text-white">Watch MeridianDental OS in Action</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md">Seamless appointments, 32-tooth odontogram charting, inventory stock triggers, and instant UPI QR billing[span_7](start_span)[span_7](end_span).</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. WORKFLOW FRICTION & SOLUTION BANNER */}
      <section className="px-6 max-w-5xl mx-auto mb-20">
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 border border-blue-800/50 rounded-3xl p-8 sm:p-12 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="space-y-4 max-w-lg z-10">
            <span className="text-xs font-extrabold uppercase tracking-widest bg-cyan-500/10 text-cyan-400 px-3.5 py-1 rounded-full border border-cyan-500/30">
              Eliminate Paper Records[span_8](start_span)[span_8](end_span)
            </span>
            <h3 className="text-2xl font-black tracking-tight text-white">Save 15 Minutes Per Patient[span_9](start_span)[span_9](end_span)</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Paper case files cause lost history and slow chair-side exams[span_10](start_span)[span_10](end_span). MeridianDental OS replaces fragmented silos with unified inventory tracking, lab coordination, and automated WhatsApp communication[span_11](start_span)[span_11](end_span)[span_12](start_span)[span_12](end_span).
            </p>
          </div>
          <div className="bg-blue-900/30 backdrop-blur-md p-6 rounded-2xl border border-blue-700/30 text-center z-10 min-w-[200px]">
            <Activity className="w-10 h-10 text-cyan-400 mx-auto mb-2" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Performance</span>
            <p className="text-lg font-black mt-1 text-white">3x Faster Consultations[span_13](start_span)[span_13](end_span)</p>
          </div>
        </div>
      </section>

      {/* 5. CORE FEATURES & CLINICAL WORKSTATIONS */}
      <section className="px-6 max-w-6xl mx-auto pb-24 space-y-16">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Engineered for the Operatory Floor
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Built by clinicians and developers for absolute speed and accuracy.
          </p>
        </div>

        {/* Feature 1: Interactive Odontogram */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-slate-900/60 border border-blue-900/40 backdrop-blur-sm rounded-3xl p-6 sm:p-8">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-blue-600/30 text-cyan-400 border border-blue-500/30 rounded-2xl flex items-center justify-center shadow-md">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-white">32-Tooth Interactive FDI Odontogram</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Single-click status palette to instantly chart caries, restorations, RCT, crowns, implants, fractures, and spacing with persistent cloud synchronization[span_14](start_span)[span_14](end_span).
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 font-medium">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Simultaneous Maxillary & Mandibular arch tracking[span_15](start_span)[span_15](end_span)</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Pediatric Deciduous (20-tooth) and Adult (32-tooth) modes[span_16](start_span)[span_16](end_span)</li>
            </ul>
          </div>
          <div className="rounded-2xl overflow-hidden border border-blue-900/60 shadow-xl bg-slate-950 p-6 text-center space-y-3">
            <div className="w-12 h-12 bg-blue-900/40 text-cyan-400 rounded-xl flex items-center justify-center mx-auto border border-blue-700/30">
              <Activity className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-sm">Digital FDI Odontogram Module</h4>
            <p className="text-xs text-slate-400">Instant visual charting for all clinical conditions[span_17](start_span)[span_17](end_span).</p>
          </div>
        </div>

        {/* Feature 2: OPG Radiology Studio */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-slate-900/60 border border-blue-900/40 backdrop-blur-sm rounded-3xl p-6 sm:p-8">
          <div className="order-2 lg:order-1 rounded-2xl overflow-hidden border border-blue-900/60 shadow-xl bg-slate-950 p-6 text-center space-y-3">
            <div className="w-12 h-12 bg-cyan-950 text-cyan-400 rounded-xl flex items-center justify-center mx-auto border border-cyan-800/40">
              <Sun className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-sm">OPG Diagnostic Workstation Studio</h4>
            <p className="text-xs text-slate-400">Side-by-side panoramic radiograph inspection with negative inversion and calibration[span_18](start_span)[span_18](end_span).</p>
          </div>
          <div className="order-1 lg:order-2 space-y-4">
            <div className="w-12 h-12 bg-blue-600/30 text-cyan-400 border border-blue-500/30 rounded-2xl flex items-center justify-center shadow-md">
              <Sun className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-white">Radiology Integration & OPG Studio</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Review panoramic films side-by-side with structured diagnostic fields for trauma findings, impaction classifications, and bone height analysis[span_19](start_span)[span_19](end_span).
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 font-medium">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Instant negative X-ray inversion filter[span_20](start_span)[span_20](end_span)</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Built-in millimeter measurement calipers[span_21](start_span)[span_21](end_span)</li>
            </ul>
          </div>
        </div>

        {/* Feature 3 Cards: Inventory, Invoicing & Roster */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 border border-blue-900/40 rounded-2xl p-6 shadow-md space-y-3 backdrop-blur-sm">
            <div className="w-10 h-10 bg-blue-900/40 text-cyan-400 rounded-xl flex items-center justify-center border border-blue-700/30">
              <Package className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-sm">Stock Maintenance</h4>
            <p className="text-xs text-slate-300">Real-time consumable thresholds for anesthetics, composites, and surgical sutures[span_22](start_span)[span_22](end_span).</p>
          </div>

          <div className="bg-slate-900/60 border border-blue-900/40 rounded-2xl p-6 shadow-md space-y-3 backdrop-blur-sm">
            <div className="w-10 h-10 bg-emerald-950/60 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-800/40">
              <DollarSign className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-sm">Insurance & QR Billing</h4>
            <p className="text-xs text-slate-300">Pre-auth claims tracking with instant UPI QR patient checkout settlements[span_23](start_span)[span_23](end_span).</p>
          </div>

          <div className="bg-slate-900/60 border border-blue-900/40 rounded-2xl p-6 shadow-md space-y-3 backdrop-blur-sm">
            <div className="w-10 h-10 bg-indigo-950/60 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-800/40">
              <Briefcase className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-sm">Employee Roster</h4>
            <p className="text-xs text-slate-300">Shift timings and operatory chair allocations for staff and clinical specialists[span_24](start_span)[span_24](end_span).</p>
          </div>
        </div>
      </section>

      {/* 6. SECURITY & ARCHITECTURE INFRASTRUCTURE */}
      <section className="px-6 max-w-6xl mx-auto pb-24 space-y-12">
        <div className="text-center space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-400">Bank-Grade Compliance</span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Secure Infrastructure & Data Protection
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900/80 border border-blue-900/50 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 bg-blue-600/20 text-cyan-400 rounded-xl flex items-center justify-center border border-blue-500/30">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-sm">AES-256 Encryption</h4>
            <p className="text-xs text-slate-300">All patient data encrypted securely at rest and in transit.</p>
          </div>

          <div className="bg-slate-900/80 border border-blue-900/50 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 bg-blue-600/20 text-cyan-400 rounded-xl flex items-center justify-center border border-blue-500/30">
              <Cloud className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-sm">Cloud Infrastructure</h4>
            <p className="text-xs text-slate-300">Enterprise-grade cloud architecture with 99.9% uptime reliability.</p>
          </div>

          <div className="bg-slate-900/80 border border-blue-900/50 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 bg-blue-600/20 text-cyan-400 rounded-xl flex items-center justify-center border border-blue-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-sm">Automated Cloud Backups</h4>
            <p className="text-xs text-slate-300">Continuous daily backups ensuring zero data loss across practices.</p>
          </div>
        </div>
      </section>

      {/* 7. FOUNDER & CO-FOUNDER LEADERSHIP SECTION */}
      <section className="px-6 max-w-4xl mx-auto pb-24">
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 border border-blue-800/50 rounded-3xl p-8 sm:p-10 text-white shadow-2xl space-y-8">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-400">Leadership & Clinical Architecture</span>
            <h3 className="text-2xl font-black tracking-tight">Founder & Co-Founder</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Founder */}
            <div className="bg-blue-950/40 backdrop-blur-md border border-blue-700/30 rounded-2xl p-6 text-center space-y-2">
              <div className="w-12 h-12 bg-cyan-400 text-slate-950 font-black rounded-xl flex items-center justify-center mx-auto mb-3 text-lg">
                SS
              </div>
              <h4 className="text-lg font-black tracking-tight text-white">SANTHOSHKUMAR S</h4>
              <p className="text-xs font-semibold text-cyan-300 uppercase tracking-widest">Founder & Managing Director</p>
              <p className="text-[11px] text-slate-300 pt-2 leading-relaxed">
                BDS Student, Sri Ramakrishna Dental College & Hospital, Coimbatore[span_25](start_span)[span_25](end_span). Full-stack healthcare software architect[span_26](start_span)[span_26](end_span).
              </p>
            </div>

            {/* Co-founder */}
            <div className="bg-blue-950/40 backdrop-blur-md border border-blue-700/30 rounded-2xl p-6 text-center space-y-2">
              <div className="w-12 h-12 bg-indigo-400 text-slate-950 font-black rounded-xl flex items-center justify-center mx-auto mb-3 text-lg">
                SG
              </div>
              <h4 className="text-lg font-black tracking-tight text-white">SIVASABARI G</h4>
              <p className="text-xs font-semibold text-indigo-300 uppercase tracking-widest">Co-founder & CEO</p>
              <p className="text-[11px] text-slate-300 pt-2 leading-relaxed">
                BDS Student, Dhanalakshmi Srinivasan Dental College & Hospital, Perambalur[span_27](start_span)[span_27](end_span). Operatory field requirements & clinical trials lead[span_28](start_span)[span_28](end_span).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FLOATING WHATSAPP WIDGET */}
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

      {/* 9. FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-12 px-6 text-center text-xs space-y-3 border-t border-blue-950">
        <p className="font-bold text-slate-200">MeridianDental OS — Clinical Healthcare Operating System[span_29](start_span)[span_29](end_span)</p>
        <p>StartUpTN Ref: STN99974 | MSME Micro: UDYAM-TN-04-0139569[span_30](start_span)[span_30](end_span)</p>
        <p className="text-slate-500 pt-4">© 2026 MeridianDental OS. All rights reserved.</p>
      </footer>

    </div>
  );
}