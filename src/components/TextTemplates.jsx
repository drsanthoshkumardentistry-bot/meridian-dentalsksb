import React from "react";
import { RX_ADVICE_DEFAULT, MAX_TEXT, setText, resetText } from "../templates.js";

function Block({ id, title, hint, placeholder, profile, onProfile }) {
  const value = profile?.texts?.[id] ?? "";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label htmlFor={`txt-${id}`} className="font-semibold text-slate-700">{title}</label>
        {value && <button type="button" onClick={() => onProfile(resetText(profile, id))} className="text-[11px] text-blue-700 hover:underline">Reset to standard</button>}
      </div>
      <textarea
        id={`txt-${id}`}
        rows={3}
        maxLength={MAX_TEXT}
        value={value}
        onChange={(e) => onProfile(setText(profile, id, e.target.value))}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
      />
      <p className="text-[11px] text-slate-500">{hint}</p>
    </div>
  );
}

/** Wording the clinic can change in prescription messages and invoices. */
export default function TextTemplates({ profile, onProfile }) {
  return (
    <div className="rounded-xl border border-rule bg-white p-4 text-xs space-y-4" data-testid="text-templates">
      <div>
        <div className="font-bold text-slate-800">Message and print wording</div>
        <p className="text-slate-500 mt-0.5">Leave a box empty to use the standard wording.</p>
      </div>
      <Block id="rxAdvice" title="Care advice on prescriptions" profile={profile} onProfile={onProfile}
        placeholder={RX_ADVICE_DEFAULT.join("\n")}
        hint="One line per piece of advice, up to 8 lines. Sent with the WhatsApp prescription." />
      <Block id="invoiceFooter" title="Invoice and receipt footer" profile={profile} onProfile={onProfile}
        placeholder="e.g. Thank you for visiting. Review us on Google."
        hint="Printed above the standard GST line on every invoice and receipt." />
    </div>
  );
}
