/* ==============================================================================
 * MERIDENT - PREMIUM BLUE LANDING PAGE
 * File: src/components/landingpage.jsx
 * Shown to visitors who are not signed in. Only describes what the app does today;
 * upcoming features are clearly marked as "coming next".
 * ============================================================================== */

import InstallApp from "./InstallApp.jsx";
import React, { useState } from "react";
import { isValidEmailAddress } from "../authErrors";
import { setSignInChoice, signInChoice } from "../connectOnly";
import { docSignInChoice, setDocSignInChoice } from "../docLogOnly";
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
  Check,
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
  Network,
  PlayCircle,
  Download,
  Mail,
  Camera
} from "lucide-react";

const WHATSAPP_NUMBER = "919043205927";
const KOVAI_ARTICLE = "https://thekovaiherald.co.in/%e0%ae%aa%e0%ae%95%e0%ae%b2%e0%af%8d-%e0%ae%a8%e0%af%87%e0%ae%b0%e0%ae%a4%e0%af%8d%e0%ae%a4%e0%ae%bf%e0%ae%b2%e0%af%8d-%e0%ae%aa%e0%ae%b2%e0%af%8d-%e0%ae%ae%e0%ae%b0%e0%af%81%e0%ae%a4%e0%af%8d/";
const VIDEO_LINK = "https://youtu.be/BVowp-T5nJQ";
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
      { icon: ScanSearch, title: "OPG & diagnosis studio", text: "Open a panoramic film (JPG, PNG or DICOM) at full size, zoom in, adjust brightness and contrast, and invert the negative. Calibrate against an object of known length to measure in millimetres." },
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
      { icon: IndianRupee, title: "Expenses & profit", text: "Record rent, salaries, lab fees and materials. See money received, money spent and the month's profit side by side, and download the expenses as a spreadsheet." }
    ]
  },
  {
    heading: "Beyond your clinic",
    tone: "sky",
    items: [
      { icon: MessagesSquare, title: "MeriDent Connect", text: "A professional network for dentists verified by our team. Discuss cases, ask peers, mark the best answer, save posts, follow colleagues, add events to your calendar, and send a consult request to a nearby specialist. Patient names are never shared." },
      { icon: ClipboardList, title: "MeriDent DocLog", text: "For doctors who visit other clinics as a consultant. Log each visit, the treatment, the next visit and the payment, and see which clinic still owes you money. It is private to you and replaces the paper diary." },
      { icon: Bell, title: "WhatsApp reminders & recall", text: "See who to remind for tomorrow, who owes a balance, and who is due for a 6-month check-up. One tap opens WhatsApp with the message ready. Patients can opt out." },
      { icon: WifiOff, title: "Works with weak internet", text: "Keep working when the connection drops. Your changes save on the device and sync to the cloud when you are back online." },
      { icon: ScanSearch, title: "X-rays from your RVG sensor or scanner", text: "On a computer with Chrome or Edge, pick the folder your RVG software saves to, tick the newest pictures and add them to the patient in one go. DICOM (.dcm) files from digital sensors and panoramic units open too, and are converted to normal pictures in your browser. Each keeps the date it was saved. If a DICOM file is compressed, export it as JPEG or PNG from your imaging software." },
      { icon: Camera, title: "Take pictures with a USB or intraoral camera", text: "Use a USB camera, an intraoral camera that appears as a webcam, or your phone or tablet camera, and the photo goes straight into the patient's record. Nothing is recorded until you press Take picture." },
      { icon: Bell, title: "A patient page they can install", text: "Send a private link with the patient's visits, balance and advice. On a phone they can install it like an app, with no sign-in needed." },
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
  "Automatic WhatsApp sending"
];

const PLANS = [
  { name: "Free trial", price: "₹0", unit: "", sub: "for 30 days", points: ["Every feature included", "No card needed", "Export your data any time"] },
  { name: "Standard", price: "₹499", unit: "/month", sub: "or ₹4,999 per year", hot: true, points: ["Patients, charting, appointments", "Billing and invoices", "Backups, import and export"] },
  { name: "Pro", price: "₹999", unit: "/month", sub: "everything in Standard, plus", points: ["WhatsApp sending", "Multiple branches", "AI features"] },
];

const QUALITY = [
  { n: "1,500+", label: "automated tests", note: "run before every update goes live" },
  { n: "9 crore+", label: "random stress checks", note: "bad input, odd dates, wrong totals, with 0 failures across all recent runs" },
  { n: "Every change", label: "data-access rules tested", note: "the rules that keep each clinic's records private are tested automatically whenever they change" },
  { n: "3 ways", label: "Ways we test", note: "normal order, shuffled order, and random data" },
];

const SECURITY_CHECKS = [
  "Each clinic's records are kept apart, and the access rules are tested automatically on every change.",
  "Roles are enforced on our servers, not only on screen. A receptionist, dentist or manager can open only what their role allows.",
  "A wrong invoice is voided, not erased. It stays on record with the reason, and only the owner or a manager can void it.",
  "Only verified email accounts can sign in, and a sign-in on an unofficial web address is closed straight away.",
  "Shared plan and portal links stop working on their expiry date, checked on our servers.",
  "Our code is scanned for security problems automatically on every change.",
  "No known security problems in the software libraries the live app uses, checked before every update.",
  "Browser protections are switched on: a content security policy, no framing of the app, and secure connections only.",
  "Uploaded files stay private to the clinic and are limited to pictures and PDFs under 10 MB.",
  "Passwords, keys and signing files are kept out of the code, and an automatic test fails if one slips in.",
  "An activity log records who did what, and only the owner and managers can read it.",
  "Our own security reviews in November 2026. The most serious problems found were fixed and tested.",
];

const FAQS = [
  {
    q: "Can I take my data out if I leave?",
    a: "Yes. Your patient records, bills and files are yours. You can export them from the app at any time, and the encrypted backup is yours to keep. We will not hold your records back.",
  },
  {
    q: "Will the price go up after my team is trained?",
    a: "Clinics that join during early access keep their plan price for 12 months. After that, any change comes with at least 30 days' written notice, so you can decide before it applies.",
  },
  {
    q: "MeriDent is new. What if it shuts down?",
    a: "It is new, and we say so. It is built by two working dental students, and your data stays exportable. If we ever had to stop, you would get at least 90 days' notice and a full export of your records.",
  },
  {
    q: "What if something goes wrong during clinic hours?",
    a: "Message the founders directly on WhatsApp. During the trial run you reach the people who build it, not a ticket queue. Backups run automatically, and each clinic's data is kept separate from every other clinic's.",
  },
  {
    q: "Is MeriDent free?",
    a: "Yes, it is free during our trial run, with no credit card. The planned prices are in the Pricing section. Nobody is charged yet, we will tell you well before that changes, and the first 10 clinics get 3 months free in return for feedback."
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
    a: "Yes. MeriDent runs in your phone or laptop browser, so there is nothing you have to install. To keep it on your home screen, use your browser's \"Add to Home screen\" or \"Install app\" option. Android users can also download the app file from this page. It is not on the Play Store yet, so Android will ask you to allow the install. There is no iPhone app yet; on an iPhone, use Share, then Add to Home Screen."
  },
  {
    q: "Does MeriDent handle insurance claims?",
    a: "No. MeriDent is built for what patients pay the clinic: GST invoices, part payments, dues and UPI collection. It does not manage insurance or TPA claims."
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

/* Floating cards around the hero screen, the marquee strip, and small layout pieces. */
const FLOATS = [
  ["Restore point saved today", "left-0 top-[10%]", "0s"],
  ["Prescription sent on WhatsApp", "left-[2%] top-[42%]", "0.6s"],
  ["Referral letter ready", "left-0 top-[74%]", "1.2s"],
  ["Treatment plan shared", "right-0 top-[20%]", "0.3s"],
  ["Bill ready with GST and UPI QR", "right-[2%] top-[58%]", "0.9s"]
];

const MARQUEE = [
  "Odontogram", "Treatment plans", "GST bills", "UPI QR", "Prescriptions", "WhatsApp reminders", "Lab orders", "Online booking",
  "Stock alerts", "Staff roster", "Many branches", "Backups", "Referral letters", "Reports"
];

function ChartReel() {
  return (
    <div className="relative overflow-hidden">
      <img src="/landing/chart-0.jpg" alt="MeriDent tooth chart: pick a finding, then slide across the teeth to mark them" width="980" height="625" loading="lazy" className="block w-full h-auto" />
      {[1, 2, 3, 4].map((i) => (
        <img key={i} src={`/landing/chart-${i}.jpg`} alt="" aria-hidden="true" loading="lazy" className={`lp-layer lp-l${i}`} />
      ))}
    </div>
  );
}

function TourRow({ title, text, linkHref, linkText, children, first }) {
  return (
    <div className={`flex flex-col lg:flex-row gap-8 lg:gap-12 py-10 lg:py-14 ${first ? "" : "border-t border-slate-200"}`}>
      <div className="lp-reveal lg:flex-1 min-w-0 flex flex-col justify-between gap-8">
        <h3 className="font-display font-bold text-3xl sm:text-4xl tracking-[-0.03em] leading-[1.08] text-ink max-w-sm">{title}</h3>
        <div>
          <p className="text-slate-600 max-w-sm mb-4">{text}</p>
          <a href={linkHref} className="text-sm font-semibold text-ink hover:opacity-80" {...(linkHref.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{linkText} &rarr;</a>
        </div>
      </div>
      <div className="lp-reveal lg:flex-[1.15] min-w-0 rounded-[22px] bg-slate-100 p-5 sm:p-8 flex items-center">
        <div className="lp-lift w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_40px_-24px_rgba(15,23,42,.35)]">{children}</div>
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
  toLogin,
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
  const [docOnly, setDocOnly] = useState(() => docSignInChoice() === true);
  const pickSpecialist = (on) => { setSpecialist(on); setSignInChoice(on); if (on) { setDocOnly(false); setDocSignInChoice(false); } };
  const pickDocOnly = (on) => { setDocOnly(on); setDocSignInChoice(on); if (on) { setSpecialist(false); setSignInChoice(false); } };

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
    <div className="min-h-screen bg-white text-ink font-sans antialiased">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 border-b border-white/70 shadow-[0_8px_30px_-18px_rgba(17,24,39,.45)]">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2.5">
            <img
              src="/logo-small.png"
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
            <a href="#pricing" className="hover:text-brand-600">Pricing</a>
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
      <section id="top" className="relative overflow-hidden bg-gradient-to-b from-white to-blue-50 border-b border-slate-200">
        <div className="relative max-w-6xl mx-auto px-5 pt-14 sm:pt-20 text-center">
          <p className="lp-rise inline-flex items-center gap-2 text-sm font-semibold text-blue-800 bg-white border border-blue-200 shadow-sm px-3.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" aria-hidden="true" />
            Built by dental students in India
          </p>
          <h1 className="lp-rise mx-auto mt-6 max-w-4xl font-display font-extrabold text-[2.5rem] sm:text-6xl lg:text-7xl leading-[1.03] tracking-[-0.04em] text-ink" style={{ animationDelay: "0.05s", textWrap: "balance" }}>
            Less paperwork. More dentistry.
          </h1>
          <p className="lp-rise mx-auto mt-6 max-w-xl text-base sm:text-lg text-slate-600 leading-[1.7]" style={{ animationDelay: "0.25s" }}>
            Chart the tooth, bill the visit, and keep every record safe. Free during early access.
          </p>
          <div className="lp-rise mt-8 flex flex-col sm:flex-row gap-3 justify-center" style={{ animationDelay: "0.45s" }}>
            <button
              type="button"
              onClick={onLoginClick}
              disabled={loginBusy || !firebaseConfigured}
              className="lp-ring inline-flex items-center justify-center gap-2 bg-ink hover:bg-slate-800 disabled:opacity-60 text-white text-[15px] font-semibold px-7 py-3.5 rounded-xl transition-colors"
            >
              <span>{signInLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href={DEMO_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-ink border border-slate-300 text-[15px] font-semibold px-7 py-3.5 rounded-xl transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-ink" />
              <span>Ask for a demo on WhatsApp</span>
            </a>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
            <a href={VIDEO_LINK} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-brand-700 hover:text-brand-900 text-[15px] font-semibold">
              <PlayCircle className="w-5 h-5" aria-hidden="true" />
              <span>Watch quick demo</span>
            </a>
            <a href="#app" className="inline-flex items-center gap-2 text-brand-700 hover:text-brand-900 text-[15px] font-semibold">
              <Download className="w-5 h-5" aria-hidden="true" />
              <span>Get the app</span>
            </a>
          </div>

          <div className="mx-auto mt-8 max-w-lg text-left space-y-5">
            <label className="flex items-start gap-2 max-w-lg text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" checked={specialist} onChange={(e) => pickSpecialist(e.target.checked)} className="mt-1" />
              <span><strong className="text-ink">I am a specialist and only want MeriDent Connect.</strong> You get the dentist network and are told when a dentist sends you a request. No clinic software.</span>
            </label>

            <label className="flex items-start gap-2 max-w-lg text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" checked={docOnly} onChange={(e) => pickDocOnly(e.target.checked)} className="mt-1" />
              <span><strong className="text-ink">I visit clinics as a consultant and only want MeriDent DocLog.</strong> A private log of your visits, treatments and payments. No clinic software.</span>
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
                  onClick={toLogin ? toLogin : () => setEmailOpen(true)}
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
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand-700"
            >
              <PhoneCall className="w-4 h-4 text-brand-600" />
              <span>Questions? Message +91 90432 05927</span>
            </a>
            <a
              href="mailto:meridentapp@gmail.com"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand-700"
            >
              <Mail className="w-4 h-4 text-brand-600" />
              <span>or email meridentapp@gmail.com</span>
            </a>
            <a
              href="https://wa.me/918098318039"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand-700"
            >
              <PhoneCall className="w-4 h-4 text-brand-600" />
              <span>or message Sivasabari: +91 80983 18039</span>
            </a>
          </div>

          {/* Product screen with floating cards */}
          <div className="relative mx-auto mt-14 max-w-[980px] md:h-[430px]">
            <svg aria-hidden="true" viewBox="0 0 980 430" className="absolute inset-0 hidden md:block w-full h-full"><ellipse cx="490" cy="470" rx="470" ry="330" fill="none" stroke="#cbd5e1" strokeWidth="1.2" /><ellipse cx="490" cy="470" rx="350" ry="240" fill="none" stroke="#cbd5e1" strokeWidth="1.2" /></svg>
            <a href="#demo" aria-label="Watch the one-minute demo" className="relative md:absolute md:left-1/2 md:top-0 md:-translate-x-1/2 block w-full md:w-[600px] overflow-hidden rounded-t-2xl border border-slate-300 bg-white shadow-[0_40px_90px_-40px_rgba(15,23,42,.5)]">
              <div className="flex gap-1.5 px-3.5 py-2.5 bg-slate-50 border-b border-slate-200" aria-hidden="true"><i className="w-2.5 h-2.5 rounded-full bg-slate-300" /><i className="w-2.5 h-2.5 rounded-full bg-slate-300" /><i className="w-2.5 h-2.5 rounded-full bg-slate-300" /></div>
              <div className="relative">
                <img src="/demo/merident-demo-poster.jpg" alt="MeriDent demo: a patient chart on screen" width="1280" height="720" className="block w-full h-auto" />
                <span className="absolute inset-0 flex items-center justify-center"><span className="flex items-center justify-center w-16 h-16 rounded-full bg-ink/85 text-white"><PlayCircle className="w-8 h-8" aria-hidden="true" /></span></span>
              </div>
            </a>
            {FLOATS.map(([text, pos, delay]) => (
              <div key={text} className={`hidden md:block absolute z-[2] ${pos}`}>
                <div className="lp-bob rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm whitespace-nowrap shadow-[0_18px_40px_-20px_rgba(15,23,42,.4)]" style={{ animationDelay: delay }}>{text}</div>
              </div>
            ))}
          </div>
          <p className="pb-6 pt-3 text-xs text-slate-500">Recorded with sample data, not a real patient or clinic.</p>
        </div>
      </section>

      {/* MARQUEE + APP SHOWCASE */}
      <section aria-label="What MeriDent covers" className="overflow-hidden border-b border-slate-200 bg-white py-7">
        <div className="lp-marquee">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0" aria-hidden={copy === 1 ? "true" : undefined}>
              {MARQUEE.map((m) => <span key={m} className="mx-2 whitespace-nowrap rounded-full border border-slate-200 bg-white px-[18px] py-2 text-[15px] text-slate-700">{m}</span>)}
            </div>
          ))}
        </div>
      </section>

      <section aria-label="The MeriDent app" className="bg-ink px-5 pt-20 pb-24 text-center">
        <h2 className="lp-reveal mx-auto max-w-3xl font-display font-bold text-3xl sm:text-5xl tracking-[-0.03em] leading-[1.06] text-white" style={{ textWrap: "balance" }}>See your whole clinic on one screen.</h2>
        <p className="lp-reveal mx-auto mt-4 max-w-lg text-slate-300">Patients, diary, billing and stock sit in one menu. It runs in the browser on your phone or laptop.</p>
        <div className="lp-tilt mx-auto mt-11 max-w-[1000px] overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-[0_60px_110px_-50px_rgba(0,0,0,.7)]">
          <div className="flex gap-1.5 px-3.5 py-2.5 bg-slate-50 border-b border-slate-200" aria-hidden="true"><i className="w-2.5 h-2.5 rounded-full bg-slate-300" /><i className="w-2.5 h-2.5 rounded-full bg-slate-300" /><i className="w-2.5 h-2.5 rounded-full bg-slate-300" /></div>
          <img src="/landing/app.jpg" alt="MeriDent patient records screen" width="1280" height="440" loading="lazy" className="block w-full h-auto" />
        </div>
      </section>

      {/* TRUST STRIP */}
      <section aria-label="Why clinics can trust MeriDent" className="bg-white/90 border-b border-white/70">
        <ul className="max-w-6xl mx-auto px-5 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-slate-700">
          <li className="flex items-start gap-2.5"><GraduationCap className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" aria-hidden="true" /><span><strong className="text-ink">Built by dental students.</strong> Made by people who sit in the dental chair every day.</span></li>
          <li className="flex items-start gap-2.5"><Flag className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" aria-hidden="true" /><span><strong className="text-ink">Made in India, for India.</strong> GST invoices, UPI, WhatsApp and ₹ throughout.</span></li>
          <li className="flex items-start gap-2.5"><ShieldCheck className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" aria-hidden="true" /><span><strong className="text-ink">Registered in India.</strong> On the StartupTN portal and registered with MSME Udyam.</span></li>
          <li className="flex items-start gap-2.5"><Lock className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" aria-hidden="true" /><span><strong className="text-ink">Your clinic's data stays yours.</strong> Each clinic's records are kept separate.</span></li>
        </ul>
      </section>


      {/* TOUR: three product rows */}
      <section id="tour" className="max-w-6xl mx-auto px-5 pt-16 pb-6">
        <TourRow
          first
          title="Chart a whole arch in one slide."
          text="Pick a finding, then drag across the teeth. Adult and primary teeth, FDI numbering, every tooth marked."
          linkHref={DEMO_LINK}
          linkText="Ask for a demo"
        >
          <ChartReel />
        </TourRow>
        <TourRow
          title="A whole prescription in one tap."
          text="Saved sets such as After extraction add every medicine at once. Print it, or send it to the patient on WhatsApp."
          linkHref="#features"
          linkText="See all features"
        >
          <img src="/landing/prescription.jpg" alt="MeriDent prescription sets and WhatsApp dispatch" width="1160" height="276" loading="lazy" className="block w-full h-auto" />
        </TourRow>
        <TourRow
          title="Price the plan tooth by tooth. Share it."
          text="Build a treatment plan and estimate, then share it with the patient. Therapeutic items are marked GST exempt."
          linkHref="#features"
          linkText="See all features"
        >
          <img src="/landing/plan.jpg" alt="MeriDent treatment plan with a price for each treatment" width="1160" height="278" loading="lazy" className="block w-full h-auto" />
        </TourRow>
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

      {/* RECORDS SAFETY */}
      <section id="safety" className="max-w-6xl mx-auto px-5 pt-4 pb-20">
        <div className="flex flex-col lg:flex-row overflow-hidden rounded-3xl bg-slate-100">
          <div className="lg:flex-1 bg-ink text-white p-8 sm:p-11 flex flex-col justify-center">
            <p className="text-sm text-slate-300">Records safety</p>
            <h2 className="mt-3 font-display font-bold text-3xl sm:text-4xl tracking-[-0.03em] leading-[1.1]">A daily encrypted backup, kept for 90 days.</h2>
            <p className="mt-4 max-w-sm text-slate-300">Your clinic's data is copied every day. You can see the latest restore point on your Practice Profile page.</p>
            <a href="/records-safety" className="mt-6 inline-block self-start border-b border-white/60 text-sm font-semibold">How the check works &rarr;</a>
          </div>
          <div className="lg:flex-1 p-6 sm:p-9 flex flex-col justify-center gap-3.5">
            {[["Cloud restore point", "Saved today"], ["Backup on this device", "Download from Practice Profile"], ["Copy matches records", "Checked against your live data"]].map(([t, d], i) => (
              <div key={t} className={`lp-reveal rounded-2xl border border-slate-200 bg-white px-5 py-4 flex gap-3 shadow-[0_18px_40px_-24px_rgba(15,23,42,.35)] ${i === 1 ? "lg:ml-7" : ""}`}>
                <Check className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" aria-hidden="true" />
                <div><p className="font-semibold text-ink">{t}</p><p className="text-sm text-slate-500">{d}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MADE FOR INDIAN CLINICS */}
      <section aria-label="Made for Indian clinics" className="bg-slate-100 px-5 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center">
            <h2 className="lp-reveal mx-auto max-w-2xl font-display font-bold text-3xl sm:text-4xl tracking-[-0.03em] leading-[1.08]" style={{ textWrap: "balance" }}>Made for how Indian clinics work.</h2>
            <p className="mx-auto mt-3.5 max-w-lg text-slate-600">Bills, letters and reminders that match daily practice.</p>
          </div>
          <div className="lp-reveal mt-12 flex flex-col md:flex-row overflow-hidden rounded-[20px] bg-white">
            <div className="md:flex-1 min-w-0 bg-sky-100 p-7 flex items-center"><div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_40px_-24px_rgba(15,23,42,.35)]"><img src="/landing/letter.jpg" alt="MeriDent referral letter form" width="600" height="240" loading="lazy" className="block w-full h-auto" /></div></div>
            <div className="md:flex-1 min-w-0 p-8 flex flex-col justify-between gap-8"><h3 className="font-display font-bold text-3xl tracking-[-0.03em] leading-[1.1]">Referral letters, ready to print.</h3><p className="text-slate-600">Referral and treatment summary letters are filled in from the record, so nothing is retyped.</p></div>
          </div>
          <div className="lp-reveal mt-5 flex flex-col md:flex-row overflow-hidden rounded-[20px] bg-white">
            <div className="md:flex-1 min-w-0 p-8 flex flex-col justify-between gap-8"><h3 className="font-display font-bold text-3xl tracking-[-0.03em] leading-[1.1]">Bill the treatment. Sell stock on the same bill.</h3><p className="text-slate-600">Add treatments and stock items to one invoice, take an advance, set a due date, and print it with a UPI QR.</p></div>
            <div className="md:flex-1 min-w-0 bg-blue-100 p-7 flex justify-center"><div className="w-full max-w-[340px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_40px_-24px_rgba(15,23,42,.35)]"><img src="/landing/bill.jpg" alt="MeriDent invoice form with treatments and stock" width="480" height="656" loading="lazy" className="block w-full h-auto" /></div></div>
          </div>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              ["GST and UPI on every bill", "Therapeutic dental care is shown as GST exempt. Cosmetic work is charged 18% GST, split into CGST and SGST. Bills carry a UPI QR."],
              ["WhatsApp, one tap", "See who to remind, who owes a balance and who is due for a check-up. One tap opens WhatsApp with the message ready. It does not send by itself yet."],
              ["Your clinic's data stays yours", "Each clinic's records are kept in its own workspace. You can export or delete them any time by asking us."],
              ["Built by dental students, registered in India", "Made by people who sit in the dental chair every day. On the StartupTN portal and registered with MSME Udyam."]
            ].map(([t, b]) => (
              <div key={t} className="lp-reveal lp-lift rounded-[20px] bg-white p-7"><h3 className="font-display font-bold text-2xl tracking-[-0.02em]">{t}</h3><p className="mt-2.5 text-slate-600">{b}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* DEMO VIDEO */}
      <section id="demo" className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-5">
          <h2 className="font-display font-extrabold text-3xl text-ink">See it in about a minute</h2>
          <p className="mt-2 text-slate-600">A quick tour: marking teeth on the chart, prescriptions, treatment plans, letters, billing with stock, and your data backup.</p>
          <video
            className="mt-6 w-full rounded-2xl border border-slate-200 bg-slate-900"
            controls
            playsInline
            preload="none"
            poster="/demo/merident-demo-poster.jpg"
            data-testid="demo-video"
          >
            <source src="/demo/merident-demo-en.mp4" type="video/mp4" />
          </video>
          <p className="mt-3 text-sm text-slate-500">
            Recorded on a test copy with a made-up clinic and patient.{" "}
            <a href="/demo/merident-demo-ta.mp4" className="font-semibold text-brand-700 underline underline-offset-4" target="_blank" rel="noopener noreferrer">Watch with Tamil captions</a>
          </p>
        </div>
      </section>

      {/* GETTING STARTED */}
      <section id="start" className="text-white bg-ink">
        <div className="max-w-6xl mx-auto px-5 py-20 lg:py-24">
          <div className="max-w-2xl mb-10">
            <h2 className="font-display font-bold text-3xl sm:text-[2.5rem] tracking-[-0.025em] leading-tight">Getting started</h2>
            <p className="mt-3 text-base text-slate-300">Free during early access. No credit card needed.</p>
          </div>
          <ol className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6">
            {STEPS.map((step) => (
              <li key={step.n} className="rounded-2xl bg-white/10 border border-white/20 p-5">
                <span className="inline-flex w-9 h-9 items-center justify-center rounded-full bg-white text-blue-800 font-display font-bold">{step.n}</span>
                <h3 className="mt-2 font-display font-bold text-lg">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="bg-white">
        <div className="max-w-6xl mx-auto px-5 py-20 lg:py-24">
          <div className="max-w-2xl mb-8">
            <h2 className="font-display font-bold text-3xl sm:text-[2.5rem] tracking-[-0.025em] leading-tight text-ink">Pricing</h2>
            <p className="mt-3 text-base text-slate-600">Per clinic, not per user. No setup fee.</p>
          </div>
          <div role="note" className="mb-8 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <strong>We are in our trial run.</strong> These are our planned prices, and nobody is being charged yet. Everything is free for now. The first 10 clinics get 3 months free in return for feedback, then keep a locked-in early price.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PLANS.map((plan) => (
              <div key={plan.name} className={`lp-reveal lp-lift rounded-2xl border-2 p-6 ${plan.hot ? "border-ink bg-ink text-white" : "border-slate-200 bg-white"}`}>
                <h3 className={`font-display font-bold text-lg ${plan.hot ? "text-slate-300" : "text-brand-600"}`}>{plan.name}</h3>
                <p className={`mt-3 font-display font-extrabold text-4xl ${plan.hot ? "text-white" : "text-ink"}`}>{plan.price}<span className={`text-base font-semibold ${plan.hot ? "text-slate-400" : "text-slate-500"}`}>{plan.unit}</span></p>
                <p className={`mt-1 text-sm min-h-[1.25rem] ${plan.hot ? "text-slate-400" : "text-slate-500"}`}>{plan.sub}</p>
                <ul className={`mt-5 space-y-2.5 text-[15px] ${plan.hot ? "text-slate-200" : "text-slate-700"}`}>
                  {plan.points.map((pt) => <li key={pt} className="flex items-start gap-2"><Check className={`w-4 h-4 shrink-0 mt-1 ${plan.hot ? "text-teal-300" : "text-emerald-600"}`} aria-hidden="true" /><span>{pt}</span></li>)}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-slate-500">You can download all your data at any time, on every plan. Prices may change before we start charging, and we will tell you first.</p>
        </div>
      </section>

      {/* COMING NEXT */}
      <section className="max-w-6xl mx-auto px-5 py-16">
        <div className="rounded-3xl bg-white/90 border border-white shadow-[0_20px_50px_-30px_rgba(17,24,39,.45)] p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-10">
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

      {/* QUALITY CHECKS */}
      <section id="quality" aria-label="How we test MeriDent" className="max-w-6xl mx-auto px-5 pb-16">
        <div className="rounded-3xl bg-white/90 border border-white shadow-[0_20px_50px_-30px_rgba(17,24,39,.45)] p-6 sm:p-8">
          <h2 className="font-display font-bold text-2xl tracking-tight">We test it hard, so your clinic does not have to</h2>
          <p className="mt-1.5 text-sm text-slate-600 max-w-2xl">Billing, stock, dues and reminders are checked automatically every time we change the app.</p>
          <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {QUALITY.map((q) => (
              <div key={q.label} className="rounded-2xl bg-blue-50/70 border border-blue-100 p-4">
                <dt className="text-sm font-semibold text-blue-900">{q.label}</dt>
                <dd className="mt-1"><span className="font-display font-bold text-3xl text-brand-600">{q.n}</span><span className="block mt-1 text-xs text-slate-600">{q.note}</span></dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-display font-bold text-lg tracking-tight">Security checks, last run 24 November 2026</h3>
            <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-sm text-slate-700">
              {SECURITY_CHECKS.map((t) => (
                <li key={t} className="flex gap-2.5"><Check className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" aria-hidden="true" /><span>{t}</span></li>
              ))}
            </ul>
          </div>
          <p className="mt-5 text-xs text-slate-500">These are our own checks, not an outside audit. The random stress checks cover the calculation logic (billing, stock, dues, reminders), not every screen. Tests lower the chance of mistakes but cannot promise there are none, so please report any problem you find from Settings.</p>
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
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">Your data is saved to the cloud and available on any device where you sign in. A restore point is saved daily, and your Practice Profile page shows the proof. <a href="/records-safety" className="underline font-semibold text-blue-800">See how we keep records safe</a></p>
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

      <InstallApp />

      {/* FAQ */}
      <section id="faq" className="bg-white/80 border-y border-white/70">
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

      {/* IN THE NEWS */}
      <section id="press" aria-label="MeriDent in the news" className="max-w-4xl mx-auto px-5 pt-4 pb-4 lg:pb-8">
        <h2 className="font-display font-bold text-3xl tracking-[-0.025em]">In the news</h2>
        <p className="mt-2 text-base text-slate-600 max-w-xl">MeriDent was featured in The Kovai Herald, a Coimbatore weekly, on 25 October 2026.</p>
        <figure className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
          <a href="/press/kovai-herald-2026-10-25.jpg" target="_blank" rel="noopener noreferrer" className="md:col-span-3 block overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm hover:opacity-95" aria-label="Open the full Kovai Herald page">
            <img src="/press/kovai-herald-2026-10-25.jpg" alt="The Kovai Herald, 25 October 2026: a Tamil news story about two dental students from Tamil Nadu who built MeriDent, with photos of both founders and a screenshot of the patient records screen" width="1303" height="1600" loading="lazy" className="block w-full h-auto" />
          </a>
          <figcaption className="md:col-span-2 rounded-[22px] border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-semibold text-ink">The Kovai Herald, 25 October 2026</p>
            <p className="mt-3 text-slate-700 leading-relaxed">&ldquo;Dental college by day, coding by night.&rdquo; The story, written in Tamil, tells how two second-year dental students from Tamil Nadu built MeriDent for dental clinics.</p>
            <a href={KOVAI_ARTICLE} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm font-semibold text-ink hover:opacity-80">Read it on The Kovai Herald website &rarr;</a>
            <a href="/press/kovai-herald-2026-10-25.jpg" target="_blank" rel="noopener noreferrer" className="mt-2 block text-sm font-semibold text-slate-600 hover:opacity-80">See the printed page in full size</a>
          </figcaption>
        </figure>
      </section>

      {/* FOUNDERS */}
      <section id="founders" className="max-w-4xl mx-auto px-5 py-16 lg:py-20">
        <h2 className="font-display font-bold text-3xl tracking-[-0.025em]">Built by dental students</h2>
        <p className="mt-2 text-base text-slate-600 max-w-xl">We study dentistry and write the code ourselves, so the app is shaped around real clinic work.</p>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            { init: "SK", name: "Santhoshkumar S", role: "Founder", college: "Sri Ramakrishna Dental College & Hospital, Coimbatore", bio: "BDS student. Software lead: builds and ships MeriDent's software.", wa: "919043205927" },
            { init: "SG", name: "Sivasabari G", role: "Co-Founder", college: "Dhanalakshmi Srinivasan Dental College & Hospital, Perambalur", bio: "BDS student. Leads clinical workflow requirements and testing.", wa: "918098318039" }
          ].map((p) => (
            <div key={p.name} className="lp-reveal lp-lift flex flex-col rounded-[22px] border border-slate-200 bg-slate-50 p-6">
              <div className="flex items-center gap-4">
                <div className="shrink-0 w-16 h-16 rounded-full bg-ink text-white font-display font-extrabold text-2xl flex items-center justify-center">{p.init}</div>
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-2xl leading-tight tracking-[-0.02em]">{p.name}</h3>
                  <p className="text-sm font-semibold text-ink">{p.role}</p>
                  <p className="text-sm text-slate-500">{p.college}</p>
                </div>
              </div>
              <p className="mt-4 text-slate-600 leading-relaxed">{p.bio}</p>
              <a href={`https://wa.me/${p.wa}`} target="_blank" rel="noopener noreferrer" className="mt-4 text-sm font-semibold text-ink hover:opacity-80">Message on WhatsApp &rarr;</a>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="text-white bg-ink">
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
        aria-label="Book a free demo on WhatsApp"
        data-testid="floating-whatsapp"
        style={{ bottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))", right: "max(1.25rem, env(safe-area-inset-right, 0px))" }}
        className="group fixed z-50 flex items-center gap-3 rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
      >
        <span className="hidden sm:block rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink shadow-lg ring-1 ring-slate-200 transition group-hover:-translate-x-0.5">
          Book a free demo
        </span>
        <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/30 transition-colors group-hover:bg-emerald-600">
          <span aria-hidden="true" className="absolute inset-0 rounded-full bg-emerald-400/50 motion-safe:animate-ping [animation-duration:2.8s]" />
          <svg className="relative h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9z" /><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" /></svg>
        </span>
      </a>

      {/* FOOTER */}
      <footer className="bg-white/90 border-t border-white text-slate-500 py-10 px-5 text-center text-sm space-y-1.5">
        <p className="font-display font-bold text-ink text-base">MeriDent</p>
        <p>StartupTN ref: STN99974 | MSME Udyam: UDYAM-TN-04-0139569</p>
        <p>Applicant, National Startup Awards 6.0 (Student Innovator category). Result awaited.</p>
        <p className="pt-1"><a href="/login" className="underline hover:text-ink">Log in</a> <span aria-hidden="true">|</span> <a href="/free-early-access" className="underline hover:text-ink">Free early access</a> <span aria-hidden="true">|</span> <a href="/dental" className="underline hover:text-ink">For dental clinics</a> <span aria-hidden="true">|</span> <a href="/odontogram" className="underline hover:text-ink">Odontogram</a> <span aria-hidden="true">|</span> <a href="/dental-billing-gst" className="underline hover:text-ink">GST billing</a> <span aria-hidden="true">|</span> <a href="/whatsapp-reminders" className="underline hover:text-ink">WhatsApp reminders</a> <span aria-hidden="true">|</span> <a href="/online-booking" className="underline hover:text-ink">Online booking</a> <span aria-hidden="true">|</span> <a href="/treatment-plans" className="underline hover:text-ink">Treatment plans</a> <span aria-hidden="true">|</span> <a href="/help" className="underline hover:text-ink">Clinic guide</a> <span aria-hidden="true">|</span> <a href="/?page=pricing" className="underline hover:text-ink">Pricing</a> <span aria-hidden="true">|</span> <a href="/?page=privacy" className="underline hover:text-ink">Privacy Policy</a> <span aria-hidden="true">|</span> <a href="/?page=terms" className="underline hover:text-ink">Terms of Use</a></p>
        <p className="text-slate-500 pt-2">© 2026 MeriDent. All rights reserved.</p>
      </footer>
    </div>
  );
}
