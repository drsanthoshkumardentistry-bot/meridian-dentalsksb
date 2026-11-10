import React, { useState } from "react";
import SignaturePad from "./SignaturePad.jsx";
import { TEMPLATES, RELATIONS, fillTemplate, validateConsent, createConsent, signerLine } from "../consent.js";

const field = "w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-aqua-400";
const label = "block text-xs font-semibold text-slate-600 mb-1";

/** Treatment consent: pick a form, check the wording, have it signed on screen, keep it on the patient's record. */
export default function ConsentForms({ patient, profile = {}, newId, onChange, onSigned, onPrint, canWrite = true }) {
  const consents = patient.consents || [];
  const ctx = (teeth) => ({ patient: patient.name, teeth, doctor: profile.drName, clinic: profile.name });
  const start = (templateId = "general", teeth = "") => ({
    templateId, title: TEMPLATES.find((t) => t.id === templateId).title, teeth, text: fillTemplate(templateId, ctx(teeth)),
    signerRole: "patient", signerName: patient.name || "", relation: "", witness: "", signature: "", understood: false,
  });
  const [form, setForm] = useState(start());
  const [padKey, setPadKey] = useState(0);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const pickTemplate = (e) => setForm({ ...start(e.target.value, form.teeth), signerRole: form.signerRole, signerName: form.signerName, relation: form.relation, witness: form.witness });
  const changeTeeth = (e) => {
    const teeth = e.target.value;
    // Re-fill the wording only while it is still the unedited template text.
    const untouched = form.text === fillTemplate(form.templateId, ctx(form.teeth));
    setForm({ ...form, teeth, text: untouched ? fillTemplate(form.templateId, ctx(teeth)) : form.text });
  };
  const role = (r) => setForm({ ...form, signerRole: r, signerName: r === "patient" ? patient.name || "" : "", relation: "" });

  const save = (e) => {
    e.preventDefault();
    const err = validateConsent(form, consents.length);
    if (err) { setError(err); return; }
    setError("");
    const consent = createConsent(form, newId(), { doctor: profile.drName, clinic: profile.name });
    onChange([consent, ...consents]);
    onSigned?.(consent);
    setForm(start(form.templateId === "general" ? "general" : form.templateId));
    setPadKey((k) => k + 1);
  };

  return (
    <div className="space-y-4" data-testid="consent-forms">
      {canWrite && (
        <form onSubmit={save} noValidate aria-label="New consent" className="bg-white border border-rule rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Get a signed consent</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label htmlFor="consent-type" className={label}>Consent for</label>
              <select id="consent-type" className={field} value={form.templateId} onChange={pickTemplate}>{TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select></div>
            <div><label htmlFor="consent-teeth" className={label}>Teeth (optional)</label>
              <input id="consent-teeth" className={field} value={form.teeth} onChange={changeTeeth} placeholder="e.g. 36, 37" /></div>
          </div>
          <div>
            <label htmlFor="consent-text" className={label}>Wording the patient will sign (you can edit it)</label>
            <textarea id="consent-text" rows={9} className={field} maxLength={4000} value={form.text} onChange={set("text")} />
            <p className="text-[11px] text-slate-500 mt-1">This is a general starting point, not legal advice. Edit it to match your clinic's practice and have it reviewed by your lawyer or dental council guidance. Read it out in the patient's own language if they prefer.</p>
          </div>

          <fieldset className="space-y-2">
            <legend className={label}>Who is signing</legend>
            <div role="radiogroup" aria-label="Who is signing" className="flex gap-2">
              {[["patient", "The patient"], ["guardian", "A parent or guardian"]].map(([id, text]) => (
                <button key={id} type="button" role="radio" aria-checked={form.signerRole === id} onClick={() => role(id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${form.signerRole === id ? "bg-ink text-white border-ink" : "bg-white text-slate-700 border-rule hover:bg-enamel"}`}>{text}</button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><label htmlFor="consent-signer" className={label}>{form.signerRole === "guardian" ? "Guardian's name" : "Patient's name"}</label>
                <input id="consent-signer" className={field} maxLength={80} value={form.signerName} onChange={set("signerName")} /></div>
              {form.signerRole === "guardian" && (
                <div><label htmlFor="consent-relation" className={label}>Relationship to the patient</label>
                  <select id="consent-relation" className={field} value={form.relation} onChange={set("relation")}><option value="">Choose</option>{RELATIONS.map((r) => <option key={r}>{r}</option>)}</select></div>
              )}
              <div><label htmlFor="consent-witness" className={label}>Witness from the clinic (optional)</label>
                <input id="consent-witness" className={field} maxLength={80} value={form.witness} onChange={set("witness")} /></div>
            </div>
          </fieldset>

          <SignaturePad resetKey={padKey} label={form.signerRole === "guardian" ? "Guardian's signature" : "Patient's signature"} onChange={(signature) => setForm((f) => ({ ...f, signature }))} />

          <label className="flex items-start gap-2 text-xs text-slate-700 bg-enamel border border-rule rounded-lg p-3">
            <input type="checkbox" className="mt-0.5" checked={form.understood} onChange={(e) => setForm({ ...form, understood: e.target.checked })} />
            <span>The treatment, risks and other options were explained, in a language the patient understands, and they agree to go ahead.</span>
          </label>
          {error && <p role="alert" className="text-xs text-rose-700 font-medium">{error}</p>}
          <button type="submit" className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold">Save signed consent</button>
        </form>
      )}

      <section aria-label="Signed consents">
        <h3 className="text-sm font-bold text-slate-900 mb-2">Signed consents ({consents.length})</h3>
        {consents.length === 0 ? <p className="text-sm text-slate-500">No signed consent on file for this patient yet.</p> : (
          <ul className="space-y-2">
            {consents.map((c) => (
              <li key={c.id} className="bg-white border border-rule rounded-xl p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-slate-900">{c.title}{c.teeth ? ` · ${c.teeth}` : ""}</div>
                    <div className="text-xs text-slate-600">Signed by {signerLine(c)} · {new Date(c.signedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}{c.doctor ? ` · ${c.doctor}` : ""}</div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setOpen(open === c.id ? null : c.id)} aria-expanded={open === c.id} className="px-3 py-1.5 rounded border border-rule text-xs font-semibold hover:bg-enamel">{open === c.id ? "Hide" : "View"}</button>
                    <button type="button" onClick={() => onPrint(c)} className="px-3 py-1.5 rounded border border-rule text-xs font-semibold hover:bg-enamel">Print</button>
                  </div>
                </div>
                {open === c.id && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs whitespace-pre-wrap text-slate-700 bg-enamel border border-rule rounded-lg p-3">{c.text}</p>
                    <img src={c.signature} alt={`Signature of ${c.signerName}`} className="h-16 border-b border-slate-400" />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
