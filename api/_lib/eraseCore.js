// Deletes a whole clinic account: every document under clinics/{uid}, the public pages and requests that belong to it,
// its team invitations and Connect profile, and finally the sign-in account itself. Runs with the Firebase service
// account (the activity log cannot be deleted from the browser by design, so this has to run on the server).
// It works in short rounds: if time runs out it answers { done: false } and the app simply asks again.
import { getAccessToken } from "./blockCore.js";

const SCOPE = "https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/identitytoolkit";
const BY_CLINIC_ID = ["planShares", "portalPages", "bookingRequests", "clinicStaff"]; // top-level collections with a clinicId field
const SINGLE_DOCS = (uid) => [`bookingPages/${uid}`, `connectDirectory/${uid}`, `connectDentists/${uid}`];

export const eraseClinic = async ({ sa, uid, fetchFn = fetch, now = Date.now(), budgetMs = 7000 }) => {
  if (!sa || !uid || typeof uid !== "string" || uid.includes("/")) throw new Error("bad input");
  const t0 = Date.now();
  const timeUp = () => Date.now() - t0 > budgetMs;
  const token = await getAccessToken(sa, fetchFn, now, SCOPE);
  const root = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(sa.project_id)}/databases/(default)/documents`;
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const call = async (url, init) => {
    const r = await fetchFn(url, { headers, ...init });
    if (!r.ok) throw new Error("firestore " + r.status);
    return r.json();
  };
  let deleted = 0;
  const removeNames = async (names) => {
    for (let i = 0; i < names.length; i += 300) {
      const chunk = names.slice(i, i + 300);
      await call(`${root}:batchWrite`, { method: "POST", body: JSON.stringify({ writes: chunk.map((name) => ({ delete: name })) }) });
      deleted += chunk.length;
    }
  };
  const collectionIds = async (parent) => {
    const d = await call(`${root}/${parent}:listCollectionIds`, { method: "POST", body: JSON.stringify({ pageSize: 100 }) });
    return Array.isArray(d.collectionIds) ? d.collectionIds : [];
  };

  // 1. everything under clinics/{uid}/..., and the Connect log kept under connectDocLog/{uid}/...
  for (const parent of [`clinics/${uid}`, `connectDocLog/${uid}`]) {
    for (const id of await collectionIds(parent)) {
      for (;;) {
        if (timeUp()) return { done: false, deleted };
        const d = await call(`${root}/${parent}/${encodeURIComponent(id)}?pageSize=300&mask.fieldPaths=_`);
        const names = (d.documents || []).map((x) => x.name);
        if (!names.length) break;
        await removeNames(names);
      }
    }
  }
  // 2. pages, requests and invitations that point at this clinic
  for (const coll of BY_CLINIC_ID) {
    for (;;) {
      if (timeUp()) return { done: false, deleted };
      const rows = await call(`${root}:runQuery`, { method: "POST", body: JSON.stringify({ structuredQuery: {
        from: [{ collectionId: coll }],
        where: { fieldFilter: { field: { fieldPath: "clinicId" }, op: "EQUAL", value: { stringValue: uid } } },
        select: { fields: [{ fieldPath: "__name__" }] }, limit: 300,
      } }) });
      const names = (Array.isArray(rows) ? rows : []).map((r) => r.document && r.document.name).filter(Boolean);
      if (!names.length) break;
      await removeNames(names);
    }
  }
  // 3. single documents
  await removeNames(SINGLE_DOCS(uid).map((p) => `projects/${sa.project_id}/databases/(default)/documents/${p}`));
  if (timeUp()) return { done: false, deleted };
  // 4. last: the sign-in account itself (so a retry above still has a valid account to authorise it)
  await call(`https://identitytoolkit.googleapis.com/v1/projects/${encodeURIComponent(sa.project_id)}/accounts:delete`, { method: "POST", body: JSON.stringify({ localId: uid }) });
  return { done: true, deleted };
};
