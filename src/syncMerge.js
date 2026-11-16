// Three-way merge for a record that two devices may have edited. base = what this device last saw in the cloud
// (or undefined when unknown), local = what this device wants to save, remote = what the cloud holds now.
// Edits to different fields (for example different teeth on the chart) are all kept. A true conflict on one
// field keeps this device's value, because that is the edit the person just made.

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isIdList = (v) => Array.isArray(v) && v.length > 0 && v.every((x) => isObj(x) && x.id !== undefined && x.id !== null);

const sortedJson = (v) =>
  JSON.stringify(v, (k, val) => (isObj(val) ? Object.keys(val).sort().reduce((a, key) => { a[key] = val[key]; return a; }, {}) : val));
export const sameJson = (a, b) => (a === undefined || b === undefined ? a === b : sortedJson(a) === sortedJson(b));

const mergeIdLists = (b, l, r) => {
  const byId = (list) => new Map((list || []).map((x) => [String(x.id), x]));
  const B = byId(b); const L = byId(l); const R = byId(r);
  const out = [];
  const seen = new Set();
  const add = (id) => {
    if (seen.has(id)) return;
    seen.add(id);
    const inB = B.has(id); const inL = L.has(id); const inR = R.has(id);
    if (inL && inR) { out.push(mergeValue(B.get(id), L.get(id), R.get(id))); return; }
    if (inL) { // not in the cloud: new here, or deleted there
      if (!inB || !sameJson(L.get(id), B.get(id))) out.push(L.get(id)); // new here, or edited here after the delete: keep
      return;
    }
    if (inR) { // not here: new there, or deleted here
      if (!inB || !sameJson(R.get(id), B.get(id))) out.push(R.get(id)); // new there, or edited there after the delete: keep
    }
  };
  (r || []).forEach((x) => add(String(x.id)));
  (l || []).forEach((x) => add(String(x.id)));
  return out;
};

const GONE = Symbol("gone");

function mergeValue(b, l, r) {
  if (sameJson(l, r)) return l;
  if (b !== undefined) {
    if (sameJson(l, b)) return r; // only the cloud changed it
    if (sameJson(r, b)) return l; // only this device changed it
  } else {
    if (l === undefined) return r; // base unknown: never delete what the cloud has
    if (r === undefined) return l;
    if (Array.isArray(l) && l.length === 0 && Array.isArray(r) && r.length > 0) return r; // an empty list here must not wipe a list the cloud has
  }
  if (isObj(l) && isObj(r) && (b === undefined || isObj(b))) {
    const out = {};
    for (const k of new Set([...Object.keys(l), ...Object.keys(r)])) {
      const v = mergeValue(b === undefined ? undefined : b[k], l[k], r[k]);
      if (v !== undefined && v !== GONE) out[k] = v;
    }
    return out;
  }
  if (isIdList(l) && isIdList(r) && (b === undefined || isIdList(b) || (Array.isArray(b) && b.length === 0))) return mergeIdLists(b, l, r);
  return l === undefined ? r : l;
}

/** The record to save. Always an object that keeps this device's id. */
export function mergeDoc(base, local, remote) {
  if (!isObj(local)) return local;
  if (!isObj(remote)) return local;
  const merged = mergeValue(isObj(base) ? base : undefined, local, remote);
  return isObj(merged) ? { ...merged, ...(local.id !== undefined ? { id: local.id } : {}) } : local;
}
