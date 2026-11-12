import React, { useEffect } from "react";
import { PAGES, LEGAL_UPDATED, CONTACT, CONTACT_CO } from "../legal.js";

/** Public privacy policy or terms page, opened with ?page=privacy or ?page=terms. */
export default function LegalPage({ page }) {
  const doc = PAGES[page];
  useEffect(() => { document.title = `${doc.title} | MeriDent`; }, [doc]);
  const other = page === "terms" ? ["privacy", "Privacy Policy"] : page === "pricing" ? ["/", "Back to MeriDent"] : ["terms", "Terms of Use"];
  return (
    <div className="min-h-screen bg-white text-slate-800">
      <header className="border-b border-rule">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <a href="/" className="font-display font-bold text-ink text-lg">MeriDent</a>
          <a href={other[0] === "/" ? "/" : `/?page=${other[0]}`} className="text-sm text-brand-700 hover:underline">{other[1]}</a>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-5 py-10">
        <h1 className="font-display font-bold text-3xl tracking-[-0.02em] text-ink">{doc.title}</h1>
        <p className="mt-1 text-sm text-slate-500">Updated {LEGAL_UPDATED}</p>
        <p className="mt-5 leading-relaxed">{doc.intro}</p>
        {doc.sections.map((s) => (
          <section key={s.h} className="mt-8">
            <h2 className="text-lg font-bold text-ink">{s.h}</h2>
            {s.p.map((t) => <p key={t} className="mt-2 leading-relaxed text-slate-700">{t}</p>)}
          </section>
        ))}
        <section className="mt-10 rounded-xl border border-rule bg-enamel p-5">
          <h2 className="text-lg font-bold text-ink">{page === "pricing" ? "Talk to us" : "Contact and complaints"}</h2>
          <p className="mt-2 text-slate-700">{CONTACT.name}. Message on WhatsApp: <a className="text-brand-700 underline" href={`https://wa.me/${CONTACT.whatsapp}`}>{CONTACT.display}</a>.</p>
          <p className="mt-1 text-slate-700">{CONTACT_CO.name}. Message on WhatsApp: <a className="text-brand-700 underline" href={`https://wa.me/${CONTACT_CO.whatsapp}`}>{CONTACT_CO.display}</a>.</p>
        </section>
      </main>
    </div>
  );
}
