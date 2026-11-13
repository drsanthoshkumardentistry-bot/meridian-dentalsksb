import { auth } from "./firebase.js";

// Calls the site's own /api/ai function. The AI key never reaches the browser.
export const askAi = async (payload) => {
  const user = auth && auth.currentUser;
  if (!user) throw new Error("Sign in again to use Meridee.");
  const token = await user.getIdToken();
  const send = () => fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  let res = await send();
  // A slow or briefly unavailable AI service often works on the second try.
  if (res.status === 504 || res.status === 502) res = await send();
  let data = {};
  try { data = await res.json(); } catch (e) { /* keep empty */ }
  if (!res.ok) throw new Error(data.error || "Meridee is not available right now.");
  return data;
};

export const LANGUAGE_WORD = { en: "English", ta: "Tamil", hi: "Hindi" };
