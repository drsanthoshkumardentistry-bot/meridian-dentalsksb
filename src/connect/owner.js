// The MeriDent owner is a Connect admin by sign-in address. Only a fingerprint is kept here; the rules hold the same
// one and make the real decision. This check only decides whether the admin tabs are shown.
export const OWNER_EMAIL_SHA256 = "616169891b6f7de5f84b6aec39d78fd58a9a6235c3e79ec60f984d53563f3c5f";

export const isOwnerEmail = async (email) => {
  try {
    const bytes = new TextEncoder().encode(String(email || "").trim().toLowerCase());
    const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("") === OWNER_EMAIL_SHA256;
  } catch {
    return false;
  }
};
