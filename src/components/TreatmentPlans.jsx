import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Send, Printer, Check, X, Link2, RefreshCw } from "lucide-react";
import { TAX_CATEGORIES, formatINR } from "../billing.js";
import { applyFee, sortedFees } from "../fees.js";
import { whatsappLink, hasWhatsAppConsent } from "../reminders.js";
import { askAi, LANGUAGE_WORD } from "../aiClient.js";
import { languageOf } from "../messageLanguage.js";
import {
  MAX_PLAN_ITEMS, validatePlan, createPlan, planTotals, approvePlan, declinePlan, canBill,
  buildPlanMessage, buildPlanHtml, suggestPlanItems,
  newShareToken, buildShareDoc, shareUrl, buildShareMessage, applyShareDecision,
} from "../plans.js";

const uid = (p) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const blankId = () => uid("PI");
const blankItem = () => ({ id: uid("PI"), description: "", tooth: "", amount: "", taxCategory: "therapeutic" });
const blankDraft = () => ({ title: "", items: [blankItem()], discount: "", notes: "" });

const STATUS_STYLE = {
  Proposed: "bg-amber-50 text-amber-700 border-amber-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Declined: "bg-slate-100 text-slate-600 border-rule",
  Billed: "bg-blue-50 text-blue-700 border-blue-200",
};

export default function TreatmentPlans({ patient, practiceProfile, onChange, onBill, showToast, clinicId, shareApi }) {
  const plans = patient.plans || [];
  const [draft, setDraft] = useState(null);
  const [busyId, setBusyId] = useState("");
  const [explain, setExplain] = useState(null);
  const plansRef = useRef(plans);
  plansRef.current = plans;

  // Pick up answers patients gave through their link.
  const checkAnswers = async (quiet = true) => {
    if (!shareApi?.enabled) return;
    const waiting = plansRef.current.filter((p) => p.shareToken && p.status === "Proposed");
    if (!waiting.length) {
      if (!quiet) showToast("No plans are waiting for an answer");
      return;
    }
    let changed = false;
    const next = [...plansRef.current];
    for (const plan of waiting) {
      try {
        const share = await shareApi.fetch(plan.shareToken);
        const updated = applyShareDecision(plan, share);
        if (updated !== plan) {
          next[next.findIndex((p) => p.id === plan.id)] = updated;
          changed = true;
          showToast(`${patient.name} ${updated.status === "Approved" ? "approved" : "declined"} "${plan.title}"`);
        }
      } catch {
        if (!quiet) showToast("Could not check for answers. Try again when you are online.");
        return;
      }
    }
    if (changed) onChange(next);
    else if (!quiet) showToast("No answer yet");
  };

  useEffect(() => {
    checkAnswers(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient.id]);

  const linkFor = (plan) => shareUrl(window.location.origin, plan.shareToken);

  const sendLink = async (plan) => {
    if (!shareApi?.enabled) return showToast(shareApi?.reason || "Approval links need you to be signed in and online");
    setBusyId(plan.id);
    try {
      let current = plan;
      if (!plan.shareToken) {
        const token = newShareToken();
        await shareApi.create(token, buildShareDoc({ plan, patient, profile: practiceProfile, clinicId }));
        current = { ...plan, shareToken: token };
        onChange(plansRef.current.map((p) => (p.id === plan.id ? current : p)));
      }
      const url = linkFor(current);
      const wa = hasWhatsAppConsent(patient) ? whatsappLink(patient.phone, buildShareMessage(current, patient, practiceProfile, url)) : "";
      if (wa) {
        window.open(wa, "_blank", "noopener,noreferrer");
      } else {
        try {
          await navigator.clipboard.writeText(url);
          showToast("Link copied. Send it to the patient.");
        } catch {
          showToast(url);
        }
      }
    } catch {
      showToast("Could not create the link. Check your connection and try again.");
    } finally {
      setBusyId("");
    }
  };

  const copyLink = async (plan) => {
    try {
      await navigator.clipboard.writeText(linkFor(plan));
      showToast("Link copied");
    } catch {
      showToast(linkFor(plan));
    }
  };

  const removePlan = (plan) => {
    if (plan.shareToken && shareApi?.enabled) shareApi.remove(plan.shareToken).catch(() => {});
    save(plans.filter((p) => p.id !== plan.id));
  };

  const save = (next) => onChange(next);
  const replace = (plan) => save(plans.map((p) => (p.id === plan.id ? plan : p)));

  const submit = (e) => {
    e.preventDefault();
    const problem = validatePlan(draft);
    if (problem) return showToast(problem);
    save([createPlan({ id: uid("PLAN"), ...draft }), ...plans]);
    setDraft(null);
    showToast("Treatment plan saved");
  };

  const send = (plan) => {
    if (!hasWhatsAppConsent(patient)) return showToast("This patient has opted out of WhatsApp messages");
    const link = whatsappLink(patient.phone, buildPlanMessage(plan, patient, practiceProfile));
    if (!link) return showToast("Add a valid mobile number to send on WhatsApp");
    window.open(link, "_blank", "noopener,noreferrer");
  };

  const explainPlan = async (plan) => {
    setExplain({ planId: plan.id, loading: true, text: "" });
    try {
      const { text } = await askAi({ task: "plan_explain", language: LANGUAGE_WORD[languageOf(patient)], items: plan.items });
      setExplain({ planId: plan.id, loading: false, text });
    } catch (error) {
      setExplain(null);
      showToast(error.message || "Meridee is not available right now.");
    }
  };

  const sendExplanation = () => {
    if (!hasWhatsAppConsent(patient)) return showToast("This patient has opted out of WhatsApp messages");
    const link = whatsappLink(patient.phone, explain.text);
    if (!link) return showToast("Add a valid mobile number to send on WhatsApp");
    window.open(link, "_blank", "noopener,noreferrer");
  };

  const print = (plan) => {
    const win = window.open("", "_blank");
    if (!win) return showToast("Allow pop-ups to print the estimate");
    win.document.write(buildPlanHtml(plan, patient, practiceProfile));
    win.document.close();
  };

  const setItem = (id, changes) =>
    setDraft({ ...draft, items: draft.items.map((x) => (x.id === id ? { ...x, ...changes } : x)) });

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold uppercase text-slate-800 tracking-wider">Treatment Plans &amp; Estimates</div>
        {!draft && (
          <button
            type="button"
            onClick={() => setDraft(blankDraft())}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1d4ed8] hover:bg-blue-800 text-white inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> New plan
          </button>
        )}
      </div>

      {draft && (
        <form onSubmit={submit} className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 space-y-3">
          <input
            aria-label="Plan title"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="Plan title, e.g. Full mouth rehabilitation"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
          />
          <datalist id="plan-fee-options">{sortedFees(practiceProfile?.fees).map((f) => <option key={f.id} value={f.name} />)}</datalist>
          {draft.items.map((it, i) => (
            <div key={it.id} className="grid grid-cols-2 sm:grid-cols-[2fr_0.7fr_1fr_1.3fr_auto] gap-2 items-center">
              <input
                aria-label={`Plan item ${i + 1} treatment`}
                value={it.description}
                list="plan-fee-options"
                onChange={(e) => setDraft({ ...draft, items: draft.items.map((x) => (x.id === it.id ? applyFee(x, practiceProfile?.fees, e.target.value) : x)) })}
                placeholder="Treatment"
                className="col-span-2 sm:col-span-1 px-3 py-2 border border-slate-300 rounded-lg bg-white"
              />
              <input
                aria-label={`Plan item ${i + 1} tooth`}
                value={it.tooth}
                onChange={(e) => setItem(it.id, { tooth: e.target.value })}
                placeholder="Tooth, e.g. 16"
                inputMode="numeric"
                className="px-3 py-2 border border-slate-300 rounded-lg bg-white"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                aria-label={`Plan item ${i + 1} amount`}
                value={it.amount}
                onChange={(e) => setItem(it.id, { amount: e.target.value })}
                placeholder="₹ estimate"
                className="px-3 py-2 border border-slate-300 rounded-lg bg-white font-bold"
              />
              <select
                aria-label={`Plan item ${i + 1} tax category`}
                value={it.taxCategory}
                onChange={(e) => setItem(it.id, { taxCategory: e.target.value })}
                className="px-2 py-2 border border-slate-300 rounded-lg bg-white"
              >
                {TAX_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
              {draft.items.length > 1 ? (
                <button
                  type="button"
                  aria-label={`Remove plan item ${i + 1}`}
                  onClick={() => setDraft({ ...draft, items: draft.items.filter((x) => x.id !== it.id) })}
                  className="p-1.5 text-slate-500 hover:text-rose-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              ) : (
                <span className="w-7" />
              )}
            </div>
          ))}
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {draft.items.length < MAX_PLAN_ITEMS && (
              <button
                type="button"
                onClick={() => setDraft({ ...draft, items: [...draft.items, blankItem()] })}
                className="text-xs font-bold text-blue-700 inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add treatment
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                const found = suggestPlanItems(patient.toothConditions, blankId);
                if (!found.length) return showToast("Nothing on the chart needs treatment yet. Mark caries, fractures, calculus or missing teeth first.");
                const used = new Set(draft.items.filter((x) => x.tooth || x.description).map((x) => `${x.description}|${x.tooth}`));
                const fresh = found.filter((x) => !used.has(`${x.description}|${x.tooth}`));
                const kept = draft.items.filter((x) => x.description || x.tooth || x.amount);
                setDraft({ ...draft, items: [...kept, ...fresh].slice(0, MAX_PLAN_ITEMS) });
                showToast("Added treatments from the chart. Enter an amount for each.");
              }}
              className="text-xs font-bold text-blue-700 inline-flex items-center gap-1"
            >
              Suggest from chart
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min="0"
              step="0.01"
              aria-label="Plan discount"
              value={draft.discount}
              onChange={(e) => setDraft({ ...draft, discount: e.target.value })}
              placeholder="Discount ₹ (optional)"
              className="px-3 py-2 border border-slate-300 rounded-lg bg-white"
            />
            <input
              aria-label="Plan notes"
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              placeholder="Notes for the patient (optional)"
              className="px-3 py-2 border border-slate-300 rounded-lg bg-white"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="font-bold text-slate-900">
              Estimated total: ₹{formatINR(planTotals({ items: draft.items.filter((x) => parseFloat(x.amount) > 0), discount: draft.discount }).totalP)}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setDraft(null)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100">
                Cancel
              </button>
              <button type="submit" className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1d4ed8] text-white">
                Save plan
              </button>
            </div>
          </div>
        </form>
      )}

      {!plans.length && !draft && (
        <div className="text-slate-500 text-xs border border-dashed border-slate-300 rounded-xl p-6 text-center">
          No treatment plans yet. Create an estimate, share it with the patient, and bill it once approved.
        </div>
      )}

      {plans.map((plan) => {
        const t = planTotals(plan);
        return (
          <div key={plan.id} className="rounded-xl border border-rule p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-bold text-slate-900">{plan.title}</div>
                <div className="text-xs text-slate-500">
                  {plan.createdAt}
                  {plan.decidedAt && ` · ${plan.status} on ${plan.decidedAt}${plan.decidedBy ? ` by ${plan.decidedBy}` : ""}`}
                  {plan.invoiceId && ` · ${plan.invoiceId}`}
                </div>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLE[plan.status]}`}>{plan.status}</span>
            </div>
            {plan.status === "Proposed" && plan.shareToken && (
              <div className="text-xs text-blue-800 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5">
                Link sent. Waiting for the patient's answer.
              </div>
            )}
            <ul className="text-slate-700 space-y-0.5">
              {t.lines.map((l, i) => (
                <li key={plan.items[i].id} className="flex justify-between">
                  <span>{l.description}{plan.items[i].tooth ? ` (tooth ${plan.items[i].tooth})` : ""}</span>
                  <span>₹{formatINR(l.amountP)}</span>
                </li>
              ))}
              <li className="flex justify-between font-bold border-t border-slate-100 pt-1">
                <span>Estimated total</span><span>₹{formatINR(t.totalP)}</span>
              </li>
            </ul>
            {explain && explain.planId === plan.id && !explain.loading && (
              <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3 space-y-2" data-testid="plan-explanation">
                <textarea aria-label="AI explanation for the patient" rows="6" value={explain.text} onChange={(e) => setExplain({ ...explain, text: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs" />
                <p className="text-[11px] text-slate-500">Meridee draft in the patient's language. Read and edit it before sending.</p>
                <div className="flex gap-2">
                  <button type="button" onClick={sendExplanation} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 text-white">Send on WhatsApp</button>
                  <button type="button" onClick={() => setExplain(null)} className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700">Close</button>
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              <button type="button" onClick={() => send(plan)} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 text-white inline-flex items-center gap-1">
                <Send className="w-3 h-3" /> WhatsApp estimate
              </button>
              <button type="button" onClick={() => print(plan)} className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700 inline-flex items-center gap-1">
                <Printer className="w-3 h-3" /> Print
              </button>
              {practiceProfile?.aiEnabled && (
                <button type="button" disabled={explain && explain.planId === plan.id && explain.loading} onClick={() => explainPlan(plan)} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 border border-blue-200 text-blue-800 disabled:opacity-60">
                  {explain && explain.planId === plan.id && explain.loading ? "Writing..." : "Explain for patient (Meridee)"}
                </button>
              )}
              {plan.status === "Proposed" && (
                <button
                  type="button"
                  disabled={busyId === plan.id}
                  onClick={() => sendLink(plan)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 border border-blue-200 text-blue-800 inline-flex items-center gap-1 disabled:opacity-60"
                >
                  <Link2 className="w-3 h-3" /> {plan.shareToken ? "Send link again" : "Send approval link"}
                </button>
              )}
              {plan.status === "Proposed" && plan.shareToken && (
                <>
                  <button type="button" onClick={() => copyLink(plan)} className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700">
                    Copy link
                  </button>
                  <button type="button" onClick={() => checkAnswers(false)} className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700 inline-flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" /> Check for answer
                  </button>
                </>
              )}
              {(plan.status === "Proposed" || plan.status === "Declined") && (
                <button type="button" onClick={() => replace(approvePlan(plan, patient.name))} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#1d4ed8] text-white inline-flex items-center gap-1">
                  <Check className="w-3 h-3" /> Mark approved
                </button>
              )}
              {(plan.status === "Proposed" || plan.status === "Approved") && (
                <button type="button" onClick={() => replace(declinePlan(plan))} className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700 inline-flex items-center gap-1">
                  <X className="w-3 h-3" /> Declined
                </button>
              )}
              {canBill(plan) && onBill && (
                <button type="button" onClick={() => onBill(plan)} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 text-white">
                  Create invoice
                </button>
              )}
              {plan.status !== "Billed" && (
                <button
                  type="button"
                  aria-label={`Delete plan ${plan.title}`}
                  onClick={() => removePlan(plan)}
                  className="ml-auto p-1.5 text-slate-500 hover:text-rose-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
