import { doc, getDoc } from "firebase/firestore";

export const normalizeEmail = (e) => String(e || "").trim().toLowerCase();

/**
 * Closed-access mode. When the MeriDent owner sets config/access { restrict: true }, only email addresses that have a
 * document in allowedEmails can use the app. Returns "ok" or "blocked". Any trouble reading it counts as "ok":
 * the database rules enforce the real lock, this check only lets the app show a clear message.
 */
export const checkAccess = async (db, email) => {
  try {
    const cfg = await getDoc(doc(db, "config", "access"));
    if (!cfg?.exists?.() || cfg.data()?.restrict !== true) return "ok";
    const mine = await getDoc(doc(db, "allowedEmails", normalizeEmail(email)));
    return mine?.exists?.() ? "ok" : "blocked";
  } catch {
    return "ok";
  }
};
