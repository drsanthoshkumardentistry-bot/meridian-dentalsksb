import React, { useEffect, useState } from "react";
import { copyText } from "../copyText.js";
import { formatINR } from "../billing.js";
import { parsePayLink, upiUriFor } from "../payLink.js";
import { checkPayLink } from "../paySeal.js";
import { pageLang, saveLang, tr } from "../pageText.js";
import LangSwitch from "./LangSwitch.jsx";

/** The page a patient sees after tapping a payment link from their clinic. No sign-in, no data stored. */
export default function PayPage({ search = window.location.search }) {
  const req = parsePayLink(search);
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);
  const [lang, setLang] = useState(() => pageLang());
  const pick = (id) => { setLang(id); saveLang(id); };
  const t = (k, ...a) => tr(lang, k, ...a);
  // "checking" only while a sealed link is being checked; unsealed (older) links go straight to a caution.
  const [trust, setTrust] = useState(req && req.ks ? "checking" : "unsigned");
  useEffect(() => {
    if (!req || !req.ks) return undefined;
    let off = false;
    checkPayLink(req).then((t) => { if (!off) setTrust(t); });
    return () => { off = true; };
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps
  const uri = req && trust !== "bad" ? upiUriFor(req) : "";
  useEffect(() => {
    if (!uri) return undefined;
    let off = false;
    import("qrcode").then((m) => (m.default || m).toDataURL(uri, { margin: 1, width: 240 })).then((u) => { if (!off) setQr(u); }).catch(() => {});
    return () => { off = true; };
  }, [uri]);

  const shell = "min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans";
  if (!req || trust === "bad") {
    return (
      <main className={shell}>
        <div className="max-w-sm bg-white border border-slate-200 rounded-2xl p-6 text-center">
          <LangSwitch lang={lang} onChange={pick} />
          <h1 className="text-lg font-bold text-slate-900">{t("payInvalid")}</h1>
          <p className="text-sm text-slate-600 mt-2">{req ? t("payChanged") : ""}{t("payInvalidBody")}</p>
        </div>
      </main>
    );
  }
  return (
    <main className={shell}>
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-4">
        <LangSwitch lang={lang} onChange={pick} />
        <div>
          <div className="text-xs text-slate-500">{t("pay")}</div>
          <h1 className="text-xl font-bold text-slate-900">{req.name || t("yourClinic")}</h1>
        </div>
        {trust === "ok" && <p role="status" className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-2">{t("verified")}</p>}
        {trust === "checking" && <p role="status" className="text-xs text-slate-500">{t("checking")}</p>}
        {(trust === "unsigned" || trust === "unknown") && <p role="status" className="rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs p-2">{t("unverified")}</p>}
        {req.amountP > 0 && <div className="text-3xl font-bold text-slate-900 tabular-nums">₹{formatINR(req.amountP)}</div>}
        {req.note && <div className="text-xs text-slate-500">{t("for")} {req.note}</div>}
        {trust !== "checking" && <a href={uri} className="block w-full rounded-xl bg-[#0f172a] text-white font-semibold py-3 text-sm">{t("payBtn")}</a>}
        <p className="text-xs text-slate-500">{t("payHint")}</p>
        {qr && trust !== "checking" && (
          <div>
            <img src={qr} alt={t("qrAlt")} width={200} height={200} className="mx-auto" />
            <p className="text-xs text-slate-500 mt-1">{t("qrHint")}</p>
          </div>
        )}
        <div className="text-xs text-slate-700 border-t border-slate-100 pt-3">
          {t("upiId")}: <strong>{req.vpa}</strong>{" "}
          <button type="button" onClick={() => { copyText(req.vpa).then((ok) => setCopied(ok)); }} className="underline text-blue-700">{copied ? t("copied") : t("copy")}</button>
          <p className="mt-1 text-slate-500">{t("payCheck")}</p>
        </div>
      </div>
    </main>
  );
}
