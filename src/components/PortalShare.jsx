import React, { useState } from "react";
import { Send, Link2, Copy, Ban } from "lucide-react";
import { hasWhatsAppConsent, whatsappLink } from "../reminders.js";
import { buildPortalMessage, portalUrl } from "../portal.js";

/** Clinic side of the patient portal: publish a fresh snapshot, send the private link, or switch it off. */
export default function PortalShare({ patient, clinicName, onPublish, onRevoke, showToast }) {
  const [busy, setBusy] = useState(false);
  const token = patient.portalToken || "";
  const url = token ? portalUrl(window.location.origin, token) : "";

  const run = async (fn, okMessage) => {
    setBusy(true);
    try { await fn(); if (okMessage) showToast(okMessage); } catch { showToast("Could not update the portal. Check your connection and try again."); } finally { setBusy(false); }
  };
  const sendOnWhatsApp = async () => {
    if (!hasWhatsAppConsent(patient)) return showToast("This patient has not agreed to WhatsApp messages");
    if (!whatsappLink(patient.phone, "x")) return showToast("Add a valid mobile number to send on WhatsApp");
    // Open the tab now (phones block windows opened after a wait), then point it at WhatsApp once the page is published.
    const tab = window.open("", "_blank");
    setBusy(true);
    try {
      const t = await onPublish(patient);
      const link = whatsappLink(patient.phone, buildPortalMessage({ clinicName, patient, url: portalUrl(window.location.origin, t) }));
      if (tab) { tab.opener = null; tab.location.href = link; } else window.location.href = link;
      showToast("Portal updated. WhatsApp is ready to send.");
    } catch {
      if (tab) tab.close();
      showToast("Could not update the portal. Check your connection and try again.");
    } finally { setBusy(false); }
  };
  const copy = () => run(async () => {
    const t = await onPublish(patient);
    await navigator.clipboard.writeText(portalUrl(window.location.origin, t));
  }, "Link copied");

  return (
    <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-4 text-xs space-y-2" data-testid="portal-share">
      <div className="font-bold text-slate-800 flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5" /> Patient portal</div>
      <p className="text-slate-600">A private page with this patient's upcoming visits, bills with a UPI pay button, treatment plans and last advice. It never shows phone, address, diagnosis or X-rays. Valid for 30 days; sending again refreshes it.</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={sendOnWhatsApp} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold inline-flex items-center gap-1.5">
          <Send className="w-3.5 h-3.5" /> {token ? "Update and send on WhatsApp" : "Create link and send on WhatsApp"}
        </button>
        <button type="button" disabled={busy} onClick={copy} className="px-3 py-1.5 rounded-lg border border-rule bg-white text-slate-700 font-semibold inline-flex items-center gap-1.5"><Copy className="w-3.5 h-3.5" /> Copy link</button>
        {token && <button type="button" disabled={busy} onClick={() => run(() => onRevoke(patient), "Portal link switched off")} className="px-3 py-1.5 rounded-lg border border-rose-200 bg-white text-rose-700 font-semibold inline-flex items-center gap-1.5"><Ban className="w-3.5 h-3.5" /> Switch off</button>}
      </div>
    </div>
  );
}
