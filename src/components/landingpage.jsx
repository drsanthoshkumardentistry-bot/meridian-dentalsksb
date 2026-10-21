/* ==============================================================================
 * MERIDENT (POWERED BY MERIDIANDENTAL OS) - SIGNATURE VIDEO-INSPIRED LANDING
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
  BarChart3,
  PhoneCall,
  PlayCircle,
  PlusCircle,
  LineChart,
  SearchCheck,
  Check
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

      {/* 2. HERO SECTION (Inspired by Video 77360.mp4) */}
      <section className="px-6 pt-16 pb-16 max-w-5xl mx-auto text-center space-y-8 bg-gradient-to-b from-blue-50 via-white to-white">
        <div className="inline-flex items-center space-x-2 bg-blue-100 border border-blue-200 px-4 py-1.5 rounded-full shadow-inner">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">
            Registered Clinical Healthcare Operating System
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight">
          Transform Your <br />
          <span className="text-blue-600">Dental Practice with MeriDent</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          The ultimate ERP solution for modern dental clinics, unifying 32-tooth FDI odontograms, OPG diagnostics, automated billing, and patient follow-ups.
        </p>

        {/* Hero CTAs matching video layout */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button 
            onClick={onLoginClick}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-extrabold px-8 py-4 rounded-2xl shadow-xl shadow-blue-600/20 transition transform active:scale-95 cursor-pointer"
          >
            <span>Book A Free Demo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button 
            onClick={onLoginClick}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-sm font-bold px-8 py-4 rounded-2xl shadow-sm transition cursor-pointer"
          >
            <PlayCircle className="w-4 h-4 text-blue-600" />
            <span>Watch Overview</span>
          </button>
        </div>

        {/* Quick Call Pill Bar */}
        <div className="pt-2">
          <a 
            href="tel:9043205927" 
            className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-2.5 rounded-full text-xs font-bold shadow-xs hover:bg-emerald-100 transition"
          >
            <PhoneCall className="w-4 h-4 text-emerald-600" />
            <span>Quick Call: +91 9043205927</span>
          </a>
        </div>

        {/* Dashboard Preview Mockup Container from Video */}
        <div className="pt-8 max-w-4xl mx-auto">
          <div className="bg-slate-900 rounded-3xl p-3 sm:p-4 shadow-2xl border border-slate-800">
            <div className="bg-white rounded-2xl p-4 text-left space-y-3">
              <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                <span className="text-xs font-bold text-slate-800">Welcome, MeriDent Studio</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">Active Operatory</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-50 p-2 rounded-xl">Appointments: <strong className="text-blue-600">4 Active</strong></div>
                <div className="bg-slate-50 p-2 rounded-xl">Check-ins: <strong className="text-emerald-600">3 Ready</strong></div>
                <div className="bg-slate-50 p-2 rounded-xl">Billing: <strong className="text-indigo-600">₹****</strong></div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase pt-2">
          StartUpTN: STN99974 | MSME Micro: UDYAM-TN-04-0139569
        </p>
      </section>

      {/* 3. THREE-PILLAR DEEP BLUE HIGHLIGHT GRID (Grow, Improve, Collect) */}
      <section className="px-6 max-w-5xl mx-auto mb-20">
        <div className="bg-gradient-to-b from-blue-900 via-blue-950 to-slate-950 text-white rounded-[36px] p-8 sm:p-14 shadow-2xl text-center space-y-12">
          <div className="space-y-4">
            <div className="w-14 h-14 bg-blue-800/80 rounded-2xl flex items-center justify-center mx-auto text-cyan-400 border border-blue-600/40 shadow-md">
              <PlusCircle className="w-7 h-7" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white">Grow your patient base</h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">Automated re-call systems, smart scheduling, and direct WhatsApp reminders.</p>
          </div>

          <div className="space-y-4 pt-6 border-t border-blue-800/40">
            <div className="w-14 h-14 bg-blue-800/80 rounded-2xl flex items-center justify-center mx-auto text-cyan-400 border border-blue-600/40 shadow-md">
              <LineChart className="w-7 h-7" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white">Improve Operations</h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">Centralized digital case files, staff rostering, and inter-departmental referrals.</p>
          </div>

          <div className="space-y-4 pt-6 border-t border-blue-800/40">
            <div className="w-14 h-14 bg-blue-800/80 rounded-2xl flex items-center justify-center mx-auto text-cyan-400 border border-blue-600/40 shadow-md">
              <SearchCheck className="w-7 h-7" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white">Collect & Track Better</h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">Instant UPI QR billing, pre-auth insurance claims, and consumable stock triggers.</p>
          </div>
        </div>
      </section>

      {/* 4. WHY CHOOSE US CARD SECTION */}
      <section className="px-6 max-w-5xl mx-auto mb-16">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-lg space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Why Choose Us</h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
              Simplify dental practice with easy onboarding, multi-dental clinic management, and automated scheduling tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">1</div>
              <h4 className="font-bold text-slate-900">Create Account</h4>
              <p className="text-xs text-slate-600">Sign up in 2 minutes. Full feature access from day one — no credit card needed.</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">2</div>
              <h4 className="font-bold text-slate-900">Import Your Data</h4>
              <p className="text-xs text-slate-600">Free migration of all patient records and digital case sheets effortlessly.</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">3</div>
              <h4 className="font-bold text-slate-900">Configure & Train</h4>
              <p className="text-xs text-slate-600">Live onboarding session with clinical workflow specialists.</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">✓</div>
              <h4 className="font-bold text-slate-900">Go Live Today</h4>
              <p className="text-xs text-slate-600">Start seeing patients with 32-tooth odontograms and automated WhatsApp billing from day one.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. STANDARDIZE CLINIC OPERATIONS */}
      <section className="px-6 max-w-5xl mx-auto pb-16">
        <div className="bg-gradient-to-br from-blue-900 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl space-y-6">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Standardize Your Clinic Operations with MeriDent
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
            <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
              <span>Efficient Patient Care & 32-Tooth Odontogram</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
              <span>Detailed Financial Reports & Invoices</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
              <span>Dental Lab & Inventory Consumable Management</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
              <span>Automated WhatsApp Prescription Dispatch</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FOUNDER & CO-FOUNDER LEADERSHIP SECTION (Explicitly Highlighted) */}
      <section className="px-6 max-w-4xl mx-auto pb-20">
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 text-white rounded-3xl p-8 sm:p-10 shadow-xl space-y-8">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-400">Leadership & Clinical Architecture</span>
            <h3 className="text-2xl font-black tracking-tight">Founder & Co-Founder</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Founder */}
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center space-y-2">
              <div className="w-12 h-12 bg-cyan-400 text-slate-950 font-black rounded-xl flex items-center justify-center mx-auto mb-3 text-lg shadow-sm">
                SS
              </div>
              <h4 className="text-lg font-black tracking-tight text-white">SANTHOSHKUMAR S</h4>
              <p className="text-xs font-semibold text-cyan-300 uppercase tracking-widest">Founder & Managing Director</p>
              <p className="text-[11px] text-slate-300 pt-2 leading-relaxed">
                BDS Student, Sri Ramakrishna Dental College & Hospital, Coimbatore[span_0](start_span)[span_0](end_span). Full-stack healthcare software architect[span_1](start_span)[span_1](end_span).
              </p>
            </div>

            {/* Co-founder */}
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center space-y-2">
              <div className="w-12 h-12 bg-indigo-400 text-slate-950 font-black rounded-xl flex items-center justify-center mx-auto mb-3 text-lg shadow-sm">
                SG
              </div>
              <h4 className="text-lg font-black tracking-tight text-white">SIVASABARI G</h4>
              <p className="text-xs font-semibold text-indigo-300 uppercase tracking-widest">Co-Founder & CEO</p>
              <p className="text-[11px] text-slate-300 pt-2 leading-relaxed">
                BDS Student, Dhanalakshmi Srinivasan Dental College & Hospital, Perambalur[span_2](start_span)[span_2](end_span). Operatory field requirements & clinical trials lead[span_3](start_span)[span_3](end_span).
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