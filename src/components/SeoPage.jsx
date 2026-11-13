/* One public feature page. Content comes from src/seoPages.js. */
import React, { useEffect } from "react";
import { ArrowRight, Check, MessageCircle } from "lucide-react";
import { SEO_PAGES } from "../seoPages.js";

const DEMO = `https://wa.me/919043205927?text=${encodeURIComponent("Hi, I would like a demo of MeriDent.")}`;

export default function SeoPage({ page }) {
  useEffect(() => {
    const before = document.title;
    document.title = page.title;
    const meta = document.querySelector('meta[name="description"]');
    const beforeDesc = meta ? meta.getAttribute("content") : null;
    if (meta) meta.setAttribute("content", page.description);
    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.text = JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: page.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) });
    document.head.appendChild(ld);
    return () => {
      document.title = before;
      if (meta && beforeDesc !== null) meta.setAttribute("content", beforeDesc);
      ld.remove();
    };
  }, [page]);

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

      <main>
        <section className="bg-[radial-gradient(70%_80%_at_100%_0%,rgba(56,189,248,.3),transparent)]">
          <div className="max-w-5xl mx-auto px-5 pt-14 pb-12 lg:pt-20">
            <h1 className="font-display font-bold text-[2.2rem] sm:text-5xl leading-[1.08] tracking-[-0.03em] max-w-3xl">{page.h1}</h1>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl leading-relaxed">{page.lead}</p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <a href="/login" className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-700 shadow-lg shadow-blue-700/30 text-white text-[15px] font-semibold px-7 py-3.5 rounded-full">
                Start free<ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>
              <a href={DEMO} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-white hover:bg-blue-50 border border-white shadow-sm text-[15px] font-semibold px-7 py-3.5 rounded-full">
                <MessageCircle className="w-4 h-4 text-blue-700" aria-hidden="true" />Ask for a demo on WhatsApp
              </a>
            </div>
            <p className="mt-3 text-sm text-slate-600">Free during early access. No credit card needed.</p>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-5 pb-8 grid md:grid-cols-2 gap-6">
          {page.sections.map((s) => (
            <section key={s.h} className="bg-white/80 border border-white rounded-3xl shadow-[0_20px_50px_-30px_rgba(30,58,138,.45)] p-6">
              <h2 className="font-display font-bold text-xl tracking-tight">{s.h}</h2>
              <ul className="mt-4 space-y-3">
                {s.items.map((t) => (
                  <li key={t} className="flex gap-3 text-sm text-slate-700 leading-relaxed">
                    <Check className="w-4 h-4 mt-0.5 shrink-0 text-blue-700" aria-hidden="true" />{t}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section className="max-w-3xl mx-auto px-5 py-10">
          <h2 className="font-display font-bold text-2xl tracking-tight mb-4">Questions clinics ask</h2>
          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {page.faqs.map(({ q, a }) => (
              <details key={q} className="py-4">
                <summary className="cursor-pointer font-bold">{q}</summary>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <nav aria-label="More about MeriDent" className="max-w-5xl mx-auto px-5 pb-12">
          <h2 className="font-display font-bold text-lg mb-3">More about MeriDent</h2>
          <div className="flex flex-wrap gap-2">
            {SEO_PAGES.filter((p) => p.path !== page.path).map((p) => (
              <a key={p.path} href={p.path} className="bg-blue-50 border border-blue-200 text-blue-800 text-sm font-semibold px-3.5 py-1.5 rounded-full hover:bg-blue-100">{p.nav}</a>
            ))}
          </div>
        </nav>
      </main>

      <footer className="border-t border-white/70 bg-white/50">
        <p className="max-w-5xl mx-auto px-5 py-6 text-sm text-slate-600">
          MeriDent, built by dental students in India. <a href="/" className="underline">Home</a> | <a href="/login" className="underline">Log in</a> | <a href="/?page=privacy" className="underline">Privacy Policy</a> | <a href="/?page=terms" className="underline">Terms of Use</a>
        </p>
      </footer>
    </div>
  );
}
