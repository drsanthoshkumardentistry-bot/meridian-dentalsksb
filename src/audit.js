export const AUDIT_LABELS = {
  "patient.add": "Registered patient",
  "patient.delete": "Deleted patient",
  "appointment.add": "Booked appointment",
  "appointment.status": "Changed appointment status",
  "appointment.delete": "Deleted appointment",
  "invoice.add": "Created invoice",
  "payment.add": "Recorded payment",
  "booking.confirm": "Confirmed online booking",
  "booking.decline": "Declined online booking",
  "team.invite": "Invited team login",
  "team.update": "Changed team login",
  "team.remove": "Removed team login",
};

const clip = (v, n) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);

/** One line of history: who did what, to what, when. Never contains clinical notes. */
export const buildAuditEntry = ({ actor = {}, action, subject = "", detail = "" }, id, now = new Date()) => ({
  id, at: now.toISOString(),
  actorUid: String(actor.uid || ""), actorEmail: clip(actor.email, 100), actorRole: clip(actor.role || "owner", 20),
  action: AUDIT_LABELS[action] ? action : "other", subject: clip(subject, 80), detail: clip(detail, 160),
});

export const auditText = (e) => `${AUDIT_LABELS[e.action] || "Other change"}: ${e.subject || "-"}${e.detail ? ` (${e.detail})` : ""}`;

export const auditView = (entries = [], { query = "", actor = "all" } = {}, limit = 50) => {
  const q = query.trim().toLowerCase();
  return entries
    .filter((e) => (actor === "all" || e.actorEmail === actor) && (!q || `${auditText(e)} ${e.actorEmail}`.toLowerCase().includes(q)))
    .sort((a, b) => String(b.at).localeCompare(String(a.at)))
    .slice(0, limit);
};

export const auditActors = (entries = []) => [...new Set(entries.map((e) => e.actorEmail).filter(Boolean))].sort();
