// Who can do what. The same matrix is enforced by firestore.rules (collection level);
// keep the two in step. Branch limits are applied in the app only.
export const ROLES = ["manager", "dentist", "receptionist"];
export const ROLE_LABEL = { owner: "Owner", manager: "Manager", dentist: "Dentist", receptionist: "Receptionist" };
export const ROLE_NOTE = {
  manager: "Everything except inviting or removing logins",
  dentist: "Patients, charts, diary and queue. Can view totals but not edit bills",
  receptionist: "Patients, diary, queue, billing and online booking",
};

const ACCESS = {
  owner: { patients: "rw", appointments: "rw", queue: "rw", invoices: "rw", inventory: "rw", employees: "rw", profile: "rw", leads: "rw", memberships: "rw" },
  manager: { patients: "rw", appointments: "rw", queue: "rw", invoices: "rw", inventory: "rw", employees: "rw", profile: "rw", leads: "rw", memberships: "rw" },
  dentist: { patients: "rw", appointments: "rw", queue: "rw", invoices: "r", inventory: "r", employees: "", profile: "r" },
  receptionist: { patients: "rw", appointments: "rw", queue: "rw", invoices: "rw", inventory: "r", employees: "", profile: "r", leads: "rw", memberships: "rw" },
};

export const NAV_BY_ROLE = {
  owner: null, // everything
  manager: ["Dashboard", "Appointments Diary", "Patients & Odontogram", "OPG & Diagnosis Studio", "Billing & Invoices", "Memberships & Leads", "Reports", "Stock Maintenance", "Employee Roles & Roster", "Practice Profile", "Settings"],
  dentist: ["Dashboard", "Appointments Diary", "Patients & Odontogram", "OPG & Diagnosis Studio"],
  receptionist: ["Dashboard", "Appointments Diary", "Patients & Odontogram", "Billing & Invoices", "Memberships & Leads"],
};

export const accessOf = (role, collection) => (ACCESS[role] || {})[collection] || "";
export const canRead = (role, collection) => accessOf(role, collection) !== "";
export const canWrite = (role, collection) => accessOf(role, collection) === "rw";
export const navFor = (role, items) => {
  const allowed = NAV_BY_ROLE[role];
  return allowed === null || allowed === undefined ? (role === "owner" ? items : []) : items.filter((i) => allowed.includes(i.label));
};
export const firstScreen = (role) => (NAV_BY_ROLE[role] && !NAV_BY_ROLE[role].includes("Patients & Odontogram") ? NAV_BY_ROLE[role][0] : "Patients & Odontogram");

/** Owners are never restricted; members see only their assigned branches (empty list = all). */
export const branchScope = (member) => (member && Array.isArray(member.branchIds) && member.branchIds.length ? member.branchIds : null);
