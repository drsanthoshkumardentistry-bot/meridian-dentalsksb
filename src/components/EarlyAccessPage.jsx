/* /free-early-access: what free early access means, and a short form that opens WhatsApp with the details ready. */
import React, { useEffect, useState } from "react";
import { Check, MessageCircle } from "lucide-react";
import { CLINIC_SIZES, EARLY_ACCESS_DESCRIPTION, EARLY_ACCESS_TITLE, earlyAccessLink, validateEarlyAccess } from "../earlyAccess.js";
import { SEO_PAGES } from "../seoPages.js";

const GET = [
  "Every feature in MeriDent today, free. No credit card.",
  "Set-up help on a call if you like: clinic details, doctors and chairs.",
  "Simple pricing is announced well before anything changes, and early clinics hear first.",
  "Your clinic's records stay in its own workspace and are not visible to other clinics."
];

export default function EarlyAccessPage() {
  const [f, setF] = useState({ name: "", clinic: "", city: "", phone: "", size: CLINIC_SIZES[0], callMe: true });
  const [error, setError] = useState("");
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  useEffect(() => {
    const before = document.title;
    document.title = EARLY_ACCESS_TITLE;
    const meta = document.querySelector('meta[name="description"]');
    const beforeDesc = meta ? meta.getAttribute("content") : null;
    if (meta) meta.setAttribute("content", EARLY_ACCESS_DESCRIPTION);
    return () => { document.title = before; if (meta && beforeDesc !== null) meta.setAttribute("content", beforeDesc); };
  }, []);

  const submit = (e) => {
    e.preventDefault();
    const problem = validateEarlyAccess(f);
    setError(problem);
    if (!problem) window.open(earlyAccessLink(f), "_blank", "noopener,noreferrer");
  };

  const input = "w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
  const label = "block text-sm font-semibold text-slate-700 mb-1";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f8ff] via-[#eaf1fc] to-[#dbe7f8] text-slate-900 font-sans antialiased">
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-white/70">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="" className="w-9 h-9 object-contain" />
            <span className="font-display font-bold text-xl text-blue-900">MeriDent</span>
          </a>
          <a href="/login" className="text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-700 shadow-md shadow-blue-700/30 px-5 py-2 rounded-full">Log in</a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-12 lg:py-16 grid lg:grid-cols-[1.1fr_1fr] gap-10 items-start">
        <section>
          <h1 className="font-display font-bold text-[2.2rem] sm:text-5xl leading-[1.08] tracking-[-0.03em]">MeriDent is free for your clinic during early access</h1>
          <p className="mt-4 text-lg text-slate-600 leading-relaxed max-w-xl">Tell us about your clinic and we will help you set it up. You can also start on your own right now.</p>
          <ul className="mt-6 space-y-3">
            {GET.map((t) => (
              <li key={t} className="flex gap-3 text-slate-700 leading-relaxed">
                <Check className="w-5 h-5 mt-0.5 shrink-0 text-blue-700" aria-hidden="true" />{t}
              </li>
            ))}
          </ul>
          <a href="/login" className="mt-8 inline-flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-700 shadow-lg shadow-blue-700/30 text-white text-[15px] font-semibold px-7 py-3.5 rounded-full">Start free now</a>
        </section>

        <form onSubmit={submit} noValidate className="bg-white/90 border border-white rounded-3xl shadow-[0_30px_70px_-30px_rgba(30,58,138,.5)] p-6 sm:p-8 space-y-4">
          <div>
            <h2 className="font-display font-bold text-2xl tracking-tight">Get set up on WhatsApp</h2>
            <p className="mt-1 text-sm text-slate-600">This opens WhatsApp with your details written. You tap Send. We do not store this form.</p>
          </div>
          <div><label htmlFor="ea-name" className={label}>Your name</label><input id="ea-name" autoComplete="name" value={f.name} onChange={set("name")} className={input} /></div>
          <div><label htmlFor="ea-clinic" className={label}>Clinic name</label><input id="ea-clinic" autoComplete="organization" value={f.clinic} onChange={set("clinic")} className={input} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label htmlFor="ea-city" className={label}>City</label><input id="ea-city" value={f.city} onChange={set("city")} className={input} /></div>
            <div><label htmlFor="ea-phone" className={label}>Mobile number</label><input id="ea-phone" type="tel" inputMode="tel" autoComplete="tel" value={f.phone} onChange={set("phone")} className={input} /></div>
          </div>
          <div>
            <label htmlFor="ea-size" className={label}>Clinic size</label>
            <select id="ea-size" value={f.size} onChange={set("size")} className={input}>{CLINIC_SIZES.map((s) => <option key={s}>{s}</option>)}</select>
          </div>
          <label className="flex items-start gap-2 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" checked={f.callMe} onChange={set("callMe")} className="mt-1" />Call me to help set up
          </label>
          {error && <p role="alert" className="text-sm font-medium text-rose-700">{error}</p>}
          <button type="submit" className="w-full inline-flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold py-3 rounded-full">
            <MessageCircle className="w-4 h-4" aria-hidden="true" />Continue on WhatsApp
          </button>
        </form>
      </main>

      <nav aria-label="More about MeriDent" className="max-w-5xl mx-auto px-5 pb-12">
        <h2 className="font-display font-bold text-lg mb-3">What you get</h2>
        <div className="flex flex-wrap gap-2">
          {SEO_PAGES.map((p) => <a key={p.path} href={p.path} className="bg-blue-50 border border-blue-200 text-blue-800 text-sm font-semibold px-3.5 py-1.5 rounded-full hover:bg-blue-100">{p.nav}</a>)}
        </div>
      </nav>
      <footer className="border-t border-white/70 bg-white/50">
        <p className="max-w-5xl mx-auto px-5 py-6 text-sm text-slate-600">
          MeriDent, built by dental students in India. <a href="/" className="underline">Home</a> | <a href="/login" className="underline">Log in</a> | <a href="/?page=privacy" className="underline">Privacy Policy</a> | <a href="/?page=terms" className="underline">Terms of Use</a>
        </p>
      </footer>
    </div>
  );
}
