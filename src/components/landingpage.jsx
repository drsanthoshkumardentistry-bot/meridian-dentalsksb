/* ==============================================================================
 * MERIDENT - WHITE & BLUE LANDING PAGE
 * File: src/components/landingpage.jsx
 * Shown to visitors who are not signed in. Only describes what the app does today;
 * upcoming features are clearly marked as "coming next".
 * ============================================================================== */

import React, { useState } from "react";
import { isValidEmailAddress } from "../authErrors";
import {
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Cloud,
  FileText,
  HeartPulse,
  Lock,
  MessageCircle,
  Package,
  PhoneCall,
  ShieldCheck,
  Sun,
  TrendingUp,
  Users
} from "lucide-react";

const WHATSAPP_NUMBER = "919043205927";
const DEMO_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hi, I'd like a demo of MeriDent for my dental clinic."
)}`;

const FEATURES = [
  {
    icon: Users,
    title: "32-tooth FDI odontogram",
    text: "Chart permanent and deciduous teeth with a clinical status palette, plus diagnosis and trauma notes for every patient."
  },
  {
    icon: Sun,
    title: "OPG & diagnosis studio",
    text: "Upload a panoramic film, invert the negative, measure with the caliper, and save findings next to the chart."
  },
  {
    icon: Calendar,
    title: "Appointments diary",
    text: "Book chair and doctor slots and send a WhatsApp confirmation with one tap."
  },
  {
    icon: FileText,
    title: "Prescriptions & referrals",
    text: "Add medicines from presets and share the prescription on WhatsApp. Refer patients between departments."
  },
  {
    icon: BarChart3,
    title: "Billing with UPI QR",
    text: "Create invoices, show a UPI QR for payment, and track insurance claim status."
  },
  {
    icon: Package,
    title: "Stock & staff roster",
    text: "Low-stock alerts for consumables, plus staff roles, shifts and licence expiry dates."
  }
];

const STEPS = [
  { n: "1", title: "Sign in", text: "Continue with Google. Each clinic gets its own private workspace." },
  { n: "2", title: "Add your data", text: "Register patients yourself, or ask us to help you move existing records." },
  { n: "3", title: "Set up your clinic", text: "Add your clinic details, doctors and chairs. We guide you on a call if you like." },
  { n: "4", title: "Start charting", text: "Open a patient and chart the first tooth in a few taps." }
];

const COMING_NEXT = [
  "GST-ready invoices",
  "Automated recall reminders",
  "Shareable treatment plans",
  "Lab order tracking",
  "Staff logins with roles",
  "Owner reports"
];

export default function LandingPage({
  onLoginClick,
  onEmailSignIn,
  onEmailSignUp,
  onResetPassword,
  loginBusy = false,
  authError = "",
  authNotice = "",
  firebaseConfigured = true
}) {
  const signInLabel = loginBusy ? "Connecting…" : "Start free with Google";

  const [emailOpen, setEmailOpen] = useState(false);
  const [mode, setMode] = useState("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");

  const submitEmail = (event) => {
    event.preventDefault();
    setLocalError("");
    if (mode === "signup" && !name.trim()) {
      setLocalError("Enter your name or clinic name.");
      return;
    }
    if (!isValidEmailAddress(email)) {
      setLocalError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setLocalError("Password must be at least 8 characters.");
      return;
    }
    if (mode === "signup") {
      if (onEmailSignUp) onEmailSignUp(name.trim(), email.trim(), password);
    } else if (onEmailSignIn) {
      onEmailSignIn(email.trim(), password);
    }
  };

  const resetPassword = () => {
    setLocalError("");
    if (!isValidEmailAddress(email)) {
      setLocalError("Enter your email address above first.");
      return;
    }
    if (onResetPassword) onResetPassword(email.trim());
  };

  const inputClass =
    "w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800 bg-white focus:outline-none focus:border-blue-500";

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="MeriDent logo"
              className="w-10 h-10 rounded-xl object-cover border border-slate-200"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <div className="leading-none">
              <span className="block text-base font-extrabold tracking-tight text-slate-900">MeriDent</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Dental practice management</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onLoginClick}
            disabled={loginBusy || !firebaseConfigured}
            className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 px-5 py-2.5 rounded-xl shadow-md transition"
          >
            {loginBusy ? "Connecting…" : "Sign in"}
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="bg-gradient-to-b from-blue-50 via-white to-white">
        <div className="max-w-5xl mx-auto px-5 pt-14 pb-14 text-center space-y-7">
          <div className="inline-flex items-center gap-2 bg-blue-100 border border-blue-200 px-4 py-1.5 rounded-full">
            <HeartPulse className="w-3.5 h-3.5 text-blue-700" />
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Early access for dental clinics</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            Run your dental clinic <span className="text-blue-600">from one clean workspace</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Digital case sheets with a 32-tooth odontogram, an OPG viewer, appointments, billing with UPI QR and WhatsApp
            sharing, built by dental students for Indian clinics.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={onLoginClick}
              disabled={loginBusy || !firebaseConfigured}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-extrabold px-8 py-4 rounded-2xl shadow-xl shadow-blue-600/20 transition"
            >
              <span>{signInLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href={DEMO_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-sm font-bold px-8 py-4 rounded-2xl transition"
            >
              <MessageCircle className="w-4 h-4 text-blue-600" />
              <span>Ask for a demo on WhatsApp</span>
            </a>
          </div>

          {!firebaseConfigured && (
            <p role="alert" className="max-w-xl mx-auto rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs font-medium text-amber-800">
              Sign-in is not set up on this deployment yet. The site owner needs to add the VITE_FIREBASE_* environment variables.
            </p>
          )}
          {authNotice && (
            <p role="status" className="max-w-xl mx-auto rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
              {authNotice}
            </p>
          )}
          {authError && (
            <p role="alert" className="max-w-xl mx-auto rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
              {authError}
            </p>
          )}

          {/* Email and password sign-in */}
          <div className="max-w-md mx-auto text-left">
            {!emailOpen ? (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setEmailOpen(true)}
                  className="text-xs font-bold text-blue-700 hover:text-blue-900 underline underline-offset-4"
                >
                  Use email and password instead
                </button>
              </div>
            ) : (
              <form onSubmit={submitEmail} noValidate className="bg-white border border-slate-200 rounded-2xl shadow-lg p-5 space-y-3">
                <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => { setMode("signin"); setLocalError(""); }}
                    className={`rounded-lg py-2 ${mode === "signin" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode("signup"); setLocalError(""); }}
                    className={`rounded-lg py-2 ${mode === "signup" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}
                  >
                    Create account
                  </button>
                </div>

                {mode === "signup" && (
                  <div>
                    <label htmlFor="auth-name" className="block text-xs font-semibold text-slate-600 mb-1">Your name or clinic name</label>
                    <input id="auth-name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                  </div>
                )}
                <div>
                  <label htmlFor="auth-email" className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                  <input id="auth-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="auth-password" className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                  />
                  <label className="mt-2 flex items-center gap-2 text-[11px] text-slate-500 cursor-pointer">
                    <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} className="rounded text-blue-600 focus:ring-0" />
                    Show password
                  </label>
                </div>

                {localError && <p role="alert" className="text-xs font-medium text-rose-700">{localError}</p>}

                <button
                  type="submit"
                  disabled={loginBusy || !firebaseConfigured}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold py-3 rounded-xl"
                >
                  {loginBusy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
                </button>
                {mode === "signin" && (
                  <div className="text-center">
                    <button type="button" onClick={resetPassword} className="text-xs font-semibold text-blue-700 hover:text-blue-900">
                      Forgot password?
                    </button>
                  </div>
                )}
                {mode === "signup" && (
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    We will email you a link to verify your address before you can open your clinic workspace.
                  </p>
                )}
              </form>
            )}
          </div>

          <a
            href={`tel:+${WHATSAPP_NUMBER}`}
            className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 hover:text-blue-900"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Questions? Call +91 90432 05927</span>
          </a>

          {/* Sample preview */}
          <div className="pt-4 max-w-3xl mx-auto">
            <div className="bg-slate-900 rounded-3xl p-3 sm:p-4 shadow-2xl border border-slate-800">
              <div className="bg-white rounded-2xl p-4 text-left space-y-3">
                <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                  <span className="text-xs font-bold text-slate-800">Clinical overview</span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">Sample preview</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl">Patients<strong className="block text-blue-600 text-base">128</strong></div>
                  <div className="bg-slate-50 p-3 rounded-xl">Visits today<strong className="block text-blue-600 text-base">9</strong></div>
                  <div className="bg-slate-50 p-3 rounded-xl">Low stock<strong className="block text-blue-600 text-base">2</strong></div>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 pt-2">Illustration with sample numbers, not real clinic data.</p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-6xl mx-auto px-5 py-14 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">What you can do today</h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">Everything below is available in the app now.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
              <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900">{title}</h3>
              <p className="text-xs leading-relaxed text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PILLARS */}
      <section className="max-w-5xl mx-auto px-5 pb-14">
        <div className="bg-gradient-to-b from-blue-900 via-blue-950 to-slate-950 text-white rounded-[32px] p-8 sm:p-12 shadow-2xl grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div className="space-y-3">
            <Users className="w-7 h-7 mx-auto text-cyan-300" />
            <h3 className="text-lg font-black">Keep patients informed</h3>
            <p className="text-xs text-slate-300 leading-relaxed">Appointment diary and one-tap WhatsApp confirmations and prescriptions.</p>
          </div>
          <div className="space-y-3">
            <TrendingUp className="w-7 h-7 mx-auto text-cyan-300" />
            <h3 className="text-lg font-black">Organise operations</h3>
            <p className="text-xs text-slate-300 leading-relaxed">Digital case files, staff roster and department referrals in one place.</p>
          </div>
          <div className="space-y-3">
            <BarChart3 className="w-7 h-7 mx-auto text-cyan-300" />
            <h3 className="text-lg font-black">Collect and track</h3>
            <p className="text-xs text-slate-300 leading-relaxed">UPI QR billing, insurance claim status and consumable stock alerts.</p>
          </div>
        </div>
      </section>

      {/* GETTING STARTED */}
      <section className="max-w-5xl mx-auto px-5 pb-14">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-lg space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Getting started</h2>
            <p className="text-sm text-slate-600">Free during early access. No credit card needed.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {STEPS.map((step) => (
              <div key={step.n} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">{step.n}</div>
                <h4 className="font-bold text-slate-900">{step.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMING NEXT */}
      <section className="max-w-5xl mx-auto px-5 pb-14">
        <div className="rounded-3xl bg-blue-50 border border-blue-100 p-8 space-y-4 text-center">
          <h2 className="text-xl font-black tracking-tight text-slate-900">Coming next</h2>
          <p className="text-xs text-slate-600">We are building these now. Tell us what your clinic needs most.</p>
          <div className="flex flex-wrap justify-center gap-2">
            {COMING_NEXT.map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5 bg-white border border-blue-200 text-blue-800 text-xs font-semibold px-3 py-1.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* DATA & PRIVACY */}
      <section className="max-w-5xl mx-auto px-5 pb-14">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="rounded-2xl border border-slate-200 p-6 space-y-2">
            <Lock className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-sm">Private workspace</h3>
            <p className="text-xs text-slate-600 leading-relaxed">Each clinic's records are stored under its own Google account and are not shared with other clinics.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-6 space-y-2">
            <Cloud className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-sm">Cloud backup</h3>
            <p className="text-xs text-slate-600 leading-relaxed">Your data is saved to the cloud and available on any device where you sign in.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-6 space-y-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-sm">Your data, your control</h3>
            <p className="text-xs text-slate-600 leading-relaxed">Ask us any time to export or delete your clinic's records.</p>
          </div>
        </div>
      </section>

      {/* FOUNDERS */}
      <section className="max-w-4xl mx-auto px-5 pb-16">
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 text-white rounded-3xl p-8 sm:p-10 shadow-xl space-y-6">
          <div className="text-center space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-300">The team</span>
            <h3 className="text-2xl font-black tracking-tight">Built by dental students</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="bg-white/10 border border-white/10 rounded-2xl p-6 text-center space-y-2">
              <div className="w-12 h-12 bg-cyan-300 text-slate-950 font-black rounded-xl flex items-center justify-center mx-auto text-lg">SS</div>
              <h4 className="text-lg font-black">Santhoshkumar S</h4>
              <p className="text-xs font-semibold text-cyan-200 uppercase tracking-widest">Founder & Managing Director</p>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                BDS student, Sri Ramakrishna Dental College & Hospital, Coimbatore. Full-stack developer and product lead.
              </p>
            </div>
            <div className="bg-white/10 border border-white/10 rounded-2xl p-6 text-center space-y-2">
              <div className="w-12 h-12 bg-indigo-300 text-slate-950 font-black rounded-xl flex items-center justify-center mx-auto text-lg">SG</div>
              <h4 className="text-lg font-black">Sivasabari G</h4>
              <p className="text-xs font-semibold text-indigo-200 uppercase tracking-widest">Co-Founder & CEO</p>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                BDS student, Dhanalakshmi Srinivasan Dental College & Hospital, Perambalur. Leads clinical workflow requirements and testing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-3xl mx-auto px-5 pb-20 text-center space-y-5">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Try MeriDent with your clinic</h2>
        <button
          type="button"
          onClick={onLoginClick}
          disabled={loginBusy || !firebaseConfigured}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-extrabold px-8 py-4 rounded-2xl shadow-xl shadow-blue-600/20 transition"
        >
          <span>{signInLabel}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>

      {/* FLOATING WHATSAPP */}
      <a
        href={DEMO_LINK}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-5 right-5 z-50 w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30 transition"
      >
        <MessageCircle className="w-7 h-7" />
      </a>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-10 px-5 text-center text-xs space-y-2 border-t border-slate-800">
        <p className="font-bold text-slate-200">MeriDent</p>
        <p>StartupTN ref: STN99974 | MSME Udyam: UDYAM-TN-04-0139569</p>
        <p className="text-slate-500 pt-2">© 2026 MeriDent. All rights reserved.</p>
      </footer>
    </div>
  );
}
