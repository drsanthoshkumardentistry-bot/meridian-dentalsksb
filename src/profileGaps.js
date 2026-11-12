// Which clinic-profile fields are still empty (the three the banner asks for).
export const profileGaps = (p = {}) => {
  const has = (v) => typeof v === "string" && v.trim() !== "";
  const gaps = [];
  if (!has(p.drName)) gaps.push("doctor name");
  if (!has(p.state)) gaps.push("state");
  if (!has(p.councilRegNumber)) gaps.push("Dental Council registration number");
  return gaps;
};
