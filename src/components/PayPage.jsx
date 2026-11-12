import React, { useEffect, useState } from "react";
import { formatINR } from "../billing.js";
import { parsePayLink, upiUriFor } from "../payLink.js";

/** The page a patient sees after tapping a payment link from their clinic. No sign-in, no data stored. */
export default function PayPage({ search = window.location.search }) {
  const req = parsePayLink(search);
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);
  const uri = req ? upiUriFor(req) : "";
  useEffect(() => {
    if (!uri) return undefined;
    let off = false;
    import("qrcode").then((m) => (m.default || m).toDataURL(uri, { margin: 1, width: 240 })).then((u) => { if (!off) setQr(u); }).catch(() => {});
    return () => { off = true; };
  }, [uri]);

  const shell = "min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans";
  if (!req) {
    return (
      <main className={shell}>
        <div className="max-w-sm bg-white border border-slate-200 rounded-2xl p-6 text-center">
          <h1 className="text-lg font-bold text-slate-900">This payment link is not valid</h1>
          <p className="text-sm text-slate-600 mt-2">Ask the clinic to send the link again, or pay using the UPI QR on your bill.</p>
        </div>
      </main>
    );
  }
  return (
    <main className={shell}>
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-4">
        <div>
          <div className="text-xs text-slate-500">Pay</div>
          <h1 className="text-xl font-bold text-slate-900">{req.name || "Your clinic"}</h1>
        </div>
        {req.amountP > 0 && <div className="text-3xl font-bold text-slate-900 tabular-nums">₹{formatINR(req.amountP)}</div>}
        {req.note && <div className="text-xs text-slate-500">For {req.note}</div>}
        <a href={uri} className="block w-full rounded-xl bg-[#1d4ed8] text-white font-semibold py-3 text-sm">Pay with a UPI app</a>
        <p className="text-xs text-slate-500">Opens GPay, PhonePe, Paytm or any UPI app on this phone.</p>
        {qr && (
          <div>
            <img src={qr} alt="UPI QR code" width={200} height={200} className="mx-auto" />
            <p className="text-xs text-slate-500 mt-1">On a computer? Scan this with your phone's UPI app.</p>
          </div>
        )}
        <div className="text-xs text-slate-700 border-t border-slate-100 pt-3">
          UPI ID: <strong>{req.vpa}</strong>{" "}
          <button type="button" onClick={() => { navigator.clipboard?.writeText(req.vpa); setCopied(true); }} className="underline text-blue-700">{copied ? "Copied" : "Copy"}</button>
          <p className="mt-1 text-slate-500">Check that the name above is your clinic before you pay. The money goes straight to this UPI ID.</p>
        </div>
      </div>
    </main>
  );
}
