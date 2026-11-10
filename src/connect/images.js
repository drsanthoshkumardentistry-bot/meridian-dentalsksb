/* Case images. Pictures are shrunk in the browser and stored inside Firestore (no Storage plan needed). */
export const MAX_IMAGES = 2;
export const MAX_IMAGE_CHARS = 200000; // about 150 KB of picture after base64
export const JPEG_PREFIX = "data:image/jpeg;base64,";

export const isImageData = (s) => typeof s === "string" && s.startsWith(JPEG_PREFIX) && s.length > JPEG_PREFIX.length && s.length <= MAX_IMAGE_CHARS;

export const validateImages = (list) => {
  const images = Array.isArray(list) ? list : [];
  if (images.length > MAX_IMAGES) return { ok: false, error: `Attach at most ${MAX_IMAGES} images` };
  if (!images.every(isImageData)) return { ok: false, error: "One of the images is too large or not a photo. Remove it and add it again" };
  return { ok: true, images };
};

/** Largest side after scaling, keeping the shape. */
export const scaleToFit = (w, h, maxEdge) => {
  const k = Math.min(1, maxEdge / Math.max(w, h));
  return [Math.max(1, Math.round(w * k)), Math.max(1, Math.round(h * k))];
};

/** Resize a picked photo to a small JPEG data URL. Metadata (location, camera) is dropped by the redraw. */
export const compressImage = async (file) => {
  if (!file || !/^image\//.test(file.type)) throw new Error("Choose a photo file");
  const bmp = await createImageBitmap(file);
  let edge = 1100;
  let quality = 0.78;
  for (let i = 0; i < 6; i++) {
    const [w, h] = scaleToFit(bmp.width, bmp.height, edge);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bmp, 0, 0, w, h);
    const url = canvas.toDataURL("image/jpeg", quality);
    if (isImageData(url)) return url;
    edge = Math.round(edge * 0.8);
    quality = Math.max(0.5, quality - 0.06);
  }
  throw new Error("That photo is too large to attach");
};
