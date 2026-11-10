// FDI two-digit tooth notation helpers. Pure functions, no UI.

const ORD = ["", "first", "second", "third"];

/** Describe an FDI tooth number such as 16 or 74. Returns null when the number is not a valid tooth. */
export const toothInfo = (num) => {
  const n = Number(num);
  if (!Number.isInteger(n)) return null;
  const quadrantDigit = Math.floor(n / 10);
  const pos = n % 10;
  const deciduous = quadrantDigit >= 5 && quadrantDigit <= 8;
  const permanent = quadrantDigit >= 1 && quadrantDigit <= 4;
  if (!deciduous && !permanent) return null;
  if (pos < 1 || pos > (deciduous ? 5 : 8)) return null;
  const q = deciduous ? quadrantDigit - 4 : quadrantDigit;
  const upper = q === 1 || q === 2;
  const right = q === 1 || q === 4;
  const quadrant = `${upper ? "Upper" : "Lower"} ${right ? "right" : "left"}`;

  let type;
  let ordinal;
  if (pos <= 2) {
    type = "incisor";
    ordinal = pos === 1 ? "central" : "lateral";
  } else if (pos === 3) {
    type = "canine";
    ordinal = "";
  } else if (deciduous) {
    type = "molar";
    ordinal = ORD[pos - 3];
  } else if (pos <= 5) {
    type = "premolar";
    ordinal = ORD[pos - 3];
  } else {
    type = "molar";
    ordinal = ORD[pos - 5];
  }
  const name = `${quadrant} ${[ordinal, deciduous ? `primary ${type}` : type].filter(Boolean).join(" ")}`;
  return { number: n, deciduous, upper, right, quadrant, type, name };
};

/** Group a { tooth: code } map into [{ code, teeth: [...] }] in palette order. */
export const groupFindings = (conditions = {}, palette = []) => {
  const byCode = {};
  Object.entries(conditions).forEach(([tooth, code]) => {
    (byCode[code] = byCode[code] || []).push(Number(tooth));
  });
  const order = palette.map((p) => p.id);
  return Object.keys(byCode)
    .sort((a, b) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    })
    .map((code) => ({ code, teeth: byCode[code].sort((a, b) => a - b) }));
};

/** Clinical colours per status: fill and stroke for the chart. */
export const STATUS_COLORS = {
  HLT: { fill: "#ffffff", stroke: "#9fb6e8" },
  CAR: { fill: "#fecaca", stroke: "#e11d48" },
  RES: { fill: "#bae6fd", stroke: "#0284c7" },
  RCT: { fill: "#e9d5ff", stroke: "#9333ea" },
  CRW: { fill: "#fde68a", stroke: "#d97706" },
  BRG: { fill: "#c7d2fe", stroke: "#4f46e5" },
  IMP: { fill: "#99f6e4", stroke: "#0d9488" },
  FRC: { fill: "#fecdd3", stroke: "#be123c" },
  SPC: { fill: "#a5f3fc", stroke: "#0891b2" },
  ATT: { fill: "#fed7aa", stroke: "#ea580c" },
  MAL: { fill: "#f5d0fe", stroke: "#c026d3" },
  PRM: { fill: "#fbcfe8", stroke: "#db2777" },
  SCL: { fill: "#fef08a", stroke: "#ca8a04" },
  DEF: { fill: "#ddd6fe", stroke: "#7c3aed" },
  BND: { fill: "#e2e8f0", stroke: "#64748b" },
  MIS: { fill: "none", stroke: "#94a3b8", dash: "3 3" }
};

const SIZE = {
  molar: { w: 38, h: 34 },
  premolar: { w: 30, h: 28 },
  canine: { w: 27, h: 32 },
  incisor: { w: 24, h: 28 }
};

/**
 * Lay teeth out along an ellipse arc. `numbers` runs left to right on screen.
 * `upper` arches bulge upward, lower arches bulge downward.
 */
export const archLayout = (numbers, { upper, cx = 300, cy, rx = 250, ry = 112 }) => {
  const pts = [];
  let acc = 0;
  const steps = 600;
  for (let i = 0; i <= steps; i++) {
    const phi = Math.PI - (i / steps) * Math.PI;
    const x = cx + rx * Math.cos(phi);
    const y = upper ? cy - ry * Math.sin(phi) : cy + ry * Math.sin(phi);
    if (i > 0) acc += Math.hypot(x - pts[i - 1].x, y - pts[i - 1].y);
    pts.push({ x, y, phi, acc });
  }
  const sizes = numbers.map((n) => SIZE[toothInfo(n).type]);
  const gap = 3;
  const total = sizes.reduce((a, s) => a + s.w + gap, 0) - gap;
  let run = (acc - total) / 2;
  return numbers.map((num, i) => {
    const { w, h } = sizes[i];
    const target = run + w / 2;
    run += w + gap;
    const pt = pts.find((q) => q.acc >= target) || pts[pts.length - 1];
    // Tangent of travel (left to right = phi decreasing).
    const dpx = rx * Math.sin(pt.phi);
    const dpy = (upper ? ry : -ry) * Math.cos(pt.phi);
    const rot = (Math.atan2(dpy, dpx) * 180) / Math.PI;
    const nx = Math.cos(pt.phi) / rx;
    const ny = (upper ? -1 : 1) * Math.sin(pt.phi) / ry;
    const nl = Math.hypot(nx, ny);
    return {
      num,
      w,
      h,
      x: pt.x,
      y: pt.y,
      rot,
      lx: pt.x + (nx / nl) * (h / 2 + 13),
      ly: pt.y + (ny / nl) * (h / 2 + 13)
    };
  });
};
