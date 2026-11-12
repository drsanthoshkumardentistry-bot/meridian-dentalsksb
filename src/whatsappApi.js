import { auth } from "./firebase.js";

const call = async (payload) => {
  const user = auth && auth.currentUser;
  if (!user) throw new Error("Sign in again.");
  const res = await fetch("/api/whatsapp", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` },
    body: JSON.stringify(payload),
  });
  if (res.status === 204) return null; // not switched on
  let data = {};
  try { data = await res.json(); } catch (e) { /* keep empty */ }
  if (!res.ok) throw new Error(data.error || "WhatsApp could not send.");
  return data;
};

/** true only when the server has WhatsApp Business set up. */
export const whatsappAutoEnabled = async () => {
  try { const d = await call({ check: true }); return Boolean(d && d.enabled); } catch (e) { return false; }
};
export const sendWhatsAppTemplate = (kind, to, params) => call({ kind, to, params });
