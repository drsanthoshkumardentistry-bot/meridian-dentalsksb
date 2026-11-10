import React, { useState } from "react";
import { SPECIALTIES } from "../connect/rules.js";
import { POST_TYPES, LIMITS, POLL_MAX, validatePost, warningAdvice, typeLabel, initials } from "../connect/feed.js";
import { dateKey } from "../reminders.js";
import { MAX_IMAGES, compressImage } from "../connect/images.js";

const field = "w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-aqua-400";

/**
 * Write a new post, or edit one of your own (pass `existing`). `onSubmit` receives the checked post
 * and must return a promise; it rejects when saving fails.
 */
export default function Composer({ me, existing = null, onSubmit, onCancel }) {
  const editing = Boolean(existing);
  const blank = { type: "case", title: "", body: "", tag: "", eventDate: "", venue: "", deidentified: false, options: ["", ""], images: [] };
  const [form, setForm] = useState(editing
    ? { type: existing.type, title: existing.title, body: existing.body, tag: existing.tag || "", eventDate: existing.eventDate || "", venue: existing.venue || "", deidentified: false, options: existing.pollOptions || ["", ""], images: [] }
    : blank);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(editing);
  const pick = async (e) => {
    const files = [...(e.target.files || [])];
    e.target.value = "";
    setError("");
    for (const file of files.slice(0, MAX_IMAGES - form.images.length)) {
      try {
        const url = await compressImage(file);
        setForm((f) => (f.images.length < MAX_IMAGES ? { ...f, images: [...f.images, url] } : f));
      } catch (err) { setError(err.message || "Could not use that photo."); }
    }
  };
  const needsConfirm = form.type === "case" || form.type === "question";

  const submit = async (e) => {
    e.preventDefault();
    const v = validatePost(form, new Date(), existing);
    if (!v.ok) { setError(v.error); return; }
    if (v.warnings.length && !window.confirm(`${warningAdvice(v.warnings[0])} Post anyway?`)) return;
    setBusy(true);
    setError("");
    try {
      await onSubmit(v.post, v.images);
      if (!editing) { setForm(blank); setOpen(false); }
    } catch {
      setError(editing ? "Could not save your changes. Check your connection and try again." : "Could not post. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="w-full text-left bg-white border border-rule rounded-xl px-4 py-3.5 text-sm text-slate-500 hover:border-aqua-400 flex items-center gap-3">
        <span aria-hidden="true" className="w-9 h-9 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center text-xs">{initials(me.fullName)}</span>
        Start a discussion, ask peers or share a tip
      </button>
    );
  }
  return (
    <form onSubmit={submit} className="bg-white border border-rule rounded-xl p-4 space-y-3" noValidate aria-label={editing ? "Edit post" : "New post"}>
      {editing ? (
        <p className="text-xs font-semibold text-slate-600">Editing your {typeLabel(existing.type).toLowerCase()}</p>
      ) : (
        <div role="radiogroup" aria-label="Post type" className="flex flex-wrap gap-2">
          {POST_TYPES.map(([id, label]) => (
            <button key={id} type="button" role="radio" aria-checked={form.type === id} onClick={() => setForm({ ...form, type: id })}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${form.type === id ? "bg-ink text-white border-ink" : "bg-white text-slate-700 border-rule hover:bg-sky-50"}`}>{label}</button>
          ))}
        </div>
      )}
      <div>
        <label htmlFor="post-title" className="block text-xs font-semibold text-slate-600 mb-1">Title</label>
        <input id="post-title" className={field} maxLength={LIMITS.title} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={form.type === "event" ? "e.g. Hands-on CBCT reading workshop" : "e.g. Recurrent abscess after RCT in 46"} />
      </div>
      <div>
        <label htmlFor="post-body" className="block text-xs font-semibold text-slate-600 mb-1">{form.type === "poll" ? "Details (optional)" : "Details"}</label>
        <textarea id="post-body" rows={4} className={field} maxLength={LIMITS.body} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder={form.type === "case" ? "Age and sex, history, findings, what you tried, and what you want to know." : ""} />
        <div className="text-[11px] text-slate-400 text-right">{form.body.length}/{LIMITS.body}</div>
      </div>
      {form.type === "poll" && (
        <fieldset className="space-y-2">
          <legend className="block text-xs font-semibold text-slate-600 mb-1">Options (2 to {POLL_MAX}){editing ? ", fixed once posted" : ""}</legend>
          {form.options.map((o, i) => (
            <div key={i} className="flex gap-2">
              <input aria-label={`Option ${i + 1}`} className={field} maxLength={LIMITS.option} value={o} disabled={editing}
                onChange={(e) => setForm({ ...form, options: form.options.map((x, j) => (j === i ? e.target.value : x)) })} placeholder={`Option ${i + 1}`} />
              {!editing && form.options.length > 2 && <button type="button" aria-label={`Remove option ${i + 1}`} onClick={() => setForm({ ...form, options: form.options.filter((_, j) => j !== i) })} className="px-3 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100">Remove</button>}
            </div>
          ))}
          {!editing && form.options.length < POLL_MAX && <button type="button" onClick={() => setForm({ ...form, options: [...form.options, ""] })} className="text-xs font-bold text-brand-700 hover:underline">Add an option</button>}
        </fieldset>
      )}
      {form.type === "event" && (
        <div className="grid sm:grid-cols-2 gap-3">
          <div><label htmlFor="post-date" className="block text-xs font-semibold text-slate-600 mb-1">Event date</label>
            <input id="post-date" type="date" min={editing ? undefined : dateKey()} className={field} value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} /></div>
          <div><label htmlFor="post-venue" className="block text-xs font-semibold text-slate-600 mb-1">Place or platform</label>
            <input id="post-venue" className={field} maxLength={LIMITS.venue} value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="e.g. Coimbatore, or Zoom" /></div>
        </div>
      )}
      <div>
        <label htmlFor="post-tag" className="block text-xs font-semibold text-slate-600 mb-1">Topic (optional)</label>
        <select id="post-tag" className={field} value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })}>
          <option value="">No topic</option>
          {SPECIALTIES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
      </div>
      {form.type === "case" && !editing && (
        <div>
          <span className="block text-xs font-semibold text-slate-600 mb-1">Images (optional, up to {MAX_IMAGES})</span>
          <div className="flex flex-wrap gap-2 items-center">
            {form.images.map((src, i) => (
              <div key={i} className="relative">
                <img src={src} alt={`Attached image ${i + 1}`} className="h-20 w-20 object-cover rounded-lg border border-rule" />
                <button type="button" aria-label={`Remove image ${i + 1}`} onClick={() => setForm({ ...form, images: form.images.filter((_, j) => j !== i) })} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-ink text-white text-xs font-bold">×</button>
              </div>
            ))}
            {form.images.length < MAX_IMAGES && (
              <label className="h-20 w-20 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-center text-[11px] font-semibold text-slate-500 cursor-pointer hover:bg-enamel">
                Add image
                <input type="file" accept="image/*" multiple className="sr-only" aria-label="Add an image" onChange={pick} />
              </label>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Photos are shrunk before upload. Crop out faces, names and ID cards first; only radiographs and intra-oral photos belong here.</p>
        </div>
      )}
      {needsConfirm && (
        <label className="flex items-start gap-2 text-xs text-slate-700 bg-gold-50 border border-gold-500/40 rounded-lg p-3">
          <input type="checkbox" className="mt-0.5" checked={form.deidentified} onChange={(e) => setForm({ ...form, deidentified: e.target.checked })} />
          <span>I have removed the patient's name, phone number and anything else that could identify them. Any image I attach shows no face, name or ID.</span>
        </label>
      )}
      {error && <p role="alert" className="text-xs text-rose-600 font-medium">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={() => { setOpen(false); setError(""); onCancel?.(); }} className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
        <button type="submit" disabled={busy} className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold disabled:opacity-60">{busy ? (editing ? "Saving…" : "Posting…") : editing ? "Save changes" : "Post"}</button>
      </div>
    </form>
  );
}
