/* ==============================================================================
 * MERIDIAN DENTAL OS - PROFESSIONAL LANDING PAGE (BESTOSYS STYLE)
 * File: src/components/LandingPage.jsx
 * ============================================================================== */

import React from "react";
import { 
  Activity, 
  Calendar, 
  ShieldCheck, 
  Share2, 
  Cpu, 
  HelpCircle, 
  Lock, 
  MessageCircle, 
  ArrowRight,
  CheckCircle2
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
              Dental OS
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={onLoginClick}
            className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-xl transition border border-blue-200"
          >
            Free Trial
          </button>
          <button 
            onClick={onLoginClick}
            className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl shadow-md transition"
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
            Practice Management Software
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Grow Your Practice With <br />
          <span className="text-blue-600">Meridian Dental OS</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Meridian Dental comes with advanced features like 32-tooth interactive FDI odontograms, OPG diagnosis studios, and automated WhatsApp prescriptions that help in practice growth.
        </p>

        <div className="pt-2">
          <button 
            onClick={onLoginClick}
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-8 py-4 rounded-2xl shadow-lg shadow-blue-600/20 transition transform active:scale-95"
          >
            <span>Start Free Trial</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 3. VISUAL PATIENT JOURNEY / BANNER CARD */}
      <section className="px-6 max-w-5xl mx-auto mb-16">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="space-y-4 max-w-lg z-10">
            <span className="text-xs font-extrabold uppercase tracking-widest bg-emerald-800/60 px-3.5 py-1 rounded-full border border-emerald-500/30">
              Workflow Optimization
            </span>
            <h3 className="text-2xl font-black tracking-tight">The Modern Chair-Side Journey</h3>
            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
              A normal patient journey starts with an inquiry or appointment and ends with successful treatment completion. Eliminate paper drops and administrative delays at every stage of the operatory lifecycle.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center z-10">
            <Activity className="w-12 h-12 text-emerald-300 mx-auto mb-2" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">Cloud Synchronized</span>
            <p className="text-lg font-black mt-1">3x Faster Consultations</p>
          </div>
        </div>
      </section>

      {/* 4. FEATURE GRID (BESTOSYS BANNER CARD STYLE) */}
      <section className="px-6 max-w-5xl mx-auto pb-20 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Clinics We Serve Worldwide
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Engineered for solo practitioners and multi-chair dental hospitals alike.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          
          {/* Card 1 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs hover:shadow-lg transition text-center space-y-4 group">
            <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md group-hover:scale-110 transition">
              <Activity className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-slate-900">Practice Growth</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Several tools to help you analyze and grow your practice in a systematic and consistent manner.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs hover:shadow-lg transition text-center space-y-4 group">
            <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md group-hover:scale-110 transition">
              <Share2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-slate-900">Social Media & E-Rx</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Good work spreads by word-of-mouth. Add the wings of instant WhatsApp prescription dispatch to your clinic.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs hover:shadow-lg transition text-center space-y-4 group">
            <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md group-hover:scale-110 transition">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-slate-900">Data Security</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Protections at multiple levels ensure your patient case records enjoy end-to-end cloud security.
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
      <footer className="bg-slate-900 text-slate-400 py-12 px-6 text-center text-xs space-y-4 border-t border-slate-800">
        <p className="font-bold text-slate-200">Meridian Dental OS — Clinical Healthcare Operating System</p>
        
        {/* Founders Highlights */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-6 py-2 text-slate-300">
          <div>
            <span className="font-bold text-white">SANTHOSHKUMAR S</span>
            <span className="text-[10px] text-blue-400 block">Founder & ManagingDirector</span>
          </div>
          <div className="hidden sm:block text-slate-700">|</div>
          <div>
            <span className="font-bold text-white">SIVASABARI G</span>
            <span className="text-[10px] text-blue-400 block">Founder & CEO</span>
          </div>
        </div>

        <p>StartUpTN Ref: STN99974 | MSME Udyam: UDYAM-TN-04-0139569</p>
        <p className="text-slate-500">© 2026 Meridian Dental OS. All rights reserved.</p>
      </footer>

    </div>
  );
}