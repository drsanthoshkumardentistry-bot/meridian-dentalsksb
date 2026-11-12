// Shrinks a photo in the browser to a small JPEG text string (data URL) that fits in a clinic record.
import { MAX_DATA_CHARS } from "./gallery.js";

const load = (file) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read that image")); };
  img.src = url;
});

/** Returns a JPEG data URL no larger than MAX_DATA_CHARS, trying smaller sizes and lower quality as needed. */
export const compressImage = async (file) => {
  if (!file || !/^image\//.test(file.type)) throw new Error("Choose an image file");
  const img = await load(file);
  for (const maxDim of [1400, 1100, 900, 700]) {
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.82, 0.7, 0.58, 0.46]) {
      const data = canvas.toDataURL("image/jpeg", quality);
      if (data.length <= MAX_DATA_CHARS) return data;
    }
  }
  throw new Error("That picture is too large even after shrinking");
};
