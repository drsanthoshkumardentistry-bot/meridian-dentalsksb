/* App PIN lock: a second step on this device. After you sign in, MeriDent asks for a 4 to 6 digit PIN when it is
 * opened again, after a few idle minutes, or when you tap Lock now. The PIN is stored only as a salted hash on this
 * device. It protects an open screen; it is not a server-side second factor. */
const KEY = (uid) => `merident_lock_${uid}`;
export const MAX_TRIES = 5;
export const IDLE_CHOICES = [1, 5, 15];

export const validPin = (pin) => /^\d{4,6}$/.test(String(pin || ""));

const hex = (buf) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");

export async function hashPin(pin, salt) {
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey("raw", enc.encode(String(pin)), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: enc.encode(salt), iterations: 100000, hash: "SHA-256" }, base, 256);
  return hex(bits);
}

export function readLock(uid) {
  try {
    const v = JSON.parse(window.localStorage.getItem(KEY(uid)) || "null");
    return v && v.hash && v.salt ? v : null;
  } catch (e) { return null; }
}
export const hasLock = (uid) => Boolean(uid && readLock(uid));

export async function setLock(uid, pin, idleMinutes = 5) {
  if (!validPin(pin)) throw new Error("PIN must be 4 to 6 digits.");
  const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
  const hash = await hashPin(pin, salt);
  window.localStorage.setItem(KEY(uid), JSON.stringify({ salt, hash, idleMinutes }));
}
export function setIdleMinutes(uid, idleMinutes) {
  const v = readLock(uid);
  if (v) window.localStorage.setItem(KEY(uid), JSON.stringify({ ...v, idleMinutes }));
}
export const clearLock = (uid) => { try { window.localStorage.removeItem(KEY(uid)); } catch (e) { /* ignore */ } };

export async function checkPin(uid, pin) {
  const v = readLock(uid);
  if (!v) return true;
  return (await hashPin(pin, v.salt)) === v.hash;
}
