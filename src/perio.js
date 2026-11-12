// Periodontal chart: six probing depths per tooth, bleeding and mobility. A record of what was measured, not a diagnosis.
export const UPPER = ["18", "17", "16", "15", "14", "13", "12", "11", "21", "22", "23", "24", "25", "26", "27", "28"];
export const LOWER = ["48", "47", "46", "45", "44", "43", "42", "41", "31", "32", "33", "34", "35", "36", "37", "38"];
export const TEETH = [...UPPER, ...LOWER];
export const SITES = ["DB", "B", "MB", "DL", "L", "ML"]; // distal, mid, mesial on the cheek side, then the tongue/palate side
export const MAX_EXAMS = 10;
export const MAX_DEPTH = 15;

export const newExam = (id, date) => ({ id, date, teeth: {} });

const cleanDepth = (v) => {
  if (v === "" || v == null) return null;
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 0 && n <= MAX_DEPTH ? n : null;
};

/** Returns a new exam with one probing depth set (null clears it). */
export const setDepth = (exam, tooth, siteIndex, value) => {
  if (!TEETH.includes(String(tooth)) || siteIndex < 0 || siteIndex > 5) return exam;
  const cur = exam.teeth[tooth] || {};
  const pd = Array.from({ length: 6 }, (_, i) => (cur.pd && cur.pd[i] != null ? cur.pd[i] : null));
  pd[siteIndex] = cleanDepth(value);
  return { ...exam, teeth: { ...exam.teeth, [tooth]: { ...cur, pd } } };
};
export const toggleBop = (exam, tooth) => {
  if (!TEETH.includes(String(tooth))) return exam;
  const cur = exam.teeth[tooth] || {};
  return { ...exam, teeth: { ...exam.teeth, [tooth]: { ...cur, bop: !cur.bop } } };
};
export const setMobility = (exam, tooth, grade) => {
  if (!TEETH.includes(String(tooth))) return exam;
  const g = Math.round(Number(grade));
  const cur = exam.teeth[tooth] || {};
  return { ...exam, teeth: { ...exam.teeth, [tooth]: { ...cur, mob: Number.isFinite(g) && g >= 1 && g <= 3 ? g : 0 } } };
};

const sites = (exam) => Object.entries(exam.teeth || {}).flatMap(([tooth, t]) => (t.pd || []).map((d, i) => ({ tooth, i, d })).filter((s) => s.d != null));

export const summarize = (exam) => {
  const all = sites(exam);
  const teethWithData = Object.entries(exam.teeth || {}).filter(([, t]) => (t.pd || []).some((d) => d != null));
  const bop = teethWithData.filter(([, t]) => t.bop).length;
  const deepest = all.reduce((m, s) => (s.d > (m ? m.d : -1) ? s : m), null);
  return {
    sites: all.length,
    teeth: teethWithData.length,
    sites4: all.filter((s) => s.d >= 4).length,
    sites6: all.filter((s) => s.d >= 6).length,
    pct4: all.length ? Math.round((all.filter((s) => s.d >= 4).length / all.length) * 100) : 0,
    bopTeeth: bop,
    bopPct: teethWithData.length ? Math.round((bop / teethWithData.length) * 100) : 0,
    mobile: Object.values(exam.teeth || {}).filter((t) => t.mob > 0).length,
    meanDepth: all.length ? Math.round((all.reduce((s, x) => s + x.d, 0) / all.length) * 10) / 10 : 0,
    deepest: deepest ? { tooth: deepest.tooth, site: SITES[deepest.i], depth: deepest.d } : null,
  };
};

/** Compares two exams on the sites both recorded. Fewer mm = better. */
export const compareExams = (before, after) => {
  let better = 0, worse = 0, same = 0;
  for (const tooth of TEETH) {
    const a = (before.teeth[tooth] || {}).pd || [], b = (after.teeth[tooth] || {}).pd || [];
    for (let i = 0; i < 6; i += 1) {
      if (a[i] == null || b[i] == null) continue;
      if (b[i] < a[i]) better += 1; else if (b[i] > a[i]) worse += 1; else same += 1;
    }
  }
  return { better, worse, same };
};

/** True when the exam holds any reading at all. */
export const hasReadings = (exam) => Object.values(exam.teeth || {}).some((t) => (t.pd || []).some((d) => d != null) || t.bop || t.mob > 0);

/** Newest first, replacing an exam with the same id, capped. */
export const saveExam = (exams = [], exam) => {
  const rest = (Array.isArray(exams) ? exams : []).filter((e) => e.id !== exam.id);
  return [exam, ...rest].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)).slice(0, MAX_EXAMS);
};
