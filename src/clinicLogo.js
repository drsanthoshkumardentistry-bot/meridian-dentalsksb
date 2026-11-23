// The clinic's logo for the Practice Profile and the prescription header.
// Kept small (a data URL inside the profile) so it saves and syncs like any other profile field.
// Only PNG and JPEG are accepted. SVG is refused on purpose: it can carry scripts.

export const MAX_LOGO_SIDE = 320;       // pixels, longest side after shrinking
export const MAX_LOGO_CHARS = 180000;   // about 130 KB of image inside the profile

const DATA_URL = /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/;

/** True only for a small PNG/JPEG data URL; anything else is ignored everywhere. */
export const isLogoDataUrl = (v) => typeof v === "string" && v.length <= MAX_LOGO_CHARS && DATA_URL.test(v);

/** "PNG" or "JPEG" for jsPDF, or "" when the value is not a valid logo. */
export const logoFormat = (v) => (isLogoDataUrl(v) ? (v.startsWith("data:image/png") ? "PNG" : "JPEG") : "");

export const LOGO_TYPES = ["image/png", "image/jpeg"];

/** Size to draw a logo at inside a box, keeping its shape. */
export const fitInside = (w, h, boxW, boxH) => {
  if (!(w > 0) || !(h > 0)) return { w: 0, h: 0 };
  const k = Math.min(boxW / w, boxH / h);
  return { w: w * k, h: h * k };
};

/**
 * Reads a chosen file and returns a shrunken data URL, or { error }.
 * PNG stays PNG (so a transparent background stays transparent); a photo-like JPEG stays JPEG.
 */
export const logoFromFile = async (file, { doc = globalThis.document, makeBitmap = globalThis.createImageBitmap } = {}) => {
  if (!file || !LOGO_TYPES.includes(file.type)) return { error: "Choose a PNG or JPEG picture." };
  if (file.size > 8 * 1024 * 1024) return { error: "That picture is too big. Choose one under 8 MB." };
  if (!doc || typeof makeBitmap !== "function") return { error: "This browser cannot prepare the logo." };
  try {
    const bmp = await makeBitmap(file);
    const k = Math.min(1, MAX_LOGO_SIDE / Math.max(bmp.width, bmp.height));
    const canvas = doc.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bmp.width * k));
    canvas.height = Math.max(1, Math.round(bmp.height * k));
    const ctx = canvas.getContext("2d");
    if (!ctx) return { error: "This browser cannot prepare the logo." };
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    if (bmp.close) bmp.close();
    let url = file.type === "image/png" ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.85);
    if (url.length > MAX_LOGO_CHARS) url = canvas.toDataURL("image/jpeg", 0.7); // a big PNG: fall back to JPEG
    return isLogoDataUrl(url) ? { dataUrl: url } : { error: "That picture is still too big. Try a simpler logo." };
  } catch {
    return { error: "Could not read that picture. Try another file." };
  }
};
