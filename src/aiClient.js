import { auth } from "./firebase.js";

// Calls the site's own /api/ai function. The AI key never reaches the browser.
export const askAi = async (payload) => {
  const user = auth && auth.currentUser;
  if (!user) throw new Error("Sign in again to use MeriDent AI.");
  const token = await user.getIdToken();
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  let data = {};
  try { data = await res.json(); } catch (e) { /* keep empty */ }
  if (!res.ok) throw new Error(data.error || "MeriDent AI is not available right now.");
  return data;
};

export const LANGUAGE_WORD = { en: "English", ta: "Tamil", hi: "Hindi" };
