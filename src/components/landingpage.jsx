/* ==============================================================================
 * MERIDIAN DENTAL OS - PROFESSIONAL LANDING PAGE
 * File: src/components/LandingPage.jsx
 * ============================================================================== */

import React from "react";
import { 
  Activity, 
  Calendar, 
  ShieldCheck, 
  Share2, 
  Cpu, 
  Lock, 
  MessageCircle, 
  ArrowRight,
  CheckCircle2,
  FileText
} from "lucide-react";

export default function LandingPage({ onLoginClick }) {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      
      {/* 1. TOP HEADER NAVIGATION */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black tracking-wider shadow-sm">
            MD
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight text-slate-900 block leading-none">
              Meridian Dental
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
              Dental OS[span_6](start_span)[span_6](end_span)
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={onLoginClick}
            className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-xl transition border border-blue-200 cursor-pointer"
          >
            14-Day Free Trial[span_7](start_span)[span_7](end_span)
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
      <section className="px-6 pt-16 pb-12 max-w-4xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 px-3.5 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
            Registered Clinical Healthcare Operating System[span_8](start_span)[span_8](end_span)
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight">
          A Chair-Side Native Operating System for <br />
          <span className="text-blue-600">Modern Dental Practices</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Unifying interactive 32-tooth FDI odontogram charting[span_9](start_span)[span_9](end_span), OPG diagnostic studio[span_10](start_span)[span_10](end_span), e-prescriptions[span_11](start_span)[span_11](end_span), and operatory workflows in a lightning-fast browser platform[span_12](start_span)[span_12](end_span).
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={onLoginClick}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-8 py-4 rounded-2xl shadow-lg shadow-blue-600/20 transition transform active:scale-95 cursor-pointer"
          >
            <span>Launch Platform</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase pt-2">
          StartUpTN: STN99974 | MSME Micro: UDYAM-TN-04-0139569[span_13](start_span)[span_13](end_span)
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
              Paper case files cause lost history and slow chair-side exams[span_14](start_span)[span_14](end_span). Meridian Dental OS replaces fragmented silos with unified inventory tracking, lab coordination, and automated WhatsApp communication[span_15](start_span)[span_15](end_span)[span_16](start_span)[span_16](end_span).
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center z-10 min-w-[200px]">
            <Activity className="w-10 h-10 text-blue-400 mx-auto mb-2" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Performance</span>
            <p className="text-lg font-black mt-1 text-white">3x Faster Consultations[span_17](start_span)[span_17](end_span)</p>
          </div>
        </div>
      </section>

      {/* 4. CORE FEATURES GRID */}
      <section className="px-6 max-w-5xl mx-auto pb-20 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Engineered for the Operatory Floor
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Built by clinicians and developers for absolute speed and accuracy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          
          {/* Feature 1 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs hover:shadow-lg transition text-center space-y-4 group">
            <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md group-hover:scale-110 transition">
              <Activity className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-slate-900">32-Tooth FDI Odontogram</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Instant visual mapping for caries, restorations, RCT, crowns, implants, and trauma notation with single-click palettes[span_18](start_span)[span_18](end_span)[span_19](start_span)[span_19](end_span).
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs hover:shadow-lg transition text-center space-y-4 group">
            <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md group-hover:scale-110 transition">
              <Share2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-slate-900">WhatsApp E-Prescriptions</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              One-tap digital prescription dispatch directly to patient mobile numbers alongside automated low-stock inventory alerts[span_20](start_span)[span_20](end_span)[span_21](start_span)[span_21](end_span).
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs hover:shadow-lg transition text-center space-y-4 group">
            <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md group-hover:scale-110 transition">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-slate-900">Cloud Data Security</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bank-grade cloud architecture with multi-level encryption protecting patient history records and billing data[span_22](start_span)[span_22](end_span)[span_23](start_span)[span_23](end_span).
            </p>
          </div>

        </div>
      </section>

      {/* 5. FLOATING WHATSAPP WIDGET */}
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

      {/* 6. FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6 text-center text-xs space-y-3 border-t border-slate-800">
        <p className="font-bold text-slate-200">Meridian Dental OS — Clinical Healthcare Operating System[span_24](start_span)[span_24](end_span)</p>
        <p>StartUpTN Ref: STN99974 | MSME Micro: UDYAM-TN-04-0139569 | Founding Team: Santhoshkumar S & Sivasabari G[span_25](start_span)[span_25](end_span)[span_26](start_span)[span_26](end_span)</p>
        <p className="text-slate-500 pt-4">© 2026 Meridian Dental OS. All rights reserved.</p>
      </footer>

    </div>
  );
}