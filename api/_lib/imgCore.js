// Private picture storage on Cloudflare R2. A clinic can only reach its own pictures: the key always starts with the
// signed-in clinic's uid, and the id in the URL can never contain a slash, so nobody can step into another clinic's folder.
// Pure logic with the bucket and the sign-in check passed in, so tests need no network.

export const MAX_BYTES = 2 * 1024 * 1024; // one picture. Pictures are shrunk before upload, so this is generous.
export const DEFAULT_CLINIC_CAP = 5 * 1024 * 1024 * 1024; // 5 GB until the plan limits are switched on
const TYPES = ["image/jpeg", "image/png", "image/webp"];
const ID = /^[A-Za-z0-9_-]{6,64}$/;

export const goodId = (id) => typeof id === "string" && ID.test(id);
export const keyFor = (uid, id) => `clinics/${uid}/${id}`;

const json = (status, obj) => ({ status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(obj) });

/** Total bytes and count of one clinic's pictures. */
export const usageOf = async (bucket, uid) => {
  let bytes = 0, count = 0, cursor;
  for (let i = 0; i < 50; i++) {
    const page = await bucket.list({ prefix: `clinics/${uid}/`, cursor, limit: 1000 });
    for (const o of page.objects) { bytes += o.size; count += 1; }
    if (!page.truncated) break;
    cursor = page.cursor;
  }
  return { bytes, count };
};

/**
 * method: GET | PUT | DELETE | HEAD. id: picture id or "" (GET with "" returns usage).
 * lookup(token) returns { uid } or null. body is an ArrayBuffer for PUT.
 */
export const handleImg = async ({ method, id = "", token = "", contentType = "", body = null, bucket, lookup, cap = DEFAULT_CLINIC_CAP }) => {
  if (!bucket) return json(503, { error: "Picture storage is not switched on yet." });
  const user = token ? await lookup(token).catch(() => null) : null;
  if (!user || !user.uid) return json(401, { error: "Sign in again." });
  if (method === "GET" && id === "") return json(200, await usageOf(bucket, user.uid));
  if (!goodId(id)) return json(400, { error: "Bad picture id." });
  const key = keyFor(user.uid, id);
  if (method === "PUT") {
    const type = String(contentType).split(";")[0].trim().toLowerCase();
    if (!TYPES.includes(type)) return json(415, { error: "Only JPEG, PNG or WebP pictures." });
    const size = body ? body.byteLength : 0;
    if (!size) return json(400, { error: "Empty picture." });
    if (size > MAX_BYTES) return json(413, { error: "Picture is too large." });
    const existing = await bucket.head(key);
    const used = (await usageOf(bucket, user.uid)).bytes - (existing ? existing.size : 0);
    if (used + size > cap) return json(402, { error: "Your picture storage is full." });
    await bucket.put(key, body, { httpMetadata: { contentType: type } });
    return json(200, { id, bytes: size });
  }
  if (method === "GET" || method === "HEAD") {
    const obj = await bucket.get(key);
    if (!obj) return json(404, { error: "Not found." });
    return { status: 200, headers: { "Content-Type": (obj.httpMetadata && obj.httpMetadata.contentType) || "image/jpeg", "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff", "Content-Length": String(obj.size) }, body: method === "HEAD" ? null : obj.body };
  }
  if (method === "DELETE") { await bucket.delete(key); return json(200, { id, deleted: true }); }
  return json(405, { error: "Use GET, PUT or DELETE." });
};
