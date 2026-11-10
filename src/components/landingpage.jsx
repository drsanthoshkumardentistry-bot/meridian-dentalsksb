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
  Bell,
  Calendar,
  Cloud,
  FileText,
  Lock,
  MessageCircle,
  Package,
  PhoneCall,
  ReceiptText,
  ClipboardList,
  ShieldCheck,
  Sun,
  TrendingUp,
  Users,
  WifiOff
} from "lucide-react";

const WHATSAPP_NUMBER = "919043205927";
const DEMO_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hi, I'd like a demo of MeriDent for my dental clinic."
)}`;

/* Features grouped by where in the day they happen. */
const FEATURE_GROUPS = [
  {
    heading: "At the chair",
    items: [
      { icon: Users, title: "32-tooth FDI odontogram", text: "Chart permanent and deciduous teeth with a clinical status palette, plus diagnosis and trauma notes for every patient." },
      { icon: Sun, title: "OPG & diagnosis studio", text: "Upload a panoramic film, invert the negative, measure with the caliper, and save findings next to the chart." },
      { icon: ClipboardList, title: "Treatment plans & estimates", text: "Price a plan tooth by tooth, send the estimate on WhatsApp or print it, mark it approved, then turn it into an invoice." },
      { icon: FileText, title: "Prescriptions & referrals", text: "Add medicines from presets and share the prescription on WhatsApp. Refer patients between departments." }
    ]
  },
  {
    heading: "At the desk",
    items: [
      { icon: Calendar, title: "Appointments diary", text: "Book chair and doctor slots and send a WhatsApp confirmation with one tap." },
      { icon: BarChart3, title: "GST billing & UPI QR", text: "Invoices with GST where it applies (therapeutic care is exempt), part payments, a scannable UPI QR for the exact balance, and printable invoices and receipts." },
      { icon: ReceiptText, title: "Multi-item invoices", text: "Bill several treatments on one invoice and mix GST-exempt and 18% work. Discounts are shared out fairly across the items." },
      { icon: Package, title: "Stock & staff roster", text: "Low-stock alerts for consumables, plus staff roles, shifts and licence expiry dates." }
    ]
  },
  {
    heading: "After the visit",
    items: [
      { icon: Bell, title: "WhatsApp reminders & recall", text: "See who to remind for tomorrow, who owes a balance, and who is due for a 6-month check-up. One tap opens WhatsApp with the message ready. Patients can opt out." },
      { icon: TrendingUp, title: "Reports for your accountant", text: "Daily collections by cash, UPI and card, plus a monthly GST summary. Download a spreadsheet or print a PDF." },
      { icon: WifiOff, title: "Works with weak internet", text: "Keep working when the connection drops. Your changes save on the device and sync to the cloud when you are back online." }
    ]
  }
];

const STEPS = [
  { n: "1", title: "Sign in", text: "Continue with Google, or use your email and password. Each clinic gets its own private workspace." },
  { n: "2", title: "Add your data", text: "Register patients yourself, or ask us to help you move existing records." },
  { n: "3", title: "Set up your clinic", text: "Add your clinic details, doctors and chairs. We guide you on a call if you like." },
  { n: "4", title: "Start charting", text: "Open a patient and chart the first tooth in a few taps." }
];

const COMING_NEXT = [
  "Automatic WhatsApp sending",
  "Radiograph cloud storage",
  "Lab order tracking",
  "Staff logins with roles"
];

const FAQS = [
  {
    q: "Is MeriDent free?",
    a: "It is free during early access, with no credit card. We will announce simple pricing well before anything changes, and early clinics will hear from us first."
  },
  {
    q: "Is my patients' data private?",
    a: "Yes. Each clinic's records are kept in its own workspace, and other clinics cannot see them. You can export or delete your clinic's records any time by asking us."
  },
  {
    q: "Does MeriDent send WhatsApp messages by itself?",
    a: "Not yet. It shows who needs a reminder and opens WhatsApp with the message already written, so you tap Send. Patients who opt out are never listed."
  },
  {
    q: "How does GST work on invoices?",
    a: "You choose per invoice. Therapeutic dental care is shown as GST exempt. Cosmetic work is charged 18% GST, split into CGST and SGST. Please confirm your own GST position with your accountant."
  },
  {
    q: "Will it work on my phone?",
    a: "Yes. MeriDent runs in your phone or laptop browser. There is nothing to install."
  },
  {
    q: "Can you move my existing records in?",
    a: "Yes. Message us on WhatsApp and we will help you move your patient list across."
  }
];

/* ------------------------------------------------------------------------------
 * Hero artwork: an upper dental arch (FDI 18-11, 21-28) plus a sample bill.
 * Teeth sit on an arc; widths follow real anatomy (molars wide, incisors narrow).
 * ---------------------------------------------------------------------------- */
const ARCH = [
  ["18", 34, "x"], ["17", 40, "ok"], ["16", 44, "crown"], ["15", 30, "ok"], ["14", 30, "ok"],
  ["13", 28, "ok"], ["12", 26, "ok"], ["11", 30, "ok"],
  ["21", 30, "ok"], ["22", 26, "plan"], ["23", 28, "ok"], ["24", 30, "ok"], ["25", 30, "fill"],
  ["26", 44, "ok"], ["27", 40, "ok"], ["28", 34, "x"]
];

const TOOTH_STYLE = {
  ok: { fill: "#ffffff", stroke: "#93b4f5", dash: undefined },
  fill: { fill: "#1d4ed8", stroke: "#1d4ed8", dash: undefined },
  crown: { fill: "#0b1b3a", stroke: "#0b1b3a", dash: undefined },
  plan: { fill: "#dbe7ff", stroke: "#1d4ed8", dash: "3 2" },
  x: { fill: "none", stroke: "#b8c9ea", dash: "2 3" }
};

function archGeometry() {
  // Occlusal U-shape: lower half of an ellipse, incisors at the bottom centre.
  const cx = 250, cy = 22, rx = 200, ry = 118;
  const pts = [];
  let acc = 0;
  for (let i = 0; i <= 600; i++) {
    const phi = Math.PI - (i / 600) * Math.PI;
    const x = cx + rx * Math.cos(phi);
    const y = cy + ry * Math.sin(phi);
    if (i > 0) acc += Math.hypot(x - pts[i - 1].x, y - pts[i - 1].y);
    pts.push({ x, y, phi, acc });
  }
  const widths = ARCH.map((t) => t[1] * 0.92);
  const gap = 3;
  const total = widths.reduce((a, w) => a + w + gap, 0) - gap;
  const start = (acc - total) / 2;
  let run = start;
  return ARCH.map(([fdi, , state], i) => {
    const w = widths[i];
    const target = run + w / 2;
    run += w + gap;
    const pt = pts.find((q) => q.acc >= target) || pts[pts.length - 1];
    const tx = -rx * Math.sin(pt.phi);
    const ty = ry * Math.cos(pt.phi);
    const rot = (Math.atan2(ty, tx) * 180) / Math.PI;
    const nx = Math.cos(pt.phi) / rx, ny = Math.sin(pt.phi) / ry;
    const nl = Math.hypot(nx, ny);
    const front = fdi.endsWith("1") || fdi.endsWith("2") || fdi.endsWith("3");
    const h = front ? 28 : 36;
    return { fdi, w, h, x: pt.x, y: pt.y, rot, state, i, lx: pt.x + (nx / nl) * (h / 2 + 12), ly: pt.y + (ny / nl) * (h / 2 + 12) };
  });
}

function ToothArch() {
  const teeth = archGeometry();
  return (
    <svg viewBox="0 0 500 190" role="img" aria-label="Sample odontogram: upper arch with a filling, a crown, a planned treatment and two missing teeth" className="w-full h-auto">
      {teeth.map((t) => {
        const st = TOOTH_STYLE[t.state];
        return (
          <g key={t.fdi}>
            <g transform={`translate(${t.x.toFixed(1)} ${t.y.toFixed(1)}) rotate(${t.rot.toFixed(1)})`}>
              <g className="tooth-in" style={{ animationDelay: `${120 + t.i * 45}ms` }}>
                <rect
                  x={-t.w / 2}
                  y={-t.h / 2}
                  width={t.w}
                  height={t.h}
                  rx={Math.min(t.w, t.h) / 2.4}
                  fill={st.fill}
                  stroke={st.stroke}
                  strokeWidth="1.6"
                  strokeDasharray={st.dash}
                />
              </g>
            </g>
            <text x={t.lx.toFixed(1)} y={(t.ly + 3).toFixed(1)} textAnchor="middle" fontSize="9" fill="#6b7fa8" style={{ fontVariantNumeric: "tabular-nums" }}>
              {t.fdi}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function ChartLegend() {
  const items = [
    ["Filling", "#1d4ed8", "#1d4ed8", undefined],
    ["Crown", "#0b1b3a", "#0b1b3a", undefined],
    ["Planned", "#dbe7ff", "#1d4ed8", "3 2"],
    ["Missing", "none", "#b8c9ea", "2 3"]
  ];
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-600">
      {items.map(([label, fill, stroke, dash]) => (
        <li key={label} className="inline-flex items-center gap-1.5">
          <svg width="10" height="12" aria-hidden="true">
            <rect x="1" y="1" width="8" height="10" rx="3" fill={fill} stroke={stroke} strokeWidth="1.4" strokeDasharray={dash} />
          </svg>
          {label}
        </li>
      ))}
    </ul>
  );
}

function SampleBill() {
  const row = "flex items-baseline justify-between gap-4 py-1.5";
  return (
    <div className="bg-white border border-rule rounded-xl shadow-[0_18px_40px_-18px_rgba(29,78,216,0.35)] p-4 text-xs w-full max-w-[290px] tabular">
      <div className="flex items-center justify-between pb-2 border-b border-dashed border-rule">
        <span className="font-display font-bold text-ink text-sm">Invoice</span>
        <span className="text-slate-500">INV/2026-27/0042</span>
      </div>
      <div className={row}>
        <span className="text-ink">Root canal, tooth 46<span className="block text-[10px] text-slate-500">GST exempt</span></span>
        <span className="font-semibold text-ink">₹5,000</span>
      </div>
      <div className={row}>
        <span className="text-ink">Whitening<span className="block text-[10px] text-slate-500">GST 18%</span></span>
        <span className="font-semibold text-ink">₹2,000</span>
      </div>
      <div className="border-t border-dashed border-rule pt-1.5 text-slate-600">
        <div className="flex justify-between py-0.5"><span>CGST 9%</span><span>₹180</span></div>
        <div className="flex justify-between py-0.5"><span>SGST 9%</span><span>₹180</span></div>
      </div>
      <div className="flex items-baseline justify-between border-t border-rule mt-1.5 pt-2">
        <span className="font-bold text-ink">Total</span>
        <span className="font-display font-extrabold text-lg text-brand-600">₹7,360</span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 rounded-md bg-mist px-2.5 py-1.5 text-brand-700">
        <span>Advance ₹5,000 paid</span>
        <span className="font-bold whitespace-nowrap">Balance ₹2,360</span>
      </div>
    </div>
  );
}

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
    "w-full px-3.5 py-2.5 border border-rule rounded-lg text-sm text-ink bg-white placeholder:text-slate-400";

  return (
    <div className="min-h-screen bg-white text-ink font-sans antialiased">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-rule">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="MeriDent logo"
              className="w-9 h-9 rounded-lg object-cover border border-rule"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <span className="font-display font-extrabold text-xl tracking-tight text-ink">MeriDent</span>
          </a>
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-brand-600">Features</a>
            <a href="#start" className="hover:text-brand-600">Getting started</a>
            <a href="#faq" className="hover:text-brand-600">FAQ</a>
          </nav>
          <button
            type="button"
            onClick={onLoginClick}
            disabled={loginBusy || !firebaseConfigured}
            className="text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-60 px-5 py-2 rounded-lg transition-colors"
          >
            {loginBusy ? "Connecting…" : "Sign in"}
          </button>
        </div>
      </header>

      {/* HERO */}
      <section id="top" className="bg-enamel border-b border-rule">
        <div className="max-w-6xl mx-auto px-5 pt-12 pb-16 lg:pt-20 lg:pb-24 grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-8 items-center">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 bg-mist border border-rule px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-600" aria-hidden="true" />
              Free during early access for dental clinics
            </p>

            <h1 className="font-display font-extrabold text-[2.6rem] sm:text-6xl leading-[1.02] tracking-[-0.03em] text-ink">
              Chart the tooth. Bill the visit. Remind the patient.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
              MeriDent is a practice manager for Indian dental clinics: a 32-tooth odontogram, treatment plans, GST invoices with a UPI QR, and WhatsApp reminders. It runs in your browser, so there is nothing to install.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                type="button"
                onClick={onLoginClick}
                disabled={loginBusy || !firebaseConfigured}
                className="inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-base font-bold px-7 py-3.5 rounded-xl shadow-lg shadow-brand-600/25 transition-colors"
              >
                <span>{signInLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href={DEMO_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-mist text-ink border border-rule text-base font-bold px-7 py-3.5 rounded-xl transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-brand-600" />
                <span>Ask for a demo on WhatsApp</span>
              </a>
            </div>

            {!firebaseConfigured && (
              <p role="alert" className="max-w-xl rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm font-medium text-amber-800">
                Sign-in is not set up on this deployment yet. The site owner needs to add the VITE_FIREBASE_* environment variables.
              </p>
            )}
            {authNotice && (
              <p role="status" className="max-w-xl rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
                {authNotice}
              </p>
            )}
            {authError && (
              <p role="alert" className="max-w-xl rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
                {authError}
              </p>
            )}

            {/* Email and password sign-in */}
            <div className="max-w-md">
              {!emailOpen ? (
                <button
                  type="button"
                  onClick={() => setEmailOpen(true)}
                  className="text-sm font-semibold text-brand-700 hover:text-brand-900 underline underline-offset-4"
                >
                  Use email and password instead
                </button>
              ) : (
                <form onSubmit={submitEmail} noValidate className="bg-white border border-rule rounded-xl shadow-lg p-5 space-y-3">
                  <div className="grid grid-cols-2 gap-1 rounded-lg bg-mist p-1 text-sm font-bold">
                    <button
                      type="button"
                      onClick={() => { setMode("signin"); setLocalError(""); }}
                      className={`rounded-md py-2 ${mode === "signin" ? "bg-white text-brand-700 shadow-sm" : "text-slate-500"}`}
                    >
                      Sign in
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMode("signup"); setLocalError(""); }}
                      className={`rounded-md py-2 ${mode === "signup" ? "bg-white text-brand-700 shadow-sm" : "text-slate-500"}`}
                    >
                      Create account
                    </button>
                  </div>

                  {mode === "signup" && (
                    <div>
                      <label htmlFor="auth-name" className="block text-sm font-semibold text-slate-700 mb-1">Your name or clinic name</label>
                      <input id="auth-name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                    </div>
                  )}
                  <div>
                    <label htmlFor="auth-email" className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                    <input id="auth-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="auth-password" className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                    <input
                      id="auth-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputClass}
                    />
                    <label className="mt-2 flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                      <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} className="rounded text-brand-600 focus:ring-0" />
                      Show password
                    </label>
                  </div>

                  {localError && <p role="alert" className="text-sm font-medium text-rose-700">{localError}</p>}

                  <button
                    type="submit"
                    disabled={loginBusy || !firebaseConfigured}
                    className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-bold py-3 rounded-lg"
                  >
                    {loginBusy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
                  </button>
                  {mode === "signin" && (
                    <div className="text-center">
                      <button type="button" onClick={resetPassword} className="text-sm font-semibold text-brand-700 hover:text-brand-900">
                        Forgot password?
                      </button>
                    </div>
                  )}
                  {mode === "signup" && (
                    <p className="text-xs text-slate-500 leading-relaxed">
                      We will email you a link to verify your address before you can open your clinic workspace.
                    </p>
                  )}
                </form>
              )}
            </div>

            <a
              href={`tel:+${WHATSAPP_NUMBER}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand-700"
            >
              <PhoneCall className="w-4 h-4 text-brand-600" />
              <span>Questions? Call +91 90432 05927</span>
            </a>
          </div>

          {/* Product artwork */}
          <div className="relative">
            <div className="bg-white border border-rule rounded-2xl shadow-[0_30px_60px_-30px_rgba(29,78,216,0.35)] p-5 sm:p-6 pb-10">
              <div className="flex items-baseline justify-between mb-1">
                <span className="font-display font-bold text-ink">Odontogram</span>
                <span className="text-xs text-slate-500">Upper arch, adult</span>
              </div>
              <ToothArch />
              <ChartLegend />
            </div>
            <div className="-mt-5 ml-auto mr-3 w-fit relative">
              <SampleBill />
            </div>
            <p className="text-xs text-slate-500 mt-3">Illustration with sample data, not a real patient or clinic.</p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="max-w-6xl mx-auto px-5 pt-20 pb-16 lg:pt-28">
        <div className="max-w-2xl mb-12">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-[-0.02em] leading-tight">What you can do today</h2>
          <p className="mt-3 text-base text-slate-600">Everything below is in the app now, grouped by where it happens in a clinic day.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-10 gap-y-12">
          {FEATURE_GROUPS.map((group) => (
            <div key={group.heading}>
              <h3 className="font-display font-bold text-xl text-brand-700 pb-3 border-b-2 border-brand-600">{group.heading}</h3>
              <ul className="divide-y divide-rule">
                {group.items.map(({ icon: Icon, title, text }) => (
                  <li key={title} className="py-5 flex gap-3.5">
                    <span className="mt-0.5 shrink-0 w-9 h-9 rounded-lg bg-mist text-brand-600 flex items-center justify-center">
                      <Icon className="w-[18px] h-[18px]" aria-hidden="true" />
                    </span>
                    <div>
                      <h4 className="font-bold text-ink">{title}</h4>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">{text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* GETTING STARTED */}
      <section id="start" className="bg-ink text-white">
        <div className="max-w-6xl mx-auto px-5 py-16 lg:py-20">
          <div className="max-w-2xl mb-10">
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-[-0.02em] leading-tight">Getting started</h2>
            <p className="mt-3 text-base text-blue-100/80">Free during early access. No credit card needed.</p>
          </div>
          <ol className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6">
            {STEPS.map((step) => (
              <li key={step.n} className="md:border-t md:border-blue-300/30 md:pt-5">
                <span className="font-display font-extrabold text-4xl text-blue-300">{step.n}</span>
                <h3 className="mt-2 font-display font-bold text-lg">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-blue-100/80">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* COMING NEXT */}
      <section className="max-w-6xl mx-auto px-5 py-16">
        <div className="rounded-2xl bg-enamel border border-rule p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-10">
          <div className="lg:w-1/3">
            <h2 className="font-display font-extrabold text-2xl tracking-tight">Coming next</h2>
            <p className="mt-1.5 text-sm text-slate-600">We are building these now. Tell us what your clinic needs most.</p>
          </div>
          <ul className="flex flex-wrap gap-2">
            {COMING_NEXT.map((item) => (
              <li key={item} className="bg-white border border-rule text-brand-700 text-sm font-semibold px-3.5 py-1.5 rounded-full">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* DATA & PRIVACY */}
      <section className="max-w-6xl mx-auto px-5 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          <div className="flex gap-3.5">
            <Lock className="w-5 h-5 mt-0.5 shrink-0 text-brand-600" aria-hidden="true" />
            <div>
              <h3 className="font-bold">Private workspace</h3>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">Each clinic's records are stored under its own sign-in and are not shared with other clinics. Only a verified email can open a workspace.</p>
            </div>
          </div>
          <div className="flex gap-3.5">
            <Cloud className="w-5 h-5 mt-0.5 shrink-0 text-brand-600" aria-hidden="true" />
            <div>
              <h3 className="font-bold">Cloud backup</h3>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">Your data is saved to the cloud and available on any device where you sign in.</p>
            </div>
          </div>
          <div className="flex gap-3.5">
            <ShieldCheck className="w-5 h-5 mt-0.5 shrink-0 text-brand-600" aria-hidden="true" />
            <div>
              <h3 className="font-bold">Your data, your control</h3>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">Patients can opt out of WhatsApp messages, and you can ask us any time to export or delete your clinic's records.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-enamel border-y border-rule">
        <div className="max-w-3xl mx-auto px-5 py-16 lg:py-20">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-[-0.02em] mb-8">Questions clinics ask</h2>
          <div className="divide-y divide-rule border-y border-rule">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="group py-4">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-4 text-base font-bold text-ink">
                  <span>{q}</span>
                  <span className="text-brand-600 text-2xl leading-none transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 max-w-2xl">{a}</p>
              </details>
            ))}
          </div>
          <p className="mt-6 text-sm text-slate-600">
            Still unsure?{" "}
            <a href={DEMO_LINK} target="_blank" rel="noopener noreferrer" className="font-bold text-brand-700 hover:text-brand-900 underline underline-offset-4">
              Ask us on WhatsApp
            </a>
          </p>
        </div>
      </section>

      {/* FOUNDERS */}
      <section className="max-w-4xl mx-auto px-5 py-16 lg:py-20">
        <h2 className="font-display font-extrabold text-3xl tracking-[-0.02em]">Built by dental students</h2>
        <p className="mt-2 text-base text-slate-600 max-w-xl">We study dentistry and write the code ourselves, so the app is shaped around real clinic work.</p>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            { init: "SS", name: "Santhoshkumar S", role: "Founder & Managing Director", bio: "BDS student, Sri Ramakrishna Dental College & Hospital, Coimbatore. Full-stack developer and product lead." },
            { init: "SG", name: "Sivasabari G", role: "Co-Founder & CEO", bio: "BDS student, Dhanalakshmi Srinivasan Dental College & Hospital, Perambalur. Leads clinical workflow requirements and testing." }
          ].map((p) => (
            <div key={p.name} className="flex gap-4 rounded-xl border border-rule p-5">
              <div className="shrink-0 w-12 h-12 rounded-full bg-brand-600 text-white font-display font-extrabold flex items-center justify-center">{p.init}</div>
              <div>
                <h3 className="font-display font-bold text-lg leading-tight">{p.name}</h3>
                <p className="text-sm font-semibold text-brand-700">{p.role}</p>
                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{p.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-brand-600 text-white">
        <div className="max-w-4xl mx-auto px-5 py-14 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <h2 className="font-display font-extrabold text-3xl tracking-[-0.02em] leading-tight">Try MeriDent with your clinic</h2>
          <button
            type="button"
            onClick={onLoginClick}
            disabled={loginBusy || !firebaseConfigured}
            className="shrink-0 inline-flex items-center justify-center gap-2 bg-white hover:bg-mist disabled:opacity-60 text-brand-700 text-base font-bold px-7 py-3.5 rounded-xl transition-colors"
          >
            <span>{signInLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* FLOATING WHATSAPP */}
      <a
        href={DEMO_LINK}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-5 right-5 z-50 w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30 transition-colors"
      >
        <MessageCircle className="w-7 h-7" />
      </a>

      {/* FOOTER */}
      <footer className="bg-ink text-blue-100/70 py-10 px-5 text-center text-sm space-y-1.5">
        <p className="font-display font-bold text-white text-base">MeriDent</p>
        <p>StartupTN ref: STN99974 | MSME Udyam: UDYAM-TN-04-0139569</p>
        <p className="text-blue-100/50 pt-2">© 2026 MeriDent. All rights reserved.</p>
      </footer>
    </div>
  );
}
