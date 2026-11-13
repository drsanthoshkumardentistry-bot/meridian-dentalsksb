/* ==============================================================================
 * MERIDENT - PREMIUM BLUE LANDING PAGE
 * File: src/components/landingpage.jsx
 * Shown to visitors who are not signed in. Only describes what the app does today;
 * upcoming features are clearly marked as "coming next".
 * ============================================================================== */

import React, { useState } from "react";
import { isValidEmailAddress } from "../authErrors";
import { setSignInChoice, signInChoice } from "../connectOnly";
import Hero3D from "./Hero3D.jsx";
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
  ScanSearch,
  IndianRupee,
  CalendarDays,
  MessagesSquare,
  TrendingUp,
  Users,
  WifiOff,
  Wallet,
  Briefcase,
  GraduationCap,
  Flag,
  LayoutDashboard,
  Network
} from "lucide-react";

const WHATSAPP_NUMBER = "919043205927";
const DEMO_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hi, I'd like a demo of MeriDent for my dental clinic."
)}`;

/* Features grouped by where in the day they happen. Only things the app does today. */
const TONES = {
  blue: { head: "text-slate-800", dot: "bg-slate-600", card: "bg-gradient-to-br from-slate-100 to-white border-slate-200", chip: "bg-slate-200 text-slate-700" },
  aqua: { head: "text-emerald-800", dot: "bg-emerald-500", card: "bg-gradient-to-br from-emerald-50 to-white border-emerald-100", chip: "bg-emerald-100 text-emerald-700" },
  navy: { head: "text-blue-800", dot: "bg-blue-500", card: "bg-gradient-to-br from-blue-50 to-white border-blue-100", chip: "bg-blue-100 text-blue-700" },
  sky: { head: "text-stone-800", dot: "bg-stone-500", card: "bg-gradient-to-br from-stone-100 to-white border-stone-200", chip: "bg-stone-200 text-stone-700" }
};

const FEATURE_GROUPS = [
  {
    heading: "At the chair",
    tone: "blue",
    items: [
      { icon: Users, title: "32-tooth FDI odontogram", text: "Chart adult and primary teeth. A tooth can hold several findings at once, such as caries, a root canal and a crown, and each one can be removed on its own." },
      { icon: ScanSearch, title: "OPG & diagnosis studio", text: "Open a panoramic film at full size, zoom in, adjust brightness and contrast, and invert the negative. Calibrate against an object of known length to measure in millimetres." },
      { icon: ClipboardList, title: "Treatment plans & estimates", text: "Price a plan tooth by tooth and send the patient a link on WhatsApp. They approve or decline from their phone, with no sign-in. Approved plans turn into an invoice." },
      { icon: ClipboardList, title: "Draft visit notes from the chart", text: "One tap fills findings, advice and the next planned treatment from the patient's chart. You edit the note before you save it, and treatment done is left for you to write." },
      { icon: Users, title: "Extra-oral examination", text: "Record the face, jaw joints, lymph nodes, lips and skin, plus mouth opening in mm. Each exam is saved with its date, and anything unusual is listed at the top. A new exam is compared with the last one." },
      { icon: ShieldCheck, title: "Perio chart", text: "Enter six probing depths per tooth, with bleeding and mobility. Depths colour-code green, amber and red, and a summary shows deep sites, bleeding percentage and the deepest tooth. Each exam is saved with its date and compared with the previous one." },
      { icon: FileText, title: "Medical, treatment & fitness certificates", text: "Print a medical certificate (rest advised), a dental treatment certificate or a fitness certificate with your clinic name, the doctor's name and council number. It prints on plain paper with space for a signature and seal." },
      { icon: ShieldCheck, title: "Caries risk & gum screening", text: "Tick risk factors to see low, moderate or high caries risk with a suggested recall. Score six sextants for a gum (BPE) screening. Both are saved on the patient." },
      { icon: FileText, title: "Signed treatment consents", text: "Pick a consent for an extraction, root canal, implant, braces and more, edit the wording, and have the patient or a parent sign on screen. The signed copy stays on the patient's record and prints on demand." },
      { icon: FileText, title: "Prescriptions & referrals", text: "Add medicines from presets and share the prescription on WhatsApp. Refer patients between departments." }
    ]
  },
  {
    heading: "At the desk",
    tone: "aqua",
    items: [
      { icon: CalendarDays, title: "Appointments diary", text: "Book by chair and doctor, with a warning before you double-book. See today and upcoming visits, and mark each one Completed, No show or Cancelled." },
      { icon: IndianRupee, title: "GST billing & UPI QR", text: "Invoices with GST where it applies (therapeutic care is exempt), part payments, a scannable UPI QR for the exact balance, and printable invoices and receipts." },
      { icon: ReceiptText, title: "Multi-item invoices", text: "Bill several treatments on one invoice and mix GST-exempt and 18% work. Discounts are shared out fairly across the items." },
      { icon: Users, title: "Walk-in queue & triage", text: "Give each walk-in a token, mark urgent cases to go first, see how long each person has waited, and call them in from the diary." },
      { icon: Calendar, title: "Online booking page", text: "Switch on a link you can share on WhatsApp or Instagram. Patients send a request, you confirm it, and it lands in your diary with a WhatsApp confirmation ready." },
      { icon: MessageCircle, title: "Patient feedback", text: "After a visit, one tap opens WhatsApp asking for a rating from 1 to 5. Record the reply, get a flag when someone is unhappy, and send a review link to happy patients." },
      { icon: Package, title: "Lab order tracking", text: "Send crowns, bridges and dentures to a lab with a due date. See what is late, message the lab on WhatsApp, and tell the patient the moment their work is back." },
      { icon: ClipboardList, title: "Treatment plan follow-up", text: "See estimates patients have not answered and approved plans nobody has booked, and nudge them on WhatsApp with one tap." },
      { icon: IndianRupee, title: "Pay in instalments", text: "In the Collect window, split the balance into 2 to 24 monthly parts. Each one shows Paid, Part paid, Due or Overdue. The bill's due date follows the next unpaid instalment, so the overdue list and reminders follow the plan. Collect any down payment first." },
      { icon: Wallet, title: "Dues and overdue tracking", text: "Set a due date, see unpaid money by age, filter to overdue invoices, search by patient and export the list to a spreadsheet." }
    ]
  },
  {
    heading: "Running the clinic",
    tone: "navy",
    items: [
      { icon: Package, title: "Stock with reorder and expiry alerts", text: "Set a reorder level and an expiry date for each item. See what is low or expiring, and send a reorder list to your supplier on WhatsApp." },
      { icon: Briefcase, title: "Staff roster, leave and reviews", text: "Track licence expiry, approve leave, and record performance reviews. Alerts come from your own saved dates." },
      { icon: LayoutDashboard, title: "Today at a glance", text: "A dashboard with today's schedule, money collected this month, what is outstanding, and a short list of what needs your attention." },
      { icon: Network, title: "Branches", text: "Run several clinics from one account. Switch branch from the header, compare patients, visits and billing side by side, and move a patient with their records between branches." },
      { icon: Lock, title: "Team logins & activity log", text: "Give staff their own login as manager, dentist or receptionist. Each person accepts an invitation and sees only what their role allows. Owners and managers can see who changed what." },
      { icon: TrendingUp, title: "Reports for your accountant", text: "Daily collections by cash, UPI and card, plus a monthly GST summary. Download a spreadsheet or print a PDF." },
      { icon: IndianRupee, title: "Expenses & profit", text: "Record rent, salaries, lab fees and materials. See money received, money spent and the month's profit side by side, and download the expenses as a spreadsheet." },
      { icon: ShieldCheck, title: "Insurance claims", text: "Note the insurer and claim number on an invoice, track it as submitted, approved, rejected or settled, and see how much the insurers still owe. A settled claim is added to the invoice as a payment." }
    ]
  },
  {
    heading: "Beyond your clinic",
    tone: "sky",
    items: [
      { icon: MessagesSquare, title: "MeriDent Connect", text: "A professional network for dentists verified by our team. Discuss cases, ask peers, mark the best answer, save posts, follow colleagues, add events to your calendar, and send a consult request to a nearby specialist. Patient names are never shared." },
      { icon: Bell, title: "WhatsApp reminders & recall", text: "See who to remind for tomorrow, who owes a balance, and who is due for a 6-month check-up. One tap opens WhatsApp with the message ready. Patients can opt out." },
      { icon: WifiOff, title: "Works with weak internet", text: "Keep working when the connection drops. Your changes save on the device and sync to the cloud when you are back online." }
    ]
  }
];

const STEPS = [
  { n: "1", title: "Sign in", text: "Continue with Google, or use your email and password. Each clinic gets its own private workspace." },
  { n: "2", title: "Add your data", text: "Register patients yourself, or upload your existing patient list." },
  { n: "3", title: "Set up your clinic", text: "Add your clinic details, doctors and chairs. We guide you on a call if you like." },
  { n: "4", title: "Start charting", text: "Open a patient and chart the first tooth in a few taps." }
];

const COMING_NEXT = [
  "Automatic WhatsApp sending",
  "Radiograph cloud storage"
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
    q: "Does MeriDent handle insurance claims?",
    a: "You can track them. Note the insurer and claim number on an invoice, follow its status, and record the insurer's payment. MeriDent does not send claims to insurers or connect to cashless networks, so you still submit them on the insurer's own portal."
  },
  {
    q: "What is MeriDent Connect?",
    a: "A professional network for dentists. Our team checks each dentist's registration before they can read or post. You can discuss de-identified cases, ask questions, share tips and events, follow colleagues, and send a consult request to a nearby specialist. Patient names are never shared, and case notes are included only when consent is recorded."
  },
  {
    q: "Can I run more than one branch or give my staff logins?",
    a: "Yes. Add branches in Practice Profile and switch between them from the header. Invite staff by email as manager, dentist or receptionist. Each person accepts the invitation and sees only the screens their role allows. Branch limits hide other branches in the app, and moving records between branches is coming next."
  },
  {
    q: "Can you move my existing records in?",
    a: "Yes. Upload a patient list from a spreadsheet (CSV) in Practice Profile, or bring in a MeriDent backup. You see a preview before anything is added. Message us on WhatsApp if you want help."
  }
];

/* ------------------------------------------------------------------------------
 * Hero artwork: an upper dental arch (FDI 18-11, 21-28) plus a sample bill.
 * Teeth sit on an arc; widths follow real anatomy (molars wide, incisors narrow).
 * ---------------------------------------------------------------------------- */
const ARCH = [
  ["18", 34, "x"], ["17", 40, "ok"], ["16", 44, "multi"], ["15", 30, "ok"], ["14", 30, "ok"],
  ["13", 28, "ok"], ["12", 26, "ok"], ["11", 30, "ok"],
  ["21", 30, "ok"], ["22", 26, "plan"], ["23", 28, "ok"], ["24", 30, "ok"], ["25", 30, "fill"],
  ["26", 44, "ok"], ["27", 40, "ok"], ["28", 34, "x"]
];

const TOOTH_STYLE = {
  ok: { fill: "#ffffff", stroke: "#fcd34d", dash: undefined },
  fill: { fill: "#b45309", stroke: "#b45309", dash: undefined },
  crown: { fill: "#1f2937", stroke: "#1f2937", dash: undefined },
  multi: { fill: "#1f2937", stroke: "#1f2937", dash: undefined },
  plan: { fill: "#fef3c7", stroke: "#b45309", dash: "3 2" },
  x: { fill: "none", stroke: "#d6d3d1", dash: "2 3" }
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
    <svg viewBox="0 0 500 190" role="img" aria-label="Sample odontogram: upper arch with a filling, a tooth with a crown and two other findings, a planned treatment and two missing teeth" className="w-full h-auto">
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
                {t.state === "multi" && (
                  <>
                    <circle cx={-6} cy={t.h / 2 - 7} r="3.2" fill="#fcd34d" stroke="#fff" strokeWidth="1" />
                    <circle cx={6} cy={t.h / 2 - 7} r="3.2" fill="#e11d48" stroke="#fff" strokeWidth="1" />
                  </>
                )}
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
    ["Filling", "#b45309", "#b45309", undefined],
    ["Several findings", "#1f2937", "#1f2937", undefined],
    ["Planned", "#fef3c7", "#b45309", "3 2"],
    ["Missing", "none", "#d6d3d1", "2 3"]
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
    <div className="bg-white border border-rule rounded-xl shadow-lift p-4 text-xs w-full max-w-[290px] tabular">
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
      <div className="mt-2 flex items-center justify-between gap-3 rounded-md bg-stone-100 px-2.5 py-1.5 text-brand-700">
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
  const [specialist, setSpecialist] = useState(() => signInChoice() === true);
  const pickSpecialist = (on) => { setSpecialist(on); setSignInChoice(on); };

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
    "w-full px-3.5 py-2.5 border border-rule rounded-lg text-sm text-ink bg-white placeholder:text-slate-500";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f8ff] via-[#eaf1fc] to-[#dbe7f8] text-ink font-sans antialiased">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/60 backdrop-blur-xl border-b border-white/70 shadow-[0_8px_30px_-18px_rgba(17,24,39,.45)]">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="MeriDent logo"
              className="w-9 h-9 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <span className="font-display font-bold text-xl tracking-tight text-ink">MeriDent</span>
          </a>
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-brand-600">Features</a>
            <a href="#start" className="hover:text-brand-600">Getting started</a>
            <a href="#faq" className="hover:text-brand-600">FAQ</a>
          </nav>
          <button
            type="button"
            onClick={onLoginClick}
            disabled={loginBusy || !firebaseConfigured}
            className="text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 shadow-md shadow-blue-700/30 disabled:opacity-60 px-5 py-2 rounded-full transition-colors"
          >
            {loginBusy ? "Connecting…" : "Sign in"}
          </button>
        </div>
      </header>

      {/* HERO */}
      <section id="top" className="relative overflow-hidden border-b border-white/60 bg-[radial-gradient(60%_60%_at_100%_0%,rgba(56,189,248,.35),transparent),radial-gradient(55%_60%_at_0%_30%,rgba(148,163,184,.3),transparent),radial-gradient(50%_50%_at_80%_100%,rgba(253,224,71,.2),transparent)]">
        <div className="relative max-w-6xl mx-auto px-5 pt-14 pb-20 lg:pt-28 lg:pb-32 grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-14 lg:gap-16 items-center">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-blue-800 bg-white/80 border border-blue-200 shadow-sm px-3.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" aria-hidden="true" />
              Built by dental students in India. Free during early access.
            </p>

            <h1 className="font-display font-bold text-[2.5rem] sm:text-[3.4rem] leading-[1.06] tracking-[-0.03em] text-ink">
              Chart the tooth. Bill the visit. Remind the patient.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-lg leading-[1.7]">
              MeriDent is a practice manager for Indian dental clinics: a 32-tooth odontogram, treatment plans patients can approve from their phone, GST invoices with a UPI QR, stock and staff, online booking, branches, and WhatsApp reminders. It runs in your browser, so there is nothing to install.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                type="button"
                onClick={onLoginClick}
                disabled={loginBusy || !firebaseConfigured}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 shadow-lg shadow-blue-700/30 disabled:opacity-60 text-white text-[15px] font-semibold px-7 py-3.5 rounded-full transition-colors"
              >
                <span>{signInLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href={DEMO_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white/80 hover:bg-white text-ink border border-white shadow-sm text-[15px] font-semibold px-7 py-3.5 rounded-full transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-brand-600" />
                <span>Ask for a demo on WhatsApp</span>
              </a>
            </div>

            <label className="flex items-start gap-2 max-w-lg text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" checked={specialist} onChange={(e) => pickSpecialist(e.target.checked)} className="mt-1" />
              <span><strong className="text-ink">I am a specialist and only want MeriDent Connect.</strong> You get the dentist network and are told when a dentist sends you a request. No clinic software.</span>
            </label>

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
                <form onSubmit={submitEmail} noValidate className="bg-white/90 border border-white rounded-2xl shadow-[0_20px_50px_-24px_rgba(17,24,39,.5)] p-5 space-y-3">
                  <div className="grid grid-cols-2 gap-1 rounded-lg bg-stone-100 p-1 text-sm font-bold">
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
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 disabled:opacity-60 text-white text-sm font-bold py-3 rounded-full"
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
            <a
              href="mailto:santhoshkumar@meridiandentalos.com"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand-700"
            >
              <PhoneCall className="w-4 h-4 text-brand-600" />
              <span>or email santhoshkumar@meridiandentalos.com</span>
            </a>
            <a
              href="tel:+918098318039"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand-700"
            >
              <PhoneCall className="w-4 h-4 text-brand-600" />
              <span>or Sivasabari: +91 80983 18039</span>
            </a>
          </div>

          {/* Product artwork */}
          <div className="relative pb-10">
            <Hero3D
              chart={
                <div className="bg-white/90 border border-white rounded-3xl shadow-[0_30px_70px_-30px_rgba(17,24,39,.55)] p-5 sm:p-6 pb-8">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="font-display font-bold text-ink">Odontogram</span>
                    <span className="text-xs text-slate-500">Upper arch, adult</span>
                  </div>
                  <ToothArch />
                  <ChartLegend />
                </div>
              }
              bill={<SampleBill />}
            />
            <p className="text-xs text-slate-500 mt-12 max-sm:mt-4">Illustration with sample data, not a real patient or clinic.</p>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section aria-label="Why clinics can trust MeriDent" className="bg-white/60 backdrop-blur border-b border-white/70">
        <ul className="max-w-6xl mx-auto px-5 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-slate-700">
          <li className="flex items-start gap-2.5"><GraduationCap className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" aria-hidden="true" /><span><strong className="text-ink">Built by dental students.</strong> Made by people who sit in the dental chair every day.</span></li>
          <li className="flex items-start gap-2.5"><Flag className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" aria-hidden="true" /><span><strong className="text-ink">Made in India, for India.</strong> GST invoices, UPI, WhatsApp and ₹ throughout.</span></li>
          <li className="flex items-start gap-2.5"><ShieldCheck className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" aria-hidden="true" /><span><strong className="text-ink">Registered Indian startup.</strong> StartupTN and MSME Udyam registered.</span></li>
          <li className="flex items-start gap-2.5"><Lock className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" aria-hidden="true" /><span><strong className="text-ink">Your clinic's data stays yours.</strong> Each clinic's records are kept separate.</span></li>
        </ul>
      </section>


      {/* FEATURES */}
      <section id="features" className="max-w-6xl mx-auto px-5 pt-24 pb-20 lg:pt-28">
        <div className="max-w-2xl mb-12">
          <h2 className="font-display font-bold text-3xl sm:text-[2.5rem] tracking-[-0.025em] leading-tight">What you can do today</h2>
          <p className="mt-3 text-base text-slate-600">Everything below is in the app now, grouped by where it happens in a clinic day.</p>
        </div>
        <div className="space-y-14">
          {FEATURE_GROUPS.map((group) => (
            <div key={group.heading}>
              <h3 className={`flex items-center gap-2.5 font-display font-bold text-xl mb-5 ${TONES[group.tone].head}`}>
                <span className={`w-2.5 h-2.5 rounded-full ${TONES[group.tone].dot}`} aria-hidden="true" />
                {group.heading}
              </h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {group.items.map(({ icon: Icon, title, text }) => (
                  <li key={title} className={`p-5 flex gap-4 rounded-2xl border shadow-[0_10px_30px_-20px_rgba(17,24,39,.4)] transition-transform hover:-translate-y-0.5 ${TONES[group.tone].card}`}>
                    <span className={`mt-0.5 shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${TONES[group.tone].chip}`}>
                      <Icon className="w-5 h-5" aria-hidden="true" />
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
      <section id="start" className="text-white bg-[radial-gradient(90%_60%_at_100%_0%,rgba(56,189,248,.35),transparent),radial-gradient(70%_60%_at_0%_100%,rgba(37,99,235,.4),transparent),linear-gradient(180deg,#1e3a8a,#0f1f4d)]">
        <div className="max-w-6xl mx-auto px-5 py-20 lg:py-24">
          <div className="max-w-2xl mb-10">
            <h2 className="font-display font-bold text-3xl sm:text-[2.5rem] tracking-[-0.025em] leading-tight">Getting started</h2>
            <p className="mt-3 text-base text-slate-300">Free during early access. No credit card needed.</p>
          </div>
          <ol className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6">
            {STEPS.map((step) => (
              <li key={step.n} className="rounded-2xl bg-white/10 border border-white/20 backdrop-blur p-5">
                <span className="inline-flex w-9 h-9 items-center justify-center rounded-full bg-white text-blue-800 font-display font-bold">{step.n}</span>
                <h3 className="mt-2 font-display font-bold text-lg">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* COMING NEXT */}
      <section className="max-w-6xl mx-auto px-5 py-16">
        <div className="rounded-3xl bg-white/70 backdrop-blur border border-white shadow-[0_20px_50px_-30px_rgba(17,24,39,.45)] p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-10">
          <div className="lg:w-1/3">
            <h2 className="font-display font-bold text-2xl tracking-tight">Coming next</h2>
            <p className="mt-1.5 text-sm text-slate-600">We are building these now. Tell us what your clinic needs most.</p>
          </div>
          <ul className="flex flex-wrap gap-2">
            {COMING_NEXT.map((item) => (
              <li key={item} className="bg-blue-50 border border-blue-200 text-blue-800 text-sm font-semibold px-3.5 py-1.5 rounded-full">
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
            <Lock className="w-5 h-5 mt-0.5 shrink-0 text-blue-700" aria-hidden="true" />
            <div>
              <h3 className="font-bold">Private workspace</h3>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">Each clinic's records are stored under its own sign-in and are not shared with other clinics. Only a verified email can open a workspace.</p>
            </div>
          </div>
          <div className="flex gap-3.5">
            <Cloud className="w-5 h-5 mt-0.5 shrink-0 text-blue-700" aria-hidden="true" />
            <div>
              <h3 className="font-bold">Cloud backup</h3>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">Your data is saved to the cloud and available on any device where you sign in.</p>
            </div>
          </div>
          <div className="flex gap-3.5">
            <ShieldCheck className="w-5 h-5 mt-0.5 shrink-0 text-blue-700" aria-hidden="true" />
            <div>
              <h3 className="font-bold">Your data, your control</h3>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">Patients can opt out of WhatsApp messages, and you can download a full copy of your clinic's records any time, or ask us to delete them.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-white/50 backdrop-blur border-y border-white/70">
        <div className="max-w-3xl mx-auto px-5 py-16 lg:py-20">
          <h2 className="font-display font-bold text-3xl sm:text-[2.5rem] tracking-[-0.025em] mb-8">Questions clinics ask</h2>
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
        <h2 className="font-display font-bold text-3xl tracking-[-0.025em]">Built by dental students</h2>
        <p className="mt-2 text-base text-slate-600 max-w-xl">We study dentistry and write the code ourselves, so the app is shaped around real clinic work.</p>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            { init: "SS", name: "Santhoshkumar S", role: "Founder & Managing Director", bio: "BDS student, Sri Ramakrishna Dental College & Hospital, Coimbatore. Full-stack developer and product lead." },
            { init: "SG", name: "Sivasabari G", role: "Co-Founder & CEO", bio: "BDS student, Dhanalakshmi Srinivasan Dental College & Hospital, Perambalur. Leads clinical workflow requirements and testing." }
          ].map((p) => (
            <div key={p.name} className="flex gap-4 rounded-2xl border border-white bg-white/80 shadow-[0_14px_36px_-24px_rgba(17,24,39,.5)] p-5">
              <div className="shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-white font-display font-bold flex items-center justify-center">{p.init}</div>
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
      <section className="text-white bg-[radial-gradient(80%_120%_at_100%_0%,rgba(56,189,248,.35),transparent),linear-gradient(135deg,#1e3a8a,#0f1f4d)]">
        <div className="max-w-4xl mx-auto px-5 py-14 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <h2 className="font-display font-bold text-3xl tracking-[-0.025em] leading-tight">Try MeriDent with your clinic</h2>
          <button
            type="button"
            onClick={onLoginClick}
            disabled={loginBusy || !firebaseConfigured}
            className="shrink-0 inline-flex items-center justify-center gap-2 bg-white hover:bg-blue-50 disabled:opacity-60 text-slate-900 text-[15px] font-semibold px-7 py-3.5 rounded-full shadow-lg transition-colors"
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
      <footer className="bg-white/70 backdrop-blur border-t border-white text-slate-500 py-10 px-5 text-center text-sm space-y-1.5">
        <p className="font-display font-bold text-ink text-base">MeriDent</p>
        <p>StartupTN ref: STN99974 | MSME Udyam: UDYAM-TN-04-0139569</p>
        <p className="pt-1"><a href="/login" className="underline hover:text-ink">Log in</a> <span aria-hidden="true">|</span> <a href="/free-early-access" className="underline hover:text-ink">Free early access</a> <span aria-hidden="true">|</span> <a href="/dental" className="underline hover:text-ink">For dental clinics</a> <span aria-hidden="true">|</span> <a href="/odontogram" className="underline hover:text-ink">Odontogram</a> <span aria-hidden="true">|</span> <a href="/dental-billing-gst" className="underline hover:text-ink">GST billing</a> <span aria-hidden="true">|</span> <a href="/whatsapp-reminders" className="underline hover:text-ink">WhatsApp reminders</a> <span aria-hidden="true">|</span> <a href="/online-booking" className="underline hover:text-ink">Online booking</a> <span aria-hidden="true">|</span> <a href="/treatment-plans" className="underline hover:text-ink">Treatment plans</a> <span aria-hidden="true">|</span> <a href="/?page=pricing" className="underline hover:text-ink">Pricing</a> <span aria-hidden="true">|</span> <a href="/?page=privacy" className="underline hover:text-ink">Privacy Policy</a> <span aria-hidden="true">|</span> <a href="/?page=terms" className="underline hover:text-ink">Terms of Use</a></p>
        <p className="text-slate-500 pt-2">© 2026 MeriDent. All rights reserved.</p>
      </footer>
    </div>
  );
}
