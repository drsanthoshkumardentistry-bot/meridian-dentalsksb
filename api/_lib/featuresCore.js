// Founder switches for whole features, stored in config/features (server-only collection). A missing document, a missing
// service account or any read error means every feature stays ON, so a hiccup can never switch a clinic's tools off.
import { getDoc, putDoc } from "./fsLite.js";

export const FEATURE_KEYS = ["ai", "whatsapp"];
const PATH = "config/features";
const TTL = 20 * 1000;
let cache = { at: 0, value: null };

export const allOn = () => ({ ai: true, whatsapp: true });

export const getFeatures = async ({ sa, fetchFn = fetch, now = Date.now(), fresh = false } = {}) => {
  if (!sa) return allOn();
  if (!fresh && cache.value && now - cache.at < TTL) return cache.value;
  try {
    const d = await getDoc({ sa, path: PATH, fetchFn, now });
    const value = allOn();
    if (d) for (const k of FEATURE_KEYS) if (d[k] === false) value[k] = false;
    cache = { at: now, value };
    return value;
  } catch { return cache.value || allOn(); }
};

export const featureOn = async (args, key) => (await getFeatures(args))[key] !== false;

export const setFeature = async ({ sa, key, on, fetchFn = fetch, now = Date.now() }) => {
  if (!FEATURE_KEYS.includes(key)) throw new Error("key");
  const current = await getFeatures({ sa, fetchFn, now, fresh: true });
  const next = { ...current, [key]: !!on };
  await putDoc({ sa, path: PATH, data: { ...next, updatedAt: now }, fetchFn, now });
  cache = { at: now, value: next };
  return next;
};

export const resetFeatureCache = () => { cache = { at: 0, value: null }; };
