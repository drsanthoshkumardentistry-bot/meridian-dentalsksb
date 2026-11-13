/* Separate Log In page, served at /login. Same sign-in as the landing page (Google, or email and password),
 * on its own address so people and search engines can reach it directly. */
import React, { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, Eye, EyeOff, IndianRupee, ScanSearch } from "lucide-react";
import { isValidEmailAddress } from "../authErrors";
import { setSignInChoice, signInChoice } from "../connectOnly";

export const LOGIN_PATH = "/login";
export const isLoginPath = (pathname = "") => pathname.replace(/\/+$/, "") === LOGIN_PATH;

const POINTS = [
  { icon: ScanSearch, text: "Chart the tooth on a 32-tooth odontogram" },
  { icon: IndianRupee, text: "GST invoices with a UPI QR" },
  { icon: CalendarDays, text: "Appointments, reminders and online booking" }
];

export default function LoginPage({
  onLoginClick,
  onEmailSignIn,
  onEmailSignUp,
  onResetPassword,
  loginBusy = false,
  authError = "",
  authNotice = "",
  firebaseConfigured = true
}) {
  const [mode, setMode] = useState("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");
  const [specialist, setSpecialist] = useState(() => signInChoice() === true);
  const pickSpecialist = (on) => { setSpecialist(on); setSignInChoice(on); };

  useEffect(() => {
    const before = document.title;
    document.title = "Log in | MeriDent dental practice management";
    let meta = document.querySelector('meta[name="description"]');
    const beforeDesc = meta ? meta.getAttribute("content") : null;
    if (meta) meta.setAttribute("content", "Log in to MeriDent, the dental practice manager for Indian clinics. Sign in with Google or your email to open your clinic workspace.");
    return () => {
      document.title = before;
      if (meta && beforeDesc !== null) meta.setAttribute("content", beforeDesc);
    };
  }, []);

  const submit = (event) => {
    event.preventDefault();
    setLocalError("");
    if (mode === "signup" && !name.trim()) return setLocalError("Enter your name or clinic name.");
    if (!isValidEmailAddress(email)) return setLocalError("Enter a valid email address.");
    if (password.length < 8) return setLocalError("Password must be at least 8 characters.");
    if (mode === "signup") onEmailSignUp && onEmailSignUp(name.trim(), email.trim(), password);
    else onEmailSignIn && onEmailSignIn(email.trim(), password);
  };

  const reset = () => {
    setLocalError("");
    if (!isValidEmailAddress(email)) return setLocalError("Enter your email address above first.");
    onResetPassword && onResetPassword(email.trim());
  };

  const input = "w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_1.1fr] bg-gradient-to-b from-[#f4f8ff] to-[#dbe7f8] text-slate-900 font-sans antialiased">
      <aside className="hidden lg:flex flex-col justify-between p-12 text-white bg-[radial-gradient(90%_60%_at_100%_0%,rgba(56,189,248,.35),transparent),radial-gradient(70%_60%_at_0%_100%,rgba(37,99,235,.4),transparent),linear-gradient(180deg,#1e3a8a,#0f1f4d)]">
        <a href="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="" className="w-11 h-11 object-contain" />
          <span className="font-display font-bold text-2xl tracking-tight">MeriDent</span>
        </a>
        <div className="max-w-md">
          <h1 className="font-display font-bold text-4xl leading-tight tracking-[-0.02em]">Welcome back to your clinic.</h1>
          <p className="mt-3 text-blue-100 leading-relaxed">Pick up where you left off. Your patients, charts and bills are saved under your own sign-in.</p>
          <ul className="mt-8 space-y-4">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-blue-50">
                <span className="flex w-9 h-9 items-center justify-center rounded-full bg-white/15"><Icon className="w-4 h-4" aria-hidden="true" /></span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-blue-200">Free during early access.</p>
      </aside>

      <main className="flex flex-col justify-center px-5 py-10 sm:px-10">
        <a href="/" className="lg:hidden flex items-center gap-2.5 mb-8 self-center">
          <img src="/logo.png" alt="" className="w-10 h-10 object-contain" />
          <span className="font-display font-bold text-xl text-blue-900">MeriDent</span>
        </a>

        <div className="w-full max-w-md mx-auto bg-white/90 border border-white rounded-3xl shadow-[0_30px_70px_-30px_rgba(30,58,138,.5)] p-6 sm:p-8 space-y-5">
          <div>
            <h2 className="font-display font-bold text-2xl tracking-tight">{mode === "signup" ? "Create your account" : "Log in"}</h2>
            <p className="mt-1 text-sm text-slate-600">{mode === "signup" ? "Set up your clinic workspace in a minute." : "Open your clinic workspace."}</p>
          </div>

          {!firebaseConfigured && (
            <p role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm font-medium text-amber-800">
              Sign-in is not set up on this deployment yet. The site owner needs to add the VITE_FIREBASE_* environment variables.
            </p>
          )}
          {authNotice && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">{authNotice}</p>}
          {authError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">{authError}</p>}

          <button
            type="button"
            onClick={onLoginClick}
            disabled={loginBusy || !firebaseConfigured}
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 shadow-lg shadow-blue-700/25 disabled:opacity-60 text-white text-[15px] font-semibold px-6 py-3 rounded-full transition-colors"
          >
            <span>{loginBusy ? "Connecting…" : "Continue with Google"}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>

          <div className="flex items-center gap-3 text-xs text-slate-500" aria-hidden="true">
            <span className="flex-1 h-px bg-slate-200" />or use your email<span className="flex-1 h-px bg-slate-200" />
          </div>

          <form onSubmit={submit} noValidate className="space-y-3">
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 text-sm font-bold">
              <button type="button" onClick={() => { setMode("signin"); setLocalError(""); }} className={`rounded-md py-2 ${mode === "signin" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}>Sign in</button>
              <button type="button" onClick={() => { setMode("signup"); setLocalError(""); }} className={`rounded-md py-2 ${mode === "signup" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}>Create account</button>
            </div>
            {mode === "signup" && (
              <div>
                <label htmlFor="login-name" className="block text-sm font-semibold text-slate-700 mb-1">Your name or clinic name</label>
                <input id="login-name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={input} />
              </div>
            )}
            <div>
              <label htmlFor="login-email" className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
              <input id="login-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input id="login-password" type={showPassword ? "text" : "password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} className={`${input} pr-11`} />
                <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 px-3 text-slate-500 hover:text-slate-800">
                  {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                </button>
              </div>
            </div>
            {localError && <p role="alert" className="text-sm font-medium text-rose-700">{localError}</p>}
            <button type="submit" disabled={loginBusy || !firebaseConfigured} className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white text-sm font-bold py-3 rounded-full">
              {loginBusy ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
            </button>
            {mode === "signin" && (
              <div className="text-center">
                <button type="button" onClick={reset} className="text-sm font-semibold text-blue-700 hover:text-blue-900">Forgot password?</button>
              </div>
            )}
            {mode === "signup" && <p className="text-xs text-slate-500 leading-relaxed">We will email you a link to verify your address before you can open your clinic workspace.</p>}
          </form>

          <label className="flex items-start gap-2 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" checked={specialist} onChange={(e) => pickSpecialist(e.target.checked)} className="mt-1" />
            <span><strong className="text-slate-900">I am a specialist and only want MeriDent Connect.</strong> No clinic software.</span>
          </label>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          <a href="/" className="underline hover:text-slate-900">Back to home</a> <span aria-hidden="true">|</span>{" "}
          <a href="/?page=privacy" className="underline hover:text-slate-900">Privacy Policy</a> <span aria-hidden="true">|</span>{" "}
          <a href="/?page=terms" className="underline hover:text-slate-900">Terms of Use</a>
        </p>
      </main>
    </div>
  );
}
