import React, { useEffect, useState } from "react";
import { Download, Copy, MessageCircle } from "lucide-react";

const btn = "px-3 py-2 bg-white border border-rule hover:bg-enamel rounded-lg text-xs font-semibold text-slate-800 inline-flex items-center gap-1.5";

/** The clinic's booking link as a QR code for the front desk, plus copy and WhatsApp share. */
export default function BookingShare({ url, clinicName, onCopy }) {
  const [png, setPng] = useState("");
  useEffect(() => {
    let live = true;
    import("qrcode").then((m) => (m.default || m).toDataURL(url, { margin: 2, width: 600, errorCorrectionLevel: "M" })).then((d) => live && setPng(d)).catch(() => live && setPng(""));
    return () => { live = false; };
  }, [url]);
  const text = `Book an appointment at ${clinicName || "our clinic"}: ${url}`;
  return (
    <div className="flex flex-wrap items-center gap-4" data-testid="booking-share">
      {png ? <img src={png} alt={`QR code to book at ${clinicName || "the clinic"}`} width="112" height="112" className="rounded-lg border border-rule bg-white" /> : <div className="w-28 h-28 rounded-lg bg-mist" aria-hidden="true" />}
      <div className="space-y-2">
        <p className="text-xs text-slate-600">Print this for your front desk or put it on a poster. Patients scan it to request an appointment.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onCopy} className={btn}><Copy className="w-3.5 h-3.5" /> Copy link</button>
          <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer" className={btn}><MessageCircle className="w-3.5 h-3.5" /> Share on WhatsApp</a>
          {png && <a href={png} download="booking-qr.png" className={btn}><Download className="w-3.5 h-3.5" /> Download QR</a>}
        </div>
      </div>
    </div>
  );
}
