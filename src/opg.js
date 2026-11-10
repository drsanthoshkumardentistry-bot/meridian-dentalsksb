// Measurement maths for the OPG viewer. Points are fractions (0 to 1) of the image width and height,
// so a measurement does not depend on zoom or screen size.

export const pixelDistance = (a, b, natural) => {
  if (!a || !b || !natural || !(natural.w > 0) || !(natural.h > 0)) return 0;
  return Math.hypot((b.x - a.x) * natural.w, (b.y - a.y) * natural.h);
};

/** mm per image pixel from a length you know. Returns null for anything unusable. */
export const calibrationFactor = (pixels, knownMm) => {
  const mm = Number(knownMm);
  if (!(pixels > 0) || !(mm > 0) || !Number.isFinite(mm) || mm > 500) return null;
  return mm / pixels;
};

export const toMm = (pixels, mmPerPx) => (mmPerPx > 0 ? pixels * mmPerPx : null);

/** "12.4 mm" when calibrated; otherwise pixels only. Never invents a millimetre value. */
export const formatMeasurement = (pixels, mmPerPx) => {
  const mm = toMm(pixels, mmPerPx);
  return mm === null ? `${Math.round(pixels)} px (not calibrated)` : `${mm.toFixed(1)} mm`;
};

export const clampZoom = (z) => Math.min(4, Math.max(1, Math.round(z * 4) / 4));

/** Click position inside a rectangle as fractions, clamped to the image. */
export const pointFromClick = (clientX, clientY, rect) => {
  if (!rect || !(rect.width > 0) || !(rect.height > 0)) return null;
  const x = (clientX - rect.left) / rect.width;
  const y = (clientY - rect.top) / rect.height;
  return { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) };
};
