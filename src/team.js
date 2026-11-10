import { ROLES } from "./roles.js";

export const normalizeEmail = (e) => String(e || "").trim().toLowerCase();
const EMAIL = /^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/;

/** Membership is usable only once the person has accepted and the owner has not suspended it. */
export const isActiveMember = (m) => Boolean(m) && m.status === "active" && m.active === true;
export const isPendingInvite = (m) => Boolean(m) && m.status === "invited" && m.active === true;

export const validateInvite = ({ email, role, branchIds = [] }, existing = [], ownerEmail = "", allBranchIds = []) => {
  const e = normalizeEmail(email);
  if (!EMAIL.test(e)) return { ok: false, error: "Enter a valid email address" };
  if (e === normalizeEmail(ownerEmail)) return { ok: false, error: "That is your own login" };
  if (!ROLES.includes(role)) return { ok: false, error: "Choose a role" };
  if (existing.some((m) => normalizeEmail(m.email) === e)) return { ok: false, error: "This email already has a login. Change its role from the list" };
  if (branchIds.some((b) => !allBranchIds.includes(b))) return { ok: false, error: "Choose branches that exist" };
  return { ok: true, email: e, role, branchIds: [...new Set(branchIds)] };
};

export const buildInvite = (v, { clinicId, clinicName, ownerEmail }, now = new Date()) => ({
  email: v.email, clinicId, clinicName: String(clinicName || "").slice(0, 80), role: v.role, branchIds: v.branchIds,
  status: "invited", active: true, invitedBy: normalizeEmail(ownerEmail), invitedAt: now.toISOString(),
});

export const inviteMessage = (invite, origin) =>
  `Hello, you have been given a ${invite.role} login for ${invite.clinicName || "our clinic"} on MeriDent. ` +
  `Open ${String(origin).replace(/\/$/, "")}, sign in with ${invite.email}, and accept the invitation.`;
