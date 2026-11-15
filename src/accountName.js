/** Name to show on shared material: the clinic name if set, otherwise the signed-in account's name, then the e-mail's first part. */
export const shareName = (clinicName, user) => {
  const pick = (v) => String(v == null ? "" : v).trim();
  return pick(clinicName) || pick(user && user.displayName) || pick(String((user && user.email) || "").split("@")[0]);
};
