// When a patient chart is deleted, everything stored for that patient outside the chart goes too: the OPG picture,
// the published patient-portal page and the gallery photos. Each step is best effort, so one failure never blocks the others.
import { deleteOpg } from "./opgStore.js";
import { deletePortal } from "./portalStore.js";
import { listImages, removeImage } from "./galleryStore.js";

export const cleanupPatientRemote = async (db, clinicId, patient, deps = {}) => {
  if (!db || !clinicId || !patient || !patient.id) return { opg: false, portal: false, images: 0 };
  const { delOpg = deleteOpg, delPortal = deletePortal, list = listImages, removeImg = removeImage } = deps;
  const done = { opg: false, portal: false, images: 0 };
  if (patient.hasOpg) { try { await delOpg(db, clinicId, patient.id); done.opg = true; } catch (e) { /* keep going */ } }
  if (patient.portalToken) { try { await delPortal(db, patient.portalToken); done.portal = true; } catch (e) { /* keep going */ } }
  try {
    const images = await list(db, clinicId, patient.id);
    for (const img of images || []) { try { await removeImg(db, clinicId, img.id); done.images += 1; } catch (e) { /* keep going */ } }
  } catch (e) { /* keep going */ }
  return done;
};
