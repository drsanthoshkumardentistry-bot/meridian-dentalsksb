import { CONTACT } from "./legal.js";

export const TOPICS = [
  { id: "problem", label: "Something is not working" },
  { id: "question", label: "I have a question" },
  { id: "idea", label: "I need a feature" },
];

/** Short description of the phone and browser, no personal data. */
export const deviceInfo = (nav = globalThis.navigator, scr = globalThis.screen) => {
  try {
    const ua = String((nav && nav.userAgent) || "");
    const os = /Android/i.test(ua) ? "Android" : /iPhone|iPad|iOS/i.test(ua) ? "iOS" : /Windows/i.test(ua) ? "Windows" : /Mac/i.test(ua) ? "Mac" : /Linux/i.test(ua) ? "Linux" : "Unknown";
    const br = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Unknown";
    const size = scr && scr.width ? `${scr.width}x${scr.height}` : "";
    return [os, br, size].filter(Boolean).join(", ");
  } catch (e) { return "Unknown"; }
};

/** The text sent to the founder. Never includes patient details; the person writes only what they choose to. */
export const supportText = ({ topic = "problem", text = "", clinic = "", screen = "", device = deviceInfo() } = {}) => {
  const t = TOPICS.find((x) => x.id === topic) || TOPICS[0];
  const body = String(text || "").trim().slice(0, 800);
  return [
    `MeriDent: ${t.label}`,
    body || "(no details written)",
    "",
    `Clinic: ${String(clinic || "-").slice(0, 80)}`,
    screen ? `Screen: ${String(screen).slice(0, 40)}` : null,
    `Device: ${device}`,
    `Time: ${new Date().toLocaleString("en-IN")}`,
  ].filter((x) => x !== null).join("\n");
};

export const supportLinks = (message) => ({
  whatsapp: `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(message)}`,
  email: `mailto:${CONTACT.email}?subject=${encodeURIComponent("MeriDent support")}&body=${encodeURIComponent(message)}`,
});
