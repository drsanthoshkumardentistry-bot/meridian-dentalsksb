// The visitor's address for rate limits. Behind Cloudflare the trusted value is cf-connecting-ip; the first entry of
// x-forwarded-for is whatever the visitor typed, so it must not be used (a caller could change it on every request
// to dodge the limit). Without those headers, the LAST x-forwarded-for entry is the one added by our own proxy.
export const visitorIp = (headers = {}) => {
  const get = (k) => String(headers[k] || "").trim();
  const trusted = get("cf-connecting-ip") || get("x-real-ip") || get("x-vercel-forwarded-for");
  if (trusted) return trusted.split(",")[0].trim().slice(0, 64);
  const parts = get("x-forwarded-for").split(",").map((x) => x.trim()).filter(Boolean);
  return (parts[parts.length - 1] || "unknown").slice(0, 64);
};
