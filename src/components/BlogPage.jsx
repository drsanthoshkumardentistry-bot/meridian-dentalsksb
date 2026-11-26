/* The blog index and one blog post. Content comes from src/blogPosts.js. */
import React, { useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { SEO_PAGES, SITE } from "../seoPages.js";
import { BLOG_POSTS, BLOG_PATH } from "../blogPosts.js";

const INDEX = {
  path: BLOG_PATH,
  title: "Dental clinic blog: software, records and running a clinic in India | MeriDent",
  description: "Plain guides for dental clinic owners in India: choosing software, going paperless, fewer no-shows and keeping patient records safe. Written by the MeriDent team.",
};

const nice = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

function useHead(page, ld) {
  useEffect(() => {
    const before = document.title;
    document.title = page.title;
    const meta = document.querySelector('meta[name="description"]');
    const beforeDesc = meta ? meta.getAttribute("content") : null;
    if (meta) meta.setAttribute("content", page.description);
    const canon = document.querySelector('link[rel="canonical"]');
    const beforeCanon = canon ? canon.getAttribute("href") : null;
    if (canon) canon.setAttribute("href", `${SITE}${page.path}`);
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(ld);
    document.head.appendChild(script);
    return () => {
      document.title = before;
      if (meta && beforeDesc !== null) meta.setAttribute("content", beforeDesc);
      if (canon && beforeCanon !== null) canon.setAttribute("href", beforeCanon);
      script.remove();
    };
  }, [page, ld]);
}

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f8ff] via-[#eaf1fc] to-[#dbe7f8] text-slate-900 font-sans antialiased">
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-white/70">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="" className="w-9 h-9 object-contain" />
            <span className="font-display font-bold text-xl text-blue-900">MeriDent</span>
          </a>
          <nav className="flex items-center gap-4">
            <a href={BLOG_PATH} className="text-sm font-semibold text-blue-900 underline">Blog</a>
            <a href="/login" className="text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-700 shadow-md shadow-blue-700/30 px-5 py-2 rounded-full">Log in</a>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-white/70 bg-white/50">
        <p className="max-w-5xl mx-auto px-5 py-6 text-sm text-slate-600">
          MeriDent (formerly Meridian Dental OS), built by dental students in India. <a href="/" className="underline">Home</a> | <a href="/login" className="underline">Log in</a> | <a href="/?page=privacy" className="underline">Privacy Policy</a> | <a href="/?page=terms" className="underline">Terms of Use</a>
        </p>
      </footer>
    </div>
  );
}

export function BlogIndex() {
  useHead(INDEX, { "@context": "https://schema.org", "@type": "Blog", name: "MeriDent blog", url: `${SITE}${BLOG_PATH}`, inLanguage: "en-IN" });
  return (
    <Shell>
      <div className="max-w-3xl mx-auto px-5 pt-14 pb-16">
        <h1 className="font-display font-bold text-4xl tracking-tight">Guides for dental clinic owners</h1>
        <p className="mt-3 text-lg text-slate-600 leading-relaxed">Plain, practical writing on software, records and running a clinic in India. We build MeriDent, and each post says so.</p>
        <ul className="mt-8 space-y-5">
          {BLOG_POSTS.map((b) => (
            <li key={b.path} className="bg-white/80 border border-white rounded-3xl shadow-[0_20px_50px_-30px_rgba(30,58,138,.45)] p-6">
              <h2 className="font-display font-bold text-xl tracking-tight"><a href={b.path} className="hover:underline">{b.h1}</a></h2>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{b.description}</p>
              <p className="mt-3 text-xs text-slate-500">{nice(b.date)} | {b.mins} min read</p>
            </li>
          ))}
        </ul>
      </div>
    </Shell>
  );
}

export function BlogPost({ post }) {
  const ld = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.h1,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    inLanguage: "en-IN",
    mainEntityOfPage: `${SITE}${post.path}`,
    author: { "@type": "Organization", name: "MeriDent" },
    publisher: { "@type": "Organization", name: "MeriDent", logo: { "@type": "ImageObject", url: `${SITE}/logo.png` } },
  };
  useHead(post, ld);
  const related = (post.related || []).map((p) => SEO_PAGES.find((x) => x.path === p)).filter(Boolean);
  return (
    <Shell>
      <article className="max-w-3xl mx-auto px-5 pt-12 pb-10">
        <p className="text-sm"><a href={BLOG_PATH} className="text-blue-800 underline">All guides</a></p>
        <h1 className="mt-3 font-display font-bold text-[2rem] sm:text-4xl leading-[1.12] tracking-tight">{post.h1}</h1>
        <p className="mt-2 text-sm text-slate-500">By the MeriDent team | {nice(post.date)} | {post.mins} min read</p>
        <p className="mt-6 text-lg text-slate-700 leading-relaxed">{post.intro}</p>
        {post.sections.map((s) => (
          <section key={s.h} className="mt-8">
            <h2 className="font-display font-bold text-2xl tracking-tight">{s.h}</h2>
            {(s.paras || []).map((t) => <p key={t} className="mt-3 text-[15px] text-slate-700 leading-relaxed">{t}</p>)}
            {s.items && (
              <ul className="mt-3 space-y-2.5 list-disc pl-5 text-[15px] text-slate-700 leading-relaxed">
                {s.items.map((t) => <li key={t}>{t}</li>)}
              </ul>
            )}
          </section>
        ))}
        <div className="mt-10 bg-white/80 border border-white rounded-3xl p-6">
          <h2 className="font-display font-bold text-lg">Want to see it in a real clinic day?</h2>
          <p className="mt-1 text-sm text-slate-600">MeriDent is free during early access, with no credit card.</p>
          <a href="/login" className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-700 shadow-lg shadow-blue-700/30 text-white text-[15px] font-semibold px-6 py-3 rounded-full">
            Start free<ArrowRight className="w-4 h-4" aria-hidden="true" />
          </a>
        </div>
        {related.length > 0 && (
          <nav aria-label="Related pages" className="mt-8">
            <h2 className="font-display font-bold text-lg mb-3">Related</h2>
            <div className="flex flex-wrap gap-2">
              {related.map((p) => (
                <a key={p.path} href={p.path} className="bg-blue-50 border border-blue-200 text-blue-800 text-sm font-semibold px-3.5 py-1.5 rounded-full hover:bg-blue-100">{p.nav}</a>
              ))}
            </div>
          </nav>
        )}
      </article>
    </Shell>
  );
}

export default function BlogPage({ post }) {
  return post ? <BlogPost post={post} /> : <BlogIndex />;
}
