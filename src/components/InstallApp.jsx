import React, { useState } from "react";
import { Download, Smartphone, CheckCircle2 } from "lucide-react";
import { APK_URL, detectPlatform, manualSteps, useInstallPrompt } from "../installApp.js";

/** Landing-page section that lets a visitor install MeriDent as an app. Hidden once it is installed. */
export default function InstallApp() {
  const { canPrompt, install, installed } = useInstallPrompt();
  const [showSteps, setShowSteps] = useState(false);
  const platform = detectPlatform();
  if (installed) return null;

  const onInstall = async () => {
    if (canPrompt) await install();
    else setShowSteps(true);
  };

  return (
    <section id="app" aria-labelledby="app-heading" className="max-w-6xl mx-auto px-5 py-16 lg:py-20">
      <div className="rounded-3xl bg-white/80 border border-white shadow-xl shadow-blue-900/5 p-7 sm:p-10 grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-8 items-center">
        <div>
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 text-blue-700"><Smartphone className="w-6 h-6" aria-hidden="true" /></span>
          <h2 id="app-heading" className="mt-4 font-display font-bold text-2xl sm:text-3xl tracking-[-0.02em] text-ink">Use MeriDent as an app</h2>
          <p className="mt-2 text-slate-600 leading-relaxed max-w-lg">
            Keep MeriDent on your home screen or desktop and open it in one tap, with its own icon and full-screen window. It is the same MeriDent, so updates reach you automatically.
          </p>
        </div>
        <div className="space-y-3">
          <button
            type="button"
            onClick={onInstall}
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 shadow-lg shadow-blue-700/25 text-white text-[15px] font-semibold px-6 py-3.5 rounded-full transition-colors"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Install app</span>
          </button>
          {platform !== "ios" && (
            <a
              href={APK_URL}
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-ink border border-slate-200 shadow-sm text-[15px] font-semibold px-6 py-3.5 rounded-full transition-colors"
            >
              <span>Download for Android (APK)</span>
            </a>
          )}
          {showSteps && (
            <p role="status" className="flex items-start gap-2 rounded-xl bg-blue-50 border border-blue-100 p-3 text-sm text-blue-900">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              <span>{manualSteps(platform)}</span>
            </p>
          )}
          <p className="text-xs text-slate-500 leading-relaxed">
            The Android file is not on the Play Store yet, so Android will ask you to allow the install. There is no iPhone app yet; on an iPhone, use Add to Home Screen.
          </p>
        </div>
      </div>
    </section>
  );
}
