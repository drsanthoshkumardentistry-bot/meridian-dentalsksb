import React, { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { AFTERCARE_KINDS, buildAftercare, suggestAftercare } from "../aftercare.js";
import { languageOf } from "../messageLanguage.js";
import { hasWhatsAppConsent, whatsappLink } from "../reminders.js";

/** Pick what was done, check the message, and open WhatsApp with it. The clinic taps Send. */
export default function AftercareSender({ patient, clinicName, latestVisitText = "", showToast }) {
  const suggested = suggestAftercare(latestVisitText);
  const [kind, setKind] = useState(suggested);
  useEffect(() => { setKind(suggested); }, [suggested, patient.id]);

  const language = languageOf(patient);
  const text = kind ? buildAftercare({ kind, language, clinicName, patientName: patient.name }) : "";

  const send = () => {
    if (!hasWhatsAppConsent(patient)) return showToast("This patient has not agreed to WhatsApp messages");
    const link = whatsappLink(patient.phone, text);
    if (!link) return showToast("Add a valid mobile number to send on WhatsApp");
    window.open(link, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-xs space-y-2" data-testid="aftercare">
      <div className="font-bold uppercase tracking-wider text-slate-800">Aftercare message</div>
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label="Aftercare for" value={kind} onChange={(e) => setKind(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg bg-white">
          <option value="">Choose what was done</option>
          {AFTERCARE_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
        </select>
        <span className="text-slate-500">Sent in {{ en: "English", ta: "Tamil", hi: "Hindi" }[language]}, the patient's language</span>
      </div>
      {text && (
        <>
          <pre aria-label="Aftercare message preview" className="whitespace-pre-wrap rounded-lg bg-white border border-slate-200 p-3 text-[11px] leading-relaxed text-slate-700 font-sans">{text}</pre>
          <button type="button" onClick={send} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold inline-flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5" /> Send on WhatsApp
          </button>
        </>
      )}
    </div>
  );
}
