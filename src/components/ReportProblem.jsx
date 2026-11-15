import React, { useState } from "react";
import { TOPICS, supportText, supportLinks } from "../supportMessage.js";
import { copyText } from "../copyText.js";

const field = "w-full px-3 py-2 border border-rule rounded-lg text-xs";

/** Settings / Practice Profile: write what went wrong, then send it to the founders on WhatsApp or email. */
export default function ReportProblem({ clinic = "", screen = "" }) {
  const [topic, setTopic] = useState("problem");
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const message = supportText({ topic, text, clinic, screen });
  const links = supportLinks(message);
  return (
    <div className="rounded-xl border border-rule p-3 space-y-2" data-testid="report-problem">
      <h3 className="text-xs font-bold text-slate-900">Send us a message</h3>
      <label className="block text-xs text-slate-700">What is it about?
        <select value={topic} onChange={(e) => setTopic(e.target.value)} className={`${field} mt-1`}>
          {TOPICS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </label>
      <label className="block text-xs text-slate-700">Tell us what happened
        <textarea rows={3} maxLength={800} value={text} onChange={(e) => setText(e.target.value)} className={`${field} mt-1`} />
      </label>
      <p className="text-[11px] text-slate-500">We add your clinic name, phone type and the time so we can find the problem. Please do not write patients' names or details here.</p>
      <div className="flex flex-wrap gap-2">
        <a href={links.whatsapp} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold">Send on WhatsApp</a>
        <a href={links.email} className="px-3 py-1.5 rounded-lg border border-rule text-xs font-semibold text-slate-800">Send by email</a>
        <button type="button" onClick={() => copyText(message).then((ok) => { setCopied(ok); })} className="px-3 py-1.5 rounded-lg border border-rule text-xs font-semibold text-slate-800">{copied ? "Copied" : "Copy message"}</button>
      </div>
    </div>
  );
}
