/* Day/month/year helpers for the Indian date field. Dates are stored as yyyy-mm-dd, shown as dd/mm/yyyy. */

/** "2006-01-29" -> "29/01/2006". Anything else -> "". */
export const isoToDmy = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
};

/** Keeps digits only and adds the slashes as the user types: "29012006" -> "29/01/2006". */
export const maskDmy = (raw) => {
  const d = String(raw || "").replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
};

/** "29/01/2006" -> "2006-01-29", or "" when it is not a real calendar date. */
export const dmyToIso = (text) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(text || ""));
  if (!m) return "";
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (y < 1900) return "";
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return "";
  return `${m[3]}-${m[2]}-${m[1]}`;
};
